/**
 * Order sheets — Lumpsum, SIP, Redeem
 */
import React, { useMemo, useState } from "react";
import {
  X, ChevronRight, ChevronDown, Loader2, Building2, AlertTriangle, ArrowRight,
} from "lucide-react";

const AV_COLORS = ["#2456BE", "#0E9C8E", "#7A5AF8", "#E8943A", "#D6409F", "#16A35A"];
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0); }
function avColor(s) { return AV_COLORS[hashStr(s) % AV_COLORS.length]; }

const nf = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nf0 = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const inr = (n) => "₹" + nf.format(n ?? 0);
const inr0 = (n) => "₹" + nf0.format(Math.round(n ?? 0));
const signPct = (c) => (c >= 0 ? "+" : "") + (c * 100).toFixed(2) + "%";

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function FundAvatar({ h, size = 40 }) {
  return (
    <div className="av" style={{ background: avColor(h), width: size, height: size, borderRadius: 12, fontSize: size * 0.32 }}>
      {h.slice(0, 2).toUpperCase()}
    </div>
  );
}

function FundCard({ fund, nav, prevNav }) {
  const chg = nav / prevNav - 1;
  const up = chg >= 0;
  return (
    <div className="ord-fund-card">
      <FundAvatar h={fund.h}/>
      <div className="meta">
        <div className="nm">{fund.s} — Regular Plan</div>
        <div className="sub">{fund.cat} Fund · {fund.h} Mutual Fund</div>
        <div className={`navline num ${up ? "up" : "down"}`}>
          NAV {inr(nav)} {up ? "▲" : "▼"} {signPct(chg)} <span>(1D)</span>
        </div>
      </div>
    </div>
  );
}

function AmountInput({ value, onChange, onClear, placeholder }) {
  return (
    <div className="ord-amount-input">
      <span className="sym">₹</span>
      <input
        type="text"
        inputMode="numeric"
        value={value === 0 ? "" : nf0.format(value)}
        placeholder={placeholder}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^0-9]/g, "");
          onChange(raw ? Number(raw) : 0);
        }}
      />
      {value > 0 && (
        <button type="button" className="clear" onClick={onClear} aria-label="Clear"><X size={14}/></button>
      )}
    </div>
  );
}

function UnitsInput({ value, onChange, onClear }) {
  return (
    <div className="ord-amount-input">
      <input
        type="text"
        inputMode="decimal"
        className="units"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
      />
      {value && (
        <button type="button" className="clear" onClick={onClear} aria-label="Clear"><X size={14}/></button>
      )}
    </div>
  );
}

function SummaryRow({ label, value, bold }) {
  return (
    <div className={`ord-sum-row ${bold ? "total" : ""}`}>
      <span>{label}</span>
      <span className="num">{value}</span>
    </div>
  );
}

function LoadingOverlay() {
  return (
    <div className="ord-loading">
      <Loader2 size={32} className="ord-spin"/>
      <b>Placing your order…</b>
      <p>Please do not close this screen.</p>
    </div>
  );
}

const MODE_META = {
  LUMPSUM: { title: "Lumpsum investment", sub: "One-time investment", cta: "Confirm investment" },
  SIP: { title: "Start SIP", sub: "Build wealth with disciplined investing", cta: "Register SIP & setup mandate" },
  REDEEM: { title: "Redeem investment", sub: "Withdraw from your investment", cta: "Confirm redeem" },
};

/**
 * @param {{ fund, navs, mode, holding, onClose, onConfirm, arn, euin, go, toast }} props
 */
export default function OrderSheet({ fund, navs, mode, holding, onClose, onConfirm, arn, euin, go, toast }) {
  const q = navs[fund.id];
  const isSip = mode === "SIP";
  const isRedeem = mode === "REDEEM";
  const meta = MODE_META[mode] ?? MODE_META.LUMPSUM;

  const [amount, setAmount] = useState(isSip ? 5000 : 10000);
  const [sipDay, setSipDay] = useState(10);
  const [redeemMode, setRedeemMode] = useState("units");
  const [redeemUnits, setRedeemUnits] = useState(holding ? String(Math.min(1000, holding.units)) : "0");
  const [redeemAmount, setRedeemAmount] = useState(5000);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  const maxUnits = holding?.units ?? 0;
  const invested = holding ? holding.units * holding.avgNav : 0;
  const currentVal = holding ? holding.units * q.nav : 0;

  const units = useMemo(() => {
    if (!isRedeem) return amount / q.nav;
    if (redeemMode === "units") return parseFloat(redeemUnits) || 0;
    return (redeemAmount || 0) / q.nav;
  }, [isRedeem, redeemMode, redeemUnits, redeemAmount, amount, q.nav]);

  const total = isRedeem ? units * q.nav : amount;

  const err = useMemo(() => {
    if (isRedeem) {
      if (units <= 0) return "Enter units or amount to redeem";
      if (units > maxUnits + 0.0001) return `Maximum ${maxUnits.toFixed(3)} units available`;
      return "";
    }
    if (amount < fund.minSip) return `Minimum ${isSip ? "SIP" : "lumpsum"}: ${inr0(fund.minSip)}`;
    return "";
  }, [isRedeem, units, maxUnits, amount, fund.minSip, isSip]);

  const needsConsent = !isRedeem;
  const canSubmit = !err && total > 0 && (!needsConsent || consent);

  const arnDisplay = arn.replace(/^ARN-?/i, "");
  const euinDisplay = euin.replace(/^EUIN-?/i, "");

  const firstDebit = useMemo(() => {
    const d = new Date(2026, 6, sipDay);
    if (d < new Date(2026, 6, 8)) d.setMonth(d.getMonth() + 1);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }, [sipDay]);

  const handleConfirm = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await onConfirm(mode, {
        amount: isRedeem ? total : amount,
        units: isRedeem ? units : amount / q.nav,
        sipDay,
      });
    } catch {
      toast?.("Unable to place order. Please check details and try again");
      setLoading(false);
    }
  };

  const addAmount = (delta) => setAmount((a) => Math.max(0, a + delta));
  const setRedeemPct = (pct) => {
    const u = maxUnits * pct;
    setRedeemUnits(u.toFixed(3));
    setRedeemMode("units");
  };

  return (
    <div className="scrim ord-scrim" onClick={loading ? undefined : onClose}>
      <div className="sheet ord-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab"/>
        <div className="ord-head">
          <div>
            <h4>{meta.title}</h4>
            <p>{meta.sub}</p>
          </div>
          <button type="button" className="iconbtn" onClick={onClose} disabled={loading} aria-label="Close"><X size={18}/></button>
        </div>

        <FundCard fund={fund} nav={q.nav} prevNav={q.prevNav}/>

        {isRedeem && holding && (
          <div className="ord-holding-box">
            <div className="grid">
              <div><span>Available units</span><b className="num">{holding.units.toFixed(3)}</b></div>
              <div><span>Invested value</span><b className="num">{inr0(invested)}</b></div>
              <div><span>Current value</span><b className="num">{inr0(currentVal)}</b></div>
            </div>
            <button type="button" className="link" onClick={() => { onClose(); go("portfolio"); }}>
              View in Portfolio <ChevronRight size={14}/>
            </button>
          </div>
        )}

        {isRedeem ? (
          <>
            <div className="ord-toggle">
              <button type="button" className={redeemMode === "units" ? "on" : ""} onClick={() => setRedeemMode("units")}>Units</button>
              <button type="button" className={redeemMode === "amount" ? "on" : ""} onClick={() => setRedeemMode("amount")}>Amount (₹)</button>
            </div>
            <div className="field-lbl">{redeemMode === "units" ? "Units to redeem" : "Amount to redeem"}</div>
            {redeemMode === "units" ? (
              <UnitsInput value={redeemUnits} onChange={setRedeemUnits} onClear={() => setRedeemUnits("")}/>
            ) : (
              <AmountInput value={redeemAmount} onChange={setRedeemAmount} onClear={() => setRedeemAmount(0)}/>
            )}
            <div className="ord-chips">
              {["25%", "50%", "75%", "Max"].map((label, i) => {
                const pct = [0.25, 0.5, 0.75, 1][i];
                return (
                  <button key={label} type="button" onClick={() => setRedeemPct(pct)}>{label}</button>
                );
              })}
            </div>
            <p className="ord-hint">Maximum available: {maxUnits.toFixed(3)} units</p>
            <div className="ord-warn">
              <AlertTriangle size={16}/>
              <div>
                <b>Exit load (if any)</b>
                <p>0.50% if redeemed within 365 days. <button type="button" onClick={() => toast?.("Exit load per SID — demo")}>View details</button></p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="field-lbl">{isSip ? "SIP amount (monthly)" : "Investment amount"}</div>
            <AmountInput
              value={amount}
              onChange={setAmount}
              onClear={() => setAmount(0)}
              placeholder={String(fund.minSip)}
            />
            <div className="ord-chips">
              {(isSip ? [1000, 2500, 5000] : [1000, 5000, 10000]).map((a) => (
                <button key={a} type="button" onClick={() => addAmount(a)}>+{inr0(a)}</button>
              ))}
              <button type="button" onClick={() => setAmount(isSip ? 100000 : 500000)}>Max</button>
            </div>
            <p className="ord-hint">Minimum {isSip ? "SIP" : "lumpsum"}: {inr0(fund.minSip)}</p>

            {!isSip && (
              <div className="ord-estimate">
                <div><span>Estimated units (approx.)</span><b className="num">{units.toFixed(2)} Units</b></div>
                <div><span>Applicable NAV</span><b className="num">{inr(q.nav)}</b></div>
              </div>
            )}

            {isSip && (
              <>
                <div className="field-lbl">Debit day</div>
                <div className="ord-select-wrap">
                  <select value={sipDay} onChange={(e) => setSipDay(Number(e.target.value))}>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>{ordinal(d)} of every month</option>
                    ))}
                  </select>
                  <ChevronDown size={16}/>
                </div>
                <div className="ord-mandate-info">
                  <Building2 size={18}/>
                  <p>First-time SIP? We will set up an e-mandate on your linked bank account for automatic monthly debits.</p>
                </div>
              </>
            )}
          </>
        )}

        <div className="ord-summary">
          {isSip ? (
            <>
              <SummaryRow label="SIP amount (monthly)" value={inr0(amount)}/>
              <SummaryRow label="Debit day" value={`${ordinal(sipDay)} of every month`}/>
              <SummaryRow label="First debit (on or after)" value={firstDebit} bold/>
            </>
          ) : isRedeem ? (
            <>
              <SummaryRow label="Units to redeem" value={units.toFixed(3)}/>
              <SummaryRow label="Applicable NAV" value={inr(q.nav)}/>
              <SummaryRow label="Estimated amount (approx.)" value={inr(total)} bold/>
            </>
          ) : (
            <>
              <SummaryRow label="Investment amount" value={inr0(amount)}/>
              <SummaryRow label="Applicable NAV" value={inr(q.nav)}/>
              <SummaryRow label="Estimated units" value={units.toFixed(2)} bold/>
            </>
          )}
        </div>

        <p className="ord-compliance">Order will be placed under ARN-{arnDisplay} | EUIN: {euinDisplay}</p>

        {needsConsent && (
          <label className="ord-consent">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}/>
            <span>
              I have read the SID and KIM of this scheme and understand the risks involved.{" "}
              <button type="button" onClick={() => toast?.("SID/KIM viewer — production")}>View</button>
            </span>
          </label>
        )}

        {err && <div className="ord-err">{err}</div>}

        <button
          type="button"
          className={`btn btn-full ord-cta ${isRedeem ? "redeem" : "buy"}`}
          disabled={!canSubmit || loading}
          onClick={handleConfirm}
        >
          {meta.cta} {!isRedeem && <ArrowRight size={16}/>}
        </button>

        <p className="ord-foot-disc">Mutual fund investments are subject to market risks. Read all scheme-related documents carefully.</p>

        {loading && <LoadingOverlay/>}
      </div>
    </div>
  );
}
