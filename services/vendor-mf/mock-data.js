/** Seed data aligned with nivya-app.jsx prototype */

/** @type {import('./types.js').Scheme[]} */
export const SCHEMES = [
  { schemeCode: "ppfas-fc", name: "Parag Parikh Flexi Cap", amc: "PPFAS", category: "Flexi Cap", risk: "Very High", nav: 82.15, prevNav: 81.92, minSip: 500, expenseRatio: 0.77, returns: { r1y: 31.8, r3y: 22.4, r5y: 24.9 } },
  { schemeCode: "nippon-sc", name: "Nippon India Small Cap", amc: "Nippon", category: "Small Cap", risk: "Very High", nav: 178.9, prevNav: 177.5, minSip: 500, expenseRatio: 0.93, returns: { r1y: 38.6, r3y: 31.2, r5y: 34.1 } },
  { schemeCode: "hdfc-ba", name: "HDFC Balanced Advantage", amc: "HDFC", category: "Hybrid", risk: "High", nav: 495.2, prevNav: 494.1, minSip: 500, expenseRatio: 0.88, returns: { r1y: 21.2, r3y: 18.6, r5y: 17.4 } },
  { schemeCode: "quant-sc", name: "Quant Small Cap", amc: "Quant", category: "Small Cap", risk: "Very High", nav: 265.4, prevNav: 264.0, minSip: 1000, expenseRatio: 0.77, returns: { r1y: 29.4, r3y: 34.8, r5y: 39.2 } },
  { schemeCode: "mirae-lc", name: "Mirae Asset Large Cap", amc: "Mirae", category: "Large Cap", risk: "High", nav: 105.6, prevNav: 105.2, minSip: 500, expenseRatio: 0.52, returns: { r1y: 19.7, r3y: 15.9, r5y: 16.8 } },
  { schemeCode: "axis-lc", name: "Axis Bluechip Fund", amc: "Axis", category: "Large Cap", risk: "High", nav: 58.3, prevNav: 58.1, minSip: 500, expenseRatio: 0.54, returns: { r1y: 18.1, r3y: 13.2, r5y: 14.6 } },
  { schemeCode: "sbi-contra", name: "SBI Contra Fund", amc: "SBI", category: "Contra", risk: "Very High", nav: 385.7, prevNav: 384.2, minSip: 500, expenseRatio: 0.91, returns: { r1y: 24.9, r3y: 27.5, r5y: 30.3 } },
  { schemeCode: "icici-tech", name: "ICICI Pru Technology", amc: "ICICI", category: "Sectoral", risk: "Very High", nav: 192.3, prevNav: 191.8, minSip: 500, expenseRatio: 0.97, returns: { r1y: 33.5, r3y: 19.8, r5y: 26.1 } },
  { schemeCode: "hdfc-elss", name: "HDFC TaxSaver (ELSS)", amc: "HDFC", category: "ELSS", risk: "High", nav: 892.4, prevNav: 890.1, minSip: 500, expenseRatio: 1.08, returns: { r1y: 22.4, r3y: 16.8, r5y: 15.2 } },
  { schemeCode: "nippon-liquid", name: "Nippon India Liquid", amc: "Nippon", category: "Liquid", risk: "Low", nav: 5421.3, prevNav: 5420.9, minSip: 500, expenseRatio: 0.21, returns: { r1y: 7.1, r3y: 6.8, r5y: 5.9 } },
];

export const DEMO_HOLDINGS = [
  { schemeCode: "ppfas-fc", folio: "12345678/91", units: 245.32, avgNav: 72.5 },
  { schemeCode: "nippon-sc", folio: "87654321/42", units: 88.1, avgNav: 155.2 },
  { schemeCode: "hdfc-ba", folio: "11223344/55", units: 42, avgNav: 468 },
  { schemeCode: "axis-lc", folio: "99887766/33", units: 120.5, avgNav: 52.1 },
];

export const DEMO_SIPS = [
  { id: "sip-1", schemeCode: "ppfas-fc", amount: 5000, debitDay: 5, status: "active", nextDebit: "5 Jul", bankAccount: "HDFC Bank •••• 4521" },
  { id: "sip-2", schemeCode: "nippon-sc", amount: 3000, debitDay: 10, status: "active", nextDebit: "10 Jul", bankAccount: "HDFC Bank •••• 4521" },
  { id: "sip-3", schemeCode: "mirae-lc", amount: 3500, debitDay: 15, status: "active", nextDebit: "15 Jul", bankAccount: "HDFC Bank •••• 4521" },
  { id: "sip-4", schemeCode: "axis-lc", amount: 1500, debitDay: 20, status: "active", nextDebit: "20 Jul", bankAccount: "HDFC Bank •••• 4521" },
  { id: "sip-5", schemeCode: "sbi-contra", amount: 2000, debitDay: 12, status: "active", nextDebit: "12 Jul", bankAccount: "HDFC Bank •••• 4521" },
  { id: "sip-6", schemeCode: "icici-tech", amount: 3000, debitDay: 18, status: "active", nextDebit: "18 Jul", bankAccount: "HDFC Bank •••• 4521" },
  { id: "sip-7", schemeCode: "nippon-liquid", amount: 2000, debitDay: 22, status: "active", nextDebit: "22 Jul", bankAccount: "HDFC Bank •••• 4521" },
  { id: "sip-8", schemeCode: "hdfc-elss", amount: 1500, debitDay: 25, status: "active", nextDebit: "25 Jul", bankAccount: "HDFC Bank •••• 4521" },
  { id: "sip-9", schemeCode: "hdfc-ba", amount: 2000, debitDay: 1, status: "paused", nextDebit: null, bankAccount: "HDFC Bank •••• 4521" },
  { id: "sip-10", schemeCode: "quant-sc", amount: 4000, debitDay: 8, status: "failed", nextDebit: "8 Jul", bankAccount: "HDFC Bank •••• 4521", failReason: "Insufficient balance", retryDate: "17 Jul" },
  { id: "sip-11", schemeCode: "hdfc-ba", amount: 1500, debitDay: 25, status: "pending_mandate", nextDebit: "After mandate", bankAccount: "HDFC Bank •••• 4521" },
];

export function schemeByCode(code) {
  return SCHEMES.find((s) => s.schemeCode === code) || null;
}

export function tickNavs() {
  for (const s of SCHEMES) {
    s.prevNav = s.nav;
    s.nav = Math.max(s.nav * (1 + (Math.random() - 0.5) * 0.004), 0.01);
  }
}
