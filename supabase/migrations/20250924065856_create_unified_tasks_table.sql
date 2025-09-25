-- Create unified_tasks table to consolidate tasks, recurring_tasks, and ideas
-- This table will replace the separate tasks, recurring_tasks, and ideas tables

CREATE TABLE IF NOT EXISTS unified_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Common fields for all task types
  title TEXT NOT NULL,
  memo TEXT,
  display_number TEXT, -- Unified numbering system: YYYYMMDDTTCCC format
  task_type TEXT NOT NULL CHECK (task_type IN ('NORMAL', 'RECURRING', 'IDEA')),
  category TEXT,
  importance INTEGER CHECK (importance >= 1 AND importance <= 5),

  -- Date fields (using special date '2999-12-31' for no due date)
  due_date DATE,

  -- Task metadata
  urls TEXT[] DEFAULT '{}',
  attachment JSONB,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Legacy fields (for compatibility)
  archived BOOLEAN DEFAULT FALSE,
  snoozed_until TIMESTAMPTZ,
  duration_min INTEGER,

  -- Recurring task specific fields
  recurring_pattern TEXT CHECK (recurring_pattern IN ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY')),
  recurring_weekdays INTEGER[] DEFAULT '{}',
  recurring_day INTEGER,
  recurring_month INTEGER,
  active BOOLEAN DEFAULT TRUE,

  -- Frequency fields (legacy compatibility)
  frequency TEXT,
  interval_n INTEGER,
  start_date DATE,
  end_date DATE,
  weekdays INTEGER[],
  month_day INTEGER,
  max_occurrences INTEGER,
  last_completed_date DATE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS unified_tasks_user_id_idx ON unified_tasks(user_id);
CREATE INDEX IF NOT EXISTS unified_tasks_task_type_idx ON unified_tasks(task_type);
CREATE INDEX IF NOT EXISTS unified_tasks_due_date_idx ON unified_tasks(due_date);
CREATE INDEX IF NOT EXISTS unified_tasks_completed_idx ON unified_tasks(completed);
CREATE INDEX IF NOT EXISTS unified_tasks_category_idx ON unified_tasks(category);
CREATE INDEX IF NOT EXISTS unified_tasks_display_number_idx ON unified_tasks(display_number);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_unified_tasks_updated_at ON unified_tasks;
CREATE TRIGGER update_unified_tasks_updated_at
    BEFORE UPDATE ON unified_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE unified_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own unified tasks" ON unified_tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own unified tasks" ON unified_tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own unified tasks" ON unified_tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own unified tasks" ON unified_tasks
    FOR DELETE USING (auth.uid() = user_id);