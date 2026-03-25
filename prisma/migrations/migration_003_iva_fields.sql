-- ============================================================
-- KNAAS — Migration 003: IVA fields on payments
-- Replaces single "amount" with base_amount + iva_rate + iva_amount + total_amount
-- Importes se introducen SIN IVA, se añade 21% encima
-- Run in Supabase SQL Editor
-- ============================================================

-- Add new columns
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "base_amount" DOUBLE PRECISION;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "iva_rate" DOUBLE PRECISION NOT NULL DEFAULT 21;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "iva_amount" DOUBLE PRECISION;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "total_amount" DOUBLE PRECISION;

-- Migrate existing data: treat current "amount" as total (IVA included)
-- base = total / 1.21, iva = total - base
UPDATE "payments"
SET
  "total_amount" = "amount",
  "base_amount"  = ROUND(("amount" / 1.21)::numeric, 2),
  "iva_amount"   = ROUND(("amount" - "amount" / 1.21)::numeric, 2)
WHERE "total_amount" IS NULL;

-- Set defaults for any remaining NULLs (new tables with no data)
UPDATE "payments" SET "base_amount" = 0 WHERE "base_amount" IS NULL;
UPDATE "payments" SET "iva_amount" = 0 WHERE "iva_amount" IS NULL;
UPDATE "payments" SET "total_amount" = 0 WHERE "total_amount" IS NULL;

-- Make columns NOT NULL
ALTER TABLE "payments" ALTER COLUMN "base_amount" SET NOT NULL;
ALTER TABLE "payments" ALTER COLUMN "iva_amount" SET NOT NULL;
ALTER TABLE "payments" ALTER COLUMN "total_amount" SET NOT NULL;

-- Drop old amount column (Prisma no longer references it)
ALTER TABLE "payments" DROP COLUMN IF EXISTS "amount";
