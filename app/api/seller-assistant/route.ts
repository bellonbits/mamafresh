import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { runGroqWithTools, type GroqMessage } from "@/lib/assistant/groq";
import { SELLER_TOOLS, SELLER_SYSTEM_PROMPT } from "@/lib/assistant/seller-tools";

type Message = { role: "user" | "assistant"; content: string };

function periodStart(period: string): Date {
  const start = new Date();
  if (period === "today") {
    start.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }
  return start;
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to your seller account first." }, { status: 401 });

  const { data: seller } = await supabase.from("sellers").select("id,name").eq("owner_id", user.id).maybeSingle();
  if (!seller) return NextResponse.json({ error: "You don't have a shop registered yet." }, { status: 403 });

  const body = await request.json() as { messages?: Message[] };
  const messages = body.messages?.slice(-12) ?? [];
  const latest = messages.at(-1)?.content?.trim();
  if (!latest) return NextResponse.json({ error: "Message is required." }, { status: 400 });

  try {
    const { content } = await runGroqWithTools({
      systemPrompt: `${SELLER_SYSTEM_PROMPT}\n\nThe seller you are helping is "${seller.name}".`,
      messages: messages as GroqMessage[],
      tools: SELLER_TOOLS,
      fallbackMessage: "I couldn't pull that up from your shop's data just now. Try asking about today, this week, or this month specifically.",
      executeTool: async (name, args) => {
        if (name === "get_sales_summary") {
          const period = typeof args.period === "string" ? args.period : "today";
          const { data: orders } = await supabase
            .from("orders")
            .select("total,status")
            .eq("seller_id", seller.id)
            .neq("status", "cancelled")
            .gte("created_at", periodStart(period).toISOString());
          const rows = orders ?? [];
          return { result: { period, orders_count: rows.length, total_sales: rows.reduce((sum, o) => sum + o.total, 0) } };
        }

        if (name === "get_low_stock_products") {
          const threshold = typeof args.threshold === "number" ? args.threshold : 10;
          const { data: products } = await supabase
            .from("products")
            .select("name,stock_quantity,unit,is_available")
            .eq("seller_id", seller.id)
            .or(`stock_quantity.lte.${threshold},is_available.eq.false`);
          return { result: products ?? [] };
        }

        if (name === "get_top_selling_products") {
          const period = typeof args.period === "string" ? args.period : "week";
          const { data: orders } = await supabase
            .from("orders")
            .select("id,created_at,order_items(product_name,quantity,unit_price)")
            .eq("seller_id", seller.id)
            .neq("status", "cancelled")
            .gte("created_at", periodStart(period).toISOString());
          const totals = new Map<string, { quantity: number; revenue: number }>();
          for (const order of orders ?? []) {
            for (const item of (order.order_items ?? []) as { product_name: string; quantity: number; unit_price: number }[]) {
              const entry = totals.get(item.product_name) ?? { quantity: 0, revenue: 0 };
              entry.quantity += item.quantity;
              entry.revenue += item.quantity * item.unit_price;
              totals.set(item.product_name, entry);
            }
          }
          const ranked = Array.from(totals.entries())
            .map(([product_name, v]) => ({ product_name, ...v }))
            .sort((a, b) => b.revenue - a.revenue);
          return { result: ranked };
        }

        return { result: {} };
      },
    });

    return NextResponse.json({ content });
  } catch (error) {
    console.error("[api/seller-assistant] request failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "The assistant could not respond." }, { status: 502 });
  }
}
