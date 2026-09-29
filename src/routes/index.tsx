import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Renda Digital IA — sua direção para criar renda extra online" },
      {
        name: "description",
        content:
          "Plataforma exclusiva para clientes: transforme seu perfil em um plano de marketing digital com estratégia, conteúdo, oferta e acompanhamento.",
      },
      { property: "og:title", content: "Renda Digital IA" },
      {
        property: "og:description",
        content: "Objetivo, estratégia, ações e progresso em um só lugar. Menos informação, mais ação.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate({ to: "/dashboard", replace: true });
        return;
      }
      setChecking(false);
    });
  }, [navigate]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-[11px] font-semibold text-primary-foreground">
            RD
          </span>
          <span className="text-sm font-semibold tracking-tight">Renda Digital IA</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/login" })}>
          Entrar
        </Button>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-16">
        <p className="eyebrow">Plataforma exclusiva para clientes</p>
        <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
          Seu assistente pessoal de marketing digital.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
          Responda algumas perguntas e receba uma direção clara: estratégia, ações do dia, conteúdo,
          oferta e acompanhamento do seu progresso.
        </p>
        <div className="mt-8">
          <Button size="lg" className="gap-2" onClick={() => navigate({ to: "/login" })}>
            Acessar minha conta
            <ArrowRight className="size-4" />
          </Button>
        </div>

        <dl className="mt-16 grid gap-6 border-t border-border pt-10 sm:grid-cols-3">
          {[
            ["Direção", "Um plano em etapas feito a partir do seu perfil."],
            ["Execução", "Tarefas curtas para avançar todos os dias."],
            ["Progresso", "Acompanhe metas, conteúdos e conversas."],
          ].map(([title, text]) => (
            <div key={title}>
              <dt className="text-sm font-medium">{title}</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{text}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
