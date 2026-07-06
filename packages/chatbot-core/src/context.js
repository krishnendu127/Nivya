const CATEGORY_LABELS = {
  "large-cap": "Large Cap",
  "flexi-cap": "Flexi Cap",
  "small-cap": "Small Cap",
  "mid-cap": "Mid Cap",
  elss: "ELSS",
  liquid: "Liquid",
  "ultra-short": "Ultra Short Duration",
  hybrid: "Hybrid Aggressive",
  index: "Index Fund",
  sectoral: "Sectoral",
  contra: "Contra",
};

function fundLabel(fund) {
  return String(fund?.schemeName ?? fund?.name ?? fund?.schemeCode ?? "This fund")
    .replace(/\s*-\s*Regular.*$/i, "")
    .trim();
}

function fmt(v, suffix = "") {
  return v != null && !Number.isNaN(v) ? `${v}${suffix}` : "not available";
}

/**
 * Field access falls back across two shapes a mentioned fund can arrive in:
 * - catalog shape (from GET /v1/schemes): name, risk, returns.{r1y,r3y,r5y}
 * - screener-ranked shape (from an already-ranked FundCard): schemeName, riskometer,
 *   pastReturn1y/3y/5y, performanceScore, riskScore, reasons
 */
function fundLines(fund) {
  const cat = CATEGORY_LABELS[fund.category] ?? fund.category ?? "—";
  const r1y = fund.pastReturn1y ?? fund.returns?.r1y;
  const r3y = fund.pastReturn3y ?? fund.returns?.r3y;
  const r5y = fund.pastReturn5y ?? fund.returns?.r5y;
  const risk = fund.riskometer ?? fund.risk;

  const lines = [
    `Name: ${fundLabel(fund)}`,
    `AMC: ${fund.amc ?? "—"}`,
    `Category: ${cat}`,
    `Plan: Regular (distributor channel)`,
    `Riskometer: ${fmt(risk)}`,
    `Risk rank (vs category peers): ${fmt(fund.riskScore, "/100")}`,
    `Performance score (vs category peers): ${fmt(fund.performanceScore, "/100")}`,
    `Past CAGR: 1Y ${fmt(r1y, "%")}, 3Y ${fmt(r3y, "%")}, 5Y ${fmt(r5y, "%")}`,
    `Historical volatility (annualised): ${fmt(fund.volatilityPct, "%")}`,
    `Expense ratio (TER): ${fmt(fund.expenseRatio, "%")}`,
    `AUM: ${fund.aum != null ? `~₹${Math.round(fund.aum)} Cr` : "not available"}`,
    `NAV: ${fund.nav != null ? `₹${Number(fund.nav).toFixed(4)}` : "not available"}`,
  ];
  if (fund.reasons?.length) {
    lines.push(`Why ranked: ${fund.reasons.map((r) => r.text ?? r.code).join("; ")}`);
  }
  return lines.join("\n");
}

/**
 * Serializes the funds currently in scope (0..N, brought in via @mention or a
 * pre-attached "Ask" fund) into a compact grounding block the model must treat
 * as the only source of truth. Returns "" when funds is empty — a purely
 * general mutual-fund question needs no grounding block at all.
 * @param {object[]} funds
 * @param {string} [dataAsOn]
 */
export function buildFundContextBlock(funds = [], dataAsOn) {
  if (!funds.length) return "";

  const parts = ["=== FUND DATA IN SCOPE (the only source of truth for these funds — do not use outside knowledge) ==="];
  funds.forEach((fund, i) => {
    const asOn = fund?.dataAsOn ?? dataAsOn;
    const asOnLine = asOn
      ? `Data as on: ${new Date(asOn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`
      : "";
    parts.push(`--- FUND ${i + 1}: ${fundLabel(fund)} ---`);
    parts.push(fundLines(fund));
    if (asOnLine) parts.push(asOnLine);
  });
  parts.push("=== END FUND DATA ===");
  return parts.filter(Boolean).join("\n");
}
