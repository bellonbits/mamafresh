"use client";

// Shared client-side caller for the MamaFresh AI endpoints. Hides transient
// backend failures (Groq rate limits, network hiccups) from the customer or
// seller — retries once silently before falling back to an in-persona line
// instead of surfacing a raw technical error as if it were the AI talking.

interface AssistantRequestBody {
  messages: { role: "user" | "assistant"; content: string }[];
  conversationId?: string | null;
}

interface AssistantResponse<T> {
  content: string;
  items?: T[];
  conversationId?: string;
}

const BUSY_FALLBACK = "Niko na wateja wengi kidogo sasa hivi, mama — give me a few seconds and ask me that again? 🙏";

async function callOnce<T>(endpoint: string, body: AssistantRequestBody): Promise<AssistantResponse<T> | null> {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json() as { content?: string; items?: T[]; error?: string; conversationId?: string };
    if (!response.ok || result.error || !result.content) return null;
    return { content: result.content, items: result.items, conversationId: result.conversationId };
  } catch {
    return null;
  }
}

export async function postAssistantMessage<T = unknown>(endpoint: string, body: AssistantRequestBody): Promise<AssistantResponse<T>> {
  const first = await callOnce<T>(endpoint, body);
  if (first) return first;

  await new Promise((resolve) => setTimeout(resolve, 1800));

  const second = await callOnce<T>(endpoint, body);
  if (second) return second;

  return { content: BUSY_FALLBACK };
}
