-- Add last_activated_at column to recurring_templates
-- Purpose: Track when a template was last activated (set to active=true)
-- Use case: Prevent task generation for dates when template was inactive (OFF)
--
-- Context: When a template is toggled OFF→ON, we should only generate tasks
-- from the activation date onwards, not for the OFF period.
--
-- See: WORK_HISTORY.md section "テンプレートON/OFF切替時の不要タスク生成を防止"

-- Add the column (nullable to allow for existing records)
ALTER TABLE recurring_templates
ADD COLUMN IF NOT EXISTS last_activated_at TIMESTAMPTZ;

-- Initialize existing active templates with their created_at timestamp
-- Rationale: Existing templates that are currently active should be treated
-- as if they were activated when they were created
UPDATE recurring_templates
SET last_activated_at = created_at
WHERE active = true AND last_activated_at IS NULL;

-- Leave inactive templates as NULL
-- Rationale: When they are activated later, last_activated_at will be set to that time

-- Add comment to the column for documentation
COMMENT ON COLUMN recurring_templates.last_activated_at IS
'Timestamp when this template was last set to active=true. Used to prevent task generation for periods when template was inactive. NULL for templates that have never been activated.';
