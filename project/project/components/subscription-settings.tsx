'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Check, ArrowUpCircle, Clock, AlertCircle } from 'lucide-react';
import { getUserSubscription, getSubscriptionPlans, formatPrice, type UserSubscription, type SubscriptionPlan } from '@/lib/subscription-utils';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export function SubscriptionSettings() {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [clientCount, setClientCount] = useState(0);
  const [providerCount, setProviderCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const [subData, plansData] = await Promise.all([
      getUserSubscription(),
      getSubscriptionPlans(),
    ]);

    setSubscription(subData);
    setPlans(plansData);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const [clientsResult, providersResult] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('staff_members').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);

      setClientCount(clientsResult.count || 0);
      setProviderCount(providersResult.count || 0);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!subscription || !subscription.plan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
          <CardDescription>Choose a plan to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/onboarding?step=plan">
            <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
              Choose a Plan
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const currentPlan = subscription.plan;
  const features = currentPlan.features as Record<string, any>;
  const maxClients = features.max_clients;
  const maxProviders = features.max_providers;

  const clientProgress = maxClients === -1 ? 0 : (clientCount / maxClients) * 100;
  const providerProgress = maxProviders === -1 ? 0 : (providerCount / maxProviders) * 100;

  const daysUntilTrialEnd = subscription.trial_ends_at
    ? Math.ceil((new Date(subscription.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{currentPlan.name} Plan</CardTitle>
              <CardDescription>
                {formatPrice(currentPlan.price)} per month
              </CardDescription>
            </div>
            <Badge
              className={
                subscription.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : subscription.status === 'trialing'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-red-100 text-red-700'
              }
            >
              {subscription.status === 'trialing' ? 'Free Trial' : subscription.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {subscription.status === 'trialing' && daysUntilTrialEnd !== null && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Free Trial Active</p>
                <p className="text-sm text-blue-700">
                  {daysUntilTrialEnd} days remaining in your trial
                </p>
              </div>
            </div>
          )}

          <div>
            <h4 className="font-semibold mb-4">Usage Limits</h4>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Clients</span>
                  <span className="text-sm font-medium">
                    {clientCount} / {maxClients === -1 ? 'Unlimited' : maxClients}
                  </span>
                </div>
                {maxClients !== -1 && (
                  <>
                    <Progress value={clientProgress} className="h-2" />
                    {clientProgress > 80 && (
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Approaching limit. Consider upgrading.
                      </p>
                    )}
                  </>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Providers</span>
                  <span className="text-sm font-medium">
                    {providerCount} / {maxProviders === -1 ? 'Unlimited' : maxProviders}
                  </span>
                </div>
                {maxProviders !== -1 && (
                  <>
                    <Progress value={providerProgress} className="h-2" />
                    {providerProgress > 80 && (
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Approaching limit. Consider upgrading.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold mb-3">Plan Features</h4>
            <div className="grid grid-cols-2 gap-3">
              {features.payment_processing && (
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Payment Processing</span>
                </div>
              )}
              {features.sms_communications && (
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>SMS ({features.sms_monthly_limit === -1 ? 'Unlimited' : features.sms_monthly_limit}/mo)</span>
                </div>
              )}
              {features.treatment_packages && (
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Treatment Packages</span>
                </div>
              )}
              {features.ai_features && (
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>AI Features ({features.ai_features})</span>
                </div>
              )}
              {features.marketing_automation && (
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Marketing Automation</span>
                </div>
              )}
              {features.multi_location && (
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Multi-Location</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <Link href="/onboarding?step=plan">
              <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white" size="lg">
                <ArrowUpCircle className="w-4 h-4 mr-2" />
                Upgrade Plan
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>Compare plans and upgrade anytime</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`border rounded-lg p-4 ${
                  plan.id === subscription.plan_id ? 'border-blue-500 bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{plan.name}</h4>
                  {plan.id === subscription.plan_id && (
                    <Badge className="bg-blue-500 text-white">Current</Badge>
                  )}
                </div>
                <p className="text-2xl font-bold mb-1">{formatPrice(plan.price)}</p>
                <p className="text-sm text-slate-600">per month</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
