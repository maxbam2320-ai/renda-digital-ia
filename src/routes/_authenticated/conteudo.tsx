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
import { generateContent } from "@/lib/ai.functions";
import { useInvalidate, useOnboarding } from "@/lib/app-data";
import { relativeDate } from "@/lib/format";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/conteudo")({
  head: () => pageHead("Conteúdo IA", "Crie hook, roteiro, legenda, CTA e hashtags em segundos."),
  component: ContentPage,
});

const PLATFORMS = ["Instagram", "TikTok", "Pinterest", "YouTube", "WhatsApp"];
const LABELS: Record<string, string> = { hook: "Hook", script: "Roteiro", caption: "Legenda", cta: "CTA", hashtags: "Hashtags", visual: "Ideia visual" };

function ContentPage() {
  const { data: onb } = useOnboarding();
  const invalidate = useInvalidate();
  const run = useServerFn(generateContent);
  const [form, setForm] = useState({ product: "", niche: "", audience: "", platform: "Instagram", goal: "" });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Record<string, string> | null>(null);
  const { data: history = [] } = useQuery({
    queryKey: ["generated_content"],
    queryFn: async () => (await supabase.from("generated_content").select("*").order("created_at", { ascending: false }).limit(10)).data ?? [],
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const row = await run({ data: { ...form, niche: form.niche || onb?.niche || "" } });
      setResult((row?.result as Record<string, string>) ?? null);
      invalidate(["generated_content", "activity"]);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Conteúdo IA" title="Criar conteúdo" description="Preencha o essencial e receba um conteúdo pronto para postar." />
      <form onSubmit={submit} className="panel grid gap-4 p-5 sm:grid-cols-2">
        <Field label="Produto"><Input required value={form.product} onChange={set("product")} maxLength={300} /></Field>
        <Field label="Nicho"><Input value={form.niche} onChange={set("niche")} placeholder={onb?.niche ?? ""} maxLength={200} /></Field>
        <Field label="Público"><Input required value={form.audience} onChange={set("audience")} maxLength={300} /></Field>
        <Field label="Objetivo"><Input required value={form.goal} onChange={set("goal")} placeholder="Ex.: gerar interesse" maxLength={300} /></Field>
        <div className="sm:col-span-2">
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Plataforma</p>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <Button key={p} type="button" size="sm" variant={form.platform === p ? "default" : "outline"} onClick={() => setForm({ ...form, platform: p })}>{p}</Button>
            ))}
          </div>
        </div>
        <Button type="submit" disabled={busy} className="sm:col-span-2">Gerar conteúdo</Button>
      </form>
      {busy ? <AiLoadingState label="Criando seu conteúdo..." /> : null}
      {result && !busy ? (
        <div className="space-y-3">
          {Object.keys(LABELS).map((k) => (result[k] ? <ResultBlock key={k} label={LABELS[k]!} text={String(result[k])} /> : null))}
        </div>
      ) : null}
      {history.length ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Histórico</h2>
          <ul className="panel divide-y divide-border">
            {history.map((h) => (
              <li key={h.id}>
                <button className="flex w-full justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-secondary/50" onClick={() => setResult(h.result as Record<string, string>)}>
                  <span className="truncate">{h.platform} · {h.topic}</span>
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
