import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Campaign } from "@/types/campaign";
import { formatCurrency, progressPercent } from "@/lib/format";
import { ProgressBar } from "@/components/ProgressBar";
import { DonateModal } from "@/components/DonateModal";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, Target } from "lucide-react";

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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container py-12 flex-1 animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="aspect-video bg-muted rounded-xl" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container py-20 flex-1 text-center">
          <p className="text-xl text-muted-foreground">Campanha não encontrada.</p>
          <Link to="/" className="text-primary mt-4 inline-block hover:underline">
            Voltar ao início
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
          Voltar
        </Link>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Image + description */}
          <div className="lg:col-span-3 space-y-6 fade-in-up">
            <div className="rounded-xl overflow-hidden">
              <img
                src={campaign.imagem}
                alt={campaign.titulo}
                className="w-full aspect-video object-cover"
              />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{campaign.titulo}</h1>
              <p className="mt-4 text-muted-foreground leading-relaxed whitespace-pre-line">
                {campaign.descricao}
              </p>
            </div>
          </div>

          {/* Donation sidebar */}
          <aside className="lg:col-span-2 fade-in-up stagger-2">
            <div className="sticky top-24 rounded-xl border bg-card p-6 space-y-5 shadow-sm">
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(campaign.valor_atual)}
                  </span>
                  <span className="text-sm text-muted-foreground">{pct}%</span>
                </div>
                <ProgressBar current={campaign.valor_atual} goal={campaign.meta_valor} />
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Target className="w-4 h-4" />
                  <span>Meta: {formatCurrency(campaign.meta_valor)}</span>
                </div>
              </div>

              <Button
                onClick={() => setDonateOpen(true)}
                className="w-full h-12 text-base"
                size="lg"
              >
                <Heart className="w-5 h-5 mr-2" />
                Doar agora
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Pagamento 100% seguro via Pix
              </p>
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
