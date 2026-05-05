import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body));

    // BS Pay sends data inside requestBody wrapper
    const payload = body.requestBody || body;
    
    // Extract transaction reference and status
    const gatewayRef = payload.transactionId || payload.transaction_id || payload.id || payload.external_id || "";
    const status = payload.status || payload.payment_status || "";

    if (!gatewayRef) {
      console.error("No transaction reference in webhook payload");
      return new Response(JSON.stringify({ error: "Missing transaction reference" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find transaction by gateway_ref
    const { data: transaction, error: findError } = await supabase
      .from("transactions")
      .select("*")
      .eq("gateway_ref", gatewayRef)
      .single();

    if (findError || !transaction) {
      console.error("Transaction not found:", gatewayRef, findError);
      return new Response(JSON.stringify({ error: "Transaction not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (transaction.status !== "pending") {
      console.log("Transaction already processed:", transaction.status);
      return new Response(JSON.stringify({ message: "Already processed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map BS Pay status to our status
    const normalizedStatus = status.toLowerCase();
    let newStatus = "pending";
    if (
      normalizedStatus === "paid" ||
      normalizedStatus === "completed" ||
      normalizedStatus === "approved" ||
      normalizedStatus === "confirmed"
    ) {
      newStatus = "completed";
    } else if (
      normalizedStatus === "failed" ||
      normalizedStatus === "cancelled" ||
      normalizedStatus === "expired" ||
      normalizedStatus === "refused"
    ) {
      newStatus = "failed";
    }

    if (newStatus === "pending") {
      console.log("Status not actionable:", status);
      return new Response(JSON.stringify({ message: "Status noted" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update transaction status - trigger handles balance update
    const { error: updateError } = await supabase
      .from("transactions")
      .update({ status: newStatus })
      .eq("id", transaction.id);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(JSON.stringify({ error: "Update failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Transaction ${transaction.id} updated to ${newStatus}`);

    // Pushcut notification on confirmed deposits
    if (newStatus === "completed" && transaction.type === "deposit") {
      const pushcutUrl =
        Deno.env.get("PUSHCUT_WEBHOOK_URL") ||
        "https://api.pushcut.io/y4E0mGDl6y0B2KCvVdncD/notifications/Purschase";
      try {
        const pcRes = await fetch(pushcutUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "💰 Novo depósito confirmado",
            text: `R$ ${Number(transaction.amount).toFixed(2)} - ref ${gatewayRef}`,
            input: String(transaction.amount),
          }),
        });
        console.log("Pushcut notify status:", pcRes.status);
      } catch (e) {
        console.error("Pushcut notify error:", e);
      }
    }

    return new Response(JSON.stringify({ success: true, status: newStatus }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
