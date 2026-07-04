export const CHAT_DISCLAIMER =
  "Factual fund data only — not investment advice. Nivya does not recommend buy, sell, or hold. " +
  "Past performance does not guarantee future results.";

const ADVICE_PATTERNS = [
  /\b(should|shall)\s+i\b/i,
  /\b(recommend|suggest|advise)\b/i,
  /\b(buy|sell|hold|invest in)\b/i,
  /\b(good|bad|best|worst)\s+(fund|choice|option)\b/i,
  /\bbest\s+for\s+me\b/i,
  /\bworth\s+(it|investing)\b/i,
  /\b(predict|forecast|expected|future)\s+(return|growth|performance)\b/i,
  /\bwill\s+it\s+(grow|rise|double)\b/i,
  /\b(guarantee|sure\s+shot)\b/i,
];

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

function fmtPct(v) {
  return v != null && !Number.isNaN(v) ? `${Number(v).toFixed(1)}%` : "not available in current data";
}

function fundLabel(fund) {
  return (fund.schemeName ?? fund.name ?? fund.schemeCode ?? "This fund").replace(/\s*-\s*Regular.*$/i, "").trim();
}

function asOnLine(fund, ctx) {
  const dataAsOn = fund.dataAsOn ?? ctx.dataAsOn;
  return dataAsOn
    ? ` Data as on ${new Date(dataAsOn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}.`
    : "";
}

/** Factual fund snapshot — not advice. */
function buildFundOverview(fund, ctx = {}) {
  const name = fundLabel(fund);
  const cat = CATEGORY_LABELS[fund.category] ?? fund.category ?? "—";
  const lines = [
    `**${name}**`,
    `· **AMC:** ${fund.amc ?? "—"}`,
    `· **Category:** ${cat}`,
    `· **Plan:** Regular (distributor channel)`,
    `· **Riskometer:** ${fund.riskometer ?? "—"} · **Risk rank:** ${fund.riskScore ?? "—"}/100 · **Perf score:** ${fund.performanceScore ?? "—"}/100`,
    `· **Past CAGR:** 1Y ${fmtPct(fund.pastReturn1y)} · 3Y ${fmtPct(fund.pastReturn3y)} · 5Y ${fmtPct(fund.pastReturn5y)}`,
  ];
  if (fund.volatilityPct != null) {
    lines.push(`· **Historical volatility:** ${fund.volatilityPct.toFixed(1)}%`);
  }
  if (fund.expenseRatio != null) {
    lines.push(`· **Expense ratio (TER):** ${fund.expenseRatio.toFixed(2)}%`);
  }
  if (fund.aum != null) {
    lines.push(`· **AUM:** ~₹${Math.round(fund.aum)} Cr`);
  }
  if (fund.nav != null) {
    lines.push(`· **NAV:** ₹${Number(fund.nav).toFixed(4)}`);
  }
  if (fund.reasons?.length) {
    const why = fund.reasons.slice(0, 2).map((r) => r.text ?? r.code).join("; ");
    lines.push(`· **Why in your ranked list:** ${why}`);
  }
  lines.push(
    "\nThis is a factual snapshot from your screener data — not buy/sell/hold guidance." + asOnLine(fund, ctx)
  );
  return lines.join("\n");
}

function isAdviceQuestion(text) {
  return ADVICE_PATTERNS.some((re) => re.test(text));
}

function matchIntent(q) {
  const text = q.toLowerCase();
  if (/\b(help|what can you|how does this work)\b/.test(text)) return "HELP";
  if (
    /\b(tell me about|know about|want to know|learn about|describe this|give me (an )?overview|fund overview|fund details|information about|what is this fund|details of this|summary of)\b/.test(text) ||
    (/\babout\b/.test(text) && /\bfund\b/.test(text)) ||
    (/\b(this fund|the fund)\b/.test(text) && /\b(know|about|info|detail|describe|explain|tell)\b/.test(text))
  ) {
    return "OVERVIEW";
  }
  if (/\b(perf|performance score|score)\b/.test(text)) return "PERF_SCORE";
  if (/\bwhy\b.*\b(appear|rank|list|show|here)\b/.test(text) || /\b(reason|why this fund)\b/.test(text)) return "WHY_RANKED";
  if (/\b(1y|1\s*year|one year)\b/.test(text)) return "RETURNS_1Y";
  if (/\b(3y|3\s*year|three year)\b/.test(text)) return "RETURNS_3Y";
  if (/\b(5y|5\s*year|five year)\b/.test(text)) return "RETURNS_5Y";
  if (/\b(return|cagr|past performance)\b/.test(text)) return "RETURNS_ALL";
  if (/\b(vol|volatility|fluctuat)\b/.test(text)) return "VOLATILITY";
  if (/\b(risk rank|risk score|riskometer|risk level)\b/.test(text) || /\brisk\b/.test(text)) return "RISK";
  if (/\b(expense|ter|ratio|fee)\b/.test(text)) return "EXPENSE";
  if (/\b(aum|assets under|fund size)\b/.test(text)) return "AUM";
  if (/\b(category|type of fund|fund type)\b/.test(text)) return "CATEGORY";
  if (/\bnav\b/.test(text)) return "NAV";
  if (/\b(regular|direct)\s*plan\b/.test(text) || /\bregular\b/.test(text)) return "REGULAR";
  if (/\b(compare|versus|vs\.?|difference between)\b/.test(text)) return "COMPARE";
  if (/\b(ranking|ranked|sort|how list)\b/.test(text)) return "RANKING_METHOD";
  return "UNKNOWN";
}

/**
 * @param {object} fund — screener result row
 * @param {string} question
 * @param {{ peerFunds?: object[], dataAsOn?: string }} [ctx]
 */
export function answerFundQuestion(fund, question, ctx = {}) {
  const q = String(question ?? "").trim();
  if (!q) {
    return {
      answer: "Ask a factual question about this fund — past returns, expense ratio, why it appears in the list, etc.",
      blockedAdvice: false,
      suggestedFollowUps: getSuggestedQuestions(fund),
      disclaimer: CHAT_DISCLAIMER,
    };
  }

  if (isAdviceQuestion(q)) {
    return {
      answer:
        "I can only share **factual data** about funds shown in your ranked list — not buy/sell/hold guidance or return forecasts. " +
        "You choose whether to invest; Nivya executes as your AMFI-registered distributor. " +
        "Try: “What is the past 3Y CAGR?” or “Why does this fund appear in the list?”",
      blockedAdvice: true,
      suggestedFollowUps: getSuggestedQuestions(fund),
      disclaimer: CHAT_DISCLAIMER,
    };
  }

  const name = fundLabel(fund);
  const cat = CATEGORY_LABELS[fund.category] ?? fund.category ?? "—";
  const asOn = asOnLine(fund, ctx);

  const intent = matchIntent(q);
  let answer = "";

  switch (intent) {
    case "HELP":
      answer =
        `I answer factual questions about **${name}** from the ranked list — past returns, volatility, expense ratio, ` +
        "performance score, and why it matched your filters. I do not recommend investments.";
      break;
    case "OVERVIEW":
      answer = buildFundOverview(fund, ctx);
      break;
    case "PERF_SCORE":
      answer =
        `**${name}** has a **performance score of ${fund.performanceScore ?? "—"}/100** in its category peer set. ` +
        "This score is rule-based: 60% past 3Y return rank + 20% return consistency (|1Y−3Y| gap) + 20% expense ratio rank vs category peers. " +
        "Higher score = stronger past-data ranking — **not** a forecast or recommendation." + asOn;
      break;
    case "WHY_RANKED":
      if (fund.reasons?.length) {
        const lines = fund.reasons.map((r) => `· ${r.text ?? r.code}`).join("\n");
        answer = `**${name}** appears in your ranked list because:\n${lines}\n\nThese are factual comparisons to category medians — not investment advice.`;
      } else {
        answer =
          `**${name}** passed your category/risk filters and ranked on past-data performance score among Regular-plan peers in **${cat}**.`;
      }
      break;
    case "RETURNS_1Y":
      answer =
        `**Past 1Y CAGR** for **${name}** is **${fmtPct(fund.pastReturn1y)}**. ` +
        "This is historical — not expected future performance." + asOn;
      break;
    case "RETURNS_3Y":
      answer =
        `**Past 3Y CAGR** for **${name}** is **${fmtPct(fund.pastReturn3y)}**. ` +
        "Past performance does not guarantee future results." + asOn;
      break;
    case "RETURNS_5Y":
      answer =
        `**Past 5Y CAGR** for **${name}** is **${fmtPct(fund.pastReturn5y)}**. ` +
        "Shown for context only — ranking uses 3Y data in v1." + asOn;
      break;
    case "RETURNS_ALL":
      answer =
        `**${name}** past CAGR (Regular plan): 1Y **${fmtPct(fund.pastReturn1y)}**, ` +
        `3Y **${fmtPct(fund.pastReturn3y)}**, 5Y **${fmtPct(fund.pastReturn5y)}**. Historical data only.` + asOn;
      break;
    case "VOLATILITY":
      answer =
        fund.volatilityPct != null
          ? `**Historical annualised volatility** for **${name}** is **${fund.volatilityPct.toFixed(1)}%** ` +
            "(daily log-return std × √252 from NAV history). Lower volatility ≠ safer future outcomes."
          : `Volatility data is not available for **${name}** in the current snapshot.`;
      break;
    case "RISK":
      answer =
        `**${name}** — SEBI **riskometer**: **${fund.riskometer ?? "—"}**. ` +
        `**Risk rank** in category: **${fund.riskScore ?? "—"}/100** (volatility percentile vs peers; lower = less historical vol). ` +
        "Risk rank is descriptive, not a suitability assessment.";
      break;
    case "EXPENSE":
      answer =
        fund.expenseRatio != null
          ? `**Expense ratio (TER)** for **${name}** is **${fund.expenseRatio.toFixed(2)}%** per year. ` +
            "Regular-plan TER includes distributor commission embedded in the plan."
          : `Expense ratio is not available for **${name}** in the current snapshot.`;
      break;
    case "AUM":
      answer =
        fund.aum != null
          ? `**AUM** for **${name}** is about **₹${Math.round(fund.aum)} Cr** in the current data snapshot.`
          : `AUM is not available for **${name}** in the current snapshot.`;
      break;
    case "CATEGORY":
      answer = `**${name}** is categorised as **${cat}** (${fund.category ?? "—"}). Your screener filtered this category in your selected bucket.`;
      break;
    case "NAV":
      answer =
        fund.nav != null
          ? `Latest **NAV** for **${name}** is **₹${Number(fund.nav).toFixed(4)}** (Regular plan).` + asOn
          : `NAV is not available for **${name}** in the current snapshot.`;
      break;
    case "REGULAR":
      answer =
        `**${name}** is a **Regular plan** fund distributed through AMFI-registered intermediaries like Nivya. ` +
        "Nivya shows Regular plans only. Direct plans (no distributor trail) are excluded from this screener.";
      break;
    case "RANKING_METHOD":
      answer =
        "Funds are ranked by **performance score** (past data vs category peers), highest first — Top 10 per bucket. " +
        "Filters: Regular plans only, your categories/risk bucket. Horizon/mode do not change ranking in v1.";
      break;
    case "COMPARE": {
      const peers = (ctx.peerFunds ?? []).filter((p) => p.schemeCode !== fund.schemeCode).slice(0, 3);
      if (!peers.length) {
        answer =
          `Select another fund from the list to compare, or ask about **${name}** metrics directly (e.g. past 3Y CAGR).`;
      } else {
        const rows = [fund, ...peers].map((f) => {
          const lbl = fundLabel(f).slice(0, 28);
          return `· **${lbl}**: 3Y ${fmtPct(f.pastReturn3y)}, vol ${f.volatilityPct != null ? `${f.volatilityPct.toFixed(1)}%` : "—"}, exp ${f.expenseRatio != null ? `${f.expenseRatio.toFixed(2)}%` : "—"}`;
        });
        answer = `Factual comparison (past data, same bucket):\n${rows.join("\n")}\n\nNo winner implied — you choose.`;
      }
      break;
    }
    default:
      if (/\b(fund|this)\b/i.test(q) && q.length < 140) {
        answer = buildFundOverview(fund, ctx);
      } else {
        answer =
          `I can share factual data about **${name}** — try asking about past returns, expense ratio, volatility, ` +
          "performance score, or why it appears in the list. I cannot recommend whether to invest.";
      }
  }

  return {
    answer,
    blockedAdvice: false,
    suggestedFollowUps: getSuggestedQuestions(fund),
    disclaimer: CHAT_DISCLAIMER,
  };
}

export function getSuggestedQuestions(fund) {
  const short = fundLabel(fund).split(" ")[0] ?? "this fund";
  return [
    "Tell me about this fund",
    `Why is ${short} in this list?`,
    "What is the past 3Y CAGR?",
    "Explain the performance score",
    "What is the expense ratio?",
  ];
}

export function flattenResultFunds(results) {
  const out = [];
  const seen = new Set();
  for (const bk of results?.buckets ?? []) {
    for (const item of bk.items ?? []) {
      if (!seen.has(item.schemeCode)) {
        seen.add(item.schemeCode);
        out.push({ ...item, bucketId: bk.bucketId, riskPreference: bk.riskPreference });
      }
    }
  }
  return out;
}
