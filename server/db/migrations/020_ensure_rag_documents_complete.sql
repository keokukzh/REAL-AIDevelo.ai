-- Ensure rag_documents table exists with all required columns
-- This migration consolidates all previous migrations and ensures the table is complete

-- Ensure set_updated_at function exists (required for triggers)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create table if it doesn't exist (without foreign keys to avoid dependency issues)
CREATE TABLE IF NOT EXISTS rag_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID, -- Optional, no FK constraint (agents table may not exist)
  location_id UUID, -- Will add FK constraint later if locations table exists
  name TEXT,
  title TEXT,
  file_path TEXT,
  original_file_name TEXT,
  file_type TEXT,
  mime_type TEXT,
  file_size BIGINT,
  raw_text TEXT,
  source TEXT NOT NULL DEFAULT 'upload' CHECK (source IN ('upload', 'text', 'url')),
  url TEXT,
  locale TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'embedded', 'error', 'queued', 'processing', 'ready', 'failed')),
  chunk_count INTEGER DEFAULT 0,
  error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add missing columns if they don't exist
DO $$
BEGIN
  -- agent_id (optional, no FK constraint)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rag_documents' AND column_name = 'agent_id'
  ) THEN
    ALTER TABLE rag_documents ADD COLUMN agent_id UUID;
  END IF;

  -- location_id (add FK constraint only if locations table exists)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rag_documents' AND column_name = 'location_id'
  ) THEN
    -- Check if locations table exists before adding FK
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'locations') THEN
      ALTER TABLE rag_documents ADD COLUMN location_id UUID REFERENCES locations(id) ON DELETE CASCADE;
    ELSE
      ALTER TABLE rag_documents ADD COLUMN location_id UUID;
    END IF;
  END IF;

  -- title
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rag_documents' AND column_name = 'title'
  ) THEN
    ALTER TABLE rag_documents ADD COLUMN title TEXT;
  END IF;

  -- original_file_name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rag_documents' AND column_name = 'original_file_name'
  ) THEN
    ALTER TABLE rag_documents ADD COLUMN original_file_name TEXT;
  END IF;

  -- mime_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rag_documents' AND column_name = 'mime_type'
  ) THEN
    ALTER TABLE rag_documents ADD COLUMN mime_type TEXT;
  END IF;

  -- raw_text
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rag_documents' AND column_name = 'raw_text'
  ) THEN
    ALTER TABLE rag_documents ADD COLUMN raw_text TEXT;
  END IF;

  -- source (handle both source_type and source)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rag_documents' AND column_name = 'source_type'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rag_documents' AND column_name = 'source'
  ) THEN
    ALTER TABLE rag_documents RENAME COLUMN source_type TO source;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rag_documents' AND column_name = 'source'
  ) THEN
    ALTER TABLE rag_documents ADD COLUMN source TEXT NOT NULL DEFAULT 'upload' CHECK (source IN ('upload', 'text', 'url'));
  END IF;

  -- url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rag_documents' AND column_name = 'url'
  ) THEN
    ALTER TABLE rag_documents ADD COLUMN url TEXT;
  END IF;

  -- locale
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rag_documents' AND column_name = 'locale'
  ) THEN
    ALTER TABLE rag_documents ADD COLUMN locale TEXT;
  END IF;

  -- tags
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rag_documents' AND column_name = 'tags'
  ) THEN
    ALTER TABLE rag_documents ADD COLUMN tags TEXT[] DEFAULT '{}';
  END IF;

  -- error
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rag_documents' AND column_name = 'error'
  ) THEN
    ALTER TABLE rag_documents ADD COLUMN error TEXT;
  END IF;

  -- metadata
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rag_documents' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE rag_documents ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Update status constraint to include all valid statuses
ALTER TABLE rag_documents DROP CONSTRAINT IF EXISTS rag_documents_status_check;
ALTER TABLE rag_documents
  ADD CONSTRAINT rag_documents_status_check CHECK (status IN ('uploaded', 'embedded', 'error', 'queued', 'processing', 'ready', 'failed'));

-- Update source constraint if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'rag_documents' 
    AND constraint_name = 'rag_documents_source_check'
  ) THEN
    ALTER TABLE rag_documents DROP CONSTRAINT rag_documents_source_check;
  END IF;
END $$;
ALTER TABLE rag_documents
  ADD CONSTRAINT rag_documents_source_check CHECK (source IN ('upload', 'text', 'url'));

-- Create indexes if they don't exist (only if columns exist)
DO $$
BEGIN
  -- location_id index
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rag_documents' AND column_name = 'location_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_rag_documents_location_id ON rag_documents(location_id);
    CREATE INDEX IF NOT EXISTS idx_rag_documents_location_status ON rag_documents(location_id, status);
  END IF;
  
  -- agent_id index (only if column exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rag_documents' AND column_name = 'agent_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_rag_documents_agent_id ON rag_documents(agent_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_rag_documents_status ON rag_documents(status);
CREATE INDEX IF NOT EXISTS idx_rag_documents_created_at ON rag_documents(created_at);

-- Create updated_at trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_rag_documents_updated_at ON rag_documents;
CREATE TRIGGER update_rag_documents_updated_at 
  BEFORE UPDATE ON rag_documents
  FOR EACH ROW 
  EXECUTE FUNCTION set_updated_at();

-- Add comments
COMMENT ON COLUMN rag_documents.location_id IS 'Location ID (replaces agent_id for multi-tenant support)';
COMMENT ON COLUMN rag_documents.raw_text IS 'Extracted text content (max ~2MB for MVP)';
COMMENT ON COLUMN rag_documents.source IS 'Source type: upload (file), text (raw text input), url (from URL)';
