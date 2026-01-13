/*
  # Fix generate_invoice_number Function Permissions

  ## Changes
  - Grant execute permission on generate_invoice_number to authenticated users
  - Set function security to SECURITY DEFINER so it can access data regardless of RLS

  ## Security
  - Function is safe because it only generates invoice numbers
  - No sensitive data exposure
*/

-- Drop and recreate the function with proper security settings
DROP FUNCTION IF EXISTS generate_invoice_number();

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS text
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_number text;
  next_num integer;
BEGIN
  -- Get the highest invoice number and increment
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)),
    0
  ) + 1
  INTO next_num
  FROM invoices
  WHERE invoice_number ~ '^INV-[0-9]+$';
  
  -- Format as INV-00001
  new_number := 'INV-' || LPAD(next_num::text, 5, '0');
  
  RETURN new_number;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_invoice_number() TO authenticated;
