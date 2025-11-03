import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface StaffOptimizationRequest {
  startDate: string;
  endDate: string;
  staffMembers?: Array<{
    id: string;
    name: string;
    specialties: string[];
    hoursPerWeek: number;
  }>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { startDate, endDate, staffMembers }: StaffOptimizationRequest = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get appointments in the date range
    const { data: appointments } = await supabase
      .from("appointments")
      .select("*")
      .gte("start_time", startDate)
      .lte("start_time", endDate)
      .order("start_time", { ascending: true });

    // Get historical appointment patterns (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const { data: historicalAppointments } = await supabase
      .from("appointments")
      .select("*")
      .gte("start_time", ninetyDaysAgo.toISOString());

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    // Analyze appointment patterns by day of week and time
    const dayPatterns: Record<string, number[]> = {};
    historicalAppointments?.forEach(appt => {
      const date = new Date(appt.start_time);
      const day = date.toLocaleDateString('en-US', { weekday: 'long' });
      const hour = date.getHours();
      
      if (!dayPatterns[day]) dayPatterns[day] = Array(24).fill(0);
      dayPatterns[day][hour]++;
    });

    // Count treatments by type
    const treatmentCounts: Record<string, number> = {};
    appointments?.forEach(appt => {
      const type = appt.title || 'Unknown';
      treatmentCounts[type] = (treatmentCounts[type] || 0) + 1;
    });

    const upcomingCount = appointments?.length || 0;
    const avgDailyAppointments = Math.round((historicalAppointments?.length || 0) / 90);

    const prompt = `You are a workforce optimization expert for a medical spa. Analyze scheduling needs and recommend optimal staffing.

Time Period:
- Start: ${new Date(startDate).toLocaleDateString()}
- End: ${new Date(endDate).toLocaleDateString()}

Appointment Data:
- Upcoming Appointments: ${upcomingCount}
- Average Daily Appointments (90-day): ${avgDailyAppointments}
- Treatment Mix: ${JSON.stringify(treatmentCounts, null, 2)}

Day-of-Week Patterns:
${Object.entries(dayPatterns).map(([day, hours]) => {
  const busyHours = hours.map((count, hour) => count > 2 ? `${hour}:00` : null).filter(Boolean);
  return `- ${day}: Busy hours ${busyHours.join(', ') || 'Evenly distributed'}`;
}).join('\n')}

Current Staff:
${staffMembers ? JSON.stringify(staffMembers, null, 2) : 'Not provided'}

Provide optimization recommendations in JSON format:
{
  "recommendations": [
    {
      "day": "Day of week",
      "shifts": [
        {
          "role": "Role needed",
          "startTime": "HH:MM",
          "endTime": "HH:MM",
          "staffNeeded": number,
          "reasoning": "Why this shift is needed"
        }
      ]
    }
  ],
  "insights": ["Key insights about scheduling patterns"],
  "efficiencyScore": 0-100,
  "projectedUtilization": "percentage",
  "costSavings": "estimated savings vs. current"
}

Consider:
- Peak hours and days requiring more staff
- Treatment specialization requirements
- Staff utilization and efficiency
- Break times and overlap for smooth handoffs
- Cost optimization while maintaining service quality`;

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
            content: "You are an expert in workforce optimization and scheduling. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.6,
        response_format: { type: "json_object" }
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const openaiData = await openaiResponse.json();
    const optimization = JSON.parse(openaiData.choices[0].message.content);

    return new Response(
      JSON.stringify(optimization),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Error in staff-optimizer:", error);
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