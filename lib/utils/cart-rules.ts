import { Cart, Prescription, Product } from "../types";

/**
 * Pure, environment-agnostic cart rules.
 *
 * These were originally inlined inside the /api/cart/* route handlers, which
 * meant they couldn't run in the browser when we shift writes off the
 * filesystem. Hoisting them here lets both the (legacy) server routes and the
 * browser-side mock-server reuse identical logic.
 */

/** Normalised salt|strength key used to match chemically-equivalent products. */
function compositionKey(product: Product): string {
  return product.composition
    .map((c) => `${c.salt}|${c.strength}`)
    .sort()
    .join(",");
}

/** Same-composition, in-stock alternatives for an out-of-stock product. */
export function findAlternatives(
  outOfStock: Product,
  catalog: Product[]
): Product[] {
  const targetKey = compositionKey(outOfStock);
  return catalog.filter((p) => {
    if (p.id === outOfStock.id || !p.inStock) return false;
    if (p.composition.length !== outOfStock.composition.length) return false;
    return compositionKey(p) === targetKey;
  });
}

/** Does a single Rx mention this product (by name or any salt)? */
function rxMatchesProduct(rx: Prescription, product: Product): boolean {
  return rx.extractedMedicines.some(
    (m) =>
      product.name.toLowerCase().includes(m.name.toLowerCase()) ||
      product.composition.some((c) =>
        m.composition.toLowerCase().includes(c.salt.toLowerCase())
      )
  );
}

/**
 * Find the first user-owned prescription that covers a freshly-added Rx product.
 * Returns undefined when no match is found or the product is not Rx-required.
 */
export function findAutoAttachPrescription(
  product: Product,
  userId: string,
  prescriptions: Prescription[]
): Prescription | undefined {
  if (!product.rxRequired) return undefined;
  return prescriptions
    .filter((rx) => rx.userId === userId)
    .find((rx) => rxMatchesProduct(rx, product));
}

/**
 * Drop prescription attachments that no longer correspond to any Rx item in
 * the cart. Mirrors the prune logic in /api/cart/update and /api/cart/item.
 */
export function pruneOrphanedPrescriptions(
  cart: Cart,
  products: Product[],
  prescriptions: Prescription[]
): string[] {
  if (cart.items.length === 0) return [];

  return cart.attachedPrescriptionIds.filter((rxId) => {
    const rx = prescriptions.find((r) => r.id === rxId);
    if (!rx) return false;

    return cart.items.some((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod || !prod.rxRequired) return false;
      return rxMatchesProduct(rx, prod);
    });
  });
}
