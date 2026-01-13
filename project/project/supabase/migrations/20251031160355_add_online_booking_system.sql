/*
  # Add Online Booking System

  1. New Tables
    - `booking_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `enabled` (boolean) - Whether online booking is active
      - `business_name` (text) - Display name for booking page
      - `booking_url_slug` (text, unique) - Custom URL slug
      - `logo_url` (text) - Business logo
      - `primary_color` (text) - Brand color for booking page
      - `services_offered` (jsonb) - Array of services with prices
      - `booking_buffer_minutes` (integer) - Buffer between appointments
      - `advance_booking_days` (integer) - How far ahead clients can book
      - `min_notice_hours` (integer) - Minimum notice required
      - `business_hours` (jsonb) - Operating hours by day
      - `blocked_dates` (jsonb) - Holidays/blocked dates
      - `require_phone` (boolean)
      - `require_email` (boolean)
      - `confirmation_message` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `public_bookings`
      - `id` (uuid, primary key)
      - `practitioner_user_id` (uuid, foreign key) - The medspa owner
      - `client_name` (text)
      - `client_email` (text)
      - `client_phone` (text)
      - `service` (text)
      - `requested_time` (timestamptz)
      - `duration_minutes` (integer)
      - `status` (text) - pending, confirmed, cancelled
      - `notes` (text)
      - `appointment_id` (uuid) - Links to appointments table when confirmed
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - `booking_settings`: Users can manage their own settings
    - `public_bookings`: Public can insert, practitioners can view their own
*/

-- Create booking_settings table
CREATE TABLE IF NOT EXISTS booking_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  enabled boolean DEFAULT false,
  business_name text NOT NULL DEFAULT '',
  booking_url_slug text UNIQUE,
  logo_url text DEFAULT '',
  primary_color text DEFAULT '#3b82f6',
  services_offered jsonb DEFAULT '[]'::jsonb,
  booking_buffer_minutes integer DEFAULT 15,
  advance_booking_days integer DEFAULT 30,
  min_notice_hours integer DEFAULT 2,
  business_hours jsonb DEFAULT '{"monday": {"enabled": true, "start": "09:00", "end": "17:00"}, "tuesday": {"enabled": true, "start": "09:00", "end": "17:00"}, "wednesday": {"enabled": true, "start": "09:00", "end": "17:00"}, "thursday": {"enabled": true, "start": "09:00", "end": "17:00"}, "friday": {"enabled": true, "start": "09:00", "end": "17:00"}, "saturday": {"enabled": false, "start": "09:00", "end": "17:00"}, "sunday": {"enabled": false, "start": "09:00", "end": "17:00"}}'::jsonb,
  blocked_dates jsonb DEFAULT '[]'::jsonb,
  require_phone boolean DEFAULT true,
  require_email boolean DEFAULT true,
  confirmation_message text DEFAULT 'Thank you for booking! We will send you a confirmation shortly.',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create public_bookings table
CREATE TABLE IF NOT EXISTS public_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_user_id uuid REFERENCES auth.users NOT NULL,
  client_name text NOT NULL,
  client_email text DEFAULT '',
  client_phone text DEFAULT '',
  service text NOT NULL,
  requested_time timestamptz NOT NULL,
  duration_minutes integer DEFAULT 60,
  status text DEFAULT 'pending',
  notes text DEFAULT '',
  appointment_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE booking_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_bookings ENABLE ROW LEVEL SECURITY;

-- Policies for booking_settings
CREATE POLICY "Users can view own booking settings"
  ON booking_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own booking settings"
  ON booking_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own booking settings"
  ON booking_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view enabled booking settings by slug"
  ON booking_settings FOR SELECT
  TO anon, authenticated
  USING (enabled = true AND booking_url_slug IS NOT NULL);

-- Policies for public_bookings
CREATE POLICY "Anyone can insert public bookings"
  ON public_bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Practitioners can view their bookings"
  ON public_bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = practitioner_user_id);

CREATE POLICY "Practitioners can update their bookings"
  ON public_bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = practitioner_user_id)
  WITH CHECK (auth.uid() = practitioner_user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS booking_settings_user_id_idx ON booking_settings(user_id);
CREATE INDEX IF NOT EXISTS booking_settings_slug_idx ON booking_settings(booking_url_slug);
CREATE INDEX IF NOT EXISTS public_bookings_practitioner_idx ON public_bookings(practitioner_user_id);
CREATE INDEX IF NOT EXISTS public_bookings_status_idx ON public_bookings(status);
CREATE INDEX IF NOT EXISTS public_bookings_requested_time_idx ON public_bookings(requested_time);
