import { Trash2 } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { logActivity, useInvalidate, type Task } from "@/lib/app-data";

export function TaskRow({ task, onDelete }: { task: Task; onDelete?: boolean }) {
  const invalidate = useInvalidate();
  const done = task.status === "concluida";
  async function toggle(v: boolean) {
    await supabase
      .from("tasks")
      .update({ status: v ? "concluida" : "pendente", completed_at: v ? new Date().toISOString() : null })
      .eq("id", task.id);
    if (v) await logActivity("tarefa", `Tarefa concluída: ${task.title}`);
    invalidate(["tasks", "activity"]);
  }
  async function remove() {
    await supabase.from("tasks").delete().eq("id", task.id);
    invalidate(["tasks"]);
  }
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <Checkbox className="mt-0.5" checked={done} onCheckedChange={(v) => toggle(v === true)} />
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${done ? "text-muted-foreground line-through" : ""}`}>{task.title}</p>
        {task.description ? <p className="text-xs text-muted-foreground">{task.description}</p> : null}
        <p className="mt-1 text-[11px] text-muted-foreground">
          {[task.estimated_time, task.priority && `prioridade ${task.priority}`].filter(Boolean).join(" · ")}
        </p>
      </div>
      {onDelete ? (
        <Button variant="ghost" size="icon" aria-label="Excluir tarefa" onClick={remove}>
          <Trash2 className="size-4" />
        </Button>
      ) : null}
    </li>
  );
}
