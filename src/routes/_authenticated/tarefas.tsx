import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { EmptyState, LoadingState, PageHeader } from "@/components/states";
import { TaskRow } from "@/components/task-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId, useInvalidate, useTasks } from "@/lib/app-data";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/tarefas")({
  head: () => pageHead("Tarefas", "Todas as suas tarefas em um só lugar."),
  component: TasksPage,
});

function TasksPage() {
  const { data: tasks = [], isLoading } = useTasks();
  const invalidate = useInvalidate();
  const [title, setTitle] = useState("");
  const [filter, setFilter] = useState<"pendente" | "concluida">("pendente");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const user_id = await currentUserId();
    await supabase.from("tasks").insert({ user_id, title: title.trim(), source: "manual" });
    setTitle("");
    invalidate(["tasks"]);
  }

  const list = tasks.filter((t) => (filter === "concluida" ? t.status === "concluida" : t.status !== "concluida"));

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Tarefas" title="O que fazer" description="Tarefas do seu plano e as que você criar." />
      <form onSubmit={add} className="flex gap-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nova tarefa..." maxLength={200} />
        <Button type="submit">Adicionar</Button>
      </form>
      <div className="flex gap-2">
        {(["pendente", "concluida"] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
            {f === "pendente" ? "Pendentes" : "Concluídas"}
          </Button>
        ))}
      </div>
      {isLoading ? (
        <LoadingState />
      ) : list.length === 0 ? (
        <EmptyState title="Nenhuma tarefa aqui" />
      ) : (
        <ul className="panel divide-y divide-border">
          {list.map((t) => <TaskRow key={t.id} task={t} onDelete />)}
        </ul>
      )}
    </div>
  );
}
