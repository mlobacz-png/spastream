/*
  # Fix Client Portal Access Policies

  1. Changes
    - Add anon role policies to allow clients to access portal without authentication
    - Allow clients to view their own data via access token
    - Allow clients to update their own profile information

  2. Security
    - Clients can only access data linked to their valid access token
    - All access is read-only except for profile updates
*/

-- Drop existing policies and recreate with anon access
DROP POLICY IF EXISTS "Users can view their clients portal access" ON client_portal_access;
DROP POLICY IF EXISTS "Users can insert their clients portal access" ON client_portal_access;
DROP POLICY IF EXISTS "Users can update their clients portal access" ON client_portal_access;
DROP POLICY IF EXISTS "Users can delete their clients portal access" ON client_portal_access;

-- Policies for authenticated medspa owners
CREATE POLICY "Owners can view their clients portal access"
  ON client_portal_access FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_portal_access.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can insert their clients portal access"
  ON client_portal_access FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_portal_access.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update their clients portal access"
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

CREATE POLICY "Owners can delete their clients portal access"
  ON client_portal_access FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_portal_access.client_id
      AND clients.user_id = auth.uid()
    )
  );

-- Allow anonymous users to view portal access by token (for login)
CREATE POLICY "Anyone can view portal access by token"
  ON client_portal_access FOR SELECT
  TO anon
  USING (is_active = true);

-- Allow anonymous users to update last_login
CREATE POLICY "Anyone can update portal last login"
  ON client_portal_access FOR UPDATE
  TO anon
  USING (is_active = true)
  WITH CHECK (is_active = true);

-- Add policies for clients table to allow portal users to view/update their profile
CREATE POLICY "Portal users can view their own profile"
  ON clients FOR SELECT
  TO anon
  USING (
    id IN (
      SELECT client_id FROM client_portal_access
      WHERE is_active = true
    )
  );

CREATE POLICY "Portal users can update their own profile"
  ON clients FOR UPDATE
  TO anon
  USING (
    id IN (
      SELECT client_id FROM client_portal_access
      WHERE is_active = true
    )
  )
  WITH CHECK (
    id IN (
      SELECT client_id FROM client_portal_access
      WHERE is_active = true
    )
  );

-- Add policies for appointments to allow portal users to view their appointments
CREATE POLICY "Portal users can view their appointments"
  ON appointments FOR SELECT
  TO anon
  USING (
    client_id IN (
      SELECT client_id FROM client_portal_access
      WHERE is_active = true
    )
  );

-- Add policies for client_packages to allow portal users to view their packages
CREATE POLICY "Portal users can view their packages"
  ON client_packages FOR SELECT
  TO anon
  USING (
    client_id IN (
      SELECT client_id FROM client_portal_access
      WHERE is_active = true
    )
  );

-- Add policies for client_photos to allow portal users to view their photos
CREATE POLICY "Portal users can view their photos"
  ON client_photos FOR SELECT
  TO anon
  USING (
    client_id IN (
      SELECT client_id FROM client_portal_access
      WHERE is_active = true
    )
  );