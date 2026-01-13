/*
  # Fix Signup Notification with Correct Anon Key

  1. Changes
    - Update with the correct anon key from the project
*/

-- Drop and recreate the function with correct anon key
CREATE OR REPLACE FUNCTION notify_admin_of_new_signup()
RETURNS TRIGGER AS $$
DECLARE
  user_email text;
  plan_name text;
  plan_price integer;
  function_url text;
  request_id bigint;
BEGIN
  -- Get user email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.user_id;

  -- Get plan details
  SELECT name, price INTO plan_name, plan_price
  FROM subscription_plans
  WHERE id = NEW.plan_id;

  -- Use the Supabase URL
  function_url := 'https://kviciiartofmqbsbrqii.supabase.co/functions/v1/send-signup-notification';

  -- Call edge function via pg_net with authorization
  SELECT INTO request_id net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2aWNpaWFydG9mbXFic2JycWlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NDgyOTYsImV4cCI6MjA3NzQyNDI5Nn0.eP0CLyu6A94MamhTS4ULlDKLbE80qF4-nXV7t0mlX-Y'
    ),
    body := jsonb_build_object(
      'user_email', user_email,
      'plan_name', plan_name,
      'plan_price', plan_price,
      'status', NEW.status,
      'trial_ends_at', NEW.trial_ends_at
    )
  );

  -- Log the request for debugging
  RAISE LOG 'Signup notification triggered for user % with request_id %', user_email, request_id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE LOG 'Error sending signup notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
