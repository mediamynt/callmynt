"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { C } from "@/lib/constants";
import { PageSkeleton, ErrorState } from "@/components/shared/States";

const STG = {
  cold_list: { l: "Cold list", c: C.t3, bg: C.rs, bd: C.bd, ic: "📞" },
  buyer_identified: { l: "Buyer ID'd", c: C.bT, bg: C.bD, bd: C.bB, ic: "🎯" },
  sending_sample: { l: "Sent", c: C.pT, bg: C.pD, bd: C.pB, ic: "📦" },
  sample_follow_up: { l: "Follow up", c: C.oT, bg: C.oD, bd: C.oB, ic: "🔥" },
  first_order: { l: "Ordered", c: C.gT, bg: C.gD, bd: C.gB, ic: "✅" },
  reorder: { l: "Reorder", c: "#0E7490", bg: "#ECFEFF", bd: "#A5F3FC", ic: "🔄" },
} as const;

type Course = {
  id: string;
  name: string;
  course_type?: string | null;
  city?: string | null;
  state?: string | null;
  buyer_name?: string | null;
  buyer_title?: string | null;
  pipeline_stage?: keyof typeof STG;
  main_phone?: string | null;
  pro_shop_phone?: string | null;
  next_follow_up_at?: string | null;
  total_attempts?: number | null;
  last_call_disposition?: string | null;
};

type TodayStats = {
  callsMade: number;
  connects: number;
  talkMinutes: number;
  callbacksScheduled: number;
};

function StageBadge({ stage }: { stage: string }) {
  const s = STG[stage as keyof typeof STG] || STG.cold_list;
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999,
      background: s.bg, color: s.c, border: `1px solid ${s.bd}`,
    }}>
      {s.l}
    </span>
  );
}

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.bd}`, borderRadius: 14, overflow: "hidden" }}>
      <div style={{ padding: "16px 18px", borderBottom: `1px solid ${C.rs}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 16, fontWeight: 600 }}>{title}</span>
        {action}
      </div>
      {children}
    </div>
  );
}

function CourseRow({ course, overdue = false }: { course: Course; overdue?: boolean }) {
  const phone = course.buyer_name ? course.main_phone : course.pro_shop_phone || course.main_phone;
  return (
    <Link href={`/courses/${course.id}`} style={{
      display: "flex", alignItems: "center", gap: 16, padding: "14px 18px",
      borderBottom: `1px solid ${C.rs}`, textDecoration: "none", color: C.t1,
      background: overdue ? "#FEF2F2" : undefined,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: overdue ? C.red : C.grn,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, flexShrink: 0,
      }}>
        {overdue ? "⚠️" : "📞"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {course.name}
        </div>
        <div style={{ fontSize: 12, color: C.t3, marginTop: 3, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span>{[course.city, course.state].filter(Boolean).join(", ")}</span>
          {course.buyer_name && <span style={{ color: C.blu }}>👤 {course.buyer_name} {course.buyer_title && `(${course.buyer_title})`}</span>}
          {phone && <span style={{ fontFamily: "'JetBrains Mono',monospace" }}>{phone}</span>}
        </div>
      </div>
      <StageBadge stage={course.pipeline_stage || "cold_list"} />
      {course.total_attempts !== undefined && (
        <span style={{ fontSize: 12, color: C.t3, fontFamily: "'JetBrains Mono',monospace", width: 40, textAlign: "right" }}>
          {course.total_attempts} 📞
        </span>
      )}
    </Link>
  );
}

export default function DashboardPage() {
  const [callbacks, setCallbacks] = useState<Course[]>([]);
  const [overdue, setOverdue] = useState<Course[]>([]);
  const [freshLeads, setFreshLeads] = useState<Course[]>([]);
  const [stats, setStats] = useState<TodayStats>({ callsMade: 0, connects: 0, talkMinutes: 0, callbacksScheduled: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    const today = new Date().toISOString().split("T")[0];
    const agentId = "agent-1"; // TODO: Get from auth context

    try {
      // Get today's callbacks (next_follow_up_at is today or earlier, not completed)
      const { data: callbackData, error: callbackErr } = await supabase
        .from("callmynt_courses")
        .select("*")
        .not("next_follow_up_at", "is", null)
        .lte("next_follow_up_at", `${today}T23:59:59`)
        .order("next_follow_up_at", { ascending: true })
        .limit(20);

      if (callbackErr) throw callbackErr;

      // Split into overdue vs today
      const now = new Date();
      const overdueItems: Course[] = [];
      const todayItems: Course[] = [];
      (callbackData || []).forEach((c: Course) => {
        const followUp = new Date(c.next_follow_up_at || "");
        if (followUp < new Date(today)) overdueItems.push(c);
        else todayItems.push(c);
      });

      setOverdue(overdueItems);
      setCallbacks(todayItems);

      // Get fresh leads (courses in agent's campaigns, never contacted)
      const { data: freshData, error: freshErr } = await supabase
        .from("campaign_queue")
        .select("course_id, campaign:campaign_id(name)")
        .eq("status", "queued")
        .order("created_at", { ascending: false })
        .limit(10);

      if (freshErr) throw freshErr;

      if (freshData && freshData.length > 0) {
        const courseIds = freshData.map((q: { course_id: string }) => q.course_id);
        const { data: coursesData } = await supabase
          .from("callmynt_courses")
          .select("*")
          .in("id", courseIds);
        setFreshLeads(coursesData || []);
      }

      // Get today's stats (fetch all and filter in memory due to UUID type mismatch)
      const todayStart = `${today}T00:00:00`;
      const { data: callsData, error: callsErr } = await supabase
        .from("calls")
        .select("status, duration_seconds, disposition, agent_id")
        .gte("started_at", todayStart);

      if (callsErr) throw callsErr;

      const calls = (callsData || []).filter((c: any) => c.agent_id === agentId || !c.agent_id);
      const connects = calls.filter((c: { status: string }) => ["answered", "completed", "wrap_up"].includes(c.status)).length;
      const totalSeconds = calls.reduce((sum: number, c: { duration_seconds: number }) => sum + (c.duration_seconds || 0), 0);
      const callbacksScheduled = calls.filter((c: { disposition: string }) => c.disposition === "Call back").length;

      setStats({
        callsMade: calls.length,
        connects,
        talkMinutes: Math.round(totalSeconds / 60),
        callbacksScheduled,
      });

    } catch (err: any) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (loading) return <PageSkeleton lines={8} />;
  if (error) return <ErrorState message={error} onRetry={() => void loadDashboard()} />;

  const totalQueue = overdue.length + callbacks.length + freshLeads.length;

  return (
    <div style={{ padding: "24px 28px", height: "100%", overflowY: "auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Today's Queue</div>
          <div style={{ fontSize: 14, color: C.t2, marginTop: 2 }}>
            {totalQueue} courses ready to dial
          </div>
        </div>
        <Link href="/dialer" style={{
          padding: "12px 24px", borderRadius: 12, background: C.grn, color: "white",
          fontSize: 14, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8,
        }}>
          ▶️ Start Dialing
        </Link>
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Calls Today", value: stats.callsMade.toString(), color: C.t1 },
          { label: "Connects", value: stats.connects.toString(), color: C.grn },
          { label: "Talk Time", value: `${stats.talkMinutes}m`, color: C.blu },
          { label: "Callbacks Set", value: stats.callbacksScheduled.toString(), color: C.amb },
        ].map((stat) => (
          <div key={stat.label} style={{ background: C.bg, border: `1px solid ${C.bd}`, borderRadius: 14, padding: "16px 20px" }}>
            <div style={{ fontSize: 11, color: C.t3, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{stat.label}</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 26, fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Queue Sections */}
      <div style={{ display: "grid", gap: 16 }}>
        {/* Overdue Callbacks */}
        {overdue.length > 0 && (
          <Card title={`⚠️ Overdue Callbacks (${overdue.length})`} action={<span style={{ color: C.red, fontSize: 12, fontWeight: 600 }}>Priority</span>}>
            {overdue.map((course) => <CourseRow key={course.id} course={course} overdue />)}
          </Card>
        )}

        {/* Today's Callbacks */}
        {callbacks.length > 0 && (
          <Card title={`📞 Callbacks Due Today (${callbacks.length})`}>
            {callbacks.map((course) => <CourseRow key={course.id} course={course} />)}
          </Card>
        )}

        {/* Fresh Leads */}
        {freshLeads.length > 0 && (
          <Card title={`✨ Fresh Leads (${freshLeads.length})`}>
            {freshLeads.map((course) => <CourseRow key={course.id} course={course} />)}
          </Card>
        )}

        {totalQueue === 0 && (
          <div style={{ background: C.sf, border: `1px dashed ${C.bd}`, borderRadius: 14, padding: "40px 20px", textAlign: "center", color: C.t3 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎉</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.t1, marginBottom: 8 }}>All caught up!</div>
            <div>No callbacks due today. Check your campaigns for new leads to dial.</div>
          </div>
        )}
      </div>
    </div>
  );
}
