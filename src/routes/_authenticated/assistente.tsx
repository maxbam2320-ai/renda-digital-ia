import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Compass, Loader2, Plus, SendHorizonal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { errorMessage } from "@/components/ai-ui";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { assistantReply } from "@/lib/ai.functions";
import { useInvalidate } from "@/lib/app-data";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/assistente")({
  head: () => pageHead("Assistente Renda IA", "Tire dúvidas e receba direção prática para avançar."),
  component: AssistantPage,
});

const SUGGESTIONS = [
  "Como começar do zero?",
  "Me ajude a encontrar uma oportunidade",
  "Como fazer minha primeira venda?",
  "Crie um conteúdo para mim",
  "Como melhorar minha oferta?",
  "Como vender pelo WhatsApp?",
];

type Msg = { id: string; role: string; content: string };

function AssistantPage() {
  const invalidate = useInvalidate();
  const [convId, setConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const { data: convs = [] } = useQuery({
    queryKey: ["ai_conversations"],
    queryFn: async () =>
      (await supabase
        .from("ai_conversations")
        .select("id,title,updated_at")
        .order("updated_at", { ascending: false })
        .limit(20)).data ?? [],
  });

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, busy]);

  async function open(id: string) {
    setConvId(id);
    const { data } = await supabase
      .from("ai_messages")
      .select("id,role,content")
      .eq("conversation_id", id)
      .order("created_at");
    setMessages(data ?? []);
  }

  async function send(text: string) {
    const msg = text.trim();
    if (!msg || busy) return;
    setInput("");
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", content: msg }]);
    setBusy(true);
    try {
      const r = await assistantReply({ data: { conversationId: convId, message: msg } });
      setConvId(r.conversationId);
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: r.answer }]);
      invalidate(["ai_conversations"]);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="space-y-2">
        <Button variant="outline" className="w-full justify-start" onClick={() => { setConvId(null); setMessages([]); }}>
          <Plus className="size-4" /> Nova conversa
        </Button>
        <ul className="flex gap-2 overflow-x-auto lg:block lg:space-y-1">
          {convs.map((c) => (
            <li key={c.id} className="shrink-0">
              <button
                onClick={() => open(c.id)}
                className={`w-full max-w-52 truncate rounded-md px-3 py-2 text-left text-sm hover:bg-secondary ${convId === c.id ? "bg-secondary font-medium" : "text-muted-foreground"}`}
              >
                {c.title}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="flex min-h-[70vh] flex-col">
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground"><Compass className="size-4" /></span>
          <h1 className="font-semibold">Assistente Renda IA</h1>
        </div>
        <div className="flex-1 space-y-5 py-6">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <p className="text-lg">Olá! Como posso ajudar você a avançar hoje?</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <Button key={s} variant="outline" size="sm" onClick={() => send(s)}>{s}</Button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="ml-auto max-w-[85%] rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-foreground">{m.content}</div>
              ) : (
                <div key={m.id} className="max-w-[92%] whitespace-pre-wrap text-sm leading-relaxed">{m.content}</div>
              ),
            )
          )}
          {busy ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Pensando...</p> : null}
          <div ref={endRef} />
        </div>
        <form
          className="sticky bottom-0 flex items-end gap-2 border-t border-border bg-background pt-4"
          onSubmit={(e) => { e.preventDefault(); send(input); }}
        >
          <Textarea
            value={input}
            rows={2}
            maxLength={4000}
            placeholder="Escreva sua mensagem..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
          />
          <Button type="submit" size="icon" aria-label="Enviar" disabled={busy || !input.trim()}><SendHorizonal className="size-4" /></Button>
        </form>
      </section>
    </div>
  );
}
