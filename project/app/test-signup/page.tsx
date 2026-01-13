'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { UserPlus, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TestSignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('testpassword123');
  const [planId, setPlanId] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [plans, setPlans] = useState<any[]>([]);

  useState(() => {
    fetchPlans();
  });

  async function fetchPlans() {
    const { data } = await supabase
      .from('subscription_plans')
      .select('id, name, price, description')
      .eq('is_active', true)
      .order('price');

    if (data) {
      setPlans(data);
      if (data.length > 0) setPlanId(data[0].id);
    }
  }

  async function handleTestSignup() {
    if (!email || !planId) {
      setStatus('error');
      setMessage('Please fill in all fields');
      return;
    }

    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      // Step 1: Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
        },
      });

      if (authError) throw new Error(`Auth error: ${authError.message}`);
      if (!authData.user) throw new Error('User creation failed');

      // Step 2: Create subscription (this will trigger the notification)
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14 day trial

      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const { error: subError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: authData.user.id,
          plan_id: planId,
          status: 'trialing',
          trial_ends_at: trialEndsAt.toISOString(),
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd.toISOString(),
        });

      if (subError) throw new Error(`Subscription error: ${subError.message}`);

      setStatus('success');
      setMessage(
        `Test signup successful! A notification email should be sent to your admin email. Check /admin/subscribers to see the new user.`
      );

      // Clear form
      setEmail('');
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'An error occurred during signup');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link href="/admin/subscribers">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Subscribers
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Signup & Notification</CardTitle>
            <CardDescription>
              Create a test user and trigger the admin notification email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="test@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password (auto-filled)</Label>
              <Input
                id="password"
                type="text"
                value={password}
                disabled
                className="bg-slate-50"
              />
              <p className="text-xs text-slate-500">Password is auto-generated for testing</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan">Subscription Plan *</Label>
              <Select value={planId} onValueChange={setPlanId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - ${(plan.price / 100).toFixed(2)}/mo
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> This will create a real test user with a 14-day trial and trigger the admin notification email.
              </p>
            </div>

            <Button
              onClick={handleTestSignup}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Test Signup...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Test Signup
                </>
              )}
            </Button>

            {status === 'success' && (
              <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Success!</p>
                  <p>{message}</p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Error</p>
                  <p>{message}</p>
                </div>
              </div>
            )}

            <div className="pt-4 border-t space-y-2">
              <Link href="/admin/subscribers">
                <Button variant="outline" className="w-full">
                  View Subscribers
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
