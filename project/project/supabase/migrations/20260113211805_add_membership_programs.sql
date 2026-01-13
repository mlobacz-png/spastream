/*
  # Add Client Membership Programs

  ## Overview
  Creates a recurring membership system for med spas to offer monthly subscriptions
  to clients. This enables predictable recurring revenue and builds client loyalty.

  ## New Tables

  ### `membership_tiers`
  Stores the membership packages/plans offered by the med spa:
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - Links to the med spa owner
  - `name` (text) - Membership name (e.g., "VIP Gold", "Elite Member")
  - `description` (text) - What the membership includes
  - `monthly_price` (numeric) - Monthly subscription cost
  - `discount_percentage` (numeric) - Automatic discount on all services
  - `benefits` (jsonb) - Array of membership perks
  - `points_multiplier` (numeric) - Loyalty points multiplier
  - `active` (boolean) - Whether clients can currently sign up
  - `created_at` (timestamptz) - When tier was created

  ### `client_memberships`
  Tracks which clients have active memberships:
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - Links to the med spa owner
  - `client_id` (uuid, foreign key) - Links to the client
  - `tier_id` (uuid, foreign key) - Links to membership tier
  - `status` (text) - 'active', 'paused', or 'cancelled'
  - `start_date` (date) - When membership began
  - `end_date` (date, nullable) - When membership ended (if cancelled)
  - `billing_cycle_day` (integer) - Day of month to charge (1-31)
  - `next_billing_date` (date) - Next scheduled charge date
  - `created_at` (timestamptz) - When membership was created

  ## Security
  - RLS enabled on both tables
  - Users can only manage their own membership tiers and client memberships
  - Proper foreign key constraints ensure data integrity
  - Policies restrict access to authenticated business owners only

  ## Notes
  - Multiple clients can subscribe to the same tier
  - Discount percentages are stored but auto-application requires checkout integration
  - Billing cycle day determines when recurring charges occur
  - Points multiplier is for future loyalty program integration
*/

-- Create membership_tiers table
CREATE TABLE IF NOT EXISTS membership_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  monthly_price numeric(10, 2) NOT NULL DEFAULT 0,
  discount_percentage numeric(5, 2) NOT NULL DEFAULT 0,
  benefits jsonb DEFAULT '[]'::jsonb,
  points_multiplier numeric(3, 2) NOT NULL DEFAULT 1.0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create client_memberships table
CREATE TABLE IF NOT EXISTS client_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tier_id uuid NOT NULL REFERENCES membership_tiers(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  billing_cycle_day integer NOT NULL DEFAULT 1,
  next_billing_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('active', 'paused', 'cancelled')),
  CONSTRAINT valid_billing_day CHECK (billing_cycle_day >= 1 AND billing_cycle_day <= 31)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_membership_tiers_user_id ON membership_tiers(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_tiers_active ON membership_tiers(active);
CREATE INDEX IF NOT EXISTS idx_client_memberships_user_id ON client_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_client_memberships_client_id ON client_memberships(client_id);
CREATE INDEX IF NOT EXISTS idx_client_memberships_tier_id ON client_memberships(tier_id);
CREATE INDEX IF NOT EXISTS idx_client_memberships_status ON client_memberships(status);
CREATE INDEX IF NOT EXISTS idx_client_memberships_next_billing ON client_memberships(next_billing_date);

-- Enable Row Level Security
ALTER TABLE membership_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_memberships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for membership_tiers

CREATE POLICY "Users can view own membership tiers"
  ON membership_tiers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own membership tiers"
  ON membership_tiers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own membership tiers"
  ON membership_tiers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own membership tiers"
  ON membership_tiers
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for client_memberships

CREATE POLICY "Users can view own client memberships"
  ON client_memberships
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own client memberships"
  ON client_memberships
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own client memberships"
  ON client_memberships
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own client memberships"
  ON client_memberships
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
