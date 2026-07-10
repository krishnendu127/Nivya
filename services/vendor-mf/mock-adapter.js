import { randomUUID } from "node:crypto";
import { SCHEMES, schemeByCode } from "./mock-data.js";

/** @type {import('./types.js').VendorMFAdapter} */
export function createMockVendorMFAdapter() {
  return {
    name: "mock",

    async listSchemes({ category, q } = {}) {
      let items = [...SCHEMES];
      if (category) items = items.filter((s) => s.category === category);
      if (q) {
        const needle = q.toLowerCase();
        items = items.filter(
          (s) =>
            s.name.toLowerCase().includes(needle) ||
            s.amc.toLowerCase().includes(needle) ||
            s.schemeCode.includes(needle)
        );
      }
      return items;
    },

    async getScheme(schemeCode) {
      return schemeByCode(schemeCode);
    },

    async submitOrder(req) {
      const scheme = schemeByCode(req.schemeCode);
      if (!scheme && req.type === "switch" && !req.targetSchemeCode) {
        return { vendorRef: "", status: "rejected", message: "targetSchemeCode required for switch" };
      }
      return {
        vendorRef: `MOCK-${randomUUID().slice(0, 8).toUpperCase()}`,
        status: "accepted",
        message: scheme
          ? "Demo order accepted by mock adapter"
          : "Demo order accepted (catalog scheme)",
      };
    },

    async registerSip({ schemeCode, amount, debitDay }) {
      const scheme = schemeByCode(schemeCode);
      const minSip = scheme?.minSip ?? 500;
      if (amount < minSip) throw new Error(`Minimum SIP is ${minSip}`);
      if (debitDay < 1 || debitDay > 28) throw new Error("debitDay must be 1–28");
      return {
        vendorRef: `MOCK-SIP-${randomUUID().slice(0, 8).toUpperCase()}`,
        status: "accepted",
      };
    },

    async registerStp({ schemeCode, targetSchemeCode, amount, debitDay }) {
      if (!schemeCode || !targetSchemeCode) throw new Error("schemeCode and targetSchemeCode required");
      if (schemeCode === targetSchemeCode) throw new Error("STP destination must differ from source");
      if (amount < 500) throw new Error("Minimum STP is 500");
      if (debitDay < 1 || debitDay > 28) throw new Error("debitDay must be 1–28");
      return {
        vendorRef: `MOCK-STP-${randomUUID().slice(0, 8).toUpperCase()}`,
        status: "accepted",
      };
    },

    async registerSwp({ schemeCode, amount, debitDay }) {
      if (!schemeCode) throw new Error("schemeCode required");
      if (amount < 500) throw new Error("Minimum SWP is 500");
      if (debitDay < 1 || debitDay > 28) throw new Error("debitDay must be 1–28");
      return {
        vendorRef: `MOCK-SWP-${randomUUID().slice(0, 8).toUpperCase()}`,
        status: "accepted",
      };
    },
  };
}
