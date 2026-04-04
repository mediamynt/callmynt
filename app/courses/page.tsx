"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const C = {
  bg: "#FFFFFF",
  sf: "#F7F8FB",
  rs: "#EFF1F6",
  bd: "#E2E5ED",
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
  pur: "#8B5CF6",
  pD: "#F5F3FF",
  pB: "#DDD6FE",
  pT: "#5B21B6",
  org: "#F97316",
  oD: "#FFF7ED",
  oB: "#FED7AA",
  oT: "#9A3412",
};

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
  pipeline_stage?: keyof typeof STG;
  total_attempts?: number | null;
  main_phone?: string | null;
};

const PAGE_SIZE = 50;

function Pl({ sg }: { sg: string }) {
  const m = STG[sg as keyof typeof STG] || STG.cold_list;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: m.bg, color: m.c, border: `1px solid ${m.bd}` }}>
      {m.l}
    </span>
  );
}

function M({ children, c, s = 13 }: { children: React.ReactNode; c?: string; s?: number }) {
  return (
    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: s, fontWeight: 600, color: c || C.t1 }}>
      {children}
    </span>
  );
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [stageFilter, setStageFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [buyerFilter, setBuyerFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Debounce search
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [search]);

  const fetchCourses = useCallback(async (pageNum: number, reset = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    let query = supabase
      .from("callmynt_courses")
      .select("id, name, course_type, city, state, buyer_name, pipeline_stage, total_attempts, main_phone", { count: "exact" })
      .order("name")
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

    // Server-side filters
    if (stageFilter !== "all") {
      query = query.eq("pipeline_stage", stageFilter);
    }
    if (stateFilter !== "all") {
      query = query.eq("state", stateFilter);
    }
    if (typeFilter !== "all") {
      query = query.eq("course_type", typeFilter);
    }
    if (buyerFilter === "yes") {
      query = query.not("buyer_name", "is", null);
    } else if (buyerFilter === "no") {
      query = query.is("buyer_name", null);
    }
    if (debouncedSearch.length >= 2) {
      query = query.or(`name.ilike.%${debouncedSearch}%,city.ilike.%${debouncedSearch}%,buyer_name.ilike.%${debouncedSearch}%,main_phone.ilike.%${debouncedSearch}%`);
    }

    const { data, count, error } = await query;

    if (!error && data) {
      if (reset) {
        setCourses(data as Course[]);
      } else {
        setCourses(prev => [...prev, ...(data as Course[])]);
      }
      setTotalCount(count || 0);
      setHasMore(data.length === PAGE_SIZE);
      setPage(pageNum);
    }

    setLoading(false);
    setLoadingMore(false);
  }, [stageFilter, stateFilter, typeFilter, buyerFilter, debouncedSearch]);

  // Reset and fetch on filter/search change
  useEffect(() => {
    fetchCourses(0, true);
  }, [fetchCourses]);

  // Infinite scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    function handleScroll() {
      if (!el || loadingMore || !hasMore) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollTop + clientHeight >= scrollHeight - 200) {
        fetchCourses(page + 1);
      }
    }

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [loadingMore, hasMore, page, fetchCourses]);

  // Fetch unique states/types for filter dropdowns (one-time)
  const [states, setStates] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);

  useEffect(() => {
    async function loadFilters() {
      const { data: stData } = await supabase.from("callmynt_courses").select("state").not("state", "is", null);
      const { data: tpData } = await supabase.from("callmynt_courses").select("course_type").not("course_type", "is", null);
      if (stData) setStates([...new Set(stData.map((r: { state: string }) => r.state))].sort());
      if (tpData) setTypes([...new Set(tpData.map((r: { course_type: string }) => r.course_type))].sort());
    }
    loadFilters();
  }, []);

  return (
    <div ref={scrollRef} style={{ padding: "24px 28px", height: "100%", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Golf courses</div>
          <div style={{ fontSize: 14, color: C.t2, marginTop: 2 }}>
            {loading ? "Loading..." : <><M s={14}>{totalCount.toLocaleString()}</M> courses</>}
          </div>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, city, buyer, phone..."
          style={{ width: 300, padding: "10px 16px", borderRadius: 12, border: `1.5px solid ${C.bd}`, fontSize: 14, fontFamily: "'DM Sans',sans-serif" }}
        />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} style={{ padding: "8px 12px", borderRadius: 10, border: `1.5px solid ${C.bd}`, fontFamily: "'DM Sans',sans-serif" }}>
          <option value="all">All stages</option>
          {Object.entries(STG).map(([key, value]) => <option key={key} value={key}>{value.l}</option>)}
        </select>
        <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} style={{ padding: "8px 12px", borderRadius: 10, border: `1.5px solid ${C.bd}`, fontFamily: "'DM Sans',sans-serif" }}>
          <option value="all">All states</option>
          {states.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ padding: "8px 12px", borderRadius: 10, border: `1.5px solid ${C.bd}`, fontFamily: "'DM Sans',sans-serif" }}>
          <option value="all">All types</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={buyerFilter} onChange={(e) => setBuyerFilter(e.target.value)} style={{ padding: "8px 12px", borderRadius: 10, border: `1.5px solid ${C.bd}`, fontFamily: "'DM Sans',sans-serif" }}>
          <option value="all">Buyer: any</option>
          <option value="yes">Has buyer</option>
          <option value="no">No buyer</option>
        </select>
      </div>

      <div style={{ background: C.bg, border: `1px solid ${C.bd}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2.2fr 120px 120px 1fr 80px", padding: "12px 20px", borderBottom: `1px solid ${C.bd}`, fontSize: 11, color: C.t3, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700, background: C.sf }}>
          <span>Course</span>
          <span>Stage</span>
          <span>Type</span>
          <span>Buyer</span>
          <span>Attempts</span>
        </div>

        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "2.2fr 120px 120px 1fr 80px", padding: "14px 20px", borderBottom: `1px solid ${C.rs}`, alignItems: "center" }}>
              <div>
                <div style={{ width: 180, height: 14, background: C.rs, borderRadius: 6 }} />
                <div style={{ width: 120, height: 10, background: C.rs, borderRadius: 4, marginTop: 6 }} />
              </div>
              <div style={{ width: 60, height: 20, background: C.rs, borderRadius: 10 }} />
              <div style={{ width: 50, height: 14, background: C.rs, borderRadius: 4 }} />
              <div style={{ width: 80, height: 14, background: C.rs, borderRadius: 4 }} />
              <div style={{ width: 20, height: 14, background: C.rs, borderRadius: 4 }} />
            </div>
          ))
        ) : (
          <>
            {courses.map((course) => (
              <Link key={course.id} href={`/courses/${course.id}`} style={{ display: "grid", gridTemplateColumns: "2.2fr 120px 120px 1fr 80px", padding: "14px 20px", borderBottom: `1px solid ${C.rs}`, alignItems: "center", fontSize: 14, color: C.t1, textDecoration: "none" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{course.name}</div>
                  <div style={{ fontSize: 12, color: C.t3, marginTop: 3 }}>
                    {[course.city, course.state, course.main_phone].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <Pl sg={course.pipeline_stage || "cold_list"} />
                <span style={{ color: C.t2 }}>{course.course_type || "—"}</span>
                <span style={{ color: course.buyer_name ? C.t1 : C.t3 }}>{course.buyer_name || "—"}</span>
                <M s={13}>{course.total_attempts || 0}</M>
              </Link>
            ))}
            {loadingMore && (
              <div style={{ padding: "16px 20px", textAlign: "center", color: C.t3, fontSize: 13 }}>
                Loading more...
              </div>
            )}
            {!hasMore && courses.length > 0 && (
              <div style={{ padding: "16px 20px", textAlign: "center", color: C.t3, fontSize: 12 }}>
                Showing all {totalCount.toLocaleString()} courses
              </div>
            )}
            {courses.length === 0 && (
              <div style={{ padding: "40px 20px", textAlign: "center", color: C.t3 }}>
                No courses match your filters.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
