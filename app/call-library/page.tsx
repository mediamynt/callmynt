"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { queryWithFallback, TABLES } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { C } from "@/lib/constants";
import { EmptyState, ErrorState, PageSkeleton } from "@/components/shared/States";

type CallRecord = {
  id: string;
  course_id?: string | null;
  disposition?: string | null;
  direction?: string | null;
  spoke_to?: string | null;
  duration_seconds?: number | null;
  started_at?: string | null;
  status?: string | null;
};

type RecordingRecord = {
  call_id: string;
  storage_path?: string | null;
  transcription_status?: string | null;
  analysis_status?: string | null;
};

type TranscriptRecord = {
  call_id: string;
  full_text?: string | null;
};

type AnalysisRecord = {
  call_id: string;
  overall_score?: number | null;
  next_step?: string | null;
};

export default function CallLibraryPage() {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [courseNames, setCourseNames] = useState<Record<string, string>>({});
  const [recordings, setRecordings] = useState<Record<string, RecordingRecord>>({});
  const [transcripts, setTranscripts] = useState<Record<string, TranscriptRecord>>({});
  const [analysis, setAnalysis] = useState<Record<string, AnalysisRecord>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const callsResult = await queryWithFallback<CallRecord[]>(TABLES.calls, async (table) => {
      const query = await supabase
        .from(table)
        .select("*")
        .order("created_at", { ascending: false });
      return { data: query.data || [], error: query.error, count: null };
    });

    if (callsResult.error) {
      setError(callsResult.error.message || "Failed to load call library.");
      setLoading(false);
      return;
    }

    const callRows = (callsResult.data || []).filter((call) => call.id);
    setCalls(callRows);

    const courseIds = [...new Set(callRows.map((call) => call.course_id).filter(Boolean))] as string[];
    const callIds = callRows.map((call) => call.id);

    const [coursesResult, recordingsResult, transcriptsResult, analysisResult] = await Promise.all([
      courseIds.length > 0
        ? queryWithFallback<any[]>(TABLES.courses, async (table) => {
            const query = await supabase.from(table).select("id, name").in("id", courseIds);
            return { data: query.data || [], error: query.error, count: null };
          })
        : Promise.resolve({ data: [], error: null, count: null, table: null }),
      callIds.length > 0
        ? queryWithFallback<RecordingRecord[]>(TABLES.recordings, async (table) => {
            const query = await supabase.from(table).select("*").in("call_id", callIds);
            return { data: query.data || [], error: query.error, count: null };
          })
        : Promise.resolve({ data: [], error: null, count: null, table: null }),
      callIds.length > 0
        ? queryWithFallback<TranscriptRecord[]>(TABLES.transcripts, async (table) => {
            const query = await supabase.from(table).select("*").in("call_id", callIds);
            return { data: query.data || [], error: query.error, count: null };
          })
        : Promise.resolve({ data: [], error: null, count: null, table: null }),
      callIds.length > 0
        ? queryWithFallback<AnalysisRecord[]>(TABLES.analysis, async (table) => {
            const query = await supabase.from(table).select("call_id, overall_score, next_step").in("call_id", callIds);
            return { data: query.data || [], error: query.error, count: null };
          })
        : Promise.resolve({ data: [], error: null, count: null, table: null }),
    ]);

    setCourseNames(Object.fromEntries((coursesResult.data || []).map((course) => [course.id, course.name])));
    setRecordings(Object.fromEntries((recordingsResult.data || []).map((row) => [row.call_id, row])));
    setTranscripts(Object.fromEntries((transcriptsResult.data || []).map((row) => [row.call_id, row])));
    setAnalysis(Object.fromEntries((analysisResult.data || []).map((row) => [row.call_id, row])));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    return calls.filter((call) => {
      const transcript = transcripts[call.id]?.full_text || "";
      const haystack = [
        courseNames[call.course_id || ""],
        call.disposition,
        call.direction,
        call.spoke_to,
        call.status,
        transcript,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [calls, courseNames, search, transcripts]);

  if (loading) return <PageSkeleton lines={6} />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <div style={{ padding: "24px 28px", height: "100%", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Call library</div>
          <div style={{ fontSize: 14, color: C.t2, marginTop: 2 }}>{filtered.length} recorded calls</div>
        </div>
        <input
          type="text"
          placeholder="Search calls, transcripts..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{ padding: "10px 16px", borderRadius: 12, border: `1.5px solid ${C.bd}`, width: 320, fontSize: 14 }}
        />
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: C.bg, border: `1px solid ${C.bd}`, borderRadius: 14 }}>
          <EmptyState title="No calls recorded yet" detail="Once recordings land from the Mac Mini pipeline, playback, transcripts, and AI scores will appear here." />
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {filtered.map((call) => {
            const score = analysis[call.id]?.overall_score;
            const recording = recordings[call.id];
            const transcript = transcripts[call.id];

            return (
              <div key={call.id} style={{ background: C.bg, border: `1px solid ${C.bd}`, borderRadius: 14, padding: "16px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>
                      {courseNames[call.course_id || ""] || "Unknown course"}
                    </div>
                    <div style={{ fontSize: 13, color: C.t2, marginTop: 4 }}>
                      {[call.direction || "outbound", call.disposition || call.status || "Unknown status", `${call.duration_seconds || 0}s`].join(" · ")}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, color: C.t3 }}>{call.started_at ? new Date(call.started_at).toLocaleString() : "—"}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: score && score >= 85 ? C.grn : score && score >= 70 ? C.amb : C.t3, marginTop: 4 }}>
                      {typeof score === "number" ? `${score}/100` : "Pending"}
                    </div>
                  </div>
                </div>

                {recording?.storage_path ? (
                  <audio controls preload="none" style={{ width: "100%", marginTop: 12 }}>
                    <source src={recording.storage_path} />
                  </audio>
                ) : (
                  <div style={{ marginTop: 12, fontSize: 12, color: C.t3 }}>
                    Recording not available yet.
                  </div>
                )}

                <div style={{ marginTop: 10, fontSize: 12, color: C.t3 }}>
                  Transcript: {recording?.transcription_status || "pending"} · AI: {recording?.analysis_status || "pending"}
                </div>
                {transcript?.full_text ? (
                  <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.65, color: C.t2, whiteSpace: "pre-wrap" }}>
                    {transcript.full_text}
                  </div>
                ) : (
                  <div style={{ marginTop: 10, fontSize: 13, color: C.t3 }}>
                    {recording?.transcription_status === "pending" ? "Transcribing..." : "No transcript saved."}
                  </div>
                )}
                {analysis[call.id]?.next_step ? (
                  <div style={{ marginTop: 10, fontSize: 13, color: C.bT }}>
                    Next step: {analysis[call.id].next_step}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
