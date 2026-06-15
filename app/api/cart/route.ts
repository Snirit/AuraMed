import { NextResponse } from "next/server";
import { readJson } from "@/lib/storage";
import { Cart, Product } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "user_priya_001";

    const carts = await readJson<Cart[]>("carts.json");
    let cart = carts.find((c) => c.userId === userId);

    if (!cart) {
      cart = {
        userId,
        items: [],
        attachedPrescriptionIds: [],
        updatedAt: new Date().toISOString(),
      };
    }

    const products = await readJson<Product[]>("products.json");
    const productIds = new Set(cart.items.map((i) => i.productId));
    const resolvedProducts = products.filter((p) => productIds.has(p.id));

    return NextResponse.json({ cart, products: resolvedProducts });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load cart", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
