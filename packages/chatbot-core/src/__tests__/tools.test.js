import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { TOOL_DEFINITIONS } from "../tools.js";

describe("TOOL_DEFINITIONS", () => {
  test("every tool is a well-formed OpenAI-style function schema", () => {
    for (const tool of TOOL_DEFINITIONS) {
      assert.equal(tool.type, "function");
      assert.ok(tool.function.name, "tool must have a name");
      assert.ok(tool.function.description, "tool must have a description");
      assert.equal(tool.function.parameters.type, "object");
      assert.equal(tool.function.parameters.additionalProperties, false);
    }
  });

  test("tool names are unique", () => {
    const names = TOOL_DEFINITIONS.map((t) => t.function.name);
    assert.equal(new Set(names).size, names.length);
  });

  test("rank_funds requires sortBy and constrains it to known metrics", () => {
    const rankFunds = TOOL_DEFINITIONS.find((t) => t.function.name === "rank_funds");
    assert.ok(rankFunds.function.parameters.required.includes("sortBy"));
    assert.deepEqual(rankFunds.function.parameters.properties.sortBy.enum, [
      "pastReturn1y", "pastReturn3y", "pastReturn5y", "expenseRatio",
    ]);
  });

  test("find_fund requires a query string", () => {
    const findFund = TOOL_DEFINITIONS.find((t) => t.function.name === "find_fund");
    assert.deepEqual(findFund.function.parameters.required, ["query"]);
  });
});
