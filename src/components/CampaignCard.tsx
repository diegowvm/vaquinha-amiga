import { Link } from "react-router-dom";
import { Campaign } from "@/types/campaign";
import { formatCurrency, progressPercent } from "@/lib/format";
import { ProgressBar } from "./ProgressBar";
import { Heart } from "lucide-react";

interface CampaignCardProps {
  campaign: Campaign;
  index?: number;
}

export function CampaignCard({ campaign, index = 0 }: CampaignCardProps) {
  const pct = progressPercent(campaign.valor_atual, campaign.meta_valor);

  return (
    <Link
      to={`/c/${campaign.id}`}
      className={`block card-hover rounded-xl bg-card overflow-hidden shadow-sm border fade-in-up stagger-${index % 4 + 1}`}
    >
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={campaign.imagem}
          alt={campaign.titulo}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="p-5 space-y-3">
        <h3 className="font-semibold text-lg leading-snug line-clamp-2">
          {campaign.titulo}
        </h3>
        <ProgressBar current={campaign.valor_atual} goal={campaign.meta_valor} size="sm" />
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-primary">
            {formatCurrency(campaign.valor_atual)}
          </span>
          <span className="text-muted-foreground">
            {pct}% de {formatCurrency(campaign.meta_valor)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
          <Heart className="w-3.5 h-3.5" />
          <span>Contribua agora</span>
        </div>
      </div>
    </Link>
  );
}
