import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t py-8 mt-16">
      <div className="container text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-1.5">
          <span>Feito com</span>
          <Heart className="w-3.5 h-3.5 text-destructive fill-destructive" />
          <span>para quem faz a diferença</span>
        </div>
      </div>
    </footer>
  );
}
