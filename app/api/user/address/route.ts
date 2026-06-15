import { NextResponse } from "next/server";
import { readJson, writeJson, withLock } from "@/lib/storage";
import { User } from "@/lib/types";

/**
 * PATCH /api/user/address  { addressId, userId? }
 * Sets the user's `defaultAddressId` — this is the canonical "active delivery address"
 * for the cart, checkout, my-medications, and header chip.
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { addressId, userId = "user_priya_001" } = body;

    if (!addressId) {
      return NextResponse.json(
        { error: "addressId is required", code: "MISSING_ADDRESS" },
        { status: 400 }
      );
    }

    const updatedUser = await withLock("users.json", async () => {
      const users = await readJson<User[]>("users.json");
      const idx = users.findIndex(u => u.id === userId);
      if (idx < 0) {
        return null;
      }
      const user = users[idx];
      const hasAddress = user.addresses.some(a => a.id === addressId);
      if (!hasAddress) {
        return "INVALID_ADDRESS" as const;
      }
      user.defaultAddressId = addressId;
      users[idx] = user;
      await writeJson("users.json", users);
      return user;
    });

    if (updatedUser === null) {
      return NextResponse.json(
        { error: "User not found", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }
    if (updatedUser === "INVALID_ADDRESS") {
      return NextResponse.json(
        { error: "Address does not belong to this user", code: "INVALID_ADDRESS" },
        { status: 400 }
      );
    }

    return NextResponse.json({ user: updatedUser });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to update address", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
