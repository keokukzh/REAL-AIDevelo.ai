-- Manual migration fixes (idempotent)
-- Safe SQL to recreate missing view(s), ensure expected columns exist,
-- and create schema_migrations table so the migration runner can be tracked.
-- Run this from Supabase SQL Editor (Primary Database) or via psql using the pooler connection string.

-- 0) Ensure schema_migrations exists
CREATE TABLE IF NOT EXISTS public.schema_migrations (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
-- 1) Ensure common columns used by migrations exist (add only if missing)
-- Add these columns before creating views that reference them.
ALTER TABLE IF EXISTS public.call_logs ADD COLUMN IF NOT EXISTS agent_id UUID;

-- 2) Recreate `agent_call_metrics` view (idempotent)
CREATE OR REPLACE VIEW public.agent_call_metrics AS
SELECT
  agent_id,
  DATE_TRUNC('month', start_time) as month,
  COUNT(*) as total_calls,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_calls,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_calls,
  AVG(EXTRACT(EPOCH FROM (end_time - start_time))) as avg_duration_seconds,
  AVG(success_rate) as avg_success_rate,
  MAX(start_time) as last_call
FROM public.call_logs
GROUP BY agent_id, DATE_TRUNC('month', start_time)
ORDER BY month DESC;

-- 2) Ensure `phone_numbers.assigned_agent_id` exists and add FK if appropriate
ALTER TABLE IF EXISTS public.phone_numbers
  ADD COLUMN IF NOT EXISTS assigned_agent_id UUID;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='phone_numbers')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='agents')
  THEN
    BEGIN
      ALTER TABLE public.phone_numbers
        ADD CONSTRAINT IF NOT EXISTS phone_numbers_assigned_agent_id_fkey FOREIGN KEY (assigned_agent_id) REFERENCES public.agents(id) ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN
      -- ignore race/duplicate
      RAISE NOTICE 'FK already exists or race condition';
    END;
  END IF;
END$$;

-- 3) Ensure `rag_documents` migration columns exist (idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='rag_documents') THEN

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='rag_documents' AND column_name='location_id'
    ) THEN
      ALTER TABLE public.rag_documents ADD COLUMN location_id UUID;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='rag_documents' AND column_name='raw_text'
    ) THEN
      ALTER TABLE public.rag_documents ADD COLUMN raw_text TEXT;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='rag_documents' AND column_name='source'
    ) THEN
      ALTER TABLE public.rag_documents ADD COLUMN source TEXT NOT NULL DEFAULT 'upload';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='rag_documents' AND column_name='mime_type'
    ) THEN
      ALTER TABLE public.rag_documents ADD COLUMN mime_type TEXT;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='rag_documents' AND column_name='title'
    ) THEN
      ALTER TABLE public.rag_documents ADD COLUMN title TEXT;
    END IF;

  END IF;
END$$;

-- 4) Ensure common columns used by migrations exist (add only if missing)
ALTER TABLE IF EXISTS public.call_logs ADD COLUMN IF NOT EXISTS agent_id UUID;

-- 5) Helpful check queries (uncomment or run as separate queries in SQL editor)
-- SELECT name, applied_at FROM public.schema_migrations ORDER BY applied_at;
-- SELECT schemaname, tablename FROM pg_tables WHERE tablename ILIKE '%migration%';
-- SELECT viewname FROM pg_views WHERE schemaname='public' AND viewname='agent_call_metrics';
-- SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('call_logs','phone_numbers','rag_documents') ORDER BY table_name, column_name;

-- 6) Optional: if you executed migration SQL files manually, mark them as applied to avoid runner re-applying.
-- Example (uncomment and edit to match files you executed):
-- INSERT INTO public.schema_migrations (name) VALUES
-- ('001_create_users_table.sql'),
-- ('002_create_agents_table.sql'),
-- ('003_create_purchases_table.sql')
-- ON CONFLICT (name) DO NOTHING;

-- End of manual_migration_fixes.sql
