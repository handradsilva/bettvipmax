
-- 1. Activation cutoff
ALTER TABLE public.remarketing_settings
  ADD COLUMN IF NOT EXISTS activation_date TIMESTAMPTZ;

-- 2. Promo clicks tracking table
CREATE TABLE IF NOT EXISTS public.promo_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code TEXT NOT NULL,
  user_id UUID,
  campaign_key TEXT,
  source TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.promo_clicks TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.promo_clicks TO authenticated;
GRANT ALL ON public.promo_clicks TO service_role;

ALTER TABLE public.promo_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log a promo click"
  ON public.promo_clicks FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view promo clicks"
  ON public.promo_clicks FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_promo_clicks_user ON public.promo_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_clicks_campaign ON public.promo_clicks(campaign_key);

-- 3. Update admin_get_leads_without_deposit to honor activation_date
CREATE OR REPLACE FUNCTION public.admin_get_leads_without_deposit(_min_hours numeric DEFAULT 1)
 RETURNS TABLE(user_id uuid, email text, full_name text, phone text, created_at timestamptz, already_messaged boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _activation TIMESTAMPTZ;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  SELECT activation_date INTO _activation FROM public.remarketing_settings WHERE id = 1;
  RETURN QUERY
  SELECT p.user_id, p.email, p.full_name, p.phone, p.created_at,
    EXISTS(SELECT 1 FROM public.whatsapp_campaigns w
           WHERE w.user_id = p.user_id AND w.campaign_key = 'sem_deposito_1h') AS already_messaged
  FROM public.profiles p
  WHERE p.created_at < (now() - make_interval(mins => (_min_hours * 60)::int))
    AND (_activation IS NULL OR p.created_at >= _activation)
    AND NOT EXISTS (
      SELECT 1 FROM public.transactions t
      WHERE t.user_id = p.user_id
        AND t.type = 'deposit'
        AND t.status = 'completed'
    )
  ORDER BY p.created_at DESC;
END;
$function$;

-- 4. Update settings updater to accept activation_date
CREATE OR REPLACE FUNCTION public.admin_update_remarketing_settings(
  _enabled boolean,
  _template text,
  _delay_hours numeric,
  _provider text,
  _activation_date timestamptz DEFAULT NULL
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE public.remarketing_settings
    SET whatsapp_enabled = _enabled,
        whatsapp_template = _template,
        delay_hours = _delay_hours,
        provider = _provider,
        activation_date = COALESCE(_activation_date, activation_date),
        updated_at = now()
    WHERE id = 1;
END;
$function$;

-- 5. Funnel metrics function
CREATE OR REPLACE FUNCTION public.admin_get_remarketing_funnel()
 RETURNS TABLE(
   total_no_deposit bigint,
   messaged bigint,
   clicked bigint,
   clicked_and_deposited bigint
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _activation TIMESTAMPTZ;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  SELECT activation_date INTO _activation FROM public.remarketing_settings WHERE id = 1;

  RETURN QUERY
  WITH base AS (
    SELECT p.user_id
    FROM public.profiles p
    WHERE (_activation IS NULL OR p.created_at >= _activation)
      AND NOT EXISTS (
        SELECT 1 FROM public.transactions t
        WHERE t.user_id = p.user_id AND t.type = 'deposit' AND t.status = 'completed'
      )
  ),
  msgs AS (
    SELECT DISTINCT w.user_id
    FROM public.whatsapp_campaigns w
    WHERE w.campaign_key = 'sem_deposito_1h' AND w.status = 'sent'
  ),
  clicks AS (
    SELECT DISTINCT c.user_id
    FROM public.promo_clicks c
    WHERE c.user_id IS NOT NULL AND c.campaign_key = 'sem_deposito_1h'
  ),
  deposits_after_click AS (
    SELECT DISTINCT t.user_id
    FROM public.transactions t
    JOIN public.promo_clicks c ON c.user_id = t.user_id AND c.campaign_key = 'sem_deposito_1h'
    WHERE t.type = 'deposit' AND t.status = 'completed' AND t.created_at >= c.created_at
  )
  SELECT
    (SELECT count(*) FROM base) + (SELECT count(*) FROM deposits_after_click) AS total_no_deposit,
    (SELECT count(*) FROM msgs) AS messaged,
    (SELECT count(*) FROM clicks) AS clicked,
    (SELECT count(*) FROM deposits_after_click) AS clicked_and_deposited;
END;
$function$;
