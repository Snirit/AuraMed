# AuraMed Test Plan — Full Edge-Case Coverage

This document defines manual test scenarios for every flow in the AuraMed backend, organized by feature area. Each test lists steps, expected result, and how to verify.

---

## How to use this document

1. Start dev server: `cd /Users/snigdhagupta/AuraMed && npm run dev`
2. For UI tests: open http://localhost:3000
3. For API tests: use `02-curl-tests.sh` or copy individual `curl` commands
4. After each test, verify the response code, body, and the relevant `/data/*.json` file

---

## 1. Authentication Flows

### 1.1 Happy path — phone + OTP
- **Steps:** Open `/login` → enter phone `+91 9999988888` → click "Send OTP" → enter `123456` → click "Verify"
- **Expected:** Redirected to `/`, localStorage has `auramed_session_token` + `auramed_current_user`, user shown as Priya

### 1.2 Demo bypass
- **Steps:** Open `/login` → click "Demo Mode (Skip Login)"
- **Expected:** Instant login as Priya, redirected to home

### 1.3 Invalid OTP
- **Steps:** Enter phone, send OTP, then enter `000000`
- **Expected:** 401 response `{ error: "Invalid OTP", code: "INVALID_OTP" }`, error banner shown

### 1.4 OTP expired (5+ min after send)
- **Steps:** Send OTP, wait 5 minutes, try to verify
- **Expected:** 401 `{ code: "OTP_EXPIRED" }`, user prompted to resend

### 1.5 Three wrong attempts → locked
- **Steps:** Enter wrong OTP 3 times within 5 minutes
- **Expected:** 429 `{ code: "LOCKED" }` for ~1 minute

### 1.6 No OTP requested
- **Steps:** Call verify-otp for a phone that didn't request OTP
- **Expected:** 404 `{ code: "OTP_NOT_FOUND" }`

### 1.7 Session persistence
- **Steps:** Log in (demo), navigate around, refresh browser
- **Expected:** Still logged in (token in localStorage), no redirect to login

### 1.8 Logged out → blocked
- **Steps:** Clear localStorage, try to visit `/cart` directly
- **Expected:** Auto-redirect to `/login`

---

## 2. Product Catalog & Search

### 2.1 Get all products
- **Endpoint:** `GET /api/products`
- **Expected:** 74 products returned

### 2.2 Search by salt
- **Endpoint:** `GET /api/products?search=telmisartan`
- **Expected:** Returns exactly Telma 40, Telmikind 40, Telpres 40 (3 products)

### 2.3 Search by name
- **Endpoint:** `GET /api/products?search=glycomet`
- **Expected:** Returns Glycomet 500 Tablet

### 2.4 Filter by category
- **Endpoint:** `GET /api/products?category=diabetes`
- **Expected:** 8 diabetes products

### 2.5 Filter by composition
- **Endpoint:** `GET /api/products?composition=paracetamol`
- **Expected:** All products containing Paracetamol (Dolo, Crocin, Pacimol, Sinarest, Solvin Cold, Combiflam, Ultracet, Calpol)

### 2.6 No results
- **Endpoint:** `GET /api/products?search=xyzzy`
- **Expected:** `{ products: [] }`, 200 status

### 2.7 Product detail + alternatives
- **Endpoint:** `GET /api/products/prod_telma_40`
- **Expected:** Product + 2 alternatives (Telmikind 40, Telpres 40)

### 2.8 Product not found
- **Endpoint:** `GET /api/products/prod_nonexistent`
- **Expected:** 404 `{ code: "NOT_FOUND" }`

---

## 3. Prescription Upload (AI / Gemini)

### 3.1 Real printed prescription
- **Steps:** Open `/upload-prescription` → drag a clear printed prescription image (or use Postman to POST `/api/prescriptions/upload` with base64)
- **Expected:** Returns extracted medicines with `confidence: "high"`, prescription saved to `/data/prescriptions.json`

### 3.2 Handwritten / blurry prescription
- **Steps:** Upload a blurry or handwritten prescription
- **Expected:** Empty `medicines: []` array (Gemini couldn't read), frontend shows "We couldn't read this — try manual entry"

### 3.3 Image too large
- **Steps:** Upload a >5MB image
- **Expected:** 413 `{ code: "IMAGE_TOO_LARGE" }`

### 3.4 Non-image file
- **Steps:** Upload a PDF or text file as base64
- **Expected:** 400 `{ code: "INVALID_FILE_TYPE" }`

### 3.5 Gemini API down (simulate by breaking key)
- **Steps:** Set `GEMINI_API_KEY=invalid` in `.env.local`, restart, upload
- **Expected:** 503 `{ code: "AI_DOWN" }`

### 3.6 Manual prescription entry
- **Endpoint:** `POST /api/prescriptions/manual` with `{ medicineNames: ["Dolo 650", "Crocin"] }`
- **Expected:** Synthetic prescription created with inferred compositions, saved to `prescriptions.json`

### 3.7 Manual entry with unknown medicine
- **Endpoint:** `POST /api/prescriptions/manual` with `{ medicineNames: ["Made up med"] }`
- **Expected:** Still creates prescription, composition shown as "Made up med Salt"

### 3.8 Empty medicineNames array
- **Endpoint:** `POST /api/prescriptions/manual` with `{ medicineNames: [] }`
- **Expected:** 400 `{ code: "MISSING_MEDICINES" }`

### 3.9 Search products for prescription medicine
- **Endpoint:** `GET /api/prescriptions/search-products?medicineName=Telma&composition=Telmisartan 40mg`
- **Expected:** Top match Telma 40, alternatives in result

---

## 4. Cart Operations

### 4.1 Add OTC item
- **Endpoint:** `POST /api/cart/add` with `{ productId: "prod_dolo_650", quantity: 1 }`
- **Expected:** Cart updated, no prescription auto-attached (OTC)

### 4.2 Add Rx item — auto-attach matching Rx
- **Endpoint:** `POST /api/cart/add` with `{ productId: "prod_telma_40", quantity: 1 }`
- **Expected:** Cart updated, `attachedPrescriptionIds: ["rx_moms_bp_001"]`

### 4.3 Add Rx item — no matching Rx on file
- **Steps:** Delete prescriptions.json content (or use a fresh user), add Telma 40
- **Expected:** Added to cart, no auto-attachment. Frontend should flag "Rx needed"

### 4.4 Add same product twice — increment
- **Steps:** Add prod_telma_40 with qty=1, then again with qty=2
- **Expected:** Single line item with quantity=3

### 4.5 Out of stock
- **Endpoint:** `POST /api/cart/add` with `{ productId: "prod_januvia_50" }` (seeded as `inStock: false`)
- **Expected:** 409 `{ code: "OUT_OF_STOCK", alternatives: [...] }` (alternatives by composition)

### 4.6 Update quantity
- **Endpoint:** `PUT /api/cart/update` with `{ productId: "prod_telma_40", quantity: 5 }`
- **Expected:** Quantity set to 5

### 4.7 Set quantity to 0 → remove
- **Endpoint:** `PUT /api/cart/update` with `quantity: 0`
- **Expected:** Item removed from items array

### 4.8 Delete item explicitly
- **Endpoint:** `DELETE /api/cart/item/prod_telma_40?userId=user_priya_001`
- **Expected:** Item removed

### 4.9 Remove last Rx item → prescriptions cleared
- **Steps:** Add Telma 40 (Rx auto-attaches), then DELETE it
- **Expected:** `items: []` AND `attachedPrescriptionIds: []`

### 4.10 Remove one of multiple Rx items
- **Steps:** Add Telma 40 + Glycomet 500 (both match `rx_moms_bp_001`), remove only Telma
- **Expected:** Glycomet remains, `rx_moms_bp_001` still attached (other item still matches)

### 4.11 Attach prescription manually
- **Endpoint:** `POST /api/cart/attach-prescription` with `{ prescriptionId: "rx_dads_thyroid_001" }`
- **Expected:** Added to `attachedPrescriptionIds`

### 4.12 Attach nonexistent prescription
- **Endpoint:** `POST /api/cart/attach-prescription` with `{ prescriptionId: "rx_fake" }`
- **Expected:** 404 `{ code: "RX_NOT_FOUND" }`

### 4.13 Cart persists across page refresh
- **Steps:** Add 3 items in UI → reload page
- **Expected:** Items still in cart (loaded from carts.json, not localStorage)

---

## 5. Medication Profiles

### 5.1 List profiles
- **Endpoint:** `GET /api/medication-profiles?userId=user_priya_001`
- **Expected:** 2 profiles ("Mom's BP meds", "Dad's thyroid")

### 5.2 Create profile from cart
- **Steps:** Add 3 items → POST `/api/medication-profiles` with `{ name: "Test Profile", prescriptionId: "rx_moms_bp_001" }`
- **Expected:** Profile created with 3 medicines, saved to JSON

### 5.3 Create profile with empty cart
- **Endpoint:** Same as above but with empty cart
- **Expected:** 400 `{ code: "EMPTY_CART" }`

### 5.4 Reorder existing profile
- **Endpoint:** `POST /api/medication-profiles/mp_moms_bp/reorder` with `{ userId: "user_priya_001" }`
- **Expected:** Cart now has Telma 40, Glycomet 500, Atorlip 10. `attachedPrescriptionIds: ["rx_moms_bp_001"]`. `outOfStockItems: []`

### 5.5 Reorder nonexistent profile
- **Endpoint:** `POST /api/medication-profiles/mp_fake/reorder`
- **Expected:** 404 `{ code: "PROFILE_NOT_FOUND" }`

### 5.6 Reorder with out-of-stock product
- **Steps:** Edit `products.json` to set Telma 40 `inStock: false`, then reorder Mom's BP profile
- **Expected:** Telma omitted from cart, `outOfStockItems` contains `{ productId: "prod_telma_40", alternatives: [Telmikind, Telpres] }`

### 5.7 Reorder replaces cart contents
- **Steps:** Add OTC items, then reorder Mom's BP
- **Expected:** Old cart contents wiped, only profile items present

---

## 6. Orders

### 6.1 Place order from cart
- **Steps:** Add items → POST `/api/orders` with `{ addressId: "addr_bangalore_001" }`
- **Expected:** Order created in `orders.json` with status `"placed"`, cart cleared, bill computed correctly

### 6.2 Place order with empty cart
- **Endpoint:** Same with no items
- **Expected:** 400 `{ code: "EMPTY_CART" }`

### 6.3 Place order without addressId
- **Endpoint:** POST without addressId
- **Expected:** 400 `{ code: "MISSING_ADDRESS" }`

### 6.4 Bill calculation
- **Test:** Add ₹450 worth of items → place order
- **Expected:** itemsTotal=450, deliveryFee=30 (<500), discount=50 (>300), totalPayable=430

### 6.5 Bill calculation — free delivery threshold
- **Test:** Add ₹550 worth → place order
- **Expected:** deliveryFee=0, discount=50, totalPayable=500

### 6.6 Bill calculation — no discount
- **Test:** Add ₹200 worth → place order
- **Expected:** deliveryFee=30, discount=0, totalPayable=230

### 6.7 Order status progression (live)
- **Steps:** Place order → poll `GET /api/orders/{id}` every 2 sec for 70 seconds
- **Expected:**
  - 0–4s: `placed`
  - 4–14s: `verifying`
  - 14–32s: `packed`
  - 32–62s: `out_for_delivery`
  - 62s+: `delivered`

### 6.8 Sample order status preserved
- **Test:** `GET /api/orders/order_sample_001` at any time
- **Expected:** Status remains `out_for_delivery` (not auto-progressed)

### 6.9 Get nonexistent order
- **Endpoint:** `GET /api/orders/order_fake`
- **Expected:** 404 `{ code: "ORDER_NOT_FOUND" }`

### 6.10 List all orders
- **Endpoint:** `GET /api/orders?userId=user_priya_001`
- **Expected:** All orders for Priya with live statuses computed

---

## 7. FTUX & Demo Settings

### 7.1 Toggle FTUX mode
- **Steps:** Click DemoSettings toggle
- **Expected:** Home page switches: hides active order banner and "Your Medications" cards, shows hero + upload CTA

### 7.2 Reset demo database
- **Steps:** Click "Reset Demo Database"
- **Expected:** Cart cleared, profiles + orders + prescriptions reloaded from seed JSON files

### 7.3 FTUX → returning user transition after saving profile
- **Steps:** Enter FTUX mode → upload prescription → save as profile
- **Expected:** Auto-switches out of FTUX, home shows the new profile

---

## 8. End-to-end Priya journeys

### 8.1 Demo journey (Reorder Mom's BP)
1. Open `/login` → "Demo Mode"
2. Home shows: active order banner (Sample order, out_for_delivery), "Your Medications" with 2 profiles
3. Click "Reorder" on Mom's BP meds → cart shows Telma 40 + Glycomet 500 + Atorlip 10, Rx attached
4. Click "Checkout" → select Bangalore address → "Confirm & Pay"
5. Order tracking page → status starts at "placed", progresses live through timeline
6. Refresh page after 30 seconds → status correctly shows "packed" or "out_for_delivery"

### 8.2 FTUX journey (First prescription)
1. Open `/login` → "Demo Mode"
2. Toggle FTUX in DemoSettings
3. Click "Upload Prescription"
4. Upload an actual printed prescription image
5. AI extracts medicines → editable list
6. Match to products → add to cart
7. In cart → "Save as Medication Profile" → name "Mom's BP meds"
8. Auto-switches out of FTUX → home shows new profile

### 8.3 Persistence journey
1. Demo login → add items to cart → quit browser
2. Reopen browser → go to `/cart`
3. Cart still has items (read from `/data/carts.json`)
4. Log out → log in again → cart still preserved

---

## 9. Concurrency & Edge Cases

### 9.1 Concurrent cart updates
- **Test:** Send 3 simultaneous POSTs to `/api/cart/add` (use the parallel curl command in `02-curl-tests.sh`)
- **Expected:** All 3 increments applied correctly (mutex serializes), final cart shows total qty=3

### 9.2 Concurrent profile creation
- **Test:** POST two profiles at the same time
- **Expected:** Both saved without overwriting each other

### 9.3 Storage write atomic
- **Test:** Kill the server mid-write (Ctrl+C during a long write)
- **Expected:** `.tmp` file exists OR final file exists, no corrupted half-written JSON
