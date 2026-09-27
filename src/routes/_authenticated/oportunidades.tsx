import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { errorMessage } from "@/components/ai-ui";
import { AiLoadingState, EmptyState, LoadingState, PageHeader } from "@/components/states";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { generateOpportunities } from "@/lib/ai.functions";
import { useInvalidate } from "@/lib/app-data";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/oportunidades")({
  head: () => pageHead("Ideias de Renda", "Oportunidades de renda compatíveis com o seu perfil."),
  component: OppPage,
});

function OppPage() {
  const invalidate = useInvalidate();
  const run = useServerFn(generateOpportunities);
  const [busy, setBusy] = useState(false);
  const { data = [], isLoading } = useQuery({
    queryKey: ["opportunities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("opportunities").select("*").order("created_at", { ascending: false }).limit(12);
      if (error) throw error;
      return data;
    },
  });

  async function create() {
    setBusy(true);
    try {
      await run();
      invalidate(["opportunities", "activity"]);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ideias de Renda IA"
        title="Oportunidades para você"
        description="Sugestões baseadas no seu tempo, nível, nicho e objetivo. Resultados dependem da sua execução."
        action={<Button onClick={create} disabled={busy}>Gerar ideias</Button>}
      />
      {busy ? <AiLoadingState label="Analisando oportunidades..." /> : null}
      {isLoading ? (
        <LoadingState />
      ) : data.length === 0 && !busy ? (
        <EmptyState title="Nenhuma ideia ainda" action={<Button onClick={create}>Gerar ideias</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((o) => (
            <article key={o.id} className="panel space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-semibold">{o.title}</h2>
                {o.difficulty ? <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[11px]">{o.difficulty}</span> : null}
              </div>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{o.description}</p>
              {o.requirements ? <p className="text-sm"><span className="font-medium">O que precisa: </span>{o.requirements}</p> : null}
              {o.strategy ? <p className="text-sm"><span className="font-medium">Como começar: </span>{o.strategy}</p> : null}
              <ol className="list-decimal space-y-1 pl-5 text-sm">
                {((o.first_steps as string[]) ?? []).map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
