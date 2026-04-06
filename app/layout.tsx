import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { CallProvider } from "@/components/CallProvider";

import { ToastProvider } from "@/components/providers/ToastProvider";
import { GlobalHoldQueueBanner } from "@/components/GlobalHoldQueueBanner";
import { TopBarClient } from "@/components/layout/TopBarClient";

export const metadata: Metadata = {
  title: "CallMynt",
  description: "Power dialer for golf course sales",
};

const C = {
  bg: "#FFFFFF",
  sf: "#F7F8FB",
  rs: "#EFF1F6",
  hv: "#E6E9F0",
  ac: "#DDE0E9",
  bd: "#E2E5ED",
  bdH: "#CDD1DB",
  t1: "#1A1D26",
  t2: "#5C6070",
  t3: "#9198A8",
  grn: "#10B981",
  gD: "#ECFDF5",
  gB: "#A7F3D0",
  gT: "#065F46",
  blu: "#3B82F6",
  bD: "#EFF6FF",
  bB: "#BFDBFE",
  bT: "#1E40AF",
  amb: "#F59E0B",
  aD: "#FFFBEB",
  aB: "#FDE68A",
  aT: "#92400E",
  red: "#EF4444",
  rD: "#FEF2F2",
  rB: "#FECACA",
  rT: "#991B1B",
  pur: "#8B5CF6",
  pD: "#F5F3FF",
  pB: "#DDD6FE",
  pT: "#5B21B6",
  org: "#F97316",
  oD: "#FFF7ED",
  oB: "#FED7AA",
  oT: "#9A3412",
};

function I({ children, s = 20, k = C.t2, w = 2 }: { children: React.ReactNode; s?: number; k?: string; w?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={k} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

function M({ children, c, s = 13 }: { children: React.ReactNode; c?: string; s?: number }) {
  return (
    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: s, fontWeight: 600, color: c || C.t1 }}>
      {children}
    </span>
  );
}

const nav = [
  {
    id: "dashboard",
    lb: "Dashboard",
    href: "/",
    ic: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </>
    ),
  },
  {
    id: "dialer",
    lb: "Dialer",
    href: "/dialer",
    ic: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />,
  },
  {
    id: "courses",
    lb: "Courses",
    href: "/courses",
    ic: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
      </>
    ),
  },
  {
    id: "campaigns",
    lb: "Campaigns",
    href: "/campaigns",
    ic: (
      <>
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </>
    ),
  },
  {
    id: "scripts",
    lb: "Scripts",
    href: "/campaigns/scripts",
    ic: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </>
    ),
  },
  {
    id: "samples",
    lb: "Samples",
    href: "/samples",
    ic: (
      <>
        <polyline points="20 12 20 22 4 22 4 12" />
        <rect x="2" y="7" width="20" height="5" />
      </>
    ),
  },
  {
    id: "orders",
    lb: "Orders",
    href: "/orders",
    ic: (
      <>
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </>
    ),
  },
  {
    id: "calls",
    lb: "Calls",
    href: "/call-library",
    ic: (
      <>
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      </>
    ),
  },
  {
    id: "coaching",
    lb: "Coach",
    href: "/coaching",
    ic: (
      <>
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </>
    ),
  },
  {
    id: "stats",
    lb: "Stats",
    href: "/analytics",
    ic: (
      <>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </>
    ),
  },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
          * { box-sizing: border-box; }
          body { margin: 0; padding: 0; }
        `}</style>
      </head>
      <body style={{ fontFamily: "'DM Sans',sans-serif", background: C.bg, color: C.t1 }}>
        <ToastProvider>
          <div
            style={{
              height: "100vh",
              display: "grid",
              gridTemplateColumns: "56px 1fr",
              gridTemplateRows: "52px auto 1fr",
              overflow: "hidden",
            }}
          >
          {/* TOPBAR */}
          <div
            style={{
              gridColumn: "1/-1",
              display: "flex",
              alignItems: "center",
              padding: "0 16px",
              borderBottom: `1px solid ${C.bd}`,
              gap: 12,
              position: "relative",
              background: C.bg,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
              <img src="/logo.png" alt="CallMynt" style={{ height: 32, width: 'auto' }} />
            </div>
            <div style={{ flex: 1, display: "flex", justifyContent: "center", gap: 6 }}>
              {[
                ["Dials", 0],
                ["Connects", 0, C.grn],
                ["Samples", 0, C.pur],
                ["Orders", 0, C.blu],
              ].map(([l, v, c]) => (
                <div
                  key={l as string}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 12px",
                    background: C.sf,
                    borderRadius: 8,
                    border: `1px solid ${C.bd}`,
                  }}
                >
                  <span style={{ fontSize: 10, color: C.t3, textTransform: "uppercase", fontWeight: 600 }}>
                    {l as string}
                  </span>
                  <M s={13} c={c as string}>
                    {v as number}
                  </M>
                </div>
              ))}
            </div>
            <TopBarClient />
          </div>

          <CallProvider agentId="agent-1">
            <GlobalHoldQueueBanner />
            {/* SIDEBAR */}
            <div
              style={{
                background: C.sf,
                borderRight: `1px solid ${C.bd}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "10px 0",
                gap: 2,
                overflowY: "auto",
              }}
            >
            {nav.map((n) => (
              <Link
                key={n.id}
                href={n.href}
                title={n.lb}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  border: "none",
                  textDecoration: "none",
                }}
              >
                <I s={20} k={C.t3}>
                  {n.ic}
                </I>
              </Link>
            ))}
            <div style={{ flex: 1 }} />
            <Link
              href="/settings"
              title="Settings"
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                border: "none",
                textDecoration: "none",
              }}
            >
              <I s={20} k={C.t3}>
                <>
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </>
              </I>
            </Link>
            </div>

            {/* MAIN */}
            <div style={{ overflow: "hidden", background: C.bg, height: "100%" }}>{children}</div>
          </CallProvider>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
