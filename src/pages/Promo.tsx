import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { toast } from "@/hooks/use-toast";

const Promo = () => {
  const { codigo } = useParams<{ codigo: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const run = async () => {
      const code = (codigo || "").toUpperCase().trim();
      if (!code) {
        navigate("/", { replace: true });
        return;
      }

      // Track click (fire-and-forget). Params: ?u=<user_id>&c=<campaign_key>&s=<source>
      try {
        const params = new URLSearchParams(window.location.search);
        const u = params.get("u");
        const c = params.get("c");
        const s = params.get("s") || (c ? "whatsapp" : "direct");
        await (supabase as any).from("promo_clicks").insert({
          promo_code: code,
          user_id: u || null,
          campaign_key: c || null,
          source: s,
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
        });
      } catch (_) {
        // ignore tracking errors
      }


      const { data } = await supabase
        .from("promo_codes")
        .select("code, bonus_percent, active, expires_at, max_uses, used_count")
        .eq("code", code)
        .maybeSingle();

      const valid =
        data &&
        data.active &&
        (!data.expires_at || new Date(data.expires_at) > new Date()) &&
        (!data.max_uses || data.used_count < data.max_uses);

      if (!valid) {
        toast({
          title: "Código inválido",
          description: "Este código promocional expirou ou não existe.",
          variant: "destructive",
        });
        localStorage.removeItem("promo_code");
        localStorage.removeItem("promo_bonus");
        navigate("/", { replace: true });
        return;
      }

      localStorage.setItem("promo_code", data!.code);
      localStorage.setItem("promo_bonus", String(data!.bonus_percent));

      if (loading) return;
      if (!user) {
        navigate(`/auth?mode=register&promo=${data!.code}`, { replace: true });
      } else {
        toast({
          title: `🎁 Bônus ${data!.bonus_percent}% ativado!`,
          description: "Depósito com bônus especial habilitado.",
        });
        navigate("/deposit", { replace: true });
      }
    };
    run().finally(() => setChecking(false));
  }, [codigo, user, loading, navigate]);

  return (
    <Layout>
      <SEOHead
        title="Bônus Especial | BetVipMax"
        description="Ative seu bônus exclusivo no BetVipMax e comece a jogar com muito mais saldo."
        path={`/promo/${codigo}`}
      />
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-muted-foreground text-sm">
          {checking ? "Ativando seu bônus..." : "Redirecionando..."}
        </p>
      </div>
    </Layout>
  );
};

export default Promo;
