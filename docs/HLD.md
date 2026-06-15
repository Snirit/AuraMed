# AuraMed — High-Level Design

> **Status:** Living document · **Last reviewed:** Pune build, June 2026 · **Scope:** Demo-grade architecture, single user (Priya), JSON-file persistence.

## 1. Product in One Paragraph

AuraMed is a caregiver-first medicine quick-commerce app. Its protagonist is Priya — a 32-year-old in Bangalore managing chronic prescriptions for her parents in Pune. The flagship flows are: **upload prescription image → AI extracts medicines → match to catalog → checkout in under 60 seconds**, and **one-tap reorder of saved "medication profiles"** for repeat refills. Built as a Next.js 14 single-page demo with file-based persistence and real Google Gemini AI for OCR — no traditional database, no third-party state library.

---

## 2. The Four-Layer Architecture

The whole repo can be understood as four stacked layers, each with one job. Nothing in a higher layer talks directly to a lower layer two steps below.

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 4 — UI Pages & Components                             │
│   app/{home,cart,checkout,...}/page.tsx                     │
│   components/{ProductCard, BillSummary, AddressSelector...} │
│   → only reads useMockStore(), renders JSX                  │
└──────────────────────────┬──────────────────────────────────┘
                           │ React Context
┌──────────────────────────▼──────────────────────────────────┐
│ Layer 3 — Mock Store (client state)                         │
│   lib/mock-store.tsx · MockStoreProvider · useMockStore()   │
│   → fetches once on mount, optimistic updates, rollback     │
└──────────────────────────┬──────────────────────────────────┘
                           │ fetch()
┌──────────────────────────▼──────────────────────────────────┐
│ Layer 2 — Backend API Routes                                │
│   app/api/*/route.ts (18 endpoints)                         │
│   → validates, calls Gemini, reads/writes through Layer 1   │
└──────────────────────────┬──────────────────────────────────┘
                           │ fs + Gemini REST
┌──────────────────────────▼──────────────────────────────────┐
│ Layer 1 — Storage + External AI                             │
│   lib/storage/index.ts  (readJson/writeJson + mutex)        │
│   lib/ai/gemini.ts      (Gemini 2.5-flash + fallback)       │
│   /data/*.json          (8 files acting as the "database")  │
└─────────────────────────────────────────────────────────────┘

Cross-cutting (used by both API and UI):
  lib/types/index.ts         Shared TypeScript contracts
  lib/utils/bill.ts          calculateBill() — single source of truth
  lib/utils/order-status.ts  computeOrderStatus() — time-derived
```

### Why this layering matters
A page (`app/cart/page.tsx`) doesn't know the API exists; it just calls `useMockStore().addToCart(...)`. The store knows the API but not the JSON files. The API knows the storage helpers but not Gemini's URL format. Each layer can be swapped (e.g., JSON → Postgres) without touching the others, as long as the contract above it is preserved.

---

## 3. Layer 1 — Storage and External AI

### 3.1 The "database": eight JSON files in `/data/`

| File | Holds | Notes |
|------|-------|-------|
| `products.json` | 74 catalog items (10 categories) | Static; never written by the app |
| `categories.json` | 10 categories with slugs and icons | Static |
| `users.json` | 1 user — Priya, with 2 saved addresses | Written when active address changes |
| `prescriptions.json` | All uploaded/manual prescriptions | Append-only |
| `medication-profiles.json` | 2 seeded profiles + user-created | Written on profile create/reorder |
| `carts.json` | One cart per user | Written on every cart mutation |
| `orders.json` | All placed orders + 1 seeded sample | Append-only; status is *never* persisted past `placed` |
| `otp-store.json` | Ephemeral OTPs keyed by phone | Cleared on verify |

### 3.2 `lib/storage/index.ts` — atomic JSON I/O with an in-process mutex

```ts
const locks = new Map<string, Promise<void>>();   // module-scoped singleton
withLock(file, fn)  // serializes concurrent writes per filename
readJson<T>(file)
writeJson<T>(file, data)   // writes to .tmp then renames — POSIX-atomic
```

The mutex is **per-file, in-memory, and lives for the lifetime of the Node process**. It's enough to keep concurrent API requests within one dev server from corrupting a file — but it would NOT work across multiple Node processes (a real production constraint we'll discuss in §10).

### 3.3 `lib/ai/gemini.ts` — Google Gemini vision with fallback chain

The brief required real AI, not a simulation. The module:
1. Reads `GEMINI_API_KEY` from `.env.local`
2. Tries models in order: `gemini-2.5-flash` → `gemini-2.0-flash` → `gemini-2.0-flash-lite`. Falls back on `429` quota errors only.
3. Sends a strict prompt instructing the model to output JSON with `{ medicines: [{name, composition, confidence}], rawText }`. Ignores doctor info / dosing / handwriting.
4. Throws typed errors: `AI_QUOTA_EXHAUSTED`, `AI_DOWN`, `AI_PARSE_ERROR`. Empty extractions return successfully so the UI can prompt manual entry.

The fallback chain was added during testing when the supplied API key turned out to have zero free-tier quota on the default model.

---

## 4. Layer 2 — Backend API Routes

All routes live under `app/api/` and follow Next.js 14 App Router conventions (one `route.ts` per endpoint). Every response is JSON. Errors uniformly return `{ error: string, code: string }` with appropriate HTTP status.

### 4.1 Endpoint inventory (18 routes)

| Group | Endpoint | Method | Purpose |
|---|---|---|---|
| **Auth** | `/api/auth/send-otp` | POST | Hardcodes OTP `123456` in `otp-store.json`. `phone:"demo"` bypasses. |
| | `/api/auth/verify-otp` | POST | Validates OTP, returns `{ user, sessionToken }`. Token = base64-encoded userId. |
| **Products** | `/api/products` | GET | Filters by `?search=&category=&composition=` |
| | `/api/products/[id]` | GET | Returns product + alternatives by same composition |
| **Categories** | `/api/categories` | GET | All 10 categories |
| **Prescriptions** | `/api/prescriptions/upload` | POST | base64 image → Gemini → save to `prescriptions.json` |
| | `/api/prescriptions/manual` | POST | Typed medicine names → match catalog → save |
| | `/api/prescriptions/search-products` | GET | Score products against `?medicineName=&composition=` |
| **Cart** | `/api/cart` | GET | Returns cart + resolved product details |
| | `/api/cart/add` | POST | Add/increment; auto-attaches matching Rx for Rx products |
| | `/api/cart/update` | PUT | Set quantity (0 = remove); prunes orphan Rx attachments |
| | `/api/cart/item/[productId]` | DELETE | Remove item; same Rx pruning logic |
| | `/api/cart/attach-prescription` | POST | Attach a saved Rx to active cart |
| **Profiles** | `/api/medication-profiles` | GET/POST | List or create from current cart |
| | `/api/medication-profiles/[id]/reorder` | POST | Rebuild cart from profile's last-ordered products; returns out-of-stock alternatives |
| **Orders** | `/api/orders` | GET/POST | List (with computed status) / Create from cart |
| | `/api/orders/[id]` | GET | Single order with computed status |
| **User** | `/api/user/address` | PATCH | Set active address (`defaultAddressId`) |

### 4.2 Recurring patterns

- **Mutation routes use `withLock(file, ...)`** to read → modify → write atomically.
- **Reads use `readJson()` directly** (no lock needed for stale-tolerant reads).
- **userId defaults to `"user_priya_001"`** because the demo has one user. Token-based auth is wired (`lib/auth/session.ts`) but routes don't strictly require it — by design, since the live demo and curl tests need to work without bouncing through login.

---

## 5. Layer 3 — Mock Store (`lib/mock-store.tsx`)

### 5.1 What it is

A single React Context that holds **all data the UI needs**: `products`, `categories`, `currentUser`, `cart`, `medicationProfiles`, `orders`, `prescriptions`, plus the `isFtuxMode` demo toggle. Despite the legacy name "mock-store" (kept to avoid touching 12 consumer files), today it's a real API client with optimistic updates.

### 5.2 Lifecycle

1. **On mount** — reads cached `currentUser` from localStorage, then `refreshAll()` fires five parallel `apiGet`s (products, categories, cart, profiles, orders).
2. **Mutations** — each action (`addToCart`, `updateCartItem`, `placeOrder`, `setActiveAddress`, …) follows the same pattern:
   ```
   const prev = currentState
   setCurrentState(optimisticUpdate)
   try { setCurrentState(await api.call()) }
   catch { setCurrentState(prev) }   // rollback
   ```
3. **Order-status ticker** — a 2-second `setInterval` recomputes `computeOrderStatus(placedAt)` client-side so the timeline ticks even between API calls. No re-fetch happens here.
4. **No polling.** The app does not poll. State is mutation-driven.

### 5.3 What lives in localStorage

Only two things, both lightweight session cache:
- `auramed_session_token` — base64 userId, set on login
- `auramed_current_user` — JSON cache so the next reload paints instantly before `refreshAll` returns

Everything that *used to* live in localStorage (selected address, cart, profiles, orders, prescriptions) is now server-persisted.

---

## 6. Layer 4 — UI Pages and Reusable Components

### 6.1 Page inventory

| Route | Purpose |
|---|---|
| `/login` | Phone + OTP or Demo Mode button |
| `/` | Home — FTUX hero OR returning-user dashboard depending on store state |
| `/search?q=` | Catalog search with sidebar filters (Rx, brand/generic, price range) |
| `/category/[slug]` | Category landing page |
| `/product/[id]` | Product detail with composition table and same-salt alternatives |
| `/upload-prescription` | 3-step wizard: upload/manual → AI extraction → product matching |
| `/cart` | Rx vs OTC split, prescription attach, save-as-profile, bill summary |
| `/checkout` | Address + payment + bill, "Confirm & Pay" |
| `/order/[id]` | Live status timeline (placed → verifying → packed → out_for_delivery → delivered) |
| `/my-medications` | Saved profile cards + reorder + active-address banner |

### 6.2 Shared components (`/components/`)

The design system principle: **one canonical component per concept, with layout variants instead of forks**.

| Component | Purpose |
|---|---|
| `ProductCard` | Image, badges (Rx/Generic), name, composition, price, ADD→qty stepper. Variants: `default`, `compact`, `highlight-generic`. Optional `onAdd` for Rx attachment side-effects. |
| `BillSummary` | Items total, delivery fee, generic discount, total payable. Optional line items list, optional CTA, optional hint banner. Used by cart, checkout, and order tracking. |
| `AddressSelector` | Reads `currentUser.defaultAddressId`; popover with saved addresses; calls `setActiveAddress()`. Variants: `default`, `header`, `compact`. |
| `Header`, `AppShell`, `AuthGuard` | Layout shell; `AppShell` hides chrome on `/login`; `AuthGuard` redirects unauthenticated users. |
| `DemoSettings` | Floating panel: toggle FTUX mode, reset database. |
| `ui/Button`, `ui/Input`, `ui/Badge`, `ui/EmptyState`, `ui/SectionHeader` | Primitive layout building blocks. |

### 6.3 Cross-cutting utilities

- **`lib/utils/bill.ts`** — `calculateBill(items)` returns `{ itemsTotal, deliveryFee, discount, totalPayable }`. Exported thresholds: `FREE_DELIVERY_MIN=500`, `DISCOUNT_THRESHOLD=300`. Used by cart page, checkout page, AND the backend `/api/orders` route — so client and server can never silently drift.
- **`lib/utils/order-status.ts`** — `computeOrderStatus(placedAt)` is pure and used by both backend (at read time) and the client ticker. Status timeline is time-derived, never persisted past `"placed"`.

---

## 7. Data Model (the contracts that bind everything)

All defined once in `lib/types/index.ts`:

```ts
User    { id, name, phone, defaultAddressId, addresses[] }
Address { id, label, line1, line2?, city, pincode }

Product { id, name, manufacturer, composition[], packSize,
          price, mrp, rxRequired, inStock, imageUrl, description,
          category, isGeneric }
CompositionEntry { salt, strength }
Category { slug, name, iconUrl }

Prescription { id, userId, imageUrl, extractedMedicines[], uploadedAt }
ExtractedMedicine { name, composition, confidence: "high"|"low" }

Cart       { userId, items[], attachedPrescriptionIds[], updatedAt }
CartItem   { productId, quantity, addedAt }

MedicationProfile { id, userId, name, medicines[], prescriptionId,
                    createdAt, lastOrderedAt }
ProfileMedicine   { name, composition, lastOrderedProductId }

Order     { id, userId, items[], attachedPrescriptionIds[], addressId,
            bill, status, placedAt }
OrderItem { productId, productName, quantity, price }
Bill      { itemsTotal, deliveryFee, discount, totalPayable }
OrderStatus = "placed"|"verifying"|"packed"|"out_for_delivery"|"delivered"
```

These types are imported by API routes, the mock store, and every page — so a column rename in `Product` will surface as TypeScript errors everywhere it's used.

---

## 8. Critical Flows

### 8.1 First-time prescription upload
```
User drops image → upload-prescription page validates type/size → base64 →
mock-store.mockUploadPrescription(base64) →
POST /api/prescriptions/upload →
extractPrescription() calls Gemini (with fallback chain) →
parsed medicines saved to prescriptions.json →
returns to UI, advances to step 3 (product matching) →
user picks branded vs generic for each medicine, clicks Add →
mock-store.addToCart() + attachPrescription() →
POST /api/cart/add (auto-attaches matching Rx because Rx product)
```

### 8.2 Reorder a saved profile
```
My Medications page → user clicks Reorder on "Mom's BP meds" →
mock-store.reorderProfile(id) →
POST /api/medication-profiles/[id]/reorder →
Server rebuilds cart from profile's lastOrderedProductIds, returns
out-of-stock alternatives if any →
Store updates cart state → page redirects to /checkout
```

### 8.3 Place order and watch status progress
```
Checkout page → user picks payment → handlePay() →
mock-store.placeOrder(addressId) →
POST /api/orders → server creates order with bill from calculateBill(),
clears cart, returns Order with status="placed" →
Browser navigates to /order/[id] →
Client setInterval (2s) computes status from placedAt via computeOrderStatus() →
Timeline ticks: placed→verifying→packed→out_for_delivery→delivered →
Refreshing the page hits GET /api/orders/[id], which runs the same function on the server.
```

### 8.4 Login (demo or OTP)
```
/login → user clicks "Demo Mode" → POST /api/auth/verify-otp with phone:"demo" →
returns { user: Priya, sessionToken } → localStorage stores both →
router.push("/") → AuthGuard sees token → app renders.
```

---

## 9. Non-Functional Properties (what the design currently buys us)

| Property | Today's posture |
|---|---|
| **Latency** | Optimistic UI feels instant; real API round-trip ~50–150ms on JSON files; Gemini extraction ~5–7s |
| **Consistency** | Single source of truth per fact: bill via `calculateBill`, status via `computeOrderStatus`, address via `currentUser.defaultAddressId`. Drift is structurally hard. |
| **Concurrency** | In-process mutex per JSON file. Safe under one Node process, unsafe under multiple. |
| **Durability** | Atomic `.tmp` → `rename`. Safe against crashes mid-write. |
| **Auth** | Demo-grade: base64 userId tokens, no expiry, no signing, no refresh. Hardcoded OTP `123456`. |
| **Observability** | `console.log` only — no structured logging, no metrics, no tracing. |
| **Type safety** | End-to-end TS shared contracts. A rename ripples through compile-time. |
| **Bundle size** | Page chunks 2–6 kB, shared 87 kB. Recent design-system pass cut /product/[id] by 38% and /checkout by 47%. |

---

## 10. 🧑‍💼 Senior-Developer Critique

Speaking as if reviewing this for a production hand-off — what's solid, what's MVP-grade, and what would break under load.

### ✅ Genuinely good decisions

1. **The 4-layer separation is real, not aspirational.** Pages don't call APIs directly; APIs don't touch JSON; storage is pluggable behind two functions. This is rare for a demo. Replacing JSON with Postgres would be a 1–2 day swap because only `lib/storage/index.ts` would change.

2. **Shared utilities (`bill.ts`, `order-status.ts`) used by BOTH server and client.** This eliminates an entire bug class — server/client drift on calculated values. Many "real" production apps have this drift and don't notice for years.

3. **Optimistic updates with rollback.** Standard pattern, correctly implemented. UI feels native-app fast.

4. **Type-first.** `lib/types/index.ts` is the spine. Changes propagate at compile time.

5. **One component per concept, variants instead of forks** (ProductCard, BillSummary, AddressSelector). This is the right design-system instinct — most teams end up with `ProductCardV2`, `ProductCardSmall`, `ProductCardForCheckout`.

6. **Address selection turned from localStorage-local into server-persisted.** This was a real fix, not a refactor — different devices now see the same active address.

### ⚠️ MVP-grade decisions that should not ship

1. **No real auth.** Tokens are `base64(userId)` — anyone who knows the encoding can impersonate anyone. There's no expiry, no signature, no refresh. API routes don't enforce that the `userId` in request body matches the token. Fix: real JWT signing + middleware enforcement before any real user touches it.

2. **Hardcoded `userId = "user_priya_001"` fallback everywhere.** Every route accepts a userId from the request body and defaults to Priya. A real client can write to any cart. Fix: derive userId from token only, ignore body field.

3. **No rate limiting, no CSRF protection, no input length caps anywhere.** A 100MB JSON body to `/api/cart/add` would happily hang the server.

4. **In-process mutex assumes single-process.** As soon as you deploy this to Vercel serverless (or fork workers), the locks become a no-op and two simultaneous writes can corrupt a file. Even on a single VM with Node clustering, this fails. Fix for JSON-stays approach: `proper-lockfile` or filesystem-level `flock`. Realistic fix: move to a real database.

5. **JSON files are unfit for production durability.** No transactional guarantees across files (e.g., "place order" updates both `orders.json` and `carts.json` — if the second write fails, you have a phantom paid-but-still-in-cart situation). No indexes, no query language, no replication.

6. **Order status is purely time-derived.** Refreshing a 90-second-old order shows "delivered" forever, even if the pharmacist never verified. There's no real persistence of state transitions. Real life: a delivery can fail; a prescription can be rejected; status can go backward. Fix: persist a `statusHistory[]` array; computed status is a fallback.

### 🔬 Design-level concerns

7. **The "mock store" is a god object.** It holds *everything*: products, cart, orders, profiles, prescriptions, user. It also owns optimistic-update logic, polling intervals, localStorage caching, FTUX toggle, and the order-status ticker. Single context across the whole app means: any state change re-renders every consumer; no way to test pages in isolation; no clean place to add per-domain caching policies. Fix: split into `useCart`, `useCatalog`, `useOrders`, `useAuth` (probably with React Query / SWR).

8. **No data fetching cache layer.** `refreshAll()` fires 5 parallel API calls on every mount. Visiting `/cart` then `/checkout` re-fetches the same cart twice. No stale-while-revalidate, no dedup, no background refresh. React Query would solve this in ~50 lines.

9. **`mock-store.tsx` is 450+ lines.** It's at the threshold where it stops fitting on one screen. Split by domain.

10. **Type casts smell.** `addToCart: addToCart as unknown as (p: string, q: number) => void` in the Provider value indicates the public interface (sync `void`) doesn't match the implementation (async `Promise<void>`). Either the interface is wrong (callers do `await addToCart(...)` and lose return values) or the cast is masking a real bug.

11. **Auto-Rx-attach logic is duplicated and fuzzy.** Both `/api/cart/add` and `/api/cart/update` (and the deleted item route) try to match prescriptions to products via substring matching on names and salts. This is in three places, slightly different each time. Extract to `lib/utils/rx-matching.ts`. Also: substring matching will produce wrong matches in production catalogs (e.g., "Telma" matches both "Telma 40" and "Telma H 40").

12. **The "demo" auth bypass leaks across surfaces.** Any phone string containing "demo" logs in as Priya. This is too lax even for a demo — a real user typing "demoday@gmail.com" gets Priya's data. Limit to exact match `phone === "demo"`.

13. **No tests.** Zero unit tests, zero integration tests, zero E2E. The included `docs/testing/02-curl-tests.sh` is a smoke test, not a regression suite. For a system where money and prescriptions are involved, this is the largest single risk.

### 🏗️ Scaling cliffs (where the current design hits a wall)

- **2nd user.** Multiple users hit the global address PATCH simultaneously → mutex serializes them, but the bottleneck is now one writer per JSON file. Throughput collapses past a few QPS.
- **100 products with images.** `imageUrl` is currently a hotlinked Unsplash URL. No CDN, no image optimization. Use Next `<Image>` and a real image host.
- **Order history > 1000 rows.** Linear scan in `GET /api/orders?userId=`. Add indexing or move to DB.
- **Gemini fallback chain runs out.** All three models can hit quota. Need a graceful degradation to manual entry, plus a queue/retry for transient failures.
- **Mobile.** No PWA, no offline, no service worker. The optimistic-update pattern would shine if extended to offline-first.

### 📋 The "if I had a week" priority list

| Priority | Change | Why |
|---|---|---|
| **P0** | Real signed-JWT auth + enforce userId from token | Security — currently a single forged header gives full impersonation |
| **P0** | Add tests: at least bill calculator unit tests + checkout E2E happy path | Money math regressing silently is the #1 production risk |
| **P1** | Replace JSON storage with SQLite (still one file, but ACID) | Transactional guarantees + indexes, minimal infra change |
| **P1** | Add React Query / SWR to the mock store, split by domain | Fix re-fetch waste, enable proper caching, shrink mock-store.tsx |
| **P2** | Extract Rx-matching utility, fix substring false-positives | Correctness — wrong Rx attachments are a regulatory risk |
| **P2** | Persist `statusHistory[]` on orders, fall back to computed only | Auditability + supports real status changes |
| **P3** | Move images to a CDN, use `next/image` | Performance + cost |
| **P3** | Structured logging (pino) + a basic metrics endpoint | Observability for "why did Gemini fail at 3am" |

### 🎯 One-line summary

**The architecture is unusually clean for a demo and would survive a hand-off to another engineer — but the security model, persistence layer, and test coverage are below the bar for anything customer-facing, and the "mock store" should be retired in favor of a domain-split data-fetching library before this codebase doubles in size.**

---

## 11. Glossary

| Term | Meaning |
|---|---|
| FTUX | First-Time User Experience — the empty-state version of the home page |
| Rx | Prescription-required medicine |
| OTC | Over-the-Counter (no prescription needed) |
| Generic | Same active salt as a brand, sold under a different label, usually cheaper |
| Optimistic update | UI changes instantly, then API call happens; on failure, UI rolls back |
| Demo bypass | Any auth-related entry point that recognizes the literal string `"demo"` and skips real verification |
