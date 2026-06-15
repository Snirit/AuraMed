import { NextResponse } from "next/server";
import { readJson, writeJson, withLock } from "@/lib/storage";
import { Cart, MedicationProfile, Product } from "@/lib/types";

interface OutOfStockItem {
  productId: string;
  alternatives: Product[];
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId = "user_priya_001" } = body;

    const profiles = await readJson<MedicationProfile[]>("medication-profiles.json");
    const profile = profiles.find((p) => p.id === params.id);
    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found", code: "PROFILE_NOT_FOUND" },
        { status: 404 }
      );
    }

    const products = await readJson<Product[]>("products.json");
    const outOfStockItems: OutOfStockItem[] = [];

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

      // Replace cart contents with profile items
      userCart.items = [];
      userCart.attachedPrescriptionIds = profile.prescriptionId ? [profile.prescriptionId] : [];

      for (const med of profile.medicines) {
        const prod = products.find((p) => p.id === med.lastOrderedProductId);

        if (prod && prod.inStock) {
          userCart.items.push({
            productId: prod.id,
            quantity: 1,
            addedAt: new Date().toISOString(),
          });
        } else if (prod && !prod.inStock) {
          // Find alternatives by composition
          const targetSalts = prod.composition.map((c) => `${c.salt}|${c.strength}`).sort().join(",");
          const alternatives = products.filter((p) => {
            if (p.id === prod.id || !p.inStock) return false;
            if (p.composition.length !== prod.composition.length) return false;
            const pSalts = p.composition.map((c) => `${c.salt}|${c.strength}`).sort().join(",");
            return pSalts === targetSalts;
          });
          outOfStockItems.push({ productId: prod.id, alternatives });
        }
      }

      userCart.updatedAt = new Date().toISOString();
      await writeJson("carts.json", carts);
      return userCart;
    });

    // Mark profile as recently reordered
    await withLock("medication-profiles.json", async () => {
      const all = await readJson<MedicationProfile[]>("medication-profiles.json");
      const idx = all.findIndex((p) => p.id === params.id);
      if (idx >= 0) {
        all[idx].lastOrderedAt = new Date().toISOString();
        await writeJson("medication-profiles.json", all);
      }
    });

    return NextResponse.json({ cart, outOfStockItems });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to reorder", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
