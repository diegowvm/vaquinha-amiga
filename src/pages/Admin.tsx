import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Campaign, Donation } from "@/types/campaign";
import { formatCurrency } from "@/lib/format";
import { ProgressBar } from "@/components/ProgressBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Heart, Plus, Pencil, Trash2, Eye, LayoutDashboard, Lock } from "lucide-react";
import { toast } from "sonner";

const ADMIN_PASS = "vaquinha2024";

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editCampaign, setEditCampaign] = useState<Partial<Campaign> | null>(null);

  const loadCampaigns = useCallback(async () => {
    const { data } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
    setCampaigns((data as Campaign[]) || []);
  }, []);

  const loadDonations = useCallback(async (cid: string) => {
    setSelectedCampaign(cid);
    const { data } = await supabase
      .from("donations")
      .select("*")
      .eq("campaign_id", cid)
      .order("created_at", { ascending: false });
    setDonations((data as Donation[]) || []);
  }, []);

  useEffect(() => {
    if (authed) loadCampaigns();
  }, [authed, loadCampaigns]);

  const handleLogin = () => {
    if (pass === ADMIN_PASS) {
      setAuthed(true);
    } else {
      toast.error("Senha incorreta");
    }
  };

  const openNew = () => {
    setEditCampaign({ titulo: "", descricao: "", meta_valor: 0, imagem: "", status: "active" });
    setEditOpen(true);
  };

  const openEdit = (c: Campaign) => {
    setEditCampaign({ ...c });
    setEditOpen(true);
  };

  const saveCampaign = async () => {
    if (!editCampaign) return;
    const payload = {
      titulo: editCampaign.titulo,
      descricao: editCampaign.descricao,
      meta_valor: editCampaign.meta_valor,
      imagem: editCampaign.imagem,
      status: editCampaign.status,
    };

    if (editCampaign.id) {
      await supabase.from("campaigns").update(payload).eq("id", editCampaign.id);
      toast.success("Campanha atualizada!");
    } else {
      await supabase.from("campaigns").insert(payload);
      toast.success("Campanha criada!");
    }
    setEditOpen(false);
    loadCampaigns();
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm("Excluir esta campanha?")) return;
    await supabase.from("campaigns").delete().eq("id", id);
    toast.success("Campanha excluída");
    loadCampaigns();
  };

  const totalRaised = campaigns.reduce((s, c) => s + c.valor_atual, 0);
  const totalDonationsCount = donations.length;

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="bg-card rounded-xl border p-8 w-full max-w-sm shadow-lg space-y-5 fade-in-up">
          <div className="flex items-center gap-2 justify-center">
            <Lock className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">Painel Admin</h1>
          </div>
          <Input
            type="password"
            placeholder="Senha"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          <Button onClick={handleLogin} className="w-full">
            Entrar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-card border-b">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2 font-bold text-lg">
            <LayoutDashboard className="w-5 h-5 text-primary" />
            Admin
          </div>
          <Button variant="outline" size="sm" onClick={() => setAuthed(false)}>
            Sair
          </Button>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        {/* Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">Total arrecadado</p>
            <p className="text-2xl font-bold text-primary mt-1">{formatCurrency(totalRaised)}</p>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">Campanhas</p>
            <p className="text-2xl font-bold mt-1">{campaigns.length}</p>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">Doações (selecionada)</p>
            <p className="text-2xl font-bold mt-1">{totalDonationsCount}</p>
          </div>
        </div>

        {/* Campaigns table */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold">Campanhas</h2>
            <Button size="sm" onClick={openNew}>
              <Plus className="w-4 h-4 mr-1" /> Nova
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Título</th>
                  <th className="px-4 py-3 font-medium">Progresso</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-t hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium max-w-[200px] truncate">{c.titulo}</td>
                    <td className="px-4 py-3 w-48">
                      <div className="space-y-1">
                        <ProgressBar current={c.valor_atual} goal={c.meta_valor} size="sm" />
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(c.valor_atual)} / {formatCurrency(c.meta_valor)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${c.status === "active" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                        {c.status === "active" ? "Ativa" : c.status === "paused" ? "Pausada" : "Finalizada"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => loadDonations(c.id)} title="Ver doações">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)} title="Editar">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteCampaign(c.id)} title="Excluir">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Donations table */}
        {selectedCampaign && (
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="font-semibold">Doações — {campaigns.find((c) => c.id === selectedCampaign)?.titulo}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Data</th>
                    <th className="px-4 py-3 font-medium">Valor</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                        Nenhuma doação ainda.
                      </td>
                    </tr>
                  ) : (
                    donations.map((d) => (
                      <tr key={d.id} className="border-t">
                        <td className="px-4 py-3">{new Date(d.created_at).toLocaleString("pt-BR")}</td>
                        <td className="px-4 py-3 font-medium">{formatCurrency(d.valor)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${d.status === "paid" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                            {d.status === "paid" ? "Pago" : "Pendente"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Edit/Create dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editCampaign?.id ? "Editar campanha" : "Nova campanha"}</DialogTitle>
          </DialogHeader>
          {editCampaign && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título</label>
                <Input value={editCampaign.titulo || ""} onChange={(e) => setEditCampaign({ ...editCampaign, titulo: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea value={editCampaign.descricao || ""} onChange={(e) => setEditCampaign({ ...editCampaign, descricao: e.target.value })} rows={4} />
              </div>
              <div>
                <label className="text-sm font-medium">Meta (centavos)</label>
                <Input type="number" value={editCampaign.meta_valor || 0} onChange={(e) => setEditCampaign({ ...editCampaign, meta_valor: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="text-sm font-medium">URL da imagem</label>
                <Input value={editCampaign.imagem || ""} onChange={(e) => setEditCampaign({ ...editCampaign, imagem: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editCampaign.status || "active"}
                  onChange={(e) => setEditCampaign({ ...editCampaign, status: e.target.value as Campaign["status"] })}
                >
                  <option value="active">Ativa</option>
                  <option value="paused">Pausada</option>
                  <option value="finished">Finalizada</option>
                </select>
              </div>
              <Button onClick={saveCampaign} className="w-full">
                Salvar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
