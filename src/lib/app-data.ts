import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;
export type Onboarding = Tables<"onboarding">;
export type Task = Tables<"tasks">;
export type Goal = Tables<"goals">;
export type Plan = Tables<"plans">;
export type Activity = Tables<"activity_history">;

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile | null> => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) return null;

      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const payload = {
        user_id: user.id,
        full_name:
          (meta["full_name"] as string) ?? (meta["name"] as string) ?? user.email?.split("@")[0] ?? null,
        email: user.email ?? null,
        avatar_url: (meta["avatar_url"] as string) ?? (meta["picture"] as string) ?? null,
        provider: (user.app_metadata?.provider as string) ?? "unknown",
        last_seen_at: new Date().toISOString(),
      };

      const { data: existing } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existing) {
        const { data: created } = await supabase
          .from("profiles")
          .insert(payload)
          .select("*")
          .maybeSingle();
        return created ?? null;
      }

      const { data: updated } = await supabase
        .from("profiles")
        .update({
          last_seen_at: payload.last_seen_at,
          full_name: existing.full_name ?? payload.full_name,
          avatar_url: existing.avatar_url ?? payload.avatar_url,
          email: existing.email ?? payload.email,
          provider: existing.provider ?? payload.provider,
        })
        .eq("user_id", user.id)
        .select("*")
        .maybeSingle();

      return updated ?? existing;
    },
    staleTime: 60_000,
  });
}

export function useOnboarding() {
  return useQuery({
    queryKey: ["onboarding"],
    queryFn: async (): Promise<Onboarding | null> => {
      const { data, error } = await supabase.from("onboarding").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });
}

export function usePlan() {
  return useQuery({
    queryKey: ["plan"],
    queryFn: async (): Promise<Plan | null> => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: async (): Promise<Task[]> => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: async (): Promise<Goal[]> => {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useActivity(limit = 8) {
  return useQuery({
    queryKey: ["activity", limit],
    queryFn: async (): Promise<Activity[]> => {
      const { data, error } = await supabase
        .from("activity_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export async function logActivity(activityType: string, description: string) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase
    .from("activity_history")
    .insert({ user_id: data.user.id, activity_type: activityType, description });
}

export function useInvalidate() {
  const queryClient = useQueryClient();
  return (keys: string[]) => {
    keys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
  };
}

export async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Sessão expirada. Entre novamente.");
  return data.user.id;
}
