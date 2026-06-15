# Nivya — Mutual Fund Distribution Platform
## Strategic, Regulatory & Technical Architecture Report

**Document type:** Business analysis + fintech systems architecture  
**Product:** Nivya — retail MF investment app (Groww-style, MF-only)  
**Business model:** Corporate Mutual Fund Distributor (MFD)  
**Target channels:** Web, Android, iOS  
**Intent:** Production launch (company formation)  
**Report date:** June 16, 2026  
**Status of codebase reviewed:** `nivya-app.jsx` (single-file React prototype, 1,232 lines)

---

## Executive Summary

Nivya is intended to launch as a **Corporate Mutual Fund Distributor** in India — not as a SEBI-registered stock broker. This is the correct regulatory path for a **mutual-funds-only** product similar to Groww’s original distribution model.

The current codebase (`nivya-app.jsx`) is a **high-quality UI prototype** with mock data and simulated prices. Approximately **25–30%** of UI patterns (especially MF screens and mobile design) can inform production; **0%** of trading, portfolio, or compliance logic is production-ready.

**Recommended path to launch:**
1. Incorporate Nivya + obtain **AMFI Corporate ARN** + **EUIN**-certified staff  
2. Empanel with AMCs + register on **BSE StAR MF** and/or **NSE MF Invest**  
3. Build or hybridize a platform with real **KYC**, **order**, **mandate**, and **portfolio reconciliation** integrations  
4. Strip stock/equity features from the prototype; focus product strictly on MF distribution  

**Realistic timeline:** 9–12 months (full custom stack) or 4–6 months (hybrid white-label rails + custom Nivya UX).

> **Disclaimer:** This report is systems and business architecture guidance, not legal advice. Engage SEBI/AMFI-experienced compliance counsel before launch.

---

## Table of Contents

1. [Scope & Business Model](#1-scope--business-model)  
2. [Current State Analysis (`nivya-app.jsx`)](#2-current-state-analysis-nivya-appjsx)  
3. [Regulatory Framework — Corporate MFD](#3-regulatory-framework--corporate-mfd)  
4. [Revenue & Unit Economics](#4-revenue--unit-economics)  
5. [Target Production Architecture](#5-target-production-architecture)  
6. [Integration Map](#6-integration-map)  
7. [Product Scope — MF-Only Groww Parity](#7-product-scope--mf-only-groww-parity)  
8. [Gap Analysis: Prototype vs Production](#8-gap-analysis-prototype-vs-production)  
9. [Build vs Buy Decision](#9-build-vs-buy-decision)  
10. [Recommended Tech Stack](#10-recommended-tech-stack)  
11. [Team & Organization](#11-team--organization)  
12. [Phased Execution Roadmap](#12-phased-execution-roadmap)  
13. [Risk Register](#13-risk-register)  
14. [Immediate 30-Day Action Plan](#14-immediate-30-day-action-plan)  
15. [Open Decisions Required](#15-open-decisions-required)  
16. [References](#16-references)

---

## 1. Scope & Business Model

### 1.1 Confirmed product scope

| Dimension | Decision |
|-----------|----------|
| **Entity** | Indian company (Pvt Ltd or LLP) — “Nivya” |
| **License model** | **AMFI Corporate MFD (ARN)** — not SEBI stock broker |
| **Products** | Mutual funds only: lumpsum, SIP, STP, SWP, switch, redeem |
| **Channels** | Web + Android + iOS |
| **Go-to-market** | Production launch; company being formed |
| **Positioning** | Groww-like UX; MF distribution only |

### 1.2 Scope evolution (conversation context)

| Earlier mention | Final scope |
|-----------------|-------------|
| Registered broker, stocks + MF + F&O | **MF-only Corporate MFD** |
| Full broking (Zerodha Kite-like) | **Not in scope** — would require separate SEBI broker registration |

### 1.3 What Nivya is vs is not

| Nivya IS | Nivya IS NOT (without additional licenses) |
|----------|--------------------------------------------|
| AMFI-registered MF distributor | SEBI stock broker |
| Platform for Regular-plan MF transactions | Equities / F&O / commodity broker |
| Trail-commission business from AMCs | Upfront-commission or guaranteed-return schemes |
| Transaction + discovery + portfolio app | Personalized investment adviser (unless SEBI RIA added) |

### 1.4 Business flow (Corporate MFD model)

```
Retail Investor
    → Nivya App/Web (onboarding, discovery, orders)
    → KYC (CKYC/KRA)
    → Orders tagged with Nivya ARN + employee EUIN
    → BSE StAR MF or NSE MF Invest (transaction rail)
    → RTA (CAMS / KFinTech)
    → AMC (unit allotment)
    → Trail commission to Nivya (Regular plans only)
```

---

## 2. Current State Analysis (`nivya-app.jsx`)

### 2.1 Repository state

| Item | Status |
|------|--------|
| Files in workspace | `nivya-app.jsx` only |
| `package.json` / build scaffold | **Not present** |
| Backend / API | **Not present** |
| Database | **Not present** |
| Auth / persistence | **Not present** |

The file self-describes as:

> *“Nivya — a mobile-first investing app (Groww-style demo). Single-file React artifact. Mock data + simulated live prices.”*

### 2.2 Implemented features (demo level)

| Area | What works | Code location (approx.) |
|------|------------|-------------------------|
| **Navigation** | 5 tabs: Home, Stocks, Funds, Portfolio, Profile | `BottomNav`, `App` tab state |
| **Home** | Portfolio value, day P&L, indices, holdings preview, watchlist, trending | `Home` component |
| **Stocks** | Search, gainers/losers, watchlist stars | `Stocks` component |
| **Mutual funds** | Category chips, fund list | `Funds` component, `FUNDS` data |
| **Portfolio** | Allocation bar, holdings, chart | `Portfolio` component |
| **Stock detail** | Price chart (1D/1W/1M/1Y), stats, Buy/Sell | `StockDetail` component |
| **Fund detail** | NAV, returns chart, SIP/One-time CTAs (toast only) | `FundDetail` component |
| **Trading** | Market/Limit order sheet; updates local holdings | `TradeSheet`, `confirmTrade` |
| **Live prices** | Simulated ticks every 2.6 seconds | `useEffect` interval in `App` |
| **Design** | Groww-like mobile UI, splash, toast, CSS design system | Inline `CSS` block (~260 lines) |

### 2.3 Mock data inventory

| Dataset | Count | Notes |
|---------|-------|-------|
| Stocks (`STOCKS`) | 17 | NSE-style symbols with mock prices |
| Indices (`INDICES`) | 4 | NIFTY 50, SENSEX, etc. |
| Mutual funds (`FUNDS`) | 8 | Scheme name, category, returns, NAV |
| Holdings (`INITIAL_HOLDINGS`) | 6 | Stock holdings only |
| Watchlist (`INITIAL_WATCH`) | 5 | Stock symbols |
| User profile | 1 fixed user | “Shambhu” — hardcoded |
| Demo margin cap | ₹50,000 | In `TradeSheet` |

### 2.4 Dependencies (from imports)

- `react` — UI framework  
- `recharts` — area charts, portfolio/fund charts  
- `lucide-react` — icons  

### 2.5 Explicit non-production behaviors

- Trade sheet states: *“Demo order — no real trade is executed.”*
- Profile menu items show demo toasts only  
- Prices generated via `setInterval` random drift — not market data  
- Holdings stored in React `useState` — lost on refresh  
- No KYC, bank linking, mandates, or exchange integration  

### 2.6 Architecture snapshot (current)

```
┌─────────────────────────────────────┐
│         nivya-app.jsx               │
│  ┌─────────┐  ┌─────────────────┐  │
│  │ React   │  │ Mock STOCKS/    │  │
│  │ UI      │──│ FUNDS/INDICES   │  │
│  └─────────┘  └─────────────────┘  │
│       │              │              │
│       ▼              ▼              │
│  useState         setInterval        │
│  (holdings,       (simulated         │
│   watchlist)       quotes)           │
└─────────────────────────────────────┘
         No backend · No persistence
```

---

## 3. Regulatory Framework — Corporate MFD

### 3.1 License: AMFI ARN (not SEBI broker)

Corporate MFD registration is governed by:

- **SEBI Master Circular for Mutual Funds** (Jun 27, 2024) — Chapter 15 on intermediaries  
- **AMFI Master Circular for Mutual Fund Distributors** (Jan 14, 2026)  
- **AMFI online registration** via CAMS portal  

**Key rule:** All persons/entities engaged in selling/marketing MF units must:
1. Pass **NISM Series V-A: Mutual Fund Distributors** examination  
2. Register with **AMFI** and obtain **ARN** (entity) / **EUIN** (employees)

For a **non-individual (corporate) entity:**
- At least **one employee** must hold valid NISM certification + **EUIN** mapped to the corporate ARN before ARN is allotted.

### 3.2 Corporate formation checklist

| # | Requirement | Timing |
|---|-------------|--------|
| 1 | Incorporate **Pvt Ltd** or **LLP** | Month 0 |
| 2 | Company PAN, bank account | Month 0–1 |
| 3 | At least 1 employee: **NISM V-A + EUIN** | Before ARN |
| 4 | Apply for **Corporate ARN** (CAMS online) | Month 1–2 |
| 5 | **KYD** (Know Your Distributor) — Aadhaar-based | Mandatory (Oct 2024 onward) |
| 6 | Directors/signatories: fit & proper | Ongoing |
| 7 | Compliance function / counsel | Before launch |

### 3.3 Market access checklist

| # | Requirement | Purpose |
|---|-------------|---------|
| 8 | **Empanelment with AMCs** (each fund house) | Place orders + receive trail commission |
| 9 | Register on **BSE StAR MF** | Primary transaction rail (highest volume) |
| 10 | Register on **NSE MF Invest** (optional/additional) | Alternative REST-oriented rail |
| 11 | **API access** on chosen exchange(s) | Production order placement |
| 12 | **KRA** integration (CVL, CAMS KRA, etc.) | Investor KYC |
| 13 | **eNACH / OTM** mandate setup | SIP auto-debit |
| 14 | Investor bank verification | Redemption payouts |

### 3.4 App & communication compliance (pre-launch)

| # | Requirement |
|---|-------------|
| 15 | Display **“AMFI-registered Mutual Fund Distributor”** + **ARN** on all surfaces (min font size 12) |
| 16 | Show **EUIN** on transactions |
| 17 | Standard MF risk disclaimer on all investment flows |
| 18 | Provide **KIM / SID / SAI** access before investment |
| 19 | **No personalized investment advice** unless separately registered as **SEBI RIA** |
| 20 | Annual **Declaration of Self-Certification (DSC)** to AMFI |
| 21 | **DPDP Act** compliance for personal data |
| 22 | Grievance redressal mechanism + SEBI SCORES escalation path |

### 3.5 Commission rules (AMFI Master Circular Ch. 5)

- MFDs receive **trail commission only** from AMCs (full trail model; no upfront commission)  
- Commission applies to **Regular plans** with valid **ARN + EUIN** on transactions  
- **Direct plans:** no commission to distributor  
- Commission not payable on distributor’s own investments (with defined joint-holder exceptions)  

### 3.6 Activities explicitly prohibited / restricted

| Activity | Status for Nivya MFD |
|----------|----------------------|
| Guaranteed / indicative return schemes | **Prohibited** |
| Personalized investment advice | **Requires SEBI RIA** |
| Stock / F&O trading | **Requires SEBI broker registration** |
| Accepting client securities/money outside prescribed flows | **Prohibited** |

---

## 4. Revenue & Unit Economics

### 4.1 Revenue model

| Source | Description |
|--------|-------------|
| **Trail commission** | Ongoing % from AMC on Regular-plan AUM |
| **B-30 incentives** | Potential higher trail for beyond-top-30 cities (AMC-dependent) |
| **Not permitted** | Upfront commission, guaranteed return products |

### 4.2 Key business metrics to track

| Metric | Definition |
|--------|------------|
| **AUM** | Total Regular-plan assets under Nivya ARN |
| **SIP book** | Monthly SIP registrations + retention |
| **SIP bounce rate** | Failed mandate debits |
| **KYC conversion** | Signup → KYC complete → first order |
| **Cohort retention** | 3/6/12-month active investors |
| **Cost per funded account** | Marketing + ops / new investors with ≥1 order |

---

## 5. Target Production Architecture

### 5.1 Logical system map

```
┌──────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                             │
│   Web (Next.js)  │  iOS (RN/Flutter)  │  Android (RN/Flutter) │
└────────────────────────────┬─────────────────────────────────┘
                             │
                    CDN + WAF + API Gateway / BFF
                             │
┌────────────────────────────┴─────────────────────────────────┐
│                    NIVYA CORE PLATFORM                        │
├──────────────┬──────────────┬──────────────┬─────────────────┤
│ Auth & User  │ KYC Orch.    │ Scheme       │ Portfolio       │
│ Service      │ Service      │ Catalog      │ Service         │
├──────────────┼──────────────┼──────────────┼─────────────────┤
│ Order        │ SIP/Mandate  │ Payment      │ Notifications   │
│ Service      │ Service      │ Orchestration│ & Reports       │
├──────────────┴──────────────┴──────────────┴─────────────────┤
│ Admin / Ops │ Compliance Audit Log │ Reconciliation Jobs    │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────┴─────────────────────────────────┐
│                   EXTERNAL INTEGRATIONS                         │
│  BSE StAR MF │ NSE MF Invest │ KRA/CKYC │ CAMS/KFinTech RTA  │
│  Razorpay/Cashfree eNACH │ SMS/Email │ Video KYC (optional)  │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Core microservices / modules

| Service | Responsibility | Key integrations |
|---------|----------------|------------------|
| **Identity** | Signup, login, MFA, device binding | OTP provider |
| **KYC orchestration** | PAN verify, KRA fetch, new KYC, status | CKYC/KRA APIs |
| **Investor profile** | Nominee, FATCA, bank accounts, risk questionnaire | Internal DB |
| **Scheme catalog** | Empanelled schemes, NAV, returns, filters | AMC/RTA/exchange masters |
| **Order service** | Purchase, redeem, switch, STP, SWP | BSE/NSE APIs |
| **SIP engine** | Register/modify/pause/cancel + mandate link | Exchange + eNACH |
| **Portfolio** | Holdings, XIRR, P&L, CAS reconciliation | RTA + exchange reports |
| **Commission ops** | ARN/EUIN tagging in order payload | Back-office |
| **Compliance** | Consent logs, disclosure timestamps, audit trail | Immutable event store |
| **Notification** | Order status, SIP debit, KYC pending | FCM/APNs + SMS/email |

### 5.3 Order lifecycle (production state machine)

```
DRAFT
  → PAYMENT_PENDING
  → MANDATE_PENDING (SIP)
  → SUBMITTED_TO_EXCHANGE
  → ACCEPTED / REJECTED
  → UNITS_ALLOTED
  → COMPLETED
       ↘ FAILED (with reason code + user notification)
```

Every state transition must write to an **immutable audit log**.

### 5.4 KYC flow

```
PAN entered
  → KRA lookup (Validated / Registered / Not found)
    → If not found: capture OVD, signature, IPV (if required)
    → CKYC upload
    → Status: KYC Registered
    → Gate: first order allowed only after KYC complete (server-side)
```

### 5.5 SIP + mandate flow

1. Investor selects SIP (scheme, amount, date)  
2. Create **eNACH/OTM** mandate (payment gateway or exchange mandate API)  
3. Mandate approved → register SIP on exchange with **ARN + EUIN**  
4. Monthly: debit → purchase order → allotment → portfolio update  

### 5.6 Portfolio reconciliation (daily batch)

- Pull holdings from exchange/RTA reports  
- Reconcile against internal order ledger  
- Flag mismatches for ops team  

---

## 6. Integration Map

### 6.1 Transaction rails

| Platform | API characteristics | Market note |
|----------|----------------------|-------------|
| **BSE StAR MF** | SOAP/legacy + newer APIs; dominant volume | Primary recommendation |
| **NSE MF Invest** | REST-oriented (v2.0; migration from NMF II in Aug 2025) | Secondary / dual-rail |

**Pattern:** Implement an `ExchangeAdapter` interface; BSE first, NSE second.

### 6.2 Other integrations

| System | Purpose |
|--------|---------|
| **KRA** (CVL, CAMS KRA, etc.) | KYC status fetch + new KYC submission |
| **RTA** (CAMS, KFinTech) | Folio, holdings, CAS |
| **MF Central** (v1.1) | Import external MF holdings |
| **Payment gateway** (Razorpay, Cashfree) | Lumpsum payment + eNACH mandates |
| **OTP/SMS/Email** | Auth + transactional comms |
| **Video KYC** (optional) | Enhanced KYC if required |

### 6.3 Access prerequisites for exchange APIs

1. Valid **AMFI ARN**  
2. Empanelled on **BSE StAR MF** and/or **NSE MF Invest**  
3. API access application via official exchange developer portal  
4. UAT/sandbox credentials before production  

---

## 7. Product Scope — MF-Only Groww Parity

### 7.1 MVP (Launch v1) — must have

| Feature | User story |
|---------|------------|
| **Onboarding** | Mobile OTP → PAN → KYC status → bank → ready to invest |
| **Fund discovery** | Search, categories (Large/Small/Hybrid/ELSS), filters |
| **Fund detail** | NAV, returns, riskometer, expense ratio, KIM/SID download |
| **Lumpsum** | One-time buy with payment |
| **SIP** | Amount, date, mandate setup, first installment |
| **Portfolio** | Current value, invested, returns (XIRR), scheme breakdown |
| **Redeem / switch** | Partial/full redeem, switch between schemes |
| **Orders** | Pending / success / failed with clear status |
| **Mandates** | View/manage eNACH/OTM |
| **Profile** | Bank, nominee, statements, support |
| **Compliance UI** | ARN tagline, disclaimers, EUIN on order confirmation |

### 7.2 v1.1 — competitive parity

| Feature |
|---------|
| STP / SWP |
| Goal-based buckets (product framing, not advice) |
| ELSS tax saver section |
| NFO listing |
| Watchlist |
| SIP step-up |
| Import external MF via CAS / MF Central |
| Dark mode, biometric lock |

### 7.3 Out of scope (unless additional licenses obtained)

| Feature | Required license |
|---------|------------------|
| Stocks, F&O, IPO | SEBI stock broker |
| Personalized “you should buy X” recommendations | SEBI RIA |
| PMS / AIF distribution | Separate regulations |
| Guaranteed returns marketing | Prohibited under MFD code |

---

## 8. Gap Analysis: Prototype vs Production

### 8.1 What transfers to production

| Prototype asset | Production use |
|-----------------|----------------|
| MF list UI (`Funds`, `FUNDS` data structure) | Fund discovery — wire to real scheme master |
| Fund detail UI (`FundDetail`) | Extend with KIM/SID, riskometer, real NAV history |
| Mobile-first CSS design system | Shared design tokens for web + mobile |
| SIP / One-time CTAs | Replace toast with real order + mandate flows |
| Profile shell | KYC status, bank, mandates, statements |
| Bottom nav pattern | MF-focused navigation (remove Stocks tab) |

### 8.2 What must be removed or rebuilt

| Prototype asset | Action |
|-----------------|--------|
| `STOCKS`, `StockDetail`, `TradeSheet`, stock ticks | **Remove** — wrong license model |
| Simulated `setInterval` quotes | Replace with NAV feed + order webhooks |
| Local `holdings` / `confirmTrade` | Replace with RTA/exchange-backed portfolio |
| Hardcoded user “Shambhu” | Real auth + KYC-linked profile |
| Demo margin ₹50,000 | Real payment gateway / bank verification |
| Indices strip, stock watchlist, equity portfolio | Remove or replace with MF indices/benchmarks only |

### 8.3 Reuse estimate

| Layer | Reuse % |
|-------|---------|
| UI patterns & design system | ~25–30% |
| Business / compliance logic | ~0% |
| Backend / integrations | 0% (greenfield) |

---

## 9. Build vs Buy Decision

| Path | Description | Pros | Cons | Timeline |
|------|-------------|------|------|----------|
| **A. White-label MFD platform** | Use established wealth-tech vendor rails | Fastest launch; pre-built BSE/NSE/AMC integrations | Less differentiation; vendor lock-in; revenue share | 4–6 months |
| **B. Hybrid (recommended for v1)** | Vendor rails + custom Nivya-branded UX | Balance of speed and product control | Integration complexity; dual vendor dependency | 5–8 months |
| **C. Full custom** | Build all integrations in-house | Full ownership; maximum differentiation | Highest cost/time; you own all API maintenance | 9–12+ months |

**Recommendation for a new company:** Start with **Path B (Hybrid)** for v1 launch; plan migration of core services to custom as AUM scales.

---

## 10. Recommended Tech Stack

| Layer | Recommendation | Rationale |
|-------|----------------|-----------|
| **Mobile** | React Native or Flutter | Single codebase for Android + iOS |
| **Web** | Next.js (React) | SEO for fund discovery; shared logic via monorepo |
| **Backend** | NestJS (Node) or Spring (Java) | NestJS for speed; Java for heavy reporting/back-office |
| **Database** | PostgreSQL + Redis | ACID for orders; cache for sessions/NAV |
| **Queue** | Kafka or AWS SQS | Async order status, webhooks, reconciliation |
| **Audit** | Append-only event log | Regulatory traceability |
| **Infra** | AWS Mumbai / Azure India | Data residency |
| **Monorepo** | Turborepo: `apps/web`, `apps/mobile`, `packages/ui`, `packages/api-client` | Reuse React patterns from prototype |

### 10.1 Suggested repository structure (target)

```
nivya/
├── apps/
│   ├── web/                 # Next.js investor web app
│   ├── mobile/              # React Native app
│   └── admin/               # Ops & compliance console
├── services/
│   ├── api-gateway/
│   ├── auth/
│   ├── kyc/
│   ├── orders/
│   ├── portfolio/
│   └── notifications/
├── packages/
│   ├── ui/                  # Shared components (from prototype design system)
│   ├── api-client/
│   └── compliance/          # Disclaimers, ARN display, consent helpers
├── infra/                   # Terraform / CDK
└── docs/
    └── NIVYA-MF-PLATFORM-REPORT.md
```

---

## 11. Team & Organization

### 11.1 Minimum team for production launch

| Role | Count | When needed |
|------|-------|-------------|
| Founder / CEO | 1 | Day 0 |
| Compliance officer / consultant | 1 (fractional OK initially) | Before ARN |
| NISM-certified ops/sales (EUIN holder) | 1+ | Before first live order |
| Legal (SEBI/MF-experienced) | External retainer | Month 0 |
| Engineering lead | 1 | Month 1 |
| Backend engineers | 2–3 | Month 2 |
| Mobile engineers | 1–2 | Month 2 |
| Frontend engineer | 1 | Month 2 |
| QA | 1 | Month 4 |
| DevOps | 1 (shared OK) | Month 3 |
| Customer support | 2 | Pre-launch |

### 11.2 Budget order of magnitude (India, custom build)

| Category | Estimate |
|----------|----------|
| Engineering team (9–12 months) | ₹80L – ₹2Cr |
| Compliance, legal, AMFI/exchange fees | ₹10L – ₹30L |
| Infra, security audit, tools | ₹15L – ₹40L |
| **Total v1 (excl. marketing)** | **₹1.5Cr – ₹4Cr** |

Hybrid white-label path can reduce engineering cost significantly.

---

## 12. Phased Execution Roadmap

### Phase 0 — Foundation (Weeks 1–8)

**Business**
- [ ] Incorporate Nivya Pvt Ltd / LLP  
- [ ] Open company bank account  
- [ ] NISM V-A for ≥1 employee → EUIN  
- [ ] Apply corporate ARN + KYD  
- [ ] Engage MF compliance counsel  
- [ ] Decide: Build vs Hybrid vs White-label  

**Product / Tech**
- [ ] Scaffold monorepo (web + mobile + API)  
- [ ] Strip stocks from prototype; MF-only design  
- [ ] Define OpenAPI contracts for all services  

### Phase 1 — Market Access (Weeks 6–16)

- [ ] Empanel with top AMCs (HDFC, ICICI, SBI, Nippon, Axis, PPFAS, etc.)  
- [ ] Register on BSE StAR MF / NSE MF Invest  
- [ ] Obtain UAT/sandbox API credentials  
- [ ] KRA sandbox integration  
- [ ] Payment gateway + eNACH sandbox  

### Phase 2 — Core Platform (Weeks 10–24)

- [ ] Auth + investor profile  
- [ ] KYC orchestration (end-to-end)  
- [ ] Scheme catalog + fund detail  
- [ ] Lumpsum order (UAT)  
- [ ] SIP + mandate (UAT)  
- [ ] Portfolio from exchange/RTA feeds  
- [ ] Admin ops panel  
- [ ] Compliance: consent logs, ARN display, audit trail  

### Phase 3 — Hardening (Weeks 20–32)

- [ ] Security audit + penetration test  
- [ ] Load testing (SIP day spikes)  
- [ ] Reconciliation jobs  
- [ ] Grievance workflow  
- [ ] App Store / Play Store compliance review  
- [ ] Soft launch (real small orders, controlled cohort)  

### Phase 4 — Public Launch (Week 32+)

- [ ] Production exchange credentials  
- [ ] Monitoring & on-call  
- [ ] Customer support live  
- [ ] Marketing (no guaranteed-return claims)  

### Timeline summary

| Approach | Estimated time to public launch |
|----------|--------------------------------|
| Full custom | 9–12 months |
| Hybrid (recommended) | 5–8 months |
| White-label + branding | 4–6 months |

---

## 13. Risk Register

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| 1 | Advice vs distribution blur | Regulatory action | Compliance review of all copy; no personalized recommendations |
| 2 | EUIN not captured on orders | Commission forfeiture | Hard-block order submit without valid EUIN |
| 3 | Direct plan leakage | Revenue loss | Regular plan only on Nivya rails; clear Direct disclaimer |
| 4 | KYC incomplete orders | Regulatory violation | Server-side KYC gate |
| 5 | Mandate failures on SIP day | Investor churn | Retry logic + notifications + ops dashboard |
| 6 | Exchange API changes | Order failures | Adapter layer; monitor exchange circulars |
| 7 | Data breach | Legal + reputational | Encrypt PII; tokenize PAN; DPDP compliance |
| 8 | Commission disputes | Revenue leakage | Monthly ARN-tagged order reconciliation with AMC |
| 9 | AMC empanelment delays | Limited fund universe | Start empanelment early; parallel top-10 AMCs |
| 10 | Underestimating ops load | Poor investor experience | Hire support + ops before marketing spend |

---

## 14. Immediate 30-Day Action Plan

| Week | Business track | Product / tech track |
|------|----------------|----------------------|
| **1** | Incorporate company; counsel kickoff on MFD model | Document: Build vs Hybrid vs White-label decision |
| **2** | Enroll NISM V-A for key hire | Monorepo scaffold; extract MF screens from prototype |
| **3** | Begin ARN application (docs, KYD) | API design doc: User, KYC, Order, Portfolio services |
| **4** | Contact BSE/NSE + first 3 AMC empanelment | MF-only clickable prototype (no stock mock data) |

---

## 15. Open Decisions Required

These decisions block architecture finalization:

| # | Decision | Options | Impact |
|---|----------|---------|--------|
| 1 | **Build vs hybrid** | Full custom / Hybrid / White-label | Timeline, cost, differentiation |
| 2 | **Primary exchange rail** | BSE first / NSE first / Both at launch | Integration priority |
| 3 | **RIA later?** | Yes (personalized advice) / No (distribution only) | Product copy, licensing, UX |
| 4 | **Entity type** | Pvt Ltd / LLP | Governance, fundraising |
| 5 | **Mobile framework** | React Native / Flutter | Team hiring, code sharing with web |

---

## 16. References

### Regulatory

| Resource | URL |
|----------|-----|
| AMFI Master Circular for MFDs (Jan 2026) | https://www.amfiindia.com/uploads/AMFI_Master_Cicular_for_MF_Ds_3c7f5ee44f.pdf |
| AMFI — Important Information for Distributors | https://www.amfiindia.com/distributor-corner/importantinformation_distributors |
| AMFI — Documents required for distributors | https://www.amfiindia.com/Themes/Theme1/downloads/Documentsrequired01-Oct-2024.pdf |
| AMFI — FAQs on Distributor Due Diligence | https://www.amfiindia.com/Themes/Theme1/downloads/FAQsonDistributorsDueDiligence.pdf |
| SEBI Master Circular for Mutual Funds (Jun 2024) | Referenced via AMFI Master Circular |
| BSE StAR MF | https://www.bseindia.com/Static/Markets/MutualFunds/BSEStarMF.aspx |
| NSE MF Invest — Getting started | https://www.nseindia.com/static/products-services/about-nmf-getting-on-to |

### Industry / technical

| Resource | URL |
|----------|-----|
| MFD platform models (BSE/NSE/MFU overview) | https://creso.in/blog/mfd-platforms-india |
| NSE MF Invest migration (Aug 2025) | https://cafemutual.com/news/industry/35745-mfds-highlight-teething-troubles-in-nses-new-mf-platform-nse-mf-invest |

### Codebase

| Resource | Location |
|----------|----------|
| Current prototype | `nivya-app.jsx` (workspace root) |
| This report | `NIVYA-MF-PLATFORM-REPORT.md` |

---

## Appendix A — Groww comparison (MF-only phase)

Groww launched as an MF distribution platform before expanding into SEBI-registered broking. Nivya’s stated MF-only scope aligns with **Groww Phase 1**, not the full Groww product today (which includes stocks, F&O, etc.).

| Capability | Groww (full product today) | Nivya (planned MF-only) |
|------------|---------------------------|-------------------------|
| Mutual funds | ✓ | ✓ (core) |
| SIP / lumpsum | ✓ | ✓ (core) |
| Stocks | ✓ | ✗ (out of scope) |
| F&O | ✓ | ✗ (out of scope) |
| License | Broker + MFD | **MFD (ARN) only** |

---

## Appendix B — Prototype component inventory (for refactor planning)

| Component / module | Lines (approx.) | MF production relevance |
|--------------------|-----------------|-------------------------|
| `CSS` design tokens | 17–273 | **High** — extract to shared styles |
| `STOCKS`, `INDICES` data | 276–302 | **Remove** |
| `FUNDS` data | 304–313 | **Medium** — replace with API |
| `INITIAL_HOLDINGS` (stocks) | 315–322 | **Replace** with MF holdings model |
| `Home` | 482–608 | **Partial** — remove equity sections |
| `Stocks` | 611–654 | **Remove** |
| `Funds` | 657–698 | **High** |
| `Portfolio` | 701–776 | **High** — rebuild data layer |
| `Profile` | 779–834 | **Medium** — extend for KYC/bank |
| `StockDetail` | 838–917 | **Remove** |
| `FundDetail` | 921–964 | **High** |
| `TradeSheet` | 968–1041 | **Replace** with MF order sheet |
| `App` (root state) | 1066–1231 | **Rebuild** — auth, API, persistence |

---

*End of report.*

