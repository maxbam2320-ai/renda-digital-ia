const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/responses";
const MODEL = "openai/gpt-6-astra";

export type AiError = { status: number; message: string };

function friendly(status: number): string {
  if (status === 429) return "Muitas solicitações agora. Aguarde alguns segundos e tente novamente.";
  if (status === 402 || status === 403)
    return "Os créditos de IA do aplicativo acabaram. Recarregue para continuar usando as ferramentas.";
  return "Não conseguimos concluir esta ação. Tente novamente.";
}

/** Calls the Lovable AI Gateway (Responses API) and returns the full text. */
export async function aiText(system: string, prompt: string): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Não conseguimos concluir esta ação. Tente novamente.");

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      input: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => "");
    console.error("AI gateway error", response.status, detail);
    throw new Error(friendly(response.status));
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const event = JSON.parse(payload) as {
          type?: string;
          delta?: string;
          response?: { output_text?: string };
        };
        if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
          text += event.delta;
        }
      } catch {
        /* ignore partial frames */
      }
    }
  }

  if (!text.trim()) throw new Error("Não conseguimos concluir esta ação. Tente novamente.");
  return text.trim();
}

function stripFences(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("```")) return trimmed;
  return trimmed
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
}

/** Same as aiText but parses a JSON object out of the model answer. */
export async function aiJson<T>(system: string, prompt: string): Promise<T> {
  const raw = await aiText(
    `${system}\n\nResponda EXCLUSIVAMENTE com JSON válido, sem comentários e sem markdown.`,
    prompt,
  );
  const cleaned = stripFences(raw);
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    }
    throw new Error("Não conseguimos concluir esta ação. Tente novamente.");
  }
}

export const BASE_RULES = `Você é o estrategista do Renda Digital IA, uma plataforma brasileira que ajuda pessoas a criar renda extra com marketing digital.
Regras obrigatórias:
- Escreva em português do Brasil, com linguagem simples, prática e profissional.
- Seja específico e acionável: nada de conselhos genéricos.
- NUNCA prometa dinheiro garantido, renda garantida, número de vendas garantido ou resultados garantidos.
- Não invente números de faturamento. Fale sempre em termos de esforço, consistência e possibilidades.
- Considere o tempo disponível e o nível de experiência informados pela pessoa.`;
