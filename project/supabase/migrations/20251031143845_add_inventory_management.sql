/*
  # Inventory Management System

  1. New Tables
    - `inventory_products`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text) - Product/supply name
      - `sku` (text) - Stock keeping unit
      - `category` (text) - Botox, Filler, Serum, Equipment, etc.
      - `unit_type` (text) - Units, ml, vials, etc.
      - `current_quantity` (numeric) - Current stock level
      - `min_quantity` (numeric) - Minimum stock threshold
      - `reorder_quantity` (numeric) - Suggested reorder amount
      - `unit_cost` (numeric) - Cost per unit
      - `supplier_name` (text)
      - `supplier_contact` (text)
      - `expiration_date` (date)
      - `lot_number` (text)
      - `storage_location` (text)
      - `notes` (text)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `inventory_transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `product_id` (uuid, references inventory_products)
      - `transaction_type` (text) - 'purchase', 'usage', 'waste', 'adjustment'
      - `quantity` (numeric) - Amount (positive for additions, negative for usage)
      - `unit_cost` (numeric) - Cost at time of transaction
      - `total_cost` (numeric) - quantity * unit_cost
      - `appointment_id` (uuid, nullable, references appointments)
      - `client_id` (uuid, nullable, references clients)
      - `performed_by` (uuid, references auth.users)
      - `reason` (text) - Why transaction occurred
      - `notes` (text)
      - `transaction_date` (timestamptz)
      - `created_at` (timestamptz)

    - `inventory_alerts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `product_id` (uuid, references inventory_products)
      - `alert_type` (text) - 'low_stock', 'expiring_soon', 'expired'
      - `alert_threshold` (numeric) - For low stock alerts
      - `days_before_expiration` (integer) - For expiration alerts
      - `is_acknowledged` (boolean)
      - `acknowledged_by` (uuid, nullable, references auth.users)
      - `acknowledged_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own inventory
*/

-- Create inventory_products table
CREATE TABLE IF NOT EXISTS inventory_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  sku text,
  category text NOT NULL,
  unit_type text NOT NULL DEFAULT 'units',
  current_quantity numeric NOT NULL DEFAULT 0,
  min_quantity numeric NOT NULL DEFAULT 0,
  reorder_quantity numeric NOT NULL DEFAULT 0,
  unit_cost numeric NOT NULL DEFAULT 0,
  supplier_name text,
  supplier_contact text,
  expiration_date date,
  lot_number text,
  storage_location text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create inventory_transactions table
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES inventory_products(id) ON DELETE CASCADE NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'waste', 'adjustment')),
  quantity numeric NOT NULL,
  unit_cost numeric NOT NULL DEFAULT 0,
  total_cost numeric NOT NULL DEFAULT 0,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  performed_by uuid REFERENCES auth.users(id) NOT NULL,
  reason text,
  notes text,
  transaction_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create inventory_alerts table
CREATE TABLE IF NOT EXISTS inventory_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES inventory_products(id) ON DELETE CASCADE NOT NULL,
  alert_type text NOT NULL CHECK (alert_type IN ('low_stock', 'expiring_soon', 'expired')),
  alert_threshold numeric,
  days_before_expiration integer,
  is_acknowledged boolean DEFAULT false,
  acknowledged_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  acknowledged_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE inventory_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;

-- Policies for inventory_products
CREATE POLICY "Users can view their own products"
  ON inventory_products FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own products"
  ON inventory_products FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own products"
  ON inventory_products FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own products"
  ON inventory_products FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Policies for inventory_transactions
CREATE POLICY "Users can view their own transactions"
  ON inventory_transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own transactions"
  ON inventory_transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own transactions"
  ON inventory_transactions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own transactions"
  ON inventory_transactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Policies for inventory_alerts
CREATE POLICY "Users can view their own alerts"
  ON inventory_alerts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own alerts"
  ON inventory_alerts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own alerts"
  ON inventory_alerts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own alerts"
  ON inventory_alerts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_products_user ON inventory_products(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_products_category ON inventory_products(category);
CREATE INDEX IF NOT EXISTS idx_inventory_products_expiration ON inventory_products(expiration_date);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_user ON inventory_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON inventory_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_user ON inventory_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_product ON inventory_alerts(product_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_inventory_products_updated_at ON inventory_products;
CREATE TRIGGER update_inventory_products_updated_at
  BEFORE UPDATE ON inventory_products
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_updated_at();