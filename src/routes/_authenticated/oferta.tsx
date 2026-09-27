import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { errorMessage, Field, ResultBlock } from "@/components/ai-ui";
import { AiLoadingState, PageHeader } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { generateOffer } from "@/lib/ai.functions";
import { useInvalidate } from "@/lib/app-data";
import { relativeDate } from "@/lib/format";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/oferta")({
  head: () => pageHead("Oferta IA", "Estruture uma oferta clara, com benefícios, objeções e CTA."),
  component: OfferPage,
});

type Offer = {
  name?: string;
  value_proposition?: string;
  benefits?: string[];
  differential?: string;
  objections?: { objection: string; answer: string }[];
  cta?: string;
  pitch?: string;
};

const FIELDS = [
  ["product", "Produto"],
  ["audience", "Público"],
  ["problem", "Problema que resolve"],
  ["benefit", "Principal benefício"],
  ["price", "Preço"],
  ["differential", "Diferencial"],
] as const;

function OfferPage() {
  const invalidate = useInvalidate();
  const run = useServerFn(generateOffer);
  const [form, setForm] = useState({ product: "", audience: "", problem: "", benefit: "", price: "", differential: "" });
  const [busy, setBusy] = useState(false);
  const [r, setR] = useState<Offer | null>(null);
  const { data: history = [] } = useQuery({
    queryKey: ["generated_offers"],
    queryFn: async () => (await supabase.from("generated_offers").select("*").order("created_at", { ascending: false }).limit(10)).data ?? [],
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const row = await run({ data: form });
      setR((row?.result as Offer) ?? null);
      invalidate(["generated_offers", "activity"]);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Oferta IA" title="Criar oferta" description="Transforme seu produto em uma oferta fácil de entender." />
      <form onSubmit={submit} className="panel grid gap-4 p-5 sm:grid-cols-2">
        {FIELDS.map(([k, label]) => (
          <Field key={k} label={label}>
            <Input required={k !== "differential"} value={form[k]} maxLength={400} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
          </Field>
        ))}
        <Button type="submit" disabled={busy} className="sm:col-span-2">Gerar oferta</Button>
      </form>
      {busy ? <AiLoadingState label="Estruturando sua oferta..." /> : null}
      {r && !busy ? (
        <div className="space-y-3">
          {r.name ? <ResultBlock label="Nome da oferta" text={r.name} /> : null}
          {r.value_proposition ? <ResultBlock label="Proposta de valor" text={r.value_proposition} /> : null}
          {r.benefits?.length ? <ResultBlock label="Benefícios" text={r.benefits.map((b) => `• ${b}`).join("\n")} /> : null}
          {r.differential ? <ResultBlock label="Diferencial" text={r.differential} /> : null}
          {r.objections?.length ? (
            <ResultBlock label="Objeções e respostas" text={r.objections.map((o) => `${o.objection}\n→ ${o.answer}`).join("\n\n")} />
          ) : null}
          {r.cta ? <ResultBlock label="CTA" text={r.cta} /> : null}
          {r.pitch ? <ResultBlock label="Texto de apresentação" text={r.pitch} /> : null}
        </div>
      ) : null}
      {history.length ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Histórico</h2>
          <ul className="panel divide-y divide-border">
            {history.map((h) => (
              <li key={h.id}>
                <button className="flex w-full justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-secondary/50" onClick={() => setR(h.result as Offer)}>
                  <span className="truncate">{(h.result as Offer)?.name ?? h.product}</span>
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
