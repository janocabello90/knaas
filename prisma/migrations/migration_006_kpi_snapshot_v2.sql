-- Migration 006: KpiSnapshot v2 — per-service & per-worker data + new metrics
-- Adds JSON columns for dynamic service/worker breakdown and new metric fields

ALTER TABLE kpi_snapshots
  ADD COLUMN IF NOT EXISTS service_data JSONB,
  ADD COLUMN IF NOT EXISTS worker_data JSONB,
  ADD COLUMN IF NOT EXISTS new_patients INTEGER,
  ADD COLUMN IF NOT EXISTS total_patients INTEGER,
  ADD COLUMN IF NOT EXISTS total_sessions INTEGER;
