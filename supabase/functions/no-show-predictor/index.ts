import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PredictionRequest {
  clientId: string;
  appointmentDate: string;
  treatmentType: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { clientId, appointmentDate, treatmentType }: PredictionRequest = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get client history
    const { data: client } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .maybeSingle();

    const { data: appointments } = await supabase
      .from("appointments")
      .select("*")
      .eq("client_id", clientId)
      .order("start_time", { ascending: false });

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    // Calculate statistics
    const totalAppointments = appointments?.length || 0;
    const cancelledOrNoShow = appointments?.filter(a => a.status === "cancelled").length || 0;
    const lastMinuteCancellations = appointments?.filter(a => {
      if (a.status !== "cancelled") return false;
      const apptDate = new Date(a.start_time);
      const today = new Date();
      const daysBefore = Math.floor((apptDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysBefore <= 2;
    }).length || 0;

    const appointmentTime = new Date(appointmentDate);
    const dayOfWeek = appointmentTime.toLocaleDateString('en-US', { weekday: 'long' });
    const timeOfDay = appointmentTime.getHours();
    const daysUntilAppointment = Math.floor((appointmentTime.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    const prompt = `You are an AI assistant that predicts no-show/cancellation risk for medical spa appointments.

Client History:
- Total Appointments: ${totalAppointments}
- Cancelled/No-Shows: ${cancelledOrNoShow}
- Last-Minute Cancellations: ${lastMinuteCancellations}
- Client Since: ${client?.created_at ? new Date(client.created_at).toLocaleDateString() : 'Unknown'}

Upcoming Appointment:
- Treatment: ${treatmentType}
- Day: ${dayOfWeek}
- Time: ${timeOfDay}:00
- Days Until Appointment: ${daysUntilAppointment}

Analyze the risk and provide a prediction in JSON format:
{
  "riskScore": 0-100,
  "riskLevel": "low" | "medium" | "high",
  "factors": ["list of risk factors"],
  "recommendations": ["list of actions to reduce no-show risk"],
  "confidence": 0-100
}

Consider:
- Historical cancellation rate
- Appointment timing patterns
- Booking lead time
- Treatment type complexity/cost`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert in predicting appointment no-shows. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5,
        response_format: { type: "json_object" }
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const openaiData = await openaiResponse.json();
    const prediction = JSON.parse(openaiData.choices[0].message.content);

    return new Response(
      JSON.stringify(prediction),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Error in no-show-predictor:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});