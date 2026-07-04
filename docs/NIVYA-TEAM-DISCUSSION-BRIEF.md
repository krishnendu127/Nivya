# Nivya — Team Discussion Brief

**Document type:** Business + product + engineering overview  
**Product:** Nivya — MF-only mutual fund distribution platform (Groww-style UX)  
**Business model:** Corporate Mutual Fund Distributor (AMFI ARN) — not SEBI stock broker  
**Version:** 1.0  
**Date:** 16 June 2026  
**Repository:** https://github.com/Sahil2927/Nivya  

> **Disclaimer:** This brief is operational guidance for internal team planning. It is **not legal, tax, or investment advice**. Engage a CA and SEBI/AMFI-experienced compliance counsel before any regulatory filing or public launch.

---

## Table of contents

1. [Executive summary](#1-executive-summary)  
2. [What Nivya is (and is not)](#2-what-nivya-is-and-is-not)  
3. [Current project status](#3-current-project-status)  
4. [Business checklist — before launch](#4-business-checklist--before-launch)  
5. [Regulatory framework (Corporate MFD)](#5-regulatory-framework-corporate-mfd)  
6. [Market access & vendor strategy](#6-market-access--vendor-strategy)  
7. [Recommended tech stack](#7-recommended-tech-stack)  
8. [Mobile: Flutter vs React Native](#8-mobile-flutter-vs-react-native)  
9. [Engineering roadmap (high level)](#9-engineering-roadmap-high-level)  
10. [Timeline & budget (order of magnitude)](#10-timeline--budget-order-of-magnitude)  
11. [30-day action plan](#11-30-day-action-plan)  
12. [Decisions required from team](#12-decisions-required-from-team)  
13. [References & repo map](#13-references--repo-map)  

---

## 1. Executive summary

Nivya is intended to launch as a **Corporate Mutual Fund Distributor** in India — distributing **mutual funds only** (lumpsum, SIP, redeem, switch, portfolio) under an **AMFI ARN**, similar to Groww’s original MF distribution phase.

**Recommended path:** **Hybrid (Path B)** — Nivya builds branded web + mobile UX and a BFF (backend-for-frontend); a wealth-tech vendor provides BSE/NSE exchange rails, KYC modules, mandates, and scheme master initially.

**Realistic timeline to public launch:** 5–8 months (hybrid) vs 9–12+ months (full custom exchange build).

**Current engineering state:** MF-only React prototype + mock Fastify BFF + UI wired to `/v1` API. Business registrations (ARN, empanelment, vendor) are **not yet complete** — required before real investor money.

---

## 2. What Nivya is (and is not)

| Nivya **IS** | Nivya **IS NOT** (without extra licenses) |
|--------------|-------------------------------------------|
| AMFI-registered MF distributor | SEBI stock broker |
| Platform for **Regular-plan** MF transactions | Equities / F&O trading |
| Trail-commission business from AMCs | Guaranteed-return products |
| Discovery + transaction + portfolio app | Personalized investment advice (needs SEBI RIA) |

### Business flow (Corporate MFD)

```
Retail Investor
  → Nivya App/Web (onboarding, discovery, orders)
  → KYC (CKYC/KRA)
  → Orders tagged with Nivya ARN + employee EUIN
  → BSE StAR MF or NSE MF Invest
  → RTA (CAMS / KFinTech)
  → AMC (unit allotment)
  → Trail commission to Nivya (Regular plans only)
```

### Revenue model

- **Trail commission** from AMCs on Regular-plan AUM (ongoing %).  
- **Not permitted:** upfront commission, guaranteed returns, misleading performance claims.

---

## 3. Current project status

| Item | Status |
|------|--------|
| MF-only UI (`nivya-app.jsx`) | ✅ Done — Home, Explore, Portfolio, SIPs, Profile |
| Vite + React web scaffold | ✅ Done |
| Mock BFF (`services/api`) | ✅ Done — Fastify on port 3001 |
| UI → BFF integration | ✅ Done — Live API badge, schemes/portfolio/SIPs, orders |
| `VendorMFAdapter` + mock | ✅ Done |
| OpenAPI v0.1, ADR-001, PostgreSQL schema SQL | ✅ Done (schema not wired yet) |
| Brand logo | ✅ Done — `public/nivya-logo.png` |
| Company incorporation | ⬜ Not confirmed |
| NISM V-A / EUIN | ⬜ Not confirmed |
| Corporate ARN | ⬜ Placeholder `ARN-XXXXXX` in demo |
| Hybrid vendor signed | ⬜ Not confirmed |
| AMC empanelment / BSE-NSE production | ⬜ Not started |

**Run locally (two terminals):**

```bash
npm install
npm run dev:api    # Terminal 1 — http://localhost:3001/v1
npm run dev        # Terminal 2 — http://localhost:5173 (proxies /v1)
```

Demo auth: `POST /v1/auth/otp/verify` with `{ "phone": "9876543210", "otp": "123456" }`.

---

## 4. Business checklist — before launch

### Phase A — Company foundation (Week 1–4)

| # | Task | Deliverable | Notes |
|---|------|-------------|-------|
| A1 | Incorporate **Nivya Pvt Ltd** or **LLP** | CIN, MOA/AOA, company PAN | ARN issued to legal entity |
| A2 | Open **company bank account** | Current account | Settlements, vendor fees |
| A3 | Engage **MF compliance counsel** | Retainer agreement | Review app copy & flows |
| A4 | Appoint **Compliance Officer** (fractional OK) | Named CO | Ongoing AMFI obligations |
| A5 | Decide **Pvt Ltd vs LLP** | Written decision | Governance & fundraising |

*Can run in parallel with prototype development.*

---

### Phase B — People certification (Week 2–6)

| # | Task | Deliverable | Notes |
|---|------|-------------|-------|
| B1 | Enroll for **NISM Series V-A** | Exam registration | Mandatory for MF distribution |
| B2 | Pass NISM V-A | Certificate | Prerequisite for EUIN |
| B3 | Apply **EUIN** via CAMS | EUIN number | Required on every transaction |
| B4 | Map EUIN to corporate entity | Linked employee | Corporate ARN needs ≥1 certified employee |

**Critical rule:** For a **corporate** entity, at least **one employee** must hold valid NISM V-A + EUIN **before** Corporate ARN is allotted.

---

### Phase C — AMFI registration (Week 3–8)

| # | Task | Deliverable |
|---|------|-------------|
| C1 | Apply for **Corporate ARN** | Application submitted (CAMS/AMFI online) |
| C2 | Complete **KYD** (Know Your Distributor) | Aadhaar-based verification (mandatory) |
| C3 | Submit required documents | DD pack per AMFI |
| C4 | Receive **ARN certificate** | Live ARN — replace demo placeholder in app |
| C5 | Annual **DSC** (Declaration of Self-Certification) | Ongoing AMFI obligation |

**Typical documents (verify with counsel / AMFI):** incorporation docs, company PAN, board resolution, NISM certificate, EUIN, KYD, fit & proper declarations for directors.

---

### Phase D — Policies & compliance (Week 4–10)

| # | Requirement |
|---|-------------|
| D1 | **Regular plan only** policy (initially) |
| D2 | Display **“AMFI-registered Mutual Fund Distributor”** + **ARN** on all surfaces (min font size 12) |
| D3 | Show **EUIN** on transaction confirmations |
| D4 | Standard MF **risk disclaimer** on all investment flows |
| D5 | **KIM / SID / SAI** access + logged consent before first investment per scheme |
| D6 | **No personalized investment advice** unless separately registered as SEBI RIA |
| D7 | **DPDP Act** privacy policy & data handling |
| D8 | **Grievance redressal** + SEBI SCORES escalation path |
| D9 | Annual AMFI **DSC** submission |

---

### Phase E — Market access (Week 6–16)

| # | Task | Purpose |
|---|------|---------|
| E1 | **Empanel with AMCs** (each fund house) | Place orders + earn trail commission |
| E2 | Register on **BSE StAR MF** | Primary transaction rail |
| E3 | Register on **NSE MF Invest** (optional) | Secondary REST rail |
| E4 | Obtain **exchange API** credentials (UAT → prod) | Engineering integration |
| E5 | **KRA** access (CVL, CAMS KRA, etc.) | Investor KYC |
| E6 | **Payment gateway** + **eNACH/OTM** | Lumpsum + SIP mandates |
| E7 | Investor **bank verification** | Redemption payouts |

**Target:** empanel with **top 10 AMCs** early (HDFC, ICICI, SBI, Nippon, Axis, PPFAS, etc.) — process can take weeks per AMC.

---

### Phase F — Hybrid vendor (Week 3–12)

| # | Task | Deliverable |
|---|------|-------------|
| F1 | Issue **RFP** to 3–5 wealth-tech vendors | RFP document |
| F2 | Vendor demos + scorecard | BSE/NSE, KYC, eNACH, API quality, pricing |
| F3 | **Sign hybrid vendor** contract / LOI | Legal agreement |
| F4 | Obtain **UAT API credentials** | Keys for engineering |

**Evaluate vendors on:** BSE StAR MF + NSE MF Invest support, white-label/custom frontend API, KYC module, eNACH/OTM, commission reconciliation, AMC coverage, pricing.

---

### Phase G — Launch readiness

| # | Task | When |
|---|------|------|
| G1 | Customer support (phone + email) | Before soft launch |
| G2 | Monthly commission reconciliation with AMCs | From first live orders |
| G3 | Monitor order success, KYC drop-off, SIP bounce | Soft launch |
| G4 | Security audit / penetration test | Before scale |
| G5 | App Store / Play Store compliance review | Before mobile launch |
| G6 | Marketing — **no guaranteed returns** | Always |

---

### What you can do now vs must have before real money

| Stage | Business minimum | Engineering |
|-------|------------------|-------------|
| **Now (prototype)** | Incorporation started, counsel engaged | UI + mock BFF ✅ |
| **Alpha** | NISM + EUIN in progress, vendor shortlisted | PostgreSQL, OTP login, KYC UI |
| **UAT beta** | ARN received, vendor UAT keys, 3+ AMCs | Real sandbox orders |
| **Soft launch** | Live ARN in app, grievance live, support trained | 50–200 real users |
| **Public launch** | Full empanelment, prod exchange creds | App stores + marketing |

**You cannot accept real retail investments until Phase C + E are largely complete.**

---

## 5. Regulatory framework (Corporate MFD)

### Governing references

- SEBI Master Circular for Mutual Funds (Jun 27, 2024) — intermediaries  
- AMFI Master Circular for Mutual Fund Distributors (Jan 14, 2026)  
- AMFI online registration via CAMS portal  

### Prohibited / restricted without extra licenses

| Activity | Status |
|----------|--------|
| Guaranteed / indicative return schemes | **Prohibited** |
| Personalized investment advice | **Requires SEBI RIA** |
| Stock / F&O trading | **Requires SEBI broker registration** |
| Holding client money outside prescribed flows | **Prohibited** |

---

## 6. Market access & vendor strategy

### Hybrid architecture (accepted — ADR-001)

```
Investor UI (web + mobile)
        │  HTTPS /v1/*
        ▼
  Nivya BFF (services/api)
   ├── Auth (OTP)
   ├── Profile + KYC orchestration
   ├── Order orchestration + consent gate
   ├── Portfolio (cache + vendor sync)
   └── Immutable audit_events
        │
        ▼
  VendorMFAdapter (services/vendor-mf)
   ├── MockAdapter (dev — current)
   └── VendorXAdapter (production — TBD)
        │
        ▼
  BSE StAR MF / NSE MF Invest → RTA → AMC
```

**Nivya owns:** brand, UX, user data, order orchestration, compliance audit trail.  
**Vendor owns (initially):** exchange API maintenance, many AMC integrations, mandates, scheme master.

---

## 7. Recommended tech stack

### What runs in the repo today

| Layer | Technology |
|-------|------------|
| Web UI | React 19 + Vite 7 |
| Charts / icons | Recharts, Lucide React |
| API client | `src/nivya-api.js` |
| BFF | Node.js + Fastify 5 |
| Monorepo | npm workspaces |
| Compliance | `packages/compliance/` |
| Vendor layer | `services/vendor-mf/` |

### Production target

| Layer | Recommendation | Rationale |
|-------|----------------|-----------|
| **Web** | Next.js (React) | SEO for fund discovery; migrate from Vite |
| **Mobile** | React Native | Same React ecosystem; port from prototype |
| **Backend** | Node (Fastify → optional NestJS) | Speed; same language as frontend |
| **Database** | PostgreSQL + Redis | ACID orders; cache sessions/NAV |
| **Queue** | Kafka or AWS SQS | Async order status, reconciliation |
| **Infra** | AWS Mumbai / Azure India | Data residency |
| **Monorepo** | Turborepo | `apps/web`, `apps/mobile`, shared packages |

### External integrations (via vendor adapter)

| System | Role |
|--------|------|
| BSE StAR MF | Primary order rail |
| NSE MF Invest | Optional second rail |
| KRA / CKYC | Investor KYC |
| RTA (CAMS, KFinTech) | Folios, holdings, CAS |
| Razorpay / Cashfree | Lumpsum payment + eNACH SIP |
| SMS/OTP provider | Login OTP |

---

## 8. Mobile: Flutter vs React Native

**Important:** React + Vite is **web only**. For Android + iOS App Store apps, choose **React Native** or **Flutter** — not Vite alone.

| Factor | Flutter | React + React Native |
|--------|---------|----------------------|
| Reuse `nivya-app.jsx` | No — rewrite in Dart | Partial — same patterns, shared packages |
| Reuse BFF `/v1` API | Yes | Yes |
| Web + mobile team | Often separate stacks | One JS/TS ecosystem |
| Aligns with ADR-001 | No | **Yes** |
| Time to mobile beta | Slower (UI rewrite) | Faster (port screens) |

**Recommendation for Nivya:** **React (Vite → Next.js) + React Native** — because the prototype, BFF, and architecture docs are already React/Node.

**Avoid for production MF app:** wrapping the Vite site in WebView/Capacitor as the primary mobile product.

---

## 9. Engineering roadmap (high level)

| Sprint | Focus | Exit criteria |
|--------|-------|---------------|
| **1** (Weeks 1–2) | PostgreSQL + wire `infra/schema.sql` | State survives API restart |
| **2** (Weeks 2–4) | OTP login UI, remove auto demo login | Manual login flow |
| **3** (Weeks 4–6) | KYC onboarding + consent/audit log | KYC gate before orders |
| **4** (Weeks 6–8) | Order status, server-side portfolio updates | Full invest/redeem/SIP on mock rails |
| **5** (Weeks 8–14) | Vendor UAT adapter | Real UAT lumpsum + SIP |
| **6** (Weeks 10–16) | `packages/api-client`, Next.js migration, RN shell | Shared SDK + mobile start |

---

## 10. Timeline & budget (order of magnitude)

### Timeline

| Approach | Time to public launch |
|----------|----------------------|
| Full custom exchange build | 9–12+ months |
| **Hybrid (recommended)** | **5–8 months** |
| White-label + branding only | 4–6 months |

### Budget (India, excl. marketing)

| Category | Estimate |
|----------|----------|
| Engineering team (9–12 months) | ₹80L – ₹2Cr |
| Compliance, legal, AMFI/exchange fees | ₹10L – ₹30L |
| Infra, security audit, tools | ₹15L – ₹40L |
| **Total v1** | **₹1.5Cr – ₹4Cr** |

Hybrid vendor path typically reduces engineering cost vs full custom BSE integration.

---

## 11. 30-day action plan

| Week | Business track | Product / tech track |
|------|----------------|----------------------|
| **1** | Incorporate company; counsel kickoff | Finalize hybrid vendor approach |
| **2** | Enroll NISM V-A for key hire | Monorepo + prototype (✅ done) |
| **3** | Begin ARN application + KYD | PostgreSQL + auth UI |
| **4** | Vendor RFP + first AMC empanelment contacts | Order persistence + audit log |

---

## 12. Decisions required from team

| # | Decision | Options | Impact |
|---|----------|---------|--------|
| 1 | Build vs hybrid vs white-label | Hybrid recommended | Timeline, cost, UX control |
| 2 | Primary exchange rail | BSE first vs NSE first | Integration priority |
| 3 | RIA later? | Yes / No | Product copy & licensing |
| 4 | Entity type | Pvt Ltd / LLP | Governance, fundraising |
| 5 | Mobile stack | **React Native** (recommended) / Flutter | Hiring, code reuse |
| 6 | Payment gateway | Razorpay / Cashfree | SIP mandate integration |
| 7 | Hybrid vendor | Shortlist from RFP | API access timeline |

---

## 13. References & repo map

### Regulatory links

| Resource | URL |
|----------|-----|
| AMFI Master Circular for MFDs (Jan 2026) | https://www.amfiindia.com/uploads/AMFI_Master_Cicular_for_MF_Ds_3c7f5ee44f.pdf |
| AMFI — Important Information for Distributors | https://www.amfiindia.com/distributor-corner/importantinformation_distributors |
| Documents required for distributors | https://www.amfiindia.com/Themes/Theme1/downloads/Documentsrequired01-Oct-2024.pdf |
| FAQs on Distributor Due Diligence | https://www.amfiindia.com/Themes/Theme1/downloads/FAQsonDistributorsDueDiligence.pdf |
| BSE StAR MF | https://www.bseindia.com/Static/Markets/MutualFunds/BSEStarMF.aspx |
| NSE MF Invest | https://www.nseindia.com/static/products-services/about-nmf-getting-on-to |

### Repository documents

| File | Purpose |
|------|---------|
| `NIVYA-MF-PLATFORM-REPORT.md` | Full strategic & regulatory report |
| `HYBRID-E2E-PLAN.md` | Phase-by-phase execution plan |
| `docs/ADR-001-hybrid-architecture.md` | Architecture decision record |
| `docs/openapi.yaml` | BFF API contract v0.1 |
| `infra/schema.sql` | PostgreSQL schema v0.1 |
| `docs/NIVYA-TEAM-DISCUSSION-BRIEF.md` | This document |

---

*End of team discussion brief.*
