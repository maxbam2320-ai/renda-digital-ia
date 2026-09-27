import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { errorMessage } from "@/components/ai-ui";
import { AiLoadingState, EmptyState, LoadingState, PageHeader } from "@/components/states";
import { TaskRow } from "@/components/task-row";
import { Button } from "@/components/ui/button";
import { generatePlan } from "@/lib/ai.functions";
import { useInvalidate, usePlan, useTasks } from "@/lib/app-data";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/plano")({
  head: () => pageHead("Meu Plano", "Seu caminho em 6 etapas, da direção à otimização."),
  component: PlanPage,
});

const STAGES = ["Direção", "Oferta", "Conteúdo", "Divulgação", "Vendas", "Otimização"];

function PlanPage() {
  const { data: plan, isLoading } = usePlan();
  const { data: tasks = [] } = useTasks();
  const invalidate = useInvalidate();
  const run = useServerFn(generatePlan);
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    try {
      await run();
      invalidate(["plan", "tasks", "activity"]);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) return <LoadingState />;
  const planTasks = tasks.filter((t) => t.source === "plano");
  const done = planTasks.filter((t) => t.status === "concluida").length;
  const pct = planTasks.length ? Math.round((done / planTasks.length) * 100) : 0;
  const summaries = ((plan?.strategy as { stages?: { stage: number; summary: string }[] } | null)?.stages ?? []);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Meu Plano"
        title={plan?.title ?? "Seu caminho em 6 etapas"}
        description={plan?.description ?? "A IA cria um plano sob medida para o seu perfil."}
        action={
          <Button onClick={create} disabled={busy} variant={plan ? "outline" : "default"}>
            {plan ? "Gerar novo plano" : "Criar meu plano"}
          </Button>
        }
      />
      {busy ? (
        <AiLoadingState />
      ) : !plan ? (
        <EmptyState title="Nenhum plano ainda" action={<Button onClick={create}>Criar meu plano</Button>} />
      ) : (
        <>
          <div className="panel p-5">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Progresso</span>
              <span className="text-muted-foreground">{done}/{planTasks.length} · {pct}%</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
          {STAGES.map((name, i) => {
            const stageTasks = planTasks.filter((t) => t.stage === i + 1);
            const complete = stageTasks.length > 0 && stageTasks.every((t) => t.status === "concluida");
            return (
              <section key={name} className="space-y-2">
                <div className="flex items-baseline gap-3">
                  <span className={`font-mono text-xs ${complete ? "text-primary" : "text-muted-foreground"}`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2 className="text-sm font-semibold">{name}</h2>
                </div>
                {summaries.find((s) => s.stage === i + 1)?.summary ? (
                  <p className="text-sm text-muted-foreground">{summaries.find((s) => s.stage === i + 1)?.summary}</p>
                ) : null}
                <ul className="panel divide-y divide-border">
                  {stageTasks.map((t) => <TaskRow key={t.id} task={t} />)}
                </ul>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
