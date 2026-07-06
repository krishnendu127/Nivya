import { CATEGORIES, buildMultiBucketResponse } from "@nivya/screener-core";
import { streamFundChatAnswer } from "@nivya/chatbot-core";
import { getSnapshotMeta, loadSnapshotRaw } from "../lib/snapshot-store.js";
import { buildChatToolProvider } from "../lib/chat-tools.js";

const DISCLAIMER =
  "Mutual fund investments are subject to market risks. Past performance does not guarantee future results. " +
  "This is not investment advice. Read Scheme Information Document (SID) and Key Information Memorandum (KIM) before investing. " +
  "Nivya · AMFI-registered Mutual Fund Distributor (ARN). Regular plans only.";

/** @param {import("fastify").FastifyInstance} fastify */
export default async function screenerRoutes(fastify) {
  fastify.get("/status", async () => {
    const schemes = await loadSnapshotRaw();
    const meta = getSnapshotMeta();
    const latest = schemes.reduce((max, s) => {
      const t = Date.parse(s.dataAsOn ?? "") || 0;
      return t > max ? t : max;
    }, 0);
    return {
      dataSource: meta.dataSource,
      snapshotPath: meta.snapshotPath,
      schemeCount: schemes.length,
      latestNavDate: latest ? new Date(latest).toISOString() : null,
      mfapiBuildHint: "Run npm run screener:build to refresh from https://api.mfapi.in (not called on each query)",
    };
  });

  fastify.get("/categories", async () => ({
    categories: CATEGORIES.map((c) => ({
      id: c.id,
      label: c.label,
      riskBand: c.riskBand,
    })),
  }));

  fastify.post("/query", {
    schema: {
      body: {
        type: "object",
        required: ["buckets"],
        properties: {
          mode: { type: "string", enum: ["SIP", "LUMPSUM", "STP", "SWP"] },
          horizonMonths: { type: "integer", minimum: 1 },
          buckets: {
            type: "array",
            minItems: 1,
            maxItems: 5,
            items: {
              type: "object",
              required: ["riskPreference"],
              properties: {
                riskPreference: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
                categories: { type: "array", items: { type: "string" } },
                amountInr: { type: "number" },
                topK: { type: "integer", minimum: 1, maximum: 50 },
              },
            },
          },
        },
      },
    },
  }, async (req) => {
    const { mode = "SIP", horizonMonths, buckets } = req.body;

    if (mode === "STP" || mode === "SWP") {
      return {
        disclaimer: DISCLAIMER,
        dataAsOn: new Date().toISOString(),
        mode,
        horizonMonths,
        stubNotice: `${mode} screening is not available in v1. Showing SIP-equivalent results.`,
        buckets: [],
      };
    }

    const schemes = await loadSnapshotRaw();
    const result = buildMultiBucketResponse(buckets, schemes);
    return {
      mode,
      horizonMonths,
      dataSource: getSnapshotMeta().dataSource,
      ...result,
    };
  });

  fastify.get("/metrics/:schemeCode", async (req, reply) => {
    const { schemeCode } = req.params;
    const schemes = await loadSnapshotRaw();
    const scheme = schemes.find((s) => String(s.schemeCode) === String(schemeCode));
    if (!scheme) {
      return reply.status(404).send({
        code: "SCHEME_NOT_FOUND",
        message: `No scheme with code ${schemeCode}`,
      });
    }

    const { scoreScheme } = await import("@nivya/screener-core");
    const peers = schemes.filter((s) => s.category === scheme.category);
    const scored = scoreScheme(scheme, peers);
    const catMeta = CATEGORIES.find((c) => c.id === scheme.category) ?? {};

    return {
      ...scored,
      categoryLabel: catMeta.label,
      riskBand: catMeta.riskBand,
      disclaimer: DISCLAIMER,
    };
  });

  fastify.post("/chat", {
    schema: {
      body: {
        type: "object",
        required: ["question"],
        properties: {
          question: { type: "string", minLength: 1, maxLength: 500 },
          funds: { type: "array" },
          dataAsOn: { type: "string" },
          history: { type: "array" },
        },
      },
    },
  }, async (req, reply) => {
    const { question, funds = [], dataAsOn, history = [] } = req.body;

    reply.hijack();
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    try {
      const dataProvider = buildChatToolProvider();
      for await (const chunk of streamFundChatAnswer({ funds, dataAsOn, question, history, dataProvider })) {
        reply.raw.write(`data: ${chunk.replace(/\n/g, "\\n")}\n\n`);
      }
      reply.raw.write("data: [DONE]\n\n");
    } catch (err) {
      reply.raw.write(`event: error\ndata: ${String(err?.message ?? err)}\n\n`);
    } finally {
      reply.raw.end();
    }
  });
}
