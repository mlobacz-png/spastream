import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SMSRequest {
  to: string;
  message: string;
  clientId?: string;
  appointmentId?: string;
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

    const smsData: SMSRequest = await req.json();

    const { data: settings } = await supabase
      .from("sms_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!settings || !settings.enabled) {
      return new Response(
        JSON.stringify({ error: "SMS not configured. Please set up Twilio in SMS Settings." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const TWILIO_ACCOUNT_SID = settings.twilio_account_sid;
    const TWILIO_AUTH_TOKEN = settings.twilio_auth_token;
    const TWILIO_PHONE = settings.twilio_phone_number;

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const authString = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${authString}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: smsData.to,
        From: TWILIO_PHONE,
        Body: smsData.message,
      }),
    });

    const twilioData = await twilioResponse.json();

    if (twilioData.error_code) {
      await supabase.from("sms_messages").insert({
        user_id: user.id,
        client_id: smsData.clientId || null,
        appointment_id: smsData.appointmentId || null,
        direction: "outbound",
        from_number: TWILIO_PHONE,
        to_number: smsData.to,
        message_body: smsData.message,
        status: "failed",
        error_message: twilioData.message,
      });

      return new Response(
        JSON.stringify({ error: twilioData.message }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    await supabase.from("sms_messages").insert({
      user_id: user.id,
      client_id: smsData.clientId || null,
      appointment_id: smsData.appointmentId || null,
      direction: "outbound",
      from_number: TWILIO_PHONE,
      to_number: smsData.to,
      message_body: smsData.message,
      twilio_message_sid: twilioData.sid,
      status: "sent",
      sent_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        messageSid: twilioData.sid,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("SMS send error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send SMS" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});