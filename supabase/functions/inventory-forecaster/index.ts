import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface InventoryProduct {
  id: string;
  name: string;
  current_quantity: number;
  min_quantity: number;
  reorder_quantity: number;
  category: string;
}

interface InventoryTransaction {
  quantity: number;
  transaction_date: string;
  transaction_type: string;
}

interface InventoryForecast {
  product_id: string;
  current_quantity: number;
  daily_usage_rate: number;
  predicted_stockout_date: string | null;
  days_until_stockout: number | null;
  recommended_order_quantity: number;
  confidence_score: number;
  upcoming_appointments_count: number;
  historical_usage_trend: 'increasing' | 'stable' | 'decreasing';
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const userId = user.id;
    const now = new Date();

    // Fetch all active inventory products
    const { data: products, error: productsError } = await supabase
      .from("inventory_products")
      .select("id, name, current_quantity, min_quantity, reorder_quantity, category")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (productsError) throw productsError;

    // Get upcoming appointments count (next 30 days)
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const { data: upcomingAppointments, error: apptError } = await supabase
      .from("appointments")
      .select("id")
      .eq("user_id", userId)
      .gte("scheduled_at", now.toISOString())
      .lte("scheduled_at", thirtyDaysFromNow.toISOString())
      .in("status", ["scheduled", "confirmed"]);

    if (apptError) throw apptError;

    const upcomingAppointmentsCount = upcomingAppointments?.length || 0;

    const forecasts: InventoryForecast[] = [];

    for (const product of products as InventoryProduct[]) {
      // Get last 90 days of usage transactions
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      const { data: transactions, error: txError } = await supabase
        .from("inventory_transactions")
        .select("quantity, transaction_date, transaction_type")
        .eq("user_id", userId)
        .eq("product_id", product.id)
        .eq("transaction_type", "usage")
        .gte("transaction_date", ninetyDaysAgo.toISOString())
        .order("transaction_date", { ascending: true });

      if (txError) continue;

      const txs = transactions as InventoryTransaction[];

      // Calculate daily usage rate
      let dailyUsageRate = 0;
      let confidenceScore = 50;
      let historicalTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';

      if (txs.length === 0) {
        // No usage history - use conservative estimate
        dailyUsageRate = 0.1;
        confidenceScore = 20;
      } else {
        // Calculate total usage
        const totalUsage = txs.reduce((sum, tx) => sum + Math.abs(tx.quantity), 0);
        const daysWithData = Math.floor((now.getTime() - new Date(txs[0].transaction_date).getTime()) / (1000 * 60 * 60 * 24));
        dailyUsageRate = daysWithData > 0 ? totalUsage / daysWithData : 0;

        // Confidence increases with more data points
        if (txs.length >= 30) {
          confidenceScore = 95;
        } else if (txs.length >= 15) {
          confidenceScore = 80;
        } else if (txs.length >= 5) {
          confidenceScore = 65;
        } else {
          confidenceScore = 40;
        }

        // Analyze trend (compare first half vs second half)
        if (txs.length >= 10) {
          const midpoint = Math.floor(txs.length / 2);
          const firstHalf = txs.slice(0, midpoint);
          const secondHalf = txs.slice(midpoint);

          const firstHalfAvg = firstHalf.reduce((sum, tx) => sum + Math.abs(tx.quantity), 0) / firstHalf.length;
          const secondHalfAvg = secondHalf.reduce((sum, tx) => sum + Math.abs(tx.quantity), 0) / secondHalf.length;

          if (secondHalfAvg > firstHalfAvg * 1.2) {
            historicalTrend = 'increasing';
            dailyUsageRate *= 1.15; // Adjust for increasing trend
          } else if (secondHalfAvg < firstHalfAvg * 0.8) {
            historicalTrend = 'decreasing';
            dailyUsageRate *= 0.85; // Adjust for decreasing trend
          }
        }
      }

      // Adjust for upcoming appointments
      if (upcomingAppointmentsCount > 0) {
        const appointmentFactor = Math.min(upcomingAppointmentsCount / 30, 2); // Cap at 2x
        dailyUsageRate *= (1 + appointmentFactor * 0.2); // Increase by up to 40% based on appointments
      }

      // Calculate days until stockout
      let daysUntilStockout: number | null = null;
      let predictedStockoutDate: string | null = null;

      if (dailyUsageRate > 0) {
        daysUntilStockout = Math.floor(product.current_quantity / dailyUsageRate);
        const stockoutDate = new Date(now.getTime() + daysUntilStockout * 24 * 60 * 60 * 1000);
        predictedStockoutDate = stockoutDate.toISOString();
      }

      // Calculate recommended order quantity
      let recommendedOrderQuantity = product.reorder_quantity;

      if (dailyUsageRate > 0) {
        // Order enough for 60 days, but at least the reorder quantity
        const sixtyDaysSupply = Math.ceil(dailyUsageRate * 60);
        recommendedOrderQuantity = Math.max(sixtyDaysSupply, product.reorder_quantity);
      }

      forecasts.push({
        product_id: product.id,
        current_quantity: product.current_quantity,
        daily_usage_rate: parseFloat(dailyUsageRate.toFixed(2)),
        predicted_stockout_date: predictedStockoutDate,
        days_until_stockout: daysUntilStockout,
        recommended_order_quantity: recommendedOrderQuantity,
        confidence_score: confidenceScore,
        upcoming_appointments_count: upcomingAppointmentsCount,
        historical_usage_trend: historicalTrend,
      });
    }

    // Save forecasts to database
    for (const forecast of forecasts) {
      await supabase
        .from("inventory_forecasts")
        .upsert({
          user_id: userId,
          product_id: forecast.product_id,
          current_quantity: forecast.current_quantity,
          daily_usage_rate: forecast.daily_usage_rate,
          predicted_stockout_date: forecast.predicted_stockout_date,
          days_until_stockout: forecast.days_until_stockout,
          recommended_order_quantity: forecast.recommended_order_quantity,
          confidence_score: forecast.confidence_score,
          upcoming_appointments_count: forecast.upcoming_appointments_count,
          historical_usage_trend: forecast.historical_usage_trend,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,product_id'
        });
    }

    // Get critical stock items (will run out in next 14 days)
    const criticalItems = forecasts.filter(f =>
      f.days_until_stockout !== null && f.days_until_stockout <= 14
    ).length;

    const warningItems = forecasts.filter(f =>
      f.days_until_stockout !== null && f.days_until_stockout > 14 && f.days_until_stockout <= 30
    ).length;

    return new Response(
      JSON.stringify({
        success: true,
        analyzed: forecasts.length,
        summary: {
          critical_items: criticalItems,
          warning_items: warningItems,
          upcoming_appointments: upcomingAppointmentsCount,
        },
        forecasts: forecasts.slice(0, 10), // Return top 10 for preview
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error("Error in inventory-forecaster:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
