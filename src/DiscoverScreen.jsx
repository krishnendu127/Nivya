/**
 * Discover tab — Browse | Rank | Compare | Tools (improved design)
 */
import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Search, Star, X, ChevronRight, SlidersHorizontal, Mic, MessageCircle,
  Calculator, BarChart3, ShieldCheck, HelpCircle, AlertCircle, Loader, ArrowRight,
  ArrowLeft, Plus,
} from "lucide-react";
import { queryScreener } from "./nivya-api.js";
import { FundChatPanel } from "./FundChatbot.jsx";
import {
  GOALS, HORIZON_OPTIONS, EMERGENCY_HORIZON_OPTIONS, MARKET_REACTIONS, FREQUENCY_OPTIONS,
  AMOUNT_PRESETS, FIRST_MF_OPTIONS, EXISTING_INVESTMENTS, FUND_STYLE_OPTIONS,
  EXPENSE_PRIORITY, CONSISTENCY_PREF, EXPERIENCE_LEVEL, RETURN_WINDOW_OPTIONS, AMC_CHIP_OPTIONS,
  defaultPreferences, loadInvestmentDna, saveInvestmentDna, buildScreenerPayload,
  buildDnaSummary, buildWhyTags, getWizardSteps, applyPopularCombo,
} from "./discover-preferences.js";

const CATEGORIES = [
  { id: "large-cap", label: "Large Cap" },
  { id: "flexi-cap", label: "Flexi Cap" },
  { id: "small-cap", label: "Small Cap" },
  { id: "mid-cap", label: "Mid Cap" },
  { id: "elss", label: "ELSS" },
  { id: "hybrid", label: "Hybrid" },
  { id: "liquid", label: "Liquid" },
  { id: "index", label: "Index" },
];

const BROWSE_CHIPS = ["All", "Large Cap", "Flexi Cap", "Small Cap", "ELSS", "Hybrid"];
const SORT_OPTIONS = [
  { id: "r3-desc", label: "Past 3Y (High to Low)" },
  { id: "r1-desc", label: "Past 1Y (High to Low)" },
  { id: "exp-asc", label: "Expense (Low to High)" },
  { id: "name-asc", label: "Name A–Z" },
];

const POPULAR_COMBOS = [
  { id: "long-term", label: "Long term wealth" },
  { id: "tax-saving", label: "Tax saving" },
  { id: "emergency", label: "Emergency fund" },
  { id: "growth", label: "Growth focus" },
];

const REASON_SHORT = {
  HIGH_3Y_RETURN_IN_CATEGORY: "Consistent 3Y performance",
  HIGH_1Y_RETURN_IN_CATEGORY: "Strong past 1Y vs peers",
  HIGH_5Y_RETURN_IN_CATEGORY: "Strong past 5Y vs peers",
  LOWER_VOL_THAN_MEDIAN: "Low drawdowns vs peers",
  HIGH_AUM: "Strong AUM base",
  LOW_EXPENSE_RATIO: "Lower expense ratio",
  AMC_PREFERRED: "Matches preferred AMC",
  AMC_AVOIDED: "Avoided AMC",
};

const RANK_COLORS = ["#0E9C8E", "#2456BE", "#7A5AF8", "#E8943A", "#16A35A"];
const AV_COLORS = ["#2456BE", "#0E9C8E", "#7A5AF8", "#E8943A", "#D6409F", "#16A35A"];

function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0); }
function avColor(s) { return AV_COLORS[hashStr(s) % AV_COLORS.length]; }

const nf0 = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const inr0 = (n) => "₹" + nf0.format(Math.round(n ?? 0));

function mapScreenerFund(fund) {
  const catLabel = CATEGORIES.find((c) => c.id === fund.category)?.label ?? fund.category;
  return {
    id: fund.schemeCode,
    s: fund.schemeName?.replace(/\s*-\s*Regular.*$/i, "") ?? fund.schemeCode,
    h: fund.amc,
    cat: catLabel,
    risk: fund.riskometer ?? "High",
    r3: fund.pastReturn3y ?? 0,
    r1: fund.pastReturn1y ?? 0,
    r5: fund.pastReturn5y ?? 0,
    nav: fund.nav ?? 100,
    minSip: 500,
    expense: fund.expenseRatio ?? null,
  };
}

function catLabel(id) {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

function FundAvatar({ h, size = 40 }) {
  return (
    <div className="av" style={{ background: avColor(h), width: size, height: size, borderRadius: 12, fontSize: size * 0.32 }}>
      {h.slice(0, 2).toUpperCase()}
    </div>
  );
}

function DiscoverSubNav({ segment, onChange }) {
  const items = ["browse", "rank", "compare", "tools"];
  const labels = { browse: "Browse", rank: "Rank", compare: "Compare", tools: "Tools" };
  return (
    <div className="discover-subnav">
      {items.map((k) => (
        <button
          key={k}
          type="button"
          className={`discover-subnav-btn ${segment === k ? "on" : ""}`}
          onClick={() => onChange(k)}
        >
          {labels[k]}
        </button>
      ))}
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
  else if (r.includes("moderately high")) { level = 3.5; label = "Mod. High"; color = "#E8943A"; }
  else if (r.includes("moderately low")) { level = 1.5; label = "Mod. Low"; color = "#16A35A"; }
  else if (r.includes("low")) { level = 1; label = "Low"; color = "#16A35A"; }
  else if (r.includes("moderate")) { level = 2.5; label = "Moderate"; color = "#2456BE"; }

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

function BrowsePanel({ funds, watch, openFund, toggleWatch }) {
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("r3-desc");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const list = useMemo(() => {
    let arr = [...funds];
    if (q.trim()) {
      const k = q.toLowerCase();
      arr = arr.filter((f) =>
        f.s.toLowerCase().includes(k) || f.h.toLowerCase().includes(k) || String(f.cat).toLowerCase().includes(k)
      );
    }
    if (cat === "Large Cap") arr = arr.filter((f) => f.cat === "Large Cap" || f.cat === "large-cap");
    else if (cat === "Flexi Cap") arr = arr.filter((f) => f.cat === "Flexi Cap" || f.cat === "flexi-cap");
    else if (cat === "Small Cap") arr = arr.filter((f) => f.cat === "Small Cap" || f.cat === "small-cap");
    else if (cat === "ELSS") arr = arr.filter((f) => f.cat === "ELSS" || f.cat === "elss");
    else if (cat === "Hybrid") arr = arr.filter((f) => f.cat === "Hybrid" || f.cat === "hybrid");

    if (sort === "r3-desc") arr.sort((a, b) => (b.r3 ?? 0) - (a.r3 ?? 0));
    else if (sort === "r1-desc") arr.sort((a, b) => (b.r1 ?? 0) - (a.r1 ?? 0));
    else if (sort === "exp-asc") arr.sort((a, b) => (a.expense ?? 99) - (b.expense ?? 99));
    else arr.sort((a, b) => a.s.localeCompare(b.s));
    return arr;
  }, [funds, cat, q, sort]);

  return (
    <div>
      <div className="discover-search">
        <Search size={18} color="var(--faint)"/>
        <input
          placeholder="Search or ask @fund name"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Mic size={18} color="var(--faint)" style={{ flex: "none", opacity: 0.45 }}/>
        {q && <X size={18} color="var(--faint)" style={{ cursor: "pointer", flex: "none" }} onClick={() => setQ("")}/>}
      </div>

      <div className="chips" style={{ marginBottom: 12 }}>
        {BROWSE_CHIPS.map((c) => (
          <button key={c} type="button" className={`chip ${cat === c ? "on" : ""}`} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      <div className="discover-sort-row">
        <label className="discover-sort-lbl">
          Sort by
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="discover-sort-select">
            {SORT_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </label>
        <button type="button" className="discover-filter-btn" onClick={() => setFiltersOpen((v) => !v)}>
          <SlidersHorizontal size={15}/> Filters
        </button>
      </div>
      {filtersOpen && (
        <div className="discover-filter-hint">Advanced filters — category chips above · Regular plans only</div>
      )}

      <div className="discover-browse-count">{list.length} Regular-plan funds · Past returns only</div>

      <div className="discover-fund-list">
        {list.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--muted)", fontWeight: 600 }}>
            No funds match your search.
          </div>
        ) : list.map((f) => {
          const watched = watch.includes(f.id);
          const mockAum = ((hashStr(f.id) % 900) + 100) / 10;
          return (
            <div key={f.id} className="discover-fund-card" onClick={() => openFund(f)}>
              <FundAvatar h={f.h}/>
              <div className="discover-fund-meta">
                <div className="discover-fund-name">{f.s}</div>
                <div className="discover-fund-sub">
                  <span className="reg-badge" style={{ marginTop: 0, display: "inline-block" }}>Regular</span>
                  <span>{typeof f.cat === "string" ? f.cat.replace(/-/g, " ") : f.cat}</span>
                </div>
                <div className="discover-fund-metrics">
                  <span><b className="num up">{f.r3 != null ? `${Number(f.r3).toFixed(1)}%` : "—"}</b> Past 3Y</span>
                  <span><b className="num">{f.expense != null ? `${f.expense}%` : "—"}</b> TER</span>
                  <span><b className="num">{mockAum.toFixed(1)}K Cr</b> AUM</span>
                </div>
              </div>
              <button
                type="button"
                className="star"
                onClick={(e) => { e.stopPropagation(); toggleWatch(f.id); }}
                aria-label={watched ? "Remove from watchlist" : "Add to watchlist"}
              >
                <Star size={20} fill={watched ? "#F5A623" : "none"} color={watched ? "#F5A623" : "var(--faint)"}/>
              </button>
            </div>
          );
        })}
      </div>
      <div className="discover-foot-note">Tap a fund for details · Past returns only · Not investment advice</div>
    </div>
  );
}

function InvestmentDnaCard({ summary, onEdit, onRank }) {
  return (
    <div className="discover-dna">
      <div className="discover-dna-head">
        <h4>Your investment DNA</h4>
        <button type="button" className="discover-dna-edit" onClick={onEdit}>Edit preferences</button>
      </div>
      <div className="discover-dna-grid">
        <div className="discover-dna-item">
          <div className="k">Goal</div>
          <div className="v">{summary.goal}</div>
        </div>
        <div className="discover-dna-item">
          <div className="k">Time in market</div>
          <div className="v">{summary.horizon}</div>
        </div>
        <div className="discover-dna-item">
          <div className="k">Risk style</div>
          <div className="v">{summary.riskStyle}</div>
        </div>
        <div className="discover-dna-item">
          <div className="k">Capital priority</div>
          <div className="v">{summary.safetyGrowth}</div>
        </div>
        <div className="discover-dna-item">
          <div className="k">How you invest</div>
          <div className="v">{summary.frequency}</div>
        </div>
        <div className="discover-dna-item">
          <div className="k">Budget</div>
          <div className="v">{inr0(summary.amount)}{summary.mode === "SIP" ? "/mo" : ""}</div>
        </div>
        <div className="discover-dna-item" style={{ gridColumn: "1 / -1" }}>
          <div className="k">Categories used for ranking</div>
          <div className="v">{summary.categories.join(" · ")}</div>
        </div>
      </div>
      <p className="discover-dna-pref">
        {summary.consistency} · {summary.fundStyle}
        {summary.returnWindow ? ` · Rank by ${summary.returnWindow}` : ""}
        {summary.preferredAmcs?.length ? ` · Prefer ${summary.preferredAmcs.join(", ")}` : ""}
        {summary.avoidedAmcs?.length ? ` · Avoid ${summary.avoidedAmcs.join(", ")}` : ""}
      </p>
      <p className="discover-compliant-note">
        Funds are ranked using the criteria you selected — not personalized investment advice.
      </p>
      {onRank && (
        <button type="button" className="btn btn-grad btn-full discover-rank-cta" style={{ marginTop: 12 }} onClick={onRank}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            Show ranked funds <ArrowRight size={18}/>
          </span>
        </button>
      )}
    </div>
  );
}

function WizardProgress({ steps, currentIndex }) {
  return (
    <div className="discover-wizard-progress">
      {steps.map((_, i) => (
        <div key={i} className={`discover-wizard-dot ${i < currentIndex ? "done" : ""} ${i === currentIndex ? "on" : ""}`}/>
      ))}
    </div>
  );
}

function GuidedStep({ title, subtitle, children }) {
  return (
    <div>
      <h3 className="discover-step-title">{title}</h3>
      {subtitle && <p className="discover-step-sub">{subtitle}</p>}
      {children}
    </div>
  );
}

function RankPanel({ onResults, toast }) {
  const saved = loadInvestmentDna();
  const [prefs, setPrefs] = useState(saved ?? defaultPreferences());
  const [phase, setPhase] = useState(saved?.completedWizard ? "summary" : "wizard");
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customAmount, setCustomAmount] = useState(false);

  const steps = useMemo(() => getWizardSteps(prefs), [prefs]);
  const currentStep = steps[stepIndex] ?? "goal";
  const summary = useMemo(() => buildDnaSummary(prefs), [prefs]);

  const patch = useCallback((updates) => {
    setPrefs((p) => {
      const next = { ...p, ...updates };
      if (updates.goal === "emergency" && !EMERGENCY_HORIZON_OPTIONS.find((h) => h.id === next.horizonId)) {
        next.horizonId = "lt1";
      }
      return next;
    });
  }, []);

  const goNext = () => {
    if (stepIndex < steps.length - 1) setStepIndex((i) => i + 1);
    else finishWizard();
  };

  const goBack = () => {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
    else if (prefs.completedWizard) setPhase("summary");
  };

  const finishWizard = () => {
    const savedPrefs = saveInvestmentDna({ ...prefs, completedWizard: true });
    setPrefs(savedPrefs);
    setPhase("summary");
    toast("Preferences saved to your Investment DNA");
  };

  const applyCombo = (comboId) => {
    const next = applyPopularCombo(comboId);
    const savedPrefs = saveInvestmentDna(next);
    setPrefs(savedPrefs);
    setPhase("summary");
    toast("Popular combo applied — edit anytime");
  };

  const runRank = async () => {
    setError(null);
    setLoading(true);
    try {
      const payload = buildScreenerPayload(prefs);
      const result = await queryScreener(payload);
      onResults(result, payload.prefs, payload.mode, payload.horizonMonths);
    } catch {
      setError("Could not reach the API. Run npm run start:api and npm run screener:build.");
    } finally {
      setLoading(false);
    }
  };

  const horizonOptions = prefs.goal === "emergency" ? EMERGENCY_HORIZON_OPTIONS : HORIZON_OPTIONS;

  const renderStep = () => {
    switch (currentStep) {
      case "goal":
        return (
          <GuidedStep title="What are you investing for?" subtitle="People think in goals — not fund categories.">
            <div className="discover-option-grid">
              {GOALS.map((g) => (
                <button key={g.id} type="button" className={`discover-option-btn ${prefs.goal === g.id ? "on" : ""}`}
                  onClick={() => patch({ goal: g.id })}>
                  {g.label}
                </button>
              ))}
            </div>
          </GuidedStep>
        );
      case "elss":
        return (
          <GuidedStep title="Do you already invest in ELSS?" subtitle="Section 80C tax-saving funds — skip if you already have one.">
            <div className="discover-option-grid single">
              {[{ id: true, label: "Yes, I already have ELSS" }, { id: false, label: "No, exploring ELSS" }].map((o) => (
                <button key={String(o.id)} type="button" className={`discover-option-btn ${prefs.hasElss === o.id ? "on" : ""}`}
                  onClick={() => patch({ hasElss: o.id })}>
                  {o.label}
                </button>
              ))}
            </div>
          </GuidedStep>
        );
      case "horizon":
        return (
          <GuidedStep title="How long can this money stay invested?" subtitle="Not a return forecast — helps match fund types to your timeline.">
            <div className="discover-option-grid single">
              {horizonOptions.map((h) => (
                <button key={h.id} type="button" className={`discover-option-btn ${prefs.horizonId === h.id ? "on" : ""}`}
                  onClick={() => patch({ horizonId: h.id })}>
                  {h.label}
                </button>
              ))}
            </div>
          </GuidedStep>
        );
      case "reaction":
        return (
          <GuidedStep title="If markets fall 20%, what would you likely do?" subtitle="Behavior often reveals risk comfort better than labels like Low/Medium/High.">
            <div className="discover-option-grid single">
              {MARKET_REACTIONS.map((r) => (
                <button key={r.id} type="button" className={`discover-option-btn ${prefs.marketReaction === r.id ? "on" : ""}`}
                  onClick={() => patch({ marketReaction: r.id })}>
                  {r.label}
                </button>
              ))}
            </div>
          </GuidedStep>
        );
      case "safety":
        return (
          <GuidedStep title="How important is capital safety?" subtitle="Slide toward growth or safety — we use this to filter categories, not to advise.">
            <div className="discover-slider-block">
              <div className="discover-slider-labels"><span>Safety</span><span>Growth</span></div>
              <input type="range" min={0} max={100} value={prefs.safetyGrowth}
                className="discover-slider"
                onChange={(e) => patch({ safetyGrowth: Number(e.target.value) })}/>
              <div className="discover-slider-val">{summary.safetyGrowth}</div>
            </div>
          </GuidedStep>
        );
      case "frequency":
        return (
          <GuidedStep title="How regularly will you invest?" subtitle="One-time lumpsum or recurring contributions.">
            <div className="discover-option-grid">
              {FREQUENCY_OPTIONS.map((f) => (
                <button key={f.id} type="button" className={`discover-option-btn ${prefs.frequencyId === f.id ? "on" : ""}`}
                  onClick={() => patch({ frequencyId: f.id })}>
                  {f.label}
                </button>
              ))}
            </div>
          </GuidedStep>
        );
      case "amount":
        return (
          <GuidedStep title="How much is your budget?" subtitle="Monthly SIP budget or one-time amount — pick a preset or enter custom.">
            <div className="discover-amount-grid">
              {AMOUNT_PRESETS.map((a) => (
                <button key={a} type="button" className={`discover-amount-chip ${!customAmount && prefs.amount === a ? "on" : ""}`}
                  onClick={() => { setCustomAmount(false); patch({ amount: a }); }}>
                  {inr0(a)}
                </button>
              ))}
            </div>
            <button type="button" className={`discover-amount-chip ${customAmount ? "on" : ""}`} style={{ width: "100%", marginBottom: 10 }}
              onClick={() => setCustomAmount(true)}>
              Custom amount
            </button>
            {customAmount && (
              <div className="discover-amount-wrap">
                <span>₹</span>
                <input type="number" value={prefs.amount}
                  onChange={(e) => patch({ amount: Math.max(500, parseInt(e.target.value, 10) || 0) })}/>
                <span className="discover-amount-suffix">{summary.mode === "SIP" ? "/ month" : " one-time"}</span>
              </div>
            )}
          </GuidedStep>
        );
      case "refine":
        return (
          <GuidedStep title="Refine your ranking criteria" subtitle="Optional — helps narrow categories and ranking weights.">
            <details className="discover-refine-fold" open>
              <summary>Experience &amp; portfolio context</summary>
              <div className="inner">
                <div className="field-lbl">Is this your first mutual fund?</div>
                <div className="discover-option-grid" style={{ marginBottom: 12 }}>
                  {FIRST_MF_OPTIONS.map((o) => (
                    <button key={o.id} type="button" className={`discover-option-btn ${prefs.firstMf === o.id ? "on" : ""}`}
                      onClick={() => patch({ firstMf: o.id })}>
                      {o.label}
                    </button>
                  ))}
                </div>
                <div className="field-lbl">Existing investments (multi-select)</div>
                <div className="chips" style={{ marginBottom: 12 }}>
                  {EXISTING_INVESTMENTS.map((o) => {
                    const on = prefs.existingInvestments?.includes(o.id);
                    return (
                      <button key={o.id} type="button" className={`chip ${on ? "on" : ""}`}
                        onClick={() => patch({
                          existingInvestments: on
                            ? prefs.existingInvestments.filter((x) => x !== o.id)
                            : [...(prefs.existingInvestments ?? []), o.id],
                        })}>
                        {o.label}
                      </button>
                    );
                  })}
                </div>
                <div className="field-lbl">Fund style preference</div>
                <div className="seg" style={{ marginBottom: 12 }}>
                  {FUND_STYLE_OPTIONS.map((o) => (
                    <button key={o.id} type="button" className={prefs.fundStyle === o.id ? "on" : ""}
                      onClick={() => patch({ fundStyle: o.id })}>
                      {o.label}
                    </button>
                  ))}
                </div>
                <div className="field-lbl">Return consistency</div>
                <div className="seg" style={{ marginBottom: 12 }}>
                  {CONSISTENCY_PREF.map((o) => (
                    <button key={o.id} type="button" className={prefs.consistencyPref === o.id ? "on" : ""}
                      onClick={() => patch({ consistencyPref: o.id })}>
                      {o.label}
                    </button>
                  ))}
                </div>
                <div className="field-lbl">Expense vs performance</div>
                <div className="seg" style={{ marginBottom: 12 }}>
                  {EXPENSE_PRIORITY.map((o) => (
                    <button key={o.id} type="button" className={prefs.expensePriority === o.id ? "on" : ""}
                      onClick={() => patch({ expensePriority: o.id })}>
                      {o.label}
                    </button>
                  ))}
                </div>
                <div className="field-lbl">Past return window for ranking</div>
                <div className="seg" style={{ marginBottom: 12 }}>
                  {RETURN_WINDOW_OPTIONS.map((o) => (
                    <button key={o.id} type="button" className={prefs.returnWindow === o.id ? "on" : ""}
                      onClick={() => patch({ returnWindow: o.id })}>
                      {o.label}
                    </button>
                  ))}
                </div>
                <div className="field-lbl">Prefer AMCs (optional)</div>
                <div className="chips" style={{ marginBottom: 12 }}>
                  {AMC_CHIP_OPTIONS.map((amc) => {
                    const on = prefs.preferredAmcs?.includes(amc);
                    return (
                      <button key={`pref-${amc}`} type="button" className={`chip ${on ? "on" : ""}`}
                        onClick={() => patch({
                          preferredAmcs: on
                            ? prefs.preferredAmcs.filter((x) => x !== amc)
                            : [...(prefs.preferredAmcs ?? []), amc],
                          avoidedAmcs: (prefs.avoidedAmcs ?? []).filter((x) => x !== amc),
                        })}>
                        {amc}
                      </button>
                    );
                  })}
                </div>
                <div className="field-lbl">Avoid AMCs (optional)</div>
                <div className="chips" style={{ marginBottom: 4 }}>
                  {AMC_CHIP_OPTIONS.map((amc) => {
                    const on = prefs.avoidedAmcs?.includes(amc);
                    return (
                      <button key={`avoid-${amc}`} type="button" className={`chip ${on ? "on" : ""}`}
                        onClick={() => patch({
                          avoidedAmcs: on
                            ? prefs.avoidedAmcs.filter((x) => x !== amc)
                            : [...(prefs.avoidedAmcs ?? []), amc],
                          preferredAmcs: (prefs.preferredAmcs ?? []).filter((x) => x !== amc),
                        })}>
                        {amc}
                      </button>
                    );
                  })}
                </div>
              </div>
            </details>
            <details className="discover-refine-fold">
              <summary>Investing experience</summary>
              <div className="inner">
                <div className="seg">
                  {EXPERIENCE_LEVEL.map((o) => (
                    <button key={o.id} type="button" className={prefs.experience === o.id ? "on" : ""}
                      onClick={() => patch({ experience: o.id })}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </details>
            <p className="discover-compliant-note" style={{ marginTop: 12 }}>
              KYC, holdings, watchlist &amp; SIP history can pre-fill context later — not asked again here.
            </p>
          </GuidedStep>
        );
      default:
        return null;
    }
  };

  if (phase === "summary") {
    return (
      <div>
        <div className="discover-rank-hero">
          <div className="discover-rank-hero-tag">Guided discovery</div>
          <h3>Rank Regular funds by your preferences</h3>
          <p>Tell us about this investment — we rank using criteria you select</p>
        </div>
        <InvestmentDnaCard
          summary={summary}
          onEdit={() => { setPhase("wizard"); setStepIndex(0); }}
        />
        <div className="discover-popular">
          <div className="discover-popular-lbl">Quick start combos</div>
          <div className="discover-popular-row">
            {POPULAR_COMBOS.map((c) => (
              <button key={c.id} type="button" className="discover-combo-btn" onClick={() => applyCombo(c.id)}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
        {error && <div className="discover-error"><AlertCircle size={16}/> {error}</div>}
        <button type="button" className="btn btn-grad btn-full discover-rank-cta" disabled={loading} onClick={runRank}>
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Loader size={16} style={{ animation: "spin 0.7s linear infinite" }}/> Ranking funds…
            </span>
          ) : (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              Show ranked funds <ArrowRight size={18}/>
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="discover-rank-hero">
        <div className="discover-rank-hero-tag">Step {stepIndex + 1} of {steps.length}</div>
        <h3>Tell us about this investment</h3>
        <p>Nivya uses your answers to rank funds — not to give personal advice</p>
      </div>
      <p className="discover-guided-intro">
        {prefs.goal === "emergency"
          ? "Emergency goals surface liquid & hybrid categories only."
          : prefs.goal === "tax-saving"
            ? "Tax saving goals focus on ELSS Regular plans."
            : "Categories are chosen from your goal and safety preference."}
      </p>
      <WizardProgress steps={steps} currentIndex={stepIndex}/>
      {renderStep()}
      <div className="discover-wizard-nav">
        {(stepIndex > 0 || prefs.completedWizard) && (
          <button type="button" className="discover-wizard-back" onClick={goBack}>Back</button>
        )}
        <button type="button" className="btn btn-grad" style={{ flex: 1, padding: "12px 0" }} onClick={goNext}>
          {stepIndex < steps.length - 1 ? "Continue" : "Save preferences"}
        </button>
      </div>
      {prefs.completedWizard && (
        <button type="button" className="discover-clear-btn" style={{ width: "100%" }}
          onClick={() => setPhase("summary")}>
          Skip to ranked funds
        </button>
      )}
    </div>
  );
}

function RankResultCard({ fund, rank, prefs, onOpen, onInvest, onAsk }) {
  const name = fund.schemeName?.replace(/\s*-\s*Regular.*$/i, "") ?? fund.schemeCode;
  const cat = catLabel(fund.category);
  const score = fund.performanceScore ?? 0;
  const tags = prefs ? buildWhyTags(fund, prefs) : (fund.reasons ?? []).slice(0, 3).map((r) =>
    r.text?.split("(")[0]?.trim() ?? REASON_SHORT[r.code] ?? r.code
  );

  return (
    <div className="discover-rank-card">
      <div className="discover-rank-card-top">
        <div className="discover-rank-num" style={{ background: RANK_COLORS[(rank - 1) % RANK_COLORS.length] }}>
          {rank}
        </div>
        <FundAvatar h={fund.amc} size={38}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="discover-fund-name">{name}</div>
          <div className="discover-fund-sub" style={{ marginTop: 3 }}>
            <span className="reg-badge" style={{ marginTop: 0, display: "inline-block" }}>Regular</span>
            <span>{fund.amc?.split(" ")[0]} · {cat}</span>
          </div>
        </div>
        <div className="discover-rank-score">
          <div className="n num">{score}</div>
          <div className="l">Score</div>
        </div>
      </div>

      <div className="discover-rank-returns">
        {[["Past 1Y", fund.pastReturn1y], ["Past 3Y", fund.pastReturn3y], ["Past 5Y", fund.pastReturn5y]].map(([k, v]) => (
          <div key={k} className="cell">
            <div className="k">{k}</div>
            <div className={`v num up`}>{v != null ? `${Number(v).toFixed(1)}%` : "—"}</div>
          </div>
        ))}
        <div className="cell">
          <div className="k">Volatility</div>
          <div className="v num">{fund.volatilityPct != null ? `${fund.volatilityPct.toFixed(1)}%` : "—"}</div>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="discover-rank-why">
          <div className="discover-rank-why-lbl">Why this fund appears</div>
          <div className="discover-rank-tags">
            {tags.map((t) => <span key={t} className="discover-rank-tag">{t}</span>)}
          </div>
        </div>
      )}

      <div className="discover-rank-actions">
        <button type="button" className="ghost" onClick={() => onOpen(fund)}>View details</button>
        <button type="button" className="ask" onClick={() => onAsk(fund)}>
          <MessageCircle size={12} style={{ display: "inline", verticalAlign: -2, marginRight: 3 }}/>
          Ask Nivya
        </button>
        <button type="button" className="invest" onClick={() => onInvest(fund)}>Invest</button>
      </div>
    </div>
  );
}

function DiscoverRankResults({ results, prefs, mode, horizonMonths, onBack, onOpenFund, onInvest, onAsk }) {
  const hLabel = horizonMonths >= 12 ? `${Math.round(horizonMonths / 12)}Y` : `${horizonMonths}M`;
  const summary = prefs ? buildDnaSummary(prefs) : null;
  const allFunds = useMemo(() => {
    const items = [];
    for (const bk of results.buckets ?? []) {
      for (const f of bk.items ?? []) items.push(f);
    }
    return items;
  }, [results]);

  const asOn = results.dataAsOn
    ? new Date(results.dataAsOn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  return (
    <div className="scroll discover-scroll">
      <button type="button" className="back" style={{ display: "flex", alignItems: "center", gap: 6, border: "none", background: "none", padding: "0 0 12px", fontWeight: 800, color: "var(--brand-ink)", cursor: "pointer", fontFamily: "var(--font)" }} onClick={onBack}>
        <ArrowLeft size={18}/> Back to preferences
      </button>

      <div className="discover-rank-results-head">
        <h3>{allFunds.length} ranked funds</h3>
        <div className="meta">
          {summary ? `${summary.goal} · ` : ""}{mode} · {hLabel}<br/>
          As on {asOn}
        </div>
      </div>

      <div style={{ fontSize: 10.5, color: "var(--muted)", fontWeight: 600, marginBottom: 12, lineHeight: 1.45 }}>
        Ranked using criteria you selected · Regular plans only · Not investment advice
      </div>

      {allFunds.length === 0 ? (
        <div className="discover-compare-empty">
          <BarChart3 size={36} color="var(--faint)"/>
          <p>No funds matched. Try different categories or risk level.</p>
        </div>
      ) : allFunds.map((fund, i) => (
        <RankResultCard
          key={fund.schemeCode}
          fund={fund}
          rank={i + 1}
          prefs={prefs}
          onOpen={onOpenFund}
          onInvest={onInvest}
          onAsk={onAsk}
        />
      ))}

      <div className="discover-foot-note" style={{ marginTop: 16 }}>
        Past performance does not guarantee future results · SID/KIM consent required before investing
      </div>
    </div>
  );
}

function ComparePanel({ funds, watch, openFund, setOrder, toast }) {
  const [selected, setSelected] = useState([]);
  const [q, setQ] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const addFund = (f) => {
    if (selected.find((s) => s.id === f.id)) return;
    if (selected.length >= 4) {
      toast("Compare up to 4 funds at a time");
      return;
    }
    setSelected((prev) => [...prev, f]);
    setQ("");
    setShowPicker(false);
  };

  const picks = useMemo(() => {
    const k = q.toLowerCase().trim();
    if (!k) return funds.slice(0, 8);
    return funds.filter((f) =>
      f.s.toLowerCase().includes(k) || f.h.toLowerCase().includes(k)
    ).slice(0, 8);
  }, [funds, q]);

  const rows = [
    { k: "Category", fn: (f) => f.cat },
    { k: "Riskometer", fn: (f) => f.risk, gauge: true },
    { k: "Expense (TER)", fn: (f) => (f.expense != null ? `${f.expense}%` : "—") },
    { k: "AUM", fn: (f) => `${(((hashStr(f.id) % 900) + 100) / 10).toFixed(1)}K Cr` },
    { k: "Past 1Y", fn: (f) => (f.r1 != null ? `${Number(f.r1).toFixed(1)}%` : "—"), past: true },
    { k: "Past 3Y", fn: (f) => (f.r3 != null ? `${Number(f.r3).toFixed(1)}%` : "—"), past: true },
    { k: "Past 5Y", fn: (f) => (f.r5 != null ? `${Number(f.r5).toFixed(1)}%` : "—"), past: true },
    { k: "Min SIP", fn: (f) => inr0(f.minSip ?? 500) },
  ];

  return (
    <div className="discover-compare-panel">
      <div className="discover-compare-chips">
        {selected.map((f) => (
          <span key={f.id} className="discover-compare-chip">
            {f.s.length > 22 ? `${f.s.slice(0, 20)}…` : f.s}
            <button type="button" onClick={() => setSelected((p) => p.filter((x) => x.id !== f.id))}><X size={12}/></button>
          </span>
        ))}
        {selected.length < 4 && (
          <button type="button" className="discover-compare-add" onClick={() => setShowPicker((v) => !v)}>
            <Plus size={14}/> Add fund
          </button>
        )}
      </div>

      {showPicker && (
        <>
          <div className="discover-search" style={{ marginBottom: 10 }}>
            <Search size={18} color="var(--faint)"/>
            <input placeholder="Search fund to compare…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus/>
          </div>
          <div className="discover-compare-picklist">
            {picks.map((f) => (
              <button key={f.id} type="button" onClick={() => addFund(f)}>{f.s}</button>
            ))}
          </div>
        </>
      )}

      {watch.length > 0 && selected.length < 4 && !showPicker && (
        <div style={{ marginBottom: 10 }}>
          <div className="field-lbl">From watchlist</div>
          <div className="chips">
            {watch.map((id) => {
              const f = funds.find((x) => x.id === id);
              if (!f || selected.find((s) => s.id === id)) return null;
              return (
                <button key={id} type="button" className="chip" onClick={() => addFund(f)}>+ {f.h.split(" ")[0]}</button>
              );
            })}
          </div>
        </div>
      )}

      {selected.length >= 2 ? (
        <>
          <div className="discover-compare-table-wrap">
            <table className="discover-compare-table">
              <thead>
                <tr>
                  <th/>
                  {selected.map((f) => (
                    <th key={f.id}>
                      <FundAvatar h={f.h} size={36}/>
                      <div className="discover-compare-th-name">{f.s}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.k}>
                    <td className="discover-compare-label">{row.k}</td>
                    {selected.map((f) => (
                      <td key={f.id} className={row.past ? "num up" : ""} style={{ textAlign: "center" }}>
                        {row.gauge ? <Riskometer risk={row.fn(f)}/> : row.fn(f)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="discover-foot-note" style={{ marginTop: 10 }}>
            Factual comparison only — not a recommendation. Past performance does not guarantee future results.
          </div>
          <div className="discover-compare-sticky">
            <div className="discover-compare-actions" style={{ marginTop: 0 }}>
              <button type="button" className="discover-clear-btn" onClick={() => setSelected([])}>Clear all</button>
              <button
                type="button"
                className="btn btn-grad"
                style={{ flex: 1 }}
                onClick={() => setOrder({ fund: selected[0], mode: "SIP" })}
              >
                Invest in selected
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="discover-compare-empty">
          <BarChart3 size={36} color="var(--faint)"/>
          <p>Select 2–4 funds to compare side by side</p>
          <button type="button" className="discover-compare-add" style={{ marginTop: 16 }} onClick={() => setShowPicker(true)}>
            <Plus size={14}/> Add fund
          </button>
        </div>
      )}
    </div>
  );
}

function ToolsPanel({ toast, onIllustrative }) {
  const items = [
    { section: "Calculators", rows: [
      { icon: <Calculator size={20}/>, t: "SIP Calculator", s: "Project future value of monthly SIPs", action: () => onIllustrative?.("sip") },
      { icon: <Calculator size={20}/>, t: "Lumpsum Calculator", s: "One-time investment growth illustration", action: () => onIllustrative?.("lumpsum") },
    ]},
    { section: "Data explorers", rows: [
      { icon: <BarChart3 size={20}/>, t: "Rolling Returns Explorer", s: "Past 1Y / 3Y / 5Y rolling windows", action: () => toast("Rolling returns explorer — coming soon") },
    ]},
    { section: "Knowledge & transparency", rows: [
      { icon: <ShieldCheck size={20}/>, t: "How Nivya earns", s: "Regular plan trail from AMCs — transparent", action: () => toast("How Nivya earns — see Profile → More") },
      { icon: <HelpCircle size={20}/>, t: "Understanding Regular Plans", s: "Regular vs Direct — our distributor model", action: () => toast("Regular plans include distributor services under AMFI ARN") },
      { icon: <AlertCircle size={20}/>, t: "Know the Risks", s: "Standard MF risk disclaimers", action: () => toast("Mutual fund investments are subject to market risks") },
    ]},
  ];

  return (
    <div>
      {items.map((sec) => (
        <div key={sec.section} className="discover-tools-section">
          <div className="discover-tools-heading">{sec.section}</div>
          {sec.rows.map((row) => (
            <button key={row.t} type="button" className="discover-tool-row" onClick={row.action}>
              <div className="discover-tool-ic">{row.icon}</div>
              <div className="discover-tool-text">
                <div className="discover-tool-title">{row.t}</div>
                <div className="discover-tool-sub">{row.s}</div>
              </div>
              <ChevronRight size={18} color="var(--faint)"/>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

function AskNivyaFab({ onClick }) {
  return (
    <button type="button" className="discover-ask-fab" onClick={onClick}>
      <MessageCircle size={20}/>
      <span>Ask Nivya</span>
    </button>
  );
}

/**
 * @param {{
 *   funds: object[], watch: string[], openFund: function, toggleWatch: function,
 *   setOrder: function, toast: function, initialSegment?: string,
 * }} props
 */
export default function DiscoverScreen({
  funds, watch, openFund, toggleWatch, setOrder, toast, initialSegment = "browse",
}) {
  const [segment, setSegment] = useState(initialSegment);
  const [rankResults, setRankResults] = useState(null);
  const [rankPrefs, setRankPrefs] = useState(null);
  const [rankMode, setRankMode] = useState("SIP");
  const [rankHorizon, setRankHorizon] = useState(60);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatFund, setChatFund] = useState(null);
  const [rankChatResults, setRankChatResults] = useState(null);

  useEffect(() => {
    setSegment(initialSegment);
  }, [initialSegment]);

  const handleRankResults = useCallback((res, prefs, m, h) => {
    setRankResults(res);
    setRankPrefs(prefs);
    setRankMode(m);
    setRankHorizon(h);
    setRankChatResults(res);
  }, []);

  const handleOpenScreenerFund = useCallback((fund) => {
    openFund(mapScreenerFund(fund));
  }, [openFund]);

  const handleInvestScreenerFund = useCallback((fund) => {
    const mode = rankPrefs?.frequencyId === "once" ? "Lumpsum" : "SIP";
    setOrder({ fund: mapScreenerFund(fund), mode });
  }, [setOrder, rankPrefs]);

  const openRankChat = useCallback((fund = null) => {
    setChatFund(fund);
    setChatOpen(true);
  }, []);

  if (rankResults) {
    return (
      <>
        <DiscoverRankResults
          results={rankResults}
          prefs={rankPrefs}
          mode={rankMode}
          horizonMonths={rankHorizon}
          onBack={() => { setRankResults(null); setRankPrefs(null); }}
          onOpenFund={handleOpenScreenerFund}
          onInvest={handleInvestScreenerFund}
          onAsk={openRankChat}
        />
        {chatOpen && (
          <FundChatPanel
            key={chatFund?.schemeCode ?? "rank"}
            results={rankChatResults}
            initialFund={chatFund}
            onClose={() => { setChatOpen(false); setChatFund(null); }}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="scroll discover-scroll">
        <DiscoverSubNav segment={segment} onChange={setSegment}/>

        {segment === "browse" && (
          <BrowsePanel funds={funds} watch={watch} openFund={openFund} toggleWatch={toggleWatch}/>
        )}
        {segment === "rank" && (
          <RankPanel onResults={handleRankResults} toast={toast}/>
        )}
        {segment === "compare" && (
          <ComparePanel funds={funds} watch={watch} openFund={openFund} setOrder={setOrder} toast={toast}/>
        )}
        {segment === "tools" && (
          <ToolsPanel toast={toast} onIllustrative={() => toast("Open Portfolio → illustrative calculator, or use Rank tab")}/>
        )}

        <details className="compliance-fold" style={{ marginTop: 16 }}>
          <summary>
            AMFI-registered MFD · Past returns only · Not investment advice
            <ChevronRight size={14} style={{ transform: "rotate(90deg)", flex: "none" }}/>
          </summary>
          <div className="body">
            Mutual fund investments are subject to market risks. Read all scheme-related documents carefully.
            SID/KIM consent required before first investment per scheme.
          </div>
        </details>
      </div>

      {!chatOpen && <AskNivyaFab onClick={() => openRankChat(null)}/>}
      {chatOpen && !rankResults && (
        <FundChatPanel onClose={() => setChatOpen(false)}/>
      )}
    </>
  );
}
