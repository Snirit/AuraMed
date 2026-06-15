# Sample Prescriptions — for Manual & Gemini Extraction Testing

This document gives you ready-to-use prescription samples for testing the upload-prescription flow. There are three types: text prescriptions for the manual entry flow, image prescriptions to test Gemini extraction, and edge-case samples.

---

## A. Manual Entry Test Cases

Test the `POST /api/prescriptions/manual` endpoint with these payloads. Each one tests a different matching scenario.

### A.1 Mom's BP prescription (matches existing profile)
```json
{
  "medicineNames": ["Telma 40", "Glycomet 500", "Atorlip 10"]
}
```
**Expected:** All 3 medicines matched to products by name. Compositions inferred correctly.

### A.2 Dad's thyroid (single medicine)
```json
{
  "medicineNames": ["Thyronorm 50"]
}
```
**Expected:** One medicine, composition "Thyroxine Sodium 50mcg".

### A.3 OTC cold combo (multiple salts per medicine)
```json
{
  "medicineNames": ["Sinarest", "Cetzine 10", "Strepsils"]
}
```
**Expected:** Sinarest matched with combination composition (Paracetamol + Phenylephrine + Chlorpheniramine).

### A.4 Mixed Rx + OTC
```json
{
  "medicineNames": ["Pantop 40", "Dolo 650", "Ascoril LS"]
}
```
**Expected:** All three matched. When added to cart, Pantop and Ascoril (Rx) should auto-attach matching prescription.

### A.5 Generic medicine name
```json
{
  "medicineNames": ["Telmikind 40", "Pacimol 650"]
}
```
**Expected:** Both matched. Generic flag tracked.

### A.6 Unknown medicines (fallback)
```json
{
  "medicineNames": ["Vintage Pills XR", "Future Med 100mg"]
}
```
**Expected:** Prescription still created. Composition shown as "Vintage Pills XR Salt" (no match → name + "Salt").

### A.7 Mixed known + unknown
```json
{
  "medicineNames": ["Dolo 650", "Wonderpill 5mg", "Crocin 650"]
}
```
**Expected:** Known meds get full composition, unknown gets fallback.

### A.8 Empty array (edge case)
```json
{
  "medicineNames": []
}
```
**Expected:** 400 error `{ code: "MISSING_MEDICINES" }`

### A.9 Single character / nonsense
```json
{
  "medicineNames": ["a"]
}
```
**Expected:** Created with fallback composition.

---

## B. Gemini Image Extraction Tests

The `POST /api/prescriptions/upload` endpoint takes `{ imageBase64: string }`. To test, you need actual prescription images.

### How to test:
1. Find or take photos of prescription images (examples below)
2. Convert to base64: `base64 -i prescription.jpg | tr -d '\n' > prescription.b64`
3. Construct the payload:
   ```bash
   IMG=$(cat prescription.b64)
   curl -X POST http://localhost:3000/api/prescriptions/upload \
     -H "Content-Type: application/json" \
     -d "{\"imageBase64\":\"data:image/jpeg;base64,$IMG\"}"
   ```
4. **Or simpler**: Use the UI at `/upload-prescription`, drag the image file

### B.1 Clear printed prescription (happy path)
- **Source:** Search Google Images for "indian prescription telma metformin" or use any printed prescription you have
- **Expected:** Gemini returns extracted medicines with `confidence: "high"`
- **Watch for:** Does it skip doctor name, patient info, dosing instructions?

### B.2 Handwritten prescription (degraded confidence)
- **Source:** A doctor's handwritten Rx (search "handwritten prescription india")
- **Expected:** Either empty `medicines: []` array, or medicines with `confidence: "low"`
- **Frontend behavior:** UI should prompt "We couldn't read this clearly — try manual entry"

### B.3 Photograph of prescription on a phone screen
- **Source:** Take a photo of a digital prescription PDF displayed on a screen
- **Expected:** Should still extract correctly (Gemini handles screen captures well)

### B.4 Rotated/skewed image
- **Source:** Take a prescription photo at a 30-45° angle
- **Expected:** Gemini usually handles rotation; should still extract

### B.5 Low light / dark image
- **Source:** Photo taken in dim lighting
- **Expected:** Likely returns `confidence: "low"` or empty array

### B.6 Multi-page prescription (only one page sent)
- **Source:** Just upload the first page of a multi-page Rx
- **Expected:** Extracts only what's visible

### B.7 Bill / receipt by mistake
- **Source:** Upload a pharmacy bill instead of a prescription
- **Expected:** Gemini may extract medicines from the bill (acceptable) or return empty (also acceptable)

### B.8 Completely unrelated image
- **Source:** Upload a photo of a sunset/cat/landscape
- **Expected:** `medicines: []` with empty rawText, frontend prompts manual entry

---

## C. Error Response Tests (Image Upload)

### C.1 Missing imageBase64
```bash
curl -X POST http://localhost:3000/api/prescriptions/upload \
  -H "Content-Type: application/json" -d '{}'
```
**Expected:** 400 `{ error: "imageBase64 is required", code: "MISSING_IMAGE" }`

### C.2 Non-image data URL
```bash
curl -X POST http://localhost:3000/api/prescriptions/upload \
  -H "Content-Type: application/json" \
  -d '{"imageBase64":"data:application/pdf;base64,JVBERi0xLjQ="}'
```
**Expected:** 400 `{ code: "INVALID_FILE_TYPE" }`

### C.3 Image too large (>5MB)
Generate a 6MB base64 blob:
```bash
python3 -c "print('A'*8400000)" > /tmp/big.b64
curl -X POST http://localhost:3000/api/prescriptions/upload \
  -H "Content-Type: application/json" \
  -d "{\"imageBase64\":\"data:image/jpeg;base64,$(cat /tmp/big.b64)\"}"
```
**Expected:** 413 `{ code: "IMAGE_TOO_LARGE" }`

### C.4 Gemini API unreachable
Edit `.env.local` to set `GEMINI_API_KEY=fake_key`, restart server, then upload a valid image.
**Expected:** 503 `{ code: "AI_DOWN" }`

### C.5 Gemini returns malformed JSON
Hard to force, but in practice happens with very unusual images. Backend should return:
**Expected:** 422 `{ code: "AI_PARSE_ERROR" }`

---

## D. Real Prescription Image Sources

If you don't have a printed prescription to scan, here are public sources:

1. **Wikipedia Commons** — search "prescription" or "medical prescription"
   - https://commons.wikimedia.org/wiki/Category:Medical_prescriptions
2. **Sample Indian prescriptions** in `/docs/` folder (if present):
   - `/Users/snigdhagupta/AuraMed/docs/mom_bp_prescription.png` (referenced by seed data)
   - `/Users/snigdhagupta/AuraMed/docs/dad_thyroid_prescription.png`
3. **Generate a fake one** for testing:
   - Open any word processor, type:
     ```
     Dr. Rajesh Kumar, MBBS
     Apollo Clinic, Bangalore
     Date: 14 June 2026

     Patient: Priya Sharma, Age 32

     Rx:
     1. Telma 40mg — 1 tablet daily, morning
     2. Glycomet 500mg — 1 tablet twice daily
     3. Atorlip 10mg — 1 tablet at night
     ```
   - Print to PDF, then take a screenshot
   - Use that screenshot as your "prescription"

---

## E. Testing Tips

- **Stub the Gemini call for fast UI testing:** Use the manual entry endpoint (`/api/prescriptions/manual`) instead of upload to skip AI latency during UI development
- **Watch the dev server console:** Gemini errors and responses get logged there
- **Check `/data/prescriptions.json` after each upload:** New entries should appear at the top of the array with a fresh `rx_<timestamp>` ID
- **Validate the `confidence` field:** It controls how the UI styles each extracted medicine row (high = green check, low = yellow warning)
