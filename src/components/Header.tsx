import { Link } from "react-router-dom";
import { Heart, Menu, X } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2.5 font-bold text-xl">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Heart className="w-5 h-5 text-primary fill-primary" />
          </div>
          <span>Vaquinha</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="#campanhas" className="text-muted-foreground hover:text-foreground transition-colors">
            Campanhas
          </a>
          <a href="#como-funciona" className="text-muted-foreground hover:text-foreground transition-colors">
            Como funciona
          </a>
          <a
            href="#campanhas"
            className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 active:scale-[0.97] transition-all duration-200"
          >
            Doar agora
          </a>
        </nav>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile nav */}
      {open && (
        <div className="md:hidden border-t bg-card animate-in slide-in-from-top-2 duration-200">
          <nav className="container flex flex-col gap-1 py-3">
            <a
              href="#campanhas"
              onClick={() => setOpen(false)}
              className="py-2.5 px-3 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              Campanhas
            </a>
            <a
              href="#como-funciona"
              onClick={() => setOpen(false)}
              className="py-2.5 px-3 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              Como funciona
            </a>
            <a
              href="#campanhas"
              onClick={() => setOpen(false)}
              className="mt-1 py-2.5 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold text-center"
            >
              Doar agora
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
