/**
 * Fund Q&A chat — factual answers about ranked screener funds (not investment advice).
 */
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import {
  answerFundQuestion,
  getSuggestedQuestions,
  flattenResultFunds,
  CHAT_DISCLAIMER,
} from "../packages/screener-core/src/fund-chat.js";

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
 * @param {{ results: object, initialFund?: object|null, onClose: function }} props
 */
export function FundChatPanel({ results, initialFund = null, onClose }) {
  const funds = useMemo(() => flattenResultFunds(results), [results]);
  const codeOf = (f) => (f?.schemeCode != null ? String(f.schemeCode) : "");

  const [selectedCode, setSelectedCode] = useState(
    () => codeOf(initialFund) || codeOf(funds[0]) || ""
  );

  useEffect(() => {
    const next = codeOf(initialFund);
    if (next) setSelectedCode(next);
  }, [initialFund?.schemeCode]);
  const selectedFund = funds.find((f) => codeOf(f) === selectedCode) ?? funds[0];

  const peerFunds = useMemo(
    () => funds.filter((f) => codeOf(f) !== codeOf(selectedFund)),
    [funds, selectedFund]
  );

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!selectedFund) return;
    setMessages([{
      id: "welcome",
      role: "bot",
      text:
        `Hi — ask factual questions about **${selectedFund.schemeName?.replace(/\s*-\s*Regular.*$/i, "") ?? "this fund"}**. ` +
        "I share past returns, scores, and ranking reasons — not buy/sell advice.",
    }]);
  }, [selectedFund?.schemeCode]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendQuestion = useCallback((question) => {
    const q = String(question ?? "").trim();
    if (!q || !selectedFund) return;

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text: q }]);
    setInput("");

    const res = answerFundQuestion(selectedFund, q, {
      peerFunds,
      dataAsOn: results.dataAsOn,
    });
    setMessages((prev) => [...prev, {
      id: `b-${Date.now()}`,
      role: "bot",
      text: res.answer + (res.blockedAdvice ? "" : ""),
    }]);
  }, [selectedFund, peerFunds, results.dataAsOn]);

  if (!funds.length) return null;

  const suggestions = selectedFund ? getSuggestedQuestions(selectedFund) : [];

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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
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
          <select
            value={selectedCode}
            onChange={(e) => setSelectedCode(e.target.value)}
            style={{ width: "100%", border: "1.5px solid #EAECF0", borderRadius: 12, padding: "10px 12px",
              fontSize: 13, fontWeight: 700, fontFamily: "inherit", background: "#fff", outline: "none" }}>
            {funds.map((f) => (
              <option key={codeOf(f)} value={codeOf(f)}>
                {f.schemeName?.replace(/\s*-\s*Regular.*$/i, "") ?? codeOf(f)}
              </option>
            ))}
          </select>
          <div style={{ fontSize: 10, color: "#667085", fontWeight: 600, marginTop: 8, lineHeight: 1.4 }}>
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

        <div style={{ padding: "10px 16px 18px", borderTop: "1px solid #EAECF0", background: "#fff",
          display: "flex", gap: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") sendQuestion(input); }}
            placeholder="Ask about past returns, scores, expense…"
            style={{ flex: 1, border: "1.5px solid #EAECF0", borderRadius: 12, padding: "11px 14px",
              fontSize: 13, fontWeight: 600, fontFamily: "inherit", outline: "none" }}
          />
          <button type="button" onClick={() => sendQuestion(input)} disabled={!input.trim()}
            style={{ width: 44, height: 44, borderRadius: 12, border: "none", background: "#16213E", color: "#fff",
              display: "grid", placeItems: "center", cursor: "pointer", opacity: input.trim() ? 1 : 0.5 }}>
            <Send size={18}/>
          </button>
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
