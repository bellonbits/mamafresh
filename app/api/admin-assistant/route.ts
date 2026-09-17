import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { runGroqWithTools, type GroqMessage } from "@/lib/assistant/groq";
import { ADMIN_TOOLS, ADMIN_SYSTEM_PROMPT } from "@/lib/assistant/admin-tools";

type Message = { role: "user" | "assistant"; content: string };

function periodStart(period: string): Date {
  const start = new Date();
  if (period === "today") {
    start.setHours(0, 0, 0, 0);
  } else if (period === "yesterday") {
    start.setDate(start.getDate() - 1);
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

function periodEnd(period: string): Date {
  if (period === "yesterday") {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    return end;
  }
  return new Date();
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const body = await request.json() as { messages?: Message[] };
  const messages = body.messages?.slice(-12) ?? [];
  const latest = messages.at(-1)?.content?.trim();
  if (!latest) return NextResponse.json({ error: "Message is required." }, { status: 400 });

  try {
    const { content } = await runGroqWithTools({
      systemPrompt: ADMIN_SYSTEM_PROMPT,
      messages: messages as GroqMessage[],
      tools: ADMIN_TOOLS,
      fallbackMessage: "I couldn't pull that up from the marketplace data just now. Try asking about today, this week, or this month specifically.",
      executeTool: async (name, args) => {
        if (name === "get_sales_summary") {
          const period = typeof args.period === "string" ? args.period : "today";
          const { data: orders } = await supabase
            .from("orders")
            .select("total,status")
            .neq("status", "cancelled")
            .gte("created_at", periodStart(period).toISOString())
            .lte("created_at", periodEnd(period).toISOString());
          const rows = orders ?? [];
          const total = rows.reduce((sum, o) => sum + o.total, 0);
          return { result: { period, orders_count: rows.length, total_sales: total, average_order_value: rows.length ? Math.round(total / rows.length) : 0 } };
        }

        if (name === "get_top_sellers") {
          const period = typeof args.period === "string" ? args.period : "week";
          const limit = typeof args.limit === "number" ? args.limit : 10;
          const { data: orders } = await supabase
            .from("orders")
            .select("total,seller_id,sellers(name)")
            .neq("status", "cancelled")
            .gte("created_at", periodStart(period).toISOString());
          const totals = new Map<string, { seller_name: string; revenue: number; orders: number }>();
          for (const o of (orders ?? []) as unknown as { total: number; seller_id: string | null; sellers: { name: string } | null }[]) {
            if (!o.seller_id) continue;
            const entry = totals.get(o.seller_id) ?? { seller_name: o.sellers?.name ?? "Unknown", revenue: 0, orders: 0 };
            entry.revenue += o.total;
            entry.orders += 1;
            totals.set(o.seller_id, entry);
          }
          const ranked = Array.from(totals.values()).sort((a, b) => b.revenue - a.revenue).slice(0, limit);
          return { result: ranked };
        }

        if (name === "get_sellers_without_orders") {
          const period = typeof args.period === "string" ? args.period : "week";
          const [{ data: sellers }, { data: orders }] = await Promise.all([
            supabase.from("sellers").select("id,name").eq("status", "approved"),
            supabase.from("orders").select("seller_id").gte("created_at", periodStart(period).toISOString()),
          ]);
          const withOrders = new Set((orders ?? []).map((o) => o.seller_id));
          const idle = (sellers ?? []).filter((s) => !withOrders.has(s.id)).map((s) => s.name);
          return { result: idle };
        }

        if (name === "get_top_products") {
          const period = typeof args.period === "string" ? args.period : "week";
          const limit = typeof args.limit === "number" ? args.limit : 20;
          const { data: orders } = await supabase
            .from("orders")
            .select("id,order_items(product_name,quantity,unit_price)")
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
          const ranked = Array.from(totals.entries()).map(([product_name, v]) => ({ product_name, ...v })).sort((a, b) => b.revenue - a.revenue).slice(0, limit);
          return { result: ranked };
        }

        if (name === "get_out_of_stock_products") {
          const { data: products } = await supabase
            .from("products")
            .select("name,seller_name,stock_quantity,is_available")
            .or("stock_quantity.eq.0,is_available.eq.false")
            .limit(50);
          return { result: products ?? [] };
        }

        if (name === "get_orders_by_area") {
          const period = typeof args.period === "string" ? args.period : "week";
          const { data: orders } = await supabase
            .from("orders")
            .select("delivery_address")
            .gte("created_at", periodStart(period).toISOString());
          const counts = new Map<string, number>();
          for (const o of orders ?? []) {
            const area = (o.delivery_address || "Unknown").split(",")[0]?.trim() || "Unknown";
            counts.set(area, (counts.get(area) ?? 0) + 1);
          }
          const ranked = Array.from(counts.entries()).map(([area, order_count]) => ({ area, order_count })).sort((a, b) => b.order_count - a.order_count);
          return { result: ranked };
        }

        if (name === "get_seller_cancellation_rates") {
          const period = typeof args.period === "string" ? args.period : "week";
          const { data: orders } = await supabase
            .from("orders")
            .select("seller_id,status,sellers(name)")
            .gte("created_at", periodStart(period).toISOString());
          const stats = new Map<string, { seller_name: string; total: number; cancelled: number }>();
          for (const o of (orders ?? []) as unknown as { seller_id: string | null; status: string; sellers: { name: string } | null }[]) {
            if (!o.seller_id) continue;
            const entry = stats.get(o.seller_id) ?? { seller_name: o.sellers?.name ?? "Unknown", total: 0, cancelled: 0 };
            entry.total += 1;
            if (o.status === "cancelled") entry.cancelled += 1;
            stats.set(o.seller_id, entry);
          }
          const ranked = Array.from(stats.values())
            .filter((s) => s.total >= 1)
            .map((s) => ({ seller_name: s.seller_name, total_orders: s.total, cancelled_orders: s.cancelled, cancellation_rate_percent: Math.round((s.cancelled / s.total) * 1000) / 10 }))
            .sort((a, b) => b.cancellation_rate_percent - a.cancellation_rate_percent);
          return { result: ranked };
        }

        return { result: {} };
      },
    });

    return NextResponse.json({ content });
  } catch (error) {
    console.error("[api/admin-assistant] request failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "The assistant could not respond." }, { status: 502 });
  }
}
