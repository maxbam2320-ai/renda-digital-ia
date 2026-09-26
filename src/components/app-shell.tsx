import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  Compass,
  FileText,
  Home,
  LayoutList,
  LineChart,
  Lightbulb,
  Menu,
  Megaphone,
  Rocket,
  Settings,
  Target,
  User as UserIcon,
  LogOut,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/app-data";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Início", icon: Home },
  { to: "/plano", label: "Meu Plano", icon: Compass },
  { to: "/tarefas", label: "Tarefas", icon: LayoutList },
  { to: "/oportunidades", label: "Ideias de Renda", icon: Lightbulb },
  { to: "/primeira-venda", label: "Primeira Venda", icon: Rocket },
  { to: "/conteudo", label: "Conteúdo IA", icon: FileText },
  { to: "/oferta", label: "Oferta IA", icon: Megaphone },
  { to: "/vendas", label: "Vendas IA", icon: LineChart },
  { to: "/metas", label: "Minhas Metas", icon: Target },
  { to: "/assistente", label: "Assistente", icon: Bot },
] as const;

const FOOTER_NAV = [
  { to: "/perfil", label: "Meu Perfil", icon: UserIcon },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const item = (to: string, label: string, Icon: typeof Home) => {
    const active = pathname === to;
    return (
      <Link
        key={to}
        to={to}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
          active
            ? "bg-accent font-medium text-accent-foreground"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground",
        )}
      >
        <Icon className="size-4 shrink-0" />
        {label}
      </Link>
    );
  };

  return (
    <nav className="flex h-full flex-col gap-1">
      {NAV.map((n) => item(n.to, n.label, n.icon))}
      <div className="mt-auto space-y-1 pt-4">
        {FOOTER_NAV.map((n) => item(n.to, n.label, n.icon))}
      </div>
    </nav>
  );
}

function UserChip() {
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="flex items-center gap-3 border-t border-border pt-4">
      <Avatar className="size-8">
        {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt="" /> : null}
        <AvatarFallback className="text-xs">
          {initials(profile?.full_name, profile?.email)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{profile?.full_name ?? "Cliente"}</p>
        <p className="truncate text-xs text-muted-foreground">{profile?.email}</p>
      </div>
      <Button variant="ghost" size="icon" aria-label="Sair" onClick={signOut}>
        <LogOut className="size-4" />
      </Button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (pathname.startsWith("/onboarding")) {
    return <div className="min-h-screen bg-surface">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-surface">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-sidebar px-4 py-5 lg:flex">
        <Link to="/dashboard" className="mb-6 flex items-center gap-2 px-1">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-[11px] font-semibold text-primary-foreground">
            RD
          </span>
          <span className="text-sm font-semibold tracking-tight">Renda Digital IA</span>
        </Link>
        <div className="flex min-h-0 flex-1 flex-col">
          <NavList />
        </div>
        <UserChip />
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Abrir menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-72 flex-col bg-sidebar px-4 py-5">
            <SheetTitle className="mb-4 px-1 text-sm font-semibold">Renda Digital IA</SheetTitle>
            <div className="flex min-h-0 flex-1 flex-col">
              <NavList onNavigate={() => setOpen(false)} />
            </div>
            <UserChip />
          </SheetContent>
        </Sheet>
        <span className="text-sm font-semibold tracking-tight">Renda Digital IA</span>
        <div className="size-9" />
      </header>

      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-10">{children}</div>
      </main>
    </div>
  );
}
