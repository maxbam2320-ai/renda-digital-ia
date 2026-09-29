import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar — Renda Digital IA" },
      {
        name: "description",
        content:
          "Acesse sua conta do Renda Digital IA e continue seu plano de renda extra com marketing digital.",
      },
      { property: "og:title", content: "Entrar — Renda Digital IA" },
      {
        property: "og:description",
        content: "Área exclusiva para clientes do Renda Digital IA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.92l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.73-4.95H1.26v3.1A12 12 0 0 0 12 24z"
      />
      <path fill="#FBBC05" d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.26a12 12 0 0 0 0 10.76z" />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.18 15.24 0 12 0A12 12 0 0 0 1.26 6.62l4.01 3.1C6.22 6.88 8.87 4.77 12 4.77z"
      />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
      <path d="M16.36 12.78c.02-2.3 1.88-3.4 1.96-3.45-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.83-.81-3-.79-1.55.02-2.98.9-3.78 2.28-1.61 2.79-.41 6.92 1.16 9.18.77 1.11 1.68 2.35 2.88 2.31 1.16-.05 1.6-.75 3-.75s1.79.75 3.01.72c1.24-.02 2.03-1.13 2.79-2.24.88-1.28 1.24-2.53 1.26-2.59-.03-.01-2.42-.93-2.44-3.7zM14.1 4.98c.64-.78 1.07-1.85.95-2.93-.92.04-2.03.61-2.69 1.38-.59.68-1.11 1.78-.97 2.83 1.02.08 2.07-.52 2.71-1.28z" />
    </svg>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const [pending, setPending] = useState<"google" | "apple" | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  async function signIn(provider: "google" | "apple") {
    setError(null);
    setPending(provider);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if ("error" in result && result.error) {
        setError("Não conseguimos concluir o login. Tente novamente.");
        setPending(null);
        return;
      }
      if ("redirected" in result && result.redirected) return;
      navigate({ to: "/dashboard", replace: true });
    } catch {
      setError("Não conseguimos concluir o login. Tente novamente.");
      setPending(null);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex size-10 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
            RD
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Renda Digital IA</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Entre com sua conta para acessar sua plataforma.
          </p>
        </div>

        <div className="panel space-y-3 p-5">
          <Button
            className="h-11 w-full justify-center gap-2"
            variant="outline"
            disabled={pending !== null}
            onClick={() => signIn("google")}
          >
            {pending === "google" ? <Loader2 className="size-4 animate-spin" /> : <GoogleMark />}
            Continuar com Google
          </Button>
          <Button
            className="h-11 w-full justify-center gap-2"
            disabled={pending !== null}
            onClick={() => signIn("apple")}
          >
            {pending === "apple" ? <Loader2 className="size-4 animate-spin" /> : <AppleMark />}
            Continuar com Apple
          </Button>
          {error ? <p className="pt-1 text-center text-sm text-destructive">{error}</p> : null}
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
          Acesso exclusivo para quem já adquiriu o Renda Digital IA.
        </p>
      </div>
    </main>
  );
}
