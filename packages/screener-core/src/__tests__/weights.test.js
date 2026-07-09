import assert from "node:assert/strict";
import { test, describe } from "node:test";
import { resolveWeights, DEFAULT_WEIGHTS } from "../weights.js";

describe("weights normalize", () => {
  test("weights sum to 1 when ranking present", () => {
    const w = resolveWeights({
      riskPreference: "HIGH",
      ranking: {
        expensePriority: "performance",
        consistencyPref: "volatile",
        returnWindow: "1y",
        preferredAmcs: ["HDFC"],
        safetyGrowth: 25,
        horizonMonths: 84,
      },
    });
    const sum = w.returns + w.consistency + w.expense + w.riskFit + w.amc;
    assert.ok(Math.abs(sum - 1) < 1e-9);
    assert.equal(w.returnWindow, "1y");
  });

  test("missing ranking is byte-equivalent defaults", () => {
    const w = resolveWeights({});
    assert.deepEqual(
      {
        returns: w.returns,
        consistency: w.consistency,
        expense: w.expense,
        riskFit: w.riskFit,
        amc: w.amc,
      },
      { ...DEFAULT_WEIGHTS }
    );
  });
});
