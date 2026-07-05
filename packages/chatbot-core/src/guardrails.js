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

export function isAdviceQuestion(text) {
  return ADVICE_PATTERNS.some((re) => re.test(String(text ?? "")));
}

export const ADVICE_REFUSAL =
  "I can only share **factual data** about funds shown in your ranked list — not buy/sell/hold guidance or return forecasts. " +
  "You choose whether to invest; Nivya executes as your AMFI-registered distributor. " +
  "Try: “What is the past 3Y CAGR?” or “Why does this fund appear in the list?”";
