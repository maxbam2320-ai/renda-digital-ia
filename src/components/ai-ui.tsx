import { Check, Copy } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        toast.success("Copiado");
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? <Check className="size-4" /> : <Copy className="size-4" />}
      Copiar
    </Button>
  );
}

export function ResultBlock({ label, text, children }: { label: string; text?: string; children?: ReactNode }) {
  return (
    <div className="panel p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="eyebrow">{label}</p>
        {text ? <CopyButton text={text} /> : null}
      </div>
      {children ?? <p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p>}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export function errorMessage(e: unknown) {
  return e instanceof Error && e.message ? e.message : "Não conseguimos concluir esta ação. Tente novamente.";
}
