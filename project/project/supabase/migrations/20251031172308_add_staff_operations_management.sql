/*
  # Staff & Operations Management System

  1. New Tables
    - `staff_members` - Core staff/provider information
    - `staff_weekly_schedules` - Weekly recurring schedules
    - `staff_time_off` - Time off requests and approvals
    - `treatment_rooms` - Treatment room management
    - `room_bookings` - Room reservation system
    - `treatment_notes_templates` - Pre-filled note templates

  2. Modify Existing Tables
    - Add `staff_member_id`, `treatment_room_id`, `treatment_notes` to appointments

  3. Security
    - Enable RLS on all tables
    - Policies for authenticated users
*/

-- Create staff_members table
CREATE TABLE IF NOT EXISTS staff_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  role text NOT NULL,
  specializations text[] DEFAULT '{}',
  hourly_rate numeric DEFAULT 0,
  commission_rate numeric DEFAULT 0,
  hire_date date DEFAULT CURRENT_DATE,
  photo_url text,
  bio text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create treatment_rooms table
CREATE TABLE IF NOT EXISTS treatment_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  room_type text NOT NULL DEFAULT 'treatment',
  equipment text[] DEFAULT '{}',
  max_capacity integer DEFAULT 1,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create staff_weekly_schedules table (different from staff_schedules)
CREATE TABLE IF NOT EXISTS staff_weekly_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  staff_member_id uuid REFERENCES staff_members(id) ON DELETE CASCADE NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(staff_member_id, day_of_week)
);

-- Create staff_time_off table
CREATE TABLE IF NOT EXISTS staff_time_off (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  staff_member_id uuid REFERENCES staff_members(id) ON DELETE CASCADE NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  notes text,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create room_bookings table
CREATE TABLE IF NOT EXISTS room_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  room_id uuid REFERENCES treatment_rooms(id) ON DELETE CASCADE NOT NULL,
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE,
  staff_member_id uuid REFERENCES staff_members(id) ON DELETE SET NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_use', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create treatment_notes_templates table
CREATE TABLE IF NOT EXISTS treatment_notes_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  service_type text NOT NULL,
  template_content text,
  sections jsonb DEFAULT '[]',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add columns to appointments table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'staff_member_id'
  ) THEN
    ALTER TABLE appointments ADD COLUMN staff_member_id uuid REFERENCES staff_members(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'treatment_room_id'
  ) THEN
    ALTER TABLE appointments ADD COLUMN treatment_room_id uuid REFERENCES treatment_rooms(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'treatment_notes'
  ) THEN
    ALTER TABLE appointments ADD COLUMN treatment_notes text;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_weekly_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_time_off ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_notes_templates ENABLE ROW LEVEL SECURITY;

-- Policies for staff_members
CREATE POLICY "Users can view their own staff"
  ON staff_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own staff"
  ON staff_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own staff"
  ON staff_members FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own staff"
  ON staff_members FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Policies for staff_weekly_schedules
CREATE POLICY "Users can view their staff weekly schedules"
  ON staff_weekly_schedules FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their staff weekly schedules"
  ON staff_weekly_schedules FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their staff weekly schedules"
  ON staff_weekly_schedules FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their staff weekly schedules"
  ON staff_weekly_schedules FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Policies for staff_time_off
CREATE POLICY "Users can view their staff time off"
  ON staff_time_off FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their staff time off"
  ON staff_time_off FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their staff time off"
  ON staff_time_off FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their staff time off"
  ON staff_time_off FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Policies for treatment_rooms
CREATE POLICY "Users can view their treatment rooms"
  ON treatment_rooms FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their treatment rooms"
  ON treatment_rooms FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their treatment rooms"
  ON treatment_rooms FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their treatment rooms"
  ON treatment_rooms FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Policies for room_bookings
CREATE POLICY "Users can view their room bookings"
  ON room_bookings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their room bookings"
  ON room_bookings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their room bookings"
  ON room_bookings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their room bookings"
  ON room_bookings FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Policies for treatment_notes_templates
CREATE POLICY "Users can view their treatment templates"
  ON treatment_notes_templates FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their treatment templates"
  ON treatment_notes_templates FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their treatment templates"
  ON treatment_notes_templates FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their treatment templates"
  ON treatment_notes_templates FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_staff_members_user ON staff_members(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_members_role ON staff_members(role);
CREATE INDEX IF NOT EXISTS idx_staff_weekly_schedules_member ON staff_weekly_schedules(staff_member_id);
CREATE INDEX IF NOT EXISTS idx_staff_time_off_member ON staff_time_off(staff_member_id);
CREATE INDEX IF NOT EXISTS idx_staff_time_off_dates ON staff_time_off(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_treatment_rooms_user ON treatment_rooms(user_id);
CREATE INDEX IF NOT EXISTS idx_room_bookings_room ON room_bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_room_bookings_appointment ON room_bookings(appointment_id);
CREATE INDEX IF NOT EXISTS idx_room_bookings_time ON room_bookings(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_treatment_templates_user ON treatment_notes_templates(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_staff_ops_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_staff_members_updated_at ON staff_members;
CREATE TRIGGER update_staff_members_updated_at
  BEFORE UPDATE ON staff_members
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_ops_updated_at();

DROP TRIGGER IF EXISTS update_staff_weekly_schedules_updated_at ON staff_weekly_schedules;
CREATE TRIGGER update_staff_weekly_schedules_updated_at
  BEFORE UPDATE ON staff_weekly_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_ops_updated_at();

DROP TRIGGER IF EXISTS update_treatment_templates_updated_at ON treatment_notes_templates;
CREATE TRIGGER update_treatment_templates_updated_at
  BEFORE UPDATE ON treatment_notes_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_ops_updated_at();