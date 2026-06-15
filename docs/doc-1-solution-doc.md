# Document 1: Solution Doc

**Quick Commerce App for Medicines**

This document covers: the thought process and trade-offs that led to our chosen persona, full persona details, MVP feature scope, and what we've explicitly chosen to leave out.

---

## 1. Problem Context

- Medicine delivery in India today splits into two camps, each solving half the problem:
  - **Pharmacy-first platforms** (PharmEasy, 1mg, Apollo 24/7, NetMeds): deep prescription handling, but slow (same-day to next-day delivery)
  - **Generalist quick commerce** (Blinkit, Zepto, Swiggy Instamart): 15 to 30 minute delivery, but thin OTC catalog with weak prescription support
- The structural reason no one bridges both: prescription dispensing requires pharmacist verification, which doesn't fit naturally inside a 15-minute delivery window
- This gap is the opportunity

---

## 2. How We Arrived at Our Persona

Rather than picking a persona by gut, we evaluated three candidates against the problem.

### Candidate Personas Considered

| Persona | Description | Why Considered |
|---|---|---|
| **Caregiver Daughter (Priya)** | 32, manages parents' chronic meds from another city | High-frequency, sticky, underserved, emotionally invested |
| **Chronic Patient (Rohit)** | 45, manages own diabetes + cholesterol | Predictable repeat demand, classic chronic refill user |
| **Acute First-Timer (Ananya)** | 27, occasional sudden needs (fever, period pain) | Aligns with quick commerce speed promise |

### Evaluation Framework

We scored each persona on five parameters:

| Parameter | What It Measures |
|---|---|
| **Frequency** | How often the user opens the app |
| **Stickiness** | How likely they are to keep using it long-term |
| **Pain Severity** | How underserved their pain is by existing players |
| **Feature Fit** | How well our differentiators (AI extraction, medication profile) serve them |
| **Demo Strength** | How clearly the persona's journey shows our value |

### Scoring

| Parameter | Priya (Caregiver) | Rohit (Chronic) | Ananya (Acute) |
|---|---|---|---|
| Frequency | High (manages multiple people's meds) | High (monthly refills) | Low (occasional) |
| Stickiness | Very High (emotional + logistical lock-in) | High (habit + condition) | Low (one-off orders) |
| Pain Severity | High (no app today serves caregivers well) | Medium (chronic patients have some options) | Low (Blinkit/Zepto serve OTC reasonably) |
| Feature Fit | Very High (medication profile is central) | High | Low (medication profile irrelevant) |
| Demo Strength | High (clear before/after contrast) | High | Medium |

### Trade-offs in the Decision

- **Choosing Priya over Rohit**: Both are chronic-leaning, but Priya represents a sharper, more underserved wedge. Chronic patients have several decent options today; caregivers managing remote parents have almost none built for them specifically. Priya also expands the addressable market beyond people with chronic conditions to include their caregivers.
- **Choosing Priya over Ananya**: Acute users align better with quick commerce speed messaging, but the medication profile feature (our biggest differentiator) is meaningless for one-off acute orders. Building for Ananya would force us into a feature-parity race with Blinkit, where we'd lose on logistics scale.
- **Cost of choosing Priya**: We deprioritize the "speed" narrative that quick commerce usually leans on. We compensate by leaning on "reliability and reduced cognitive load" as the trust-builder.

### Final Decision

- **Primary persona**: Priya (the Caregiver Daughter)
- **Secondary, served by same product**: Rohit (chronic patient) — uses the same medication profile feature, lower priority for messaging
- **Out of MVP focus**: Ananya (acute) — the product works for her, but she's not whom we design for

---

## 3. Persona Details: Priya

### Demographics

- **Age**: 32
- **Gender**: Female
- **Location**: Bangalore (lives), Pune (parents)
- **Occupation**: Marketing Manager at a mid-size tech company
- **Family**: Married, no kids yet, parents (60+) live in another city
- **Income**: Upper middle class, dual-income household
- **Education**: Postgraduate

### Psychographics

- Tech-comfortable but not tech-obsessed
- Time-poor, juggling career and family responsibilities
- Anxious about her parents' health from a distance
- Values reliability over novelty
- Reads health content casually, not deeply
- Skeptical of apps that overpromise

### Goals

- Make sure mom and dad never run out of essential medicines
- Manage refills from her phone without phone-tag with parents
- Stop mentally tracking 4-5 different prescriptions
- Save time by not re-uploading prescriptions every month
- Find cost-effective alternatives without compromising on quality

### Pain Points

- **Re-uploads same prescription every refill** (top frustration)
- Has to remember which medicine, which dosage, which brand
- Forgets refill dates and then it's an emergency
- Parents struggle with English-only labels and apps
- Doesn't know when generic substitutes are safe
- Has prescriptions scattered across WhatsApp, email, and physical copies

### Buying Behavior

- Buys mostly for parents (chronic conditions), sometimes self/husband (OTC)
- Pays for parents' medicines remotely
- Uses UPI / saved cards
- Prefers reading reviews before trying new brands
- Will pay slightly more for reliability over saving INR 20

### Mental Model When Opening the App

- "Did I order mom's BP meds this month?"
- "I think dad needs his thyroid one again"
- "I have a new prescription from her doctor visit last week"
- Rarely: "I need paracetamol right now"

---

## 4. MVP Feature Scope

### Core Principles

- Every feature must reduce cognitive load for Priya, not add to it
- Default to her most common task: reordering known medicines
- Make new prescriptions easy enough that she'll save them for future

### In Scope for MVP

| Feature | Why It's In |
|---|---|
| **Search by name and composition** | Foundation for finding any medicine, including generics |
| **Categories ("Shop by concern")** | For occasional needs and discovery |
| **Product detail pages** | Standard e-commerce requirement, includes composition table |
| **Rx badges across all screens** | Compliance + clarity, user always knows status |
| **Prescription upload (printed only)** | Core differentiator, post-order upload model |
| **AI extraction of medicine names** | The "magic" moment that earns trust |
| **Editable extracted list** | User retains control, AI is a helper not a gatekeeper |
| **Swiggy-style results (Rx items grouped)** | Shows alternatives by composition, lets user choose brand |
| **Manual entry fallback (for handwritten Rx)** | Honest about AI limits, still serves the user |
| **Cart with Rx separation** | Clear what needs prescription, what doesn't |
| **Post-order prescription upload** | Lower friction than blocking at cart |
| **Save for reorder (in cart)** | Creates medication profile |
| **My Medications hub** | Priya's primary surface, one-tap reorder |
| **Faked pharmacist verification step** | Shows compliance flow without building the real backend |
| **Order confirmation + tracking** | Standard, includes verification status |

### Out of Scope for MVP

#### Deferred to Phase 2 (Documented, Not Built)

| Feature | Why Deferred |
|---|---|
| **Acute/urgent mode** | Phase 2 extension; same infrastructure, different framing |
| **Real pharmacist verification queue** | Operations/regulatory workstream, faked in UI for MVP |
| **Refill reminders / "Due in X days"** | Adds complexity without core value for the demo |
| **Push notifications** | Requires backend infrastructure |
| **Subscription / auto-refill** | Trust risk if auto-charges fail; validate manual reorder first |
| **Cross-store fulfillment** | Inventory and routing complexity not needed for MVP |
| **Real substitution decision flow** | Pharmacist confirmation loop; faked as "alternatives shown" |
| **Real-time delivery tracking with map** | Demo doesn't need this |

#### Out of Scope Entirely

| Feature | Why Cut |
|---|---|
| **Handwritten prescription extraction** | Unreliable, undermines trust; manual fallback handles this |
| **Dosage extraction and quantity computation** | Adds complexity without clear value; user picks pack size from product |
| **Multi-profile support (caregiver mode)** | Designed-around in data model, not exposed in UI |
| **Cold chain categories (insulin, vaccines)** | Separate fulfillment + packaging investment |
| **Teleconsultation / doctor chat** | Different product surface; risks diluting the commerce focus |
| **Schedule X / controlled substances** | Distinct compliance flow; out of scope for any MVP |
| **Prescription validity / expiry enforcement** | Documented as edge case, not enforced in MVP |
| **Drug interaction warnings** | Requires pharmacist input; out of scope |
| **Insurance integration** | Major scope expansion |

---

## 5. Strategic Trade-offs Made

| Trade-off | Decision | Why |
|---|---|---|
| Build for caregivers or chronic patients directly? | Caregivers (Priya) | Sharper wedge, more underserved, broader market |
| Pre-order vs post-order prescription upload? | Post-order | Familiar pattern (Swiggy), lower friction to start browsing |
| AI extract dosage and compute quantity? | No, just medicine names | Cleaner MVP, user picks pack size from product anyway |
| Handle handwritten prescriptions with AI? | No, manual fallback | Reliability over coverage; honest expectations |
| Save medication profile after order or in cart? | In cart | Commit moment is right place to ask |
| Show "Due in X days" estimates? | No, just "last ordered date" | Avoids inaccurate inference; reminders are Phase 2 |
| Build for desktop web or mobile app? | Desktop web app, mobile responsive | Faster to build for assignment, demo flexibility |
| Real pharmacist verification or faked? | Faked UI step | Compliance flow visible without backend ops investment |

---

## 6. Success Criteria for MVP

### What the MVP Must Prove

- Priya can complete a new prescription order end-to-end with AI extraction (Path A)
- Priya can reorder a saved medication in 3 taps or fewer (My Medications)
- Rx vs OTC handling is visible and consistent across all screens
- The product feels designed for caregivers, not generic e-commerce

### What the MVP Does NOT Need to Prove

- Real-time delivery logistics
- Actual pharmacist verification backend
- Scaling to millions of users
- Full catalog completeness

---

## 7. Open Risks (Acknowledged)

| Risk | Mitigation |
|---|---|
| AI extraction fails on demo prescription | Manual entry fallback always visible |
| Demo prescription is handwritten by mistake | Pre-select a printed example for demo |
| Reviewer questions caregiver-first choice | This document defends it explicitly |
| Reviewer expects acute flow | Phase 2 section documents how it extends |
| Reviewer expects full backend | Solution doc explains faked verification as deliberate scope choice |
