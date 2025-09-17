-- Migration: Add order_index column to tasks table
-- Purpose: Enable drag-and-drop task reordering functionality
-- Date: 2025-09-17

-- Add order_index column to tasks table
ALTER TABLE tasks
ADD COLUMN order_index INTEGER;

-- Create an index for better performance when sorting by order_index
CREATE INDEX idx_tasks_order_index ON tasks(order_index);

-- Create an index for compound sorting (user_id + order_index)
CREATE INDEX idx_tasks_user_order ON tasks(user_id, order_index);

-- Update existing tasks to have default order_index values
-- Set order_index based on creation order for existing tasks
WITH ordered_tasks AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as row_num
  FROM tasks
  WHERE order_index IS NULL
)
UPDATE tasks
SET order_index = ordered_tasks.row_num
FROM ordered_tasks
WHERE tasks.id = ordered_tasks.id;

-- Add a comment to the column for documentation
COMMENT ON COLUMN tasks.order_index IS 'Custom ordering index for drag-and-drop functionality. Lower values appear first.';