# Claude Implementation Prompt — Nivya Fund Screener (Fund Insights)

Copy everything below the line into Claude (or Cursor Agent) to implement the feature end-to-end.

---

## PROMPT START

You are implementing the **Nivya Fund Screener** (product name: **Fund Insights**) for an existing monorepo. Read the full repo at `c:\Users\burnw\Downloads\Nivya` (or workspace root) before coding. Match existing conventions.

### 1. Business context

**Nivya** is an Indian **Corporate Mutual Fund Distributor (AMFI ARN)** platform — **Regular plans only**, MF-only, hybrid architecture (custom UX + vendor exchange rails).

**Confirmed USP:** *Nivya helps you discover and compare Regular mutual funds with clear data and portfolio insights — you choose, we execute as your AMFI-registered distributor.*

This feature is **NOT investment advice**. We are **NOT SEBI RIA** in v1. Build a **compliant fund screener + ranked shortlists** engine, not a “recommendation/advisory” product.

### 2. Feature definition

Build **Fund Insights** — a data-driven screener that:

1. Accepts user inputs:
   - Investment mode: `SIP` | `LUMPSUM` | `STP` | `SWP` (STP/SWP can stub for v1)
   - Horizon: months or years (used for metric windows + UI copy only — **not** return forecasts)
   - Risk preference: `LOW` | `MEDIUM` | `HIGH` (maps to category bands + volatility filters)
   - Category multi-select: e.g. Large Cap, Small Cap, ELSS, Hybrid Aggressive, Liquid, etc.
   - Optional **multi-bucket** input: e.g. `{ amount: 50000, risk: HIGH, categories: [...] }` + `{ amount: 150000, risk: LOW, categories: [...] }`

2. Returns **Top K** (default K=10) **Regular-plan** schemes per bucket/category with:
   - `pastReturn1y`, `pastReturn3y`, `pastReturn5y` (CAGR from NAV history — label as **past**, not expected)
   - `volatilityPct` (annualised std dev — label **Historical volatility**)
   - `riskScore` (1–100 percentile vs category)
   - `performanceScore` (rank-based score from past returns in category — **not** future growth)
   - `expenseRatio`, `aum`, `riskometer`, `amc`, `schemeName`, `schemeCode`
   - `reasons[]` — factual reason codes + human text, e.g. `HIGH_3Y_RETURN_IN_CATEGORY`, `LOWER_VOL_THAN_MEDIAN`, `HIGH_AUM`
   - `dataAsOn` timestamp
   - `planType: "Regular"` always

3. **Multi-bucket:** return **separate shortlists per bucket** — never a single “optimal portfolio” or auto-allocation. User picks funds manually → existing order flow.

4. **Compliance copy** on every response (include in API + UI):
   - *Mutual fund investments are subject to market risks. Past performance does not guarantee future results. This is not investment advice. Read SID/KIM before investing.*

5. **Forbidden in UI/API copy:**
   - “Recommend”, “best for you”, “expected return”, “chance of growth”, “AI advises”, “guaranteed”
   - Use: “Ranked by data”, “Past performance score”, “You choose”

### 3. Existing codebase (do not break)

```
Nivya/
├── nivya-app.jsx              # React web prototype (wire new Fund Insights screen)
├── src/nivya-api.js           # BFF client — extend with screener calls
├── services/api/src/server.js # Fastify BFF — add screener routes
├── services/vendor-mf/        # Mock schemes — align schemeCode with screener
├── packages/compliance/       # Reuse ARN/disclosure helpers
├── docs/openapi.yaml          # Extend with Screener tag + schemas
├── infra/schema.sql           # Extend with screener tables
├── package.json               # npm workspaces
└── vite.config.js             # proxies /v1 → localhost:3001
```

Run: `npm run dev:api` + `npm run dev`. Demo auth: `POST /v1/auth/otp/verify` `{ "phone": "9876543210", "otp": "123456" }`.

### 4. Architecture to implement

```
┌─────────────┐     POST /v1/screener/query     ┌──────────────────┐
│ nivya-app   │ ───────────────────────────────▶│ services/api     │
│ FundInsights│     GET  /v1/screener/categories│ (Fastify BFF)    │
└─────────────┘     GET  /v1/screener/metrics/:id└────────┬─────────┘
                                                           │
                    ┌──────────────────────────────────────┤
                    │                                      │
            ┌───────▼────────┐              ┌──────────────▼──────────────┐
            │ packages/      │              │ services/screener-worker/   │
            │ screener-core  │◀─────────────│ (Node cron / manual run)    │
            │ (pure ranking) │              │ NAV ingest + rank snapshot  │
            └────────────────┘              └──────────────┬──────────────┘
                                                           │
                              ┌────────────────────────────┼────────────────────────────┐
                              │                            │                            │
                    data/nav_history.parquet      MFapi.in API                 vendor-mf schemes
                    (AMFI historical)             (live NAV sync)              (Regular only)
```

**Phase 1 (this task):** rule-based ranker in `packages/screener-core`, in-memory or JSON snapshot file (PostgreSQL optional stub). **Phase 2:** PostgreSQL tables + daily cron.

### 5. Data sources

Implement ingest adapters:

| Source | Purpose | Notes |
|--------|---------|-------|
| **AMFI NAV history parquet** | Bulk historical NAV for features | Download script: fetch known GitHub `mutual_fund_nav_history.parquet` (or document manual download to `data/nav_history.parquet`). Parse with `parquet` or `apache-arrow` npm package, or convert to CSV once via Python helper script in `scripts/`. |
| **MFapi.in** | Live scheme list + latest NAV | Base URL: `https://api.mfapi.in`. Endpoints: `/mf`, `/mf/{scheme_code}`. **No API key required** for public endpoints. Poll respectfully; cache responses. |
| **mfdata.in** | Optional secondary metadata | Only if documented public API exists; otherwise skip and leave adapter interface. |
| **services/vendor-mf/mock-data.js** | Empanelled Regular schemes for demo | Screener must **intersect** ranked results with schemes Nivya can sell (mock list for now). |

**Env vars** (add to `services/api/.env.example` and `services/screener-worker/.env.example`):
```
MFAPI_BASE_URL=https://api.mfapi.in
NAV_PARQUET_PATH=../../data/nav_history.parquet
SCREENER_TOP_K=10
SCREENER_MIN_HISTORY_DAYS=365
SCREENER_SNAPSHOT_PATH=../../data/screener_snapshot.json
```

**Never commit API keys.** If mfdata.in requires a key, use `MFDATA_API_KEY` from env only.

### 6. Ranking logic (v1 — rule-based, per category)

For each AMFI category:

1. Filter schemes: Regular plan, min history ≥ 1Y (3Y preferred), min AUM threshold (configurable, e.g. ₹100 Cr).
2. Compute from NAV series:
   - CAGR 1Y, 3Y, 5Y (where data exists)
   - Annualised volatility (daily returns std × √252)
   - Max drawdown (optional)
3. **Performance score** (0–100): percentile of 3Y CAGR within category (weight 60%) + consistency (weight 20%) + expense ratio inverse rank (weight 20%).
4. **Risk score** (0–100): percentile of volatility within category (higher vol = higher risk score).
5. Map user `LOW|MEDIUM|HIGH` to volatility bands (tertiles within category) or category sets:
   - LOW → Liquid, Ultra Short, Money Market, Conservative Hybrid, Banking PSU
   - MEDIUM → Large Cap, Flexi Cap, Balanced Advantage, Index
   - HIGH → Small Cap, Mid Cap, Sectoral/Thematic, ELSS (user choice)
6. Sort by composite score descending; take Top K.
7. Attach `reasons[]` from threshold rules (explainable, template-based).

Export pure functions from `packages/screener-core`:
- `mapRiskPreferenceToCategories(preference, selectedCategories)`
- `computeMetrics(navSeries)`
- `scoreScheme(scheme, categoryPeers)`
- `rankSchemes(schemes, options) → RankedScheme[]`
- `buildMultiBucketResponse(buckets[])`

Add unit tests for ranking functions (vitest or node:test).

### 7. API spec — add to `docs/openapi.yaml`

```yaml
POST /v1/screener/query
Body:
  mode: SIP | LUMPSUM
  horizonMonths: number
  buckets: [
    { riskPreference: LOW|MEDIUM|HIGH, categories: string[], amountInr?: number, topK?: number }
  ]
Response:
  disclaimer: string
  dataAsOn: ISO8601
  buckets: [
    { bucketId, riskPreference, categories, amountInr, items: RankedScheme[] }
  ]

GET /v1/screener/categories
Response: { categories: [{ id, label, riskBand }] }

GET /v1/screener/metrics/{schemeCode}
Response: RankedScheme detail + navHistory summary (optional)
```

Implement routes in `services/api/src/server.js` (or split `routes/screener.js`). Read latest snapshot from `data/screener_snapshot.json` or compute on-the-fly for dev.

### 8. Screener worker — `services/screener-worker/`

Create new workspace package:

```
services/screener-worker/
├── package.json
├── src/
│   ├── ingest-mfapi.js      # fetch all schemes + latest NAV
│   ├── ingest-parquet.js    # load historical NAV (or skip if file missing)
│   ├── build-snapshot.js    # merge + rank all categories
│   └── run.js               # CLI: npm run build-snapshot
```

Add root script: `"screener:build": "npm run build-snapshot -w @nivya/screener-worker"`.

On first run without parquet, degrade gracefully: use MFapi.in history from `/mf/{code}` (limited) + mock vendor schemes with synthetic NAV from mock-data.

### 9. UI — `nivya-app.jsx`

Add new tab or sub-flow **Fund Insights** (can replace/enhance Explore or new route from Home):

**Screen 1 — Inputs**
- Mode: SIP / Lumpsum chips
- Horizon slider or picker (months/years)
- Risk: Low / Medium / High (multi-bucket: “Add another bucket” button)
- Per bucket: amount (optional), risk, category multi-select
- CTA: **“Show ranked funds”** (not “Get recommendations”)

**Screen 2 — Results**
- Per bucket: table/cards of Top K funds
- Show past return %, volatility %, risk score, performance score
- Expand row: reasons list (transparent)
- Footer: compliance disclaimer
- Button per fund: **“Invest”** → existing FundDetail / MFOrderSheet
- Label: **“Data as on {date}”**

Extend `src/nivya-api.js`:
- `queryScreener(payload)`
- `fetchScreenerCategories()`

Wire to BFF; fallback to local mock ranked list if API down.

### 10. Database (optional v1 — add SQL migration file)

Add to `infra/schema.sql` (or `infra/schema-screener.sql`):

```sql
CREATE TABLE screener_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_as_on TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE scheme_nav_daily (
  scheme_code VARCHAR(32) NOT NULL,
  nav_date DATE NOT NULL,
  nav NUMERIC(12, 6) NOT NULL,
  PRIMARY KEY (scheme_code, nav_date)
);
```

Implement PostgreSQL wiring only if time; JSON snapshot file is acceptable for v1.

### 11. Category taxonomy

Seed `packages/screener-core/categories.json` aligned with AMFI-style categories used on starsip.in / industry norms:

Large Cap, Mid Cap, Small Cap, Flexi Cap, ELSS, Hybrid Aggressive, Hybrid Conservative, Liquid, Ultra Short Duration, Index Fund, etc.

Map each to default `riskBand`: LOW | MEDIUM | HIGH.

### 12. Testing & verification

1. Unit tests for `packages/screener-core` ranking math.
2. Manual: `curl -X POST http://localhost:3001/v1/screener/query -H "Content-Type: application/json" -d '{ "mode":"SIP", "horizonMonths":60, "buckets":[{"riskPreference":"HIGH","categories":["Small Cap"]}] }'`
3. `npm run build` (Vite) must pass.
4. UI shows ranked funds with disclaimer; no forbidden words in UI strings.

### 13. Implementation constraints

- **Minimize scope creep** — no ML training pipeline in v1; rule-based only. Leave `packages/screener-core/ml/` stub with README for Phase 2 XGBoost per category.
- **Regular plans only** — filter scheme names containing "Direct" out.
- **Match repo style** — ESM, Fastify patterns, no unnecessary abstractions.
- **Do not** add SEBI RIA language or future return predictions.
- **Do not** auto-create git commits unless asked.
- Update `README.md` briefly: screener worker + Fund Insights screen + env vars.

### 14. Deliverables checklist

- [ ] `packages/screener-core/` — ranking engine + categories + tests
- [ ] `services/screener-worker/` — ingest + snapshot builder
- [ ] `data/screener_snapshot.json` — generated sample (gitignore large parquet; commit small snapshot ok)
- [ ] `docs/openapi.yaml` — Screener endpoints
- [ ] `services/api/src/server.js` — screener routes
- [ ] `src/nivya-api.js` — client methods
- [ ] `nivya-app.jsx` — Fund Insights UI (inputs + results + invest CTA)
- [ ] `scripts/download-nav-parquet.py` or `.md` instructions for data setup
- [ ] `.env.example` updates
- [ ] `README.md` section

### 15. Success criteria

A user can: choose SIP + 5 years + High risk + Small Cap → see Top 10 Regular funds with past return %, volatility %, factual reasons → tap Invest → existing order sheet. Multi-bucket (50k high + 150k low) shows **two separate lists**. All copy is MFD-compliant. Snapshot refreshes via `npm run screener:build`.

Start by reading existing files, then implement in order: screener-core → worker → API → UI.

## PROMPT END
