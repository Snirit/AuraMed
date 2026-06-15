import { NextResponse } from "next/server";
import { extractPrescription } from "@/lib/ai/gemini";

// Persistence of the resulting prescription record moved to the client
// (lib/mock-server) because Vercel's filesystem is read-only at runtime.
// This route now only does the AI extraction.

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { imageBase64 } = body;

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json(
        { error: "imageBase64 is required", code: "MISSING_IMAGE" },
        { status: 400 }
      );
    }

    // Rough size check: base64 length ~ 4/3 of binary size
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const approxBytes = (cleanBase64.length * 3) / 4;
    if (approxBytes > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "Image exceeds 5MB limit", code: "IMAGE_TOO_LARGE" },
        { status: 413 }
      );
    }

    // Validate it looks like an image (base64 starts with common image headers)
    if (imageBase64.startsWith("data:") && !imageBase64.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "File must be an image", code: "INVALID_FILE_TYPE" },
        { status: 400 }
      );
    }

    let extracted;
    try {
      extracted = await extractPrescription(imageBase64);
    } catch (err: any) {
      // err is { error, code } from gemini.ts
      const code = err?.code || "AI_DOWN";
      const status =
        code === "AI_PARSE_ERROR" ? 422 :
        code === "AI_QUOTA_EXHAUSTED" ? 429 :
        503;
      return NextResponse.json(
        { error: err?.error || "AI extraction failed", code },
        { status }
      );
    }

    return NextResponse.json({
      extractedMedicines: extracted.medicines,
      rawText: extracted.rawText,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to upload prescription", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
