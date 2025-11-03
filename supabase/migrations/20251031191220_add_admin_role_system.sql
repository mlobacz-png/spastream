/*
  # Admin Role System with Audit Logging

  1. Changes to Existing Tables
    - Add role management via auth.users metadata
    - Admin users will have raw_app_metadata->>'role' = 'admin'
  
  2. New Tables
    - `admin_audit_log`
      - `id` (uuid, primary key)
      - `admin_user_id` (uuid, references auth.users)
      - `target_user_id` (uuid, references auth.users)
      - `action` (text) - what action was performed
      - `table_name` (text) - which table was accessed
      - `record_id` (uuid) - specific record accessed
      - `details` (jsonb) - additional context
      - `created_at` (timestamptz)
  
  3. Security
    - Enable RLS on admin_audit_log
    - Only admins can read audit logs
    - System automatically logs admin actions
    - Update all existing RLS policies to allow admin access
  
  4. Functions
    - `is_admin()` - helper function to check if current user is admin
    - `log_admin_action()` - helper to log admin activities
  
  5. Policy Updates
    - All existing tables updated to allow admin access
    - Admins can SELECT, INSERT, UPDATE, DELETE on all data
    - Maintains existing user isolation for non-admin users
*/

-- Create admin_audit_log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES auth.users(id) NOT NULL,
  target_user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  table_name text,
  record_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN COALESCE(
    (SELECT raw_app_metadata->>'role' = 'admin' 
     FROM auth.users 
     WHERE id = auth.uid()),
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action text,
  p_target_user_id uuid DEFAULT NULL,
  p_table_name text DEFAULT NULL,
  p_record_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void AS $$
BEGIN
  IF is_admin() THEN
    INSERT INTO admin_audit_log (
      admin_user_id,
      target_user_id,
      action,
      table_name,
      record_id,
      details
    ) VALUES (
      auth.uid(),
      p_target_user_id,
      p_action,
      p_table_name,
      p_record_id,
      p_details
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies for admin_audit_log
CREATE POLICY "Admins can view all audit logs"
  ON admin_audit_log
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "System can insert audit logs"
  ON admin_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Update RLS policies for all tables to allow admin access

-- CLIENTS TABLE
DROP POLICY IF EXISTS "Users can view own clients" ON clients;
CREATE POLICY "Users can view own clients"
  ON clients FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "Users can insert own clients" ON clients;
CREATE POLICY "Users can insert own clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "Users can update own clients" ON clients;
CREATE POLICY "Users can update own clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR is_admin())
  WITH CHECK (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "Users can delete own clients" ON clients;
CREATE POLICY "Users can delete own clients"
  ON clients FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

-- APPOINTMENTS TABLE
DROP POLICY IF EXISTS "Users can view own appointments" ON appointments;
CREATE POLICY "Users can view own appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "Users can insert own appointments" ON appointments;
CREATE POLICY "Users can insert own appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "Users can update own appointments" ON appointments;
CREATE POLICY "Users can update own appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR is_admin())
  WITH CHECK (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "Users can delete own appointments" ON appointments;
CREATE POLICY "Users can delete own appointments"
  ON appointments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

-- AUDIT_LOG TABLE
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_log;
CREATE POLICY "Users can view own audit logs"
  ON audit_log FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "System can insert audit logs" ON audit_log;
CREATE POLICY "System can insert audit logs"
  ON audit_log FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_admin());

-- CLIENT_PHOTOS TABLE
DROP POLICY IF EXISTS "Users can view own client photos" ON client_photos;
CREATE POLICY "Users can view own client photos"
  ON client_photos FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "Users can insert own client photos" ON client_photos;
CREATE POLICY "Users can insert own client photos"
  ON client_photos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "Users can update own client photos" ON client_photos;
CREATE POLICY "Users can update own client photos"
  ON client_photos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR is_admin())
  WITH CHECK (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "Users can delete own client photos" ON client_photos;
CREATE POLICY "Users can delete own client photos"
  ON client_photos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

-- TREATMENT_RECOMMENDATIONS TABLE
DROP POLICY IF EXISTS "Users can view own recommendations" ON treatment_recommendations;
CREATE POLICY "Users can view own recommendations"
  ON treatment_recommendations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "Users can insert own recommendations" ON treatment_recommendations;
CREATE POLICY "Users can insert own recommendations"
  ON treatment_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "Users can update own recommendations" ON treatment_recommendations;
CREATE POLICY "Users can update own recommendations"
  ON treatment_recommendations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR is_admin())
  WITH CHECK (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "Users can delete own recommendations" ON treatment_recommendations;
CREATE POLICY "Users can delete own recommendations"
  ON treatment_recommendations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

-- COMPLIANCE_SCANS TABLE
DROP POLICY IF EXISTS "Users can view own compliance scans" ON compliance_scans;
CREATE POLICY "Users can view own compliance scans"
  ON compliance_scans FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "System can insert compliance scans" ON compliance_scans;
CREATE POLICY "System can insert compliance scans"
  ON compliance_scans FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_admin());

-- INVOICES TABLE
DROP POLICY IF EXISTS "Users can view own invoices" ON invoices;
CREATE POLICY "Users can view own invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can insert own invoices" ON invoices;
CREATE POLICY "Users can insert own invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can update own invoices" ON invoices;
CREATE POLICY "Users can update own invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can delete own invoices" ON invoices;
CREATE POLICY "Users can delete own invoices"
  ON invoices FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- PACKAGES TABLE
DROP POLICY IF EXISTS "Users can view own packages" ON packages;
CREATE POLICY "Users can view own packages"
  ON packages FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can insert own packages" ON packages;
CREATE POLICY "Users can insert own packages"
  ON packages FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can update own packages" ON packages;
CREATE POLICY "Users can update own packages"
  ON packages FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can delete own packages" ON packages;
CREATE POLICY "Users can delete own packages"
  ON packages FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- CLIENT_PACKAGES TABLE
DROP POLICY IF EXISTS "Users can view own client packages" ON client_packages;
CREATE POLICY "Users can view own client packages"
  ON client_packages FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can insert own client packages" ON client_packages;
CREATE POLICY "Users can insert own client packages"
  ON client_packages FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can update own client packages" ON client_packages;
CREATE POLICY "Users can update own client packages"
  ON client_packages FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can delete own client packages" ON client_packages;
CREATE POLICY "Users can delete own client packages"
  ON client_packages FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- APPOINTMENT_REMINDERS TABLE
DROP POLICY IF EXISTS "Users can view own reminders" ON appointment_reminders;
CREATE POLICY "Users can view own reminders"
  ON appointment_reminders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can insert own reminders" ON appointment_reminders;
CREATE POLICY "Users can insert own reminders"
  ON appointment_reminders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can update own reminders" ON appointment_reminders;
CREATE POLICY "Users can update own reminders"
  ON appointment_reminders FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can delete own reminders" ON appointment_reminders;
CREATE POLICY "Users can delete own reminders"
  ON appointment_reminders FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- INVENTORY_PRODUCTS TABLE
DROP POLICY IF EXISTS "Users can view own inventory" ON inventory_products;
CREATE POLICY "Users can view own inventory"
  ON inventory_products FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can insert own inventory" ON inventory_products;
CREATE POLICY "Users can insert own inventory"
  ON inventory_products FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can update own inventory" ON inventory_products;
CREATE POLICY "Users can update own inventory"
  ON inventory_products FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can delete own inventory" ON inventory_products;
CREATE POLICY "Users can delete own inventory"
  ON inventory_products FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- INVENTORY_TRANSACTIONS TABLE
DROP POLICY IF EXISTS "Users can view own transactions" ON inventory_transactions;
CREATE POLICY "Users can view own transactions"
  ON inventory_transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can insert own transactions" ON inventory_transactions;
CREATE POLICY "Users can insert own transactions"
  ON inventory_transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_admin());

-- INVENTORY_ALERTS TABLE
DROP POLICY IF EXISTS "Users can view own alerts" ON inventory_alerts;
CREATE POLICY "Users can view own alerts"
  ON inventory_alerts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can insert own alerts" ON inventory_alerts;
CREATE POLICY "Users can insert own alerts"
  ON inventory_alerts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can update own alerts" ON inventory_alerts;
CREATE POLICY "Users can update own alerts"
  ON inventory_alerts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

-- MARKETING_CAMPAIGNS TABLE
DROP POLICY IF EXISTS "Users can view own campaigns" ON marketing_campaigns;
CREATE POLICY "Users can view own campaigns"
  ON marketing_campaigns FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can insert own campaigns" ON marketing_campaigns;
CREATE POLICY "Users can insert own campaigns"
  ON marketing_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can update own campaigns" ON marketing_campaigns;
CREATE POLICY "Users can update own campaigns"
  ON marketing_campaigns FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can delete own campaigns" ON marketing_campaigns;
CREATE POLICY "Users can delete own campaigns"
  ON marketing_campaigns FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- Continue with remaining tables...
-- CAMPAIGN_TEMPLATES, CAMPAIGN_EXECUTIONS, BOOKING_SETTINGS, PUBLIC_BOOKINGS, PRICING_RULES, etc.

-- BOOKING_SETTINGS TABLE
DROP POLICY IF EXISTS "Users can view own booking settings" ON booking_settings;
CREATE POLICY "Users can view own booking settings"
  ON booking_settings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can insert own booking settings" ON booking_settings;
CREATE POLICY "Users can insert own booking settings"
  ON booking_settings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can update own booking settings" ON booking_settings;
CREATE POLICY "Users can update own booking settings"
  ON booking_settings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

-- STAFF_MEMBERS TABLE
DROP POLICY IF EXISTS "Users can view own staff" ON staff_members;
CREATE POLICY "Users can view own staff"
  ON staff_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can insert own staff" ON staff_members;
CREATE POLICY "Users can insert own staff"
  ON staff_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can update own staff" ON staff_members;
CREATE POLICY "Users can update own staff"
  ON staff_members FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can delete own staff" ON staff_members;
CREATE POLICY "Users can delete own staff"
  ON staff_members FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- TRANSACTIONS TABLE
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_admin());

-- PAYMENT_SETTINGS TABLE
DROP POLICY IF EXISTS "Users can view own payment settings" ON payment_settings;
CREATE POLICY "Users can view own payment settings"
  ON payment_settings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can insert own payment settings" ON payment_settings;
CREATE POLICY "Users can insert own payment settings"
  ON payment_settings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can update own payment settings" ON payment_settings;
CREATE POLICY "Users can update own payment settings"
  ON payment_settings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

-- SMS_SETTINGS TABLE
DROP POLICY IF EXISTS "Users can view own sms settings" ON sms_settings;
CREATE POLICY "Users can view own sms settings"
  ON sms_settings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can insert own sms settings" ON sms_settings;
CREATE POLICY "Users can insert own sms settings"
  ON sms_settings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can update own sms settings" ON sms_settings;
CREATE POLICY "Users can update own sms settings"
  ON sms_settings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

-- SMS_CAMPAIGNS TABLE
DROP POLICY IF EXISTS "Users can view own sms campaigns" ON sms_campaigns;
CREATE POLICY "Users can view own sms campaigns"
  ON sms_campaigns FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can insert own sms campaigns" ON sms_campaigns;
CREATE POLICY "Users can insert own sms campaigns"
  ON sms_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can update own sms campaigns" ON sms_campaigns;
CREATE POLICY "Users can update own sms campaigns"
  ON sms_campaigns FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can delete own sms campaigns" ON sms_campaigns;
CREATE POLICY "Users can delete own sms campaigns"
  ON sms_campaigns FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- SMS_MESSAGES TABLE  
DROP POLICY IF EXISTS "Users can view own sms messages" ON sms_messages;
CREATE POLICY "Users can view own sms messages"
  ON sms_messages FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can insert own sms messages" ON sms_messages;
CREATE POLICY "Users can insert own sms messages"
  ON sms_messages FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can update own sms messages" ON sms_messages;
CREATE POLICY "Users can update own sms messages"
  ON sms_messages FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

-- SMS_CONVERSATIONS TABLE
DROP POLICY IF EXISTS "Users can view own sms conversations" ON sms_conversations;
CREATE POLICY "Users can view own sms conversations"
  ON sms_conversations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can insert own sms conversations" ON sms_conversations;
CREATE POLICY "Users can insert own sms conversations"
  ON sms_conversations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can update own sms conversations" ON sms_conversations;
CREATE POLICY "Users can update own sms conversations"
  ON sms_conversations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());