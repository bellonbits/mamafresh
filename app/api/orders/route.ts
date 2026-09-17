import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CartOrderItem } from "@/lib/supabase/types";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in before placing an order." }, { status: 401 });

  const body = await request.json() as {
    sellerId?: string;
    items?: CartOrderItem[];
    address?: string;
    orderType?: "delivery" | "pickup";
    paymentMethod?: string;
    notes?: string;
  };
  if (!body.items?.length) return NextResponse.json({ error: "Add at least one product." }, { status: 400 });

  const productIds = body.items.map((item) => item.product_id);
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id,name,price,stock_quantity,seller_id")
    .in("id", productIds)
    .eq("is_available", true);
  if (productsError) return NextResponse.json({ error: productsError.message }, { status: 500 });
  if (!products || products.length !== body.items.length) return NextResponse.json({ error: "One or more products are unavailable." }, { status: 409 });

  const requested = new Map(body.items.map((item) => [item.product_id, item.quantity]));
  const sellerIds = new Set(products.map((product) => product.seller_id).filter(Boolean));
  if (sellerIds.size > 1) return NextResponse.json({ error: "Please order from one seller at a time." }, { status: 400 });
  const lineItems = products.map((product) => ({
    product_id: product.id,
    product_name: product.name,
    quantity: requested.get(product.id) ?? 1,
    unit_price: product.price,
  }));
  const subtotal = lineItems.reduce((total, item) => total + item.quantity * item.unit_price, 0);

  const { data: order, error: orderError } = await supabase.from("orders").insert({
    customer_id: user.id,
    seller_id: body.sellerId ?? products[0].seller_id,
    order_type: body.orderType ?? "delivery",
    payment_method: body.paymentMethod ?? "cash",
    delivery_address: body.address ?? "",
    notes: body.notes ?? "",
    subtotal,
    delivery_fee: body.orderType === "pickup" ? 0 : 50,
    total: subtotal + (body.orderType === "pickup" ? 0 : 50),
  }).select("id,status").single();
  if (orderError || !order) return NextResponse.json({ error: orderError?.message ?? "Unable to create order." }, { status: 500 });

  const { error: itemsError } = await supabase.from("order_items").insert(lineItems.map((item) => ({ ...item, order_id: order.id })));
  if (itemsError) {
    await supabase.from("orders").delete().eq("id", order.id);
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }
  return NextResponse.json({ order });
}