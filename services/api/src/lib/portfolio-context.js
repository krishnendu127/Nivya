/**
 * MFD-safe portfolio context (BFF) — peer past facts + related headlines.
 * Informational only; no causal or advice language.
 */

const NEWS_DISCLAIMER =
  "Related headlines are for information only. They are not a reason a fund rose or fell, " +
  "and not a recommendation to buy, sell, or hold.";

const PEER_NOTE =
  "Past 3Y CAGR vs the median of Regular plans in the same category in this demo universe. " +
  "Past performance does not guarantee future results.";

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

export function buildCategoryPeerMedians(funds) {
  const buckets = new Map();
  for (const f of funds ?? []) {
    const cat = f.cat ?? f.category;
    const r3 = f.r3 ?? f.pastReturn3y ?? f.returns?.r3y ?? null;
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
  const cats = item.match?.categories ?? [];
  const amcs = item.match?.amcs ?? [];
  const catHit = cats.some((c) => norm(c) === norm(holding.category));
  const amcHit = amcs.some(
    (a) => norm(holding.amc).includes(norm(a)) || norm(a).includes(norm(holding.amc)),
  );
  return catHit || amcHit;
}

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
