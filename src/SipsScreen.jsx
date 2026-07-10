/**
 * SIPs tab — summary, list, manage sheet, modify amount, mandate bounce
 */
import React, { useState, useMemo, useCallback } from "react";
import {
  Search, SlidersHorizontal, Plus, ChevronRight, X, Pause, Pencil, Ban,
  AlertCircle, Calendar, Info,
} from "lucide-react";

const AV_COLORS = ["#2456BE", "#0E9C8E", "#7A5AF8", "#E8943A", "#D6409F", "#16A35A"];
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0); }
function avColor(s) { return AV_COLORS[hashStr(s) % AV_COLORS.length]; }

const nf0 = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const inr0 = (n) => "₹" + nf0.format(Math.round(n ?? 0));

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

function statusClass(status) {
  const s = String(status).toLowerCase();
  if (s === "active") return "active";
  if (s === "paused") return "paused";
  if (s === "failed") return "failed";
  if (s.includes("pending")) return "pending";
  return "paused";
}

function SipStatusBadge({ status }) {
  return <span className={`sip-status ${statusClass(status)}`}>{status}</span>;
}

function SipsHero({ totalMonthly, activeCount, nextDebit, totalInvested, onPortfolio }) {
  return (
    <div className="sip-hero">
      <div className="sip-hero-lbl">Total monthly commitment</div>
      <div className="sip-hero-val num">{inr0(totalMonthly)}<span className="sip-hero-suffix">/ month</span></div>
      <div className="sip-hero-stats">
        <div className="st">
          <div className="k">Active SIPs</div>
          <div className="v num">{activeCount}</div>
        </div>
        <div className="st">
          <div className="k">Next debit</div>
          <div className="v">{nextDebit ?? "—"}</div>
        </div>
        <div className="st">
          <div className="k">Total invested</div>
          <div className="v num">{inr0(totalInvested)}</div>
        </div>
      </div>
      <button type="button" className="sip-hero-link" onClick={onPortfolio}>
        View portfolio for value &amp; returns <ChevronRight size={14}/>
      </button>
    </div>
  );
}

function MandateBounceBanner({ onFix, onDismiss }) {
  return (
    <div className="sip-bounce-banner">
      <div className="ic"><AlertCircle size={18}/></div>
      <div className="body">
        <div className="t">Mandate bounce</div>
        <div className="s">A SIP debit failed — update your bank mandate to avoid missed installments.</div>
        <button type="button" onClick={onFix}>Update now</button>
      </div>
      <button type="button" className="sip-bounce-x" onClick={onDismiss} aria-label="Dismiss"><X size={16}/></button>
    </div>
  );
}

function planLabel(planType) {
  if (planType === "stp") return "STP";
  if (planType === "swp") return "SWP";
  return "SIP";
}

function SipCard({ sip, fund, onManage, onFixMandate, fundById }) {
  const failed = sip.status === "Failed";
  const planType = sip.planType || "sip";
  const target = sip.targetSchemeCode ? fundById?.(sip.targetSchemeCode) : null;
  const dayLbl = planType === "swp" ? "SWP day" : planType === "stp" ? "STP day" : "SIP day";
  const nextLbl = planType === "swp" ? "Next withdrawal" : planType === "stp" ? "Next transfer" : "Next debit";
  return (
    <div className={`sip-card-v2 ${failed ? "failed" : ""}`}>
      <button type="button" className="sip-card-main" onClick={() => onManage(sip)}>
        <FundAvatar h={fund.h} size={38}/>
        <div className="meta">
          <div className="top">
            <div className="nm">
              <span className={`sip-plan-chip ${planType}`}>{planLabel(planType)}</span>
              {fund.s}
            </div>
            <SipStatusBadge status={sip.status}/>
          </div>
          <div className="sub">
            <span className="reg-badge" style={{ marginTop: 0, display: "inline-block" }}>Regular</span>
            <span>{fund.cat}</span>
          </div>
          {planType === "stp" && (
            <div className="sub" style={{ marginTop: 4 }}>
              → {target?.s || sip.targetName || sip.targetSchemeCode || "Destination scheme"}
            </div>
          )}
          <div className="amt num">{inr0(sip.amount)}<span> per month</span></div>
          <div className="det">
            <span>{dayLbl} · {ordinal(sip.day)}</span>
            <span>·</span>
            <span>{nextLbl} · {sip.nextDebit ?? "—"}</span>
          </div>
        </div>
        <ChevronRight size={16} color="var(--faint)"/>
      </button>
      {failed && planType === "sip" && (
        <div className="sip-fail-box">
          <Info size={14}/>
          <div>
            <b>{sip.failReason ?? "Debit failed"}</b>
            <button type="button" onClick={() => onFixMandate(sip)}>Update mandate</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ManageSipSheet({ sip, fund, onClose, onPause, onModify, onCancel, fundById }) {
  if (!sip || !fund) return null;
  const planType = sip.planType || "sip";
  const label = planLabel(planType);
  const target = sip.targetSchemeCode ? fundById?.(sip.targetSchemeCode) : null;
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab"/>
        <div className="sip-sheet-head">
          <h4>Manage {label}</h4>
          <button type="button" className="sip-sheet-x" onClick={onClose}><X size={20}/></button>
        </div>
        <div className="sip-sheet-fund">
          <FundAvatar h={fund.h}/>
          <div>
            <div className="nm">{fund.s}</div>
            <div className="sub">{inr0(sip.amount)}/month · {ordinal(sip.day)} of month</div>
            {planType === "stp" && (
              <div className="sub">→ {target?.s || sip.targetName || sip.targetSchemeCode}</div>
            )}
          </div>
        </div>
        <div className="sip-manage-menu">
          {[
            { ic: <Pause size={18}/>, t: `Pause ${label}`, s: "Temporarily stop future installments", action: onPause },
            { ic: <Pencil size={18}/>, t: "Modify amount", s: `Change monthly ${label} amount`, action: onModify },
            { ic: <Ban size={18}/>, t: `Cancel ${label}`, s: `Stop this ${label} permanently`, action: onCancel, danger: true },
          ].map((row) => (
            <button key={row.t} type="button" className={`sip-manage-row ${row.danger ? "danger" : ""}`} onClick={row.action}>
              <span className="ic">{row.ic}</span>
              <span className="txt">
                <b>{row.t}</b>
                <small>{row.s}</small>
              </span>
              <ChevronRight size={16} color="var(--faint)"/>
            </button>
          ))}
        </div>
        <div className="sip-sheet-info">
          <div><span>Next</span><b>{sip.nextDebit ?? "—"}</b></div>
          <div><span>Amount</span><b className="num">{inr0(sip.amount)}</b></div>
          <div><span>Bank</span><b>{sip.bankAccount ?? "HDFC Bank •••• 4521"}</b></div>
        </div>
        <p className="sip-sheet-tip">
          Changes apply from the next scheduled date. Systematic plans are order instructions — not investment advice.
        </p>
      </div>
    </div>
  );
}

function ModifyAmountSheet({ sip, fund, onClose, onConfirm, toast }) {
  const [amount, setAmount] = useState(sip?.amount ?? 5000);
  const [step, setStep] = useState("edit");

  if (!sip || !fund) return null;

  const min = fund.minSip ?? 500;
  const max = 100000;

  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab"/>
        <div className="sip-sheet-head">
          <h4>{step === "edit" ? "Modify SIP amount" : "Review changes"}</h4>
          <button type="button" className="sip-sheet-x" onClick={onClose}><X size={20}/></button>
        </div>
        <div className="sip-modify-current">
          <span>Current</span>
          <b className="num">{inr0(sip.amount)}/mo</b>
        </div>
        {step === "edit" ? (
          <>
            <div className="field-lbl">New amount</div>
            <div className="sip-amount-display num">{inr0(amount)}</div>
            <input
              type="range"
              className="sip-modify-slider"
              min={min}
              max={max}
              step={500}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
            <div className="sip-modify-range">
              <span>{inr0(min)}</span>
              <span>{inr0(max)}</span>
            </div>
            <div className="sip-amount-presets">
              {[500, 1000, 2500, 5000, 10000].filter((a) => a >= min && a <= max).map((a) => (
                <button key={a} type="button" className={`chip ${amount === a ? "on" : ""}`} onClick={() => setAmount(a)}>
                  {inr0(a)}
                </button>
              ))}
            </div>
            <button type="button" className="btn btn-grad btn-full" style={{ marginTop: 16 }} onClick={() => setStep("review")}>
              Review changes
            </button>
          </>
        ) : (
          <>
            <div className="sip-review-box">
              <div className="row"><span>Fund</span><b>{fund.s}</b></div>
              <div className="row"><span>Old amount</span><b className="num">{inr0(sip.amount)}/mo</b></div>
              <div className="row"><span>New amount</span><b className="num up">{inr0(amount)}/mo</b></div>
              <div className="row"><span>Effective from</span><b>Next debit · {sip.nextDebit ?? "—"}</b></div>
            </div>
            <button type="button" className="btn btn-grad btn-full" onClick={() => onConfirm(amount)}>
              Confirm modification
            </button>
            <button type="button" className="discover-clear-btn" style={{ width: "100%", marginTop: 10 }} onClick={() => setStep("edit")}>
              Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function FailedMandateModal({ sip, fund, onClose, onUpdate, onViewAll }) {
  if (!sip || !fund) return null;
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet sip-fail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="grab"/>
        <div className="sip-sheet-head">
          <h4>Mandate bounce</h4>
          <button type="button" className="sip-sheet-x" onClick={onClose}><X size={20}/></button>
        </div>
        <div className="sip-fail-modal-body">
          <p className="lead">
            SIP debit on <b>{sip.nextDebit}</b> for <b>{fund.s}</b> did not go through.
          </p>
          <div className="reason"><AlertCircle size={16}/> {sip.failReason ?? "Insufficient balance"}</div>
          <div className="block">
            <h5>What happens now?</h5>
            <p>We will retry on <b>{sip.retryDate ?? "next business day"}</b>. If it fails again, this SIP may be paused.</p>
          </div>
          <div className="block">
            <h5>How to fix</h5>
            <ol>
              <li>Ensure sufficient balance in {sip.bankAccount ?? "your linked account"}</li>
              <li>Or update your e-mandate / UPI AutoPay limit</li>
              <li>Contact support if the issue persists</li>
            </ol>
          </div>
        </div>
        <button type="button" className="btn btn-grad btn-full" onClick={onUpdate}>Update mandate</button>
        <button type="button" className="discover-clear-btn" style={{ width: "100%", marginTop: 10 }} onClick={onViewAll}>
          View all failed SIPs
        </button>
      </div>
    </div>
  );
}

/**
 * @param {{ sips, setSips, holdings, navs, openFund, fundById, go, toast }} props
 */
export default function SipsScreen({ sips, setSips, holdings, fundById, go, toast }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [planTab, setPlanTab] = useState("all");
  const [bounceDismissed, setBounceDismissed] = useState(false);
  const [manageSip, setManageSip] = useState(null);
  const [modifySip, setModifySip] = useState(null);
  const [failSip, setFailSip] = useState(null);

  const totalInvested = useMemo(() => {
    return holdings.reduce((sum, h) => sum + h.units * h.avgNav, 0);
  }, [holdings]);

  const enriched = useMemo(() => {
    return sips.map((s) => ({
      sip: { ...s, planType: s.planType || "sip" },
      fund: fundById(s.id),
    })).filter((x) => x.fund);
  }, [sips, fundById]);

  const byPlan = useMemo(() => {
    if (planTab === "all") return enriched;
    return enriched.filter((x) => x.sip.planType === planTab);
  }, [enriched, planTab]);

  const activeSips = byPlan.filter((x) => x.sip.status === "Active");
  const totalMonthly = activeSips.reduce((a, x) => a + x.sip.amount, 0);
  const nextDebit = activeSips.sort((a, b) => String(a.sip.nextDebit).localeCompare(String(b.sip.nextDebit)))[0]?.sip.nextDebit;
  const hasFailed = byPlan.some((x) => x.sip.status === "Failed" && x.sip.planType === "sip");

  const filtered = useMemo(() => {
    let arr = [...byPlan];
    if (q.trim()) {
      const k = q.toLowerCase();
      arr = arr.filter((x) => x.fund.s.toLowerCase().includes(k) || x.fund.h.toLowerCase().includes(k)
        || String(x.sip.targetName || "").toLowerCase().includes(k));
    }
    if (filter === "active") arr = arr.filter((x) => x.sip.status === "Active");
    else if (filter === "paused") arr = arr.filter((x) => x.sip.status === "Paused");
    else if (filter === "failed") arr = arr.filter((x) => x.sip.status === "Failed");
    return arr;
  }, [byPlan, q, filter]);

  const upcoming = useMemo(() => {
    return [...activeSips]
      .sort((a, b) => a.sip.day - b.sip.day)
      .slice(0, 5)
      .map((x) => ({
        date: x.sip.nextDebit,
        label: `${planLabel(x.sip.planType)} · ${x.fund.h} · ${inr0(x.sip.amount)}`,
        day: `${x.sip.planType}-${x.sip.day}-${x.sip.id}`,
      }));
  }, [activeSips]);

  const sipKey = (s) => s.sipKey ?? `${s.planType || "sip"}-${s.id}-${s.day}-${s.targetSchemeCode || ""}`;

  const updateSip = useCallback((target, patch) => {
    setSips((prev) => prev.map((s) => (sipKey(s) === sipKey(target) ? { ...s, ...patch } : s)));
  }, [setSips]);

  const handlePause = () => {
    if (!manageSip) return;
    const label = planLabel(manageSip.planType || "sip");
    updateSip(manageSip, { status: "Paused", nextDebit: "—" });
    toast(`${label} paused — resumes when you unpause`);
    setManageSip(null);
  };

  const handleCancel = () => {
    if (!manageSip) return;
    const label = planLabel(manageSip.planType || "sip");
    setSips((prev) => prev.filter((s) => sipKey(s) !== sipKey(manageSip)));
    toast(`${label} cancelled`);
    setManageSip(null);
  };

  const handleModifyConfirm = (newAmount) => {
    if (!modifySip) return;
    const label = planLabel(modifySip.planType || "sip");
    updateSip(modifySip, { amount: newAmount });
    toast(`${label} amount updated to ${inr0(newAmount)}/month`);
    setModifySip(null);
    setManageSip(null);
  };

  const filterCycle = () => {
    const order = ["all", "active", "paused", "failed"];
    const i = order.indexOf(filter);
    setFilter(order[(i + 1) % order.length]);
  };

  const filterLabel = { all: "All", active: "Active", paused: "Paused", failed: "Failed" }[filter];

  return (
    <>
      <div className="scroll sip-scroll">
        <SipsHero
          totalMonthly={totalMonthly}
          activeCount={activeSips.length}
          nextDebit={nextDebit}
          totalInvested={totalInvested}
          onPortfolio={() => go("portfolio")}
        />

        <div className="sip-plan-tabs">
          {[
            { k: "all", t: "All" },
            { k: "sip", t: "SIP" },
            { k: "stp", t: "STP" },
            { k: "swp", t: "SWP" },
          ].map((t) => (
            <button key={t.k} type="button" className={planTab === t.k ? "on" : ""} onClick={() => setPlanTab(t.k)}>
              {t.t}
            </button>
          ))}
        </div>

        {hasFailed && !bounceDismissed && (
          <MandateBounceBanner
            onFix={() => {
              const f = enriched.find((x) => x.sip.status === "Failed" && x.sip.planType === "sip");
              if (f) setFailSip(f.sip);
            }}
            onDismiss={() => setBounceDismissed(true)}
          />
        )}

        <div className="sip-toolbar">
          <div className="discover-search" style={{ marginBottom: 0, flex: 1 }}>
            <Search size={18} color="var(--faint)"/>
            <input placeholder="Search plans" value={q} onChange={(e) => setQ(e.target.value)}/>
          </div>
          <button type="button" className="discover-filter-btn" onClick={filterCycle}>
            <SlidersHorizontal size={15}/> {filterLabel}
          </button>
        </div>

        <div className="sip-list">
          {filtered.length === 0 && (
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", padding: "12px 4px" }}>
              No {planTab === "all" ? "systematic plans" : planLabel(planTab) + "s"} yet. Open a holding to register Switch / STP / SWP.
            </p>
          )}
          {filtered.map(({ sip, fund }) => (
            <SipCard
              key={sipKey(sip)}
              sip={sip}
              fund={fund}
              fundById={fundById}
              onManage={setManageSip}
              onFixMandate={setFailSip}
            />
          ))}
        </div>

        <details className="sip-upcoming-fold">
          <summary>
            <Calendar size={16}/>
            Upcoming debits (next 7 days)
            <ChevronRight size={14} className="chev"/>
          </summary>
          <div className="inner">
            {upcoming.length === 0 ? (
              <p style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>No active debits scheduled.</p>
            ) : upcoming.map((u) => (
              <div key={u.day} className="sip-upcoming-row">
                <span className="d">{u.date}</span>
                <span className="l">{u.label}</span>
              </div>
            ))}
          </div>
        </details>

        <details className="compliance-fold" style={{ marginTop: 14 }}>
          <summary>
            Mutual fund investments are subject to market risks…
            <ChevronRight size={14} style={{ transform: "rotate(90deg)", flex: "none" }}/>
          </summary>
          <div className="body">
            SIP / STP / SWP amounts and dates are factual order data. Past performance does not guarantee future results.
          </div>
        </details>
      </div>

      <button type="button" className="sip-fab" onClick={() => go("discover")}>
        <Plus size={22}/>
        <span>New SIP</span>
      </button>

      {manageSip && !modifySip && (
        <ManageSipSheet
          sip={manageSip}
          fund={fundById(manageSip.id)}
          fundById={fundById}
          onClose={() => setManageSip(null)}
          onPause={handlePause}
          onModify={() => setModifySip(manageSip)}
          onCancel={handleCancel}
        />
      )}

      {modifySip && (
        <ModifyAmountSheet
          sip={modifySip}
          fund={fundById(modifySip.id)}
          onClose={() => { setModifySip(null); }}
          onConfirm={handleModifyConfirm}
          toast={toast}
        />
      )}

      {failSip && (
        <FailedMandateModal
          sip={failSip}
          fund={fundById(failSip.id)}
          onClose={() => setFailSip(null)}
          onUpdate={() => { toast("Mandate update — production BSE/NSE rails"); setFailSip(null); }}
          onViewAll={() => { setFilter("failed"); setFailSip(null); }}
        />
      )}
    </>
  );
}
