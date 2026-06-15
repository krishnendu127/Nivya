# Nivya — Hybrid MF Platform: End-to-End Execution Plan

**Model:** Corporate Mutual Fund Distributor (AMFI ARN)  
**Build approach:** Hybrid — white-label / vendor MF rails + custom Nivya UX (web + mobile)  
**Scope:** Mutual funds only (lumpsum, SIP, redeem, switch, portfolio)  
**Target:** Production launch  
**Start date reference:** June 2026  

---

## What “Hybrid” Means for Nivya

```
┌─────────────────────────────────────────────────────────────┐
│  YOU BUILD (custom)              │  VENDOR PROVIDES (rails)   │
├──────────────────────────────────┼────────────────────────────┤
│  Nivya-branded web app           │  BSE StAR MF / NSE MF      │
│  Nivya-branded iOS + Android     │    Invest connectivity     │
│  Investor UX (onboarding UI)     │  AMC empanelment (often)   │
│  Fund discovery & filters        │  Order submission API      │
│  Portfolio dashboard             │  SIP / mandate registration│
│  Your BFF / API layer            │  KYC module (optional)     │
│  Auth, notifications             │  Commission reconciliation │
│  Compliance UI (ARN, disclaimers)  │  Scheme master / NAV feed  │
│  Admin / ops console             │  Transaction status feeds  │
└──────────────────────────────────┴────────────────────────────┘
```

**You own:** brand, UX, user acquisition, compliance presentation, investor relationship.  
**Vendor owns (initially):** exchange API maintenance, many AMC integrations, back-office rails.

**Migration path:** Start hybrid → as AUM grows, bring order service + reconciliation in-house while keeping exchange adapter.

---

## Current State (After MF-Only Refactor)

| Item | Status |
|------|--------|
| `nivya-app.jsx` | MF-only demo UI (Home, Explore, Portfolio, SIPs, Profile) |
| Vite scaffold | `package.json`, `index.html`, `src/main.jsx` |
| Stock/equity code | **Removed** |
| MF order sheet | Demo lumpsum / SIP / redeem |
| Compliance strip | AMFI tagline + ARN placeholder |
| Backend / vendor integration | **Not started** |

**Run locally:**
```bash
npm install
npm run dev
```

---

## Master Timeline Overview

| Phase | Duration | Outcome |
|-------|----------|---------|
| **0 — Company & compliance** | Weeks 1–8 | Pvt Ltd, ARN applied, vendor shortlisted |
| **1 — Vendor & market access** | Weeks 6–14 | Hybrid partner signed, BSE/NSE UAT access |
| **2 — Platform MVP** | Weeks 10–22 | Auth, KYC, orders in UAT, web live (beta) |
| **3 — Mobile + hardening** | Weeks 18–28 | iOS/Android beta, security audit |
| **4 — Soft launch** | Weeks 26–30 | Real orders, limited users |
| **5 — Public launch** | Week 30+ | Marketing, support scaled |

**Total:** ~7–8 months to public launch (hybrid path).

---

## Phase 0 — Company & Compliance Foundation (Weeks 1–8)

### Week 1–2: Legal entity & team

| # | Task | Owner | Deliverable |
|---|------|-------|-------------|
| 0.1 | Incorporate **Nivya Pvt Ltd** (or LLP) | Founder + CA | CIN, PAN, MOA/AOA |
| 0.2 | Open current account | Founder | Bank account |
| 0.3 | Engage **MF compliance counsel** | Founder | Retainer agreement |
| 0.4 | Hire / assign **Compliance Officer** (fractional OK) | Founder | Named CO |
| 0.5 | Enroll 1+ person for **NISM Series V-A** exam | Ops hire | Exam registration |

### Week 2–4: AMFI registration

| # | Task | Owner | Deliverable |
|---|------|-------|-------------|
| 0.6 | Pass NISM V-A → apply **EUIN** via CAMS | Certified employee | EUIN number |
| 0.7 | Apply **Corporate ARN** + **KYD** (Aadhaar) | Founder + CO | ARN application submitted |
| 0.8 | Prepare empanelment docs for AMC due diligence | CO | DDQ pack |
| 0.9 | Define **Regular plan only** policy (no Direct plan selling initially) | CO + Product | Policy doc |

### Week 3–6: Vendor evaluation (Hybrid partner)

Evaluate 3–5 **MFD platform vendors** (wealth-tech / white-label MF distributors). Score on:

| Criteria | Weight |
|----------|--------|
| BSE StAR MF + NSE MF Invest support | High |
| White-label app / API for custom frontend | High |
| KYC (CKYC/KRA) module | High |
| eNACH / OTM mandate | High |
| Commission reconciliation | Medium |
| Pricing (setup + per-transaction + rev share) | High |
| API documentation quality | High |
| AMC empanelment coverage | High |

**Shortlist vendors to contact:** Finity, Wealth Elite, BSE StAR MF direct (if eligible), NSE MF Invest direct, other BSE-member wealth platforms. *(Verify current offerings yourself — market changes frequently.)*

| # | Task | Owner | Deliverable |
|---|------|-------|-------------|
| 0.10 | Issue RFP to 3 vendors | Founder + CTO | RFP doc |
| 0.11 | Vendor demos + API review | Engineering | Scorecard |
| 0.12 | **Select hybrid vendor** | Founder | Signed LOI / contract |

### Week 5–8: Product & engineering setup

| # | Task | Owner | Deliverable |
|---|------|-------|-------------|
| 0.13 | Create GitHub org + monorepo | Engineering | `nivya/` repo |
| 0.14 | Architecture decision record (ADR): hybrid split | CTO | ADR-001 |
| 0.15 | OpenAPI spec v0.1 (User, KYC, Order, Portfolio) | Engineering | `docs/openapi.yaml` |
| 0.16 | MF-only prototype running (`npm run dev`) | Engineering | ✅ Done |
| 0.17 | Design system extraction from `nivya-app.jsx` | Frontend | `packages/ui` plan |

**Phase 0 exit criteria:**
- [ ] Company incorporated  
- [ ] NISM + EUIN obtained  
- [ ] ARN application submitted (or received)  
- [ ] Hybrid vendor selected  
- [ ] Monorepo + ADR in place  

---

## Phase 1 — Vendor Integration & Market Access (Weeks 6–14)

### Exchange & AMC access

| # | Task | Owner | Deliverable |
|---|------|-------|-------------|
| 1.1 | Receive **Corporate ARN** from AMFI | CO | ARN certificate |
| 1.2 | Register on **BSE StAR MF** (via vendor or direct) | CO + Vendor | Member ID |
| 1.3 | Register on **NSE MF Invest** (optional dual-rail) | CO + Vendor | Member ID |
| 1.4 | Empanel with **top 10 AMCs** | CO + Vendor | Empanelment letters |
| 1.5 | Obtain **UAT/sandbox API credentials** | Engineering + Vendor | UAT keys |
| 1.6 | KRA sandbox access (CVL / CAMS KRA) | Engineering | KRA UAT |

### Integration architecture (hybrid)

```
Investor App (Nivya UI)
        │
        ▼
  Nivya BFF (your backend)
   ├── Auth service
   ├── User profile DB (PostgreSQL)
   ├── Order orchestration (your logic)
   └── Audit / consent log
        │
        ▼
  Vendor MF API adapter  ──►  BSE StAR MF / NSE MF Invest
        │
        ▼
  RTA (CAMS / KFinTech) → AMC
```

| # | Task | Owner | Deliverable |
|---|------|-------|-------------|
| 1.7 | Implement `VendorMFAdapter` interface | Backend | `services/vendor-mf/` |
| 1.8 | UAT: scheme master sync job | Backend | Daily NAV cron |
| 1.9 | UAT: investor UCC creation | Backend | Create investor on exchange |
| 1.10 | UAT: test lumpsum order E2E | Backend + QA | Test report |
| 1.11 | UAT: test SIP + mandate E2E | Backend + QA | Test report |

**Phase 1 exit criteria:**
- [ ] ARN active  
- [ ] UAT lumpsum + SIP order successful  
- [ ] ≥10 AMCs empanelled  
- [ ] Scheme catalog syncing from vendor/exchange  

---

## Phase 2 — Platform MVP (Weeks 10–22)

### Backend services (your layer)

| Service | Priority | Hybrid dependency |
|---------|----------|-------------------|
| Auth (OTP login) | P0 | None |
| User profile | P0 | None |
| KYC orchestration | P0 | Vendor KYC module or KRA API |
| Scheme catalog API | P0 | Vendor scheme master |
| Order API (lumpsum) | P0 | Vendor order API |
| Order API (SIP) | P0 | Vendor SIP + mandate API |
| Order API (redeem) | P0 | Vendor redeem API |
| Portfolio API | P0 | Vendor holdings feed |
| Notification service | P1 | FCM/APNs + SMS |
| Admin ops panel | P1 | Internal |

### Frontend (replace demo with production)

| Screen | Maps from prototype | Production change |
|--------|---------------------|-------------------|
| Home | `HomeScreen` | Real portfolio from API |
| Explore | `Explore` | Live scheme master + search |
| Fund detail | `FundDetail` | KIM/SID links, real NAV history |
| Order sheet | `MFOrderSheet` | Payment gateway + mandate flow |
| Portfolio | `Portfolio` | RTA-reconciled holdings |
| SIPs | `SipsScreen` | Live SIP status from vendor |
| Profile | `Profile` | KYC status, bank, mandates |
| Onboarding | **New** | OTP → PAN → KYC → bank → mandate |

### Week-by-week build (engineering)

| Week | Focus |
|------|-------|
| 10–11 | Monorepo: `apps/web`, `services/api`, PostgreSQL schema |
| 12–13 | Auth + onboarding UI (OTP, PAN) |
| 14–15 | KYC flow wired to vendor/KRA |
| 16–17 | Explore + fund detail with live scheme API |
| 18–19 | Lumpsum order + payment (UAT) |
| 20–21 | SIP registration + eNACH mandate (UAT) |
| 22 | Redeem + portfolio sync (UAT) |

### Database schema (minimum)

```sql
users            (id, phone, email, kyc_status, created_at)
user_profiles    (user_id, pan, name, dob, ...)
bank_accounts    (user_id, ifsc, account_no, verified)
kyc_records      (user_id, kra_status, ckyc_id, ...)
holdings         (user_id, scheme_code, folio, units, avg_nav)  -- cache
orders           (id, user_id, type, scheme_code, amount, status, vendor_ref, euin, arn)
sips             (id, user_id, scheme_code, amount, day, mandate_id, status)
mandates         (id, user_id, umrn, status, bank_account_id)
audit_events     (id, user_id, event_type, payload, timestamp)  -- immutable
consents         (user_id, scheme_code, sid_version, consented_at)
```

**Phase 2 exit criteria:**
- [ ] Web app beta with real UAT orders  
- [ ] KYC end-to-end working  
- [ ] Portfolio reflects UAT holdings  
- [ ] All orders tagged with ARN + EUIN  
- [ ] Consent + audit log on every order  

---

## Phase 3 — Mobile + Hardening (Weeks 18–28)

| # | Task | Owner | Deliverable |
|---|------|-------|-------------|
| 3.1 | React Native (or Flutter) app — port MF screens | Mobile | `apps/mobile` |
| 3.2 | Shared API client package | Engineering | `packages/api-client` |
| 3.3 | Push notifications (order status, SIP debit) | Backend | FCM/APNs |
| 3.4 | Biometric lock | Mobile | Face/Touch ID |
| 3.5 | Penetration test | Security vendor | Report + fixes |
| 3.6 | Load test (SIP registration day) | QA | Pass criteria |
| 3.7 | Daily reconciliation job (orders vs vendor report) | Backend | Cron + ops alert |
| 3.8 | Grievance workflow + SEBI SCORES registration | CO | Process doc |
| 3.9 | App Store + Play Store submission prep | Mobile + CO | Compliance review |

**Phase 3 exit criteria:**
- [ ] iOS + Android beta on TestFlight / internal track  
- [ ] Security audit passed  
- [ ] Reconciliation running daily  
- [ ] Grievance process live  

---

## Phase 4 — Soft Launch (Weeks 26–30)

| # | Task | Owner | Deliverable |
|---|------|-------|-------------|
| 4.1 | Switch vendor integration from UAT → **production** | Engineering | Prod credentials |
| 4.2 | Production ARN displayed in app (replace `ARN-XXXXXX`) | Product | Live ARN |
| 4.3 | Invite-only beta (50–200 users) | Founder | Beta cohort |
| 4.4 | Monitor: order success rate, KYC drop-off, SIP bounce | Ops | Dashboard |
| 4.5 | Customer support trained (phone + email) | Ops | Support SOP |
| 4.6 | Fix P0 bugs from beta | Engineering | Release patch |

**Soft launch success metrics:**
- Order success rate ≥ 98%  
- KYC completion ≥ 70% of signups  
- Zero compliance violations in copy/flows  

---

## Phase 5 — Public Launch (Week 30+)

| # | Task | Owner | Deliverable |
|---|------|-------|-------------|
| 5.1 | Public web launch | Marketing + Eng | nivya.app live |
| 5.2 | App Store + Play Store release | Mobile | Store listings |
| 5.3 | Performance marketing (no guaranteed returns) | Marketing | Campaigns |
| 5.4 | Content: ELSS, SIP calculator, fund categories | Marketing | SEO pages |
| 5.5 | Monthly commission reconciliation with AMCs | Finance + CO | Reconciliation report |
| 5.6 | Annual AMFI DSC submission | CO | Filed |

---

## Repository Target Structure (Monorepo)

```
nivya/
├── apps/
│   ├── web/                 # Next.js — investor web (migrate from nivya-app.jsx)
│   ├── mobile/              # React Native — iOS + Android
│   └── admin/               # Internal ops console
├── services/
│   ├── api/                 # BFF — NestJS or FastAPI
│   └── worker/              # Reconciliation, NAV sync cron
├── packages/
│   ├── ui/                  # Shared components (from prototype CSS)
│   ├── api-client/          # Typed API SDK
│   └── compliance/          # ARN tagline, disclaimers, consent helpers
├── docs/
│   ├── NIVYA-MF-PLATFORM-REPORT.md
│   ├── HYBRID-E2E-PLAN.md   # this file
│   └── openapi.yaml
├── nivya-app.jsx            # Prototype (reference until web app migrated)
├── package.json
└── infra/                   # AWS/Azure Terraform
```

---

## Your Next 7 Actions (Start This Week)

| Priority | Action | Why |
|----------|--------|-----|
| **1** | Run `npm install && npm run dev` — verify MF-only prototype | Baseline for UX |
| **2** | Incorporate Nivya Pvt Ltd | Required for ARN |
| **3** | Register for NISM V-A (you or first hire) | Required for EUIN → ARN |
| **4** | Book call with MF compliance lawyer | Avoid costly mistakes |
| **5** | Send RFP to 3 hybrid MF platform vendors | Unblocks Phase 1 |
| **6** | Create GitHub repo + import this project | Engineering foundation |
| **7** | Replace `NIVYA_ARN = "ARN-XXXXXX"` in code when ARN received | Compliance |

---

## Decision Log (Hybrid-Specific)

| Decision | Choice | Date |
|----------|--------|------|
| Business model | Corporate MFD (AMFI ARN) | Jun 2026 |
| Product scope | MF only | Jun 2026 |
| Build approach | **Hybrid** | Jun 2026 |
| Primary exchange rail | _TBD — recommend BSE StAR MF first_ | |
| Hybrid vendor | _TBD_ | |
| Mobile framework | _TBD — recommend React Native_ | |
| RIA (investment advice) later? | _TBD — default No for v1_ | |

---

## Compliance Checklist (Never Ship Without)

- [ ] Live ARN on all app surfaces + website  
- [ ] “AMFI-registered Mutual Fund Distributor” tagline (font ≥ 12px)  
- [ ] EUIN on every order payload  
- [ ] SID/KIM consent logged before first investment in each scheme  
- [ ] “Mutual fund investments are subject to market risks…” disclaimer  
- [ ] No guaranteed / indicative return marketing  
- [ ] No personalized investment advice (unless RIA registered)  
- [ ] Grievance email + phone visible  
- [ ] DPDP-compliant privacy policy  
- [ ] Audit trail for all orders and consents  

---

## Risk Mitigations (Hybrid-Specific)

| Risk | Mitigation |
|------|------------|
| Vendor lock-in | `VendorMFAdapter` abstraction; own user DB + order ledger |
| Vendor API downtime | Queue orders; status polling; ops manual fallback |
| Vendor pricing change | 12-month contract with price caps |
| Slow AMC empanelment | Start empanelment in Phase 0; vendor may batch |
| EUIN not sent | Server-side hard block before order submit |

---

*This plan assumes hybrid vendor selection completes by Week 8. If vendor selection slips, engineering can still build auth, UI, and BFF against mock adapters in parallel.*
