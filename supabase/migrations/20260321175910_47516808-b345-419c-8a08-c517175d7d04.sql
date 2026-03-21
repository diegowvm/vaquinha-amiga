
-- Add video column to campaigns
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS video text NOT NULL DEFAULT '';

-- Create storage bucket for campaign media
INSERT INTO storage.buckets (id, name, public) VALUES ('campaign-media', 'campaign-media', true) ON CONFLICT (id) DO NOTHING;

-- Allow public read access to campaign media
CREATE POLICY "Public can view campaign media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'campaign-media');

-- Allow public uploads (admin will handle via client)
CREATE POLICY "Allow campaign media uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'campaign-media');

-- Allow deletes
CREATE POLICY "Allow campaign media deletes"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'campaign-media');
