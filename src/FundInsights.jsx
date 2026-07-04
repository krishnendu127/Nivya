/**
 * Fund Insights — compliant fund screener (Regular plans only).
 */
import React, { useState, useCallback } from "react";
import { queryScreener } from "./nivya-api.js";
import { FundChatFab, FundChatPanel } from "./FundChatbot.jsx";
import { ArrowLeft, AlertCircle, Loader, MessageCircle } from "lucide-react";

// ── Constants ──────────────────────────────────────────────────────────────
const DISCLAIMER =
  "Mutual fund investments are subject to market risks. Past performance does not guarantee future results. " +
  "This is not investment advice. Read all scheme-related documents (SID/KIM) carefully before investing.";

const CATEGORIES_STATIC = [
  { id:"large-cap",   label:"Large Cap",            riskBand:"MEDIUM" },
  { id:"flexi-cap",   label:"Flexi Cap",            riskBand:"MEDIUM" },
  { id:"small-cap",   label:"Small Cap",            riskBand:"HIGH"   },
  { id:"mid-cap",     label:"Mid Cap",              riskBand:"HIGH"   },
  { id:"elss",        label:"ELSS",                 riskBand:"HIGH"   },
  { id:"liquid",      label:"Liquid",               riskBand:"LOW"    },
  { id:"ultra-short", label:"Ultra Short Duration", riskBand:"LOW"    },
  { id:"hybrid",      label:"Hybrid Aggressive",    riskBand:"MEDIUM" },
  { id:"index",       label:"Index Fund",           riskBand:"MEDIUM" },
  { id:"sectoral",    label:"Sectoral",             riskBand:"HIGH"   },
  { id:"contra",      label:"Contra",               riskBand:"HIGH"   },
];

const REASON_LABELS = {
  HIGH_3Y_RETURN_IN_CATEGORY: "High past 3Y return in category",
  LOWER_VOL_THAN_MEDIAN:      "Below-median historical volatility",
  HIGH_AUM:                   "High AUM (strong asset base)",
  LOW_EXPENSE_RATIO:          "Low expense ratio",
};

const AV_COLORS = ["#2456BE","#0E9C8E","#7A5AF8","#E8943A","#D6409F","#16A35A"];
function hashStr(s){ let h=2166136261; for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);} return(h>>>0); }
function avColor(s){ return AV_COLORS[hashStr(s) % AV_COLORS.length]; }

const nf0 = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const inr0 = (n) => "₹" + nf0.format(Math.round(n ?? 0));

// ── Sub-components ─────────────────────────────────────────────────────────

function ComplianceStrip() {
  return (
    <div className="compliance-strip">{DISCLAIMER}</div>
  );
}

function RiskBadge({ risk }) {
  const styles = {
    LOW:    { background:"#E7F6EE", color:"#16A35A" },
    MEDIUM: { background:"#FFF3E0", color:"#E8943A" },
    HIGH:   { background:"#FDECEC", color:"#E0444B" },
  };
  return (
    <span style={{ ...styles[risk], fontSize:11, fontWeight:800, padding:"3px 10px", borderRadius:999, display:"inline-block" }}>
      {risk} RISK
    </span>
  );
}

function FundCard({ fund, mode, onOpen, onInvest, onAsk }) {
  const initials = fund.amc.slice(0, 2).toUpperCase();
  const catLabel = CATEGORIES_STATIC.find((c) => c.id === fund.category)?.label ?? fund.category;
  const col = avColor(fund.amc);

  return (
    <div className="list" style={{ borderRadius:16, marginBottom:8, cursor:"pointer", padding:"13px 14px" }}
      onClick={() => onOpen(fund)}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
        <div className="av" style={{ background:col, width:38, height:38, borderRadius:11, fontSize:12 }}>
          {initials}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div className="nm" style={{ fontSize:13.5 }}>{fund.schemeName.replace(" - Regular","")}</div>
          <div className="sub" style={{ fontSize:11 }}>
            {fund.amc} · {catLabel}
            <span className="tag" style={{ fontSize:9.5, marginLeft:4 }}>Regular · {fund.riskometer}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flex: "none" }}>
          <button
            type="button"
            className="btn"
            style={{ fontSize: 11, padding: "5px 10px", borderRadius: 8, background: "#EAF7F3",
              color: "#0B7E78", border: "1px solid #CDEDE3" }}
            onClick={(e) => { e.stopPropagation(); onAsk?.(fund); }}>
            <MessageCircle size={12} style={{ display: "inline", verticalAlign: -2, marginRight: 3 }}/>
            Ask
          </button>
          <button
            className="btn btn-buy"
            style={{ fontSize:11, padding:"5px 10px", borderRadius:8 }}
            onClick={(e) => { e.stopPropagation(); onInvest(fund); }}>
            Invest
          </button>
        </div>
      </div>

      {/* Past returns grid — labelled as past, never expected */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:4, marginTop:10,
        background:"#F8FAFC", borderRadius:10, padding:"8px 10px" }}>
        {[["Past 1Y", fund.pastReturn1y], ["Past 3Y", fund.pastReturn3y], ["Past 5Y", fund.pastReturn5y]].map(([lbl, val]) => (
          <div key={lbl} style={{ textAlign:"center" }}>
            <div style={{ fontSize:9.5, color:"#98A2B3", fontWeight:700 }}>{lbl}</div>
            <div className="num up" style={{ fontSize:13, fontWeight:800, marginTop:1 }}>
              {val != null ? `${val.toFixed(1)}%` : "—"}
            </div>
          </div>
        ))}
      </div>

      {/* Scores + volatility */}
      <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
        <span style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:999, background:"#E8F0FF", color:"#2456BE" }}>
          Perf score: {fund.performanceScore}
        </span>
        {fund.volatilityPct != null && (
          <span style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:999, background:"#FFF3E0", color:"#E8943A" }}>
            Vol: {fund.volatilityPct.toFixed(1)}%
          </span>
        )}
        <span style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:999, background:"#F3EEFF", color:"#7A5AF8" }}>
          Risk rank: {fund.riskScore}
        </span>
      </div>

      {/* Factual reason codes — full text from API for transparency */}
      {fund.reasons?.length > 0 && (
        <div style={{ marginTop:8, padding:"8px 10px", background:"#F8FAFC", borderRadius:10, border:"1px solid #EAECF0" }}>
          <div style={{ fontSize:10, fontWeight:800, color:"#667085", marginBottom:4, textTransform:"uppercase", letterSpacing:".04em" }}>
            Why this fund appears
          </div>
          {fund.reasons.map((r) => (
            <div key={r.code ?? r.text ?? r} style={{ fontSize:10.5, color:"#0B7E78", fontWeight:600, lineHeight:1.45, marginTop:3 }}>
              · {r.text ?? REASON_LABELS[r.code ?? r] ?? r}
            </div>
          ))}
        </div>
      )}

      <div style={{ display:"flex", gap:12, marginTop:6 }}>
        {fund.aum && (
          <span style={{ fontSize:10.5, color:"#98A2B3", fontWeight:600 }}>
            AUM: {inr0(fund.aum)} Cr
          </span>
        )}
        {fund.expenseRatio && (
          <span style={{ fontSize:10.5, color:"#98A2B3", fontWeight:600 }}>
            Exp: {fund.expenseRatio.toFixed(2)}%
          </span>
        )}
      </div>
    </div>
  );
}

// ── Screen 1 — Screener form ───────────────────────────────────────────────
function ScreenerForm({ onResults }) {
  const [mode, setMode] = useState("SIP");
  const [horizonVal, setHorizonVal] = useState(5);
  const [horizonUnit, setHorizonUnit] = useState("years");
  const [buckets, setBuckets] = useState([
    { id: 1, riskPreference:"HIGH", categories:["small-cap","elss"], amountInr:10000 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const horizonMonths = horizonUnit === "years" ? horizonVal * 12 : horizonVal;

  const setBucketRisk = useCallback((id, risk) => {
    setBuckets((prev) => prev.map((b) => b.id === id ? { ...b, riskPreference:risk } : b));
  }, []);

  const toggleCat = useCallback((id, cat) => {
    setBuckets((prev) => prev.map((b) => {
      if (b.id !== id) return b;
      const cats = b.categories.includes(cat)
        ? b.categories.filter((c) => c !== cat)
        : [...b.categories, cat];
      return { ...b, categories: cats };
    }));
  }, []);

  const addBucket = () => {
    setBuckets((prev) => [...prev, { id: Date.now(), riskPreference:"MEDIUM", categories:["large-cap"], amountInr:5000 }]);
  };

  const removeBucket = (id) => {
    setBuckets((prev) => prev.filter((b) => b.id !== id));
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await queryScreener({ mode, horizonMonths, buckets });
      onResults(result, mode, horizonMonths);
    } catch (e) {
      console.error("Screener query failed", e);
      setError(
        "Could not reach the Nivya API. In a separate terminal run: npm run start:api " +
        "(then npm run screener:build once for MFapi.in fund data)."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scroll">
      <ComplianceStrip />

      {/* Hero */}
      <div style={{ background:"linear-gradient(135deg,#16213E,#2456BE)", borderRadius:18, padding:16,
        color:"#fff", marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:700, opacity:.75, textTransform:"uppercase", letterSpacing:".05em" }}>Fund Insights</div>
        <div style={{ fontSize:19, fontWeight:800, margin:"4px 0 6px", lineHeight:1.2 }}>Discover Regular funds — ranked by data</div>
        <div style={{ fontSize:12, opacity:.8, fontWeight:600 }}>You choose · We execute as your AMFI distributor</div>
      </div>

      {/* Mode */}
      <div style={{ marginBottom:16 }}>
        <div className="field-lbl" style={{ fontSize:12, fontWeight:700, color:"#667085", marginBottom:6 }}>Investment mode</div>
        <div className="seg">
          {["SIP","LUMPSUM","STP","SWP"].map((m) => (
            <button key={m} className={mode === m ? "on" : ""} onClick={() => setMode(m)} style={{ fontSize:12 }}>
              {m}{(m==="STP"||m==="SWP") ? " ✦" : ""}
            </button>
          ))}
        </div>
        {(mode==="STP"||mode==="SWP") && (
          <div style={{ fontSize:11, color:"#E8943A", fontWeight:700, marginTop:6 }}>
            {mode} screening is planned for v2. Showing SIP-equivalent data.
          </div>
        )}
      </div>

      {/* Horizon */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:12, fontWeight:700, color:"#667085", marginBottom:6 }}>Investment horizon (for display only — not return forecasts)</div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <input type="number" min={1} max={400} value={horizonVal}
            onChange={(e) => setHorizonVal(Math.max(1, parseInt(e.target.value)||1))}
            style={{ width:64, border:"1.5px solid #EAECF0", borderRadius:10, padding:"9px 12px",
              fontSize:14, fontWeight:700, fontFamily:"inherit", outline:"none" }} />
          <div className="seg" style={{ flex:1 }}>
            <button className={horizonUnit==="months"?"on":""} onClick={()=>setHorizonUnit("months")}>Months</button>
            <button className={horizonUnit==="years"?"on":""} onClick={()=>setHorizonUnit("years")}>Years</button>
          </div>
        </div>
      </div>

      {/* Buckets */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:16, fontWeight:700, marginBottom:10, display:"flex", justifyContent:"space-between" }}>
          <span>Risk buckets</span>
        </div>
        {buckets.map((bk, i) => (
          <div key={bk.id} className="list" style={{ borderRadius:16, padding:14, marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <span style={{ fontWeight:800, fontSize:13 }}>{i === 0 ? "Primary bucket" : `Bucket ${i+1}`}</span>
              {i > 0 && (
                <button onClick={() => removeBucket(bk.id)}
                  style={{ border:"none", background:"none", color:"#98A2B3", cursor:"pointer", fontSize:20, lineHeight:1 }}>×</button>
              )}
            </div>

            <div style={{ fontSize:12, fontWeight:700, color:"#667085", marginBottom:6 }}>Risk preference</div>
            <div className="seg" style={{ marginBottom:12 }}>
              {["LOW","MEDIUM","HIGH"].map((r) => (
                <button key={r} className={bk.riskPreference===r?"on":""} onClick={()=>setBucketRisk(bk.id, r)} style={{fontSize:11.5}}>
                  {r}
                </button>
              ))}
            </div>

            <div style={{ fontSize:12, fontWeight:700, color:"#667085", marginBottom:6 }}>Categories</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:10 }}>
              {CATEGORIES_STATIC.map((c) => {
                const sel = bk.categories.includes(c.id);
                const dotColor = c.riskBand==="LOW" ? "#16A35A" : c.riskBand==="MEDIUM" ? "#E8943A" : "#E0444B";
                return (
                  <button key={c.id}
                    style={{ border:`1.5px solid ${sel?"#16213E":"#EAECF0"}`, borderRadius:12,
                      padding:"8px 10px", fontSize:12, fontWeight:600, cursor:"pointer", textAlign:"left",
                      background:sel?"#16213E":"#fff", color:sel?"#fff":"#0D1526",
                      display:"flex", alignItems:"center", gap:6, fontFamily:"inherit" }}
                    onClick={() => toggleCat(bk.id, c.id)}>
                    <span style={{ width:8, height:8, borderRadius:"50%", background:dotColor, flex:"none" }}/>
                    {c.label}
                  </button>
                );
              })}
            </div>

            <div style={{ fontSize:12, fontWeight:700, color:"#667085", marginBottom:6 }}>Amount (optional)</div>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)",
                fontSize:14, fontWeight:700, color:"#667085", fontFamily:"'JetBrains Mono',monospace" }}>₹</span>
              <input type="number" value={bk.amountInr||""}
                placeholder={mode==="SIP"?"e.g. 5000/mo":"e.g. 50000"}
                onChange={(e) => setBuckets((prev) => prev.map((b) => b.id===bk.id ? {...b, amountInr:parseInt(e.target.value)||0} : b))}
                style={{ width:"100%", border:"1.5px solid #EAECF0", borderRadius:10, padding:"9px 12px 9px 28px",
                  fontSize:14, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", outline:"none", background:"#fff" }} />
            </div>
          </div>
        ))}

        {buckets.length < 3 && (
          <button onClick={addBucket}
            style={{ width:"100%", border:"1.5px dashed #CDEDE3", borderRadius:14, padding:12,
              fontSize:13, fontWeight:700, color:"#0B7E78", background:"#EAF7F3", cursor:"pointer", fontFamily:"inherit" }}>
            ＋ Add another bucket (multi-goal investing)
          </button>
        )}
      </div>

      {error && (
        <div style={{ background:"#FDECEC", border:"1px solid #FECDD3", borderRadius:12, padding:"10px 14px",
          fontSize:12, color:"#E0444B", fontWeight:700, display:"flex", gap:8, alignItems:"center", marginBottom:12 }}>
          <AlertCircle size={16}/> {error}
        </div>
      )}

      <button
        className="btn btn-grad btn-full"
        style={{ marginBottom:8, fontSize:15, padding:"14px 0" }}
        disabled={loading}
        onClick={handleSubmit}>
        {loading
          ? <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              <Loader size={16} style={{ animation:"spin 0.7s linear infinite" }}/> Ranking funds…
            </span>
          : "Show ranked funds →"}
      </button>
      <div style={{ textAlign:"center", fontSize:10.5, color:"#98A2B3", fontWeight:600, marginBottom:8 }}>
        Ranked by past performance data · Regular plans only · Top 10 per bucket
      </div>
    </div>
  );
}

// ── Screen 2 — Results ─────────────────────────────────────────────────────

function RankTransparencyPanel({ results, mode, horizonMonths }) {
  const [open, setOpen] = useState(false);
  const hLabel = horizonMonths >= 12 ? `${Math.round(horizonMonths / 12)} years` : `${horizonMonths} months`;

  return (
    <div style={{ marginBottom:14, border:"1px solid #CDEDE3", borderRadius:14, overflow:"hidden", background:"#fff" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ width:"100%", border:"none", background:"#EAF7F3", padding:"12px 14px", cursor:"pointer",
          display:"flex", justifyContent:"space-between", alignItems:"center", fontFamily:"inherit" }}>
        <span style={{ fontSize:13, fontWeight:800, color:"#0B7E78" }}>How this list was built</span>
        <span style={{ fontSize:12, fontWeight:700, color:"#667085" }}>{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <div style={{ padding:"12px 14px", fontSize:11.5, color:"#667085", lineHeight:1.55, fontWeight:600 }}>
          <p style={{ margin:"0 0 8px" }}>
            <strong style={{ color:"#0D1526" }}>This is not investment advice.</strong> Funds are ranked by past data only. You choose; Nivya executes as your AMFI distributor.
          </p>
          <p style={{ margin:"0 0 6px", fontWeight:800, color:"#0D1526" }}>Step 1 — Filter</p>
          <ul style={{ margin:"0 0 10px", paddingLeft:18 }}>
            <li>Regular plans only (Direct plans excluded)</li>
            <li>Categories and risk bucket you selected</li>
            <li>Mode ({mode}) does not change ranking in v1</li>
            <li>Horizon ({hLabel}) is shown for context only — not used in ranking</li>
          </ul>
          <p style={{ margin:"0 0 6px", fontWeight:800, color:"#0D1526" }}>Step 2 — Score vs category peers</p>
          <ul style={{ margin:"0 0 10px", paddingLeft:18 }}>
            <li><strong>Past 1Y / 3Y / 5Y</strong> — CAGR from MFapi.in NAV history (past, not forecast)</li>
            <li><strong>Vol</strong> — historical annualised volatility (daily NAV moves × √252)</li>
            <li><strong>Perf score (0–100)</strong> — 60% past 3Y return rank + 20% return consistency + 20% expense ratio rank within category</li>
            <li><strong>Risk rank (0–100)</strong> — volatility percentile within category (lower vol → lower rank)</li>
          </ul>
          <p style={{ margin:"0 0 6px", fontWeight:800, color:"#0D1526" }}>Step 3 — Sort</p>
          <p style={{ margin:0 }}>Highest Perf score first · Top 10 per bucket · Green “Why this fund appears” lines are factual comparisons to category medians</p>
          {results.dataSource === "mfapi-snapshot" && (
            <p style={{ margin:"10px 0 0", fontSize:10.5, color:"#98A2B3" }}>
              Data source: MFapi.in snapshot · Run <code style={{ fontSize:10 }}>npm run screener:build</code> to refresh
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ScreenerResults({ results, mode, horizonMonths, onBack, onOpenFund, onInvest }) {
  const hLabel = `${horizonMonths >= 12 ? `${Math.round(horizonMonths/12)}Y` : `${horizonMonths}M`}`;
  const [chatOpen, setChatOpen] = useState(false);
  const [chatFund, setChatFund] = useState(null);

  const openChat = useCallback((fund = null) => {
    setChatFund(fund);
    setChatOpen(true);
  }, []);

  return (
    <div className="overlay">
      <div className="dbar">
        <button className="back" onClick={onBack}><ArrowLeft size={20}/></button>
        <div className="ttl">
          <div className="a">Fund Insights · {mode} · {hLabel}</div>
          <div className="b">Ranked by past performance data · Regular plans only</div>
        </div>
      </div>
      <div className="dscroll">
        <div style={{ fontSize:10, color:"#98A2B3", fontWeight:600, textAlign:"right", marginBottom:8 }}>
          Data as on: {new Date(results.dataAsOn).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}
          {results.dataSource === "vendor-mock-fallback"
            ? " · Vendor mock (run npm run screener:build)"
            : results.dataSource === "mfapi-snapshot"
              ? " · MFapi.in via BFF"
              : results.offlineMode
                ? " · Demo mock data"
                : ""}
        </div>

        <RankTransparencyPanel results={results} mode={mode} horizonMonths={horizonMonths} />

        {results.buckets.map((bk) => (
          <div key={bk.bucketId} style={{ marginBottom:22 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <RiskBadge risk={bk.riskPreference} />
                <span style={{ fontSize:11, color:"#98A2B3", fontWeight:600 }}>
                  {bk.categories.map((c) => CATEGORIES_STATIC.find((x) => x.id===c)?.label ?? c).join(", ")}
                  {bk.amountInr ? ` · ${inr0(bk.amountInr)}${mode==="SIP"?"/mo":""}` : ""}
                </span>
              </div>
              <span style={{ fontSize:11, color:"#98A2B3", fontWeight:700 }}>{bk.items.length} funds</span>
            </div>

            {bk.items.length === 0 ? (
              <div style={{ textAlign:"center", padding:"20px", color:"#667085", fontSize:13, fontWeight:600 }}>
                No Regular-plan funds found. Try adjusting categories or risk level.
              </div>
            ) : bk.items.map((fund) => (
              <FundCard key={fund.schemeCode} fund={fund} mode={mode}
                onOpen={onOpenFund} onInvest={onInvest} onAsk={openChat} />
            ))}
          </div>
        ))}

        <div style={{ fontSize:10.5, color:"#98A2B3", lineHeight:1.55, textAlign:"center", padding:"0 8px", marginTop:12 }}>
          {DISCLAIMER}<br/>
          Nivya · AMFI-registered Mutual Fund Distributor · ARN-XXXXXX · Regular plans only.<br/>
          Ranked by past performance data. You choose — we execute.
        </div>
      </div>

      {!chatOpen && <FundChatFab onClick={() => openChat(null)} />}
      {chatOpen && (
        <FundChatPanel
          key={chatFund?.schemeCode ?? "default"}
          results={results}
          initialFund={chatFund}
          onClose={() => { setChatOpen(false); setChatFund(null); }}
        />
      )}
    </div>
  );
}

// ── Root: FundInsights ─────────────────────────────────────────────────────
/**
 * @param {{ openFund: function, setOrder: function, go: function }} props
 */
export default function FundInsights({ openFund, setOrder, go }) {
  const [results, setResults] = useState(null);
  const [mode, setMode] = useState("SIP");
  const [horizonMonths, setHorizonMonths] = useState(60);

  const handleResults = useCallback((res, m, h) => {
    setResults(res);
    setMode(m);
    setHorizonMonths(h);
  }, []);

  const handleOpenFund = useCallback((fund) => {
    // Map screener fund to the shape openFund expects in nivya-app.jsx
    openFund({
      id:      fund.schemeCode,
      s:       fund.schemeName.replace(" - Regular", ""),
      h:       fund.amc,
      cat:     CATEGORIES_STATIC.find((c) => c.id === fund.category)?.label ?? fund.category,
      risk:    fund.riskometer ?? "High",
      r3:      fund.pastReturn3y ?? 0,
      r1:      fund.pastReturn1y ?? 0,
      r5:      fund.pastReturn5y ?? 0,
      nav:     fund.nav ?? 100,
      minSip:  500,
      expense: fund.expenseRatio ?? null,
    });
  }, [openFund]);

  const handleInvest = useCallback((fund) => {
    // Opens the existing MFOrderSheet from nivya-app.jsx
    const mapped = {
      id:      fund.schemeCode,
      s:       fund.schemeName.replace(" - Regular", ""),
      h:       fund.amc,
      cat:     CATEGORIES_STATIC.find((c) => c.id === fund.category)?.label ?? fund.category,
      risk:    fund.riskometer ?? "High",
      r3:      fund.pastReturn3y ?? 0,
      r1:      fund.pastReturn1y ?? 0,
      r5:      fund.pastReturn5y ?? 0,
      nav:     fund.nav ?? 100,
      minSip:  500,
      expense: fund.expenseRatio ?? null,
    };
    setOrder({ fund: mapped, mode: "SIP" });
  }, [setOrder]);

  if (results) {
    return (
      <ScreenerResults
        results={results}
        mode={mode}
        horizonMonths={horizonMonths}
        onBack={() => setResults(null)}
        onOpenFund={handleOpenFund}
        onInvest={handleInvest}
      />
    );
  }

  return <ScreenerForm onResults={handleResults} />;
}
