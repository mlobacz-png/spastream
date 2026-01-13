/*
  # Enable pg_net Extension

  1. Changes
    - Enables the pg_net extension for making HTTP requests from database triggers
    - Required for the welcome email trigger to call the edge function

  2. Notes
    - pg_net allows async HTTP requests from PostgreSQL
    - Used by the send_welcome_email_on_signup() trigger function
*/

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- Grant usage to authenticated users
GRANT USAGE ON SCHEMA net TO authenticated;
GRANT USAGE ON SCHEMA net TO service_role;
