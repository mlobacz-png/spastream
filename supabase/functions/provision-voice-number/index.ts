import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ProvisionRequest {
  businessName: string;
  areaCode?: string;
  aiAssistantName?: string;
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
    const vapiApiKey = Deno.env.get("VAPI_API_KEY");

    if (!vapiApiKey) {
      throw new Error("VAPI_API_KEY environment variable not set");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { businessName, areaCode = "555", aiAssistantName = "Sarah" }: ProvisionRequest = await req.json();

    // Check if user already has a phone number
    const { data: existingConfig } = await supabase
      .from("voice_ai_config")
      .select("vapi_phone_number")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingConfig?.vapi_phone_number) {
      return new Response(
        JSON.stringify({
          error: "Phone number already provisioned",
          phoneNumber: existingConfig.vapi_phone_number
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Purchase phone number from Vapi.ai
    const webhookUrl = `${supabaseUrl}/functions/v1/vapi-webhook`;

    const vapiResponse = await fetch("https://api.vapi.ai/phone-number", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${vapiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        provider: "twilio",
        twilioAccountSid: Deno.env.get("TWILIO_ACCOUNT_SID"),
        twilioAuthToken: Deno.env.get("TWILIO_AUTH_TOKEN"),
        areaCode: areaCode,
        name: `${businessName} - Voice AI`,
        serverUrl: webhookUrl,
      }),
    });

    if (!vapiResponse.ok) {
      const errorText = await vapiResponse.text();
      console.error("Vapi.ai error:", errorText);
      throw new Error(`Failed to provision phone number: ${errorText}`);
    }

    const vapiData = await vapiResponse.json();
    const phoneNumber = vapiData.number;
    const phoneNumberId = vapiData.id;

    console.log("Phone number provisioned:", phoneNumber);

    // Create or update voice AI config
    const { error: configError } = await supabase
      .from("voice_ai_config")
      .upsert({
        user_id: user.id,
        business_name: businessName,
        vapi_phone_number: phoneNumber,
        vapi_phone_number_id: phoneNumberId,
        ai_assistant_name: aiAssistantName,
        is_enabled: true,
      }, {
        onConflict: "user_id"
      });

    if (configError) {
      console.error("Failed to save config:", configError);
      throw configError;
    }

    // Also update business_information if it exists
    await supabase
      .from("business_information")
      .update({
        vapi_phone_number: phoneNumber,
        vapi_phone_number_id: phoneNumberId,
      })
      .eq("user_id", user.id);

    return new Response(
      JSON.stringify({
        success: true,
        phoneNumber,
        phoneNumberId,
        message: `Successfully provisioned phone number ${phoneNumber}`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Provision phone number error:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: "Make sure VAPI_API_KEY, TWILIO_ACCOUNT_SID, and TWILIO_AUTH_TOKEN are set"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
