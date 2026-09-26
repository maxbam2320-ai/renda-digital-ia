import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingState, PageHeader } from "@/components/states";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId, useInvalidate, useOnboarding, useProfile } from "@/lib/app-data";
import { brl, initials } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Meu Perfil — Renda Digital IA" },
      { name: "description", content: "Seus dados de conta, nicho, objetivo e meta." },
      { property: "og:title", content: "Meu Perfil — Renda Digital IA" },
      { property: "og:description", content: "Veja e atualize suas informações." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PerfilPage,
});

function PerfilPage() {
  const invalidate = useInvalidate();
  const { data: profile, isLoading } = useProfile();
  const { data: onboarding } = useOnboarding();
  const [niche, setNiche] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (isLoading) return <LoadingState />;

  const nicheValue = niche ?? onboarding?.niche ?? "";

  async function save() {
    setSaving(true);
    try {
      const userId = await currentUserId();
      const { error } = await supabase
        .from("onboarding")
        .update({ niche: nicheValue })
        .eq("user_id", userId);
      if (error) throw error;
      invalidate(["onboarding"]);
      toast.success("Informações atualizadas.");
    } catch {
      toast.error("Não conseguimos concluir esta ação. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Meu Perfil" description="Dados da sua conta e do seu perfil de trabalho." />

      <section className="panel flex items-center gap-4 p-5">
        <Avatar className="size-14">
          {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt="" /> : null}
          <AvatarFallback>{initials(profile?.full_name, profile?.email)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-medium">{profile?.full_name ?? "Cliente"}</p>
          <p className="truncate text-sm text-muted-foreground">{profile?.email}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Entrou com {profile?.provider === "apple" ? "Apple" : "Google"}
          </p>
        </div>
      </section>

      <section className="panel space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="eyebrow">Objetivo</p>
            <p className="mt-1 text-sm">{onboarding?.main_goal ?? "—"}</p>
          </div>
          <div>
            <p className="eyebrow">Tempo disponível</p>
            <p className="mt-1 text-sm">{onboarding?.available_time ?? "—"}</p>
          </div>
          <div>
            <p className="eyebrow">Meta mensal</p>
            <p className="mt-1 text-sm">{brl(Number(onboarding?.monthly_goal ?? 0))}</p>
          </div>
          <div>
            <p className="eyebrow">Nível</p>
            <p className="mt-1 text-sm">{onboarding?.experience_level ?? "—"}</p>
          </div>
        </div>

        <div className="space-y-2 border-t border-border pt-4">
          <Label htmlFor="niche">Nicho</Label>
          <Input id="niche" value={nicheValue} onChange={(e) => setNiche(e.target.value)} />
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </section>
    </div>
  );
}
