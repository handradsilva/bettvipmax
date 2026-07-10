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

function zapiHeaders() {
  const clientToken = Deno.env.get("ZAPI_CLIENT_TOKEN");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (clientToken) headers["Client-Token"] = clientToken;
  return headers;
}

function zapiBase() {
  const instance = Deno.env.get("ZAPI_INSTANCE_ID");
  const token = Deno.env.get("ZAPI_TOKEN");
  if (!instance || !token) throw new Error("Z-API não configurada (ZAPI_INSTANCE_ID, ZAPI_TOKEN, ZAPI_CLIENT_TOKEN)");
  return `https://api.z-api.io/instances/${instance}/token/${token}`;
}

async function sendZapi(phone: string, message: string) {
  const res = await fetch(`${zapiBase()}/send-text`, {
    method: "POST",
    headers: zapiHeaders(),
    body: JSON.stringify({ phone, message }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Z-API ${res.status}: ${body}`);
  return JSON.parse(body || "{}");
}

async function sendZapiImage(phone: string, imageUrl: string) {
  const res = await fetch(`${zapiBase()}/send-image`, {
    method: "POST",
    headers: zapiHeaders(),
    body: JSON.stringify({ phone, image: imageUrl }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Z-API img ${res.status}: ${body}`);
  return JSON.parse(body || "{}");
}

function evolutionConfig() {
  const base = Deno.env.get("EVOLUTION_URL");
  const instance = Deno.env.get("EVOLUTION_INSTANCE");
  const apiKey = Deno.env.get("EVOLUTION_API_KEY");
  if (!base || !instance || !apiKey)
    throw new Error("Evolution não configurada (EVOLUTION_URL, EVOLUTION_INSTANCE, EVOLUTION_API_KEY)");
  return { base: base.replace(/\/$/, ""), instance, apiKey };
}

async function sendEvolution(phone: string, message: string) {
  const { base, instance, apiKey } = evolutionConfig();
  const res = await fetch(`${base}/message/sendText/${instance}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: apiKey },
    body: JSON.stringify({ number: phone, text: message }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Evolution ${res.status}: ${body}`);
  return JSON.parse(body || "{}");
}

async function sendEvolutionImage(phone: string, imageUrl: string) {
  const { base, instance, apiKey } = evolutionConfig();
  const res = await fetch(`${base}/message/sendMedia/${instance}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: apiKey },
    body: JSON.stringify({ number: phone, mediatype: "image", media: imageUrl }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Evolution img ${res.status}: ${body}`);
  return JSON.parse(body || "{}");
}

// Resolve a stored image reference to a public URL WhatsApp providers can fetch.
// Accepts an absolute http(s) URL or a storage path in the "remarketing-media"
// bucket (private). For storage paths, mint a fresh signed URL each send.
async function resolveImageUrl(supabase: any, ref: string | null): Promise<string | null> {
  if (!ref) return null;
  const trimmed = ref.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const { data, error } = await supabase.storage
    .from("remarketing-media")
    .createSignedUrl(trimmed, 60 * 60 * 24 * 7); // 7 days
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    let manual = false;
    let testPhone: string | null = null;
    let testName: string | null = null;
    try {
      const body = await req.json();
      manual = !!body?.manual;
      testPhone = body?.test_phone ?? null;
      testName = body?.test_name ?? null;
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

    if (!manual && !testPhone && !settings.whatsapp_enabled) {
      return new Response(
        JSON.stringify({ skipped: 0, sent: 0, failed: 0, reason: "disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const delayHours = Number(settings.delay_hours) || 1;
    const template = settings.whatsapp_template as string;
    const provider = settings.provider as string;
    const activationDate = settings.activation_date as string | null;
    const imageRef = (settings.whatsapp_image_url as string | null) ?? null;
    const imageUrl = await resolveImageUrl(supabase, imageRef);

    const sendImageFirst = async (phone: string) => {
      if (!imageUrl) return null;
      return provider === "evolution"
        ? await sendEvolutionImage(phone, imageUrl)
        : await sendZapiImage(phone, imageUrl);
    };

    // === TEST MODE: send to a single phone with current template ===
    if (testPhone) {
      const phone = normalizeBrPhone(testPhone);
      if (!phone) {
        return new Response(JSON.stringify({ error: "phone inválido" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const siteUrl = Deno.env.get("SITE_URL") || "https://www.bettvipmax.com";
      const promoCode = Deno.env.get("REMARKETING_PROMO_CODE") || "VOLTA200";
      let trackedLink = `${siteUrl}/promo/${promoCode}?c=${CAMPAIGN_KEY}&s=whatsapp_test`;
      try {
        const genCode = () => {
          const bytes = new Uint8Array(6);
          crypto.getRandomValues(bytes);
          let n = 0n;
          for (const b of bytes) n = (n << 8n) | BigInt(b);
          return n.toString(36).slice(0, 7).padStart(7, "0");
        };
        for (let i = 0; i < 5; i++) {
          const candidate = genCode();
          const { error: insErr } = await supabase.from("short_links").insert({
            code: candidate,
            user_id: null,
            campaign_key: CAMPAIGN_KEY,
            promo_code: promoCode,
            source: "whatsapp_test",
          });
          if (!insErr) { trackedLink = `${siteUrl}/r/${candidate}`; break; }
        }
      } catch (_) {}
      const nome = (testName || "amigo").split(" ")[0];
      const message = template
        .replaceAll("{nome}", nome)
        .replaceAll("{email}", "teste@bettvipmax.com")
        .replaceAll("{link}", trackedLink);
      try {
        let imageRes: any = null;
        try { imageRes = await sendImageFirst(phone); } catch (imgErr: any) {
          return new Response(JSON.stringify({ test: true, phone, message, link: trackedLink, error: "img: " + String(imgErr?.message ?? imgErr) }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (imageRes) await new Promise((r) => setTimeout(r, 1200));
        const providerRes = provider === "evolution"
          ? await sendEvolution(phone, message)
          : await sendZapi(phone, message);
        return new Response(JSON.stringify({ test: true, phone, message, link: trackedLink, imageUrl, imageRes, providerRes }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({ test: true, phone, message, link: trackedLink, error: String(e?.message ?? e) }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const cutoffEnd = new Date(Date.now() - delayHours * 3600 * 1000).toISOString();
    // Only look 7 days back to avoid spamming old leads
    const defaultStart = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const activationStart = activationDate ? new Date(activationDate) : null;
    const cutoffStart = (activationStart && activationStart > defaultStart
      ? activationStart
      : defaultStart
    ).toISOString();

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
      const siteUrl = Deno.env.get("SITE_URL") || "https://www.bettvipmax.com";
      const promoCode = Deno.env.get("REMARKETING_PROMO_CODE") || "VOLTA200";

      // Generate a short tracking link (e.g. https://site/r/aB3xY9) instead of
      // the long /promo/CODE?u=..&c=..&s=.. URL. /r/:code resolves to the same
      // flow in ShortLink.tsx, preserving click + deposit attribution.
      let trackedLink = `${siteUrl}/promo/${promoCode}?u=${lead.user_id}&c=${CAMPAIGN_KEY}&s=whatsapp`;
      try {
        // 7-char base36 code (~78 billion combos) — collision retry a few times
        const genCode = () => {
          const bytes = new Uint8Array(6);
          crypto.getRandomValues(bytes);
          let n = 0n;
          for (const b of bytes) n = (n << 8n) | BigInt(b);
          return n.toString(36).slice(0, 7).padStart(7, "0");
        };
        let shortCode: string | null = null;
        for (let i = 0; i < 5; i++) {
          const candidate = genCode();
          const { error: insErr } = await supabase.from("short_links").insert({
            code: candidate,
            user_id: lead.user_id,
            campaign_key: CAMPAIGN_KEY,
            promo_code: promoCode,
            source: "whatsapp",
          });
          if (!insErr) { shortCode = candidate; break; }
        }
        if (shortCode) trackedLink = `${siteUrl}/r/${shortCode}`;
      } catch (_) {
        // fallback to long link
      }

      const message = template
        .replaceAll("{nome}", nome)
        .replaceAll("{email}", lead.email)
        .replaceAll("{link}", trackedLink);


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
