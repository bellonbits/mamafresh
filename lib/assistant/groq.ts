// Shared Groq tool-calling loop. Keeps every MamaFresh AI surface (customer,
// seller) grounded in real data: the model must call tools to look anything
// up rather than inventing products, prices, or order statuses.

import { toPlainChatText } from "@/lib/assistant/text";

export interface ToolDef {
  name: string;
  description: string;
  parameters: object;
}

export interface GroqMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[];
  tool_call_id?: string;
  name?: string;
}

interface ToolOutcome {
  result?: unknown;
  terminal?: boolean;
  final?: { message: string; data?: unknown };
}

interface RunGroqOptions {
  systemPrompt: string;
  messages: GroqMessage[];
  tools: ToolDef[];
  executeTool: (name: string, args: Record<string, unknown>) => Promise<ToolOutcome>;
  maxSteps?: number;
  /** Returned if the tool loop runs out of steps without a final answer. */
  fallbackMessage?: string;
}

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

/** Groq's 429 body includes "Please try again in 2.7s" — honor that instead of guessing. */
function parseRetryAfterMs(bodyText: string): number | null {
  const match = bodyText.match(/try again in ([\d.]+)s/i);
  if (!match) return null;
  const seconds = parseFloat(match[1]);
  return Number.isFinite(seconds) ? Math.ceil(seconds * 1000) + 250 : null;
}

/** Groq's endpoint occasionally times out, 5xx's, or hits the org's token-per-minute cap — retry a couple of times before surfacing an error. */
async function callGroqWithRetry(base: string, groqKey: string, payload: object, attempt = 0): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (networkError) {
    console.error(`[assistant] Groq fetch failed (attempt ${attempt + 1}):`, networkError);
    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      return callGroqWithRetry(base, groqKey, payload, attempt + 1);
    }
    throw new Error("The assistant is temporarily unreachable. Please try again.");
  }

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    console.error(`[assistant] Groq responded ${response.status} (attempt ${attempt + 1}):`, bodyText.slice(0, 500));
    if (RETRYABLE_STATUS.has(response.status) && attempt < 2) {
      const retryAfter = response.status === 429 ? parseRetryAfterMs(bodyText) : null;
      const wait = retryAfter ?? 600 * (attempt + 1);
      // Cap the wait so one request can't hang the response for too long — beyond this, just surface the error.
      if (wait <= 6000) {
        await new Promise((resolve) => setTimeout(resolve, wait));
        return callGroqWithRetry(base, groqKey, payload, attempt + 1);
      }
    }
    throw new Error(response.status === 429 ? "The assistant is a bit busy right now — try again in a moment." : "The assistant could not respond.");
  }

  return response;
}

export async function runGroqWithTools({
  systemPrompt,
  messages,
  tools,
  executeTool,
  maxSteps = 4,
  fallbackMessage = "I need a bit more detail to help with that — could you rephrase?",
}: RunGroqOptions): Promise<{ content: string; data?: unknown }> {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) throw new Error("The assistant is not configured yet.");
  const base = process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1";
  const model = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";

  const convo: GroqMessage[] = [{ role: "system", content: systemPrompt }, ...messages];

  for (let step = 0; step < maxSteps; step++) {
    const response = await callGroqWithRetry(base, groqKey, {
      model,
      messages: convo,
      tools: tools.map((t) => ({ type: "function", function: { name: t.name, description: t.description, parameters: t.parameters } })),
      tool_choice: "auto",
    });
    const result = await response.json() as {
      choices?: [{ message?: { content?: string | null; tool_calls?: GroqMessage["tool_calls"] } }];
    };
    const message = result.choices?.[0]?.message;
    if (!message) throw new Error("The assistant could not respond.");

    if (message.tool_calls?.length) {
      convo.push({ role: "assistant", content: message.content ?? "", tool_calls: message.tool_calls });
      for (const call of message.tool_calls) {
        let args: Record<string, unknown> = {};
        try { args = JSON.parse(call.function.arguments || "{}"); } catch { /* model sent malformed args */ }
        const outcome = await executeTool(call.function.name, args);
        if (outcome.terminal) {
          return { content: toPlainChatText(outcome.final?.message ?? ""), data: outcome.final?.data };
        }
        convo.push({ role: "tool", tool_call_id: call.id, name: call.function.name, content: JSON.stringify(outcome.result ?? {}) });
      }
      continue;
    }

    return { content: toPlainChatText(message.content ?? "I could not find an answer for that.") };
  }
  return { content: fallbackMessage };
}
