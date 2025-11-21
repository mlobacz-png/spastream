/*
  # Platform Revenue Tracking & Fee System

  ## Overview
  Complete system for tracking med spa monthly revenues and calculating platform fees.
  - 0.5% platform fee on revenue over $50,000/month
  - Med spas use their own Stripe accounts (already implemented)
  - Platform owner invoices med spas monthly for the fee

  ## New Tables

  ### `platform_monthly_revenue`
  Tracks total monthly revenue for each med spa business
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users) - Med spa owner
  - `month` (date) - First day of the month (e.g., 2025-11-01)
  - `total_revenue` (decimal) - Total revenue processed through platform
  - `revenue_over_threshold` (decimal) - Amount over $50,000 threshold
  - `platform_fee_amount` (decimal) - 0.5% fee on revenue over threshold
  - `platform_fee_paid` (boolean) - Whether fee has been paid
  - `platform_invoice_id` (uuid) - Link to platform fee invoice
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - Unique constraint on (user_id, month)

  ### `platform_fee_invoices`
  Invoices for platform fees owed by med spas
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users) - Med spa owner
  - `monthly_revenue_id` (uuid, foreign key to platform_monthly_revenue)
  - `invoice_number` (text, unique) - Format: PF-YYYYMM-XXX
  - `billing_month` (date) - Month being billed for
  - `total_revenue` (decimal) - Their total revenue for the month
  - `billable_amount` (decimal) - Revenue over $50k threshold
  - `fee_amount` (decimal) - 0.5% platform fee
  - `status` (text) - pending, paid, overdue, cancelled
  - `due_date` (date) - Payment due date
  - `paid_at` (timestamptz) - When payment was received
  - `payment_method` (text) - How they paid
  - `payment_reference` (text) - Transaction reference
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Functions

  ### `calculate_monthly_revenue(user_id, month_start)`
  Calculates total revenue for a user in a specific month by summing all completed transactions

  ### `update_platform_monthly_revenue()`
  Trigger function that automatically updates monthly revenue when transactions are completed

  ### `generate_platform_fee_invoice_number()`
  Auto-generates unique invoice numbers in format PF-YYYYMM-XXX

  ## Security
  - RLS enabled on all tables
  - Med spas can view their own revenue and fee data
  - Platform admins (with is_admin=true) can view all data
  - Only admins can create/update platform fee invoices

  ## Important Notes
  1. Revenue threshold is $50,000 per month
  2. Platform fee is 0.5% on amounts over the threshold
  3. Example: $73,000 revenue = $115 platform fee (0.5% of $23,000)
  4. Invoices are generated monthly
  5. Med spas already have their own Stripe accounts configured
*/

-- Platform Monthly Revenue Table
CREATE TABLE IF NOT EXISTS platform_monthly_revenue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month date NOT NULL,
  total_revenue decimal DEFAULT 0,
  revenue_over_threshold decimal DEFAULT 0,
  platform_fee_amount decimal DEFAULT 0,
  platform_fee_paid boolean DEFAULT false,
  platform_invoice_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, month)
);

ALTER TABLE platform_monthly_revenue ENABLE ROW LEVEL SECURITY;

-- Users can view their own monthly revenue
CREATE POLICY "Users can view own monthly revenue"
  ON platform_monthly_revenue FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all monthly revenue
CREATE POLICY "Admins can view all monthly revenue"
  ON platform_monthly_revenue FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_app_meta_data->>'is_admin' = 'true'
    )
  );

-- System can insert/update monthly revenue records
CREATE POLICY "System can manage monthly revenue"
  ON platform_monthly_revenue FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Platform Fee Invoices Table
CREATE TABLE IF NOT EXISTS platform_fee_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  monthly_revenue_id uuid REFERENCES platform_monthly_revenue(id) ON DELETE SET NULL,
  invoice_number text UNIQUE NOT NULL,
  billing_month date NOT NULL,
  total_revenue decimal NOT NULL,
  billable_amount decimal NOT NULL,
  fee_amount decimal NOT NULL,
  status text DEFAULT 'pending',
  due_date date DEFAULT CURRENT_DATE + INTERVAL '30 days',
  paid_at timestamptz,
  payment_method text DEFAULT '',
  payment_reference text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled'))
);

ALTER TABLE platform_fee_invoices ENABLE ROW LEVEL SECURITY;

-- Users can view their own platform fee invoices
CREATE POLICY "Users can view own platform fee invoices"
  ON platform_fee_invoices FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all platform fee invoices
CREATE POLICY "Admins can view all platform fee invoices"
  ON platform_fee_invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_app_meta_data->>'is_admin' = 'true'
    )
  );

-- Admins can create platform fee invoices
CREATE POLICY "Admins can create platform fee invoices"
  ON platform_fee_invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_app_meta_data->>'is_admin' = 'true'
    )
  );

-- Admins can update platform fee invoices
CREATE POLICY "Admins can update platform fee invoices"
  ON platform_fee_invoices FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_app_meta_data->>'is_admin' = 'true'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_app_meta_data->>'is_admin' = 'true'
    )
  );

-- Add foreign key constraint for platform_invoice_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'platform_monthly_revenue_invoice_fkey'
  ) THEN
    ALTER TABLE platform_monthly_revenue
    ADD CONSTRAINT platform_monthly_revenue_invoice_fkey
    FOREIGN KEY (platform_invoice_id)
    REFERENCES platform_fee_invoices(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Function to calculate monthly revenue
CREATE OR REPLACE FUNCTION calculate_monthly_revenue(
  p_user_id uuid,
  p_month_start date
)
RETURNS TABLE (
  total_revenue decimal,
  revenue_over_threshold decimal,
  platform_fee decimal
) AS $$
DECLARE
  v_total_revenue decimal;
  v_revenue_over_threshold decimal;
  v_platform_fee decimal;
  v_threshold decimal := 50000;
  v_fee_rate decimal := 0.005; -- 0.5%
BEGIN
  -- Calculate total revenue from completed transactions in the month
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_revenue
  FROM transactions
  WHERE user_id = p_user_id
    AND status = 'completed'
    AND transaction_type IN ('payment', 'deposit')
    AND DATE_TRUNC('month', processed_at) = p_month_start;

  -- Calculate revenue over threshold
  v_revenue_over_threshold := GREATEST(v_total_revenue - v_threshold, 0);
  
  -- Calculate platform fee (0.5% of revenue over $50k)
  v_platform_fee := v_revenue_over_threshold * v_fee_rate;

  RETURN QUERY SELECT v_total_revenue, v_revenue_over_threshold, v_platform_fee;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update monthly revenue record
CREATE OR REPLACE FUNCTION update_monthly_revenue_record()
RETURNS TRIGGER AS $$
DECLARE
  v_month_start date;
  v_revenue_data record;
BEGIN
  -- Only process completed transactions
  IF NEW.status = 'completed' AND NEW.transaction_type IN ('payment', 'deposit') THEN
    -- Get the first day of the month for the transaction
    v_month_start := DATE_TRUNC('month', NEW.processed_at)::date;
    
    -- Calculate revenue for this month
    SELECT * INTO v_revenue_data
    FROM calculate_monthly_revenue(NEW.user_id, v_month_start);
    
    -- Upsert the monthly revenue record
    INSERT INTO platform_monthly_revenue (
      user_id,
      month,
      total_revenue,
      revenue_over_threshold,
      platform_fee_amount,
      updated_at
    )
    VALUES (
      NEW.user_id,
      v_month_start,
      v_revenue_data.total_revenue,
      v_revenue_data.revenue_over_threshold,
      v_revenue_data.platform_fee,
      now()
    )
    ON CONFLICT (user_id, month)
    DO UPDATE SET
      total_revenue = EXCLUDED.total_revenue,
      revenue_over_threshold = EXCLUDED.revenue_over_threshold,
      platform_fee_amount = EXCLUDED.platform_fee_amount,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update monthly revenue when transactions complete
DROP TRIGGER IF EXISTS transaction_update_monthly_revenue ON transactions;
CREATE TRIGGER transaction_update_monthly_revenue
  AFTER INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_revenue_record();

-- Function to generate platform fee invoice numbers
CREATE OR REPLACE FUNCTION generate_platform_fee_invoice_number(p_billing_month date)
RETURNS text AS $$
DECLARE
  month_part text;
  sequence_part text;
  next_num integer;
BEGIN
  -- Format: PF-YYYYMM
  month_part := to_char(p_billing_month, 'YYYYMM');
  
  -- Get next sequence number for this month
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 12) AS integer)), 0) + 1
  INTO next_num
  FROM platform_fee_invoices
  WHERE invoice_number LIKE 'PF-' || month_part || '-%';
  
  sequence_part := LPAD(next_num::text, 3, '0');
  
  RETURN 'PF-' || month_part || '-' || sequence_part;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-update platform invoice totals
CREATE OR REPLACE FUNCTION calculate_platform_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  
  -- Auto-update paid status
  IF NEW.paid_at IS NOT NULL AND NEW.status = 'pending' THEN
    NEW.status := 'paid';
  END IF;
  
  -- Update monthly revenue record when invoice is paid
  IF NEW.status = 'paid' AND NEW.monthly_revenue_id IS NOT NULL THEN
    UPDATE platform_monthly_revenue
    SET platform_fee_paid = true
    WHERE id = NEW.monthly_revenue_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER platform_invoice_calculate_totals
  BEFORE INSERT OR UPDATE ON platform_fee_invoices
  FOR EACH ROW
  EXECUTE FUNCTION calculate_platform_invoice_totals();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_platform_monthly_revenue_user_id ON platform_monthly_revenue(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_monthly_revenue_month ON platform_monthly_revenue(month);
CREATE INDEX IF NOT EXISTS idx_platform_fee_invoices_user_id ON platform_fee_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_fee_invoices_status ON platform_fee_invoices(status);
CREATE INDEX IF NOT EXISTS idx_platform_fee_invoices_billing_month ON platform_fee_invoices(billing_month);
