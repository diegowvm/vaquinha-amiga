import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Authenticate with SimPay using client_id/client_secret
async function getSimPayToken(): Promise<string | null> {
  const clientId = Deno.env.get("SIMPAY_CLIENT_ID");
  const clientSecret = Deno.env.get("SIMPAY_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    console.error("SIMPAY_CLIENT_ID ou SIMPAY_CLIENT_SECRET não configurados");
    return null;
  }

  console.log("Autenticando na SimPay com client_id:", clientId.substring(0, 8) + "...");

  // Try multiple possible auth endpoints
  const authEndpoints = [
    "https://api.saq.digital/v2/auth/token",
    "https://api.saq.digital/v2/auth",
    "https://api.saq.digital/v2/token",
    "https://api.saq.digital/auth/token",
  ];

  for (const authUrl of authEndpoints) {
    try {
      console.log("Tentando auth em:", authUrl);
      const res = await fetch(authUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      const text = await res.text();
      console.log(`Auth ${authUrl} STATUS:`, res.status);
      console.log(`Auth ${authUrl} RESPONSE:`, text.substring(0, 500));

      if (res.ok) {
        try {
          const data = JSON.parse(text);
          const token = data.token || data.access_token || data.access || null;
          if (token) {
            console.log("Token obtido com sucesso via:", authUrl);
            return token;
          }
          console.log("Resposta OK mas sem token. Keys:", Object.keys(data));
        } catch {
          console.error("Resposta não é JSON válido");
        }
      }
    } catch (err) {
      console.error(`Erro ao tentar ${authUrl}:`, err);
    }
  }

  // Also try with email/password format in case that's what the credentials are
  const emailAuth = Deno.env.get("SIMPAY_API_EMAIL");
  const passwordAuth = Deno.env.get("SIMPAY_API_PASSWORD");
  
  if (emailAuth && passwordAuth) {
    for (const authUrl of authEndpoints) {
      try {
        console.log("Tentando auth com email/password em:", authUrl);
        const res = await fetch(authUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({
            email: emailAuth,
            password: passwordAuth,
          }),
        });

        const text = await res.text();
        console.log(`Auth email ${authUrl} STATUS:`, res.status);
        console.log(`Auth email ${authUrl} RESPONSE:`, text.substring(0, 500));

        if (res.ok) {
          try {
            const data = JSON.parse(text);
            const token = data.token || data.access_token || data.access || null;
            if (token) {
              console.log("Token obtido com email/password via:", authUrl);
              return token;
            }
          } catch {
            // skip
          }
        }
      } catch (err) {
        console.error(`Erro email auth ${authUrl}:`, err);
      }
    }
  }

  console.error("Nenhum endpoint de autenticação funcionou");
  return null;
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaign_id, valor, donor_name, donor_email } = await req.json();

    console.log("=== DONATE REQUEST ===");
    console.log("campaign_id:", campaign_id, "valor:", valor);

    if (!campaign_id || !valor || valor <= 0) {
      return new Response(
        JSON.stringify({ error: "campaign_id e valor são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Create donation record
    const { data: donation, error: donationError } = await supabase
      .from("donations")
      .insert({ campaign_id, valor: Number(valor), status: "pending" })
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
    await supabase.from("transactions").insert({
      donation_id: donation.id,
      status: "pending",
      gateway_id: "",
    });

    // 3. Authenticate with SimPay
    const token = await getSimPayToken();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Falha na autenticação com SimPay. Verifique os logs.", donation_id: donation.id }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Prepare PIX request (valor is in cents, SimPay expects reais as decimal)
    const amountInReais = Number(valor) / 100;
    const pixBody: Record<string, unknown> = {
      amount: amountInReais,
      tag: String(donation.id),
      base_64_image: true,
      type_fine: "NONE",
      fine: 0,
    };

    // Add optional debtor info if provided
    if (donor_name) {
      pixBody.debtor_name = donor_name;
    }

    const pixBodyStr = JSON.stringify(pixBody);
    console.log("PIX Request Body:", pixBodyStr);

    // 5. Generate HMAC
    const hmacSecret = Deno.env.get("SIMPAY_HMAC") || "";
    let hmacSignature = "";
    if (hmacSecret) {
      hmacSignature = await generateHmac(hmacSecret, pixBodyStr);
      console.log("HMAC gerado:", hmacSignature.substring(0, 20) + "...");
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

    console.log("Enviando PIX para SimPay...");
    const pixRes = await fetch("https://api.saq.digital/v2/finance/pix/cash-in/", {
      method: "POST",
      headers,
      body: pixBodyStr,
    });

    const responseText = await pixRes.text();
    console.log("SimPay PIX STATUS:", pixRes.status);
    console.log("SimPay PIX RESPONSE:", responseText.substring(0, 1000));

    if (!pixRes.ok) {
      return new Response(
        JSON.stringify({ error: `SimPay erro (${pixRes.status})`, details: responseText, donation_id: donation.id }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Parse response
    let pixData;
    try {
      pixData = JSON.parse(responseText);
    } catch {
      return new Response(
        JSON.stringify({ error: "Resposta SimPay não é JSON", raw: responseText, donation_id: donation.id }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 8. Update transaction with gateway_id
    const gatewayId = pixData.qr_code_id || pixData.id || "";
    await supabase
      .from("transactions")
      .update({ gateway_id: String(gatewayId) })
      .eq("donation_id", donation.id);

    console.log("=== PIX GERADO COM SUCESSO ===");
    console.log("worked:", pixData.worked, "qr_code_id:", gatewayId);

    // 9. Return QR code - SimPay returns base_64_image_url (URL) and pix_copy_and_paste
    const qrCodeImage = pixData.base_64_image || pixData.base_64_image_url || "";
    const pixCopyPaste = pixData.pix_copy_and_paste || "";

    return new Response(
      JSON.stringify({
        donation_id: donation.id,
        qr_code: qrCodeImage,
        pix_code: pixCopyPaste,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Erro geral na função donate:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
