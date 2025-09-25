-- Create user_metadata table for storing user-specific settings
-- Used by task generation system to track last generation date

CREATE TABLE user_metadata (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint for user_id + key combination
  UNIQUE(user_id, key)
);

-- Enable RLS (Row Level Security)
ALTER TABLE user_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own metadata
CREATE POLICY "Users can manage their own metadata" ON user_metadata
FOR ALL USING (auth.uid()::text = user_id);

-- Updated at trigger
DROP TRIGGER IF EXISTS update_user_metadata_updated_at ON user_metadata;
CREATE TRIGGER update_user_metadata_updated_at
    BEFORE UPDATE ON user_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Index for performance
CREATE INDEX idx_user_metadata_user_id ON user_metadata(user_id);
CREATE INDEX idx_user_metadata_key ON user_metadata(key);
CREATE INDEX idx_user_metadata_user_key ON user_metadata(user_id, key);