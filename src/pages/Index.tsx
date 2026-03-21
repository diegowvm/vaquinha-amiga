import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Campaign } from "@/types/campaign";
import { CampaignCard } from "@/components/CampaignCard";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Heart, TrendingUp, Users } from "lucide-react";
import heroImg from "@/assets/hero-donation.jpg";

export default function Index() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("campaigns")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setCampaigns((data as Campaign[]) || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-foreground">
        <img
          src={heroImg}
          alt="Comunidade unida"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="relative container py-20 md:py-28 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-primary-foreground leading-tight fade-in-up" style={{ lineHeight: "1.1" }}>
            Juntos fazemos<br />a diferença
          </h1>
          <p className="mt-4 text-primary-foreground/80 text-lg max-w-lg mx-auto fade-in-up stagger-1">
            Contribua com campanhas reais e acompanhe cada centavo fazendo impacto.
          </p>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-b bg-card">
        <div className="container py-6 flex flex-wrap justify-center gap-8 md:gap-16 text-center">
          <div className="flex items-center gap-3 fade-in-up stagger-1">
            <div className="p-2 rounded-lg bg-accent">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold tabular-nums">{campaigns.length}</p>
              <p className="text-xs text-muted-foreground">Campanhas ativas</p>
            </div>
          </div>
          <div className="flex items-center gap-3 fade-in-up stagger-2">
            <div className="p-2 rounded-lg bg-accent">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-xs text-muted-foreground">Transparência total</p>
              <p className="text-sm font-medium">Valores em tempo real</p>
            </div>
          </div>
          <div className="flex items-center gap-3 fade-in-up stagger-3">
            <div className="p-2 rounded-lg bg-accent">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-xs text-muted-foreground">Pix rápido</p>
              <p className="text-sm font-medium">Sem cadastro necessário</p>
            </div>
          </div>
        </div>
      </section>

      {/* Campaigns */}
      <main className="container py-12 flex-1">
        <h2 className="text-2xl font-bold mb-8">Campanhas em andamento</h2>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border bg-card animate-pulse">
                <div className="aspect-[4/3] bg-muted" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-2 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Heart className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Nenhuma campanha ativa no momento.</p>
            <p className="text-sm mt-1">Volte em breve!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((c, i) => (
              <CampaignCard key={c.id} campaign={c} index={i} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
