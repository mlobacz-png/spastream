'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestVapiManual() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testWebhook = async () => {
    setLoading(true);
    setResult(null);

    const testPayload = {
      type: "end-of-call-report",
      call: {
        id: "test-call-" + Date.now(),
        phoneNumberId: "test-phone-id",
        customer: {
          number: "+1234567890"
        }
      },
      phoneNumber: {
        number: "17759087306"
      },
      duration: 120,
      cost: 0.50,
      status: "completed",
      transcript: "Test call transcript. Customer: Hello. Assistant: Hi, how can I help you today? Customer: I'd like to book a facial. Assistant: Great! Let me help you with that.",
      summary: "Customer called to inquire about booking a facial treatment."
    };

    try {
      const response = await fetch(
        'https://kviciiartofmqbsbrqii.supabase.co/functions/v1/vapi-webhook',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2aWNpaWFydG9mbXFic2JycWlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NDgyOTYsImV4cCI6MjA3NzQyNDI5Nn0.eP0CLyu6A94MamhTS4ULlDKLbE80qF4-nXV7t0mlX-Y'
          },
          body: JSON.stringify(testPayload)
        }
      );

      const data = await response.json();
      setResult({
        status: response.status,
        data: data
      });
    } catch (error: any) {
      setResult({
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const checkLogs = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/check-logs');
      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Test Vapi Webhook Manually</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={testWebhook} disabled={loading}>
              Send Test Webhook
            </Button>
            <Button onClick={checkLogs} disabled={loading} variant="outline">
              Check Call Logs
            </Button>
          </div>

          {loading && <p>Loading...</p>}

          {result && (
            <div className="mt-4">
              <h3 className="font-bold mb-2">Result:</h3>
              <pre className="bg-slate-100 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
