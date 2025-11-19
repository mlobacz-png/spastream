import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PaymentRequest {
  amount: number;
  clientId: string;
  clientEmail: string;
  invoiceId?: string;
  description: string;
  paymentLinkId: string;
  cardDetails: {
    number: string;
    exp_month: string;
    exp_year: string;
    cvc: string;
    name: string;
  };
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

    const paymentData: PaymentRequest = await req.json();

    // Get payment link to verify and get user_id
    const { data: paymentLink, error: linkError } = await supabase
      .from("payment_links")
      .select("*, invoices(user_id)")
      .eq("id", paymentData.paymentLinkId)
      .eq("status", "pending")
      .single();

    if (linkError || !paymentLink) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired payment link" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userId = (paymentLink.invoices as any).user_id;

    // Get payment settings for the business owner
    const { data: settings } = await supabase
      .from("payment_settings")
      .select("stripe_secret_key, pass_processing_fees, processing_fee_percentage, processing_fee_fixed")
      .eq("user_id", userId)
      .single();

    if (!settings || !settings.stripe_secret_key) {
      return new Response(
        JSON.stringify({ error: "Payment processing not configured" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const STRIPE_SECRET_KEY = settings.stripe_secret_key;

    let finalAmount = paymentData.amount;
    let processingFee = 0;

    if (settings.pass_processing_fees) {
      const feePercentage = (settings.processing_fee_percentage || 2.9) / 100;
      const feeFixed = settings.processing_fee_fixed || 0.30;
      processingFee = (paymentData.amount * feePercentage) + feeFixed;
      finalAmount = paymentData.amount + processingFee;
    }

    // Create Stripe token from card details
    const stripeTokenResponse = await fetch(
      "https://api.stripe.com/v1/tokens",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          "card[number]": paymentData.cardDetails.number,
          "card[exp_month]": paymentData.cardDetails.exp_month,
          "card[exp_year]": `20${paymentData.cardDetails.exp_year}`,
          "card[cvc]": paymentData.cardDetails.cvc,
          "card[name]": paymentData.cardDetails.name,
        }),
      }
    );

    const stripeToken = await stripeTokenResponse.json();

    if (stripeToken.error) {
      return new Response(
        JSON.stringify({ error: stripeToken.error.message }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create payment intent with the token
    const stripePaymentIntent = await fetch(
      "https://api.stripe.com/v1/payment_intents",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          amount: Math.round(finalAmount * 100).toString(),
          currency: "usd",
          description: paymentData.description,
          "payment_method_data[type]": "card",
          "payment_method_data[card][token]": stripeToken.id,
          confirm: "true",
          "metadata[client_id]": paymentData.clientId,
          "metadata[user_id]": userId,
          "metadata[invoice_id]": paymentData.invoiceId || "",
          "metadata[payment_link_id]": paymentData.paymentLinkId,
        }),
      }
    );

    const paymentIntent = await stripePaymentIntent.json();

    if (paymentIntent.error) {
      return new Response(
        JSON.stringify({ error: paymentIntent.error.message }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Record transaction
    await supabase.from("transactions").insert({
      user_id: userId,
      client_id: paymentData.clientId,
      invoice_id: paymentData.invoiceId || null,
      transaction_type: "payment",
      payment_method: "stripe",
      amount: finalAmount,
      processing_fee_amount: processingFee,
      stripe_payment_intent_id: paymentIntent.id,
      status: paymentIntent.status === "succeeded" ? "completed" : "pending",
      notes: paymentData.description,
    });

    // Update payment link status
    await supabase
      .from("payment_links")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        stripe_payment_intent_id: paymentIntent.id,
      })
      .eq("id", paymentData.paymentLinkId);

    // Update invoice
    if (paymentData.invoiceId) {
      const { data: invoice } = await supabase
        .from("invoices")
        .select("amount_paid, total_amount")
        .eq("id", paymentData.invoiceId)
        .single();

      if (invoice) {
        const newAmountPaid = (invoice.amount_paid || 0) + paymentData.amount;
        const newBalanceDue = invoice.total_amount - newAmountPaid;

        await supabase
          .from("invoices")
          .update({
            amount_paid: newAmountPaid,
            balance_due: newBalanceDue,
            status: newBalanceDue <= 0 ? "paid" : "sent",
          })
          .eq("id", paymentData.invoiceId);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentIntentId: paymentIntent.id,
        amount: finalAmount,
        processingFee: processingFee,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Payment error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});