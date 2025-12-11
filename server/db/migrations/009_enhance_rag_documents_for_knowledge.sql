-- Extend rag_documents to support knowledge ingestion metadata and queued jobs
ALTER TABLE rag_documents
  ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'upload' CHECK (source_type IN ('upload','url')),
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS url TEXT,
  ADD COLUMN IF NOT EXISTS locale TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS error TEXT,
  ADD COLUMN IF NOT EXISTS original_file_name TEXT,
  ADD COLUMN IF NOT EXISTS file_type TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Expand allowed statuses to include queued
ALTER TABLE rag_documents DROP CONSTRAINT IF EXISTS rag_documents_status_check;
ALTER TABLE rag_documents
  ALTER COLUMN status SET DEFAULT 'queued';
ALTER TABLE rag_documents
  ADD CONSTRAINT rag_documents_status_check CHECK (status IN ('queued','processing','ready','failed'));

-- Backfill previously processing docs to ready to avoid failing new constraint
UPDATE rag_documents SET status = 'ready' WHERE status = 'processing';

-- Helpful indexes for filtering/pagination
CREATE INDEX IF NOT EXISTS idx_rag_documents_agent_status ON rag_documents(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_rag_documents_created_at ON rag_documents(created_at);
