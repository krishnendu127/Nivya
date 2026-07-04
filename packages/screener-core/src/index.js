/**
 * @nivya/screener-core — Pure rule-based ranking engine (Phase 1)
 * No ML, no side-effects. All functions are pure and unit-testable.
 * Phase 2: packages/screener-core/ml/ (XGBoost stub, not wired in v1)
 */

export const CATEGORIES = [
  { id: "large-cap",    label: "Large Cap",           riskBand: "MEDIUM" },
  { id: "flexi-cap",    label: "Flexi Cap",           riskBand: "MEDIUM" },
  { id: "small-cap",    label: "Small Cap",           riskBand: "HIGH"   },
  { id: "mid-cap",      label: "Mid Cap",             riskBand: "HIGH"   },
  { id: "elss",         label: "ELSS",                riskBand: "HIGH"   },
  { id: "liquid",       label: "Liquid",              riskBand: "LOW"    },
  { id: "ultra-short",  label: "Ultra Short Duration", riskBand: "LOW"   },
  { id: "money-market", label: "Money Market",        riskBand: "LOW"    },
  { id: "hybrid",       label: "Hybrid Aggressive",   riskBand: "MEDIUM" },
  { id: "balanced-adv", label: "Balanced Advantage",  riskBand: "MEDIUM" },
  { id: "index",        label: "Index Fund",          riskBand: "MEDIUM" },
  { id: "sectoral",     label: "Sectoral",            riskBand: "HIGH"   },
  { id: "contra",       label: "Contra",              riskBand: "HIGH"   },
  { id: "conservative-hybrid", label: "Conservative Hybrid", riskBand: "LOW" },
];

const RISK_CATEGORY_MAP = {
  LOW:    ["liquid", "ultra-short", "money-market", "conservative-hybrid"],
  MEDIUM: ["large-cap", "flexi-cap", "hybrid", "balanced-adv", "index"],
  HIGH:   ["small-cap", "mid-cap", "sectoral", "elss", "contra"],
};

export function mapRiskPreferenceToCategories(preference, selectedCategories = []) {
  const defaults = RISK_CATEGORY_MAP[preference] ?? RISK_CATEGORY_MAP.MEDIUM;
  if (!selectedCategories.length) return defaults;
  const intersection = selectedCategories.filter((c) => defaults.includes(c));
  return intersection.length ? intersection : selectedCategories;
}

export function computeMetrics(navSeries) {
  if (!navSeries || navSeries.length < 2) {
    return { cagr1y: null, cagr3y: null, cagr5y: null, volatilityPct: null, maxDrawdownPct: null };
  }

  const sorted = [...navSeries].sort((a, b) => new Date(a.date) - new Date(b.date));
  const latest = sorted[sorted.length - 1];
  const latestNav = latest.nav;
  const latestDate = new Date(latest.date);

  function cagrAt(yearsBack) {
    const targetDate = new Date(latestDate);
    targetDate.setFullYear(targetDate.getFullYear() - yearsBack);
    const candidates = sorted.filter((d) => new Date(d.date) <= targetDate);
    if (!candidates.length) return null;
    const past = candidates[candidates.length - 1];
    const actualYears = (latestDate - new Date(past.date)) / (365.25 * 24 * 3600 * 1000);
    if (actualYears < 0.9 * yearsBack) return null;
    return (Math.pow(latestNav / past.nav, 1 / actualYears) - 1) * 100;
  }

  const dailyReturns = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1].nav;
    const curr = sorted[i].nav;
    if (prev > 0) dailyReturns.push(Math.log(curr / prev));
  }

  let volatilityPct = null;
  if (dailyReturns.length > 1) {
    const mean = dailyReturns.reduce((s, r) => s + r, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((s, r) => s + (r - mean) ** 2, 0) / (dailyReturns.length - 1);
    volatilityPct = Math.sqrt(variance * 252) * 100;
  }

  let peak = sorted[0].nav;
  let maxDrawdownPct = 0;
  for (const { nav } of sorted) {
    if (nav > peak) peak = nav;
    const dd = ((peak - nav) / peak) * 100;
    if (dd > maxDrawdownPct) maxDrawdownPct = dd;
  }

  return {
    cagr1y: cagrAt(1),
    cagr3y: cagrAt(3),
    cagr5y: cagrAt(5),
    volatilityPct,
    maxDrawdownPct,
  };
}

export function scoreScheme(scheme, categoryPeers) {
  const peers = categoryPeers.filter((p) => p.schemeCode !== scheme.schemeCode);
  const all = [scheme, ...peers];

  function pctRank(value, arr, ascending = true) {
    if (!arr.length) return 50;
    const sorted = [...arr].sort((a, b) => ascending ? a - b : b - a);
    const idx = sorted.findIndex((v) => v >= value);
    return idx < 0 ? 100 : Math.round((idx / Math.max(sorted.length - 1, 1)) * 100);
  }

  const r3vals = all.map((s) => s.pastReturn3y).filter((v) => v != null);
  const expVals = all.map((s) => s.expenseRatio).filter((v) => v != null);
  const volVals = all.map((s) => s.volatilityPct).filter((v) => v != null);

  const r3Pct  = scheme.pastReturn3y  != null ? pctRank(scheme.pastReturn3y,  r3vals,  true)  : 50;
  const expPct = scheme.expenseRatio  != null ? pctRank(scheme.expenseRatio,  expVals, false) : 50;
  const volPct = scheme.volatilityPct != null ? pctRank(scheme.volatilityPct, volVals, true)  : 50;

  const gap = scheme.pastReturn1y != null && scheme.pastReturn3y != null
    ? Math.abs(scheme.pastReturn1y - scheme.pastReturn3y)
    : 0;
  const allGaps = all.map((s) =>
    s.pastReturn1y != null && s.pastReturn3y != null
      ? Math.abs(s.pastReturn1y - s.pastReturn3y)
      : 0
  );
  const consistencyPct = pctRank(gap, allGaps, false);

  const performanceScore = Math.round(r3Pct * 0.6 + consistencyPct * 0.2 + expPct * 0.2);
  const riskScore = volPct;

  const reasons = [];
  const catMedianR3 = r3vals.length
    ? r3vals.sort((a, b) => a - b)[Math.floor(r3vals.length / 2)]
    : 0;
  const catMedianVol = volVals.length
    ? volVals.sort((a, b) => a - b)[Math.floor(volVals.length / 2)]
    : Infinity;
  const catMedianExp = expVals.length
    ? expVals.sort((a, b) => a - b)[Math.floor(expVals.length / 2)]
    : Infinity;

  if (scheme.pastReturn3y != null && scheme.pastReturn3y > catMedianR3) {
    reasons.push({
      code: "HIGH_3Y_RETURN_IN_CATEGORY",
      text: `Past 3Y CAGR (${scheme.pastReturn3y.toFixed(1)}%) is above category median`,
    });
  }
  if (scheme.volatilityPct != null && scheme.volatilityPct < catMedianVol) {
    reasons.push({
      code: "LOWER_VOL_THAN_MEDIAN",
      text: `Historical annualised volatility (${scheme.volatilityPct.toFixed(1)}%) is below category median`,
    });
  }
  if (scheme.aum != null && scheme.aum > 30000) {
    reasons.push({
      code: "HIGH_AUM",
      text: `Large AUM (₹${Math.round(scheme.aum / 100) / 10}k Cr) signals liquidity depth`,
    });
  }
  if (scheme.expenseRatio != null && scheme.expenseRatio < catMedianExp) {
    reasons.push({
      code: "LOW_EXPENSE_RATIO",
      text: `Expense ratio (${scheme.expenseRatio.toFixed(2)}%) is below category median`,
    });
  }

  return {
    ...scheme,
    planType: "Regular",
    performanceScore: Math.min(100, Math.max(0, performanceScore)),
    riskScore:        Math.min(100, Math.max(0, riskScore)),
    reasons,
  };
}

export {
  answerFundQuestion,
  getSuggestedQuestions,
  flattenResultFunds,
  CHAT_DISCLAIMER,
} from "./fund-chat.js";

export function rankSchemes(schemes, options = {}) {
  const {
    riskPreference = "MEDIUM",
    categories = [],
    topK = parseInt(process.env.SCREENER_TOP_K || "10", 10),
    minAumCr = 100,
  } = options;

  const eligible = mapRiskPreferenceToCategories(riskPreference, categories);

  const pool = schemes.filter((s) => {
    const name = (s.schemeName || s.name || "").toLowerCase();
    if (name.includes("direct")) return false;
    if (!eligible.includes(s.category)) return false;
    if (s.aum != null && s.aum < minAumCr) return false;
    return true;
  });

  if (!pool.length) return [];

  const byCat = {};
  for (const s of pool) {
    (byCat[s.category] ??= []).push(s);
  }

  const scored = pool.map((s) => scoreScheme(s, byCat[s.category] ?? [s]));
  scored.sort((a, b) => b.performanceScore - a.performanceScore);

  return scored.slice(0, topK).map((s) => ({
    schemeCode:       s.schemeCode,
    schemeName:       s.schemeName,
    amc:              s.amc,
    category:         s.category,
    planType:         "Regular",
    riskometer:       s.riskometer,
    aum:              s.aum,
    expenseRatio:     s.expenseRatio,
    nav:              s.nav,
    pastReturn1y:     s.pastReturn1y  != null ? +s.pastReturn1y.toFixed(2)  : null,
    pastReturn3y:     s.pastReturn3y  != null ? +s.pastReturn3y.toFixed(2)  : null,
    pastReturn5y:     s.pastReturn5y  != null ? +s.pastReturn5y.toFixed(2)  : null,
    volatilityPct:    s.volatilityPct != null ? +s.volatilityPct.toFixed(2) : null,
    performanceScore: s.performanceScore,
    riskScore:        s.riskScore,
    reasons:          s.reasons,
    dataAsOn:         s.dataAsOn ?? new Date().toISOString(),
  }));
}

export function buildMultiBucketResponse(buckets, schemes) {
  const DISCLAIMER =
    "Mutual fund investments are subject to market risks. Past performance does not guarantee future results. " +
    "This is not investment advice. Read Scheme Information Document (SID) and Key Information Memorandum (KIM) before investing. " +
    "Nivya · AMFI-registered Mutual Fund Distributor (ARN). Regular plans only.";

  const dataAsOn = new Date().toISOString();

  const resultBuckets = buckets.map((bk, i) => ({
    bucketId: `bucket-${i + 1}`,
    riskPreference: bk.riskPreference,
    categories: bk.categories ?? [],
    amountInr: bk.amountInr ?? null,
    items: rankSchemes(schemes, {
      riskPreference: bk.riskPreference,
      categories:     bk.categories ?? [],
      topK:           bk.topK ?? undefined,
    }),
  }));

  return { disclaimer: DISCLAIMER, dataAsOn, buckets: resultBuckets };
}
