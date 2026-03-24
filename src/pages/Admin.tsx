import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Campaign, Donation } from "@/types/campaign";
import { formatCurrency } from "@/lib/format";
import { ProgressBar } from "@/components/ProgressBar";
import { MediaUpload } from "@/components/MediaUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Heart, Plus, Pencil, Trash2, Eye, LayoutDashboard, Lock,
  DollarSign, BarChart3, FileText, ChevronRight, X, ArrowLeft,
  Activity, Monitor, Smartphone, Tablet, Globe, TrendingUp
} from "lucide-react";
import { toast } from "sonner";

const ADMIN_PASS = "vaquinha2024";

type View = "dashboard" | "campaigns" | "campaign-detail" | "analytics";

interface PageViewStats {
  totalViews: number;
  todayViews: number;
  weekViews: number;
  byPage: { page: string; count: number }[];
  byDevice: { device_type: string; count: number }[];
  byDay: { day: string; count: number }[];
}

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState("");
  const [view, setView] = useState<View>("dashboard");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [allDonations, setAllDonations] = useState<Donation[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editCampaign, setEditCampaign] = useState<Partial<Campaign> | null>(null);
  const [analyticsData, setAnalyticsData] = useState<PageViewStats | null>(null);

  const loadCampaigns = useCallback(async () => {
    const { data } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
    setCampaigns((data as Campaign[]) || []);
  }, []);

  const loadAllDonations = useCallback(async () => {
    const { data } = await supabase.from("donations").select("*").order("created_at", { ascending: false });
    setAllDonations((data as Donation[]) || []);
  }, []);

  const loadDonations = useCallback(async (cid: string) => {
    const { data } = await supabase
      .from("donations")
      .select("*")
      .eq("campaign_id", cid)
      .order("created_at", { ascending: false });
    setDonations((data as Donation[]) || []);
  }, []);

  const loadAnalytics = useCallback(async () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [allViews, todayViews, weekViews] = await Promise.all([
      supabase.from("page_views").select("id", { count: "exact", head: true }),
      supabase.from("page_views").select("id", { count: "exact", head: true }).gte("created_at", todayStart),
      supabase.from("page_views").select("id", { count: "exact", head: true }).gte("created_at", weekStart),
    ]);

    // Get recent views for breakdown
    const { data: recentViews } = await supabase
      .from("page_views")
      .select("page, device_type, created_at")
      .gte("created_at", weekStart)
      .order("created_at", { ascending: false })
      .limit(1000);

    const byPage: Record<string, number> = {};
    const byDevice: Record<string, number> = {};
    const byDay: Record<string, number> = {};

    (recentViews || []).forEach((v: any) => {
      byPage[v.page] = (byPage[v.page] || 0) + 1;
      byDevice[v.device_type] = (byDevice[v.device_type] || 0) + 1;
      const day = new Date(v.created_at).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" });
      byDay[day] = (byDay[day] || 0) + 1;
    });

    setAnalyticsData({
      totalViews: allViews.count || 0,
      todayViews: todayViews.count || 0,
      weekViews: weekViews.count || 0,
      byPage: Object.entries(byPage).map(([page, count]) => ({ page, count })).sort((a, b) => b.count - a.count),
      byDevice: Object.entries(byDevice).map(([device_type, count]) => ({ device_type, count })).sort((a, b) => b.count - a.count),
      byDay: Object.entries(byDay).map(([day, count]) => ({ day, count })),
    });
  }, []);

  useEffect(() => {
    if (authed) {
      loadCampaigns();
      loadAllDonations();
      loadAnalytics();
    }
  }, [authed, loadCampaigns, loadAllDonations, loadAnalytics]);

  const handleLogin = () => {
    if (pass === ADMIN_PASS) setAuthed(true);
    else toast.error("Senha incorreta");
  };

  const openNew = () => {
    setEditCampaign({ titulo: "", descricao: "", meta_valor: 0, valor_atual: 0, imagem: "", video: "", status: "active" });
    setEditOpen(true);
  };

  const openEdit = (c: Campaign) => {
    setEditCampaign({ ...c });
    setEditOpen(true);
  };

  const saveCampaign = async () => {
    if (!editCampaign) return;
    if (!editCampaign.titulo?.trim()) { toast.error("Título é obrigatório"); return; }
    if (!editCampaign.meta_valor || editCampaign.meta_valor <= 0) { toast.error("Meta deve ser maior que zero"); return; }

    const payload = {
      titulo: editCampaign.titulo,
      descricao: editCampaign.descricao,
      meta_valor: editCampaign.meta_valor,
      valor_atual: editCampaign.valor_atual || 0,
      imagem: editCampaign.imagem,
      video: editCampaign.video || "",
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
    if (!confirm("Excluir esta campanha permanentemente?")) return;
    await supabase.from("campaigns").delete().eq("id", id);
    toast.success("Campanha excluída");
    loadCampaigns();
    if (selectedCampaign?.id === id) {
      setSelectedCampaign(null);
      setView("campaigns");
    }
  };

  const openCampaignDetail = async (c: Campaign) => {
    setSelectedCampaign(c);
    await loadDonations(c.id);
    setView("campaign-detail");
  };

  const totalRaised = campaigns.reduce((s, c) => s + c.valor_atual, 0);
  const activeCampaigns = campaigns.filter(c => c.status === "active").length;
  const paidDonations = allDonations.filter(d => d.status === "paid");

  // --- Login screen ---
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted to-background">
        <div className="bg-card rounded-2xl border p-10 w-full max-w-sm shadow-xl space-y-6 fade-in-up">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-full bg-primary/10 mb-2">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Painel Administrativo</h1>
            <p className="text-sm text-muted-foreground">Acesso restrito. Insira a senha para continuar.</p>
          </div>
          <Input
            type="password"
            placeholder="Digite a senha"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="h-12 text-center text-lg"
          />
          <Button onClick={handleLogin} className="w-full h-12 text-base">
            Acessar
          </Button>
        </div>
      </div>
    );
  }

  const deviceIcon = (type: string) => {
    if (type === "mobile") return <Smartphone className="w-4 h-4" />;
    if (type === "tablet") return <Tablet className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  // --- Admin layout ---
  return (
    <div className="min-h-screen bg-muted/40">
      {/* Top bar */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <LayoutDashboard className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-lg">Painel Admin</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setAuthed(false)} className="text-muted-foreground">
            Sair
          </Button>
        </div>
      </header>

      {/* Nav tabs */}
      <div className="bg-card border-b">
        <div className="container flex gap-1 py-1 overflow-x-auto">
          {([
            { key: "dashboard", label: "Dashboard", icon: BarChart3 },
            { key: "campaigns", label: "Campanhas", icon: FileText },
            { key: "analytics", label: "Analytics", icon: Activity },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${view === key || (view === "campaign-detail" && key === "campaigns") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="container py-8">
        {/* Dashboard view */}
        {view === "dashboard" && (
          <div className="space-y-8 fade-in-up">
            <div>
              <h2 className="text-2xl font-bold">Dashboard</h2>
              <p className="text-muted-foreground mt-1">Visão geral do desempenho da plataforma</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Arrecadado", value: formatCurrency(totalRaised), icon: DollarSign, color: "text-emerald-600" },
                { label: "Campanhas Ativas", value: activeCampaigns.toString(), icon: Heart, color: "text-primary" },
                { label: "Total de Campanhas", value: campaigns.length.toString(), icon: FileText, color: "text-blue-600" },
                { label: "Doações Confirmadas", value: paidDonations.length.toString(), icon: BarChart3, color: "text-amber-600" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="rounded-xl border bg-card p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <p className="text-3xl font-bold tabular-nums">{value}</p>
                </div>
              ))}
            </div>

            {/* Recent donations */}
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="p-5 border-b">
                <h3 className="font-semibold text-lg">Últimas doações confirmadas</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="px-5 py-3 font-medium">Data</th>
                      <th className="px-5 py-3 font-medium">Campanha</th>
                      <th className="px-5 py-3 font-medium">Valor</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paidDonations.length === 0 ? (
                      <tr><td colSpan={4} className="px-5 py-12 text-center text-muted-foreground">Nenhuma doação confirmada ainda.</td></tr>
                    ) : (
                      paidDonations.slice(0, 10).map((d) => {
                        const camp = campaigns.find(c => c.id === d.campaign_id);
                        return (
                          <tr key={d.id} className="border-t hover:bg-muted/30 transition-colors">
                            <td className="px-5 py-3 tabular-nums">{new Date(d.created_at).toLocaleDateString("pt-BR")}</td>
                            <td className="px-5 py-3 font-medium truncate max-w-[200px]">{camp?.titulo || "—"}</td>
                            <td className="px-5 py-3 font-semibold text-primary tabular-nums">{formatCurrency(d.valor)}</td>
                            <td className="px-5 py-3">
                              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">Pago</span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Analytics view */}
        {view === "analytics" && (
          <div className="space-y-8 fade-in-up">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Analytics</h2>
                <p className="text-muted-foreground mt-1">Acompanhe o tráfego e comportamento dos visitantes</p>
              </div>
              <Button variant="outline" size="sm" onClick={loadAnalytics}>
                <Activity className="w-4 h-4 mr-2" /> Atualizar
              </Button>
            </div>

            {analyticsData && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Visualizações Hoje", value: analyticsData.todayViews, icon: Eye, color: "text-primary" },
                    { label: "Últimos 7 dias", value: analyticsData.weekViews, icon: TrendingUp, color: "text-blue-600" },
                    { label: "Total de Visualizações", value: analyticsData.totalViews, icon: Globe, color: "text-emerald-600" },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="rounded-xl border bg-card p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{label}</span>
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>
                      <p className="text-3xl font-bold tabular-nums">{value.toLocaleString("pt-BR")}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* By page */}
                  <div className="rounded-xl border bg-card overflow-hidden">
                    <div className="p-5 border-b">
                      <h3 className="font-semibold">Páginas mais visitadas</h3>
                    </div>
                    <div className="p-4 space-y-3">
                      {analyticsData.byPage.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado ainda</p>
                      ) : (
                        analyticsData.byPage.slice(0, 10).map((p) => {
                          const maxCount = analyticsData.byPage[0]?.count || 1;
                          return (
                            <div key={p.page} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium truncate max-w-[200px]">{p.page}</span>
                                <span className="text-muted-foreground tabular-nums">{p.count}</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-primary transition-all"
                                  style={{ width: `${(p.count / maxCount) * 100}%` }}
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* By device */}
                  <div className="rounded-xl border bg-card overflow-hidden">
                    <div className="p-5 border-b">
                      <h3 className="font-semibold">Dispositivos</h3>
                    </div>
                    <div className="p-4 space-y-4">
                      {analyticsData.byDevice.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado ainda</p>
                      ) : (
                        analyticsData.byDevice.map((d) => {
                          const total = analyticsData.byDevice.reduce((s, x) => s + x.count, 0);
                          const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
                          const labels: Record<string, string> = { desktop: "Desktop", mobile: "Mobile", tablet: "Tablet" };
                          return (
                            <div key={d.device_type} className="flex items-center gap-4">
                              <div className="p-2.5 rounded-lg bg-muted">
                                {deviceIcon(d.device_type)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between text-sm mb-1">
                                  <span className="font-medium">{labels[d.device_type] || d.device_type}</span>
                                  <span className="text-muted-foreground">{pct}% ({d.count})</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                  <div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* By day */}
                <div className="rounded-xl border bg-card overflow-hidden">
                  <div className="p-5 border-b">
                    <h3 className="font-semibold">Visitas por dia (últimos 7 dias)</h3>
                  </div>
                  <div className="p-5">
                    {analyticsData.byDay.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado ainda</p>
                    ) : (
                      <div className="flex items-end gap-2 h-40">
                        {analyticsData.byDay.map((d) => {
                          const maxCount = Math.max(...analyticsData.byDay.map(x => x.count), 1);
                          const height = Math.max((d.count / maxCount) * 100, 8);
                          return (
                            <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
                              <span className="text-xs font-medium tabular-nums">{d.count}</span>
                              <div className="w-full rounded-t-md bg-primary/80" style={{ height: `${height}%` }} />
                              <span className="text-[10px] text-muted-foreground">{d.day}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Campaigns list view */}
        {view === "campaigns" && (
          <div className="space-y-6 fade-in-up">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Campanhas</h2>
                <p className="text-muted-foreground mt-1">Gerencie todas as campanhas da plataforma</p>
              </div>
              <Button onClick={openNew} className="h-11">
                <Plus className="w-4 h-4 mr-2" /> Nova campanha
              </Button>
            </div>

            {campaigns.length === 0 ? (
              <div className="rounded-xl border bg-card p-16 text-center space-y-4">
                <div className="inline-flex p-4 rounded-full bg-muted"><FileText className="w-8 h-8 text-muted-foreground" /></div>
                <p className="text-lg font-medium">Nenhuma campanha criada</p>
                <p className="text-muted-foreground">Comece criando sua primeira campanha de doação.</p>
                <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Criar campanha</Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {campaigns.map((c) => (
                  <div key={c.id} className="rounded-xl border bg-card hover:shadow-md transition-shadow overflow-hidden">
                    <div className="flex flex-col sm:flex-row">
                      <div className="sm:w-48 h-32 sm:h-auto flex-shrink-0">
                        {c.imagem ? (
                          <img src={c.imagem} alt={c.titulo} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <ImagePlaceholder />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-5 flex flex-col justify-between gap-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg truncate">{c.titulo}</h3>
                              <StatusBadge status={c.status} />
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1">{c.descricao || "Sem descrição"}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button variant="ghost" size="icon" onClick={() => openCampaignDetail(c)} title="Detalhes">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openEdit(c)} title="Editar">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteCampaign(c.id)} title="Excluir">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <ProgressBar current={c.valor_atual} goal={c.meta_valor} size="sm" />
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-semibold text-primary tabular-nums">{formatCurrency(c.valor_atual)}</span>
                            <span className="text-muted-foreground tabular-nums">Meta: {formatCurrency(c.meta_valor)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Campaign detail view */}
        {view === "campaign-detail" && selectedCampaign && (
          <div className="space-y-6 fade-in-up">
            <button onClick={() => setView("campaigns")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" /> Voltar para campanhas
            </button>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-xl border bg-card overflow-hidden">
                  {selectedCampaign.imagem && (
                    <img src={selectedCampaign.imagem} alt={selectedCampaign.titulo} className="w-full h-56 object-cover" />
                  )}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold">{selectedCampaign.titulo}</h2>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(selectedCampaign)}>
                          <Pencil className="w-4 h-4 mr-1" /> Editar
                        </Button>
                      </div>
                    </div>
                    <StatusBadge status={selectedCampaign.status} />
                    <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{selectedCampaign.descricao}</p>
                    {selectedCampaign.video && (
                      <div className="rounded-lg overflow-hidden">
                        <video src={selectedCampaign.video} controls className="w-full rounded-lg" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border bg-card p-6 space-y-4">
                  <h3 className="font-semibold">Progresso</h3>
                  <ProgressBar current={selectedCampaign.valor_atual} goal={selectedCampaign.meta_valor} />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Arrecadado</span>
                      <span className="font-semibold text-primary tabular-nums">{formatCurrency(selectedCampaign.valor_atual)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Meta</span>
                      <span className="font-semibold tabular-nums">{formatCurrency(selectedCampaign.meta_valor)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Doações</span>
                      <span className="font-semibold tabular-nums">{donations.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Confirmadas</span>
                      <span className="font-semibold tabular-nums">{donations.filter(d => d.status === "paid").length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Donations table */}
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="p-5 border-b">
                <h3 className="font-semibold text-lg">Doações desta campanha</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="px-5 py-3 font-medium">Data</th>
                      <th className="px-5 py-3 font-medium">Valor</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations.length === 0 ? (
                      <tr><td colSpan={3} className="px-5 py-12 text-center text-muted-foreground">Nenhuma doação registrada para esta campanha.</td></tr>
                    ) : (
                      donations.map((d) => (
                        <tr key={d.id} className="border-t hover:bg-muted/30 transition-colors">
                          <td className="px-5 py-3 tabular-nums">{new Date(d.created_at).toLocaleString("pt-BR")}</td>
                          <td className="px-5 py-3 font-semibold tabular-nums">{formatCurrency(d.valor)}</td>
                          <td className="px-5 py-3">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${d.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                              {d.status === "paid" ? "Confirmado" : "Pendente"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Create/Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editCampaign?.id ? "Editar campanha" : "Nova campanha"}
            </DialogTitle>
          </DialogHeader>
          {editCampaign && (
            <div className="space-y-6 pt-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Título da campanha *</label>
                <Input
                  placeholder="Ex: Ajude a reforma do abrigo"
                  value={editCampaign.titulo || ""}
                  onChange={(e) => setEditCampaign({ ...editCampaign, titulo: e.target.value })}
                  className="h-12"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  placeholder="Descreva o objetivo da campanha, como os recursos serão utilizados, quem será beneficiado..."
                  value={editCampaign.descricao || ""}
                  onChange={(e) => setEditCampaign({ ...editCampaign, descricao: e.target.value })}
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">Quanto mais detalhes, mais confiança os doadores terão.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Meta (R$) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                    <Input
                      type="number"
                      placeholder="0,00"
                      value={editCampaign.meta_valor ? (editCampaign.meta_valor / 100).toFixed(2) : ""}
                      onChange={(e) => setEditCampaign({ ...editCampaign, meta_valor: Math.round(parseFloat(e.target.value || "0") * 100) })}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Valor arrecadado (R$)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                    <Input
                      type="number"
                      placeholder="0,00"
                      value={editCampaign.valor_atual !== undefined ? (editCampaign.valor_atual / 100).toFixed(2) : ""}
                      onChange={(e) => setEditCampaign({ ...editCampaign, valor_atual: Math.round(parseFloat(e.target.value || "0") * 100) })}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Status</label>
                  <select
                    className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={editCampaign.status || "active"}
                    onChange={(e) => setEditCampaign({ ...editCampaign, status: e.target.value as Campaign["status"] })}
                  >
                    <option value="active">Ativa</option>
                    <option value="paused">Pausada</option>
                    <option value="finished">Finalizada</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <MediaUpload
                  value={editCampaign.imagem || ""}
                  onChange={(url) => setEditCampaign({ ...editCampaign, imagem: url })}
                  accept="image"
                  label="Imagem de capa"
                />
                <MediaUpload
                  value={editCampaign.video || ""}
                  onChange={(url) => setEditCampaign({ ...editCampaign, video: url })}
                  accept="video"
                  label="Vídeo (opcional)"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setEditOpen(false)} className="flex-1 h-12">
                  Cancelar
                </Button>
                <Button onClick={saveCampaign} className="flex-1 h-12 text-base">
                  {editCampaign.id ? "Salvar alterações" : "Criar campanha"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    paused: "bg-amber-100 text-amber-700",
    finished: "bg-muted text-muted-foreground",
  };
  const labels: Record<string, string> = {
    active: "Ativa",
    paused: "Pausada",
    finished: "Finalizada",
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${styles[status] || styles.finished}`}>
      {labels[status] || status}
    </span>
  );
}

function ImagePlaceholder() {
  return (
    <svg className="w-10 h-10 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}
