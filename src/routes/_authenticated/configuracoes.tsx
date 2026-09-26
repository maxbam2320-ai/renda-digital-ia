import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/states";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Renda Digital IA" },
      { name: "description", content: "Tema, privacidade, sair da conta e exclusão de conta." },
      { property: "og:title", content: "Configurações — Renda Digital IA" },
      { property: "og:description", content: "Ajuste suas preferências da plataforma." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConfigPage,
});

function ConfigPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dark, setDark] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme(next: boolean) {
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("rd-theme", next ? "dark" : "light");
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  async function deleteAccount() {
    setDeleting(true);
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (userId) {
      const tables = [
        "ai_messages",
        "ai_conversations",
        "activity_history",
        "tasks",
        "goals",
        "plans",
        "generated_content",
        "generated_offers",
        "sales_strategies",
        "opportunities",
        "first_sale_plans",
        "onboarding",
        "profiles",
      ] as const;
      for (const table of tables) {
        await supabase.from(table).delete().eq("user_id", userId);
      }
    }
    await signOut();
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Configurações" description="Preferências da sua conta." />

      <section className="panel divide-y divide-border">
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-sm font-medium">Tema escuro</p>
            <p className="text-sm text-muted-foreground">Alterna entre o tema claro e escuro.</p>
          </div>
          <Switch checked={dark} onCheckedChange={toggleTheme} />
        </div>
        <div className="px-5 py-4">
          <p className="text-sm font-medium">Privacidade</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Seus dados são individuais e só podem ser acessados pela sua conta.
          </p>
        </div>
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-sm font-medium">Sair</p>
            <p className="text-sm text-muted-foreground">Encerrar a sessão neste dispositivo.</p>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}>
            Sair
          </Button>
        </div>
      </section>

      <section className="panel border-destructive/30 p-5">
        <p className="text-sm font-medium">Excluir minha conta</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Remove seus dados da plataforma e encerra sua sessão. Esta ação não pode ser desfeita.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="mt-4" disabled={deleting}>
              Excluir minha conta
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir sua conta?</AlertDialogTitle>
              <AlertDialogDescription>
                Todos os seus dados da plataforma serão apagados. Esta ação é definitiva.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={deleteAccount}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
}
