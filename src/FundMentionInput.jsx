/**
 * Chat input with an Instagram/Slack-style "@mention" fund picker.
 * Typing "@" opens a debounced search over the full fund catalog (GET /v1/schemes?q=...).
 * Selecting a match inserts an "@[Display Name] " token and records it in a
 * per-draft resolution map; on submit, tokens in the raw text are resolved back
 * to full fund objects and handed to onSubmit alongside the raw text.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { searchSchemes } from "./nivya-api.js";

const MENTION_TOKEN = /@\[([^\]]+)\]/g;

function findTrigger(text, cursor) {
  const uptoCursor = text.slice(0, cursor);
  const atIdx = uptoCursor.lastIndexOf("@");
  if (atIdx === -1) return null;
  const between = uptoCursor.slice(atIdx + 1);
  if (/[\]\n@]/.test(between)) return null;
  return { atIdx, query: between };
}

/**
 * @param {{ onSubmit: (text: string, mentionedFunds: object[]) => void, placeholder?: string, disabled?: boolean }} props
 */
export function FundMentionInput({ onSubmit, placeholder, disabled }) {
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const [trigger, setTrigger] = useState(null);

  const inputRef = useRef(null);
  const mentionMapRef = useRef(new Map());
  const debounceRef = useRef(null);
  const requestSeqRef = useRef(0);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const runSearch = useCallback((query) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const seq = ++requestSeqRef.current;
      try {
        const res = await searchSchemes(query);
        if (seq === requestSeqRef.current) {
          setSuggestions(res.items.slice(0, 8));
          setHighlightIdx(0);
        }
      } catch {
        if (seq === requestSeqRef.current) setSuggestions([]);
      }
    }, 200);
  }, []);

  function handleChange(e) {
    const nextText = e.target.value;
    const cursor = e.target.selectionStart ?? nextText.length;
    setText(nextText);

    const found = findTrigger(nextText, cursor);
    if (found) {
      setTrigger(found);
      runSearch(found.query);
    } else {
      setTrigger(null);
      setSuggestions([]);
    }
  }

  function selectSuggestion(scheme) {
    if (!trigger) return;
    const displayName = (scheme.name ?? scheme.schemeName ?? scheme.schemeCode).replace(/\s*-\s*Regular.*$/i, "").trim();
    const cursor = inputRef.current?.selectionStart ?? text.length;
    const before = text.slice(0, trigger.atIdx);
    const after = text.slice(cursor);
    const inserted = `@[${displayName}] `;

    mentionMapRef.current.set(displayName, scheme);
    setText(before + inserted + after);
    setSuggestions([]);
    setTrigger(null);

    requestAnimationFrame(() => {
      const pos = (before + inserted).length;
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(pos, pos);
    });
  }

  function extractMentions(rawText) {
    const funds = [];
    const seen = new Set();
    for (const m of rawText.matchAll(MENTION_TOKEN)) {
      const fund = mentionMapRef.current.get(m[1]);
      if (fund && !seen.has(fund.schemeCode)) {
        seen.add(fund.schemeCode);
        funds.push(fund);
      }
    }
    return funds;
  }

  function submit() {
    const raw = text.trim();
    if (!raw) return;
    onSubmit(raw, extractMentions(raw));
    setText("");
    setSuggestions([]);
    setTrigger(null);
    mentionMapRef.current.clear();
  }

  function handleKeyDown(e) {
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIdx((i) => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIdx((i) => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        selectSuggestion(suggestions[highlightIdx]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setSuggestions([]);
        setTrigger(null);
        return;
      }
    }
    if (e.key === "Enter") {
      submit();
    }
  }

  return (
    <div style={{ position: "relative", flex: 1, display: "flex", gap: 8 }}>
      {suggestions.length > 0 && (
        <div
          role="listbox"
          aria-label="Fund suggestions"
          style={{
            position: "absolute", bottom: "100%", left: 0, right: 44, marginBottom: 8,
            background: "#fff", border: "1px solid #EAECF0", borderRadius: 12,
            boxShadow: "0 -4px 20px rgba(0,0,0,.12)", maxHeight: 220, overflowY: "auto", zIndex: 60,
          }}>
          {suggestions.map((s, i) => (
            <div
              key={s.schemeCode}
              role="option"
              aria-selected={i === highlightIdx}
              onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s); }}
              onMouseEnter={() => setHighlightIdx(i)}
              style={{
                padding: "8px 12px", cursor: "pointer",
                background: i === highlightIdx ? "#EAF7F3" : "#fff",
                borderBottom: "1px solid #F2F4F7",
              }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0D1526" }}>
                {(s.name ?? s.schemeName ?? "").replace(/\s*-\s*Regular.*$/i, "")}
              </div>
              <div style={{ fontSize: 10.5, color: "#98A2B3", fontWeight: 600 }}>{s.amc}</div>
            </div>
          ))}
        </div>
      )}
      <input
        ref={inputRef}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder ?? "Ask about a fund, or type @ to mention one…"}
        style={{ flex: 1, border: "1.5px solid #EAECF0", borderRadius: 12, padding: "11px 14px",
          fontSize: 13, fontWeight: 600, fontFamily: "inherit", outline: "none" }}
      />
      <button type="button" onClick={submit} disabled={!text.trim() || disabled}
        style={{ width: 44, height: 44, borderRadius: 12, border: "none", background: "#16213E", color: "#fff",
          display: "grid", placeItems: "center", cursor: "pointer", opacity: text.trim() ? 1 : 0.5, flex: "none" }}>
        <Send size={18} />
      </button>
    </div>
  );
}
