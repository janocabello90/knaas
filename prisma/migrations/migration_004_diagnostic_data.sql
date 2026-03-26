-- Migration 004: Diagnostic Data + Seguimiento Mensual
-- Run this in Supabase SQL Editor

-- ─── Diagnostic Data (Paso 1 exercises) ────────────────────────
CREATE TABLE IF NOT EXISTS diagnostic_data (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, year)
);

-- ─── Seguimiento Mensual (Monthly KPI tracking) ───────────────
CREATE TABLE IF NOT EXISTS seguimiento_mensual (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  fac_real DOUBLE PRECISION NOT NULL DEFAULT 0,
  ses_real INTEGER NOT NULL DEFAULT 0,
  pac_nuevos INTEGER NOT NULL DEFAULT 0,
  churn INTEGER NOT NULL DEFAULT 0,
  nps INTEGER,
  srvs_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, year, mes)
);

-- ─── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_diagnostic_data_user_year ON diagnostic_data(user_id, year);
CREATE INDEX IF NOT EXISTS idx_seguimiento_user_year ON seguimiento_mensual(user_id, year);

-- ─── RLS ──────────────────────────────────────────────────────
ALTER TABLE diagnostic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE seguimiento_mensual ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "user_own_diagnostic_data" ON diagnostic_data
    FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "user_own_seguimiento" ON seguimiento_mensual
    FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
