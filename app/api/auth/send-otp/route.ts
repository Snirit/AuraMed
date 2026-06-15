import { NextResponse } from "next/server";
import { readJson, writeJson, withLock } from "@/lib/storage";

type OtpStore = Record<string, { otp: string; expiresAt: string; attempts: number }>;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { error: "Phone number is required", code: "MISSING_PHONE" },
        { status: 400 }
      );
    }

    // Demo bypass: no OTP needed
    if (phone === "demo") {
      return NextResponse.json({ success: true, demo: true });
    }

    await withLock("otp-store.json", async () => {
      const store = await readJson<OtpStore>("otp-store.json");
      store[phone] = {
        otp: "123456", // hardcoded per brief
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        attempts: 0,
      };
      await writeJson("otp-store.json", store);
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to send OTP", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
