/*
  # Fix Invoice Portal Access Policy

  1. Changes
    - Drop the problematic "Clients can view their invoices via portal" policy
    - Recreate it using auth.jwt() instead of querying auth.users table
    - This avoids permission issues when accessing the auth schema

  2. Security
    - Maintains the same security model: clients can only see invoices linked to their portal access
    - Uses JWT email claim instead of querying auth.users table
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Clients can view their invoices via portal" ON invoices;

-- Recreate with corrected approach using auth.jwt()
CREATE POLICY "Clients can view their invoices via portal"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT client_id 
      FROM client_portal_access 
      WHERE email = (auth.jwt()->>'email')::text
        AND is_active = true
    )
  );
