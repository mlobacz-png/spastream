import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface VapiCallEvent {
  type: "assistant-request" | "status-update" | "end-of-call-report";
  call: {
    id: string;
    phoneNumberId: string;
    customer: {
      number: string;
    };
  };
  phoneNumber?: {
    number: string;
  };
  transcript?: string;
  summary?: string;
  duration?: number;
  cost?: number;
  status?: string;
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

    const event: VapiCallEvent = await req.json();
    console.log("Vapi webhook event:", event.type);

    // Handle different event types
    switch (event.type) {
      case "assistant-request": {
        // Incoming call - load business context and return assistant configuration
        const phoneNumberTo = event.phoneNumber?.number || "";

        // Look up which business owns this phone number
        const { data: config, error: configError } = await supabase
          .from("voice_ai_config")
          .select("*, user_id")
          .eq("vapi_phone_number", phoneNumberTo)
          .maybeSingle();

        if (configError || !config) {
          console.error("Failed to find config for phone:", phoneNumberTo);
          return new Response(
            JSON.stringify({ error: "Configuration not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Create call log entry FIRST (even if not enabled, so we can see attempts)
        await supabase.from("voice_ai_call_logs").insert({
          user_id: config.user_id,
          vapi_call_id: event.call.id,
          phone_number_from: event.call.customer.number,
          phone_number_to: phoneNumberTo,
          call_status: config.is_enabled ? "ringing" : "rejected",
        });

        // Check if voice AI is enabled
        if (!config.is_enabled) {
          return new Response(
            JSON.stringify({
              error: "Voice AI is not enabled for this business"
            }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Load business services
        const { data: services } = await supabase
          .from("services")
          .select("name, description, price, duration")
          .eq("user_id", config.user_id);

        // Build context for AI assistant
        const servicesText = services?.map(s =>
          `${s.name} ($${s.price}) - ${s.duration} minutes${s.description ? ': ' + s.description : ''}`
        ).join(", ") || "No services configured yet";

        const assistantConfig = {
          assistant: {
            firstMessage: `${config.greeting_message} I'm ${config.ai_assistant_name}, your virtual assistant at ${config.business_name}.`,
            model: {
              provider: "openai",
              model: "gpt-4",
              temperature: 0.7,
              messages: [
                {
                  role: "system",
                  content: `You are ${config.ai_assistant_name}, a friendly and professional AI receptionist for ${config.business_name}, a medical spa/aesthetic clinic.

Your responsibilities:
1. Greet callers warmly and professionally
2. Answer questions about services, pricing, and availability
3. Help schedule appointments by collecting all required information
4. Collect contact information
5. Provide business hours and location information

Available Services:
${servicesText}

Business Hours:
${JSON.stringify(config.business_hours, null, 2)}

${config.booking_instructions ? `Booking Instructions:\n${config.booking_instructions}` : ''}

Important Guidelines:
- Always be warm, professional, and patient
- If asked about medical advice, politely explain you can't provide that but offer to schedule a consultation
- For bookings, you MUST collect ALL of these before scheduling: client name, phone number, email address, preferred service, and desired date/time
- Once you have all booking information, use the createAppointment function to schedule it
- After successfully creating the appointment, confirm all details with the caller and let them know they'll receive a confirmation email
- If they want to speak to a human, let them know someone will call them back within 24 hours
- Never make up information - if you don't know something, say so and offer to have someone follow up

End each call by confirming next steps and thanking them for calling.`
                }
              ],
              functions: [
                {
                  name: "createAppointment",
                  description: "Creates a new appointment in the calendar and sends a confirmation email to the client",
                  parameters: {
                    type: "object",
                    properties: {
                      clientName: {
                        type: "string",
                        description: "Full name of the client"
                      },
                      clientPhone: {
                        type: "string",
                        description: "Phone number of the client"
                      },
                      clientEmail: {
                        type: "string",
                        description: "Email address of the client for confirmation"
                      },
                      service: {
                        type: "string",
                        description: "The service the client wants to book"
                      },
                      dateTime: {
                        type: "string",
                        description: "Appointment date and time in ISO 8601 format (YYYY-MM-DDTHH:MM:SS)"
                      },
                      notes: {
                        type: "string",
                        description: "Any additional notes or special requests"
                      }
                    },
                    required: ["clientName", "clientPhone", "service", "dateTime"]
                  },
                  url: `${supabaseUrl}/functions/v1/create-appointment-from-call`,
                  method: "POST",
                  body: {
                    businessPhoneNumber: phoneNumberTo,
                    clientName: "{{clientName}}",
                    clientPhone: "{{clientPhone}}",
                    clientEmail: "{{clientEmail}}",
                    service: "{{service}}",
                    dateTime: "{{dateTime}}",
                    notes: "{{notes}}"
                  }
                }
              ]
            },
            voice: {
              provider: "11labs",
              voiceId: "sarah"
            }
          }
        };

        return new Response(
          JSON.stringify(assistantConfig),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }

      case "status-update": {
        // Update call status in database
        await supabase
          .from("voice_ai_call_logs")
          .update({
            call_status: event.status,
          })
          .eq("vapi_call_id", event.call.id);

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "end-of-call-report": {
        // Save transcript, summary, and update minutes used
        const phoneNumberTo = event.phoneNumber?.number || "";

        const { data: config } = await supabase
          .from("voice_ai_config")
          .select("user_id, monthly_minutes_used")
          .eq("vapi_phone_number", phoneNumberTo)
          .maybeSingle();

        if (config) {
          // Update call log with final details
          await supabase
            .from("voice_ai_call_logs")
            .update({
              call_status: "completed",
              call_duration_seconds: event.duration || 0,
              call_cost: event.cost || 0,
              transcript: event.transcript || "",
              summary: event.summary || "",
            })
            .eq("vapi_call_id", event.call.id);

          // Update minutes used
          const minutesUsed = Math.ceil((event.duration || 0) / 60);
          await supabase
            .from("voice_ai_config")
            .update({
              monthly_minutes_used: (config.monthly_minutes_used || 0) + minutesUsed,
            })
            .eq("user_id", config.user_id);
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Unknown event type" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Vapi webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});