import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { errorMessage } from "@/components/ai-ui";
import { AiLoadingState, EmptyState, LoadingState, PageHeader } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { generateFirstSale } from "@/lib/ai.functions";
import { useInvalidate } from "@/lib/app-data";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/primeira-venda")({
  head: () => pageHead("Minha Primeira Venda", "Um roteiro dia a dia para buscar sua primeira venda."),
  component: FirstSalePage,
});

type Day = { day: number; title: string; description: string; done: boolean };

function FirstSalePage() {
  const invalidate = useInvalidate();
  const run = useServerFn(generateFirstSale);
  const [busy, setBusy] = useState(false);
  const { data: plan, isLoading } = useQuery({
    queryKey: ["first_sale"],
    queryFn: async () => {
      const { data, error } = await supabase.from("first_sale_plans").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  async function create(duration: 7 | 14 | 30) {
    setBusy(true);
    try {
      await run({ data: { duration } });
      invalidate(["first_sale", "activity"]);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function toggle(idx: number, v: boolean) {
    if (!plan) return;
    const days = [...((plan.tasks as Day[]) ?? [])];
    days[idx] = { ...days[idx]!, done: v };
    const progress = Math.round((days.filter((d) => d.done).length / days.length) * 100);
    await supabase.from("first_sale_plans").update({ tasks: days as unknown as Json, progress }).eq("id", plan.id);
    invalidate(["first_sale"]);
  }

  const days = (plan?.tasks as Day[] | undefined) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Minha Primeira Venda" title="Seu roteiro" description="Escolha a duração. A IA monta as ações de cada dia." />
      <div className="flex flex-wrap gap-2">
        {([7, 14, 30] as const).map((d) => (
          <Button key={d} variant="outline" disabled={busy} onClick={() => create(d)}>
            {d} dias
          </Button>
        ))}
      </div>
      {busy ? (
        <AiLoadingState />
      ) : isLoading ? (
        <LoadingState />
      ) : !plan ? (
        <EmptyState title="Nenhum roteiro ainda" description="Escolha 7, 14 ou 30 dias para começar." />
      ) : (
        <>
          <div className="panel p-5">
            <p className="text-sm text-muted-foreground">{plan.strategy}</p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className="h-full bg-primary transition-all" style={{ width: `${plan.progress}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{plan.duration} dias · {plan.progress}% concluído</p>
          </div>
          <ul className="panel divide-y divide-border">
            {days.map((d, i) => (
              <li key={i} className="flex items-start gap-3 px-4 py-3">
                <Checkbox className="mt-0.5" checked={d.done} onCheckedChange={(v) => toggle(i, v === true)} />
                <div>
                  <p className={`text-sm font-medium ${d.done ? "text-muted-foreground line-through" : ""}`}>
                    Dia {d.day} · {d.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{d.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
