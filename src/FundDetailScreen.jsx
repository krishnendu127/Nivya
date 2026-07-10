/**
 * Fund detail overlay — NAV, chart, holdings, stats, documents, trade actions
 */
import React, { useMemo, useState } from "react";
import {
  ArrowLeft, Star, Share2, ChevronRight, BadgeCheck, Info, Expand,
  GitCompare, MessageCircle, Bell, ExternalLink, FileText, RefreshCw,
  EyeOff, Wallet, Zap, Coins, BarChart3, Clock, Calendar,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

const AV_COLORS = ["#2456BE", "#0E9C8E", "#7A5AF8", "#E8943A", "#D6409F", "#16A35A"];
const CHART_TFS = ["1W", "1M", "1Y", "3Y", "5Y"];

const nf = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nf0 = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const inr = (n) => "₹" + nf.format(n ?? 0);
const inr0 = (n) => "₹" + nf0.format(Math.round(n ?? 0));
const signPct = (c) => (c >= 0 ? "+" : "") + (c * 100).toFixed(2) + "%";
const signInr = (n) => (n >= 0 ? "+" : "−") + "₹" + nf.format(Math.abs(n));

function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0); }
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function avColor(s) { return AV_COLORS[hashStr(s) % AV_COLORS.length]; }

function genSeries(sym, tf, price, prevNav) {
  const conf = {
    "1W": { n: 34, vol: 0.014, rmin: -0.04, rmax: 0.06 },
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

function demoAumCr(fundId) {
  const map = {
    "ppfas-fc": 38562, "nippon-sc": 48210, "hdfc-ba": 86240, "quant-sc": 22480,
    "mirae-lc": 31890, "axis-lc": 29150, "sbi-contra": 26700, "icici-tech": 14200,
    "hdfc-elss": 15680, "nippon-liquid": 89400,
  };
  return map[fundId] ?? 18000 + (hashStr(fundId) % 25000);
}

function fundSizeLabel(aumCr) {
  if (aumCr >= 50000) return "Very Large";
  if (aumCr >= 20000) return "Large";
  if (aumCr >= 5000) return "Mid";
  return "Small";
}

function aboutFund(fund) {
  const texts = {
    "Flexi Cap": `${fund.s} invests across market caps with flexibility to shift allocation based on market conditions. Suitable for long-term wealth creation with equity exposure.`,
    "Small Cap": `${fund.s} focuses on small-cap companies with higher growth potential. Past performance is illustrative; small-cap funds can be volatile.`,
    "Large Cap": `${fund.s} invests predominantly in large, established companies. Aims for relatively stable long-term growth compared to mid/small-cap peers.`,
    "Hybrid": `${fund.s} dynamically allocates between equity and debt. Designed to manage volatility while participating in equity upside.`,
    "ELSS": `${fund.s} is an ELSS fund with a 3-year lock-in. Offers tax deduction under Section 80C subject to limits. Equity-oriented with associated market risk.`,
    "Liquid": `${fund.s} invests in very short-term debt and money market instruments. Lower risk than equity funds; returns are not guaranteed.`,
    "Contra": `${fund.s} follows a contrarian investment approach, seeking value in out-of-favour stocks.`,
    "Sectoral": `${fund.s} concentrates on a specific sector. Higher concentration risk than diversified equity funds.`,
  };
  return texts[fund.cat] ?? `${fund.s} is offered as a Regular plan through Nivya. Read the SID and KIM before investing.`;
}

function whyTags(fund) {
  const tags = [];
  if (fund.r3 >= 18) tags.push("Strong 3Y performance");
  if (fund.r5 >= 15) tags.push("Consistent return quality");
  if (fund.expense <= 0.7) tags.push("Competitive expense ratio");
  if (fund.r1 > fund.r3) tags.push("Recent 1Y momentum");
  if (tags.length === 0) tags.push("Category benchmark data available");
  return tags.slice(0, 4);
}

function FundAvatar({ h, size = 44 }) {
  return (
    <div className="av" style={{ background: avColor(h), width: size, height: size, borderRadius: 12, fontSize: size * 0.32 }}>
      {h.slice(0, 2).toUpperCase()}
    </div>
  );
}

function Riskometer({ risk }) {
  const r = String(risk ?? "Moderate").toLowerCase();
  let level = 2;
  let label = "Moderate";
  let color = "#2456BE";
  if (r.includes("very high")) { level = 5; label = "Very High"; color = "#E0444B"; }
  else if (r.includes("high")) { level = 4; label = "High"; color = "#E8943A"; }
  else if (r.includes("low")) { level = 1; label = "Low"; color = "#16A35A"; }
  const angle = -180 + (level / 5) * 180;
  const rad = (angle * Math.PI) / 180;
  const cx = 40;
  const cy = 38;
  const nx = cx + 26 * Math.cos(rad);
  const ny = cy + 26 * Math.sin(rad);
  return (
    <div className="discover-riskometer">
      <svg width="72" height="44" viewBox="0 0 80 48" aria-hidden>
        <path d="M 8 38 A 32 32 0 0 1 72 38" fill="none" stroke="#EAECF0" strokeWidth="6" strokeLinecap="round"/>
        <path d="M 8 38 A 32 32 0 0 1 72 38" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${(level / 5) * 100} 100`}/>
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r="3" fill={color}/>
      </svg>
      <span className="discover-riskometer-lbl">{label}</span>
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

function PerformanceChart({ sym, tf, nav, prevNav, up, chartError, onRetry }) {
  const data = useMemo(() => genSeries(sym, tf, nav, prevNav), [sym, tf, nav, prevNav]);
  if (chartError) {
    return (
      <div className="fd-chart-error">
        <EyeOff size={28} color="var(--faint)"/>
        <b>Unable to load chart</b>
        <p>Check your connection and try again</p>
        <button type="button" onClick={onRetry}><RefreshCw size={14}/> Retry</button>
      </div>
    );
  }
  const ys = data.map((d) => d.v);
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  const pad = (max - min) * 0.12 || 1;
  const color = up ? "var(--up)" : "var(--down)";
  const id = `fd-${sym}-${tf}`;
  return (
    <div className="fd-chart-wrap">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.22}/>
              <stop offset="100%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <YAxis hide domain={[min - pad, max + pad]} tickFormatter={(v) => inr0(v)}/>
          <XAxis dataKey="t" hide/>
          <Tooltip content={<ChartTip/>} cursor={{ stroke: "var(--faint)", strokeOpacity: 0.4, strokeWidth: 1 }}/>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2.2} fill={`url(#${id})`} dot={false}/>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * @param {{ fund, navs, holding, watched, onBack, onToggleWatch, onOrder, go, toast, arn, onOpenChat }} props
 */
export default function FundDetailScreen({
  fund, navs, holding, watched, onBack, onToggleWatch, onOrder, go, toast, arn, onOpenChat,
}) {
  const [tf, setTf] = useState("1Y");
  const [aboutOpen, setAboutOpen] = useState(false);
  const [chartError, setChartError] = useState(false);

  const q = navs[fund.id];
  const navMissing = !q || !Number.isFinite(q.nav);
  const chg = navMissing ? 0 : q.nav / q.prevNav - 1;
  const chgAbs = navMissing ? 0 : q.nav - q.prevNav;
  const up = chg >= 0;
  const aumCr = demoAumCr(fund.id);

  const holdingStats = useMemo(() => {
    if (!holding || navMissing) return null;
    const cur = holding.units * q.nav;
    const inv = holding.units * holding.avgNav;
    const ret = cur - inv;
    const retPct = inv ? ret / inv : 0;
    return { cur, inv, ret, retPct };
  }, [holding, q, navMissing]);

  const riskClass = fund.risk?.includes("Very High") ? "risk-vh" : fund.risk?.includes("High") ? "risk-h" : "risk-m";

  const shareFund = async () => {
    const url = `${window.location.origin}?fund=${fund.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast("Fund link copied");
    } catch {
      toast("Unable to share — try again");
    }
  };

  const stats = [
    { ic: <Clock size={14}/>, k: "Past 1Y", v: `${fund.r1}%`, up: fund.r1 >= 0 },
    { ic: <Calendar size={14}/>, k: "Past 3Y", v: `${fund.r3}%`, up: fund.r3 >= 0 },
    { ic: <Calendar size={14}/>, k: "Past 5Y", v: `${fund.r5}%`, up: fund.r5 >= 0 },
    { ic: <Zap size={14}/>, k: "Expense ratio", v: `${fund.expense}%` },
    { ic: <Coins size={14}/>, k: "AUM", v: `${inr0(aumCr)} Cr` },
    { ic: null, k: "Riskometer", gauge: true },
    { ic: <Wallet size={14}/>, k: "Min SIP", v: inr0(fund.minSip) },
    { ic: <BarChart3 size={14}/>, k: "Fund size", v: fundSizeLabel(aumCr) },
  ];

  const docs = [
    { k: "SID", t: "Scheme Information Document" },
    { k: "KIM", t: "Key Information Memorandum" },
    { k: "Factsheet", t: "Monthly factsheet" },
  ];

  return (
    <div className="overlay fd-overlay">
      <div className="fd-topbar">
        <button type="button" className="back" onClick={onBack} aria-label="Back"><ArrowLeft size={20}/></button>
        <div className="fd-topbar-actions">
          <button type="button" className="iconbtn" onClick={shareFund} aria-label="Share"><Share2 size={18}/></button>
          <button type="button" className="iconbtn" onClick={() => onToggleWatch(fund.id)} aria-label="Watchlist">
            <Star size={20} fill={watched ? "#F5A623" : "none"} color={watched ? "#F5A623" : "var(--faint)"}/>
          </button>
        </div>
      </div>

      <div className="dscroll fd-scroll">
        <div className="fd-identity">
          <FundAvatar h={fund.h}/>
          <div className="meta">
            <div className="title-row">
              <h1>{fund.s}</h1>
              <span className="reg-badge">Regular Plan</span>
            </div>
            <p className="sub">{fund.cat} Fund · {fund.h} Mutual Fund</p>
            <div className="fd-tags">
              <span className="fd-tag cat">{fund.cat}</span>
              <span className={`fd-tag ${riskClass}`}>{fund.risk} Risk</span>
            </div>
          </div>
        </div>

        <div className="fd-metrics">
          <div className="blk">
            <span className="k">NAV</span>
            {navMissing ? (
              <div className="fd-nav-missing">
                <b>NAV not available</b>
                <button type="button" onClick={() => toast("Refreshing NAV…")}><RefreshCw size={14}/></button>
              </div>
            ) : (
              <>
                <div className="v num">{inr(q.nav)}</div>
                <div className="asof">as on 06 Jul 2026</div>
                <div className={`chg num ${up ? "up" : "down"}`}>
                  {up ? "▲" : "▼"} {signInr(chgAbs)} ({signPct(chg)}) <span>1D change</span>
                </div>
              </>
            )}
          </div>
          <div className="blk right">
            <span className="k">3Y CAGR</span>
            <div className="v num up">{fund.r3}%</div>
            <div className="asof">Past 3 years</div>
          </div>
        </div>

        <div className="fd-chart-card">
          <div className="fd-chart-head">
            <div className="fd-tf">
              {CHART_TFS.map((k) => (
                <button key={k} type="button" className={tf === k ? "on" : ""} onClick={() => setTf(k)}>{k}</button>
              ))}
            </div>
            <button type="button" className="fd-expand" onClick={() => toast("Full-screen chart — coming soon")} aria-label="Expand chart">
              <Expand size={16}/>
            </button>
          </div>
          {!navMissing && (
            <PerformanceChart
              sym={fund.id}
              tf={tf}
              nav={q.nav}
              prevNav={q.prevNav}
              up={up}
              chartError={chartError}
              onRetry={() => setChartError(false)}
            />
          )}
          <p className="fd-chart-note">All returns are past. They are not guaranteed.</p>
          <button type="button" className="fd-chart-link" onClick={() => toast("CAGR is compounded annual growth based on published NAV history.")}>
            How is CAGR calculated?
          </button>
        </div>

        {holding && holdingStats ? (
          <div className="fd-holding-card">
            <div className="hd">
              <span><BadgeCheck size={16} color="var(--up)"/> You hold this fund</span>
              <span className="folio">Folio {holding.folio}</span>
            </div>
            <div className="fd-hold-grid">
              <div><span>Units</span><b className="num">{holding.units.toFixed(3)}</b></div>
              <div><span>Avg NAV</span><b className="num">{inr(holding.avgNav)}</b></div>
              <div><span>Current value</span><b className="num">{inr0(holdingStats.cur)}</b></div>
              <div>
                <span>Total returns</span>
                <b className={`num ${holdingStats.ret >= 0 ? "up" : "down"}`}>
                  {signInr(holdingStats.ret)} ({signPct(holdingStats.retPct)})
                </b>
              </div>
            </div>
            <button type="button" className="fd-portfolio-link" onClick={() => { onBack(); go("portfolio"); }}>
              View in Portfolio <ChevronRight size={14}/>
            </button>
          </div>
        ) : (
          <div className="fd-track-card">
            <div>
              <b>{watched ? "On your watchlist" : "Track this fund"}</b>
              <p>{watched ? "Open Watchlist from the top bar to review tracked funds." : "Add to watchlist for price & NAV alerts."}</p>
            </div>
            <button type="button" onClick={() => onToggleWatch(fund.id)}>
              {watched ? "Remove" : "Track"}
            </button>
          </div>
        )}

        <div className="fd-stats-grid">
          {stats.map((s) => (
            <div key={s.k} className="fd-stat">
              {s.gauge ? (
                <>
                  <span className="k">{s.k}</span>
                  <Riskometer risk={fund.risk}/>
                </>
              ) : (
                <>
                  <span className="k">{s.ic} {s.k}</span>
                  <b className={`num ${s.up === false ? "down" : s.up ? "up" : ""}`}>{s.v}</b>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="fd-why">
          <div className="hd">
            <Info size={16}/>
            <h3>Why this fund appears</h3>
          </div>
          <div className="fd-why-tags">
            {whyTags(fund).map((t) => <span key={t}>{t}</span>)}
          </div>
          <p className="fd-why-note">These are data reasons only. Not investment advice.</p>
        </div>

        <div className="fd-actions-row">
          <button type="button" onClick={() => toast("Added to compare — open Explore → Compare")}>
            <GitCompare size={16}/> Add to compare
          </button>
          <button type="button" onClick={onOpenChat}>
            <MessageCircle size={16}/> Ask Nivya
          </button>
          <button type="button" onClick={() => toast("Price alert saved — demo")}>
            <Bell size={16}/> Price alert
          </button>
        </div>

        <div className="fd-about">
          <h3>About the fund</h3>
          <p className={aboutOpen ? "open" : ""}>{aboutFund(fund)}</p>
          <button type="button" onClick={() => setAboutOpen((o) => !o)}>
            {aboutOpen ? "Show less" : "Read more"}
          </button>
        </div>

        <div className="fd-docs">
          <h3>Documents &amp; disclosures</h3>
          <div className="fd-doc-list">
            {docs.map((d) => (
              <button
                key={d.k}
                type="button"
                className="fd-doc"
                onClick={() => toast(`${d.k} — production links from AMC / exchange`)}
              >
                <FileText size={18}/>
                <span>
                  <b>{d.k}</b>
                  <small>{d.t}</small>
                </span>
                <ExternalLink size={14} color="var(--faint)"/>
              </button>
            ))}
          </div>
        </div>

        <details className="fd-compliance">
          <summary>
            Important notice — market risks apply
            <ChevronRight size={14} className="chev"/>
          </summary>
          <div className="body">
            Mutual fund investments are subject to market risks. Read all scheme-related documents carefully.
            Nivya distributes Regular plans only under {arn}. Past performance does not guarantee future results.
          </div>
        </details>
      </div>

      <div className="fd-tradebar">
        {holding ? (
          <>
            <div className="fd-trade-row">
              <button type="button" className="fd-trade redeem" onClick={() => onOrder("REDEEM")}>
                <b>Redeem</b>
                <small>Withdraw</small>
              </button>
              <button type="button" className="fd-trade switch" onClick={() => onOrder("SWITCH")}>
                <b>Switch</b>
                <small>One-time</small>
              </button>
              <button type="button" className="fd-trade invest" onClick={() => onOrder("LUMPSUM")}>
                <b>Invest</b>
                <small>Lumpsum</small>
              </button>
            </div>
            <div className="fd-trade-row">
              <button type="button" className="fd-trade sip" onClick={() => onOrder("SIP")}>
                <b>SIP</b>
                <small>Monthly buy</small>
              </button>
              <button type="button" className="fd-trade stp" onClick={() => onOrder("STP")}>
                <b>STP</b>
                <small>Transfer</small>
              </button>
              <button type="button" className="fd-trade swp" onClick={() => onOrder("SWP")}>
                <b>SWP</b>
                <small>Withdraw</small>
              </button>
            </div>
          </>
        ) : (
          <>
            <button type="button" className="fd-trade invest" onClick={() => onOrder("LUMPSUM")}>
              <b>Invest</b>
              <small>One-time investment</small>
            </button>
            <button type="button" className="fd-trade sip" onClick={() => onOrder("SIP")}>
              <b>Start SIP</b>
              <small>Invest regularly</small>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
