import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Appointment {
  id: string;
  scheduled_at: string;
  status: string;
}

interface RetentionScore {
  client_id: string;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high';
  days_since_last_visit: number;
  total_visits: number;
  average_visit_interval: number;
  last_visit_date: string | null;
  predicted_churn_date: string | null;
  reasons: string[];
  recommended_actions: string[];
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
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const userId = user.id;

    // Fetch all clients for this user
    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .select("id, name, email, phone")
      .eq("user_id", userId);

    if (clientsError) throw clientsError;

    const retentionScores: RetentionScore[] = [];
    const now = new Date();

    for (const client of clients as Client[]) {
      // Get all completed appointments for this client
      const { data: appointments, error: apptError } = await supabase
        .from("appointments")
        .select("id, scheduled_at, status")
        .eq("user_id", userId)
        .eq("client_id", client.id)
        .eq("status", "completed")
        .order("scheduled_at", { ascending: false });

      if (apptError) continue;

      const appts = appointments as Appointment[];
      const totalVisits = appts.length;

      if (totalVisits === 0) {
        // New client - low risk for now
        retentionScores.push({
          client_id: client.id,
          risk_score: 25,
          risk_level: 'low',
          days_since_last_visit: 0,
          total_visits: 0,
          average_visit_interval: 0,
          last_visit_date: null,
          predicted_churn_date: null,
          reasons: ['New client with no visit history'],
          recommended_actions: ['Send welcome email with special offer', 'Schedule first appointment'],
        });
        continue;
      }

      const lastVisit = new Date(appts[0].scheduled_at);
      const daysSinceLastVisit = Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));

      // Calculate average visit interval
      let totalInterval = 0;
      for (let i = 0; i < appts.length - 1; i++) {
        const diff = new Date(appts[i].scheduled_at).getTime() - new Date(appts[i + 1].scheduled_at).getTime();
        totalInterval += diff / (1000 * 60 * 60 * 24);
      }
      const averageInterval = appts.length > 1 ? Math.floor(totalInterval / (appts.length - 1)) : 90;

      // Calculate risk score (0-100, higher = more risk)
      let riskScore = 0;
      const reasons: string[] = [];
      const recommendedActions: string[] = [];

      // Factor 1: Days since last visit (40 points max)
      if (daysSinceLastVisit > averageInterval * 2) {
        riskScore += 40;
        reasons.push(`${daysSinceLastVisit} days since last visit (avg interval: ${averageInterval} days)`);
      } else if (daysSinceLastVisit > averageInterval * 1.5) {
        riskScore += 30;
        reasons.push(`${daysSinceLastVisit} days since last visit (slightly overdue)`);
      } else if (daysSinceLastVisit > averageInterval) {
        riskScore += 20;
        reasons.push(`${daysSinceLastVisit} days since last visit (due for visit)`);
      } else {
        riskScore += 5;
      }

      // Factor 2: Visit frequency decline (30 points max)
      if (appts.length >= 4) {
        const recentInterval = Math.floor(
          (new Date(appts[0].scheduled_at).getTime() - new Date(appts[1].scheduled_at).getTime()) /
          (1000 * 60 * 60 * 24)
        );
        if (recentInterval > averageInterval * 1.5) {
          riskScore += 30;
          reasons.push('Visit frequency has declined');
        } else if (recentInterval > averageInterval * 1.2) {
          riskScore += 15;
          reasons.push('Slight decline in visit frequency');
        }
      }

      // Factor 3: Total visit count (20 points max - lower visits = higher risk)
      if (totalVisits === 1) {
        riskScore += 20;
        reasons.push('Only one previous visit');
      } else if (totalVisits === 2) {
        riskScore += 15;
        reasons.push('Limited visit history');
      } else if (totalVisits <= 5) {
        riskScore += 10;
      }

      // Factor 4: Long-term inactive (10 points max)
      if (daysSinceLastVisit > 365) {
        riskScore += 10;
        reasons.push('Inactive for over a year');
      } else if (daysSinceLastVisit > 180) {
        riskScore += 5;
        reasons.push('Inactive for over 6 months');
      }

      // Cap at 100
      riskScore = Math.min(riskScore, 100);

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high';
      if (riskScore >= 60) {
        riskLevel = 'high';
      } else if (riskScore >= 35) {
        riskLevel = 'medium';
      } else {
        riskLevel = 'low';
      }

      // Generate recommended actions based on risk level
      if (riskLevel === 'high') {
        recommendedActions.push('Send personalized re-engagement email immediately');
        recommendedActions.push('Offer 20% discount on next treatment');
        recommendedActions.push('Personal phone call from staff');
        recommendedActions.push('Share new treatment options that may interest them');
      } else if (riskLevel === 'medium') {
        recommendedActions.push('Send gentle reminder about booking next appointment');
        recommendedActions.push('Offer 10% discount for booking within 2 weeks');
        recommendedActions.push('Send seasonal promotion');
      } else {
        recommendedActions.push('Continue regular follow-ups');
        recommendedActions.push('Send newsletter with tips and updates');
      }

      // Calculate predicted churn date
      const predictedChurnDays = averageInterval * 3; // After 3x average interval, consider churned
      const predictedChurnDate = new Date(lastVisit.getTime() + predictedChurnDays * 24 * 60 * 60 * 1000);

      retentionScores.push({
        client_id: client.id,
        risk_score: riskScore,
        risk_level: riskLevel,
        days_since_last_visit: daysSinceLastVisit,
        total_visits: totalVisits,
        average_visit_interval: averageInterval,
        last_visit_date: lastVisit.toISOString(),
        predicted_churn_date: predictedChurnDate.toISOString(),
        reasons,
        recommended_actions: recommendedActions,
      });
    }

    // Save retention scores to database
    for (const score of retentionScores) {
      await supabase
        .from("client_retention_scores")
        .upsert({
          user_id: userId,
          client_id: score.client_id,
          risk_score: score.risk_score,
          risk_level: score.risk_level,
          days_since_last_visit: score.days_since_last_visit,
          total_visits: score.total_visits,
          average_visit_interval: score.average_visit_interval,
          last_visit_date: score.last_visit_date,
          predicted_churn_date: score.predicted_churn_date,
          reasons: score.reasons,
          recommended_actions: score.recommended_actions,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,client_id'
        });
    }

    // Get summary statistics
    const highRisk = retentionScores.filter(s => s.risk_level === 'high').length;
    const mediumRisk = retentionScores.filter(s => s.risk_level === 'medium').length;
    const lowRisk = retentionScores.filter(s => s.risk_level === 'low').length;

    return new Response(
      JSON.stringify({
        success: true,
        analyzed: retentionScores.length,
        summary: {
          high_risk: highRisk,
          medium_risk: mediumRisk,
          low_risk: lowRisk,
        },
        retention_scores: retentionScores.slice(0, 10), // Return top 10 for preview
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error("Error in client-retention-analyzer:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
