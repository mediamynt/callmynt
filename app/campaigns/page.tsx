"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  fetchCampaignsWithCounts,
  fetchCoursesForSelection,
  insertWithFallback,
  parseCsvRows,
  queryWithFallback,
  TABLES,
  deleteWithFallback,
  updateWithFallback,
  normalizePhone,
} from "@/lib/data";
import { supabase } from "@/lib/supabase";

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

const STG = {
  cold_list: { l: "Cold list", c: C.t3, bg: C.rs, bd: C.bd, ic: "📞" },
  buyer_identified: { l: "Buyer ID'd", c: C.bT, bg: C.bD, bd: C.bB, ic: "🎯" },
  sending_sample: { l: "Sent", c: C.pT, bg: C.pD, bd: C.pB, ic: "📦" },
  sample_follow_up: { l: "Follow up", c: C.oT, bg: C.oD, bd: C.oB, ic: "🔥" },
  first_order: { l: "Ordered", c: C.gT, bg: C.gD, bd: C.gB, ic: "✅" },
  reorder: { l: "Reorder", c: "#0E7490", bg: "#ECFEFF", bd: "#A5F3FC", ic: "🔄" },
} as const;

type Campaign = {
  id: string;
  name: string;
  pipeline_stage: keyof typeof STG;
  dialer_mode: string;
  parallel_lines: number | null;
  status: string;
  script?: unknown;
  caller_id_pool?: string[] | null;
  course_count?: number;
  created_at?: string;
};

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
  pro_shop_phone?: string | null;
};

type CampaignForm = {
  name: string;
  pipeline_stage: keyof typeof STG;
  dialer_mode: string;
  parallel_lines: number;
  status: string;
  caller_id_pool: string;
  script_json: string;
};

const EMPTY_FORM: CampaignForm = {
  name: "",
  pipeline_stage: "cold_list",
  dialer_mode: "power",
  parallel_lines: 1,
  status: "active",
  caller_id_pool: "",
  script_json: "",
};

function M({ children, c, s = 13 }: { children: React.ReactNode; c?: string; s?: number }) {
  return (
    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: s, fontWeight: 600, color: c || C.t1 }}>
      {children}
    </span>
  );
}

function Cd({ children, s = {} }: { children: React.ReactNode; s?: React.CSSProperties }) {
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.bd}`, borderRadius: 14, padding: "16px 18px", ...s }}>
      {children}
    </div>
  );
}

function Pl({ sg }: { sg: keyof typeof STG | string }) {
  const m = STG[sg as keyof typeof STG] || STG.cold_list;
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: 999,
        background: m.bg,
        color: m.c,
        border: `1px solid ${m.bd}`,
        whiteSpace: "nowrap",
      }}
    >
      {m.l}
    </span>
  );
}

function Btn({
  children,
  primary,
  danger,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  primary?: boolean;
  danger?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: primary ? "14px 24px" : "10px 18px",
        borderRadius: 12,
        border: primary || danger ? "none" : `1.5px solid ${C.bd}`,
        background: disabled ? C.rs : danger ? C.red : primary ? C.grn : C.bg,
        color: primary || danger ? "white" : disabled ? C.t3 : C.t1,
        fontSize: 14,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "'DM Sans',sans-serif",
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

function parseCallerIds(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function campaignToForm(campaign: Campaign): CampaignForm {
  return {
    name: campaign.name,
    pipeline_stage: campaign.pipeline_stage || "cold_list",
    dialer_mode: campaign.dialer_mode || "power",
    parallel_lines: campaign.parallel_lines || 1,
    status: campaign.status || "active",
    caller_id_pool: (campaign.caller_id_pool || []).join(", "),
    script_json: campaign.script ? JSON.stringify(campaign.script, null, 2) : "",
  };
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [form, setForm] = useState<CampaignForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [stageFilter, setStageFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [buyerFilter, setBuyerFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set());
  const [csvSummary, setCsvSummary] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);

    const [campaignResult, courseResult] = await Promise.all([
      fetchCampaignsWithCounts(),
      fetchCoursesForSelection(),
    ]);

    if (campaignResult.error) {
      setError(campaignResult.error.message || "Failed to load campaigns.");
    } else {
      const items = campaignResult.data as Campaign[];
      setCampaigns(items);
      if (!selectedCampaign && items.length > 0) {
        setSelectedCampaign(items[0]);
        setForm(campaignToForm(items[0]));
      }
    }

    if (courseResult.error) {
      setError(courseResult.error.message || "Failed to load courses.");
    } else {
      setCourses((courseResult.data as Course[]) || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const states = useMemo(
    () =>
      [...new Set(courses.map((course) => course.state).filter((value): value is string => Boolean(value)))].sort(),
    [courses]
  );
  const types = useMemo(
    () =>
      [...new Set(courses.map((course) => course.course_type).filter((value): value is string => Boolean(value)))].sort(),
    [courses]
  );

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesStage = stageFilter === "all" || course.pipeline_stage === stageFilter;
      const matchesState = stateFilter === "all" || course.state === stateFilter;
      const matchesType = typeFilter === "all" || course.course_type === typeFilter;
      const matchesBuyer =
        buyerFilter === "all" ||
        (buyerFilter === "yes" ? Boolean(course.buyer_name) : !course.buyer_name);
      const haystack = [
        course.name,
        course.city,
        course.state,
        course.buyer_name,
        course.main_phone,
        course.pro_shop_phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = haystack.includes(search.toLowerCase());
      return matchesStage && matchesState && matchesType && matchesBuyer && matchesSearch;
    });
  }, [buyerFilter, courses, search, stageFilter, stateFilter, typeFilter]);

  function updateForm<K extends keyof CampaignForm>(key: K, value: CampaignForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function selectCampaign(campaign: Campaign) {
    setSelectedCampaign(campaign);
    setForm(campaignToForm(campaign));
    setMessage(null);
    setError(null);
    setSelectedCourseIds(new Set());
    setCsvSummary(null);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError("Campaign name is required.");
      return;
    }

    let scriptValue: unknown = null;
    if (form.script_json.trim()) {
      try {
        scriptValue = JSON.parse(form.script_json);
      } catch {
        setError("Script JSON is invalid.");
        return;
      }
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    const payload = {
      name: form.name.trim(),
      pipeline_stage: form.pipeline_stage,
      dialer_mode: form.dialer_mode,
      parallel_lines: form.parallel_lines,
      status: form.status,
      caller_id_pool: parseCallerIds(form.caller_id_pool),
      script: scriptValue,
    };

    const result = selectedCampaign
      ? await updateWithFallback<Campaign[]>(
          TABLES.campaigns,
          selectedCampaign.id,
          payload
        )
      : await insertWithFallback<Campaign[]>(TABLES.campaigns, payload);

    if (result.error) {
      setError(result.error.message || "Failed to save campaign.");
      setSaving(false);
      return;
    }

    await loadData();
    if (!selectedCampaign && Array.isArray(result.data) && result.data[0]) {
      setSelectedCampaign(result.data[0] as Campaign);
    }
    setMessage(selectedCampaign ? "Campaign updated." : "Campaign created.");
    setSaving(false);
  }

  async function handleDelete() {
    if (!selectedCampaign) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    const result = await deleteWithFallback(TABLES.campaigns, selectedCampaign.id);
    if (result.error) {
      setError(result.error.message || "Failed to delete campaign.");
      setSaving(false);
      return;
    }

    setSelectedCampaign(null);
    setForm(EMPTY_FORM);
    setSelectedCourseIds(new Set());
    setCsvSummary(null);
    await loadData();
    setMessage("Campaign deleted.");
    setSaving(false);
  }

  async function addCoursesToCampaign(courseIds: string[]) {
    if (!selectedCampaign || courseIds.length === 0) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    const existingQuery = await supabase
      .from("campaign_queue")
      .select("course_id, position")
      .eq("campaign_id", selectedCampaign.id);

    if (existingQuery.error) {
      setError(existingQuery.error.message || "Failed to read campaign queue.");
      setSaving(false);
      return;
    }

    const existingIds = new Set((existingQuery.data || []).map((item) => item.course_id));
    const lastPosition = Math.max(0, ...(existingQuery.data || []).map((item) => item.position || 0));
    const newIds = courseIds.filter((id) => !existingIds.has(id));

    if (newIds.length === 0) {
      setMessage("All selected courses are already in the queue.");
      setSaving(false);
      return;
    }

    const payload = newIds.map((courseId, index) => ({
      campaign_id: selectedCampaign.id,
      course_id: courseId,
      position: lastPosition + index + 1,
      status: "queued",
      priority: 0,
      attempts: 0,
    }));

    const insertResult = await insertWithFallback(TABLES.queue, payload);
    if (insertResult.error) {
      setError(insertResult.error.message || "Failed to add courses to campaign.");
      setSaving(false);
      return;
    }

    await loadData();
    const updatedSelected = campaigns.find((item) => item.id === selectedCampaign.id) || selectedCampaign;
    setSelectedCampaign(updatedSelected);
    setSelectedCourseIds(new Set());
    setMessage(`Added ${newIds.length} course${newIds.length === 1 ? "" : "s"} to the queue.`);
    setSaving(false);
  }

  async function handleCsvUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const text = await file.text();
    const rows = parseCsvRows(text);
    if (rows.length === 0) {
      setError("CSV file was empty.");
      return;
    }

    const [header, ...body] = rows;
    const looksLikeHeader = header.some((value) => /id|name|phone/i.test(value));
    const dataRows = looksLikeHeader ? body : rows;

    const byId = new Map(courses.map((course) => [course.id, course]));
    const byPhone = new Map(
      courses.flatMap((course) =>
        [course.main_phone, course.pro_shop_phone]
          .filter(Boolean)
          .map((phone) => [normalizePhone(phone), course] as const)
      )
    );
    const byName = new Map(courses.map((course) => [course.name.toLowerCase(), course]));

    const matchedIds = new Set<string>();
    let misses = 0;

    for (const row of dataRows) {
      const [first = "", second = "", third = ""] = row;
      const candidates = [first, second, third].filter(Boolean);
      let match: Course | undefined;

      for (const candidate of candidates) {
        match =
          byId.get(candidate) ||
          byPhone.get(normalizePhone(candidate)) ||
          byName.get(candidate.toLowerCase());
        if (match) {
          matchedIds.add(match.id);
          break;
        }
      }

      if (!match) {
        misses += 1;
      }
    }

    setSelectedCourseIds(new Set(matchedIds));
    setCsvSummary(`CSV matched ${matchedIds.size} course${matchedIds.size === 1 ? "" : "s"}${misses ? `, ${misses} row${misses === 1 ? "" : "s"} not found` : ""}.`);
  }

  if (loading) {
    return (
      <div style={{ padding: "24px 28px" }}>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Campaigns</div>
        <div style={{ color: C.t3 }}>Loading campaigns and course database...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 28px", height: "100%", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Campaigns</div>
          <div style={{ fontSize: 14, color: C.t2, marginTop: 2 }}>
            <M s={14}>{campaigns.length}</M> active records, fully wired to <code>campaigns</code> and <code>campaign_queue</code>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn
            onClick={() => {
              setSelectedCampaign(null);
              setForm(EMPTY_FORM);
              setSelectedCourseIds(new Set());
              setCsvSummary(null);
              setMessage(null);
              setError(null);
            }}
          >
            New campaign
          </Btn>
          <Btn
            primary
            onClick={handleSave}
            disabled={saving}
          >
            {selectedCampaign ? "Save campaign" : "Create campaign"}
          </Btn>
        </div>
      </div>

      {(message || error) && (
        <div
          style={{
            marginBottom: 16,
            padding: "12px 16px",
            borderRadius: 12,
            border: `1px solid ${error ? C.rB : C.gB}`,
            background: error ? C.rD : C.gD,
            color: error ? C.rT : C.gT,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {error || message}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 18, alignItems: "start" }}>
        <Cd s={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 18px", borderBottom: `1px solid ${C.bd}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.t3, textTransform: "uppercase" }}>
              Campaign list
            </div>
          </div>
          {campaigns.length === 0 ? (
            <div style={{ padding: "36px 20px", textAlign: "center", color: C.t3 }}>
              No campaigns yet. Create your first campaign and start queuing courses.
            </div>
          ) : (
            campaigns.map((campaign) => (
              <button
                key={campaign.id}
                onClick={() => selectCampaign(campaign)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: selectedCampaign?.id === campaign.id ? C.gD : C.bg,
                  border: "none",
                  borderBottom: `1px solid ${C.rs}`,
                  cursor: "pointer",
                  padding: "16px 18px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: C.t1 }}>{campaign.name}</span>
                  <Pl sg={campaign.pipeline_stage} />
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 12, color: C.t2 }}>
                  <span>{campaign.dialer_mode}</span>
                  <span>{campaign.status}</span>
                  <span>
                    <M s={12}>{campaign.course_count || 0}</M> queued
                  </span>
                </div>
              </button>
            ))
          )}
        </Cd>

        <div style={{ display: "grid", gap: 18 }}>
          <Cd>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.t2, marginBottom: 6 }}>Campaign name</div>
                <input
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  placeholder="e.g. Cold List — Utah Q2"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: `1.5px solid ${C.bd}`,
                    fontSize: 15,
                    fontFamily: "'DM Sans',sans-serif",
                    color: C.t1,
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.t2, marginBottom: 6 }}>Status</div>
                <select
                  value={form.status}
                  onChange={(event) => updateForm("status", event.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: `1.5px solid ${C.bd}`,
                    fontSize: 14,
                    background: C.bg,
                  }}
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.t2, marginBottom: 6 }}>Pipeline stage</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {Object.entries(STG).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => updateForm("pipeline_stage", key as keyof typeof STG)}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: `1.5px solid ${form.pipeline_stage === key ? value.bd : C.bd}`,
                        background: form.pipeline_stage === key ? value.bg : C.bg,
                        color: form.pipeline_stage === key ? value.c : C.t3,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {value.ic} {value.l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.t2, marginBottom: 6 }}>Dialer mode</div>
                <div style={{ display: "grid", gap: 8 }}>
                  {[
                    ["power", "Power", "Auto-advance through queue"],
                    ["preview", "Preview", "Rep sees each contact first"],
                    ["parallel", "Parallel", "Multiple lines at once"],
                  ].map(([value, label, copy]) => (
                    <button
                      key={value}
                      onClick={() => updateForm("dialer_mode", value)}
                      style={{
                        textAlign: "left",
                        padding: "12px 14px",
                        borderRadius: 12,
                        border: `1.5px solid ${form.dialer_mode === value ? C.bB : C.bd}`,
                        background: form.dialer_mode === value ? C.bD : C.bg,
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 700, color: form.dialer_mode === value ? C.bT : C.t1 }}>
                        {label}
                      </div>
                      <div style={{ fontSize: 12, color: C.t3, marginTop: 2 }}>{copy}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.t2, marginBottom: 6 }}>Parallel lines</div>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={form.parallel_lines}
                  onChange={(event) => updateForm("parallel_lines", Number(event.target.value) || 1)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: `1.5px solid ${C.bd}`,
                    fontSize: 15,
                    fontFamily: "'JetBrains Mono',monospace",
                    color: C.t1,
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.t2, marginBottom: 6 }}>
                  Caller ID pool
                </div>
                <input
                  value={form.caller_id_pool}
                  onChange={(event) => updateForm("caller_id_pool", event.target.value)}
                  placeholder="+18015550111, +14355550111"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: `1.5px solid ${C.bd}`,
                    fontSize: 15,
                    fontFamily: "'DM Sans',sans-serif",
                    color: C.t1,
                  }}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.t2, marginBottom: 6 }}>Script JSON</div>
                <textarea
                  value={form.script_json}
                  onChange={(event) => updateForm("script_json", event.target.value)}
                  placeholder='{"opening":"Hi, this is Alex from BYRDGANG..."}'
                  rows={6}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: `1.5px solid ${C.bd}`,
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono',monospace",
                    color: C.t1,
                    resize: "vertical",
                  }}
                />
              </div>
            </div>

            {selectedCampaign && (
              <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13, color: C.t2 }}>
                  Queue currently has <M s={13}>{selectedCampaign.course_count || 0}</M> course
                  {(selectedCampaign.course_count || 0) === 1 ? "" : "s"}.
                </div>
                <Btn danger onClick={handleDelete} disabled={saving}>
                  Delete campaign
                </Btn>
              </div>
            )}
          </Cd>

          <Cd>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Add courses to campaign</div>
                <div style={{ fontSize: 13, color: C.t2, marginTop: 2 }}>
                  Filter the course database or import a CSV list, then push matches into <code>campaign_queue</code>.
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <label
                  style={{
                    padding: "10px 18px",
                    borderRadius: 12,
                    border: `1.5px solid ${C.bd}`,
                    background: C.bg,
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Upload CSV
                  <input type="file" accept=".csv,text/csv" onChange={handleCsvUpload} style={{ display: "none" }} />
                </label>
                <Btn
                  primary
                  disabled={!selectedCampaign || selectedCourseIds.size === 0 || saving}
                  onClick={() => addCoursesToCampaign(Array.from(selectedCourseIds))}
                >
                  Add {selectedCourseIds.size} selected
                </Btn>
              </div>
            </div>

            {csvSummary && (
              <div
                style={{
                  marginBottom: 14,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: C.bD,
                  border: `1px solid ${C.bB}`,
                  color: C.bT,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {csvSummary}
              </div>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, city, buyer, phone..."
                style={{
                  minWidth: 260,
                  flex: "1 1 260px",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: `1.5px solid ${C.bd}`,
                  fontSize: 14,
                }}
              />
              <select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)} style={{ padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.bd}` }}>
                <option value="all">All stages</option>
                {Object.entries(STG).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.l}
                  </option>
                ))}
              </select>
              <select value={stateFilter} onChange={(event) => setStateFilter(event.target.value)} style={{ padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.bd}` }}>
                <option value="all">All states</option>
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} style={{ padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.bd}` }}>
                <option value="all">All types</option>
                {types.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <select value={buyerFilter} onChange={(event) => setBuyerFilter(event.target.value)} style={{ padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.bd}` }}>
                <option value="all">Buyer: any</option>
                <option value="yes">Has buyer</option>
                <option value="no">No buyer</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 13, color: C.t2 }}>
                <M s={13}>{filteredCourses.length}</M> matching courses
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn onClick={() => setSelectedCourseIds(new Set(filteredCourses.map((course) => course.id)))}>
                  Select all
                </Btn>
                <Btn onClick={() => setSelectedCourseIds(new Set())}>Clear</Btn>
              </div>
            </div>

            <Cd s={{ padding: 0, overflow: "hidden" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "42px 2fr 120px 120px 1fr 80px",
                  padding: "12px 20px",
                  borderBottom: `1px solid ${C.bd}`,
                  fontSize: 11,
                  color: C.t3,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  fontWeight: 700,
                  background: C.sf,
                }}
              >
                <span></span>
                <span>Course</span>
                <span>Stage</span>
                <span>Type</span>
                <span>Buyer</span>
                <span>Attempts</span>
              </div>

              <div style={{ maxHeight: 460, overflowY: "auto" }}>
                {filteredCourses.map((course) => {
                  const selected = selectedCourseIds.has(course.id);
                  return (
                    <button
                      key={course.id}
                      onClick={() =>
                        setSelectedCourseIds((current) => {
                          const next = new Set(current);
                          if (next.has(course.id)) {
                            next.delete(course.id);
                          } else {
                            next.add(course.id);
                          }
                          return next;
                        })
                      }
                      style={{
                        width: "100%",
                        textAlign: "left",
                        display: "grid",
                        gridTemplateColumns: "42px 2fr 120px 120px 1fr 80px",
                        padding: "12px 20px",
                        border: "none",
                        borderBottom: `1px solid ${C.rs}`,
                        alignItems: "center",
                        fontSize: 14,
                        cursor: "pointer",
                        background: selected ? C.gD : C.bg,
                      }}
                    >
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 6,
                          border: `2px solid ${selected ? C.grn : C.bd}`,
                          background: selected ? C.grn : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: 12,
                        }}
                      >
                        {selected ? "✓" : ""}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: C.t1 }}>{course.name}</div>
                        <div style={{ fontSize: 12, color: C.t3 }}>
                          {[course.city, course.state, course.main_phone].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <Pl sg={course.pipeline_stage || "cold_list"} />
                      <span style={{ color: C.t2 }}>{course.course_type || "—"}</span>
                      <span style={{ color: course.buyer_name ? C.t1 : C.t3 }}>{course.buyer_name || "—"}</span>
                      <M s={13} c={C.t2}>
                        {course.total_attempts || 0}
                      </M>
                    </button>
                  );
                })}
              </div>
            </Cd>
          </Cd>
        </div>
      </div>
    </div>
  );
}
