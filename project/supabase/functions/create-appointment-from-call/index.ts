import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AppointmentRequest {
  businessPhoneNumber: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  service: string;
  dateTime: string;
  notes?: string;
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

    const {
      businessPhoneNumber,
      clientName,
      clientPhone,
      clientEmail,
      service,
      dateTime,
      notes
    }: AppointmentRequest = await req.json();

    console.log("Creating appointment:", { clientName, service, dateTime });

    // Find the business owner by phone number
    const { data: config, error: configError } = await supabase
      .from("voice_ai_config")
      .select("user_id, business_name")
      .eq("vapi_phone_number", businessPhoneNumber)
      .maybeSingle();

    if (configError || !config) {
      throw new Error("Business configuration not found");
    }

    // Check if client exists, if not create them
    let clientId: string;
    const { data: existingClient } = await supabase
      .from("clients")
      .select("id")
      .eq("user_id", config.user_id)
      .eq("phone", clientPhone)
      .maybeSingle();

    if (existingClient) {
      clientId = existingClient.id;
      // Update client info if provided
      await supabase
        .from("clients")
        .update({
          name: clientName,
          email: clientEmail || "",
          updated_at: new Date().toISOString(),
        })
        .eq("id", clientId);
    } else {
      // Create new client
      const { data: newClient, error: clientError } = await supabase
        .from("clients")
        .insert({
          user_id: config.user_id,
          name: clientName,
          phone: clientPhone,
          email: clientEmail || "",
        })
        .select("id")
        .single();

      if (clientError || !newClient) {
        throw new Error(`Failed to create client: ${clientError?.message}`);
      }
      clientId = newClient.id;
    }

    // Get service details for duration
    const { data: serviceData } = await supabase
      .from("services")
      .select("duration")
      .eq("user_id", config.user_id)
      .eq("name", service)
      .maybeSingle();

    const duration = serviceData?.duration || 60;

    // Create appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .insert({
        user_id: config.user_id,
        client_id: clientId,
        service,
        start_time: dateTime,
        duration,
        notes: notes || `Scheduled via Voice AI on ${new Date().toLocaleString()}`,
      })
      .select()
      .single();

    if (appointmentError || !appointment) {
      throw new Error(`Failed to create appointment: ${appointmentError?.message}`);
    }

    console.log("Appointment created successfully:", appointment.id);

    // Send confirmation email if client has email
    if (clientEmail) {
      try {
        const confirmationUrl = `${supabaseUrl}/functions/v1/send-booking-confirmation`;
        const appointmentDate = new Date(dateTime);

        await fetch(confirmationUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: clientEmail,
            businessName: config.business_name,
            clientName,
            service,
            date: appointmentDate.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric"
            }),
            time: appointmentDate.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true
            }),
            confirmationMessage: "Your appointment has been successfully scheduled!",
          }),
        });

        console.log("Confirmation email sent to:", clientEmail);
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Don't fail the appointment creation if email fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Appointment scheduled for ${clientName} on ${new Date(dateTime).toLocaleString()}`,
        appointmentId: appointment.id,
        clientId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Create appointment error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to create appointment",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});