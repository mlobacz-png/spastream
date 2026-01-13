/*
  # Add Services Management System

  1. New Table: `services`
    - `id` (uuid, primary key) - Unique service identifier
    - `user_id` (uuid, foreign key) - Clinic owner
    - `name` (text) - Service name (e.g., "Botox", "Hydrafacial")
    - `description` (text) - Service description
    - `duration_minutes` (integer) - Default duration
    - `price` (decimal) - Default price
    - `category` (text) - Service category (injectables, skincare, laser, etc.)
    - `available_for_online_booking` (boolean) - Show on booking page
    - `requires_consultation` (boolean) - Needs prior consultation
    - `deposit_required` (boolean) - Requires deposit
    - `deposit_amount` (decimal) - Deposit amount if required
    - `active` (boolean) - Service is active
    - `display_order` (integer) - Sort order for display
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Practitioners manage their own services
    - Public can view services for enabled booking pages

  3. Indexes
    - user_id for fast lookup
    - active + available_for_online_booking for booking page queries

  4. Notes
    - Replaces hardcoded SERVICES array
    - Each clinic customizes their own service menu
    - Services can be disabled without deletion
    - Display order allows custom sorting
*/

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  duration_minutes integer DEFAULT 60,
  price decimal(10,2) DEFAULT 0,
  category text DEFAULT 'general',
  available_for_online_booking boolean DEFAULT true,
  requires_consultation boolean DEFAULT false,
  deposit_required boolean DEFAULT false,
  deposit_amount decimal(10,2) DEFAULT 0,
  active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users (clinic owners)
CREATE POLICY "Users can view own services"
  ON services FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own services"
  ON services FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own services"
  ON services FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own services"
  ON services FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for public booking pages
CREATE POLICY "Public can view services for online booking"
  ON services FOR SELECT
  TO anon, authenticated
  USING (
    active = true 
    AND available_for_online_booking = true
    AND EXISTS (
      SELECT 1 FROM booking_settings 
      WHERE booking_settings.user_id = services.user_id 
      AND booking_settings.enabled = true
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(active);
CREATE INDEX IF NOT EXISTS idx_services_online_booking ON services(user_id, active, available_for_online_booking);
CREATE INDEX IF NOT EXISTS idx_services_display_order ON services(user_id, display_order);

-- Add constraint for valid categories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'services_category_check'
  ) THEN
    ALTER TABLE services ADD CONSTRAINT services_category_check
      CHECK (category IN ('injectables', 'skincare', 'laser', 'body', 'consultation', 'other', 'general'));
  END IF;
END $$;

-- Insert default services for existing users (optional - helps with onboarding)
INSERT INTO services (user_id, name, description, duration_minutes, price, category, display_order)
SELECT 
  user_id,
  service_name,
  service_desc,
  duration,
  price,
  category,
  ord
FROM (
  SELECT 
    id as user_id,
    unnest(ARRAY['Botox', 'Dermal Fillers', 'Chemical Peel', 'Microneedling', 'Laser Hair Removal', 'Hydrafacial', 'IV Therapy', 'Consultation']) as service_name,
    unnest(ARRAY[
      'Botulinum toxin injections for wrinkles and fine lines',
      'FDA-approved dermal fillers for volume restoration',
      'Chemical peel treatment for skin rejuvenation',
      'Collagen induction therapy for skin texture',
      'Permanent hair reduction using laser technology',
      'Deep cleansing and hydration facial treatment',
      'Vitamin and nutrient infusion therapy',
      'Initial consultation for treatment planning'
    ]) as service_desc,
    unnest(ARRAY[30, 60, 45, 60, 30, 60, 45, 30]) as duration,
    unnest(ARRAY[400, 600, 200, 350, 150, 200, 150, 0]) as price,
    unnest(ARRAY['injectables', 'injectables', 'skincare', 'skincare', 'laser', 'skincare', 'body', 'consultation']) as category,
    unnest(ARRAY[1, 2, 3, 4, 5, 6, 7, 8]) as ord
  FROM auth.users
) as default_services
ON CONFLICT DO NOTHING;
