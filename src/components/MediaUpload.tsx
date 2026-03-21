import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon, Film, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface MediaUploadProps {
  value: string;
  onChange: (url: string) => void;
  accept: "image" | "video";
  label: string;
}

export function MediaUpload({ value, onChange, accept, label }: MediaUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptStr = accept === "image"
    ? "image/jpeg,image/png,image/webp,image/gif"
    : "video/mp4,video/webm,video/quicktime";

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = accept === "image" ? 10 * 1024 * 1024 : 100 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`Arquivo muito grande. Máximo: ${accept === "image" ? "10MB" : "100MB"}`);
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const path = `${accept}s/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from("campaign-media")
      .upload(path, file, { upsert: true });

    if (error) {
      toast.error("Erro ao fazer upload");
      console.error(error);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("campaign-media")
      .getPublicUrl(path);

    onChange(urlData.publicUrl);
    setUploading(false);
    toast.success("Upload concluído!");
  };

  const handleRemove = () => {
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const Icon = accept === "image" ? ImageIcon : Film;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      
      {value ? (
        <div className="relative rounded-lg border border-border overflow-hidden bg-muted">
          {accept === "image" ? (
            <img src={value} alt="Preview" className="w-full h-48 object-cover" />
          ) : (
            <video src={value} controls className="w-full h-48 object-cover rounded-lg" />
          )}
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-foreground/80 text-background hover:bg-foreground transition-colors"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          type="button"
          className="w-full h-48 rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-muted/50 hover:bg-muted transition-colors flex flex-col items-center justify-center gap-3 group"
        >
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="text-sm text-muted-foreground">Enviando...</span>
            </>
          ) : (
            <>
              <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Clique para enviar</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {accept === "image" ? "JPG, PNG, WebP (max 10MB)" : "MP4, WebM (max 100MB)"}
                </p>
              </div>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={acceptStr}
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}
