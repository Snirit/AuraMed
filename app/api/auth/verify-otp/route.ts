import { NextResponse } from "next/server";
import { readJson, writeJson, withLock } from "@/lib/storage";
import { User } from "@/lib/types";
import { createSessionToken } from "@/lib/auth/session";

type OtpStore = Record<string, { otp: string; expiresAt: string; attempts: number }>;

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

    // Demo bypass: log in as Priya without OTP check
    if (phone === "demo" || phone.toLowerCase().includes("demo")) {
      const priya = users.find((u) => u.id === "user_priya_001");
      if (!priya) {
        return NextResponse.json(
          { error: "Demo user not found", code: "NO_DEMO_USER" },
          { status: 500 }
        );
      }
      return NextResponse.json({
        user: priya,
        sessionToken: createSessionToken(priya.id),
      });
    }

    if (!otp) {
      return NextResponse.json(
        { error: "OTP is required", code: "MISSING_OTP" },
        { status: 400 }
      );
    }

    const result = await withLock("otp-store.json", async () => {
      const store = await readJson<OtpStore>("otp-store.json");
      const record = store[phone];

      if (!record) {
        return { error: "No OTP requested for this phone", code: "OTP_NOT_FOUND", status: 404 };
      }

      // Check lockout (3 wrong attempts → lock for 1 minute)
      if (record.attempts >= 3) {
        const lockExpiresAt = new Date(record.expiresAt).getTime() + 60 * 1000;
        if (Date.now() < lockExpiresAt) {
          return { error: "Too many attempts. Try again in 1 minute.", code: "LOCKED", status: 429 };
        }
        // Reset attempts after lockout
        record.attempts = 0;
      }

      // Check expiry
      if (new Date(record.expiresAt).getTime() < Date.now()) {
        delete store[phone];
        await writeJson("otp-store.json", store);
        return { error: "OTP has expired", code: "OTP_EXPIRED", status: 401 };
      }

      // Check OTP match
      if (record.otp !== otp) {
        record.attempts++;
        store[phone] = record;
        await writeJson("otp-store.json", store);
        return { error: "Invalid OTP", code: "INVALID_OTP", status: 401 };
      }

      // Success — clear the OTP
      delete store[phone];
      await writeJson("otp-store.json", store);
      return { success: true };
    });

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: result.status }
      );
    }

    // Find or create user
    let user = users.find((u) => u.phone === phone);
    if (!user) {
      // Auto-create new user with default Priya address as placeholder (MVP)
      const priya = users.find((u) => u.id === "user_priya_001");
      if (priya) {
        user = priya; // For MVP, all phones log in as Priya
      } else {
        return NextResponse.json(
          { error: "Could not create user", code: "USER_CREATION_FAILED" },
          { status: 500 }
        );
      }
    }

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
