import { readJson } from "../storage";
import { User } from "../types";

/**
 * Simple MVP auth: token is base64-encoded userId.
 * In production, use JWTs or server sessions.
 */
export function createSessionToken(userId: string): string {
  return Buffer.from(userId).toString("base64");
}

export function decodeSessionToken(token: string): string | null {
  try {
    return Buffer.from(token, "base64").toString("utf-8");
  } catch {
    return null;
  }
}

export async function getUserFromToken(token: string): Promise<User | null> {
  const userId = decodeSessionToken(token);
  if (!userId) return null;

  const users = await readJson<User[]>("users.json");
  return users.find((u) => u.id === userId) ?? null;
}

export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

/**
 * Extract userId from request. Returns userId or null.
 * For MVP, also accepts userId in query params or body as fallback.
 */
export async function requireAuth(request: Request): Promise<string | null> {
  const token = getTokenFromRequest(request);
  if (token) {
    const userId = decodeSessionToken(token);
    if (userId) return userId;
  }
  return null;
}
