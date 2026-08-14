import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);
    const callerId = claimsData.claims.sub as string;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: isAdmin, error: roleError } = await admin.rpc("has_role", {
      _user_id: callerId,
      _role: "admin",
    });
    if (roleError || !isAdmin) return json({ error: "Forbidden" }, 403);

    let body: { user_id?: unknown };
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid body" }, 400);
    }

    const targetId = typeof body.user_id === "string" ? body.user_id.trim() : "";
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRe.test(targetId)) return json({ error: "user_id inválido" }, 400);
    if (targetId === callerId) return json({ error: "Você não pode excluir sua própria conta" }, 400);

    // Remove dependent data first
    await admin.from("whatsapp_campaigns").delete().eq("user_id", targetId);
    await admin.from("promo_clicks").delete().eq("user_id", targetId);
    await admin.from("short_links").delete().eq("user_id", targetId);
    await admin.from("referrals").delete().eq("referrer_user_id", targetId);
    await admin.from("referrals").delete().eq("referred_user_id", targetId);
    await admin.from("transactions").delete().eq("user_id", targetId);
    await admin.from("user_roles").delete().eq("user_id", targetId);
    await admin.from("profiles").delete().eq("user_id", targetId);

    const { error: delError } = await admin.auth.admin.deleteUser(targetId);
    if (delError) return json({ error: delError.message }, 400);

    return json({ success: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Erro inesperado" }, 500);
  }
});
