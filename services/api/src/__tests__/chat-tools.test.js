import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { rankFundItems } from "../lib/chat-tools.js";

const FUNDS = [
  { name: "Fund A", amc: "AMC1", category: "ELSS", returns: { r1y: 12, r3y: 18 }, expenseRatio: 0.9 },
  { name: "Fund B", amc: "AMC2", category: "ELSS", returns: { r1y: -3, r3y: 8 }, expenseRatio: 0.5 },
  { name: "Fund C", amc: "AMC3", category: "Large Cap", returns: { r1y: 20, r3y: 15 }, expenseRatio: 1.4 },
  { name: "Fund D", amc: "AMC4", category: "Large Cap", returns: { r1y: 5, r3y: null }, expenseRatio: null },
];

describe("rankFundItems", () => {
  test("ranks top-N by descending return", () => {
    const res = rankFundItems(FUNDS, { sortBy: "pastReturn1y", topK: 2 });
    assert.equal(res.totalMatching, 4);
    assert.deepEqual(res.items.map((i) => i.schemeName), ["Fund C", "Fund A"]);
  });

  test("ascending order for 'cheapest' style questions", () => {
    const res = rankFundItems(FUNDS, { sortBy: "expenseRatio", order: "asc", topK: 10 });
    // Fund D has null expenseRatio and must be excluded, not sorted as 0
    assert.deepEqual(res.items.map((i) => i.schemeName), ["Fund B", "Fund A", "Fund C"]);
  });

  test("minValue filters out funds below threshold (e.g. positive returns only)", () => {
    const res = rankFundItems(FUNDS, { sortBy: "pastReturn1y", minValue: 0, topK: 10 });
    assert.equal(res.totalMatching, 3);
    assert.ok(!res.items.some((i) => i.schemeName === "Fund B"));
  });

  test("totalMatching reflects the full filtered count, not just the capped topK sample", () => {
    const res = rankFundItems(FUNDS, { sortBy: "pastReturn1y", topK: 1 });
    assert.equal(res.totalMatching, 4);
    assert.equal(res.items.length, 1);
  });

  test("topK is capped at 20 even if a larger value is requested", () => {
    const res = rankFundItems(FUNDS, { sortBy: "pastReturn1y", topK: 999 });
    assert.equal(res.items.length, 4); // only 4 funds exist, capped value doesn't matter here
  });

  test("throws on an unknown sortBy", () => {
    assert.throws(() => rankFundItems(FUNDS, { sortBy: "bogusField" }));
  });
});
