-- Migrate rag_documents table to use location_id instead of agent_id
-- Supports both legacy agent_id and new location_id during transition

-- Add location_id column (nullable for migration period)
-- Only add FK constraint if locations table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rag_documents') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rag_documents' AND column_name = 'location_id') THEN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'locations') THEN
        ALTER TABLE rag_documents
          ADD COLUMN location_id UUID REFERENCES locations(id) ON DELETE CASCADE;
      ELSE
        -- Add without FK constraint if locations table doesn't exist yet
        ALTER TABLE rag_documents
          ADD COLUMN location_id UUID;
      END IF;
    END IF;
  END IF;
END $$;

-- Add raw_text column for storing extracted text (max ~2MB for MVP)
ALTER TABLE rag_documents
  ADD COLUMN IF NOT EXISTS raw_text TEXT;

-- Update status constraint to match new values: uploaded|embedded|error
ALTER TABLE rag_documents DROP CONSTRAINT IF EXISTS rag_documents_status_check;
ALTER TABLE rag_documents
  ADD CONSTRAINT rag_documents_status_check CHECK (status IN ('uploaded', 'embedded', 'error', 'queued', 'processing', 'ready', 'failed'));

-- Add mime_type column if not exists (from enhancement migration)
ALTER TABLE rag_documents
  ADD COLUMN IF NOT EXISTS mime_type TEXT;

-- Ensure title column exists (from enhancement migration)
ALTER TABLE rag_documents
  ADD COLUMN IF NOT EXISTS title TEXT;

-- Ensure source column exists (rename source_type to source for consistency)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rag_documents' AND column_name = 'source_type'
  ) THEN
    -- Rename source_type to source if it exists
    ALTER TABLE rag_documents RENAME COLUMN source_type TO source;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rag_documents' AND column_name = 'source'
  ) THEN
    -- Add source column if neither exists
    ALTER TABLE rag_documents ADD COLUMN source TEXT NOT NULL DEFAULT 'upload' CHECK (source IN ('upload', 'text', 'url'));
  END IF;
END $$;

-- Create index on location_id for efficient queries
CREATE INDEX IF NOT EXISTS idx_rag_documents_location_id ON rag_documents(location_id);

-- Create composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_rag_documents_location_status ON rag_documents(location_id, status);

-- Add comment
COMMENT ON COLUMN rag_documents.location_id IS 'Location ID (replaces agent_id for multi-tenant support)';
COMMENT ON COLUMN rag_documents.raw_text IS 'Extracted text content (max ~2MB for MVP)';
COMMENT ON COLUMN rag_documents.source IS 'Source type: upload (file), text (raw text input), url (from URL)';
