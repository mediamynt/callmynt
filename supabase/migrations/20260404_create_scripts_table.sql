-- Create scripts table for Campaign Script Editor
CREATE TABLE IF NOT EXISTS public.scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  sections JSONB NOT NULL DEFAULT '[]',
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;

-- Allow all operations (for now, add auth checks later)
CREATE POLICY "Allow all operations on scripts" ON public.scripts
  FOR ALL USING (true) WITH CHECK (true);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_scripts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS scripts_updated_at ON public.scripts;
CREATE TRIGGER scripts_updated_at
  BEFORE UPDATE ON public.scripts
  FOR EACH ROW
  EXECUTE FUNCTION update_scripts_updated_at();
