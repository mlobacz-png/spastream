/*
  # AI Features Schema for MedSpaFlow
  
  1. New Tables
    - `compliance_scans`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `scan_type` (text: ad, email, website)
      - `content` (text)
      - `state` (text: CA, NY, TX, etc.)
      - `risks` (jsonb: array of flagged issues)
      - `severity` (text: low, medium, high, critical)
      - `status` (text: pending, reviewed, resolved)
      - `created_at` (timestamp)
    
    - `booking_predictions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `appointment_id` (uuid, foreign key)
      - `client_id` (uuid, foreign key)
      - `no_show_probability` (decimal: 0-1)
      - `risk_factors` (jsonb)
      - `reminder_sent` (boolean)
      - `outcome` (text: showed, no_show, cancelled)
      - `created_at` (timestamp)
    
    - `treatment_recommendations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `client_id` (uuid, foreign key)
      - `photo_url` (text)
      - `analysis` (jsonb: skin analysis results)
      - `recommendations` (jsonb: treatment plan)
      - `estimated_cost` (decimal)
      - `status` (text: draft, presented, accepted, declined)
      - `created_at` (timestamp)
    
    - `pricing_rules`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `service` (text)
      - `base_price` (decimal)
      - `current_price` (decimal)
      - `demand_multiplier` (decimal)
      - `inventory_level` (integer)
      - `last_adjusted` (timestamp)
      - `created_at` (timestamp)
    
    - `staff_schedules`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `staff_name` (text)
      - `role` (text)
      - `shift_start` (timestamptz)
      - `shift_end` (timestamptz)
      - `tasks` (jsonb)
      - `performance_score` (decimal)
      - `created_at` (timestamp)
    
    - `reviews_monitoring`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `platform` (text: google, yelp, facebook)
      - `review_text` (text)
      - `rating` (integer)
      - `sentiment` (text: positive, neutral, negative)
      - `response_generated` (text)
      - `response_sent` (boolean)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on all tables
    - User-only access policies
    - Audit logging integration
  
  3. Indexes
    - Performance indexes for queries
    - Date-based indexes for time-series data
*/

-- Compliance Scans Table
CREATE TABLE IF NOT EXISTS compliance_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  scan_type text NOT NULL,
  content text NOT NULL,
  state text DEFAULT 'CA',
  risks jsonb DEFAULT '[]'::jsonb,
  severity text DEFAULT 'low',
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Booking Predictions Table
CREATE TABLE IF NOT EXISTS booking_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  no_show_probability decimal DEFAULT 0,
  risk_factors jsonb DEFAULT '{}'::jsonb,
  reminder_sent boolean DEFAULT false,
  outcome text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Treatment Recommendations Table
CREATE TABLE IF NOT EXISTS treatment_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  photo_url text DEFAULT '',
  analysis jsonb DEFAULT '{}'::jsonb,
  recommendations jsonb DEFAULT '[]'::jsonb,
  estimated_cost decimal DEFAULT 0,
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now()
);

-- Pricing Rules Table
CREATE TABLE IF NOT EXISTS pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service text NOT NULL,
  base_price decimal NOT NULL,
  current_price decimal NOT NULL,
  demand_multiplier decimal DEFAULT 1.0,
  inventory_level integer DEFAULT 0,
  last_adjusted timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Staff Schedules Table
CREATE TABLE IF NOT EXISTS staff_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  staff_name text NOT NULL,
  role text NOT NULL,
  shift_start timestamptz NOT NULL,
  shift_end timestamptz NOT NULL,
  tasks jsonb DEFAULT '[]'::jsonb,
  performance_score decimal DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Reviews Monitoring Table
CREATE TABLE IF NOT EXISTS reviews_monitoring (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform text NOT NULL,
  review_text text NOT NULL,
  rating integer NOT NULL,
  sentiment text DEFAULT 'neutral',
  response_generated text DEFAULT '',
  response_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_compliance_scans_user_id ON compliance_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_scans_created_at ON compliance_scans(created_at);
CREATE INDEX IF NOT EXISTS idx_booking_predictions_appointment_id ON booking_predictions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_treatment_recommendations_client_id ON treatment_recommendations(client_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_service ON pricing_rules(service);
CREATE INDEX IF NOT EXISTS idx_staff_schedules_user_id ON staff_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_monitoring_sentiment ON reviews_monitoring(sentiment);

-- Enable RLS
ALTER TABLE compliance_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews_monitoring ENABLE ROW LEVEL SECURITY;

-- Compliance Scans Policies
CREATE POLICY "Users can view own compliance scans"
  ON compliance_scans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own compliance scans"
  ON compliance_scans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own compliance scans"
  ON compliance_scans FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Booking Predictions Policies
CREATE POLICY "Users can view own predictions"
  ON booking_predictions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own predictions"
  ON booking_predictions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own predictions"
  ON booking_predictions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Treatment Recommendations Policies
CREATE POLICY "Users can view own recommendations"
  ON treatment_recommendations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recommendations"
  ON treatment_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendations"
  ON treatment_recommendations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Pricing Rules Policies
CREATE POLICY "Users can view own pricing rules"
  ON pricing_rules FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own pricing rules"
  ON pricing_rules FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Staff Schedules Policies
CREATE POLICY "Users can view own staff schedules"
  ON staff_schedules FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own staff schedules"
  ON staff_schedules FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Reviews Monitoring Policies
CREATE POLICY "Users can view own reviews"
  ON reviews_monitoring FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own reviews"
  ON reviews_monitoring FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);