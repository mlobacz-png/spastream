/*
  # Revenue Tracking, Treatment Packages, and Automated Reminders

  ## Summary
  This migration adds comprehensive revenue tracking, treatment package management, and automated appointment reminder functionality to support med spa business operations.

  ## 1. Revenue Tracking
  
  ### New Columns in appointments table:
    - `price` (numeric): Service price for this appointment
    - `amount_paid` (numeric): Amount actually paid by client
    - `payment_status` (text): pending, paid, partial, refunded
    - `payment_method` (text): cash, card, transfer, package
    - `payment_date` (timestamptz): When payment was received
    - `payment_notes` (text): Additional payment information
  
  ## 2. Treatment Packages
  
  ### New Tables:
    
  #### `packages`
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key to auth.users)
    - `name` (text): Package name (e.g., "3 Botox Sessions")
    - `description` (text): Package details
    - `service` (text): Service type this package is for
    - `total_sessions` (integer): Number of sessions included
    - `price` (numeric): Total package price
    - `validity_days` (integer): Days until package expires
    - `active` (boolean): Whether package is available for purchase
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
  
  #### `client_packages`
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key to auth.users)
    - `client_id` (uuid, foreign key to clients)
    - `package_id` (uuid, foreign key to packages)
    - `sessions_remaining` (integer): Sessions left to use
    - `purchase_date` (timestamptz): When client bought package
    - `expiry_date` (timestamptz): When package expires
    - `status` (text): active, expired, completed
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
  
  ## 3. Appointment Reminders
  
  ### New Table:
    
  #### `appointment_reminders`
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key to auth.users)
    - `appointment_id` (uuid, foreign key to appointments)
    - `reminder_type` (text): email, sms, both
    - `scheduled_for` (timestamptz): When to send reminder
    - `sent_at` (timestamptz): When reminder was actually sent
    - `status` (text): pending, sent, failed
    - `error_message` (text): If failed, what went wrong
    - `created_at` (timestamptz)
  
  ## 4. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own data
    - Ensure users can only access their own business data
*/

-- Add revenue tracking columns to appointments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'price'
  ) THEN
    ALTER TABLE appointments ADD COLUMN price numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'amount_paid'
  ) THEN
    ALTER TABLE appointments ADD COLUMN amount_paid numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE appointments ADD COLUMN payment_status text DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE appointments ADD COLUMN payment_method text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'payment_date'
  ) THEN
    ALTER TABLE appointments ADD COLUMN payment_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'payment_notes'
  ) THEN
    ALTER TABLE appointments ADD COLUMN payment_notes text;
  END IF;
END $$;

-- Create packages table
CREATE TABLE IF NOT EXISTS packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  service text NOT NULL,
  total_sessions integer NOT NULL,
  price numeric(10,2) NOT NULL,
  validity_days integer DEFAULT 365,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own packages"
  ON packages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own packages"
  ON packages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own packages"
  ON packages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own packages"
  ON packages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create client_packages table
CREATE TABLE IF NOT EXISTS client_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  package_id uuid REFERENCES packages(id) ON DELETE CASCADE NOT NULL,
  sessions_remaining integer NOT NULL,
  purchase_date timestamptz DEFAULT now(),
  expiry_date timestamptz NOT NULL,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE client_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own client packages"
  ON client_packages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own client packages"
  ON client_packages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own client packages"
  ON client_packages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own client packages"
  ON client_packages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create appointment_reminders table
CREATE TABLE IF NOT EXISTS appointment_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
  reminder_type text DEFAULT 'email',
  scheduled_for timestamptz NOT NULL,
  sent_at timestamptz,
  status text DEFAULT 'pending',
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE appointment_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own appointment reminders"
  ON appointment_reminders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own appointment reminders"
  ON appointment_reminders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own appointment reminders"
  ON appointment_reminders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own appointment reminders"
  ON appointment_reminders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON appointments(payment_status);
CREATE INDEX IF NOT EXISTS idx_appointments_payment_date ON appointments(payment_date);
CREATE INDEX IF NOT EXISTS idx_packages_user_id ON packages(user_id);
CREATE INDEX IF NOT EXISTS idx_packages_active ON packages(active);
CREATE INDEX IF NOT EXISTS idx_client_packages_client_id ON client_packages(client_id);
CREATE INDEX IF NOT EXISTS idx_client_packages_status ON client_packages(status);
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_appointment_id ON appointment_reminders(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_status ON appointment_reminders(status);
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_scheduled_for ON appointment_reminders(scheduled_for);
