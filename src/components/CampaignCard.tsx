import { Link } from "react-router-dom";
import { Campaign } from "@/types/campaign";
import { formatCurrency, progressPercent } from "@/lib/format";
import { ProgressBar } from "./ProgressBar";
import { ArrowRight, Users } from "lucide-react";

interface CampaignCardProps {
  campaign: Campaign;
  index?: number;
}

export function CampaignCard({ campaign, index = 0 }: CampaignCardProps) {
  const pct = progressPercent(campaign.valor_atual, campaign.meta_valor);

  return (
    <Link
      to={`/c/${campaign.id}`}
      className="group block rounded-2xl bg-card overflow-hidden shadow-sm border hover:shadow-lg hover:-translate-y-1 active:scale-[0.98] transition-all duration-300"
    >
      <div className="aspect-[4/3] overflow-hidden bg-muted relative">
        {campaign.imagem ? (
          <img
            src={campaign.imagem}
            alt={campaign.titulo}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        )}

        {/* Badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-foreground/70 backdrop-blur-sm text-primary-foreground text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            Ativa
          </span>
        </div>
      </div>

      <div className="p-5 md:p-6 space-y-4">
        <h3 className="font-semibold text-lg leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {campaign.titulo}
        </h3>

        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {campaign.descricao}
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">{pct}% arrecadado</span>
            <span>Meta: {formatCurrency(campaign.meta_valor)}</span>
          </div>
          <ProgressBar current={campaign.valor_atual} goal={campaign.meta_valor} size="sm" />
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-lg font-bold text-primary tabular-nums">
            {formatCurrency(campaign.valor_atual)}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary group-hover:gap-2.5 transition-all duration-300">
            Contribuir
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
