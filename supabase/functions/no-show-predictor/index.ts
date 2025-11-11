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
  bookingMethod?: string;
  depositPaid?: boolean;
  price?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const {
      clientId,
      appointmentDate,
      treatmentType,
      bookingMethod = 'admin',
      depositPaid = false,
      price = 0
    }: PredictionRequest = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    const totalAppointments = appointments?.length || 0;
    const completedAppointments = appointments?.filter(a => a.status === "completed").length || 0;
    const cancelledAppointments = appointments?.filter(a => a.status === "cancelled").length || 0;
    const noShowAppointments = appointments?.filter(a => a.status === "no-show").length || 0;

    const totalProblematic = cancelledAppointments + noShowAppointments;
    const cancellationRate = totalAppointments > 0 ? (totalProblematic / totalAppointments * 100).toFixed(1) : '0';

    const lastMinuteCancellations = appointments?.filter(a => {
      if (a.status !== "cancelled" && a.status !== "no-show") return false;
      if (!a.cancellation_date) return false;
      const apptDate = new Date(a.start_time);
      const cancelDate = new Date(a.cancellation_date);
      const hoursBefore = (apptDate.getTime() - cancelDate.getTime()) / (1000 * 60 * 60);
      return hoursBefore <= 48;
    }).length || 0;

    const appointmentTime = new Date(appointmentDate);
    const dayOfWeek = appointmentTime.toLocaleDateString('en-US', { weekday: 'long' });
    const timeOfDay = appointmentTime.getHours();
    const daysUntilAppointment = Math.floor((appointmentTime.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    const isNewClient = totalAppointments === 0;
    const hasGoodHistory = totalAppointments >= 3 && cancellationRate === '0';
    const hasPoorHistory = parseFloat(cancellationRate) > 30;

    const isHighRiskTime = (dayOfWeek === 'Monday' && timeOfDay < 10) ||
                          (dayOfWeek === 'Friday' && timeOfDay > 16);

    const isHighRiskLeadTime = daysUntilAppointment > 21 || daysUntilAppointment === 0;

    const clientAge = client?.created_at
      ? Math.floor((new Date().getTime() - new Date(client.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const hasVerifiedContact = !!(client?.phone && client?.email);

    const prompt = `You are an AI assistant that predicts no-show/cancellation risk for medical spa appointments.

Client Profile:
- Total Appointments: ${totalAppointments}
- Completed: ${completedAppointments}
- Cancelled: ${cancelledAppointments}
- No-Shows: ${noShowAppointments}
- Cancellation Rate: ${cancellationRate}%
- Last-Minute Cancellations (<48hrs): ${lastMinuteCancellations}
- Client Since: ${client?.created_at ? new Date(client.created_at).toLocaleDateString() : 'New Client'}
- Client Age: ${clientAge} days
- Contact Info: ${hasVerifiedContact ? 'Phone & Email verified' : 'Incomplete'}

Upcoming Appointment Details:
- Treatment: ${treatmentType}
- Price: $${price}
- Day: ${dayOfWeek}
- Time: ${timeOfDay}:00
- Days Until Appointment: ${daysUntilAppointment}
- Booking Method: ${bookingMethod}
- Deposit Paid: ${depositPaid ? 'Yes' : 'No'}

Risk Factors to Consider:
1. New Client Risk: ${isNewClient ? 'YES - First appointment' : 'No'}
2. Historical Risk: ${hasPoorHistory ? 'YES - >30% cancellation rate' : hasGoodHistory ? 'No - Perfect record' : 'Moderate'}
3. Time Risk: ${isHighRiskTime ? 'YES - High-risk day/time' : 'No'}
4. Lead Time Risk: ${isHighRiskLeadTime ? 'YES - Too far/too close' : 'No'}
5. Financial Commitment: ${depositPaid ? 'Protected - Deposit paid' : price === 0 ? 'HIGH RISK - Free/No price' : 'Moderate - No deposit'}
6. Booking Method: ${bookingMethod === 'online' ? 'Lower risk - Online booking' : 'Higher risk - Phone/walk-in'}

CRITICAL SCORING RULES:
- New clients (0 appointments): Start at 40-60 risk
- Clients with >30% cancellation rate: Start at 60-80 risk
- No deposit + high price: +20 points
- Free appointments: +30 points
- Last-minute cancellations history: +10 per occurrence
- Perfect attendance record (3+ appts): Start at 10-20 risk
- Deposit paid: -20 points
- High-risk time (Mon AM, Fri PM): +15 points
- Booking lead time >3 weeks OR same-day: +15 points
- Online booking: -10 points
- Missing contact info: +15 points

Risk Levels:
- LOW: 0-35 (Green flag, minimal intervention needed)
- MEDIUM: 36-65 (Yellow flag, send confirmation reminder)
- HIGH: 66-100 (Red flag, requires deposit or confirmation call)

Provide your prediction in JSON format:
{
  "riskScore": 0-100,
  "riskLevel": "low" | "medium" | "high",
  "factors": ["list of specific risk factors found"],
  "recommendations": ["specific actionable steps to reduce no-show risk"],
  "confidence": 0-100
}`;

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
            content: "You are an expert in predicting appointment no-shows for medical spas. You analyze historical data, behavioral patterns, and booking characteristics to provide accurate risk assessments. Always respond with valid JSON and be conservative in your predictions - err on the side of caution."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
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
      JSON.stringify({
        ...prediction,
        metadata: {
          clientId,
          appointmentDate,
          totalAppointments,
          cancellationRate: parseFloat(cancellationRate),
          isNewClient,
          depositPaid,
          bookingMethod,
          daysUntilAppointment
        }
      }),
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
