"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { C } from "@/lib/constants";
import { PageSkeleton, ErrorState, EmptyState } from "@/components/shared/States";
import { useToast } from "@/components/providers/ToastProvider";

type ScriptSection = {
  id: string;
  title: string;
  content: string;
  order_index: number;
};

type Script = {
  id: string;
  name: string;
  description?: string;
  campaign_id: string;
  sections: ScriptSection[];
  created_at: string;
  updated_at: string;
};

type Campaign = {
  id: string;
  name: string;
  pipeline_stage: string;
};

function ScriptCard({ 
  script, 
  campaign, 
  onEdit, 
  onDelete 
}: { 
  script: Script; 
  campaign?: Campaign; 
  onEdit: (s: Script) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.bd}`, borderRadius: 14, overflow: "hidden" }}>
      <div style={{ padding: "16px 18px", borderBottom: `1px solid ${C.rs}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>{script.name}</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => onEdit(script)}
              style={{
                padding: "6px 12px", borderRadius: 8, background: C.sf,
                border: `1px solid ${C.bd}`, fontSize: 13, cursor: "pointer",
              }}
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(script.id)}
              style={{
                padding: "6px 12px", borderRadius: 8, background: "#FEF2F2",
                border: `1px solid ${C.bd}`, fontSize: 13, cursor: "pointer", color: C.red,
              }}
            >
              Delete
            </button>
          </div>
        </div>
        {campaign && (
          <div style={{ fontSize: 12, color: C.t3, marginTop: 4 }}>
            Used by: <span style={{ color: C.blu }}>{campaign.name}</span>
          </div>
        )}
        {script.description && (
          <div style={{ fontSize: 13, color: C.t2, marginTop: 8 }}>{script.description}</div>
        )}
      </div>
      <div style={{ padding: "12px 18px", background: C.sf }}>
        <div style={{ fontSize: 12, color: C.t3, marginBottom: 8 }}>
          {script.sections?.length || 0} sections
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {script.sections?.slice(0, 3).map((section) => (
            <div key={section.id} style={{ fontSize: 13, color: C.t2 }}>
              • {section.title}
            </div>
          ))}
          {(script.sections?.length || 0) > 3 && (
            <div style={{ fontSize: 12, color: C.t3 }}>+{script.sections.length - 3} more</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScriptEditorModal({ 
  script, 
  campaigns, 
  onSave, 
  onClose 
}: { 
  script: Script | null;
  campaigns: Campaign[];
  onSave: (s: Partial<Script>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(script?.name || "");
  const [description, setDescription] = useState(script?.description || "");
  const [campaignId, setCampaignId] = useState(script?.campaign_id || "");
  const [sections, setSections] = useState<ScriptSection[]>(script?.sections || [
    { id: "1", title: "Opening", content: "", order_index: 0 },
    { id: "2", title: "Qualification", content: "", order_index: 1 },
    { id: "3", title: "Objection Handler", content: "", order_index: 2 },
    { id: "4", title: "Close", content: "", order_index: 3 },
  ]);

  const addSection = () => {
    const newSection: ScriptSection = {
      id: Date.now().toString(),
      title: "New Section",
      content: "",
      order_index: sections.length,
    };
    setSections([...sections, newSection]);
  };

  const updateSection = (id: string, field: keyof ScriptSection, value: string) => {
    setSections(sections.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id).map((s, i) => ({ ...s, order_index: i })));
  };

  const handleSave = () => {
    onSave({
      id: script?.id,
      name,
      description,
      campaign_id: campaignId,
      sections: sections.map((s, i) => ({ ...s, order_index: i })),
    });
    onClose();
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 20,
    }}>
      <div style={{
        background: C.bg, borderRadius: 16, width: "100%", maxWidth: 700,
        maxHeight: "90vh", overflow: "auto", display: "flex", flexDirection: "column",
      }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.rs}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>{script ? "Edit Script" : "New Script"}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: C.t3, marginBottom: 6 }}>Script Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Utah Municipal - Cold Call"
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10,
                border: `1px solid ${C.bd}`, fontSize: 14,
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, color: C.t3, marginBottom: 6 }}>Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this script..."
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10,
                border: `1px solid ${C.bd}`, fontSize: 14,
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, color: C.t3, marginBottom: 6 }}>Campaign (optional)</label>
            <select
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10,
                border: `1px solid ${C.bd}`, fontSize: 14, background: C.bg,
              }}
            >
              <option value="">— Select a campaign —</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: C.t3 }}>Script Sections</label>
              <button
                onClick={addSection}
                style={{
                  padding: "6px 12px", borderRadius: 8, background: C.grn, color: "white",
                  border: "none", fontSize: 12, cursor: "pointer",
                }}
              >
                + Add Section
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {sections.map((section, index) => (
                <div key={section.id} style={{ background: C.sf, borderRadius: 10, padding: 16, border: `1px solid ${C.bd}` }}>
                  <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => updateSection(section.id, "title", e.target.value)}
                      placeholder="Section title"
                      style={{
                        flex: 1, padding: "8px 12px", borderRadius: 8,
                        border: `1px solid ${C.bd}`, fontSize: 14, fontWeight: 600,
                      }}
                    />
                    <button
                      onClick={() => removeSection(section.id)}
                      style={{
                        padding: "8px 12px", borderRadius: 8, background: "#FEF2F2",
                        border: `1px solid ${C.bd}`, cursor: "pointer", color: C.red,
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  <textarea
                    value={section.content}
                    onChange={(e) => updateSection(section.id, "content", e.target.value)}
                    placeholder="Enter script content here..."
                    rows={4}
                    style={{
                      width: "100%", padding: "10px 14px", borderRadius: 8,
                      border: `1px solid ${C.bd}`, fontSize: 14, resize: "vertical",
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.rs}`, display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px", borderRadius: 10, background: C.sf,
              border: `1px solid ${C.bd}`, fontSize: 14, cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            style={{
              padding: "10px 24px", borderRadius: 10, background: C.grn, color: "white",
              border: "none", fontSize: 14, fontWeight: 600, cursor: name.trim() ? "pointer" : "not-allowed",
              opacity: name.trim() ? 1 : 0.5,
            }}
          >
            Save Script
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { pushToast } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Load scripts
      const { data: scriptsData, error: scriptsErr } = await supabase
        .from("scripts")
        .select("*")
        .order("updated_at", { ascending: false });

      if (scriptsErr) throw scriptsErr;

      setScripts(scriptsData || []);

      // Load campaigns for assignment
      const { data: campaignsData, error: campaignsErr } = await supabase
        .from("campaigns")
        .select("id, name, pipeline_stage");

      if (campaignsErr) throw campaignsErr;

      setCampaigns(campaignsData || []);

    } catch (err: any) {
      setError(err.message || "Failed to load scripts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSave = async (scriptData: Partial<Script>) => {
    try {
      const sectionsWithIds = scriptData.sections?.map((s, i) => ({
        ...s,
        id: s.id || `section_${Date.now()}_${i}`,
      })) || [];

      const payload = {
        name: scriptData.name,
        description: scriptData.description,
        campaign_id: scriptData.campaign_id || null,
        sections: sectionsWithIds,
      };

      if (scriptData.id) {
        // Update existing
        const { error } = await supabase
          .from("scripts")
          .update(payload)
          .eq("id", scriptData.id);

        if (error) throw error;
        pushToast({ title: 'Script updated successfully', tone: 'success' });
      } else {
        // Create new
        const { error } = await supabase
          .from("scripts")
          .insert(payload);

        if (error) throw error;
        pushToast({ title: 'Script created successfully', tone: 'success' });
      }

      await loadData();
    } catch (err: any) {
      pushToast({ title: 'Failed to save script', detail: err.message, tone: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this script?")) return;

    try {
      const { error } = await supabase
        .from("scripts")
        .delete()
        .eq("id", id);

      if (error) throw error;
      pushToast({ title: 'Script deleted', tone: 'success' });
      await loadData();
    } catch (err: any) {
      pushToast({ title: 'Failed to delete script', detail: err.message, tone: 'error' });
    }
  };

  if (loading) return <PageSkeleton lines={4} />;
  if (error) return <ErrorState message={error} onRetry={() => void loadData()} />;

  return (
    <div style={{ padding: "24px 28px", height: "100%", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Campaign Scripts</div>
          <div style={{ fontSize: 14, color: C.t2, marginTop: 2 }}>
            Create and manage scripts for different campaigns and personas
          </div>
        </div>
        <button
          onClick={() => { setIsCreating(true); setEditingScript(null); }}
          style={{
            padding: "12px 20px", borderRadius: 12, background: C.grn, color: "white",
            fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 8,
          }}
        >
          + New Script
        </button>
      </div>

      {scripts.length === 0 ? (
        <EmptyState
          title="No scripts yet"
          detail="Create your first script to guide reps through calls"
          action={
            <button
              onClick={() => { setIsCreating(true); setEditingScript(null); }}
              style={{
                marginTop: 16,
                padding: "12px 20px",
                borderRadius: 12,
                background: C.grn,
                color: "white",
                fontSize: 14,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
              }}
            >
              + Create Script
            </button>
          }
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
          {scripts.map((script) => (
            <ScriptCard
              key={script.id}
              script={script}
              campaign={campaigns.find(c => c.id === script.campaign_id)}
              onEdit={(s) => { setEditingScript(s); setIsCreating(false); }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {(isCreating || editingScript) && (
        <ScriptEditorModal
          script={editingScript}
          campaigns={campaigns}
          onSave={handleSave}
          onClose={() => { setIsCreating(false); setEditingScript(null); }}
        />
      )}
    </div>
  );
}
