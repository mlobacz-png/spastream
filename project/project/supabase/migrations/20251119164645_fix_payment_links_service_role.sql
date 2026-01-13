/*
  # Fix Payment Links Service Role Access

  1. Changes
    - Add explicit INSERT policy for service role to create payment links
    - This allows the edge function to create payment links on behalf of users

  2. Security
    - Service role can insert payment links (needed for edge function)
    - All other policies remain restrictive and secure
*/

-- Service role can insert payment links (for edge function)
CREATE POLICY "Service role can insert payment links"
  ON payment_links
  FOR INSERT
  TO service_role
  WITH CHECK (true);