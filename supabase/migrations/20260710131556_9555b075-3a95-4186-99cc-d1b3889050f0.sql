
-- 1. user_roles: block all writes from clients (only service_role/admin)
CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. referrals: remove permissive INSERT policy; trigger runs as SECURITY DEFINER so it still works
DROP POLICY IF EXISTS "System can insert referrals" ON public.referrals;
CREATE POLICY "Admins can insert referrals" ON public.referrals
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. promo_clicks: tighten INSERT so authenticated users can only insert their own user_id (or null for anon)
DROP POLICY IF EXISTS "Anyone can log a promo click" ON public.promo_clicks;
CREATE POLICY "Log promo click for self or anon" ON public.promo_clicks
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    user_id IS NULL OR user_id = auth.uid()
  );

-- 4. Revoke EXECUTE on admin SECURITY DEFINER functions from anon/authenticated.
--    They are called from edge functions using service_role, or from client with admin check inside;
--    admins can still call via authenticated role? No — revoke fully; admin panel calls RPCs via authenticated.
--    Keep them callable by authenticated (admin check happens inside), but revoke from anon/public.
REVOKE ALL ON FUNCTION public.admin_toggle_affiliate(uuid, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_update_balance(uuid, numeric) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_get_all_profiles(integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_get_all_transactions(integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_get_all_referrals(integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_update_remarketing_settings(boolean, text, numeric, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_update_remarketing_settings(boolean, text, numeric, text, timestamptz) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_get_campaigns(integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_get_remarketing_funnel() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_get_leads_without_deposit(numeric) FROM PUBLIC, anon;

-- Internal trigger/helper functions: revoke from anon and authenticated (only trigger context needs them)
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_referral_on_profile() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_transaction_status_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_referral_code() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- has_role: keep executable by authenticated (used in RLS via SECURITY DEFINER path); revoke from anon
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
