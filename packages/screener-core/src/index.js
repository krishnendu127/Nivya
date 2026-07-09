/**
 * @nivya/screener-core — Preference-aware rule-based ranking (Phase A)
 * Modular scorers + dynamic weights. No ranking prefs → legacy 60/20/20.
 * No ML, no side-effects. All functions are pure and unit-testable.
 */

import { resolveWeights, DEFAULT_WEIGHTS } from "./weights.js";
import {
  scoreReturns,
  scoreConsistency,
  scoreExpense,
  scoreRiskFit,
  scoreAmc,
  collectExtraReasons,
  aggregateScores,
} from "./scorers.js";

export { resolveWeights, DEFAULT_WEIGHTS } from "./weights.js";
export {
  scoreReturns,
  scoreConsistency,
  scoreExpense,
  scoreRiskFit,
  scoreAmc,
  pctRank,
} from "./scorers.js";

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

/**
 * @param {object} scheme
 * @param {object[]} categoryPeers
 * @param {{ riskPreference?: string, ranking?: object|null }} [scoreOptions]
 */
export function scoreScheme(scheme, categoryPeers, scoreOptions = {}) {
  const peers = categoryPeers.filter((p) => p.schemeCode !== scheme.schemeCode);
  const weights = resolveWeights({
    riskPreference: scoreOptions.riskPreference ?? "MEDIUM",
    ranking: scoreOptions.ranking ?? null,
  });

  const ret = scoreReturns(scheme, peers, weights.returnWindow);
  const cons = scoreConsistency(scheme, peers);
  const exp = scoreExpense(scheme, peers);
  const risk = scoreRiskFit(scheme, peers);
  const amc = scoreAmc(scheme, scoreOptions.ranking);

  const { performanceScore, reasons } = aggregateScores(
    [ret, cons, exp, risk, amc],
    weights
  );
  reasons.push(...collectExtraReasons(scheme));

  return {
    ...scheme,
    planType: "Regular",
    performanceScore,
    riskScore: Math.min(100, Math.max(0, risk.volPercentile ?? 50)),
    reasons,
    scoreBreakdown: {
      weights: {
        returns: +weights.returns.toFixed(4),
        consistency: +weights.consistency.toFixed(4),
        expense: +weights.expense.toFixed(4),
        riskFit: +weights.riskFit.toFixed(4),
        amc: +weights.amc.toFixed(4),
      },
      returnWindow: weights.returnWindow,
      components: {
        returns: ret.score,
        consistency: cons.score,
        expense: exp.score,
        riskFit: risk.score,
        amc: amc.score,
      },
    },
  };
}

export {
  answerFundQuestion,
  getSuggestedQuestions,
  flattenResultFunds,
  CHAT_DISCLAIMER,
} from "./fund-chat.js";

function amcMatchesList(schemeAmc, list) {
  if (!list?.length) return false;
  const amc = (schemeAmc ?? "").toLowerCase();
  return list.some((a) => {
    const needle = String(a).toLowerCase();
    return amc.includes(needle) || needle.includes(amc.split(/\s+/)[0] ?? "");
  });
}

export function rankSchemes(schemes, options = {}) {
  const {
    riskPreference = "MEDIUM",
    categories = [],
    topK = parseInt(process.env.SCREENER_TOP_K || "10", 10),
    minAumCr = 100,
    ranking = null,
  } = options;

  const eligible = mapRiskPreferenceToCategories(riskPreference, categories);
  const avoidedAmcs = ranking?.avoidedAmcs ?? [];

  const pool = schemes.filter((s) => {
    const name = (s.schemeName || s.name || "").toLowerCase();
    if (name.includes("direct")) return false;
    if (!eligible.includes(s.category)) return false;
    if (s.aum != null && s.aum < minAumCr) return false;
    if (amcMatchesList(s.amc, avoidedAmcs)) return false;
    return true;
  });

  if (!pool.length) return [];

  const byCat = {};
  for (const s of pool) {
    (byCat[s.category] ??= []).push(s);
  }

  const scoreOpts = { riskPreference, ranking };
  const scored = pool.map((s) => scoreScheme(s, byCat[s.category] ?? [s], scoreOpts));
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
    scoreBreakdown:   s.scoreBreakdown,
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
    ranking: bk.ranking ?? null,
    items: rankSchemes(schemes, {
      riskPreference: bk.riskPreference,
      categories:     bk.categories ?? [],
      topK:           bk.topK ?? undefined,
      ranking:        bk.ranking ?? null,
    }),
  }));

  return { disclaimer: DISCLAIMER, dataAsOn, buckets: resultBuckets };
}
