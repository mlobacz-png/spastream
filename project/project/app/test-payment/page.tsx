"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, CreditCard, Settings, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TestPaymentPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<"setup" | "test">("setup");
  const [stripePublishableKey, setStripePublishableKey] = useState("");
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      checkStripeSetup();
    }
  }, [user]);

  const checkStripeSetup = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("payment_settings")
      .select("stripe_publishable_key, stripe_secret_key")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data?.stripe_publishable_key && data?.stripe_secret_key) {
      setStripePublishableKey(data.stripe_publishable_key);
      setStripeSecretKey(data.stripe_secret_key);
      setStep("test");
    }
  };

  const handleSaveStripeKeys = async () => {
    if (!user) return;

    setError("");
    setSaving(true);

    if (!stripePublishableKey.startsWith("pk_")) {
      setError("Publishable key should start with 'pk_'");
      setSaving(false);
      return;
    }

    if (!stripeSecretKey.startsWith("sk_")) {
      setError("Secret key should start with 'sk_'");
      setSaving(false);
      return;
    }

    const { data: existing } = await supabase
      .from("payment_settings")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("payment_settings")
        .update({
          stripe_publishable_key: stripePublishableKey,
          stripe_secret_key: stripeSecretKey,
          payment_methods: ["card", "cash", "check"],
        })
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("payment_settings")
        .insert({
          user_id: user.id,
          stripe_publishable_key: stripePublishableKey,
          stripe_secret_key: stripeSecretKey,
          payment_methods: ["card", "cash", "check"],
        });
    }

    setSaving(false);
    setStep("test");
  };

  const handleTestPayment = async () => {
    if (!user) return;

    setTesting(true);
    setError("");
    setTestResult(null);

    try {
      // Create a test client if one doesn't exist
      const { data: testClient } = await supabase
        .from("clients")
        .select("id, name, email")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      let clientId = testClient?.id;
      let clientEmail = testClient?.email || "test@example.com";

      if (!testClient) {
        const { data: newClient } = await supabase
          .from("clients")
          .insert({
            user_id: user.id,
            name: "Test Client",
            email: "test@example.com",
            phone: "555-0100",
          })
          .select()
          .single();

        clientId = newClient?.id;
        clientEmail = newClient?.email;
      }

      // Call the payment processing function
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-payment`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: 100.00,
            clientId: clientId,
            clientEmail: clientEmail,
            description: "Test Payment - $100.00",
          }),
        }
      );

      const result = await response.json();

      if (result.error) {
        setError(result.error);
      } else {
        setTestResult({
          success: true,
          clientSecret: result.clientSecret,
          paymentIntentId: result.paymentIntentId,
        });
      }
    } catch (err: any) {
      setError(err.message || "Payment test failed");
    }

    setTesting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Test Payment System</h1>
          <p className="text-gray-600">
            Set up and test your Stripe payment integration
          </p>
        </div>

        {step === "setup" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Step 1: Configure Stripe Keys
              </CardTitle>
              <CardDescription>
                Add your Stripe API keys to enable payment processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertDescription>
                  <strong>Where to find your keys:</strong>
                  <ol className="list-decimal ml-4 mt-2 space-y-1">
                    <li>Go to <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Stripe Dashboard → API Keys</a></li>
                    <li>Make sure you're in <strong>Live Mode</strong> (toggle off "Test mode")</li>
                    <li>Copy both the Publishable key (pk_live_...) and Secret key (sk_live_...)</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="publishable">Stripe Publishable Key</Label>
                  <Input
                    id="publishable"
                    type="text"
                    placeholder="pk_live_..."
                    value={stripePublishableKey}
                    onChange={(e) => setStripePublishableKey(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Starts with pk_live_ (for production) or pk_test_ (for testing)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secret">Stripe Secret Key</Label>
                  <Input
                    id="secret"
                    type="password"
                    placeholder="sk_live_..."
                    value={stripeSecretKey}
                    onChange={(e) => setStripeSecretKey(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Starts with sk_live_ (for production) or sk_test_ (for testing)
                  </p>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleSaveStripeKeys}
                  disabled={saving || !stripePublishableKey || !stripeSecretKey}
                  className="flex-1"
                >
                  {saving ? "Saving..." : "Save Keys & Continue"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/app")}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "test" && (
          <div className="space-y-6">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <p className="font-medium">Stripe keys configured successfully!</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Step 2: Test Payment Processing
                </CardTitle>
                <CardDescription>
                  Create a test $100 payment to verify everything works
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <AlertDescription>
                    This will create a Payment Intent in Stripe for $100.00.
                    {stripeSecretKey.includes("test")
                      ? " Since you're using test keys, no real money will be charged."
                      : " You're using LIVE keys - this will create a real payment intent."}
                  </AlertDescription>
                </Alert>

                <div className="bg-gray-50 border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Test Details:</h3>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Amount: $100.00</li>
                    <li>• Client: Test Client</li>
                    <li>• Description: Test Payment</li>
                  </ul>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {testResult && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      <p className="font-semibold text-green-700 mb-2">Payment Intent Created!</p>
                      <div className="text-sm text-green-600 space-y-1">
                        <p><strong>Payment Intent ID:</strong> {testResult.paymentIntentId}</p>
                        <p className="text-xs mt-2">
                          Check your <a href="https://dashboard.stripe.com/payments" target="_blank" rel="noopener noreferrer" className="underline">Stripe Dashboard</a> to see the payment intent.
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleTestPayment}
                    disabled={testing}
                    className="flex-1"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    {testing ? "Processing..." : "Create Test Payment"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setStep("setup")}
                  >
                    Back to Setup
                  </Button>
                </div>

                {testResult && (
                  <div className="pt-4 border-t">
                    <Button
                      onClick={() => router.push("/app")}
                      variant="outline"
                      className="w-full"
                    >
                      Go to Dashboard
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {stripeSecretKey.includes("test") && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-blue-900 mb-2">Using Test Mode</h3>
                  <p className="text-sm text-blue-700">
                    You can use these test card numbers in Stripe:
                  </p>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1">
                    <li>• <strong>Success:</strong> 4242 4242 4242 4242</li>
                    <li>• <strong>Decline:</strong> 4000 0000 0000 0002</li>
                    <li>• Use any future expiry date and any 3-digit CVC</li>
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
