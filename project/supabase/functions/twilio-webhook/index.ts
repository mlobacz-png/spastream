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

    const formData = await req.formData();
    const from = formData.get("From") as string;
    const to = formData.get("To") as string;
    const body = formData.get("Body") as string;
    const messageSid = formData.get("MessageSid") as string;

    const { data: settings } = await supabase
      .from("sms_settings")
      .select("user_id")
      .eq("twilio_phone_number", to)
      .single();

    if (!settings) {
      console.log("No matching user found for phone:", to);
      return new Response(
        JSON.stringify({ error: "No user found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: clients } = await supabase
      .from("clients")
      .select("id")
      .eq("user_id", settings.user_id)
      .ilike("phone", `%${from.slice(-10)}%`)
      .limit(1);

    const clientId = clients && clients.length > 0 ? clients[0].id : null;

    await supabase.from("sms_messages").insert({
      user_id: settings.user_id,
      client_id: clientId,
      direction: "inbound",
      from_number: from,
      to_number: to,
      message_body: body,
      twilio_message_sid: messageSid,
      status: "received",
      sent_at: new Date().toISOString(),
    });

    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        headers: { ...corsHeaders, "Content-Type": "text/xml" },
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