-- Campaigns table
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  meta_valor BIGINT NOT NULL DEFAULT 0,
  valor_atual BIGINT NOT NULL DEFAULT 0,
  imagem TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'finished')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Donations table
CREATE TABLE public.donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  valor BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  donation_id UUID NOT NULL REFERENCES public.donations(id) ON DELETE CASCADE,
  gateway_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_donations_campaign ON public.donations(campaign_id);
CREATE INDEX idx_donations_status ON public.donations(status);
CREATE INDEX idx_transactions_donation ON public.transactions(donation_id);

-- Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Public read for campaigns
CREATE POLICY "Anyone can view active campaigns" ON public.campaigns
  FOR SELECT USING (true);

-- Allow insert/update/delete for campaigns (admin via edge functions)
CREATE POLICY "Allow all campaign management" ON public.campaigns
  FOR ALL USING (true) WITH CHECK (true);

-- Public insert for donations (via edge function)
CREATE POLICY "Anyone can create donations" ON public.donations
  FOR INSERT WITH CHECK (true);

-- Public read for donations
CREATE POLICY "Anyone can view donations" ON public.donations
  FOR SELECT USING (true);

-- Allow update for donations (webhook updates status)
CREATE POLICY "Allow donation updates" ON public.donations
  FOR UPDATE USING (true);

-- Allow delete for donations
CREATE POLICY "Allow donation deletes" ON public.donations
  FOR DELETE USING (true);

-- Transactions policies
CREATE POLICY "Allow all transaction operations" ON public.transactions
  FOR ALL USING (true) WITH CHECK (true);