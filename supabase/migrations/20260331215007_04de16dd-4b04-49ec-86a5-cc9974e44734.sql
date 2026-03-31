CREATE OR REPLACE FUNCTION public.admin_get_all_transactions()
 RETURNS SETOF transactions
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY SELECT * FROM public.transactions ORDER BY created_at DESC LIMIT 10000;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_get_all_profiles()
 RETURNS SETOF profiles
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY SELECT * FROM public.profiles ORDER BY created_at DESC LIMIT 10000;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_get_all_referrals()
 RETURNS SETOF referrals
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY SELECT * FROM public.referrals ORDER BY created_at DESC LIMIT 10000;
END;
$function$;