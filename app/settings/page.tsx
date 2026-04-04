"use client";

import { useState } from "react";

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

function Cd({ children, s = {} }: { children: React.ReactNode; s?: React.CSSProperties }) {
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.bd}`, borderRadius: 14, padding: "16px 18px", ...s }}>
      {children}
    </div>
  );
}

function Lb({ children, r }: { children: React.ReactNode; r?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: C.t3,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {children}
      </span>
      {r && <span style={{ fontSize: 12, color: C.t3 }}>{r}</span>}
    </div>
  );
}

function Btn({ children, primary, full, onClick }: { children: React.ReactNode; primary?: boolean; full?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: primary ? "14px 24px" : "10px 18px",
        borderRadius: 12,
        border: primary ? "none" : `1.5px solid ${C.bd}`,
        background: primary ? C.grn : C.bg,
        color: primary ? "white" : C.t1,
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "'DM Sans',sans-serif",
        width: full ? "100%" : "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      {children}
    </button>
  );
}

function Rw({ l, v, c, last }: { l: string; v: string | number; c?: string; last?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "8px 0",
        borderBottom: last ? "none" : `1px solid ${C.rs}`,
        fontSize: 14,
      }}
    >
      <span style={{ color: C.t3 }}>{l}</span>
      <span style={{ fontWeight: 500, color: c || C.t1 }}>{v}</span>
    </div>
  );
}

function Tab({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (t: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${C.bd}`, marginBottom: 16 }}>
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          style={{
            padding: "10px 20px",
            fontSize: 13,
            fontWeight: 600,
            border: "none",
            borderBottom: active === t ? `2px solid ${C.grn}` : "2px solid transparent",
            color: active === t ? C.grn : C.t3,
            background: "transparent",
            cursor: "pointer",
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState("Profile");

  return (
    <div style={{ padding: "24px 28px", height: "100%", overflowY: "auto" }}>
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Settings</div>
      <Tab
        tabs={["Profile", "Team", "Phone #s", "Inbound", "Scripts", "Voicemail", "SMS", "Integrations"]}
        active={tab}
        onChange={setTab}
      />

      {tab === "Profile" && (
        <Cd s={{ maxWidth: 500 }}>
          <Lb>My profile</Lb>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: C.bD,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: 600,
                color: C.bT,
              }}
            >
              AJ
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>Alex Johnson</div>
              <div style={{ fontSize: 14, color: C.t2 }}>alex@byrdgang.com</div>
            </div>
          </div>
          {["Full name", "Email", "Phone extension", "Working hours"].map((f) => (
            <div key={f} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.t2, marginBottom: 6 }}>{f}</div>
              <input
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: `1.5px solid ${C.bd}`,
                  fontSize: 14,
                  fontFamily: "'DM Sans',sans-serif",
                  color: C.t1,
                }}
                defaultValue={
                  f === "Full name" ? "Alex Johnson" : f === "Email" ? "alex@byrdgang.com" : ""
                }
              />
            </div>
          ))}
          <Btn primary>Save changes</Btn>
        </Cd>
      )}

      {tab === "Integrations" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            ["Shopify", "Not connected", "Connect your store", C.t3],
            ["Twilio", "Not connected", "Add phone numbers", C.t3],
            ["Whisper", "Local — Mac Mini", "Speech-to-text engine", C.grn],
            ["OpenClaw", "Local — Mac Mini", "AI agent runtime", C.grn],
          ].map(([n, st, desc, c]) => (
            <Cd key={n as string}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{n as string}</div>
                  <div style={{ fontSize: 13, color: C.t2, marginTop: 2 }}>{desc as string}</div>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: c as string,
                    padding: "4px 10px",
                    borderRadius: 8,
                    background: (c as string) === C.grn ? C.gD : C.rs,
                  }}
                >
                  {st as string}
                </span>
              </div>
            </Cd>
          ))}
        </div>
      )}

      {tab === "Inbound" && (
        <Cd s={{ maxWidth: 600 }}>
          <Lb>Inbound routing</Lb>
          {[
            ["Routing strategy", "Ring all available agents"],
            ["Max hold time", "120 seconds"],
            ["Auto-SMS after", "120 seconds hold"],
            ["After-hours", "Voicemail + callback task"],
            ["VM transcription", "Enabled (Deepgram)"],
          ].map(([l, v], i, a) => (
            <Rw key={l as string} l={l as string} v={v as string} last={i === a.length - 1} />
          ))}
          <div style={{ marginTop: 16 }}>
            <Btn>Edit routing rules</Btn>
          </div>
        </Cd>
      )}

      {tab === "Scripts" && (
        <div>
          <Lb r="4 scripts">Script library</Lb>
          {["Cold call — Gatekeeper", "Cold call — Buyer", "Sample follow-up", "Reorder check-in"].map((s, i) => (
            <Cd key={s} s={{ marginBottom: 10, cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{s}</span>
                  <span style={{ color: C.t3, marginLeft: 8, fontSize: 13 }}>v{i + 1}</span>
                </div>
                <span style={{ fontSize: 12, color: C.blu, fontWeight: 600 }}>Edit</span>
              </div>
            </Cd>
          ))}
        </div>
      )}

      {!["Profile", "Integrations", "Inbound", "Scripts"].includes(tab) && (
        <Cd>
          <div style={{ padding: 40, textAlign: "center", color: C.t3 }}>
            Settings for {tab} — configure in the full app
          </div>
        </Cd>
      )}
    </div>
  );
}
