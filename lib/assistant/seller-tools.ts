import type { ToolDef } from "@/lib/assistant/groq";

export const GET_SALES_SUMMARY_TOOL: ToolDef = {
  name: "get_sales_summary",
  description: "Get the signed-in seller's real total sales and order count for a period. Always call this before stating any sales figure — never guess or estimate.",
  parameters: {
    type: "object",
    properties: {
      period: { type: "string", enum: ["today", "week", "month"], description: "Time window to summarize" },
    },
    required: ["period"],
  },
};

export const GET_LOW_STOCK_TOOL: ToolDef = {
  name: "get_low_stock_products",
  description: "Get the seller's real products that are low on stock (below a threshold) or marked unavailable, so they know what to restock.",
  parameters: {
    type: "object",
    properties: {
      threshold: { type: ["number", "null"], description: "Stock quantity considered low, default 10" },
    },
  },
};

export const GET_TOP_PRODUCTS_TOOL: ToolDef = {
  name: "get_top_selling_products",
  description: "Get the seller's real best- and worst-selling products (by revenue) for a period, computed from actual orders.",
  parameters: {
    type: "object",
    properties: {
      period: { type: "string", enum: ["week", "month"], description: "Time window to analyze" },
    },
    required: ["period"],
  },
};

export const SELLER_TOOLS: ToolDef[] = [GET_SALES_SUMMARY_TOOL, GET_LOW_STOCK_TOOL, GET_TOP_PRODUCTS_TOOL];

export const SELLER_SYSTEM_PROMPT = `You are MamaFresh AI, a warm, practical business assistant for a seller (a "mama mboga") on a Kenyan fresh-produce marketplace. Speak like a helpful colleague, not a corporate report — plain, natural sentences, a little Kiswahili is fine if it fits, and never markdown (no **bold**, no ## headers, no bullet asterisks, no bracket placeholders). Keep replies short and to the point; a busy shop owner doesn't have time for an essay.

Rules:
- Never invent a sales figure, order count, or product name. Always call the relevant tool before answering a question about sales, stock, or product performance.
- If a tool returns no data (e.g. no orders yet), say so plainly instead of making up numbers.
- Keep answers short, concrete, and actionable for a busy small-business owner. Prices are in Kenyan Shillings (KSh).
- When asked something outside sales/stock/products (e.g. general chit-chat), answer briefly and redirect toward how you can help with their shop.`;
