-- Add updated_at column to subtasks table
-- Required for type consistency with SubTask interface in unified-task.ts

ALTER TABLE public.subtasks
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_subtasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_subtasks_updated_at ON public.subtasks;
CREATE TRIGGER update_subtasks_updated_at
  BEFORE UPDATE ON public.subtasks
  FOR EACH ROW
  EXECUTE FUNCTION update_subtasks_updated_at();

-- Add comment
COMMENT ON COLUMN public.subtasks.updated_at IS 'Timestamp when subtask was last updated';
