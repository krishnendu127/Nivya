/**
 * Portfolio tab — Overview | Holdings | Insights
 */
import React, { useState, useMemo } from "react";
import {
  Eye, EyeOff, TrendingUp, TrendingDown, ChevronRight, Search, SlidersHorizontal,
  Calculator, Download, Upload, AlertTriangle, ExternalLink, HelpCircle, Newspaper,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { buildPortfolioInsights, illustrativeFutureValue } from "./nivya-api.js";

const AV_COLORS = ["#2456BE", "#0E9C8E", "#7A5AF8", "#E8943A", "#D6409F", "#16A35A"];
const ALLOC_COLORS = { Equity: "#2456BE", Hybrid: "#0E9C8E", Debt: "#7A5AF8", Others: "#E8943A", Cash: "#94A3B8" };
const CHART_TFS = ["1M", "1Y", "3Y", "5Y"];

const nf = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
const nf0 = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const inr = (n) => "₹" + nf.format(n ?? 0);
const inr0 = (n) => "₹" + nf0.format(Math.round(n ?? 0));
const signInr = (n) => (n >= 0 ? "+" : "−") + inr(Math.abs(n));
const signPct = (n) => (n >= 0 ? "+" : "−") + Math.abs(n * 100).toFixed(2) + "%";

function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0); }
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function avColor(s) { return AV_COLORS[hashStr(s) % AV_COLORS.length]; }

function genSeries(sym, tf, price) {
  const conf = {
    "1M": { n: 30, vol: 0.03, rmin: -0.07, rmax: 0.12 },
    "1Y": { n: 52, vol: 0.05, rmin: -0.12, rmax: 0.34 },
    "3Y": { n: 36, vol: 0.08, rmin: -0.05, rmax: 0.45 },
    "5Y": { n: 60, vol: 0.1, rmin: 0, rmax: 0.55 },
  }[tf] ?? { n: 52, vol: 0.05, rmin: -0.12, rmax: 0.34 };
  const rng = mulberry32(hashStr(sym + tf));
  const start = price * (1 - (conf.rmin + rng() * (conf.rmax - conf.rmin)));
  const w = [0];
  for (let i = 1; i < conf.n; i++) w.push(w[i - 1] + (rng() - 0.5));
  const last = w[conf.n - 1];
  let maxAbs = 0;
  for (let i = 0; i < conf.n; i++) { w[i] = w[i] - last * (i / (conf.n - 1)); maxAbs = Math.max(maxAbs, Math.abs(w[i])); }
  maxAbs = maxAbs || 1;
  const amp = price * conf.vol;
  const out = [];
  for (let i = 0; i < conf.n; i++) {
    const t = i / (conf.n - 1);
    const base = start + (price - start) * t;
    out.push({ t: i, v: Math.max(base + (w[i] / maxAbs) * amp, price * 0.4) });
  }
  out[conf.n - 1].v = price;
  return out;
}

function calcPortfolio(holdings, navs) {
  let inv = 0, cur = 0, day = 0;
  holdings.forEach((h) => {
    const n = navs[h.id];
    if (!n) return;
    inv += h.units * h.avgNav;
    cur += h.units * n.nav;
    day += h.units * (n.nav - n.prevNav);
  });
  return { inv, cur, day, ret: cur - inv, retPct: inv ? (cur - inv) / inv : 0, dayPct: cur ? day / (cur - day) : 0 };
}

function toAssetClass(cat) {
  const c = String(cat ?? "").toLowerCase();
  if (/liquid|overnight|money/.test(c)) return "Cash";
  if (/debt|gilt|bond|income|short duration/.test(c)) return "Debt";
  if (/hybrid|balanced/.test(c)) return "Hybrid";
  if (/cap|elss|index|equity|sector|contra|flexi|mid/.test(c)) return "Equity";
  return "Others";
}

function FundAvatar({ h, size = 40 }) {
  return (
    <div className="av" style={{ background: avColor(h), width: size, height: size, borderRadius: 12, fontSize: size * 0.32 }}>
      {h.slice(0, 2).toUpperCase()}
    </div>
  );
}

function ChartTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--navy)", color: "#fff", padding: "5px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: "var(--mono)" }}>
      {inr(payload[0].value)}
    </div>
  );
}

function PortfolioSubNav({ segment, onChange }) {
  const items = [
    { k: "overview", t: "Overview" },
    { k: "holdings", t: "Holdings" },
    { k: "insights", t: "Insights" },
  ];
  return (
    <div className="pf-subnav">
      {items.map(({ k, t }) => (
        <button key={k} type="button" className={`pf-subnav-btn ${segment === k ? "on" : ""}`} onClick={() => onChange(k)}>
          {t}
        </button>
      ))}
    </div>
  );
}

function PortfolioHero({ pf, activeSips, balVis, setBalVis }) {
  const dayUp = pf.day >= 0;
  const retUp = pf.ret >= 0;
  const asOn = new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="pf-hero">
      <div className="pf-hero-top">
        <span className="pf-hero-lbl">Your wealth</span>
        <button type="button" className="home-hero-eye" onClick={() => setBalVis((v) => !v)} aria-label={balVis ? "Hide" : "Show"}>
          {balVis ? <Eye size={16}/> : <EyeOff size={16}/>}
        </button>
      </div>
      <div className="pf-hero-val num">{balVis ? inr0(pf.cur) : "₹ ••••••"}</div>
      <div className={`pf-hero-ret ${retUp ? "up" : "down"}`}>
        {retUp ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
        Total returns {balVis ? `${signInr(pf.ret)} (${signPct(pf.retPct)})` : "•••"}
      </div>
      <div className="pf-hero-stats">
        <div className="st">
          <div className="k">Invested</div>
          <div className="v num">{balVis ? inr0(pf.inv) : "••••"}</div>
        </div>
        <div className="st">
          <div className="k">1D change</div>
          <div className={`v num ${dayUp ? "up" : "down"}`}>{balVis ? signInr(pf.day) : "•••"}</div>
        </div>
        <div className="st">
          <div className="k">Active SIPs</div>
          <div className="v num">{activeSips}</div>
        </div>
      </div>
      <div className="pf-hero-foot">
        <span>As on {asOn}</span>
        <span>Cost-basis return {balVis ? signPct(pf.retPct) : "•••"} · Personal XIRR — coming soon</span>
      </div>
    </div>
  );
}

function PortfolioTrendChart({ value, up, tf, onTf, toast }) {
  const data = useMemo(() => genSeries("PORTFOLIO", tf, value), [tf, value]);
  const gradId = "pfChartGrad";

  return (
    <div className="pf-section-card">
      <div className="pf-sec-head">
        <h3>Portfolio trend (past)</h3>
        <div className="pf-tf-chips">
          {CHART_TFS.map((t) => (
            <button key={t} type="button" className={`pf-tf-chip ${tf === t ? "on" : ""}`} onClick={() => onTf(t)}>{t}</button>
          ))}
        </div>
      </div>
      <div className="pf-chart-wrap">
        <ResponsiveContainer width="100%" height={148}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={up ? "#16A35A" : "#E0444B"} stopOpacity={0.22}/>
                <stop offset="100%" stopColor={up ? "#16A35A" : "#E0444B"} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="t" hide/>
            <YAxis domain={["auto", "auto"]} hide/>
            <Tooltip content={<ChartTip/>}/>
            <Area type="monotone" dataKey="v" stroke={up ? "#16A35A" : "#E0444B"} strokeWidth={2} fill={`url(#${gradId})`}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <button type="button" className="pf-link-btn" onClick={() => toast("Full portfolio chart — coming with transaction history")}>
        View full chart <ExternalLink size={13}/>
      </button>
      <div className="pf-info-banner">
        <HelpCircle size={14}/>
        <span>Past portfolio trend is illustrative in demo · <button type="button" onClick={() => toast("XIRR uses dated cash flows — available when transaction history is connected")}>How is XIRR calculated?</button></span>
      </div>
    </div>
  );
}

function CategoryAllocation({ assetRows, total }) {
  if (!assetRows.length) return null;
  return (
    <div className="pf-section-card">
      <div className="pf-sec-head"><h3>Category allocation</h3></div>
      <div className="pf-alloc-bar">
        {assetRows.map((a) => (
          <i key={a.label} style={{ width: `${a.weightPct}%`, background: ALLOC_COLORS[a.label] ?? avColor(a.label) }} title={`${a.label} ${a.weightPct}%`}/>
        ))}
      </div>
      <div className="pf-alloc-legend">
        {assetRows.map((a) => (
          <div key={a.label} className="pf-alloc-row">
            <span className="sw" style={{ background: ALLOC_COLORS[a.label] ?? avColor(a.label) }}/>
            <span className="nm">{a.label}</span>
            <span className="pct num">{a.weightPct}%</span>
            <span className="val num">{inr0(a.valueInr)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopHoldingsBars({ rows, total, onOpen }) {
  const top = rows.slice(0, 5);
  const rest = rows.slice(5);
  const restVal = rest.reduce((s, r) => s + r.value, 0);
  const restPct = total ? (restVal / total) * 100 : 0;

  return (
    <div className="pf-section-card">
      <div className="pf-sec-head"><h3>Top holdings by allocation</h3></div>
      {top.map((r) => {
        const pct = total ? (r.value / total) * 100 : 0;
        return (
          <button key={r.h.id} type="button" className="pf-hold-bar-row" onClick={() => onOpen(r.f)}>
            <div className="meta">
              <div className="nm">{r.f.s}</div>
              <div className="track"><div className="fill" style={{ width: `${pct}%`, background: avColor(r.f.h) }}/></div>
            </div>
            <div className="pct num">{pct.toFixed(1)}%</div>
          </button>
        );
      })}
      {rest.length > 0 && (
        <div className="pf-hold-bar-row static">
          <div className="meta">
            <div className="nm">Others ({rest.length} funds)</div>
            <div className="track"><div className="fill" style={{ width: `${restPct}%`, background: "var(--faint)" }}/></div>
          </div>
          <div className="pct num">{restPct.toFixed(1)}%</div>
        </div>
      )}
    </div>
  );
}

function IllustrativeCalcCard({ current, toast }) {
  const [years, setYears] = useState(5);
  const [rate, setRate] = useState(8);
  const future = illustrativeFutureValue(current, years, rate);
  const gain = future - current;

  return (
    <div className="pf-calc-card">
      <div className="pf-calc-ic"><Calculator size={22}/></div>
      <div className="pf-calc-body">
        <h4>Illustrative growth calculator</h4>
        <p>If ₹{nf0.format(current)} grew at {rate}% p.a. for {years}Y → <b className="num">{inr0(future)}</b> ({signInr(gain)})</p>
        <div className="pf-calc-sliders">
          <input type="range" min={1} max={15} value={years} onChange={(e) => setYears(Number(e.target.value))}/>
          <input type="range" min={4} max={14} step={0.5} value={rate} onChange={(e) => setRate(Number(e.target.value))}/>
        </div>
        <span className="pf-calc-note">You choose the rate · Illustrative only · Not advice</span>
      </div>
      <ChevronRight size={18} color="var(--faint)"/>
    </div>
  );
}

function HoldingsPanel({ rows, openFund }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("value-desc");

  const list = useMemo(() => {
    let arr = [...rows];
    if (q.trim()) {
      const k = q.toLowerCase();
      arr = arr.filter((r) => r.f.s.toLowerCase().includes(k) || r.f.h.toLowerCase().includes(k));
    }
    if (sort === "value-desc") arr.sort((a, b) => b.value - a.value);
    else if (sort === "name-asc") arr.sort((a, b) => a.f.s.localeCompare(b.f.s));
    else if (sort === "pnl-desc") arr.sort((a, b) => b.pnl - a.pnl);
    return arr;
  }, [rows, q, sort]);

  return (
    <div>
      <div className="pf-holdings-toolbar">
        <div className="discover-search" style={{ marginBottom: 0, flex: 1 }}>
          <Search size={18} color="var(--faint)"/>
          <input placeholder="Search holdings…" value={q} onChange={(e) => setQ(e.target.value)}/>
        </div>
        <button type="button" className="discover-filter-btn" onClick={() => setSort(sort === "value-desc" ? "pnl-desc" : sort === "pnl-desc" ? "name-asc" : "value-desc")}>
          <SlidersHorizontal size={15}/> Filter &amp; sort
        </button>
      </div>
      <div className="pf-holdings-count">{list.length} Regular-plan holdings · Past P&amp;L on cost basis</div>
      <div className="pf-holdings-list">
        {list.map(({ h, f, q: navQ, value, pnl, pnlPct }) => {
          const up = pnl >= 0;
          return (
            <button key={h.id} type="button" className="pf-holding-row" onClick={() => openFund(f)}>
              <FundAvatar h={f.h} size={38}/>
              <div className="meta">
                <div className="nm">{f.s}</div>
                <div className="sub">
                  <span className="reg-badge" style={{ marginTop: 0, display: "inline-block" }}>Regular</span>
                  <span>{h.units.toFixed(2)} units · NAV {inr(navQ.nav)}</span>
                </div>
              </div>
              <div className="right">
                <div className="price num">{inr0(value)}</div>
                <div className={`chg num ${up ? "up" : "down"}`}>{signInr(pnl)} ({signPct(pnlPct)})</div>
              </div>
              <ChevronRight size={16} color="var(--faint)"/>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function InsightsPanel({ insights, rows, total, insightsView, setInsightsView, openFund }) {
  const weighted5y = useMemo(() => {
    let w = 0, cover = 0;
    for (const r of rows) {
      const ret = r.f?.r5;
      if (ret == null) continue;
      const weight = r.value / total;
      w += weight * ret;
      cover += weight;
    }
    return cover ? Math.round((w / cover) * 10) / 10 : null;
  }, [rows, total]);

  const equityPct = insights.allocation.byCategory
    .filter((c) => toAssetClass(c.label) === "Equity")
    .reduce((s, c) => s + c.weightPct, 0);

  const keyFlags = insights.concentration.flags.slice(0, 3);
  const allFlags = [
    ...insights.concentration.flags,
    ...(equityPct >= 40 ? [{
      code: "CATEGORY_EQUITY",
      text: `Equity-oriented categories are ${equityPct.toFixed(1)}% of portfolio value`,
      warn: equityPct >= 50,
    }] : []),
  ];

  const displayFlags = insightsView === "key" ? keyFlags : allFlags;
  const pulseItems = insights.holdingPulse?.items ?? [];
  const newsItems = insights.relatedNews?.items ?? [];

  return (
    <div>
      <div className="pf-insights-tabs">
        {["key", "all"].map((v) => (
          <button key={v} type="button" className={`pf-insights-tab ${insightsView === v ? "on" : ""}`} onClick={() => setInsightsView(v)}>
            {v === "key" ? "Key insights" : "All insights"}
          </button>
        ))}
      </div>

      <div className="pf-section-card">
        <div className="pf-sec-head"><h3>Weighted CAGR (past)</h3></div>
        <div className="pf-cagr-grid">
          {[["Past 1Y", insights.pastPerformance.weightedReturn1y], ["Past 3Y", insights.pastPerformance.weightedReturn3y], ["Past 5Y", weighted5y]].map(([lbl, val]) => (
            <div key={lbl} className="pf-cagr-cell">
              <div className="k">{lbl}</div>
              <div className="v num up">{val != null ? `${val}%` : "—"}</div>
            </div>
          ))}
        </div>
        <p className="pf-insight-note">{insights.pastPerformance.note}</p>
      </div>

      {pulseItems.length > 0 && (
        <div className="pf-section-card">
          <div className="pf-sec-head"><h3>Holding pulse (past peers)</h3></div>
          <div className="pf-pulse-list">
            {pulseItems.map((item) => {
              const tone =
                item.label === "ahead_of_peers_past" ? "ahead"
                  : item.label === "trailing_peers_past" ? "trail"
                    : "near";
              return (
                <button
                  key={item.schemeCode}
                  type="button"
                  className="pf-pulse-row"
                  onClick={() => { const hit = rows.find((r) => (r.f?.id === item.schemeCode) || (r.h?.id === item.schemeCode)); if (hit?.f) openFund?.(hit.f); }}
                >
                  <div className="pf-pulse-main">
                    <b>{item.schemeName}</b>
                    <span>{item.category}{item.weightPct != null ? ` · ${item.weightPct}% of portfolio` : ""}</span>
                  </div>
                  <div className="pf-pulse-metrics">
                    <div className="pf-pulse-nums">
                      <span><em>Fund 3Y</em> <b className="num">{item.pastReturn3y != null ? `${item.pastReturn3y}%` : "—"}</b></span>
                      <span><em>Cat. median</em> <b className="num">{item.categoryMedian3y != null ? `${item.categoryMedian3y}%` : "—"}</b></span>
                    </div>
                    <span className={`pf-pulse-chip ${tone}`}>{item.labelText}</span>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="pf-insight-note">{insights.holdingPulse?.note}</p>
        </div>
      )}

      {displayFlags.length > 0 && (
        <div className="pf-section-card">
          <div className="pf-sec-head"><h3>Concentration check</h3></div>
          {displayFlags.map((f) => (
            <div key={f.code} className={`pf-flag-row ${f.warn !== false ? "warn" : ""}`}>
              <AlertTriangle size={16}/>
              <span>{f.text}</span>
            </div>
          ))}
        </div>
      )}

      {insights.allocation.byAmc[0] && (
        <div className="pf-section-card">
          <div className="pf-sec-head"><h3>AMC concentration</h3></div>
          <div className="pf-insight-stat">
            <span>{insights.allocation.byAmc[0].label}</span>
            <b className="num">{insights.allocation.byAmc[0].weightPct}%</b>
          </div>
          <p className="pf-insight-note">Factual share of portfolio value with this fund house.</p>
        </div>
      )}

      {newsItems.length > 0 && (
        <div className="pf-section-card">
          <div className="pf-sec-head">
            <h3>Related context</h3>
            <span className="pf-sec-tag">Demo headlines</span>
          </div>
          <div className="pf-news-list">
            {newsItems.map((n) => (
              <div key={n.id} className="pf-news-card">
                <div className="pf-news-ic"><Newspaper size={16} /></div>
                <div className="pf-news-body">
                  <b>{n.headline}</b>
                  <span className="pf-news-meta">{n.source} · {n.publishedAt}</span>
                  <span className="pf-news-match">
                    Linked to: {n.matchedHoldings.map((h) => h.schemeName).slice(0, 2).join(", ")}
                    {n.matchedHoldings.length > 2 ? ` +${n.matchedHoldings.length - 2}` : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="pf-insight-note">{insights.relatedNews?.note}</p>
        </div>
      )}

      <p className="pf-compliant-foot">
        Insights are factual portfolio statistics and informational context — not financial advice or a recommendation to rebalance.
      </p>
    </div>
  );
}

/**
 * @param {{ navs, holdings, sips, openFund, fundById, toast }} props
 */
export default function PortfolioScreen({ navs, holdings, sips, openFund, fundById, funds, toast }) {
  const [segment, setSegment] = useState("overview");
  const [balVis, setBalVis] = useState(true);
  const [chartTf, setChartTf] = useState("1Y");
  const [insightsView, setInsightsView] = useState("key");

  const activeSips = sips.filter((s) => s.status === "Active").length;

  const data = useMemo(() => {
    const pf = calcPortfolio(holdings, navs);
    const rows = holdings.map((h) => {
      const f = fundById(h.id);
      const q = navs[h.id];
      if (!f || !q) return null;
      const value = h.units * q.nav;
      const cost = h.units * h.avgNav;
      const pnl = value - cost;
      return { h, f, q, value, cost, pnl, pnlPct: cost ? pnl / cost : 0 };
    }).filter(Boolean).sort((a, b) => b.value - a.value);
    const insights = buildPortfolioInsights(holdings, fundById, navs, funds);
    const total = pf.cur || 1;
    const assetMap = new Map();
    for (const r of rows) {
      const ac = toAssetClass(r.f.cat);
      assetMap.set(ac, (assetMap.get(ac) ?? 0) + r.value);
    }
    const assetRows = [...assetMap.entries()]
      .map(([label, valueInr]) => ({ label, valueInr, weightPct: Math.round((valueInr / total) * 1000) / 10 }))
      .sort((a, b) => b.valueInr - a.valueInr);
    return { pf, rows, insights, total, assetRows };
  }, [holdings, navs, fundById, funds]);

  return (
    <div className="scroll pf-scroll">
      <PortfolioSubNav segment={segment} onChange={setSegment}/>

      {segment === "overview" && (
        <>
          <PortfolioHero pf={data.pf} activeSips={activeSips} balVis={balVis} setBalVis={setBalVis}/>
          <PortfolioTrendChart value={data.pf.cur} up={data.pf.ret >= 0} tf={chartTf} onTf={setChartTf} toast={toast}/>
          <CategoryAllocation assetRows={data.assetRows} total={data.total}/>
          <TopHoldingsBars rows={data.rows} total={data.total} onOpen={openFund}/>
          <IllustrativeCalcCard current={data.pf.cur} toast={toast}/>
          <div className="pf-action-row">
            <button type="button" className="pf-action-btn" onClick={() => toast("Import external MF — coming soon")}>
              <Upload size={18}/>
              <span>Import external MF</span>
              <em>Coming soon</em>
            </button>
            <button type="button" className="pf-action-btn" onClick={() => toast("Statement download — coming soon")}>
              <Download size={18}/>
              <span>Download statement</span>
            </button>
          </div>
          <details className="compliance-fold" style={{ marginTop: 14 }}>
            <summary>
              Mutual fund investments are subject to market risks…
              <ChevronRight size={14} style={{ transform: "rotate(90deg)", flex: "none" }}/>
            </summary>
            <div className="body">
              Portfolio values use latest available NAV. Past performance does not guarantee future results.
              This is factual data — not investment advice.
            </div>
          </details>
        </>
      )}

      {segment === "holdings" && (
        <HoldingsPanel rows={data.rows} openFund={openFund}/>
      )}

      {segment === "insights" && (
        <InsightsPanel
          insights={data.insights}
          rows={data.rows}
          total={data.total}
          insightsView={insightsView}
          setInsightsView={setInsightsView}
          openFund={openFund}
        />
      )}
    </div>
  );
}
