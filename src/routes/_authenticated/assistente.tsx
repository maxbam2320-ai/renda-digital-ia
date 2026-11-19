import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Compass, FileText, Image as ImageIcon, Loader2, Paperclip, Plus, SendHorizonal, X } from "lucide-react";
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
type Attachment = { id: string; file: File };

const ACCEPTED_FILES = "image/png,image/jpeg,image/webp,application/pdf,.doc,.docx,.txt";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function AssistantPage() {
  const invalidate = useInvalidate();
  const [convId, setConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const { data: convs = [] } = useQuery({
    queryKey: ["ai_conversations"],
    queryFn: async () => (await supabase.from("ai_conversations").select("id,title,updated_at").order("updated_at", { ascending: false }).limit(20)).data ?? [],
  });

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, busy]);

  async function open(id: string) {
    setConvId(id);
    setAttachments([]);
    const { data } = await supabase.from("ai_messages").select("id,role,content").eq("conversation_id", id).order("created_at");
    setMessages(data ?? []);
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const incoming = Array.from(fileList);
    const valid: Attachment[] = [];
    for (const file of incoming) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: o limite é 10 MB por arquivo.`);
        continue;
      }
      if (!file.type.startsWith("image/") && !["application/pdf", "text/plain"].includes(file.type) && !/\.(doc|docx|txt)$/i.test(file.name)) {
        toast.error(`${file.name}: formato não permitido.`);
        continue;
      }
      valid.push({ id: crypto.randomUUID(), file });
    }
    setAttachments((current) => [...current, ...valid].slice(0, 5));
    if (incoming.length + attachments.length > 5) toast.info("Você pode anexar até 5 arquivos por mensagem.");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeAttachment(id: string) {
    setAttachments((current) => current.filter((item) => item.id !== id));
  }

  async function send(text: string) {
    const msg = text.trim();
    if ((!msg && attachments.length === 0) || busy) return;
    const attachmentNames = attachments.map(({ file }) => file.name);
    const displayMessage = [msg, attachmentNames.length ? `\n\nArquivos selecionados: ${attachmentNames.join(", ")}` : ""].join("");
    setInput("");
    setAttachments([]);
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", content: displayMessage }]);
    setBusy(true);
    try {
      const r = await assistantReply({ data: { conversationId: convId, message: displayMessage } });
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
        <Button variant="outline" className="w-full justify-start" onClick={() => { setConvId(null); setMessages([]); setAttachments([]); }}>
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
                <div key={m.id} className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-foreground">{m.content}</div>
              ) : (
                <div key={m.id} className="max-w-[92%] whitespace-pre-wrap text-sm leading-relaxed">{m.content}</div>
              ),
            )
          )}
          {busy ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Pensando...</p> : null}
          <div ref={endRef} />
        </div>
        <form
          className="sticky bottom-0 space-y-3 border-t border-border bg-background pt-4"
          onSubmit={(e) => { e.preventDefault(); send(input); }}
        >
          {attachments.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {attachments.map(({ id, file }) => (
                <div key={id} className="flex max-w-full items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-xs">
                  {file.type.startsWith("image/") ? <ImageIcon className="size-4 shrink-0 text-muted-foreground" /> : <FileText className="size-4 shrink-0 text-muted-foreground" />}
                  <span className="max-w-48 truncate">{file.name}</span>
                  <button type="button" onClick={() => removeAttachment(id)} aria-label={`Remover ${file.name}`} className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground">
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          <div className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_FILES}
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
              aria-label="Selecionar imagens ou documentos"
            />
            <Button type="button" variant="outline" size="icon" aria-label="Adicionar imagens ou documentos" title="Adicionar imagens ou documentos" disabled={busy || attachments.length >= 5} onClick={() => fileInputRef.current?.click()}>
              <Paperclip className="size-4" />
            </Button>
            <Textarea
              value={input}
              rows={2}
              maxLength={4000}
              placeholder="Escreva sua mensagem..."
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            />
            <Button type="submit" size="icon" aria-label="Enviar" disabled={busy || (!input.trim() && attachments.length === 0)}><SendHorizonal className="size-4" /></Button>
          </div>
          <p className="text-xs text-muted-foreground">Imagens, PDF, DOC, DOCX e TXT · até 5 arquivos de 10 MB cada</p>
        </form>
      </section>
    </div>
  );
}
