/**
 * Builds data/screener_snapshot.json from MFapi.in or vendor-mf mock data.
 * Run: npm run screener:build
 */

import { writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const MFAPI_BASE = process.env.MFAPI_BASE_URL ?? "https://api.mfapi.in";
const OUT_PATH = resolve(
  process.env.SCREENER_SNAPSHOT_PATH ?? resolve(__dirname, "../../data/screener_snapshot.json")
);
const MIN_DAYS = parseInt(process.env.SCREENER_MIN_HISTORY_DAYS ?? "365", 10);
const MAX_SCHEMES = 200;

const CATEGORY_MAP = {
  "Large Cap Fund": "large-cap",
  "Flexi Cap Fund": "flexi-cap",
  "Small Cap Fund": "small-cap",
  "Mid Cap Fund": "mid-cap",
  ELSS: "elss",
  "Liquid Fund": "liquid",
  "Ultra Short Duration Fund": "ultra-short",
  "Money Market Fund": "money-market",
  "Aggressive Hybrid Fund": "hybrid",
  "Balanced Advantage Fund": "balanced-adv",
  "Index Funds": "index",
  "Sectoral/ Thematic Fund": "sectoral",
  "Contra Fund": "contra",
  "Conservative Hybrid Fund": "conservative-hybrid",
};

function mapCategory(subCategory = "", schemeName = "") {
  for (const [key, val] of Object.entries(CATEGORY_MAP)) {
    if (subCategory.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return inferCategoryFromName(schemeName || subCategory);
}

function inferCategoryFromName(name = "") {
  const n = name.toLowerCase();
  if (n.includes("small cap")) return "small-cap";
  if (n.includes("mid cap") && !n.includes("large")) return "mid-cap";
  if (n.includes("large cap") || n.includes("bluechip") || n.includes("blue chip")) return "large-cap";
  if (n.includes("flexi cap") || n.includes("multi cap")) return "flexi-cap";
  if (n.includes("elss") || n.includes("tax saver")) return "elss";
  if (n.includes("liquid")) return "liquid";
  if (n.includes("ultra short")) return "ultra-short";
  if (n.includes("money market")) return "money-market";
  if (n.includes("balanced advantage") || n.includes("dynamic asset")) return "balanced-adv";
  if (n.includes("hybrid") || n.includes("balanced")) return "hybrid";
  if (n.includes("index") || n.includes("nifty") || n.includes("sensex")) return "index";
  if (n.includes("contra")) return "contra";
  if (n.includes("sector") || n.includes("technology") || n.includes("pharma") || n.includes("banking")) {
    return "sectoral";
  }
  if (n.includes("conservative hybrid")) return "conservative-hybrid";
  return "";
}

function mapMockCategory(category = "") {
  return category.toLowerCase().replace(/ /g, "-");
}

function annualisedVolatility(navHistory) {
  if (!navHistory || navHistory.length < 2) return null;
  const returns = [];
  for (let i = 1; i < navHistory.length; i++) {
    const prev = navHistory[i - 1].nav;
    const curr = navHistory[i].nav;
    if (prev > 0) returns.push(Math.log(curr / prev));
  }
  if (!returns.length) return null;
  const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / (returns.length - 1);
  return Math.sqrt(variance * 252) * 100;
}

function cagr(startNav, endNav, years) {
  if (!startNav || !endNav || years <= 0) return null;
  return (Math.pow(endNav / startNav, 1 / years) - 1) * 100;
}

const FETCH_TIMEOUT_MS = parseInt(process.env.MFAPI_TIMEOUT_MS ?? "30000", 10);

async function fetchJSON(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.json();
}

async function buildSnapshot() {
  console.log("[screener-worker] Starting snapshot build…");

  let allSchemes = [];

  try {
    console.log("[screener-worker] Fetching scheme list from MFapi…");
    const list = await fetchJSON(`${MFAPI_BASE}/mf`);
    allSchemes = list
      .filter((s) => {
        const name = (s.schemeName ?? "").toLowerCase();
        return name.includes("regular") && !name.includes("direct");
      })
      .slice(0, MAX_SCHEMES);
    console.log(`[screener-worker] ${allSchemes.length} Regular schemes fetched`);
  } catch (err) {
    console.warn("[screener-worker] MFapi unavailable, falling back to mock data:", err.message);
  }

  const snapshot = [];
  const today = new Date();

  if (allSchemes.length > 0) {
    for (const scheme of allSchemes) {
      try {
        const detail = await fetchJSON(`${MFAPI_BASE}/mf/${scheme.schemeCode}`);
        const meta = detail.meta ?? {};
        const data = detail.data ?? [];

        if (data.length < MIN_DAYS / 2) continue;

        const category = mapCategory(meta.scheme_sub_category ?? meta.scheme_category ?? "", scheme.schemeName);
        if (!category) continue;

        const navHistory = data
          .map((d) => ({ date: d.date, nav: parseFloat(d.nav) }))
          .filter((d) => !Number.isNaN(d.nav))
          .reverse();

        const latestNav = navHistory[navHistory.length - 1];
        const latestDate = new Date(latestNav.date.split("-").reverse().join("-"));

        function navAtYearsBack(yearsBack) {
          const target = new Date(latestDate);
          target.setFullYear(target.getFullYear() - yearsBack);
          const past = navHistory.filter((n) => {
            const d = new Date(n.date.split("-").reverse().join("-"));
            return d <= target;
          });
          return past.length ? past[past.length - 1].nav : null;
        }

        const nav1yAgo = navAtYearsBack(1);
        const nav3yAgo = navAtYearsBack(3);
        const nav5yAgo = navAtYearsBack(5);

        const elapsed =
          (today - new Date(navHistory[0].date.split("-").reverse().join("-"))) / 86400000;
        if (elapsed < MIN_DAYS) continue;

        snapshot.push({
          schemeCode: String(scheme.schemeCode),
          schemeName: scheme.schemeName,
          amc: meta.fund_house ?? scheme.schemeName.split(" ")[0],
          category,
          planType: "Regular",
          expenseRatio: null,
          aum: null,
          riskometer: meta.scheme_risk_category ?? null,
          nav: latestNav.nav,
          pastReturn1y: nav1yAgo != null ? cagr(nav1yAgo, latestNav.nav, 1) : null,
          pastReturn3y: nav3yAgo != null ? cagr(nav3yAgo, latestNav.nav, 3) : null,
          pastReturn5y: nav5yAgo != null ? cagr(nav5yAgo, latestNav.nav, 5) : null,
          volatilityPct: annualisedVolatility(navHistory.slice(-252)),
          dataAsOn: latestNav.date,
        });
      } catch {
        // skip scheme on error
      }
    }
    console.log(`[screener-worker] ${snapshot.length} schemes enriched with NAV history`);
  }

  if (!snapshot.length) {
    console.log("[screener-worker] Using mock scheme data…");
    const { SCHEMES } = await import("@nivya/vendor-mf");
    for (const s of SCHEMES) {
      snapshot.push({
        schemeCode: s.schemeCode,
        schemeName: `${s.name} - Regular`,
        amc: s.amc,
        category: mapMockCategory(s.category),
        planType: "Regular",
        expenseRatio: s.expenseRatio,
        aum: 20000 + Math.round(Math.random() * 50000),
        riskometer: s.risk,
        nav: s.nav,
        pastReturn1y: s.returns?.r1y ?? null,
        pastReturn3y: s.returns?.r3y ?? null,
        pastReturn5y: s.returns?.r5y ?? null,
        volatilityPct: s.category === "Liquid" ? 0.5 : 10 + Math.random() * 15,
        dataAsOn: new Date().toISOString().slice(0, 10),
      });
    }
    console.log(`[screener-worker] ${snapshot.length} mock schemes loaded`);
  }

  await mkdir(dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(snapshot, null, 2), "utf8");
  console.log(`[screener-worker] Snapshot written to ${OUT_PATH} (${snapshot.length} schemes)`);
}

buildSnapshot().catch((err) => {
  console.error("[screener-worker] FATAL:", err);
  process.exit(1);
});
