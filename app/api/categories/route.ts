import { NextResponse } from "next/server";
import { readJson } from "@/lib/storage";
import { Category } from "@/lib/types";

export async function GET() {
  try {
    const categories = await readJson<Category[]>("categories.json");
    return NextResponse.json({ categories });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load categories", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
