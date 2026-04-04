"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { queryWithFallback, TABLES } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/providers/ToastProvider";
import { SampleModal } from "@/components/modals/SampleModal";
import { OrderModal } from "@/components/modals/OrderModal";
import { PageSkeleton, ErrorState, EmptyState } from "@/components/shared/States";

const C = { bg: "#FFFFFF", sf: "#F7F8FB", rs: "#EFF1F6", hv: "#E6E9F0", ac: "#DDE0E9", bd: "#E2E5ED", bdH: "#CDD1DB", t1: "#1A1D26", t2: "#5C6070", t3: "#9198A8", grn: "#10B981", gD: "#ECFDF5", gB: "#A7F3D0", gT: "#065F46", blu: "#3B82F6", bD: "#EFF6FF", bB: "#BFDBFE", bT: "#1E40AF", amb: "#F59E0B", aD: "#FFFBEB", aB: "#FDE68A", aT: "#92400E", red: "#EF4444", rD: "#FEF2F2", rB: "#FECACA", rT: "#991B1B", pur: "#8B5CF6", pD: "#F5F3FF", pB: "#DDD6FE", pT: "#5B21B6", org: "#F97316", oD: "#FFF7ED", oB: "#FED7AA", oT: "#9A3412" };
const STG: Record<string, { l: string; c: string; bg: string; bd: string; ic: string }> = { cold_list: { l: "Cold list", c: C.t3, bg: C.rs, bd: C.bd, ic: "📞" }, buyer_identified: { l: "Buyer ID'd", c: C.bT, bg: C.bD, bd: C.bB, ic: "🎯" }, sending_sample: { l: "Sent", c: C.pT, bg: C.pD, bd: C.pB, ic: "📦" }, sample_follow_up: { l: "Follow up", c: C.oT, bg: C.oD, bd: C.oB, ic: "🔥" }, first_order: { l: "Ordered", c: C.gT, bg: C.gD, bd: C.gB, ic: "✅" }, reorder: { l: "Reorder", c: "#0E7490", bg: "#ECFEFF", bd: "#A5F3FC", ic: "🔄" } };

type Course = {
  id: string;
  name: string;
  course_type?: string | null;
  main_phone?: string | null;
  pro_shop_phone?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  buyer_name?: string | null;
  buyer_title?: string | null;
  buyer_direct_phone?: string | null;
  buyer_email?: string | null;
  buyer_shirt_size?: string | null;
  pipeline_stage?: string;
  ai_score?: number | null;
  total_attempts?: number | null;
  total_orders?: number | null;
  lifetime_revenue?: number | null;
  notes?: string | null;
  dnc?: boolean | null;
  next_follow_up_at?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

type CallRecord = {
  id: string;
  direction?: string | null;
  status?: string | null;
  disposition?: string | null;
  spoke_to?: string | null;
  started_at?: string | null;
  connected_at?: string | null;
  ended_at?: string | null;
  duration_seconds?: number | null;
  notes?: string | null;
  agent_id?: string | null;
};

type RecordingRecord = {
  call_id: string;
  storage_path?: string | null;
  duration_seconds?: number | null;
  transcription_status?: string | null;
  analysis_status?: string | null;
};

type TranscriptRecord = {
  call_id: string;
  full_text?: string | null;
  segments?: Array<{ speaker?: string; text?: string; start?: number; end?: number }> | null;
};

type SampleRecord = {
  id: string;
  buyer_name?: string | null;
  shirt_size?: string | null;
  color?: string | null;
  status?: string | null;
  tracking_number?: string | null;
  carrier?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
  follow_up_scheduled_at?: string | null;
  converted_to_order?: boolean | null;
  shopify_order_number?: string | null;
};

type OrderRecord = {
  id: string;
  total_units?: number | null;
  total?: number | null;
  status?: string | null;
  created_at?: string | null;
  items?: unknown;
  shopify_order_id?: number | null;
};

type AnalysisRecord = {
  overall_score?: number | null;
  coaching_notes?: string[] | null;
  next_step?: string | null;
  prospect_sentiment?: string | null;
  reached_buyer?: boolean | null;
  created_at?: string | null;
};

function Pl({ sg }: { sg: string }) { const m = STG[sg] || STG.cold_list; return <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: m.bg, color: m.c, border: `1px solid ${m.bd}`, whiteSpace: "nowrap" }}>{m.l}</span>; }
function M({ children, c, s = 13 }: { children: React.ReactNode; c?: string; s?: number }) { return <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: s, fontWeight: 600, color: c || C.t1 }}>{children}</span>; }
function Rw({ l, v, c, last }: { l: string; v: string; c?: string | null; last?: boolean }) { return <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: last ? "none" : `1px solid ${C.rs}`, fontSize: 14, gap: 12 }}><span style={{ color: C.t3 }}>{l}</span><span style={{ fontWeight: 500, color: c || C.t1, textAlign: "right" }}>{v}</span></div>; }
function Cd({ children, s = {} }: { children: React.ReactNode; s?: React.CSSProperties }) { return <div style={{ background: C.bg, border: `1px solid ${C.bd}`, borderRadius: 14, padding: "16px 18px", ...s }}>{children}</div>; }
function Lb({ children, r }: { children: React.ReactNode; r?: string }) { return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}><span style={{ fontSize: 12, fontWeight: 600, color: C.t3, textTransform: "uppercase", letterSpacing: "0.5px" }}>{children}</span>{r && <span style={{ fontSize: 12, color: C.t3 }}>{r}</span>}</div>; }
function Btn({ children, primary, onClick }: { children: React.ReactNode; primary?: boolean; onClick?: () => void }) { return <button onClick={onClick} style={{ padding: primary ? "14px 24px" : "10px 18px", borderRadius: 12, border: primary ? "none" : `1.5px solid ${C.bd}`, background: primary ? C.grn : C.bg, color: primary ? "white" : C.t1, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>{children}</button>; }
function Tab({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (t: string) => void }) { return <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${C.bd}`, marginBottom: 16 }}>{tabs.map((t) => <button key={t} onClick={() => onChange(t)} style={{ padding: "10px 20px", fontSize: 13, fontWeight: 600, border: "none", borderBottom: active === t ? `2px solid ${C.grn}` : "2px solid transparent", color: active === t ? C.grn : C.t3, background: "transparent", cursor: "pointer" }}>{t}</button>)}</div>; }

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function formatCurrency(value?: number | null) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function getOrderItemSummary(items: unknown) {
  if (!Array.isArray(items) || items.length === 0) {
    return "No line items stored";
  }

  return items
    .map((item) => {
      if (typeof item !== "object" || !item) {
        return "";
      }
      const row = item as Record<string, unknown>;
      const parts = [row.style, row.color, row.quantity].filter(Boolean);
      return parts.join(" · ");
    })
    .filter(Boolean)
    .join(", ");
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [samples, setSamples] = useState<SampleRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisRecord[]>([]);
  const [recordings, setRecordings] = useState<Record<string, RecordingRecord>>({});
  const [transcripts, setTranscripts] = useState<Record<string, TranscriptRecord>>({});
  const [tab, setTab] = useState("Overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [submittingSample, setSubmittingSample] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const { pushToast } = useToast();

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const courseResult = await queryWithFallback<Course>(TABLES.courses, async (table) => {
        const result = await supabase.from(table).select("*").eq("id", params.id).single();
        return { data: result.data, error: result.error, count: null };
      });

      if (courseResult.error || !courseResult.data) {
        setError(courseResult.error?.message || "Course not found.");
        setLoading(false);
        return;
      }

      setCourse(courseResult.data);

      const [callsResult, samplesResult, ordersResult] = await Promise.all([
        queryWithFallback<CallRecord[]>(TABLES.calls, async (table) => {
          const result = await supabase.from(table).select("*").eq("course_id", params.id).order("created_at", { ascending: false });
          return { data: result.data || [], error: result.error, count: null };
        }),
        queryWithFallback<SampleRecord[]>(TABLES.samples, async (table) => {
          const result = await supabase.from(table).select("*").eq("course_id", params.id).order("created_at", { ascending: false });
          return { data: result.data || [], error: result.error, count: null };
        }),
        queryWithFallback<OrderRecord[]>(TABLES.orders, async (table) => {
          const result = await supabase.from(table).select("*").eq("course_id", params.id).order("created_at", { ascending: false });
          return { data: result.data || [], error: result.error, count: null };
        }),
      ]);

      setCalls(callsResult.data || []);
      setSamples(samplesResult.data || []);
      setOrders(ordersResult.data || []);

      if (callsResult.data && callsResult.data.length > 0) {
        const analysisIds = callsResult.data.map((call) => call.id);
        const [analysisResult, recordingResult, transcriptResult] = await Promise.all([
          queryWithFallback<AnalysisRecord[]>(TABLES.analysis, async (table) => {
            const result = await supabase.from(table).select("*").in("call_id", analysisIds).order("created_at", { ascending: false });
            return { data: result.data || [], error: result.error, count: null };
          }),
          queryWithFallback<RecordingRecord[]>(TABLES.recordings, async (table) => {
            const result = await supabase.from(table).select("*").in("call_id", analysisIds);
            return { data: result.data || [], error: result.error, count: null };
          }),
          queryWithFallback<TranscriptRecord[]>(TABLES.transcripts, async (table) => {
            const result = await supabase.from(table).select("*").in("call_id", analysisIds);
            return { data: result.data || [], error: result.error, count: null };
          }),
        ]);
        setAnalysis(analysisResult.data || []);
        setRecordings(Object.fromEntries((recordingResult.data || []).map((row) => [row.call_id, row])));
        setTranscripts(Object.fromEntries((transcriptResult.data || []).map((row) => [row.call_id, row])));
      } else {
        setAnalysis([]);
        setRecordings({});
        setTranscripts({});
      }

      setLoading(false);
    }

    load();
  }, [params.id]);

  const activity = useMemo(() => {
    const callActivity = calls.map((call) => ({
      type: "Call",
      title: call.disposition || call.status || "Call activity",
      subtitle: `${call.direction || "outbound"}${call.spoke_to ? ` · ${call.spoke_to}` : ""}`,
      at: call.started_at || call.connected_at || call.ended_at || "",
    }));
    const sampleActivity = samples.map((sample) => ({
      type: "Sample",
      title: sample.status || "Sample update",
      subtitle: [sample.buyer_name, sample.shirt_size, sample.color].filter(Boolean).join(" · "),
      at: sample.delivered_at || sample.shipped_at || sample.follow_up_scheduled_at || "",
    }));
    const orderActivity = orders.map((order) => ({
      type: "Order",
      title: order.status || "Order",
      subtitle: `${order.total_units || 0} units · ${formatCurrency(order.total)}`,
      at: order.created_at || "",
    }));

    return [...callActivity, ...sampleActivity, ...orderActivity]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [calls, orders, samples]);

  async function handleSampleSubmit(data: { sz: string; cl: string; ad: string }) {
    if (!course) return;
    setSubmittingSample(true);
    try {
      const response = await fetch("/api/samples/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          buyerName: course.buyer_name || "",
          buyerEmail: course.buyer_email || "",
          size: data.sz,
          color: data.cl,
          address: data.ad,
          agentId: "agent-1",
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to create sample.");
      pushToast({ title: "Sample order created", detail: payload.shopifyOrderId ? `Shopify order #${payload.shopifyOrderId}` : undefined, tone: "success" });
      setShowSampleModal(false);
      window.location.reload();
    } catch (err) {
      pushToast({ title: "Sample creation failed", detail: err instanceof Error ? err.message : "Unknown error", tone: "error" });
    } finally {
      setSubmittingSample(false);
    }
  }

  async function handleOrderSubmit(payload: { product: string; color: string; sizes: Record<string, number>; paymentTerms: string }) {
    if (!course) return;
    setSubmittingOrder(true);
    try {
      const quantity = Object.values(payload.sizes).reduce((sum, value) => sum + value, 0);
      const lineItems = quantity > 0 ? [{
        title: payload.product,
        color: payload.color,
        quantity,
        price: 25,
        sizes: payload.sizes,
      }] : [];
      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          buyerName: course.buyer_name || "",
          buyerEmail: course.buyer_email || "",
          shippingAddress: [course.address, course.city, course.state, course.zip].filter(Boolean).join(", "),
          paymentTerms: payload.paymentTerms,
          lineItems,
          agentId: "agent-1",
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to create order.");
      pushToast({ title: "Wholesale order created", detail: result.shopify?.orderNumber || undefined, tone: "success" });
      setShowOrderModal(false);
      window.location.reload();
    } catch (err) {
      pushToast({ title: "Order creation failed", detail: err instanceof Error ? err.message : "Unknown error", tone: "error" });
    } finally {
      setSubmittingOrder(false);
    }
  }

  if (loading) return <PageSkeleton lines={5} />;
  if (error || !course) return <ErrorState message={error || "Course not found"} onRetry={() => window.location.reload()} />;

  const c = course;
  const stg = STG[c.pipeline_stage || "cold_list"] || STG.cold_list;
  const currentIdx = Object.keys(STG).indexOf(c.pipeline_stage || "cold_list");
  const tabs = [
    "Overview",
    `Activity (${activity.length})`,
    `Calls (${calls.length})`,
    `Samples (${samples.length})`,
    `Orders (${orders.length})`,
    "AI",
  ];

  return (
    <>
    <div style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ padding: "20px 28px", borderBottom: `1px solid ${C.bd}`, background: C.sf }}>
        <button onClick={() => router.push("/courses")} style={{ fontSize: 13, color: C.blu, background: "none", border: "none", cursor: "pointer", marginBottom: 12, fontWeight: 600 }}>← Back to courses</button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 24, fontWeight: 700 }}>{c.name}</span>
              <Pl sg={c.pipeline_stage || "cold_list"} />
            </div>
            <div style={{ fontSize: 15, color: C.t2, marginTop: 4 }}>
              {[c.course_type || "Golf Course", [c.city, c.state].filter(Boolean).join(", "), c.main_phone].filter(Boolean).join(" · ")}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn primary>Call now</Btn>
            <Btn onClick={() => {
              if (!c.main_phone) return;
              void fetch("/api/sms/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  to: c.main_phone,
                  body: `Hi${c.buyer_name ? ` ${c.buyer_name}` : ""} — this is BYRDGANG. Following up from CallMynt.`,
                }),
              }).then(async (response) => {
                const body = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(body.error || "Failed to send SMS.");
                pushToast({ title: "SMS sent", detail: c.main_phone || undefined, tone: "success" });
              }).catch((err) => {
                pushToast({ title: "Failed to send SMS", detail: err instanceof Error ? err.message : "Unknown error", tone: "error" });
              });
            }}>Send SMS</Btn>
            <Btn onClick={() => setShowSampleModal(true)}>Ship sample</Btn>
            <Btn onClick={() => setShowOrderModal(true)}>Create order</Btn>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 28px 28px" }}>
        <Tab tabs={tabs} active={tab} onChange={setTab} />

        {tab === "Overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <Cd>
              <Lb>Course info</Lb>
              <Rw l="Name" v={c.name} />
              <Rw l="Type" v={c.course_type || "—"} />
              <Rw l="Main phone" v={c.main_phone || "—"} c={c.main_phone ? C.blu : null} />
              <Rw l="Pro shop phone" v={c.pro_shop_phone || "—"} c={c.pro_shop_phone ? C.blu : null} />
              <Rw l="Website" v={c.website || "—"} c={c.website ? C.blu : null} />
              <Rw l="Address" v={[c.address, c.city, c.state, c.zip].filter(Boolean).join(", ") || "—"} last />
            </Cd>

            <Cd>
              <Lb>{c.buyer_name ? "Buyer" : "Buyer — unknown"}</Lb>
              {c.buyer_name ? (
                <>
                  <Rw l="Name" v={c.buyer_name} />
                  <Rw l="Title" v={c.buyer_title || "—"} />
                  <Rw l="Direct" v={c.buyer_direct_phone || "—"} c={c.buyer_direct_phone ? C.blu : null} />
                  <Rw l="Email" v={c.buyer_email || "—"} c={c.buyer_email ? C.blu : null} />
                  <Rw l="Shirt size" v={c.buyer_shirt_size || "—"} c={c.buyer_shirt_size ? C.grn : null} last />
                </>
              ) : (
                <div style={{ fontSize: 14, color: C.t3, fontStyle: "italic" }}>
                  No buyer identified yet. Use the quick capture flow in the dialer to save buyer details.
                </div>
              )}
            </Cd>

            <Cd s={{ gridColumn: "1 / -1" }}>
              <Lb>Pipeline timeline</Lb>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {Object.entries(STG).map(([key, value], index) => {
                  const active = key === c.pipeline_stage;
                  const passed = index < currentIdx;
                  return (
                    <div key={key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <div style={{ width: "100%", height: 6, borderRadius: 3, background: passed ? C.grn : active ? C.blu : C.rs }} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: active ? C.bT : passed ? C.gT : C.t3 }}>{value.l}</span>
                    </div>
                  );
                })}
              </div>
            </Cd>

            <Cd>
              <Lb>Performance</Lb>
              <Rw l="Total attempts" v={String(c.total_attempts || 0)} />
              <Rw l="Total orders" v={String(c.total_orders || orders.length)} />
              <Rw l="Lifetime revenue" v={formatCurrency(c.lifetime_revenue)} c={C.grn} />
              <Rw l="Next follow-up" v={formatDate(c.next_follow_up_at)} />
              <Rw l="AI score" v={String(c.ai_score || 0)} c={c.ai_score && c.ai_score >= 75 ? C.grn : C.t1} last />
            </Cd>

            <Cd>
              <Lb>Next action</Lb>
              <Rw l="Current stage" v={stg.l} c={stg.c} />
              <Rw l="DNC" v={c.dnc ? "Yes" : "No"} c={c.dnc ? C.red : C.grn} />
              <Rw l="Last updated" v={formatDate(c.updated_at)} />
              <Rw l="Created" v={formatDate(c.created_at)} last />
            </Cd>

            <Cd s={{ gridColumn: "1 / -1" }}>
              <Lb>Notes</Lb>
              {c.notes ? (
                <div style={{ fontSize: 14, color: C.t2, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{c.notes}</div>
              ) : (
                <div style={{ fontSize: 14, color: C.t3, fontStyle: "italic" }}>No notes saved yet.</div>
              )}
            </Cd>
          </div>
        )}

        {tab === `Activity (${activity.length})` && (
          <Cd>
            {activity.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: C.t3 }}>No interactions with this course yet.</div>
            ) : (
              activity.map((item, index) => (
                <div key={`${item.type}-${index}`} style={{ padding: "14px 0", borderBottom: index === activity.length - 1 ? "none" : `1px solid ${C.rs}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{item.type} · {item.title}</div>
                      <div style={{ fontSize: 13, color: C.t2, marginTop: 4 }}>{item.subtitle || "No extra detail"}</div>
                    </div>
                    <div style={{ fontSize: 12, color: C.t3, whiteSpace: "nowrap" }}>{formatDate(item.at)}</div>
                  </div>
                </div>
              ))
            )}
          </Cd>
        )}

        {tab === `Calls (${calls.length})` && (
            <Cd>
              <Lb r={`${calls.length} total`}>Calls</Lb>
            {calls.length === 0 ? (
              <EmptyState title="No calls recorded yet" detail="Inbound and outbound recordings will show up here with playback and transcripts." />
            ) : (
              calls.map((call, index) => (
                <div key={call.id} style={{ padding: "14px 0", borderBottom: index === calls.length - 1 ? "none" : `1px solid ${C.rs}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>
                        {call.disposition || "Call"} {call.direction ? `· ${call.direction}` : ""}
                      </div>
                      <div style={{ fontSize: 13, color: C.t2, marginTop: 4 }}>
                        {call.spoke_to || "Unknown speaker"} · {call.status || "No status"} · {call.duration_seconds || 0}s
                      </div>
                      {recordings[call.id]?.storage_path ? (
                        <audio controls preload="none" style={{ width: "100%", marginTop: 10 }}>
                          <source src={recordings[call.id].storage_path || ""} />
                        </audio>
                      ) : null}
                      {recordings[call.id]?.transcription_status === "pending" ? (
                        <div style={{ fontSize: 12, color: C.amb, marginTop: 8 }}>Transcribing...</div>
                      ) : null}
                      {transcripts[call.id]?.full_text ? (
                        <div style={{ fontSize: 13, color: C.t3, marginTop: 8, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                          {transcripts[call.id].full_text}
                        </div>
                      ) : null}
                      {call.notes && <div style={{ fontSize: 13, color: C.t3, marginTop: 6 }}>{call.notes}</div>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, color: C.t3 }}>{formatDate(call.started_at || call.connected_at)}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </Cd>
        )}

        {tab === `Samples (${samples.length})` && (
          <Cd>
            <Lb r={`${samples.length} total`}>Samples</Lb>
            {samples.length === 0 ? (
              <EmptyState title="No samples sent yet" detail="Ship a free sample to move this course into the sample pipeline." action={<Btn primary onClick={() => setShowSampleModal(true)}>Ship sample</Btn>} />
            ) : (
              samples.map((sample, index) => (
                <div key={sample.id} style={{ padding: "14px 0", borderBottom: index === samples.length - 1 ? "none" : `1px solid ${C.rs}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{sample.status || "pending_fulfillment"}</div>
                      <div style={{ fontSize: 13, color: C.t2, marginTop: 4 }}>
                        {[sample.buyer_name, sample.shirt_size, sample.color].filter(Boolean).join(" · ")}
                      </div>
                      <div style={{ fontSize: 13, color: C.t3, marginTop: 6 }}>
                        Tracking: {sample.tracking_number || "—"} {sample.carrier ? `· ${sample.carrier}` : ""} {sample.shopify_order_number ? `· ${sample.shopify_order_number}` : ""}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", fontSize: 12, color: C.t3 }}>
                      <div>Shipped: {formatDate(sample.shipped_at)}</div>
                      <div>Delivered: {formatDate(sample.delivered_at)}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </Cd>
        )}

        {tab === `Orders (${orders.length})` && (
          <Cd>
            <Lb r={`${orders.length} total`}>Orders</Lb>
            <div style={{ marginBottom: 14 }}>
              <Btn primary onClick={() => setShowOrderModal(true)}>Create wholesale order</Btn>
            </div>
            {orders.length === 0 ? (
              <EmptyState title="No orders yet" detail="Create the first wholesale order for this course from the product catalog flow." />
            ) : (
              orders.map((order, index) => (
                <div key={order.id} style={{ padding: "14px 0", borderBottom: index === orders.length - 1 ? "none" : `1px solid ${C.rs}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>
                        Order {order.shopify_order_id ? `#${order.shopify_order_id}` : order.id}
                      </div>
                      <div style={{ fontSize: 13, color: C.t2, marginTop: 4 }}>
                        {order.status || "pending"} · {order.total_units || 0} units · {formatCurrency(order.total)}
                      </div>
                      <div style={{ fontSize: 13, color: C.t3, marginTop: 6 }}>{getOrderItemSummary(order.items)}</div>
                    </div>
                    <div style={{ fontSize: 12, color: C.t3 }}>{formatDate(order.created_at)}</div>
                  </div>
                </div>
              ))
            )}
          </Cd>
        )}

        {tab === "AI" && (
          <Cd>
            <Lb r={`${analysis.length} analyses`}>AI course analysis</Lb>
            {analysis.length === 0 ? (
              <>
                <Rw l="Likelihood to convert" v={c.ai_score && c.ai_score > 70 ? "High" : c.ai_score && c.ai_score > 40 ? "Medium" : "Low"} c={c.ai_score && c.ai_score > 70 ? C.grn : c.ai_score && c.ai_score > 40 ? C.amb : C.t3} />
                <Rw l="Pipeline stage" v={stg.l} />
                <Rw l="DNC status" v={c.dnc ? "Do Not Call" : "Active"} c={c.dnc ? C.red : C.grn} />
                <Rw l="Best next step" v={c.next_follow_up_at ? `Follow up ${formatDate(c.next_follow_up_at)}` : "Run more calls to generate analysis"} last />
              </>
            ) : (
              analysis.map((item, index) => (
                <div key={`${item.created_at || "analysis"}-${index}`} style={{ padding: "14px 0", borderBottom: index === analysis.length - 1 ? "none" : `1px solid ${C.rs}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>
                        Score {item.overall_score || 0} · {item.prospect_sentiment || "Unknown sentiment"}
                      </div>
                      <div style={{ fontSize: 13, color: C.t2, marginTop: 4 }}>
                        {item.reached_buyer ? "Reached buyer" : "Did not reach buyer"}{item.next_step ? ` · Next: ${item.next_step}` : ""}
                      </div>
                      {item.coaching_notes && item.coaching_notes.length > 0 && (
                        <div style={{ fontSize: 13, color: C.t3, marginTop: 6 }}>{item.coaching_notes.join(" · ")}</div>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: C.t3 }}>{formatDate(item.created_at)}</div>
                  </div>
                </div>
              ))
            )}
          </Cd>
        )}
      </div>
    </div>
    {showSampleModal ? (
      <SampleModal
        c={{
          n: course.name,
          b: course.buyer_name || undefined,
          bs: course.buyer_shirt_size || undefined,
          ct: [course.address, course.city, course.state, course.zip].filter(Boolean).join(", "),
        }}
        onClose={() => setShowSampleModal(false)}
        onDone={handleSampleSubmit}
        submitting={submittingSample}
      />
    ) : null}
    {showOrderModal ? (
      <OrderModal
        c={{
          n: course.name,
          b: course.buyer_name || undefined,
        }}
        onClose={() => setShowOrderModal(false)}
        onDone={handleOrderSubmit}
        submitting={submittingOrder}
      />
    ) : null}
    </>
  );
}
