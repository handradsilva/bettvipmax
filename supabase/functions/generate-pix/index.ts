import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { amount, wantBonus } = await req.json();
    if (!amount || amount < 20) {
      return new Response(JSON.stringify({ error: "Valor mínimo de R$ 20,00" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch profile for payer info; if missing, bootstrap it from auth claims
    const userEmail =
      typeof claimsData.claims.email === "string" && claimsData.claims.email.length > 0
        ? claimsData.claims.email
        : `${userId}@no-email.local`;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, cpf")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("Profile lookup error:", profileError);
      return new Response(JSON.stringify({ error: "Erro ao buscar perfil" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let payerEmail = profile?.email ?? userEmail;
    let payerCpf = profile?.cpf ?? null;

    if (!profile) {
      const { data: createdProfile, error: createProfileError } = await supabase
        .from("profiles")
        .insert({ user_id: userId, email: userEmail })
        .select("email, cpf")
        .single();

      if (createProfileError) {
        console.error("Profile bootstrap error:", createProfileError);
        return new Response(JSON.stringify({ error: "Perfil não encontrado" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      payerEmail = createdProfile.email;
      payerCpf = createdProfile.cpf;
    }

    // BS Pay auth - get token
    const clientId = Deno.env.get("BSPAY_CLIENT_ID")!;
    const clientSecret = Deno.env.get("BSPAY_CLIENT_SECRET")!;

    const credentials = btoa(`${clientId}:${clientSecret}`);
    const tokenRes = await fetch("https://api.bspay.co/v2/oauth/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "accept": "application/json",
      },
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("BS Pay token error:", errText);
      return new Response(JSON.stringify({ error: "Erro ao autenticar com gateway" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Generate PIX QR Code
    const pixRes = await fetch("https://api.bspay.co/v2/pix/qrcode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        amount: Number(amount),
        external_id: crypto.randomUUID(),
        payerQuestion: `Depósito PIX - R$ ${amount.toFixed(2)}`,
        postbackUrl: `${Deno.env.get("SUPABASE_URL")!}/functions/v1/bspay-webhook`,
        payer: {
          name: payerEmail.split("@")[0],
          document: payerCpf || "00000000000",
          email: payerEmail,
        },
      }),
    });

    if (!pixRes.ok) {
      const errText = await pixRes.text();
      console.error("BS Pay PIX error:", errText);
      return new Response(JSON.stringify({ error: "Erro ao gerar QR Code PIX" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pixData = await pixRes.json();
    console.log("BS Pay PIX response:", JSON.stringify(pixData));

    // Save transaction
    const { error: txError } = await supabase.from("transactions").insert({
      user_id: userId,
      type: "deposit",
      amount,
      status: "pending",
      brcode: pixData.qrcode || "",
      qrcode_image: "",
      gateway_ref: pixData.transactionId || "",
    });

    if (txError) {
      console.error("Transaction insert error:", txError);
    }

    return new Response(
      JSON.stringify({
        qrcode_image: "",
        brcode: pixData.qrcode || "",
        transaction_id: pixData.transactionId || "",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("generate-pix error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
