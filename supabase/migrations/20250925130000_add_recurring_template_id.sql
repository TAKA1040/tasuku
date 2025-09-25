-- Add recurring_template_id field to unified_tasks table
-- This field links recurring tasks to their templates

ALTER TABLE unified_tasks ADD COLUMN IF NOT EXISTS recurring_template_id TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS unified_tasks_recurring_template_id_idx ON unified_tasks(recurring_template_id);

-- Add foreign key constraint (optional, for data integrity)
-- Note: We use TEXT instead of UUID to allow flexibility
-- ALTER TABLE unified_tasks ADD CONSTRAINT fk_recurring_template
--   FOREIGN KEY (recurring_template_id) REFERENCES recurring_templates(id) ON DELETE SET NULL;