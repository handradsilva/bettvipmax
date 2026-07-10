DROP FUNCTION IF EXISTS public.admin_update_remarketing_settings(boolean, text, numeric, text, timestamptz, text);

CREATE FUNCTION public.admin_update_remarketing_settings(
  _enabled boolean,
  _template text,
  _delay_hours numeric,
  _provider text,
  _activation_date timestamptz,
  _image_url text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE public.remarketing_settings
     SET whatsapp_enabled   = _enabled,
         whatsapp_template  = _template,
         delay_hours        = _delay_hours,
         provider           = _provider,
         activation_date    = _activation_date,
         whatsapp_image_url = _image_url,
         updated_at         = now()
   WHERE id = 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_update_remarketing_settings(boolean, text, numeric, text, timestamptz, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_remarketing_settings(boolean, text, numeric, text, timestamptz, text) TO authenticated;