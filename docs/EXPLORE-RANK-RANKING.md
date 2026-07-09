# Explore → Rank: Preferences, Mechanism & Scoring

This document describes **exactly** how fund ranking works under **Discover → Rank** in Nivya, as implemented in the repository. All formulas and field mappings are taken from source code — not assumed.

**Primary source files:**

| Layer | File |
|-------|------|
| UI wizard & results | `src/DiscoverScreen.jsx` |
| Preferences → API payload | `src/discover-preferences.js` |
| API client | `src/nivya-api.js` |
| BFF route | `services/api/src/routes/screener.js` |
| Ranking engine | `packages/screener-core/src/index.js` |
| Snapshot data build | `services/screener-worker/build-snapshot.js` |
| Snapshot data | `data/screener_snapshot.json` |
| Unit tests | `packages/screener-core/src/__tests__/ranking.test.js` |

---

## 1. End-to-end flow

```
User (Discover → Rank tab)
  │
  ├─ Guided wizard OR saved Investment DNA (localStorage)
  │
  ├─ buildScreenerPayload(prefs)          [discover-preferences.js]
  │     → { mode, horizonMonths, buckets[], prefs }
  │
  ├─ queryScreener(payload)               [nivya-api.js]
  │     → POST /v1/screener/query
  │
  ├─ screenerRoutes POST /query           [services/api/src/routes/screener.js]
  │     → loadSnapshotRaw() from data/screener_snapshot.json
  │     → buildMultiBucketResponse(buckets, schemes)
  │
  └─ rankSchemes() per bucket             [packages/screener-core/src/index.js]
        → filter pool → scoreScheme() per fund → sort by performanceScore → top K
```

**UI entry point:** `RankPanel.runRank()` in `src/DiscoverScreen.jsx` calls `buildScreenerPayload(prefs)` then `queryScreener(payload)`.

**Results display:** `DiscoverRankResults` flattens `results.buckets[].items`, assigns rank `1..N` by array order (already sorted by score), and renders `RankResultCard` with `fund.performanceScore` as the displayed **Score**.

---

## 2. Preferences collected (Investment DNA)

Preferences are stored in `localStorage` under key `nivya-investment-dna` (`DNA_STORAGE_KEY` in `discover-preferences.js`).

### 2.1 Default values (`defaultPreferences()`)

| Field | Default |
|-------|---------|
| `goal` | `"wealth"` |
| `horizonId` | `"5-10"` |
| `marketReaction` | `"wait"` |
| `safetyGrowth` | `50` (slider 0–100) |
| `frequencyId` | `"monthly"` |
| `amount` | `5000` |
| `hasElss` | `null` |
| `firstMf` | `null` |
| `existingInvestments` | `[]` |
| `fundStyle` | `"both"` |
| `expensePriority` | `"balanced"` |
| `consistencyPref` | `"stable"` |
| `experience` | `"some"` |
| `completedWizard` | `false` |

### 2.2 Wizard steps (`getWizardSteps(prefs)`)

Adaptive step order:

1. `goal` — always
2. `elss` — only if `goal === "tax-saving"`
3. `horizon`
4. `reaction` (market drawdown behavior)
5. `safety` (safety vs growth slider)
6. `frequency`
7. `amount`
8. `refine` (optional experience / style / expense UI)

Emergency goals restrict horizon options to `lt1` and `1-3` only (`EMERGENCY_HORIZON_OPTIONS`).

### 2.3 Option catalogs

**Goals (`GOALS`):** `wealth`, `retirement`, `child-education`, `tax-saving`, `house`, `emergency`, `monthly-income`, `other`

**Horizons (`HORIZON_OPTIONS`):**

| id | label | months (used in payload) |
|----|-------|--------------------------|
| `lt1` | Less than 1 year | 6 |
| `1-3` | 1–3 years | 24 |
| `3-5` | 3–5 years | 48 |
| `5-10` | 5–10 years | 84 |
| `10+` | 10+ years | 120 |

**Market reactions (`MARKET_REACTIONS`):** `panic`, `wait`, `buy-more`

**Frequency (`FREQUENCY_OPTIONS`):** `once` → `LUMPSUM`, `monthly` / `quarterly` → `SIP`

**Refine step options:** `FIRST_MF_OPTIONS`, `EXISTING_INVESTMENTS`, `FUND_STYLE_OPTIONS`, `CONSISTENCY_PREF`, `EXPENSE_PRIORITY`, `EXPERIENCE_LEVEL`

### 2.4 Quick-start combos (`applyPopularCombo`)

| Combo id | Effect |
|----------|--------|
| `long-term` | wealth, 10+, wait, safetyGrowth 45, monthly ₹5000, stable, both |
| `tax-saving` | tax-saving, 3-5, wait, safetyGrowth 55, monthly ₹5000 |
| `emergency` | emergency, lt1, panic, safetyGrowth 85, once ₹50000, stable |
| `growth` | wealth, 5-10, buy-more, safetyGrowth 25, monthly ₹3000, volatile, active |

---

## 3. How preferences map to the screener API

`buildScreenerPayload(prefs)` produces:

```json
{
  "mode": "SIP" | "LUMPSUM",
  "horizonMonths": <number>,
  "buckets": [{
    "id": 1,
    "riskPreference": "LOW" | "MEDIUM" | "HIGH",
    "categories": ["large-cap", ...],
    "amountInr": <prefs.amount>
  }],
  "prefs": <full prefs object for UI explainability>
}
```

`queryScreener()` strips the payload to `{ mode, horizonMonths, buckets: [{ riskPreference, categories, amountInr, topK }] }` before POST.

### 3.1 Risk preference derivation (`deriveRiskPreference`)

Starts at **score = 50**, then applies adjustments:

| Input | Adjustment |
|-------|------------|
| `marketReaction === "panic"` | −28 |
| `marketReaction === "buy-more"` | +28 |
| `(50 - safetyGrowth) * 0.45` | added to score (higher growth slider → higher score) |
| `goal === "emergency"` or `"monthly-income"` | −25 |
| `goal === "tax-saving"` | +5 |
| `consistencyPref === "stable"` | −8 |
| `consistencyPref === "volatile"` | +12 |
| `experience === "new"` | −10 |

**Buckets:**

- `score < 33` → `"LOW"`
- `score > 66` → `"HIGH"`
- otherwise → `"MEDIUM"`

**UI label for market reaction** (`marketReactionStyle`): panic → "Cautious", buy-more → "Growth-oriented", wait → "Moderate".

**UI label for safety slider** (`safetyGrowthLabel`): ≥70 → "Safety first", ≤30 → "Growth first", else → "Balanced".

### 3.2 Category derivation (`deriveCategories`)

Rules are evaluated in order:

| Condition | Categories returned |
|-----------|---------------------|
| `goal === "tax-saving"` | `["elss"]` |
| `goal === "emergency"` | `["liquid", "hybrid"]` |
| `goal === "monthly-income"` | `["hybrid", "liquid"]` |
| `fundStyle === "index"` | `["index", "large-cap"]` |
| `goal` in `retirement`, `child-education`, `house` AND `safetyGrowth > 60` | `["large-cap", "hybrid"]` |
| same goals AND `safetyGrowth <= 60` | `["flexi-cap", "large-cap"]` |
| `safetyGrowth > 70` | `["large-cap", "hybrid"]` |
| `safetyGrowth < 30` | `["flexi-cap", "small-cap", "mid-cap"]` |
| default | `["flexi-cap", "large-cap"]` |

These categories are sent in the API bucket **before** risk-band intersection (see §4.2).

### 3.3 Fields that do **not** change the ranking engine

The following are collected in the wizard but **are not read** by `rankSchemes()` or `scoreScheme()`:

| Field | Actual use today |
|-------|------------------|
| `horizonMonths` | Soft weight tilt when `ranking` present (short → consistency/riskFit; long → returns) |
| `mode` (SIP/LUMPSUM) | Echoed; **not** used in scoring |
| `amountInr` | Echoed; **not** used in scoring |
| `expensePriority` | **Affects weights** when `ranking` sent (`low-cost` / `performance`) |
| `consistencyPref` | **Affects weights** when `ranking` sent |
| `returnWindow` | Chooses 1Y / 3Y / 5Y return field |
| `preferredAmcs` / `avoidedAmcs` | Soft boost / hard exclude |
| `firstMf`, `existingInvestments`, `hasElss` | Still not ranking math |

---

## 4. Pool filtering (`rankSchemes`)

```js
rankSchemes(schemes, {
  riskPreference = "MEDIUM",
  categories = [],
  topK = parseInt(process.env.SCREENER_TOP_K || "10", 10),
  minAumCr = 100,
})
```

### 4.1 Eligible categories (`mapRiskPreferenceToCategories`)

Default category sets per risk band (`RISK_CATEGORY_MAP` in `packages/screener-core/src/index.js`):

| `riskPreference` | Default categories |
|------------------|-------------------|
| `LOW` | `liquid`, `ultra-short`, `money-market`, `conservative-hybrid` |
| `MEDIUM` | `large-cap`, `flexi-cap`, `hybrid`, `balanced-adv`, `index` |
| `HIGH` | `small-cap`, `mid-cap`, `sectoral`, `elss`, `contra` |

**Intersection logic** when user categories are provided:

1. Start with risk-band defaults.
2. If `selectedCategories` is non-empty: `intersection = selectedCategories.filter(c => defaults.includes(c))`.
3. If intersection is non-empty → use intersection.
4. If intersection is empty → use `selectedCategories` as-is (fallback).

Example (from unit test): `HIGH` + `["small-cap", "large-cap"]` → `["small-cap"]` only.

### 4.2 Scheme pool filters

A scheme is included only if **all** of:

1. **Regular plans only:** `schemeName` does **not** contain `"direct"` (case-insensitive).
2. **Category:** `scheme.category` is in the eligible category list from §4.1.
3. **AUM floor:** if `scheme.aum != null`, it must be `>= minAumCr` (default **100** crore).  
   - Current MFapi snapshot often has `aum: null` → this filter is **skipped** for those schemes.

If the pool is empty after filtering, `rankSchemes` returns `[]`.

### 4.3 Peer grouping

Within the pool, schemes are grouped by `category`. Each scheme is scored against **peers in the same category** (`byCat[s.category]`).

### 4.4 Sorting and truncation

1. `scored.sort((a, b) => b.performanceScore - a.performanceScore)` — higher score ranks first.
2. Return `scored.slice(0, topK)` — default **top 10** (`SCREENER_TOP_K` env or `10`).
3. UI rank number = position in returned list (1-based).

---

## 5. Scoring a single fund (`scoreScheme`)

All scoring is **rule-based percentile ranking within category peers**. No ML (see file header in `screener-core`).

### 5.1 Inputs per scheme (from snapshot)

| Field | Source | Notes |
|-------|--------|-------|
| `pastReturn1y` | NAV CAGR over ~1Y | From snapshot build |
| `pastReturn3y` | NAV CAGR over ~3Y | Primary performance input |
| `pastReturn5y` | NAV CAGR over ~5Y | Display only in scoring path |
| `volatilityPct` | Annualised log-return std × √252 | Last ~252 trading days in snapshot build |
| `expenseRatio` | — | Often `null` in live MFapi snapshot |
| `aum` | — | Often `null` in live MFapi snapshot |

### 5.2 Percentile rank helper (`pctRank`)

```js
function pctRank(value, arr, ascending = true) {
  const sorted = [...arr].sort((a, b) => ascending ? a - b : b - a);
  const idx = sorted.findIndex((v) => v >= value);
  return idx < 0 ? 100 : Math.round((idx / Math.max(sorted.length - 1, 1)) * 100);
}
```

- `ascending: true` → higher raw value → higher percentile (used for returns, volatility in risk score).
- `ascending: false` → lower raw value → higher percentile (used for expense ratio, consistency gap).

Missing values for a metric default that component to **50** (neutral).

### 5.3 Component percentiles

Computed across `[scheme, ...peers]` in the same category:

| Component | Raw metric | `pctRank` direction | Weight in `performanceScore` |
|-----------|------------|---------------------|------------------------------|
| `r3Pct` | `pastReturn3y` | ascending (higher return = better) | **60%** |
| `consistencyPct` | `\|pastReturn1y - pastReturn3y\|` | **descending** (smaller gap = better) | **20%** |
| `expPct` | `expenseRatio` | descending (lower expense = better) | **20%** |

**Formulas:**

```
gap = |pastReturn1y - pastReturn3y|   (0 if either missing)

performanceScore = round(r3Pct * 0.6 + consistencyPct * 0.2 + expPct * 0.2)
performanceScore = clamp(0, 100, performanceScore)

riskScore = volPct   (percentile of volatility within category, ascending)
riskScore = clamp(0, 100, riskScore)
```

**Important:** Sort order uses **`performanceScore` only**. `riskScore` is computed and returned but **does not** affect rank position in v1.

When `expenseRatio` is `null` for all peers (common in current snapshot), `expPct = 50` for everyone → the 20% expense component is effectively neutral.

### 5.4 Explainability reasons (`reasons[]`)

Factual, template-based tags attached to each scored fund (used in API and partially in UI):

| Code | Condition | Example text |
|------|-----------|--------------|
| `HIGH_3Y_RETURN_IN_CATEGORY` | `pastReturn3y > category median 3Y` | `Past 3Y CAGR (X%) is above category median` |
| `LOWER_VOL_THAN_MEDIAN` | `volatilityPct < category median vol` | `Historical annualised volatility (X%) is below category median` |
| `HIGH_AUM` | `aum > 30000` (₹300 Cr in code’s unit) | `Large AUM (₹Xk Cr) signals liquidity depth` |
| `LOW_EXPENSE_RATIO` | `expenseRatio < category median expense` | `Expense ratio (X%) is below category median` |

`planType` is always set to `"Regular"` on scored output.

---

## 6. Fund data & metric computation

### 6.1 Snapshot build (`npm run screener:build`)

Worker: `services/screener-worker/build-snapshot.js`

- Fetches up to **200** Regular schemes from `https://api.mfapi.in/mf`.
- Per scheme: NAV history from `/mf/{schemeCode}`.
- Requires ≥ `SCREENER_MIN_HISTORY_DAYS` (default **365**) of history.
- Maps AMFI sub-category → internal `category` id via `CATEGORY_MAP`.
- Computes:
  - `pastReturn1y/3y/5y` via CAGR from NAV at 1/3/5 years ago
  - `volatilityPct` from last 252 NAV points
- `expenseRatio` and `aum` are **`null`** in MFapi path (not ingested yet).
- Fallback: `@nivya/vendor-mf` mock data with synthetic expense/AUM.

Output: `data/screener_snapshot.json` — loaded by BFF on each `/screener/query` (not live MFapi per request).

### 6.2 `computeMetrics(navSeries)` (library utility)

Pure function for NAV series → `{ cagr1y, cagr3y, cagr5y, volatilityPct, maxDrawdownPct }`. Used in tests and available for `/screener/metrics/:schemeCode`; snapshot build uses its own inline CAGR/vol helpers.

---

## 7. API contract

### `POST /v1/screener/query`

**Request body:**

```json
{
  "mode": "SIP",
  "horizonMonths": 84,
  "buckets": [{
    "riskPreference": "MEDIUM",
    "categories": ["flexi-cap", "large-cap"],
    "amountInr": 5000,
    "topK": 10
  }]
}
```

- `buckets`: 1–5 items (Rank UI sends **1** bucket).
- `STP` / `SWP`: stub response with empty buckets (not ranked in v1).

**Response (per bucket):**

```json
{
  "disclaimer": "...",
  "dataAsOn": "ISO timestamp",
  "mode": "SIP",
  "horizonMonths": 84,
  "buckets": [{
    "bucketId": "bucket-1",
    "riskPreference": "MEDIUM",
    "categories": ["flexi-cap", "large-cap"],
    "amountInr": 5000,
    "items": [ /* ranked schemes */ ]
  }]
}
```

Each `item` includes: `schemeCode`, `schemeName`, `amc`, `category`, `planType`, `riskometer`, `aum`, `expenseRatio`, `nav`, `pastReturn1y/3y/5y`, `volatilityPct`, `performanceScore`, `riskScore`, `reasons[]`, `dataAsOn`.

### Other endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /v1/screener/categories` | Lists `CATEGORIES` with `id`, `label`, `riskBand` |
| `GET /v1/screener/status` | Snapshot metadata, scheme count, latest NAV date |
| `GET /v1/screener/metrics/:schemeCode` | Single-scheme `scoreScheme()` vs category peers |

---

## 8. UI: what the user sees after ranking

### 8.1 Results header (`DiscoverRankResults`)

- Count: `{N} ranked funds`
- Meta: `{goal} · {mode} · {horizon label} · As on {dataAsOn}`
- Compliance line: *“Ranked using criteria you selected · Regular plans only · Not investment advice”*

### 8.2 Rank card (`RankResultCard`)

| UI element | Source |
|------------|--------|
| Rank badge (1, 2, 3…) | Index in sorted `items` array + 1 |
| **Score** (large number) | `fund.performanceScore` |
| Past 1Y / 3Y / 5Y / Volatility | `fund.pastReturn*` / `fund.volatilityPct` |
| “Why this fund appears” tags | `buildWhyTags(fund, prefs)` — max **5** tags |

### 8.3 `buildWhyTags` (UI-only explainability)

Always adds preference-context tags:

- `Matches {horizon label} timeline`
- `Selected for {goal label} goal`
- `Fits regular investing cadence` — if monthly/quarterly frequency

Conditional tags:

| Condition | Tag |
|-----------|-----|
| `safetyGrowth >= 60` AND `volatilityPct < 14` | `Moderate historical volatility` |
| `consistencyPref === "stable"` AND `volatilityPct < 16` | `Relatively stable past returns` |
| `expensePriority === "low-cost"` AND `expenseRatio < 1` | `Expense below typical range` |

Then merges shortened text from `fund.reasons[]` (engine output). These tags **do not** change scores.

---

## 9. Offline / fallback path

If the API is unreachable, `RankPanel` shows an error (*“Run npm run start:api and npm run screener:build”*).

`queryScreenerOffline()` in `nivya-api.js` uses `clientSideRank()` on a **10-scheme mock list** with a **simplified** score:

```
performanceScore ≈ percentile of pastReturn3y only (no consistency/expense components)
riskScore = 50 fixed
```

Production Rank UI calls `queryScreener()` (API), not the offline path.

---

## 10. Supported categories (engine)

Full list in `CATEGORIES` (`packages/screener-core/src/index.js`):

| id | label | riskBand |
|----|-------|----------|
| `large-cap` | Large Cap | MEDIUM |
| `flexi-cap` | Flexi Cap | MEDIUM |
| `small-cap` | Small Cap | HIGH |
| `mid-cap` | Mid Cap | HIGH |
| `elss` | ELSS | HIGH |
| `liquid` | Liquid | LOW |
| `ultra-short` | Ultra Short Duration | LOW |
| `money-market` | Money Market | LOW |
| `hybrid` | Hybrid Aggressive | MEDIUM |
| `balanced-adv` | Balanced Advantage | MEDIUM |
| `index` | Index Fund | MEDIUM |
| `sectoral` | Sectoral | HIGH |
| `contra` | Contra | HIGH |
| `conservative-hybrid` | Conservative Hybrid | LOW |

User-facing DNA summary maps a subset of ids to display labels (`buildDnaSummary`).

---

## 11. Compliance positioning

- Ranking is described as **criteria-based**, not personalized advice.
- Every API response includes a **disclaimer** (market risk, past performance, not advice, SID/KIM, ARN, Regular only).
- Forbidden positioning is documented in `docs/CLAUDE-PROMPT-FUND-SCREENER.md` (no “recommend”, “best for you”, etc.).

---

## 12. Known limitations (v1) → Phase A updates

**Phase A (preference-aware screener) is live in code:** modular scorers, dynamic weights when `buckets[].ranking` is sent, AMC prefer/avoid, return window 1Y/3Y/5Y, riskFit in composite, expense overlay / category TER estimates.

Still limited:
1. MFapi TER/AUM often null — filled via `data/scheme_meta_overlay.json` or category estimates (not official SID TER).
2. No holdings / theme / ESG scoring yet.
3. Peer set = same category within filtered pool.
4. Max ~200 schemes in snapshot build.
5. **API without `ranking`** → exact legacy weights 60/20/20 (riskFit=0). **Discover Rank** always sends `ranking` from DNA → prefs tilt scores.

## 13. Quick reference: ranking formula (Phase A)

```
eligibleCategories = intersect(riskBandDefaults, userCategories) or fallback

pool = schemes where:
  - name does not contain "direct"
  - category in eligibleCategories
  - aum is null OR aum >= 100 Cr
  - AMC not in avoidedAmcs (if ranking.avoidedAmcs set)

weights = resolveWeights({ riskPreference, ranking })
  // ranking null → returns 0.6, consistency 0.2, expense 0.2, riskFit 0, amc 0
  // ranking present → tilt from expensePriority, consistencyPref, risk, horizon, safety, preferredAmcs

for each scheme in pool:
  peers = same category in pool
  returnPct      = percentile(return for ranking.returnWindow, peers)
  consistencyPct = percentile(|1Y-3Y gap|, peers, lower better)
  expPct         = percentile(expenseRatio, peers, lower better)
  riskFitPct     = 100 - volPercentile   // lower vol scores higher for riskFit
  amcPct         = 100 / 50 / 0 for preferred / neutral / avoided

  performanceScore = round(Σ weight_i × score_i)
  riskScore        = volPercentile (display / API; also contributes via riskFit weight)

sort by performanceScore desc → top K
```

---

*Phase A implementation: `packages/screener-core/src/{weights,scorers,index}.js`, Discover `buildRankingPrefs`, overlay `data/scheme_meta_overlay.json`.*
