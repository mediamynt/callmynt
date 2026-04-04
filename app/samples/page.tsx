"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { queryWithFallback, TABLES } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { C } from "@/lib/constants";
import { EmptyState, ErrorState, PageSkeleton } from "@/components/shared/States";

type SampleRecord = {
  id: string;
  course_id?: string | null;
  buyer_name?: string | null;
  shirt_size?: string | null;
  color?: string | null;
  status?: string | null;
  tracking_number?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
  follow_up_scheduled_at?: string | null;
  converted_to_order?: boolean | null;
};

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return <div style={{ background: C.bg, borderRadius: 14, border: `1px solid ${C.bd}`, padding: "18px 20px" }}><div style={{ fontSize: 11, color: C.t3, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{label}</div><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 26, fontWeight: 600, color: color || C.t1 }}>{value}</span></div>;
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : "—";
}

export default function SamplesPage() {
  const [samples, setSamples] = useState<SampleRecord[]>([]);
  const [courseNames, setCourseNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const samplesResult = await queryWithFallback<SampleRecord[]>(TABLES.samples, async (table) => {
      const query = await supabase.from(table).select("*").order("created_at", { ascending: false });
      return { data: query.data || [], error: query.error, count: null };
    });

    if (samplesResult.error) {
      setError(samplesResult.error.message || "Failed to load samples.");
      setLoading(false);
      return;
    }

    const sampleRows = samplesResult.data || [];
    setSamples(sampleRows);
    const courseIds = [...new Set(sampleRows.map((sample) => sample.course_id).filter(Boolean))] as string[];
    if (courseIds.length > 0) {
      const coursesResult = await queryWithFallback<any[]>(TABLES.courses, async (table) => {
        const query = await supabase.from(table).select("id, name").in("id", courseIds);
        return { data: query.data || [], error: query.error, count: null };
      });
      setCourseNames(Object.fromEntries((coursesResult.data || []).map((course) => [course.id, course.name])));
    } else {
      setCourseNames({});
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sent = samples.length;
  const delivered = samples.filter((sample) => sample.status === "delivered").length;
  const inTransit = samples.filter((sample) => sample.status?.includes("transit") || sample.status === "shipped").length;
  const converted = samples.filter((sample) => sample.converted_to_order || sample.status === "converted").length;
  const overdue = useMemo(
    () =>
      samples.filter((sample) => {
        if (!sample.follow_up_scheduled_at) return false;
        return new Date(sample.follow_up_scheduled_at).getTime() < Date.now() && !sample.converted_to_order;
      }).length,
    [samples],
  );
  const rate = sent > 0 ? Math.round((converted / sent) * 100) : 0;

  if (loading) return <PageSkeleton lines={5} />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (samples.length === 0) {
    return <EmptyState title="No samples sent yet" detail="Start dialing to send your first free polo sample." />;
  }

  return (
    <div style={{ padding: "24px 28px", height: "100%", overflowY: "auto" }}>
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Sample tracking</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 20 }}>
        <Stat label="Sent" value={sent} color={C.pur} />
        <Stat label="Delivered" value={delivered} color={C.org} />
        <Stat label="In transit" value={inTransit} color={C.blu} />
        <Stat label="Overdue" value={overdue} color={C.oT} />
        <Stat label="Converted" value={converted} color={C.grn} />
      </div>
      <div style={{ background: C.gD, border: `1px solid ${C.gB}`, borderRadius: 14, padding: "16px 20px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.gT }}>Conversion rate</div>
          <div style={{ fontSize: 13, color: C.t2, marginTop: 2 }}>{converted} of {sent} → orders</div>
        </div>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 32, fontWeight: 600, color: C.grn }}>{rate}%</span>
      </div>
      <div style={{ background: C.bg, border: `1px solid ${C.bd}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 120px 130px 120px 120px", padding: "12px 20px", borderBottom: `1px solid ${C.bd}`, fontSize: 11, color: C.t3, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700, background: C.sf }}>
          <span>Course / Buyer</span>
          <span>Status</span>
          <span>Size / Color</span>
          <span>Tracking</span>
          <span>Delivered</span>
          <span>Follow-up</span>
        </div>
        {samples.map((sample) => (
          <div key={sample.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 120px 130px 120px 120px", padding: "14px 20px", borderBottom: `1px solid ${C.rs}`, alignItems: "center", fontSize: 14 }}>
            <div>
              <div style={{ fontWeight: 700 }}>{courseNames[sample.course_id || ""] || "Unknown course"}</div>
              <div style={{ fontSize: 12, color: C.t3, marginTop: 3 }}>{sample.buyer_name || "Unknown buyer"}</div>
            </div>
            <span style={{ color: sample.converted_to_order ? C.grn : C.t2, fontWeight: 600 }}>{sample.status || "pending_fulfillment"}</span>
            <span style={{ color: C.t2 }}>{[sample.shirt_size, sample.color].filter(Boolean).join(" / ") || "—"}</span>
            <span style={{ color: C.t2 }}>{sample.tracking_number || "—"}</span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>{formatDate(sample.delivered_at)}</span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>{formatDate(sample.follow_up_scheduled_at)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
