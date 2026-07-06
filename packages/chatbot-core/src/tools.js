/**
 * Tool schemas sent to Groq — catalog-wide, read-only, no-auth lookups.
 * Execution is injected by the caller (a `dataProvider`); this file only
 * defines shape, keeping chatbot-core data-source-agnostic.
 */
export const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "rank_funds",
      description:
        "Rank and/or filter Regular-plan mutual funds across the catalog by a metric. " +
        "Use for 'top N by X' questions (e.g. top 10 CAGR, cheapest ELSS funds) and for " +
        "threshold questions (e.g. funds with positive 1Y CAGR, expense ratio under 1%) via minValue/maxValue.",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: [
              "large-cap", "flexi-cap", "small-cap", "mid-cap", "elss", "liquid",
              "ultra-short", "money-market", "hybrid", "balanced-adv", "index",
              "sectoral", "contra", "conservative-hybrid",
            ],
            description: "Optional category id to restrict to — must be one of the enum values exactly (e.g. 'mid-cap', not 'medium-cap'). Omit to search all categories. The enum above is the complete list — do not call category_info just to look up an id that's already listed here; only call category_info if the user is asking what categories exist, not as a lookup step before rank_funds.",
          },
          sortBy: {
            type: "string",
            enum: ["pastReturn1y", "pastReturn3y", "pastReturn5y", "expenseRatio"],
            description: "The metric to sort and filter by.",
          },
          order: {
            type: "string",
            enum: ["asc", "desc"],
            description: "asc for lowest-first (e.g. 'cheapest'), desc for highest-first (e.g. 'best CAGR'). Defaults to desc.",
          },
          minValue: {
            type: "number",
            description: "Only include funds whose sortBy value is >= this (e.g. 0 for 'positive returns').",
          },
          maxValue: {
            type: "number",
            description: "Only include funds whose sortBy value is <= this (e.g. 1 for 'expense ratio under 1%').",
          },
          topK: {
            type: "integer",
            description: "How many results to return, max 20. Defaults to 10.",
          },
        },
        required: ["sortBy"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "find_fund",
      description:
        "Fuzzy-search the fund catalog by name or AMC when the user names a fund in plain text " +
        "instead of using the @mention picker. Returns up to 5 matches.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Fund name, partial name, or AMC to search for." },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "category_info",
      description: "List the mutual fund categories Nivya supports and their risk bands.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
];
