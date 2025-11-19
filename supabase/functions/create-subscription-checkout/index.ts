import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const { planId, planName, planPrice, userId, userEmail } = await req.json();

    if (!planId || !planName || !planPrice || !userId || !userEmail) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Stripe Checkout Session
    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "payment_method_types[]": "card",
        "line_items[0][price_data][currency]": "usd",
        "line_items[0][price_data][product_data][name]": `SpaStream ${planName} Plan`,
        "line_items[0][price_data][product_data][description]": "Med spa management platform subscription",
        "line_items[0][price_data][unit_amount]": planPrice.toString(),
        "line_items[0][price_data][recurring][interval]": "month",
        "line_items[0][quantity]": "1",
        "mode": "subscription",
        "customer_email": userEmail,
        "subscription_data[trial_period_days]": "14",
        "subscription_data[metadata][user_id]": userId,
        "subscription_data[metadata][plan_id]": planId,
        "success_url": `${Deno.env.get("APP_URL")}/app?subscription=success`,
        "cancel_url": `${Deno.env.get("APP_URL")}/onboarding?step=plan`,
        "metadata[user_id]": userId,
        "metadata[plan_id]": planId,
      }).toString(),
    });

    if (!stripeResponse.ok) {
      const error = await stripeResponse.text();
      console.error("Stripe API error:", error);
      throw new Error(`Stripe API error: ${error}`);
    }

    const session = await stripeResponse.json();

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});