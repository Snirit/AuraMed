import { NextResponse } from "next/server";
import { readJson } from "@/lib/storage";
import { Order } from "@/lib/types";
import { computeOrderStatus } from "@/lib/utils/order-status";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const all = await readJson<Order[]>("orders.json");
    const order = all.find((o) => o.id === params.id);

    if (!order) {
      return NextResponse.json(
        { error: "Order not found", code: "ORDER_NOT_FOUND" },
        { status: 404 }
      );
    }

    const computed =
      order.id === "order_sample_001"
        ? order
        : { ...order, status: computeOrderStatus(order.placedAt) };

    return NextResponse.json({ order: computed });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load order", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
