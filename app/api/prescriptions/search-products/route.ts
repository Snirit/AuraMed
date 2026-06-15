import { NextResponse } from "next/server";
import { readJson } from "@/lib/storage";
import { Product } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const medicineName = searchParams.get("medicineName")?.trim().toLowerCase() || "";
    const composition = searchParams.get("composition")?.trim().toLowerCase() || "";

    if (!medicineName && !composition) {
      return NextResponse.json(
        { error: "Provide medicineName or composition", code: "MISSING_QUERY" },
        { status: 400 }
      );
    }

    const products = await readJson<Product[]>("products.json");

    // Score each product based on match strength
    const scored = products
      .map((p) => {
        let score = 0;

        if (medicineName) {
          if (p.name.toLowerCase() === medicineName) score += 100;
          else if (p.name.toLowerCase().includes(medicineName)) score += 50;
        }

        if (composition) {
          // Tokenize composition query into salt fragments
          const queryTokens = composition.split(/[\s+,]+/).filter(Boolean);
          for (const token of queryTokens) {
            for (const c of p.composition) {
              if (c.salt.toLowerCase().includes(token)) score += 25;
              if (c.strength.toLowerCase().includes(token)) score += 10;
            }
          }
        }

        return { product: p, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((x) => x.product);

    return NextResponse.json({ matches: scored });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to search products", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
