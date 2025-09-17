-- Create unified_tasks table for centralized task management
-- Migration: 20250918120000_create_unified_tasks_table.sql
-- Purpose: Implement unified numbering system across all task types

CREATE TABLE unified_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic task information
  title TEXT NOT NULL,
  memo TEXT,

  -- Unified numbering system (core feature)
  display_number TEXT NOT NULL, -- Format: YYYYMMDDTTCCC

  -- Task classification
  task_type TEXT NOT NULL CHECK (task_type IN ('NORMAL', 'RECURRING', 'SHOPPING', 'IDEA')),

  -- Date fields
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at DATE,
  completed BOOLEAN DEFAULT FALSE,

  -- Recurring configuration (JSON format)
  recurring_config JSONB,
  -- Example: {"frequency": "WEEKLY", "interval_n": 1, "weekdays": [1,3,5], "active": true}

  -- Extended fields from existing schema
  importance INTEGER CHECK (importance >= 1 AND importance <= 5),
  category TEXT,
  urls TEXT[],
  attachment JSONB,

  -- Legacy compatibility fields
  rollover_count INTEGER DEFAULT 0,
  archived BOOLEAN DEFAULT FALSE,
  snoozed_until DATE,
  duration_min INTEGER,

  -- Constraints
  UNIQUE(user_id, display_number)
);

-- Performance indexes
CREATE INDEX idx_unified_tasks_user_type ON unified_tasks(user_id, task_type);
CREATE INDEX idx_unified_tasks_due_date ON unified_tasks(due_date) WHERE completed = FALSE;
CREATE INDEX idx_unified_tasks_display_number ON unified_tasks(user_id, display_number);
CREATE INDEX idx_unified_tasks_category ON unified_tasks(user_id, category) WHERE category IS NOT NULL;

-- RLS (Row Level Security) policies
ALTER TABLE unified_tasks ENABLE ROW LEVEL SECURITY;

-- Users can only access their own tasks
CREATE POLICY "Users can view their own unified tasks"
  ON unified_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own unified tasks"
  ON unified_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own unified tasks"
  ON unified_tasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own unified tasks"
  ON unified_tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Function to handle display number collision resolution
CREATE OR REPLACE FUNCTION handle_display_number_collision()
RETURNS TRIGGER AS $$
BEGIN
  -- If there's a collision, shift existing numbers up by 1
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.display_number != NEW.display_number) THEN
    -- Get the date and type prefix (first 10 characters)
    DECLARE
      number_prefix TEXT := SUBSTRING(NEW.display_number FROM 1 FOR 10);
      new_sequence INTEGER := SUBSTRING(NEW.display_number FROM 11 FOR 3)::INTEGER;
    BEGIN
      -- Shift existing numbers that are >= the new number
      UPDATE unified_tasks
      SET display_number = number_prefix || LPAD((SUBSTRING(display_number FROM 11 FOR 3)::INTEGER + 1)::TEXT, 3, '0'),
          updated_at = NOW()
      WHERE user_id = NEW.user_id
        AND display_number >= NEW.display_number
        AND display_number LIKE number_prefix || '%'
        AND id != NEW.id
      ORDER BY display_number DESC; -- Process in reverse order to avoid conflicts
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic collision resolution
CREATE TRIGGER trigger_handle_display_number_collision
  BEFORE INSERT OR UPDATE ON unified_tasks
  FOR EACH ROW
  EXECUTE FUNCTION handle_display_number_collision();

-- Function to generate display numbers
CREATE OR REPLACE FUNCTION generate_display_number(
  p_user_id UUID,
  p_due_date DATE DEFAULT NULL,
  p_task_type TEXT DEFAULT 'NORMAL'
) RETURNS TEXT AS $$
DECLARE
  date_part TEXT;
  type_code TEXT;
  next_sequence INTEGER;
  result_number TEXT;
BEGIN
  -- Determine date part
  IF p_due_date IS NULL THEN
    date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  ELSE
    date_part := TO_CHAR(p_due_date, 'YYYYMMDD');
  END IF;

  -- Determine type code (2-digit system for future expansion)
  CASE p_task_type
    WHEN 'NORMAL' THEN
      IF p_due_date IS NOT NULL AND p_due_date < CURRENT_DATE THEN
        type_code := '11'; -- Overdue
      ELSE
        type_code := '10'; -- Normal
      END IF;
    WHEN 'RECURRING' THEN type_code := '12';
    WHEN 'IDEA' THEN type_code := '13';
    WHEN 'SHOPPING' THEN type_code := '10'; -- Shopping is a category, not a type
    ELSE type_code := '10';
  END CASE;

  -- Find next available sequence number
  SELECT COALESCE(MAX(SUBSTRING(display_number FROM 11 FOR 3)::INTEGER), 0) + 1
  INTO next_sequence
  FROM unified_tasks
  WHERE user_id = p_user_id
    AND display_number LIKE date_part || type_code || '%';

  -- Ensure sequence is within 3-digit range
  IF next_sequence > 999 THEN
    RAISE EXCEPTION 'Too many tasks for date % and type %', date_part, type_code;
  END IF;

  -- Construct final number
  result_number := date_part || type_code || LPAD(next_sequence::TEXT, 3, '0');

  RETURN result_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-assign display numbers if not provided
CREATE OR REPLACE FUNCTION auto_assign_display_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.display_number IS NULL OR NEW.display_number = '' THEN
    NEW.display_number := generate_display_number(NEW.user_id, NEW.due_date, NEW.task_type);
  END IF;

  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_assign_display_number
  BEFORE INSERT OR UPDATE ON unified_tasks
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_display_number();

-- Comment on table
COMMENT ON TABLE unified_tasks IS 'Unified task management table with display numbering system';
COMMENT ON COLUMN unified_tasks.display_number IS 'Format: YYYYMMDDTTCCC where TT is type code and CCC is sequence';
COMMENT ON COLUMN unified_tasks.task_type IS 'NORMAL, RECURRING, SHOPPING (category), IDEA';
COMMENT ON COLUMN unified_tasks.recurring_config IS 'JSON configuration for recurring tasks';