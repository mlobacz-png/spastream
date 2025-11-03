import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PricingRequest {
  treatmentType: string;
  basePrice: number;
  date?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { treatmentType, basePrice, date }: PricingRequest = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get appointments for the target date
    const { data: appointments } = await supabase
      .from("appointments")
      .select("*")
      .gte("start_time", startOfDay.toISOString())
      .lte("start_time", endOfDay.toISOString());

    // Get recent booking trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: recentAppointments } = await supabase
      .from("appointments")
      .select("*")
      .gte("start_time", thirtyDaysAgo.toISOString());

    // Get inventory levels if treatment uses products
    const { data: inventory } = await supabase
      .from("inventory")
      .select("*")
      .lt("current_stock", 20); // Low stock items

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
    const bookingsToday = appointments?.length || 0;
    const avgBookingsPerDay = Math.round((recentAppointments?.length || 0) / 30);
    const lowStockItems = inventory?.length || 0;
    const isWeekend = targetDate.getDay() === 0 || targetDate.getDay() === 6;
    const monthName = targetDate.toLocaleDateString('en-US', { month: 'long' });

    const prompt = `You are a dynamic pricing optimizer for a medical spa. Analyze market conditions and recommend optimal pricing.

Treatment Information:
- Treatment Type: ${treatmentType}
- Base Price: $${basePrice}

Market Conditions:
- Target Date: ${dayOfWeek}, ${monthName}
- Is Weekend: ${isWeekend}
- Bookings Today: ${bookingsToday}
- Average Daily Bookings: ${avgBookingsPerDay}
- Low Stock Items: ${lowStockItems}

Provide pricing recommendation in JSON format:
{
  "recommendedPrice": number,
  "discountPercentage": number,
  "reasoning": "Brief explanation",
  "demandLevel": "low" | "medium" | "high",
  "confidence": 0-100,
  "validUntil": "ISO date string",
  "strategies": ["list of pricing strategies being applied"]
}

Consider:
- Demand patterns (day of week, time of day, season)
- Current booking volume vs. average
- Inventory constraints
- Maximizing revenue vs. maximizing bookings
- Competitive positioning

Price should be within -30% to +20% of base price.`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert in dynamic pricing optimization for service businesses. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.6,
        response_format: { type: "json_object" }
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const openaiData = await openaiResponse.json();
    const pricingRecommendation = JSON.parse(openaiData.choices[0].message.content);

    return new Response(
      JSON.stringify(pricingRecommendation),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Error in dynamic-pricing:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});