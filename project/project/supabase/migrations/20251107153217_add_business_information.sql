/*
  # Add Business Information Collection

  1. New Tables
    - `business_information`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users) - The user who owns this business
      - `full_name` (text) - Contact person's full name
      - `business_name` (text) - Name of the spa/medspa business
      - `email` (text) - Business email
      - `phone` (text) - Business phone number
      - `address_line1` (text) - Street address
      - `address_line2` (text, nullable) - Apartment, suite, etc.
      - `city` (text) - City
      - `state` (text) - State/province
      - `zip_code` (text) - ZIP/postal code
      - `country` (text) - Country
      - `number_of_employees` (integer) - How many employees
      - `business_type` (text) - Type of business (medspa, day spa, salon, etc)
      - `website` (text, nullable) - Business website
      - `onboarding_completed` (boolean) - Whether they completed the form
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `business_information` table
    - Add policy for users to manage their own business info
    - Add policy for admins to view all business info
*/

-- Create business_information table
CREATE TABLE IF NOT EXISTS business_information (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name text NOT NULL,
  business_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text NOT NULL,
  zip_code text NOT NULL,
  country text NOT NULL DEFAULT 'United States',
  number_of_employees integer NOT NULL DEFAULT 1,
  business_type text NOT NULL,
  website text,
  onboarding_completed boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_business_information_user_id ON business_information(user_id);
CREATE INDEX IF NOT EXISTS idx_business_information_created_at ON business_information(created_at DESC);

-- Enable RLS
ALTER TABLE business_information ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own business information
CREATE POLICY "Users can view own business info"
  ON business_information
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

-- Policy: Users can insert their own business information
CREATE POLICY "Users can create own business info"
  ON business_information
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR is_admin());

-- Policy: Users can update their own business information
CREATE POLICY "Users can update own business info"
  ON business_information
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR is_admin())
  WITH CHECK (auth.uid() = user_id OR is_admin());

-- Policy: Users can delete their own business information
CREATE POLICY "Users can delete own business info"
  ON business_information
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_business_information_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_business_information_updated_at ON business_information;
CREATE TRIGGER trigger_update_business_information_updated_at
  BEFORE UPDATE ON business_information
  FOR EACH ROW
  EXECUTE FUNCTION update_business_information_updated_at();
