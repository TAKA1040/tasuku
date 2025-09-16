-- Create Settings table for user preferences and configuration
CREATE TABLE IF NOT EXISTS public.user_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    timezone text NOT NULL DEFAULT 'Asia/Tokyo',
    urgency_thresholds jsonb NOT NULL DEFAULT '{"soon": 3, "next7": 7, "next30": 30}',
    features jsonb NOT NULL DEFAULT '{"connectors_readonly": false, "plan_suggestion": false, "ml_ranking": false, "geolocation": false}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id)  -- One settings record per user
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- Enable Row Level Security
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for Settings
CREATE POLICY "Users can view their own settings"
    ON public.user_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
    ON public.user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
    ON public.user_settings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings"
    ON public.user_settings FOR DELETE
    USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER handle_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();