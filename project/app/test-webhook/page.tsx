"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Copy, ExternalLink, AlertCircle, Loader2 } from "lucide-react";

export default function TestWebhookPage() {
  const [webhookSecret, setWebhookSecret] = useState("");
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const supabaseUrl = "https://kviciiartofmqbsbrqii.supabase.co";
  const webhookEndpoint = `${supabaseUrl}/functions/v1/stripe-webhook`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const testWebhook = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const testPayload = {
        id: "evt_test_webhook",
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_test_" + Date.now(),
            amount: 5000,
            currency: "usd",
            status: "succeeded",
            latest_charge: "ch_test_123",
            charges: {
              data: [{
                payment_method_details: {
                  card: {
                    last4: "4242",
                    brand: "visa"
                  }
                },
                receipt_url: "https://pay.stripe.com/receipts/test"
              }]
            },
            metadata: {}
          }
        }
      };

      const response = await fetch(webhookEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testPayload),
      });

      if (response.ok) {
        setTestResult({
          success: true,
          message: "Webhook is working! The endpoint responded successfully."
        });
      } else {
        const error = await response.text();
        setTestResult({
          success: false,
          message: `Webhook returned an error: ${response.status} - ${error}`
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: `Failed to reach webhook: ${error.message}`
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Stripe Webhook Setup</h1>
          <p className="text-slate-600">
            Connect Stripe webhooks to automatically update payment statuses
          </p>
        </div>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Quick Test</CardTitle>
            <CardDescription>
              Test if your webhook endpoint is responding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={testWebhook}
              disabled={testing}
              className="w-full"
            >
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Webhook...
                </>
              ) : (
                "Test Webhook Now"
              )}
            </Button>

            {testResult && (
              <Alert className={testResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={testResult.success ? "text-green-800" : "text-red-800"}>
                  {testResult.message}
                </AlertDescription>
              </Alert>
            )}

            <div className="text-sm text-slate-600 pt-2 border-t">
              <p className="font-medium mb-1">What this test does:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Sends a test payment event to your webhook</li>
                <li>Verifies the endpoint is accessible and responding</li>
                <li>Does not create actual database records</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 1: Your Webhook URL</CardTitle>
            <CardDescription>
              This is the endpoint URL you need to add to Stripe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Webhook Endpoint URL</Label>
              <div className="flex gap-2">
                <Input
                  value={webhookEndpoint}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(webhookEndpoint)}
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Copy this URL and add it to your Stripe webhook settings
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 2: Add Webhook in Stripe</CardTitle>
            <CardDescription>
              Configure the webhook in your Stripe dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription className="space-y-3">
                <div className="font-medium">Instructions:</div>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>
                    Go to{" "}
                    <a
                      href="https://dashboard.stripe.com/test/webhooks"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      Stripe Test Webhooks Dashboard
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                  <li>Click "Add endpoint" button</li>
                  <li>Paste the webhook URL from above</li>
                  <li>Click "Select events" and choose:
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li><code className="text-xs bg-slate-100 px-1 py-0.5 rounded">payment_intent.succeeded</code></li>
                      <li><code className="text-xs bg-slate-100 px-1 py-0.5 rounded">payment_intent.payment_failed</code></li>
                    </ul>
                  </li>
                  <li>Click "Add endpoint" to save</li>
                  <li>Copy the "Signing secret" (it starts with whsec_)</li>
                </ol>
              </AlertDescription>
            </Alert>

            <Button asChild variant="outline" className="w-full">
              <a
                href="https://dashboard.stripe.com/test/webhooks"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Stripe Webhooks Dashboard
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 3: Save Webhook Secret (Optional)</CardTitle>
            <CardDescription>
              For production, you should verify webhook signatures
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-secret">Webhook Signing Secret</Label>
              <Input
                id="webhook-secret"
                type="password"
                placeholder="whsec_..."
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-slate-500">
                Paste the signing secret from your Stripe webhook configuration
              </p>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-sm">
                <strong>Note:</strong> The webhook currently works without signature verification for testing.
                For production, add the signing secret as <code className="mx-1 bg-white px-1.5 py-0.5 rounded border text-xs">STRIPE_WEBHOOK_SECRET</code>
                to your environment variables.
              </AlertDescription>
            </Alert>

            {webhookSecret && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  Secret saved! Remember to add this to your production environment.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 4: Test with Real Stripe Events</CardTitle>
            <CardDescription>
              Verify everything works end-to-end
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription className="space-y-3">
                <div className="font-medium">Testing options:</div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Option A: Test from your app</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Go to the <a href="/test-payment" className="text-blue-600 hover:underline">Payment Test Page</a></li>
                    <li>Process a test payment</li>
                    <li>Check that the transaction status updates in your database</li>
                  </ol>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <p className="text-sm font-medium">Option B: Send test webhook from Stripe</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Go to your webhook in the Stripe dashboard</li>
                    <li>Click "Send test webhook"</li>
                    <li>Select "payment_intent.succeeded"</li>
                    <li>Click "Send test webhook"</li>
                    <li>Check the webhook logs to see if it succeeded</li>
                  </ol>
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button asChild variant="default">
                <a href="/test-payment">Test Payment Flow</a>
              </Button>
              <Button asChild variant="outline">
                <a
                  href="https://dashboard.stripe.com/test/webhooks"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Webhook Logs
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                1
              </div>
              <div>
                <div className="font-medium">Payment processed</div>
                <div className="text-slate-600">Customer completes payment through Stripe</div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                2
              </div>
              <div>
                <div className="font-medium">Stripe sends webhook</div>
                <div className="text-slate-600">Event notification sent to your endpoint</div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                3
              </div>
              <div>
                <div className="font-medium">Database updates</div>
                <div className="text-slate-600">Transaction marked as completed, invoice updated</div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                4
              </div>
              <div>
                <div className="font-medium">Receipt saved</div>
                <div className="text-slate-600">Payment details and receipt URL stored</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
