/*
  # Client Portal Access System

  1. New Tables
    - `client_portal_access`
      - `id` (uuid, primary key)
      - `client_id` (uuid, references clients)
      - `email` (text) - Client's email for login
      - `access_token` (text) - Unique access token
      - `is_active` (boolean) - Whether portal access is enabled
      - `last_login` (timestamptz) - Last time client logged in
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `client_favorite_services`
      - `id` (uuid, primary key)
      - `client_id` (uuid, references clients)
      - `service_name` (text)
      - `last_booked` (timestamptz)
      - `times_booked` (integer)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Clients can only access their own data via access token
    - Medspa owners can manage all client portal access
*/

-- Create client_portal_access table
CREATE TABLE IF NOT EXISTS client_portal_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email text NOT NULL,
  access_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create client_favorite_services table
CREATE TABLE IF NOT EXISTS client_favorite_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  service_name text NOT NULL,
  last_booked timestamptz,
  times_booked integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE(client_id, service_name)
);

-- Enable RLS
ALTER TABLE client_portal_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_favorite_services ENABLE ROW LEVEL SECURITY;

-- Policies for client_portal_access
-- Medspa owners can manage portal access
CREATE POLICY "Users can view their clients portal access"
  ON client_portal_access FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_portal_access.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their clients portal access"
  ON client_portal_access FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_portal_access.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their clients portal access"
  ON client_portal_access FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_portal_access.client_id
      AND clients.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_portal_access.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their clients portal access"
  ON client_portal_access FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_portal_access.client_id
      AND clients.user_id = auth.uid()
    )
  );

-- Policies for client_favorite_services
CREATE POLICY "Users can view their clients favorite services"
  ON client_favorite_services FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_favorite_services.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their clients favorite services"
  ON client_favorite_services FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_favorite_services.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their clients favorite services"
  ON client_favorite_services FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_favorite_services.client_id
      AND clients.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_favorite_services.client_id
      AND clients.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_client_portal_access_client ON client_portal_access(client_id);
CREATE INDEX IF NOT EXISTS idx_client_portal_access_token ON client_portal_access(access_token);
CREATE INDEX IF NOT EXISTS idx_client_portal_access_email ON client_portal_access(email);
CREATE INDEX IF NOT EXISTS idx_client_favorite_services_client ON client_favorite_services(client_id);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_client_portal_access_updated_at ON client_portal_access;
CREATE TRIGGER update_client_portal_access_updated_at
  BEFORE UPDATE ON client_portal_access
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_ops_updated_at();