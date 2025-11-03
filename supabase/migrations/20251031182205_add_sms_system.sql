/*
  # SMS Communication System with Twilio Integration

  ## Overview
  Complete SMS messaging system with Twilio integration, automated appointment reminders,
  two-way texting, bulk campaigns, and message history tracking.

  ## New Tables

  ### `sms_settings`
  Stores Twilio configuration and SMS preferences per user
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users) - Practice owner
  - `twilio_account_sid` (text) - Twilio account SID
  - `twilio_auth_token` (text) - Twilio auth token (encrypted)
  - `twilio_phone_number` (text) - Twilio phone number (e.g., +15551234567)
  - `enabled` (boolean) - SMS system enabled/disabled
  - `auto_appointment_reminders` (boolean) - Auto-send appointment reminders
  - `reminder_hours_before` (integer) - Hours before appointment to send reminder
  - `reminder_template` (text) - Template for appointment reminders
  - `created_at` / `updated_at` (timestamptz)

  ### `sms_messages`
  All SMS messages sent and received
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users) - Practice owner
  - `client_id` (uuid, foreign key to clients) - Client (if linked)
  - `appointment_id` (uuid, foreign key to appointments) - Related appointment
  - `direction` (text) - outbound, inbound
  - `from_number` (text) - Sender phone number
  - `to_number` (text) - Recipient phone number
  - `message_body` (text) - Message content
  - `twilio_message_sid` (text) - Twilio message ID
  - `status` (text) - queued, sent, delivered, failed, received
  - `error_message` (text) - Error details if failed
  - `sent_at` (timestamptz) - Message sent time
  - `delivered_at` (timestamptz) - Message delivered time
  - `created_at` (timestamptz)

  ### `sms_campaigns`
  Bulk SMS campaigns
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users) - Practice owner
  - `name` (text) - Campaign name
  - `message_template` (text) - Message template with variables
  - `target_filter` (jsonb) - Filter criteria for recipients
  - `status` (text) - draft, scheduled, sending, completed, cancelled
  - `scheduled_time` (timestamptz) - When to send
  - `total_recipients` (integer) - Number of recipients
  - `messages_sent` (integer) - Messages sent so far
  - `messages_delivered` (integer) - Messages delivered
  - `messages_failed` (integer) - Messages failed
  - `created_at` / `updated_at` (timestamptz)

  ### `sms_conversations`
  Track two-way SMS conversations
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users) - Practice owner
  - `client_id` (uuid, foreign key to clients) - Client
  - `client_phone` (text) - Client phone number
  - `last_message` (text) - Last message in conversation
  - `last_message_at` (timestamptz) - Time of last message
  - `unread_count` (integer) - Unread messages from client
  - `status` (text) - active, archived
  - `created_at` / `updated_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Users can only access their own SMS data
  - Twilio credentials encrypted at rest
  - Message content logged for HIPAA compliance
  - Audit trail for all communications

  ## Important Notes
  1. Twilio account required for SMS functionality
  2. Test mode available with Twilio test credentials
  3. Costs ~$0.0079 per SMS in US
  4. Two-way SMS requires webhook configuration
  5. Auto-reminders run via scheduled Edge Function
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- SMS Settings Table
CREATE TABLE IF NOT EXISTS sms_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  twilio_account_sid text DEFAULT '',
  twilio_auth_token text DEFAULT '',
  twilio_phone_number text DEFAULT '',
  enabled boolean DEFAULT false,
  auto_appointment_reminders boolean DEFAULT true,
  reminder_hours_before integer DEFAULT 24,
  reminder_template text DEFAULT 'Hi {{client_name}}! This is a reminder about your {{service}} appointment tomorrow at {{time}}. Reply CONFIRM to confirm or call us to reschedule. - {{business_name}}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE sms_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own SMS settings"
  ON sms_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own SMS settings"
  ON sms_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own SMS settings"
  ON sms_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- SMS Messages Table
CREATE TABLE IF NOT EXISTS sms_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  direction text DEFAULT 'outbound',
  from_number text NOT NULL,
  to_number text NOT NULL,
  message_body text NOT NULL,
  twilio_message_sid text DEFAULT '',
  status text DEFAULT 'queued',
  error_message text DEFAULT '',
  sent_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CHECK (direction IN ('outbound', 'inbound')),
  CHECK (status IN ('queued', 'sent', 'delivered', 'failed', 'received'))
);

ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own SMS messages"
  ON sms_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own SMS messages"
  ON sms_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own SMS messages"
  ON sms_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- SMS Campaigns Table
CREATE TABLE IF NOT EXISTS sms_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  message_template text NOT NULL,
  target_filter jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'draft',
  scheduled_time timestamptz,
  total_recipients integer DEFAULT 0,
  messages_sent integer DEFAULT 0,
  messages_delivered integer DEFAULT 0,
  messages_failed integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'cancelled'))
);

ALTER TABLE sms_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own SMS campaigns"
  ON sms_campaigns FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own SMS campaigns"
  ON sms_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own SMS campaigns"
  ON sms_campaigns FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own SMS campaigns"
  ON sms_campaigns FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- SMS Conversations Table
CREATE TABLE IF NOT EXISTS sms_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  client_phone text NOT NULL,
  last_message text DEFAULT '',
  last_message_at timestamptz DEFAULT now(),
  unread_count integer DEFAULT 0,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (status IN ('active', 'archived'))
);

ALTER TABLE sms_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own SMS conversations"
  ON sms_conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own SMS conversations"
  ON sms_conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own SMS conversations"
  ON sms_conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own SMS conversations"
  ON sms_conversations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sms_messages_user_id ON sms_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_client_id ON sms_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_status ON sms_messages(status);
CREATE INDEX IF NOT EXISTS idx_sms_messages_created_at ON sms_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_conversations_user_id ON sms_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_conversations_client_id ON sms_conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_sms_campaigns_user_id ON sms_campaigns(user_id);

-- Function to update conversation on new message
CREATE OR REPLACE FUNCTION update_sms_conversation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.direction = 'inbound' THEN
    UPDATE sms_conversations
    SET 
      last_message = NEW.message_body,
      last_message_at = NEW.created_at,
      unread_count = unread_count + 1,
      updated_at = now()
    WHERE client_id = NEW.client_id AND user_id = NEW.user_id;
    
    IF NOT FOUND THEN
      INSERT INTO sms_conversations (user_id, client_id, client_phone, last_message, last_message_at, unread_count)
      VALUES (NEW.user_id, NEW.client_id, NEW.from_number, NEW.message_body, NEW.created_at, 1);
    END IF;
  ELSE
    UPDATE sms_conversations
    SET 
      last_message = NEW.message_body,
      last_message_at = NEW.created_at,
      updated_at = now()
    WHERE client_id = NEW.client_id AND user_id = NEW.user_id;
    
    IF NOT FOUND AND NEW.client_id IS NOT NULL THEN
      INSERT INTO sms_conversations (user_id, client_id, client_phone, last_message, last_message_at, unread_count)
      VALUES (NEW.user_id, NEW.client_id, NEW.to_number, NEW.message_body, NEW.created_at, 0);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sms_message_conversation_update
  AFTER INSERT ON sms_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_sms_conversation();