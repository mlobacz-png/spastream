import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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
    const APP_URL = Deno.env.get("APP_URL");

    console.log("Environment check:", {
      hasStripeKey: !!STRIPE_SECRET_KEY,
      appUrl: APP_URL,
    });

    if (!STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    if (!APP_URL) {
      throw new Error("APP_URL not configured");
    }

    const { planId, planName, planPrice, userId, userEmail } = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Creating checkout session:", {
      planId,
      planName,
      planPrice,
      userId,
      userEmail,
      successUrl: `${APP_URL}/app?subscription=success`,
      cancelUrl: `${APP_URL}/onboarding?step=plan`,
    });

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

    console.log("Checkout session created:", {
      sessionId: session.id,
      url: session.url,
      successUrl: session.success_url,
      cancelUrl: session.cancel_url,
    });

    // Create subscription record immediately (don't wait for webhook)
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    const { error: insertError } = await supabase
      .from("user_subscriptions")
      .insert({
        user_id: userId,
        plan_id: planId,
        status: "trialing",
        trial_ends_at: trialEnd.toISOString(),
        current_period_start: new Date().toISOString(),
        stripe_subscription_id: session.subscription || session.id,
        stripe_customer_id: session.customer || null,
      });

    if (insertError) {
      console.error("Error creating subscription record:", insertError);
      // Don't fail the whole request, webhook will handle it
    } else {
      console.log("Subscription record created successfully");
    }

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