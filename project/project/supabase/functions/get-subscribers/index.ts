import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: subsData, error: subsError } = await supabase
      .from("user_subscriptions")
      .select(`
        id,
        user_id,
        status,
        trial_ends_at,
        current_period_start,
        current_period_end,
        created_at,
        plan_id
      `)
      .order("created_at", { ascending: false });

    if (subsError) throw subsError;

    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) throw usersError;

    const { data: plansData, error: plansError } = await supabase
      .from("subscription_plans")
      .select("id, name, price");

    if (plansError) throw plansError;

    const enrichedData = subsData?.map((sub) => {
      const user = usersData.users.find((u) => u.id === sub.user_id);
      const plan = plansData?.find((p) => p.id === sub.plan_id);
      return {
        ...sub,
        user: { email: user?.email || "N/A" },
        plan: { name: plan?.name || "N/A", price: plan?.price || 0 },
      };
    }) || [];

    const total = enrichedData.length;
    const active = enrichedData.filter((s) => s.status === "active").length;
    const trialing = enrichedData.filter((s) => s.status === "trialing").length;
    const mrr = enrichedData
      .filter((s) => s.status === "active")
      .reduce((sum, s) => sum + (s.plan?.price || 0), 0) / 100;

    return new Response(
      JSON.stringify({
        subscriptions: enrichedData,
        stats: { total, active, trialing, mrr },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching subscribers:", error);

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
