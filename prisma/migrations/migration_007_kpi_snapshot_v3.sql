-- Migration 007: KpiSnapshot v3 — churn fields, manual expenses, occupancy
-- Per-service uniquePatients12m stored in service_data JSON
-- Per-worker isOwner stored in worker_data JSON

ALTER TABLE kpi_snapshots
  ADD COLUMN IF NOT EXISTS total_patients_12m INTEGER,
  ADD COLUMN IF NOT EXISTS single_visit_pat_12m INTEGER,
  ADD COLUMN IF NOT EXISTS monthly_expenses JSONB,
  ADD COLUMN IF NOT EXISTS use_manual_expenses BOOLEAN DEFAULT false;
