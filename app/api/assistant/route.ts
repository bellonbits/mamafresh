import { NextResponse } from "next/server";
import { createSupabaseApiClient, withCors } from "@/lib/supabase/server";
import { runGroqWithTools, type GroqMessage } from "@/lib/assistant/groq";
import { CUSTOMER_TOOLS, CUSTOMER_SYSTEM_PROMPT } from "@/lib/assistant/customer-tools";
import type { ProductRow } from "@/lib/supabase/types";

type Message = { role: "user" | "assistant"; content: string };
type ShoppingListItem = ProductRow & { quantity: number };

function json(body: unknown, init?: ResponseInit) {
  return withCors(NextResponse.json(body, init)) as NextResponse;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function POST(request: Request) {
  const { supabase, getUser } = await createSupabaseApiClient(request);
  if (!supabase) return json({ error: "Supabase is not configured." }, { status: 503 });

  const user = await getUser();
  const body = await request.json() as { messages?: Message[]; conversationId?: string };
  const messages = body.messages?.slice(-12) ?? [];
  const latest = messages.at(-1)?.content?.trim();
  if (!latest) return json({ error: "Message is required." }, { status: 400 });

  try {
    const { content, data } = await runGroqWithTools({
      systemPrompt: CUSTOMER_SYSTEM_PROMPT,
      messages: messages as GroqMessage[],
      tools: CUSTOMER_TOOLS,
      fallbackMessage: "I couldn't pin that down from the current MamaFresh catalog. Try describing it differently, or browse everything in stock at /shops.",
      executeTool: async (name, args) => {
        if (name === "search_products") {
          let query = supabase
            .from("products")
            .select("id,name,price,unit,category,stock_quantity,is_available,seller_name,seller_id,image_url")
            .eq("is_available", true)
            .limit(12);
          const term = typeof args.query === "string" ? args.query : undefined;
          if (term) query = query.or(`name.ilike.%${term}%,category.ilike.%${term}%,subtitle.ilike.%${term}%`);
          if (typeof args.category === "string") query = query.ilike("category", `%${args.category}%`);
          if (typeof args.max_price === "number") query = query.lte("price", args.max_price);
          const { data: products } = await query;
          // Trim to only what the model needs to reason/answer with — image_url and is_available
          // are display-only and just burn tokens against Groq's per-minute limit.
          const slim = (products ?? []).map(({ id, name, price, unit, category, stock_quantity, seller_id, seller_name }) => ({
            id, name, price, unit, category, stock_quantity, seller_id, seller_name,
          }));
          return { result: slim };
        }

        if (name === "get_my_orders") {
          if (!user) return { result: { error: "not_signed_in" } };
          const limit = typeof args.limit === "number" ? args.limit : 5;
          const { data: orders } = await supabase
            .from("orders")
            .select("id,status,total,created_at,order_items(product_name,quantity)")
            .eq("customer_id", user.id)
            .order("created_at", { ascending: false })
            .limit(limit);
          return { result: orders ?? [] };
        }

        if (name === "present_shopping_list") {
          const requested = Array.isArray(args.items) ? (args.items as { product_id?: string; quantity?: number }[]) : [];
          const ids = requested.map((i) => i.product_id).filter((id): id is string => typeof id === "string");
          const { data: validProducts } = ids.length
            ? await supabase.from("products").select("*").in("id", ids)
            : { data: [] as ProductRow[] };
          const byId = new Map((validProducts ?? []).map((p) => [p.id, p as ProductRow]));
          const items: ShoppingListItem[] = requested
            .filter((i) => i.product_id && byId.has(i.product_id))
            .map((i) => ({ ...byId.get(i.product_id!)!, quantity: typeof i.quantity === "number" && i.quantity > 0 ? i.quantity : 1 }));
          return { terminal: true, final: { message: typeof args.message === "string" ? args.message : "Here's what I found.", data: items } };
        }

        return { result: {} };
      },
    });

    let conversationId = body.conversationId;
    if (user) {
      if (!conversationId) {
        const { data: conversation } = await supabase.from("assistant_conversations").insert({ user_id: user.id }).select("id").single();
        conversationId = conversation?.id;
      }
      if (conversationId) {
        await supabase.from("assistant_messages").insert([
          { conversation_id: conversationId, role: "user", content: latest },
          { conversation_id: conversationId, role: "assistant", content },
        ]);
      }
    }

    return json({ content, items: (data as ShoppingListItem[] | undefined) ?? [], conversationId });
  } catch (error) {
    console.error("[api/assistant] request failed:", error);
    return json({ error: error instanceof Error ? error.message : "The assistant could not respond." }, { status: 502 });
  }
}
