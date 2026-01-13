/*
  # Allow Portal Users to View Booking Settings

  1. Changes
    - Add policy for anonymous users to view booking settings
    - This allows client portal users to access the booking widget

  2. Security
    - Only read access to booking_settings
    - No write access for anonymous users
*/

-- Allow anonymous users to view booking settings for the booking widget
CREATE POLICY "Anyone can view booking settings"
  ON booking_settings FOR SELECT
  TO anon
  USING (true);