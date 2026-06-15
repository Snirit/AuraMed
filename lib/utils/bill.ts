import { Bill } from "../types";

/**
 * Pricing thresholds — single source of truth for the entire app.
 * Used by cart page, checkout page, order tracking, and the backend
 * POST /api/orders route, so client and server can never silently drift.
 */
export const FREE_DELIVERY_MIN = 500; // free delivery when items total exceeds this
export const FLAT_DELIVERY_FEE = 30;
export const DISCOUNT_THRESHOLD = 300; // generic switch discount kicks in above this
export const DISCOUNT_AMOUNT = 50;

export interface BillableItem {
  price: number;
  quantity: number;
}

/**
 * Compute the canonical bill for a set of cart/order items.
 * Empty cart → all zeros (no phantom delivery fee).
 */
export function calculateBill(items: BillableItem[]): Bill {
  const itemsTotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (itemsTotal === 0) {
    return { itemsTotal: 0, deliveryFee: 0, discount: 0, totalPayable: 0 };
  }

  const deliveryFee = itemsTotal > FREE_DELIVERY_MIN ? 0 : FLAT_DELIVERY_FEE;
  const discount = itemsTotal > DISCOUNT_THRESHOLD ? DISCOUNT_AMOUNT : 0;
  const totalPayable = itemsTotal + deliveryFee - discount;

  return { itemsTotal, deliveryFee, discount, totalPayable };
}
