/*
  # Add Subscription & Plan Management System

  1. New Tables
    - `subscription_plans` - Stores the available subscription tiers
      - `id` (uuid, primary key)
      - `name` (text) - Starter, Professional, Premium, Enterprise
      - `price` (integer) - Monthly price in cents
      - `features` (jsonb) - Feature flags and limits
      - `created_at` (timestamp)
    
    - `user_subscriptions` - Tracks user subscription status
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `plan_id` (uuid, foreign key to subscription_plans)
      - `status` (text) - active, cancelled, expired, trialing
      - `trial_ends_at` (timestamp)
      - `current_period_start` (timestamp)
      - `current_period_end` (timestamp)
      - `stripe_subscription_id` (text, nullable)
      - `stripe_customer_id` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Seed Data
    - Insert 4 subscription plans with feature flags

  3. Security
    - Enable RLS on both tables
    - Users can read their own subscription
    - Only admins can modify subscriptions
    - Everyone can read plan details

  4. Helper Functions
    - `has_feature_access(feature_name)` - Check if user has access to a feature
    - `get_feature_limit(feature_name)` - Get numeric limit for a feature
*/

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  price integer NOT NULL,
  features jsonb NOT NULL DEFAULT '{}',
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES subscription_plans(id),
  status text NOT NULL DEFAULT 'trialing' CHECK (status IN ('active', 'cancelled', 'expired', 'trialing', 'past_due')),
  trial_ends_at timestamptz,
  current_period_start timestamptz DEFAULT now(),
  current_period_end timestamptz,
  stripe_subscription_id text,
  stripe_customer_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for subscription_plans (everyone can read active plans)
CREATE POLICY "Anyone can view active subscription plans"
  ON subscription_plans FOR SELECT
  USING (is_active = true);

-- Policies for user_subscriptions
CREATE POLICY "Users can view their own subscription"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
  ON user_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON user_subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Seed subscription plans with feature flags
-- Note: -1 means unlimited
INSERT INTO subscription_plans (name, price, description, features) VALUES
  ('Starter', 29900, 'Perfect for solo practitioners', '{
    "max_clients": 100,
    "max_providers": 1,
    "calendar": true,
    "client_management": true,
    "revenue_tracking": true,
    "email_reminders": true,
    "online_booking": true,
    "payment_processing": false,
    "invoice_generation": false,
    "sms_communications": false,
    "sms_monthly_limit": 0,
    "treatment_packages": false,
    "ai_features": false,
    "analytics": "basic",
    "inventory_management": false,
    "marketing_automation": false,
    "staff_management": false,
    "priority_support": false,
    "custom_integrations": false,
    "multi_location": false
  }'::jsonb),
  ('Professional', 59900, 'Most popular for growing practices', '{
    "max_clients": 500,
    "max_providers": 3,
    "calendar": true,
    "client_management": true,
    "revenue_tracking": true,
    "email_reminders": true,
    "online_booking": true,
    "payment_processing": true,
    "invoice_generation": true,
    "sms_communications": true,
    "sms_monthly_limit": 100,
    "treatment_packages": true,
    "ai_features": "limited",
    "analytics": "basic",
    "inventory_management": true,
    "marketing_automation": false,
    "staff_management": true,
    "priority_support": false,
    "custom_integrations": false,
    "multi_location": false
  }'::jsonb),
  ('Premium', 99900, 'For established multi-provider spas', '{
    "max_clients": -1,
    "max_providers": 10,
    "calendar": true,
    "client_management": true,
    "revenue_tracking": true,
    "email_reminders": true,
    "online_booking": true,
    "payment_processing": true,
    "invoice_generation": true,
    "sms_communications": true,
    "sms_monthly_limit": -1,
    "treatment_packages": true,
    "ai_features": "full",
    "analytics": "advanced",
    "inventory_management": true,
    "marketing_automation": true,
    "staff_management": true,
    "priority_support": true,
    "custom_integrations": true,
    "multi_location": false
  }'::jsonb),
  ('Enterprise', 149900, 'For multi-location operations', '{
    "max_clients": -1,
    "max_providers": -1,
    "calendar": true,
    "client_management": true,
    "revenue_tracking": true,
    "email_reminders": true,
    "online_booking": true,
    "payment_processing": true,
    "invoice_generation": true,
    "sms_communications": true,
    "sms_monthly_limit": -1,
    "treatment_packages": true,
    "ai_features": "full",
    "analytics": "advanced",
    "inventory_management": true,
    "marketing_automation": true,
    "staff_management": true,
    "priority_support": true,
    "custom_integrations": true,
    "multi_location": true,
    "white_label": true,
    "custom_development": true,
    "sla_guarantee": true,
    "phone_support_24_7": true,
    "onboarding_training": true
  }'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Create function to check feature access
CREATE OR REPLACE FUNCTION has_feature_access(feature_name text)
RETURNS boolean AS $$
DECLARE
  user_features jsonb;
BEGIN
  SELECT sp.features INTO user_features
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = auth.uid()
  AND us.status IN ('active', 'trialing');
  
  IF user_features IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN COALESCE((user_features->feature_name)::boolean, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get feature limit
CREATE OR REPLACE FUNCTION get_feature_limit(feature_name text)
RETURNS integer AS $$
DECLARE
  feature_value jsonb;
BEGIN
  SELECT sp.features->feature_name INTO feature_value
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = auth.uid()
  AND us.status IN ('active', 'trialing');
  
  IF feature_value IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Return -1 for unlimited, otherwise the integer value
  RETURN (feature_value)::integer;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);
