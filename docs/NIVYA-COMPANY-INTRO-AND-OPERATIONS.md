# Nivya — Company Introduction & Operations Outline

**Document type:** Internal company brief (strategy, operations, positioning)  
**Audience:** Strategy team, founders, compliance counsel, engineering  
**Version:** 1.0  
**Date:** 22 June 2026  
**Repository:** https://github.com/Sahil2927/Nivya  
**Related docs:** `NIVYA-TEAM-DISCUSSION-BRIEF.md`, `NIVYA-MF-PLATFORM-REPORT.md`, `HYBRID-E2E-PLAN.md`, `docs/ADR-001-hybrid-architecture.md`

> **Disclaimer:** This document describes intended business and product operations. It is **not legal, tax, or investment advice**. All regulatory statements must be validated by a CA and SEBI/AMFI-experienced compliance counsel before incorporation, ARN application, or public launch.

---

## Table of contents

1. [Company introduction](#1-company-introduction)  
2. [Vision, mission, and positioning](#2-vision-mission-and-positioning)  
3. [Confirmed USP (v1)](#3-confirmed-usp-v1)  
4. [Business model and revenue](#4-business-model-and-revenue)  
5. [What Nivya is — and is not](#5-what-nivya-is--and-is-not)  
6. [How operations work (end-to-end)](#6-how-operations-work-end-to-end)  
7. [Customer journey](#7-customer-journey)  
8. [Internal operating functions](#8-internal-operating-functions)  
9. [Product scope (v1 launch)](#9-product-scope-v1-launch)  
10. [Technology and architecture (summary)](#10-technology-and-architecture-summary)  
11. [Regulatory and compliance operations](#11-regulatory-and-compliance-operations)  
12. [Competitive landscape (context for strategy team)](#12-competitive-landscape-context-for-strategy-team)  
13. [Go-to-market framework (to be completed by strategy team)](#13-go-to-market-framework-to-be-completed-by-strategy-team)  
14. [Strategy team workstreams and deliverables](#14-strategy-team-workstreams-and-deliverables)  
15. [Roadmap phases](#15-roadmap-phases)  
16. [Open decisions and assumptions](#16-open-decisions-and-assumptions)  
17. [Glossary](#17-glossary)

---

## 1. Company introduction

### 1.1 Name and intent

**Nivya** is a planned **Indian fintech company** operating as a **Corporate Mutual Fund Distributor (MFD)** under **AMFI**. The product is a **mobile-first and web** platform for retail investors to **discover, compare, and invest in Regular-plan mutual funds** — with a simple, modern user experience comparable to consumer investing apps, while remaining fully compliant with distributor regulations.

Nivya is **mutual-funds-only**. It does not offer stock broking, F&O, or crypto.

### 1.2 Problem we address

| Problem | Nivya response |
|---------|----------------|
| Direct-plan apps (Groww, Coin, Kuvera) optimize for **lowest TER** — no distributor trail | Nivya serves investors who use **Regular plans** via a **transparent AMFI-registered distributor** |
| Traditional distributors (agents, banks) often have **weak digital UX** | Nivya offers **Groww-simple** self-serve investing |
| Research portals (e.g. Star SIP) are **tool-heavy**, invest flow secondary | Nivya is **invest-first**: discover → compare → execute in one app |
| Investors confused about **Direct vs Regular** | Nivya is **clear**: Regular plans only; transparent about distributor role and earnings |

### 1.3 Entity status (as of document date)

| Item | Status |
|------|--------|
| Legal entity (Pvt Ltd / LLP) | **To be incorporated** (founder action) |
| Corporate AMFI ARN | **Not yet live** — demo uses placeholder `ARN-XXXXXX` |
| EUIN (certified employee) | **Required before ARN** — NISM Series V-A |
| Hybrid vendor (BSE/NSE rails) | **To be selected** via RFP |
| Product | **Working prototype** + mock BFF in GitHub repo |
| SEBI RIA (personalized advice) | **Not planned for v1** — Phase 2 option |

---

## 2. Vision, mission, and positioning

### 2.1 Vision

Make **Regular-plan mutual fund investing** as **simple and transparent** as modern Direct-plan apps — without hiding how distribution works.

### 2.2 Mission

Build an **AMFI-registered, MF-only** platform where investors **discover and compare** funds with clear data, **review** their portfolio with factual insights, **choose** their investments, and **execute** through Nivya as their corporate distributor.

### 2.3 Positioning statement (internal)

**For** retail mutual fund investors in India **who** want a simple digital app (not a bank RM or agent) **and** are investing through **Regular plans**, **Nivya** is an **MF-only distribution app** **that** helps you discover, compare, and invest with portfolio clarity **unlike** Direct-only fintechs (no trail / different model) **and** unlike research-heavy portals (invest is secondary), **because** Nivya combines **Groww-level UX** with **honest AMFI distributor transparency**.

### 2.4 Brand pillars

| Pillar | Meaning |
|--------|---------|
| **MF-only** | No stocks, F&O, or product clutter |
| **Clarity** | Clear data, clear Regular-plan model, clear ARN/EUIN |
| **You choose** | Discovery and comparison — not personalized advice in v1 |
| **We execute** | Compliant order flow, SID consent, mandates, support |

---

## 3. Confirmed USP (v1)

### 3.1 Primary USP (approved direction)

> **Nivya helps you discover and compare Regular mutual funds with clear data and portfolio insights — you choose, we execute as your AMFI-registered distributor.**

### 3.2 Supporting proof points (product + compliance)

| Proof point | How it shows up in product |
|-------------|----------------------------|
| **Discover & compare** | Category screener, filters, past returns, expense ratio, riskometer — **factual**, not “we recommend” |
| **Portfolio insights** | Holdings, XIRR, allocation, concentration facts — **no buy/sell advice** in v1 |
| **You choose** | User selects fund; no personalized advisory engine until SEBI RIA (Phase 2) |
| **We execute** | SIP, lumpsum, redeem, switch; orders tagged with **ARN + EUIN** |
| **Transparent distributor** | AMFI tagline on all surfaces; “How Nivya earns” content; Regular plan badge on funds |
| **MF-only** | Single-product app — no cross-sell to unrelated products at launch |

### 3.3 What we do **not** claim (v1)

- “Best fund for you” / personalized recommendations  
- “Predicted returns” or “chance of growth”  
- “Zero commission” (Direct-plan pitch)  
- “Guaranteed” or indicative performance  
- Stock broking or trading features  

### 3.4 Future USP extension (Phase 2 — requires SEBI RIA)

Personalized fund recommendations and portfolio review with **actionable suggestions** — only after **SEBI Investment Adviser** registration and counsel-approved advice/execution separation.

---

## 4. Business model and revenue

### 4.1 Model type

**Corporate Mutual Fund Distributor (AMFI ARN)** — **Hybrid Path B**:

- **Nivya builds:** brand, UX, BFF, user data, order orchestration, compliance audit trail  
- **Vendor provides (initially):** BSE StAR MF / NSE MF Invest connectivity, KYC modules, mandates, scheme master  

See `docs/ADR-001-hybrid-architecture.md`.

### 4.2 Plan type

**Regular plans only** — intentional, for revenue and regulatory clarity.

| Plan | Nivya offers? | Nivya revenue |
|------|---------------|---------------|
| **Regular** | **Yes** | **Trail commission** from AMCs on AUM |
| **Direct** | **No** | None |

### 4.3 Revenue streams

| Stream | Description |
|--------|-------------|
| **Primary** | Trail commission from AMCs on Regular-plan AUM (ongoing %) |
| **Secondary (future)** | Advisory fees if SEBI RIA is added (separate from v1) |
| **Not in v1** | Upfront commission, guaranteed-return products, stock broking |

### 4.4 Unit economics (metrics to track)

- Regular-plan **AUM** under Nivya ARN  
- **SIP book** size and retention  
- **SIP bounce** rate (mandate failures)  
- **KYC conversion** (signup → KYC complete → first order)  
- **Cost per funded account** (marketing + ops)  
- **Trail reconciliation** vs AMC statements (monthly)

---

## 5. What Nivya is — and is not

| Nivya **IS** | Nivya **IS NOT** |
|--------------|------------------|
| AMFI-registered **corporate** MF distributor (target) | SEBI **stock broker** |
| **Regular-plan** transaction platform | **Direct-plan** / zero-commission EOP (Groww/Coin/Kuvera model) |
| **Self-serve** app — customer invests without a human agent | Agent network / sub-broker platform (optional later) |
| **Distribution** — factual discovery, comparison, execution | **Personalized investment advice** without SEBI RIA (v1) |
| Trail-commission business from AMCs | Guaranteed or indicative return marketing |

---

## 6. How operations work (end-to-end)

### 6.1 Operational flow diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   INVESTOR   │────▶│  NIVYA APP   │────▶│  NIVYA BFF   │────▶│ VENDOR ADAPTER│
│  (Android/   │     │  Web + Mobile│     │  (Node API)  │     │ (Hybrid rail) │
│   iOS/Web)   │     └──────────────┘     └──────┬───────┘     └──────┬───────┘
└──────────────┘                                 │                    │
                                                 │                    ▼
                                                 │            BSE StAR MF / NSE MF Invest
                                                 │                    │
                                                 │                    ▼
                                                 │              RTA (CAMS/KFin)
                                                 │                    │
                                                 │                    ▼
                                                 │                    AMC
                                                 ▼
                                          PostgreSQL ledger
                                          (users, orders, consents, audit)
```

### 6.2 Order lifecycle (production target)

```
DRAFT → PAYMENT_PENDING / MANDATE_PENDING → SUBMITTED_TO_EXCHANGE
  → ACCEPTED / REJECTED → UNITS_ALLOTED → COMPLETED (or FAILED)
```

Every transition logged in **immutable audit trail**.

### 6.3 Money flow (investor perspective)

1. Investor pays via **payment gateway** (lumpsum) or **eNACH/OTM mandate** (SIP).  
2. Funds flow through **prescribed MF transaction rails** — not held by Nivya as discretionary pool.  
3. Units credited to investor **folio** at RTA/AMC.  
4. Redemption proceeds go to **verified bank account**.

### 6.4 Commission flow (Nivya perspective)

1. Investor holds **Regular-plan** units tagged with **Nivya ARN + EUIN**.  
2. AMC pays **trail commission** to Nivya per empanelment terms.  
3. Finance reconciles **monthly** with AMC / vendor reports.

---

## 7. Customer journey

### 7.1 Acquisition → retention

| Stage | Customer action | Nivya operation |
|-------|-----------------|-----------------|
| **Awareness** | Sees ad, content, referral | Marketing (GTM team) — no guaranteed-return claims |
| **Signup** | Phone OTP | Auth service; DPDP consent |
| **KYC** | PAN, KRA status | KYC orchestration via vendor/KRA |
| **Discovery** | Browse category, screener, compare | Scheme catalog API; **factual** data only |
| **Consent** | Accept SID/KIM for scheme | Consent logged before first investment |
| **Invest** | SIP / lumpsum | Order + mandate + payment; ARN/EUIN on payload |
| **Hold** | View portfolio, SIP book | Portfolio sync from RTA/exchange |
| **Review** | Portfolio insights dashboard | XIRR, allocation, concentration facts |
| **Transact** | Redeem / switch / pause SIP | Order API + support if needed |
| **Support** | Grievance, failed mandate | Customer support + SEBI SCORES path |

### 7.2 What the customer does **not** need

- A separate **broker** or **agent** to place each order  
- A **Demat account** (SOA/folio model — standard for MF)  
- To choose **Direct vs Regular** on Nivya — **Regular only**

---

## 8. Internal operating functions

### 8.1 Function map

| Function | Responsibility | Owner (target) |
|----------|----------------|----------------|
| **Founder / CEO** | Strategy, fundraising, vendor/AMC relationships | Founder |
| **Compliance** | ARN, KYD, policies, copy review, AMFI DSC, grievance | Compliance Officer + counsel |
| **Operations** | Order exceptions, mandate failures, reconciliation | Ops + vendor |
| **Customer support** | Phone, email, in-app help | Support team (pre-launch hire) |
| **Engineering** | App, BFF, integrations, security | Engineering team |
| **Product / Design** | UX, screener, portfolio insights, roadmap | Product |
| **Finance** | Commission reconciliation, vendor payments | Finance / CA |
| **Marketing / GTM** | Acquisition, content, brand | **Strategy team (current hire)** |

### 8.2 Daily / weekly / monthly operations (post-launch)

| Cadence | Activity |
|---------|----------|
| **Daily** | Monitor order success rate, KYC failures, mandate bounces, support tickets |
| **Weekly** | Scheme master / NAV sync health; vendor SLA review |
| **Monthly** | AMC commission reconciliation; compliance copy audit; grievance report |
| **Annual** | AMFI Declaration of Self-Certification (DSC) |

### 8.3 Hybrid vendor operations

Nivya remains **accountable to the investor** for UX and compliance presentation; vendor handles exchange API maintenance. **VendorMFAdapter** in codebase allows vendor swap with owned PostgreSQL ledger retained.

---

## 9. Product scope (v1 launch)

### 9.1 In scope (MVP)

| Module | Features |
|--------|----------|
| **Auth** | OTP login, session, profile |
| **KYC** | PAN, KRA status gate before first order |
| **Discover** | Fund list, search, categories, **screener** (category, horizon, amount, SIP/lumpsum) |
| **Compare** | Scheme facts, past returns, expense, riskometer |
| **Invest** | Lumpsum, SIP, redeem, switch (as vendor supports) |
| **Portfolio** | Holdings, value, XIRR, allocation |
| **SIPs** | SIP book, status, mandate link |
| **Insights** | Portfolio health **facts** (concentration, category mix) — not advice |
| **Compliance** | ARN strip, disclaimers, SID consent, EUIN on confirmation |
| **Profile** | Bank, mandates, statements (as phased), grievance contact |

### 9.2 Out of scope (v1)

| Item | Reason |
|------|--------|
| Stocks, F&O, crypto | Wrong license |
| Direct plans | No trail revenue; different model |
| Personalized recommendations | Requires SEBI RIA |
| “Predictive” return engine | Regulatory risk |
| Insurance, loans, shop | Off-brand; Star SIP mixes these — Nivya stays MF-only |

### 9.3 Channels

| Channel | Priority |
|---------|----------|
| **Android app** | P0 (React Native) |
| **iOS app** | P0 (React Native) |
| **Web** | P0 (Next.js target; Vite prototype today) |

---

## 10. Technology and architecture (summary)

| Layer | Technology (decided / planned) |
|-------|-------------------------------|
| Mobile | **React Native** + TypeScript |
| Web | React → **Next.js** |
| BFF | **Node.js (Fastify)** → optional NestJS at scale |
| Database | **PostgreSQL** + Redis |
| Vendor | `VendorMFAdapter` — mock today, production vendor TBD |
| Monorepo | npm workspaces → Turborepo target |

**Repo today:** prototype `nivya-app.jsx`, `services/api`, `packages/compliance`, `docs/openapi.yaml`, `infra/schema.sql`.

---

## 11. Regulatory and compliance operations

### 11.1 Pre-launch checklist (business)

| # | Requirement |
|---|-------------|
| 1 | Incorporate company (Pvt Ltd / LLP) |
| 2 | NISM Series V-A → **EUIN** |
| 3 | **Corporate ARN** + **KYD** |
| 4 | Empanelment with AMCs |
| 5 | BSE StAR MF / NSE MF Invest (via vendor or direct) |
| 6 | Hybrid vendor contract + UAT credentials |
| 7 | Grievance process + SEBI SCORES |
| 8 | DPDP privacy policy |
| 9 | MF compliance counsel retainer |

### 11.2 Always-on compliance (product + marketing)

- Display **“AMFI-registered Mutual Fund Distributor”** + **live ARN** (font ≥ 12px)  
- **EUIN** on every order  
- **SID/KIM consent** before first investment per scheme  
- Standard MF risk disclaimer  
- **No** guaranteed / indicative returns  
- **No** personalized advice copy in v1  
- **Regular plans only** — clear vs Direct competitors  

### 11.3 Content review process (recommended)

All customer-facing copy (app, web, ads, push) → **Compliance Officer or counsel sign-off** before publish.

---

## 12. Competitive landscape (context for strategy team)

Strategy team should expand this section. Summary for alignment:

| Competitor type | Examples | Model vs Nivya |
|-----------------|----------|----------------|
| **Direct / EOP apps** | Groww, Coin, Kuvera, ET Money | **Opposite** — Direct, zero MF trail |
| **Regular research portals** | [Star SIP](https://starsip.in/) | **Closer peer** — Regular MFD, research-first |
| **National distributors** | NJ Wealth, Prudent | Same Regular trail; **B2B agent** vs Nivya **B2C app** |
| **Banks** | HDFC, ICICI, SBI apps | Regular; **weak UX** — Nivya opportunity |

**Nivya wedge:** Regular MFD + **invest-first app** + **transparent distributor** + **MF-only**.

---

## 13. Go-to-market framework (to be completed by strategy team)

*Founders confirm USP; strategy team fills the tables below.*

### 13.1 Target customer segments (draft — validate)

| Segment | Hypothesis | Message angle |
|---------|------------|---------------|
| **First-time MF investors** | Want simple app, not agent | “Start SIP in minutes — MF-only app” |
| **Existing Regular investors** | Frustrated with bank/RM UX | “See portfolio clearly — invest in one app” |
| **SIP-focused savers** | Monthly habit | “SIP-first, transparent Regular distributor” |
| **Tier-2/3 digital users** | Underserved by English-first Direct apps | Hindi/regional, simple copy (test in research) |

### 13.2 GTM deliverables (strategy team output)

| Deliverable | Description | Due |
|-------------|-------------|-----|
| **GTM-001** | ICP + persona documents (2–3 personas) | TBD |
| **GTM-002** | Competitor matrix (10+ players, Regular vs Direct, features, messaging) | TBD |
| **GTM-003** | Channel plan (organic, paid, referral, partnerships) + budget range | TBD |
| **GTM-004** | Launch phasing (soft beta → public) + KPIs | TBD |
| **GTM-005** | Messaging house (hero, proof points, disclaimers) | TBD |
| **GTM-006** | Pricing / CAC assumptions vs trail breakeven model | TBD |

### 13.3 KPIs (launch)

| KPI | Target (soft launch — to be set by team) |
|-----|------------------------------------------|
| Order success rate | ≥ 98% |
| KYC completion (signup → registered) | ≥ 70% |
| First SIP within 7 days of KYC | TBD |
| SIP bounce rate | TBD |
| CAC vs projected trail LTV | TBD |

---

## 14. Strategy team workstreams and deliverables

**Team size:** 3 people (competitor analysis, GTM, USP/messaging).

### 14.1 Workstream A — Competitor analysis

**Objective:** Map who competes for the same user and how Nivya differs on **Regular MFD + invest-first UX**.

**Tasks:**

1. Build competitor database (Direct apps, Regular portals, NDs, banks).  
2. Compare: plan type, license, UX, discovery, execution, content, app ratings, messaging.  
3. Deep dives: **Star SIP**, **Kuvera**, **Groww**, **one bank app**, **NJ/Prudent retail touchpoint**.  
4. SWOT for Nivya vs top 5.  
5. **Output:** `COMPETITOR-ANALYSIS.md` + presentation deck.

### 14.2 Workstream B — GTM strategy

**Objective:** Define how Nivya acquires first 1k / 10k funded users post-ARN.

**Tasks:**

1. Finalize ICP and geographic focus.  
2. Channel strategy (content/SEO, paid, influencers — **compliance-safe**).  
3. Launch timeline aligned with ARN + vendor UAT.  
4. Partnerships (AMC co-marketing, employers — if applicable).  
5. Support and grievance readiness plan.  
6. **Output:** `GTM-STRATEGY.md` + 90-day calendar.

### 14.3 Workstream C — USP and messaging

**Objective:** Turn confirmed USP into **customer-facing messaging** and **in-app copy framework**.

**Tasks:**

1. Lock hero tagline variants (A/B list) — compliance review list.  
2. “How Nivya earns” / Direct vs Regular explainer (transparent distributor story).  
3. Feature naming: **Fund screener**, **Portfolio insights** (avoid “recommendation”).  
4. Disclaimer library (app footer, order sheet, marketing).  
5. **Output:** `BRAND-MESSAGING-GUIDE.md` + copy doc for app screens.

### 14.4 Cross-team sync

| Meeting | Frequency | Purpose |
|---------|-----------|---------|
| Strategy standup | Weekly | Progress on A/B/C deliverables |
| Founder review | Bi-weekly | Decisions on ICP, GTM spend, messaging |
| Compliance review | Before any public copy goes live | Counsel sign-off |

---

## 15. Roadmap phases

| Phase | Timeline | Business | Product |
|-------|----------|----------|---------|
| **0 — Foundation** | Weeks 1–8 | Incorporate, NISM/EUIN, ARN apply, vendor RFP | Prototype ✅, BFF mock ✅ |
| **1 — Market access** | Weeks 6–14 | ARN live, AMC empanelment, UAT credentials | Vendor adapter UAT |
| **2 — MVP** | Weeks 10–22 | Compliance live, support hired | Auth, KYC, screener, orders, portfolio |
| **3 — Mobile + harden** | Weeks 18–28 | Security audit | RN iOS/Android store beta |
| **4 — Soft launch** | Weeks 26–30 | 50–200 user beta | Real orders, KPI monitoring |
| **5 — Public launch** | Week 30+ | Marketing scale | App stores + web public |
| **6 — RIA (optional)** | Post-launch | SEBI RIA if approved | Personalized recommendations |

---

## 16. Open decisions and assumptions

### 16.1 Decisions required

| # | Decision | Options | Owner |
|---|----------|---------|-------|
| 1 | Legal entity | Pvt Ltd / LLP | Founder + CA |
| 2 | Hybrid vendor | RFP shortlist | Founder + engineering |
| 3 | Primary exchange rail | BSE first / NSE first | Compliance + vendor |
| 4 | First launch geography | Pan-India / focus states | Strategy team |
| 5 | Hindi/regional v1 | Yes / Phase 2 | Product + GTM |
| 6 | SEBI RIA timeline | Year 1 / Year 2 / No | Founder + counsel |

### 16.2 Assumptions (documented)

- Nivya remains **Regular-only** for v1 revenue model.  
- **No personalized advice** in v1 without RIA.  
- **Hybrid vendor** signed by Phase 1.  
- **React Native** for mobile per ADR-001.  
- Trail commission is **primary revenue** for first 24 months.

---

## 17. Glossary

| Term | Definition |
|------|------------|
| **AMFI** | Association of Mutual Funds in India |
| **ARN** | AMFI Registration Number (entity distributor ID) |
| **EUIN** | Employee Unique Identification Number (on each transaction) |
| **MFD** | Mutual Fund Distributor |
| **Regular plan** | MF plan with distributor commission embedded in TER |
| **Direct plan** | MF plan without distributor commission — lower TER |
| **Trail commission** | Ongoing AMC payment to distributor on Regular AUM |
| **BSE StAR MF** | BSE mutual fund transaction platform |
| **NSE MF Invest** | NSE mutual fund transaction platform |
| **RTA** | Registrar and Transfer Agent (CAMS, KFinTech) |
| **KRA** | KYC Registration Agency |
| **SID / KIM** | Scheme Information Document / Key Information Memorandum |
| **SIP** | Systematic Investment Plan |
| **BFF** | Backend-for-frontend API layer |
| **RIA** | SEBI Registered Investment Adviser |
| **EOP** | SEBI Execution-Only Platform (Direct plans) |
| **AUM** | Assets Under Management |

---

## Document control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 22 Jun 2026 | Nivya / founder brief | Initial company intro & operations outline; USP v1 locked |

**Next updates:** Strategy team to attach deliverables (§14) and fill GTM tables (§13).

---

*End of document.*
