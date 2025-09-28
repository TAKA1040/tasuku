-- Add urls field to recurring_templates table
-- This field will store an array of URLs for each template

ALTER TABLE recurring_templates
ADD COLUMN urls TEXT[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN recurring_templates.urls IS 'Array of URLs associated with the template (max 5 recommended)';