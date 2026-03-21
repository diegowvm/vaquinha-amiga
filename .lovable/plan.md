

## Plano: Integração Real com SimPay (Pix)

### Resumo
Configurar as credenciais da SimPay como secrets seguros e atualizar as Edge Functions para gerar cobranças Pix reais via API da SimPay/SaQ.Digital, além de validar webhooks com HMAC.

### O que será feito

**1. Armazenar credenciais de forma segura**
- Salvar 3 secrets no backend:
  - `SIMPAY_CLIENT_ID` — email da API (`6005547_api@somossimpay.com.br`)
  - `SIMPAY_CLIENT_SECRET` — senha da API
  - `SIMPAY_HMAC` — chave HMAC para validação de webhooks

**2. Atualizar Edge Function `donate`**
- Autenticar na API SimPay: `POST https://api.somossimpay.com.br/v2/finance/auth-token/` com `client_id` e `client_secret`
- Gerar cobrança Pix: `POST https://api.somossimpay.com.br/v2/finance/pix/cash-in/` com:
  - `amount` (valor em reais, decimal)
  - `type_fine: "NONE"`, `fine: 0`
  - `tag: donation.id` (para rastreamento)
  - `base_64_image: true` (para obter QR Code)
  - Headers: `Authorization: Bearer <token>`, `hmac: <HMAC>`
- Salvar `qr_code_id` na tabela `transactions` como `gateway_id`
- Retornar `pix_copy_and_paste` e `base_64_image_url` para o frontend

**3. Atualizar Edge Function `webhook-simpay`**
- Validar HMAC do webhook para segurança
- Mapear campos da resposta SimPay (`tag` = donation_id, `status` = "PAID")
- Manter lógica existente de atualização de doação e campanha

**4. Atualizar `DonateModal`**
- Usar `base_64_image_url` da SimPay como imagem do QR Code
- Usar `pix_copy_and_paste` como código Pix copia-e-cola
- Ajustar mapeamento dos campos retornados

### Detalhes Técnicos

API SimPay (SaQ.Digital):
- Base URL: `https://api.somossimpay.com.br`
- Auth: POST `/v2/finance/auth-token/` → retorna access token (válido 60 min)
- Pix Cash In: POST `/v2/finance/pix/cash-in/` → retorna `pix_copy_and_paste`, `base_64_image_url`, `qr_code_id`
- Valor enviado em reais (decimal), não centavos — converter no backend

