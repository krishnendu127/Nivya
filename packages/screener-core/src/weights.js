/**
 * Preference → scoring weights.
 * No `ranking` on the bucket → exact legacy weights (0.6 / 0.2 / 0.2, riskFit 0).
 * With `ranking` → tilt only when prefs differ from neutral DNA defaults
 * (so typical Discover DNA still ≈ legacy; intentional refine choices move ranks).
 */

export const DEFAULT_WEIGHTS = Object.freeze({
  returns: 0.6,
  consistency: 0.2,
  expense: 0.2,
  riskFit: 0,
  amc: 0,
});

/**
 * @param {{ riskPreference?: string, ranking?: object|null }} options
 */
export function resolveWeights(options = {}) {
  const ranking = options.ranking ?? null;
  const riskPreference = options.riskPreference ?? "MEDIUM";

  let returnWindow = ranking?.returnWindow ?? "3y";
  if (!["1y", "3y", "5y"].includes(returnWindow)) returnWindow = "3y";

  if (ranking == null) {
    return { ...DEFAULT_WEIGHTS, returnWindow: "3y" };
  }

  let returns = DEFAULT_WEIGHTS.returns;
  let consistency = DEFAULT_WEIGHTS.consistency;
  let expense = DEFAULT_WEIGHTS.expense;
  let riskFit = 0;
  let amc = 0;

  if (ranking.expensePriority === "low-cost") {
    expense += 0.15;
    returns -= 0.1;
    consistency -= 0.05;
  } else if (ranking.expensePriority === "performance") {
    returns += 0.1;
    expense -= 0.1;
  }

  // Default DNA uses "stable" — keep legacy unless user picks volatile
  if (ranking.consistencyPref === "volatile") {
    returns += 0.08;
    consistency -= 0.05;
  }

  if (riskPreference === "LOW") {
    riskFit += 0.15;
    returns -= 0.1;
    consistency += 0.05;
  } else if (riskPreference === "HIGH") {
    returns += 0.08;
  }

  const safety = ranking.safetyGrowth;
  if (typeof safety === "number") {
    if (safety >= 70) {
      riskFit += 0.08;
      returns -= 0.05;
    } else if (safety <= 30) {
      returns += 0.05;
      riskFit = Math.max(0, riskFit - 0.05);
    }
  }

  // Only tilt horizon when very short (emergency-like)
  const horizon = ranking.horizonMonths;
  if (typeof horizon === "number" && horizon < 24) {
    consistency += 0.05;
    riskFit += 0.05;
    returns -= 0.05;
  }

  if ((ranking.preferredAmcs ?? []).length > 0) {
    amc = 0.08;
    returns -= 0.03;
    expense -= 0.025;
    consistency -= 0.025;
  }

  const tilted =
    ranking.expensePriority === "low-cost" ||
    ranking.expensePriority === "performance" ||
    ranking.consistencyPref === "volatile" ||
    riskPreference === "LOW" ||
    riskPreference === "HIGH" ||
    (typeof safety === "number" && (safety >= 70 || safety <= 30)) ||
    (typeof horizon === "number" && horizon < 24) ||
    (ranking.preferredAmcs ?? []).length > 0;

  if (!tilted) {
    return { ...DEFAULT_WEIGHTS, returnWindow };
  }

  const normalized = normalizeWeights({ returns, consistency, expense, riskFit, amc });
  return { ...normalized, returnWindow };
}

function normalizeWeights(w) {
  const keys = ["returns", "consistency", "expense", "riskFit", "amc"];
  const clamped = {};
  for (const k of keys) clamped[k] = Math.max(0, w[k] ?? 0);
  const sum = keys.reduce((s, k) => s + clamped[k], 0);
  if (sum <= 0) return { ...DEFAULT_WEIGHTS };
  const out = {};
  for (const k of keys) out[k] = clamped[k] / sum;
  return out;
}
