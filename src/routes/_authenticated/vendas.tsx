import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { errorMessage, Field, ResultBlock } from "@/components/ai-ui";
import { AiLoadingState, PageHeader } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { generateSales } from "@/lib/ai.functions";
import { useInvalidate } from "@/lib/app-data";
import { relativeDate } from "@/lib/format";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/vendas")({
  head: () => pageHead("Vendas IA", "Estratégia de atração à follow-up, com mensagens prontas."),
  component: SalesPage,
});

type Steps = { steps?: { phase: string; goal: string; message: string }[] };

function SalesPage() {
  const invalidate = useInvalidate();
  const run = useServerFn(generateSales);
  const [channel, setChannel] = useState("WhatsApp");
  const [ctx, setCtx] = useState("");
  const [busy, setBusy] = useState(false);
  const [r, setR] = useState<Steps | null>(null);
  const { data: history = [] } = useQuery({
    queryKey: ["sales_strategies"],
    queryFn: async () => (await supabase.from("sales_strategies").select("*").order("created_at", { ascending: false }).limit(10)).data ?? [],
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const row = await run({ data: { channel, context: ctx } });
      setR((row?.result as Steps) ?? null);
      invalidate(["sales_strategies", "activity"]);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Vendas IA" title="Estratégia de vendas" description="Atração → Interesse → Conversa → Oferta → Follow-up." />
      <form onSubmit={submit} className="panel space-y-4 p-5">
        <div className="flex gap-2">
          {["WhatsApp", "Instagram Direct"].map((c) => (
            <Button key={c} type="button" size="sm" variant={channel === c ? "default" : "outline"} onClick={() => setChannel(c)}>{c}</Button>
          ))}
        </div>
        <Field label="Sobre o seu produto ou oferta">
          <Textarea required value={ctx} onChange={(e) => setCtx(e.target.value)} maxLength={800} rows={3} />
        </Field>
        <Button type="submit" disabled={busy} className="w-full">Gerar estratégia</Button>
      </form>
      {busy ? <AiLoadingState /> : null}
      {r?.steps && !busy ? (
        <div className="space-y-3">
          {r.steps.map((s, i) => (
            <ResultBlock key={i} label={`${String(i + 1).padStart(2, "0")} · ${s.phase}`} text={s.message}>
              <p className="text-xs text-muted-foreground">{s.goal}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{s.message}</p>
            </ResultBlock>
          ))}
        </div>
      ) : null}
      {history.length ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Histórico</h2>
          <ul className="panel divide-y divide-border">
            {history.map((h) => (
              <li key={h.id}>
                <button className="flex w-full justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-secondary/50" onClick={() => setR(h.result as Steps)}>
                  <span className="truncate">{h.channel} · {h.context}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{relativeDate(h.created_at)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
