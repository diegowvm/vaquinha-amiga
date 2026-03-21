-- Function to atomically increment campaign valor_atual
CREATE OR REPLACE FUNCTION public.increment_campaign_valor(p_campaign_id UUID, p_valor BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.campaigns
  SET valor_atual = valor_atual + p_valor
  WHERE id = p_campaign_id;
END;
$$;