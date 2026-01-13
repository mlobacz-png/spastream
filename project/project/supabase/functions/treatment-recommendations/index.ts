import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TreatmentRequest {
  clientId: string;
  skinType?: string;
  concerns?: string[];
  goals?: string;
  previousTreatments?: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { clientId, skinType, concerns, goals, previousTreatments }: TreatmentRequest = await req.json();

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const prompt = `You are an expert medical aesthetics consultant. Analyze the following client profile and recommend the top 3-5 most suitable treatments.

Client Profile:
- Skin Type: ${skinType || "Not specified"}
- Concerns: ${concerns?.join(", ") || "Not specified"}
- Goals: ${goals || "Not specified"}
- Previous Treatments: ${previousTreatments?.join(", ") || "None"}

Provide recommendations in JSON format with this structure:
{
  "recommendations": [
    {
      "treatment": "Treatment name",
      "confidence": 0-100,
      "reasoning": "Brief explanation",
      "expectedResults": "What to expect",
      "contraindications": "Any warnings or considerations"
    }
  ]
}

Focus on evidence-based treatments. Consider contraindications and skin type compatibility.`;

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
            content: "You are an expert medical aesthetics consultant. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const openaiData = await openaiResponse.json();
    const recommendations = JSON.parse(openaiData.choices[0].message.content);

    return new Response(
      JSON.stringify(recommendations),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Error in treatment-recommendations:", error);
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