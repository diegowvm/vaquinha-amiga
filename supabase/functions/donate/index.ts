import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaign_id, valor } = await req.json();

    if (!campaign_id || !valor || valor < 100) {
      return new Response(
        JSON.stringify({ error: "campaign_id e valor (min 100 centavos) são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Create donation
    const { data: donation, error: donationError } = await supabase
      .from("donations")
      .insert({ campaign_id, valor, status: "pending" })
      .select()
      .single();

    if (donationError) throw donationError;

    // Create transaction record
    await supabase.from("transactions").insert({
      donation_id: donation.id,
      gateway_id: "",
      status: "pending",
    });

    // Here you would call SimPay API to create a Pix charge
    // For now, return a placeholder QR code and pix code
    const simpayApiKey = Deno.env.get("SIMPAY_API_KEY");
    
    let qr_code = "";
    let pix_code = "";

    if (simpayApiKey) {
      // TODO: Real SimPay integration
      // const response = await fetch("https://api.simpay.com.br/v1/pix/charge", {
      //   method: "POST",
      //   headers: { "Authorization": `Bearer ${simpayApiKey}`, "Content-Type": "application/json" },
      //   body: JSON.stringify({ amount: valor, external_id: donation.id }),
      // });
      // const simpayData = await response.json();
      // qr_code = simpayData.qr_code_url;
      // pix_code = simpayData.pix_copy_paste;
      
      qr_code = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=pix-${donation.id}`;
      pix_code = `00020126580014br.gov.bcb.pix0136${donation.id}5204000053039865802BR`;
    } else {
      // Demo mode
      qr_code = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=demo-pix-${donation.id}`;
      pix_code = `00020126580014br.gov.bcb.pix0136${donation.id}5204000053039865802BR`;
    }

    return new Response(
      JSON.stringify({ donation_id: donation.id, qr_code, pix_code }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
