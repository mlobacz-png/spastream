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
  appointmentId?: string;
  packageId?: string;
  invoiceId?: string;
  description: string;
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

    const paymentData: PaymentRequest = await req.json();

    const { data: settings } = await supabase
      .from("payment_settings")
      .select("stripe_secret_key, pass_processing_fees, processing_fee_percentage, processing_fee_fixed")
      .eq("user_id", user.id)
      .single();

    if (!settings || !settings.stripe_secret_key) {
      return new Response(
        JSON.stringify({ error: "Stripe not configured. Please set up Stripe in Payment Settings." }),
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
          "metadata[client_id]": paymentData.clientId,
          "metadata[user_id]": user.id,
          ...(paymentData.appointmentId && {
            "metadata[appointment_id]": paymentData.appointmentId,
          }),
          ...(paymentData.packageId && {
            "metadata[package_id]": paymentData.packageId,
          }),
          ...(paymentData.invoiceId && {
            "metadata[invoice_id]": paymentData.invoiceId,
          }),
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

    await supabase.from("transactions").insert({
      user_id: user.id,
      client_id: paymentData.clientId,
      invoice_id: paymentData.invoiceId || null,
      appointment_id: paymentData.appointmentId || null,
      package_id: paymentData.packageId || null,
      transaction_type: "payment",
      payment_method: "stripe",
      amount: finalAmount,
      processing_fee_amount: processingFee,
      stripe_payment_intent_id: paymentIntent.id,
      status: "pending",
      notes: paymentData.description,
    });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: finalAmount,
        processingFee: processingFee,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});