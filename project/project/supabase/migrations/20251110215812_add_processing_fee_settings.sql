/*
  # Add Processing Fee Settings

  1. Changes to payment_settings table
    - Add `pass_processing_fees` (boolean) - Whether to pass fees to customers
    - Add `processing_fee_percentage` (decimal) - Fee percentage (default 2.9%)
    - Add `processing_fee_fixed` (decimal) - Fixed fee per transaction (default $0.30)

  2. Notes
    - Stripe standard fees: 2.9% + $0.30 per transaction
    - These can be customized based on your Stripe agreement
    - Fees are only applied when pass_processing_fees is enabled
*/

-- Add processing fee columns to payment_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_settings' AND column_name = 'pass_processing_fees'
  ) THEN
    ALTER TABLE payment_settings ADD COLUMN pass_processing_fees boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_settings' AND column_name = 'processing_fee_percentage'
  ) THEN
    ALTER TABLE payment_settings ADD COLUMN processing_fee_percentage decimal DEFAULT 0.029;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_settings' AND column_name = 'processing_fee_fixed'
  ) THEN
    ALTER TABLE payment_settings ADD COLUMN processing_fee_fixed decimal DEFAULT 0.30;
  END IF;
END $$;

-- Add processing_fee_amount column to transactions table to track actual fee charged
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'processing_fee_amount'
  ) THEN
    ALTER TABLE transactions ADD COLUMN processing_fee_amount decimal DEFAULT 0;
  END IF;
END $$;
