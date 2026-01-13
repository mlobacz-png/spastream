/*
  # Add Welcome Email Trigger

  1. Changes
    - Creates a database function to trigger welcome email on new user signup
    - Adds a trigger that fires after user insert in auth.users
    - Calls the send-welcome-email edge function automatically

  2. Security
    - Function runs with SECURITY DEFINER to access auth schema
    - Only triggers on INSERT to auth.users table
*/

-- Create function to send welcome email via edge function
CREATE OR REPLACE FUNCTION public.send_welcome_email_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  service_role_key text;
  supabase_url text;
BEGIN
  -- Get Supabase URL and service role key from vault or use environment
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);
  
  -- If not set in settings, use default (will be set by Supabase)
  IF supabase_url IS NULL THEN
    supabase_url := 'https://kviciiartofmqbsbrqii.supabase.co';
  END IF;

  -- Make async HTTP request to edge function
  PERFORM
    net.http_post(
      url := supabase_url || '/functions/v1/send-welcome-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || coalesce(service_role_key, '')
      ),
      body := jsonb_build_object(
        'email', NEW.email,
        'name', COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
      )
    );

  RETURN NEW;
END;
$$;

-- Create trigger on auth.users table for new signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.send_welcome_email_on_signup();
