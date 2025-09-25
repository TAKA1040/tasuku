-- Create recurring_templates table for Phase 2: Template Management System
-- Based on RECURRING_REDESIGN_LOG.md specification

CREATE TABLE recurring_templates (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  memo TEXT,
  category TEXT,
  importance INTEGER DEFAULT 1,
  pattern TEXT NOT NULL CHECK (pattern IN ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY')),

  -- For weekly: weekday specification [1,2,3,4,5] (Mon=1, Tue=2, ..., Sun=7)
  weekdays INTEGER[],

  -- For monthly: day specification (1-31)
  day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 31),

  -- For yearly: month specification (1-12)
  month_of_year INTEGER CHECK (month_of_year >= 1 AND month_of_year <= 12),

  -- For yearly: day specification (1-31)
  day_of_year INTEGER CHECK (day_of_year >= 1 AND day_of_year <= 31),

  active BOOLEAN DEFAULT true,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE recurring_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own templates
CREATE POLICY "Users can manage their own recurring templates" ON recurring_templates
FOR ALL USING (auth.uid()::text = user_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_recurring_templates_updated_at ON recurring_templates;
CREATE TRIGGER update_recurring_templates_updated_at
    BEFORE UPDATE ON recurring_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Index for performance
CREATE INDEX idx_recurring_templates_user_id ON recurring_templates(user_id);
CREATE INDEX idx_recurring_templates_pattern ON recurring_templates(pattern);
CREATE INDEX idx_recurring_templates_active ON recurring_templates(active);