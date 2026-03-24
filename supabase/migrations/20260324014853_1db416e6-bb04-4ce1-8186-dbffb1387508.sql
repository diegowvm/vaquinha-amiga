
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page text NOT NULL DEFAULT '/',
  referrer text DEFAULT '',
  user_agent text DEFAULT '',
  device_type text DEFAULT 'desktop',
  country text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert page views" ON public.page_views FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow select page views" ON public.page_views FOR SELECT TO public USING (true);

CREATE INDEX idx_page_views_created_at ON public.page_views (created_at DESC);
CREATE INDEX idx_page_views_page ON public.page_views (page);
