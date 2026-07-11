
CREATE OR REPLACE FUNCTION public.admin_get_remarketing_conversions()
RETURNS TABLE(user_id uuid, email text, amount numeric, deposited_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY
  SELECT DISTINCT ON (t.id)
    t.user_id,
    p.email,
    t.amount,
    t.created_at AS deposited_at
  FROM public.transactions t
  JOIN public.promo_clicks c
    ON c.user_id = t.user_id AND c.campaign_key = 'sem_deposito_1h'
  JOIN public.profiles p ON p.user_id = t.user_id
  WHERE t.type = 'deposit'
    AND t.status = 'completed'
    AND t.created_at >= c.created_at
  ORDER BY t.id, t.created_at DESC;
END;
$$;
