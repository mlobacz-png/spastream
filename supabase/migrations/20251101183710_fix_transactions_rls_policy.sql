/*
  # Fix Transactions RLS Policy

  1. Changes
    - Drop problematic policy that queries auth.users table
    - Recreate it using a more efficient approach with JWT claims
  
  2. Security
    - Maintains same security level
    - Avoids permission denied errors when inserting transactions
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Clients can view their transactions via portal" ON transactions;

-- Recreate with JWT-based approach (no auth.users query needed)
CREATE POLICY "Clients can view their transactions via portal"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT client_id FROM client_portal_access 
      WHERE email = auth.jwt()->>'email'
      AND is_active = true
    )
  );