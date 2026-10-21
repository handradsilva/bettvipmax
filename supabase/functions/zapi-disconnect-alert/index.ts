// Webhook público chamado pelo Z-API quando a instância desconecta.
// Envia um alerta via CallMeBot para o WhatsApp pessoal do dono.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const apikey = Deno.env.get("CALLMEBOT_API_KEY");
  const phone = Deno.env.get("CALLMEBOT_PHONE");
  if (!apikey || !phone) {
    return new Response(JSON.stringify({ error: "CallMeBot não configurado" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Coleta payload (Z-API manda JSON no webhook "Ao desconectar")
  let payload: any = {};
  try { payload = await req.json(); } catch { /* body vazio */ }

  const when = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const reason = payload?.error || payload?.reason || payload?.status || "desconhecido";
  const connected = payload?.connected;
  const isDisconnect = connected === false || /disconnect|logout|disconnected/i.test(String(payload?.event || payload?.type || ""));

  // Se o Z-API mandar um evento de reconexão, ignora silenciosamente
  if (connected === true) {
    return new Response(JSON.stringify({ ok: true, ignored: "reconnected" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const text =
    `⚠️ *MAXVIPBET* – WhatsApp da instância Z-API caiu!\n\n` +
    `🕒 ${when}\n` +
    `📴 Motivo: ${reason}\n\n` +
    `Abra o painel Z-API e escaneie o QR Code para religar o disparo de remarketing.`;

  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apikey)}`;

  try {
    const res = await fetch(url);
    const body = await res.text();
    if (!res.ok) {
      console.error("CallMeBot falhou:", res.status, body);
      return new Response(JSON.stringify({ ok: false, status: res.status, body }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true, sent: isDisconnect, payload }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
