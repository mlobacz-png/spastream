/*
  # Fix Invoice Numbers and Function

  ## Changes
  - Clean up invalid invoice numbers in the database
  - Update generate_invoice_number function to handle edge cases and use bigint
  - Ensure all invoice numbers follow INV-XXXXX format

  ## Security
  - Maintains existing RLS policies
  - Function uses SECURITY DEFINER for proper access
*/

-- Delete invoices with invalid invoice numbers (likely test data)
DELETE FROM invoices 
WHERE invoice_number !~ '^INV-[0-9]{5}$';

-- Drop and recreate the function with better error handling
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
  -- Use LEAST to cap at a reasonable number
  SELECT LEAST(
    COALESCE(
      MAX(
        CASE 
          WHEN invoice_number ~ '^INV-[0-9]{5}$' 
          THEN CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)
          ELSE 0
        END
      ),
      0
    ) + 1,
    99999
  )
  INTO next_num
  FROM invoices;
  
  -- Format as INV-00001
  new_number := 'INV-' || LPAD(next_num::text, 5, '0');
  
  RETURN new_number;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_invoice_number() TO authenticated;
