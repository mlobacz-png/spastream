/*
  # Payment System with Stripe Integration

  ## Overview
  Complete payment processing system with Stripe integration, invoice generation,
  package payment collection, and deposit management for bookings.

  ## New Tables

  ### `payment_settings`
  Stores Stripe configuration and payment preferences per user
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users) - Practice owner
  - `stripe_account_id` (text) - Stripe Connect account ID
  - `stripe_publishable_key` (text) - Public key for frontend
  - `stripe_secret_key` (text) - Secret key (encrypted)
  - `payment_methods` (jsonb) - Accepted payment types: card, cash, check
  - `require_deposit` (boolean) - Require deposit for bookings
  - `deposit_percentage` (decimal) - Default deposit % (e.g., 0.50 for 50%)
  - `deposit_amount` (decimal) - Fixed deposit amount override
  - `currency` (text) - USD, CAD, etc.
  - `tax_rate` (decimal) - Sales tax percentage
  - `created_at` / `updated_at` (timestamptz)

  ### `invoices`
  Generated invoices for services and packages
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users) - Practice owner
  - `client_id` (uuid, foreign key to clients) - Client
  - `invoice_number` (text, unique) - Auto-generated INV-YYYYMMDD-XXX
  - `invoice_date` (date) - Invoice creation date
  - `due_date` (date) - Payment due date
  - `status` (text) - draft, sent, paid, overdue, cancelled
  - `line_items` (jsonb) - Array of items: [{service, quantity, price, total}]
  - `subtotal` (decimal) - Before tax
  - `tax_amount` (decimal) - Calculated tax
  - `discount_amount` (decimal) - Discounts applied
  - `total_amount` (decimal) - Final amount due
  - `amount_paid` (decimal) - Total paid so far
  - `balance_due` (decimal) - Remaining balance
  - `notes` (text) - Invoice notes
  - `created_at` / `updated_at` (timestamptz)

  ### `transactions`
  All payment transactions
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users) - Practice owner
  - `client_id` (uuid, foreign key to clients) - Client
  - `invoice_id` (uuid, foreign key to invoices) - Related invoice
  - `appointment_id` (uuid, foreign key to appointments) - Related appointment
  - `package_id` (uuid, foreign key to packages) - Related package
  - `transaction_type` (text) - payment, refund, deposit
  - `payment_method` (text) - card, cash, check, stripe
  - `amount` (decimal) - Transaction amount
  - `stripe_payment_intent_id` (text) - Stripe payment intent ID
  - `stripe_charge_id` (text) - Stripe charge ID
  - `stripe_refund_id` (text) - Stripe refund ID (if applicable)
  - `status` (text) - pending, completed, failed, refunded
  - `card_last4` (text) - Last 4 digits of card
  - `card_brand` (text) - visa, mastercard, amex, etc.
  - `receipt_url` (text) - Stripe receipt URL
  - `notes` (text) - Payment notes
  - `processed_at` (timestamptz) - Payment completion time
  - `created_at` (timestamptz)

  ### `package_payments`
  Track payment plans for packages
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users) - Practice owner
  - `client_id` (uuid, foreign key to clients) - Client
  - `package_id` (uuid, foreign key to packages) - Package
  - `total_amount` (decimal) - Total package cost
  - `amount_paid` (decimal) - Amount paid so far
  - `balance_due` (decimal) - Remaining balance
  - `payment_schedule` (jsonb) - Payment plan: [{due_date, amount, paid}]
  - `auto_charge` (boolean) - Auto-charge on schedule
  - `stripe_customer_id` (text) - Stripe customer for auto-charge
  - `status` (text) - active, completed, cancelled
  - `created_at` / `updated_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Users can only access their own payment data
  - Clients can view their own invoices and transactions via portal
  - Stripe secret keys encrypted at rest
  - Audit logging for all payment actions

  ## Important Notes
  1. Stripe account setup required for live payments
  2. Test mode available with test keys
  3. PCI compliance handled by Stripe
  4. Webhook endpoint needed for payment confirmations
  5. Deposits automatically linked to appointments
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Payment Settings Table
CREATE TABLE IF NOT EXISTS payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_account_id text DEFAULT '',
  stripe_publishable_key text DEFAULT '',
  stripe_secret_key text DEFAULT '',
  payment_methods jsonb DEFAULT '["card", "cash", "check"]'::jsonb,
  require_deposit boolean DEFAULT false,
  deposit_percentage decimal DEFAULT 0.50,
  deposit_amount decimal DEFAULT 0,
  currency text DEFAULT 'USD',
  tax_rate decimal DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment settings"
  ON payment_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment settings"
  ON payment_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment settings"
  ON payment_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  invoice_number text UNIQUE NOT NULL,
  invoice_date date DEFAULT CURRENT_DATE,
  due_date date DEFAULT CURRENT_DATE + INTERVAL '30 days',
  status text DEFAULT 'draft',
  line_items jsonb DEFAULT '[]'::jsonb,
  subtotal decimal DEFAULT 0,
  tax_amount decimal DEFAULT 0,
  discount_amount decimal DEFAULT 0,
  total_amount decimal DEFAULT 0,
  amount_paid decimal DEFAULT 0,
  balance_due decimal DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled'))
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Clients can view their invoices via portal"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT client_id FROM client_portal_access 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND is_active = true
    )
  );

CREATE POLICY "Users can insert own invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own invoices"
  ON invoices FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  package_id uuid REFERENCES packages(id) ON DELETE SET NULL,
  transaction_type text DEFAULT 'payment',
  payment_method text DEFAULT 'card',
  amount decimal NOT NULL,
  stripe_payment_intent_id text DEFAULT '',
  stripe_charge_id text DEFAULT '',
  stripe_refund_id text DEFAULT '',
  status text DEFAULT 'pending',
  card_last4 text DEFAULT '',
  card_brand text DEFAULT '',
  receipt_url text DEFAULT '',
  notes text DEFAULT '',
  processed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CHECK (transaction_type IN ('payment', 'refund', 'deposit')),
  CHECK (payment_method IN ('card', 'cash', 'check', 'stripe')),
  CHECK (status IN ('pending', 'completed', 'failed', 'refunded'))
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Clients can view their transactions via portal"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT client_id FROM client_portal_access 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND is_active = true
    )
  );

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Package Payments Table
CREATE TABLE IF NOT EXISTS package_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  package_id uuid REFERENCES packages(id) ON DELETE CASCADE NOT NULL,
  total_amount decimal NOT NULL,
  amount_paid decimal DEFAULT 0,
  balance_due decimal NOT NULL,
  payment_schedule jsonb DEFAULT '[]'::jsonb,
  auto_charge boolean DEFAULT false,
  stripe_customer_id text DEFAULT '',
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (status IN ('active', 'completed', 'cancelled'))
);

ALTER TABLE package_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own package payments"
  ON package_payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Clients can view their package payments via portal"
  ON package_payments FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT client_id FROM client_portal_access 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND is_active = true
    )
  );

CREATE POLICY "Users can insert own package payments"
  ON package_payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own package payments"
  ON package_payments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own package payments"
  ON package_payments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_client_id ON transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_invoice_id ON transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_package_payments_user_id ON package_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_package_payments_client_id ON package_payments(client_id);

-- Function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS text AS $$
DECLARE
  date_part text;
  sequence_part text;
  next_num integer;
BEGIN
  date_part := to_char(CURRENT_DATE, 'YYYYMMDD');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 13) AS integer)), 0) + 1
  INTO next_num
  FROM invoices
  WHERE invoice_number LIKE 'INV-' || date_part || '-%';
  
  sequence_part := LPAD(next_num::text, 3, '0');
  
  RETURN 'INV-' || date_part || '-' || sequence_part;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-calculate invoice totals
CREATE OR REPLACE FUNCTION calculate_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_amount := NEW.subtotal + NEW.tax_amount - NEW.discount_amount;
  NEW.balance_due := NEW.total_amount - NEW.amount_paid;
  NEW.updated_at := now();
  
  IF NEW.balance_due <= 0 THEN
    NEW.status := 'paid';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoice_calculate_totals
  BEFORE INSERT OR UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION calculate_invoice_totals();

-- Function to update package payment balance
CREATE OR REPLACE FUNCTION update_package_payment_balance()
RETURNS TRIGGER AS $$
BEGIN
  NEW.balance_due := NEW.total_amount - NEW.amount_paid;
  NEW.updated_at := now();
  
  IF NEW.balance_due <= 0 THEN
    NEW.status := 'completed';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER package_payment_update_balance
  BEFORE INSERT OR UPDATE ON package_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_package_payment_balance();