'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2 } from 'lucide-react';
import { getSubscriptionPlans, formatPrice, type SubscriptionPlan } from '@/lib/subscription-utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface PlanSelectionProps {
  onComplete?: () => void;
}

export function PlanSelection({ onComplete }: PlanSelectionProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    setLoading(true);
    const data = await getSubscriptionPlans();
    setPlans(data);
    setLoading(false);
  }

  async function handleSelectPlan(planId: string) {
    setSubscribing(true);
    setSelectedPlan(planId);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get plan details
      const plan = plans.find(p => p.id === planId);
      if (!plan) {
        throw new Error('Plan not found');
      }

      // Create Stripe Checkout session
      const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-subscription-checkout`;
      const headers = {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          planId: plan.id,
          planName: plan.name,
          planPrice: plan.price,
          userId: user.id,
          userEmail: user.email,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error starting subscription:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to start subscription. Please try again.',
        variant: 'destructive',
      });
      setSelectedPlan(null);
      setSubscribing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const planFeatures: Record<string, string[]> = {
    'Starter': [
      'Up to 100 clients',
      '1 provider',
      'Calendar & scheduling',
      'Client management',
      'Revenue tracking',
      'Email reminders',
      'Online booking page'
    ],
    'Professional': [
      'Up to 500 clients',
      'Up to 3 providers',
      'Everything in Starter, plus:',
      'Stripe payment processing',
      'Invoice generation',
      'SMS communications (100/mo)',
      'Treatment packages',
      'AI features (limited)',
      'Basic analytics'
    ],
    'Premium': [
      'Unlimited clients',
      'Up to 10 providers',
      'Everything in Professional, plus:',
      'Unlimited SMS',
      'Advanced analytics',
      'Full AI suite',
      'Priority support',
      'Custom integrations',
      'Dedicated account manager'
    ],
    'Enterprise': [
      'Unlimited everything',
      'Unlimited providers',
      'Everything in Premium, plus:',
      'Multi-location support',
      'White-label options',
      'Custom development',
      'SLA guarantee',
      '24/7 phone support',
      'Onboarding & training'
    ]
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-slate-600 mb-2">
          Start with a 14-day free trial. Add your payment method to get started.
        </p>
        <Badge className="bg-green-100 text-green-700 border-0">
          Cancel anytime • No charge until trial ends
        </Badge>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isPopular = plan.name === 'Professional';
          const features = planFeatures[plan.name] || [];

          return (
            <Card
              key={plan.id}
              className={`relative ${isPopular ? 'border-blue-500 border-2 shadow-xl' : 'border-2'}`}
            >
              {isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{formatPrice(plan.price)}</span>
                  <span className="text-slate-600">/month</span>
                  <p className="text-xs text-slate-500 mt-2">14-day free trial, then {formatPrice(plan.price)}/month</p>
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-6 min-h-[300px]">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${isPopular ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' : ''}`}
                  variant={isPopular ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={subscribing}
                >
                  {subscribing && selectedPlan === plan.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading Checkout...
                    </>
                  ) : (
                    'Continue to Checkout'
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
