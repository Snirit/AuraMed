"use client";

import { Product } from "../types";
import {
  handleAttachPrescription,
  handleCartAdd,
  handleCartItemDelete,
  handleCartUpdate,
  handleCreateOrder,
  handleCreateProfile,
  handleGetCart,
  handleGetOrders,
  handleGetOrderById,
  handleGetProfiles,
  handleReorderProfile,
  handleSetAddress,
  HandlerResult,
  persistPrescription,
} from "./handlers";
import { ExtractedMedicine } from "../types";

/**
 * Lightweight HTTP-shaped router for browser-side mock handlers. The api-client
 * shim calls `dispatch()` for any path that should run locally. Anything not
 * matched here falls through to a real network fetch.
 */

const DEFAULT_USER_ID = "user_priya_001";

/** Routes that the shim should handle entirely in the browser. */
export const LOCAL_ROUTE_PREFIXES = [
  "/api/cart",
  "/api/orders",
  "/api/medication-profiles",
  "/api/user/address",
] as const;

/**
 * Routes whose server handler still runs (e.g. needs Gemini), but where the
 * client needs to do follow-up persistence on success.
 */
export const HYBRID_ROUTES = [
  "/api/prescriptions/upload",
  "/api/prescriptions/manual",
] as const;

export function isLocalRoute(pathname: string): boolean {
  return LOCAL_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function isHybridRoute(pathname: string): boolean {
  return HYBRID_ROUTES.some((prefix) => pathname.startsWith(prefix));
}

export interface DispatchInput {
  method: string;
  pathname: string;
  searchParams: URLSearchParams;
  body: Record<string, unknown> | undefined;
  products: Product[];
}

export function dispatch(input: DispatchInput): HandlerResult<unknown> {
  const { method, pathname, searchParams, body = {}, products } = input;

  // ----- /api/cart -----
  if (pathname === "/api/cart" && method === "GET") {
    const userId = searchParams.get("userId") ?? DEFAULT_USER_ID;
    return handleGetCart(userId, products);
  }
  if (pathname === "/api/cart/add" && method === "POST") {
    return handleCartAdd(body as never, products);
  }
  if (pathname === "/api/cart/update" && method === "PUT") {
    return handleCartUpdate(body as never, products);
  }
  if (pathname === "/api/cart/attach-prescription" && method === "POST") {
    return handleAttachPrescription(body as never);
  }
  if (pathname.startsWith("/api/cart/item/") && method === "DELETE") {
    const productId = decodeURIComponent(
      pathname.replace("/api/cart/item/", "")
    );
    const userId = searchParams.get("userId") ?? DEFAULT_USER_ID;
    return handleCartItemDelete(productId, userId, products);
  }

  // ----- /api/orders -----
  if (pathname === "/api/orders" && method === "GET") {
    const userId = searchParams.get("userId") ?? DEFAULT_USER_ID;
    return handleGetOrders(userId);
  }
  if (pathname === "/api/orders" && method === "POST") {
    return handleCreateOrder(body as never, products);
  }
  if (pathname.startsWith("/api/orders/") && method === "GET") {
    const id = pathname.replace("/api/orders/", "");
    return handleGetOrderById(id);
  }

  // ----- /api/medication-profiles -----
  if (pathname === "/api/medication-profiles" && method === "GET") {
    const userId = searchParams.get("userId") ?? DEFAULT_USER_ID;
    return handleGetProfiles(userId);
  }
  if (pathname === "/api/medication-profiles" && method === "POST") {
    return handleCreateProfile(body as never, products);
  }
  if (
    pathname.startsWith("/api/medication-profiles/") &&
    pathname.endsWith("/reorder") &&
    method === "POST"
  ) {
    const id = pathname
      .replace("/api/medication-profiles/", "")
      .replace("/reorder", "");
    return handleReorderProfile(id, body as never, products);
  }

  // ----- /api/user/address -----
  if (pathname === "/api/user/address" && method === "PATCH") {
    return handleSetAddress(body as never);
  }

  return {
    status: 404,
    body: { error: `No local handler for ${method} ${pathname}`, code: "NO_LOCAL_HANDLER" },
  };
}

/**
 * Persist a prescription record returned by /api/prescriptions/upload or
 * /api/prescriptions/manual. The server now only does extraction (no writes);
 * the resulting record lives in localStorage on the client.
 */
export function persistExtractedPrescription(
  extractedMedicines: ExtractedMedicine[],
  userId?: string
) {
  return persistPrescription(extractedMedicines, userId);
}
