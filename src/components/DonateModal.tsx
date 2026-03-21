import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/format";
import { Copy, Check, QrCode, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DonateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  campaignTitle: string;
}

type Step = "amount" | "loading" | "qrcode" | "error";

export function DonateModal({ open, onOpenChange, campaignId, campaignTitle }: DonateModalProps) {
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [pixCode, setPixCode] = useState("");
  const [copied, setCopied] = useState(false);

  const presets = [1000, 2500, 5000, 10000]; // in cents

  const handleDonate = async () => {
    const valueInCents = Math.round(parseFloat(amount.replace(",", ".")) * 100);
    if (isNaN(valueInCents) || valueInCents < 100) {
      toast.error("Valor mínimo de R$ 1,00");
      return;
    }

    setStep("loading");

    try {
      const { data, error } = await supabase.functions.invoke("donate", {
        body: { campaign_id: campaignId, valor: valueInCents },
      });

      if (error) throw error;

      setQrCode(data.qr_code || "");
      setPixCode(data.pix_code || "");
      setStep("qrcode");
    } catch (err) {
      console.error(err);
      setStep("error");
      toast.error("Erro ao gerar cobrança. Tente novamente.");
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(pixCode);
    setCopied(true);
    toast.success("Código Pix copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setStep("amount");
      setAmount("");
      setQrCode("");
      setPixCode("");
      setCopied(false);
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {step === "qrcode" ? "Escaneie o QR Code" : `Doar para "${campaignTitle}"`}
          </DialogTitle>
        </DialogHeader>

        {step === "amount" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-2">
              {presets.map((v) => (
                <button
                  key={v}
                  onClick={() => setAmount((v / 100).toFixed(2).replace(".", ","))}
                  className="rounded-lg border-2 border-border py-3 text-sm font-semibold hover:border-primary hover:bg-accent transition-colors active:scale-[0.97]"
                >
                  {formatCurrency(v)}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Outro valor</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                <Input
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-10 text-lg"
                />
              </div>
            </div>
            <Button onClick={handleDonate} className="w-full h-12 text-base" size="lg">
              <QrCode className="w-5 h-5 mr-2" />
              Gerar Pix
            </Button>
          </div>
        )}

        {step === "loading" && (
          <div className="flex flex-col items-center py-12 gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground">Gerando cobrança...</p>
          </div>
        )}

        {step === "qrcode" && (
          <div className="space-y-5">
            {qrCode && (
              <div className="flex justify-center">
                <img src={qrCode} alt="QR Code Pix" className="w-52 h-52 rounded-lg" />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Pix Copia e Cola</label>
              <div className="flex gap-2">
                <Input value={pixCode} readOnly className="text-xs font-mono" />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Após o pagamento, a doação será confirmada automaticamente.
            </p>
          </div>
        )}

        {step === "error" && (
          <div className="text-center py-8 space-y-4">
            <p className="text-muted-foreground">Algo deu errado ao gerar a cobrança.</p>
            <Button variant="outline" onClick={() => setStep("amount")}>
              Tentar novamente
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
