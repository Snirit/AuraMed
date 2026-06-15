import { NextResponse } from "next/server";
import { readJson } from "@/lib/storage";
import { Product, ExtractedMedicine } from "@/lib/types";

// Persistence moved to the client (lib/mock-server). This route now only
// resolves medicine names against the bundled product catalog so the salt
// composition can be inferred.

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { medicineNames } = body;

    if (!Array.isArray(medicineNames) || medicineNames.length === 0) {
      return NextResponse.json(
        { error: "medicineNames array is required", code: "MISSING_MEDICINES" },
        { status: 400 }
      );
    }

    const products = await readJson<Product[]>("products.json");

    const extracted: ExtractedMedicine[] = medicineNames.map((name: string) => {
      const lower = name.toLowerCase();
      const match = products.find((p) => p.name.toLowerCase().includes(lower));
      const compositionStr = match
        ? match.composition.map((c) => `${c.salt} ${c.strength}`).join(" + ")
        : `${name} Salt`;
      return {
        name,
        composition: compositionStr,
        confidence: "high" as const,
      };
    });

    return NextResponse.json({ extractedMedicines: extracted });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to create manual prescription", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
