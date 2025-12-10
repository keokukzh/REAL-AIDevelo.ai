-- Create RAG documents table for storing document metadata
CREATE TABLE IF NOT EXISTS rag_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT,
  file_type TEXT,
  file_size BIGINT,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
  chunk_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_rag_documents_agent_id ON rag_documents(agent_id);
CREATE INDEX IF NOT EXISTS idx_rag_documents_status ON rag_documents(status);

-- Create updated_at trigger
CREATE TRIGGER update_rag_documents_updated_at BEFORE UPDATE ON rag_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

