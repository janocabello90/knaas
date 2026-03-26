-- Migration 005: User Consents (RGPD/LOPDGDD compliance)
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_consents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL,  -- 'terms', 'privacy', 'ai_processing', 'marketing', 'cookies_analytics'
  granted BOOLEAN NOT NULL DEFAULT false,
  version TEXT NOT NULL,  -- policy version accepted
  ip TEXT,
  user_agent TEXT,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  UNIQUE(user_id, purpose)
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user ON user_consents(user_id);

ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "user_own_consents" ON user_consents
    FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
