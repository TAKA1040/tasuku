-- Add attachment field to tasks and recurring_tasks tables
-- This field stores file attachments as JSON with file metadata and base64 data

-- Add attachment field to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS attachment JSONB;

-- Add attachment field to recurring_tasks table
ALTER TABLE recurring_tasks ADD COLUMN IF NOT EXISTS attachment JSONB;

-- Add comments to document the schema
COMMENT ON COLUMN tasks.attachment IS 'File attachment stored as JSON with file_name, file_type, file_size, and file_data (base64)';
COMMENT ON COLUMN recurring_tasks.attachment IS 'File attachment stored as JSON with file_name, file_type, file_size, and file_data (base64)';