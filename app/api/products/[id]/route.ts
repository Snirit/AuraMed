import { NextResponse } from "next/server";
import { readJson } from "@/lib/storage";
import { Product } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const products = await readJson<Product[]>("products.json");
    const product = products.find((p) => p.id === params.id);

    if (!product) {
      return NextResponse.json(
        { error: "Product not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Find alternatives: same composition (all salts match), different id
    const productSalts = product.composition
      .map((c) => `${c.salt}|${c.strength}`)
      .sort()
      .join(",");

    const alternatives = products.filter((p) => {
      if (p.id === product.id) return false;
      if (p.composition.length !== product.composition.length) return false;
      const pSalts = p.composition.map((c) => `${c.salt}|${c.strength}`).sort().join(",");
      return pSalts === productSalts;
    });

    return NextResponse.json({ product, alternatives });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load product", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
