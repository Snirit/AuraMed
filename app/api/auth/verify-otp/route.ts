import { NextResponse } from "next/server";
import { readJson } from "@/lib/storage";
import { User } from "@/lib/types";
import { createSessionToken } from "@/lib/auth/session";

// Stateless OTP verification — accepts the demo OTP from the brief and the
// "demo" phone bypass. State previously kept in data/otp-store.json can't be
// written on Vercel, so we trust the in-page hint (OTP 123456) instead.

const DEMO_OTP = "123456";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, otp } = body;

    if (!phone) {
      return NextResponse.json(
        { error: "Phone is required", code: "MISSING_PHONE" },
        { status: 400 }
      );
    }

    const users = await readJson<User[]>("users.json");
    const priya = users.find((u) => u.id === "user_priya_001");
    if (!priya) {
      return NextResponse.json(
        { error: "Demo user not found", code: "NO_DEMO_USER" },
        { status: 500 }
      );
    }

    const isDemoPhone =
      phone === "demo" || phone.toLowerCase().includes("demo");

    if (!isDemoPhone) {
      if (!otp) {
        return NextResponse.json(
          { error: "OTP is required", code: "MISSING_OTP" },
          { status: 400 }
        );
      }
      if (otp !== DEMO_OTP) {
        return NextResponse.json(
          { error: "Invalid OTP", code: "INVALID_OTP" },
          { status: 401 }
        );
      }
    }

    // For MVP, every phone logs in as Priya (matches the previous behaviour).
    const user = users.find((u) => u.phone === phone) ?? priya;

    return NextResponse.json({
      user,
      sessionToken: createSessionToken(user.id),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to verify OTP", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
