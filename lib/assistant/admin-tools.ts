import type { ToolDef } from "@/lib/assistant/groq";

export const GET_SALES_SUMMARY_TOOL: ToolDef = {
  name: "get_sales_summary",
  description: "Get the marketplace's real total sales, order count, and average order value for a period. Always call this before stating any sales figure.",
  parameters: {
    type: "object",
    properties: {
      period: { type: "string", enum: ["today", "yesterday", "week", "month"], description: "Time window to summarize" },
    },
    required: ["period"],
  },
};

export const GET_TOP_SELLERS_TOOL: ToolDef = {
  name: "get_top_sellers",
  description: "Get the marketplace's real top-performing sellers by revenue for a period.",
  parameters: {
    type: "object",
    properties: {
      period: { type: "string", enum: ["week", "month"], description: "Time window to analyze" },
      limit: { type: ["number", "null"], description: "How many sellers to return, default 10" },
    },
    required: ["period"],
  },
};

export const GET_SELLERS_WITHOUT_ORDERS_TOOL: ToolDef = {
  name: "get_sellers_without_orders",
  description: "Get approved sellers who have not received any order within a period — useful for identifying inactive/at-risk sellers.",
  parameters: {
    type: "object",
    properties: {
      period: { type: "string", enum: ["week", "month"], description: "Time window to check" },
    },
    required: ["period"],
  },
};

export const GET_TOP_PRODUCTS_TOOL: ToolDef = {
  name: "get_top_products",
  description: "Get the marketplace's real best-selling products by revenue across all sellers for a period.",
  parameters: {
    type: "object",
    properties: {
      period: { type: "string", enum: ["week", "month"], description: "Time window to analyze" },
      limit: { type: ["number", "null"], description: "How many products to return, default 20" },
    },
    required: ["period"],
  },
};

export const GET_OUT_OF_STOCK_TOOL: ToolDef = {
  name: "get_out_of_stock_products",
  description: "Get real products that are currently out of stock or marked unavailable, across all sellers.",
  parameters: { type: "object", properties: {} },
};

export const GET_ORDERS_BY_AREA_TOOL: ToolDef = {
  name: "get_orders_by_area",
  description: "Get real order counts grouped by delivery area/address for a period — useful for finding which area has the most orders.",
  parameters: {
    type: "object",
    properties: {
      period: { type: "string", enum: ["week", "month"], description: "Time window to analyze" },
    },
    required: ["period"],
  },
};

export const GET_SELLER_CANCELLATION_RATES_TOOL: ToolDef = {
  name: "get_seller_cancellation_rates",
  description: "Get real per-seller order cancellation rates for a period — useful for finding sellers with quality/fulfillment problems.",
  parameters: {
    type: "object",
    properties: {
      period: { type: "string", enum: ["week", "month"], description: "Time window to analyze" },
    },
    required: ["period"],
  },
};

export const ADMIN_TOOLS: ToolDef[] = [
  GET_SALES_SUMMARY_TOOL,
  GET_TOP_SELLERS_TOOL,
  GET_SELLERS_WITHOUT_ORDERS_TOOL,
  GET_TOP_PRODUCTS_TOOL,
  GET_OUT_OF_STOCK_TOOL,
  GET_ORDERS_BY_AREA_TOOL,
  GET_SELLER_CANCELLATION_RATES_TOOL,
];

export const ADMIN_SYSTEM_PROMPT = `You are MamaFresh AI, the operations assistant for the marketplace administrator running the whole platform — not a single seller or shopper. Speak like a sharp operations analyst: plain, direct sentences, no markdown (no **bold**, no ## headers, no bullet asterisks). Keep answers short and decision-useful; an admin is busy running the marketplace, not reading a report.

Rules:
- Never invent a sales figure, seller name, product name, or count. Always call the relevant tool before answering a question about sales, sellers, products, orders, or areas.
- If a tool returns no data, say so plainly instead of making up numbers.
- Prices are in Kenyan Shillings (KSh).
- When a question is ambiguous about time period, default to "week" and say so.
- When asked something outside marketplace operations, answer briefly and redirect toward how you can help run the marketplace.`;
