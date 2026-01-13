'use client';

import { useState, useEffect, ReactNode } from 'react';
import { hasFeatureAccess, getUserSubscription } from '@/lib/subscription-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, ArrowUpCircle } from 'lucide-react';
import Link from 'next/link';

interface FeatureGateProps {
  featureName: string;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

export function FeatureGate({
  featureName,
  children,
  fallback,
  showUpgradePrompt = true
}: FeatureGateProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [planName, setPlanName] = useState<string>('');

  useEffect(() => {
    checkAccess();
  }, [featureName]);

  async function checkAccess() {
    const access = await hasFeatureAccess(featureName);
    setHasAccess(access);

    const subscription = await getUserSubscription();
    if (subscription?.plan) {
      setPlanName(subscription.plan.name);
    }
  }

  if (hasAccess === null) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showUpgradePrompt) {
      return (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Feature Locked
                </CardTitle>
                <CardDescription>
                  Upgrade your plan to access this feature
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              {planName && `Your current plan (${planName}) doesn't include this feature. `}
              Upgrade to unlock advanced capabilities and grow your practice.
            </p>
            <Link href="/onboarding?step=plan">
              <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                <ArrowUpCircle className="w-4 h-4 mr-2" />
                Upgrade Plan
              </Button>
            </Link>
          </CardContent>
        </Card>
      );
    }

    return null;
  }

  return <>{children}</>;
}
