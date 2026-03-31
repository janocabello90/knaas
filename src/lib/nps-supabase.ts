import { createClient } from "@supabase/supabase-js";

/**
 * Secondary Supabase client for reading NPS data.
 * Uses service role key to bypass RLS (server-side only).
 *
 * Required env vars:
 *   NPS_SUPABASE_URL         – e.g. https://dgnazpsulhrhikviktfa.supabase.co
 *   NPS_SUPABASE_SERVICE_KEY – service_role key from the NPS Supabase project
 */

const npsUrl = process.env.NPS_SUPABASE_URL;
const npsKey = process.env.NPS_SUPABASE_SERVICE_KEY;

function getNpsSupabase() {
  if (!npsUrl || !npsKey) {
    return null;
  }
  return createClient(npsUrl, npsKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const npsSupabase = getNpsSupabase();
