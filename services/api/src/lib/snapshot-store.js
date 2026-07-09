import { readFile, stat } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CATEGORIES } from "@nivya/screener-core";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const SNAPSHOT_PATH = resolve(
  process.env.SCREENER_SNAPSHOT_PATH
    ?? resolve(__dirname, "../../../../data/screener_snapshot.json")
);

const META_OVERLAY_PATH = resolve(
  process.env.SCREENER_META_OVERLAY_PATH
    ?? resolve(__dirname, "../../../../data/scheme_meta_overlay.json")
);

let _snapshotCache = null;
let _snapshotMtime = 0;
let _dataSource = "unknown";
let _metaOverlay = null;

async function loadMetaOverlay() {
  if (_metaOverlay) return _metaOverlay;
  try {
    const raw = await readFile(META_OVERLAY_PATH, "utf8");
    const parsed = JSON.parse(raw);
    _metaOverlay = parsed;
    return parsed;
  } catch {
    _metaOverlay = {};
    return _metaOverlay;
  }
}

/** Typical Regular-plan TER (%) by category — last-resort when snapshot has null. Overlay / real TER wins. */
const CATEGORY_EXPENSE_ESTIMATE = {
  liquid: 0.25,
  "ultra-short": 0.35,
  "money-market": 0.3,
  "conservative-hybrid": 0.9,
  "large-cap": 1.05,
  "flexi-cap": 1.15,
  hybrid: 1.1,
  "balanced-adv": 1.05,
  index: 0.55,
  "mid-cap": 1.2,
  "small-cap": 1.25,
  elss: 1.15,
  sectoral: 1.3,
  contra: 1.15,
};

/** Fill null expense/AUM from overlay file when present. */
function applyMetaOverlay(schemes, overlay) {
  if (!overlay || typeof overlay !== "object") overlay = {};
  return schemes.map((s) => {
    const meta = overlay[String(s.schemeCode)];
    let expenseRatio = s.expenseRatio ?? meta?.expenseRatio ?? null;
    let aum = s.aum ?? meta?.aum ?? null;
    let expenseSource = s.expenseSource ?? null;
    if (expenseRatio == null && s.category && CATEGORY_EXPENSE_ESTIMATE[s.category] != null) {
      expenseRatio = CATEGORY_EXPENSE_ESTIMATE[s.category];
      expenseSource = "category-estimate";
    } else if (expenseRatio != null && !expenseSource) {
      expenseSource = meta?.expenseRatio != null ? "overlay" : "snapshot";
    }
    if (aum == null && meta?.aum != null) aum = meta.aum;
    return { ...s, expenseRatio, aum, expenseSource };
  });
}

function categoryLabel(id = "") {
  const ui = {
    "large-cap": "Large Cap",
    "flexi-cap": "Flexi Cap",
    "small-cap": "Small Cap",
    "mid-cap": "Mid Cap",
    elss: "ELSS",
    liquid: "Liquid",
    hybrid: "Hybrid",
    "balanced-adv": "Hybrid",
    index: "Index Fund",
    sectoral: "Sectoral",
    contra: "Contra",
  };
  return ui[id] ?? CATEGORIES.find((c) => c.id === id)?.label ?? id.replace(/-/g, " ");
}

function mapVendorMockSchemes(SCHEMES) {
  return SCHEMES.map((s) => ({
    schemeCode: s.schemeCode,
    schemeName: `${s.name} - Regular`,
    amc: s.amc,
    category: (s.category ?? "").toLowerCase().replace(/ /g, "-"),
    planType: "Regular",
    expenseRatio: s.expenseRatio,
    aum: 20000,
    riskometer: s.risk,
    nav: s.nav,
    prevNav: s.prevNav ?? s.nav * 0.998,
    pastReturn1y: s.returns?.r1y ?? null,
    pastReturn3y: s.returns?.r3y ?? null,
    pastReturn5y: s.returns?.r5y ?? null,
    volatilityPct: s.category === "Liquid" ? 0.5 : 12,
    dataAsOn: new Date().toISOString(),
  }));
}

/** @returns {Promise<object[]>} raw snapshot rows */
export async function loadSnapshotRaw() {
  const overlay = await loadMetaOverlay();
  try {
    const fileStat = await stat(SNAPSHOT_PATH);
    if (_snapshotCache && fileStat.mtimeMs === _snapshotMtime) {
      return _snapshotCache;
    }
    const raw = await readFile(SNAPSHOT_PATH, "utf8");
    _snapshotCache = applyMetaOverlay(JSON.parse(raw), overlay);
    _snapshotMtime = fileStat.mtimeMs;
    _dataSource = _snapshotCache.length > 0 && /^\d+$/.test(String(_snapshotCache[0]?.schemeCode ?? ""))
      ? "mfapi-snapshot"
      : "snapshot-file";
    return _snapshotCache;
  } catch (err) {
    if (!_snapshotCache) {
      const { SCHEMES } = await import("@nivya/vendor-mf");
      _snapshotCache = applyMetaOverlay(mapVendorMockSchemes(SCHEMES), overlay);
      _dataSource = "vendor-mock-fallback";
      console.warn(`[snapshot] missing at ${SNAPSHOT_PATH}; using vendor mock (${err.message})`);
    }
    return _snapshotCache;
  }
}

export function getSnapshotMeta() {
  return { dataSource: _dataSource, snapshotPath: SNAPSHOT_PATH, schemeCount: _snapshotCache?.length ?? 0 };
}

/** Map snapshot row → BFF Scheme shape for /v1/schemes */
export function snapshotRowToScheme(entry) {
  const name = (entry.schemeName ?? entry.name ?? "")
    .replace(/\s*-\s*Regular.*$/i, "")
    .replace(/\s*-\s*Growth.*$/i, "")
    .trim();
  const amcShort = (entry.amc ?? "").replace(/ Mutual Fund$/i, "").trim();
  return {
    schemeCode: String(entry.schemeCode),
    name: name || entry.schemeName || entry.schemeCode,
    amc: amcShort || entry.amc || "AMC",
    category: categoryLabel(entry.category),
    risk: entry.riskometer ?? "Moderate",
    nav: entry.nav ?? 100,
    prevNav: entry.prevNav ?? (entry.nav ?? 100) * 0.998,
    minSip: entry.minSip ?? 500,
    expenseRatio: entry.expenseRatio ?? null,
    returns: {
      r1y: entry.pastReturn1y ?? entry.returns?.r1y ?? 0,
      r3y: entry.pastReturn3y ?? entry.returns?.r3y ?? 0,
      r5y: entry.pastReturn5y ?? entry.returns?.r5y ?? 0,
    },
  };
}

/** Merge MFapi snapshot + vendor mock (demo portfolio/SIP codes stay valid). */
export async function listCatalogSchemes({ category, q } = {}) {
  const raw = await loadSnapshotRaw();
  const mapped = raw.map(snapshotRowToScheme);

  const { SCHEMES } = await import("@nivya/vendor-mf");
  const mockMapped = SCHEMES.map((s) => ({
    schemeCode: s.schemeCode,
    name: s.name,
    amc: s.amc,
    category: s.category,
    risk: s.risk,
    nav: s.nav,
    prevNav: s.prevNav ?? s.nav * 0.998,
    minSip: s.minSip,
    expenseRatio: s.expenseRatio,
    returns: s.returns,
  }));

  const byCode = new Map();
  for (const s of [...mapped, ...mockMapped]) {
    byCode.set(s.schemeCode, s);
  }
  let items = [...byCode.values()];

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

export async function getCatalogScheme(schemeCode) {
  const items = await listCatalogSchemes({});
  return items.find((s) => s.schemeCode === schemeCode) ?? null;
}
