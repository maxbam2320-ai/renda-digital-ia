import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";
import { aiJson, aiText, BASE_RULES } from "./ai.server";

type Sb = { from: (t: string) => any };

async function profileContext(supabase: Sb) {
  const { data } = await supabase.from("onboarding").select("*").maybeSingle();
  if (!data) return "Perfil ainda não informado.";
  return `Perfil da pessoa:
- Objetivo: ${data.main_goal ?? "-"}
- Tempo por dia: ${data.available_time ?? "-"}
- Nível: ${data.experience_level ?? "-"}
- O que quer vender: ${data.product_status ?? "-"}
- Nicho: ${data.niche ?? "-"}
- Canais: ${(data.preferred_channels ?? []).join(", ") || "-"}
- Meta mensal desejada: R$ ${data.monthly_goal ?? 0}`;
}

async function log(supabase: Sb, userId: string, type: string, description: string) {
  await supabase.from("activity_history").insert({ user_id: userId, activity_type: type, description });
}

const STAGES = ["Direção", "Oferta", "Conteúdo", "Divulgação", "Vendas", "Otimização"];

export const generatePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as unknown as { supabase: Sb; userId: string };
    const ctx = await profileContext(supabase);
    type R = {
      title: string;
      description: string;
      stages: { stage: number; summary: string; tasks: { title: string; description: string; priority: string; estimated_time: string }[] }[];
    };
    const r = await aiJson<R>(
      BASE_RULES,
      `${ctx}\n\nCrie um plano personalizado em 6 etapas: ${STAGES.map((s, i) => `${i + 1}. ${s}`).join(", ")}.
Formato JSON: {"title": string, "description": string (2 frases), "stages": [{"stage": 1-6, "summary": string curta, "tasks": [{"title": string curto, "description": string (1 frase prática), "priority": "alta"|"media"|"baixa", "estimated_time": ex "20 min"}]}]}.
Cada etapa com 3 tarefas realistas para o tempo disponível.`,
    );
    await supabase.from("tasks").delete().eq("user_id", userId).eq("source", "plano");
    await supabase.from("plans").delete().eq("user_id", userId);
    const { data: plan, error } = await supabase
      .from("plans")
      .insert({
        user_id: userId,
        title: r.title,
        description: r.description,
        strategy: { stages: r.stages.map((s) => ({ stage: s.stage, summary: s.summary })) } as Json,
        current_stage: 1,
        progress: 0,
      })
      .select("*")
      .single();
    if (error) throw new Error("Não conseguimos concluir esta ação. Tente novamente.");
    const rows = r.stages.flatMap((s) =>
      (s.tasks ?? []).map((t) => ({
        user_id: userId,
        title: t.title,
        description: t.description,
        priority: ["alta", "media", "baixa"].includes(t.priority) ? t.priority : "media",
        estimated_time: t.estimated_time,
        stage: s.stage,
        source: "plano",
      })),
    );
    if (rows.length) await supabase.from("tasks").insert(rows);
    await log(supabase, userId, "plano", "Plano personalizado criado");
    return plan;
  });

export const generateOpportunities = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as unknown as { supabase: Sb; userId: string };
    const ctx = await profileContext(supabase);
    type O = { title: string; description: string; audience: string; difficulty: string; requirements: string; strategy: string; channels: string; first_steps: string[] };
    const r = await aiJson<{ opportunities: O[] }>(
      BASE_RULES,
      `${ctx}\n\nSugira 3 oportunidades de renda com marketing digital compatíveis com esse perfil.
JSON: {"opportunities": [{"title", "description" (como funciona), "audience" (para quem serve), "difficulty" ("Fácil"|"Média"|"Avançada"), "requirements" (o que precisa), "strategy" (como começar), "channels" (onde divulgar), "first_steps": [4 passos curtos]}]}`,
    );
    const rows = (r.opportunities ?? []).map((o) => ({
      user_id: userId,
      title: o.title,
      description: `${o.description}\n\nPara quem serve: ${o.audience}\nOnde divulgar: ${o.channels}`,
      difficulty: o.difficulty,
      requirements: o.requirements,
      strategy: o.strategy,
      first_steps: (o.first_steps ?? []) as Json,
    }));
    if (rows.length) await supabase.from("opportunities").insert(rows);
    await log(supabase, userId, "oportunidades", "Novas ideias de renda geradas");
    return rows.length;
  });

export const generateFirstSale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ duration: z.union([z.literal(7), z.literal(14), z.literal(30)]) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as unknown as { supabase: Sb; userId: string };
    const ctx = await profileContext(supabase);
    const r = await aiJson<{ strategy: string; days: { day: number; title: string; description: string }[] }>(
      BASE_RULES,
      `${ctx}\n\nCrie um roteiro de ${data.duration} dias para a pessoa buscar sua primeira venda (definir público, problema, oferta, conteúdo, divulgação, conversas, análise e ajustes).
JSON: {"strategy": string (2 frases), "days": [{"day": número, "title": string curto, "description": string prática}]} com exatamente ${data.duration} dias.`,
    );
    const tasks = (r.days ?? []).map((d) => ({ ...d, done: false }));
    const { data: row, error } = await supabase
      .from("first_sale_plans")
      .insert({ user_id: userId, duration: data.duration, strategy: r.strategy, tasks: tasks as Json, progress: 0 })
      .select("*")
      .single();
    if (error) throw new Error("Não conseguimos concluir esta ação. Tente novamente.");
    await log(supabase, userId, "primeira_venda", `Roteiro de ${data.duration} dias criado`);
    return row;
  });

export const generateContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      product: z.string().max(300),
      niche: z.string().max(200),
      audience: z.string().max(300),
      platform: z.string().max(40),
      goal: z.string().max(300),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as unknown as { supabase: Sb; userId: string };
    const r = await aiJson<Record<string, string>>(
      BASE_RULES,
      `Crie um conteúdo para ${data.platform}.
Produto: ${data.product}\nNicho: ${data.niche}\nPúblico: ${data.audience}\nObjetivo: ${data.goal}
JSON: {"hook": string, "script": string (roteiro passo a passo), "caption": string, "cta": string, "hashtags": string (separadas por espaço), "visual": string (ideia visual)}`,
    );
    const { data: row } = await supabase
      .from("generated_content")
      .insert({ user_id: userId, platform: data.platform, content_type: data.goal, topic: data.product, result: r as Json })
      .select("*")
      .single();
    await log(supabase, userId, "conteudo", `Conteúdo criado para ${data.platform}`);
    return row;
  });

export const generateOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      product: z.string().max(300),
      audience: z.string().max(300),
      problem: z.string().max(400),
      benefit: z.string().max(400),
      price: z.string().max(60),
      differential: z.string().max(400),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as unknown as { supabase: Sb; userId: string };
    const r = await aiJson<Record<string, unknown>>(
      BASE_RULES,
      `Estruture uma oferta.
Produto: ${data.product}\nPúblico: ${data.audience}\nProblema: ${data.problem}\nBenefício: ${data.benefit}\nPreço: ${data.price}\nDiferencial: ${data.differential}
JSON: {"name": string, "value_proposition": string, "benefits": [4 strings], "differential": string, "objections": [{"objection": string, "answer": string}] (3 itens), "cta": string, "pitch": string (texto de apresentação de 1 parágrafo)}`,
    );
    const { data: row } = await supabase
      .from("generated_offers")
      .insert({ user_id: userId, product: data.product, audience: data.audience, problem: data.problem, benefit: data.benefit, price: data.price, result: r as Json })
      .select("*")
      .single();
    await log(supabase, userId, "oferta", "Oferta estruturada");
    return row;
  });

export const generateSales = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ channel: z.string().max(40), context: z.string().max(800) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as unknown as { supabase: Sb; userId: string };
    const ctx = await profileContext(supabase);
    const r = await aiJson<Record<string, unknown>>(
      BASE_RULES,
      `${ctx}\n\nCanal: ${data.channel}\nContexto do produto/oferta: ${data.context}
Crie uma estratégia de vendas em 5 fases: Atração, Interesse, Conversa, Oferta, Follow-up. Mensagens naturais e profissionais, sem pressão.
JSON: {"steps": [{"phase": string, "goal": string, "message": string (mensagem pronta para enviar)}]}`,
    );
    const { data: row } = await supabase
      .from("sales_strategies")
      .insert({ user_id: userId, channel: data.channel, context: data.context, result: r as Json })
      .select("*")
      .single();
    await log(supabase, userId, "vendas", `Estratégia de vendas para ${data.channel}`);
    return row;
  });

export const assistantReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ conversationId: z.string().uuid().nullable(), message: z.string().min(1).max(4000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as unknown as { supabase: Sb; userId: string };
    let conversationId = data.conversationId;
    if (!conversationId) {
      const { data: conv, error } = await supabase
        .from("ai_conversations")
        .insert({ user_id: userId, title: data.message.slice(0, 60) })
        .select("id")
        .single();
      if (error) throw new Error("Não conseguimos concluir esta ação. Tente novamente.");
      conversationId = conv.id as string;
    }
    await supabase.from("ai_messages").insert({ conversation_id: conversationId, user_id: userId, role: "user", content: data.message });
    const { data: history } = await supabase
      .from("ai_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(30);
    const ctx = await profileContext(supabase);
    const transcript = (history ?? [])
      .map((m: { role: string; content: string }) => `${m.role === "user" ? "Pessoa" : "Assistente"}: ${m.content}`)
      .join("\n\n");
    const answer = await aiText(
      `${BASE_RULES}\nVocê é o "Assistente Renda IA". Responda de forma direta, em até 250 palavras, com passos práticos quando fizer sentido.\n\n${ctx}`,
      `Conversa até agora:\n${transcript}\n\nResponda à última mensagem da pessoa.`,
    );
    await supabase.from("ai_messages").insert({ conversation_id: conversationId, user_id: userId, role: "assistant", content: answer });
    await supabase.from("ai_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
    return { conversationId, answer };
  });
