import { NextResponse } from "next/server";
import { readJson, writeJson, withLock } from "@/lib/storage";
import { Cart, Order, OrderItem, Product } from "@/lib/types";
import { computeOrderStatus } from "@/lib/utils/order-status";
import { calculateBill } from "@/lib/utils/bill";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "user_priya_001";

    const all = await readJson<Order[]>("orders.json");
    const orders = all
      .filter((o) => o.userId === userId)
      // Don't dynamically recompute the seeded sample order — preserve its hardcoded status
      .map((o) =>
        o.id === "order_sample_001"
          ? o
          : { ...o, status: computeOrderStatus(o.placedAt) }
      );

    return NextResponse.json({ orders });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load orders", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { addressId, userId = "user_priya_001" } = body;

    if (!addressId) {
      return NextResponse.json(
        { error: "addressId is required", code: "MISSING_ADDRESS" },
        { status: 400 }
      );
    }

    const order = await withLock("carts.json", async () => {
      const carts = await readJson<Cart[]>("carts.json");
      const userCart = carts.find((c) => c.userId === userId);

      if (!userCart || userCart.items.length === 0) {
        return null;
      }

      const products = await readJson<Product[]>("products.json");
      const orderItems: OrderItem[] = [];

      for (const item of userCart.items) {
        const prod = products.find((p) => p.id === item.productId);
        if (!prod) continue;
        orderItems.push({
          productId: prod.id,
          productName: prod.name,
          quantity: item.quantity,
          price: prod.price,
        });
      }

      // Single source of truth: same bill formula as client cart & checkout
      const bill = calculateBill(orderItems);

      const newOrder: Order = {
        id: `order_${Math.floor(Math.random() * 900000 + 100000)}`,
        userId,
        items: orderItems,
        attachedPrescriptionIds: [...userCart.attachedPrescriptionIds],
        addressId,
        bill,
        status: "placed",
        placedAt: new Date().toISOString(),
      };

      // Persist new order
      await withLock("orders.json", async () => {
        const all = await readJson<Order[]>("orders.json");
        all.unshift(newOrder);
        await writeJson("orders.json", all);
      });

      // Clear cart
      userCart.items = [];
      userCart.attachedPrescriptionIds = [];
      userCart.updatedAt = new Date().toISOString();
      await writeJson("carts.json", carts);

      return newOrder;
    });

    if (!order) {
      return NextResponse.json(
        { error: "Cart is empty", code: "EMPTY_CART" },
        { status: 400 }
      );
    }

    return NextResponse.json({ order });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to place order", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
