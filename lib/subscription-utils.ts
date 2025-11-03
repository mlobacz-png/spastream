import { supabase } from './supabase';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: Record<string, any>;
  is_active: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'trialing' | 'past_due';
  trial_ends_at: string | null;
  current_period_start: string;
  current_period_end: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  plan?: SubscriptionPlan;
}

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true });

  if (error) {
    console.error('Error fetching subscription plans:', error);
    return [];
  }

  return data || [];
}

export async function getUserSubscription(): Promise<UserSubscription | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('user_subscriptions')
    .select(`
      *,
      plan:subscription_plans(*)
    `)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user subscription:', error);
    return null;
  }

  return data;
}

export async function createUserSubscription(planId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return false;

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  const { error } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: user.id,
      plan_id: planId,
      status: 'trialing',
      trial_ends_at: trialEndsAt.toISOString(),
      current_period_start: new Date().toISOString()
    });

  if (error) {
    console.error('Error creating subscription:', error);
    return false;
  }

  return true;
}

export async function updateUserSubscription(planId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return false;

  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      plan_id: planId,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id);

  if (error) {
    console.error('Error updating subscription:', error);
    return false;
  }

  return true;
}

export async function hasFeatureAccess(featureName: string): Promise<boolean> {
  const subscription = await getUserSubscription();

  if (!subscription || !subscription.plan) return false;
  if (subscription.status !== 'active' && subscription.status !== 'trialing') return false;

  const features = subscription.plan.features as Record<string, any>;
  return features[featureName] === true || features[featureName] === 'full' || features[featureName] === 'limited';
}

export async function getFeatureLimit(featureName: string): Promise<number> {
  const subscription = await getUserSubscription();

  if (!subscription || !subscription.plan) return 0;
  if (subscription.status !== 'active' && subscription.status !== 'trialing') return 0;

  const features = subscription.plan.features as Record<string, any>;
  const value = features[featureName];

  if (typeof value === 'number') {
    return value;
  }

  return 0;
}

export async function canAddClient(): Promise<{ allowed: boolean; message?: string }> {
  const subscription = await getUserSubscription();

  if (!subscription || !subscription.plan) {
    return { allowed: false, message: 'No active subscription found' };
  }

  const maxClients = (subscription.plan.features as any).max_clients;

  if (maxClients === -1) {
    return { allowed: true };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { allowed: false };

  const { count } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if ((count || 0) >= maxClients) {
    return {
      allowed: false,
      message: `You've reached your plan limit of ${maxClients} clients. Upgrade to add more.`
    };
  }

  return { allowed: true };
}

export async function canAddProvider(): Promise<{ allowed: boolean; message?: string }> {
  const subscription = await getUserSubscription();

  if (!subscription || !subscription.plan) {
    return { allowed: false, message: 'No active subscription found' };
  }

  const maxProviders = (subscription.plan.features as any).max_providers;

  if (maxProviders === -1) {
    return { allowed: true };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { allowed: false };

  const { count } = await supabase
    .from('staff_members')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if ((count || 0) >= maxProviders) {
    return {
      allowed: false,
      message: `You've reached your plan limit of ${maxProviders} providers. Upgrade to add more.`
    };
  }

  return { allowed: true };
}

export function formatPrice(priceInCents: number): string {
  return `$${(priceInCents / 100).toFixed(0)}`;
}
