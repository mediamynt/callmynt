"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { queryWithFallback, TABLES } from "@/lib/data";
import { C } from "@/lib/constants";
import { EmptyState, ErrorState, PageSkeleton } from "@/components/shared/States";

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div style={{ background: C.bg, borderRadius: 14, border: `1px solid ${C.bd}`, padding: "20px" }}>
      <div style={{ fontSize: 12, color: C.t3, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 30, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color: C.t3, marginTop: 4 }}>{sub}</div>
    </div>
  );
}

export default function CoachingPage() {
  const [analysis, setAnalysis] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [analysisResult, reportsResult] = await Promise.all([
      queryWithFallback<any[]>(TABLES.analysis, async (table) => {
        const query = await supabase.from(table).select("*").order("created_at", { ascending: false });
        return { data: query.data || [], error: query.error, count: null };
      }),
      queryWithFallback<any[]>(TABLES.coachingReports, async (table) => {
        const query = await supabase.from(table).select("*").order("created_at", { ascending: false });
        return { data: query.data || [], error: query.error, count: null };
      }),
    ]);

    if (analysisResult.error) {
      setError(analysisResult.error.message || "Failed to load coaching data.");
      setLoading(false);
      return;
    }

    setAnalysis(analysisResult.data || []);
    setReports(reportsResult.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => {
    const avgScore = analysis.length > 0
      ? Math.round(analysis.reduce((sum, item) => sum + Number(item.overall_score || 0), 0) / analysis.length)
      : 0;
    const reachedBuyer = analysis.filter((item) => item.reached_buyer).length;
    const positive = analysis.filter((item) => item.prospect_sentiment === "positive").length;
    const notes = analysis.flatMap((item) => item.coaching_notes || []);
    const noteCounts = notes.reduce<Record<string, number>>((acc, note) => {
      acc[note] = (acc[note] || 0) + 1;
      return acc;
    }, {});
    const topNotes = Object.entries(noteCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return {
      avgScore,
      reachedBuyer,
      positive,
      topNotes,
    };
  }, [analysis]);

  if (loading) return <PageSkeleton lines={5} />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  if (analysis.length === 0) {
    return <EmptyState title="Need more call data for AI coaching" detail="Run analysis on recorded calls and nightly reports will start to populate here." />;
  }

  return (
    <div style={{ padding: "24px 28px", height: "100%", overflowY: "auto" }}>
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>AI coaching</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
        <MetricCard label="Avg call score" value={`${summary.avgScore}`} sub={`${analysis.length} analyzed calls`} color={C.grn} />
        <MetricCard label="Reached buyer" value={`${summary.reachedBuyer}`} sub={`${analysis.length - summary.reachedBuyer} calls missed buyer`} color={C.amb} />
        <MetricCard label="Positive sentiment" value={`${summary.positive}`} sub={`${analysis.length} total analyzed`} color={C.blu} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: C.bg, border: `1px solid ${C.bd}`, borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Top coaching notes</div>
          {summary.topNotes.length === 0 ? (
            <div style={{ fontSize: 13, color: C.t3 }}>No coaching notes yet.</div>
          ) : (
            summary.topNotes.map(([note, count]) => (
              <div key={note} style={{ padding: "12px 0", borderBottom: `1px solid ${C.rs}` }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{note}</div>
                <div style={{ fontSize: 12, color: C.t3, marginTop: 4 }}>{count} calls</div>
              </div>
            ))
          )}
        </div>

        <div style={{ background: C.bg, border: `1px solid ${C.bd}`, borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Recent reports</div>
          {reports.length === 0 ? (
            <div style={{ fontSize: 13, color: C.t3 }}>No nightly coaching reports stored yet.</div>
          ) : (
            reports.slice(0, 5).map((report, index) => (
              <div key={report.id || index} style={{ padding: "12px 0", borderBottom: index === Math.min(reports.length, 5) - 1 ? "none" : `1px solid ${C.rs}` }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{report.title || report.week_label || "Coaching report"}</div>
                <div style={{ fontSize: 13, color: C.t2, marginTop: 4 }}>{report.summary || report.body || "No summary provided."}</div>
                <div style={{ fontSize: 12, color: C.t3, marginTop: 6 }}>{report.created_at ? new Date(report.created_at).toLocaleString() : "—"}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
