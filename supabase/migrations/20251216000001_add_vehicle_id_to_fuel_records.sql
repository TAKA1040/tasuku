-- Add vehicle_id column to fuel_records for multi-vehicle support
-- vehicle_id: 1 = 車両1（デフォルト）, 2 = 車両2

ALTER TABLE public.fuel_records
ADD COLUMN IF NOT EXISTS vehicle_id INTEGER DEFAULT 1 CHECK (vehicle_id IN (1, 2));

-- Create index for vehicle_id
CREATE INDEX IF NOT EXISTS fuel_records_vehicle_id_idx ON public.fuel_records(vehicle_id);

-- Update existing records to have vehicle_id = 1
UPDATE public.fuel_records SET vehicle_id = 1 WHERE vehicle_id IS NULL;

-- Add comment
COMMENT ON COLUMN public.fuel_records.vehicle_id IS 'Vehicle identifier (1 or 2) for multi-vehicle support';
