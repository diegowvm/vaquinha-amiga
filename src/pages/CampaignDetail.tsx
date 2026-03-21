import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Campaign } from "@/types/campaign";
import { formatCurrency, progressPercent } from "@/lib/format";
import { ProgressBar } from "@/components/ProgressBar";
import { DonateModal } from "@/components/DonateModal";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, Target, Share2, Shield } from "lucide-react";
import { toast } from "sonner";

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [donateOpen, setDonateOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("campaigns")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setCampaign(data as Campaign | null);
        setLoading(false);
      });
  }, [id]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: campaign?.titulo, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container py-12 flex-1 animate-pulse space-y-6">
          <div className="h-6 bg-muted rounded w-24" />
          <div className="aspect-video bg-muted rounded-xl" />
          <div className="h-8 bg-muted rounded w-2/3" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container py-20 flex-1 text-center space-y-4">
          <p className="text-xl font-medium">Campanha não encontrada</p>
          <p className="text-muted-foreground">Esta campanha pode ter sido removida ou o link está incorreto.</p>
          <Link to="/">
            <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao início</Button>
          </Link>
        </div>
      </div>
    );
  }

  const pct = progressPercent(campaign.valor_atual, campaign.meta_valor);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="container py-8 flex-1">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Voltar às campanhas
        </Link>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Content */}
          <div className="lg:col-span-3 space-y-6 fade-in-up">
            {campaign.imagem && (
              <div className="rounded-xl overflow-hidden shadow-sm">
                <img
                  src={campaign.imagem}
                  alt={campaign.titulo}
                  className="w-full aspect-video object-cover"
                />
              </div>
            )}

            <div className="space-y-4">
              <h1 className="text-2xl md:text-3xl font-bold leading-tight" style={{ lineHeight: "1.15" }}>
                {campaign.titulo}
              </h1>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-[0.95rem]">
                {campaign.descricao}
              </p>
            </div>

            {campaign.video && (
              <div className="rounded-xl overflow-hidden shadow-sm">
                <video
                  src={campaign.video}
                  controls
                  className="w-full rounded-xl"
                  poster={campaign.imagem || undefined}
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-2 fade-in-up stagger-2">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-xl border bg-card p-6 space-y-5 shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-primary tabular-nums">
                      {formatCurrency(campaign.valor_atual)}
                    </span>
                    <span className="text-sm font-medium text-muted-foreground tabular-nums">{pct}%</span>
                  </div>
                  <ProgressBar current={campaign.valor_atual} goal={campaign.meta_valor} />
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Target className="w-4 h-4" />
                    <span>Meta: {formatCurrency(campaign.meta_valor)}</span>
                  </div>
                </div>

                <Button
                  onClick={() => setDonateOpen(true)}
                  className="w-full h-13 text-base font-semibold"
                  size="lg"
                >
                  <Heart className="w-5 h-5 mr-2" />
                  Doar agora
                </Button>

                <Button variant="outline" onClick={handleShare} className="w-full">
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar
                </Button>
              </div>

              <div className="rounded-xl border bg-card p-5">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Pagamento seguro</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Todas as doações são processadas via Pix com confirmação automática.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />

      <DonateModal
        open={donateOpen}
        onOpenChange={setDonateOpen}
        campaignId={campaign.id}
        campaignTitle={campaign.titulo}
      />
    </div>
  );
}
