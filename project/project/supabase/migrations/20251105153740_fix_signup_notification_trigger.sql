/*
  # Fix Signup Notification Trigger

  1. Changes
    - Update the notification function to use the correct Supabase URL
    - Add better error handling
    - Use the pg_net extension properly
*/

-- Drop and recreate the function with correct URL
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

  -- Call edge function via pg_net (non-blocking)
  SELECT INTO request_id net.http_post(
    url := function_url,
    headers := '{"Content-Type": "application/json"}'::jsonb,
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