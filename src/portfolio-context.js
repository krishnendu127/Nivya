/**
 * MFD-safe portfolio context: peer past-return facts + related headlines.
 * Informational only — never causal ("not growing because of…") or advice.
 */

const NEWS_DISCLAIMER =
  "Related headlines are for information only. They are not a reason a fund rose or fell, " +
  "and not a recommendation to buy, sell, or hold.";

const PEER_NOTE =
  "Past 3Y CAGR vs the median of Regular plans in the same category in this demo universe. " +
  "Past performance does not guarantee future results.";

/** Demo headlines tagged by category / AMC keywords — replace with licensed feed later. */
const MOCK_NEWS = [
  {
    id: "n-macro-1",
    headline: "RBI keeps policy rate unchanged; markets watch liquidity cues",
    source: "Demo wire",
    publishedAt: "2026-07-08",
    tags: ["macro", "debt", "liquid"],
    match: { categories: ["Liquid", "Debt", "Hybrid"], amcs: [] },
  },
  {
    id: "n-eq-1",
    headline: "Domestic equities mixed as FIIs trim exposure in mid and small caps",
    source: "Demo wire",
    publishedAt: "2026-07-07",
    tags: ["equity", "small-cap", "mid-cap"],
    match: { categories: ["Small Cap", "Mid Cap", "Flexi Cap", "Contra"], amcs: [] },
  },
  {
    id: "n-lc-1",
    headline: "Large-cap indices consolidate near highs; earnings season in focus",
    source: "Demo wire",
    publishedAt: "2026-07-06",
    tags: ["equity", "large-cap"],
    match: { categories: ["Large Cap", "Index Fund", "ELSS"], amcs: [] },
  },
  {
    id: "n-tech-1",
    headline: "IT services stocks react to global tech spending commentary",
    source: "Demo wire",
    publishedAt: "2026-07-05",
    tags: ["sectoral", "technology"],
    match: { categories: ["Sectoral"], amcs: ["ICICI"] },
  },
  {
    id: "n-amc-1",
    headline: "Mutual fund industry AUM update: equity schemes see steady inflows",
    source: "Demo wire",
    publishedAt: "2026-07-04",
    tags: ["industry", "amc"],
    match: { categories: [], amcs: ["HDFC", "Nippon", "SBI", "Axis", "Mirae", "PPFAS", "Quant"] },
  },
  {
    id: "n-hyb-1",
    headline: "Balanced advantage funds in focus as volatility stays elevated",
    source: "Demo wire",
    publishedAt: "2026-07-03",
    tags: ["hybrid"],
    match: { categories: ["Hybrid"], amcs: [] },
  },
];

function norm(s) {
  return String(s ?? "").trim().toLowerCase();
}

/**
 * @param {Array<{ cat?: string, category?: string, r3?: number, pastReturn3y?: number }>} funds
 * @returns {Map<string, number>}
 */
export function buildCategoryPeerMedians(funds) {
  const buckets = new Map();
  for (const f of funds ?? []) {
    const cat = f.cat ?? f.category;
    const r3 = f.r3 ?? f.pastReturn3y;
    if (cat == null || r3 == null || Number.isNaN(Number(r3))) continue;
    const key = String(cat);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(Number(r3));
  }
  const medians = new Map();
  for (const [cat, vals] of buckets) {
    if (!vals.length) continue;
    const sorted = [...vals].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const med = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    medians.set(cat, Math.round(med * 10) / 10);
  }
  return medians;
}

/**
 * @param {number|null|undefined} fundR3
 * @param {number|null|undefined} median
 */
export function peerPastLabel(fundR3, median) {
  if (fundR3 == null || median == null) return "insufficient_data";
  const delta = Number(fundR3) - Number(median);
  if (Math.abs(delta) < 0.5) return "near_category_median_past";
  return delta > 0 ? "ahead_of_peers_past" : "trailing_peers_past";
}

export function peerPastLabelText(label) {
  switch (label) {
    case "ahead_of_peers_past":
      return "Ahead of category median (past 3Y)";
    case "trailing_peers_past":
      return "Trailing category median (past 3Y)";
    case "near_category_median_past":
      return "Near category median (past 3Y)";
    default:
      return "Past peer data unavailable";
  }
}

/**
 * @param {Array<{
 *   schemeCode: string,
 *   schemeName: string,
 *   category: string,
 *   amc: string,
 *   currentValue: number,
 *   pastReturn3y: number|null,
 * }>} holdingRows
 * @param {Map<string, number>|Record<string, number>} peerMedians
 * @param {number} [limit=5]
 */
export function buildHoldingPulse(holdingRows, peerMedians, limit = 5) {
  const getMed = (cat) => {
    if (peerMedians instanceof Map) return peerMedians.get(cat) ?? null;
    return peerMedians?.[cat] ?? null;
  };

  return (holdingRows ?? [])
    .slice()
    .sort((a, b) => b.currentValue - a.currentValue)
    .slice(0, limit)
    .map((row) => {
      const median = getMed(row.category);
      const fundR3 = row.pastReturn3y;
      const label = peerPastLabel(fundR3, median);
      const deltaPct =
        fundR3 != null && median != null
          ? Math.round((Number(fundR3) - Number(median)) * 10) / 10
          : null;
      return {
        schemeCode: row.schemeCode,
        schemeName: row.schemeName,
        category: row.category,
        amc: row.amc,
        weightPct: row.weightPct ?? null,
        pastReturn3y: fundR3,
        categoryMedian3y: median,
        deltaPct,
        label,
        labelText: peerPastLabelText(label),
      };
    });
}

function newsMatchesHolding(item, holding) {
  const cat = holding.category;
  const amc = holding.amc;
  const cats = item.match?.categories ?? [];
  const amcs = item.match?.amcs ?? [];
  const catHit = cats.some((c) => norm(c) === norm(cat));
  const amcHit = amcs.some((a) => norm(amc).includes(norm(a)) || norm(a).includes(norm(amc)));
  return catHit || amcHit;
}

/**
 * @param {Array<{ schemeCode: string, schemeName: string, category: string, amc: string }>} holdings
 */
export function buildRelatedNews(holdings) {
  const list = holdings ?? [];
  const items = MOCK_NEWS.map((n) => {
    const matchedHoldings = list
      .filter((h) => newsMatchesHolding(n, h))
      .map((h) => ({
        schemeCode: h.schemeCode,
        schemeName: h.schemeName,
        matchedOn: (n.match.categories ?? []).some((c) => norm(c) === norm(h.category))
          ? `category:${h.category}`
          : `amc:${h.amc}`,
      }));
    if (!matchedHoldings.length) return null;
    return {
      id: n.id,
      headline: n.headline,
      source: n.source,
      publishedAt: n.publishedAt,
      tags: n.tags,
      matchedHoldings,
    };
  }).filter(Boolean);

  // Prefer items that match more holdings; cap for UI
  items.sort((a, b) => b.matchedHoldings.length - a.matchedHoldings.length);
  return {
    items: items.slice(0, 6),
    note: NEWS_DISCLAIMER,
    peerNote: PEER_NOTE,
  };
}

export const PORTFOLIO_CONTEXT_COPY = {
  newsDisclaimer: NEWS_DISCLAIMER,
  peerNote: PEER_NOTE,
};
