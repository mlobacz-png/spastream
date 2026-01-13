import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PaymentLinkRequest {
  invoiceId: string;
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

    const { invoiceId }: PaymentLinkRequest = await req.json();

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*, clients(id, name, email)")
      .eq("id", invoiceId)
      .eq("user_id", user.id)
      .single();

    if (invoiceError || !invoice) {
      console.error("Invoice error:", invoiceError);
      return new Response(
        JSON.stringify({ error: "Invoice not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (invoice.status === "paid") {
      return new Response(
        JSON.stringify({ error: "Invoice is already paid" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if payment link already exists for this invoice
    const { data: existingLink } = await supabase
      .from("payment_links")
      .select("*")
      .eq("invoice_id", invoiceId)
      .eq("status", "pending")
      .maybeSingle();

    let paymentLink;

    if (existingLink) {
      paymentLink = existingLink;
    } else {
      // Create new payment link using service role
      const { data: newLink, error: linkError } = await supabase
        .from("payment_links")
        .insert({
          user_id: user.id,
          invoice_id: invoiceId,
          client_id: invoice.clients.id,
          amount: invoice.balance_due || invoice.total_amount,
        })
        .select()
        .single();

      if (linkError) {
        console.error("Payment link creation error:", linkError);
        return new Response(
          JSON.stringify({ error: `Failed to create payment link: ${linkError.message}` }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (!newLink) {
        return new Response(
          JSON.stringify({ error: "Failed to create payment link - no data returned" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      paymentLink = newLink;
    }

    // Get business information for email
    const { data: businessInfo } = await supabase
      .from("business_information")
      .select("business_name")
      .eq("user_id", user.id)
      .maybeSingle();

    const businessName = businessInfo?.business_name || "Your Med Spa";

    // Get the app URL from environment or construct from request origin
    const appUrl = Deno.env.get("APP_URL") || req.headers.get("origin") || "http://localhost:3000";
    const paymentUrl = `${appUrl}/pay/${paymentLink.unique_token}`;

    // Send email to client
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .invoice-details { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #2563eb; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${businessName}</h1>
            </div>
            <div class="content">
              <h2>Payment Request</h2>
              <p>Hello ${invoice.clients.name},</p>
              <p>You have an invoice ready for payment.</p>
              
              <div class="invoice-details">
                <strong>Invoice #${invoice.invoice_number}</strong><br>
                <strong>Amount Due:</strong> $${(invoice.balance_due || invoice.total_amount).toFixed(2)}<br>
                <strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}
              </div>

              <p>Click the button below to securely pay your invoice online:</p>
              
              <a href="${paymentUrl}" class="button">Pay Invoice</a>
              
              <p style="color: #666; font-size: 14px;">Or copy this link: ${paymentUrl}</p>
              <p style="color: #666; font-size: 12px;">This payment link will expire in 7 days.</p>
            </div>
            <div class="footer">
              <p>This is an automated message from ${businessName}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email using Supabase edge function or external service
    try {
      await fetch(`${supabaseUrl}/functions/v1/send-welcome-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          to: invoice.clients.email,
          subject: `Invoice #${invoice.invoice_number} - Payment Request`,
          html: emailHtml,
        }),
      });
    } catch (emailError) {
      console.error("Email send error (non-blocking):", emailError);
      // Don't fail the whole request if email fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentUrl,
        paymentLinkId: paymentLink.id,
        expiresAt: paymentLink.expires_at,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});