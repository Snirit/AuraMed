import { NextResponse } from "next/server";
import { readJson, writeJson, withLock } from "@/lib/storage";
import { Prescription, Product, ExtractedMedicine } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { medicineNames, userId = "user_priya_001" } = body;

    if (!Array.isArray(medicineNames) || medicineNames.length === 0) {
      return NextResponse.json(
        { error: "medicineNames array is required", code: "MISSING_MEDICINES" },
        { status: 400 }
      );
    }

    const products = await readJson<Product[]>("products.json");

    // Match each name to a product to infer composition
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

    const newPrescription: Prescription = {
      id: `rx_${Date.now()}`,
      userId,
      imageUrl: "",
      extractedMedicines: extracted,
      uploadedAt: new Date().toISOString(),
    };

    await withLock("prescriptions.json", async () => {
      const all = await readJson<Prescription[]>("prescriptions.json");
      all.unshift(newPrescription);
      await writeJson("prescriptions.json", all);
    });

    return NextResponse.json({
      prescriptionId: newPrescription.id,
      extractedMedicines: extracted,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to create manual prescription", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
