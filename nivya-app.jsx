import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  bootstrapDemoSession,
  fetchSchemes,
  mapScheme,
  mapHolding,
  mapSip,
  navsFromSchemes,
  recordConsent,
  submitOrder,
  submitSip,
  buildPortfolioInsights,
  illustrativeFutureValue,
} from "./src/nivya-api.js";
import DiscoverScreen from "./src/DiscoverScreen.jsx";
import PortfolioScreen from "./src/PortfolioScreen.jsx";
import SipsScreen from "./src/SipsScreen.jsx";
import ProfileScreen from "./src/ProfileScreen.jsx";
import WatchlistScreen from "./src/WatchlistScreen.jsx";
import NotificationsScreen from "./src/NotificationsScreen.jsx";
import OnboardingFlow from "./src/OnboardingFlow.jsx";
import FundDetailScreen from "./src/FundDetailScreen.jsx";
import OrderSheet from "./src/OrderSheet.jsx";
import { FundChatPanel } from "./src/FundChatbot.jsx";
import {
  Home, Search, Bell, Eye, EyeOff,
  ChevronRight, TrendingUp, TrendingDown, Star, X,
  ShieldCheck, Settings, HelpCircle, FileText, LogOut,
  BadgeCheck, Repeat, PiggyBank, MessageCircle, PieChart, BarChart3,
  Compass, User,
} from "lucide-react";

/* ============================================================
   Nivya — MF-only investing app (Corporate MFD model, demo)
   Hybrid-ready prototype: custom UX, mock NAV + orders
   ============================================================ */

const NIVYA_ARN = "ARN-XXXXXX"; // Replace with real ARN after AMFI registration
const NIVYA_EUIN = "EUIN-XXXXXX";

const CSS = `
:root{
  --navy:#16213E; --navy2:#0F1830; --navy3:#1E2A4A;
  --teal:#16C9AE; --blue:#2456BE;
  --brand:#0FA8A0;
  --brand-ink:#0B7E78;
  --up:#16A35A; --up-bg:#E7F6EE;
  --down:#E0444B; --down-bg:#FDECEC;
  --bg:#F4F6F9; --surface:#FFFFFF; --soft:#F2F4F7;
  --ink:#0D1526; --muted:#667085; --faint:#98A2B3;
  --line:#EAECF0; --line2:#EDF0F4;
  --grad:linear-gradient(152deg,#19C9AE 0%,#1F8FB8 42%,#2456BE 100%);
  --shadow:0 1px 2px rgba(16,24,40,.05),0 1px 3px rgba(16,24,40,.06);
  --font:"Plus Jakarta Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
  --mono:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace;
}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
.nv-root{font-family:var(--font);color:var(--ink);}
.num{font-family:var(--mono);font-variant-numeric:tabular-nums;letter-spacing:-.02em;}
.stage{min-height:100vh;display:flex;align-items:center;justify-content:center;
  background:radial-gradient(130% 120% at 50% -10%,#21345d 0%,#0f1a35 45%,#0a1226 100%);}
.phone{position:relative;width:100%;max-width:440px;height:100vh;background:var(--bg);
  display:flex;flex-direction:column;overflow:hidden;}
@media(min-width:480px){
  .phone{height:884px;border-radius:40px;
    box-shadow:0 50px 100px -20px rgba(2,8,23,.7),0 0 0 11px #0b1224,0 0 0 12px rgba(255,255,255,.05);}
}
.statusbar{height:34px;flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;
  padding:0 22px;font-size:13px;font-weight:700;color:var(--ink);background:var(--surface);}
.statusbar .dots{display:flex;gap:5px;align-items:center;}
.sigbar{display:flex;gap:2px;align-items:flex-end;height:11px;}
.sigbar i{width:3px;background:var(--ink);border-radius:1px;display:block;}
.batt{width:22px;height:11px;border:1.5px solid var(--ink);border-radius:3px;position:relative;padding:1.5px;}
.batt::after{content:"";position:absolute;right:-3px;top:3px;width:2px;height:5px;background:var(--ink);border-radius:0 1px 1px 0;}
.batt i{display:block;height:100%;width:72%;background:var(--ink);border-radius:1px;}
.appbar{flex:0 0 auto;background:var(--surface);padding:8px 16px 12px;display:flex;align-items:center;
  justify-content:space-between;border-bottom:1px solid var(--line);}
.brand{display:flex;align-items:center;gap:9px;}
.brand .wm{font-size:20px;font-weight:800;letter-spacing:-.03em;}
.brand .wm b{color:var(--navy);}
.arn-badge{font-size:9px;font-weight:700;color:var(--muted);margin-top:2px;line-height:1.35;}
.arn-badge .line2{display:block;margin-top:1px;}
.iconbtn{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;border:none;background:var(--soft);color:var(--ink);cursor:pointer;position:relative;}
.iconbtn:active{transform:scale(.94);}
.dot{position:absolute;top:8px;right:9px;width:7px;height:7px;background:var(--down);border-radius:50%;border:2px solid var(--surface);}
.dot-teal{background:var(--teal);}
.home-hero{position:relative;border-radius:16px;padding:16px 16px 14px;color:#fff;overflow:hidden;cursor:pointer;
  background:linear-gradient(165deg,#1e3358 0%,#16213E 48%,#0f1830 100%);
  box-shadow:0 14px 32px -12px rgba(15,24,48,.55);border:none;width:100%;text-align:left;font-family:var(--font);}
.home-hero:active{transform:scale(.995);}
.home-hero .waves{position:absolute;inset:auto 0 -1px 0;height:56px;opacity:.14;pointer-events:none;}
.home-hero-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:12px;}
.home-hero-badge{display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border-radius:999px;
  background:rgba(255,255,255,.11);font-size:10px;font-weight:700;letter-spacing:.01em;}
.home-hero-eye{width:34px;height:34px;border-radius:50%;border:none;background:rgba(255,255,255,.14);color:#fff;
  display:grid;place-items:center;cursor:pointer;flex:none;}
.home-hero-lbl{font-size:12px;font-weight:600;opacity:.82;margin-bottom:4px;}
.home-hero-val{font-size:30px;font-weight:800;letter-spacing:-.03em;line-height:1.05;}
.home-hero-delta{display:inline-flex;align-items:center;gap:4px;margin-top:8px;padding:5px 11px;border-radius:999px;
  font-size:11.5px;font-weight:700;background:rgba(22,163,90,.22);color:#b8f5d0;}
.home-hero-delta.neg{background:rgba(224,68,75,.22);color:#ffc9cb;}
.home-hero-stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;margin-top:14px;
  background:rgba(255,255,255,.08);border-radius:12px;overflow:hidden;}
.home-hero-stats .st{padding:10px 10px 9px;}
.home-hero-stats .st + .st{border-left:1px solid rgba(255,255,255,.12);}
.home-hero-stats .k{font-size:10px;opacity:.78;font-weight:600;}
.home-hero-stats .v{font-size:13px;font-weight:800;margin-top:3px;}
.home-hero-chev{position:absolute;right:14px;top:50%;transform:translateY(-50%);opacity:.55;}
.home-qa{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:16px;}
.home-qa-btn{border:none;background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:12px 8px 10px;
  display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;box-shadow:var(--shadow);font-family:var(--font);}
.home-qa-btn:active{transform:scale(.97);}
.home-qa-btn .ic{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;}
.home-qa-btn .t{font-size:11px;font-weight:800;color:var(--ink);text-align:center;line-height:1.2;}
.home-qa-btn .s{font-size:9.5px;font-weight:600;color:var(--muted);text-align:center;line-height:1.25;}
.alert-scroll{display:flex;gap:10px;overflow-x:auto;padding:2px 0 4px;scrollbar-width:none;}
.alert-scroll::-webkit-scrollbar{display:none;}
.alert-card{flex:0 0 auto;width:min(88%,300px);border-radius:16px;padding:12px 13px;cursor:pointer;border:1px solid;}
.alert-card:active{transform:scale(.99);}
.alert-card.teal{background:#EAF7F3;border-color:#CDEDE3;}
.alert-card.amber{background:#FFF8E6;border-color:#F5DFA8;}
.alert-card .at{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px;}
.alert-card.teal .at{color:#0B7E78;}
.alert-card.amber .at{color:#B54708;}
.alert-card .ab{font-size:12.5px;font-weight:700;color:var(--ink);line-height:1.35;}
.alert-card .as{font-size:11px;font-weight:600;color:var(--muted);margin-top:4px;line-height:1.35;}
.home-holdings{background:var(--surface);border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:var(--shadow);}
.home-hrow{display:flex;align-items:center;gap:11px;padding:13px 14px;cursor:pointer;background:var(--surface);}
.home-hrow:active{background:var(--soft);}
.home-hrow + .home-hrow{border-top:1px solid var(--line2);}
.home-hrow .meta{flex:1;min-width:0;}
.home-hrow .nm{font-size:13.5px;font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.home-hrow .sub{font-size:11px;color:var(--muted);font-weight:600;margin-top:3px;}
.reg-badge{display:inline-block;font-size:9px;font-weight:800;padding:2px 7px;border-radius:999px;
  background:#E8F0FF;color:#2456BE;margin-top:5px;}
.holdings-foot{font-size:10.5px;font-weight:600;color:var(--muted);padding:10px 14px 12px;border-top:1px solid var(--line2);line-height:1.45;}
.holdings-foot button{border:none;background:none;padding:0;color:var(--brand-ink);font-weight:800;cursor:pointer;font-family:var(--font);font-size:inherit;}
.discover-teaser{margin-top:16px;border-radius:16px;padding:14px 14px 14px 16px;display:flex;align-items:center;gap:12px;
  background:linear-gradient(135deg,#E8F4FF 0%,#EAF7F3 100%);border:1px solid #CDDFEF;cursor:pointer;text-align:left;
  border:none;width:100%;font-family:var(--font);box-shadow:var(--shadow);}
.discover-teaser:active{transform:scale(.99);}
.discover-teaser .dt{flex:1;min-width:0;}
.discover-teaser .dt h4{margin:0;font-size:14px;font-weight:800;color:var(--ink);line-height:1.25;}
.discover-teaser .dt p{margin:5px 0 0;font-size:11px;font-weight:600;color:var(--muted);line-height:1.4;}
.discover-teaser .dt a{display:inline-flex;align-items:center;gap:2px;margin-top:8px;font-size:11.5px;font-weight:800;color:var(--brand-ink);}
.discover-teaser .chart-ic{width:52px;height:52px;border-radius:14px;background:rgba(36,86,190,.12);
  display:grid;place-items:center;color:#2456BE;flex:none;}
.compliance-fold{margin-top:16px;border-radius:12px;border:1px solid #EAECF0;background:#F8FAFC;overflow:hidden;}
.compliance-fold summary{padding:10px 12px;font-size:10.5px;font-weight:700;color:var(--muted);cursor:pointer;list-style:none;
  display:flex;align-items:center;justify-content:space-between;}
.compliance-fold summary::-webkit-details-marker{display:none;}
.compliance-fold .body{padding:0 12px 10px;font-size:10.5px;font-weight:600;color:var(--faint);line-height:1.5;}
.discover-scroll{padding-top:8px;}
.discover-subnav{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-bottom:14px;background:var(--soft);border-radius:14px;padding:4px;}
.discover-subnav-btn{border:none;background:transparent;padding:10px 4px;border-radius:11px;font-size:11px;font-weight:800;color:var(--muted);cursor:pointer;font-family:var(--font);transition:background .15s,color .15s;}
.discover-subnav-btn.on{background:var(--teal);color:#fff;box-shadow:0 2px 10px rgba(14,156,142,.32);}
.discover-search{display:flex;align-items:center;gap:10px;background:var(--surface);border:1.5px solid var(--line);border-radius:14px;padding:11px 14px;margin-bottom:12px;box-shadow:var(--shadow);}
.discover-search input{border:none;outline:none;flex:1;font-size:14px;font-family:var(--font);background:none;color:var(--ink);}
.discover-search input::placeholder{color:var(--faint);}
.discover-sort-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;gap:10px;}
.discover-sort-lbl{font-size:11.5px;font-weight:700;color:var(--muted);display:flex;align-items:center;gap:8px;}
.discover-sort-select{border:1.5px solid var(--line);border-radius:10px;padding:7px 10px;font-size:12px;font-weight:700;font-family:var(--font);background:var(--surface);color:var(--ink);}
.discover-filter-btn{display:inline-flex;align-items:center;gap:6px;border:1.5px solid var(--line);background:var(--surface);border-radius:10px;padding:8px 12px;font-size:12px;font-weight:700;color:var(--ink);cursor:pointer;font-family:var(--font);}
.discover-filter-hint{font-size:11px;font-weight:600;color:var(--muted);margin:-4px 0 12px;padding:8px 10px;background:var(--soft);border-radius:10px;}
.discover-fund-list{display:flex;flex-direction:column;gap:8px;}
.discover-fund-card{display:flex;align-items:flex-start;gap:11px;padding:13px 14px;background:var(--surface);border:1px solid var(--line);border-radius:16px;cursor:pointer;box-shadow:var(--shadow);}
.discover-fund-card:active{background:var(--soft);}
.discover-fund-meta{flex:1;min-width:0;}
.discover-fund-name{font-size:13.5px;font-weight:800;color:var(--ink);line-height:1.25;}
.discover-fund-sub{display:flex;align-items:center;gap:8px;margin-top:4px;font-size:11px;color:var(--muted);font-weight:600;flex-wrap:wrap;}
.discover-fund-metrics{display:flex;gap:12px;margin-top:8px;font-size:10.5px;color:var(--muted);font-weight:600;flex-wrap:wrap;}
.discover-fund-metrics b{color:var(--ink);font-weight:800;margin-right:3px;}
.discover-foot-note{font-size:10px;font-weight:600;color:var(--faint);text-align:center;margin-top:12px;line-height:1.45;}
.discover-rank-hero{background:linear-gradient(145deg,#0B7E78 0%,#16213E 55%,#0f1830 100%);border-radius:16px;padding:16px;color:#fff;margin-bottom:14px;position:relative;overflow:hidden;}
.discover-rank-hero::after{content:"";position:absolute;right:-20px;bottom:-20px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,.06);}
.discover-rank-hero-tag{font-size:10px;font-weight:800;opacity:.8;text-transform:uppercase;letter-spacing:.05em;}
.discover-rank-hero h3{margin:6px 0 4px;font-size:16px;font-weight:800;line-height:1.3;}
.discover-rank-hero p{margin:0;font-size:11.5px;font-weight:600;opacity:.88;line-height:1.4;}
.discover-dna{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:13px 14px;margin-bottom:14px;box-shadow:var(--shadow);}
.discover-dna-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
.discover-dna-head h4{margin:0;font-size:13px;font-weight:800;color:var(--ink);}
.discover-dna-edit{border:none;background:var(--soft);border-radius:8px;padding:5px 10px;font-size:11px;font-weight:800;color:var(--brand-ink);cursor:pointer;font-family:var(--font);}
.discover-dna-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.discover-dna-item{background:var(--soft);border-radius:10px;padding:8px 10px;}
.discover-dna-item .k{font-size:9.5px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.03em;}
.discover-dna-item .v{font-size:12px;font-weight:800;color:var(--ink);margin-top:3px;line-height:1.25;}
.discover-popular{margin-bottom:14px;}
.discover-popular-lbl{font-size:11px;font-weight:800;color:var(--muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:.04em;}
.discover-popular-row{display:flex;flex-wrap:wrap;gap:8px;}
.discover-combo-btn{border:1.5px solid var(--line);background:var(--surface);border-radius:999px;padding:8px 14px;font-size:12px;font-weight:700;color:var(--ink);cursor:pointer;font-family:var(--font);}
.discover-combo-btn:active{background:var(--soft);}
.discover-refine{margin-bottom:14px;}
.discover-exclude-row{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;}
.discover-exclude-chip{display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border-radius:999px;background:#FDECEC;color:#B42318;font-size:11px;font-weight:700;}
.discover-exclude-chip button{border:none;background:rgba(180,35,24,.12);border-radius:50%;width:16px;height:16px;display:grid;place-items:center;cursor:pointer;padding:0;color:#B42318;}
.discover-exclude-add{border:1.5px dashed var(--line);background:none;border-radius:999px;padding:6px 12px;font-size:11px;font-weight:700;color:var(--muted);cursor:pointer;font-family:var(--font);}
.discover-rank-results-head{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;gap:10px;}
.discover-rank-results-head h3{margin:0;font-size:15px;font-weight:800;color:var(--ink);}
.discover-rank-results-head .meta{font-size:10.5px;font-weight:600;color:var(--muted);text-align:right;line-height:1.4;}
.discover-rank-card{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:13px 14px;margin-bottom:10px;box-shadow:var(--shadow);}
.discover-rank-card-top{display:flex;align-items:flex-start;gap:11px;}
.discover-rank-num{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:900;color:#fff;flex:none;}
.discover-rank-score{margin-left:auto;flex:none;text-align:center;background:linear-gradient(135deg,#E8F0FF,#EAF7F3);border-radius:10px;padding:6px 10px;min-width:52px;}
.discover-rank-score .n{font-size:16px;font-weight:900;color:var(--brand-ink);line-height:1;}
.discover-rank-score .l{font-size:8.5px;font-weight:700;color:var(--muted);margin-top:2px;}
.discover-rank-returns{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-top:10px;background:var(--soft);border-radius:10px;padding:8px 6px;}
.discover-rank-returns .cell{text-align:center;}
.discover-rank-returns .cell .k{font-size:9px;font-weight:700;color:var(--muted);}
.discover-rank-returns .cell .v{font-size:12px;font-weight:800;margin-top:2px;}
.discover-rank-returns .cell .v.up{color:var(--up);}
.discover-rank-why{margin-top:10px;}
.discover-rank-why-lbl{font-size:9.5px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px;}
.discover-rank-tags{display:flex;flex-wrap:wrap;gap:5px;}
.discover-rank-tag{font-size:10px;font-weight:700;padding:4px 8px;border-radius:999px;background:#EAF7F3;color:#0B7E78;border:1px solid #CDEDE3;}
.discover-rank-actions{display:flex;gap:6px;margin-top:12px;}
.discover-rank-actions .ghost{flex:1;border:1.5px solid var(--line);background:var(--surface);border-radius:10px;padding:9px 6px;font-size:11px;font-weight:800;color:var(--ink);cursor:pointer;font-family:var(--font);}
.discover-rank-actions .ask{flex:1;border:1.5px solid #CDEDE3;background:#EAF7F3;border-radius:10px;padding:9px 6px;font-size:11px;font-weight:800;color:#0B7E78;cursor:pointer;font-family:var(--font);}
.discover-rank-actions .invest{flex:1.2;border:none;background:linear-gradient(135deg,#19C9AE,#0E9C8E);border-radius:10px;padding:9px 6px;font-size:11px;font-weight:800;color:#fff;cursor:pointer;font-family:var(--font);}
.discover-compare-add{display:inline-flex;align-items:center;gap:5px;border:1.5px dashed var(--line);background:var(--surface);border-radius:999px;padding:7px 12px;font-size:12px;font-weight:700;color:var(--brand-ink);cursor:pointer;font-family:var(--font);margin-bottom:12px;}
.discover-riskometer{display:flex;flex-direction:column;align-items:center;gap:2px;}
.discover-riskometer svg{display:block;}
.discover-riskometer-lbl{font-size:9px;font-weight:700;color:var(--muted);text-align:center;max-width:72px;line-height:1.2;}
.discover-compare-sticky{position:sticky;bottom:0;left:0;right:0;padding:12px 0 4px;background:linear-gradient(180deg,transparent 0%,var(--bg) 28%);margin-top:8px;}
.discover-compare-sticky .btn{width:100%;padding:14px 0;font-size:14px;font-weight:800;}
.discover-browse-count{font-size:11px;font-weight:600;color:var(--muted);margin:-4px 0 10px;}
.discover-guided-intro{font-size:12px;font-weight:600;color:var(--muted);line-height:1.45;margin-bottom:14px;}
.discover-wizard-progress{display:flex;gap:5px;margin-bottom:16px;}
.discover-wizard-dot{flex:1;height:4px;border-radius:999px;background:var(--line);}
.discover-wizard-dot.on{background:var(--teal);}
.discover-wizard-dot.done{background:#19C9AE;}
.discover-step-title{font-size:15px;font-weight:800;color:var(--ink);margin:0 0 4px;line-height:1.3;}
.discover-step-sub{font-size:11.5px;font-weight:600;color:var(--muted);margin:0 0 14px;line-height:1.4;}
.discover-option-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;}
.discover-option-grid.single{grid-template-columns:1fr;}
.discover-option-btn{border:1.5px solid var(--line);background:var(--surface);border-radius:14px;padding:12px 12px;font-size:12.5px;font-weight:700;color:var(--ink);cursor:pointer;text-align:left;font-family:var(--font);line-height:1.35;box-shadow:var(--shadow);}
.discover-option-btn.on{background:linear-gradient(135deg,#EAF7F3,#E8F4FF);border-color:#0E9C8E;color:#0B5E58;}
.discover-option-btn:active{transform:scale(.99);}
.discover-amount-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px;}
.discover-amount-chip{border:1.5px solid var(--line);background:var(--surface);border-radius:12px;padding:11px 8px;font-size:13px;font-weight:800;color:var(--ink);cursor:pointer;font-family:var(--mono);}
.discover-amount-chip.on{background:var(--navy);color:#fff;border-color:var(--navy);}
.discover-slider-block{margin-bottom:16px;}
.discover-slider-labels{display:flex;justify-content:space-between;font-size:10px;font-weight:700;color:var(--muted);margin-bottom:6px;}
.discover-slider{width:100%;accent-color:var(--teal);height:6px;}
.discover-slider-val{text-align:center;font-size:12px;font-weight:800;color:var(--brand-ink);margin-top:8px;}
.discover-wizard-nav{display:flex;gap:10px;margin-top:8px;margin-bottom:12px;}
.discover-wizard-back{flex:0 0 auto;border:1.5px solid var(--line);background:var(--surface);border-radius:12px;padding:12px 16px;font-size:13px;font-weight:800;color:var(--muted);cursor:pointer;font-family:var(--font);}
.discover-refine-fold{margin-bottom:14px;border:1px solid var(--line);border-radius:14px;overflow:hidden;background:var(--surface);}
.discover-refine-fold summary{padding:12px 14px;font-size:12px;font-weight:800;color:var(--ink);cursor:pointer;list-style:none;}
.discover-refine-fold summary::-webkit-details-marker{display:none;}
.discover-refine-fold .inner{padding:0 14px 14px;}
.discover-dna-pref{margin-top:6px;font-size:11px;font-weight:600;color:var(--muted);line-height:1.45;}
.discover-compliant-note{font-size:10px;font-weight:600;color:var(--faint);text-align:center;margin:10px 0 4px;line-height:1.45;}
.discover-form-block{margin-bottom:14px;}
.discover-select{width:100%;border:1.5px solid var(--line);border-radius:12px;padding:11px 12px;font-size:14px;font-weight:700;font-family:var(--font);background:var(--surface);}
.discover-cat-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;}
.discover-cat-btn{border:1.5px solid var(--line);border-radius:12px;padding:9px 10px;font-size:12px;font-weight:700;cursor:pointer;background:var(--surface);color:var(--ink);font-family:var(--font);text-align:left;}
.discover-cat-btn.on{background:var(--navy);color:#fff;border-color:var(--navy);}
.discover-amount-wrap{display:flex;align-items:center;gap:8px;border:1.5px solid var(--line);border-radius:12px;padding:10px 12px;background:var(--surface);}
.discover-amount-wrap span{font-weight:800;color:var(--muted);font-family:var(--mono);}
.discover-amount-wrap input{border:none;outline:none;flex:1;font-size:16px;font-weight:800;font-family:var(--mono);background:none;min-width:0;}
.discover-amount-suffix{font-size:11px!important;white-space:nowrap;}
.discover-error{background:#FDECEC;border:1px solid #FECDD3;border-radius:12px;padding:10px 12px;font-size:12px;color:#E0444B;font-weight:700;display:flex;gap:8px;margin-bottom:12px;}
.discover-rank-cta{margin-top:8px;margin-bottom:8px;}
.discover-compare-picklist{display:flex;flex-direction:column;gap:4px;margin-bottom:10px;background:var(--surface);border:1px solid var(--line);border-radius:12px;overflow:hidden;}
.discover-compare-picklist button{border:none;background:var(--surface);padding:10px 12px;text-align:left;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--font);}
.discover-compare-picklist button:hover{background:var(--soft);}
.discover-compare-chips{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;}
.discover-compare-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;background:#E8F0FF;color:#2456BE;font-size:12px;font-weight:800;}
.discover-compare-chip button{border:none;background:rgba(36,86,190,.15);border-radius:999%;width:18px;height:18px;display:grid;place-items:center;cursor:pointer;padding:0;color:#2456BE;}
.discover-compare-table-wrap{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:12px;box-shadow:var(--shadow);}
.discover-compare-table{width:100%;border-collapse:collapse;font-size:11.5px;}
.discover-compare-table th,.discover-compare-table td{padding:8px 6px;vertical-align:top;border-bottom:1px solid var(--line2);}
.discover-compare-table th{font-weight:800;text-align:center;min-width:72px;}
.discover-compare-label{font-weight:700;color:var(--muted);white-space:nowrap;}
.discover-compare-th-name{font-size:10px;font-weight:700;margin-top:6px;line-height:1.25;}
.discover-risk-pill{display:inline-block;font-size:10px;font-weight:800;padding:3px 8px;border-radius:999px;border:1.5px solid;}
.discover-compare-actions{display:flex;gap:10px;margin-top:14px;}
.discover-clear-btn{border:1.5px solid var(--line);background:var(--surface);border-radius:12px;padding:12px 16px;font-size:13px;font-weight:800;color:var(--muted);cursor:pointer;font-family:var(--font);}
.discover-compare-empty{text-align:center;padding:48px 20px;color:var(--muted);}
.discover-compare-empty p{font-weight:700;margin-top:10px;font-size:13px;}
.discover-tools-section{margin-bottom:18px;}
.discover-tools-heading{font-size:11px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px;}
.discover-tool-row{width:100%;display:flex;align-items:center;gap:12px;padding:13px 14px;border:1px solid var(--line);border-radius:16px;background:var(--surface);margin-bottom:8px;cursor:pointer;text-align:left;font-family:var(--font);box-shadow:var(--shadow);}
.discover-tool-row:active{background:var(--soft);}
.discover-tool-ic{width:40px;height:40px;border-radius:12px;background:var(--soft);display:grid;place-items:center;color:var(--brand-ink);flex:none;}
.discover-tool-text{flex:1;min-width:0;}
.discover-tool-title{font-size:13.5px;font-weight:800;color:var(--ink);}
.discover-tool-sub{font-size:11px;font-weight:600;color:var(--muted);margin-top:2px;}
.discover-ask-fab{position:absolute;right:16px;bottom:88px;z-index:50;display:flex;align-items:center;gap:8px;padding:12px 16px 12px 14px;border-radius:999px;border:none;
  background:linear-gradient(135deg,#19C9AE,#2456BE);color:#fff;font-size:13px;font-weight:800;font-family:var(--font);
  box-shadow:0 8px 24px rgba(36,86,190,.35);cursor:pointer;}
.discover-ask-fab:active{transform:scale(.97);}
.pf-scroll{padding-top:8px;}
.pf-subnav{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-bottom:14px;background:var(--soft);border-radius:14px;padding:4px;}
.pf-subnav-btn{border:none;background:transparent;padding:10px 6px;border-radius:11px;font-size:11.5px;font-weight:800;color:var(--muted);cursor:pointer;font-family:var(--font);}
.pf-subnav-btn.on{background:var(--teal);color:#fff;box-shadow:0 2px 10px rgba(14,156,142,.32);}
.pf-hero{position:relative;border-radius:16px;padding:16px;color:#fff;margin-bottom:14px;background:linear-gradient(155deg,#0B7E78 0%,#16213E 52%,#0f1830 100%);box-shadow:0 14px 32px -12px rgba(15,24,48,.5);}
.pf-hero-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;}
.pf-hero-lbl{font-size:12px;font-weight:600;opacity:.85;}
.pf-hero-val{font-size:28px;font-weight:800;letter-spacing:-.03em;line-height:1.05;}
.pf-hero-ret{display:inline-flex;align-items:center;gap:5px;margin-top:8px;font-size:12px;font-weight:700;padding:5px 11px;border-radius:999px;}
.pf-hero-ret.up{background:rgba(22,163,90,.22);color:#b8f5d0;}
.pf-hero-ret.down{background:rgba(224,68,75,.22);color:#ffc9cb;}
.pf-hero-stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;margin-top:14px;background:rgba(255,255,255,.08);border-radius:12px;overflow:hidden;}
.pf-hero-stats .st{padding:10px;}
.pf-hero-stats .st + .st{border-left:1px solid rgba(255,255,255,.12);}
.pf-hero-stats .k{font-size:10px;opacity:.78;font-weight:600;}
.pf-hero-stats .v{font-size:13px;font-weight:800;margin-top:3px;}
.pf-hero-stats .v.up{color:#b8f5d0;}
.pf-hero-stats .v.down{color:#ffc9cb;}
.pf-hero-foot{margin-top:12px;font-size:9.5px;font-weight:600;opacity:.75;line-height:1.45;display:flex;flex-direction:column;gap:2px;}
.pf-section-card{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:14px;margin-bottom:12px;box-shadow:var(--shadow);}
.pf-sec-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px;}
.pf-sec-head h3{margin:0;font-size:14px;font-weight:800;color:var(--ink);}
.pf-tf-chips{display:flex;gap:4px;}
.pf-tf-chip{border:none;background:var(--soft);border-radius:8px;padding:5px 9px;font-size:10.5px;font-weight:800;color:var(--muted);cursor:pointer;font-family:var(--font);}
.pf-tf-chip.on{background:var(--navy);color:#fff;}
.pf-chart-wrap{margin:0 -4px 8px;}
.pf-link-btn{border:none;background:none;padding:0;font-size:11.5px;font-weight:800;color:var(--brand-ink);cursor:pointer;font-family:var(--font);display:inline-flex;align-items:center;gap:4px;}
.pf-info-banner{display:flex;align-items:flex-start;gap:8px;margin-top:10px;padding:9px 10px;background:var(--soft);border-radius:10px;font-size:10px;font-weight:600;color:var(--muted);line-height:1.4;}
.pf-info-banner button{border:none;background:none;padding:0;color:var(--brand-ink);font-weight:800;cursor:pointer;font-family:var(--font);font-size:inherit;text-decoration:underline;}
.pf-alloc-bar{display:flex;height:10px;border-radius:999px;overflow:hidden;margin-bottom:12px;}
.pf-alloc-bar i{display:block;height:100%;}
.pf-alloc-legend{display:flex;flex-direction:column;gap:8px;}
.pf-alloc-row{display:grid;grid-template-columns:auto 1fr auto auto;align-items:center;gap:8px;font-size:11.5px;font-weight:600;color:var(--muted);}
.pf-alloc-row .sw{width:10px;height:10px;border-radius:3px;}
.pf-alloc-row .nm{color:var(--ink);font-weight:700;}
.pf-alloc-row .pct{font-weight:800;color:var(--ink);}
.pf-alloc-row .val{font-family:var(--mono);font-size:11px;}
.pf-hold-bar-row{width:100%;display:flex;align-items:center;gap:10px;padding:10px 0;border:none;border-bottom:1px solid var(--line2);background:none;cursor:pointer;text-align:left;font-family:var(--font);}
.pf-hold-bar-row.static{cursor:default;}
.pf-hold-bar-row .meta{flex:1;min-width:0;}
.pf-hold-bar-row .nm{font-size:12.5px;font-weight:700;color:var(--ink);margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.pf-hold-bar-row .track{height:6px;background:var(--soft);border-radius:999px;overflow:hidden;}
.pf-hold-bar-row .fill{height:100%;border-radius:999px;}
.pf-hold-bar-row .pct{font-size:12px;font-weight:800;color:var(--ink);flex:none;}
.pf-calc-card{display:flex;align-items:center;gap:12px;padding:14px;border-radius:16px;margin-bottom:12px;background:linear-gradient(135deg,#EAF7F3,#E8F4FF);border:1px solid #CDDFEF;cursor:pointer;text-align:left;font-family:var(--font);width:100%;}
.pf-calc-ic{width:44px;height:44px;border-radius:12px;background:rgba(14,156,142,.15);color:#0B7E78;display:grid;place-items:center;flex:none;}
.pf-calc-body{flex:1;min-width:0;}
.pf-calc-body h4{margin:0;font-size:13.5px;font-weight:800;color:var(--ink);}
.pf-calc-body p{margin:4px 0 0;font-size:11px;font-weight:600;color:var(--muted);line-height:1.4;}
.pf-calc-sliders{display:flex;gap:8px;margin-top:8px;}
.pf-calc-sliders input{flex:1;accent-color:var(--teal);height:4px;}
.pf-calc-note{display:block;margin-top:6px;font-size:9.5px;font-weight:600;color:var(--faint);}
.pf-action-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;}
.pf-action-btn{border:1.5px solid var(--line);background:var(--surface);border-radius:14px;padding:12px;display:flex;flex-direction:column;align-items:flex-start;gap:6px;cursor:pointer;font-family:var(--font);box-shadow:var(--shadow);position:relative;}
.pf-action-btn span{font-size:12px;font-weight:800;color:var(--ink);}
.pf-action-btn em{font-size:9px;font-weight:800;color:#B54708;background:#FFF8E6;padding:2px 6px;border-radius:999px;font-style:normal;position:absolute;top:10px;right:10px;}
.pf-holdings-toolbar{display:flex;gap:8px;margin-bottom:10px;align-items:center;}
.pf-holdings-count{font-size:11px;font-weight:600;color:var(--muted);margin-bottom:10px;}
.pf-holdings-list{background:var(--surface);border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:var(--shadow);}
.pf-holding-row{width:100%;display:flex;align-items:center;gap:11px;padding:13px 14px;border:none;border-bottom:1px solid var(--line2);background:var(--surface);cursor:pointer;text-align:left;font-family:var(--font);}
.pf-holding-row:last-child{border-bottom:none;}
.pf-holding-row:active{background:var(--soft);}
.pf-holding-row .meta{flex:1;min-width:0;}
.pf-holding-row .nm{font-size:13.5px;font-weight:700;color:var(--ink);}
.pf-holding-row .sub{display:flex;align-items:center;gap:8px;margin-top:4px;font-size:11px;color:var(--muted);font-weight:600;flex-wrap:wrap;}
.pf-holding-row .right{text-align:right;flex:none;}
.pf-holding-row .price{font-size:13.5px;font-weight:800;}
.pf-holding-row .chg{font-size:11px;font-weight:700;margin-top:2px;}
.pf-insights-tabs{display:flex;gap:8px;margin-bottom:12px;}
.pf-insights-tab{border:1.5px solid var(--line);background:var(--surface);border-radius:999px;padding:8px 14px;font-size:12px;font-weight:800;color:var(--muted);cursor:pointer;font-family:var(--font);}
.pf-insights-tab.on{background:var(--navy);color:#fff;border-color:var(--navy);}
.pf-cagr-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
.pf-cagr-cell{background:var(--soft);border-radius:12px;padding:10px;text-align:center;}
.pf-cagr-cell .k{font-size:10px;font-weight:700;color:var(--muted);}
.pf-cagr-cell .v{font-size:15px;font-weight:900;margin-top:4px;}
.pf-insight-note{font-size:10.5px;font-weight:600;color:var(--muted);line-height:1.45;margin:10px 0 0;}
.pf-flag-row{display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid var(--line2);font-size:12px;font-weight:600;color:var(--ink);line-height:1.4;}
.pf-flag-row:last-child{border-bottom:none;}
.pf-flag-row.warn svg{color:#E8943A;flex:none;}
.pf-flag-row svg{color:var(--faint);flex:none;}
.pf-insight-stat{display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:700;color:var(--ink);}
.pf-compliant-foot{font-size:10px;font-weight:600;color:var(--faint);text-align:center;line-height:1.45;margin-top:8px;padding:0 8px 16px;}
.appbar-actions{display:flex;gap:8px;align-items:center;}
.scroll{flex:1 1 auto;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;padding:14px 16px 96px;}
.scroll::-webkit-scrollbar{width:0;}
.wealth{position:relative;border-radius:22px;padding:18px 18px 16px;color:#fff;overflow:hidden;
  background:var(--grad);box-shadow:0 14px 30px -10px rgba(20,48,110,.55);}
.wealth .peaks{position:absolute;inset:auto 0 -2px 0;opacity:.16;pointer-events:none;}
.wealth .lbl{font-size:12.5px;font-weight:600;opacity:.86;display:flex;align-items:center;gap:7px;}
.wealth .val{font-size:31px;font-weight:800;margin:5px 0 2px;}
.wealth .sub{display:flex;align-items:center;gap:10px;font-size:13px;font-weight:600;margin-top:4px;}
.delta{display:inline-flex;align-items:center;gap:3px;padding:3px 8px;border-radius:999px;font-weight:700;font-size:12.5px;}
.delta.pos{background:rgba(255,255,255,.18);} .delta.neg{background:rgba(255,255,255,.18);}
.wealth .stats{display:flex;gap:0;margin-top:15px;background:rgba(255,255,255,.13);border-radius:14px;overflow:hidden;}
.wealth .stats .st{flex:1;padding:10px 12px;}
.wealth .stats .st + .st{border-left:1px solid rgba(255,255,255,.16);}
.wealth .stats .k{font-size:11px;opacity:.82;font-weight:600;}
.wealth .stats .v{font-size:14.5px;font-weight:700;margin-top:3px;}
.eye{margin-left:auto;background:rgba(255,255,255,.16);border:none;color:#fff;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;cursor:pointer;}
.quick{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:14px;}
.qa{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:12px 6px;display:flex;
  flex-direction:column;align-items:center;gap:7px;cursor:pointer;box-shadow:var(--shadow);}
.qa:active{transform:scale(.97);}
.qa .ic{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;}
.qa .t{font-size:11.5px;font-weight:600;color:var(--ink);}
.strip{display:flex;gap:10px;overflow-x:auto;padding:2px 0 4px;margin-top:6px;scrollbar-width:none;}
.strip::-webkit-scrollbar{display:none;}
.idx{flex:0 0 auto;min-width:130px;background:var(--surface);border:1px solid var(--line);border-radius:16px;
  padding:12px 13px;box-shadow:var(--shadow);}
.idx .nm{font-size:12.5px;font-weight:700;color:var(--ink);}
.idx .pr{font-size:15px;font-weight:700;margin-top:4px;}
.idx .ch{font-size:12px;font-weight:600;margin-top:2px;}
.section{margin-top:22px;}
.sec-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:11px;padding:0 2px;}
.sec-head h3{font-size:16px;font-weight:700;margin:0;letter-spacing:-.01em;}
.seeall{font-size:12.5px;font-weight:700;color:var(--brand-ink);background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:1px;}
.list{background:var(--surface);border:1px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:var(--shadow);}
.row{display:flex;align-items:center;gap:12px;padding:13px 14px;cursor:pointer;background:var(--surface);}
.row:active{background:var(--soft);}
.row + .row{border-top:1px solid var(--line2);}
.av{width:40px;height:40px;border-radius:12px;flex:0 0 auto;display:grid;place-items:center;color:#fff;
  font-weight:800;font-size:13px;letter-spacing:-.02em;}
.row .meta{flex:1;min-width:0;}
.row .nm{font-size:14px;font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.row .sub{font-size:11.5px;color:var(--muted);margin-top:2px;display:flex;align-items:center;gap:6px;}
.row .right{text-align:right;flex:0 0 auto;display:flex;align-items:center;gap:10px;}
.row .price{font-size:14px;font-weight:700;color:var(--ink);}
.row .chg{font-size:11.5px;font-weight:700;margin-top:2px;}
.tag{font-size:10px;font-weight:700;padding:2px 6px;border-radius:6px;background:var(--soft);color:var(--muted);}
.star{background:none;border:none;cursor:pointer;padding:4px;color:var(--faint);}
.up{color:var(--up);} .down{color:var(--down);}
.seg{display:flex;background:var(--soft);border-radius:12px;padding:4px;gap:4px;}
.seg button{flex:1;border:none;background:none;padding:8px 4px;border-radius:9px;font-weight:700;font-size:13px;
  color:var(--muted);cursor:pointer;font-family:var(--font);}
.seg button.on{background:var(--surface);color:var(--ink);box-shadow:var(--shadow);}
.searchbar{display:flex;align-items:center;gap:10px;background:var(--surface);border:1px solid var(--line);
  border-radius:14px;padding:11px 14px;box-shadow:var(--shadow);}
.searchbar input{border:none;outline:none;flex:1;font-size:14.5px;font-family:var(--font);color:var(--ink);background:none;}
.searchbar input::placeholder{color:var(--faint);}
.chips{display:flex;gap:8px;overflow-x:auto;padding:2px 0;scrollbar-width:none;}
.chips::-webkit-scrollbar{display:none;}
.chip{flex:0 0 auto;border:1px solid var(--line);background:var(--surface);border-radius:999px;padding:7px 13px;
  font-size:12.5px;font-weight:600;color:var(--ink);cursor:pointer;}
.chip.on{background:var(--navy);color:#fff;border-color:var(--navy);}
.bottomnav{position:absolute;left:0;right:0;bottom:0;display:flex;padding:10px 6px calc(10px + env(safe-area-inset-bottom,0px));
  z-index:30;gap:0;border-radius:24px 24px 0 0;overflow:hidden;
  background:rgba(255,255,255,.76);backdrop-filter:blur(32px) saturate(1.5);
  -webkit-backdrop-filter:blur(32px) saturate(1.5);
  border-top:1px solid rgba(255,255,255,.65);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.85);}
.nav{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;border:none;background:none;
  cursor:pointer;padding:4px 0;color:var(--muted);font-family:var(--font);position:relative;z-index:1;
  transition:color .15s ease;}
.nav .nav-ic{width:44px;height:44px;border-radius:12px;border:none;background:transparent;
  display:grid;place-items:center;color:var(--muted);
  transition:background .18s ease,color .18s ease,box-shadow .18s ease,transform .18s ease;}
.nav .nav-lbl{font-size:10px;font-weight:600;letter-spacing:.01em;line-height:1.1;}
.nav.on{color:var(--brand-ink);}
.nav.on .nav-lbl{font-weight:700;}
.nav.on .nav-ic{background:var(--brand);color:#fff;
  box-shadow:0 6px 18px rgba(15,168,160,.38);}
.wl-appbar-btn{position:relative;}
.wl-appbar-btn.on{background:rgba(245,166,35,.14);color:#B7791F;}
.wl-appbar-count{position:absolute;top:2px;right:2px;min-width:14px;height:14px;padding:0 3px;border-radius:999px;background:#F5A623;color:#fff;font-size:8px;font-weight:800;display:grid;place-items:center;line-height:1;font-family:var(--font);}
.wl-topbar{flex:0 0 auto;background:var(--surface);padding:10px 14px;display:grid;grid-template-columns:38px 1fr 38px;align-items:center;gap:8px;border-bottom:1px solid var(--line);}
.wl-topbar h1{margin:0;font-size:17px;font-weight:800;text-align:center;color:var(--ink);letter-spacing:-.02em;}
.wl-topbar .back{width:38px;height:38px;border-radius:50%;border:none;background:var(--soft);display:grid;place-items:center;cursor:pointer;color:var(--ink);}
.wl-topbar-count{justify-self:end;min-width:28px;height:28px;padding:0 8px;border-radius:999px;background:rgba(245,166,35,.16);color:#B7791F;font-size:12px;font-weight:800;display:grid;place-items:center;font-family:var(--font);}
.wl-scroll{padding:12px 14px 100px;}
.wl-lede{margin:0 0 14px;font-size:12px;font-weight:600;color:var(--muted);line-height:1.45;}
.wl-empty{display:flex;flex-direction:column;align-items:center;text-align:center;padding:48px 24px 24px;gap:8px;}
.wl-empty-ic{width:64px;height:64px;border-radius:50%;background:var(--soft);display:grid;place-items:center;margin-bottom:4px;}
.wl-empty h4{margin:8px 0 0;font-size:16px;font-weight:800;color:var(--ink);}
.wl-empty p{margin:0;font-size:12.5px;font-weight:600;color:var(--muted);line-height:1.45;max-width:260px;}
.wl-empty-cta{margin-top:12px;border:none;background:linear-gradient(135deg,#19C9AE,#0E9C8E);color:#fff;border-radius:12px;padding:12px 20px;font-size:13px;font-weight:800;cursor:pointer;font-family:var(--font);}
.wl-list{display:flex;flex-direction:column;gap:8px;}
.wl-card{display:flex;align-items:flex-start;gap:11px;padding:13px 14px;background:var(--surface);border:1px solid var(--line);border-radius:16px;cursor:pointer;box-shadow:var(--shadow);}
.wl-card:active{background:var(--soft);}
.wl-meta{flex:1;min-width:0;}
.wl-name{font-size:13.5px;font-weight:800;color:var(--ink);line-height:1.25;}
.wl-subrow{display:flex;align-items:center;gap:8px;margin-top:4px;font-size:11px;color:var(--muted);font-weight:600;flex-wrap:wrap;}
.wl-metrics{display:flex;gap:12px;margin-top:8px;font-size:10.5px;color:var(--muted);font-weight:600;flex-wrap:wrap;}
.wl-metrics b{color:var(--ink);font-weight:800;margin-right:3px;}
.wl-card .star{border:none;background:none;padding:4px;cursor:pointer;flex:none;margin-top:2px;}
.overlay{position:absolute;inset:0;background:var(--bg);z-index:40;display:flex;flex-direction:column;
  animation:slideIn .26s cubic-bezier(.22,1,.36,1);}
@keyframes slideIn{from{transform:translateX(7%);opacity:.4;}to{transform:translateX(0);opacity:1;}}
.dbar{flex:0 0 auto;background:var(--surface);padding:10px 12px;display:flex;align-items:center;gap:10px;
  border-bottom:1px solid var(--line);}
.dbar .back{width:38px;height:38px;border-radius:50%;border:none;background:var(--soft);display:grid;place-items:center;cursor:pointer;color:var(--ink);}
.dbar .ttl{flex:1;min-width:0;}
.dbar .ttl .a{font-size:15px;font-weight:800;line-height:1.1;}
.dbar .ttl .b{font-size:11.5px;color:var(--muted);margin-top:1px;}
.dscroll{flex:1;overflow-y:auto;padding:16px 16px 110px;}
.dscroll::-webkit-scrollbar{width:0;}
.ltp{display:flex;align-items:flex-end;justify-content:space-between;}
.ltp .big{font-size:30px;font-weight:800;}
.ltp .ch{font-size:14px;font-weight:700;margin-top:3px;}
.tf{display:flex;gap:6px;margin:14px 0 4px;}
.tf button{flex:1;border:none;background:var(--soft);color:var(--muted);font-weight:700;font-size:12.5px;
  padding:7px 0;border-radius:9px;cursor:pointer;font-family:var(--font);}
.tf button.on{background:var(--navy);color:#fff;}
.statgrid{display:grid;grid-template-columns:1fr 1fr;gap:0;background:var(--surface);border:1px solid var(--line);
  border-radius:16px;overflow:hidden;box-shadow:var(--shadow);}
.statgrid .cell{padding:13px 15px;}
.statgrid .cell:nth-child(odd){border-right:1px solid var(--line2);}
.statgrid .cell{border-bottom:1px solid var(--line2);}
.statgrid .cell:nth-last-child(-n+2){border-bottom:none;}
.statgrid .k{font-size:11.5px;color:var(--muted);font-weight:600;}
.statgrid .v{font-size:14px;font-weight:700;margin-top:3px;}
.about{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:15px;box-shadow:var(--shadow);}
.about p{margin:0;font-size:13.5px;line-height:1.55;color:#475467;}
.hold-note{background:#EAF7F3;border:1px solid #CDEDE3;border-radius:14px;padding:11px 14px;display:flex;
  align-items:center;justify-content:space-between;}
.hold-note .l{font-size:12px;color:var(--brand-ink);font-weight:700;}
.hold-note .r{font-size:13px;font-weight:800;color:var(--ink);}
.tradebar{position:absolute;left:0;right:0;bottom:0;background:var(--surface);border-top:1px solid var(--line);
  padding:12px 16px 16px;display:flex;gap:11px;z-index:45;}
.btn{flex:1;border:none;border-radius:13px;padding:14px 0;font-size:15px;font-weight:800;cursor:pointer;font-family:var(--font);}
.btn:active{transform:scale(.985);}
.btn-sell{background:var(--down-bg);color:var(--down);}
.btn-buy{background:var(--up);color:#fff;}
.btn-grad{background:var(--grad);color:#fff;}
.btn-full{width:100%;flex:none;}
.scrim{position:absolute;inset:0;background:rgba(8,15,30,.46);z-index:60;display:flex;align-items:flex-end;animation:fade .2s ease;}
@keyframes fade{from{opacity:0;}to{opacity:1;}}
.sheet{width:100%;background:var(--surface);border-radius:24px 24px 0 0;padding:8px 18px 20px;
  animation:up .3s cubic-bezier(.22,1,.36,1);max-height:90%;overflow-y:auto;}
@keyframes up{from{transform:translateY(100%);}to{transform:translateY(0);}}
.grab{width:42px;height:5px;border-radius:3px;background:#E0E4EA;margin:6px auto 14px;}
.sheet h4{font-size:17px;font-weight:800;margin:0 0 2px;}
.sheet .ltp-line{font-size:12.5px;color:var(--muted);font-weight:600;margin-bottom:14px;}
.stepper{display:flex;align-items:center;justify-content:space-between;background:var(--soft);border-radius:13px;padding:6px;margin-top:6px;}
.stepper button{width:42px;height:42px;border-radius:10px;border:none;background:var(--surface);box-shadow:var(--shadow);
  display:grid;place-items:center;cursor:pointer;color:var(--ink);}
.stepper input,.stepper .valbox{flex:1;text-align:center;border:none;background:none;font-size:19px;font-weight:800;outline:none;
  font-family:var(--mono);color:var(--ink);width:60px;}
.fieldlbl{font-size:12px;font-weight:700;color:var(--muted);margin:16px 0 0;}
.summary{margin-top:18px;border-top:1px dashed var(--line);padding-top:14px;}
.sumrow{display:flex;justify-content:space-between;font-size:13.5px;margin-bottom:9px;color:#475467;font-weight:600;}
.sumrow.total{font-size:16px;font-weight:800;color:var(--ink);margin-top:4px;}
.alloc{height:12px;border-radius:8px;overflow:hidden;display:flex;margin:14px 0 12px;}
.alloc i{height:100%;}
.legend{display:flex;flex-wrap:wrap;gap:10px 16px;}
.lg{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:600;color:#475467;}
.lg .sw{width:10px;height:10px;border-radius:3px;}
.pcard{background:var(--grad);border-radius:20px;padding:18px;color:#fff;display:flex;align-items:center;gap:14px;
  box-shadow:0 14px 30px -12px rgba(20,48,110,.5);}
.pcard .ring{width:54px;height:54px;border-radius:50%;background:rgba(255,255,255,.2);display:grid;place-items:center;font-size:21px;font-weight:800;}
.pcard .nm{font-size:18px;font-weight:800;}
.pcard .em{font-size:12.5px;opacity:.85;margin-top:2px;}
.menu{background:var(--surface);border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:var(--shadow);margin-top:16px;}
.mrow{display:flex;align-items:center;gap:14px;padding:15px 16px;cursor:pointer;}
.mrow + .mrow{border-top:1px solid var(--line2);}
.mrow:active{background:var(--soft);}
.mrow .mi{width:36px;height:36px;border-radius:10px;background:var(--soft);display:grid;place-items:center;color:var(--navy);}
.mrow .mt{flex:1;font-size:14px;font-weight:600;}
.disclaimer{margin-top:18px;text-align:center;font-size:11px;color:var(--faint);line-height:1.5;padding:0 8px;}
.kyc{display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,.2);padding:3px 9px;border-radius:999px;font-size:11px;font-weight:700;margin-top:7px;}
.toast{position:absolute;left:16px;right:16px;bottom:84px;background:var(--navy);color:#fff;border-radius:14px;
  padding:13px 16px;font-size:13.5px;font-weight:600;z-index:80;display:flex;align-items:center;gap:10px;
  box-shadow:0 12px 30px rgba(8,15,30,.4);animation:toastIn .3s cubic-bezier(.22,1,.36,1);}
@keyframes toastIn{from{transform:translateY(20px);opacity:0;}to{transform:translateY(0);opacity:1;}}
.toast .tick{width:22px;height:22px;border-radius:50%;background:var(--up);display:grid;place-items:center;flex:0 0 auto;}
.splash{position:absolute;inset:0;z-index:120;display:flex;flex-direction:column;align-items:center;justify-content:center;
  background:radial-gradient(120% 100% at 50% 0%,#21345d,#0f1a35 55%,#0a1226);gap:18px;animation:fade .3s;}
.splash .name{color:#fff;font-size:30px;font-weight:800;letter-spacing:-.04em;animation:pop .6s cubic-bezier(.22,1,.36,1);}
.splash .tag{color:rgba(255,255,255,.55);font-size:13px;font-weight:600;letter-spacing:.02em;}
.ob-flow{position:absolute;inset:0;z-index:120;display:flex;flex-direction:column;background:var(--surface);overflow:hidden;}
.ob-splash{position:absolute;inset:0;display:flex;flex-direction:column;background:linear-gradient(180deg,#0f1830 0%,#0a1226 62%,#08101f 100%);color:#fff;overflow:hidden;}
.ob-splash-waves{position:absolute;left:-10%;right:-10%;bottom:0;height:42%;background:
  radial-gradient(80% 120% at 20% 100%,rgba(15,168,160,.22),transparent 55%),
  radial-gradient(70% 100% at 80% 90%,rgba(36,86,190,.18),transparent 50%);
  pointer-events:none;}
.ob-splash-waves::after{content:"";position:absolute;inset:0;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 120' preserveAspectRatio='none'%3E%3Cpath d='M0 80 C80 40 120 100 200 70 S320 30 400 60 L400 120 L0 120 Z' fill='rgba(15,168,160,0.08)'/%3E%3C/svg%3E") bottom/100% 45% no-repeat;}
.ob-splash-body{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;gap:14px;position:relative;z-index:1;}
.ob-splash-name{font-size:32px;font-weight:800;letter-spacing:-.04em;}
.ob-splash-tag{font-size:14px;font-weight:600;color:rgba(255,255,255,.72);}
.ob-splash-tag em{font-style:normal;color:var(--teal);}
.ob-splash-trust{display:flex;align-items:flex-start;gap:8px;margin-top:8px;padding:10px 14px;border-radius:12px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);max-width:300px;}
.ob-splash-trust b{display:block;font-size:11px;font-weight:800;line-height:1.35;}
.ob-splash-trust span{display:block;margin-top:3px;font-size:10px;font-weight:600;opacity:.75;}
.ob-splash-foot{padding:0 20px 22px;text-align:center;position:relative;z-index:1;}
.ob-splash-mf{margin:12px 0 0;font-size:11px;font-weight:700;color:rgba(255,255,255,.55);}
.ob-splash-disc{margin:8px 0 0;font-size:9.5px;font-weight:600;color:rgba(255,255,255,.38);line-height:1.45;}
.ob-screen{position:absolute;inset:0;display:flex;flex-direction:column;min-height:0;background:var(--surface);animation:fade .25s ease;}
.ob-carousel{flex:1;display:flex;flex-direction:column;min-height:0;padding:0 22px 20px;background:#fff;}
.ob-carousel-top{display:flex;justify-content:flex-end;padding:8px 0 4px;flex:none;}
.ob-skip{border:none;background:none;color:var(--brand);font-size:14px;font-weight:700;cursor:pointer;padding:6px 2px;font-family:var(--font);}
.ob-carousel-art{flex:1;display:flex;align-items:center;justify-content:center;padding:12px 0 20px;min-height:0;overflow:visible;}
.ob-discover-stage{position:relative;width:100%;max-width:320px;margin:0 auto;overflow:visible;}
.ob-discover-bars{position:absolute;right:-8px;top:18%;display:flex;align-items:flex-end;gap:5px;height:88px;opacity:.45;z-index:0;pointer-events:none;}
.ob-discover-bars i{width:10px;border-radius:4px;background:linear-gradient(180deg,#7DD3FC 0%,#0FA8A0 100%);display:block;}
.ob-discover-card{position:relative;z-index:1;padding:18px 16px 14px;border:1px solid #EEF0F3;border-radius:22px;box-shadow:0 16px 40px rgba(16,24,40,.09);overflow:visible;}
.ob-fund-ic-wrap{position:relative;width:40px;height:40px;flex:none;}
.ob-fund-ic-wrap.lens-host{z-index:5;overflow:visible;}
.ob-fund-ic-wrap.lens-host .ob-fund-ic{opacity:0;}
.ob-magnifier{position:absolute;left:50%;top:50%;width:88px;height:88px;transform:translate(-50%,-50%);z-index:2;pointer-events:none;filter:drop-shadow(0 10px 20px rgba(16,24,40,.16));}
.ob-magnifier-svg,.ob-magnifier-ring{position:absolute;inset:0;width:100%;height:100%;display:block;}
.ob-magnifier-ring{z-index:3;pointer-events:none;}
.ob-magnifier-zoom{position:absolute;left:53.1%;top:41.7%;width:40px;height:40px;transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center;color:#0B7E78;z-index:2;clip-path:circle(17px at 50% 50%);pointer-events:none;}
.ob-regular-badge{position:absolute;top:14px;right:14px;font-size:10px;font-weight:800;padding:5px 10px;border-radius:8px;background:var(--brand);color:#fff;letter-spacing:.01em;z-index:4;}
.ob-fund-list{display:grid;gap:0;margin-top:8px;position:relative;z-index:2;}
.ob-fund-row{display:flex;align-items:center;gap:12px;padding:12px 4px;border-bottom:1px solid #F2F4F7;}
.ob-fund-row:last-child{border-bottom:none;padding-bottom:4px;}
.ob-fund-row.hi{background:linear-gradient(90deg,rgba(234,247,243,.85) 0%,rgba(255,255,255,0) 72%);margin:0 -8px;padding-left:12px;padding-right:12px;border-radius:14px;border-bottom:none;overflow:visible;z-index:3;}
.ob-fund-ic{width:40px;height:40px;border-radius:12px;background:#EAF7F3;color:#0B7E78;display:grid;place-items:center;}
.ob-fund-meta{flex:1;min-width:0;}
.ob-fund-meta b{display:block;font-size:13.5px;font-weight:800;color:#1A2B48;line-height:1.2;}
.ob-fund-meta small{display:block;font-size:11px;font-weight:600;color:#98A2B3;margin-top:3px;}
.ob-fund-pct{font-size:14px;font-weight:800;color:#16A35A;flex:none;}
.ob-art-card{width:100%;max-width:320px;background:#fff;border:1px solid var(--line);border-radius:20px;padding:16px;box-shadow:0 12px 32px rgba(16,24,40,.08);}
.ob-port-card{padding:20px 20px 16px;border:none;box-shadow:0 8px 28px rgba(16,24,40,.1);}
.ob-port-top{display:flex;align-items:center;justify-content:space-between;gap:14px;}
.ob-port-stats{flex:1;min-width:0;}
.ob-port-card .ob-port-hd span,.ob-port-card .ob-port-sub span{display:block;font-size:11px;font-weight:600;color:#667085;letter-spacing:0;}
.ob-port-card .ob-port-hd b{font-size:22px;font-weight:800;color:#1A2B48;margin-top:4px;display:block;line-height:1.15;}
.ob-port-sub{margin-top:10px;}
.ob-port-card .ob-port-sub b{font-size:13px;font-weight:700;margin-top:3px;display:block;line-height:1.2;}
.ob-port-card .ob-port-sub b.up{color:#2E7D32;}
.ob-port-card .ob-donut{width:72px;height:72px;border-radius:50%;background:conic-gradient(#0B7E78 0deg 112deg,#C5EEEB 112deg 142deg,#5EBDB8 142deg 198deg,#A8D4F5 198deg 236deg,#4A9BD4 236deg 360deg);display:grid;place-items:center;flex:none;}
.ob-port-card .ob-donut span{width:40px;height:40px;border-radius:50%;background:#fff;}
.ob-port-divider{height:1px;background:#EEF0F3;margin:16px 0 14px;}
.ob-port-bars{position:relative;height:82px;}
.ob-port-grid{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:space-between;pointer-events:none;}
.ob-port-grid i{display:block;height:1px;background:#F2F4F7;}
.ob-port-bar-row{position:relative;z-index:1;height:100%;display:flex;align-items:flex-end;gap:3px;}
.ob-port-bar{flex:1;display:flex;flex-direction:column;justify-content:flex-end;min-width:0;max-width:7px;}
.ob-port-bar i{display:block;width:100%;min-height:2px;border-radius:1px;}
.ob-port-bar i.light{background:#90CDF4;}
.ob-port-bar i.dark{background:#3182CE;margin-top:1px;}
.ob-port-foot{margin-top:12px;}
.ob-port-foot span{display:inline-block;font-size:10px;font-weight:600;color:#667085;background:#F7FAFC;padding:5px 11px;border-radius:999px;}
.ob-exec-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
.ob-exec-tile{padding:12px 8px;border-radius:14px;border:1px solid var(--line);background:var(--soft);text-align:center;}
.ob-exec-tile.on{background:#EAF7F3;border-color:#CDEDE3;}
.ob-exec-tile span{display:block;font-size:9px;font-weight:800;color:var(--brand-ink);text-transform:uppercase;}
.ob-exec-tile b{display:block;margin-top:4px;font-size:11px;font-weight:800;color:var(--ink);}
.ob-exec-note{display:flex;align-items:center;gap:8px;margin-top:14px;padding:10px 12px;border-radius:12px;background:#EAF7F3;font-size:11px;font-weight:700;color:#0B7E78;}
.ob-carousel-copy{flex:none;padding:0 2px;}
.ob-carousel-copy h2{margin:0;font-size:26px;font-weight:800;line-height:1.22;color:#1A2B48;letter-spacing:-.035em;}
.ob-carousel-copy h2 em{font-style:normal;color:var(--brand);}
.ob-carousel-copy p{margin:12px 0 0;font-size:14px;font-weight:500;color:#5A6B87;line-height:1.55;}
.ob-carousel-foot{flex:none;padding-top:18px;margin-top:auto;}
.ob-dots{display:flex;justify-content:center;gap:6px;margin-bottom:16px;}
.ob-dots span{width:8px;height:8px;border-radius:50%;background:#D0D5DD;}
.ob-dots span.on{width:22px;border-radius:999px;background:var(--brand);}
.ob-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:16px;border:none;border-radius:12px;background:var(--brand);color:#fff;font-size:16px;font-weight:800;cursor:pointer;font-family:var(--font);box-shadow:0 10px 24px rgba(15,168,160,.26);}
.ob-btn:disabled{opacity:.45;cursor:not-allowed;box-shadow:none;}
.ob-link{display:block;width:100%;margin-top:14px;border:none;background:none;color:var(--brand);font-size:14px;font-weight:700;cursor:pointer;font-family:var(--font);text-align:center;}
.ob-trust-line{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:16px;font-size:11px;font-weight:600;color:#667085;line-height:1.4;text-align:left;}
.ob-trust-line svg{flex:none;color:var(--brand);}
.ob-form{flex:1;display:flex;flex-direction:column;min-height:0;padding:12px 20px 20px;overflow-y:auto;}
.ob-back{width:38px;height:38px;border-radius:50%;border:none;background:var(--soft);display:grid;place-items:center;cursor:pointer;color:var(--ink);margin-bottom:12px;}
.ob-form-art{display:flex;justify-content:center;margin:8px 0 20px;}
.ob-phone-illus{display:flex;align-items:center;gap:8px;}
.ob-phone-illus .ph,.ob-phone-illus .usr{width:52px;height:52px;border-radius:16px;background:#EAF7F3;display:grid;place-items:center;}
.ob-phone-illus .usr{background:#E8F0FF;}
.ob-dash{width:28px;height:0;border-top:2px dashed #CDEDE3;}
.ob-shield{width:40px;height:40px;border-radius:50%;background:#EAF7F3;border:2px solid #CDEDE3;display:grid;place-items:center;}
.ob-form h2{margin:0;font-size:22px;font-weight:800;letter-spacing:-.03em;color:var(--ink);}
.ob-lead{margin:8px 0 16px;font-size:13px;font-weight:600;color:var(--muted);line-height:1.45;}
.ob-trust-box{padding:14px;border-radius:14px;background:var(--soft);border:1px solid var(--line);margin-bottom:18px;}
.ob-trust-box b{display:block;font-size:13px;font-weight:800;color:var(--ink);}
.ob-trust-box span{display:block;margin-top:4px;font-size:11px;font-weight:600;color:var(--muted);}
.ob-field-lbl{display:block;font-size:12px;font-weight:700;color:var(--muted);margin-bottom:6px;}
.ob-phone-in{display:flex;align-items:center;gap:10px;border:1.5px solid var(--line);border-radius:12px;padding:4px 14px;background:var(--surface);}
.ob-phone-in .cc{font-size:14px;font-weight:800;color:var(--ink);padding:10px 0;border-right:1px solid var(--line2);padding-right:12px;}
.ob-phone-in input{flex:1;border:none;outline:none;font-size:16px;font-weight:700;font-family:var(--mono);padding:10px 0;background:transparent;color:var(--ink);}
.ob-ssl{display:flex;align-items:center;gap:6px;margin-top:10px;font-size:11px;font-weight:600;color:var(--brand-ink);}
.ob-pan-ic{width:72px;height:72px;border-radius:18px;background:#EAF7F3;display:grid;place-items:center;}
.ob-info-box{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border-radius:12px;background:#E8F4FF;border:1px solid #C7E0F4;margin:14px 0 18px;color:#175CD3;}
.ob-info-box p{margin:0;font-size:11.5px;font-weight:600;line-height:1.45;}
.ob-pan-in{width:100%;padding:14px 16px;border:1.5px solid var(--line);border-radius:12px;font-size:18px;font-weight:800;font-family:var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--ink);outline:none;}
.ob-pan-in:focus{border-color:var(--brand);}
.ob-pan-note{display:flex;align-items:center;gap:6px;margin-top:10px;font-size:11px;font-weight:600;color:var(--muted);}
.ob-form-spacer{flex:1;min-height:16px;}
.ob-form-foot{flex:none;padding-top:8px;}
.ob-legal{margin:12px 0 0;font-size:10.5px;font-weight:600;color:var(--muted);line-height:1.45;text-align:center;}
.ob-inline{border:none;background:none;padding:0;color:var(--brand-ink);font-weight:800;text-decoration:underline;cursor:pointer;font-family:inherit;font-size:inherit;}
.ob-safe{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:12px;font-size:11px;font-weight:600;color:#175CD3;}
.ob-pan-disc{margin-top:14px;text-align:center;color:var(--faint);}
@keyframes pop{from{transform:scale(.8);opacity:0;}to{transform:scale(1);opacity:1;}}
.tipbar{font-size:11px;color:var(--muted);text-align:center;margin-top:14px;font-weight:600;}
.compliance-strip{background:#EAF7F3;border:1px solid #CDEDE3;border-radius:12px;padding:10px 12px;font-size:11px;
  font-weight:600;color:#0B7E78;line-height:1.45;margin-bottom:14px;}
.field-lbl{font-size:12px;font-weight:700;color:#667085;margin-bottom:6px;}
.insight-card{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:14px;margin-top:10px;box-shadow:var(--shadow);}
.insight-card .ih{font-size:13px;font-weight:800;color:var(--ink);margin-bottom:8px;}
.insight-card .note{font-size:11px;color:var(--muted);font-weight:600;line-height:1.45;margin-top:10px;}
.insight-stat{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--line2);}
.insight-stat:last-child{border-bottom:none;}
.insight-stat .k{font-size:12px;font-weight:600;color:var(--muted);}
.insight-stat .v{font-size:14px;font-weight:800;}
.flag-row{font-size:12px;font-weight:600;color:var(--brand-ink);background:#EAF7F3;border:1px solid #CDEDE3;border-radius:10px;padding:8px 10px;margin-top:6px;line-height:1.4;}
.rate-chips{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0 10px;}
.rate-chip{border:1px solid var(--line);background:var(--soft);border-radius:999px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;color:var(--muted);}
.rate-chip.on{background:var(--navy);color:#fff;border-color:var(--navy);}
.range-row{margin:10px 0 4px;}
.range-row input[type=range]{width:100%;accent-color:var(--brand);}
.illustrative-val{font-size:26px;font-weight:800;color:var(--navy);margin:6px 0 2px;}
@keyframes spin{to{transform:rotate(360deg);}}
.sip-card{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:14px;box-shadow:var(--shadow);}
.sip-card + .sip-card{margin-top:10px;}
.sip-status{font-size:10px;font-weight:800;padding:3px 8px;border-radius:999px;text-transform:uppercase;}
.sip-status.active{background:var(--up-bg);color:var(--up);}
.sip-status.paused{background:var(--soft);color:var(--muted);}
.sip-status.failed{background:var(--down-bg);color:var(--down);}
.sip-status.pending{background:#FFF4E5;color:#B54708;}
.sip-scroll{padding-bottom:100px;}
.sip-hero{background:var(--grad);border-radius:20px;padding:18px 16px;color:#fff;margin-bottom:14px;box-shadow:0 14px 30px -12px rgba(20,48,110,.45);}
.sip-hero-lbl{font-size:12px;font-weight:700;opacity:.88;}
.sip-hero-val{font-size:30px;font-weight:800;margin:4px 0 14px;letter-spacing:-.03em;}
.sip-hero-suffix{font-size:14px;font-weight:700;opacity:.8;margin-left:4px;}
.sip-hero-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding-top:12px;border-top:1px solid rgba(255,255,255,.22);}
.sip-hero-stats .st .k{font-size:10px;font-weight:700;opacity:.75;text-transform:uppercase;letter-spacing:.03em;}
.sip-hero-stats .st .v{font-size:14px;font-weight:800;margin-top:3px;}
.sip-hero-link{display:inline-flex;align-items:center;gap:4px;margin-top:12px;background:none;border:none;color:#fff;font-size:12px;font-weight:700;cursor:pointer;padding:0;opacity:.9;font-family:var(--font);}
.sip-bounce-banner{display:flex;gap:10px;align-items:flex-start;background:var(--down-bg);border:1px solid #FECDCA;border-radius:14px;padding:12px;margin-bottom:14px;}
.sip-bounce-banner .ic{color:var(--down);flex:none;margin-top:1px;}
.sip-bounce-banner .t{font-size:13px;font-weight:800;color:var(--down);}
.sip-bounce-banner .s{font-size:11.5px;font-weight:600;color:#B42318;margin-top:2px;line-height:1.4;}
.sip-bounce-banner button{margin-top:8px;background:none;border:none;color:var(--down);font-size:12px;font-weight:800;cursor:pointer;padding:0;font-family:var(--font);text-decoration:underline;}
.sip-bounce-x{background:none;border:none;color:var(--down);cursor:pointer;padding:2px;flex:none;}
.sip-toolbar{display:flex;gap:10px;align-items:center;margin-bottom:12px;}
.sip-list{display:flex;flex-direction:column;gap:10px;}
.sip-card-v2{background:var(--surface);border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:var(--shadow);}
.sip-card-v2.failed{border-color:#FECDCA;}
.sip-card-main{display:flex;align-items:center;gap:12px;width:100%;padding:14px;background:none;border:none;text-align:left;cursor:pointer;font-family:var(--font);}
.sip-card-main .meta{flex:1;min-width:0;}
.sip-card-main .top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;}
.sip-card-main .nm{font-size:14px;font-weight:700;color:var(--ink);line-height:1.3;}
.sip-card-main .sub{display:flex;align-items:center;gap:8px;font-size:11px;color:var(--muted);font-weight:600;margin-top:4px;flex-wrap:wrap;}
.sip-card-main .amt{font-size:18px;font-weight:800;color:var(--navy);margin-top:8px;}
.sip-card-main .amt span{font-size:12px;font-weight:600;color:var(--muted);}
.sip-card-main .det{display:flex;gap:6px;flex-wrap:wrap;font-size:11px;color:var(--muted);font-weight:600;margin-top:4px;}
.sip-fail-box{display:flex;gap:8px;align-items:flex-start;padding:10px 14px 12px;background:#FEF3F2;border-top:1px solid #FECDCA;font-size:12px;color:#B42318;font-weight:600;}
.sip-fail-box button{margin-left:6px;background:none;border:none;color:var(--down);font-weight:800;cursor:pointer;padding:0;text-decoration:underline;font-family:var(--font);}
.sip-fab{position:absolute;right:16px;bottom:88px;z-index:40;display:inline-flex;align-items:center;gap:8px;background:var(--grad);color:#fff;border:none;border-radius:999px;padding:12px 18px;font-size:14px;font-weight:800;cursor:pointer;box-shadow:0 10px 24px rgba(15,168,160,.45);font-family:var(--font);}
.sip-upcoming-fold{margin-top:16px;border:1px solid var(--line);border-radius:14px;background:var(--surface);overflow:hidden;}
.sip-upcoming-fold summary{display:flex;align-items:center;gap:8px;padding:12px 14px;font-size:13px;font-weight:700;color:var(--ink);cursor:pointer;list-style:none;}
.sip-upcoming-fold summary::-webkit-details-marker{display:none;}
.sip-upcoming-fold summary .chev{margin-left:auto;color:var(--faint);}
.sip-upcoming-fold[open] summary .chev{transform:rotate(90deg);}
.sip-upcoming-fold .inner{padding:0 14px 12px;border-top:1px solid var(--line2);}
.sip-upcoming-row{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid var(--line2);font-size:12px;font-weight:600;}
.sip-upcoming-row:last-child{border-bottom:none;}
.sip-upcoming-row .d{color:var(--brand-ink);font-weight:800;flex:none;}
.sip-upcoming-row .l{color:var(--muted);text-align:right;}
.sip-sheet-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
.sip-sheet-x{background:none;border:none;color:var(--muted);cursor:pointer;padding:4px;display:grid;place-items:center;}
.sip-sheet-fund{display:flex;gap:12px;align-items:center;padding:12px;background:var(--soft);border-radius:14px;margin-bottom:12px;}
.sip-sheet-fund .nm{font-size:14px;font-weight:800;}
.sip-sheet-fund .sub{font-size:12px;color:var(--muted);font-weight:600;margin-top:2px;}
.sip-manage-menu{border:1px solid var(--line);border-radius:14px;overflow:hidden;margin-bottom:14px;}
.sip-manage-row{display:flex;align-items:center;gap:12px;width:100%;padding:14px;background:var(--surface);border:none;border-bottom:1px solid var(--line2);cursor:pointer;text-align:left;font-family:var(--font);}
.sip-manage-row:last-child{border-bottom:none;}
.sip-manage-row .ic{width:36px;height:36px;border-radius:10px;background:var(--soft);display:grid;place-items:center;color:var(--navy);flex:none;}
.sip-manage-row .txt{flex:1;}
.sip-manage-row .txt b{display:block;font-size:14px;font-weight:700;color:var(--ink);}
.sip-manage-row .txt small{display:block;font-size:11.5px;color:var(--muted);font-weight:600;margin-top:2px;}
.sip-manage-row.danger .txt b{color:var(--down);}
.sip-sheet-info{background:var(--soft);border-radius:12px;padding:12px;display:grid;gap:8px;margin-bottom:10px;}
.sip-sheet-info div{display:flex;justify-content:space-between;font-size:12px;font-weight:600;color:var(--muted);}
.sip-sheet-info b{color:var(--ink);font-weight:800;}
.sip-sheet-tip{font-size:11px;color:var(--faint);font-weight:600;line-height:1.45;margin:0;}
.sip-modify-current{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--soft);border-radius:12px;font-size:12px;font-weight:600;color:var(--muted);margin-bottom:8px;}
.sip-amount-display{font-size:28px;font-weight:800;color:var(--navy);margin:8px 0;}
.sip-modify-slider{width:100%;accent-color:var(--brand);margin:8px 0;}
.sip-modify-range{display:flex;justify-content:space-between;font-size:11px;color:var(--faint);font-weight:600;}
.sip-amount-presets{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}
.sip-review-box{background:var(--soft);border-radius:14px;padding:12px;margin-bottom:14px;}
.sip-review-box .row{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid var(--line2);font-size:12px;font-weight:600;color:var(--muted);}
.sip-review-box .row:last-child{border-bottom:none;}
.sip-review-box b{color:var(--ink);font-weight:800;text-align:right;}
.sip-review-box b.up{color:var(--up);}
.sip-fail-modal .sip-fail-modal-body{font-size:13px;color:var(--ink);line-height:1.5;}
.sip-fail-modal .lead{margin:0 0 12px;font-weight:600;}
.sip-fail-modal .reason{display:flex;align-items:center;gap:8px;background:var(--down-bg);color:var(--down);border-radius:10px;padding:10px 12px;font-weight:700;font-size:13px;margin-bottom:14px;}
.sip-fail-modal .block{margin-bottom:14px;}
.sip-fail-modal .block h5{margin:0 0 6px;font-size:13px;font-weight:800;}
.sip-fail-modal .block p,.sip-fail-modal .block ol{margin:0;font-size:12px;font-weight:600;color:var(--muted);line-height:1.5;}
.sip-fail-modal ol{padding-left:18px;}
.prof-scroll{padding-bottom:24px;}
.prof-user-card{background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:16px;box-shadow:var(--shadow);display:flex;gap:14px;align-items:flex-start;}
.prof-avatar-wrap{position:relative;flex:none;}
.prof-avatar{width:64px;height:64px;border-radius:50%;background:var(--navy);color:#fff;display:grid;place-items:center;font-size:26px;font-weight:800;}
.prof-avatar-cam{position:absolute;right:-2px;bottom:-2px;width:26px;height:26px;border-radius:50%;background:var(--brand);border:2px solid var(--surface);color:#fff;display:grid;place-items:center;cursor:pointer;padding:0;}
.prof-user-main{flex:1;min-width:0;}
.prof-user-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;}
.prof-user-top h2{margin:0;font-size:17px;font-weight:800;color:var(--ink);letter-spacing:-.02em;}
.prof-user-top .contact{font-size:12px;font-weight:600;color:var(--muted);margin-top:3px;}
.prof-kyc{display:inline-flex;align-items:center;gap:4px;margin-top:8px;background:var(--up-bg);color:var(--up);font-size:11px;font-weight:800;padding:4px 9px;border-radius:999px;}
.prof-ids{text-align:right;flex:none;}
.prof-ids div{margin-bottom:6px;}
.prof-ids span{display:block;font-size:10px;font-weight:700;color:var(--faint);text-transform:uppercase;letter-spacing:.04em;}
.prof-ids b{font-size:12px;font-weight:800;color:var(--ink);}
.prof-portfolio-link{display:inline-flex;align-items:center;gap:4px;margin-top:14px;background:none;border:none;padding:0;font-size:14px;font-weight:800;color:var(--brand-ink);cursor:pointer;font-family:var(--font);}
.prof-portfolio-sub{margin:4px 0 0;font-size:11.5px;font-weight:600;color:var(--muted);}
.prof-trust-card{background:linear-gradient(145deg,#1a2848,#0f1830);border-radius:18px;padding:16px;color:#fff;margin-top:16px;box-shadow:0 12px 28px -10px rgba(15,24,46,.55);}
.prof-trust-card .hd{font-size:15px;font-weight:800;margin-bottom:14px;}
.prof-trust-field{margin-bottom:12px;}
.prof-trust-field .k{font-size:10px;font-weight:700;opacity:.7;text-transform:uppercase;letter-spacing:.05em;}
.prof-trust-field .v-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:4px;}
.prof-trust-field .v{font-size:22px;font-weight:800;letter-spacing:.02em;}
.prof-copy{background:rgba(255,255,255,.12);border:none;border-radius:8px;width:32px;height:32px;display:grid;place-items:center;color:#fff;cursor:pointer;flex:none;}
.prof-trust-foot{display:flex;align-items:center;gap:6px;margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.15);font-size:11px;font-weight:700;opacity:.85;}
.prof-quick{margin-top:14px;border:1px solid var(--line);border-radius:16px;overflow:hidden;background:var(--surface);box-shadow:var(--shadow);}
.prof-quick-row{display:flex;align-items:center;gap:12px;width:100%;padding:14px 14px;background:var(--surface);border:none;border-bottom:1px solid var(--line2);cursor:pointer;text-align:left;font-family:var(--font);}
.prof-quick-row:last-child{border-bottom:none;}
.prof-quick-row .ic{width:36px;height:36px;border-radius:10px;background:#EAF7F3;color:var(--brand-ink);display:grid;place-items:center;flex:none;}
.prof-quick-row .txt{flex:1;min-width:0;}
.prof-quick-row .txt b{display:block;font-size:13.5px;font-weight:700;color:var(--ink);}
.prof-quick-row .txt small{display:block;font-size:11px;font-weight:600;color:var(--muted);margin-top:2px;line-height:1.35;}
.prof-section{margin-top:18px;}
.prof-section-hd{font-size:11px;font-weight:800;color:var(--brand-ink);letter-spacing:.06em;margin-bottom:8px;padding-left:2px;}
.prof-menu{border:1px solid var(--line);border-radius:16px;overflow:hidden;background:var(--surface);box-shadow:var(--shadow);}
.prof-menu-row{display:flex;align-items:center;gap:12px;width:100%;padding:14px;background:var(--surface);border:none;border-bottom:1px solid var(--line2);cursor:pointer;text-align:left;font-family:var(--font);}
.prof-menu-row:last-child{border-bottom:none;}
.prof-menu-row .ic{width:36px;height:36px;border-radius:10px;background:var(--soft);color:var(--navy);display:grid;place-items:center;flex:none;}
.prof-menu-row .txt{flex:1;min-width:0;}
.prof-menu-row .txt b{display:block;font-size:13.5px;font-weight:700;color:var(--ink);}
.prof-menu-row .txt small{display:block;font-size:11px;font-weight:600;color:var(--muted);margin-top:2px;line-height:1.35;}
.prof-menu-row.danger .txt b{color:var(--down);}
.prof-logout{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:20px;padding:14px;background:none;border:none;color:var(--down);font-size:14px;font-weight:800;cursor:pointer;font-family:var(--font);}
.prof-disclaimer{margin-top:16px;background:#EAF4FF;border:1px solid #C7E0F4;border-radius:12px;padding:12px;font-size:10.5px;font-weight:600;color:#175CD3;line-height:1.5;}
.prof-footer{margin-top:14px;text-align:center;font-size:10px;font-weight:600;color:var(--faint);line-height:1.55;padding:0 8px 8px;}
.prof-sheet-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px;}
.prof-sheet-head h4{margin:0;font-size:17px;font-weight:800;}
.prof-sheet-head .tag{font-size:11px;font-weight:800;color:var(--brand-ink);letter-spacing:.06em;}
.prof-earn-hero{text-align:center;margin-bottom:14px;}
.prof-earn-hero .illus{width:56px;height:56px;border-radius:14px;background:#EAF7F3;display:grid;place-items:center;margin:0 auto 10px;}
.prof-earn-hero .lead{margin:0;font-size:14px;font-weight:700;color:var(--ink);}
.prof-flow{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:6px;font-size:11px;font-weight:700;color:var(--muted);background:var(--soft);border-radius:12px;padding:10px;margin-bottom:14px;}
.prof-earn-list{list-style:none;margin:0;padding:0;display:grid;gap:12px;}
.prof-earn-list li{display:flex;gap:10px;align-items:flex-start;}
.prof-earn-list .ic{width:32px;height:32px;border-radius:8px;background:var(--soft);display:grid;place-items:center;color:var(--navy);flex:none;}
.prof-earn-list b{font-size:13px;font-weight:800;color:var(--ink);}
.prof-earn-list p{margin:3px 0 0;font-size:11.5px;font-weight:600;color:var(--muted);line-height:1.45;}
.prof-earn-note{background:#FFF8E6;border:1px solid #FDE68A;border-radius:12px;padding:12px;margin-top:14px;}
.prof-earn-note b{font-size:12px;font-weight:800;color:#92400E;}
.prof-earn-note p{margin:6px 0 0;font-size:11.5px;font-weight:600;color:#78350F;line-height:1.45;}
.prof-rvd{display:grid;gap:12px;}
.prof-rvd .col{background:var(--soft);border-radius:12px;padding:12px;}
.prof-rvd h5{margin:0 0 6px;font-size:13px;font-weight:800;color:var(--ink);}
.prof-rvd p{margin:0;font-size:11.5px;font-weight:600;color:var(--muted);line-height:1.45;}
.prof-empty-sheet{text-align:center;padding-bottom:24px;}
.prof-empty-x{position:absolute;right:18px;top:12px;}
.prof-empty-ic{width:56px;height:56px;border-radius:50%;background:#EAF7F3;display:grid;place-items:center;margin:8px auto 12px;}
.prof-empty-sheet h4{margin:0 0 8px;font-size:16px;font-weight:800;}
.prof-empty-sheet p{margin:0;font-size:12.5px;font-weight:600;color:var(--muted);line-height:1.45;padding:0 12px;}
.ntf-overlay{z-index:46;}
.ntf-topbar{flex:0 0 auto;background:var(--surface);padding:10px 14px;display:grid;grid-template-columns:38px 1fr 38px;align-items:center;gap:8px;border-bottom:1px solid var(--line);}
.ntf-topbar h1{margin:0;font-size:17px;font-weight:800;text-align:center;color:var(--ink);letter-spacing:-.02em;}
.ntf-topbar .back{width:38px;height:38px;border-radius:50%;border:none;background:var(--soft);display:grid;place-items:center;cursor:pointer;color:var(--ink);}
.ntf-topbar .gear{width:38px;height:38px;border-radius:50%;border:none;background:var(--soft);display:grid;place-items:center;cursor:pointer;color:var(--ink);justify-self:end;}
.ntf-info{flex:0 0 auto;display:flex;align-items:flex-start;gap:8px;padding:10px 14px;background:#EAF7F3;border-bottom:1px solid #CDEDE3;font-size:11px;font-weight:600;color:#0B7E78;line-height:1.45;}
.ntf-info svg{flex:none;margin-top:1px;}
.ntf-scroll{padding:12px 14px 100px;}
.ntf-section{margin-bottom:18px;}
.ntf-section-hd{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;padding:0 2px;}
.ntf-section-hd h3{margin:0;font-size:13px;font-weight:800;color:var(--ink);}
.ntf-mark-all{border:none;background:none;padding:0;font-size:11.5px;font-weight:800;color:var(--brand-ink);cursor:pointer;font-family:var(--font);}
.ntf-list{display:grid;gap:10px;}
.ntf-wrap{display:flex;align-items:flex-start;gap:8px;}
.ntf-wrap:not(.unread){padding-left:15px;}
.ntf-wrap.unread .ntf-dot{width:7px;height:7px;border-radius:50%;background:var(--brand);flex:none;margin-top:22px;}
.ntf-wrap:not(.unread) .ntf-dot{display:none;}
.ntf-card-block{flex:1;min-width:0;}
.ntf-card{display:flex;align-items:flex-start;gap:12px;width:100%;padding:14px;background:var(--surface);border:1px solid var(--line);border-radius:16px;cursor:pointer;text-align:left;font-family:var(--font);box-shadow:var(--shadow);}
.ntf-card:active{transform:scale(.995);}
.ntf-ic{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;flex:none;position:relative;}
.ntf-ic-teal{background:#EAF7F3;color:var(--brand-ink);}
.ntf-ic-blue{background:#E8F0FF;color:#2456BE;}
.ntf-ic-red{background:#FDECEC;color:#D92D20;}
.ntf-ic-amber{background:#FFF4E5;color:#B54708;}
.ntf-ic-purple{background:#F3EEFF;color:#7A5AF8;}
.ntf-ic-badge{position:absolute;top:-2px;right:-2px;width:14px;height:14px;border-radius:50%;background:#D92D20;color:#fff;font-size:9px;font-weight:800;display:grid;place-items:center;border:2px solid var(--surface);}
.ntf-body{flex:1;min-width:0;}
.ntf-body b{display:block;font-size:13.5px;font-weight:800;color:var(--ink);line-height:1.25;}
.ntf-body .sub{display:block;margin-top:3px;font-size:12px;font-weight:600;color:var(--muted);line-height:1.3;}
.ntf-body .det{display:block;margin-top:4px;font-size:11.5px;font-weight:600;color:var(--faint);line-height:1.35;}
.ntf-body .time{display:inline-flex;align-items:center;gap:4px;margin-top:8px;font-size:10.5px;font-weight:700;color:var(--faint);}
.ntf-chev{flex:none;margin-top:12px;color:var(--faint);}
.ntf-foot{margin-top:-6px;margin-left:52px;margin-right:4px;padding:10px 12px;border-radius:0 0 14px 14px;font-size:10.5px;font-weight:700;line-height:1.4;border:1px solid var(--line);border-top:none;}
.ntf-foot-info{background:#E8F4FF;color:#175CD3;border-color:#C7E0F4;}
.ntf-foot-warn{background:#FDECEC;color:#B42318;border-color:#FECDCA;}
.ntf-prefs{display:flex;align-items:center;gap:12px;width:100%;margin-top:6px;padding:14px;background:var(--surface);border:1px solid var(--line);border-radius:16px;cursor:pointer;text-align:left;font-family:var(--font);box-shadow:var(--shadow);}
.ntf-prefs .ic{width:40px;height:40px;border-radius:12px;background:var(--soft);color:var(--navy);display:grid;place-items:center;flex:none;}
.ntf-prefs .txt{flex:1;min-width:0;}
.ntf-prefs .txt b{display:block;font-size:13.5px;font-weight:800;color:var(--ink);}
.ntf-prefs .txt small{display:block;margin-top:2px;font-size:11px;font-weight:600;color:var(--muted);line-height:1.35;}
.ntf-disclaimer{margin:16px 4px 0;font-size:10px;font-weight:600;color:var(--faint);line-height:1.55;text-align:center;}
.ntf-empty{display:flex;flex-direction:column;align-items:center;text-align:center;padding:48px 20px 24px;}
.ntf-empty-ic{position:relative;width:80px;height:80px;border-radius:50%;background:#EAF7F3;display:grid;place-items:center;margin-bottom:18px;}
.ntf-empty-badge{position:absolute;right:2px;bottom:4px;width:24px;height:24px;border-radius:50%;background:#E8F0FF;border:2px solid var(--bg);display:grid;place-items:center;}
.ntf-empty h2{margin:0;font-size:18px;font-weight:800;color:var(--ink);}
.ntf-empty p{margin:10px 0 0;font-size:12.5px;font-weight:600;color:var(--muted);line-height:1.45;max-width:260px;}
.ntf-empty-btn{margin-top:20px;padding:12px 22px;border-radius:12px;border:1.5px solid var(--brand);background:var(--surface);color:var(--brand-ink);font-size:13px;font-weight:800;cursor:pointer;font-family:var(--font);}
.ntf-empty-shield{display:flex;align-items:center;gap:8px;margin-top:28px;padding:12px 14px;border-radius:12px;background:#EAF7F3;border:1px solid #CDEDE3;font-size:10.5px;font-weight:700;color:#0B7E78;line-height:1.4;text-align:left;max-width:320px;}
.fd-overlay{z-index:45;}
.wl-overlay{position:absolute;inset:0;z-index:46;background:var(--bg);display:flex;flex-direction:column;}
.fd-topbar{flex:0 0 auto;background:var(--surface);padding:10px 14px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line);}
.fd-topbar .back{width:38px;height:38px;border-radius:50%;border:none;background:var(--soft);display:grid;place-items:center;cursor:pointer;color:var(--ink);}
.fd-topbar-actions{display:flex;gap:8px;}
.fd-scroll{padding:14px 16px 120px;}
.fd-identity{display:flex;gap:12px;align-items:flex-start;margin-bottom:14px;}
.fd-identity .meta{flex:1;min-width:0;}
.fd-identity .title-row{display:flex;align-items:flex-start;gap:8px;flex-wrap:wrap;}
.fd-identity h1{margin:0;font-size:17px;font-weight:800;line-height:1.25;color:var(--ink);}
.fd-identity .sub{margin:4px 0 8px;font-size:12px;font-weight:600;color:var(--muted);}
.fd-tags{display:flex;flex-wrap:wrap;gap:6px;}
.fd-tag{font-size:10px;font-weight:800;padding:4px 9px;border-radius:999px;}
.fd-tag.cat{background:#E8F4FF;color:#175CD3;}
.fd-tag.risk-vh{background:#FDECEC;color:#B42318;}
.fd-tag.risk-h{background:#FFF4E5;color:#B54708;}
.fd-tag.risk-m{background:#EAF7F3;color:#0B7E78;}
.fd-metrics{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;}
.fd-metrics .blk{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:12px;box-shadow:var(--shadow);}
.fd-metrics .blk.right{text-align:right;}
.fd-metrics .k{font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;}
.fd-metrics .v{font-size:24px;font-weight:800;margin-top:4px;color:var(--navy);}
.fd-metrics .asof{font-size:10px;font-weight:600;color:var(--faint);margin-top:2px;}
.fd-metrics .chg{font-size:11px;font-weight:700;margin-top:6px;}
.fd-metrics .chg span{font-weight:600;color:var(--muted);margin-left:4px;}
.fd-nav-missing{display:flex;align-items:center;gap:8px;margin-top:6px;}
.fd-nav-missing b{font-size:13px;color:var(--down);}
.fd-nav-missing button{background:var(--soft);border:none;border-radius:8px;width:30px;height:30px;display:grid;place-items:center;cursor:pointer;}
.fd-chart-card{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:12px;margin-bottom:14px;box-shadow:var(--shadow);}
.fd-chart-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px;}
.fd-tf{display:flex;gap:4px;flex:1;flex-wrap:wrap;}
.fd-tf button{border:none;background:var(--soft);color:var(--muted);font-weight:700;font-size:11px;padding:7px 10px;border-radius:999px;cursor:pointer;font-family:var(--font);}
.fd-tf button.on{background:var(--navy);color:#fff;}
.fd-expand{background:var(--soft);border:none;border-radius:8px;width:32px;height:32px;display:grid;place-items:center;cursor:pointer;color:var(--muted);flex:none;}
.fd-chart-wrap{margin:0 -4px;}
.fd-chart-note{margin:8px 0 0;font-size:10px;font-weight:600;color:var(--faint);text-align:center;}
.fd-chart-link{display:block;margin:6px auto 0;background:none;border:none;color:var(--brand-ink);font-size:11px;font-weight:700;cursor:pointer;font-family:var(--font);text-decoration:underline;}
.fd-chart-error{text-align:center;padding:36px 16px;background:var(--soft);border-radius:12px;}
.fd-chart-error b{display:block;margin-top:8px;font-size:13px;}
.fd-chart-error p{margin:4px 0 10px;font-size:11px;color:var(--muted);font-weight:600;}
.fd-chart-error button{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);background:var(--surface);border-radius:8px;padding:8px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:var(--font);}
.fd-holding-card{background:#EAF7F3;border:1px solid #CDEDE3;border-radius:16px;padding:14px;margin-bottom:14px;}
.fd-holding-card .hd{display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:800;color:var(--brand-ink);margin-bottom:12px;}
.fd-holding-card .folio{font-size:11px;font-weight:600;color:var(--muted);}
.fd-hold-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.fd-hold-grid div span{display:block;font-size:10px;font-weight:600;color:var(--muted);}
.fd-hold-grid b{display:block;font-size:13px;font-weight:800;margin-top:3px;color:var(--ink);}
.fd-portfolio-link{display:inline-flex;align-items:center;gap:4px;margin-top:12px;background:none;border:none;color:var(--brand-ink);font-size:12px;font-weight:800;cursor:pointer;padding:0;font-family:var(--font);}
.fd-track-card{display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:14px;margin-bottom:14px;box-shadow:var(--shadow);}
.fd-track-card b{font-size:13px;font-weight:800;display:block;}
.fd-track-card p{margin:4px 0 0;font-size:11px;font-weight:600;color:var(--muted);line-height:1.35;}
.fd-track-card button{border:1.5px solid var(--brand);background:#EAF7F3;color:var(--brand-ink);border-radius:10px;padding:8px 14px;font-size:12px;font-weight:800;cursor:pointer;font-family:var(--font);flex:none;}
.fd-stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px;}
.fd-stat{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:10px 8px;min-height:72px;box-shadow:var(--shadow);}
.fd-stat .k{display:flex;align-items:center;gap:4px;font-size:9px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.02em;line-height:1.2;}
.fd-stat b{display:block;font-size:12px;font-weight:800;margin-top:6px;color:var(--ink);}
.fd-stat .discover-riskometer{margin-top:4px;transform:scale(.85);transform-origin:left top;}
.fd-why{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:14px;margin-bottom:14px;box-shadow:var(--shadow);}
.fd-why .hd{display:flex;align-items:center;gap:8px;margin-bottom:10px;color:var(--brand-ink);}
.fd-why h3{margin:0;font-size:13px;font-weight:800;color:var(--ink);}
.fd-why-tags{display:flex;flex-wrap:wrap;gap:6px;}
.fd-why-tags span{font-size:10.5px;font-weight:700;padding:5px 9px;border-radius:999px;background:#E8F4FF;color:#175CD3;border:1px solid #C7E0F4;}
.fd-why-note{margin:10px 0 0;font-size:10px;font-weight:600;color:var(--faint);}
.fd-actions-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px;}
.fd-actions-row button{display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 6px;background:var(--surface);border:1px solid var(--line);border-radius:14px;font-size:10.5px;font-weight:700;color:var(--ink);cursor:pointer;font-family:var(--font);box-shadow:var(--shadow);}
.fd-about{margin-bottom:14px;}
.fd-about h3{margin:0 0 8px;font-size:14px;font-weight:800;}
.fd-about p{margin:0;font-size:12px;font-weight:600;color:var(--muted);line-height:1.5;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}
.fd-about p.open{display:block;-webkit-line-clamp:unset;}
.fd-about button{margin-top:8px;background:none;border:none;color:var(--brand-ink);font-size:12px;font-weight:800;cursor:pointer;padding:0;font-family:var(--font);}
.fd-docs{margin-bottom:14px;}
.fd-docs h3{margin:0 0 10px;font-size:14px;font-weight:800;}
.fd-doc-list{display:grid;gap:8px;}
.fd-doc{display:flex;align-items:center;gap:12px;width:100%;padding:12px 14px;background:var(--surface);border:1px solid var(--line);border-radius:14px;cursor:pointer;text-align:left;font-family:var(--font);box-shadow:var(--shadow);}
.fd-doc span{flex:1;}
.fd-doc b{display:block;font-size:13px;font-weight:800;color:var(--ink);}
.fd-doc small{display:block;font-size:11px;font-weight:600;color:var(--muted);margin-top:2px;}
.fd-compliance{margin-bottom:8px;border-radius:12px;border:1px solid #CDEDE3;background:#EAF7F3;overflow:hidden;}
.fd-compliance summary{padding:12px 14px;font-size:11px;font-weight:700;color:#0B7E78;cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between;}
.fd-compliance summary::-webkit-details-marker{display:none;}
.fd-compliance .chev{color:var(--faint);}
.fd-compliance[open] .chev{transform:rotate(90deg);}
.fd-compliance .body{padding:0 14px 12px;font-size:10.5px;font-weight:600;color:#0B7E78;line-height:1.5;}
.fd-tradebar{position:absolute;left:0;right:0;bottom:0;background:var(--surface);border-top:1px solid var(--line);padding:10px 12px 14px;display:flex;gap:8px;z-index:46;}
.fd-trade{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:10px 6px;border-radius:14px;cursor:pointer;font-family:var(--font);min-height:54px;}
.fd-trade b{font-size:13px;font-weight:800;}
.fd-trade small{font-size:9px;font-weight:600;opacity:.85;}
.fd-trade.redeem{background:var(--surface);border:1.5px solid #FECDCA;color:var(--down);}
.fd-trade.invest{background:var(--surface);border:1.5px solid #ABEFC6;color:var(--up);}
.fd-trade.sip{background:var(--grad);border:none;color:#fff;flex:1.15;}
.ord-scrim{z-index:70;}
.ord-sheet{max-height:92%;overflow-y:auto;padding-bottom:28px;position:relative;}
.ord-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px;}
.ord-head h4{margin:0;font-size:18px;font-weight:800;color:var(--ink);}
.ord-head p{margin:4px 0 0;font-size:12px;font-weight:600;color:var(--muted);}
.ord-fund-card{display:flex;gap:12px;align-items:flex-start;padding:12px;background:var(--soft);border-radius:14px;margin-bottom:14px;}
.ord-fund-card .meta{flex:1;min-width:0;}
.ord-fund-card .nm{font-size:13px;font-weight:800;color:var(--ink);line-height:1.3;}
.ord-fund-card .sub{font-size:11px;font-weight:600;color:var(--muted);margin-top:3px;}
.ord-fund-card .navline{font-size:12px;font-weight:700;margin-top:6px;}
.ord-fund-card .navline span{font-weight:600;color:var(--muted);margin-left:4px;}
.ord-amount-input{display:flex;align-items:center;gap:8px;border:1.5px solid var(--line);border-radius:14px;padding:12px 14px;background:var(--surface);margin-bottom:10px;}
.ord-amount-input .sym{font-size:20px;font-weight:800;color:var(--muted);}
.ord-amount-input input{flex:1;border:none;background:transparent;font-size:22px;font-weight:800;color:var(--ink);font-family:var(--mono);outline:none;min-width:0;}
.ord-amount-input input.units{font-size:20px;}
.ord-amount-input .clear{width:28px;height:28px;border-radius:50%;border:none;background:var(--soft);display:grid;place-items:center;cursor:pointer;color:var(--muted);flex:none;}
.ord-chips{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;}
.ord-chips button{border:1px solid var(--line);background:var(--surface);border-radius:999px;padding:8px 12px;font-size:12px;font-weight:700;color:var(--ink);cursor:pointer;font-family:var(--font);}
.ord-chips button:active{background:var(--soft);}
.ord-hint{font-size:11px;font-weight:600;color:var(--muted);margin:0 0 14px;}
.ord-estimate{background:#EAF4FF;border:1px solid #C7E0F4;border-radius:14px;padding:12px 14px;margin-bottom:14px;display:grid;gap:8px;}
.ord-estimate div{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:12px;font-weight:600;color:var(--muted);}
.ord-estimate b{font-size:13px;font-weight:800;color:var(--ink);}
.ord-select-wrap{position:relative;margin-bottom:12px;}
.ord-select-wrap select{width:100%;appearance:none;border:1.5px solid var(--line);border-radius:14px;padding:12px 14px;font-size:14px;font-weight:700;color:var(--ink);background:var(--surface);font-family:var(--font);cursor:pointer;}
.ord-select-wrap svg{position:absolute;right:14px;top:50%;transform:translateY(-50%);color:var(--muted);pointer-events:none;}
.ord-mandate-info{display:flex;gap:10px;align-items:flex-start;background:#EAF4FF;border:1px solid #C7E0F4;border-radius:14px;padding:12px;margin-bottom:14px;color:#175CD3;}
.ord-mandate-info p{margin:0;font-size:11.5px;font-weight:600;line-height:1.45;color:#344054;}
.ord-holding-box{background:#EAF4FF;border:1px solid #C7E0F4;border-radius:14px;padding:12px 14px;margin-bottom:14px;}
.ord-holding-box .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px;}
.ord-holding-box span{display:block;font-size:10px;font-weight:600;color:var(--muted);}
.ord-holding-box b{display:block;font-size:12px;font-weight:800;margin-top:3px;color:var(--ink);}
.ord-holding-box .link{display:inline-flex;align-items:center;gap:2px;background:none;border:none;padding:0;font-size:12px;font-weight:800;color:var(--brand-ink);cursor:pointer;font-family:var(--font);}
.ord-toggle{display:flex;background:var(--soft);border-radius:12px;padding:4px;margin-bottom:12px;}
.ord-toggle button{flex:1;border:none;background:transparent;border-radius:10px;padding:10px;font-size:13px;font-weight:700;color:var(--muted);cursor:pointer;font-family:var(--font);}
.ord-toggle button.on{background:var(--surface);color:var(--ink);box-shadow:var(--shadow);}
.ord-warn{display:flex;gap:10px;align-items:flex-start;background:#FFF6ED;border:1px solid #FEDF89;border-radius:14px;padding:12px;margin-bottom:14px;color:#B54708;}
.ord-warn b{display:block;font-size:12px;font-weight:800;}
.ord-warn p{margin:4px 0 0;font-size:11px;font-weight:600;line-height:1.4;color:#93370D;}
.ord-warn button{background:none;border:none;padding:0;font-size:11px;font-weight:800;color:#B54708;text-decoration:underline;cursor:pointer;font-family:var(--font);}
.ord-summary{background:var(--soft);border-radius:14px;padding:12px 14px;margin-bottom:12px;}
.ord-sum-row{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0;font-size:12px;font-weight:600;color:var(--muted);}
.ord-sum-row.total{border-top:1px solid var(--line);margin-top:4px;padding-top:10px;font-size:13px;font-weight:800;color:var(--ink);}
.ord-compliance{font-size:10.5px;font-weight:600;color:var(--faint);text-align:center;margin:0 0 10px;}
.ord-consent{display:flex;gap:10px;align-items:flex-start;font-size:11px;font-weight:600;color:var(--muted);line-height:1.45;margin-bottom:12px;cursor:pointer;}
.ord-consent input{margin-top:3px;flex:none;accent-color:var(--brand);}
.ord-consent button{background:none;border:none;padding:0;color:var(--brand-ink);font-weight:800;text-decoration:underline;cursor:pointer;font-family:var(--font);font-size:inherit;}
.ord-err{color:var(--down);font-size:12px;font-weight:700;text-align:center;margin-bottom:10px;}
.ord-cta{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:4px;}
.ord-cta.buy{background:var(--grad);color:#fff;border:none;}
.ord-cta.redeem{background:var(--down);color:#fff;border:none;}
.ord-cta:disabled{opacity:.45;cursor:not-allowed;}
.ord-foot-disc{text-align:center;font-size:10px;font-weight:600;color:var(--faint);margin:12px 0 0;line-height:1.4;}
.ord-loading{position:absolute;inset:0;background:rgba(255,255,255,.92);border-radius:24px 24px 0 0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;z-index:5;text-align:center;padding:24px;}
.ord-loading b{font-size:15px;font-weight:800;color:var(--ink);}
.ord-loading p{margin:0;font-size:12px;font-weight:600;color:var(--muted);}
.ord-spin{animation:spin 1s linear infinite;color:var(--brand);}
@keyframes spin{to{transform:rotate(360deg);}}
.fq-scrim{position:absolute;inset:0;z-index:75;background:rgba(8,15,30,.5);display:flex;flex-direction:column;animation:fade .2s ease;}
.fq-panel{flex:1;margin-top:8%;background:var(--surface);border-radius:22px 22px 0 0;display:flex;flex-direction:column;max-height:92%;box-shadow:0 -12px 40px rgba(0,0,0,.18);overflow:hidden;}
.fq-head{padding:14px 16px 10px;border-bottom:1px solid var(--line);background:var(--surface);flex:none;}
.fq-head-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}
.fq-head h2{margin:0;font-size:17px;font-weight:800;color:var(--ink);}
.fq-disclaimer{display:flex;align-items:center;gap:6px;margin:0;font-size:10.5px;font-weight:600;color:var(--muted);line-height:1.4;}
.fq-active{padding:10px 16px;border-bottom:1px solid var(--line);flex:none;}
.fq-active .lbl{display:block;font-size:11px;font-weight:800;color:var(--ink);margin-bottom:6px;}
.fq-active .none{margin:0;font-size:11px;font-weight:600;color:var(--muted);}
.fq-chips{display:flex;flex-wrap:wrap;gap:8px;}
.fq-chip{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:700;color:var(--navy);background:#E8F0FF;border:1px solid #C7D7F4;border-radius:999px;padding:4px 8px 4px 4px;}
.fq-chip button{border:none;background:rgba(36,86,190,.12);color:var(--navy);border-radius:999px;width:18px;height:18px;display:grid;place-items:center;cursor:pointer;padding:0;flex:none;}
.fq-fund-logo{border-radius:8px;display:grid;place-items:center;color:#fff;font-weight:800;flex:none;}
.fq-body{flex:1;overflow-y:auto;padding:14px 16px;}
.fq-empty{display:grid;gap:16px;}
.fq-welcome{background:#EAF4FF;border:1px solid #C7E0F4;border-radius:16px;padding:16px;text-align:center;}
.fq-welcome-ic{width:52px;height:52px;border-radius:50%;background:#fff;display:grid;place-items:center;margin:0 auto 10px;color:var(--brand);}
.fq-welcome h3{margin:0 0 4px;font-size:16px;font-weight:800;color:var(--ink);}
.fq-welcome > p{margin:0 0 12px;font-size:12px;font-weight:600;color:var(--muted);}
.fq-welcome ul{list-style:none;margin:0;padding:0;text-align:left;display:grid;gap:8px;}
.fq-welcome li{display:flex;align-items:center;gap:8px;font-size:11.5px;font-weight:600;color:#344054;}
.fq-at-ic{display:inline-grid;place-items:center;width:18px;height:18px;border-radius:6px;background:#E8F0FF;color:var(--navy);font-size:12px;font-weight:800;flex:none;}
.fq-try span{display:block;font-size:11px;font-weight:800;color:var(--muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:.04em;}
.fq-try{display:grid;gap:8px;}
.fq-try button{text-align:left;border:1px solid var(--line);background:var(--surface);border-radius:12px;padding:12px 14px;font-size:12.5px;font-weight:700;color:var(--ink);cursor:pointer;font-family:var(--font);box-shadow:var(--shadow);}
.fq-msg{display:flex;gap:8px;margin-bottom:12px;align-items:flex-end;}
.fq-msg.user{flex-direction:row-reverse;}
.fq-avatar{width:28px;height:28px;border-radius:999px;display:grid;place-items:center;flex:none;}
.fq-avatar.bot{background:#EAF7F3;color:var(--brand);}
.fq-avatar.user{background:#E8F0FF;color:var(--navy);}
.fq-msg .bubble{max-width:82%;padding:10px 12px;border-radius:14px;font-size:12.5px;line-height:1.5;font-weight:600;white-space:pre-wrap;}
.fq-msg.bot .bubble{background:var(--surface);color:var(--ink);border:1px solid var(--line);}
.fq-msg.user .bubble{background:var(--grad);color:#fff;border:none;}
.fq-advice{background:#FEF3F2;border:1px solid #FECDCA;border-radius:16px;padding:14px;margin-bottom:12px;color:#B42318;}
.fq-advice svg{flex:none;margin-bottom:6px;}
.fq-advice b{display:block;font-size:13px;font-weight:800;margin-bottom:6px;}
.fq-advice p{margin:0 0 12px;font-size:11.5px;font-weight:600;line-height:1.45;color:#7A271A;}
.fq-advice-btns{display:flex;flex-wrap:wrap;gap:8px;}
.fq-advice-btns button{border:none;background:var(--navy);color:#fff;border-radius:10px;padding:9px 12px;font-size:11.5px;font-weight:800;cursor:pointer;font-family:var(--font);}
.fq-advice-btns button.ghost{background:var(--surface);color:var(--navy);border:1.5px solid var(--line);}
.fq-rate{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 16px 8px;padding:12px 14px;background:#FFF6ED;border:1px solid #FEDF89;border-radius:14px;flex:none;}
.fq-rate b{display:block;font-size:12px;font-weight:800;color:#B54708;}
.fq-rate p{margin:4px 0 0;font-size:11px;font-weight:600;color:#93370D;}
.fq-rate-timer{width:44px;height:44px;border-radius:50%;border:3px solid #FDB022;display:grid;place-items:center;flex:none;color:#B54708;}
.fq-rate-timer span{font-size:14px;font-weight:800;line-height:1;}
.fq-rate-timer small{display:block;font-size:8px;font-weight:700;text-transform:uppercase;}
.fq-quick{display:flex;gap:8px;padding:0 16px 8px;overflow-x:auto;flex:none;}
.fq-quick button{flex:0 0 auto;border:1px solid #CDEDE3;background:#EAF7F3;border-radius:999px;padding:7px 12px;font-size:11px;font-weight:700;color:var(--brand-ink);cursor:pointer;font-family:var(--font);white-space:nowrap;}
.fq-quick button:disabled{opacity:.5;cursor:not-allowed;}
.fq-compose{padding:8px 16px 10px;border-top:1px solid var(--line);background:var(--surface);flex:none;}
.fq-compose-wrap{position:relative;}
.fq-picker{position:absolute;bottom:calc(100% + 8px);left:0;right:0;background:var(--surface);border:1px solid var(--line);border-radius:14px;box-shadow:0 -8px 28px rgba(0,0,0,.12);overflow:hidden;z-index:10;max-height:280px;overflow-y:auto;}
.fq-picker-hd{padding:10px 14px 6px;font-size:10px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;}
.fq-picker-row{display:flex;align-items:center;gap:10px;width:100%;padding:10px 14px;border:none;background:var(--surface);cursor:pointer;text-align:left;font-family:var(--font);border-bottom:1px solid var(--line);}
.fq-picker-row.on,.fq-picker-row:hover{background:#EAF7F3;}
.fq-picker-row .meta{flex:1;min-width:0;}
.fq-picker-row b{display:block;font-size:12.5px;font-weight:800;color:var(--ink);}
.fq-picker-row span{display:block;font-size:10.5px;font-weight:600;color:var(--muted);margin-top:2px;}
.fq-picker-row .chev{color:var(--faint);flex:none;}
.fq-picker-more{display:flex;align-items:center;gap:8px;width:100%;padding:12px 14px;border:none;background:var(--soft);font-size:11.5px;font-weight:700;color:var(--brand-ink);cursor:pointer;font-family:var(--font);}
.fq-input-row{display:flex;align-items:center;gap:8px;}
.fq-input{flex:1;border:1.5px solid var(--line);border-radius:14px;padding:12px 14px;font-size:13px;font-weight:600;font-family:var(--font);outline:none;background:var(--surface);color:var(--ink);min-width:0;}
.fq-input:focus{border-color:var(--brand);}
.fq-at{width:40px;height:40px;border-radius:12px;border:1.5px solid var(--line);background:var(--soft);color:var(--muted);display:grid;place-items:center;cursor:pointer;flex:none;}
.fq-send{width:44px;height:44px;border-radius:999px;border:none;background:var(--grad);color:#fff;display:grid;place-items:center;cursor:pointer;flex:none;box-shadow:0 4px 14px rgba(14,156,142,.35);}
.fq-send:disabled{opacity:.45;cursor:not-allowed;}
.fq-foot{padding:0 16px 16px;font-size:10px;font-weight:600;color:var(--faint);text-align:center;line-height:1.45;flex:none;}
.fq-fab{position:absolute;right:16px;bottom:88px;z-index:50;width:52px;height:52px;border-radius:999px;border:none;background:var(--grad);color:#fff;box-shadow:0 8px 24px rgba(36,86,190,.35);cursor:pointer;display:grid;place-items:center;}
.fq-spin{animation:spin 1s linear infinite;color:var(--brand);}
`;

/* ---------------- data ---------------- */
const FUNDS = [
  { id:"ppfas-fc", s:"Parag Parikh Flexi Cap", h:"PPFAS", cat:"Flexi Cap", risk:"Very High", r3:22.4, r1:31.8, r5:24.9, nav:82.15, minSip:500, expense:0.77 },
  { id:"nippon-sc", s:"Nippon India Small Cap", h:"Nippon", cat:"Small Cap", risk:"Very High", r3:31.2, r1:38.6, r5:34.1, nav:178.90, minSip:500, expense:0.93 },
  { id:"hdfc-ba", s:"HDFC Balanced Advantage", h:"HDFC", cat:"Hybrid", risk:"High", r3:18.6, r1:21.2, r5:17.4, nav:495.20, minSip:500, expense:0.88 },
  { id:"quant-sc", s:"Quant Small Cap", h:"Quant", cat:"Small Cap", risk:"Very High", r3:34.8, r1:29.4, r5:39.2, nav:265.40, minSip:1000, expense:0.77 },
  { id:"mirae-lc", s:"Mirae Asset Large Cap", h:"Mirae", cat:"Large Cap", risk:"High", r3:15.9, r1:19.7, r5:16.8, nav:105.60, minSip:500, expense:0.52 },
  { id:"axis-lc", s:"Axis Bluechip Fund", h:"Axis", cat:"Large Cap", risk:"High", r3:13.2, r1:18.1, r5:14.6, nav:58.30, minSip:500, expense:0.54 },
  { id:"sbi-contra", s:"SBI Contra Fund", h:"SBI", cat:"Contra", risk:"Very High", r3:27.5, r1:24.9, r5:30.3, nav:385.70, minSip:500, expense:0.91 },
  { id:"icici-tech", s:"ICICI Pru Technology", h:"ICICI", cat:"Sectoral", risk:"Very High", r3:19.8, r1:33.5, r5:26.1, nav:192.30, minSip:500, expense:0.97 },
  { id:"hdfc-elss", s:"HDFC TaxSaver (ELSS)", h:"HDFC", cat:"ELSS", risk:"High", r3:16.8, r1:22.4, r5:15.2, nav:892.40, minSip:500, expense:1.08 },
  { id:"nippon-liquid", s:"Nippon India Liquid", h:"Nippon", cat:"Liquid", risk:"Low", r3:6.8, r1:7.1, r5:5.9, nav:5421.30, minSip:500, expense:0.21 },
];

const INITIAL_HOLDINGS = [
  { id:"ppfas-fc", units:245.32, avgNav:72.50, folio:"12345678/91" },
  { id:"nippon-sc", units:88.10, avgNav:155.20, folio:"87654321/42" },
  { id:"hdfc-ba", units:42.00, avgNav:468.00, folio:"11223344/55" },
  { id:"axis-lc", units:120.50, avgNav:52.10, folio:"99887766/33" },
];

const INITIAL_WATCH = ["quant-sc", "mirae-lc", "sbi-contra", "icici-tech", "hdfc-elss"];

const INITIAL_SIPS = [
  { id:"ppfas-fc", amount:5000, day:5, status:"Active", nextDebit:"5 Jul", bankAccount:"HDFC Bank •••• 4521" },
  { id:"nippon-sc", amount:3000, day:10, status:"Active", nextDebit:"10 Jul", bankAccount:"HDFC Bank •••• 4521" },
  { id:"mirae-lc", amount:3500, day:15, status:"Active", nextDebit:"15 Jul", bankAccount:"HDFC Bank •••• 4521" },
  { id:"axis-lc", amount:1500, day:20, status:"Active", nextDebit:"20 Jul", bankAccount:"HDFC Bank •••• 4521" },
  { id:"sbi-contra", amount:2000, day:12, status:"Active", nextDebit:"12 Jul", bankAccount:"HDFC Bank •••• 4521" },
  { id:"icici-tech", amount:3000, day:18, status:"Active", nextDebit:"18 Jul", bankAccount:"HDFC Bank •••• 4521" },
  { id:"nippon-liquid", amount:2000, day:22, status:"Active", nextDebit:"22 Jul", bankAccount:"HDFC Bank •••• 4521" },
  { id:"hdfc-elss", amount:1500, day:25, status:"Active", nextDebit:"25 Jul", bankAccount:"HDFC Bank •••• 4521" },
  { id:"hdfc-ba", amount:2000, day:1, status:"Paused", nextDebit:"—", bankAccount:"HDFC Bank •••• 4521" },
  { id:"quant-sc", amount:4000, day:8, status:"Failed", nextDebit:"8 Jul", bankAccount:"HDFC Bank •••• 4521", failReason:"Insufficient balance", retryDate:"17 Jul" },
  { id:"hdfc-ba-pending", sipKey:"hdfc-ba-pending", amount:1500, day:25, status:"Pending mandate", nextDebit:"After mandate", bankAccount:"HDFC Bank •••• 4521" },
];

const AV_COLORS = ["#2456BE","#0E9C8E","#7A5AF8","#E8943A","#D6409F","#16A35A","#0E7C86","#475467","#DC6803","#3E63DD"];

/* ---------------- helpers ---------------- */
const nf2 = new Intl.NumberFormat("en-IN", { minimumFractionDigits:2, maximumFractionDigits:2 });
const nf0 = new Intl.NumberFormat("en-IN", { maximumFractionDigits:0 });
const inr = (n) => "₹" + nf2.format(n);
const inr0 = (n) => "₹" + nf0.format(Math.round(n));
const signPct = (c) => (c >= 0 ? "+" : "") + (c * 100).toFixed(2) + "%";
const signInr = (n) => (n >= 0 ? "+" : "−") + "₹" + nf2.format(Math.abs(n));

function hashStr(s){ let h=2166136261; for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);} return (h>>>0); }
const avColor = (s) => AV_COLORS[hashStr(s) % AV_COLORS.length];

function calcPortfolio(holdings, navs){
  let inv=0, cur=0, day=0;
  holdings.forEach((h) => {
    const n = navs[h.id]; if(!n) return;
    inv += h.units * h.avgNav;
    cur += h.units * n.nav;
    day += h.units * (n.nav - n.prevNav);
  });
  return { inv, cur, day, ret: cur - inv, retPct: inv ? (cur - inv) / inv : 0, dayPct: cur ? day / (cur - day) : 0 };
}

/* ---------------- atoms ---------------- */
function NivyaMark({ size=28 }){
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

function FundAvatar({ h }){
  return <div className="av" style={{ background: avColor(h) }}>{h.slice(0,2).toUpperCase()}</div>;
}

function fundCategorySubline(f) {
  const map = {
    "Hybrid": "Hybrid · Aggressive",
    "Small Cap": "Small Cap · Growth",
    "Large Cap": "Large Cap · Stable",
    "Flexi Cap": "Flexi Cap · Diversified",
    "ELSS": "ELSS · Tax saving",
    "Liquid": "Liquid · Low risk",
  };
  return map[f.cat] ?? `${f.cat} · ${f.risk}`;
}

function HomeCollapsibleCompliance() {
  return (
    <details className="compliance-fold">
      <summary>
        Mutual fund investments are subject to market risks…
        <ChevronRight size={14} style={{ transform: "rotate(90deg)", flex: "none" }}/>
      </summary>
      <div className="body">
        Read all scheme-related documents carefully. Nivya is an AMFI-registered Mutual Fund Distributor ({NIVYA_ARN}).
        Past performance does not guarantee future results. This app shares factual data — not investment advice.
      </div>
    </details>
  );
}

function ComplianceStrip(){
  return (
    <div className="compliance-strip">
      Nivya · AMFI-registered Mutual Fund Distributor · {NIVYA_ARN}
      <br/>Mutual fund investments are subject to market risks. Read all scheme-related documents carefully.
    </div>
  );
}

function FundRow({ fund, navs, onOpen, watched, onToggleWatch, showStar=false, showReturn=false }){
  const q = navs[fund.id];
  const chg = q.nav / q.prevNav - 1;
  const up = chg >= 0;
  return (
    <div className="row" onClick={()=>onOpen(fund)}>
      <FundAvatar h={fund.h} />
      <div className="meta">
        <div className="nm">{fund.s}</div>
        <div className="sub"><span>{fund.cat}</span><span className="tag">{fund.risk}</span></div>
      </div>
      <div className="right">
        <div>
          {showReturn ? (
            <>
              <div className="price num up">{fund.r3}%</div>
              <div className="sub" style={{justifyContent:"flex-end"}}>3Y CAGR</div>
            </>
          ) : (
            <>
              <div className="price num">{inr(q.nav)}</div>
              <div className={"chg num " + (up?"up":"down")}>NAV {signPct(chg)}</div>
            </>
          )}
        </div>
        {showStar && (
          <button className="star" onClick={(e)=>{e.stopPropagation();onToggleWatch(fund.id);}}>
            <Star size={18} fill={watched?"#F5A623":"none"} color={watched?"#F5A623":"currentColor"} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------------- screens ---------------- */
function HomeScreen({ navs, holdings, sips, balVis, setBalVis, openFund, go, fundById, onOpenChat, toast }) {
  const portfolio = useMemo(() => calcPortfolio(holdings, navs), [holdings, navs]);
  const activeSips = sips.filter((s) => s.status === "Active");
  const topHoldings = useMemo(() => {
    return [...holdings]
      .map((h) => {
        const f = fundById(h.id);
        const q = navs[h.id];
        if (!f || !q) return null;
        const value = h.units * q.nav;
        const cost = h.units * h.avgNav;
        const pnl = value - cost;
        return { h, f, q, value, pnl, pnlPct: cost ? pnl / cost : 0 };
      })
      .filter(Boolean)
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
  }, [holdings, navs, fundById]);

  const nextSip = activeSips[0];
  const nextSipFund = nextSip ? fundById(nextSip.id) : null;
  const dayUp = portfolio.day >= 0;

  return (
    <div className="scroll" style={{ paddingTop: 12 }}>
      <button type="button" className="home-hero" onClick={() => go("portfolio")}>
        <svg className="waves" viewBox="0 0 440 56" preserveAspectRatio="none">
          <path d="M0,40 C60,20 120,50 200,28 S340,18 440,36 L440,56 L0,56 Z" fill="#fff"/>
        </svg>
        <div className="home-hero-top">
          <span className="home-hero-badge">
            <ShieldCheck size={12}/> Regular plans · AMFI-registered
          </span>
          <button
            type="button"
            className="home-hero-eye"
            onClick={(e) => { e.stopPropagation(); setBalVis((v) => !v); }}
            aria-label={balVis ? "Hide balance" : "Show balance"}
          >
            {balVis ? <Eye size={16}/> : <EyeOff size={16}/>}
          </button>
        </div>
        <div className="home-hero-lbl">Total portfolio value</div>
        <div className="home-hero-val num">{balVis ? inr0(portfolio.cur) : "₹ ••••••"}</div>
        <div className={`home-hero-delta ${dayUp ? "" : "neg"}`}>
          {dayUp ? <TrendingUp size={13}/> : <TrendingDown size={13}/>}
          {balVis
            ? `${signInr(portfolio.day)} (${signPct(portfolio.dayPct)}) Today`
            : "••• Today"}
        </div>
        <div className="home-hero-stats">
          <div className="st">
            <div className="k">Invested</div>
            <div className="v num">{balVis ? inr0(portfolio.inv) : "••••"}</div>
          </div>
          <div className="st">
            <div className="k">Total returns</div>
            <div className="v num">{balVis ? `${signInr(portfolio.ret)} (${signPct(portfolio.retPct)})` : "••••"}</div>
          </div>
          <div className="st">
            <div className="k">Active SIPs</div>
            <div className="v num">{activeSips.length}</div>
          </div>
        </div>
        <ChevronRight size={18} className="home-hero-chev"/>
      </button>

      <div className="home-qa">
        {[
          { t: "Discover funds", s: "Compare & shortlist", ic: <Search size={20}/>, bg: "#E8F0FF", fg: "#2456BE", action: () => go("discover") },
          { t: "Start SIP", s: "Invest regularly", ic: <Repeat size={20}/>, bg: "#E7F7F2", fg: "#0E9C8E", action: () => go("sips") },
          { t: "Portfolio", s: "Holdings & insights", ic: <PieChart size={20}/>, bg: "#F3EEFF", fg: "#7A5AF8", action: () => go("portfolio") },
          { t: "Fund Q&A", s: "Ask anything about MF", ic: <MessageCircle size={20}/>, bg: "#FFF3E0", fg: "#E8943A", action: onOpenChat },
        ].map((q) => (
          <button key={q.t} type="button" className="home-qa-btn" onClick={q.action}>
            <div className="ic" style={{ background: q.bg, color: q.fg }}>{q.ic}</div>
            <div className="t">{q.t}</div>
            <div className="s">{q.s}</div>
          </button>
        ))}
      </div>

      <div className="section" style={{ marginTop: 18 }}>
        <div className="sec-head">
          <h3>Smart alerts</h3>
          <button type="button" className="seeall" onClick={() => toast("Alerts center — coming soon")}>
            View all <ChevronRight size={14}/>
          </button>
        </div>
        <div className="alert-scroll">
          {nextSip && nextSipFund && (
            <button type="button" className="alert-card teal" onClick={() => go("sips")}>
              <div className="at">SIP debit · {nextSip.nextDebit ?? "Soon"}</div>
              <div className="ab">{inr0(nextSip.amount)} due for {nextSipFund.h}</div>
              <div className="as">HDFC Bank •••• 4521</div>
            </button>
          )}
          <button type="button" className="alert-card amber" onClick={() => go("more")}>
            <div className="at">KYC · Action required</div>
            <div className="ab">Complete address proof</div>
            <div className="as">Required before your first investment</div>
          </button>
        </div>
      </div>

      {topHoldings.length > 0 && (
        <div className="section">
          <div className="sec-head">
            <h3>Top holdings ({topHoldings.length} of your funds)</h3>
            <button type="button" className="seeall" onClick={() => go("portfolio")}>
              See all <ChevronRight size={14}/>
            </button>
          </div>
          <div className="home-holdings">
            {topHoldings.map(({ h, f, value, pnl, pnlPct }) => {
              const up = pnl >= 0;
              return (
                <div key={h.id} className="home-hrow" onClick={() => openFund(f)}>
                  <FundAvatar h={f.h}/>
                  <div className="meta">
                    <div className="nm">{f.s}</div>
                    <div className="sub">{fundCategorySubline(f)}</div>
                    <span className="reg-badge">Regular Plan</span>
                  </div>
                  <div style={{ textAlign: "right", flex: "none" }}>
                    <div className="price num" style={{ fontSize: 13.5 }}>{inr0(value)}</div>
                    <div className={`chg num ${up ? "up" : "down"}`} style={{ fontSize: 11 }}>
                      {signInr(pnl)} ({signPct(pnlPct)})
                    </div>
                  </div>
                  <ChevronRight size={16} color="var(--faint)"/>
                </div>
              );
            })}
            <div className="holdings-foot">
              All plans shown are Regular plans ·{" "}
              <button type="button" onClick={() => toast("Regular plans include distributor services under AMFI ARN. See Profile → How Nivya earns.")}>
                Why Regular?
              </button>
            </div>
          </div>
        </div>
      )}

      <button type="button" className="discover-teaser" onClick={() => go("discover", "rank")}>
        <div className="dt">
          <h4>Rank funds by your horizon</h4>
          <p>Compare funds based on 1Y, 3Y, 5Y, 10Y performance, risk &amp; consistency</p>
          <span className="seeall" style={{ marginTop: 8 }}>
            Explore Fund Insights <ChevronRight size={14}/>
          </span>
        </div>
        <div className="chart-ic"><BarChart3 size={26}/></div>
      </button>

      <HomeCollapsibleCompliance/>
    </div>
  );
}


function BottomNav({ tab, go }){
  const items = [
    { k:"home", t:"Home", I:Home },
    { k:"discover", t:"Explore", I:Compass },
    { k:"sips", t:"SIPs", I:Repeat },
    { k:"portfolio", t:"Portfolio", I:PieChart },
    { k:"more", t:"Profile", I:User },
  ];
  return (
    <div className="bottomnav">
      {items.map(({k,t,I})=>(
        <button key={k} className={"nav "+(tab===k?"on":"")} onClick={()=>go(k)}>
          <span className="nav-ic"><I size={21} strokeWidth={tab===k?2.4:1.75}/></span>
          <span className="nav-lbl">{t}</span>
        </button>
      ))}
    </div>
  );
}

/* ---------------- root ---------------- */
export default function App(){
  const [splash, setSplash] = useState(() => !sessionStorage.getItem("nivya_onboarded"));
  const [tab, setTab] = useState("home");
  const [discoverSegment, setDiscoverSegment] = useState("browse");
  const [balVis, setBalVis] = useState(true);
  const [homeChatOpen, setHomeChatOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [watchlistOpen, setWatchlistOpen] = useState(false);
  const [chatSeedFund, setChatSeedFund] = useState(null);
  const [funds, setFunds] = useState(FUNDS);
  const [apiConnected, setApiConnected] = useState(false);
  const [catalogLabel, setCatalogLabel] = useState("");
  const [holdings, setHoldings] = useState(INITIAL_HOLDINGS);
  const [watch, setWatch] = useState(INITIAL_WATCH);
  const [sips, setSips] = useState(INITIAL_SIPS);
  const [openFundObj, setOpenFundObj] = useState(null);
  const [order, setOrder] = useState(null); // { fund, mode }
  const [toastMsg, setToastMsg] = useState(null);
  const toastTimer = useRef(null);

  const [navs, setNavs] = useState(()=>{
    const n = {};
    FUNDS.forEach(f=>{ n[f.id] = { nav: f.nav, prevNav: f.nav * 0.998 }; });
    return n;
  });

  const fundById = useCallback((id) => funds.find((f) => f.id === id), [funds]);

  const finishOnboarding = useCallback(() => {
    sessionStorage.setItem("nivya_onboarded", "1");
    setSplash(false);
  }, []);

  useEffect(()=>{
    let cancelled = false;
    (async ()=>{
      try {
        const data = await bootstrapDemoSession();
        if (cancelled) return;
        setFunds(data.schemes.map(mapScheme));
        setNavs(navsFromSchemes(data.schemes));
        setHoldings(data.portfolio.holdings.map(mapHolding));
        setSips(data.sips.map(mapSip));
        setCatalogLabel(
          data.catalogDataSource === "mfapi-snapshot"
            ? `MFapi · ${data.catalogTotal ?? data.schemes.length} funds`
            : `Live API · ${data.catalogTotal ?? data.schemes.length} funds`
        );
        setApiConnected(true);
      } catch (err) {
        console.warn("BFF unavailable — using local demo data", err);
      }
    })();
    return ()=>{ cancelled = true; };
  }, []);

  useEffect(()=>{
    if (!apiConnected) return;
    const id = setInterval(async ()=>{
      try {
        const { items, dataSource, total } = await fetchSchemes();
        setFunds(items.map(mapScheme));
        setNavs(navsFromSchemes(items));
        if (dataSource === "mfapi-snapshot") {
          setCatalogLabel(`MFapi · ${total ?? items.length} funds`);
        }
      } catch (_) { /* keep last good snapshot */ }
    }, 5000);
    return ()=>clearInterval(id);
  }, [apiConnected]);

  useEffect(()=>{
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700;800&display=swap";
    document.head.appendChild(l);
    return ()=>{ try{ document.head.removeChild(l); }catch(e){} };
  }, []);

  // simulated NAV drift when BFF is offline
  useEffect(()=>{
    if (apiConnected) return;
    const id = setInterval(()=>{
      setNavs(prev=>{
        const next = { ...prev };
        for(const k in next){
          const item = next[k];
          const drift = (Math.random()-0.5)*0.0008;
          const nn = Math.max(item.prevNav*0.95, Math.min(item.prevNav*1.05, item.nav*(1+drift)));
          next[k] = { ...item, nav: nn };
        }
        return next;
      });
    }, 4000);
    return ()=>clearInterval(id);
  }, [apiConnected]);

  const toast = (m)=>{
    setToastMsg(m);
    if(toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(()=>setToastMsg(null), 2400);
  };

  const applyLocalOrder = (mode, { amount, units, sipDay })=>{
    const fund = order.fund;
    if(mode==="LUMPSUM"){
      setHoldings(prev=>{
        const idx = prev.findIndex(h=>h.id===fund.id);
        if(idx<0) return [...prev, { id:fund.id, units, avgNav:navs[fund.id].nav, folio:"NEW/FOLIO" }];
        const h = prev[idx]; const nu = h.units + units;
        const navg = (h.units*h.avgNav + units*navs[fund.id].nav)/nu;
        const cp = [...prev]; cp[idx] = { ...h, units:nu, avgNav:navg }; return cp;
      });
      toast(`Lumpsum order placed · ${inr(amount)} in ${fund.h}`);
    } else if(mode==="SIP"){
      setSips(prev=>[...prev, { id:fund.id, amount, day:sipDay, status:"Active", nextDebit:`${sipDay} Jul` }]);
      toast(`SIP registered · ${inr0(amount)}/mo on ${sipDay}th`);
    } else if(mode==="REDEEM"){
      setHoldings(prev=>{
        const idx = prev.findIndex(h=>h.id===fund.id);
        if(idx<0) return prev;
        const h = prev[idx]; const nu = h.units - units;
        if(nu<=0.001) return prev.filter(x=>x.id!==fund.id);
        const cp = [...prev]; cp[idx] = { ...h, units:nu }; return cp;
      });
      toast(`Redeem order placed · ${units.toFixed(2)} units of ${fund.h}`);
    }
  };

  const confirmOrder = async (mode, { amount, units, sipDay })=>{
    const fund = order.fund;
    if (apiConnected) {
      try {
        if (mode === "LUMPSUM" || mode === "REDEEM") {
          await recordConsent(fund.id);
          await submitOrder({
            type: mode === "LUMPSUM" ? "purchase" : "redeem",
            schemeCode: fund.id,
            amount: mode === "LUMPSUM" ? amount : undefined,
            units: mode === "REDEEM" ? units : undefined,
          });
          applyLocalOrder(mode, { amount, units, sipDay });
        } else if (mode === "SIP") {
          await recordConsent(fund.id);
          const sip = await submitSip({ schemeCode: fund.id, amount, debitDay: sipDay });
          setSips((prev) => [...prev, mapSip(sip)]);
          toast(`SIP registered · ${inr0(amount)}/mo on ${sipDay}th`);
        }
      } catch (err) {
        console.warn("Order API failed — falling back to local demo", err);
        applyLocalOrder(mode, { amount, units, sipDay });
      }
    } else {
      applyLocalOrder(mode, { amount, units, sipDay });
    }
    setOrder(null);
  };

  const toggleWatch = (id)=> setWatch(w=> w.includes(id) ? w.filter(x=>x!==id) : [id,...w]);
  const go = (t, segment) => {
    setOpenFundObj(null);
    setNotificationsOpen(false);
    setWatchlistOpen(false);
    if (t === "discover") setDiscoverSegment(segment ?? "browse");
    // Invest tab removed — Explore Rank is the single discovery/ranking path
    setTab(t === "invest" ? "discover" : t);
  };
  const openFund = (f)=> setOpenFundObj(f);

  const curHolding = openFundObj ? holdings.find(h=>h.id===openFundObj.id) : null;
  const titles = {
    home: "",
    discover: "Explore",
    portfolio: "Portfolio",
    sips: "SIPs",
    more: "Profile",
  };

  return (
    <div className="nv-root">
      <style>{CSS}</style>
      <div className="stage">
        <div className="phone">
          <div className="statusbar">
            <span>9:41</span>
            <div className="dots">
              <span className="sigbar"><i style={{height:4}}/><i style={{height:6}}/><i style={{height:8}}/><i style={{height:11}}/></span>
              <span style={{fontSize:11,fontWeight:700}}>5G</span>
              <span className="batt"><i/></span>
            </div>
          </div>

          <div className="appbar">
            <div className="brand">
              <NivyaMark size={28}/>
              <div>
                {tab==="home"
                  ? <span className="wm">Niv<b>ya</b></span>
                  : <span className="wm" style={{fontSize:18}}>{titles[tab]}</span>}
                {tab==="home" && (
                  <div className="arn-badge">
                    AMFI-registered Mutual Fund Distributor
                    <span className="line2">{NIVYA_ARN} · {NIVYA_EUIN}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="appbar-actions">
              <button
                type="button"
                className={"iconbtn wl-appbar-btn"+(watchlistOpen?" on":"")}
                aria-label="Watchlist"
                onClick={() => { setNotificationsOpen(false); setWatchlistOpen(true); }}
              >
                <Star size={19} fill={watch.length ? "#F5A623" : "none"} color={watch.length ? "#F5A623" : "currentColor"}/>
                {watch.length > 0 && <span className="wl-appbar-count">{watch.length > 9 ? "9+" : watch.length}</span>}
              </button>
              <button type="button" className="iconbtn" aria-label="Notifications" onClick={() => { setWatchlistOpen(false); setNotificationsOpen(true); }}>
                <Bell size={19}/><span className="dot dot-teal"/>
              </button>
            </div>
          </div>

          {tab==="home" && <HomeScreen navs={navs} holdings={holdings} sips={sips}
            balVis={balVis} setBalVis={setBalVis} openFund={openFund} go={go} fundById={fundById}
            onOpenChat={() => setHomeChatOpen(true)} toast={toast} />}
          {tab==="discover" && (
            <DiscoverScreen
              funds={funds}
              watch={watch}
              openFund={openFund}
              toggleWatch={toggleWatch}
              setOrder={setOrder}
              toast={toast}
              initialSegment={discoverSegment}
            />
          )}
          {tab==="portfolio" && (
            <PortfolioScreen
              navs={navs}
              holdings={holdings}
              sips={sips}
              openFund={openFund}
              fundById={fundById}
              toast={toast}
            />
          )}
          {tab==="sips" && (
            <SipsScreen
              sips={sips}
              setSips={setSips}
              holdings={holdings}
              fundById={fundById}
              go={go}
              toast={toast}
            />
          )}
          {tab==="more" && (
            <ProfileScreen go={go} toast={toast} arn={NIVYA_ARN} euin={NIVYA_EUIN} onOpenNotifications={() => setNotificationsOpen(true)} />
          )}

          <BottomNav tab={tab} go={go} />

          {homeChatOpen && (
            <FundChatPanel
              key={chatSeedFund?.id ?? "home"}
              initialFund={chatSeedFund}
              onClose={() => { setHomeChatOpen(false); setChatSeedFund(null); }}
            />
          )}

          {notificationsOpen && (
            <NotificationsScreen
              onBack={() => setNotificationsOpen(false)}
              go={go}
              toast={toast}
            />
          )}

          {watchlistOpen && (
            <WatchlistScreen
              watch={watch}
              funds={funds}
              navs={navs}
              onBack={() => setWatchlistOpen(false)}
              openFund={(f) => { setWatchlistOpen(false); openFund(f); }}
              toggleWatch={toggleWatch}
              go={go}
            />
          )}

          {openFundObj && (
            <FundDetailScreen
              fund={openFundObj}
              navs={navs}
              holding={curHolding}
              watched={watch.includes(openFundObj.id)}
              onBack={() => setOpenFundObj(null)}
              onToggleWatch={toggleWatch}
              onOrder={(mode) => setOrder({ fund: openFundObj, mode })}
              go={go}
              toast={toast}
              arn={NIVYA_ARN}
              onOpenChat={() => { setChatSeedFund(openFundObj); setHomeChatOpen(true); }}
            />
          )}

          {order && (
            <OrderSheet
              fund={order.fund}
              navs={navs}
              mode={order.mode}
              holding={curHolding}
              onClose={() => setOrder(null)}
              onConfirm={confirmOrder}
              arn={NIVYA_ARN}
              euin={NIVYA_EUIN}
              go={go}
              toast={toast}
            />
          )}

          {toastMsg && (
            <div className="toast">
              <span className="tick"><BadgeCheck size={14} color="#fff"/></span>
              {toastMsg}
            </div>
          )}

          {splash && (
            <OnboardingFlow arn={NIVYA_ARN} euin={NIVYA_EUIN} onComplete={finishOnboarding} />
          )}
        </div>
      </div>
    </div>
  );
}
