import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const ShortLink = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      const c = (code || "").trim();
      if (!c) {
        navigate("/", { replace: true });
        return;
      }
      const { data } = await (supabase as any)
        .from("short_links")
        .select("user_id, campaign_key, promo_code, source")
        .eq("code", c)
        .maybeSingle();

      if (!data) {
        navigate("/", { replace: true });
        return;
      }

      // Redirect to the existing promo flow with original tracking params.
      // Promo.tsx already inserts into promo_clicks and handles the bonus.
      const qs = new URLSearchParams();
      if (data.user_id) qs.set("u", data.user_id);
      if (data.campaign_key) qs.set("c", data.campaign_key);
      if (data.source) qs.set("s", data.source);
      navigate(`/promo/${data.promo_code}?${qs.toString()}`, { replace: true });
    };
    run();
  }, [code, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
};

export default ShortLink;
