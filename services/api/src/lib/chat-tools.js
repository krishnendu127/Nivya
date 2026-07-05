import { loadSnapshotRaw, snapshotRowToScheme } from "./snapshot-store.js";
import { CATEGORIES } from "@nivya/screener-core";

/**
 * Real MFapi-derived schemes only — deliberately does NOT use
 * listCatalogSchemes(), which merges in @nivya/vendor-mf's illustrative demo
 * SCHEMES so the app's hardcoded demo portfolio/SIP codes stay resolvable.
 * Those are placeholder numbers, not real fund data, and must never be
 * presented to the chatbot as factual performance figures.
 */
async function loadRealSchemes({ category, q } = {}) {
  const raw = await loadSnapshotRaw();
  let items = raw.map(snapshotRowToScheme);

  if (category) {
    const needle = category.toLowerCase();
    items = items.filter((s) => s.category.toLowerCase().includes(needle));
  }
  if (q) {
    const needle = q.toLowerCase();
    items = items.filter(
      (s) =>
        s.name.toLowerCase().includes(needle) ||
        s.amc.toLowerCase().includes(needle) ||
        String(s.schemeCode).includes(needle)
    );
  }
  return items;
}

const VALUE_ACCESSORS = {
  pastReturn1y: (s) => s.returns?.r1y,
  pastReturn3y: (s) => s.returns?.r3y,
  pastReturn5y: (s) => s.returns?.r5y,
  expenseRatio: (s) => s.expenseRatio,
};

/**
 * Pure sort/filter/cap logic over an already-fetched scheme list — separated
 * from data-fetching so it's unit-testable without touching the snapshot file.
 * @param {object[]} items
 * @param {{ sortBy: string, order?: "asc"|"desc", minValue?: number, maxValue?: number, topK?: number }} args
 */
export function rankFundItems(items, { sortBy, order = "desc", minValue, maxValue, topK = 10 }) {
  const accessor = VALUE_ACCESSORS[sortBy];
  if (!accessor) throw new Error(`Unknown sortBy: ${sortBy}`);

  const filtered = items.filter((s) => {
    const v = accessor(s);
    if (v == null || Number.isNaN(v)) return false;
    if (minValue != null && v < minValue) return false;
    if (maxValue != null && v > maxValue) return false;
    return true;
  });

  filtered.sort((a, b) => (order === "asc" ? accessor(a) - accessor(b) : accessor(b) - accessor(a)));

  const totalMatching = filtered.length;
  const cappedTopK = Math.max(1, Math.min(20, Number(topK) || 10));

  return {
    totalMatching,
    items: filtered.slice(0, cappedTopK).map((s) => ({
      schemeName: s.name,
      amc: s.amc,
      category: s.category,
      value: accessor(s),
    })),
  };
}

/**
 * Ranks and/or filters the (Regular-plan-only) catalog by a metric.
 * @param {{ category?: string, sortBy: string, order?: "asc"|"desc", minValue?: number, maxValue?: number, topK?: number }} args
 */
export async function rankFunds({ category, ...rest } = {}) {
  // loadRealSchemes filters by substring match against the human-readable
  // category label (e.g. "Large Cap"), not the id — normalize "large-cap" -> "large cap".
  const normalizedCategory = category ? category.replace(/-/g, " ") : undefined;
  const items = await loadRealSchemes({ category: normalizedCategory });
  return rankFundItems(items, rest);
}

/** Fuzzy search by name/AMC for funds not brought in via @mention. */
export async function findFund({ query } = {}) {
  const items = await loadRealSchemes({ q: query });
  return {
    totalMatching: items.length,
    items: items.slice(0, 5).map((s) => ({
      schemeCode: s.schemeCode,
      schemeName: s.name,
      amc: s.amc,
      category: s.category,
      nav: s.nav,
    })),
  };
}

export function categoryInfo() {
  return {
    categories: CATEGORIES.map((c) => ({ id: c.id, label: c.label, riskBand: c.riskBand })),
  };
}

/** Builds the tool-name -> executor map handed to the chatbot-core orchestrator. */
export function buildChatToolProvider() {
  return {
    rank_funds: rankFunds,
    find_fund: findFund,
    category_info: categoryInfo,
  };
}
