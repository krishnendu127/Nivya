const GROQ_BASE_URL = process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1";
const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.1-8b-instant";

/**
 * Streams a chat completion from Groq's OpenAI-compatible API.
 * Yields discriminated events:
 *   { type: "text", text }        — a content delta
 *   { type: "tool_calls", calls } — once the model finishes committing to a
 *                                   tool call: calls = [{ id, name, arguments (JSON string) }]
 * @param {{ messages: {role: string, content: string}[], tools?: object[], maxTokens?: number }} params
 */
export async function* callGroqChatStream({ messages, tools, maxTokens = 1024 }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set");
  }

  const body = {
    model: GROQ_MODEL,
    messages,
    max_tokens: maxTokens,
    stream: true,
  };
  if (tools?.length) body.tools = tools;

  const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Groq API error ${res.status}: ${errBody.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  /** index -> { id, name, arguments } — tool_calls arrive incrementally across chunks */
  const toolCallsAcc = new Map();

  function flushToolCalls() {
    if (toolCallsAcc.size === 0) return null;
    return { type: "tool_calls", calls: [...toolCallsAcc.values()] };
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") {
        const final = flushToolCalls();
        if (final) yield final;
        return;
      }

      let parsed;
      try {
        parsed = JSON.parse(payload);
      } catch {
        continue;
      }

      const delta = parsed.choices?.[0]?.delta;
      if (!delta) continue;

      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index ?? 0;
          const existing = toolCallsAcc.get(idx) ?? { id: "", name: "", arguments: "" };
          if (tc.id) existing.id = tc.id;
          if (tc.function?.name) existing.name = tc.function.name;
          if (tc.function?.arguments) existing.arguments += tc.function.arguments;
          toolCallsAcc.set(idx, existing);
        }
      }

      if (delta.content) {
        yield { type: "text", text: delta.content };
      }
    }
  }

  const final = flushToolCalls();
  if (final) yield final;
}
