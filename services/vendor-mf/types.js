/**
 * @typedef {Object} Scheme
 * @property {string} schemeCode
 * @property {string} name
 * @property {string} amc
 * @property {string} category
 * @property {string} risk
 * @property {number} nav
 * @property {number} prevNav
 * @property {number} minSip
 * @property {number} expenseRatio
 * @property {{ r1y: number, r3y: number, r5y: number }} returns
 */

/**
 * @typedef {Object} VendorOrderRequest
 * @property {'purchase'|'redeem'|'switch'} type
 * @property {string} schemeCode
 * @property {string} [targetSchemeCode]
 * @property {number} [amount]
 * @property {number} [units]
 * @property {string} arn
 * @property {string} euin
 * @property {string} investorRef
 */

/**
 * @typedef {Object} VendorOrderResult
 * @property {string} vendorRef
 * @property {'accepted'|'rejected'|'pending'} status
 * @property {string} [message]
 */

/**
 * @typedef {Object} VendorMFAdapter
 * @property {string} name
 * @property {() => Promise<Scheme[]>} listSchemes
 * @property {(schemeCode: string) => Promise<Scheme|null>} getScheme
 * @property {(req: VendorOrderRequest) => Promise<VendorOrderResult>} submitOrder
 * @property {(params: { schemeCode: string, amount: number, debitDay: number, arn: string, euin: string, investorRef: string }) => Promise<{ vendorRef: string, status: string }>} registerSip
 * @property {(params: { schemeCode: string, targetSchemeCode: string, amount: number, debitDay: number, arn: string, euin: string, investorRef: string }) => Promise<{ vendorRef: string, status: string }>} registerStp
 * @property {(params: { schemeCode: string, amount: number, debitDay: number, arn: string, euin: string, investorRef: string }) => Promise<{ vendorRef: string, status: string }>} registerSwp
 */

export {};
