#!/bin/bash
# AuraMed API Test Suite — Curl Commands for Every Edge Case
#
# Usage:
#   bash docs/testing/02-curl-tests.sh                  # run all
#   bash docs/testing/02-curl-tests.sh auth             # run only auth tests
#   bash docs/testing/02-curl-tests.sh products cart    # multiple sections
#
# Requires: jq (for pretty JSON output) and a running dev server on :3000

BASE="http://localhost:3000"
USER="user_priya_001"
RUN_ALL=true
SECTIONS="$@"

if [ -n "$SECTIONS" ]; then
  RUN_ALL=false
fi

should_run() {
  $RUN_ALL && return 0
  for s in $SECTIONS; do
    [ "$s" = "$1" ] && return 0
  done
  return 1
}

section() {
  echo ""
  echo "═══════════════════════════════════════════════════════════════"
  echo "  $1"
  echo "═══════════════════════════════════════════════════════════════"
}

test_case() {
  echo ""
  echo "─── $1 ───"
}

# ============================================================================
if should_run auth; then
section "1. AUTHENTICATION"

test_case "1.1 Send OTP (happy path)"
curl -s -X POST $BASE/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919876543210"}' | jq .

test_case "1.2 Verify OTP — demo bypass"
curl -s -X POST $BASE/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"demo"}' | jq '.user.name, .sessionToken'

test_case "1.3 Verify OTP — correct OTP"
curl -s -X POST $BASE/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919876543210","otp":"123456"}' | jq '.user.name'

test_case "1.4 Verify OTP — wrong OTP (expect INVALID_OTP)"
# Send fresh OTP first
curl -s -X POST $BASE/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919999988888"}' > /dev/null
curl -s -X POST $BASE/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919999988888","otp":"000000"}' | jq .

test_case "1.5 Verify OTP — no OTP requested (expect OTP_NOT_FOUND)"
curl -s -X POST $BASE/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+91nobody","otp":"123456"}' | jq .

test_case "1.6 Missing phone"
curl -s -X POST $BASE/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{}' | jq .
fi

# ============================================================================
if should_run products; then
section "2. PRODUCTS"

test_case "2.1 Get all products (count)"
curl -s "$BASE/api/products" | jq '.products | length'

test_case "2.2 Search by salt — telmisartan"
curl -s "$BASE/api/products?search=telmisartan" | jq '.products | map(.name)'

test_case "2.3 Search by name — glycomet"
curl -s "$BASE/api/products?search=glycomet" | jq '.products | map(.name)'

test_case "2.4 Filter by category — diabetes"
curl -s "$BASE/api/products?category=diabetes" | jq '.products | length'

test_case "2.5 Filter by composition — paracetamol"
curl -s "$BASE/api/products?composition=paracetamol" | jq '.products | map(.name)'

test_case "2.6 No results"
curl -s "$BASE/api/products?search=xyzzy" | jq .

test_case "2.7 Product detail + alternatives"
curl -s "$BASE/api/products/prod_telma_40" | jq '{product: .product.name, alternatives: (.alternatives | map(.name))}'

test_case "2.8 Product not found"
curl -s "$BASE/api/products/prod_fake" | jq .
fi

# ============================================================================
if should_run categories; then
section "3. CATEGORIES"

test_case "3.1 Get all categories"
curl -s "$BASE/api/categories" | jq '.categories | map(.name)'
fi

# ============================================================================
if should_run prescriptions; then
section "4. PRESCRIPTIONS"

test_case "4.1 Manual prescription — happy path"
curl -s -X POST $BASE/api/prescriptions/manual \
  -H "Content-Type: application/json" \
  -d "{\"medicineNames\":[\"Dolo 650\",\"Crocin 650\"],\"userId\":\"$USER\"}" | jq .

test_case "4.2 Manual prescription — unknown medicine (still succeeds)"
curl -s -X POST $BASE/api/prescriptions/manual \
  -H "Content-Type: application/json" \
  -d "{\"medicineNames\":[\"Imaginary Pill\"],\"userId\":\"$USER\"}" | jq .

test_case "4.3 Manual prescription — empty array (expect 400)"
curl -s -X POST $BASE/api/prescriptions/manual \
  -H "Content-Type: application/json" \
  -d '{"medicineNames":[]}' | jq .

test_case "4.4 Upload prescription — missing image (expect 400)"
curl -s -X POST $BASE/api/prescriptions/upload \
  -H "Content-Type: application/json" \
  -d '{}' | jq .

test_case "4.5 Upload prescription — non-image data URL (expect INVALID_FILE_TYPE)"
curl -s -X POST $BASE/api/prescriptions/upload \
  -H "Content-Type: application/json" \
  -d '{"imageBase64":"data:application/pdf;base64,abc"}' | jq .

test_case "4.6 Search products for prescription medicine"
curl -s "$BASE/api/prescriptions/search-products?medicineName=Telma&composition=Telmisartan%2040mg" | jq '.matches | map(.name)'

test_case "4.7 Search products — no query (expect 400)"
curl -s "$BASE/api/prescriptions/search-products" | jq .

# Note: Real Gemini test requires a real prescription image.
# See docs/testing/03-sample-prescriptions.md for instructions.
fi

# ============================================================================
if should_run cart; then
section "5. CART"

# Reset cart first for clean state
curl -s -X DELETE "$BASE/api/cart/item/prod_telma_40?userId=$USER" > /dev/null

test_case "5.1 Add Rx item — auto-attach matching Rx"
curl -s -X POST $BASE/api/cart/add \
  -H "Content-Type: application/json" \
  -d "{\"productId\":\"prod_telma_40\",\"quantity\":1,\"userId\":\"$USER\"}" | jq '.cart.items, .cart.attachedPrescriptionIds'

test_case "5.2 Add same product again — increment"
curl -s -X POST $BASE/api/cart/add \
  -H "Content-Type: application/json" \
  -d "{\"productId\":\"prod_telma_40\",\"quantity\":2,\"userId\":\"$USER\"}" | jq '.cart.items'

test_case "5.3 Update quantity to 5"
curl -s -X PUT $BASE/api/cart/update \
  -H "Content-Type: application/json" \
  -d "{\"productId\":\"prod_telma_40\",\"quantity\":5,\"userId\":\"$USER\"}" | jq '.cart.items'

test_case "5.4 Add out-of-stock item (expect OUT_OF_STOCK + alternatives)"
curl -s -X POST $BASE/api/cart/add \
  -H "Content-Type: application/json" \
  -d "{\"productId\":\"prod_januvia_50\",\"quantity\":1,\"userId\":\"$USER\"}" | jq .

test_case "5.5 Add nonexistent product (expect PRODUCT_NOT_FOUND)"
curl -s -X POST $BASE/api/cart/add \
  -H "Content-Type: application/json" \
  -d "{\"productId\":\"prod_fake\",\"quantity\":1,\"userId\":\"$USER\"}" | jq .

test_case "5.6 Attach prescription explicitly"
curl -s -X POST $BASE/api/cart/attach-prescription \
  -H "Content-Type: application/json" \
  -d "{\"prescriptionId\":\"rx_dads_thyroid_001\",\"userId\":\"$USER\"}" | jq '.cart.attachedPrescriptionIds'

test_case "5.7 Attach nonexistent prescription (expect RX_NOT_FOUND)"
curl -s -X POST $BASE/api/cart/attach-prescription \
  -H "Content-Type: application/json" \
  -d "{\"prescriptionId\":\"rx_fake\",\"userId\":\"$USER\"}" | jq .

test_case "5.8 Get cart"
curl -s "$BASE/api/cart?userId=$USER" | jq '.cart, (.products | map(.name))'

test_case "5.9 Delete item — Rx auto-pruned"
curl -s -X DELETE "$BASE/api/cart/item/prod_telma_40?userId=$USER" | jq '.cart.items, .cart.attachedPrescriptionIds'

test_case "5.10 Set quantity to 0 (remove)"
curl -s -X POST $BASE/api/cart/add \
  -H "Content-Type: application/json" \
  -d "{\"productId\":\"prod_dolo_650\",\"quantity\":3,\"userId\":\"$USER\"}" > /dev/null
curl -s -X PUT $BASE/api/cart/update \
  -H "Content-Type: application/json" \
  -d "{\"productId\":\"prod_dolo_650\",\"quantity\":0,\"userId\":\"$USER\"}" | jq '.cart.items'
fi

# ============================================================================
if should_run profiles; then
section "6. MEDICATION PROFILES"

test_case "6.1 List profiles"
curl -s "$BASE/api/medication-profiles?userId=$USER" | jq '.profiles | map(.name)'

test_case "6.2 Reorder Mom's BP — cart populated"
curl -s -X POST $BASE/api/medication-profiles/mp_moms_bp/reorder \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER\"}" | jq '.cart.items, .outOfStockItems'

test_case "6.3 Create profile from cart"
curl -s -X POST $BASE/api/medication-profiles \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test Profile $(date +%s)\",\"prescriptionId\":\"rx_moms_bp_001\",\"userId\":\"$USER\"}" | jq '.profile.name, .profile.medicines'

test_case "6.4 Reorder nonexistent profile (expect PROFILE_NOT_FOUND)"
curl -s -X POST $BASE/api/medication-profiles/mp_fake/reorder \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER\"}" | jq .

test_case "6.5 Create profile with empty cart (expect EMPTY_CART)"
# Clear cart first
curl -s -X PUT $BASE/api/cart/update -H "Content-Type: application/json" -d "{\"productId\":\"prod_telma_40\",\"quantity\":0,\"userId\":\"$USER\"}" > /dev/null
curl -s -X PUT $BASE/api/cart/update -H "Content-Type: application/json" -d "{\"productId\":\"prod_glycomet_500\",\"quantity\":0,\"userId\":\"$USER\"}" > /dev/null
curl -s -X PUT $BASE/api/cart/update -H "Content-Type: application/json" -d "{\"productId\":\"prod_atorlip_10\",\"quantity\":0,\"userId\":\"$USER\"}" > /dev/null
curl -s -X POST $BASE/api/medication-profiles \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Empty\",\"prescriptionId\":\"rx_moms_bp_001\",\"userId\":\"$USER\"}" | jq .
fi

# ============================================================================
if should_run orders; then
section "7. ORDERS"

test_case "7.1 Place order with empty cart (expect EMPTY_CART)"
curl -s -X POST $BASE/api/orders \
  -H "Content-Type: application/json" \
  -d "{\"addressId\":\"addr_bangalore_001\",\"userId\":\"$USER\"}" | jq .

test_case "7.2 Place order — missing addressId (expect MISSING_ADDRESS)"
# Add items first
curl -s -X POST $BASE/api/cart/add -H "Content-Type: application/json" -d "{\"productId\":\"prod_dolo_650\",\"quantity\":2,\"userId\":\"$USER\"}" > /dev/null
curl -s -X POST $BASE/api/orders \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER\"}" | jq .

test_case "7.3 Place order — happy path"
ORDER=$(curl -s -X POST $BASE/api/orders \
  -H "Content-Type: application/json" \
  -d "{\"addressId\":\"addr_bangalore_001\",\"userId\":\"$USER\"}")
echo "$ORDER" | jq '.order | {id, status, bill, itemCount: (.items | length)}'
ORDER_ID=$(echo "$ORDER" | jq -r '.order.id')

test_case "7.4 Order status — 0s after placement (expect placed)"
curl -s "$BASE/api/orders/$ORDER_ID" | jq '.order.status'

test_case "7.5 Order status — 5s after (expect verifying)"
sleep 5
curl -s "$BASE/api/orders/$ORDER_ID" | jq '.order.status'

test_case "7.6 Sample order status — fixed (expect out_for_delivery)"
curl -s "$BASE/api/orders/order_sample_001" | jq '.order.status'

test_case "7.7 List all orders"
curl -s "$BASE/api/orders?userId=$USER" | jq '.orders | map({id, status})'

test_case "7.8 Get nonexistent order (expect ORDER_NOT_FOUND)"
curl -s "$BASE/api/orders/order_fake" | jq .
fi

# ============================================================================
if should_run concurrency; then
section "8. CONCURRENCY"

# Reset cart
curl -s -X DELETE "$BASE/api/cart/item/prod_dolo_650?userId=$USER" > /dev/null

test_case "8.1 Three parallel adds — mutex serializes"
(
  curl -s -X POST $BASE/api/cart/add -H "Content-Type: application/json" -d "{\"productId\":\"prod_dolo_650\",\"quantity\":1,\"userId\":\"$USER\"}" &
  curl -s -X POST $BASE/api/cart/add -H "Content-Type: application/json" -d "{\"productId\":\"prod_dolo_650\",\"quantity\":1,\"userId\":\"$USER\"}" &
  curl -s -X POST $BASE/api/cart/add -H "Content-Type: application/json" -d "{\"productId\":\"prod_dolo_650\",\"quantity\":1,\"userId\":\"$USER\"}" &
  wait
) > /dev/null
echo "Final quantity (expect 3):"
curl -s "$BASE/api/cart?userId=$USER" | jq '.cart.items[] | select(.productId == "prod_dolo_650") | .quantity'
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ALL TESTS COMPLETE"
echo "═══════════════════════════════════════════════════════════════"
