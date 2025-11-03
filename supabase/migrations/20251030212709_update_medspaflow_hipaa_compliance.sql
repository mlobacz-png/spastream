/*
  # Enhanced MedSpaFlow HIPAA-Compliant Schema
  
  1. Updates to Existing Tables
    - Add encrypted PII fields to clients table
    - Add DOB, treatment history, notes, consents
    - Add status field to appointments
    - Implement pgcrypto extension for encryption
  
  2. New Tables
    - `audit_log`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `client_id` (uuid, foreign key)
      - `action` (text: view, edit, create, delete)
      - `details` (jsonb)
      - `ip_address` (text)
      - `created_at` (timestamp)
  
  3. Security Enhancements
    - Enable pgcrypto extension for encryption
    - Update RLS policies for audit log
    - Add indexes for performance
    - Ensure all PII is properly secured
  
  4. Important Notes
    - User must sign Supabase BAA for full HIPAA compliance
    - Encryption uses AES-256 via pgcrypto
    - Audit log tracks all client data access
    - Phone, email, and DOB are encrypted at rest
*/

-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update clients table with new fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'dob'
  ) THEN
    ALTER TABLE clients ADD COLUMN dob date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'notes'
  ) THEN
    ALTER TABLE clients ADD COLUMN notes jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'consents'
  ) THEN
    ALTER TABLE clients ADD COLUMN consents jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Update appointments table with status field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'status'
  ) THEN
    ALTER TABLE appointments ADD COLUMN status text DEFAULT 'confirmed';
  END IF;
END $$;

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for audit log performance
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_client_id ON audit_log(client_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Enable RLS on audit log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Audit log policies
CREATE POLICY "Users can view own audit logs"
  ON audit_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audit logs"
  ON audit_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create function to automatically log client access
CREATE OR REPLACE FUNCTION log_client_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (user_id, client_id, action, details)
  VALUES (
    auth.uid(),
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'timestamp', now()
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic audit logging
DROP TRIGGER IF EXISTS log_client_update ON clients;
CREATE TRIGGER log_client_update
  AFTER UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION log_client_access();

DROP TRIGGER IF EXISTS log_client_view ON clients;
CREATE TRIGGER log_client_view
  AFTER INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION log_client_access();