import assert from "node:assert/strict";
import { test, describe } from "node:test";
import {
  mapRiskPreferenceToCategories,
  computeMetrics,
  scoreScheme,
  rankSchemes,
  buildMultiBucketResponse,
} from "../index.js";

const SAMPLE_SCHEMES = [
  { schemeCode: "a", schemeName: "Alpha Small Cap Fund - Regular", amc: "AMC1", category: "small-cap", aum: 50000, expenseRatio: 0.9, riskometer: "Very High", nav: 100, pastReturn1y: 40, pastReturn3y: 32, pastReturn5y: 35, volatilityPct: 23 },
  { schemeCode: "b", schemeName: "Beta Small Cap Fund - Regular",  amc: "AMC2", category: "small-cap", aum: 20000, expenseRatio: 1.1, riskometer: "Very High", nav: 80,  pastReturn1y: 30, pastReturn3y: 25, pastReturn5y: 28, volatilityPct: 26 },
  { schemeCode: "c", schemeName: "Gamma Large Cap Fund - Regular", amc: "AMC3", category: "large-cap", aum: 45000, expenseRatio: 0.5, riskometer: "High",      nav: 120, pastReturn1y: 20, pastReturn3y: 16, pastReturn5y: 17, volatilityPct: 12 },
  { schemeCode: "d", schemeName: "Delta Large Cap Fund - Regular", amc: "AMC4", category: "large-cap", aum: 35000, expenseRatio: 0.7, riskometer: "High",      nav: 90,  pastReturn1y: 18, pastReturn3y: 14, pastReturn5y: 15, volatilityPct: 13 },
  { schemeCode: "e", schemeName: "Epsilon Direct Fund",            amc: "AMC5", category: "small-cap", aum: 60000, expenseRatio: 0.4, riskometer: "Very High", nav: 200, pastReturn1y: 50, pastReturn3y: 40, pastReturn5y: 42, volatilityPct: 20 },
  { schemeCode: "f", schemeName: "Zeta Liquid Fund - Regular",     amc: "AMC6", category: "liquid",    aum: 30000, expenseRatio: 0.2, riskometer: "Low",       nav: 5000,pastReturn1y: 7.2,pastReturn3y: 6.9, pastReturn5y: 6.1, volatilityPct: 0.4 },
];

describe("mapRiskPreferenceToCategories", () => {
  test("LOW returns liquid/ultra-short/etc", () => {
    const cats = mapRiskPreferenceToCategories("LOW", []);
    assert.ok(cats.includes("liquid"));
  });
  test("HIGH returns small-cap/mid-cap/elss etc", () => {
    const cats = mapRiskPreferenceToCategories("HIGH", []);
    assert.ok(cats.includes("small-cap"));
    assert.ok(cats.includes("elss"));
  });
  test("intersection with selected categories", () => {
    const cats = mapRiskPreferenceToCategories("HIGH", ["small-cap", "large-cap"]);
    assert.deepEqual(cats, ["small-cap"]);
  });
  test("falls back to selectedCategories when no intersection", () => {
    const cats = mapRiskPreferenceToCategories("LOW", ["elss"]);
    assert.deepEqual(cats, ["elss"]);
  });
});

describe("computeMetrics", () => {
  test("returns nulls for empty series", () => {
    const m = computeMetrics([]);
    assert.equal(m.cagr1y, null);
    assert.equal(m.volatilityPct, null);
  });
  test("computes positive CAGR for rising NAV", () => {
    const series = [];
    const start = new Date();
    start.setFullYear(start.getFullYear() - 2);
    for (let i = 0; i <= 730; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      series.push({ date: d.toISOString().slice(0, 10), nav: 100 * (1 + i / 730) });
    }
    const m = computeMetrics(series);
    assert.ok(m.cagr1y > 0, "1Y CAGR should be positive");
  });
  test("volatility is non-negative", () => {
    const series = [];
    const d = new Date();
    for (let i = 0; i < 400; i++) {
      const dd = new Date(d);
      dd.setDate(dd.getDate() - (400 - i));
      series.push({ date: dd.toISOString().slice(0, 10), nav: 100 + Math.sin(i) * 5 });
    }
    const m = computeMetrics(series);
    assert.ok(m.volatilityPct >= 0);
  });
});

describe("scoreScheme", () => {
  test("performanceScore is 0–100", () => {
    const peers = SAMPLE_SCHEMES.filter((s) => s.category === "small-cap");
    const scored = scoreScheme(peers[0], peers);
    assert.ok(scored.performanceScore >= 0 && scored.performanceScore <= 100);
  });
  test("planType is always Regular", () => {
    const peers = SAMPLE_SCHEMES.filter((s) => s.category === "small-cap");
    const scored = scoreScheme(peers[0], peers);
    assert.equal(scored.planType, "Regular");
  });
});

describe("rankSchemes", () => {
  test("excludes Direct plans", () => {
    const results = rankSchemes(SAMPLE_SCHEMES, { riskPreference: "HIGH", topK: 10 });
    const names = results.map((r) => r.schemeName.toLowerCase());
    assert.ok(!names.some((n) => n.includes("direct")));
  });
  test("returns at most topK results", () => {
    const results = rankSchemes(SAMPLE_SCHEMES, { riskPreference: "HIGH", topK: 2 });
    assert.ok(results.length <= 2);
  });
  test("respects category filter", () => {
    const results = rankSchemes(SAMPLE_SCHEMES, {
      riskPreference: "MEDIUM",
      categories: ["large-cap"],
      topK: 10,
    });
    assert.ok(results.every((r) => r.category === "large-cap"));
  });
});

describe("buildMultiBucketResponse", () => {
  test("returns disclaimer, dataAsOn, buckets", () => {
    const res = buildMultiBucketResponse(
      [{ riskPreference: "HIGH", categories: ["small-cap"] }],
      SAMPLE_SCHEMES
    );
    assert.ok(typeof res.disclaimer === "string");
    assert.ok(typeof res.dataAsOn === "string");
    assert.ok(Array.isArray(res.buckets));
  });
  test("multi-bucket returns separate lists", () => {
    const res = buildMultiBucketResponse(
      [
        { riskPreference: "HIGH",   categories: ["small-cap"] },
        { riskPreference: "MEDIUM", categories: ["large-cap"] },
      ],
      SAMPLE_SCHEMES
    );
    assert.equal(res.buckets.length, 2);
    assert.notDeepEqual(res.buckets[0].items, res.buckets[1].items);
  });
});
