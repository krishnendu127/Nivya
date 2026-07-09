/**
 * Fund Q&A — Nivya mutual fund research assistant (factual, not investment advice).
 */
import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X, Shield, Bot, Ban, UserRound, HelpCircle, Loader2,
} from "lucide-react";
import { isAdviceQuestion } from "../packages/chatbot-core/src/guardrails.js";
import { streamFundChat } from "./nivya-api.js";
import { FundMentionInput } from "./FundMentionInput.jsx";

const RATE_LIMIT_MS = 20000;

const AV_COLORS = ["#2456BE", "#0E9C8E", "#7A5AF8", "#E8943A", "#D6409F", "#16A35A"];
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0); }
function avColor(s) { return AV_COLORS[hashStr(s) % AV_COLORS.length]; }

const EMPTY_SUGGESTIONS = [
  "What is a SIP?",
  "What is expense ratio?",
  "Compare Flexi Cap vs Large Cap",
  "@HDFC Flexi Cap Fund past 3Y CAGR?",
];

const FEATURES = [
  { ic: HelpCircle, text: "Ask general MF questions" },
  { ic: AtIcon, text: "@mention a fund for specific data" },
  { ic: Shield, text: "All data is from official sources" },
  { ic: Ban, text: "I don't provide advice or recommendations" },
];

function AtIcon(props) {
  return <span className="fq-at-ic" {...props}>@</span>;
}

function normalizeFund(f) {
  if (!f) return null;
  if (f.schemeCode) return f;
  return {
    schemeCode: f.id,
    schemeName: f.s,
    name: f.s,
    amc: f.h,
    category: f.cat,
    pastReturn1y: f.r1,
    pastReturn3y: f.r3,
    pastReturn5y: f.r5,
    nav: f.nav,
    riskometer: f.risk,
    expenseRatio: f.expense,
  };
}

function fundShortName(fund) {
  return String(fund?.schemeName ?? fund?.name ?? "this fund").replace(/\s*-\s*Regular.*$/i, "").trim();
}

function fundSuggestions(fund) {
  const short = fundShortName(fund);
  return [
    "Past 1Y",
    "Past 5Y",
    "Expense ratio",
    `What is ${short.split(" ")[0]}'s 3Y CAGR?`,
  ];
}

function renderAnswer(text) {
  const parts = String(text).split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
  );
}

function FundLogo({ amc, size = 28 }) {
  return (
    <div className="fq-fund-logo" style={{ background: avColor(amc ?? ""), width: size, height: size, fontSize: size * 0.34 }}>
      {String(amc ?? "?").slice(0, 2).toUpperCase()}
    </div>
  );
}

function EmptyState({ onPick }) {
  return (
    <div className="fq-empty">
      <div className="fq-welcome">
        <div className="fq-welcome-ic"><Bot size={28}/></div>
        <h3>Hi! I&apos;m Nivya 👋</h3>
        <p>Your mutual fund research assistant</p>
        <ul>
          {FEATURES.map(({ ic: Icon, text }) => (
            <li key={text}><Icon size={15}/>{text}</li>
          ))}
        </ul>
      </div>
      <div className="fq-try">
        <span>Try these questions</span>
        {EMPTY_SUGGESTIONS.map((q) => (
          <button key={q} type="button" onClick={() => onPick(q)}>{q}</button>
        ))}
      </div>
    </div>
  );
}

function AdviceBlocked({ onHelp, onLearn }) {
  return (
    <div className="fq-advice">
      <Shield size={18}/>
      <b>I can&apos;t help with advice or recommendations.</b>
      <p>
        I can share factual data about funds — past returns, expense ratio, risk metrics — but I cannot
        tell you whether to buy, sell, or hold. Investment decisions are yours; Nivya executes as your AMFI-registered distributor.
      </p>
      <div className="fq-advice-btns">
        <button type="button" onClick={onHelp}>See what I can answer</button>
        <button type="button" className="ghost" onClick={onLearn}>Learn how to evaluate funds</button>
      </div>
    </div>
  );
}

function ChatBubble({ role, text, type }) {
  if (type === "advice") {
    return null;
  }
  const isUser = role === "user";
  return (
    <div className={`fq-msg ${isUser ? "user" : "bot"}`}>
      {!isUser && (
        <div className="fq-avatar bot"><Bot size={14}/></div>
      )}
      <div className="bubble">
        {text ? renderAnswer(text) : <Loader2 size={16} className="fq-spin"/>}
      </div>
      {isUser && (
        <div className="fq-avatar user"><UserRound size={14}/></div>
      )}
    </div>
  );
}

function RateLimitBanner({ seconds }) {
  return (
    <div className="fq-rate">
      <div>
        <b>You&apos;re sending questions too quickly.</b>
        <p>Please wait {seconds} seconds before sending another message.</p>
      </div>
      <div className="fq-rate-timer" aria-hidden>
        <span>{seconds}</span>
        <small>sec</small>
      </div>
    </div>
  );
}

/**
 * @param {{ results?: object, initialFund?: object|null, onClose: function }} props
 */
export function FundChatPanel({ results, initialFund = null, onClose }) {
  const normInitial = normalizeFund(initialFund);
  const [activeFunds, setActiveFunds] = useState(() => (normInitial ? [normInitial] : []));
  const [messages, setMessages] = useState([]);
  const [rateLimitSec, setRateLimitSec] = useState(0);
  const [inputDisabled, setInputDisabled] = useState(false);

  const scrollRef = useRef(null);
  const lastSendRef = useRef(0);

  const isEmpty = messages.length === 0;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, rateLimitSec]);

  useEffect(() => {
    if (rateLimitSec <= 0) return undefined;
    const id = setTimeout(() => setRateLimitSec((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [rateLimitSec]);

  const sendQuestion = useCallback((rawText, mentionedFunds = []) => {
    const q = String(rawText ?? "").trim();
    if (!q || rateLimitSec > 0) return;

    const now = Date.now();
    if (lastSendRef.current && now - lastSendRef.current < RATE_LIMIT_MS) {
      const remaining = Math.ceil((RATE_LIMIT_MS - (now - lastSendRef.current)) / 1000);
      setRateLimitSec(remaining);
      return;
    }
    lastSendRef.current = now;

    const funds = mentionedFunds.length > 0 ? mentionedFunds : activeFunds;
    if (mentionedFunds.length > 0) setActiveFunds(mentionedFunds);

    const displayText = q.replace(/@\[([^\]]+)\]/g, "@$1");

    if (isAdviceQuestion(displayText)) {
      setMessages((prev) => [
        ...prev,
        { id: `u-${Date.now()}`, role: "user", text: displayText },
        { id: `a-${Date.now()}`, role: "bot", type: "advice", text: "" },
      ]);
      return;
    }

    const historyForLLM = messages
      .filter((m) => m.type !== "advice" && m.text)
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text: displayText }]);

    const botId = `b-${Date.now()}`;
    setMessages((prev) => [...prev, { id: botId, role: "bot", text: "" }]);
    setInputDisabled(true);

    streamFundChat({
      question: q,
      funds,
      history: historyForLLM,
      onDelta: (chunk) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === botId ? { ...m, text: m.text + chunk } : m))
        );
      },
    })
      .catch((err) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botId
              ? { ...m, text: `Sorry, something went wrong (${err.message}). Please try again.` }
              : m
          )
        );
      })
      .finally(() => setInputDisabled(false));
  }, [activeFunds, results?.dataAsOn, messages, rateLimitSec]);

  const removeActiveFund = useCallback((schemeCode) => {
    setActiveFunds((prev) => prev.filter((f) => f.schemeCode !== schemeCode));
  }, []);

  const suggestions = activeFunds[0] ? fundSuggestions(activeFunds[0]) : [];

  const panel = (
    <div className="fq-scrim" onClick={onClose} role="dialog" aria-label="Fund Q&A">
      <div className="fq-panel" onClick={(e) => e.stopPropagation()}>
        <div className="fq-head">
          <div className="fq-head-top">
            <h2>Fund Q&A</h2>
            <button type="button" className="iconbtn" onClick={onClose} aria-label="Close"><X size={18}/></button>
          </div>
          <p className="fq-disclaimer">
            <Shield size={12}/>
            Factual info only. Not investment advice or recommendation.
          </p>
        </div>

        <div className="fq-active">
          <span className="lbl">Active funds in this chat</span>
          {activeFunds.length === 0 ? (
            <p className="none">None yet. @mention a fund to get started.</p>
          ) : (
            <div className="fq-chips">
              {activeFunds.map((f) => (
                <span key={f.schemeCode} className="fq-chip">
                  <FundLogo amc={f.amc} size={22}/>
                  {fundShortName(f)}
                  <button type="button" onClick={() => removeActiveFund(f.schemeCode)} aria-label={`Remove ${fundShortName(f)}`}>
                    <X size={12}/>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="fq-body" ref={scrollRef}>
          {isEmpty ? (
            <EmptyState onPick={sendQuestion}/>
          ) : (
            messages.map((m) => (
              <React.Fragment key={m.id}>
                {m.type === "advice" ? (
                  <AdviceBlocked
                    onHelp={() => sendQuestion("What can you help me with?")}
                    onLearn={() => sendQuestion("How do I evaluate mutual funds?")}
                  />
                ) : (
                  <ChatBubble role={m.role} text={m.text} type={m.type}/>
                )}
              </React.Fragment>
            ))
          )}
        </div>

        {rateLimitSec > 0 && <RateLimitBanner seconds={rateLimitSec}/>}

        {suggestions.length > 0 && !isEmpty && (
          <div className="fq-quick">
            {suggestions.map((s) => (
              <button key={s} type="button" onClick={() => sendQuestion(s)} disabled={rateLimitSec > 0 || inputDisabled}>
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="fq-compose">
          <FundMentionInput
            onSubmit={sendQuestion}
            disabled={inputDisabled}
            rateLimited={rateLimitSec > 0}
          />
        </div>

        <p className="fq-foot">
          Nivya can make mistakes. Verify important information. Source: AMFI | AMC Factsheets.
        </p>
      </div>
    </div>
  );

  const host = typeof document !== "undefined" ? document.querySelector(".phone") : null;
  return host ? createPortal(panel, host) : panel;
}

/** Floating button to open chat */
export function FundChatFab({ onClick }) {
  return (
    <button type="button" className="fq-fab" onClick={onClick} aria-label="Ask about funds">
      <HelpCircle size={22}/>
    </button>
  );
}
