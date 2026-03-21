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

    // SimPay sends payment confirmation with external_id = donation_id
    const donationId = body.external_id || body.donation_id;
    const paymentStatus = body.status;

    if (!donationId) {
      return new Response(
        JSON.stringify({ error: "external_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if donation exists and is still pending (idempotency)
    const { data: donation, error: fetchError } = await supabase
      .from("donations")
      .select("*")
      .eq("id", donationId)
      .single();

    if (fetchError || !donation) {
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

    if (paymentStatus === "paid" || paymentStatus === "approved" || paymentStatus === "confirmed") {
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
        .update({ status: "paid", gateway_id: body.gateway_id || body.id || "" })
        .eq("donation_id", donationId);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
