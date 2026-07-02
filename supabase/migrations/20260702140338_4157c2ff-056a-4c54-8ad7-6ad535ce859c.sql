
-- promo_codes
CREATE TABLE public.promo_codes (
  code text PRIMARY KEY,
  bonus_percent integer NOT NULL DEFAULT 100,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamp with time zone,
  max_uses integer,
  used_count integer NOT NULL DEFAULT 0,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.promo_codes TO anon, authenticated;
GRANT ALL ON public.promo_codes TO service_role;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active promo codes"
  ON public.promo_codes FOR SELECT
  USING (active = true);

CREATE POLICY "Admins can view all promo codes"
  ON public.promo_codes FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert promo codes"
  ON public.promo_codes FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update promo codes"
  ON public.promo_codes FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete promo codes"
  ON public.promo_codes FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_promo_codes_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- add promo_code to transactions
ALTER TABLE public.transactions ADD COLUMN promo_code text;

-- whatsapp_campaigns
CREATE TABLE public.whatsapp_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  campaign_key text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  phone text,
  message text,
  provider_response jsonb,
  error text,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, campaign_key)
);

GRANT SELECT ON public.whatsapp_campaigns TO authenticated;
GRANT ALL ON public.whatsapp_campaigns TO service_role;
ALTER TABLE public.whatsapp_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view campaigns"
  ON public.whatsapp_campaigns FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_whatsapp_campaigns_user ON public.whatsapp_campaigns(user_id);
CREATE INDEX idx_whatsapp_campaigns_key ON public.whatsapp_campaigns(campaign_key, sent_at DESC);

-- remarketing_settings (single row config)
CREATE TABLE public.remarketing_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  whatsapp_enabled boolean NOT NULL DEFAULT false,
  whatsapp_template text NOT NULL DEFAULT 'Oi {nome}! 🎰 Vi que você criou sua conta na BetVipMax mas ainda não jogou. Preparei um bônus EXCLUSIVO de 200% no seu primeiro depósito. Bora ganhar? 👉 https://bettvipmax.com/promo/VOLTA200',
  delay_hours numeric NOT NULL DEFAULT 1,
  provider text NOT NULL DEFAULT 'zapi',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.remarketing_settings TO authenticated;
GRANT ALL ON public.remarketing_settings TO service_role;
ALTER TABLE public.remarketing_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view settings"
  ON public.remarketing_settings FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.remarketing_settings (id) VALUES (1);

-- Admin RPC: update remarketing settings
CREATE OR REPLACE FUNCTION public.admin_update_remarketing_settings(
  _enabled boolean,
  _template text,
  _delay_hours numeric,
  _provider text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE public.remarketing_settings
    SET whatsapp_enabled = _enabled,
        whatsapp_template = _template,
        delay_hours = _delay_hours,
        provider = _provider,
        updated_at = now()
    WHERE id = 1;
END;
$$;

-- Admin RPC: leads without deposit (created_at older than N hours, no completed deposit)
CREATE OR REPLACE FUNCTION public.admin_get_leads_without_deposit(_min_hours numeric DEFAULT 1)
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  phone text,
  created_at timestamp with time zone,
  already_messaged boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY
  SELECT p.user_id, p.email, p.full_name, p.phone, p.created_at,
    EXISTS(SELECT 1 FROM public.whatsapp_campaigns w
           WHERE w.user_id = p.user_id AND w.campaign_key = 'sem_deposito_1h') AS already_messaged
  FROM public.profiles p
  WHERE p.created_at < (now() - make_interval(mins => (_min_hours * 60)::int))
    AND NOT EXISTS (
      SELECT 1 FROM public.transactions t
      WHERE t.user_id = p.user_id
        AND t.type = 'deposit'
        AND t.status = 'completed'
    )
  ORDER BY p.created_at DESC;
END;
$$;

-- Admin RPC: campaign log
CREATE OR REPLACE FUNCTION public.admin_get_campaigns(_offset integer DEFAULT 0, _limit integer DEFAULT 500)
RETURNS SETOF public.whatsapp_campaigns
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY SELECT * FROM public.whatsapp_campaigns
    ORDER BY sent_at DESC
    LIMIT LEAST(GREATEST(_limit,1),5000) OFFSET GREATEST(_offset,0);
END;
$$;

-- Seed default promo code
INSERT INTO public.promo_codes (code, bonus_percent, description)
VALUES ('VOLTA200', 200, 'Bônus de retorno para leads sem depósito')
ON CONFLICT (code) DO NOTHING;
