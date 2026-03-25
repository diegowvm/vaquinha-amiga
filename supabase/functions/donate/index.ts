// 1. Authenticate with SimPay
const token = await getSimPayToken();

if (!token) {
  throw new Error("Token da SimPay não retornado");
}

// 2. Create Pix charge
const pixRes = await fetch("https://api.saq.digital/v2/finance/pix/cash-in/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
    "hmac": hmac, // depois podemos ajustar se necessário
    "Accept": "application/json",
  },
  body: JSON.stringify({
    amount: Number(amountInReais),
    description: "Doação",
    customer: {
      name: "Cliente Teste",
      email: "teste@email.com",
    },
    tag: String(donation.id),
    base_64_image: true,
  }),
});

// 🔥 DEBUG FORTE (ESSENCIAL)
const responseText = await pixRes.text();
console.log("SimPay STATUS:", pixRes.status);
console.log("SimPay RESPONSE:", responseText);

if (!pixRes.ok) {
  throw new Error(`SimPay erro (${pixRes.status}): ${responseText}`);
}

// Converter resposta em JSON com segurança
let pixData;
try {
  pixData = JSON.parse(responseText);
} catch {
  throw new Error("Resposta da SimPay não é JSON válido");
}

// Save gateway_id
const gatewayId = pixData.qr_code_id || pixData.id || "";

await supabase
  .from("transactions")
  .update({ gateway_id: String(gatewayId) })
  .eq("donation_id", donation.id);

// Resposta final
return new Response(
  JSON.stringify({
    donation_id: donation.id,
    qr_code: pixData.base_64_image || pixData.base_64_image_url || "",
    pix_code: pixData.pix_copy_and_paste || "",
  }),
  {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  }
);
