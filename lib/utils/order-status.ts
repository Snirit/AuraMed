import { OrderStatus } from "../types";

/**
 * Compute order status dynamically based on time elapsed since placement.
 * This avoids needing to persist status transitions — it's computed on every read.
 *
 * Timeline: placed (0-4s) → verifying (4-14s) → packed (14-32s) → out_for_delivery (32-62s) → delivered (62s+)
 */
export function computeOrderStatus(placedAt: string): OrderStatus {
  const ageMs = Date.now() - new Date(placedAt).getTime();
  if (ageMs < 4000) return "placed";
  if (ageMs < 14000) return "verifying";
  if (ageMs < 32000) return "packed";
  if (ageMs < 62000) return "out_for_delivery";
  return "delivered";
}
