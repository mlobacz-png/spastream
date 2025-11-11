/*
  # Add No-Show Tracking Fields to Appointments

  1. Changes to `appointments` table
    - `status` (text) - Track appointment lifecycle: 'scheduled', 'completed', 'cancelled', 'no-show', 'confirmed'
    - `cancellation_date` (timestamptz) - When appointment was cancelled
    - `cancellation_reason` (text) - Why client cancelled
    - `booking_method` (text) - How appointment was created: 'online', 'phone', 'walk-in', 'admin'
    - `deposit_amount` (decimal) - Amount of deposit required
    - `deposit_paid` (boolean) - Whether deposit was collected
    - `confirmed_at` (timestamptz) - When client confirmed the appointment
    - `reminder_sent_at` (timestamptz) - When reminder was sent
    - `reminder_opened` (boolean) - Whether client opened/acknowledged reminder
    - `no_show_risk_score` (integer) - AI-calculated risk score (0-100)
    - `no_show_risk_level` (text) - Risk category: 'low', 'medium', 'high'
    - `booking_lead_time_days` (integer) - Days between booking and appointment
    - `price` (decimal) - Treatment price for risk analysis

  2. Indexes
    - Add index on status for filtering
    - Add index on no_show_risk_level for dashboard queries

  3. Notes
    - All fields have safe defaults to avoid breaking existing data
    - Uses IF NOT EXISTS to prevent errors on re-run
    - Backwards compatible with existing appointments
    - Includes 'confirmed' status for existing data compatibility
*/

-- Add status field (already exists with 'confirmed' value in data)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'status'
  ) THEN
    ALTER TABLE appointments ADD COLUMN status text DEFAULT 'scheduled';
  END IF;
END $$;

-- Add cancellation tracking fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'cancellation_date'
  ) THEN
    ALTER TABLE appointments ADD COLUMN cancellation_date timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'cancellation_reason'
  ) THEN
    ALTER TABLE appointments ADD COLUMN cancellation_reason text DEFAULT '';
  END IF;
END $$;

-- Add booking method
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'booking_method'
  ) THEN
    ALTER TABLE appointments ADD COLUMN booking_method text DEFAULT 'admin';
  END IF;
END $$;

-- Add deposit tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'deposit_amount'
  ) THEN
    ALTER TABLE appointments ADD COLUMN deposit_amount decimal(10,2) DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'deposit_paid'
  ) THEN
    ALTER TABLE appointments ADD COLUMN deposit_paid boolean DEFAULT false;
  END IF;
END $$;

-- Add confirmation tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'confirmed_at'
  ) THEN
    ALTER TABLE appointments ADD COLUMN confirmed_at timestamptz;
  END IF;
END $$;

-- Add reminder tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'reminder_sent_at'
  ) THEN
    ALTER TABLE appointments ADD COLUMN reminder_sent_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'reminder_opened'
  ) THEN
    ALTER TABLE appointments ADD COLUMN reminder_opened boolean DEFAULT false;
  END IF;
END $$;

-- Add no-show risk prediction fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'no_show_risk_score'
  ) THEN
    ALTER TABLE appointments ADD COLUMN no_show_risk_score integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'no_show_risk_level'
  ) THEN
    ALTER TABLE appointments ADD COLUMN no_show_risk_level text DEFAULT 'low';
  END IF;
END $$;

-- Add booking lead time for analysis
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'booking_lead_time_days'
  ) THEN
    ALTER TABLE appointments ADD COLUMN booking_lead_time_days integer DEFAULT 0;
  END IF;
END $$;

-- Add price field for risk analysis
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'price'
  ) THEN
    ALTER TABLE appointments ADD COLUMN price decimal(10,2) DEFAULT 0;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_risk_level ON appointments(no_show_risk_level);
CREATE INDEX IF NOT EXISTS idx_appointments_risk_score ON appointments(no_show_risk_score);

-- Add constraint to ensure valid status values (including 'confirmed' for compatibility)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'appointments_status_check'
  ) THEN
    ALTER TABLE appointments ADD CONSTRAINT appointments_status_check
      CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'));
  END IF;
END $$;

-- Add constraint to ensure valid risk levels
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'appointments_risk_level_check'
  ) THEN
    ALTER TABLE appointments ADD CONSTRAINT appointments_risk_level_check
      CHECK (no_show_risk_level IN ('low', 'medium', 'high'));
  END IF;
END $$;

-- Add constraint to ensure valid booking methods
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'appointments_booking_method_check'
  ) THEN
    ALTER TABLE appointments ADD CONSTRAINT appointments_booking_method_check
      CHECK (booking_method IN ('online', 'phone', 'walk-in', 'admin'));
  END IF;
END $$;

-- Add constraint to ensure risk score is 0-100
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'appointments_risk_score_check'
  ) THEN
    ALTER TABLE appointments ADD CONSTRAINT appointments_risk_score_check
      CHECK (no_show_risk_score >= 0 AND no_show_risk_score <= 100);
  END IF;
END $$;
