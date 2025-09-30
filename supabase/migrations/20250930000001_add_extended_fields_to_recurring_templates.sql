-- Add extended fields to recurring_templates table
-- This allows templates to store time, attachment info

-- Add start_time and end_time columns
ALTER TABLE recurring_templates
ADD COLUMN IF NOT EXISTS start_time TEXT,
ADD COLUMN IF NOT EXISTS end_time TEXT;

-- Add attachment columns (JSON format to match unified_tasks)
ALTER TABLE recurring_templates
ADD COLUMN IF NOT EXISTS attachment_file_name TEXT,
ADD COLUMN IF NOT EXISTS attachment_file_type TEXT,
ADD COLUMN IF NOT EXISTS attachment_file_size INTEGER,
ADD COLUMN IF NOT EXISTS attachment_file_data TEXT;

-- Add comments for clarity
COMMENT ON COLUMN recurring_templates.start_time IS 'Start time in HH:MM format (e.g., "09:00")';
COMMENT ON COLUMN recurring_templates.end_time IS 'End time in HH:MM format (e.g., "17:00")';
COMMENT ON COLUMN recurring_templates.attachment_file_name IS 'Original filename of attachment';
COMMENT ON COLUMN recurring_templates.attachment_file_type IS 'MIME type of attachment';
COMMENT ON COLUMN recurring_templates.attachment_file_size IS 'File size in bytes';
COMMENT ON COLUMN recurring_templates.attachment_file_data IS 'Base64 encoded file data';