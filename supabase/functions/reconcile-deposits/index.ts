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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify admin
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse optional body { hours: number } — default 48h window
    let hours = 48;
    try {
      const body = await req.json();
      if (body && typeof body.hours === "number" && body.hours > 0 && body.hours <= 720) {
        hours = body.hours;
      }
    } catch {
      // no body
    }

    const sinceIso = new Date(Date.now() - hours * 3600_000).toISOString();

    const { data: pending, error: pendingError } = await supabase
      .from("transactions")
      .select("id, gateway_ref, amount, created_at")
      .eq("type", "deposit")
      .eq("status", "pending")
      .gte("created_at", sinceIso)
      .not("gateway_ref", "is", null)
      .limit(500);

    if (pendingError) {
      console.error("List pending error:", pendingError);
      return new Response(JSON.stringify({ error: "Erro ao listar pendentes" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!pending || pending.length === 0) {
      return new Response(
        JSON.stringify({ checked: 0, completed: 0, still_pending: 0, failed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // BSPay token
    const clientId = Deno.env.get("BSPAY_CLIENT_ID")!;
    const clientSecret = Deno.env.get("BSPAY_CLIENT_SECRET")!;
    const credentials = btoa(`${clientId}:${clientSecret}`);

    const tokenRes = await fetch("https://api.bspay.co/v2/oauth/token", {
      method: "POST",
      headers: { Authorization: `Basic ${credentials}`, accept: "application/json" },
    });
    if (!tokenRes.ok) {
      return new Response(JSON.stringify({ error: "Erro ao autenticar com gateway" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { access_token: accessToken } = await tokenRes.json();

    let completed = 0;
    let stillPending = 0;
    let failed = 0;

    // Process in small concurrency batches
    const batchSize = 5;
    for (let i = 0; i < pending.length; i += batchSize) {
      const batch = pending.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (tx) => {
          try {
            const consultRes = await fetch("https://api.bspay.co/v2/consult-transaction", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
                accept: "application/json",
              },
              body: JSON.stringify({ pix_id: tx.gateway_ref }),
            });
            if (!consultRes.ok) {
              failed++;
              return;
            }
            const consultData = await consultRes.json();
            const bspayStatus = (consultData.requestBody?.status || consultData.status || "").toLowerCase();

            if (["paid", "completed", "approved", "confirmed"].includes(bspayStatus)) {
              const { error: upErr } = await supabase
                .from("transactions")
                .update({ status: "completed" })
                .eq("id", tx.id)
                .eq("status", "pending");
              if (upErr) failed++;
              else completed++;
            } else if (["failed", "cancelled", "expired", "refused"].includes(bspayStatus)) {
              await supabase
                .from("transactions")
                .update({ status: "failed" })
                .eq("id", tx.id)
                .eq("status", "pending");
              stillPending++;
            } else {
              stillPending++;
            }
          } catch (e) {
            console.error("Consult error for tx", tx.id, e);
            failed++;
          }
        })
      );
    }

    return new Response(
      JSON.stringify({ checked: pending.length, completed, still_pending: stillPending, failed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("reconcile-deposits error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
