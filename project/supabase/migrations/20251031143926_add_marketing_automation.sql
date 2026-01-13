/*
  # Marketing Automation System

  1. New Tables
    - `marketing_campaigns`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text) - Campaign name
      - `campaign_type` (text) - 'birthday', 'win_back', 'post_treatment', 'review_request', 'promotional'
      - `status` (text) - 'active', 'paused', 'completed', 'draft'
      - `trigger_rules` (jsonb) - Rules for when campaign triggers
      - `email_template` (text) - Email template content
      - `sms_template` (text) - SMS template content
      - `subject_line` (text) - Email subject
      - `send_method` (text) - 'email', 'sms', 'both'
      - `total_sent` (integer) - Count of messages sent
      - `total_opened` (integer) - Count of emails opened
      - `total_clicked` (integer) - Count of links clicked
      - `total_converted` (integer) - Count of bookings made
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `campaign_executions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `campaign_id` (uuid, references marketing_campaigns)
      - `client_id` (uuid, references clients)
      - `sent_at` (timestamptz) - When message was sent
      - `delivery_status` (text) - 'sent', 'delivered', 'failed', 'bounced'
      - `opened_at` (timestamptz) - When email was opened
      - `clicked_at` (timestamptz) - When link was clicked
      - `converted_at` (timestamptz) - When booking was made
      - `error_message` (text)
      - `created_at` (timestamptz)

    - `campaign_templates`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text) - Template name
      - `template_type` (text) - 'email', 'sms'
      - `content` (text) - Template content with variables
      - `variables` (jsonb) - Available variables for template
      - `is_default` (boolean) - System default template
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own campaigns
*/

-- Create marketing_campaigns table
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  campaign_type text NOT NULL CHECK (campaign_type IN ('birthday', 'win_back', 'post_treatment', 'review_request', 'promotional', 'referral')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'paused', 'completed', 'draft')),
  trigger_rules jsonb DEFAULT '{}'::jsonb,
  email_template text DEFAULT '',
  sms_template text DEFAULT '',
  subject_line text DEFAULT '',
  send_method text NOT NULL DEFAULT 'email' CHECK (send_method IN ('email', 'sms', 'both')),
  total_sent integer DEFAULT 0,
  total_opened integer DEFAULT 0,
  total_clicked integer DEFAULT 0,
  total_converted integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create campaign_executions table
CREATE TABLE IF NOT EXISTS campaign_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  campaign_id uuid REFERENCES marketing_campaigns(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  sent_at timestamptz DEFAULT now(),
  delivery_status text DEFAULT 'sent' CHECK (delivery_status IN ('sent', 'delivered', 'failed', 'bounced')),
  opened_at timestamptz,
  clicked_at timestamptz,
  converted_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Create campaign_templates table
CREATE TABLE IF NOT EXISTS campaign_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  template_type text NOT NULL CHECK (template_type IN ('email', 'sms')),
  content text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_templates ENABLE ROW LEVEL SECURITY;

-- Policies for marketing_campaigns
CREATE POLICY "Users can view their own campaigns"
  ON marketing_campaigns FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own campaigns"
  ON marketing_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own campaigns"
  ON marketing_campaigns FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own campaigns"
  ON marketing_campaigns FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Policies for campaign_executions
CREATE POLICY "Users can view their own executions"
  ON campaign_executions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own executions"
  ON campaign_executions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own executions"
  ON campaign_executions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own executions"
  ON campaign_executions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Policies for campaign_templates
CREATE POLICY "Users can view templates"
  ON campaign_templates FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_default = true);

CREATE POLICY "Users can insert their own templates"
  ON campaign_templates FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own templates"
  ON campaign_templates FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own templates"
  ON campaign_templates FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_user ON marketing_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_type ON marketing_campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_executions_user ON campaign_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_executions_campaign ON campaign_executions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_executions_client ON campaign_executions(client_id);
CREATE INDEX IF NOT EXISTS idx_campaign_templates_user ON campaign_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_templates_type ON campaign_templates(template_type);

-- Create trigger for updated_at on campaigns
DROP TRIGGER IF EXISTS update_marketing_campaigns_updated_at ON marketing_campaigns;
CREATE TRIGGER update_marketing_campaigns_updated_at
  BEFORE UPDATE ON marketing_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_updated_at();

-- Create trigger for updated_at on templates
DROP TRIGGER IF EXISTS update_campaign_templates_updated_at ON campaign_templates;
CREATE TRIGGER update_campaign_templates_updated_at
  BEFORE UPDATE ON campaign_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_updated_at();

-- Insert default email templates
INSERT INTO campaign_templates (name, template_type, content, variables, is_default)
VALUES 
  (
    'Birthday Greeting',
    'email',
    'Happy Birthday {{client_name}}! 🎉\n\nWe hope you have an amazing day! As a birthday gift, enjoy {{discount}}% off your next treatment.\n\nBook your appointment today!\n\nBest wishes,\n{{practice_name}}',
    '["client_name", "discount", "practice_name"]'::jsonb,
    true
  ),
  (
    'Win-Back Campaign',
    'email',
    'We Miss You, {{client_name}}!\n\nIt''s been {{days_since_visit}} days since your last visit. We''d love to see you again!\n\nBook your next appointment and get {{discount}}% off.\n\nLooking forward to seeing you soon!\n\n{{practice_name}}',
    '["client_name", "days_since_visit", "discount", "practice_name"]'::jsonb,
    true
  ),
  (
    'Post-Treatment Follow-up',
    'email',
    'Hi {{client_name}},\n\nThank you for choosing us for your {{treatment_name}}! We hope you''re loving your results.\n\nHow are you feeling? We''d love to hear your feedback.\n\nIf you have any questions or concerns, please don''t hesitate to reach out.\n\nBest regards,\n{{practice_name}}',
    '["client_name", "treatment_name", "practice_name"]'::jsonb,
    true
  ),
  (
    'Review Request',
    'email',
    'Hi {{client_name}},\n\nWe hope you loved your recent {{treatment_name}} experience with us!\n\nWould you mind taking a moment to leave us a review? Your feedback helps us serve you better and helps others discover our services.\n\n[Leave a Review]\n\nThank you so much!\n\n{{practice_name}}',
    '["client_name", "treatment_name", "practice_name"]'::jsonb,
    true
  )
ON CONFLICT DO NOTHING;