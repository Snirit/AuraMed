# AuraMed Testing Documents

This folder contains everything you need to manually verify every flow and edge case in the AuraMed backend.

## 📋 Documents

| File | What it is | When to use |
|------|-----------|-------------|
| **`01-test-plan.md`** | Complete edge-case matrix organized by feature area | Reference & checklist — work through each section to validate the backend |
| **`02-curl-tests.sh`** | Executable shell script with curl commands for every API endpoint and edge case | Quick API smoke test — run after any code change |
| **`03-sample-prescriptions.md`** | Sample prescription payloads (manual entry text) + instructions for Gemini image testing | Testing the upload-prescription flow |
| **`04-ui-walkthroughs.md`** | Click-by-click browser test scripts for end-to-end user journeys | UI/integration testing — confirms the frontend correctly drives the backend |

## 🚀 Quick Start

### 1. Run the API smoke test
```bash
cd /Users/snigdhagupta/AuraMed
bash docs/testing/02-curl-tests.sh
```
This runs all 8 sections (auth, products, categories, prescriptions, cart, profiles, orders, concurrency) and prints results.

### 2. Run just one section
```bash
bash docs/testing/02-curl-tests.sh cart
bash docs/testing/02-curl-tests.sh auth products
```

### 3. UI walkthroughs
Open `http://localhost:3000`, then follow the steps in `04-ui-walkthroughs.md`. Each walkthrough is 5–15 minutes.

### 4. Real Gemini test
Open `/upload-prescription`, drag a real prescription image. See `03-sample-prescriptions.md` for image sources.

## ✅ What's covered

- **9 user journeys** end-to-end
- **8 sections of API tests** with ~40 individual cases
- **9 manual-entry prescription samples** + image upload edge cases
- **8 UI walkthroughs** for different Priya personas
- **All locked decisions** from the brief (auth, OTP, demo bypass, etc.)
- **All edge cases** from the brief (out of stock, expired Rx, blurry images, etc.)

## 🐛 Reporting bugs

When a test fails, note:
1. Which test (e.g. "5.5 Add nonexistent product")
2. Expected response vs actual
3. Relevant `/data/*.json` file state
4. Dev server console output

## 📦 Dependencies

- `jq` — JSON pretty-printing (`brew install jq`)
- `curl` — comes with macOS
- A running dev server (`npm run dev`)
