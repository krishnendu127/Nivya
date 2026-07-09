/**
 * Guided discovery preferences → screener payload + explainability tags.
 * Compliant wording: ranks by user-selected criteria, not personal advice.
 */

export const DNA_STORAGE_KEY = "nivya-investment-dna";

export const GOALS = [
  { id: "wealth", label: "Wealth creation" },
  { id: "retirement", label: "Retirement" },
  { id: "child-education", label: "Child education" },
  { id: "tax-saving", label: "Tax saving" },
  { id: "house", label: "House" },
  { id: "emergency", label: "Emergency fund" },
  { id: "monthly-income", label: "Monthly income" },
  { id: "other", label: "Other" },
];

export const HORIZON_OPTIONS = [
  { id: "lt1", label: "Less than 1 year", months: 6 },
  { id: "1-3", label: "1–3 years", months: 24 },
  { id: "3-5", label: "3–5 years", months: 48 },
  { id: "5-10", label: "5–10 years", months: 84 },
  { id: "10+", label: "10+ years", months: 120 },
];

export const EMERGENCY_HORIZON_OPTIONS = HORIZON_OPTIONS.filter((h) =>
  h.id === "lt1" || h.id === "1-3"
);

export const MARKET_REACTIONS = [
  { id: "panic", label: "I'd worry and consider stopping" },
  { id: "wait", label: "I'd wait it out" },
  { id: "buy-more", label: "I'd invest more" },
];

export const FREQUENCY_OPTIONS = [
  { id: "once", label: "One-time", mode: "LUMPSUM" },
  { id: "monthly", label: "Monthly SIP", mode: "SIP" },
  { id: "quarterly", label: "Quarterly", mode: "SIP" },
];

export const AMOUNT_PRESETS = [500, 1000, 2500, 5000, 10000];

export const FIRST_MF_OPTIONS = [
  { id: "yes", label: "Yes, first mutual fund" },
  { id: "no", label: "No, I already invest in MFs" },
];

export const EXISTING_INVESTMENTS = [
  { id: "none", label: "None yet" },
  { id: "fd", label: "FD" },
  { id: "ppf", label: "PPF" },
  { id: "stocks", label: "Stocks" },
  { id: "gold", label: "Gold" },
  { id: "epf", label: "EPF" },
  { id: "mf", label: "Mutual funds" },
];

export const FUND_STYLE_OPTIONS = [
  { id: "both", label: "Show both" },
  { id: "index", label: "Index funds" },
  { id: "active", label: "Active funds" },
];

export const EXPENSE_PRIORITY = [
  { id: "low-cost", label: "Lower cost" },
  { id: "performance", label: "Higher past performance" },
  { id: "balanced", label: "Balanced" },
];

export const CONSISTENCY_PREF = [
  { id: "stable", label: "Stable returns" },
  { id: "volatile", label: "Can tolerate volatility" },
];

export const EXPERIENCE_LEVEL = [
  { id: "new", label: "Never invested" },
  { id: "some", label: "Some experience" },
  { id: "experienced", label: "Experienced" },
];

export const RETURN_WINDOW_OPTIONS = [
  { id: "1y", label: "Past 1Y" },
  { id: "3y", label: "Past 3Y (default)" },
  { id: "5y", label: "Past 5Y" },
];

/** Common AMC short names for prefer / avoid filters */
export const AMC_CHIP_OPTIONS = [
  "HDFC", "ICICI", "SBI", "Nippon", "Axis", "Mirae", "PPFAS", "Quant",
  "Aditya Birla", "UTI", "Kotak", "Franklin", "DSP", "Tata",
];

export function defaultPreferences() {
  return {
    goal: "wealth",
    horizonId: "5-10",
    marketReaction: "wait",
    safetyGrowth: 50,
    frequencyId: "monthly",
    amount: 5000,
    hasElss: null,
    firstMf: null,
    existingInvestments: [],
    fundStyle: "both",
    expensePriority: "balanced",
    consistencyPref: "stable",
    returnWindow: "3y",
    preferredAmcs: [],
    avoidedAmcs: [],
    experience: "some",
    completedWizard: false,
    updatedAt: null,
  };
}

export function loadInvestmentDna() {
  try {
    const raw = localStorage.getItem(DNA_STORAGE_KEY);
    if (!raw) return null;
    return { ...defaultPreferences(), ...JSON.parse(raw) };
  } catch {
    return null;
  }
}

export function saveInvestmentDna(prefs) {
  const payload = { ...prefs, updatedAt: new Date().toISOString() };
  localStorage.setItem(DNA_STORAGE_KEY, JSON.stringify(payload));
  return payload;
}

export function goalLabel(goalId) {
  return GOALS.find((g) => g.id === goalId)?.label ?? goalId;
}

export function horizonLabel(horizonId) {
  return HORIZON_OPTIONS.find((h) => h.id === horizonId)?.label ?? horizonId;
}

export function horizonMonths(horizonId) {
  return HORIZON_OPTIONS.find((h) => h.id === horizonId)?.months ?? 60;
}

export function frequencyMode(frequencyId) {
  return FREQUENCY_OPTIONS.find((f) => f.id === frequencyId)?.mode ?? "SIP";
}

export function marketReactionStyle(reactionId) {
  if (reactionId === "panic") return "Cautious";
  if (reactionId === "buy-more") return "Growth-oriented";
  return "Moderate";
}

export function safetyGrowthLabel(value) {
  if (value >= 70) return "Safety first";
  if (value <= 30) return "Growth first";
  return "Balanced";
}

export function deriveRiskPreference(prefs) {
  let score = 50;
  if (prefs.marketReaction === "panic") score -= 28;
  if (prefs.marketReaction === "buy-more") score += 28;
  score += (50 - (prefs.safetyGrowth ?? 50)) * 0.45;
  if (prefs.goal === "emergency" || prefs.goal === "monthly-income") score -= 25;
  if (prefs.goal === "tax-saving") score += 5;
  if (prefs.consistencyPref === "stable") score -= 8;
  if (prefs.consistencyPref === "volatile") score += 12;
  if (prefs.experience === "new") score -= 10;
  if (score < 33) return "LOW";
  if (score > 66) return "HIGH";
  return "MEDIUM";
}

export function deriveCategories(prefs) {
  const { goal, fundStyle, safetyGrowth } = prefs;
  if (goal === "tax-saving") return ["elss"];
  if (goal === "emergency") return ["liquid", "hybrid"];
  if (goal === "monthly-income") return ["hybrid", "liquid"];
  if (fundStyle === "index") return ["index", "large-cap"];
  if (goal === "retirement" || goal === "child-education" || goal === "house") {
    if (safetyGrowth > 60) return ["large-cap", "hybrid"];
    return ["flexi-cap", "large-cap"];
  }
  if (safetyGrowth > 70) return ["large-cap", "hybrid"];
  if (safetyGrowth < 30) return ["flexi-cap", "small-cap", "mid-cap"];
  return ["flexi-cap", "large-cap"];
}

/** Ranking dims passed to screener-core (optional on API; absent = legacy 60/20/20). */
export function buildRankingPrefs(prefs) {
  return {
    expensePriority: prefs.expensePriority ?? "balanced",
    consistencyPref: prefs.consistencyPref ?? "stable",
    returnWindow: prefs.returnWindow ?? "3y",
    preferredAmcs: prefs.preferredAmcs ?? [],
    avoidedAmcs: prefs.avoidedAmcs ?? [],
    horizonMonths: horizonMonths(prefs.horizonId),
    safetyGrowth: prefs.safetyGrowth ?? 50,
  };
}

export function buildScreenerPayload(prefs) {
  const mode = frequencyMode(prefs.frequencyId);
  const horizonMonthsVal = horizonMonths(prefs.horizonId);
  const categories = deriveCategories(prefs);
  const riskPreference = deriveRiskPreference(prefs);
  return {
    mode,
    horizonMonths: horizonMonthsVal,
    buckets: [{
      id: 1,
      riskPreference,
      categories,
      amountInr: prefs.amount,
      ranking: buildRankingPrefs(prefs),
    }],
    prefs,
  };
}

export function buildDnaSummary(prefs) {
  return {
    goal: goalLabel(prefs.goal),
    horizon: horizonLabel(prefs.horizonId),
    riskStyle: marketReactionStyle(prefs.marketReaction),
    safetyGrowth: safetyGrowthLabel(prefs.safetyGrowth),
    frequency: FREQUENCY_OPTIONS.find((f) => f.id === prefs.frequencyId)?.label ?? "—",
    amount: prefs.amount,
    mode: frequencyMode(prefs.frequencyId),
    categories: deriveCategories(prefs).map((id) => {
      const map = {
        "large-cap": "Large Cap", "flexi-cap": "Flexi Cap", "small-cap": "Small Cap",
        "mid-cap": "Mid Cap", elss: "ELSS", hybrid: "Hybrid", liquid: "Liquid", index: "Index",
      };
      return map[id] ?? id;
    }),
    consistency: CONSISTENCY_PREF.find((c) => c.id === prefs.consistencyPref)?.label,
    fundStyle: FUND_STYLE_OPTIONS.find((f) => f.id === prefs.fundStyle)?.label,
    returnWindow: RETURN_WINDOW_OPTIONS.find((r) => r.id === (prefs.returnWindow ?? "3y"))?.label,
    preferredAmcs: prefs.preferredAmcs ?? [],
    avoidedAmcs: prefs.avoidedAmcs ?? [],
  };
}

export function buildWhyTags(fund, prefs) {
  const tags = [];
  const hLbl = horizonLabel(prefs.horizonId);
  const gLbl = goalLabel(prefs.goal);
  tags.push(`Matches ${hLbl} timeline`);
  tags.push(`Selected for ${gLbl} goal`);
  if (prefs.frequencyId === "monthly" || prefs.frequencyId === "quarterly") {
    tags.push("Fits regular investing cadence");
  }
  if (fund.volatilityPct != null && prefs.safetyGrowth >= 60 && fund.volatilityPct < 14) {
    tags.push("Moderate historical volatility");
  }
  if (fund.volatilityPct != null && prefs.consistencyPref === "stable" && fund.volatilityPct < 16) {
    tags.push("Relatively stable past returns");
  }
  if (prefs.expensePriority === "low-cost" && fund.expenseRatio != null && fund.expenseRatio < 1) {
    tags.push("Expense below typical range");
  }
  for (const r of fund.reasons ?? []) {
    const t = r.text?.split("(")[0]?.trim();
    if (t && !tags.includes(t)) tags.push(t);
  }
  return tags.slice(0, 5);
}

/** Adaptive wizard step ids based on current answers */
export function getWizardSteps(prefs) {
  const steps = ["goal"];
  if (prefs.goal === "tax-saving") steps.push("elss");
  steps.push("horizon", "reaction", "safety", "frequency", "amount", "refine");
  return steps;
}

export function applyPopularCombo(comboId) {
  const combos = {
    "long-term": {
      goal: "wealth", horizonId: "10+", marketReaction: "wait", safetyGrowth: 45,
      frequencyId: "monthly", amount: 5000, consistencyPref: "stable", fundStyle: "both",
    },
    "tax-saving": {
      goal: "tax-saving", horizonId: "3-5", marketReaction: "wait", safetyGrowth: 55,
      frequencyId: "monthly", amount: 5000, hasElss: false,
    },
    "emergency": {
      goal: "emergency", horizonId: "lt1", marketReaction: "panic", safetyGrowth: 85,
      frequencyId: "once", amount: 50000, consistencyPref: "stable",
    },
    "growth": {
      goal: "wealth", horizonId: "5-10", marketReaction: "buy-more", safetyGrowth: 25,
      frequencyId: "monthly", amount: 3000, consistencyPref: "volatile", fundStyle: "active",
    },
  };
  return { ...defaultPreferences(), ...(combos[comboId] ?? {}), completedWizard: true };
}
