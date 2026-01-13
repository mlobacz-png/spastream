import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  billingMonth?: string; // YYYY-MM format
  userId?: string; // Optional: generate for specific user only
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

    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if user is admin
    const isAdmin = user.app_metadata?.is_admin === true;
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const requestBody: RequestBody = await req.json();
    
    // Default to previous month if not specified
    let billingMonth: string;
    if (requestBody.billingMonth) {
      billingMonth = requestBody.billingMonth;
    } else {
      const now = new Date();
      now.setMonth(now.getMonth() - 1);
      billingMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    
    const billingMonthDate = `${billingMonth}-01`;

    // Get all monthly revenue records for the billing month that have fees and aren't already invoiced
    let query = supabase
      .from("platform_monthly_revenue")
      .select("*")
      .eq("month", billingMonthDate)
      .gt("platform_fee_amount", 0)
      .eq("platform_fee_paid", false)
      .is("platform_invoice_id", null);

    if (requestBody.userId) {
      query = query.eq("user_id", requestBody.userId);
    }

    const { data: revenueRecords, error: revenueError } = await query;

    if (revenueError) {
      throw new Error(`Failed to fetch revenue records: ${revenueError.message}`);
    }

    if (!revenueRecords || revenueRecords.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: "No invoices to generate",
          billingMonth: billingMonthDate,
          recordsFound: 0
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const generatedInvoices = [];

    // Generate invoice for each revenue record
    for (const record of revenueRecords) {
      // Generate invoice number
      const { data: invoiceNumber } = await supabase
        .rpc("generate_platform_fee_invoice_number", {
          p_billing_month: billingMonthDate
        });

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from("platform_fee_invoices")
        .insert({
          user_id: record.user_id,
          monthly_revenue_id: record.id,
          invoice_number: invoiceNumber,
          billing_month: billingMonthDate,
          total_revenue: record.total_revenue,
          billable_amount: record.revenue_over_threshold,
          fee_amount: record.platform_fee_amount,
          status: "pending",
          notes: `Platform fee for ${billingMonth}: 0.5% on revenue over $50,000`
        })
        .select()
        .single();

      if (invoiceError) {
        console.error(`Failed to create invoice for user ${record.user_id}:`, invoiceError);
        continue;
      }

      // Update monthly revenue record with invoice ID
      await supabase
        .from("platform_monthly_revenue")
        .update({ platform_invoice_id: invoice.id })
        .eq("id", record.id);

      generatedInvoices.push(invoice);
    }

    return new Response(
      JSON.stringify({
        success: true,
        billingMonth: billingMonthDate,
        invoicesGenerated: generatedInvoices.length,
        invoices: generatedInvoices
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error generating platform invoices:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
