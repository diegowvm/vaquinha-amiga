import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/format";
import { Heart, X } from "lucide-react";
import { Link } from "react-router-dom";

interface Campaign {
  id: string;
  titulo: string;
}

const FIRST_NAMES = [
  "Ana", "Carlos", "Maria", "João", "Fernanda", "Lucas", "Juliana", "Pedro",
  "Camila", "Rafael", "Beatriz", "Gustavo", "Larissa", "Mateus", "Isabela",
  "Bruno", "Letícia", "Diego", "Amanda", "Thiago", "Patrícia", "Gabriel",
  "Daniela", "Marcelo", "Renata", "Felipe", "Cristina", "André", "Vanessa",
  "Roberto", "Aline", "Eduardo", "Priscila", "Rodrigo", "Tatiana", "Leonardo",
];

function randomName() {
  return FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
}

function randomAmount() {
  const amounts = [500, 1000, 1500, 2000, 2500, 3000, 5000, 7500, 10000, 15000, 20000, 25000, 50000];
  return amounts[Math.floor(Math.random() * amounts.length)];
}

function randomMinutesAgo() {
  return Math.floor(Math.random() * 58) + 2;
}

interface Notification {
  id: number;
  name: string;
  amount: number;
  campaign: Campaign;
  minutesAgo: number;
  visible: boolean;
}

export function FakeDonationNotifications() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    supabase
      .from("campaigns")
      .select("id, titulo")
      .eq("status", "active")
      .then(({ data }) => {
        if (data && data.length > 0) setCampaigns(data);
      });
  }, []);

  const showNotification = useCallback(() => {
    if (campaigns.length === 0) return;
    const campaign = campaigns[Math.floor(Math.random() * campaigns.length)];
    setNotification({
      id: counter,
      name: randomName(),
      amount: randomAmount(),
      campaign,
      minutesAgo: randomMinutesAgo(),
      visible: true,
    });
    setCounter((c) => c + 1);

    // Auto-hide after 5s
    setTimeout(() => {
      setNotification((n) => (n ? { ...n, visible: false } : null));
    }, 5000);
  }, [campaigns, counter]);

  useEffect(() => {
    if (campaigns.length === 0) return;
    // First notification after 8-15 seconds
    const firstDelay = 8000 + Math.random() * 7000;
    const firstTimer = setTimeout(showNotification, firstDelay);

    // Then every 20-45 seconds
    const interval = setInterval(() => {
      showNotification();
    }, 20000 + Math.random() * 25000);

    return () => {
      clearTimeout(firstTimer);
      clearInterval(interval);
    };
  }, [campaigns, showNotification]);

  if (!notification) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 max-w-sm transition-all duration-500 ${
        notification.visible
          ? "opacity-100 translate-y-0 translate-x-0"
          : "opacity-0 translate-y-4 -translate-x-4"
      }`}
    >
      <div className="bg-card border rounded-xl shadow-2xl p-4 flex items-start gap-3">
        <div className="p-2 rounded-full bg-primary/10 shrink-0">
          <Heart className="w-4 h-4 text-primary fill-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug">
            <span className="font-bold">{notification.name}</span> doou{" "}
            <span className="text-primary font-bold">{formatCurrency(notification.amount)}</span>
          </p>
          <Link
            to={`/c/${notification.campaign.id}`}
            className="text-xs text-primary hover:underline line-clamp-1 mt-0.5 block"
          >
            {notification.campaign.titulo}
          </Link>
          <p className="text-[10px] text-muted-foreground mt-1">
            há {notification.minutesAgo} minutos
          </p>
        </div>
        <button
          onClick={() => setNotification((n) => (n ? { ...n, visible: false } : null))}
          className="p-1 rounded-full hover:bg-muted transition-colors shrink-0"
        >
          <X className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
