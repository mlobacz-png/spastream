/*
  # Fix Invoices RLS Policies

  ## Changes
  - Drop existing policies that incorrectly require admin access
  - Create new policies that allow users to access their own invoices
  - Maintain client portal access for viewing invoices

  ## Security
  - Users can only manage their own invoices (user_id = auth.uid())
  - Clients can view their invoices via portal access
  - All policies check authentication
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can insert own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can update own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can delete own invoices" ON invoices;

-- Create corrected policies
CREATE POLICY "Users can view own invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own invoices"
  ON invoices FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
