import { NextResponse } from "next/server";
import { readJson, writeJson, withLock } from "@/lib/storage";
import { Cart, Product, Prescription } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, quantity = 1, userId = "user_priya_001" } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "productId is required", code: "MISSING_PRODUCT" },
        { status: 400 }
      );
    }

    const products = await readJson<Product[]>("products.json");
    const product = products.find((p) => p.id === productId);

    if (!product) {
      return NextResponse.json(
        { error: "Product not found", code: "PRODUCT_NOT_FOUND" },
        { status: 404 }
      );
    }

    if (!product.inStock) {
      // Find alternatives by composition
      const productSalts = product.composition.map((c) => `${c.salt}|${c.strength}`).sort().join(",");
      const alternatives = products.filter((p) => {
        if (p.id === product.id || !p.inStock) return false;
        if (p.composition.length !== product.composition.length) return false;
        const pSalts = p.composition.map((c) => `${c.salt}|${c.strength}`).sort().join(",");
        return pSalts === productSalts;
      });
      return NextResponse.json(
        { error: "Product is out of stock", code: "OUT_OF_STOCK", alternatives },
        { status: 409 }
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

      // Add or increment
      const existingIdx = userCart.items.findIndex((i) => i.productId === productId);
      if (existingIdx >= 0) {
        userCart.items[existingIdx].quantity += quantity;
      } else {
        userCart.items.push({
          productId,
          quantity,
          addedAt: new Date().toISOString(),
        });
      }

      // Auto-attach matching prescription if product is Rx
      if (product.rxRequired) {
        const prescriptions = await readJson<Prescription[]>("prescriptions.json");
        const userPrescriptions = prescriptions.filter((rx) => rx.userId === userId);
        const matchingRx = userPrescriptions.find((rx) =>
          rx.extractedMedicines.some(
            (m) =>
              product.name.toLowerCase().includes(m.name.toLowerCase()) ||
              product.composition.some((c) =>
                m.composition.toLowerCase().includes(c.salt.toLowerCase())
              )
          )
        );
        if (matchingRx && !userCart.attachedPrescriptionIds.includes(matchingRx.id)) {
          userCart.attachedPrescriptionIds.push(matchingRx.id);
        }
      }

      userCart.updatedAt = new Date().toISOString();
      await writeJson("carts.json", carts);
      return userCart;
    });

    return NextResponse.json({ cart });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to add to cart", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
