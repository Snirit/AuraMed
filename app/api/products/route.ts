import { NextResponse } from "next/server";
import { readJson } from "@/lib/storage";
import { Product } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase();
    const category = searchParams.get("category")?.trim().toLowerCase();
    const composition = searchParams.get("composition")?.trim().toLowerCase();

    let products = await readJson<Product[]>("products.json");

    if (category) {
      products = products.filter((p) => p.category.toLowerCase() === category);
    }

    if (composition) {
      products = products.filter((p) =>
        p.composition.some(
          (c) =>
            c.salt.toLowerCase().includes(composition) ||
            c.strength.toLowerCase().includes(composition)
        )
      );
    }

    if (search) {
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.manufacturer.toLowerCase().includes(search) ||
          p.composition.some(
            (c) =>
              c.salt.toLowerCase().includes(search) ||
              c.strength.toLowerCase().includes(search)
          ) ||
          p.category.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({ products });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load products", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
