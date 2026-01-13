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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    const eventType = payload.type;

    if (eventType === "checkout.session.completed") {
      const session = payload.data.object;
      const metadata = session.metadata;

      if (session.mode === "subscription" && metadata.user_id && metadata.plan_id) {
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 14);

        await supabase
          .from("user_subscriptions")
          .insert({
            user_id: metadata.user_id,
            plan_id: metadata.plan_id,
            status: "trialing",
            trial_ends_at: trialEnd.toISOString(),
            current_period_start: new Date().toISOString(),
            stripe_subscription_id: session.subscription,
            stripe_customer_id: session.customer,
          });
      }
    } else if (eventType === "customer.subscription.updated") {
      const subscription = payload.data.object;
      const metadata = subscription.metadata;

      if (metadata.user_id) {
        const status = subscription.status === "active" ? "active" :
                      subscription.status === "trialing" ? "trialing" :
                      subscription.status === "past_due" ? "past_due" :
                      subscription.status === "canceled" ? "cancelled" : "expired";

        await supabase
          .from("user_subscriptions")
          .update({
            status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);
      }
    } else if (eventType === "customer.subscription.deleted") {
      const subscription = payload.data.object;

      await supabase
        .from("user_subscriptions")
        .update({
          status: "cancelled",
        })
        .eq("stripe_subscription_id", subscription.id);
    } else if (eventType === "invoice.payment_succeeded") {
      const invoice = payload.data.object;

      if (invoice.subscription) {
        await supabase
          .from("user_subscriptions")
          .update({
            status: "active",
          })
          .eq("stripe_subscription_id", invoice.subscription);
      }
    } else if (eventType === "invoice.payment_failed") {
      const invoice = payload.data.object;

      if (invoice.subscription) {
        await supabase
          .from("user_subscriptions")
          .update({
            status: "past_due",
          })
          .eq("stripe_subscription_id", invoice.subscription);
      }
    } else if (eventType === "payment_intent.succeeded") {
      const paymentIntent = payload.data.object;
      const metadata = paymentIntent.metadata;

      const { data: transaction } = await supabase
        .from("transactions")
        .select("*")
        .eq("stripe_payment_intent_id", paymentIntent.id)
        .single();

      if (transaction) {
        await supabase
          .from("transactions")
          .update({
            status: "completed",
            stripe_charge_id: paymentIntent.latest_charge,
            card_last4: paymentIntent.charges?.data[0]?.payment_method_details?.card?.last4 || "",
            card_brand: paymentIntent.charges?.data[0]?.payment_method_details?.card?.brand || "",
            receipt_url: paymentIntent.charges?.data[0]?.receipt_url || "",
            processed_at: new Date().toISOString(),
          })
          .eq("stripe_payment_intent_id", paymentIntent.id);

        if (metadata.invoice_id) {
          const { data: invoice } = await supabase
            .from("invoices")
            .select("amount_paid, total_amount")
            .eq("id", metadata.invoice_id)
            .single();

          if (invoice) {
            const newAmountPaid = invoice.amount_paid + (paymentIntent.amount / 100);
            await supabase
              .from("invoices")
              .update({
                amount_paid: newAmountPaid,
                balance_due: invoice.total_amount - newAmountPaid,
              })
              .eq("id", metadata.invoice_id);
          }
        }

        if (metadata.package_id) {
          const { data: packagePayment } = await supabase
            .from("package_payments")
            .select("amount_paid, total_amount")
            .eq("package_id", metadata.package_id)
            .single();

          if (packagePayment) {
            const newAmountPaid = packagePayment.amount_paid + (paymentIntent.amount / 100);
            await supabase
              .from("package_payments")
              .update({
                amount_paid: newAmountPaid,
                balance_due: packagePayment.total_amount - newAmountPaid,
              })
              .eq("package_id", metadata.package_id);
          }
        }
      }
    } else if (eventType === "payment_intent.payment_failed") {
      const paymentIntent = payload.data.object;

      await supabase
        .from("transactions")
        .update({
          status: "failed",
          notes: paymentIntent.last_payment_error?.message || "Payment failed",
        })
        .eq("stripe_payment_intent_id", paymentIntent.id);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Webhook handler error" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});