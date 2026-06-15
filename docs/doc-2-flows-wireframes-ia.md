# Document 2: User Flows, Wireframes, and Information Architecture

This document covers how a user moves through the app, what each screen looks like, and how the app's information is organized underneath. Written from the user's point of view first, with edge cases and visual notes alongside.

---

## Part 1: User Flows

Each flow below starts with what the user is trying to do, then walks through the steps, what could go wrong, and what we do about it.

---

### Flow 1: First Time Using the App (FTUX)

**What Priya is trying to do**: Open the app for the first time, figure out if it's worth using.

**Trigger**: A friend told her about it, or she found it while searching for a way to manage mom's medicines.

**Steps**:
1. Lands on the home page (logged out)
2. Sees a clear value proposition at the top (e.g. "Manage your family's medicines in one place")
3. Browses around without forcing her to sign up
4. Decides to do something that needs an account (upload Rx, save medicines, place order)
5. Prompted to sign up with phone number + OTP
6. Sets her delivery location (pincode or detect)
7. Continues with what she was doing

**Key principles**:
- No forced signup wall on landing
- Signup happens at the moment of commitment, not before
- Minimum info asked (phone + location)

**Edge cases**:
- User skips location → ask again before checkout, not earlier
- OTP doesn't arrive → resend option + alternate (email or WhatsApp) shown after 30 seconds
- User abandons signup → save their browsing context so they don't restart

---

### Flow 2: Upload a New Prescription

**What Priya is trying to do**: She just got a new prescription from mom's doctor visit. She wants to order the medicines listed on it without typing each name.

**Trigger**: Has a printed prescription on her phone or laptop.

**Steps**:
1. From the home page, taps the "Upload Prescription" button next to the search bar
2. Modal/screen opens with two options: "Upload image" and "Type medicines manually"
3. Selects "Upload image" → file picker or drag-and-drop
4. Uploads the prescription image
5. Sees a loading state ("Reading your prescription...")
6. AI extracts the list of medicine names + composition
7. Sees the extracted list, each line editable, with options to remove or correct
8. Confirms the list → taps "Find medicines"
9. Lands on a results page, organized one section per medicine (Swiggy-style):
   - Each section shows 2-3 product options (original brand + generic alternatives)
   - Each product card has price, pack size, Rx badge, and add button
10. Adds preferred product for each medicine
11. Sticky CTA at the bottom shows "Go to cart (3 items)"
12. Taps CTA → cart page

**Edge cases**:
- **Blurry image** → AI returns low or no confidence → show "Couldn't read clearly, try again or type manually"
- **Handwritten prescription** → app explains we only handle printed ones, prompts manual entry
- **Medicine not in our catalog** → show "Not available" with option to remove or replace
- **Multiple compositions in one tablet** → match on full composition (handles things like Sinarest which combines 3 salts)
- **Same medicine listed twice** → auto-deduplicate, flag to user
- **User edits a medicine name after extraction** → re-run product search for that line

---

### Flow 3: Type Medicines Manually (Fallback)

**What Priya is trying to do**: Her prescription is handwritten or unclear, so she types the medicines herself.

**Trigger**: Either she chose manual entry directly, or fell back from the upload flow.

**Steps**:
1. Sees a text input with placeholder "Type medicine name and press Enter"
2. Types a medicine, presses Enter or comma → it's added as a chip below
3. Repeats for each medicine on her prescription
4. Confirms the list → taps "Find medicines"
5. Lands on the same Swiggy-style results page as Flow 2
6. Same add-to-cart and CTA experience

**Edge cases**:
- Misspelled medicine → fuzzy search returns close matches with "Did you mean...?"
- Medicine doesn't exist → show "No matches found" with option to remove

---

### Flow 4: Search for a Specific Medicine

**What Priya is trying to do**: She knows the name (or composition) of what she wants.

**Trigger**: Types in the search bar at the top of any page.

**Steps**:
1. Types medicine name or composition (e.g. "telmisartan" or "Telma 40")
2. Sees instant suggestions as she types (autocomplete)
3. Picks a suggestion OR submits the search
4. Lands on search results page:
   - Grid of products matching the search
   - Each card: image, name, manufacturer, composition, price, pack size, Rx badge, add button
   - Filters on the side or top (brand, price range, generic vs brand)
5. Taps a product → product detail page
6. Reads composition, picks quantity, adds to cart
7. Continues shopping or goes to cart

**Edge cases**:
- No results → "No medicines found. Try searching by composition or browse categories."
- Composition search returns many brands → sort by best match + price
- Search query is a partial match → show closest matches with clear "Searched for X, showing similar"

---

### Flow 5: Browse by Category

**What Priya is trying to do**: She doesn't know exactly what she needs, but knows the area (e.g. cold remedies).

**Trigger**: Scrolls down on home page to "Shop by concern".

**Steps**:
1. Sees category tiles (Diabetic care, BP & heart, Cold & cough, Stomach care, Vitamins, etc.)
2. Taps a category → category landing page
3. Sees products under that category, with filters
4. Same product browsing experience as search results
5. Adds to cart, continues

**Edge cases**:
- Category is empty → "Coming soon" message
- Subcategories might be needed for big areas (e.g. Diabetic care → glucometers, strips, tablets)

---

### Flow 6: Reorder a Saved Medication

**What Priya is trying to do**: Mom's BP meds need refilling. She doesn't want to think about which brand, dosage, or upload anything.

**Trigger**: Opens app, taps "My Medications" or sees her saved profile on home.

**Steps**:
1. Sees a list of saved medication profiles (e.g. "Mom's BP meds", "Dad's thyroid")
2. Taps "Reorder" on the relevant profile
3. Cart is auto-built with last-ordered products
4. Cart page shows "Prescription on file ✓" — no re-upload needed
5. Confirms address (default to last used)
6. Taps Pay → done

**Total taps**: 3 (Reorder → Pay → Confirm)

**Edge cases**:
- **Product out of stock** → show alternatives by composition, let her pick
- **Prescription on file is expired** (>6 months) → flag on profile, prompt to upload new
- **Dosage might have changed** → no auto-detection in MVP, user updates manually if needed
- **No saved profiles yet** → don't show this option

---

### Flow 7: Cart and Checkout

**What Priya is trying to do**: Review what she's buying, upload prescription if needed, pay.

**Trigger**: Taps cart icon from any page.

**Steps**:
1. Cart page loads with two sections:
   - **Prescription required**: Rx items grouped here, with clear upload prompt if no Rx attached
   - **Other items**: OTC and non-Rx items
2. For each item: image, name, composition, pack size, quantity selector (±), price, remove button
3. If Rx items exist and no Rx is attached: prominent "Upload prescription" button
4. After upload: shows "Prescription attached ✓"
5. Below items: "Save for reorder" button (only if Rx items present)
6. Bill summary: items total, delivery fee, discount, total payable
7. Address shown (with option to change)
8. Sticky "Pay" CTA at the bottom
9. Taps Pay → goes to payment screen
10. Payment options: UPI, cards, wallets, COD
11. After payment success → order confirmation screen

**Edge cases**:
- **Rx item in cart but no Rx uploaded** → cannot proceed to payment, clear error
- **Saving for reorder** → modal asks "Name this set" (e.g. "Mom's BP meds")
- **Item out of stock between adding and paying** → show error, suggest alternative
- **Address not set** → prompt to add address before payment
- **Payment fails** → retry option, cart preserved

---

### Flow 8: Order Confirmation and Tracking

**What Priya is trying to do**: Confirm the order went through, know when it's arriving.

**Trigger**: Lands here automatically after successful payment.

**Steps**:
1. Big success message: "Order placed ✓"
2. Order ID + estimated delivery time
3. Status timeline (visual progress bar):
   - ✓ Order placed
   - ⏳ Pharmacist verifying (animated/loading — this is the faked step for Rx orders)
   - Packed
   - Out for delivery
   - Delivered
4. Items list (collapsed, tap to expand)
5. Address + payment summary
6. "Need help?" CTA

**Edge cases**:
- **Pharmacist rejects prescription** (faked in MVP) → notification with reason, refund initiated
- **Order delayed** → status banner explains why
- **Missing items at delivery** → "Report issue" option

---

## Part 2: Wireframes

Each wireframe is shown as a markdown sketch with notes on visual style.

---

### Wireframe 1: Home Page (Returning User)

```
┌────────────────────────────────────────────────────────────────────────┐
│ [Logo]  📍 Bangalore 560001 ▾   [🔍 Search medicines or composition]  │
│                                  [📄 Upload Rx]  My Meds  🛒  👤      │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  📦 Your order is on the way — Arriving in 18 mins  [Track →]          │
│                                                                         │
├────────────────────────────────────────────────────────────────────────┤
│  Your Medications                                          See all →    │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐            │
│  │ Mom's BP meds  │  │ Dad's thyroid  │  │ My vitamins    │            │
│  │ 3 medicines    │  │ 1 medicine     │  │ 2 medicines    │            │
│  │ Last: 12d ago  │  │ Last: 4d ago   │  │ Last: 8d ago   │            │
│  │  [Reorder]     │  │  [Reorder]     │  │  [Reorder]     │            │
│  └────────────────┘  └────────────────┘  └────────────────┘            │
├────────────────────────────────────────────────────────────────────────┤
│  Shop by Concern                                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
│  │ Diabetes │ │BP & Heart│ │Cold/Cough│ │ Stomach  │                   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
│  │ Vitamins │ │Pain Relief│ │  Derma   │ │  Eye    │                   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                   │
├────────────────────────────────────────────────────────────────────────┤
│  Recently Ordered                                          See all →    │
│  [product cards with quick reorder button]                              │
└────────────────────────────────────────────────────────────────────────┘
```

**Visual notes**:
- Top bar is white, persistent, light shadow on scroll
- Active order banner: pastel background (teal/blue), prominent but not intrusive
- Your Medications section: cards with subtle borders, medication count and last-ordered date in muted text, primary CTA in brand color
- Categories: clean tile grid with simple icons, generous spacing
- Use brand-consistent color (one primary, one accent), avoid noisy palette

---

### Wireframe 2: Home Page (FTUX / First-Time User)

```
┌────────────────────────────────────────────────────────────────────────┐
│ [Logo]  📍 Set location          [🔍 Search medicines]                  │
│                                  [📄 Upload Rx]  🛒  👤 Login          │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│         Manage your family's medicines in one place                     │
│         Upload, save, and reorder in one tap                            │
│                                                                         │
│         [📄 Upload your first prescription]                            │
│                  or                                                      │
│         [🔍 Search for a medicine]                                      │
│                                                                         │
├────────────────────────────────────────────────────────────────────────┤
│  How it works                                                           │
│  1. Upload prescription → we read it for you                            │
│  2. Pick medicines → we suggest alternatives                            │
│  3. Save to reorder → next time, one tap is all it takes               │
├────────────────────────────────────────────────────────────────────────┤
│  Shop by Concern                                                        │
│  [same category grid as returning user]                                 │
└────────────────────────────────────────────────────────────────────────┘
```

**Visual notes**:
- Hero section more prominent (no active orders or saved profiles to show yet)
- "How it works" reassures the user about the AI extraction promise
- Slightly more whitespace; less dense than returning-user view

---

### Wireframe 3: Upload Prescription (Step 1)

```
┌────────────────────────────────────────────────────────────────────────┐
│ ← Back                                                                  │
│                                                                         │
│  Upload your prescription                                               │
│  We'll read it and find the medicines for you                          │
│                                                                         │
│  ┌─────────────────────────────────────────────────┐                   │
│  │                                                  │                   │
│  │            📄 Drop your prescription here        │                   │
│  │            or click to upload                    │                   │
│  │                                                  │                   │
│  │            JPG, PNG, PDF accepted                │                   │
│  │            (Printed prescriptions work best)     │                   │
│  └─────────────────────────────────────────────────┘                   │
│                                                                         │
│  Don't have one handy? [Type medicine names instead]                   │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

**Visual notes**:
- Large dashed upload zone, friendly empty state
- Manual entry option visible but secondary
- Honest about printed-only limitation

---

### Wireframe 4: AI Extracted List (Step 2)

```
┌────────────────────────────────────────────────────────────────────────┐
│ ← Back                                                                  │
│                                                                         │
│  Here's what we found                                                   │
│  Edit, remove, or confirm the list below                                │
│                                                                         │
│  ┌────────────────────────────────────────────────────┐                │
│  │  ✏️  Telmisartan 40mg                          ✕  │                │
│  │      [Composition: Telmisartan 40mg]               │                │
│  ├────────────────────────────────────────────────────┤                │
│  │  ✏️  Metformin 500mg                           ✕  │                │
│  │      [Composition: Metformin 500mg]                │                │
│  ├────────────────────────────────────────────────────┤                │
│  │  ✏️  Atorvastatin 10mg                         ✕  │                │
│  │      [Composition: Atorvastatin 10mg]              │                │
│  └────────────────────────────────────────────────────┘                │
│                                                                         │
│  + Add another medicine                                                 │
│                                                                         │
│                                          [Find medicines →]             │
└────────────────────────────────────────────────────────────────────────┘
```

**Visual notes**:
- Clean list, each row clearly editable
- Pencil icon = edit name; X = remove
- Composition shown in muted text below name
- "Add another" handles AI missing a medicine
- Primary CTA bottom right

---

### Wireframe 5: Product Results (Step 3 — Swiggy-style)

```
┌────────────────────────────────────────────────────────────────────────┐
│ ← Back              Your prescription items (3)                         │
│                                                                         │
│  For Telmisartan 40mg ─────────────────────────────────────────────    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │ [Image]      │  │ [Image]      │  │ [Image]      │                  │
│  │ Telma 40     │  │ Telmikind 40 │  │ Telpres 40   │                  │
│  │ 🔵 Rx        │  │ 🔵 Rx Generic│  │ 🔵 Rx Generic│                  │
│  │ 15 tablets   │  │ 15 tablets   │  │ 15 tablets   │                  │
│  │ ₹180   [+]   │  │ ₹95    [+]   │  │ ₹110   [+]   │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
│                                                                         │
│  For Metformin 500mg ──────────────────────────────────────────────    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │ Glycomet 500 │  │ Gluformin 500│  │ Metmin 500   │                  │
│  │ ...          │  │ ...          │  │ ...          │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
│                                                                         │
│  For Atorvastatin 10mg ────────────────────────────────────────────    │
│  [product cards]                                                        │
│                                                                         │
│ ┌──────────────────────────────────────────────────────────────────┐   │
│ │           Go to cart (2 items added) →                            │   │
│ └──────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

**Visual notes**:
- Each medicine has its own section header
- Multiple product options shown side by side (encourages comparison)
- "Generic" badge on cheaper alternatives
- Rx badge on every Rx product, consistent placement
- Sticky bottom CTA showing live count of items added

---

### Wireframe 6: Product Detail Page

```
┌────────────────────────────────────────────────────────────────────────┐
│ ← Back                                                                  │
│                                                                         │
│  ┌─────────────────┐   Telma 40 Tablet                                 │
│  │                 │   By Glenmark Pharmaceuticals                      │
│  │   [Product      │                                                    │
│  │    Image]       │   🔵 Prescription required                         │
│  │                 │   15 tablets                                       │
│  └─────────────────┘   ₹180   ̶₹̶2̶0̶0̶   (10% off)                       │
│                                                                         │
│                        Quantity:  [- 1 +]                               │
│                                                                         │
│                        [Add to cart]                                    │
│                                                                         │
│  ⚠ Prescription needed. You can upload at checkout.                    │
│                                                                         │
├────────────────────────────────────────────────────────────────────────┤
│  Composition                                                            │
│  ┌─────────────────────────────────────────────────┐                   │
│  │ Telmisartan          40 mg                       │                   │
│  └─────────────────────────────────────────────────┘                   │
│                                                                         │
│  Description                                                            │
│  Telma 40 is used to treat high blood pressure...                       │
│  [Show more]                                                            │
│                                                                         │
│  Similar alternatives                                                   │
│  [carousel of products with same composition]                           │
└────────────────────────────────────────────────────────────────────────┘
```

**Visual notes**:
- Image left, info right (desktop); stacked on mobile
- Rx badge near name + inline warning above CTA = double clarity
- Composition table is clean and scannable
- Alternatives section helps her find generics without searching again

---

### Wireframe 7: Cart Page

```
┌────────────────────────────────────────────────────────────────────────┐
│ ← Back                          Your Cart                               │
│                                                                         │
│  📍 Delivering to: A-211, Majestic Residency, Bangalore  [Change]      │
│                                                                         │
│  ⚠ Prescription required for 2 items                                   │
│  ┌────────────────────────────────────────────────────┐                │
│  │ [📄 Upload prescription]                            │                │
│  │ Or apply from saved prescriptions ▾                 │                │
│  └────────────────────────────────────────────────────┘                │
│                                                                         │
│  Prescription required (2) ────────────────────────────────────────    │
│  ┌─────────┐ Telma 40                                                  │
│  │ [img]   │ 15 tablets                                                 │
│  │         │ ₹180        [- 1 +]      [Remove]                          │
│  └─────────┘                                                            │
│  ┌─────────┐ Glycomet 500                                              │
│  │ [img]   │ 10 tablets                                                 │
│  │         │ ₹95         [- 1 +]      [Remove]                          │
│  └─────────┘                                                            │
│                                                                         │
│  Other items (1) ──────────────────────────────────────────────────    │
│  ┌─────────┐ Revital H                                                 │
│  │ [img]   │ 30 capsules                                                │
│  │         │ ₹420        [- 1 +]      [Remove]                          │
│  └─────────┘                                                            │
│                                                                         │
│  💾 [Save these as a medication profile]                                │
│                                                                         │
│  Bill Summary                                                           │
│  Items total                                  ₹695                      │
│  Delivery fee                                  ₹30                      │
│  Discount                                     -₹50                      │
│  ─────────────────────────────────                                      │
│  Total payable                                ₹675                      │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                  Proceed to Pay  ₹675  →                          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

**Visual notes**:
- Top banner for Rx items missing prescription (yellow/warning tone)
- Rx and non-Rx sections clearly separated with headers
- "Save as medication profile" appears only if Rx items present
- Bill summary clean and right-aligned, total emphasized
- Sticky CTA at bottom on long carts

---

### Wireframe 8: My Medications Page

```
┌────────────────────────────────────────────────────────────────────────┐
│ ← Back              My Medications                  [+ Add new]         │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────┐        │
│  │ Mom's BP meds                                3 medicines    │        │
│  │ Last ordered 12 days ago                                    │        │
│  │ • Telma 40   • Glycomet 500   • Atorlip 10                  │        │
│  │                                          [View]  [Reorder]  │        │
│  └────────────────────────────────────────────────────────────┘        │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────┐        │
│  │ Dad's thyroid                                1 medicine     │        │
│  │ Last ordered 4 days ago                                     │        │
│  │ • Thyronorm 50                                              │        │
│  │                                          [View]  [Reorder]  │        │
│  └────────────────────────────────────────────────────────────┘        │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────┐        │
│  │ My vitamins                                  2 medicines    │        │
│  │ Last ordered 8 days ago                                     │        │
│  │ • Revital H   • Zincovit                                    │        │
│  │                                          [View]  [Reorder]  │        │
│  └────────────────────────────────────────────────────────────┘        │
│                                                                         │
│  Empty state (if no profiles yet):                                      │
│  ┌────────────────────────────────────────────────────────────┐        │
│  │ No saved medications yet                                    │        │
│  │ Save medications from your cart to reorder in one tap       │        │
│  │ [Upload a prescription to start]                            │        │
│  └────────────────────────────────────────────────────────────┘        │
└────────────────────────────────────────────────────────────────────────┘
```

**Visual notes**:
- Each profile is a card with consistent layout
- Medicine names listed inline for quick recognition
- Two CTAs per profile: View (details) + Reorder (primary)
- Empty state is encouraging, not blank

---

### Wireframe 9: Order Confirmation and Tracking

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                       ✓ Order placed!                                   │
│                   Order #MQ12345                                        │
│                                                                         │
│              Arriving in approximately 25 minutes                       │
│                                                                         │
│  Order status                                                           │
│  ●━━━━━━●━━━━━━○──────○──────○                                          │
│  Placed  Verifying  Packed  Out    Delivered                            │
│           (Pharmacist                                                   │
│            verifying...)                                                │
│                                                                         │
│  📍 Delivering to: A-211, Majestic Residency, Bangalore                │
│                                                                         │
│  Order items (3)                                       [Expand ▾]       │
│                                                                         │
│  Payment: ₹675 paid via UPI                                            │
│                                                                         │
│                  [Need help?]    [Back to home]                         │
└────────────────────────────────────────────────────────────────────────┘
```

**Visual notes**:
- Success animation on landing (subtle, not over the top)
- Status timeline is horizontal on desktop, vertical on mobile
- Pharmacist verifying step has subtle loading animation (this is our faked verification)
- Items collapsed by default to keep the screen scannable

---

## Part 3: Information Architecture

The IA below shows how the app's information is structured, which directly influences how the database and APIs need to be designed later.

---

### IA Tree

```
App
│
├── Auth
│   ├── Phone number
│   ├── OTP
│   └── User profile
│       ├── Name
│       ├── Phone
│       └── Saved addresses
│
├── Home
│   ├── Active order banner (if applicable)
│   ├── My Medications strip (top 3 profiles)
│   ├── Shop by Concern (categories)
│   └── Recently Ordered (last N items)
│
├── Catalog
│   ├── Categories
│   │   └── Subcategories (optional, Phase 2)
│   ├── Products
│   │   ├── Name
│   │   ├── Manufacturer
│   │   ├── Composition (array of salts)
│   │   ├── Pack size
│   │   ├── Price
│   │   ├── Discount
│   │   ├── Rx required (boolean)
│   │   ├── Stock status
│   │   ├── Images
│   │   ├── Description
│   │   └── Alternatives (linked by composition)
│   └── Search
│       └── Indexed by: name, manufacturer, composition
│
├── Prescription
│   ├── Upload
│   │   ├── Image file
│   │   ├── Extracted text (from AI)
│   │   └── Extracted medicines (array)
│   ├── Manual entry
│   │   └── Typed medicines (array)
│   └── Validation
│       ├── Validity date (deferred to Phase 2)
│       └── Linked products
│
├── Cart
│   ├── Items
│   │   ├── Product ID
│   │   ├── Quantity
│   │   ├── Rx required (boolean)
│   │   └── Linked prescription ID (if any)
│   ├── Attached prescriptions
│   ├── Address
│   └── Bill
│       ├── Items total
│       ├── Delivery fee
│       ├── Discount
│       └── Total payable
│
├── Medication Profiles
│   ├── Profile ID
│   ├── Profile name (e.g. "Mom's BP meds")
│   ├── User ID (owner)
│   ├── Medicines
│   │   ├── Medicine name
│   │   ├── Composition
│   │   ├── Last ordered product ID
│   │   └── Quantity preference
│   ├── Linked prescription image
│   ├── Created at
│   └── Last ordered at
│
├── Orders
│   ├── Order ID
│   ├── User ID
│   ├── Items
│   ├── Attached prescriptions
│   ├── Address
│   ├── Payment status
│   ├── Order status (placed, verifying, packed, out, delivered)
│   └── Created at
│
└── Profile (account settings)
    ├── Personal info
    ├── Saved addresses
    ├── Payment methods (Phase 2)
    ├── Order history
    └── Logout
```

---

### Key Entity Relationships

For the database / API design later:

- A **User** has many **Medication Profiles**, many **Orders**, many **Saved Addresses**, many **Prescriptions**
- A **Medication Profile** has many **Medicines** (intent: name + composition)
- A **Medicine** in a profile links to a **last-ordered Product** (preference)
- A **Prescription** can be linked to many **Cart items** and many **Medication Profiles**
- A **Product** has a **Composition** (array of salts), which links it to other Products as alternatives
- A **Cart** belongs to one **User**, contains many **Cart Items**, can have many **Prescriptions** attached
- An **Order** is created from a **Cart** at checkout, freezing all values at that moment

---

### What This IA Enables

- Composition-based search and alternative suggestions (Products linked by Composition)
- Reorder flow without re-uploading (Medication Profile holds prescription reference)
- Rx separation in cart (Cart Items have Rx flag from Product)
- Order history and tracking (Orders are immutable snapshots)
- Multi-medicine prescriptions (Prescription extracts many medicines, each searched independently)

---

### What This IA Defers

- Multi-profile support (separate patients): the IA can support it later by adding a Patient entity nested under User, but UI doesn't expose this in MVP
- Push notifications and reminders: would add a Notifications entity and a Schedule entity
- Pharmacist verification queue: would add a Verification entity linked to Prescriptions and Orders, with assigned pharmacist
- Subscriptions / auto-refill: would add a Subscription entity referencing Medication Profile + schedule
