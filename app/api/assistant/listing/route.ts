import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json() as { name?: string; price?: number; unit?: string; category?: string };
  const name = body.name?.trim();
  if (!name) return NextResponse.json({ error: "Product name is required." }, { status: 400 });

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return NextResponse.json({ error: "The assistant is not configured yet." }, { status: 503 });

  const prompt = `Write a short, honest product listing for a Kenyan fresh-produce marketplace stall.
Product: ${name}
Category: ${body.category ?? "Groceries"}
Price: KSh ${body.price ?? "?"} per ${body.unit ?? "unit"}

Write one or two plain sentences describing the product (freshness, typical use) — do not invent certifications like "organic" or specific origin claims that weren't given. Do not repeat the price. Reply with only the description text, no heading.`;

  const response = await fetch(`${process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1"}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL ?? "openai/gpt-oss-120b",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
    }),
  });
  if (!response.ok) return NextResponse.json({ error: "The assistant could not respond." }, { status: 502 });
  const result = await response.json() as { choices?: [{ message?: { content?: string } }] };
  const description = result.choices?.[0]?.message?.content?.trim() ?? "";
  return NextResponse.json({ description });
}
