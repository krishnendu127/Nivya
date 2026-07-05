/**
 * Mutual Fund Q&A chat — general MF conversation plus @mention-grounded fund data (not investment advice).
 */
import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { MessageCircle, X, Bot, User } from "lucide-react";
import { CHAT_DISCLAIMER } from "../packages/screener-core/src/fund-chat.js";
import { streamFundChat } from "./nivya-api.js";
import { FundMentionInput } from "./FundMentionInput.jsx";

const GENERAL_SUGGESTIONS = [
  "What is a SIP?",
  "Regular vs Direct plan?",
  "What does expense ratio mean?",
];

function fundShortName(fund) {
  return String(fund?.schemeName ?? fund?.name ?? "this fund").replace(/\s*-\s*Regular.*$/i, "").trim();
}

function fundSuggestions(fund) {
  const short = fundShortName(fund).split(" ")[0] ?? "this fund";
  return [
    `Tell me about ${short}`,
    "What is the past 3Y CAGR?",
    "What is the expense ratio?",
  ];
}

function renderAnswer(text) {
  const parts = String(text).split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
  );
}

function ChatMessage({ role, text }) {
  const isBot = role === "bot";
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "flex-start",
      flexDirection: isBot ? "row" : "row-reverse" }}>
      <div style={{ width: 28, height: 28, borderRadius: 999, flex: "none",
        background: isBot ? "#EAF7F3" : "#E8F0FF", color: isBot ? "#0B7E78" : "#2456BE",
        display: "grid", placeItems: "center" }}>
        {isBot ? <Bot size={14}/> : <User size={14}/>}
      </div>
      <div style={{ maxWidth: "82%", padding: "10px 12px", borderRadius: 14,
        fontSize: 12.5, lineHeight: 1.5, fontWeight: 600,
        background: isBot ? "#fff" : "#16213E", color: isBot ? "#0D1526" : "#fff",
        border: isBot ? "1px solid #EAECF0" : "none",
        whiteSpace: "pre-wrap" }}>
        {renderAnswer(text)}
      </div>
    </div>
  );
}

/**
 * @param {{ results?: object, initialFund?: object|null, onClose: function }} props
 */
export function FundChatPanel({ results, initialFund = null, onClose }) {
  const [activeFunds, setActiveFunds] = useState(() => (initialFund ? [initialFund] : []));
  const [messages, setMessages] = useState(() => [{
    id: "welcome",
    role: "bot",
    text: initialFund
      ? `Hi — ask factual questions about **${fundShortName(initialFund)}**, or type **@** to bring another fund into the conversation. I share past returns, scores, and ranking reasons — not buy/sell advice.`
      : "Hi — ask me anything about mutual funds. Type **@** to bring a specific fund's data into the conversation.",
  }]);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendQuestion = useCallback((rawText, mentionedFunds = []) => {
    const q = String(rawText ?? "").trim();
    if (!q) return;

    const funds = mentionedFunds.length > 0 ? mentionedFunds : activeFunds;
    if (mentionedFunds.length > 0) setActiveFunds(mentionedFunds);

    const displayText = q.replace(/@\[([^\]]+)\]/g, "@$1");

    const historyForLLM = messages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text: displayText }]);

    const botId = `b-${Date.now()}`;
    setMessages((prev) => [...prev, { id: botId, role: "bot", text: "" }]);

    streamFundChat({
      question: q,
      funds,
      dataAsOn: results?.dataAsOn,
      history: historyForLLM,
      onDelta: (chunk) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === botId ? { ...m, text: m.text + chunk } : m))
        );
      },
    }).catch((err) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botId
            ? { ...m, text: `Sorry, something went wrong (${err.message}). Please try again.` }
            : m
        )
      );
    });
  }, [activeFunds, results?.dataAsOn, messages]);

  const removeActiveFund = useCallback((schemeCode) => {
    setActiveFunds((prev) => prev.filter((f) => f.schemeCode !== schemeCode));
  }, []);

  const suggestions = activeFunds[0] ? fundSuggestions(activeFunds[0]) : GENERAL_SUGGESTIONS;

  const panel = (
    <div
      role="dialog"
      aria-label="Fund Q&A"
      style={{ position: "absolute", inset: 0, zIndex: 55, display: "flex", flexDirection: "column",
        background: "rgba(13,21,38,.45)" }}
      onClick={onClose}
    >
      <div
        style={{ marginTop: "auto", background: "#F4F6F9", borderRadius: "22px 22px 0 0",
          maxHeight: "78%", display: "flex", flexDirection: "column", boxShadow: "0 -8px 40px rgba(0,0,0,.15)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #EAECF0", background: "#fff",
          borderRadius: "22px 22px 0 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <MessageCircle size={18} color="#0B7E78"/>
              <span style={{ fontSize: 15, fontWeight: 800 }}>Fund Q&A</span>
            </div>
            <button type="button" onClick={onClose}
              style={{ border: "none", background: "#F2F4F7", borderRadius: 999, width: 32, height: 32,
                display: "grid", placeItems: "center", cursor: "pointer" }}>
              <X size={18}/>
            </button>
          </div>
          {activeFunds.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              {activeFunds.map((f) => (
                <span key={f.schemeCode} style={{ display: "flex", alignItems: "center", gap: 6,
                  fontSize: 12.5, fontWeight: 700, color: "#2456BE",
                  background: "#E8F0FF", borderRadius: 999, padding: "5px 8px 5px 14px" }}>
                  @{fundShortName(f)}
                  <button type="button" onClick={() => removeActiveFund(f.schemeCode)}
                    aria-label={`Remove ${fundShortName(f)} from context`}
                    style={{ border: "none", background: "rgba(36,86,190,.15)", color: "#2456BE",
                      borderRadius: 999, width: 18, height: 18, display: "grid", placeItems: "center",
                      cursor: "pointer", flex: "none", padding: 0 }}>
                    <X size={12}/>
                  </button>
                </span>
              ))}
            </div>
          )}
          <div style={{ fontSize: 10, color: "#667085", fontWeight: 600, lineHeight: 1.4 }}>
            {CHAT_DISCLAIMER}
          </div>
        </div>

        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>
          {messages.map((m) => <ChatMessage key={m.id} role={m.role} text={m.text}/>)}
        </div>

        {suggestions.length > 0 && (
          <div style={{ padding: "0 16px 8px", display: "flex", gap: 6, overflowX: "auto", flexWrap: "nowrap" }}>
            {suggestions.slice(0, 4).map((s) => (
              <button key={s} type="button" onClick={() => sendQuestion(s)}
                style={{ flex: "0 0 auto", border: "1px solid #CDEDE3", background: "#EAF7F3", borderRadius: 999,
                  padding: "6px 10px", fontSize: 10.5, fontWeight: 700, color: "#0B7E78", cursor: "pointer",
                  fontFamily: "inherit", maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {s}
              </button>
            ))}
          </div>
        )}

        <div style={{ padding: "10px 16px 18px", borderTop: "1px solid #EAECF0", background: "#fff" }}>
          <FundMentionInput onSubmit={sendQuestion} />
        </div>
      </div>
    </div>
  );

  const host = typeof document !== "undefined" ? document.querySelector(".phone") : null;
  return host ? createPortal(panel, host) : panel;
}

/** Floating button to open chat on screener results */
export function FundChatFab({ onClick }) {
  return (
    <button type="button" onClick={onClick}
      style={{ position: "absolute", right: 16, bottom: 88, zIndex: 50, width: 52, height: 52,
        borderRadius: 999, border: "none", background: "linear-gradient(135deg,#19C9AE,#2456BE)",
        color: "#fff", boxShadow: "0 8px 24px rgba(36,86,190,.35)", cursor: "pointer",
        display: "grid", placeItems: "center" }}
      aria-label="Ask about funds">
      <MessageCircle size={22}/>
    </button>
  );
}
