/**
 * Onboarding — splash, value carousel, phone, PAN
 */
import React, { useEffect, useState } from "react";
import {
  ArrowLeft, ArrowRight, ShieldCheck, Lock, Info,
  PieChart, Smartphone, User, CreditCard, Landmark,
} from "lucide-react";

function FundSchemeIcon({ size = 16, strokeWidth = 2 }) {
  return <Landmark size={size} strokeWidth={strokeWidth} />;
}

function NivyaLogo({ size = 76 }) {
  return (
    <img
      src="/nivya-logo.png"
      width={size}
      height={size}
      alt="Nivya"
      style={{ display: "block", objectFit: "contain" }}
    />
  );
}

const CAROUSEL = [
  {
    title: (
      <>
        Discover &amp; compare <em>Regular funds</em>
        <br />
        <em>with clear data</em>
      </>
    ),
    body: "Explore thousands of Regular plan mutual funds with past performance, risk, cost and more.",
    foot: "We are an AMFI-registered Mutual Fund Distributor.",
    art: "discover",
  },
  {
    title: <>See your portfolio <em>clearly — factual insights, not advice</em></>,
    body: "Track holdings, SIPs, and returns in one place. Insights are descriptive only — you decide what to buy, sell, or hold.",
    foot: "We do not provide investment advice or recommendations.",
    art: "portfolio",
  },
  {
    title: <>You choose. <em>We execute.</em></>,
    body: "Place lumpsum orders, start SIPs, and redeem when you want. Nivya distributes Regular plans only under AMFI registration.",
    foot: "Regular plans only · Trail commission disclosed transparently.",
    art: "execute",
  },
];

const DISCOVER_FUNDS = [
  { name: "Large Cap Fund", pct: "18.45%", hi: true },
  { name: "Flexi Cap Fund", pct: "16.32%" },
  { name: "Small Cap Fund", pct: "19.28%" },
];

function DiscoverMagnifier() {
  return (
    <div className="ob-magnifier" aria-hidden>
      <svg className="ob-magnifier-svg" viewBox="0 0 96 96" fill="none">
        <line
          x1="10"
          y1="84"
          x2="29.5"
          y2="62.5"
          stroke="#16213E"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <circle cx="51" cy="40" r="26.5" fill="rgba(255,255,255,0.62)" />
        <ellipse
          cx="41"
          cy="31"
          rx="11"
          ry="6.5"
          fill="rgba(255,255,255,0.72)"
          transform="rotate(-28 41 31)"
        />
      </svg>
      <div className="ob-magnifier-zoom">
        <FundSchemeIcon size={22} strokeWidth={2.2} />
      </div>
      <svg className="ob-magnifier-ring" viewBox="0 0 96 96" fill="none" aria-hidden>
        <circle cx="51" cy="40" r="26.5" stroke="#16213E" strokeWidth="5.5" />
      </svg>
    </div>
  );
}

function DiscoverArt() {
  return (
    <div className="ob-discover-stage">
      <div className="ob-discover-bars" aria-hidden>
        <i style={{ height: "42%" }} />
        <i style={{ height: "68%" }} />
        <i style={{ height: "55%" }} />
        <i style={{ height: "78%" }} />
        <i style={{ height: "48%" }} />
      </div>
      <div className="ob-art-card ob-discover-card">
        <span className="ob-regular-badge">Regular</span>
        <div className="ob-fund-list">
          {DISCOVER_FUNDS.map((f) => (
            <div key={f.name} className={`ob-fund-row${f.hi ? " hi" : ""}`}>
              {f.hi ? (
                <div className="ob-fund-ic-wrap lens-host">
                  <span className="ob-fund-ic">
                    <FundSchemeIcon />
                  </span>
                  <DiscoverMagnifier />
                </div>
              ) : (
                <div className="ob-fund-ic-wrap">
                  <span className="ob-fund-ic">
                    <FundSchemeIcon />
                  </span>
                </div>
              )}
              <div className="ob-fund-meta">
                <b>{f.name}</b>
                <small>Past 3Y CAGR</small>
              </div>
              <span className="ob-fund-pct num">{f.pct}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const PORT_BARS = [
  { total: 32, light: 14 }, { total: 38, light: 16 }, { total: 35, light: 15 },
  { total: 42, light: 18 }, { total: 40, light: 17 }, { total: 48, light: 20 },
  { total: 44, light: 19 }, { total: 52, light: 22 }, { total: 50, light: 21 },
  { total: 56, light: 24 }, { total: 54, light: 23 }, { total: 60, light: 26 },
  { total: 58, light: 25 }, { total: 64, light: 28 }, { total: 62, light: 27 },
  { total: 68, light: 30 }, { total: 66, light: 29 }, { total: 72, light: 32 },
  { total: 70, light: 31 }, { total: 76, light: 34 }, { total: 74, light: 33 },
  { total: 80, light: 36 }, { total: 78, light: 35 }, { total: 84, light: 38 },
];

function PortfolioArt() {
  return (
    <div className="ob-art-card ob-port-card">
      <div className="ob-port-top">
        <div className="ob-port-stats">
          <div className="ob-port-hd">
            <span>Portfolio value</span>
            <b className="num">₹4,62,108</b>
          </div>
          <div className="ob-port-sub">
            <span>Total returns</span>
            <b className="num up">₹62,108 (15.54%)</b>
          </div>
        </div>
        <div className="ob-donut" aria-hidden>
          <span />
        </div>
      </div>
      <div className="ob-port-divider" aria-hidden />
      <div className="ob-port-bars" aria-hidden>
        <div className="ob-port-grid">
          <i /><i /><i /><i />
        </div>
        <div className="ob-port-bar-row">
          {PORT_BARS.map((bar, idx) => (
            <div key={idx} className="ob-port-bar" style={{ height: `${bar.total}%` }}>
              <i className="light" style={{ flexGrow: bar.light }} />
              <i className="dark" style={{ flexGrow: bar.total - bar.light }} />
            </div>
          ))}
        </div>
      </div>
      <div className="ob-port-foot">
        <span>Past performance only</span>
      </div>
    </div>
  );
}

function ExecuteArt() {
  return (
    <div className="ob-art-card ob-exec-card">
      <div className="ob-exec-row">
        <div className="ob-exec-tile"><span>Lumpsum</span><b>Invest once</b></div>
        <div className="ob-exec-tile on"><span>SIP</span><b>Every month</b></div>
        <div className="ob-exec-tile"><span>Redeem</span><b>Withdraw</b></div>
      </div>
      <div className="ob-exec-note">
        <ShieldCheck size={16} />
        Orders placed only after your explicit consent
      </div>
    </div>
  );
}

function CarouselArt({ type }) {
  if (type === "portfolio") return <PortfolioArt />;
  if (type === "execute") return <ExecuteArt />;
  return <DiscoverArt />;
}

function SplashScreen({ arn, euin, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="ob-splash">
      <div className="ob-splash-waves" aria-hidden />
      <div className="ob-splash-body">
        <NivyaLogo size={80} />
        <div className="ob-splash-name">Nivya</div>
        <div className="ob-splash-tag">
          Mutual funds. <em>Simplified.</em>
        </div>
        <div className="ob-splash-trust">
          <ShieldCheck size={14} />
          <div>
            <b>AMFI-registered Mutual Fund Distributor</b>
            <span>{arn} · {euin}</span>
          </div>
        </div>
      </div>
      <div className="ob-splash-foot">
        <div className="ob-dots">
          <span className="on" /><span /><span />
        </div>
        <p className="ob-splash-mf">MF only · Regular plans only</p>
        <p className="ob-splash-disc">
          Mutual fund investments are subject to market risks. Read all scheme-related documents carefully.
        </p>
      </div>
    </div>
  );
}

function CarouselScreen({ index, onIndex, onSkip, onDone }) {
  const slide = CAROUSEL[index];
  const last = index >= CAROUSEL.length - 1;

  return (
    <div className="ob-screen ob-carousel">
      <div className="ob-carousel-top">
        <button type="button" className="ob-skip" onClick={onSkip}>Skip</button>
      </div>
      <div className="ob-carousel-art">
        <CarouselArt type={slide.art} />
      </div>
      <div className="ob-carousel-copy">
        <h2>{slide.title}</h2>
        <p>{slide.body}</p>
      </div>
      <div className="ob-carousel-foot">
        <div className="ob-dots">
          {CAROUSEL.map((_, i) => (
            <span key={i} className={i === index ? "on" : ""} />
          ))}
        </div>
        <button type="button" className="ob-btn" onClick={() => (last ? onDone() : onIndex(index + 1))}>
          {last ? "Get started" : "Next"}
          <ArrowRight size={18} />
        </button>
        <button type="button" className="ob-link" onClick={onSkip}>Skip for now</button>
        <div className="ob-trust-line">
          <ShieldCheck size={13} />
          <span>{slide.foot}</span>
        </div>
      </div>
    </div>
  );
}

function PhoneScreen({ arn, euin, onBack, onContinue }) {
  const [phone, setPhone] = useState("");

  const digits = phone.replace(/\D/g, "").slice(0, 10);
  const valid = digits.length === 10;

  return (
    <div className="ob-screen ob-form">
      <button type="button" className="ob-back" onClick={onBack} aria-label="Back">
        <ArrowLeft size={20} />
      </button>
      <div className="ob-form-art ob-phone-art">
        <div className="ob-phone-illus">
          <div className="ph"><Smartphone size={28} color="#0FA8A0" /></div>
          <div className="ob-dash" />
          <div className="ob-shield"><ShieldCheck size={20} color="#0FA8A0" /></div>
          <div className="ob-dash" />
          <div className="usr"><User size={22} color="#2456BE" /></div>
        </div>
      </div>
      <h2>Welcome to Nivya</h2>
      <p className="ob-lead">Let&apos;s get started with your mobile number</p>
      <div className="ob-trust-box">
        <b>You choose. We execute.</b>
        <span>AMFI-registered Mutual Fund Distributor</span>
        <span className="num">{arn} · {euin}</span>
      </div>
      <label className="ob-field-lbl">Mobile number</label>
      <div className="ob-phone-in">
        <span className="cc">+91</span>
        <input
          type="tel"
          inputMode="numeric"
          placeholder="98765 43210"
          value={digits.replace(/(\d{5})(\d{0,5})/, (_, a, b) => (b ? `${a} ${b}` : a))}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
        />
      </div>
      <p className="ob-ssl"><Lock size={12} /> Secured by 256-bit SSL encryption</p>
      <div className="ob-form-spacer" />
      <div className="ob-form-foot">
        <div className="ob-trust-line">
          <ShieldCheck size={13} />
          <span>AMFI-registered Mutual Fund Distributor</span>
        </div>
        <button type="button" className="ob-btn" disabled={!valid} onClick={() => onContinue(digits)}>
          Continue
          <ArrowRight size={18} />
        </button>
        <p className="ob-legal">
          By proceeding, you agree to our{" "}
          <button type="button" className="ob-inline">Terms &amp; Conditions</button>
          {" "}and{" "}
          <button type="button" className="ob-inline">Privacy Policy</button>
        </p>
      </div>
    </div>
  );
}

function PanScreen({ onBack, onComplete }) {
  const [pan, setPan] = useState("");
  const value = pan.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
  const valid = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value);

  return (
    <div className="ob-screen ob-form">
      <button type="button" className="ob-back" onClick={onBack} aria-label="Back">
        <ArrowLeft size={20} />
      </button>
      <div className="ob-form-art">
        <div className="ob-pan-ic">
          <CreditCard size={32} color="#0FA8A0" />
        </div>
      </div>
      <h2>One last step before you invest</h2>
      <div className="ob-info-box">
        <Info size={15} />
        <p>
          SEBI requires PAN verification before mutual fund transactions. We verify securely with official records — no manual uploads needed in this demo.
        </p>
      </div>
      <label className="ob-field-lbl" htmlFor="ob-pan">Enter your PAN</label>
      <input
        id="ob-pan"
        className="ob-pan-in"
        type="text"
        placeholder="ABCDE1234F"
        value={value}
        onChange={(e) => setPan(e.target.value)}
        autoCapitalize="characters"
      />
      <p className="ob-pan-note"><Info size={12} /> We will verify your PAN securely with official records.</p>
      <div className="ob-form-spacer" />
      <div className="ob-form-foot">
        <button type="button" className="ob-btn" disabled={!valid} onClick={() => onComplete(value)}>
          Continue
          <ArrowRight size={18} />
        </button>
        <p className="ob-safe"><Lock size={12} /> Your data is safe with us. We do not store your PAN.</p>
        <p className="ob-splash-disc ob-pan-disc">
          Mutual fund investments are subject to market risks. Read all scheme-related documents carefully before investing.
        </p>
      </div>
    </div>
  );
}

const PHASES = ["splash", "carousel", "phone", "pan"];

/**
 * @param {{ arn, euin, onComplete }} props
 */
export default function OnboardingFlow({ arn, euin, onComplete }) {
  const [phase, setPhase] = useState("splash");
  const [carouselIndex, setCarouselIndex] = useState(0);

  const skipToApp = () => onComplete();
  const finishCarousel = () => setPhase("phone");

  let body;
  if (phase === "splash") {
    body = <SplashScreen arn={arn} euin={euin} onDone={() => setPhase("carousel")} />;
  } else if (phase === "carousel") {
    body = (
      <CarouselScreen
        index={carouselIndex}
        onIndex={setCarouselIndex}
        onSkip={skipToApp}
        onDone={finishCarousel}
      />
    );
  } else if (phase === "phone") {
    body = (
      <PhoneScreen
        arn={arn}
        euin={euin}
        onBack={() => { setPhase("carousel"); setCarouselIndex(CAROUSEL.length - 1); }}
        onContinue={() => setPhase("pan")}
      />
    );
  } else {
    body = (
      <PanScreen
        onBack={() => setPhase("phone")}
        onComplete={() => onComplete()}
      />
    );
  }

  return <div className="ob-flow">{body}</div>;
}

export { PHASES };
