export interface Campaign {
  id: string;
  titulo: string;
  descricao: string;
  meta_valor: number;
  valor_atual: number;
  imagem: string;
  status: "active" | "paused" | "finished";
  created_at: string;
}

export interface Donation {
  id: string;
  campaign_id: string;
  valor: number;
  status: "pending" | "paid";
  created_at: string;
}

export interface Transaction {
  id: string;
  donation_id: string;
  gateway_id: string;
  status: string;
}
