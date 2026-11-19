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
type Attachment = { id: string; file: File; previewUrl?: string };

const ACCEPTED_FILES = "image/png,image/jpeg,image/webp,application/pdf,.doc,.docx,.txt";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 5;

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Não foi possível ler o arquivo."));
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

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

  useEffect(() => () => {
    attachments.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
  }, [attachments]);

  function clearAttachments() {
    setAttachments((current) => {
      current.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
      return [];
    });
  }

  async function open(id: string) {
    setConvId(id);
    clearAttachments();
    const { data } = await supabase.from("ai_messages").select("id,role,content").eq("conversation_id", id).order("created_at");
    setMessages(data ?? []);
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const incoming = Array.from(fileList);
    const remaining = MAX_FILES - attachments.length;
    if (incoming.length > remaining) toast.info(`Você pode anexar até ${MAX_FILES} arquivos por mensagem.`);
    const valid: Attachment[] = [];
    for (const file of incoming.slice(0, remaining)) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: o limite é 10 MB por arquivo.`);
        continue;
      }
      if (!file.type.startsWith("image/") && !["application/pdf", "text/plain"].includes(file.type) && !/\.(doc|docx|txt)$/i.test(file.name)) {
        toast.error(`${file.name}: formato não permitido.`);
        continue;
      }
      valid.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      });
    }
    setAttachments((current) => [...current, ...valid]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeAttachment(id: string) {
    setAttachments((current) => {
      const removed = current.find((item) => item.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((item) => item.id !== id);
    });
  }

  async function send(text: string) {
    const msg = text.trim();
    const selectedFiles = [...attachments];
    if ((!msg && selectedFiles.length === 0) || busy) return;
    const totalSize = selectedFiles.reduce((sum, item) => sum + item.file.size, 0);
    if (totalSize > 15 * 1024 * 1024) {
      toast.error("O tamanho total dos anexos deve ser de até 15 MB por mensagem.");
      return;
    }

    setInput("");
    setBusy(true);
    try {
      const filesForAi = await Promise.all(selectedFiles.map(async ({ file }) => ({
        name: file.name,
        mimeType: file.type || (
          /\.pdf$/i.test(file.name) ? "application/pdf" :
          /\.docx$/i.test(file.name) ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" :
          /\.doc$/i.test(file.name) ? "application/msword" :
          /\.txt$/i.test(file.name) ? "text/plain" : "application/octet-stream"
        ),
        dataUrl: await fileToDataUrl(file),
      })));
      const attachmentNames = selectedFiles.map(({ file }) => file.name);
      const displayMessage = [msg, attachmentNames.length ? `\\n\\nArquivos enviados: ${attachmentNames.join(", ")}` : ""].join("");
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", content: displayMessage }]);
      const r = await assistantReply({
        data: {
          conversationId: convId,
          message: msg || "Analise os arquivos anexados e me explique o conteúdo.",
          attachments: filesForAi,
        },
      });
      setConvId(r.conversationId);
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: r.answer }]);
      clearAttachments();
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
        <Button variant="outline" className="w-full justify-start" onClick={() => { setConvId(null); setMessages([]); clearAttachments(); }}>
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
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {attachments.map(({ id, file, previewUrl }) => (
                <div key={id} className="group relative size-20 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary/50">
                  {previewUrl ? (
                    <img src={previewUrl} alt={file.name} className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full flex-col items-center justify-center gap-1 p-2 text-center">
                      {file.type === "application/pdf" || /\.(doc|docx|txt)$/i.test(file.name)
                        ? <FileText className="size-6 text-muted-foreground" />
                        : <ImageIcon className="size-6 text-muted-foreground" />}
                      <span className="w-full truncate text-[10px] text-muted-foreground">{file.name}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAttachment(id)}
                    aria-label={`Remover ${file.name}`}
                    className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-black/75 text-white opacity-100 transition hover:bg-black"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
              {attachments.length < MAX_FILES ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Adicionar mais arquivos"
                  className="grid size-20 shrink-0 place-items-center rounded-xl border border-dashed border-muted-foreground/50 bg-secondary/40 text-muted-foreground transition hover:border-primary hover:bg-secondary hover:text-foreground"
                >
                  <Plus className="size-9 stroke-[1.5]" />
                </button>
              ) : null}
            </div>
          ) : null}
          <div className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2 focus-within:border-primary/60">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_FILES}
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
              aria-label="Selecionar imagens ou documentos"
            />
            <Button type="button" variant="ghost" size="icon" aria-label="Adicionar imagens ou documentos" title="Adicionar imagens ou documentos" disabled={busy || attachments.length >= MAX_FILES} onClick={() => fileInputRef.current?.click()}>
              <Paperclip className="size-5" />
            </Button>
            <Textarea
              value={input}
              rows={2}
              maxLength={4000}
              placeholder="Escreva sua mensagem..."
              className="min-h-12 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
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
