import { isAdviceQuestion, ADVICE_REFUSAL } from "./guardrails.js";
import { buildSystemPrompt } from "./system-prompt.js";
import { buildFundContextBlock } from "./context.js";
import { callGroqChatStream } from "./llm-client.js";
import { TOOL_DEFINITIONS } from "./tools.js";

// Compound questions (e.g. "group top funds by small/mid/large cap") need one
// rank_funds call per category plus a final round to compose the answer —
// keep enough headroom for that, not just a single tool round-trip.
const MAX_TOOL_ROUNDS = 6;

/**
 * Streams a mutual fund Q&A answer. Yields plain text chunks.
 * Regex advice-guard runs first and short-circuits with a single
 * refusal chunk — no LLM call — before anything reaches Groq.
 * `funds` may be an empty array for a purely general MF question.
 * `dataProvider` maps tool name -> async executor (injected by the caller,
 * e.g. services/api/src/lib/chat-tools.js) — keeps this package data-source-agnostic.
 * @param {{ funds?: object[], dataAsOn?: string, question: string, history?: {role: "user"|"bot", text: string}[], dataProvider?: Record<string, Function> }} params
 */
export async function* streamFundChatAnswer({ funds = [], dataAsOn, question, history = [], dataProvider = {} }) {
  if (isAdviceQuestion(question)) {
    yield ADVICE_REFUSAL;
    return;
  }

  const contextBlock = buildFundContextBlock(funds, dataAsOn);
  const userContent = contextBlock ? `${contextBlock}\n\nQuestion: ${question}` : question;

  const messages = [
    { role: "system", content: buildSystemPrompt() },
    ...history.map((turn) => ({
      role: turn.role === "bot" ? "assistant" : "user",
      content: turn.text,
    })),
    { role: "user", content: userContent },
  ];

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      let sawToolCalls = false;
      let sawText = false;

      for await (const event of callGroqChatStream({ messages, tools: TOOL_DEFINITIONS })) {
        if (event.type === "text") {
          sawText = true;
          yield event.text;
          continue;
        }

        sawToolCalls = true;
        messages.push({
          role: "assistant",
          content: null,
          tool_calls: event.calls.map((c) => ({
            id: c.id,
            type: "function",
            function: { name: c.name, arguments: c.arguments },
          })),
        });

        for (const call of event.calls) {
          let resultContent;
          try {
            const fn = dataProvider[call.name];
            if (!fn) throw new Error(`Unknown tool: ${call.name}`);
            const args = call.arguments ? JSON.parse(call.arguments) : {};
            resultContent = JSON.stringify(await fn(args));
          } catch (err) {
            resultContent = JSON.stringify({ error: err.message });
          }
          messages.push({ role: "tool", tool_call_id: call.id, content: resultContent });
        }
      }

      // Tool calls always get a follow-up round so the model can use the
      // results, even if some stray text leaked out alongside them.
      if (sawToolCalls) continue;
      if (sawText) return;
      break;
    }

    yield "Sorry, I couldn't process that right now. Please try again.";
  } catch (err) {
    yield `Sorry, I couldn't process that right now (${err.message}). Please try again.`;
  }
}
