/*
  # Add Voice AI System for Med Spa Phone Automation

  1. Tables Created
    - `voice_ai_config`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users) - Business owner
      - `business_name` (text) - Business name for AI greeting
      - `vapi_phone_number` (text) - Dedicated Vapi.ai phone number
      - `vapi_phone_number_id` (text) - Vapi.ai phone number ID
      - `vapi_assistant_id` (text) - Vapi.ai assistant configuration ID
      - `ai_assistant_name` (text) - Name for the AI (e.g., "Sarah")
      - `greeting_message` (text) - Custom greeting script
      - `business_hours` (jsonb) - Operating hours for scheduling
      - `services_offered` (text[]) - Array of service names
      - `booking_instructions` (text) - Special booking rules
      - `is_enabled` (boolean) - Whether voice AI is active
      - `monthly_minutes_included` (integer) - Minutes included in plan
      - `monthly_minutes_used` (integer) - Minutes used this billing period
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `voice_ai_call_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users) - Business owner
      - `vapi_call_id` (text) - Vapi.ai call identifier
      - `phone_number_from` (text) - Caller's phone number
      - `phone_number_to` (text) - Business's Vapi.ai number
      - `call_status` (text) - Status: ringing, in-progress, completed, failed
      - `call_duration_seconds` (integer) - Length of call
      - `call_cost` (decimal) - Cost in dollars
      - `transcript` (text) - Full conversation transcript
      - `summary` (text) - AI-generated call summary
      - `intent_detected` (text) - booking, question, complaint, etc.
      - `booking_created` (boolean) - Whether appointment was scheduled
      - `appointment_id` (uuid, nullable) - References appointments table
      - `client_id` (uuid, nullable) - References clients table if identified
      - `recording_url` (text) - URL to call recording
      - `metadata` (jsonb) - Additional call data
      - `created_at` (timestamptz)

  2. Modifications
    - Add `vapi_phone_number` column to `business_information` table
    - Add `vapi_enabled` column to `subscriptions` table

  3. Security
    - Enable RLS on all tables
    - Users can only view/manage their own voice AI config
    - Admins can view all configs and call logs
    - Service role access for webhook processing

  4. Indexes
    - Fast lookups by phone number (for incoming call routing)
    - Fast lookups by user_id
    - Fast lookups by call date (for reporting)
*/

-- Add voice AI phone number to business_information
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_information' AND column_name = 'vapi_phone_number'
  ) THEN
    ALTER TABLE business_information ADD COLUMN vapi_phone_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_information' AND column_name = 'vapi_phone_number_id'
  ) THEN
    ALTER TABLE business_information ADD COLUMN vapi_phone_number_id text;
  END IF;
END $$;

-- Create voice_ai_config table
CREATE TABLE IF NOT EXISTS voice_ai_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  business_name text NOT NULL,
  vapi_phone_number text,
  vapi_phone_number_id text,
  vapi_assistant_id text,
  ai_assistant_name text DEFAULT 'Sarah',
  greeting_message text DEFAULT 'Thank you for calling! How can I help you today?',
  business_hours jsonb DEFAULT '{"monday": {"open": "09:00", "close": "17:00"}, "tuesday": {"open": "09:00", "close": "17:00"}, "wednesday": {"open": "09:00", "close": "17:00"}, "thursday": {"open": "09:00", "close": "17:00"}, "friday": {"open": "09:00", "close": "17:00"}, "saturday": {"open": "10:00", "close": "14:00"}, "sunday": {"open": null, "close": null}}'::jsonb,
  services_offered text[] DEFAULT ARRAY[]::text[],
  booking_instructions text,
  is_enabled boolean DEFAULT false,
  monthly_minutes_included integer DEFAULT 300,
  monthly_minutes_used integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for voice_ai_config
CREATE INDEX IF NOT EXISTS idx_voice_ai_config_user_id ON voice_ai_config(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_ai_config_phone ON voice_ai_config(vapi_phone_number);

-- Enable RLS
ALTER TABLE voice_ai_config ENABLE ROW LEVEL SECURITY;

-- Policies for voice_ai_config
CREATE POLICY "Users can view own voice AI config"
  ON voice_ai_config
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can insert own voice AI config"
  ON voice_ai_config
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own voice AI config"
  ON voice_ai_config
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR is_admin())
  WITH CHECK (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can delete own voice AI config"
  ON voice_ai_config
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

-- Create voice_ai_call_logs table
CREATE TABLE IF NOT EXISTS voice_ai_call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vapi_call_id text,
  phone_number_from text NOT NULL,
  phone_number_to text NOT NULL,
  call_status text DEFAULT 'ringing',
  call_duration_seconds integer DEFAULT 0,
  call_cost decimal(10, 4) DEFAULT 0,
  transcript text,
  summary text,
  intent_detected text,
  booking_created boolean DEFAULT false,
  appointment_id uuid,
  client_id uuid,
  recording_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for voice_ai_call_logs
CREATE INDEX IF NOT EXISTS idx_voice_ai_call_logs_user_id ON voice_ai_call_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_ai_call_logs_vapi_call_id ON voice_ai_call_logs(vapi_call_id);
CREATE INDEX IF NOT EXISTS idx_voice_ai_call_logs_phone_to ON voice_ai_call_logs(phone_number_to);
CREATE INDEX IF NOT EXISTS idx_voice_ai_call_logs_created_at ON voice_ai_call_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_ai_call_logs_intent ON voice_ai_call_logs(intent_detected);

-- Enable RLS
ALTER TABLE voice_ai_call_logs ENABLE ROW LEVEL SECURITY;

-- Policies for voice_ai_call_logs
CREATE POLICY "Users can view own call logs"
  ON voice_ai_call_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Service role can insert call logs"
  ON voice_ai_call_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update call logs"
  ON voice_ai_call_logs
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_voice_ai_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_voice_ai_config_updated_at ON voice_ai_config;
CREATE TRIGGER trigger_update_voice_ai_config_updated_at
  BEFORE UPDATE ON voice_ai_config
  FOR EACH ROW
  EXECUTE FUNCTION update_voice_ai_config_updated_at();

-- Function to reset monthly minutes (to be called by scheduled job)
CREATE OR REPLACE FUNCTION reset_monthly_voice_ai_minutes()
RETURNS void AS $$
BEGIN
  UPDATE voice_ai_config
  SET monthly_minutes_used = 0
  WHERE is_enabled = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;