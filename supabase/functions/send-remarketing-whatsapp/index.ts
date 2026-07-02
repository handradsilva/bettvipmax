import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CAMPAIGN_KEY = "sem_deposito_1h";

// Format Brazilian phone into international MSISDN (55 + DDD + number, digits only)
function normalizeBrPhone(input: string | null): string | null {
  if (!input) return null;
  const d = input.replace(/\D/g, "");
  if (d.length < 10) return null;
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) return d;
  if (d.length === 10 || d.length === 11) return "55" + d;
  return null;
}

async function sendZapi(phone: string, message: string) {
  const instance = Deno.env.get("ZAPI_INSTANCE_ID");
  const token = Deno.env.get("ZAPI_TOKEN");
  const clientToken = Deno.env.get("ZAPI_CLIENT_TOKEN");
  if (!instance || !token) throw new Error("Z-API não configurada (ZAPI_INSTANCE_ID, ZAPI_TOKEN, ZAPI_CLIENT_TOKEN)");
  const url = `https://api.z-api.io/instances/${instance}/token/${token}/send-text`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (clientToken) headers["Client-Token"] = clientToken;
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ phone, message }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Z-API ${res.status}: ${body}`);
  return JSON.parse(body || "{}");
}

async function sendEvolution(phone: string, message: string) {
  const base = Deno.env.get("EVOLUTION_URL");
  const instance = Deno.env.get("EVOLUTION_INSTANCE");
  const apiKey = Deno.env.get("EVOLUTION_API_KEY");
  if (!base || !instance || !apiKey)
    throw new Error("Evolution não configurada (EVOLUTION_URL, EVOLUTION_INSTANCE, EVOLUTION_API_KEY)");
  const url = `${base.replace(/\/$/, "")}/message/sendText/${instance}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: apiKey },
    body: JSON.stringify({ number: phone, text: message }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Evolution ${res.status}: ${body}`);
  return JSON.parse(body || "{}");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    let manual = false;
    try {
      const body = await req.json();
      manual = !!body?.manual;
    } catch (_) {
      // no body (cron)
    }

    // Load settings
    const { data: settings } = await supabase
      .from("remarketing_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (!settings) {
      return new Response(JSON.stringify({ error: "Sem configurações" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!manual && !settings.whatsapp_enabled) {
      return new Response(
        JSON.stringify({ skipped: 0, sent: 0, failed: 0, reason: "disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const delayHours = Number(settings.delay_hours) || 1;
    const template = settings.whatsapp_template as string;
    const provider = settings.provider as string;

    // Cutoffs
    const cutoffEnd = new Date(Date.now() - delayHours * 3600 * 1000).toISOString();
    // Only look 7 days back to avoid spamming old leads
    const cutoffStart = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

    // Fetch candidate leads
    const { data: candidates, error: candErr } = await supabase
      .from("profiles")
      .select("user_id, email, full_name, phone, created_at")
      .lte("created_at", cutoffEnd)
      .gte("created_at", cutoffStart);

    if (candErr) throw candErr;

    const candidateIds = (candidates ?? []).map((c) => c.user_id);
    if (candidateIds.length === 0) {
      return new Response(JSON.stringify({ sent: 0, failed: 0, skipped: 0, checked: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find users with completed deposits
    const { data: deposited } = await supabase
      .from("transactions")
      .select("user_id")
      .in("user_id", candidateIds)
      .eq("type", "deposit")
      .eq("status", "completed");
    const depositedSet = new Set((deposited ?? []).map((d) => d.user_id));

    // Find already messaged
    const { data: already } = await supabase
      .from("whatsapp_campaigns")
      .select("user_id")
      .eq("campaign_key", CAMPAIGN_KEY)
      .in("user_id", candidateIds);
    const alreadySet = new Set((already ?? []).map((d) => d.user_id));

    let sent = 0,
      failed = 0,
      skipped = 0;

    for (const lead of candidates ?? []) {
      if (depositedSet.has(lead.user_id) || alreadySet.has(lead.user_id)) {
        skipped++;
        continue;
      }
      const phone = normalizeBrPhone(lead.phone);
      if (!phone) {
        skipped++;
        continue;
      }
      const nome = (lead.full_name || lead.email.split("@")[0] || "amigo").split(" ")[0];
      const message = template
        .replaceAll("{nome}", nome)
        .replaceAll("{email}", lead.email);

      try {
        const providerRes =
          provider === "evolution" ? await sendEvolution(phone, message) : await sendZapi(phone, message);
        await supabase.from("whatsapp_campaigns").insert({
          user_id: lead.user_id,
          campaign_key: CAMPAIGN_KEY,
          status: "sent",
          phone,
          message,
          provider_response: providerRes,
        });
        sent++;
        // small throttle to be nice to provider
        await new Promise((r) => setTimeout(r, 300));
      } catch (e: any) {
        failed++;
        await supabase.from("whatsapp_campaigns").insert({
          user_id: lead.user_id,
          campaign_key: CAMPAIGN_KEY,
          status: "failed",
          phone,
          message,
          error: String(e?.message ?? e),
        });
      }
    }

    return new Response(
      JSON.stringify({ sent, failed, skipped, checked: candidates?.length ?? 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("send-remarketing-whatsapp error:", err);
    return new Response(JSON.stringify({ error: err?.message ?? "erro" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
