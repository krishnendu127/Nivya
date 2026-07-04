import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { answerFundQuestion, getSuggestedQuestions } from "../fund-chat.js";

const SAMPLE = {
  schemeCode: "test-fc",
  schemeName: "Test Flexi Cap Fund - Regular",
  amc: "Test AMC",
  category: "flexi-cap",
  pastReturn1y: 25.5,
  pastReturn3y: 18.2,
  pastReturn5y: 16.0,
  volatilityPct: 14.1,
  expenseRatio: 0.88,
  aum: 45000,
  riskometer: "Very High",
  nav: 120.5,
  performanceScore: 72,
  riskScore: 41,
  reasons: [{ code: "HIGH_3Y_RETURN_IN_CATEGORY", text: "Past 3Y CAGR (18.2%) is above category median" }],
  dataAsOn: "2026-06-01T00:00:00.000Z",
};

describe("answerFundQuestion", () => {
  test("blocks investment advice questions", () => {
    const res = answerFundQuestion(SAMPLE, "Should I buy this fund?");
    assert.equal(res.blockedAdvice, true);
    assert.match(res.answer, /not investment advice|factual/i);
  });

  test("answers past 3Y CAGR factually", () => {
    const res = answerFundQuestion(SAMPLE, "What is the past 3Y CAGR?");
    assert.equal(res.blockedAdvice, false);
    assert.match(res.answer, /18\.2%/);
    assert.match(res.answer, /Past 3Y/i);
  });

  test("explains performance score", () => {
    const res = answerFundQuestion(SAMPLE, "Explain performance score");
    assert.match(res.answer, /72/);
    assert.match(res.answer, /60%/);
  });

  test("returns why ranked from reasons", () => {
    const res = answerFundQuestion(SAMPLE, "Why does this fund appear in the list?");
    assert.match(res.answer, /category median/i);
  });

  test("answers general tell-me-about with factual overview", () => {
    const res = answerFundQuestion(SAMPLE, "Tell me about this fund");
    assert.equal(res.blockedAdvice, false);
    assert.match(res.answer, /Test Flexi Cap Fund/);
    assert.match(res.answer, /18\.2%/);
    assert.match(res.answer, /Expense ratio/i);
    assert.match(res.answer, /not buy\/sell\/hold/i);
  });

  test("answers know-about follow-up without advice block", () => {
    const res = answerFundQuestion(
      SAMPLE,
      "No i am not asking about your advice, i just want to know about this fund"
    );
    assert.equal(res.blockedAdvice, false);
    assert.match(res.answer, /Past CAGR/i);
  });

  test("suggested questions are non-empty", () => {
    assert.ok(getSuggestedQuestions(SAMPLE).length >= 3);
  });
});
