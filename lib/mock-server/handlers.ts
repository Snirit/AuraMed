"use client";

import {
  Cart,
  CartItem,
  ExtractedMedicine,
  MedicationProfile,
  Order,
  OrderItem,
  Prescription,
  ProfileMedicine,
  Product,
  User,
} from "../types";
import { calculateBill } from "../utils/bill";
import { computeOrderStatus } from "../utils/order-status";
import {
  findAlternatives,
  findAutoAttachPrescription,
  pruneOrphanedPrescriptions,
} from "../utils/cart-rules";
import {
  getCarts,
  getOrders,
  getPrescriptions,
  getProfiles,
  getUsers,
  saveCarts,
  saveOrders,
  savePrescriptions,
  saveProfiles,
  saveUsers,
  upsertCart,
} from "./store";

/**
 * Browser-side reimplementations of every mutation route. Each function returns
 * the same `{ status, body }` shape that the real Next.js route handler would
 * return, so the api-client shim can hand them off transparently to the rest
 * of the app.
 *
 * The product/category catalog is still loaded from the real (read-only) API
 * — we accept it as a parameter rather than re-fetching here, so the api-client
 * shim can pass it in already-resolved.
 */

export interface HandlerResult<T> {
  status: number;
  body: T;
}

const DEFAULT_USER_ID = "user_priya_001";

function emptyCart(userId: string): Cart {
  return {
    userId,
    items: [],
    attachedPrescriptionIds: [],
    updatedAt: new Date().toISOString(),
  };
}

function findOrCreateCart(userId: string): Cart {
  const carts = getCarts();
  return carts.find((c) => c.userId === userId) ?? emptyCart(userId);
}

// ============ GET /api/cart ============

export function handleGetCart(
  userId: string,
  products: Product[]
): HandlerResult<{ cart: Cart; products: Product[] }> {
  const cart = findOrCreateCart(userId);
  const productIds = new Set(cart.items.map((i) => i.productId));
  const resolved = products.filter((p) => productIds.has(p.id));
  return { status: 200, body: { cart, products: resolved } };
}

// ============ POST /api/cart/add ============

export interface CartAddBody {
  productId: string;
  quantity?: number;
  userId?: string;
}

export function handleCartAdd(
  body: CartAddBody,
  products: Product[]
): HandlerResult<unknown> {
  const productId = body.productId;
  const quantity = body.quantity ?? 1;
  const userId = body.userId ?? DEFAULT_USER_ID;

  if (!productId) {
    return {
      status: 400,
      body: { error: "productId is required", code: "MISSING_PRODUCT" },
    };
  }

  const product = products.find((p) => p.id === productId);
  if (!product) {
    return {
      status: 404,
      body: { error: "Product not found", code: "PRODUCT_NOT_FOUND" },
    };
  }

  if (!product.inStock) {
    return {
      status: 409,
      body: {
        error: "Product is out of stock",
        code: "OUT_OF_STOCK",
        alternatives: findAlternatives(product, products),
      },
    };
  }

  const cart = findOrCreateCart(userId);
  const idx = cart.items.findIndex((i) => i.productId === productId);
  if (idx >= 0) {
    cart.items[idx].quantity += quantity;
  } else {
    cart.items.push({
      productId,
      quantity,
      addedAt: new Date().toISOString(),
    });
  }

  // Auto-attach matching prescription for Rx items
  const matchingRx = findAutoAttachPrescription(
    product,
    userId,
    getPrescriptions()
  );
  if (matchingRx && !cart.attachedPrescriptionIds.includes(matchingRx.id)) {
    cart.attachedPrescriptionIds.push(matchingRx.id);
  }

  cart.updatedAt = new Date().toISOString();
  upsertCart(cart);
  return { status: 200, body: { cart } };
}

// ============ PUT /api/cart/update ============

export interface CartUpdateBody {
  productId: string;
  quantity: number;
  userId?: string;
}

export function handleCartUpdate(
  body: CartUpdateBody,
  products: Product[]
): HandlerResult<unknown> {
  const { productId } = body;
  const quantity = body.quantity;
  const userId = body.userId ?? DEFAULT_USER_ID;

  if (!productId || typeof quantity !== "number") {
    return {
      status: 400,
      body: { error: "productId and quantity required", code: "MISSING_FIELDS" },
    };
  }

  const carts = getCarts();
  const cart = carts.find((c) => c.userId === userId);
  if (!cart) {
    return {
      status: 404,
      body: { error: "Cart not found", code: "CART_NOT_FOUND" },
    };
  }

  if (quantity <= 0) {
    cart.items = cart.items.filter((i) => i.productId !== productId);
  } else {
    const idx = cart.items.findIndex((i) => i.productId === productId);
    if (idx >= 0) cart.items[idx].quantity = quantity;
  }

  cart.attachedPrescriptionIds = pruneOrphanedPrescriptions(
    cart,
    products,
    getPrescriptions()
  );

  cart.updatedAt = new Date().toISOString();
  saveCarts(carts);
  return { status: 200, body: { cart } };
}

// ============ DELETE /api/cart/item/[productId] ============

export function handleCartItemDelete(
  productId: string,
  userId: string,
  products: Product[]
): HandlerResult<unknown> {
  const carts = getCarts();
  const cart = carts.find((c) => c.userId === userId);
  if (!cart) {
    return {
      status: 404,
      body: { error: "Cart not found", code: "CART_NOT_FOUND" },
    };
  }

  cart.items = cart.items.filter((i) => i.productId !== productId);
  cart.attachedPrescriptionIds = pruneOrphanedPrescriptions(
    cart,
    products,
    getPrescriptions()
  );
  cart.updatedAt = new Date().toISOString();
  saveCarts(carts);
  return { status: 200, body: { cart } };
}

// ============ POST /api/cart/attach-prescription ============

export interface AttachPrescriptionBody {
  prescriptionId: string;
  userId?: string;
}

export function handleAttachPrescription(
  body: AttachPrescriptionBody
): HandlerResult<unknown> {
  const { prescriptionId } = body;
  const userId = body.userId ?? DEFAULT_USER_ID;

  if (!prescriptionId) {
    return {
      status: 400,
      body: { error: "prescriptionId is required", code: "MISSING_RX" },
    };
  }

  const prescriptions = getPrescriptions();
  if (!prescriptions.some((rx) => rx.id === prescriptionId)) {
    return {
      status: 404,
      body: { error: "Prescription not found", code: "RX_NOT_FOUND" },
    };
  }

  const cart = findOrCreateCart(userId);
  if (!cart.attachedPrescriptionIds.includes(prescriptionId)) {
    cart.attachedPrescriptionIds.push(prescriptionId);
  }
  cart.updatedAt = new Date().toISOString();
  upsertCart(cart);
  return { status: 200, body: { cart } };
}

// ============ GET /api/orders ============

export function handleGetOrders(userId: string): HandlerResult<unknown> {
  const orders = getOrders()
    .filter((o) => o.userId === userId)
    .map((o) =>
      o.id === "order_sample_001"
        ? o
        : { ...o, status: computeOrderStatus(o.placedAt) }
    );
  return { status: 200, body: { orders } };
}

// ============ GET /api/orders/[id] ============

export function handleGetOrderById(id: string): HandlerResult<unknown> {
  const order = getOrders().find((o) => o.id === id);
  if (!order) {
    return {
      status: 404,
      body: { error: "Order not found", code: "ORDER_NOT_FOUND" },
    };
  }
  const computed =
    order.id === "order_sample_001"
      ? order
      : { ...order, status: computeOrderStatus(order.placedAt) };
  return { status: 200, body: { order: computed } };
}

// ============ POST /api/orders ============

export interface OrdersPostBody {
  addressId: string;
  userId?: string;
}

export function handleCreateOrder(
  body: OrdersPostBody,
  products: Product[]
): HandlerResult<unknown> {
  const userId = body.userId ?? DEFAULT_USER_ID;
  if (!body.addressId) {
    return {
      status: 400,
      body: { error: "addressId is required", code: "MISSING_ADDRESS" },
    };
  }

  const carts = getCarts();
  const cart = carts.find((c) => c.userId === userId);
  if (!cart || cart.items.length === 0) {
    return {
      status: 400,
      body: { error: "Cart is empty", code: "EMPTY_CART" },
    };
  }

  const orderItems: OrderItem[] = [];
  for (const item of cart.items) {
    const prod = products.find((p) => p.id === item.productId);
    if (!prod) continue;
    orderItems.push({
      productId: prod.id,
      productName: prod.name,
      quantity: item.quantity,
      price: prod.price,
    });
  }

  const order: Order = {
    id: `order_${Math.floor(Math.random() * 900000 + 100000)}`,
    userId,
    items: orderItems,
    attachedPrescriptionIds: [...cart.attachedPrescriptionIds],
    addressId: body.addressId,
    bill: calculateBill(orderItems),
    status: "placed",
    placedAt: new Date().toISOString(),
  };

  const allOrders = getOrders();
  allOrders.unshift(order);
  saveOrders(allOrders);

  // Clear cart in the same atomic batch as creating the order
  cart.items = [];
  cart.attachedPrescriptionIds = [];
  cart.updatedAt = new Date().toISOString();
  saveCarts(carts);

  return { status: 200, body: { order } };
}

// ============ GET /api/medication-profiles ============

export function handleGetProfiles(userId: string): HandlerResult<unknown> {
  const profiles = getProfiles().filter((p) => p.userId === userId);
  return { status: 200, body: { profiles } };
}

// ============ POST /api/medication-profiles ============

export interface CreateProfileBody {
  name: string;
  prescriptionId?: string;
  userId?: string;
}

export function handleCreateProfile(
  body: CreateProfileBody,
  products: Product[]
): HandlerResult<unknown> {
  const userId = body.userId ?? DEFAULT_USER_ID;
  if (!body.name) {
    return {
      status: 400,
      body: { error: "name is required", code: "MISSING_NAME" },
    };
  }

  const cart = getCarts().find((c) => c.userId === userId);
  if (!cart || cart.items.length === 0) {
    return {
      status: 400,
      body: { error: "Cart is empty — add medicines first", code: "EMPTY_CART" },
    };
  }

  const medicines: ProfileMedicine[] = cart.items
    .map((item): ProfileMedicine | null => {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) return null;
      return {
        name: prod.name,
        composition: prod.composition
          .map((c) => `${c.salt} ${c.strength}`)
          .join(" + "),
        lastOrderedProductId: prod.id,
      };
    })
    .filter((m): m is ProfileMedicine => m !== null);

  const profile: MedicationProfile = {
    id: `mp_${Date.now()}`,
    userId,
    name: body.name,
    medicines,
    prescriptionId: body.prescriptionId || "",
    createdAt: new Date().toISOString(),
    lastOrderedAt: new Date().toISOString(),
  };

  const all = getProfiles();
  all.unshift(profile);
  saveProfiles(all);
  return { status: 200, body: { profile } };
}

// ============ POST /api/medication-profiles/[id]/reorder ============

interface OutOfStockEntry {
  productId: string;
  alternatives: Product[];
}

export function handleReorderProfile(
  profileId: string,
  body: { userId?: string },
  products: Product[]
): HandlerResult<unknown> {
  const userId = body.userId ?? DEFAULT_USER_ID;

  const profiles = getProfiles();
  const profile = profiles.find((p) => p.id === profileId);
  if (!profile) {
    return {
      status: 404,
      body: { error: "Profile not found", code: "PROFILE_NOT_FOUND" },
    };
  }

  const cart = findOrCreateCart(userId);
  cart.items = [];
  cart.attachedPrescriptionIds = profile.prescriptionId
    ? [profile.prescriptionId]
    : [];

  const outOfStockItems: OutOfStockEntry[] = [];

  for (const med of profile.medicines) {
    const prod = products.find((p) => p.id === med.lastOrderedProductId);
    if (prod && prod.inStock) {
      cart.items.push({
        productId: prod.id,
        quantity: 1,
        addedAt: new Date().toISOString(),
      } as CartItem);
    } else if (prod && !prod.inStock) {
      outOfStockItems.push({
        productId: prod.id,
        alternatives: findAlternatives(prod, products),
      });
    }
  }

  cart.updatedAt = new Date().toISOString();
  upsertCart(cart);

  const idx = profiles.findIndex((p) => p.id === profileId);
  if (idx >= 0) {
    profiles[idx].lastOrderedAt = new Date().toISOString();
    saveProfiles(profiles);
  }

  return { status: 200, body: { cart, outOfStockItems } };
}

// ============ PATCH /api/user/address ============

export interface SetAddressBody {
  addressId: string;
  userId?: string;
}

export function handleSetAddress(body: SetAddressBody): HandlerResult<unknown> {
  const userId = body.userId ?? DEFAULT_USER_ID;
  if (!body.addressId) {
    return {
      status: 400,
      body: { error: "addressId is required", code: "MISSING_ADDRESS" },
    };
  }

  const users = getUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx < 0) {
    return {
      status: 404,
      body: { error: "User not found", code: "USER_NOT_FOUND" },
    };
  }

  const user = users[idx];
  if (!user.addresses.some((a) => a.id === body.addressId)) {
    return {
      status: 400,
      body: {
        error: "Address does not belong to this user",
        code: "INVALID_ADDRESS",
      },
    };
  }

  const updated: User = { ...user, defaultAddressId: body.addressId };
  users[idx] = updated;
  saveUsers(users);
  return { status: 200, body: { user: updated } };
}

// ============ Persist prescriptions (called by upload/manual flows) ============

export function persistPrescription(
  extractedMedicines: ExtractedMedicine[],
  userId: string = DEFAULT_USER_ID
): Prescription {
  const prescription: Prescription = {
    id: `rx_${Date.now()}`,
    userId,
    imageUrl: "",
    extractedMedicines,
    uploadedAt: new Date().toISOString(),
  };
  const all = getPrescriptions();
  all.unshift(prescription);
  savePrescriptions(all);
  return prescription;
}
