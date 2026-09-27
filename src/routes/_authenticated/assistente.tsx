import { createFileRoute } from "@tanstack/react-router";
import { Compass, Loader2, Plus, SendHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { errorMessage } from "@/components/ai-ui";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { assistantReply } from "@/lib/ai.functions";
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
type Conversation = { id: string; title: string; updated_at: string };

function AssistantPage() {
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [convId, setConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadConversations = async () => {
      const { data } = await supabase
        .from("ai_conversations")
        .select("id,title,updated_at")
        .order("updated_at", { ascending: false })
        .limit(20);

      if (!cancelled) setConvs(data ?? []);
    };

    void loadConversations();

    return () => {
      cancelled = true;
    };
  }, []);

  async function open(id: string) {
    setConvId(id);
    const { data } = await supabase
      .from("ai_messages")
      .select("id,role,content")
      .eq("conversation_id", id)
      .order("created_at");
    setMessages(data ?? []);
  }

  function newConversation() {
    setConvId(null);
    setMessages([]);
    setInput("");
  }

  async function send(text: string) {
    const msg = text.trim();
    if (!msg || busy) return;

    setInput("");
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", content: msg },
    ]);
    setBusy(true);

    try {
      const result = await assistantReply({
        data: { conversationId: convId, message: msg },
      });

      setConvId(result.conversationId);
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", content: result.answer },
      ]);

      setConvs((current) => {
        const existing = current.find((item) => item.id === result.conversationId);
        if (existing) {
          return current.map((item) =>
            item.id === result.conversationId
              ? { ...item, updated_at: new Date().toISOString() }
              : item,
          );
        }
        return [
          {
            id: result.conversationId,
            title: msg.slice(0, 60),
            updated_at: new Date().toISOString(),
          },
          ...current,
        ].slice(0, 20);
      });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="space-y-2">
        <Button variant="outline" className="w-full justify-start" onClick={newConversation}>
          <Plus className="size-4" /> Nova conversa
        </Button>
        <ul className="flex gap-2 overflow-x-auto lg:block lg:space-y-1">
          {convs.map((conversation) => (
            <li key={conversation.id} className="shrink-0">
              <button
                type="button"
                onClick={() => open(conversation.id)}
                className={`w-full max-w-52 truncate rounded-md px-3 py-2 text-left text-sm hover:bg-secondary ${convId === conversation.id ? "bg-secondary font-medium" : "text-muted-foreground"}`}
              >
                {conversation.title}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="flex min-h-[70vh] flex-col">
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <Compass className="size-4" />
          </span>
          <h1 className="font-semibold">Assistente Renda IA</h1>
        </div>
        <div className="flex-1 space-y-5 py-6">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <p className="text-lg">Olá! Como posso ajudar você a avançar hoje?</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <Button key={suggestion} variant="outline" size="sm" onClick={() => void send(suggestion)}>
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) =>
              message.role === "user" ? (
                <div key={message.id} className="ml-auto max-w-[85%] rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                  {message.content}
                </div>
              ) : (
                <div key={message.id} className="max-w-[92%] whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </div>
              ),
            )
          )}
          {busy ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Pensando...
            </p>
          ) : null}
        </div>
        <form
          className="sticky bottom-0 flex items-end gap-2 border-t border-border bg-background pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            void send(input);
          }}
        >
          <Textarea
            value={input}
            rows={2}
            maxLength={4000}
            placeholder="Escreva sua mensagem..."
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send(input);
              }
            }}
          />
          <Button type="submit" size="icon" aria-label="Enviar" disabled={busy || !input.trim()}>
            <SendHorizontal className="size-4" />
          </Button>
        </form>
      </section>
    </div>
  );
}
