import { NextResponse } from "next/server";
import { readJson, writeJson, withLock } from "@/lib/storage";
import { MedicationProfile, Cart, Product, ProfileMedicine } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "user_priya_001";

    const all = await readJson<MedicationProfile[]>("medication-profiles.json");
    const profiles = all.filter((p) => p.userId === userId);

    return NextResponse.json({ profiles });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load profiles", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, prescriptionId, userId = "user_priya_001" } = body;

    if (!name) {
      return NextResponse.json(
        { error: "name is required", code: "MISSING_NAME" },
        { status: 400 }
      );
    }

    // Read user's cart and convert items into profile medicines
    const carts = await readJson<Cart[]>("carts.json");
    const userCart = carts.find((c) => c.userId === userId);
    if (!userCart || userCart.items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty — add medicines first", code: "EMPTY_CART" },
        { status: 400 }
      );
    }

    const products = await readJson<Product[]>("products.json");
    const medicines: ProfileMedicine[] = userCart.items
      .map((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (!prod) return null;
        return {
          name: prod.name,
          composition: prod.composition.map((c) => `${c.salt} ${c.strength}`).join(" + "),
          lastOrderedProductId: prod.id,
        };
      })
      .filter((m): m is ProfileMedicine => m !== null);

    const newProfile: MedicationProfile = {
      id: `mp_${Date.now()}`,
      userId,
      name,
      medicines,
      prescriptionId: prescriptionId || "",
      createdAt: new Date().toISOString(),
      lastOrderedAt: new Date().toISOString(),
    };

    await withLock("medication-profiles.json", async () => {
      const all = await readJson<MedicationProfile[]>("medication-profiles.json");
      all.unshift(newProfile);
      await writeJson("medication-profiles.json", all);
    });

    return NextResponse.json({ profile: newProfile });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to create profile", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
