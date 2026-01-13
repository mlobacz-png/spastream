/*
  # Add Foreign Key for Payment Links to Users
  
  1. Changes
    - Add foreign key constraint from payment_links.user_id to auth.users.id
    - This enables Supabase to automatically join payment_links with user data
  
  2. Notes
    - Required for the payment page to fetch business information
    - Uses IF NOT EXISTS to prevent errors if constraint already exists
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'payment_links_user_id_fkey'
    AND table_name = 'payment_links'
  ) THEN
    ALTER TABLE payment_links
    ADD CONSTRAINT payment_links_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;
