/**
 * Chat input with @mention fund picker (Nivya catalog search).
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { AtSign, ArrowRight, ChevronRight, Search } from "lucide-react";
import { searchSchemes } from "./nivya-api.js";

const MENTION_TOKEN = /@\[([^\]]+)\]/g;
const AV_COLORS = ["#2456BE", "#0E9C8E", "#7A5AF8", "#E8943A", "#D6409F", "#16A35A"];

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0);
}
function avColor(s) { return AV_COLORS[hashStr(s) % AV_COLORS.length]; }

function FundLogo({ amc, size = 32 }) {
  const label = String(amc ?? "?").slice(0, 2).toUpperCase();
  return (
    <div className="fq-fund-logo" style={{ background: avColor(amc ?? ""), width: size, height: size, fontSize: size * 0.34 }}>
      {label}
    </div>
  );
}

function findTrigger(text, cursor) {
  const uptoCursor = text.slice(0, cursor);
  const atIdx = uptoCursor.lastIndexOf("@");
  if (atIdx === -1) return null;
  const between = uptoCursor.slice(atIdx + 1);
  if (/[\]\n@]/.test(between)) return null;
  return { atIdx, query: between };
}

function schemeLabel(s) {
  return (s.name ?? s.schemeName ?? "").replace(/\s*-\s*Regular.*$/i, "").trim();
}

function categoryLabel(s) {
  const cat = s.category ?? "";
  if (!cat) return "Mutual Fund";
  return cat.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) + " Fund";
}

/**
 * @param {{ onSubmit: (text: string, mentionedFunds: object[]) => void, placeholder?: string, disabled?: boolean, rateLimited?: boolean }} props
 */
export function FundMentionInput({ onSubmit, placeholder, disabled, rateLimited }) {
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
          setSuggestions(res.items.slice(0, 6));
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
    const displayName = schemeLabel(scheme);
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
    if (!raw || disabled || rateLimited) return;
    onSubmit(raw, extractMentions(raw));
    setText("");
    setSuggestions([]);
    setTrigger(null);
    mentionMapRef.current.clear();
  }

  function insertAt() {
    const el = inputRef.current;
    const cursor = el?.selectionStart ?? text.length;
    const next = `${text.slice(0, cursor)}@${text.slice(cursor)}`;
    setText(next);
    setTrigger({ atIdx: cursor, query: "" });
    runSearch("");
    requestAnimationFrame(() => {
      el?.focus();
      const pos = cursor + 1;
      el?.setSelectionRange(pos, pos);
    });
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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  const pickerOpen = suggestions.length > 0;
  const query = trigger?.query ?? "";

  return (
    <div className="fq-compose-wrap">
      {pickerOpen && (
        <div className="fq-picker" role="listbox" aria-label="Fund suggestions">
          <div className="fq-picker-hd">Funds (from Nivya catalog)</div>
          {suggestions.map((s, i) => (
            <button
              key={s.schemeCode}
              type="button"
              role="option"
              aria-selected={i === highlightIdx}
              className={`fq-picker-row ${i === highlightIdx ? "on" : ""}`}
              onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s); }}
              onMouseEnter={() => setHighlightIdx(i)}
            >
              <FundLogo amc={s.amc}/>
              <div className="meta">
                <b>{schemeLabel(s)}</b>
                <span>{categoryLabel(s)}</span>
              </div>
              <ChevronRight size={16} className="chev"/>
            </button>
          ))}
          {query && (
            <button type="button" className="fq-picker-more" onMouseDown={(e) => e.preventDefault()}>
              <Search size={14}/>
              See more results for &ldquo;{query}&rdquo;
            </button>
          )}
        </div>
      )}

      <div className="fq-input-row">
        <input
          ref={inputRef}
          className="fq-input"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled || rateLimited}
          placeholder={placeholder ?? "Ask here or @mention a fund…"}
        />
        <button type="button" className="fq-at" onClick={insertAt} disabled={disabled || rateLimited} aria-label="Mention fund">
          <AtSign size={18}/>
        </button>
        <button
          type="button"
          className="fq-send"
          onClick={submit}
          disabled={!text.trim() || disabled || rateLimited}
          aria-label="Send"
        >
          <ArrowRight size={18}/>
        </button>
      </div>
    </div>
  );
}
