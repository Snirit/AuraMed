import { NextResponse } from "next/server";

// OTP "delivery" is purely cosmetic in this demo — the brief hardcodes the
// real OTP to 123456 (see /login page hint). Writing to data/otp-store.json
// fails on Vercel's read-only filesystem, so we just acknowledge the request.
// The verify-otp route accepts 123456 for any phone, plus a "demo" bypass.

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

    if (phone === "demo") {
      return NextResponse.json({ success: true, demo: true });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to send OTP", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
