import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Campaign } from "@/types/campaign";
import { CampaignCard } from "@/components/CampaignCard";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { formatCurrency } from "@/lib/format";
import {
  Heart,
  TrendingUp,
  Shield,
  QrCode,
  Search,
  HandHeart,
  CheckCircle2,
  ArrowRight,
  Users,
  Banknote,
  Clock,
  ChevronRight,
  Sparkles,
  Flame,
  Star,
} from "lucide-react";
import { Link } from "react-router-dom";

function useInView(threshold = 0.18) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, visible } = useInView();
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const duration = 1600;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * ease));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [visible, target]);
  return <span ref={ref} className="tabular-nums">{count.toLocaleString("pt-BR")}{suffix}</span>;
}

export default function Index() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "trending" | "urgent">("all");

  const hero = useInView(0.1);
  const stats = useInView();
  const howIt = useInView();
  const campaignsSection = useInView();
  const trust = useInView();
  const cta = useInView();
  const testimonials = useInView();

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

  const totalRaised = campaigns.reduce((s, c) => s + c.valor_atual, 0);
  const totalDonors = campaigns.length * 47; // simulated

  const filteredCampaigns = campaigns.filter((c) => {
    if (filter === "trending") return c.valor_atual > c.meta_valor * 0.5;
    if (filter === "urgent") return c.valor_atual < c.meta_valor * 0.4;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* ─── HERO ─── */}
      <section
        ref={hero.ref}
        className="relative overflow-hidden bg-foreground"
      >
        <div className="absolute inset-0">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-secondary/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-primary-foreground/5" />
          <div className="absolute top-1/4 right-1/4 w-3 h-3 rounded-full bg-secondary/40 animate-pulse" />
          <div className="absolute bottom-1/3 left-1/3 w-2 h-2 rounded-full bg-primary/30 animate-pulse" style={{ animationDelay: "1s" }} />
        </div>

        <div className="relative container py-24 md:py-36 lg:py-44">
          <div className="max-w-2xl">
            <div
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 text-primary-foreground/90 text-sm font-medium mb-6 transition-all duration-700 ${hero.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Mais de {totalDonors.toLocaleString("pt-BR")} doadores ativos
            </div>

            <h1
              className={`text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-[1.08] transition-all duration-700 delay-100 ${hero.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            >
              Sua ajuda transforma vidas{" "}
              <span className="text-secondary">de verdade</span>
            </h1>

            <p
              className={`mt-5 text-primary-foreground/75 text-lg md:text-xl max-w-lg leading-relaxed transition-all duration-700 delay-200 ${hero.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            >
              Contribua com campanhas verificadas via Pix, acompanhe cada centavo em
              tempo real e faça parte de uma comunidade que acredita na solidariedade.
            </p>

            <div
              className={`flex flex-wrap gap-3 mt-8 transition-all duration-700 delay-300 ${hero.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            >
              <a
                href="#campanhas"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:brightness-110 active:scale-[0.97] transition-all duration-200"
              >
                <Heart className="w-4 h-4 fill-current" />
                Doar agora
              </a>
              <a
                href="#como-funciona"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-primary-foreground/20 text-primary-foreground/90 font-medium text-sm hover:bg-primary-foreground/5 active:scale-[0.97] transition-all duration-200"
              >
                Como funciona
              </a>
            </div>

            {/* Urgency bar */}
            <div
              className={`mt-10 flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/15 border border-secondary/20 max-w-md transition-all duration-700 delay-500 ${hero.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <Flame className="w-5 h-5 text-secondary shrink-0 animate-pulse" />
              <p className="text-sm text-primary-foreground/80">
                <span className="font-bold text-secondary">{campaigns.length} campanhas</span> precisam da sua ajuda agora
              </p>
            </div>
          </div>

          {/* Hero stats floating cards */}
          <div
            className={`hidden lg:flex absolute right-8 xl:right-16 top-1/2 -translate-y-1/2 flex-col gap-4 w-56 transition-all duration-700 delay-500 ${hero.visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}
          >
            {[
              { icon: Users, label: "Campanhas ativas", value: campaigns.length.toString() },
              { icon: Banknote, label: "Total arrecadado", value: formatCurrency(totalRaised) },
              { icon: Shield, label: "Segurança", value: "Pix protegido" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-primary-foreground/5 backdrop-blur-sm border border-primary-foreground/10"
              >
                <div className="p-2 rounded-lg bg-primary/20">
                  <item.icon className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-xs text-primary-foreground/60">{item.label}</p>
                  <p className="text-sm font-semibold text-primary-foreground">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS STRIP ─── */}
      <section
        ref={stats.ref}
        className="border-b bg-card relative z-10 -mt-1"
      >
        <div className="container py-8 md:py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { icon: Heart, label: "Campanhas ativas", value: <AnimatedCounter target={campaigns.length} />, color: "text-primary" },
              { icon: Banknote, label: "Total arrecadado", value: formatCurrency(totalRaised), color: "text-secondary" },
              { icon: Users, label: "Doadores", value: <AnimatedCounter target={totalDonors} suffix="+" />, color: "text-primary" },
              { icon: Shield, label: "Transações seguras", value: "100%", color: "text-success" },
            ].map((s, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 transition-all duration-600 ${stats.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="p-2.5 rounded-xl bg-muted shrink-0">
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section ref={howIt.ref} id="como-funciona" className="py-20 md:py-28 bg-muted/40">
        <div className="container">
          <div className="text-center max-w-xl mx-auto mb-14">
            <p className={`text-sm font-semibold text-primary uppercase tracking-wider mb-3 transition-all duration-600 ${howIt.visible ? "opacity-100" : "opacity-0"}`}>
              Simples e transparente
            </p>
            <h2 className={`text-3xl md:text-4xl font-bold transition-all duration-600 delay-100 ${howIt.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ lineHeight: "1.1" }}>
              Como funciona
            </h2>
            <p className={`mt-4 text-muted-foreground text-base md:text-lg transition-all duration-600 delay-200 ${howIt.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              Em poucos segundos você contribui com quem mais precisa — sem cadastro, sem burocracia.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 relative">
            <div className="hidden md:block absolute top-14 left-[16.6%] right-[16.6%] h-px bg-border" />
            {[
              { step: "01", icon: Search, title: "Escolha uma campanha", desc: "Navegue pelas campanhas ativas, leia as histórias e escolha aquela que toca seu coração." },
              { step: "02", icon: QrCode, title: "Doe via Pix", desc: "Escaneie o QR Code ou copie o código Pix. O pagamento é processado instantaneamente." },
              { step: "03", icon: TrendingUp, title: "Acompanhe o impacto", desc: "Veja os valores atualizados em tempo real e saiba exatamente para onde seu dinheiro foi." },
            ].map((item, i) => (
              <div
                key={i}
                className={`relative bg-card rounded-2xl p-7 md:p-8 shadow-sm border group hover:shadow-md hover:-translate-y-1 transition-all duration-500 ${howIt.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                style={{ transitionDelay: `${200 + i * 120}ms` }}
              >
                <div className="flex items-center gap-4 mb-5">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="absolute -top-2 -right-2 text-[10px] font-bold text-primary-foreground bg-primary rounded-full w-5 h-5 flex items-center justify-center">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CAMPAIGNS ─── */}
      <section ref={campaignsSection.ref} id="campanhas" className="py-20 md:py-28">
        <div className="container">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className={`text-sm font-semibold text-primary uppercase tracking-wider mb-2 transition-all duration-600 ${campaignsSection.visible ? "opacity-100" : "opacity-0"}`}>
                Faça a diferença
              </p>
              <h2 className={`text-3xl md:text-4xl font-bold transition-all duration-600 delay-100 ${campaignsSection.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ lineHeight: "1.1" }}>
                Campanhas em andamento
              </h2>
            </div>
            <p className={`text-muted-foreground text-sm max-w-xs transition-all duration-600 delay-200 ${campaignsSection.visible ? "opacity-100" : "opacity-0"}`}>
              Cada campanha é verificada pela nossa equipe para garantir legitimidade e transparência.
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-8">
            {([
              { key: "all" as const, label: "Todas", icon: Heart },
              { key: "trending" as const, label: "Em alta", icon: Flame },
              { key: "urgent" as const, label: "Urgentes", icon: Clock },
            ]).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border bg-card animate-pulse">
                  <div className="aspect-[4/3] bg-muted rounded-t-2xl" />
                  <div className="p-6 space-y-3">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-2 bg-muted rounded" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="text-center py-24 border rounded-2xl bg-card">
              <HandHeart className="w-14 h-14 mx-auto mb-5 text-muted-foreground/30" />
              <p className="text-lg font-medium">Nenhuma campanha encontrada</p>
              <p className="text-sm text-muted-foreground mt-1.5">
                Tente outro filtro ou volte em breve!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {filteredCampaigns.map((c, i) => (
                <CampaignCard key={c.id} campaign={c} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section ref={testimonials.ref} className="py-16 md:py-24 bg-muted/40">
        <div className="container">
          <div className="text-center max-w-xl mx-auto mb-12">
            <p className={`text-sm font-semibold text-primary uppercase tracking-wider mb-3 transition-all duration-600 ${testimonials.visible ? "opacity-100" : "opacity-0"}`}>
              Depoimentos
            </p>
            <h2 className={`text-3xl md:text-4xl font-bold transition-all duration-600 delay-100 ${testimonials.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ lineHeight: "1.1" }}>
              O que dizem nossos doadores
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Ana Clara", text: "Fiquei impressionada com a transparência. Acompanhei cada atualização da campanha que ajudei. Recomendo para todos!", stars: 5 },
              { name: "Carlos Eduardo", text: "Doei via Pix em 30 segundos. Sem cadastro, sem burocracia. A melhor plataforma de doações que já usei.", stars: 5 },
              { name: "Fernanda Lima", text: "A equipe verifica cada campanha, o que me dá muita confiança. Já contribuí com 3 campanhas diferentes!", stars: 5 },
            ].map((t, i) => (
              <div
                key={i}
                className={`bg-card rounded-2xl p-6 border shadow-sm transition-all duration-500 ${testimonials.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                style={{ transitionDelay: `${200 + i * 100}ms` }}
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-secondary fill-secondary" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {t.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium">{t.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TRUST / TRANSPARENCY ─── */}
      <section ref={trust.ref} className="py-20 md:py-28 bg-foreground text-primary-foreground">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className={`text-sm font-semibold text-secondary uppercase tracking-wider mb-3 transition-all duration-600 ${trust.visible ? "opacity-100" : "opacity-0"}`}>
                Confiança e segurança
              </p>
              <h2 className={`text-3xl md:text-4xl font-bold leading-[1.1] transition-all duration-600 delay-100 ${trust.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
                Por que confiar na Vaquinha?
              </h2>
              <p className={`mt-5 text-primary-foreground/70 text-base leading-relaxed max-w-md transition-all duration-600 delay-200 ${trust.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
                Acreditamos que a transparência é a base de qualquer ação solidária. Cada real é rastreável e cada campanha é verificada.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: Shield, title: "Pix protegido", desc: "Todas as transações são processadas por gateways certificados pelo Banco Central." },
                { icon: TrendingUp, title: "Valores em tempo real", desc: "Cada doação atualiza o progresso instantaneamente, sem atrasos." },
                { icon: CheckCircle2, title: "Campanhas verificadas", desc: "Nosso time analisa cada campanha antes de publicá-la na plataforma." },
                { icon: Users, title: "Sem cadastro", desc: "Doe em segundos sem criar conta. Simples como deve ser." },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`p-5 rounded-xl bg-primary-foreground/5 border border-primary-foreground/10 hover:bg-primary-foreground/8 transition-all duration-500 ${trust.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
                  style={{ transitionDelay: `${200 + i * 100}ms` }}
                >
                  <item.icon className="w-5 h-5 text-secondary mb-3" />
                  <h3 className="font-semibold text-sm mb-1.5">{item.title}</h3>
                  <p className="text-xs text-primary-foreground/60 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ─── */}
      <section ref={cta.ref} className="py-20 md:py-28">
        <div className="container">
          <div
            className={`relative overflow-hidden rounded-3xl bg-primary px-8 py-14 md:px-16 md:py-20 text-center transition-all duration-700 ${cta.visible ? "opacity-100 scale-100" : "opacity-0 scale-[0.97]"}`}
          >
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary-foreground/5 blur-2xl" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-secondary/20 blur-2xl" />

            <div className="relative z-10 max-w-lg mx-auto">
              <HandHeart className="w-10 h-10 mx-auto mb-5 text-primary-foreground/80" />
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-foreground" style={{ lineHeight: "1.1" }}>
                Pronto para fazer a diferença?
              </h2>
              <p className="mt-4 text-primary-foreground/75 text-base md:text-lg">
                Escolha uma campanha e contribua agora. Cada doação, por menor que seja, transforma realidades.
              </p>
              <a
                href="#campanhas"
                className="inline-flex items-center gap-2 mt-8 px-8 py-3.5 rounded-xl bg-primary-foreground text-primary font-semibold text-sm shadow-lg hover:shadow-xl active:scale-[0.97] transition-all duration-200"
              >
                Doar agora
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
