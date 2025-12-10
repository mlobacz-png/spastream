"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { Loader2, RefreshCw, AlertTriangle, TrendingUp, Users, Send, Phone, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { ConfidenceBar } from "./ai-confidence-bar";
import { SafeProgress } from "./safe-progress";

interface RetentionScore {
  id: string;
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
  engagement_sent: boolean;
  engagement_sent_at: string | null;
  client?: {
    name: string;
    email: string;
    phone: string;
  };
}

export function ClientRetentionAI() {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [retentionScores, setRetentionScores] = useState<RetentionScore[]>([]);
  const [selectedTab, setSelectedTab] = useState("all");

  const loadRetentionScores = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: scores, error } = await supabase
        .from("client_retention_scores")
        .select(`
          *,
          client:clients(name, email, phone)
        `)
        .eq("user_id", user.id)
        .order("risk_score", { ascending: false });

      if (error) throw error;

      setRetentionScores(scores || []);
    } catch (error: any) {
      toast.error("Failed to load retention scores: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    try {
      setAnalyzing(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/client-retention-analyzer`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Analysis failed");

      const result = await response.json();
      toast.success(`Analyzed ${result.analyzed} clients successfully`);
      await loadRetentionScores();
    } catch (error: any) {
      toast.error("Failed to run analysis: " + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const sendEngagement = async (scoreId: string, clientId: string, type: 'email' | 'sms') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const score = retentionScores.find(s => s.id === scoreId);
      if (!score) return;

      const message = `Hi ${score.client?.name}! We've missed you at our medspa. ${score.recommended_actions[0]} Book now and receive a special offer!`;

      await supabase.from("retention_campaigns").insert({
        user_id: user.id,
        client_id: clientId,
        retention_score_id: scoreId,
        campaign_type: type,
        message,
        status: 'pending',
      });

      await supabase
        .from("client_retention_scores")
        .update({
          engagement_sent: true,
          engagement_sent_at: new Date().toISOString(),
        })
        .eq("id", scoreId);

      toast.success(`${type === 'email' ? 'Email' : 'SMS'} campaign queued`);
      await loadRetentionScores();
    } catch (error: any) {
      toast.error("Failed to send engagement: " + error.message);
    }
  };

  useEffect(() => {
    loadRetentionScores();
  }, []);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const filteredScores = retentionScores.filter(score => {
    if (selectedTab === 'all') return true;
    return score.risk_level === selectedTab;
  });

  const stats = {
    high: retentionScores.filter(s => s.risk_level === 'high').length,
    medium: retentionScores.filter(s => s.risk_level === 'medium').length,
    low: retentionScores.filter(s => s.risk_level === 'low').length,
    total: retentionScores.length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Smart Client Retention AI</h2>
          <p className="text-muted-foreground">
            AI-powered predictions to identify at-risk clients and automate re-engagement
          </p>
        </div>
        <Button onClick={runAnalysis} disabled={analyzing}>
          {analyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Run Analysis
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.high}</div>
            <p className="text-xs text-muted-foreground">Need immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medium Risk</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.medium}</div>
            <p className="text-xs text-muted-foreground">Monitor closely</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Risk</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.low}</div>
            <p className="text-xs text-muted-foreground">Healthy engagement</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Retention Analysis</CardTitle>
          <CardDescription>
            AI identifies at-risk clients based on visit patterns and engagement history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="high">High Risk ({stats.high})</TabsTrigger>
              <TabsTrigger value="medium">Medium Risk ({stats.medium})</TabsTrigger>
              <TabsTrigger value="low">Low Risk ({stats.low})</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="space-y-4 mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredScores.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No clients found. Click "Run Analysis" to analyze your client base.
                  </AlertDescription>
                </Alert>
              ) : (
                filteredScores.map((score) => (
                  <Card key={score.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{score.client?.name || 'Unknown Client'}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant={getRiskColor(score.risk_level) as any}>
                              {score.risk_level.toUpperCase()} RISK
                            </Badge>
                            {score.engagement_sent && (
                              <Badge variant="outline">Campaign Sent</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{score.risk_score}</div>
                          <div className="text-xs text-muted-foreground">Risk Score</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Churn Risk Level</span>
                          <span className="text-sm text-muted-foreground">{Math.round(score.risk_score)}%</span>
                        </div>
                        <SafeProgress value={score.risk_score} className="h-2" />
                        <ConfidenceBar confidence={Math.min(100, Math.max(0, 100 - (score.risk_score || 0)))} label="Retention Confidence" />
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Last Visit</div>
                          <div className="font-medium">{score.days_since_last_visit} days ago</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Total Visits</div>
                          <div className="font-medium">{score.total_visits}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Avg Interval</div>
                          <div className="font-medium">{score.average_visit_interval} days</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">Risk Factors:</div>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {score.reasons.map((reason, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-destructive mt-0.5">•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">AI Recommendations:</div>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {score.recommended_actions.map((action, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-primary mt-0.5">•</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {!score.engagement_sent && score.risk_level !== 'low' && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => sendEngagement(score.id, score.client_id, 'email')}
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            Send Email
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => sendEngagement(score.id, score.client_id, 'sms')}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Send SMS
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
