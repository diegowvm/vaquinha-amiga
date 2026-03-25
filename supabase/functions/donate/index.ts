import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { encode as hexEncode } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Authenticate with SimPay using email/password
async function getSimPayToken(): Promise<string | null> {
  const email = Deno.env.get("SIMPAY_API_EMAIL");
  const password = Deno.env.get("SIMPAY_API_PASSWORD");

  if (!email || !password) {
    console.error("SIMPAY_API_EMAIL ou SIMPAY_API_PASSWORD não configurados");
    return null;
  }

  console.log("Autenticando na SimPay com email:", email);

  try {
    const res = await fetch("https://api.saq.digital/v2/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const text = await res.text();
    console.log("SimPay Auth STATUS:", res.status);
    console.log("SimPay Auth RESPONSE:", text);

    if (!res.ok) {
      console.error("Erro na autenticação SimPay:", res.status, text);
      return null;
    }

    const data = JSON.parse(text);
    return data.token || data.access_token || null;
  } catch (err) {
    console.error("Exceção ao autenticar na SimPay:", err);
    return null;
  }
}

// Generate HMAC-SHA256
async function generateHmac(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaign_id, valor, donor_name, donor_email } = await req.json();

    console.log("=== DONATE REQUEST ===");
    console.log("campaign_id:", campaign_id);
    console.log("valor:", valor);

    if (!campaign_id || !valor || valor <= 0) {
      return new Response(
        JSON.stringify({ error: "campaign_id e valor são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Create donation record
    const { data: donation, error: donationError } = await supabase
      .from("donations")
      .insert({
        campaign_id,
        valor: Number(valor),
        status: "pending",
      })
      .select()
      .single();

    if (donationError || !donation) {
      console.error("Erro ao criar doação:", donationError);
      return new Response(
        JSON.stringify({ error: "Erro ao criar doação", details: donationError?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Doação criada:", donation.id);

    // 2. Create transaction record
    const { error: txError } = await supabase
      .from("transactions")
      .insert({
        donation_id: donation.id,
        status: "pending",
        gateway_id: "",
      });

    if (txError) {
      console.error("Erro ao criar transação:", txError);
    }

    // 3. Authenticate with SimPay
    const token = await getSimPayToken();

    if (!token) {
      return new Response(
        JSON.stringify({
          error: "Falha na autenticação com SimPay",
          donation_id: donation.id,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Token SimPay obtido com sucesso");

    // 4. Prepare PIX request body (valor comes in cents, SimPay expects reais)
    const amountInReais = Number(valor) / 100;
    const pixBody = {
      amount: amountInReais,
      description: "Doação via plataforma",
      customer: {
        name: donor_name || "Doador Anônimo",
        email: donor_email || "doador@plataforma.com",
      },
      tag: String(donation.id),
      base_64_image: true,
    };

    const pixBodyStr = JSON.stringify(pixBody);
    console.log("PIX Request Body:", pixBodyStr);

    // 5. Generate HMAC
    const hmacSecret = Deno.env.get("SIMPAY_HMAC") || "";
    let hmacSignature = "";
    if (hmacSecret) {
      hmacSignature = await generateHmac(hmacSecret, pixBodyStr);
      console.log("HMAC gerado:", hmacSignature.substring(0, 20) + "...");
    } else {
      console.warn("SIMPAY_HMAC não configurado, enviando sem HMAC");
    }

    // 6. Create PIX charge
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json",
    };

    if (hmacSignature) {
      headers["hmac"] = hmacSignature;
    }

    console.log("Enviando requisição PIX para SimPay...");
    const pixRes = await fetch("https://api.saq.digital/v2/finance/pix/cash-in/", {
      method: "POST",
      headers,
      body: pixBodyStr,
    });

    const responseText = await pixRes.text();
    console.log("SimPay PIX STATUS:", pixRes.status);
    console.log("SimPay PIX RESPONSE:", responseText);

    if (!pixRes.ok) {
      return new Response(
        JSON.stringify({
          error: `SimPay erro (${pixRes.status})`,
          details: responseText,
          donation_id: donation.id,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Parse response
    let pixData;
    try {
      pixData = JSON.parse(responseText);
    } catch {
      return new Response(
        JSON.stringify({
          error: "Resposta da SimPay não é JSON válido",
          raw: responseText,
          donation_id: donation.id,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 8. Save gateway_id
    const gatewayId = pixData.qr_code_id || pixData.id || "";
    await supabase
      .from("transactions")
      .update({ gateway_id: String(gatewayId) })
      .eq("donation_id", donation.id);

    console.log("=== PIX GERADO COM SUCESSO ===");
    console.log("Gateway ID:", gatewayId);

    // 9. Return QR code data
    return new Response(
      JSON.stringify({
        donation_id: donation.id,
        qr_code: pixData.base_64_image || pixData.base_64_image_url || pixData.qr_code || "",
        pix_code: pixData.pix_copy_and_paste || pixData.pix_code || pixData.emv || "",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    console.error("Erro geral na função donate:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
