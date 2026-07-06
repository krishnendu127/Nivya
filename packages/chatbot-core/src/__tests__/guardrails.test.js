import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { isAdviceQuestion, ADVICE_REFUSAL, CHAT_DISCLAIMER } from "../guardrails.js";

describe("isAdviceQuestion", () => {
  test("blocks buy/sell/hold and recommendation phrasing", () => {
    assert.equal(isAdviceQuestion("Should I buy this fund?"), true);
    assert.equal(isAdviceQuestion("Can you recommend a good fund?"), true);
    assert.equal(isAdviceQuestion("Is this a good fund?"), true);
    assert.equal(isAdviceQuestion("Will it grow in the next year?"), true);
    assert.equal(isAdviceQuestion("Is it worth investing right now?"), true);
  });

  test("allows factual questions through", () => {
    assert.equal(isAdviceQuestion("What is the past 3Y CAGR?"), false);
    assert.equal(isAdviceQuestion("Why does this fund appear in the list?"), false);
    assert.equal(isAdviceQuestion("Tell me about this fund"), false);
    assert.equal(
      isAdviceQuestion("No i am not asking about your advice, i just want to know about this fund"),
      false
    );
  });

  test("refusal text redirects to factual questions and stays off advice", () => {
    assert.match(ADVICE_REFUSAL, /factual/i);
    assert.doesNotMatch(ADVICE_REFUSAL, /\byou should\b/i);
  });

  test("disclaimer states no buy/sell/hold recommendation", () => {
    assert.match(CHAT_DISCLAIMER, /not investment advice/i);
    assert.match(CHAT_DISCLAIMER, /buy, sell, or hold/i);
  });
});
