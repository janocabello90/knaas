-- ============================================================
-- KNAAS — Migration 003: IVA fields on payments
-- Ensures base_amount, iva_rate, iva_amount, total_amount exist
-- Safe to run even if "amount" column was already removed
-- Run in Supabase SQL Editor
-- ============================================================

-- Add new columns (IF NOT EXISTS = safe to re-run)
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "base_amount" DOUBLE PRECISION;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "iva_rate" DOUBLE PRECISION NOT NULL DEFAULT 21;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "iva_amount" DOUBLE PRECISION;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "total_amount" DOUBLE PRECISION;

-- Migrate existing data ONLY if old "amount" column still exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'amount'
  ) THEN
    UPDATE "payments"
    SET
      "total_amount" = "amount",
      "base_amount"  = ROUND(("amount" / 1.21)::numeric, 2),
      "iva_amount"   = ROUND(("amount" - "amount" / 1.21)::numeric, 2)
    WHERE "total_amount" IS NULL;
  END IF;
END $$;

-- Set defaults for any remaining NULLs
UPDATE "payments" SET "base_amount" = 0 WHERE "base_amount" IS NULL;
UPDATE "payments" SET "iva_amount" = 0 WHERE "iva_amount" IS NULL;
UPDATE "payments" SET "total_amount" = 0 WHERE "total_amount" IS NULL;

-- Make columns NOT NULL
ALTER TABLE "payments" ALTER COLUMN "base_amount" SET NOT NULL;
ALTER TABLE "payments" ALTER COLUMN "iva_amount" SET NOT NULL;
ALTER TABLE "payments" ALTER COLUMN "total_amount" SET NOT NULL;

-- Drop old amount column if it exists
ALTER TABLE "payments" DROP COLUMN IF EXISTS "amount";
