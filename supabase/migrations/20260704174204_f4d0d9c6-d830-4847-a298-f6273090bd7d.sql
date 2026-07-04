
CREATE OR REPLACE FUNCTION public.admin_get_remarketing_funnel()
 RETURNS TABLE(total_no_deposit bigint, messaged bigint, clicked bigint, clicked_and_deposited bigint)
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
  WITH eligible_users AS (
    SELECT p.user_id
    FROM public.profiles p
    WHERE (_activation IS NULL OR p.created_at >= _activation)
  ),
  base AS (
    SELECT eu.user_id
    FROM eligible_users eu
    WHERE NOT EXISTS (
      SELECT 1 FROM public.transactions t
      WHERE t.user_id = eu.user_id AND t.type = 'deposit' AND t.status = 'completed'
    )
  ),
  msgs AS (
    SELECT DISTINCT w.user_id
    FROM public.whatsapp_campaigns w
    JOIN eligible_users eu ON eu.user_id = w.user_id
    WHERE w.campaign_key = 'sem_deposito_1h' AND w.status = 'sent'
  ),
  clicks AS (
    SELECT DISTINCT c.user_id
    FROM public.promo_clicks c
    JOIN eligible_users eu ON eu.user_id = c.user_id
    WHERE c.user_id IS NOT NULL AND c.campaign_key = 'sem_deposito_1h'
  ),
  deposits_after_click AS (
    SELECT DISTINCT t.user_id
    FROM public.transactions t
    JOIN public.promo_clicks c ON c.user_id = t.user_id AND c.campaign_key = 'sem_deposito_1h'
    JOIN eligible_users eu ON eu.user_id = t.user_id
    WHERE t.type = 'deposit' AND t.status = 'completed' AND t.created_at >= c.created_at
  )
  SELECT
    (SELECT count(*) FROM base) + (SELECT count(*) FROM deposits_after_click) AS total_no_deposit,
    (SELECT count(*) FROM msgs) AS messaged,
    (SELECT count(*) FROM clicks) AS clicked,
    (SELECT count(*) FROM deposits_after_click) AS clicked_and_deposited;
END;
$function$;
