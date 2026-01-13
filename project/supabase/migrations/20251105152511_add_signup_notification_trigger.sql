/*
  # Add Signup Notification System

  1. Changes
    - Create a database trigger that fires when a new subscription is created
    - Trigger calls the edge function to send admin notification email
    - Uses pg_net extension for making HTTP requests from database

  2. Notes
    - The pg_net extension must be enabled
    - ADMIN_EMAIL environment variable must be set
    - RESEND_API_KEY must be configured
*/

-- Create function to send signup notification
CREATE OR REPLACE FUNCTION notify_admin_of_new_signup()
RETURNS TRIGGER AS $$
DECLARE
  user_email text;
  plan_name text;
  plan_price integer;
  function_url text;
  supabase_anon_key text;
BEGIN
  -- Get user email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.user_id;

  -- Get plan details
  SELECT name, price INTO plan_name, plan_price
  FROM subscription_plans
  WHERE id = NEW.plan_id;

  -- Get Supabase function URL and anon key from environment
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-signup-notification';
  supabase_anon_key := current_setting('app.settings.supabase_anon_key', true);

  -- If settings are not available, use fallback (they should be set via environment)
  IF function_url IS NULL THEN
    function_url := 'https://kviciiartofmqbsbrqii.supabase.co/functions/v1/send-signup-notification';
  END IF;

  -- Call edge function via pg_net
  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(supabase_anon_key, '')
    ),
    body := jsonb_build_object(
      'user_email', user_email,
      'plan_name', plan_name,
      'plan_price', plan_price,
      'status', NEW.status,
      'trial_ends_at', NEW.trial_ends_at
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires after a new subscription is inserted
DROP TRIGGER IF EXISTS trigger_notify_admin_on_signup ON user_subscriptions;

CREATE TRIGGER trigger_notify_admin_on_signup
  AFTER INSERT ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_of_new_signup();