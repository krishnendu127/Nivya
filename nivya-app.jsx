import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Home, Layers, Briefcase, User, Search, Bell, Eye, EyeOff,
  ChevronRight, ArrowLeft, TrendingUp, TrendingDown, Star, Plus, Minus, X,
  Wallet, ShieldCheck, Settings, HelpCircle, FileText, LogOut,
  BadgeCheck, Repeat, Calendar, PiggyBank,
} from "lucide-react";

/* ============================================================
   Nivya — MF-only investing app (Corporate MFD model, demo)
   Hybrid-ready prototype: custom UX, mock NAV + orders
   ============================================================ */

const NIVYA_ARN = "ARN-XXXXXX"; // Replace with real ARN after AMFI registration

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
.arn-badge{font-size:9px;font-weight:700;color:var(--muted);margin-top:1px;line-height:1.2;}
.iconbtn{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;border:none;background:var(--soft);color:var(--ink);cursor:pointer;position:relative;}
.iconbtn:active{transform:scale(.94);}
.dot{position:absolute;top:8px;right:9px;width:7px;height:7px;background:var(--down);border-radius:50%;border:2px solid var(--surface);}
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
.bottomnav{position:absolute;left:0;right:0;bottom:0;background:rgba(255,255,255,.96);
  backdrop-filter:blur(12px);border-top:1px solid var(--line);display:flex;padding:7px 6px 9px;z-index:30;}
.nav{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;border:none;background:none;
  cursor:pointer;padding:5px 0;color:var(--faint);font-family:var(--font);}
.nav span{font-size:10.5px;font-weight:600;}
.nav.on{color:var(--brand-ink);}
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
@keyframes pop{from{transform:scale(.8);opacity:0;}to{transform:scale(1);opacity:1;}}
.tipbar{font-size:11px;color:var(--muted);text-align:center;margin-top:14px;font-weight:600;}
.compliance-strip{background:#EAF7F3;border:1px solid #CDEDE3;border-radius:12px;padding:10px 12px;font-size:11px;
  font-weight:600;color:var(--brand-ink);line-height:1.45;margin-bottom:14px;}
.sip-card{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:14px;box-shadow:var(--shadow);}
.sip-card + .sip-card{margin-top:10px;}
.sip-status{font-size:10px;font-weight:800;padding:3px 8px;border-radius:999px;text-transform:uppercase;}
.sip-status.active{background:var(--up-bg);color:var(--up);}
.sip-status.paused{background:var(--soft);color:var(--muted);}
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

const CATEGORY_PERF = [
  { cat:"Large Cap", r1:18.2 },
  { cat:"Flexi Cap", r1:24.6 },
  { cat:"Small Cap", r1:32.1 },
  { cat:"Hybrid", r1:16.4 },
  { cat:"ELSS", r1:19.8 },
];

const INITIAL_HOLDINGS = [
  { id:"ppfas-fc", units:245.32, avgNav:72.50, folio:"12345678/91" },
  { id:"nippon-sc", units:88.10, avgNav:155.20, folio:"87654321/42" },
  { id:"hdfc-ba", units:42.00, avgNav:468.00, folio:"11223344/55" },
  { id:"axis-lc", units:120.50, avgNav:52.10, folio:"99887766/33" },
];

const INITIAL_WATCH = ["quant-sc", "mirae-lc", "sbi-contra", "icici-tech", "hdfc-elss"];

const INITIAL_SIPS = [
  { id:"ppfas-fc", amount:5000, day:5, status:"Active", nextDebit:"5 Jul" },
  { id:"nippon-sc", amount:3000, day:10, status:"Active", nextDebit:"10 Jul" },
  { id:"hdfc-ba", amount:2000, day:1, status:"Paused", nextDebit:"—" },
];

const fundById = (id) => FUNDS.find((f) => f.id === id);

const AV_COLORS = ["#2456BE","#0E9C8E","#7A5AF8","#E8943A","#D6409F","#16A35A","#0E7C86","#475467","#DC6803","#3E63DD"];

/* ---------------- helpers ---------------- */
const nf2 = new Intl.NumberFormat("en-IN", { minimumFractionDigits:2, maximumFractionDigits:2 });
const nf0 = new Intl.NumberFormat("en-IN", { maximumFractionDigits:0 });
const inr = (n) => "₹" + nf2.format(n);
const inr0 = (n) => "₹" + nf0.format(Math.round(n));
const signPct = (c) => (c >= 0 ? "+" : "") + (c * 100).toFixed(2) + "%";
const signInr = (n) => (n >= 0 ? "+" : "−") + "₹" + nf2.format(Math.abs(n));

function hashStr(s){ let h=2166136261; for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);} return (h>>>0); }
function mulberry32(a){ return function(){ a|=0;a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const avColor = (s) => AV_COLORS[hashStr(s) % AV_COLORS.length];

function genSeries(sym, tf, price, prevNav){
  const conf = { "1W":{n:34,vol:0.014,rmin:-0.04,rmax:0.06}, "1M":{n:30,vol:0.03,rmin:-0.07,rmax:0.12},
                 "1Y":{n:52,vol:0.05,rmin:-0.12,rmax:0.34}, "3Y":{n:36,vol:0.08,rmin:-0.05,rmax:0.45} }[tf];
  const rng = mulberry32(hashStr(sym + tf));
  const start = price * (1 - (conf.rmin + rng()*(conf.rmax-conf.rmin)));
  const w = [0];
  for(let i=1;i<conf.n;i++) w.push(w[i-1] + (rng()-0.5));
  const last = w[conf.n-1];
  let maxAbs = 0;
  for(let i=0;i<conf.n;i++){ w[i] = w[i] - last*(i/(conf.n-1)); maxAbs = Math.max(maxAbs, Math.abs(w[i])); }
  maxAbs = maxAbs || 1;
  const amp = price * conf.vol;
  const out = [];
  for(let i=0;i<conf.n;i++){
    const t = i/(conf.n-1);
    const base = start + (price - start)*t;
    out.push({ t:i, v: Math.max(base + (w[i]/maxAbs)*amp, price*0.4) });
  }
  out[conf.n-1].v = price;
  return out;
}

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
  const g = "nvgrad-" + size;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-label="Nivya">
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#19C9AE" />
          <stop offset="1" stopColor="#2456BE" />
        </linearGradient>
      </defs>
      <polygon points="40,14 49,14 26,86 13,86" fill="#16213E" />
      <polygon points="52,14 63,28 56,86 43,86" fill={`url(#${g})`} />
      <polygon points="64,42 74,42 83,86 67,86" fill="#16213E" />
    </svg>
  );
}

function FundAvatar({ h }){
  return <div className="av" style={{ background: avColor(h) }}>{h.slice(0,2).toUpperCase()}</div>;
}

function ChartTip({ active, payload }){
  if(!active || !payload || !payload.length) return null;
  return <div style={{background:"var(--navy)",color:"#fff",padding:"5px 10px",borderRadius:8,fontSize:12,
    fontWeight:700,fontFamily:"var(--mono)"}}>{inr(payload[0].value)}</div>;
}

function NavChart({ sym, tf, nav, prevNav, up }){
  const data = useMemo(()=>genSeries(sym, tf, nav, prevNav), [sym, tf, nav, prevNav]);
  const ys = data.map(d=>d.v);
  const min = Math.min(...ys), max = Math.max(...ys);
  const pad = (max-min)*0.12 || 1;
  const color = up ? "var(--up)" : "var(--down)";
  const id = `g-${sym}-${tf}`;
  return (
    <div style={{height:210, width:"100%", margin:"6px -6px 0"}}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{top:8,right:8,left:8,bottom:0}}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={[min-pad, max+pad]} />
          <XAxis dataKey="t" hide />
          <Tooltip content={<ChartTip />} cursor={{stroke:"var(--faint)",strokeOpacity:0.4,strokeWidth:1}} />
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2.2} fill={`url(#${id})`}
            dot={false} isAnimationActive animationDuration={450} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
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
function HomeScreen({ navs, holdings, watch, sips, balVis, setBalVis, openFund, go, toggleWatch }){
  const portfolio = useMemo(()=>calcPortfolio(holdings, navs), [holdings, navs]);
  const popular = ["quant-sc","mirae-lc","hdfc-elss","sbi-contra","nippon-sc"].map(fundById);
  const dispHold = holdings.slice(0,3);
  const activeSips = sips.filter(s=>s.status==="Active").length;

  return (
    <div className="scroll">
      <ComplianceStrip />
      <div className="wealth">
        <svg className="peaks" viewBox="0 0 440 70" preserveAspectRatio="none">
          <polygon points="0,70 70,26 120,52 200,10 260,44 330,18 400,50 440,30 440,70" fill="#fff"/>
        </svg>
        <div className="lbl">
          <Wallet size={15} /> MF portfolio value
          <button className="eye" onClick={()=>setBalVis(v=>!v)}>
            {balVis ? <Eye size={15}/> : <EyeOff size={15}/>}
          </button>
        </div>
        <div className="val num">{balVis ? inr(portfolio.cur) : "₹ ••••••"}</div>
        <div className="sub">
          <span className={"delta " + (portfolio.day>=0?"pos":"neg")}>
            {portfolio.day>=0 ? <TrendingUp size={13}/> : <TrendingDown size={13}/>}
            {balVis ? `${signInr(portfolio.day)} (${signPct(portfolio.dayPct)})` : "•••"}
          </span>
          <span style={{opacity:.85,fontSize:12}}>1D change</span>
        </div>
        <div className="stats">
          <div className="st"><div className="k">Invested</div><div className="v num">{balVis?inr0(portfolio.inv):"••••"}</div></div>
          <div className="st"><div className="k">Total returns</div><div className="v num">{balVis?signInr(portfolio.ret):"••••"}</div></div>
          <div className="st"><div className="k">Active SIPs</div><div className="v num">{activeSips}</div></div>
        </div>
      </div>

      <div className="quick">
        {[
          { t:"Explore", ic:<Search size={19}/>, bg:"#E8F0FF", fg:"#2456BE", go:()=>go("explore") },
          { t:"Start SIP", ic:<Repeat size={19}/>, bg:"#E7F7F2", fg:"#0E9C8E", go:()=>go("explore") },
          { t:"Portfolio", ic:<Briefcase size={19}/>, bg:"#F3EEFF", fg:"#7A5AF8", go:()=>go("portfolio") },
          { t:"My SIPs", ic:<Calendar size={19}/>, bg:"#FFF3E0", fg:"#E8943A", go:()=>go("sips") },
        ].map(q=>(
          <button className="qa" key={q.t} onClick={q.go}>
            <div className="ic" style={{background:q.bg,color:q.fg}}>{q.ic}</div>
            <div className="t">{q.t}</div>
          </button>
        ))}
      </div>

      <div className="section">
        <div className="sec-head"><h3>Category returns (1Y)</h3></div>
        <div className="strip">
          {CATEGORY_PERF.map(c=>(
            <div className="idx" key={c.cat}>
              <div className="nm">{c.cat}</div>
              <div className="pr num up">{c.r1}%</div>
              <div className="ch num" style={{color:"var(--muted)"}}>annualised</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="sec-head"><h3>Your holdings</h3>
          <button className="seeall" onClick={()=>go("portfolio")}>See all <ChevronRight size={14}/></button></div>
        <div className="list">
          {dispHold.map(h=>{
            const f = fundById(h.id); const q = navs[h.id];
            const pnl = h.units * (q.nav - h.avgNav); const up = pnl >= 0;
            return (
              <div className="row" key={h.id} onClick={()=>openFund(f)}>
                <FundAvatar h={f.h}/>
                <div className="meta">
                  <div className="nm">{f.s}</div>
                  <div className="sub"><span>{h.units.toFixed(2)} units</span><span>·</span><span>Avg NAV {inr(h.avgNav)}</span></div>
                </div>
                <div className="right"><div>
                  <div className="price num">{inr0(h.units * q.nav)}</div>
                  <div className={"chg num " + (up?"up":"down")}>{signInr(pnl)} ({signPct(pnl/(h.units*h.avgNav))})</div>
                </div></div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="section">
        <div className="sec-head"><h3>Watchlist</h3>
          <button className="seeall" onClick={()=>go("explore")}>Manage <ChevronRight size={14}/></button></div>
        <div className="list">
          {watch.map(id=>{
            const f = fundById(id);
            return <FundRow key={id} fund={f} navs={navs} onOpen={openFund}
              watched onToggleWatch={toggleWatch} showStar />;
          })}
        </div>
      </div>

      <div className="section">
        <div className="sec-head"><h3>Popular funds</h3>
          <button className="seeall" onClick={()=>go("explore")}>Explore <ChevronRight size={14}/></button></div>
        <div className="list">
          {popular.map(f=>(
            <FundRow key={f.id} fund={f} navs={navs} onOpen={openFund} showReturn />
          ))}
        </div>
      </div>

      <div className="tipbar">Demo NAV data · hybrid platform will connect to BSE/NSE MF rails</div>
    </div>
  );
}

function Explore({ navs, watch, openFund, toggleWatch }){
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const cats = ["All","High return","Large Cap","Small Cap","Hybrid","ELSS","Tax saving"];
  const list = useMemo(()=>{
    let arr = [...FUNDS];
    if(q.trim()){
      const k = q.toLowerCase();
      arr = arr.filter(f=> f.s.toLowerCase().includes(k) || f.h.toLowerCase().includes(k) || f.cat.toLowerCase().includes(k));
    }
    if(cat==="High return") arr = arr.filter(f=>f.r3>=25);
    else if(cat==="Tax saving" || cat==="ELSS") arr = arr.filter(f=>f.cat==="ELSS");
    else if(cat!=="All") arr = arr.filter(f=>f.cat===cat);
    return arr.sort((a,b)=>b.r3-a.r3);
  }, [cat, q]);

  return (
    <div className="scroll">
      <ComplianceStrip />
      <div className="searchbar" style={{marginBottom:14}}>
        <Search size={18} color="var(--faint)"/>
        <input placeholder="Search mutual funds" value={q} onChange={e=>setQ(e.target.value)} />
        {q && <X size={18} color="var(--faint)" onClick={()=>setQ("")} style={{cursor:"pointer"}}/>}
      </div>
      <div className="chips" style={{marginBottom:14}}>
        {cats.map(c=>(
          <button key={c} className={"chip "+(cat===c?"on":"")} onClick={()=>setCat(c)}>{c}</button>
        ))}
      </div>
      {list.length===0 ? (
        <div style={{textAlign:"center",padding:"50px 20px",color:"var(--muted)"}}>
          <Search size={32} color="var(--faint)"/>
          <p style={{fontWeight:600,marginTop:10}}>No funds match “{q}”.</p>
        </div>
      ) : (
        <div className="list">
          {list.map(f=>(
            <FundRow key={f.id} fund={f} navs={navs} onOpen={openFund}
              watched={watch.includes(f.id)} onToggleWatch={toggleWatch} showStar showReturn />
          ))}
        </div>
      )}
    </div>
  );
}

function Portfolio({ navs, holdings, openFund }){
  const data = useMemo(()=>{
    const pf = calcPortfolio(holdings, navs);
    const rows = holdings.map(h=>{
      const f = fundById(h.id); const q = navs[h.id];
      const value = h.units * q.nav; const cost = h.units * h.avgNav;
      return { h, f, q, value, cost, pnl: value - cost };
    }).sort((a,b)=>b.value-a.value);
    return { ...pf, rows };
  }, [holdings, navs]);

  const total = data.cur || 1;

  return (
    <div className="scroll">
      <div className="wealth" style={{marginBottom:4}}>
        <div className="lbl"><Briefcase size={15}/> MF portfolio</div>
        <div className="val num">{inr(data.cur)}</div>
        <div className="sub">
          <span className={"delta " + (data.ret>=0?"pos":"neg")}>
            {data.ret>=0?<TrendingUp size={13}/>:<TrendingDown size={13}/>}
            {signInr(data.ret)} ({signPct(data.retPct)})
          </span>
          <span style={{opacity:.85,fontSize:12}}>Total returns</span>
        </div>
        <div className="stats">
          <div className="st"><div className="k">Invested</div><div className="v num">{inr0(data.inv)}</div></div>
          <div className="st"><div className="k">1D change</div><div className="v num">{signInr(data.day)}</div></div>
          <div className="st"><div className="k">Schemes</div><div className="v num">{holdings.length}</div></div>
        </div>
      </div>

      <div className="section" style={{marginTop:6}}>
        <div className="sec-head"><h3>Portfolio trend</h3><span style={{fontSize:12,fontWeight:700,color:"var(--muted)"}}>1Y</span></div>
        <NavChart sym="PORTFOLIO" tf="1Y" nav={data.cur} prevNav={data.inv} up={data.ret>=0} />
      </div>

      <div className="section" style={{marginTop:18}}>
        <div className="sec-head"><h3>Allocation</h3></div>
        <div className="alloc">
          {data.rows.map(r=>(
            <i key={r.h.id} style={{width:`${(r.value/total)*100}%`,background:avColor(r.f.h)}}/>
          ))}
        </div>
        <div className="legend">
          {data.rows.map(r=>(
            <div className="lg" key={r.h.id}>
              <span className="sw" style={{background:avColor(r.f.h)}}/>
              {r.f.h} · {((r.value/total)*100).toFixed(0)}%
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="sec-head"><h3>Holdings · {holdings.length}</h3></div>
        <div className="list">
          {data.rows.map(({h,f,q,value,pnl})=>{
            const up = pnl>=0;
            return (
              <div className="row" key={h.id} onClick={()=>openFund(f)}>
                <FundAvatar h={f.h}/>
                <div className="meta">
                  <div className="nm">{f.s}</div>
                  <div className="sub"><span>{h.units.toFixed(2)} units</span><span>·</span><span>NAV {inr(q.nav)}</span></div>
                </div>
                <div className="right"><div>
                  <div className="price num">{inr0(value)}</div>
                  <div className={"chg num "+(up?"up":"down")}>{signInr(pnl)} ({signPct(pnl/(h.units*h.avgNav))})</div>
                </div></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SipsScreen({ sips, openFund }){
  const totalMonthly = sips.filter(s=>s.status==="Active").reduce((a,s)=>a+s.amount,0);
  return (
    <div className="scroll">
      <ComplianceStrip />
      <div className="wealth" style={{marginBottom:16}}>
        <div className="lbl"><Repeat size={15}/> SIP book</div>
        <div className="val num">{inr0(totalMonthly)}</div>
        <div className="sub"><span style={{opacity:.85,fontSize:12}}>Monthly SIP commitment</span></div>
      </div>
      {sips.map(s=>{
        const f = fundById(s.id);
        return (
          <div className="sip-card" key={s.id+s.day} onClick={()=>openFund(f)} style={{cursor:"pointer"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
              <div style={{display:"flex",gap:12,alignItems:"center",flex:1,minWidth:0}}>
                <FundAvatar h={f.h}/>
                <div style={{minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{f.s}</div>
                  <div style={{fontSize:12,color:"var(--muted)",fontWeight:600,marginTop:2}}>
                    {inr0(s.amount)}/mo · {s.day}{s.day===1?"st":s.day===2?"nd":s.day===3?"rd":"th"} of month
                  </div>
                </div>
              </div>
              <span className={"sip-status "+s.status.toLowerCase()}>{s.status}</span>
            </div>
            <div style={{marginTop:10,fontSize:12,color:"var(--muted)",fontWeight:600}}>
              Next debit: {s.nextDebit}
            </div>
          </div>
        );
      })}
      <div className="tipbar">Production: SIPs sync from BSE StAR MF / NSE MF Invest via hybrid rails</div>
    </div>
  );
}

function Profile({ holdings, navs, toast }){
  const pf = useMemo(()=>calcPortfolio(holdings, navs), [holdings, navs]);
  return (
    <div className="scroll">
      <div className="pcard">
        <div className="ring">S</div>
        <div style={{flex:1}}>
          <div className="nm">Shambhu</div>
          <div className="em">shambhu@nivya.app</div>
          <div className="kyc"><BadgeCheck size={13}/> KYC verified</div>
        </div>
      </div>

      <div className="section" style={{marginTop:16}}>
        <div className="list" style={{display:"grid",gridTemplateColumns:"1fr 1fr"}}>
          <div style={{padding:"15px 16px",borderRight:"1px solid var(--line2)"}}>
            <div style={{fontSize:11.5,color:"var(--muted)",fontWeight:600}}>Total invested</div>
            <div className="num" style={{fontSize:17,fontWeight:800,marginTop:4}}>{inr0(pf.inv)}</div>
          </div>
          <div style={{padding:"15px 16px"}}>
            <div style={{fontSize:11.5,color:"var(--muted)",fontWeight:600}}>Current value</div>
            <div className="num" style={{fontSize:17,fontWeight:800,marginTop:4}}>{inr0(pf.cur)}</div>
          </div>
        </div>
      </div>

      <div className="menu">
        {[
          { i:<User size={18}/>, t:"Account & profile" },
          { i:<PiggyBank size={18}/>, t:"Bank & mandate details" },
          { i:<FileText size={18}/>, t:"Statements & CAS" },
          { i:<ShieldCheck size={18}/>, t:"Security & privacy" },
          { i:<Settings size={18}/>, t:"App settings" },
          { i:<HelpCircle size={18}/>, t:"Help & support" },
        ].map(m=>(
          <div className="mrow" key={m.t} onClick={()=>toast(`${m.t} — coming in production`)}>
            <div className="mi">{m.i}</div>
            <div className="mt">{m.t}</div>
            <ChevronRight size={18} color="var(--faint)"/>
          </div>
        ))}
        <div className="mrow" onClick={()=>toast("Logged out — demo")}>
          <div className="mi" style={{color:"var(--down)"}}><LogOut size={18}/></div>
          <div className="mt" style={{color:"var(--down)"}}>Log out</div>
        </div>
      </div>

      <div className="disclaimer">
        <NivyaMark size={22}/><br/>
        <b>Nivya</b> · AMFI-registered Mutual Fund Distributor<br/>
        {NIVYA_ARN} · Demo build v2.0 (MF-only)<br/>
        This is a design prototype. Not a live distributor until ARN, AMC empanelment, and exchange rails are active.
      </div>
    </div>
  );
}

function FundDetail({ fund, navs, holding, watched, onBack, onToggleWatch, onOrder }){
  const [tf, setTf] = useState("1Y");
  const q = navs[fund.id];
  const chg = q.nav / q.prevNav - 1;
  const up = chg >= 0;

  return (
    <div className="overlay">
      <div className="dbar">
        <button className="back" onClick={onBack}><ArrowLeft size={20}/></button>
        <div className="ttl">
          <div className="a">{fund.s}</div>
          <div className="b">{fund.cat} · {fund.risk} risk · Regular plan</div>
        </div>
        <button className="star" onClick={()=>onToggleWatch(fund.id)}>
          <Star size={22} fill={watched?"#F5A623":"none"} color={watched?"#F5A623":"var(--faint)"}/>
        </button>
      </div>
      <div className="dscroll">
        <div className="ltp">
          <div>
            <div style={{fontSize:11.5,color:"var(--muted)",fontWeight:600}}>NAV</div>
            <div className="big num">{inr(q.nav)}</div>
            <div className={"ch num "+(up?"up":"down")}>{signPct(chg)} (1D)</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:11.5,color:"var(--muted)",fontWeight:600}}>3Y CAGR</div>
            <div className="num up" style={{fontWeight:800,fontSize:20}}>{fund.r3}%</div>
          </div>
        </div>
        <NavChart sym={fund.id} tf={tf} nav={q.nav} prevNav={q.prevNav} up={up} />
        <div className="tf">
          {["1W","1M","1Y","3Y"].map(k=>(
            <button key={k} className={tf===k?"on":""} onClick={()=>setTf(k)}>{k}</button>
          ))}
        </div>
        {holding && (
          <div className="hold-note" style={{marginTop:16}}>
            <div className="l">{holding.units.toFixed(2)} units · Folio {holding.folio}</div>
            <div className="r num">{inr0(holding.units * q.nav)}</div>
          </div>
        )}
        <div className="section" style={{marginTop:18}}>
          <div className="sec-head"><h3>Fund details</h3></div>
          <div className="statgrid">
            <div className="cell"><div className="k">1Y return</div><div className="v num up">{fund.r1}%</div></div>
            <div className="cell"><div className="k">3Y CAGR</div><div className="v num up">{fund.r3}%</div></div>
            <div className="cell"><div className="k">5Y CAGR</div><div className="v num up">{fund.r5}%</div></div>
            <div className="cell"><div className="k">Expense ratio</div><div className="v num">{fund.expense}%</div></div>
            <div className="cell"><div className="k">Min SIP</div><div className="v num">{inr0(fund.minSip)}</div></div>
            <div className="cell"><div className="k">Plan</div><div className="v">Regular</div></div>
          </div>
        </div>
        <div className="section">
          <div className="about">
            <p>Past performance does not guarantee future results. Read the Scheme Information Document (SID) and Key Information Memorandum (KIM) before investing. Nivya distributes Regular plans only under ARN {NIVYA_ARN}.</p>
          </div>
        </div>
      </div>
      <div className="tradebar">
        {holding && <button className="btn btn-sell" onClick={()=>onOrder("REDEEM")}>Redeem</button>}
        <button className="btn btn-buy" onClick={()=>onOrder("LUMPSUM")}>Invest</button>
        <button className="btn btn-grad" onClick={()=>onOrder("SIP")}>Start SIP</button>
      </div>
    </div>
  );
}

function MFOrderSheet({ fund, navs, mode, holding, onClose, onConfirm }){
  const q = navs[fund.id];
  const isSip = mode === "SIP";
  const isRedeem = mode === "REDEEM";
  const [amount, setAmount] = useState(isSip ? fund.minSip : 5000);
  const [sipDay, setSipDay] = useState(5);
  const [redeemUnits, setRedeemUnits] = useState(holding ? Math.min(holding.units, 10).toFixed(2) : "0");
  const maxRedeem = holding ? holding.units : 0;
  const units = isRedeem ? parseFloat(redeemUnits) || 0 : amount / q.nav;
  const total = isRedeem ? units * q.nav : amount;
  const err = isRedeem && units > maxRedeem ? `Max ${maxRedeem.toFixed(2)} units available` :
              !isRedeem && amount < fund.minSip ? `Minimum ${inr0(fund.minSip)} required` : "";

  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" onClick={e=>e.stopPropagation()}>
        <div className="grab"/>
        <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:14}}>
          <FundAvatar h={fund.h}/>
          <div style={{flex:1}}>
            <h4>{isRedeem ? "Redeem" : isSip ? "Start SIP" : "Lumpsum invest"}</h4>
            <div className="ltp-line">{fund.s} · NAV {inr(q.nav)}</div>
          </div>
          <button className="iconbtn" onClick={onClose}><X size={18}/></button>
        </div>

        {isRedeem ? (
          <>
            <div className="fieldlbl">Units to redeem</div>
            <div className="stepper">
              <button onClick={()=>setRedeemUnits(u=>Math.max(0,(parseFloat(u)||0)-1).toFixed(2))}><Minus size={18}/></button>
              <input className="num" value={redeemUnits} onChange={e=>setRedeemUnits(e.target.value.replace(/[^0-9.]/g,""))}/>
              <button onClick={()=>setRedeemUnits(u=>(Math.min(maxRedeem,(parseFloat(u)||0)+1)).toFixed(2))}><Plus size={18}/></button>
            </div>
          </>
        ) : (
          <>
            <div className="fieldlbl">{isSip ? "Monthly SIP amount" : "Investment amount"}</div>
            <div className="stepper">
              <button onClick={()=>setAmount(a=>Math.max(fund.minSip,a-500))}><Minus size={18}/></button>
              <div className="valbox num">{inr0(amount)}</div>
              <button onClick={()=>setAmount(a=>a+500)}><Plus size={18}/></button>
            </div>
            {isSip && (
              <>
                <div className="fieldlbl">Debit date (every month)</div>
                <div className="stepper">
                  <button onClick={()=>setSipDay(d=>Math.max(1,d-1))}><Minus size={18}/></button>
                  <div className="valbox num">{sipDay}</div>
                  <button onClick={()=>setSipDay(d=>Math.min(28,d+1))}><Plus size={18}/></button>
                </div>
              </>
            )}
          </>
        )}

        <div className="summary">
          {!isRedeem && <div className="sumrow"><span>Approx. units</span><span className="num">{units.toFixed(3)}</span></div>}
          <div className="sumrow total"><span>{isRedeem ? "Est. credit" : "Amount"}</span><span className="num">{inr(total)}</span></div>
        </div>

        {err && <div style={{color:"var(--down)",fontSize:12.5,fontWeight:700,marginTop:10,textAlign:"center"}}>{err}</div>}

        <button className={"btn btn-full "+(isRedeem?"btn-sell":"btn-grad")} style={{marginTop:14,opacity:(err||total<=0)?.5:1}}
          disabled={!!err||total<=0}
          onClick={()=>onConfirm(mode, { amount, units, sipDay })}>
          {isRedeem ? "Place redeem order" : isSip ? "Register SIP" : "Place buy order"} · {inr(total)}
        </button>
        <div style={{textAlign:"center",fontSize:10.5,color:"var(--faint)",marginTop:10,fontWeight:600}}>
          Demo order · production routes via hybrid BSE/NSE MF rails + EUIN
        </div>
      </div>
    </div>
  );
}

function BottomNav({ tab, go }){
  const items = [
    { k:"home", t:"Home", I:Home },
    { k:"explore", t:"Explore", I:Layers },
    { k:"portfolio", t:"Portfolio", I:Briefcase },
    { k:"sips", t:"SIPs", I:Repeat },
    { k:"profile", t:"Profile", I:User },
  ];
  return (
    <div className="bottomnav">
      {items.map(({k,t,I})=>(
        <button key={k} className={"nav "+(tab===k?"on":"")} onClick={()=>go(k)}>
          <I size={21} strokeWidth={tab===k?2.4:2}/>
          <span>{t}</span>
        </button>
      ))}
    </div>
  );
}

/* ---------------- root ---------------- */
export default function App(){
  const [splash, setSplash] = useState(true);
  const [tab, setTab] = useState("home");
  const [balVis, setBalVis] = useState(true);
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

  useEffect(()=>{ const t=setTimeout(()=>setSplash(false), 1500); return ()=>clearTimeout(t); }, []);

  useEffect(()=>{
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700;800&display=swap";
    document.head.appendChild(l);
    return ()=>{ try{ document.head.removeChild(l); }catch(e){} };
  }, []);

  // simulated daily NAV drift (MF NAVs change once per day; subtle demo ticks)
  useEffect(()=>{
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
  }, []);

  const toast = (m)=>{
    setToastMsg(m);
    if(toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(()=>setToastMsg(null), 2400);
  };

  const toggleWatch = (id)=> setWatch(w=> w.includes(id) ? w.filter(x=>x!==id) : [id,...w]);
  const go = (t)=>{ setOpenFundObj(null); setTab(t); };
  const openFund = (f)=> setOpenFundObj(f);

  const confirmOrder = (mode, { amount, units, sipDay })=>{
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
    setOrder(null);
  };

  const curHolding = openFundObj ? holdings.find(h=>h.id===openFundObj.id) : null;
  const titles = { home:"", explore:"Explore funds", portfolio:"Portfolio", sips:"My SIPs", profile:"Profile" };

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
                {tab==="home" && <div className="arn-badge">AMFI-registered MF Distributor · {NIVYA_ARN}</div>}
              </div>
            </div>
            <div className="appbar-actions">
              <button className="iconbtn" onClick={()=>go("explore")}><Search size={19}/></button>
              <button className="iconbtn"><Bell size={19}/><span className="dot"/></button>
            </div>
          </div>

          {tab==="home" && <HomeScreen navs={navs} holdings={holdings} watch={watch} sips={sips}
            balVis={balVis} setBalVis={setBalVis} openFund={openFund} go={go} toggleWatch={toggleWatch} />}
          {tab==="explore" && <Explore navs={navs} watch={watch} openFund={openFund} toggleWatch={toggleWatch} />}
          {tab==="portfolio" && <Portfolio navs={navs} holdings={holdings} openFund={openFund} />}
          {tab==="sips" && <SipsScreen sips={sips} openFund={openFund} />}
          {tab==="profile" && <Profile holdings={holdings} navs={navs} toast={toast} />}

          <BottomNav tab={tab} go={go} />

          {openFundObj && (
            <FundDetail fund={openFundObj} navs={navs} holding={curHolding}
              watched={watch.includes(openFundObj.id)} onBack={()=>setOpenFundObj(null)}
              onToggleWatch={toggleWatch} onOrder={(mode)=>setOrder({ fund:openFundObj, mode })} />
          )}

          {order && (
            <MFOrderSheet fund={order.fund} navs={navs} mode={order.mode} holding={curHolding}
              onClose={()=>setOrder(null)} onConfirm={confirmOrder} />
          )}

          {toastMsg && (
            <div className="toast">
              <span className="tick"><BadgeCheck size={14} color="#fff"/></span>
              {toastMsg}
            </div>
          )}

          {splash && (
            <div className="splash">
              <NivyaMark size={76}/>
              <div className="name">Nivya</div>
              <div className="tag">Mutual funds. Simplified.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
