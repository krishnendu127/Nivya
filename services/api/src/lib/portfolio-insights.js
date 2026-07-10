import {
  buildCategoryPeerMedians,
  buildHoldingPulse,
  buildRelatedNews,
  PORTFOLIO_CONTEXT_COPY,
} from "./portfolio-context.js";

const PAST_PERF_NOTE =
  "Weighted average of each fund's published past CAGR, by your current market value. " +
  "This is not your personal XIRR or portfolio return. Past performance does not guarantee future results.";

const INSIGHTS_DISCLAIMER =
  "Factual portfolio data and user-controlled illustrations only — not investment advice, " +
  "not a forecast, and not a recommendation to buy, sell, or hold.";

function pctOf(value, total) {
  return total ? Math.round((value / total) * 1000) / 10 : 0;
}

function bucketTotals(rows, key) {
  const map = new Map();
  for (const row of rows) {
    map.set(row[key], (map.get(row[key]) ?? 0) + row.currentValue);
  }
  return [...map.entries()]
    .map(([label, valueInr]) => ({ label, valueInr, weightPct: 0 }))
    .sort((a, b) => b.valueInr - a.valueInr);
}

function weightedPastReturn(rows, total, field) {
  let weighted = 0;
  let cover = 0;
  for (const row of rows) {
    const r = row[field];
    if (r == null || Number.isNaN(r)) continue;
    const w = row.currentValue / total;
    weighted += w * r;
    cover += w;
  }
  if (!cover) return null;
  return Math.round((weighted / cover) * 10) / 10;
}

function buildConcentrationFlags(rows, total, byAmc) {
  const flags = [];
  const topHolding = rows[0];
  if (topHolding) {
    const topPct = pctOf(topHolding.currentValue, total);
    if (topPct >= 35) {
      flags.push({
        code: "HIGH_SINGLE_HOLDING",
        text: `${topHolding.schemeName ?? topHolding.schemeCode} is ${topPct}% of portfolio value`,
      });
    }
  }
  const topAmc = byAmc[0];
  if (topAmc && topAmc.weightPct >= 45) {
    flags.push({
      code: "HIGH_AMC_CONCENTRATION",
      text: `${topAmc.label} funds are ${topAmc.weightPct}% of portfolio value`,
    });
  }
  const equityCats = new Set([
    "large cap",
    "flexi cap",
    "small cap",
    "mid cap",
    "elss",
    "sectoral",
    "contra",
    "index fund",
  ]);
  let equityValue = 0;
  for (const row of rows) {
    if (equityCats.has(String(row.category).toLowerCase())) {
      equityValue += row.currentValue;
    }
  }
  const equityPct = pctOf(equityValue, total);
  if (equityPct >= 70) {
    flags.push({
      code: "EQUITY_HEAVY",
      text: `${equityPct}% of portfolio is in equity-oriented categories (by current value)`,
    });
  }
  return flags;
}

/**
 * @param {Array<{ schemeCode: string, schemeName?: string, currentValue: number }>} holdings
 * @param {(code: string) => Promise<object|null>|object|null} resolveScheme
 * @param {Array<object>} [peerFunds] optional catalog for category medians
 */
export async function buildPortfolioInsights(holdings, resolveScheme, peerFunds) {
  const rows = [];
  for (const h of holdings) {
    const scheme = await resolveScheme(h.schemeCode);
    rows.push({
      schemeCode: h.schemeCode,
      schemeName: h.schemeName ?? scheme?.name ?? h.schemeCode,
      currentValue: h.currentValue,
      category: scheme?.category ?? "Other",
      amc: scheme?.amc ?? "Other",
      pastReturn1y: scheme?.returns?.r1y ?? scheme?.pastReturn1y ?? null,
      pastReturn3y: scheme?.returns?.r3y ?? scheme?.pastReturn3y ?? null,
    });
  }

  rows.sort((a, b) => b.currentValue - a.currentValue);
  const total = rows.reduce((s, r) => s + r.currentValue, 0);
  if (!total) {
    return {
      disclaimer: INSIGHTS_DISCLAIMER,
      dataAsOn: new Date().toISOString(),
      allocation: { byCategory: [], byAmc: [] },
      concentration: { flags: [] },
      pastPerformance: {
        weightedReturn1y: null,
        weightedReturn3y: null,
        note: PAST_PERF_NOTE,
        holdingsWithPast1y: 0,
        holdingsWithPast3y: 0,
        holdingsTotal: 0,
      },
      holdingPulse: { items: [], note: PORTFOLIO_CONTEXT_COPY.peerNote },
      relatedNews: { items: [], note: PORTFOLIO_CONTEXT_COPY.newsDisclaimer },
    };
  }

  const byCategory = bucketTotals(rows, "category").map((b) => ({
    ...b,
    weightPct: pctOf(b.valueInr, total),
  }));
  const byAmc = bucketTotals(rows, "amc").map((b) => ({
    ...b,
    weightPct: pctOf(b.valueInr, total),
  }));

  const holdingsWithPast1y = rows.filter((r) => r.pastReturn1y != null).length;
  const holdingsWithPast3y = rows.filter((r) => r.pastReturn3y != null).length;

  const peerUniverse = Array.isArray(peerFunds) && peerFunds.length
    ? peerFunds
    : rows.map((r) => ({ category: r.category, pastReturn3y: r.pastReturn3y }));
  const peerMedians = buildCategoryPeerMedians(peerUniverse);
  const holdingPulse = buildHoldingPulse(
    rows.map((r) => ({ ...r, weightPct: pctOf(r.currentValue, total) })),
    peerMedians,
    5,
  );
  const relatedNews = buildRelatedNews(rows);

  return {
    disclaimer: INSIGHTS_DISCLAIMER,
    dataAsOn: new Date().toISOString(),
    allocation: { byCategory, byAmc },
    concentration: {
      topHoldingPct: rows[0] ? pctOf(rows[0].currentValue, total) : 0,
      topAmcPct: byAmc[0]?.weightPct ?? 0,
      flags: buildConcentrationFlags(rows, total, byAmc),
    },
    pastPerformance: {
      weightedReturn1y: weightedPastReturn(rows, total, "pastReturn1y"),
      weightedReturn3y: weightedPastReturn(rows, total, "pastReturn3y"),
      note: PAST_PERF_NOTE,
      holdingsWithPast1y,
      holdingsWithPast3y,
      holdingsTotal: rows.length,
    },
    holdingPulse: {
      items: holdingPulse,
      note: PORTFOLIO_CONTEXT_COPY.peerNote,
    },
    relatedNews,
  };
}

export function illustrativeFutureValue(currentValue, years, ratePct) {
  const y = Math.max(0, Number(years) || 0);
  const r = Number(ratePct) || 0;
  const base = Math.max(0, Number(currentValue) || 0);
  const factor = Math.pow(1 + r / 100, y);
  return Math.round(base * factor);
}

export const PORTFOLIO_INSIGHT_COPY = {
  pastPerfNote: PAST_PERF_NOTE,
  insightsDisclaimer: INSIGHTS_DISCLAIMER,
  illustrativeDisclaimer:
    "Illustrative only — you chose the assumed rate. Not a forecast, not guaranteed, " +
    "not investment advice. Actual outcomes will differ.",
};
