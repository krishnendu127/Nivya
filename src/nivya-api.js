const API_BASE = "/v1";

let accessToken = null;

async function request(path, { method = "GET", body } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = new Error(`API ${method} ${path} failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

export function mapScheme(s) {
  const name = s.name
    ?? (s.schemeName ? s.schemeName.replace(/\s*-\s*Regular.*$/i, "").trim() : null)
    ?? s.schemeCode;
  const returns = s.returns ?? {};
  return {
    id: s.schemeCode,
    s: name,
    h: s.amc,
    cat: s.category,
    risk: s.risk ?? s.riskometer ?? "Moderate",
    r3: returns.r3y ?? s.pastReturn3y ?? 0,
    r1: returns.r1y ?? s.pastReturn1y ?? 0,
    r5: returns.r5y ?? s.pastReturn5y ?? 0,
    nav: s.nav,
    minSip: s.minSip ?? 500,
    expense: s.expenseRatio ?? null,
  };
}

export function mapHolding(h) {
  return {
    id: h.schemeCode,
    units: h.units,
    avgNav: h.avgNav,
    folio: h.folio,
  };
}

export function mapSip(s) {
  const statusMap = {
    active: "Active",
    paused: "Paused",
    failed: "Failed",
    pending_mandate: "Pending mandate",
  };
  const raw = String(s.status ?? "active").toLowerCase();
  return {
    id: s.schemeCode,
    sipKey: s.id,
    amount: s.amount,
    day: s.debitDay,
    status: statusMap[raw] ?? s.status,
    nextDebit: s.nextDebit || "—",
    bankAccount: s.bankAccount,
    failReason: s.failReason,
    retryDate: s.retryDate,
  };
}

export function navsFromSchemes(schemes) {
  const navs = {};
  for (const s of schemes) {
    navs[s.schemeCode] = {
      nav: s.nav,
      prevNav: s.prevNav ?? s.nav * 0.998,
    };
  }
  return navs;
}

export async function bootstrapDemoSession() {
  const auth = await request("/auth/otp/verify", {
    method: "POST",
    body: { phone: "9876543210", otp: "123456" },
  });
  accessToken = auth.accessToken;

  const [schemesRes, portfolio, sipsRes, disclosures] = await Promise.all([
    request("/schemes"),
    request("/portfolio"),
    request("/sips"),
    request("/compliance/disclosures"),
  ]);

  return {
    schemes: schemesRes.items,
    catalogDataSource: schemesRes.dataSource,
    catalogTotal: schemesRes.total,
    portfolio,
    sips: sipsRes.items,
    disclosures,
  };
}

export async function fetchSchemes() {
  const res = await request("/schemes");
  return { items: res.items, dataSource: res.dataSource, total: res.total };
}

/** Full-catalog search for the @mention picker — hits GET /v1/schemes?q=... */
export async function searchSchemes(q) {
  const res = await request(`/schemes?q=${encodeURIComponent(q ?? "")}`);
  return { items: res.items, total: res.total };
}

export async function recordConsent(schemeCode) {
  return request("/consents", {
    method: "POST",
    body: { schemeCode, sidVersion: "v1" },
  });
}

export async function submitOrder(payload) {
  return request("/orders", { method: "POST", body: payload });
}

export async function submitSip(payload) {
  return request("/sips", { method: "POST", body: payload });
}

export async function fetchPortfolio() {
  return request("/portfolio");
}

const PAST_PERF_NOTE =
  "Weighted average of each fund's published past CAGR, by your current market value. " +
  "This is not your personal XIRR or portfolio return. Past performance does not guarantee future results.";

/** Client-side portfolio facts — mirrors BFF `insights` for offline demo. */
export function buildPortfolioInsights(holdings, fundById, navs) {
  const rows = holdings
    .map((h) => {
      const f = fundById(h.id);
      const q = navs[h.id];
      if (!f || !q) return null;
      const currentValue = h.units * q.nav;
      return {
        schemeCode: h.id,
        schemeName: f.s,
        currentValue,
        category: f.cat,
        amc: f.h,
        pastReturn1y: f.r1 ?? null,
        pastReturn3y: f.r3 ?? null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.currentValue - a.currentValue);

  const total = rows.reduce((s, r) => s + r.currentValue, 0);
  const pctOf = (v) => (total ? Math.round((v / total) * 1000) / 10 : 0);

  const bucket = (key) => {
    const map = new Map();
    for (const row of rows) {
      map.set(row[key], (map.get(row[key]) ?? 0) + row.currentValue);
    }
    return [...map.entries()]
      .map(([label, valueInr]) => ({ label, valueInr, weightPct: pctOf(valueInr) }))
      .sort((a, b) => b.valueInr - a.valueInr);
  };

  const weightedPastReturn = (field) => {
    let weighted = 0;
    let cover = 0;
    for (const row of rows) {
      const r = row[field];
      if (r == null) continue;
      const w = row.currentValue / total;
      weighted += w * r;
      cover += w;
    }
    return cover ? Math.round((weighted / cover) * 10) / 10 : null;
  };

  const byCategory = bucket("category");
  const byAmc = bucket("amc");
  const flags = [];
  if (rows[0] && pctOf(rows[0].currentValue) >= 35) {
    flags.push({
      code: "HIGH_SINGLE_HOLDING",
      text: `${rows[0].schemeName} is ${pctOf(rows[0].currentValue)}% of portfolio value`,
    });
  }
  if (byAmc[0]?.weightPct >= 45) {
    flags.push({
      code: "HIGH_AMC_CONCENTRATION",
      text: `${byAmc[0].label} funds are ${byAmc[0].weightPct}% of portfolio value`,
    });
  }

  return {
    disclaimer:
      "Factual portfolio data and user-controlled illustrations only — not investment advice, " +
      "not a forecast, and not a recommendation to buy, sell, or hold.",
    dataAsOn: new Date().toISOString(),
    allocation: { byCategory, byAmc },
    concentration: {
      topHoldingPct: rows[0] ? pctOf(rows[0].currentValue) : 0,
      topAmcPct: byAmc[0]?.weightPct ?? 0,
      flags,
    },
    pastPerformance: {
      weightedReturn1y: weightedPastReturn("pastReturn1y"),
      weightedReturn3y: weightedPastReturn("pastReturn3y"),
      note: PAST_PERF_NOTE,
      holdingsWithPast1y: rows.filter((r) => r.pastReturn1y != null).length,
      holdingsWithPast3y: rows.filter((r) => r.pastReturn3y != null).length,
      holdingsTotal: rows.length,
    },
  };
}

/** Illustrative FV — user-assumed rate only; not a forecast. */
export function illustrativeFutureValue(currentValue, years, ratePct) {
  const y = Math.max(0, Number(years) || 0);
  const r = Number(ratePct) || 0;
  const base = Math.max(0, Number(currentValue) || 0);
  return Math.round(base * Math.pow(1 + r / 100, y));
}

export async function fetchScreenerCategories() {
  try {
    return await request("/screener/categories");
  } catch {
    return {
      categories: [
        { id: "large-cap", label: "Large Cap", riskBand: "MEDIUM" },
        { id: "flexi-cap", label: "Flexi Cap", riskBand: "MEDIUM" },
        { id: "small-cap", label: "Small Cap", riskBand: "HIGH" },
        { id: "mid-cap", label: "Mid Cap", riskBand: "HIGH" },
        { id: "elss", label: "ELSS", riskBand: "HIGH" },
        { id: "liquid", label: "Liquid", riskBand: "LOW" },
        { id: "ultra-short", label: "Ultra Short Duration", riskBand: "LOW" },
        { id: "hybrid", label: "Hybrid Aggressive", riskBand: "MEDIUM" },
        { id: "index", label: "Index Fund", riskBand: "MEDIUM" },
        { id: "sectoral", label: "Sectoral", riskBand: "HIGH" },
        { id: "contra", label: "Contra", riskBand: "HIGH" },
      ],
    };
  }
}

export async function queryScreener(payload) {
  const body = {
    mode: payload.mode,
    horizonMonths: payload.horizonMonths,
    buckets: (payload.buckets ?? []).map(({ riskPreference, categories, amountInr, topK, ranking }) => ({
      riskPreference,
      categories,
      amountInr,
      topK,
      ...(ranking ? { ranking } : {}),
    })),
  };
  return request("/screener/query", { method: "POST", body });
}

/** Offline demo ranker — only for tests / explicit offline use. */
export function queryScreenerOffline(payload) {
  return clientSideScreener(payload);
}

export async function fetchScreenerStatus() {
  return request("/screener/status");
}

export async function fetchScreenerMetrics(schemeCode) {
  return request(`/screener/metrics/${encodeURIComponent(schemeCode)}`);
}

/**
 * Streams a fund Q&A answer via SSE. Calls onDelta(text) for each chunk as it arrives.
 * @param {{ question: string, funds?: object[], history?: {role: string, text: string}[], onDelta: (text: string) => void }} params
 */
export async function streamFundChat({ question, funds = [], history = [], onDelta }) {
  const res = await fetch(`${API_BASE}/screener/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify({ question, funds, history }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`Chat request failed (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      const isError = frame.startsWith("event: error");
      const line = frame.split("\n").find((l) => l.startsWith("data: "));
      if (!line) continue;
      const payload = line.slice(6).replace(/\\n/g, "\n");
      if (payload === "[DONE]") return;
      if (isError) throw new Error(payload);
      onDelta(payload);
    }
  }
}

const MOCK_SCHEMES_OFFLINE = [
  { schemeCode: "ppfas-fc", schemeName: "Parag Parikh Flexi Cap Fund - Regular", amc: "PPFAS", category: "flexi-cap", expenseRatio: 0.77, aum: 72000, riskometer: "Very High", nav: 82.15, pastReturn1y: 31.8, pastReturn3y: 22.4, pastReturn5y: 24.9, volatilityPct: 13.2 },
  { schemeCode: "nippon-sc", schemeName: "Nippon India Small Cap Fund - Regular", amc: "Nippon", category: "small-cap", expenseRatio: 0.93, aum: 48000, riskometer: "Very High", nav: 178.9, pastReturn1y: 38.6, pastReturn3y: 31.2, pastReturn5y: 34.1, volatilityPct: 22.8 },
  { schemeCode: "hdfc-ba", schemeName: "HDFC Balanced Advantage Fund - Regular", amc: "HDFC", category: "hybrid", expenseRatio: 0.88, aum: 86000, riskometer: "High", nav: 495.2, pastReturn1y: 21.2, pastReturn3y: 18.6, pastReturn5y: 17.4, volatilityPct: 10.4 },
  { schemeCode: "quant-sc", schemeName: "Quant Small Cap Fund - Regular", amc: "Quant", category: "small-cap", expenseRatio: 0.77, aum: 22000, riskometer: "Very High", nav: 265.4, pastReturn1y: 29.4, pastReturn3y: 34.8, pastReturn5y: 39.2, volatilityPct: 25.1 },
  { schemeCode: "mirae-lc", schemeName: "Mirae Asset Large Cap Fund - Regular", amc: "Mirae", category: "large-cap", expenseRatio: 0.52, aum: 38000, riskometer: "High", nav: 105.6, pastReturn1y: 19.7, pastReturn3y: 15.9, pastReturn5y: 16.8, volatilityPct: 11.9 },
  { schemeCode: "axis-lc", schemeName: "Axis Bluechip Fund - Regular", amc: "Axis", category: "large-cap", expenseRatio: 0.54, aum: 31000, riskometer: "High", nav: 58.3, pastReturn1y: 18.1, pastReturn3y: 13.2, pastReturn5y: 14.6, volatilityPct: 12.3 },
  { schemeCode: "sbi-contra", schemeName: "SBI Contra Fund - Regular", amc: "SBI", category: "contra", expenseRatio: 0.91, aum: 29000, riskometer: "Very High", nav: 385.7, pastReturn1y: 24.9, pastReturn3y: 27.5, pastReturn5y: 30.3, volatilityPct: 18.6 },
  { schemeCode: "icici-tech", schemeName: "ICICI Pru Technology Fund - Regular", amc: "ICICI", category: "sectoral", expenseRatio: 0.97, aum: 14000, riskometer: "Very High", nav: 192.3, pastReturn1y: 33.5, pastReturn3y: 19.8, pastReturn5y: 26.1, volatilityPct: 24.3 },
  { schemeCode: "hdfc-elss", schemeName: "HDFC TaxSaver ELSS - Regular", amc: "HDFC", category: "elss", expenseRatio: 1.08, aum: 15000, riskometer: "High", nav: 892.4, pastReturn1y: 22.4, pastReturn3y: 16.8, pastReturn5y: 15.2, volatilityPct: 14.8 },
  { schemeCode: "nippon-liquid", schemeName: "Nippon India Liquid Fund - Regular", amc: "Nippon", category: "liquid", expenseRatio: 0.21, aum: 29000, riskometer: "Low", nav: 5421.3, pastReturn1y: 7.1, pastReturn3y: 6.8, pastReturn5y: 5.9, volatilityPct: 0.5 },
];

const RISK_CAT_OFFLINE = {
  LOW: ["liquid", "ultra-short", "money-market", "conservative-hybrid"],
  MEDIUM: ["large-cap", "flexi-cap", "hybrid", "balanced-adv", "index"],
  HIGH: ["small-cap", "mid-cap", "sectoral", "elss", "contra"],
};

function clientSideRank(schemes, { riskPreference, categories = [], topK = 10 }) {
  const eligible = categories.length
    ? categories
    : (RISK_CAT_OFFLINE[riskPreference] ?? RISK_CAT_OFFLINE.MEDIUM);

  let pool = schemes.filter((s) => {
    if (!s.schemeName.toLowerCase().includes("regular")) return false;
    if (s.schemeName.toLowerCase().includes("direct")) return false;
    return eligible.includes(s.category);
  });

  if (!pool.length) {
    pool = schemes.filter((s) => (RISK_CAT_OFFLINE[riskPreference] ?? []).includes(s.category));
  }

  const peers = pool;
  const r3vals = peers.map((p) => p.pastReturn3y ?? 0).sort((a, b) => a - b);
  const pctRank = (v, arr) =>
    arr.length ? Math.round((arr.findIndex((x) => x >= v) / Math.max(arr.length - 1, 1)) * 100) : 50;

  const scored = pool.map((s) => {
    const r3Pct = pctRank(s.pastReturn3y ?? 0, r3vals);
    const reasons = [];
    const median3y = r3vals[Math.floor(r3vals.length / 2)] ?? 0;
    if ((s.pastReturn3y ?? 0) > median3y) {
      reasons.push({ code: "HIGH_3Y_RETURN_IN_CATEGORY", text: "Past 3Y CAGR above category median" });
    }
    if ((s.aum ?? 0) > 30000) {
      reasons.push({ code: "HIGH_AUM", text: `Large AUM (₹${Math.round((s.aum ?? 0) / 1000)}k Cr)` });
    }
    return {
      ...s,
      planType: "Regular",
      performanceScore: Math.min(100, r3Pct),
      riskScore: 50,
      reasons,
      dataAsOn: new Date().toISOString(),
    };
  });

  scored.sort((a, b) => b.performanceScore - a.performanceScore);
  return scored.slice(0, topK);
}

function clientSideScreener(payload) {
  const { mode = "SIP", horizonMonths, buckets } = payload;
  const DISCLAIMER =
    "Mutual fund investments are subject to market risks. Past performance does not guarantee future results. " +
    "This is not investment advice. Read SID/KIM before investing. Nivya · ARN. Regular plans only.";

  return {
    disclaimer: DISCLAIMER,
    dataAsOn: new Date().toISOString(),
    mode,
    horizonMonths,
    offlineMode: true,
    buckets: (buckets ?? []).map((bk, i) => ({
      bucketId: `bucket-${i + 1}`,
      riskPreference: bk.riskPreference,
      categories: bk.categories ?? [],
      amountInr: bk.amountInr ?? null,
      items: clientSideRank(MOCK_SCHEMES_OFFLINE, {
        riskPreference: bk.riskPreference,
        categories: bk.categories ?? [],
        topK: bk.topK ?? 10,
      }),
    })),
  };
}
