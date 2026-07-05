import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { assertOrderCompliance, getDisclosures } from "@nivya/compliance";
import {
  createVendorMFAdapter,
  DEMO_HOLDINGS,
  DEMO_SIPS,
  schemeByCode,
  tickNavs,
} from "@nivya/vendor-mf";
import screenerRoutes from "./routes/screener.js";
import { getCatalogScheme, getSnapshotMeta, listCatalogSchemes } from "./lib/snapshot-store.js";
import { buildPortfolioInsights } from "./lib/portfolio-insights.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, "../.env") });

const PORT = Number(process.env.PORT || 3001);
const DEMO_OTP = process.env.DEMO_OTP || "123456";

/** @type {Map<string, { userId: string, exp: number }>} */
const tokens = new Map();

/** @type {Map<string, object>} */
const users = new Map();

/** @type {Map<string, Set<string>>} */
const consents = new Map();

/** @type {Map<string, object[]>} */
const orders = new Map();

function demoUser() {
  const id = "demo-user-001";
  if (!users.has(id)) {
    users.set(id, {
      id,
      phone: "9876543210",
      email: "demo@nivya.app",
      kycStatus: "registered",
      profile: { pan: "ABCDE1234F", name: "Demo Investor", dob: "1990-01-15" },
    });
    consents.set(id, new Set());
    orders.set(id, []);
  }
  return users.get(id);
}

function authUser(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token || !tokens.has(token)) return null;
  const session = tokens.get(token);
  if (session.exp < Date.now()) {
    tokens.delete(token);
    return null;
  }
  return users.get(session.userId) || null;
}

async function buildPortfolio() {
  const holdings = await Promise.all(DEMO_HOLDINGS.map(async (h) => {
    const scheme = (await getCatalogScheme(h.schemeCode)) ?? schemeByCode(h.schemeCode);
    const currentNav = scheme?.nav ?? h.avgNav;
    const invested = h.units * h.avgNav;
    const currentValue = h.units * currentNav;
    const pnl = currentValue - invested;
    return {
      schemeCode: h.schemeCode,
      schemeName: scheme?.name ?? h.schemeCode,
      folio: h.folio,
      units: h.units,
      avgNav: h.avgNav,
      currentNav,
      currentValue,
      invested,
      pnl,
      pnlPct: invested ? pnl / invested : 0,
    };
  }));
  const invested = holdings.reduce((s, h) => s + h.invested, 0);
  const currentValue = holdings.reduce((s, h) => s + h.currentValue, 0);
  const dayChange = (await Promise.all(DEMO_HOLDINGS.map(async (h) => {
    const holding = holdings.find((x) => x.schemeCode === h.schemeCode);
    const scheme = (await getCatalogScheme(h.schemeCode)) ?? schemeByCode(h.schemeCode);
    const prev = scheme?.prevNav ?? h.avgNav;
    return h.units * ((holding?.currentNav ?? h.avgNav) - prev);
  }))).reduce((s, v) => s + v, 0);
  const totalReturns = currentValue - invested;
  const insights = await buildPortfolioInsights(holdings, (code) => getCatalogScheme(code));
  return {
    currentValue,
    invested,
    totalReturns,
    totalReturnsPct: invested ? totalReturns / invested : 0,
    dayChange,
    dayChangePct: currentValue ? dayChange / (currentValue - dayChange) : 0,
    holdings,
    insights,
  };
}

const adapter = createVendorMFAdapter();
const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(screenerRoutes, { prefix: "/v1/screener" });

app.get("/v1/health", async () => ({
  status: "ok",
  adapter: adapter.name,
}));

app.get("/v1/compliance/disclosures", async () => getDisclosures());

app.post("/v1/auth/otp/send", async (req) => {
  const { phone } = req.body || {};
  if (!phone) throw app.httpErrors.badRequest("phone required");
  return { requestId: randomUUID(), expiresInSec: 300 };
});

app.post("/v1/auth/otp/verify", async (req) => {
  const { phone, otp } = req.body || {};
  if (!phone || !otp) throw app.httpErrors.badRequest("phone and otp required");
  if (otp !== DEMO_OTP) throw app.httpErrors.unauthorized("Invalid OTP");
  const user = demoUser();
  user.phone = phone;
  const accessToken = randomUUID();
  tokens.set(accessToken, { userId: user.id, exp: Date.now() + 86400000 });
  return { accessToken, expiresInSec: 86400 };
});

app.get("/v1/me", async (req) => {
  const user = authUser(req);
  if (!user) throw app.httpErrors.unauthorized();
  return user;
});

app.get("/v1/kyc/status", async (req) => {
  const user = authUser(req);
  if (!user) throw app.httpErrors.unauthorized();
  return {
    status: user.kycStatus,
    kraStatus: user.kycStatus === "registered" ? "Validated" : "Pending",
    ckycId: user.kycStatus === "registered" ? "CKYC-DEMO-001" : null,
  };
});

app.post("/v1/kyc/pan", async (req) => {
  const user = authUser(req);
  if (!user) throw app.httpErrors.unauthorized();
  const { pan } = req.body || {};
  if (!pan) throw app.httpErrors.badRequest("pan required");
  user.profile = { ...user.profile, pan: pan.toUpperCase() };
  user.kycStatus = "registered";
  return { status: user.kycStatus, kraStatus: "Validated", ckycId: "CKYC-DEMO-001" };
});

app.get("/v1/schemes", async (req) => {
  const { category, q } = req.query;
  const items = await listCatalogSchemes({ category, q });
  return { items, total: items.length, dataSource: getSnapshotMeta().dataSource };
});

app.get("/v1/schemes/:schemeCode", async (req) => {
  const scheme = await getCatalogScheme(req.params.schemeCode);
  if (!scheme) throw app.httpErrors.notFound("Scheme not found");
  return scheme;
});

app.get("/v1/portfolio", async (req) => {
  const user = authUser(req);
  if (!user) throw app.httpErrors.unauthorized();
  return buildPortfolio();
});

app.get("/v1/sips", async (req) => {
  const user = authUser(req);
  if (!user) throw app.httpErrors.unauthorized();
  const items = await Promise.all(DEMO_SIPS.map(async (s) => ({
    ...s,
    schemeName: (await getCatalogScheme(s.schemeCode))?.name
      ?? schemeByCode(s.schemeCode)?.name
      ?? s.schemeCode,
  })));
  return { items };
});

app.post("/v1/sips", async (req) => {
  const user = authUser(req);
  if (!user) throw app.httpErrors.unauthorized();
  if (user.kycStatus !== "registered") {
    throw app.httpErrors.forbidden("KYC must be complete before registering SIP");
  }
  const { schemeCode, amount, debitDay } = req.body || {};
  const { arn, euin } = assertOrderCompliance({});
  const result = await adapter.registerSip({
    schemeCode,
    amount,
    debitDay,
    arn,
    euin,
    investorRef: user.id,
  });
  const scheme = (await getCatalogScheme(schemeCode)) ?? schemeByCode(schemeCode);
  return {
    id: randomUUID(),
    schemeCode,
    schemeName: scheme?.name,
    amount,
    debitDay,
    status: "active",
    nextDebit: `${debitDay} next month`,
    vendorRef: result.vendorRef,
  };
});

app.post("/v1/consents", async (req) => {
  const user = authUser(req);
  if (!user) throw app.httpErrors.unauthorized();
  const { schemeCode, sidVersion } = req.body || {};
  if (!schemeCode || !sidVersion) throw app.httpErrors.badRequest("schemeCode and sidVersion required");
  const key = `${schemeCode}:${sidVersion}`;
  consents.get(user.id).add(key);
  return { id: randomUUID(), schemeCode, sidVersion };
});

app.post("/v1/orders", async (req) => {
  const user = authUser(req);
  if (!user) throw app.httpErrors.unauthorized();
  if (user.kycStatus !== "registered") {
    throw app.httpErrors.forbidden("KYC must be complete before placing orders");
  }
  const body = req.body || {};
  const { type, schemeCode, targetSchemeCode, amount, units, consentId } = body;
  if (!type || !schemeCode) throw app.httpErrors.badRequest("type and schemeCode required");

  const consentKey = `${schemeCode}:v1`;
  if (!consents.get(user.id)?.has(consentKey) && !consentId) {
    throw app.httpErrors.forbidden("SID consent required before first investment in scheme");
  }

  let compliance;
  try {
    compliance = assertOrderCompliance({});
  } catch (e) {
    throw app.httpErrors.forbidden(String(e.message));
  }

  const vendorResult = await adapter.submitOrder({
    type,
    schemeCode,
    targetSchemeCode,
    amount,
    units,
    arn: compliance.arn,
    euin: compliance.euin,
    investorRef: user.id,
  });

  const order = {
    id: randomUUID(),
    type,
    schemeCode,
    targetSchemeCode: targetSchemeCode || null,
    amount: amount ?? null,
    units: units ?? null,
    status: vendorResult.status === "accepted" ? "submitted_to_exchange" : "failed",
    arn: compliance.arn,
    euin: compliance.euin,
    vendorRef: vendorResult.vendorRef || null,
    createdAt: new Date().toISOString(),
  };
  orders.get(user.id).push(order);
  return order;
});

setInterval(tickNavs, 2600);

try {
  await app.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`Nivya BFF listening on http://localhost:${PORT}/v1 (demo OTP: ${DEMO_OTP})`);
} catch (err) {
  if (err.code === "EADDRINUSE") {
    try {
      const health = await fetch(`http://127.0.0.1:${PORT}/v1/health`);
      if (health.ok) {
        console.log(`Port ${PORT} already has a healthy Nivya BFF — no need to start again.`);
        process.exit(0);
      }
    } catch {
      /* not our API */
    }
    console.error(
      `Port ${PORT} is in use by another process. Free it (Task Manager / Stop-Process) or run: $env:PORT=3002; npm run start:api`
    );
  }
  throw err;
}
