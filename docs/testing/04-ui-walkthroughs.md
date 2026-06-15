# UI Walkthroughs — Click-by-Click Test Scripts

For each user journey, follow these exact steps in the browser. Each walkthrough corresponds to a different Priya persona and triggers a different set of code paths.

---

## Walkthrough 1: First-time User (FTUX) → Save Profile

**Persona:** First time visiting AuraMed. No prescriptions, no profiles, no orders.

### Steps:
1. Open browser → `http://localhost:3000` → redirected to `/login`
2. Click **"Demo Mode (Skip Login)"** → home page
3. Click the **floating settings icon** (bottom-right) → toggle **FTUX mode ON**
4. Verify home page changes:
   - ✅ Hero section shown: "Upload prescription and reorder in 60 seconds"
   - ✅ Large "Upload Prescription" CTA
   - ✅ "How it works" timeline (3 steps)
   - ✅ Category grid (10 categories)
   - ❌ NO active order banner
   - ❌ NO "Your Medications" section
5. Click **"Upload Prescription"** button
6. On the upload page, drop any image OR click **"Type manually"**
7. If manual: enter `Telma 40, Glycomet 500, Atorlip 10` (comma-separated)
8. Wait for extraction simulation → editable list appears
9. Click **"Match to products"** → swiggy-style comparison with branded + generic options
10. Add Telma 40 (branded) and Glycomet 500 (generic) to cart → "Go to Cart"
11. Cart page shows items grouped under "Prescription required"
12. Click **"Save as Medication Profile"** → name it "Mom's BP meds 2"
13. **Verify:** Profile saved, FTUX automatically disabled, home now shows the new profile

### What this tests:
- FTUX state rendering
- Prescription manual entry flow
- Product matching by composition
- Cart Rx grouping
- Profile creation from cart
- FTUX auto-exit on profile save

---

## Walkthrough 2: Returning User → One-Click Reorder

**Persona:** Priya has profiles and an active order.

### Steps:
1. From DemoSettings, click **"Reset Demo Database"** to reload seed data
2. Home page shows:
   - ✅ Active order banner: "Order order_sample_001 — out_for_delivery"
   - ✅ "Your Medications" with "Mom's BP meds" and "Dad's thyroid" cards
   - ✅ Categories grid
   - ✅ Recently ordered products
3. Click **"Reorder"** on "Mom's BP meds" card
4. Should land on `/cart` with:
   - 3 items: Telma 40, Glycomet 500, Atorlip 10 (qty 1 each)
   - "Prescription on file" badge shown
   - Bill: itemsTotal=415, deliveryFee=30, discount=50, total=395
5. Click **"Proceed to Checkout"**
6. On `/checkout`:
   - Address selector defaulted to "Home (Bangalore)"
   - Try switching to "Parents' Home (Pune)"
   - Payment method: select UPI (no validation, just UI)
7. Click **"Confirm & Pay"** → creates order
8. Redirected to `/order/[id]` → tracking timeline
9. Watch status progression:
   - 0–4s: "Placed"
   - 4–14s: "Verifying Rx" (with pharmacist spinner)
   - 14–32s: "Packed"
   - 32–62s: "Out for delivery"
   - 62s+: "Delivered"

### What this tests:
- Returning user home layout
- Profile reorder flow
- Cart bill calculation
- Address selection
- Order creation
- Live status progression
- Order tracking UI

---

## Walkthrough 3: Search + Generic Switch

**Persona:** Priya searches for a branded medicine and is shown a cheaper generic.

### Steps:
1. Home page → click search bar in header
2. Type `telma 40` → press Enter
3. Land on `/search?q=telma+40`
4. **Verify:**
   - ✅ Smart suggestion banner: "Switch to Generic & Save 47%!"
   - ✅ Shows Telmikind 40 (₹95) as alternative to Telma 40 (₹180)
   - ✅ Sidebar filters: Rx Required, Brand/Generic, Price Range
5. Set price range max to ₹100 → only generics shown
6. Toggle "Generic Alternatives" filter → results refine
7. Click on Telmikind 40 → product detail page
8. **Verify product page shows:**
   - ✅ Manufacturer (Mankind Pharma Ltd)
   - ✅ Composition: Telmisartan 40mg
   - ✅ "Similar alternatives" carousel with Telma 40 and Telpres 40
9. Click "+ Add" button on Telmikind 40
10. Header cart badge increments

### What this tests:
- Search by name
- Smart generic suggestion logic
- Sidebar filtering (Rx, brand/generic, price range)
- Product detail page
- Same-composition alternatives
- Add-to-cart from product detail

---

## Walkthrough 4: Real Gemini Prescription Upload

**Persona:** Priya uploads an actual prescription image (not manual entry).

### Steps:
1. Find a printed prescription image OR use `/docs/mom_bp_prescription.png`
2. Demo login → click "Upload Prescription"
3. Drag the image into the dropzone
4. Watch the simulated OCR animation
5. **Verify:** Real Gemini extracts medicines and confidence levels appear
6. Edit any medicine name/composition that looks wrong
7. Continue to product matching
8. Add items → checkout → place order

### What this tests:
- Real Gemini API call
- Base64 image encoding
- Extracted medicine rendering with confidence
- Edit-extracted-medicines UI

### Common issues to watch for:
- Network error → "AI couldn't process this — try manual entry"
- Empty extraction → fallback prompt
- Long latency (>5 sec) → loading state should hold

---

## Walkthrough 5: Persistence Test

**Persona:** Priya is a busy mom — opens AuraMed in fits and starts.

### Steps:
1. Demo login → add 3 items to cart
2. **Close the browser tab completely** (don't just refresh)
3. Reopen browser → `http://localhost:3000`
4. **Verify:**
   - ✅ Still logged in (no redirect to /login)
   - ✅ Cart has all 3 items
   - ✅ Quantities preserved
5. Logout (clear localStorage manually): `localStorage.clear()` in DevTools console
6. **Verify:** Redirected to `/login`
7. Demo login again
8. **Verify:** Cart still has the 3 items (server-side persistence)

### What this tests:
- Session token persistence in localStorage
- Server-side cart persistence (not localStorage)
- Auth guard on protected routes

---

## Walkthrough 6: Cart Edge Cases

### 6.1 Adding out-of-stock item
1. Add `Januvia 50` to cart (seeded as `inStock: false`)
2. **Verify:** Error toast or modal: "Out of stock. Try these alternatives: Sitagliptin alternatives..."

### 6.2 Removing the last Rx item
1. Add Telma 40 (Rx auto-attaches `rx_moms_bp_001`)
2. **Verify cart:** Rx attached
3. Remove Telma 40
4. **Verify cart:** Empty items AND empty `attachedPrescriptionIds`

### 6.3 Multi-Rx attachment
1. Add Telma 40 (auto-attaches `rx_moms_bp_001`)
2. Manually attach `rx_dads_thyroid_001` via API or UI
3. Remove Telma 40
4. **Verify:** `rx_moms_bp_001` pruned (no matching item left), `rx_dads_thyroid_001` also pruned (Thyronorm not in cart)

---

## Walkthrough 7: Order Lifecycle

### Steps:
1. Place a new order with 2 items
2. Open `/order/[id]` page → see "Placed"
3. Open `/my-medications` in a new tab — don't go anywhere
4. Return to order page after 10 seconds → "Verifying Rx" with spinner
5. Hard-refresh the page → status correctly reads from server, not stale state
6. Wait until ~32 seconds elapsed → "Packed"
7. Wait until ~62 seconds → "Out for delivery"
8. Wait until >62 seconds → "Delivered"

### What this tests:
- `computeOrderStatus()` shared utility working consistently in API + UI
- Page refresh preserves correct status
- Live ticker updates every 2 seconds

---

## Walkthrough 8: Auth Edge Cases

### 8.1 Locked after 3 attempts
1. Open `/login` → enter phone `+91 1111111111` → Send OTP
2. Enter `000000` → fail (error shown)
3. Enter `111111` → fail
4. Enter `222222` → fail
5. Enter `123456` (correct) → **Verify:** Still fails with "LOCKED" — wait 1 minute, then retry

### 8.2 OTP expiration
1. Send OTP to phone → wait 6 minutes (set system clock or just leave it)
2. Try to verify with `123456`
3. **Verify:** `{ code: "OTP_EXPIRED" }`, prompt to resend

### 8.3 Demo mode shortcut
1. From `/login`, in the phone field type `demo`, ignore OTP, click "Send OTP"
2. **Verify:** Response includes `demo: true`, no OTP needed
3. Click "Demo Mode" button instead — same result, one click

---

## Quick Recovery Cheatsheet

**Clear everything and start fresh:**
1. DemoSettings → "Reset Demo Database"
2. DevTools → Application → Storage → "Clear site data"
3. Refresh

**Inspect server state:**
```bash
cat data/carts.json
cat data/orders.json
cat data/prescriptions.json
```

**Replay just one walkthrough cleanly:**
```bash
# Reset cart for user
curl -s -X PUT http://localhost:3000/api/cart/update \
  -H "Content-Type: application/json" \
  -d '{"productId":"prod_telma_40","quantity":0,"userId":"user_priya_001"}'
```
