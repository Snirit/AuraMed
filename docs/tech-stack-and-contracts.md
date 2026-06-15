# Tech Stack & Contracts

Shared reference for both Antigravity (UI) and Claude Code (Backend). Both tools must read and follow this exactly.

---

## Part 1: Tech Stack Decisions

### Stack
- **Framework**: Next.js 14 (App Router), single repo, frontend + API routes together
- **Language**: TypeScript everywhere (frontend + backend)
- **Storage**: JSON files on disk under `/data` folder (no database)
- **AI integration**: Anthropic Claude API for prescription image extraction
- **UI**: Antigravity decides (likely Tailwind + a component library, must be consistent)
- **Auth**: Hardcoded mock user for MVP, no real auth flow
- **Deployment**: Local dev only, `npm run dev`

### Folder Structure
```
/medicine-app
├── /app                    # Next.js App Router pages
│   ├── /api                # API routes (backend)
│   │   ├── /products
│   │   ├── /prescriptions
│   │   ├── /cart
│   │   ├── /medication-profiles
│   │   └── /orders
│   ├── page.tsx            # Home
│   ├── /search
│   ├── /category/[slug]
│   ├── /product/[id]
│   ├── /upload-prescription
│   ├── /cart
│   ├── /my-medications
│   ├── /checkout
│   └── /order/[id]
├── /components             # UI components (Antigravity)
├── /lib                    # Shared utilities
│   ├── /types              # All TypeScript interfaces (this file's contracts)
│   ├── /api-client         # Frontend API client
│   └── /storage            # JSON file read/write helpers
├── /data                   # Seed JSON files
│   ├── products.json
│   ├── users.json (mock single user)
│   ├── medication-profiles.json
│   ├── orders.json
│   └── carts.json
└── README.md
```

### Conventions (both tools must follow)
- **Naming**: camelCase for all TypeScript (variables, fields, functions). Never snake_case.
- **IDs**: Strings (UUIDs or simple slugs like `prod_telma_40`). Never integers.
- **Dates**: ISO 8601 strings (`"2026-06-14T10:30:00.000Z"`). Never timestamps or Date objects in API responses.
- **Money**: Numbers in rupees (INR), integer paise NOT used. Use `180` not `18000`.
- **Errors**: All API endpoints return `{ error: string, code: string }` on failure with appropriate HTTP status.
- **Mock user**: Hardcoded user ID `user_priya_001` used everywhere until auth is built.

### Tech Decisions: What NOT to Use
- No real authentication (mock user only)
- No real payment gateway (fake "Pay" success)
- No database (JSON files only)
- No real-time updates (no websockets, no polling)
- No image hosting (use placeholder image URLs)
- No deployment (local dev only)
- No tests (manual verification only, given time constraint)

---

## Part 2: Contracts (TypeScript Interfaces)

All these go in `/lib/types/index.ts`. Both tools import from here.

### Core Entities

```ts
// User (mock, single user for MVP)
export interface User {
  id: string;
  name: string;
  phone: string;
  defaultAddressId: string;
  addresses: Address[];
}

export interface Address {
  id: string;
  label: string; // "Home", "Mom's Place"
  line1: string;
  line2?: string;
  city: string;
  pincode: string;
}

// Product (catalog)
export interface Product {
  id: string;
  name: string;
  manufacturer: string;
  composition: CompositionEntry[];
  packSize: string; // "15 tablets", "100 ml syrup"
  price: number; // in rupees
  mrp: number; // before discount, in rupees
  rxRequired: boolean;
  inStock: boolean;
  imageUrl: string;
  description: string;
  category: string; // category slug e.g. "bp-heart"
  isGeneric: boolean;
}

export interface CompositionEntry {
  salt: string; // "Telmisartan"
  strength: string; // "40mg"
}

// Category
export interface Category {
  slug: string;
  name: string;
  iconUrl: string;
}

// Prescription
export interface Prescription {
  id: string;
  userId: string;
  imageUrl: string; // local path or data URL
  extractedMedicines: ExtractedMedicine[];
  uploadedAt: string;
}

export interface ExtractedMedicine {
  name: string; // medicine name as written on Rx
  composition: string; // composition string
  confidence: "high" | "low"; // AI's confidence
}

// Cart
export interface Cart {
  userId: string;
  items: CartItem[];
  attachedPrescriptionIds: string[];
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  addedAt: string;
}

// Medication Profile (saved for reorder)
export interface MedicationProfile {
  id: string;
  userId: string;
  name: string; // "Mom's BP meds"
  medicines: ProfileMedicine[];
  prescriptionId: string; // linked prescription
  createdAt: string;
  lastOrderedAt: string | null;
}

export interface ProfileMedicine {
  name: string;
  composition: string;
  lastOrderedProductId: string; // user's preferred product
}

// Order
export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  attachedPrescriptionIds: string[];
  addressId: string;
  bill: Bill;
  status: OrderStatus;
  placedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string; // snapshot at order time
  quantity: number;
  price: number; // snapshot at order time
}

export interface Bill {
  itemsTotal: number;
  deliveryFee: number;
  discount: number;
  totalPayable: number;
}

export type OrderStatus =
  | "placed"
  | "verifying" // pharmacist verifying (faked)
  | "packed"
  | "out_for_delivery"
  | "delivered";
```

---

## Part 3: API Endpoints

All under `/api/`. Both tools must implement and consume exactly these shapes.

### Products

**`GET /api/products`**
Query params: `search?`, `category?`, `composition?`
```ts
Response: { products: Product[] }
```

**`GET /api/products/:id`**
```ts
Response: { product: Product, alternatives: Product[] }
// alternatives = same composition, different brand
```

### Categories

**`GET /api/categories`**
```ts
Response: { categories: Category[] }
```

### Prescriptions

**`POST /api/prescriptions/upload`**
Body: `{ imageBase64: string }` (the prescription image)
```ts
Response: {
  prescriptionId: string;
  extractedMedicines: ExtractedMedicine[];
}
// If AI fails: { error: "could_not_extract", code: "EXTRACT_FAILED" }
```

**`POST /api/prescriptions/manual`**
Body: `{ medicineNames: string[] }`
```ts
Response: {
  prescriptionId: string; // synthetic, no image
  extractedMedicines: ExtractedMedicine[]; // built from input
}
```

**`GET /api/prescriptions/search-products`**
Query: `medicineName=...&composition=...`
```ts
Response: { matches: Product[] }
// Top 3 matches by name + composition for each medicine
```

### Cart

**`GET /api/cart`**
```ts
Response: { cart: Cart, products: Product[] }
// products = resolved details for items in cart
```

**`POST /api/cart/add`**
Body: `{ productId: string, quantity: number }`
```ts
Response: { cart: Cart }
```

**`PUT /api/cart/update`**
Body: `{ productId: string, quantity: number }`
```ts
Response: { cart: Cart }
```

**`DELETE /api/cart/item/:productId`**
```ts
Response: { cart: Cart }
```

**`POST /api/cart/attach-prescription`**
Body: `{ prescriptionId: string }`
```ts
Response: { cart: Cart }
```

### Medication Profiles

**`GET /api/medication-profiles`**
```ts
Response: { profiles: MedicationProfile[] }
```

**`POST /api/medication-profiles`**
Body: `{ name: string, cartId?: string, prescriptionId: string }`
```ts
Response: { profile: MedicationProfile }
// Builds profile from current cart items + prescription
```

**`POST /api/medication-profiles/:id/reorder`**
```ts
Response: { cart: Cart }
// Builds cart from profile's last-ordered products
```

### Orders

**`POST /api/orders`**
Body: `{ addressId: string }`
```ts
Response: { order: Order }
// Creates order from current cart, clears cart
```

**`GET /api/orders/:id`**
```ts
Response: { order: Order }
```

**`GET /api/orders`**
```ts
Response: { orders: Order[] }
```

---

## Part 4: AI Integration Spec (Backend Only)

For `POST /api/prescriptions/upload`:

1. Receive base64 image
2. Call Anthropic Claude API (model: `claude-sonnet-4-6`) with vision input
3. Prompt:
```
You are reading a printed Indian medical prescription. Extract ONLY the list of medicines prescribed.

For each medicine, return:
- name: the medicine name as written (e.g. "Telma 40", "Glycomet 500")
- composition: the active salt(s) and strength if you can infer it
- confidence: "high" if clearly printed, "low" if unclear

Ignore: doctor info, patient info, diagnosis, instructions, dates, signature.

If the prescription appears handwritten or unreadable, return an empty array.

Return strict JSON:
{
  "medicines": [
    { "name": "...", "composition": "...", "confidence": "high" }
  ]
}
```
4. Parse response, validate JSON shape
5. Save prescription to `/data/prescriptions.json`
6. Return `prescriptionId + extractedMedicines`

Edge handling:
- If response isn't valid JSON: return `EXTRACT_FAILED`
- If medicines array is empty: return error suggesting manual entry
- If confidence is all "low": still return, let UI show a warning

---

## Part 5: Seed Data Requirements

Backend must create `/data/products.json` with at least:

- **20-25 products** covering these categories: BP/heart, Diabetes, Cold/cough, Vitamins, Pain relief, Stomach
- For each Rx medicine, include **at least 2 alternatives** (same composition, different brand/manufacturer)
- Mix of Rx and OTC
- Realistic Indian brand names: Telma, Glycomet, Atorlip, Crocin, Dolo, Thyronorm, Revital H, Zincovit, Sinarest, Pantop, etc.
- Prices in realistic ranges (₹20 to ₹500)
- Compositions formatted exactly per the `CompositionEntry` interface

Mock user: one user, `user_priya_001`, with one address in Bangalore.

Two pre-seeded medication profiles for demo:
- "Mom's BP meds" — Telmisartan + Metformin + Atorvastatin
- "Dad's thyroid" — Thyroxine

---

## Part 6: Critical Rules (Both Tools)

1. **Never deviate from contracts**. If a field is missing for a use case, ASK the human, don't invent.
2. **No fields beyond what's defined here**. If UI needs new data, update this contract first.
3. **All responses match the documented shape exactly**, including optional fields.
4. **Frontend must handle loading and error states** for every API call.
5. **Backend must validate input** and return appropriate errors.
6. **Storage writes must be atomic** (read file, modify, write back).
7. **Don't build features outside the scope of the wireframes in Doc 2**.
