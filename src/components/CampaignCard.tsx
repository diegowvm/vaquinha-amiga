import { Link } from "react-router-dom";
import { Campaign } from "@/types/campaign";
import { formatCurrency, progressPercent } from "@/lib/format";
import { ProgressBar } from "./ProgressBar";
import { ArrowRight } from "lucide-react";

interface CampaignCardProps {
  campaign: Campaign;
  index?: number;
}

export function CampaignCard({ campaign, index = 0 }: CampaignCardProps) {
  const pct = progressPercent(campaign.valor_atual, campaign.meta_valor);

  return (
    <Link
      to={`/c/${campaign.id}`}
      className={`group block card-hover rounded-xl bg-card overflow-hidden shadow-sm border fade-in-up stagger-${index % 4 + 1}`}
    >
      <div className="aspect-[4/3] overflow-hidden bg-muted">
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
      </div>
      <div className="p-5 space-y-3">
        <h3 className="font-semibold text-lg leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {campaign.titulo}
        </h3>
        <ProgressBar current={campaign.valor_atual} goal={campaign.meta_valor} size="sm" />
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-primary tabular-nums">
            {formatCurrency(campaign.valor_atual)}
          </span>
          <span className="text-muted-foreground tabular-nums">
            {pct}% de {formatCurrency(campaign.meta_valor)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-primary pt-1 group-hover:gap-2.5 transition-all">
          <span>Ver campanha</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </Link>
  );
}
