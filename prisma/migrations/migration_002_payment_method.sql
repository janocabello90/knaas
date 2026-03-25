-- ============================================================
-- KNAAS — Migration 002: PaymentMethod enum + column
-- Run AFTER manual_migration.sql if you already ran it
-- ============================================================

DO $$ BEGIN
  CREATE TYPE "PaymentMethod" AS ENUM ('STRIPE', 'TRANSFERENCIA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "payment_method" "PaymentMethod" NOT NULL DEFAULT 'STRIPE';
