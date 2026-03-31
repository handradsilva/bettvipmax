CREATE OR REPLACE FUNCTION public.admin_get_all_transactions(_offset integer DEFAULT 0, _limit integer DEFAULT 1000)
 RETURNS SETOF transactions
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  safe_offset integer := GREATEST(COALESCE(_offset, 0), 0);
  safe_limit integer := LEAST(GREATEST(COALESCE(_limit, 1000), 1), 1000);
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.transactions
  ORDER BY created_at DESC
  LIMIT safe_limit OFFSET safe_offset;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_get_all_profiles(_offset integer DEFAULT 0, _limit integer DEFAULT 1000)
 RETURNS SETOF profiles
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  safe_offset integer := GREATEST(COALESCE(_offset, 0), 0);
  safe_limit integer := LEAST(GREATEST(COALESCE(_limit, 1000), 1), 1000);
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.profiles
  ORDER BY created_at DESC
  LIMIT safe_limit OFFSET safe_offset;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_get_all_referrals(_offset integer DEFAULT 0, _limit integer DEFAULT 1000)
 RETURNS SETOF referrals
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  safe_offset integer := GREATEST(COALESCE(_offset, 0), 0);
  safe_limit integer := LEAST(GREATEST(COALESCE(_limit, 1000), 1), 1000);
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.referrals
  ORDER BY created_at DESC
  LIMIT safe_limit OFFSET safe_offset;
END;
$function$;