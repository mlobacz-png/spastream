"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { CreditCard, DollarSign, Percent, AlertCircle, CheckCircle, ExternalLink } from "lucide-react";

interface PaymentSettings {
  id?: string;
  stripe_account_id: string;
  stripe_publishable_key: string;
  stripe_secret_key: string;
  payment_methods: string[];
  require_deposit: boolean;
  deposit_percentage: number;
  deposit_amount: number;
  currency: string;
  tax_rate: number;
  pass_processing_fees: boolean;
  processing_fee_percentage: number;
  processing_fee_fixed: number;
}

export function PaymentSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [settings, setSettings] = useState<PaymentSettings>({
    stripe_account_id: "",
    stripe_publishable_key: "",
    stripe_secret_key: "",
    payment_methods: ["card", "cash", "check"],
    require_deposit: false,
    deposit_percentage: 50,
    deposit_amount: 0,
    currency: "USD",
    tax_rate: 0,
    pass_processing_fees: false,
    processing_fee_percentage: 2.9,
    processing_fee_fixed: 0.30,
  });
  const [usePercentage, setUsePercentage] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("payment_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setSettings({
        ...data,
        payment_methods: data.payment_methods || ["card", "cash", "check"],
      });
      setUsePercentage(data.deposit_amount === 0);
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setShowSuccess(false);

    const settingsToSave = {
      ...settings,
      user_id: user.id,
      deposit_percentage: usePercentage ? settings.deposit_percentage / 100 : 0,
      deposit_amount: usePercentage ? 0 : settings.deposit_amount,
    };

    const { error } = await supabase
      .from("payment_settings")
      .upsert(settingsToSave, { onConflict: "user_id" });

    if (!error) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }

    setSaving(false);
  };

  const togglePaymentMethod = (method: string) => {
    const methods = settings.payment_methods.includes(method)
      ? settings.payment_methods.filter((m) => m !== method)
      : [...settings.payment_methods, method];
    setSettings({ ...settings, payment_methods: methods });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Loading payment settings...</p>
        </div>
      </div>
    );
  }

  const isStripeConfigured = settings.stripe_publishable_key && settings.stripe_secret_key;

  return (
    <div className="space-y-6">
      {showSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Payment settings saved successfully!
          </AlertDescription>
        </Alert>
      )}

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          To accept online payments, you need a Stripe account. Without Stripe configuration,
          you can still track cash and check payments manually.
          <a
            href="https://dashboard.stripe.com/register"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 ml-2 text-cyan-600 hover:text-cyan-700 font-medium"
          >
            Create Stripe Account <ExternalLink className="h-3 w-3" />
          </a>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-cyan-600" />
            Stripe Integration
          </CardTitle>
          <CardDescription>
            Connect your Stripe account to accept online payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="stripe_publishable_key">Publishable Key</Label>
            <Input
              id="stripe_publishable_key"
              placeholder="pk_test_..."
              value={settings.stripe_publishable_key}
              onChange={(e) =>
                setSettings({ ...settings, stripe_publishable_key: e.target.value })
              }
            />
            <p className="text-xs text-gray-500">
              Find this in your Stripe Dashboard under Developers → API Keys
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stripe_secret_key">Secret Key</Label>
            <Input
              id="stripe_secret_key"
              type="password"
              placeholder="sk_test_..."
              value={settings.stripe_secret_key}
              onChange={(e) =>
                setSettings({ ...settings, stripe_secret_key: e.target.value })
              }
            />
            <p className="text-xs text-gray-500">
              Keep this secret! Never share your secret key publicly.
            </p>
          </div>

          {isStripeConfigured && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-800 font-medium">
                Stripe is configured and ready!
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-cyan-600" />
            Payment Methods
          </CardTitle>
          <CardDescription>
            Select which payment methods you accept
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {[
              { id: "card", label: "Credit/Debit Card", description: "Requires Stripe" },
              { id: "cash", label: "Cash", description: "In-person payment" },
              { id: "check", label: "Check", description: "Physical or digital checks" },
            ].map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium">{method.label}</p>
                  <p className="text-sm text-gray-500">{method.description}</p>
                </div>
                <Switch
                  checked={settings.payment_methods.includes(method.id)}
                  onCheckedChange={() => togglePaymentMethod(method.id)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-cyan-600" />
            Deposit Settings
          </CardTitle>
          <CardDescription>
            Require deposits for appointment bookings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Require Deposit</p>
              <p className="text-sm text-gray-500">
                Charge clients a deposit when booking online
              </p>
            </div>
            <Switch
              checked={settings.require_deposit}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, require_deposit: checked })
              }
            />
          </div>

          {settings.require_deposit && (
            <>
              <div className="space-y-2">
                <Label>Deposit Type</Label>
                <Select
                  value={usePercentage ? "percentage" : "fixed"}
                  onValueChange={(val) => setUsePercentage(val === "percentage")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage of Total</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {usePercentage ? (
                <div className="space-y-2">
                  <Label htmlFor="deposit_percentage">Deposit Percentage (%)</Label>
                  <Input
                    id="deposit_percentage"
                    type="number"
                    min="0"
                    max="100"
                    value={settings.deposit_percentage}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        deposit_percentage: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-xs text-gray-500">
                    Example: 50% means $50 deposit for a $100 service
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="deposit_amount">Deposit Amount ($)</Label>
                  <Input
                    id="deposit_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.deposit_amount}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        deposit_amount: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-xs text-gray-500">
                    Fixed deposit amount regardless of service cost
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-cyan-600" />
            Processing Fees
          </CardTitle>
          <CardDescription>
            Pass credit card processing fees to customers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Pass Fees to Customers</p>
              <p className="text-sm text-gray-500">
                Add processing fees to credit card payments
              </p>
            </div>
            <Switch
              checked={settings.pass_processing_fees}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, pass_processing_fees: checked })
              }
            />
          </div>

          {settings.pass_processing_fees && (
            <>
              <div className="space-y-2">
                <Label htmlFor="processing_fee_percentage">Fee Percentage (%)</Label>
                <Input
                  id="processing_fee_percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={settings.processing_fee_percentage}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      processing_fee_percentage: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-gray-500">
                  Standard Stripe fee is 2.9%
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="processing_fee_fixed">Fixed Fee per Transaction ($)</Label>
                <Input
                  id="processing_fee_fixed"
                  type="number"
                  min="0"
                  step="0.01"
                  value={settings.processing_fee_fixed}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      processing_fee_fixed: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-gray-500">
                  Standard Stripe fee is $0.30 per transaction
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Example:</strong> For a $100 charge, the customer will pay ${(100 + (100 * settings.processing_fee_percentage / 100) + settings.processing_fee_fixed).toFixed(2)}
                  (${(100 * settings.processing_fee_percentage / 100 + settings.processing_fee_fixed).toFixed(2)} processing fee)
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={settings.currency}
              onValueChange={(val) => setSettings({ ...settings, currency: val })}
            >
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD - US Dollar</SelectItem>
                <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="GBP">GBP - British Pound</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tax_rate">Sales Tax Rate (%)</Label>
            <Input
              id="tax_rate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={settings.tax_rate * 100}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  tax_rate: parseFloat(e.target.value) / 100 || 0,
                })
              }
            />
            <p className="text-xs text-gray-500">
              Applied automatically to all invoices
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={fetchSettings} disabled={saving}>
          Reset
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
