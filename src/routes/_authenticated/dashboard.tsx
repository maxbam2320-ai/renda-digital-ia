import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState, LoadingState } from "@/components/states";
import { supabase } from "@/integrations/supabase/client";
import {
  useActivity,
  useGoals,
  useInvalidate,
  useOnboarding,
  useProfile,
  useTasks,
} from "@/lib/app-data";
import { brl, firstName, initials, relativeDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Início — Renda Digital IA" },
      { name: "description", content: "Sua meta, sua próxima ação e as tarefas de hoje." },
      { property: "og:title", content: "Início — Renda Digital IA" },
      { property: "og:description", content: "Acompanhe seu progresso e execute a próxima ação." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const invalidate = useInvalidate();
  const { data: profile, isLoading: loadingProfile } = useProfile();
  const { data: onboarding, isLoading: loadingOnboarding } = useOnboarding();
  const { data: tasks = [] } = useTasks();
  const { data: goals = [] } = useGoals();
  const { data: activity = [] } = useActivity(6);

  useEffect(() => {
    if (!loadingOnboarding && !onboarding?.completed) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [loadingOnboarding, onboarding, navigate]);

  if (loadingProfile || loadingOnboarding) return <LoadingState />;

  const incomeGoal = goals.find((g) => g.goal_type === "renda");
  const target = Number(incomeGoal?.target ?? onboarding?.monthly_goal ?? 0);
  const currentValue = Number(incomeGoal?.current ?? 0);
  const percent = target > 0 ? Math.min(100, Math.round((currentValue / target) * 100)) : 0;
  const pending = tasks.filter((t) => t.status !== "concluida");
  const nextTask = pending[0];

  async function toggle(id: string, done: boolean) {
    await supabase
      .from("tasks")
      .update({
        status: done ? "concluida" : "pendente",
        completed_at: done ? new Date().toISOString() : null,
      })
      .eq("id", id);
    invalidate(["tasks"]);
  }

  return (
    <div className="space-y-10">
      <header className="flex items-center gap-4">
        <Avatar className="size-11">
          {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt="" /> : null}
          <AvatarFallback>{initials(profile?.full_name, profile?.email)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Olá, {firstName(profile?.full_name, profile?.email)} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            {onboarding?.main_goal ?? "Vamos avançar hoje."}
          </p>
        </div>
      </header>

      <section className="panel p-5">
        <p className="eyebrow">Minha meta</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight">{brl(target)}/mês</p>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {brl(currentValue)} registrados · {percent}% da meta
        </p>
      </section>

      <section className="panel p-5">
        <p className="eyebrow">Próxima ação</p>
        {nextTask ? (
          <>
            <p className="mt-2 text-lg font-medium">{nextTask.title}</p>
            {nextTask.description ? (
              <p className="mt-1 text-sm text-muted-foreground">{nextTask.description}</p>
            ) : null}
            <Button className="mt-4" onClick={() => navigate({ to: "/plano" })}>
              Começar
            </Button>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Você ainda não possui tarefas. Elas aparecerão aqui assim que seu plano for criado.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Tarefas de hoje</h2>
        {pending.length === 0 ? (
          <EmptyState
            title="Nenhuma tarefa pendente"
            description="Você ainda não possui nenhuma atividade. Comece criando seu primeiro plano."
          />
        ) : (
          <ul className="panel divide-y divide-border">
            {pending.slice(0, 5).map((task) => (
              <li key={task.id} className="flex items-start gap-3 px-4 py-3">
                <Checkbox
                  className="mt-0.5"
                  checked={task.status === "concluida"}
                  onCheckedChange={(v) => toggle(task.id, v === true)}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{task.title}</p>
                  {task.estimated_time ? (
                    <p className="text-xs text-muted-foreground">{task.estimated_time}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Atividade recente</h2>
        {activity.length === 0 ? (
          <EmptyState
            title="Sem atividades ainda"
            description="Suas ações na plataforma aparecerão aqui."
          />
        ) : (
          <ul className="panel divide-y divide-border">
            {activity.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <p className="text-sm">{item.description}</p>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {relativeDate(item.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
