/**
 * Pure scoring helpers — percentile ranks + structured reasons.
 */

export function pctRank(value, arr, ascending = true) {
  if (!arr.length) return 50;
  const sorted = [...arr].sort((a, b) => (ascending ? a - b : b - a));
  const idx = sorted.findIndex((v) => v >= value);
  return idx < 0 ? 100 : Math.round((idx / Math.max(sorted.length - 1, 1)) * 100);
}

export function median(arr) {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

export function returnFieldForWindow(window) {
  if (window === "1y") return "pastReturn1y";
  if (window === "5y") return "pastReturn5y";
  return "pastReturn3y";
}

export function returnWindowLabel(window) {
  if (window === "1y") return "1Y";
  if (window === "5y") return "5Y";
  return "3Y";
}

/**
 * @returns {{ score: number, weightKey: string, reasons: object[] }}
 */
export function scoreReturns(scheme, peers, returnWindow = "3y") {
  const field = returnFieldForWindow(returnWindow);
  const all = [scheme, ...peers];
  const vals = all.map((s) => s[field]).filter((v) => v != null);
  const raw = scheme[field];
  const score = raw != null ? pctRank(raw, vals, true) : 50;
  const reasons = [];
  const med = median(vals);
  if (raw != null && med != null && raw > med) {
    const label = returnWindowLabel(returnWindow);
    reasons.push({
      code: `HIGH_${label}_RETURN_IN_CATEGORY`,
      dimension: "returns",
      impact: "positive",
      text: `Past ${label} CAGR (${raw.toFixed(1)}%) is above category median`,
    });
  }
  return { score, weightKey: "returns", reasons };
}

export function scoreConsistency(scheme, peers) {
  const all = [scheme, ...peers];
  const gap = scheme.pastReturn1y != null && scheme.pastReturn3y != null
    ? Math.abs(scheme.pastReturn1y - scheme.pastReturn3y)
    : 0;
  const allGaps = all.map((s) =>
    s.pastReturn1y != null && s.pastReturn3y != null
      ? Math.abs(s.pastReturn1y - s.pastReturn3y)
      : 0
  );
  const score = pctRank(gap, allGaps, false);
  return { score, weightKey: "consistency", reasons: [] };
}

export function scoreExpense(scheme, peers) {
  const all = [scheme, ...peers];
  const vals = all.map((s) => s.expenseRatio).filter((v) => v != null);
  const score = scheme.expenseRatio != null ? pctRank(scheme.expenseRatio, vals, false) : 50;
  const reasons = [];
  const med = median(vals);
  if (scheme.expenseRatio != null && med != null && scheme.expenseRatio < med) {
    reasons.push({
      code: "LOW_EXPENSE_RATIO",
      dimension: "expense",
      impact: "positive",
      text: `Expense ratio (${scheme.expenseRatio.toFixed(2)}%) is below category median`,
    });
  }
  return { score, weightKey: "expense", reasons };
}

/** Higher score = lower vol (fits safety / low-risk preference). Stored riskScore remains vol percentile ascending. */
export function scoreRiskFit(scheme, peers) {
  const all = [scheme, ...peers];
  const vals = all.map((s) => s.volatilityPct).filter((v) => v != null);
  const volPct = scheme.volatilityPct != null ? pctRank(scheme.volatilityPct, vals, true) : 50;
  const score = 100 - volPct;
  const reasons = [];
  const med = median(vals);
  if (scheme.volatilityPct != null && med != null && scheme.volatilityPct < med) {
    reasons.push({
      code: "LOWER_VOL_THAN_MEDIAN",
      dimension: "risk",
      impact: "positive",
      text: `Historical annualised volatility (${scheme.volatilityPct.toFixed(1)}%) is below category median`,
    });
  }
  return { score, weightKey: "riskFit", reasons, volPercentile: volPct };
}

export function scoreAmc(scheme, ranking) {
  const preferred = (ranking?.preferredAmcs ?? []).map((a) => a.toLowerCase());
  const avoided = (ranking?.avoidedAmcs ?? []).map((a) => a.toLowerCase());
  const amc = (scheme.amc ?? "").toLowerCase();
  const reasons = [];
  let score = 50;

  if (avoided.length && avoided.some((a) => amc.includes(a) || a.includes(amc.split(" ")[0]))) {
    score = 0;
    reasons.push({
      code: "AMC_AVOIDED",
      dimension: "amc",
      impact: "negative",
      text: `AMC matches an avoided preference (${scheme.amc})`,
    });
  } else if (preferred.length && preferred.some((a) => amc.includes(a) || a.includes(amc.split(" ")[0]))) {
    score = 100;
    reasons.push({
      code: "AMC_PREFERRED",
      dimension: "amc",
      impact: "positive",
      text: `AMC matches a preferred preference (${scheme.amc})`,
    });
  }

  return { score, weightKey: "amc", reasons };
}

export function collectExtraReasons(scheme) {
  const reasons = [];
  if (scheme.aum != null && scheme.aum > 30000) {
    reasons.push({
      code: "HIGH_AUM",
      dimension: "liquidity",
      impact: "positive",
      text: `Large AUM (₹${Math.round(scheme.aum / 100) / 10}k Cr) signals liquidity depth`,
    });
  }
  return reasons;
}

/**
 * Aggregate weighted scorer outputs → performanceScore + riskScore + reasons.
 * @param {object[]} components — each has score, weightKey, reasons?
 * @param {Record<string, number>} weights
 */
export function aggregateScores(components, weights) {
  let sum = 0;
  const reasons = [];
  for (const c of components) {
    const w = weights[c.weightKey] ?? 0;
    if (w <= 0 && c.weightKey !== "riskFit") {
      // still collect reasons from return/expense even if weight tiny
    }
    sum += (c.score ?? 50) * w;
    for (const r of c.reasons ?? []) reasons.push(r);
  }
  const performanceScore = Math.min(100, Math.max(0, Math.round(sum)));
  return { performanceScore, reasons };
}
