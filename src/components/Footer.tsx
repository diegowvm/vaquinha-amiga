import { Heart, Shield, QrCode } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t bg-foreground text-primary-foreground">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-flex items-center gap-2.5 font-bold text-lg mb-4">
              <div className="p-1.5 rounded-lg bg-primary-foreground/10">
                <Heart className="w-4 h-4 text-secondary fill-secondary" />
              </div>
              Vaquinha
            </Link>
            <p className="text-sm text-primary-foreground/60 leading-relaxed max-w-xs">
              Plataforma de doações online via Pix. Conectamos pessoas dispostas
              a ajudar com campanhas que realmente fazem a diferença.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-primary-foreground/80">Navegação</h4>
            <nav className="flex flex-col gap-2.5">
              <a href="#campanhas" className="text-sm text-primary-foreground/50 hover:text-primary-foreground transition-colors">
                Campanhas
              </a>
              <a href="#como-funciona" className="text-sm text-primary-foreground/50 hover:text-primary-foreground transition-colors">
                Como funciona
              </a>
            </nav>
          </div>

          {/* Trust */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-primary-foreground/80">Segurança</h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5 text-sm text-primary-foreground/50">
                <Shield className="w-4 h-4 shrink-0" />
                Transações protegidas
              </div>
              <div className="flex items-center gap-2.5 text-sm text-primary-foreground/50">
                <QrCode className="w-4 h-4 shrink-0" />
                Pix instantâneo
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-primary-foreground/40">
          <p>© {new Date().getFullYear()} Vaquinha. Todos os direitos reservados.</p>
          <div className="flex items-center gap-1.5">
            <span>Feito com</span>
            <Heart className="w-3 h-3 text-destructive fill-destructive" />
            <span>para quem faz a diferença</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
