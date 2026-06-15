"use client";

import {
  Cart,
  MedicationProfile,
  Order,
  Prescription,
  User,
} from "../types";
import seedCarts from "@/data/carts.json";
import seedOrders from "@/data/orders.json";
import seedProfiles from "@/data/medication-profiles.json";
import seedPrescriptions from "@/data/prescriptions.json";
import seedUsers from "@/data/users.json";

/**
 * Browser-side persistence layer for entities that the original implementation
 * wrote to JSON files on disk. Vercel's serverless filesystem is read-only at
 * runtime, so we mirror the data into localStorage instead.
 *
 * Each entity gets its own key. On first access in a fresh browser we copy the
 * bundled seed data from data/*.json so the demo starts in the same shape as
 * localhost.
 */

const KEYS = {
  cart: "auramed_cart_v1",
  orders: "auramed_orders_v1",
  profiles: "auramed_profiles_v1",
  prescriptions: "auramed_prescriptions_v1",
  users: "auramed_users_v1",
  seeded: "auramed_seeded_v1",
} as const;

const SEEDS = {
  cart: seedCarts as Cart[],
  orders: seedOrders as Order[],
  profiles: seedProfiles as MedicationProfile[],
  prescriptions: seedPrescriptions as Prescription[],
  users: seedUsers as User[],
} as const;

/** True only on the client. Guards against any accidental SSR import. */
function canUseStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

function read<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  const raw = window.localStorage.getItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

/**
 * Run once per browser: copy bundled seed JSON into localStorage so the demo
 * starts populated with Priya's seeded cart, orders, and medication profiles.
 * Idempotent — guarded by `KEYS.seeded`.
 */
export function ensureSeeded(): void {
  if (!canUseStorage()) return;
  if (window.localStorage.getItem(KEYS.seeded) === "true") return;

  write(KEYS.cart, SEEDS.cart);
  write(KEYS.orders, SEEDS.orders);
  write(KEYS.profiles, SEEDS.profiles);
  write(KEYS.prescriptions, SEEDS.prescriptions);
  write(KEYS.users, SEEDS.users);
  window.localStorage.setItem(KEYS.seeded, "true");
}

/** Wipe every demo key and re-apply the seed. Used by the Demo Settings reset. */
export function resetSeed(): void {
  if (!canUseStorage()) return;
  for (const key of Object.values(KEYS)) {
    window.localStorage.removeItem(key);
  }
  ensureSeeded();
}

// ====== Carts ======

export function getCarts(): Cart[] {
  ensureSeeded();
  return read<Cart[]>(KEYS.cart, []);
}

export function saveCarts(carts: Cart[]): void {
  write(KEYS.cart, carts);
}

export function upsertCart(updated: Cart): Cart {
  const carts = getCarts();
  const idx = carts.findIndex((c) => c.userId === updated.userId);
  if (idx >= 0) carts[idx] = updated;
  else carts.push(updated);
  saveCarts(carts);
  return updated;
}

// ====== Orders ======

export function getOrders(): Order[] {
  ensureSeeded();
  return read<Order[]>(KEYS.orders, []);
}

export function saveOrders(orders: Order[]): void {
  write(KEYS.orders, orders);
}

// ====== Medication Profiles ======

export function getProfiles(): MedicationProfile[] {
  ensureSeeded();
  return read<MedicationProfile[]>(KEYS.profiles, []);
}

export function saveProfiles(profiles: MedicationProfile[]): void {
  write(KEYS.profiles, profiles);
}

// ====== Prescriptions ======

export function getPrescriptions(): Prescription[] {
  ensureSeeded();
  return read<Prescription[]>(KEYS.prescriptions, []);
}

export function savePrescriptions(prescriptions: Prescription[]): void {
  write(KEYS.prescriptions, prescriptions);
}

// ====== Users ======

export function getUsers(): User[] {
  ensureSeeded();
  return read<User[]>(KEYS.users, []);
}

export function saveUsers(users: User[]): void {
  write(KEYS.users, users);
}
