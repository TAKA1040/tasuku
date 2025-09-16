-- Create SubTasks table for shopping lists and task breakdown
CREATE TABLE IF NOT EXISTS public.subtasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_task_id uuid NOT NULL,
    title text NOT NULL,
    completed boolean NOT NULL DEFAULT false,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_subtasks_user_id ON public.subtasks(user_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_parent_task_id ON public.subtasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_completed ON public.subtasks(completed);
CREATE INDEX IF NOT EXISTS idx_subtasks_sort_order ON public.subtasks(sort_order);

-- Enable Row Level Security
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for SubTasks
CREATE POLICY "Users can view their own subtasks"
    ON public.subtasks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subtasks"
    ON public.subtasks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subtasks"
    ON public.subtasks FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subtasks"
    ON public.subtasks FOR DELETE
    USING (auth.uid() = user_id);