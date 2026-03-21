import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function getSimPayToken(): Promise<string> {
  const clientId = Deno.env.get("SIMPAY_CLIENT_ID")!;
  const clientSecret = Deno.env.get("SIMPAY_CLIENT_SECRET")!;

  const res = await fetch("https://api.saq.digital/v2/finance/auth-token/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SimPay auth failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.access || data.access_token || data.token;
}

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

    // Convert centavos to reais (decimal)
    const amountInReais = (valor / 100).toFixed(2);
    const hmac = Deno.env.get("SIMPAY_HMAC")!;

    // 1. Authenticate with SimPay
    const token = await getSimPayToken();

    // 2. Create Pix charge
    const pixRes = await fetch("https://api.saq.digital/v2/finance/pix/cash-in/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "hmac": hmac,
      },
      body: JSON.stringify({
        amount: parseFloat(amountInReais),
        type_fine: "NONE",
        fine: 0,
        tag: donation.id,
        base_64_image: true,
      }),
    });

    if (!pixRes.ok) {
      const errText = await pixRes.text();
      console.error("SimPay pix/cash-in error:", errText);
      throw new Error(`SimPay charge failed (${pixRes.status}): ${errText}`);
    }

    const pixData = await pixRes.json();

    // Save gateway_id (qr_code_id) to transaction
    const gatewayId = pixData.qr_code_id || pixData.id || "";
    await supabase
      .from("transactions")
      .update({ gateway_id: String(gatewayId) })
      .eq("donation_id", donation.id);

    return new Response(
      JSON.stringify({
        donation_id: donation.id,
        qr_code: pixData.base_64_image_url || "",
        pix_code: pixData.pix_copy_and_paste || "",
      }),
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
