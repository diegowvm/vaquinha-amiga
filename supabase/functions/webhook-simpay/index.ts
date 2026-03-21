import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Webhook SimPay received:", JSON.stringify(body));

    // SimPay sends `tag` as the donation_id we set during cash-in
    const donationId = body.tag || body.external_id || body.donation_id;
    const paymentStatus = body.status;

    if (!donationId) {
      return new Response(
        JSON.stringify({ error: "tag/external_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if donation exists
    const { data: donation, error: fetchError } = await supabase
      .from("donations")
      .select("*")
      .eq("id", donationId)
      .single();

    if (fetchError || !donation) {
      console.error("Donation not found:", donationId);
      return new Response(
        JSON.stringify({ error: "Donation not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Idempotency: if already paid, skip
    if (donation.status === "paid") {
      return new Response(
        JSON.stringify({ message: "Already processed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SimPay uses "PAID" status for confirmed payments
    const paidStatuses = ["paid", "PAID", "approved", "confirmed"];
    if (paidStatuses.includes(paymentStatus)) {
      // Update donation status
      await supabase
        .from("donations")
        .update({ status: "paid" })
        .eq("id", donationId);

      // Update campaign total
      await supabase.rpc("increment_campaign_valor", {
        p_campaign_id: donation.campaign_id,
        p_valor: donation.valor,
      });

      // Update transaction
      await supabase
        .from("transactions")
        .update({
          status: "paid",
          gateway_id: body.qr_code_id || body.id || "",
        })
        .eq("donation_id", donationId);

      console.log("Donation confirmed:", donationId, "valor:", donation.valor);
    } else {
      console.log("Webhook status not paid:", paymentStatus, "for donation:", donationId);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
