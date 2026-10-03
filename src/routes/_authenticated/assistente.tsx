import { createFileRoute } from "@tanstack/react-router";
import { Check, Clipboard, Compass, Loader2, Plus, RefreshCw, SendHorizontal, Sparkles, Trash2 } from "lucide-react";
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
  "Quero começar no marketing digital do zero. Monte um plano para mim.",
  "Analise minha ideia de negócio e diga como posso melhorar.",
  "Crie um roteiro de Reels de até 30 segundos para vender meu produto.",
  "Monte uma oferta completa para meu produto, incluindo promessa, benefícios e CTA.",
  "Me ajude a conseguir minha primeira venda sem prometer resultado garantido.",
  "Crie uma estratégia de conteúdo para Instagram, TikTok e Pinterest.",
  "Como posso usar IA para ganhar produtividade no meu negócio?",
  "Tenho uma dúvida sobre marketing digital. Explique de forma simples.",
];

type Msg = { id: string; role: string; content: string };
type Conversation = { id: string; title: string; updated_at: string };

function AssistantPage() {
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [convId, setConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  async function copyMessage(id: string, content: string) {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch {
      toast.error("Não foi possível copiar a resposta.");
    }
  }

  async function regenerate() {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser || busy) return;
    setMessages((current) => {
      const index = current.map((m) => m.id).lastIndexOf(lastUser.id);
      return current.slice(0, index + 1);
    });
    await send(lastUser.content);
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
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="space-y-2">
        <Button variant="outline" className="w-full justify-start gap-2" onClick={newConversation}>
          <Plus className="size-4" /> Nova conversa
        </Button>
        <div className="rounded-xl border border-border bg-card/60 p-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="size-4 text-primary" /> Assistente inteligente
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Pergunte sobre marketing, conteúdo, vendas, ofertas, negócios, produtividade ou qualquer outro assunto.
          </p>
        </div>
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

      <section className="flex min-h-[70vh] flex-col overflow-hidden rounded-2xl border border-border bg-card/30">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4">
          <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <Compass className="size-4" />
          </span>
          <div>
            <h1 className="font-semibold">Assistente Renda IA</h1>
            <p className="text-xs text-muted-foreground">Seu copiloto para ideias, estratégia e execução.</p>
          </div>
          </div>
          {messages.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={newConversation}>
              <Trash2 className="mr-1 size-4" /> Limpar
            </Button>
          ) : null}
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div>
                <p className="text-lg font-medium">Olá! 👋 O que você quer fazer hoje?</p>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Eu posso explicar, planejar, criar textos e conteúdos, analisar ideias, estruturar ofertas,
                  montar estratégias de vendas e ajudar você a transformar uma dúvida em próximos passos.
                </p>
              </div>
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
                <div key={message.id} className="ml-auto max-w-[88%] rounded-2xl bg-primary px-4 py-3 text-sm text-primary-foreground">
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              ) : (
                <div key={message.id} className="group max-w-[94%]">
                  <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm leading-6 shadow-sm">
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                  <div className="mt-1 flex items-center gap-1 opacity-70">
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => void copyMessage(message.id, message.content)}>
                      {copiedId === message.id ? <Check className="mr-1 size-3" /> : <Clipboard className="mr-1 size-3" />}
                      {copiedId === message.id ? "Copiado" : "Copiar"}
                    </Button>
                    {message.id === [...messages].reverse().find((m) => m.role === "assistant")?.id ? (
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => void regenerate()} disabled={busy}>
                        <RefreshCw className="mr-1 size-3" /> Refazer
                      </Button>
                    ) : null}
                  </div>
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
          className="sticky bottom-0 flex items-end gap-2 border-t border-border bg-background px-4 py-4"
          onSubmit={(event) => {
            event.preventDefault();
            void send(input);
          }}
        >
          <Textarea
            value={input}
            rows={2}
            maxLength={4000}
            placeholder="Pergunte qualquer coisa ou diga o que você quer criar..."
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
