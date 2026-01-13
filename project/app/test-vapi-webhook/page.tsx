"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function TestVapiWebhook() {
  const [webhookUrl, setWebhookUrl] = useState(
    "https://kviciiartofmqbsbrqii.supabase.co/functions/v1/vapi-webhook"
  );
  const [testPayload, setTestPayload] = useState(JSON.stringify({
    type: "assistant-request",
    call: {
      id: "test-call-" + Date.now(),
      phoneNumberId: "test-phone-id",
      customer: {
        number: "+15551234567"
      }
    },
    phoneNumber: {
      number: "17759087306"
    }
  }, null, 2));
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [voiceConfig, setVoiceConfig] = useState<any>(null);

  const testWebhook = async () => {
    setLoading(true);
    setResponse(null);
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: testPayload,
      });

      const data = await res.json();
      setResponse({
        status: res.status,
        statusText: res.statusText,
        data: data,
      });
    } catch (error: any) {
      setResponse({
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const testFullCallFlow = async () => {
    setLoading(true);
    setResponse(null);
    const callId = "test-call-" + Date.now();

    try {
      // Step 1: assistant-request (creates log)
      const step1 = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "assistant-request",
          call: {
            id: callId,
            phoneNumberId: "test-phone-id",
            customer: { number: "+15551234567" }
          },
          phoneNumber: { number: "17759087306" }
        })
      });
      const data1 = await step1.json();

      // Step 2: status-update
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "status-update",
          call: {
            id: callId,
            phoneNumberId: "test-phone-id",
            customer: { number: "+15551234567" }
          },
          status: "in-progress"
        })
      });

      // Step 3: end-of-call-report (updates log)
      const step3 = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "end-of-call-report",
          call: {
            id: callId,
            phoneNumberId: "test-phone-id",
            customer: { number: "+15551234567" }
          },
          phoneNumber: { number: "17759087306" },
          transcript: "Test call: Customer inquired about Botox pricing.",
          summary: "Pricing inquiry for Botox treatment.",
          duration: 120,
          cost: 0.05
        })
      });
      const data3 = await step3.json();

      setResponse({
        step1: { status: step1.status, data: data1 },
        step3: { status: step3.status, data: data3 },
        message: "Full call flow completed! Check database to see the log."
      });
    } catch (error: any) {
      setResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const checkDatabase = async () => {
    setLoading(true);
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Check voice config
      const { data: config, error: configError } = await supabase
        .from("voice_ai_config")
        .select("*")
        .limit(5);

      if (configError) {
        console.error("Config error:", configError);
      } else {
        setVoiceConfig(config);
      }

      // Check call logs
      const { data: logs, error: logsError } = await supabase
        .from("voice_ai_call_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (logsError) {
        console.error("Logs error:", logsError);
      } else {
        setCallLogs(logs || []);
      }
    } catch (error: any) {
      console.error("Database check error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Vapi Webhook Diagnostics</h1>

      <div className="grid gap-6">
        {/* Test Webhook */}
        <Card>
          <CardHeader>
            <CardTitle>1. Test Webhook Endpoint</CardTitle>
            <CardDescription>
              Send a test payload to your webhook to verify it's working
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Webhook URL</Label>
              <Input
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
            </div>

            <div>
              <Label>Test Payload (JSON)</Label>
              <Textarea
                value={testPayload}
                onChange={(e) => setTestPayload(e.target.value)}
                rows={15}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={testWebhook} disabled={loading}>
                {loading ? "Testing..." : "Send Custom Payload"}
              </Button>
              <Button onClick={testFullCallFlow} disabled={loading} variant="default">
                {loading ? "Testing..." : "Test Full Call Flow (Recommended)"}
              </Button>
            </div>

            {response && (
              <div className="mt-4 p-4 bg-gray-100 rounded-md">
                <h3 className="font-semibold mb-2">Response:</h3>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Check Database */}
        <Card>
          <CardHeader>
            <CardTitle>2. Check Database Tables</CardTitle>
            <CardDescription>
              Verify your voice AI configuration and call logs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={checkDatabase} disabled={loading}>
              {loading ? "Checking..." : "Check Database"}
            </Button>

            {voiceConfig && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Voice AI Configuration:</h3>
                <div className="p-4 bg-gray-100 rounded-md">
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(voiceConfig, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {callLogs.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Recent Call Logs:</h3>
                <div className="p-4 bg-gray-100 rounded-md">
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(callLogs, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {callLogs.length === 0 && voiceConfig && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  No call logs found. This means the webhook hasn't received any events yet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>3. Troubleshooting Steps</CardTitle>
            <CardDescription className="mt-2">
              If minutes are updating but no call logs appear, Vapi is likely NOT sending the webhook URL correctly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="font-semibold text-sm mb-2">Most Common Issue:</h4>
              <p className="text-sm mb-2">
                The webhook URL needs to be configured in TWO places in Vapi:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-sm ml-2">
                <li>On your <strong>Phone Number</strong> settings (this is what's missing!)</li>
                <li>On your <strong>Assistant</strong> settings</li>
              </ol>
            </div>

            <ol className="list-decimal list-inside space-y-3 text-sm">
              <li>
                <strong>Test the webhook locally first:</strong>
                <br />
                Click "Test Full Call Flow" button above. If this creates a log, your webhook works!
              </li>
              <li>
                <strong>Add webhook to Vapi Phone Number:</strong>
                <br />
                Go to Vapi Dashboard → Phone Numbers → Your Number (17759087306) → Server URL
                <br />
                <code className="block mt-1 px-2 py-1 bg-gray-100 rounded text-xs">
                  https://kviciiartofmqbsbrqii.supabase.co/functions/v1/vapi-webhook
                </code>
              </li>
              <li>
                <strong>Add webhook to Vapi Assistant:</strong>
                <br />
                Go to Vapi Dashboard → Assistants → Your Assistant → Server URL (same URL as above)
              </li>
              <li>
                <strong>Make a test call:</strong> After configuring both, call 1-775-908-7306 and then check the database
              </li>
              <li>
                <strong>Check Supabase Logs:</strong> Supabase Dashboard → Edge Functions → vapi-webhook → Logs
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
