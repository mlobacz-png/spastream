import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CampaignExecution {
  campaignId: string;
  clientId: string;
  clientEmail: string;
  clientName: string;
  variables: Record<string, any>;
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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization")!;
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

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Process all active campaigns
    if (action === "process") {
      const executions = await processActiveCampaigns(supabase, user.id, resendApiKey);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          processed: executions.length,
          executions 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Send a test email for a campaign
    if (action === "test" && req.method === "POST") {
      const { campaignId, testEmail } = await req.json();
      
      const { data: campaign } = await supabase
        .from("marketing_campaigns")
        .select("*")
        .eq("id", campaignId)
        .eq("user_id", user.id)
        .single();

      if (!campaign) {
        return new Response(
          JSON.stringify({ error: "Campaign not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const testVariables = {
        client_name: "Test User",
        practice_name: "Your Practice",
        discount: "20",
        treatment_name: "Botox",
        days_since_visit: "90",
      };

      const emailContent = replacePlaceholders(campaign.email_template, testVariables);
      const subject = replacePlaceholders(campaign.subject_line, testVariables);

      if (resendApiKey) {
        await sendEmail(resendApiKey, testEmail, subject, emailContent, "Your Practice");
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: resendApiKey ? "Test email sent" : "Test email queued (no API key configured)"
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function processActiveCampaigns(
  supabase: any,
  userId: string,
  resendApiKey?: string
): Promise<CampaignExecution[]> {
  const executions: CampaignExecution[] = [];

  // Get all active campaigns for this user
  const { data: campaigns } = await supabase
    .from("marketing_campaigns")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .eq("is_active", true);

  if (!campaigns || campaigns.length === 0) {
    return executions;
  }

  // Get all clients for this user
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", userId);

  if (!clients) return executions;

  const today = new Date();

  for (const campaign of campaigns) {
    const eligibleClients = await findEligibleClients(
      supabase,
      userId,
      clients,
      campaign,
      today
    );

    for (const client of eligibleClients) {
      // Check if we already sent to this client recently
      const { data: recentExecution } = await supabase
        .from("campaign_executions")
        .select("id")
        .eq("campaign_id", campaign.id)
        .eq("client_id", client.id)
        .gte("sent_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .maybeSingle();

      if (recentExecution) continue; // Skip if sent in last 30 days

      const variables = buildVariables(client, campaign);
      const emailContent = replacePlaceholders(campaign.email_template, variables);
      const subject = replacePlaceholders(campaign.subject_line, variables);

      let deliveryStatus = "sent";
      let errorMessage = null;

      // Send email if API key is configured
      if (resendApiKey && campaign.send_method !== "sms") {
        try {
          await sendEmail(resendApiKey, client.email, subject, emailContent, variables.practice_name);
        } catch (error) {
          deliveryStatus = "failed";
          errorMessage = error.message;
        }
      }

      // Record execution
      await supabase.from("campaign_executions").insert({
        user_id: userId,
        campaign_id: campaign.id,
        client_id: client.id,
        delivery_status: deliveryStatus,
        error_message: errorMessage,
      });

      // Update campaign stats
      await supabase
        .from("marketing_campaigns")
        .update({ total_sent: campaign.total_sent + 1 })
        .eq("id", campaign.id);

      executions.push({
        campaignId: campaign.id,
        clientId: client.id,
        clientEmail: client.email,
        clientName: `${client.first_name} ${client.last_name}`,
        variables,
      });
    }
  }

  return executions;
}

async function findEligibleClients(
  supabase: any,
  userId: string,
  clients: any[],
  campaign: any,
  today: Date
): Promise<any[]> {
  const eligible: any[] = [];

  for (const client of clients) {
    let isEligible = false;

    switch (campaign.campaign_type) {
      case "birthday":
        if (client.date_of_birth) {
          const dob = new Date(client.date_of_birth);
          const isBirthday = 
            dob.getMonth() === today.getMonth() && 
            dob.getDate() === today.getDate();
          isEligible = isBirthday;
        }
        break;

      case "win_back":
        const { data: lastAppointment } = await supabase
          .from("appointments")
          .select("appointment_date")
          .eq("user_id", userId)
          .eq("client_id", client.id)
          .eq("status", "completed")
          .order("appointment_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastAppointment) {
          const daysSinceVisit = Math.floor(
            (today.getTime() - new Date(lastAppointment.appointment_date).getTime()) / 
            (1000 * 60 * 60 * 24)
          );
          isEligible = daysSinceVisit >= 90;
        }
        break;

      case "post_treatment":
        const { data: recentAppointment } = await supabase
          .from("appointments")
          .select("appointment_date, service")
          .eq("user_id", userId)
          .eq("client_id", client.id)
          .eq("status", "completed")
          .order("appointment_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (recentAppointment) {
          const daysSinceTreatment = Math.floor(
            (today.getTime() - new Date(recentAppointment.appointment_date).getTime()) / 
            (1000 * 60 * 60 * 24)
          );
          isEligible = daysSinceTreatment === 7;
        }
        break;

      case "review_request":
        const { data: completedAppointment } = await supabase
          .from("appointments")
          .select("appointment_date, service")
          .eq("user_id", userId)
          .eq("client_id", client.id)
          .eq("status", "completed")
          .order("appointment_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (completedAppointment) {
          const daysSinceTreatment = Math.floor(
            (today.getTime() - new Date(completedAppointment.appointment_date).getTime()) / 
            (1000 * 60 * 60 * 24)
          );
          isEligible = daysSinceTreatment === 14;
        }
        break;

      case "promotional":
      case "referral":
        // For promotional campaigns, all clients are eligible
        isEligible = true;
        break;
    }

    if (isEligible) {
      eligible.push(client);
    }
  }

  return eligible;
}

function buildVariables(client: any, campaign: any): Record<string, string> {
  return {
    client_name: `${client.first_name} ${client.last_name}`,
    first_name: client.first_name,
    last_name: client.last_name,
    practice_name: "SpaStream",
    discount: "20",
    treatment_name: "Treatment",
    days_since_visit: "90",
  };
}

function replacePlaceholders(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  return result;
}

async function sendEmail(
  apiKey: string,
  to: string,
  subject: string,
  htmlContent: string,
  fromName: string
): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${fromName} <onboarding@resend.dev>`,
      to: [to],
      subject: subject,
      html: htmlContent.replace(/\n/g, "<br>"),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Email send failed: ${error.message || response.statusText}`);
  }
}