import { createFileRoute } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Field } from "@/components/ai-ui";
import { EmptyState, LoadingState, PageHeader } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId, useGoals, useInvalidate, useTasks, type Goal } from "@/lib/app-data";
import { brl } from "@/lib/format";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/metas")({
  head: () => pageHead("Minhas Metas", "Acompanhe renda, conteúdos, leads, vendas e mais."),
  component: GoalsPage,
});

const TYPES: Record<string, string> = {
  renda: "Renda (R$)",
  conteudos: "Conteúdos",
  leads: "Leads",
  contatos: "Contatos",
  ofertas: "Ofertas",
  vendas: "Vendas",
};

function GoalsPage() {
  const { data: goals = [], isLoading } = useGoals();
  const { data: tasks = [] } = useTasks();
  const invalidate = useInvalidate();
  const [type, setType] = useState("vendas");
  const [target, setTarget] = useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(target);
    if (!n || n <= 0) return;
    const user_id = await currentUserId();
    await supabase.from("goals").insert({ user_id, goal_type: type, title: TYPES[type]!, target: n, current: 0 });
    setTarget("");
    invalidate(["goals"]);
  }
  async function change(g: Goal, value: number) {
    await supabase.from("goals").update({ current: Math.max(0, value) }).eq("id", g.id);
    invalidate(["goals"]);
  }
  async function remove(g: Goal) {
    await supabase.from("goals").delete().eq("id", g.id);
    invalidate(["goals"]);
  }

  const doneTasks = tasks.filter((t) => t.status === "concluida").length;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Minhas Metas" title="Progresso" description="Atualize seus números conforme avança." />
      <div className="panel p-5">
        <p className="eyebrow">Tarefas</p>
        <p className="mt-1 text-2xl font-semibold">{doneTasks}/{tasks.length}</p>
        <Bar pct={tasks.length ? (doneTasks / tasks.length) * 100 : 0} />
      </div>
      {isLoading ? (
        <LoadingState />
      ) : goals.length === 0 ? (
        <EmptyState title="Nenhuma meta ainda" description="Crie sua primeira meta abaixo." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {goals.map((g) => {
            const isMoney = g.goal_type === "renda";
            const cur = Number(g.current);
            const tgt = Number(g.target);
            const step = 1;
            return (
              <div key={g.id} className="panel space-y-3 p-5">
                <div className="flex items-start justify-between">
                  <p className="eyebrow">{g.title}</p>
                  <Button variant="ghost" size="icon" aria-label="Excluir meta" onClick={() => remove(g)}><Trash2 className="size-4" /></Button>
                </div>
                <p className="text-2xl font-semibold">
                  {isMoney ? brl(cur) : cur} <span className="text-sm text-muted-foreground">/ {isMoney ? brl(tgt) : tgt}</span>
                </p>
                <Bar pct={tgt ? (cur / tgt) * 100 : 0} />
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" aria-label="Diminuir 1" onClick={() => change(g, cur - step)}><Minus className="size-4" /></Button>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    className="text-center"
                    placeholder="Ex.: 10"
                    aria-label={isMoney ? "Valor ganho para adicionar" : "Quantidade para adicionar"}
                    data-goal-add-input={g.id}
                  />
                  <Button
                    type="button"
                    className="gap-1"
                    aria-label="Adicionar progresso"
                    onClick={() => {
                      const el = document.querySelector<HTMLInputElement>(`[data-goal-add-input="${g.id}"]`);
                      const amount = el ? Number(el.value) : 0;
                      if (!amount || amount <= 0) return;
                      change(g, cur + amount);
                      if (el) el.value = "";
                    }}
                  >
                    <Plus className="size-4" /> Adicionar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <form onSubmit={add} className="panel grid gap-4 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Tipo">
          <select value={type} onChange={(e) => setType(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
            {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Field label="Meta"><Input type="number" min={1} step={1} value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Ex.: 10000" required /></Field>
        <Button type="submit">Criar meta</Button>
      </form>
    </div>
  );
}

function Bar({ pct }: { pct: number }) {
  return (
    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
      <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, Math.round(pct))}%` }} />
    </div>
  );
}
