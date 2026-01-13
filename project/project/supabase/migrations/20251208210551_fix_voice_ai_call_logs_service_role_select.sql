/*
  # Fix Voice AI Call Logs Service Role Access

  1. Changes
    - Add SELECT policy for service_role on voice_ai_call_logs table
    - This allows admin tools and internal APIs to read call logs

  2. Security
    - Only service_role can use this policy
    - Regular users still protected by existing RLS policies
*/

-- Add service role SELECT policy for voice_ai_call_logs
CREATE POLICY "Service role can view all call logs"
  ON voice_ai_call_logs
  FOR SELECT
  TO service_role
  USING (true);
