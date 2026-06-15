/**
 * Typed fetch wrappers for calling backend API routes from the frontend.
 *
 * On Vercel the server's filesystem is read-only, so any route that mutates
 * data/*.json crashes with EROFS. To keep the demo working in production we
 * intercept those calls here and dispatch them to lib/mock-server, which
 * persists state to localStorage instead. Read-only routes (products,
 * categories, prescription extraction) still hit the real network.
 */

import { Product } from "../types";
import {
  dispatch,
  isHybridRoute,
  isLocalRoute,
  persistExtractedPrescription,
} from "../mock-server/router";

function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auramed_session_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw data; // { error: string, code: string }
  }
  return data as T;
}

/** Split "/api/cart?userId=foo" into pathname + searchParams without needing an origin. */
function parsePath(path: string): { pathname: string; searchParams: URLSearchParams } {
  const [pathname, qs = ""] = path.split("?");
  return { pathname, searchParams: new URLSearchParams(qs) };
}

/** Cached product catalog so each mutation doesn't refetch the bundle. */
let cachedProducts: Product[] | null = null;
let cachedProductsAt = 0;
const PRODUCT_CACHE_MS = 5 * 60 * 1000;

async function loadProducts(): Promise<Product[]> {
  const fresh =
    cachedProducts && Date.now() - cachedProductsAt < PRODUCT_CACHE_MS;
  if (fresh && cachedProducts) return cachedProducts;

  const response = await fetch("/api/products", {
    method: "GET",
    headers: getAuthHeaders(),
  });
  const data = (await response.json()) as { products: Product[] };
  cachedProducts = data.products;
  cachedProductsAt = Date.now();
  return cachedProducts;
}

/** Mimic the throw-on-non-2xx behaviour of the real network helpers. */
async function runLocal<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const { pathname, searchParams } = parsePath(path);
  const products = await loadProducts();
  const result = dispatch({
    method,
    pathname,
    searchParams,
    body: (body as Record<string, unknown> | undefined) ?? undefined,
    products,
  });
  if (result.status < 200 || result.status >= 300) {
    throw result.body;
  }
  return result.body as T;
}

/**
 * Hybrid routes (prescription extraction) still hit the server because they
 * need a secret API key, but the persistence half runs locally.
 */
async function runHybrid<T>(
  method: string,
  path: string,
  body: unknown
): Promise<T> {
  const { pathname } = parsePath(path);
  const response = await fetch(path, {
    method,
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw data;

  if (
    pathname === "/api/prescriptions/upload" ||
    pathname === "/api/prescriptions/manual"
  ) {
    const userId =
      (body as { userId?: string } | undefined)?.userId ?? undefined;
    const prescription = persistExtractedPrescription(
      data.extractedMedicines ?? [],
      userId
    );
    return {
      prescriptionId: prescription.id,
      extractedMedicines: prescription.extractedMedicines,
      rawText: data.rawText,
    } as T;
  }

  return data as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const { pathname } = parsePath(path);
  if (isLocalRoute(pathname)) return runLocal<T>("GET", path);

  const response = await fetch(path, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<T>(response);

  // Opportunistically warm the shim's product cache so mutations that
  // follow don't refetch the catalog.
  if (pathname === "/api/products" && data && typeof data === "object") {
    const maybeProducts = (data as { products?: Product[] }).products;
    if (Array.isArray(maybeProducts)) {
      cachedProducts = maybeProducts;
      cachedProductsAt = Date.now();
    }
  }

  return data;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const { pathname } = parsePath(path);
  if (isLocalRoute(pathname)) return runLocal<T>("POST", path, body);
  if (isHybridRoute(pathname)) return runHybrid<T>("POST", path, body);

  const response = await fetch(path, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const { pathname } = parsePath(path);
  if (isLocalRoute(pathname)) return runLocal<T>("PUT", path, body);

  const response = await fetch(path, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const { pathname } = parsePath(path);
  if (isLocalRoute(pathname)) return runLocal<T>("PATCH", path, body);

  const response = await fetch(path, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
}

export async function apiDelete<T>(path: string): Promise<T> {
  const { pathname } = parsePath(path);
  if (isLocalRoute(pathname)) return runLocal<T>("DELETE", path);

  const response = await fetch(path, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handleResponse<T>(response);
}
