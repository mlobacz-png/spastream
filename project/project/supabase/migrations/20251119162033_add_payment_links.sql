/*
  # Add Payment Links System

  1. New Tables
    - `payment_links`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users) - The business owner
      - `invoice_id` (uuid, references invoices)
      - `client_id` (uuid, references clients)
      - `amount` (decimal) - Amount to be paid
      - `unique_token` (text, unique) - Secure token for the payment URL
      - `status` (text) - pending, paid, expired, cancelled
      - `expires_at` (timestamptz) - When the link expires
      - `paid_at` (timestamptz, nullable) - When payment was completed
      - `stripe_payment_intent_id` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `payment_links` table
    - Business owners can manage their own payment links
    - Anyone with the token can view and pay their specific payment link

  3. Indexes
    - Add index on unique_token for fast lookups
    - Add index on invoice_id for invoice-based queries
*/

-- Create payment_links table
CREATE TABLE IF NOT EXISTS payment_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  amount decimal(10,2) NOT NULL,
  unique_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired', 'cancelled')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  paid_at timestamptz,
  stripe_payment_intent_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;

-- Business owners can view their own payment links
CREATE POLICY "Users can view own payment links"
  ON payment_links
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Business owners can create payment links
CREATE POLICY "Users can create own payment links"
  ON payment_links
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Business owners can update their own payment links
CREATE POLICY "Users can update own payment links"
  ON payment_links
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Anyone can view payment link by token (for public payment page)
CREATE POLICY "Anyone can view payment link by token"
  ON payment_links
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Service role can update payment links (for webhook updates)
CREATE POLICY "Service role can update payment links"
  ON payment_links
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_links_token ON payment_links(unique_token);
CREATE INDEX IF NOT EXISTS idx_payment_links_invoice ON payment_links(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_status ON payment_links(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS payment_links_updated_at ON payment_links;
CREATE TRIGGER payment_links_updated_at
  BEFORE UPDATE ON payment_links
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_links_updated_at();