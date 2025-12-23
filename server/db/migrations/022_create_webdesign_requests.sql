-- Create webdesign_requests table for managing web design project requests
CREATE TABLE IF NOT EXISTS webdesign_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  company TEXT,
  request_type TEXT NOT NULL CHECK (request_type IN ('new', 'redesign')),
  current_website_url TEXT,
  project_description TEXT NOT NULL,
  files JSONB DEFAULT '[]'::jsonb, -- Array of file metadata: [{filename, size, mimeType, storagePath}]
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'info_requested', 'deposit_pending', 'deposit_paid', 'in_progress', 'preview_sent', 'final_payment_pending', 'final_payment_paid', 'completed', 'cancelled')),
  deposit_payment_id TEXT,
  deposit_payment_link TEXT,
  final_payment_id TEXT,
  final_payment_link TEXT,
  preview_url TEXT,
  login_credentials JSONB, -- {domain, server, username, password}
  admin_notes TEXT, -- Internal notes for admin
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_webdesign_requests_status ON webdesign_requests(status);
CREATE INDEX IF NOT EXISTS idx_webdesign_requests_email ON webdesign_requests(customer_email);
CREATE INDEX IF NOT EXISTS idx_webdesign_requests_created_at ON webdesign_requests(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_webdesign_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_webdesign_requests_updated_at
  BEFORE UPDATE ON webdesign_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_webdesign_requests_updated_at();

