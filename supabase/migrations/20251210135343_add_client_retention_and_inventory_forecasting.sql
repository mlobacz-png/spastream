/*
  # Add Smart Client Retention and Inventory Forecasting Features

  1. New Tables
    - `client_retention_scores`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users) - The business owner
      - `client_id` (uuid, references clients)
      - `risk_score` (integer, 0-100, higher = more risk)
      - `risk_level` (text, 'low' | 'medium' | 'high')
      - `days_since_last_visit` (integer)
      - `total_visits` (integer)
      - `average_visit_interval` (integer, in days)
      - `last_visit_date` (timestamptz)
      - `predicted_churn_date` (timestamptz)
      - `reasons` (jsonb, array of contributing factors)
      - `recommended_actions` (jsonb, array of suggested re-engagement strategies)
      - `engagement_sent` (boolean, default false)
      - `engagement_sent_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `inventory_forecasts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users) - The business owner
      - `product_id` (uuid, references inventory_products)
      - `current_quantity` (integer)
      - `daily_usage_rate` (decimal)
      - `predicted_stockout_date` (timestamptz)
      - `days_until_stockout` (integer)
      - `recommended_order_quantity` (integer)
      - `confidence_score` (integer, 0-100)
      - `upcoming_appointments_count` (integer)
      - `historical_usage_trend` (text, 'increasing' | 'stable' | 'decreasing')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `retention_campaigns`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `client_id` (uuid, references clients)
      - `retention_score_id` (uuid, references client_retention_scores)
      - `campaign_type` (text, 'email' | 'sms' | 'call')
      - `message` (text)
      - `status` (text, 'pending' | 'sent' | 'delivered' | 'failed')
      - `sent_at` (timestamptz)
      - `delivered_at` (timestamptz)
      - `opened_at` (timestamptz)
      - `clicked_at` (timestamptz)
      - `response_received` (boolean, default false)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Authenticated users can manage their own retention scores and forecasts
    - Service role can access all data for AI processing
*/

-- Client Retention Scores Table
CREATE TABLE IF NOT EXISTS client_retention_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  risk_score integer NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level text NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  days_since_last_visit integer NOT NULL DEFAULT 0,
  total_visits integer NOT NULL DEFAULT 0,
  average_visit_interval integer DEFAULT 0,
  last_visit_date timestamptz,
  predicted_churn_date timestamptz,
  reasons jsonb DEFAULT '[]'::jsonb,
  recommended_actions jsonb DEFAULT '[]'::jsonb,
  engagement_sent boolean DEFAULT false,
  engagement_sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, client_id)
);

-- Inventory Forecasts Table
CREATE TABLE IF NOT EXISTS inventory_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES inventory_products(id) ON DELETE CASCADE NOT NULL,
  current_quantity integer NOT NULL DEFAULT 0,
  daily_usage_rate decimal(10,2) NOT NULL DEFAULT 0,
  predicted_stockout_date timestamptz,
  days_until_stockout integer,
  recommended_order_quantity integer DEFAULT 0,
  confidence_score integer NOT NULL DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  upcoming_appointments_count integer DEFAULT 0,
  historical_usage_trend text CHECK (historical_usage_trend IN ('increasing', 'stable', 'decreasing')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Retention Campaigns Table
CREATE TABLE IF NOT EXISTS retention_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  retention_score_id uuid REFERENCES client_retention_scores(id) ON DELETE CASCADE,
  campaign_type text NOT NULL CHECK (campaign_type IN ('email', 'sms', 'call')),
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  response_received boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE client_retention_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_retention_scores
CREATE POLICY "Users can view own retention scores"
  ON client_retention_scores FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own retention scores"
  ON client_retention_scores FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own retention scores"
  ON client_retention_scores FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own retention scores"
  ON client_retention_scores FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to retention scores"
  ON client_retention_scores FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for inventory_forecasts
CREATE POLICY "Users can view own inventory forecasts"
  ON inventory_forecasts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inventory forecasts"
  ON inventory_forecasts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory forecasts"
  ON inventory_forecasts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own inventory forecasts"
  ON inventory_forecasts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to inventory forecasts"
  ON inventory_forecasts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for retention_campaigns
CREATE POLICY "Users can view own retention campaigns"
  ON retention_campaigns FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own retention campaigns"
  ON retention_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own retention campaigns"
  ON retention_campaigns FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own retention campaigns"
  ON retention_campaigns FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to retention campaigns"
  ON retention_campaigns FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_retention_scores_user_id ON client_retention_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_retention_scores_client_id ON client_retention_scores(client_id);
CREATE INDEX IF NOT EXISTS idx_retention_scores_risk_level ON client_retention_scores(risk_level);
CREATE INDEX IF NOT EXISTS idx_inventory_forecasts_user_id ON inventory_forecasts(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_forecasts_product_id ON inventory_forecasts(product_id);
CREATE INDEX IF NOT EXISTS idx_retention_campaigns_user_id ON retention_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_retention_campaigns_client_id ON retention_campaigns(client_id);