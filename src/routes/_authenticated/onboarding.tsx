import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/states";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId, logActivity, useInvalidate, useOnboarding } from "@/lib/app-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Onboarding — Renda Digital IA" },
      { name: "description", content: "Responda algumas perguntas para receber seu plano personalizado." },
      { property: "og:title", content: "Onboarding — Renda Digital IA" },
      { property: "og:description", content: "Configure seu perfil e receba sua direção." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OnboardingPage,
});

const GOALS = [
  "Criar renda extra",
  "Fazer minha primeira venda",
  "Começar no marketing digital",
  "Aumentar minhas vendas",
  "Criar um negócio digital",
];
const TIMES = ["Menos de 30 minutos", "30 minutos", "1 hora", "2 horas", "3 horas ou mais"];
const LEVELS = ["Iniciante", "Já estudei", "Já fiz algumas vendas", "Já trabalho com marketing digital"];
const PRODUCTS = ["Produto digital", "Produto físico", "Serviço", "Afiliado", "Ainda não sei"];
const NICHES = ["Emagrecimento", "Finanças", "Relacionamento", "Beleza", "Educação", "Pets", "Espiritualidade"];
const CHANNELS = ["Instagram", "TikTok", "Pinterest", "WhatsApp", "YouTube", "Site"];

function Option({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors",
        selected
          ? "border-primary bg-accent text-accent-foreground"
          : "border-border bg-card hover:bg-secondary",
      )}
    >
      {label}
    </button>
  );
}

function OnboardingPage() {
  const navigate = useNavigate();
  const invalidate = useInvalidate();
  const { data: onboarding, isLoading } = useOnboarding();

  const [step, setStep] = useState(0);
  const [mainGoal, setMainGoal] = useState("");
  const [time, setTime] = useState("");
  const [level, setLevel] = useState("");
  const [product, setProduct] = useState("");
  const [niche, setNiche] = useState("");
  const [channels, setChannels] = useState<string[]>([]);
  const [monthlyGoal, setMonthlyGoal] = useState("1000");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (onboarding?.completed) navigate({ to: "/dashboard", replace: true });
  }, [onboarding, navigate]);

  if (isLoading) return <LoadingState />;

  const steps = [
    {
      title: "Qual é seu objetivo?",
      valid: !!mainGoal,
      body: (
        <div className="space-y-2">
          {GOALS.map((g) => (
            <Option key={g} label={g} selected={mainGoal === g} onClick={() => setMainGoal(g)} />
          ))}
        </div>
      ),
    },
    {
      title: "Quanto tempo você possui por dia?",
      valid: !!time,
      body: (
        <div className="space-y-2">
          {TIMES.map((t) => (
            <Option key={t} label={t} selected={time === t} onClick={() => setTime(t)} />
          ))}
        </div>
      ),
    },
    {
      title: "Qual seu nível?",
      valid: !!level,
      body: (
        <div className="space-y-2">
          {LEVELS.map((l) => (
            <Option key={l} label={l} selected={level === l} onClick={() => setLevel(l)} />
          ))}
        </div>
      ),
    },
    {
      title: "O que você deseja vender?",
      valid: !!product,
      body: (
        <div className="space-y-2">
          {PRODUCTS.map((p) => (
            <Option key={p} label={p} selected={product === p} onClick={() => setProduct(p)} />
          ))}
        </div>
      ),
    },
    {
      title: "Qual seu nicho?",
      valid: niche.trim().length > 1,
      body: (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {NICHES.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setNiche(n)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                  niche === n ? "border-primary bg-accent text-accent-foreground" : "border-border",
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <Input
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="Ou escreva seu nicho"
          />
        </div>
      ),
    },
    {
      title: "Onde deseja divulgar?",
      valid: channels.length > 0,
      body: (
        <div className="space-y-2">
          {CHANNELS.map((c) => (
            <Option
              key={c}
              label={c}
              selected={channels.includes(c)}
              onClick={() =>
                setChannels((prev) =>
                  prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
                )
              }
            />
          ))}
        </div>
      ),
    },
    {
      title: "Qual sua meta mensal?",
      valid: Number(monthlyGoal) > 0,
      body: (
        <div className="space-y-2">
          <Input
            type="number"
            min={0}
            value={monthlyGoal}
            onChange={(e) => setMonthlyGoal(e.target.value)}
            placeholder="1000"
          />
          <p className="text-xs text-muted-foreground">
            Uma meta é uma direção de trabalho, não uma promessa de resultado.
          </p>
        </div>
      ),
    },
  ];

  const current = steps[step]!;

  async function finish() {
    setSaving(true);
    setError(null);
    try {
      const userId = await currentUserId();
      const { error: upsertError } = await supabase.from("onboarding").upsert(
        {
          user_id: userId,
          main_goal: mainGoal,
          available_time: time,
          experience_level: level,
          niche,
          product_status: product,
          preferred_channels: channels,
          monthly_goal: Number(monthlyGoal),
          completed: true,
        },
        { onConflict: "user_id" },
      );
      if (upsertError) throw upsertError;

      await supabase.from("goals").insert({
        user_id: userId,
        title: "Meta de renda mensal",
        goal_type: "renda",
        target: Number(monthlyGoal),
        current: 0,
      });
      await logActivity("onboarding", "Perfil configurado e meta definida");
      invalidate(["onboarding", "goals", "activity"]);
      navigate({ to: "/dashboard", replace: true });
    } catch {
      setError("Não conseguimos concluir esta ação. Tente novamente.");
      setSaving(false);
    }
  }

  if (saving) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <Loader2 className="size-5 animate-spin text-primary" />
        <p className="text-sm font-medium">Analisando seu perfil...</p>
        <p className="text-xs text-muted-foreground">Preparando seu plano personalizado.</p>
      </div>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-5 py-12">
      <div className="mb-8">
        <p className="eyebrow">
          Passo {step + 1} de {steps.length}
        </p>
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight">{current.title}</h1>
      <div className="mt-6">{current.body}</div>

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

      <div className="mt-8 flex items-center gap-3">
        {step > 0 ? (
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
            Voltar
          </Button>
        ) : null}
        <Button
          className="flex-1"
          disabled={!current.valid}
          onClick={() => (step === steps.length - 1 ? finish() : setStep((s) => s + 1))}
        >
          {step === steps.length - 1 ? "Concluir" : "Continuar"}
        </Button>
      </div>
    </main>
  );
}
