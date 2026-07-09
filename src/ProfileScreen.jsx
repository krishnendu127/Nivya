/**
 * Profile tab — user card, trust & transparency, menu groups, earnings modal
 */
import React, { useState, useCallback } from "react";
import {
  ChevronRight, BadgeCheck, Copy, Camera, User, Users, Building2, Repeat,
  FileText, Receipt, FileSpreadsheet, Scale, HelpCircle, MessageCircle, Phone,
  Bell, Shield, Lock, LogOut, X, ShieldCheck, Info, ArrowRight,
  IndianRupee, CircleDollarSign,
} from "lucide-react";

const DEMO_USER = {
  name: "Ananya Sharma",
  phone: "+91 98765 43210",
  email: "ananya.sharma@email.com",
  pan: "ABCDE1234F",
  ckyc: "Verified",
  kycVerified: true,
};

function ProfileAvatar({ name, onPhoto }) {
  const initial = (name?.trim()?.[0] ?? "U").toUpperCase();
  return (
    <div className="prof-avatar-wrap">
      <div className="prof-avatar">{initial}</div>
      <button type="button" className="prof-avatar-cam" onClick={onPhoto} aria-label="Change photo">
        <Camera size={12}/>
      </button>
    </div>
  );
}

function CopyField({ label, value, onCopy }) {
  return (
    <div className="prof-trust-field">
      <div className="k">{label}</div>
      <div className="v-row">
        <span className="v num">{value}</span>
        <button type="button" className="prof-copy" onClick={() => onCopy(value, label)} aria-label={`Copy ${label}`}>
          <Copy size={14}/>
        </button>
      </div>
    </div>
  );
}

function MenuRow({ icon, title, sub, onClick, danger }) {
  return (
    <button type="button" className={`prof-menu-row ${danger ? "danger" : ""}`} onClick={onClick}>
      <span className="ic">{icon}</span>
      <span className="txt">
        <b>{title}</b>
        {sub && <small>{sub}</small>}
      </span>
      <ChevronRight size={16} color="var(--faint)"/>
    </button>
  );
}

function MenuSection({ title, children }) {
  return (
    <div className="prof-section">
      <div className="prof-section-hd">{title}</div>
      <div className="prof-menu">{children}</div>
    </div>
  );
}

function HowNivyaEarnsSheet({ arn, onClose }) {
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet prof-earn-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab"/>
        <div className="prof-sheet-head">
          <span className="tag">HOW NIVYA EARNS</span>
          <button type="button" className="sip-sheet-x" onClick={onClose}><X size={20}/></button>
        </div>
        <div className="prof-earn-hero">
          <div className="illus"><IndianRupee size={28} color="#0FA8A0"/></div>
          <p className="lead">Our income is transparent. You stay in control.</p>
        </div>
        <div className="prof-flow">
          <span>You (Investor)</span>
          <ArrowRight size={14}/>
          <span>AMC (Fund House)</span>
          <ArrowRight size={14}/>
          <span>Nivya (Distributor)</span>
        </div>
        <ul className="prof-earn-list">
          {[
            { ic: <CircleDollarSign size={16}/>, t: "Regular plan pricing", s: "Expense ratio includes distributor commission paid by the AMC — not an extra charge from you at checkout." },
            { ic: <Repeat size={16}/>, t: "Trail commission", s: "Nivya earns a small ongoing trail from the AMC for servicing your Regular plan investments." },
            { ic: <ShieldCheck size={16}/>, t: "No hidden charges", s: "We do not charge separate platform fees for mutual fund orders in this demo build." },
            { ic: <Info size={16}/>, t: "You choose", s: "You may invest in Direct plans elsewhere; Nivya distributes Regular plans only under AMFI registration." },
          ].map((row) => (
            <li key={row.t}>
              <span className="ic">{row.ic}</span>
              <div>
                <b>{row.t}</b>
                <p>{row.s}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="prof-earn-note">
          <b>Important to know</b>
          <p>Nivya offers Regular plans only. Returns are market-linked and not guaranteed. ARN {arn.replace(/^ARN-?/i, "")}.</p>
        </div>
      </div>
    </div>
  );
}

function RegularDirectSheet({ onClose }) {
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab"/>
        <div className="prof-sheet-head">
          <h4>Regular vs Direct</h4>
          <button type="button" className="sip-sheet-x" onClick={onClose}><X size={20}/></button>
        </div>
        <div className="prof-rvd">
          <div className="col">
            <h5>Regular (Nivya)</h5>
            <p>Higher expense ratio includes distributor commission. You get transaction support, statements, and grievance assistance from Nivya as your AMFI-registered distributor.</p>
          </div>
          <div className="col">
            <h5>Direct</h5>
            <p>Lower expense ratio — no distributor commission. You deal directly with the AMC or another direct platform. Nivya does not offer Direct plans.</p>
          </div>
        </div>
        <p className="sip-sheet-tip">Expense ratios are disclosed in each fund&apos;s SID/KIM. Compare before investing.</p>
      </div>
    </div>
  );
}

function EmptyStateSheet({ title, message, icon, onClose }) {
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet prof-empty-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab"/>
        <button type="button" className="sip-sheet-x prof-empty-x" onClick={onClose}><X size={20}/></button>
        <div className="prof-empty-ic">{icon}</div>
        <h4>{title}</h4>
        <p>{message}</p>
      </div>
    </div>
  );
}

/**
 * @param {{ go, toast, arn, euin, onOpenNotifications }} props
 */
export default function ProfileScreen({ go, toast, arn, euin, onOpenNotifications }) {
  const [earnOpen, setEarnOpen] = useState(false);
  const [rvdOpen, setRvdOpen] = useState(false);
  const [emptySheet, setEmptySheet] = useState(null);

  const arnDisplay = arn.replace(/^ARN-?/i, "");
  const euinDisplay = euin.replace(/^EUIN-?/i, "E");

  const copyText = useCallback(async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(`${label} copied`);
    } catch {
      toast("Unable to copy — please try again");
    }
  }, [toast]);

  const stub = (label) => toast(`${label} — coming in production`);

  const emptySheets = {
    bank: {
      title: "No bank accounts added",
      message: "Add your bank to start investing and set up SIP mandates.",
      icon: <Building2 size={28} color="#0FA8A0"/>,
    },
    mandates: {
      title: "No mandates yet",
      message: "Start a SIP to set up e-mandates for automatic debits.",
      icon: <Repeat size={28} color="#0FA8A0"/>,
    },
    documents: {
      title: "No documents available",
      message: "Statements and tax reports will appear here after you invest.",
      icon: <FileText size={28} color="#0FA8A0"/>,
    },
  };

  return (
    <>
      <div className="scroll prof-scroll">
        <div className="prof-user-card">
          <ProfileAvatar name={DEMO_USER.name} onPhoto={() => stub("Profile photo")}/>
          <div className="prof-user-main">
            <div className="prof-user-top">
              <div>
                <h2>{DEMO_USER.name}</h2>
                <div className="contact">{DEMO_USER.phone}</div>
                <div className="contact">{DEMO_USER.email}</div>
                {DEMO_USER.kycVerified && (
                  <span className="prof-kyc"><BadgeCheck size={13}/> KYC Verified</span>
                )}
              </div>
              <div className="prof-ids">
                <div><span>PAN</span><b>{DEMO_USER.pan}</b></div>
                <div><span>CKYC</span><b>{DEMO_USER.ckyc}</b></div>
              </div>
            </div>
          </div>
        </div>

        <button type="button" className="prof-portfolio-link" onClick={() => go("portfolio")}>
          <span>View portfolio</span>
          <ChevronRight size={16}/>
        </button>
        <p className="prof-portfolio-sub">Check your investments, returns &amp; insights</p>

        <div className="prof-trust-card">
          <div className="hd">Trust &amp; Transparency</div>
          <CopyField label="ARN" value={arnDisplay} onCopy={copyText}/>
          <CopyField label="EUIN" value={euinDisplay} onCopy={copyText}/>
          <div className="prof-trust-foot">
            <ShieldCheck size={14}/>
            AMFI-registered Mutual Fund Distributor
          </div>
        </div>

        <div className="prof-quick">
          <button type="button" className="prof-quick-row" onClick={() => setEarnOpen(true)}>
            <span className="ic"><IndianRupee size={18}/></span>
            <span className="txt">
              <b>How Nivya earns</b>
              <small>Our income is trail commission from AMCs on Regular plans</small>
            </span>
            <ChevronRight size={16} color="var(--faint)"/>
          </button>
          <button type="button" className="prof-quick-row" onClick={() => setRvdOpen(true)}>
            <span className="ic"><Info size={18}/></span>
            <span className="txt">
              <b>Regular vs Direct</b>
              <small>Why Nivya offers Regular plans only</small>
            </span>
            <ChevronRight size={16} color="var(--faint)"/>
          </button>
        </div>

        <MenuSection title="Account">
          <MenuRow icon={<User size={18}/>} title="Profile & personal details" sub="Update personal information" onClick={() => stub("Profile & personal details")}/>
          <MenuRow icon={<Users size={18}/>} title="Nominee" sub="View or update nominee details" onClick={() => stub("Nominee")}/>
          <MenuRow icon={<Building2 size={18}/>} title="Bank accounts" sub="Manage linked bank accounts" onClick={() => setEmptySheet("bank")}/>
          <MenuRow icon={<Repeat size={18}/>} title="Mandates" sub="View & manage SIP mandates" onClick={() => go("sips")}/>
        </MenuSection>

        <MenuSection title="Documents">
          <MenuRow icon={<Receipt size={18}/>} title="Statements" sub="Consolidated account statements" onClick={() => setEmptySheet("documents")}/>
          <MenuRow icon={<FileSpreadsheet size={18}/>} title="CAS (Consolidated Account Statement)" sub="View transaction-level CAS" onClick={() => setEmptySheet("documents")}/>
          <MenuRow icon={<Scale size={18}/>} title="Tax reports" sub="Capital gains & tax reports" onClick={() => setEmptySheet("documents")}/>
        </MenuSection>

        <MenuSection title="Support">
          <MenuRow icon={<HelpCircle size={18}/>} title="Help center" sub="FAQs, guides & how-tos" onClick={() => stub("Help center")}/>
          <MenuRow icon={<MessageCircle size={18}/>} title="Raise a grievance" sub="SEBI SCORES grievance redressal" onClick={() => stub("SEBI SCORES grievance")}/>
          <MenuRow icon={<Phone size={18}/>} title="Contact us" sub="Call, email or chat with support" onClick={() => stub("Contact support")}/>
        </MenuSection>

        <MenuSection title="App">
          <MenuRow icon={<Bell size={18}/>} title="Notifications" sub="SIP reminders, orders & updates" onClick={() => onOpenNotifications?.()}/>
          <MenuRow icon={<Shield size={18}/>} title="Security" sub="PIN, biometrics, trusted devices" onClick={() => stub("Security")}/>
          <MenuRow icon={<Lock size={18}/>} title="Privacy" sub="Privacy policy, data & consents" onClick={() => stub("Privacy")}/>
        </MenuSection>

        <button type="button" className="prof-logout" onClick={() => toast("Logged out — demo")}>
          <LogOut size={18}/>
          Log out
        </button>

        <div className="prof-disclaimer">
          Mutual fund investments are subject to market risks. Read all scheme-related documents carefully before investing.
        </div>

        <div className="prof-footer">
          AMFI Mutual Fund Distributor · ARN {arnDisplay} · EUIN {euinDisplay}
          <br/>
          App version 1.0.0 · Made with care in India
        </div>
      </div>

      {earnOpen && <HowNivyaEarnsSheet arn={arn} onClose={() => setEarnOpen(false)}/>}
      {rvdOpen && <RegularDirectSheet onClose={() => setRvdOpen(false)}/>}
      {emptySheet && emptySheets[emptySheet] && (
        <EmptyStateSheet
          {...emptySheets[emptySheet]}
          onClose={() => setEmptySheet(null)}
        />
      )}
    </>
  );
}
