-- Create done table for tracking task completion records
CREATE TABLE IF NOT EXISTS public.done (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_task_id UUID NOT NULL, -- Reference to the unified_tasks id
  task_title TEXT NOT NULL,
  completion_date DATE NOT NULL,
  completion_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_done_original_task_id ON public.done(original_task_id);
CREATE INDEX IF NOT EXISTS idx_done_user_id ON public.done(user_id);
CREATE INDEX IF NOT EXISTS idx_done_completion_date ON public.done(completion_date);

-- Enable RLS (Row Level Security)
ALTER TABLE public.done ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own done records" ON public.done
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own done records" ON public.done
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own done records" ON public.done
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own done records" ON public.done
  FOR DELETE USING (auth.uid() = user_id);