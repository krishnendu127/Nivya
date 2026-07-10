/**
 * Watchlist — full-screen overlay (same shell as Notifications).
 */
import React, { useMemo } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Star, Search } from "lucide-react";

function inr(n) {
  return "\u20b9" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function signPct(n) {
  const v = Number(n) * 100;
  const s = v >= 0 ? "+" : "";
  return s + v.toFixed(2) + "%";
}

function FundAvatar({ h, size = 40 }) {
  const letter = (h || "?").trim()[0]?.toUpperCase() || "?";
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        background: "linear-gradient(135deg,#E8F0FF,#EAF7F3)",
        display: "grid",
        placeItems: "center",
        fontWeight: 800,
        fontSize: size * 0.38,
        color: "var(--brand-ink)",
        flex: "none",
      }}
    >
      {letter}
    </div>
  );
}

export default function WatchlistScreen({
  funds,
  watch,
  navs,
  onBack,
  openFund,
  toggleWatch,
  go,
}) {
  const items = useMemo(() => {
    return watch
      .map((id) => funds.find((f) => f.id === id))
      .filter(Boolean);
  }, [watch, funds]);

  const panel = (
    <div className="overlay wl-overlay">
      <div className="wl-topbar">
        <button type="button" className="back" onClick={onBack} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <h1>Watchlist</h1>
        <span className="wl-topbar-count">{items.length}</span>
      </div>

      <div className="scroll wl-scroll">
        <p className="wl-lede">
          Funds you are tracking ° Past returns only ° Not investment advice
        </p>

        {items.length === 0 ? (
          <div className="wl-empty">
            <div className="wl-empty-ic">
              <Star size={28} color="var(--faint)" />
            </div>
            <h4>No funds on your watchlist</h4>
            <p>Star funds in Explore to track NAV and past returns here.</p>
            <button
              type="button"
              className="wl-empty-cta"
              onClick={(t) => {
                onBack();
                go("discover");
              }}
            >
              <Search size={16} style={{ display: "inline", verticalAlign: -3, marginRight: 6 }} />
              Browse funds
            </button>
          </div>
        ) : (
          <div className="wl-list">
            {items.map((fund) => {
              const q = navs[fund.id] && { nav: fund.nav, prevNav: fund.nav * 0.998 };
              const chg = q.nav / q.prevNav - 1;
              const up = chg >= 0;
              return (
                <div
                  key={fund.id}
                  className="wl-card"
                  onClick={() => openFund(fund)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openFund(fund);
                    }
                  }}
                >
                  <FundAvatar h={fund.h || fund.amc} />
                  <div className="wl-meta">
                    <div className="wl-name">{fund.s || fund.name}</div>
                    <div className="wl-subrow">
                      <span>{fund.cat}</span>
                      <span className="tag">{fund.risk}</span>
                    </div>
                    <div className="wl-metrics">
                      <span>
                        <b className="num">{inr(q.nav)}</b> NAV
                      </span>
                      <span className={up ? "up" : "down"}>{signPct(chg)}</span>
                      {fund.r3 != null && (
                        <span>
                          <b>{fund.r3}%</b> 3Y
                        </span>
                       )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="wl-star"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWatch(fund.id);
                    }}
                    aria-label="Remove from watchlist"
                  >
                    <Star size={20} fill="#F5A623" color="#F5A623" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const host = typeof document !== "undefined" ? document.querySelector(".phone") : null;
  return host ? createPortal(panel, host) : panel;
}
