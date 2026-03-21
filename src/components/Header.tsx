import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <Heart className="w-6 h-6 text-primary fill-primary" />
          <span>Vaquinha</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            Campanhas
          </Link>
        </nav>
      </div>
    </header>
  );
}
