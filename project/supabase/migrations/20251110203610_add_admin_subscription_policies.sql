/*
  # Add Admin Policies for Subscriptions

  1. Security Changes
    - Add policy allowing admins to view all subscriptions
    - Add policy allowing admins to delete any subscription
*/

-- Allow admins to view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (is_admin());

-- Allow admins to delete any subscription
CREATE POLICY "Admins can delete any subscription"
  ON user_subscriptions FOR DELETE
  TO authenticated
  USING (is_admin());
