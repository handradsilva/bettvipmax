
-- 1. Trigger que impede escalonamento de privilégios via UPDATE em profiles
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins e service_role (auth.uid() NULL) podem tudo
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- Restaura campos protegidos a partir do OLD
  NEW.balance := OLD.balance;
  NEW.affiliate_approved := OLD.affiliate_approved;
  NEW.referral_code := OLD.referral_code;
  NEW.user_id := OLD.user_id;
  NEW.email := OLD.email;
  NEW.created_at := OLD.created_at;

  -- referred_by só pode ser definido uma vez (de NULL)
  IF OLD.referred_by IS NOT NULL THEN
    NEW.referred_by := OLD.referred_by;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_profile_privilege_escalation() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS protect_profiles_columns ON public.profiles;
CREATE TRIGGER protect_profiles_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- 2. Restringir INSERT em transactions: usuário só pode criar depósito PENDING legítimo
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;

CREATE POLICY "Users can insert own pending deposits" ON public.transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND type = 'deposit'
    AND status = 'pending'
    AND amount >= 1
    AND amount <= 10000
    AND gateway_ref IS NOT NULL
    AND length(gateway_ref) >= 8
  );

-- 3. Bloquear qualquer UPDATE/DELETE em transactions no lado do cliente (não havia política, mas deixo explícito)
--    (não é necessário criar policy negativa; ausência = negado com RLS habilitado)

-- 4. LIMPEZA DA FRAUDE: marcar transações fraudulentas como failed
UPDATE public.transactions
SET status = 'failed', updated_at = now()
WHERE id IN (
  '61da22cc-b6b9-42b8-b2c5-d3576e62638c', -- deposit 5000 sem gateway_ref
  'bd17ce20-6567-45cd-a3a7-0eab5f99cff7', -- withdrawal 100 completed sem gateway_ref
  'ebe57d34-ad45-4d6d-8d80-e4f9f234540b'  -- withdrawal 100 pending "manual"
);

-- 5. Recalcular saldo real do inoccnyt e rlstest com base em depósitos LEGÍTIMOS confirmados (com gateway_ref real)
-- inoccnyt: depósitos legítimos concluídos = 50 + 20 + 21.90 = 91.90 → *10 = 919
UPDATE public.profiles SET balance = 919.00, updated_at = now()
WHERE user_id = '92f72ec7-b097-4bb4-8034-921820b53f03';

-- rlstest: sem depósitos legítimos concluídos → 0
UPDATE public.profiles SET balance = 0, updated_at = now()
WHERE user_id = '603c205c-84cc-471a-889f-3c936a761a37';
