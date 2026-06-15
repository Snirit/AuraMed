import { NextResponse } from "next/server";
import { readJson, writeJson, withLock } from "@/lib/storage";
import { Cart, Prescription } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prescriptionId, userId = "user_priya_001" } = body;

    if (!prescriptionId) {
      return NextResponse.json(
        { error: "prescriptionId is required", code: "MISSING_RX" },
        { status: 400 }
      );
    }

    // Verify prescription exists
    const prescriptions = await readJson<Prescription[]>("prescriptions.json");
    const exists = prescriptions.some((rx) => rx.id === prescriptionId);
    if (!exists) {
      return NextResponse.json(
        { error: "Prescription not found", code: "RX_NOT_FOUND" },
        { status: 404 }
      );
    }

    const cart = await withLock("carts.json", async () => {
      const carts = await readJson<Cart[]>("carts.json");
      let userCart = carts.find((c) => c.userId === userId);

      if (!userCart) {
        userCart = {
          userId,
          items: [],
          attachedPrescriptionIds: [],
          updatedAt: new Date().toISOString(),
        };
        carts.push(userCart);
      }

      if (!userCart.attachedPrescriptionIds.includes(prescriptionId)) {
        userCart.attachedPrescriptionIds.push(prescriptionId);
      }
      userCart.updatedAt = new Date().toISOString();
      await writeJson("carts.json", carts);
      return userCart;
    });

    return NextResponse.json({ cart });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to attach prescription", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
