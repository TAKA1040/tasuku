-- Create fuel_records table for nenpi tool integration
-- Stores fuel refueling records for mileage tracking and analysis

CREATE TABLE IF NOT EXISTS public.fuel_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic fuel record data
  date DATE NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  cost INTEGER NOT NULL CHECK (cost > 0),
  mileage NUMERIC(12,1) NOT NULL CHECK (mileage >= 0),
  station TEXT NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS fuel_records_user_id_idx ON public.fuel_records(user_id);
CREATE INDEX IF NOT EXISTS fuel_records_date_idx ON public.fuel_records(date);
CREATE INDEX IF NOT EXISTS fuel_records_station_idx ON public.fuel_records(station);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_fuel_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_fuel_records_updated_at ON public.fuel_records;
CREATE TRIGGER update_fuel_records_updated_at
  BEFORE UPDATE ON public.fuel_records
  FOR EACH ROW
  EXECUTE FUNCTION update_fuel_records_updated_at();

-- Enable Row Level Security
ALTER TABLE public.fuel_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own records
CREATE POLICY "Users can view their own fuel records"
  ON public.fuel_records
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own fuel records"
  ON public.fuel_records
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fuel records"
  ON public.fuel_records
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fuel records"
  ON public.fuel_records
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE public.fuel_records IS 'Fuel refueling records for mileage tracking and analysis (nenpi tool)';
