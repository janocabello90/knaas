-- ============================================================
-- KNAAS — Manual SQL Migration
-- Run this in Supabase SQL Editor (in order, top to bottom)
-- Date: 2026-03-25
-- ============================================================
-- This migration adds:
--   1. New enums: BusinessType, PaymentStatus, PaymentType, InvitationLinkType
--   2. Billing + shipping fields on users table
--   3. Pricing fields on cohorts table
--   4. objectives column on mentoring_sessions table
--   5. New table: payments
--   6. New table: invitation_links
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. NEW ENUMS
-- ────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "BusinessType" AS ENUM ('PARTICULAR', 'AUTONOMO', 'EMPRESA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentType" AS ENUM ('SINGLE', 'INSTALLMENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "InvitationLinkType" AS ENUM ('PAYMENT', 'FREE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentMethod" AS ENUM ('STRIPE', 'TRANSFERENCIA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ────────────────────────────────────────────────────────────
-- 2. ALTER TABLE users — Billing fields
-- ────────────────────────────────────────────────────────────

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripe_customer_id" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "fiscal_name" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "nif_cif" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "business_type" "BusinessType";
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "company_name" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "fiscal_address" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "fiscal_city" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "fiscal_province" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "fiscal_postal_code" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "fiscal_country" TEXT DEFAULT 'España';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "irpf_applies" BOOLEAN NOT NULL DEFAULT false;

-- ────────────────────────────────────────────────────────────
-- 3. ALTER TABLE users — Shipping fields
-- ────────────────────────────────────────────────────────────

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "shipping_name" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "shipping_address" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "shipping_city" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "shipping_province" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "shipping_postal_code" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "shipping_country" TEXT DEFAULT 'España';

-- ────────────────────────────────────────────────────────────
-- 4. ALTER TABLE cohorts — Pricing & description fields
-- ────────────────────────────────────────────────────────────

ALTER TABLE "cohorts" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "cohorts" ADD COLUMN IF NOT EXISTS "max_students" INTEGER;
ALTER TABLE "cohorts" ADD COLUMN IF NOT EXISTS "price" DOUBLE PRECISION;
ALTER TABLE "cohorts" ADD COLUMN IF NOT EXISTS "installment_price" DOUBLE PRECISION;
ALTER TABLE "cohorts" ADD COLUMN IF NOT EXISTS "installment_count" INTEGER;

-- ────────────────────────────────────────────────────────────
-- 5. ALTER TABLE mentoring_sessions — Objectives
-- ────────────────────────────────────────────────────────────

ALTER TABLE "mentoring_sessions" ADD COLUMN IF NOT EXISTS "objectives" TEXT;

-- ────────────────────────────────────────────────────────────
-- 6. CREATE TABLE payments
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "payments" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "user_id" TEXT NOT NULL,
  "cohort_id" TEXT,
  "enrollment_id" TEXT,
  "amount" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "type" "PaymentType" NOT NULL DEFAULT 'SINGLE',
  "payment_method" "PaymentMethod" NOT NULL DEFAULT 'STRIPE',
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "installment_number" INTEGER,
  "total_installments" INTEGER,
  "stripe_payment_intent_id" TEXT,
  "stripe_session_id" TEXT,
  "stripe_invoice_id" TEXT,
  "invoice_number" TEXT,
  "notes" TEXT,
  "paid_at" TIMESTAMP(3),
  "refunded_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- Foreign keys for payments
DO $$ BEGIN
  ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "payments" ADD CONSTRAINT "payments_cohort_id_fkey"
    FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "payments" ADD CONSTRAINT "payments_enrollment_id_fkey"
    FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ────────────────────────────────────────────────────────────
-- 7. CREATE TABLE invitation_links
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "invitation_links" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "code" TEXT NOT NULL,
  "type" "InvitationLinkType" NOT NULL DEFAULT 'PAYMENT',
  "cohort_id" TEXT NOT NULL,
  "email" TEXT,
  "max_uses" INTEGER NOT NULL DEFAULT 1,
  "used_count" INTEGER NOT NULL DEFAULT 0,
  "price" DOUBLE PRECISION,
  "installments_ok" BOOLEAN NOT NULL DEFAULT true,
  "expires_at" TIMESTAMP(3),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_by_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "invitation_links_pkey" PRIMARY KEY ("id")
);

-- Unique constraint on code
CREATE UNIQUE INDEX IF NOT EXISTS "invitation_links_code_key" ON "invitation_links"("code");

-- Foreign keys for invitation_links
DO $$ BEGIN
  ALTER TABLE "invitation_links" ADD CONSTRAINT "invitation_links_cohort_id_fkey"
    FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "invitation_links" ADD CONSTRAINT "invitation_links_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ────────────────────────────────────────────────────────────
-- 8. Enable RLS (Supabase best practice)
-- ────────────────────────────────────────────────────────────

ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invitation_links" ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access (your API uses service_role key)
DO $$ BEGIN
  CREATE POLICY "service_role_payments" ON "payments"
    FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "service_role_invitation_links" ON "invitation_links"
    FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ────────────────────────────────────────────────────────────
-- DONE! Verify with:
--   SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name LIKE 'fiscal%';
--   SELECT * FROM payments LIMIT 0;
--   SELECT * FROM invitation_links LIMIT 0;
-- ────────────────────────────────────────────────────────────
