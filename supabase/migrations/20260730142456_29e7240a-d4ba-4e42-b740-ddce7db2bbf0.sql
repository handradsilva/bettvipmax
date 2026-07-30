
-- 1) short_links: remove public read, expose only a code-scoped resolver
DROP POLICY IF EXISTS "short_links public read" ON public.short_links;
REVOKE SELECT ON public.short_links FROM anon;

CREATE OR REPLACE FUNCTION public.resolve_short_link(_code text)
RETURNS TABLE(user_id uuid, campaign_key text, promo_code text, source text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT s.user_id, s.campaign_key, s.promo_code, s.source
  FROM public.short_links s
  WHERE s.code = _code
  LIMIT 1
$$;

-- 2) promo_clicks: stricter insert validation
DROP POLICY IF EXISTS "Log promo click for self or anon" ON public.promo_clicks;
CREATE POLICY "Log promo click for self or anon"
ON public.promo_clicks
FOR INSERT
TO anon, authenticated
WITH CHECK (
  ((user_id IS NULL) OR (user_id = auth.uid()))
  AND length(promo_code) BETWEEN 1 AND 32
  AND (campaign_key IS NULL OR length(campaign_key) <= 64)
  AND (source IS NULL OR length(source) <= 64)
  AND (referrer IS NULL OR length(referrer) <= 500)
  AND (user_agent IS NULL OR length(user_agent) <= 500)
  AND EXISTS (
    SELECT 1 FROM public.promo_codes pc
    WHERE pc.code = promo_clicks.promo_code AND pc.active = true
  )
);

-- 3) Lock down SECURITY DEFINER functions from direct API execution
REVOKE ALL ON FUNCTION public.generate_referral_code() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_transaction_status_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_profile_privilege_escalation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_referral_on_profile() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.admin_update_balance(uuid, numeric) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_toggle_affiliate(uuid, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_get_all_profiles(integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_get_all_transactions(integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_get_all_referrals(integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_get_campaigns(integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_get_leads_without_deposit(numeric) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_get_remarketing_conversions() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_get_remarketing_funnel() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_update_remarketing_settings(boolean, text, numeric, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_update_remarketing_settings(boolean, text, numeric, text, timestamptz) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_update_remarketing_settings(boolean, text, numeric, text, timestamptz, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_update_balance(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_toggle_affiliate(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_all_profiles(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_all_transactions(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_all_referrals(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_campaigns(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_leads_without_deposit(numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_remarketing_conversions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_remarketing_funnel() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_remarketing_settings(boolean, text, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_remarketing_settings(boolean, text, numeric, text, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_remarketing_settings(boolean, text, numeric, text, timestamptz, text) TO authenticated;

REVOKE ALL ON FUNCTION public.resolve_short_link(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_short_link(text) TO anon, authenticated;
