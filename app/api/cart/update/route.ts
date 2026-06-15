import { NextResponse } from "next/server";
import { readJson, writeJson, withLock } from "@/lib/storage";
import { Cart, Product, Prescription } from "@/lib/types";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { productId, quantity, userId = "user_priya_001" } = body;

    if (!productId || typeof quantity !== "number") {
      return NextResponse.json(
        { error: "productId and quantity required", code: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

    const cart = await withLock("carts.json", async () => {
      const carts = await readJson<Cart[]>("carts.json");
      const userCart = carts.find((c) => c.userId === userId);

      if (!userCart) {
        return null;
      }

      if (quantity <= 0) {
        userCart.items = userCart.items.filter((i) => i.productId !== productId);
      } else {
        const idx = userCart.items.findIndex((i) => i.productId === productId);
        if (idx >= 0) {
          userCart.items[idx].quantity = quantity;
        }
      }

      // Prune orphaned prescription attachments
      if (userCart.items.length === 0) {
        userCart.attachedPrescriptionIds = [];
      } else {
        const products = await readJson<Product[]>("products.json");
        const prescriptions = await readJson<Prescription[]>("prescriptions.json");

        userCart.attachedPrescriptionIds = userCart.attachedPrescriptionIds.filter((rxId) => {
          const rx = prescriptions.find((r) => r.id === rxId);
          if (!rx) return false;
          return userCart!.items.some((item) => {
            const prod = products.find((p) => p.id === item.productId);
            if (!prod || !prod.rxRequired) return false;
            return rx.extractedMedicines.some(
              (m) =>
                prod.name.toLowerCase().includes(m.name.toLowerCase()) ||
                prod.composition.some((c) =>
                  m.composition.toLowerCase().includes(c.salt.toLowerCase())
                )
            );
          });
        });
      }

      userCart.updatedAt = new Date().toISOString();
      await writeJson("carts.json", carts);
      return userCart;
    });

    if (!cart) {
      return NextResponse.json(
        { error: "Cart not found", code: "CART_NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({ cart });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to update cart", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
