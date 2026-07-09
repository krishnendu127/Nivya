/**
 * Notifications — SIP reminders, orders, statements, alerts
 */
import React, { useMemo, useState, useCallback } from "react";
import {
  ArrowLeft, Settings, ShieldCheck, ChevronRight, Clock,
  Calendar, BadgeCheck, Bell, FileText, AlertTriangle, User, IndianRupee,
} from "lucide-react";

const INITIAL_ITEMS = [
  {
    id: "n1",
    section: "today",
    unread: true,
    tone: "teal",
    icon: "calendar",
    title: "SIP debit tomorrow",
    subtitle: "HDFC Balanced Advantage Fund",
    detail: "HDFC Bank •••• 4521 · ₹5,000/month",
    time: "10:30 AM",
    foot: { tone: "info", text: "Reminders are sent based on your mandate setup." },
  },
  {
    id: "n2",
    section: "today",
    unread: false,
    tone: "teal",
    icon: "check",
    title: "SIP auto-debit successful",
    subtitle: "Axis Bluechip Fund",
    detail: "₹2,000 debited · 34.28 units allotted",
    time: "8:45 AM",
  },
  {
    id: "n3",
    section: "today",
    unread: false,
    tone: "blue",
    icon: "bell",
    title: "NAV updated",
    subtitle: "Parag Parikh Flexi Cap",
    detail: "NAV ₹82.15 — did not use",
    time: "7:00 AM",
  },
  {
    id: "n4",
    section: "week",
    unread: true,
    tone: "red",
    icon: "alert",
    title: "SIP mandate failed",
    subtitle: "Mirae Asset Large Cap Fund",
    detail: "HDFC Bank •••• 4521 · Insufficient balance",
    time: "Yesterday, 8:45 PM",
    foot: { tone: "warn", text: "Action needed to avoid future SIP failures." },
  },
  {
    id: "n5",
    section: "week",
    unread: false,
    tone: "teal",
    icon: "file",
    title: "New statement available",
    subtitle: "Mar 2026 investment statement",
    detail: "Download from Documents section",
    time: "Mon",
  },
  {
    id: "n6",
    section: "earlier",
    unread: false,
    tone: "red",
    icon: "alert",
    title: "SIP bounce alert",
    subtitle: "SBI Contra Fund",
    detail: "Auto-debit failed · Retry on 17 Jul",
    time: "12 Jun",
  },
  {
    id: "n7",
    section: "earlier",
    unread: false,
    tone: "amber",
    icon: "credit",
    title: "Monthly credit alert",
    subtitle: "Nippon India Small Cap",
    detail: "Dividend ₹812 credited · 5 Jun",
    time: "5 Jun",
  },
  {
    id: "n8",
    section: "earlier",
    unread: false,
    tone: "purple",
    icon: "user",
    title: "KYC pending",
    subtitle: "Complete KYC to continue investing",
    detail: "Identity verification pending",
    time: "28 May",
  },
];

const SECTIONS = [
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "earlier", label: "Earlier" },
];

function IconBadge({ tone, icon }) {
  const icons = {
    calendar: <Calendar size={18} />,
    check: <BadgeCheck size={18} />,
    bell: <Bell size={18} />,
    file: <FileText size={18} />,
    alert: <AlertTriangle size={18} />,
    credit: <IndianRupee size={18} />,
    user: <User size={18} />,
  };
  return (
    <span className={`ntf-ic ntf-ic-${tone}`}>
      {icons[icon] ?? <Bell size={18} />}
      {icon === "alert" && <span className="ntf-ic-badge">!</span>}
    </span>
  );
}

function NotificationCard({ item, onOpen }) {
  return (
    <div className={`ntf-wrap${item.unread ? " unread" : ""}`}>
      {item.unread && <span className="ntf-dot" aria-hidden />}
      <div className="ntf-card-block">
        <button type="button" className="ntf-card" onClick={() => onOpen(item)}>
          <IconBadge tone={item.tone} icon={item.icon} />
          <span className="ntf-body">
            <b>{item.title}</b>
            <span className="sub">{item.subtitle}</span>
            {item.detail && <span className="det">{item.detail}</span>}
            <span className="time">
              <Clock size={11} />
              {item.time}
            </span>
          </span>
          <ChevronRight size={16} className="ntf-chev" />
        </button>
        {item.foot && (
          <div className={`ntf-foot ntf-foot-${item.foot.tone}`}>{item.foot.text}</div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onViewInvestments }) {
  return (
    <div className="ntf-empty">
      <div className="ntf-empty-ic">
        <Bell size={34} color="#0FA8A0" />
        <span className="ntf-empty-badge"><BadgeCheck size={14} color="#2456BE" /></span>
      </div>
      <h2>You&apos;re all caught up!</h2>
      <p>We&apos;ll notify you about important updates related to your investments.</p>
      <button type="button" className="ntf-empty-btn" onClick={onViewInvestments}>
        View all investments
      </button>
      <div className="ntf-empty-shield">
        <ShieldCheck size={14} />
        We will never send stock tips, market calls, or investment advice
      </div>
    </div>
  );
}

/**
 * @param {{ onBack, go, toast }} props
 */
export default function NotificationsScreen({ onBack, go, toast }) {
  const [items, setItems] = useState(INITIAL_ITEMS);

  const grouped = useMemo(() => {
    const map = { today: [], week: [], earlier: [] };
    items.forEach((n) => map[n.section]?.push(n));
    return map;
  }, [items]);

  const hasUnread = items.some((n) => n.unread);

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
    toast("All notifications marked as read");
  }, [toast]);

  const openItem = useCallback((item) => {
    setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n)));
    if (item.title.includes("statement")) toast("Opening Documents — demo");
    else if (item.title.includes("mandate failed") || item.title.includes("bounce")) go("sips");
    else if (item.title.includes("KYC")) toast("KYC flow — demo");
    else if (item.title.includes("debit tomorrow")) go("sips");
    else toast(`${item.title} — demo`);
  }, [go, toast]);

  return (
    <div className="overlay ntf-overlay">
      <div className="ntf-topbar">
        <button type="button" className="back" onClick={onBack} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <h1>Notifications</h1>
        <button
          type="button"
          className="gear"
          aria-label="Notification settings"
          onClick={() => toast("Notification settings — demo")}
        >
          <Settings size={19} />
        </button>
      </div>

      {items.length > 0 && (
        <div className="ntf-info">
          <ShieldCheck size={15} />
          <span>
            Updates about your investments and account. We will never send advice or recommendations.
          </span>
        </div>
      )}

      <div className="scroll ntf-scroll">
        {items.length === 0 ? (
          <EmptyState onViewInvestments={() => { onBack(); go("portfolio"); }} />
        ) : (
          <>
            {SECTIONS.map(({ key, label }) => {
              const list = grouped[key];
              if (!list?.length) return null;
              return (
                <section key={key} className="ntf-section">
                  <div className="ntf-section-hd">
                    <h3>{label}</h3>
                    {key === "today" && hasUnread && (
                      <button type="button" className="ntf-mark-all" onClick={markAllRead}>
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="ntf-list">
                    {list.map((item) => (
                      <NotificationCard key={item.id} item={item} onOpen={openItem} />
                    ))}
                  </div>
                </section>
              );
            })}

            <button
              type="button"
              className="ntf-prefs"
              onClick={() => toast("Notification preferences — demo")}
            >
              <span className="ic"><Settings size={18} /></span>
              <span className="txt">
                <b>Manage notification preferences</b>
                <small>SIP reminders, order updates &amp; statements</small>
              </span>
              <ChevronRight size={16} color="var(--faint)" />
            </button>

            <p className="ntf-disclaimer">
              Mutual fund investments are subject to market risks. Read all scheme-related documents carefully.
              Nivya is an AMFI-registered distributor; notifications are transactional only.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
