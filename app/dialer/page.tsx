'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { queryWithFallback, TABLES } from '@/lib/data';
import { C, STG, DGK, DBY, DFU, DSH } from '@/lib/constants';
import { formatDisplayPhone } from '@/lib/callmynt-shared';
import { useCall } from '@/components/CallProvider';
import { SampleModal } from '@/components/modals/SampleModal';
import { OrderModal } from '@/components/modals/OrderModal';
import { useToast } from '@/components/providers/ToastProvider';
import { CourseDetailPanel } from '@/components/CourseDetailPanel';

type Campaign = {
  id: string;
  name: string;
  pipeline_stage: string;
  dialer_mode: string;
  course_count: number;
};

function I({ children, s = 20, k = C.t2, w = 2 }: { children: React.ReactNode; s?: number; k?: string; w?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={k} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">{children}</svg>;
}

function M({ children, c, s = 13 }: { children: React.ReactNode; c?: string; s?: number }) {
  return <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: s, fontWeight: 600, color: c || C.t1 }}>{children}</span>;
}

function Pl({ sg }: { sg?: string | null }) {
  const stage = STG[sg || 'cold_list'] || STG.cold_list;
  return <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: stage.bg, color: stage.c, border: `1px solid ${stage.bd}`, whiteSpace: 'nowrap' }}>{stage.l}</span>;
}

function Btn({ children, onClick, primary, danger, disabled }: { children: React.ReactNode; onClick?: () => void; primary?: boolean; danger?: boolean; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: primary ? '12px 18px' : '10px 16px',
        borderRadius: 12,
        border: primary || danger ? 'none' : `1.5px solid ${C.bd}`,
        background: disabled ? C.ac : danger ? C.red : primary ? C.grn : C.bg,
        color: primary || danger ? 'white' : C.t1,
        fontSize: 14,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: "'DM Sans',sans-serif",
      }}
    >
      {children}
    </button>
  );
}

function CircleButton({ children, label, danger, active, onClick }: { children: React.ReactNode; label: string; danger?: boolean; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: danger ? C.red : active ? C.bD : C.sf, border: `1.5px solid ${danger ? C.red : active ? C.bB : C.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: danger ? 'white' : active ? C.blu : C.t2 }}>
        {children}
      </div>
      <span style={{ fontSize: 11, color: danger ? C.red : C.t3, fontWeight: 500 }}>{label}</span>
    </button>
  );
}

function fmt(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function ScriptPanel({ script, expandedSections, onToggleSection }: { 
  script: { name: string; sections: Array<{ id: string; title: string; content: string }> } | null;
  expandedSections: string[];
  onToggleSection: (id: string) => void;
}) {
  if (!script) {
    return (
      <div style={{ background: C.sf, borderRadius: 12, padding: 16, border: `1px solid ${C.bd}`, marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Script</div>
        <div style={{ fontSize: 13, color: C.t3 }}>No script assigned to this campaign</div>
      </div>
    );
  }

  return (
    <div style={{ background: C.sf, borderRadius: 12, border: `1px solid ${C.bd}`, marginBottom: 16, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.bd}`, background: C.bg }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Script</div>
        <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{script.name}</div>
      </div>
      <div style={{ maxHeight: 200, overflowY: 'auto' }}>
        {script.sections.map((section) => {
          const isExpanded = expandedSections.includes(section.id);
          return (
            <div key={section.id} style={{ borderBottom: `1px solid ${C.rs}` }}>
              <button
                onClick={() => onToggleSection(section.id)}
                style={{
                  width: '100%', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600 }}>{section.title}</span>
                <span style={{ fontSize: 12, color: C.t3 }}>{isExpanded ? '▼' : '▶'}</span>
              </button>
              {isExpanded && (
                <div style={{ padding: '0 16px 12px', fontSize: 13, color: C.t2, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {section.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DialerPage() {
  const {
    phase,
    status,
    queue,
    currentIndex,
    currentCourse,
    currentCallId,
    currentCallerId,
    callDuration,
    isMuted,
    notes,
    disposition,
    mode,
    dtmfDigits,
    quickCapture,
    error,
    phoneLabel,
    displayPhone,
    localTimeLabel,
    clearError,
    prepareCampaign,
    startDialing,
    pauseDialer,
    resumeDialer,
    endCall,
    mute,
    holdCall,
    transferCall,
    sendDigits,
    setNotes,
    setDisposition,
    submitDisposition,
    skipCurrent,
    setMode,
    setQuickCaptureField,
    saveQuickCapture,
    saveIvrShortcut,
  } = useCall();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [showDialpad, setShowDialpad] = useState(false);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [submittingSample, setSubmittingSample] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [script, setScript] = useState<{ name: string; sections: Array<{ id: string; title: string; content: string }> } | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [dialingStatus, setDialingStatus] = useState<string | null>(null);
  const { pushToast } = useToast();

  useEffect(() => {
    async function loadCampaigns() {
      setLoadingCampaigns(true);
      const { data } = await supabase
        .from('campaigns')
        .select('id, name, pipeline_stage, dialer_mode')
        .eq('status', 'active');

      if (data) {
        const withCounts = await Promise.all(
          data.map(async (campaign) => {
            const { count } = await supabase
              .from('campaign_queue')
              .select('*', { count: 'exact', head: true })
              .eq('campaign_id', campaign.id)
              .in('status', ['queued', 'retry', 'paused', 'ready']);
            return { ...campaign, course_count: count || 0 };
          }),
        );
        setCampaigns(withCounts);
      }

      setLoadingCampaigns(false);
    }

    void loadCampaigns();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const tag = (event.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (event.target as HTMLElement)?.isContentEditable) return;
      if (event.key.toLowerCase() === 'p' && phase === 'CONNECTED') {
        event.preventDefault();
        setShowDialpad((value) => !value);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase]);

  const dispositions = useMemo(() => {
    if (!currentCourse) return DSH;
    if (currentCourse.pipeline_stage === 'sample_follow_up' || currentCourse.pipeline_stage === 'sending_sample') return DFU;
    return mode === 'gatekeeper' ? DGK : DBY;
  }, [currentCourse, mode]) as Array<{ l: string; c: string; a: string; p?: number }>;

  const nextQueue = queue.slice(currentIndex, currentIndex + 6);
  const quickIvrButtons = [
    { digit: quickCapture.ivr_pro_shop_key || '2', label: 'Pro Shop' },
    { digit: '0', label: 'Operator' },
    { digit: '1', label: 'Tee Times' },
  ];

  async function handleChooseCampaign(campaign: Campaign) {
    setSelectedCampaign(campaign);
    
    // Load script for this campaign (non-blocking — don't let script errors break dialing)
    try {
      const { data: scriptData } = await supabase
        .from('scripts')
        .select('name, sections')
        .eq('campaign_id', campaign.id)
        .maybeSingle();
      
      if (scriptData) {
        setScript(scriptData);
        if (scriptData.sections?.length > 0) {
          setExpandedSections([scriptData.sections[0].id]);
        }
      } else {
        setScript(null);
      }
    } catch {
      // Scripts table may not exist yet — that's fine, dialer still works
      setScript(null);
    }
    
    await prepareCampaign(campaign);
  }

  async function handleDialNextNow() {
    await submitDisposition();
    if (queue[currentIndex + 1]) {
      await startDialing();
    }
  }

  async function handleVmDrop() {
    setDisposition('Left VM');
    await endCall();
  }

  function toggleScriptSection(sectionId: string) {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  }

  async function handleSampleSubmit(payload: { sz: string; cl: string; ad: string }) {
    if (!currentCourse) return;
    setSubmittingSample(true);
    try {
      const response = await fetch('/api/samples/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: currentCourse.id,
          callId: currentCallId,
          agentId: 'agent-1',
          buyerName: quickCapture.buyer_name || currentCourse.buyer_name || '',
          size: payload.sz,
          color: payload.cl,
          address: payload.ad,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Failed to create sample.');
      setShowSampleModal(false);
      setDisposition('Sending sample');
      pushToast({ title: 'Sample order created', detail: body.order?.orderNumber || undefined, tone: 'success' });
      await endCall();
    } catch (error) {
      pushToast({ title: 'Failed to create sample', detail: error instanceof Error ? error.message : 'Unknown error', tone: 'error' });
    } finally {
      setSubmittingSample(false);
    }
  }

  async function handleOrderSubmit(payload: { product: string; color: string; sizes: Record<string, number>; paymentTerms: string }) {
    if (!currentCourse) return;
    const quantity = Object.values(payload.sizes).reduce((sum, value) => sum + value, 0);
    if (!quantity) return;
    setSubmittingOrder(true);
    try {
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: currentCourse.id,
          callId: currentCallId,
          agentId: 'agent-1',
          buyerName: quickCapture.buyer_name || currentCourse.buyer_name || '',
          shippingAddress: '',
          paymentTerms: payload.paymentTerms,
          lineItems: [{
            title: payload.product,
            color: payload.color,
            quantity,
            price: 25,
            sizes: payload.sizes,
          }],
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Failed to create order.');
      setShowOrderModal(false);
      setDisposition('Placing order!');
      pushToast({ title: 'Wholesale order created', detail: body.shopify?.orderNumber || undefined, tone: 'success' });
      await endCall();
    } catch (error) {
      pushToast({ title: 'Failed to create order', detail: error instanceof Error ? error.message : 'Unknown error', tone: 'error' });
    } finally {
      setSubmittingOrder(false);
    }
  }

  async function handleTransfer() {
    const target = window.prompt('Transfer to phone number or client identity');
    if (!target) return;
    await transferCall(target);
  }

  const ErrorBanner = error ? (
    <div style={{ padding: '12px 20px', background: C.rD, border: `1px solid ${C.rB}`, borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 20 }}>🎤</span>
      <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: C.rT }}>{error}</div>
      <button onClick={clearError} style={{ background: 'none', border: 'none', color: C.rT, cursor: 'pointer', fontSize: 16, fontWeight: 600 }}>✕</button>
    </div>
  ) : null;

  if (!selectedCampaign) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 32, textAlign: 'center', background: C.bg }}>
        {ErrorBanner}
        <div style={{ width: 80, height: 80, borderRadius: 24, background: C.gD, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <I s={36} k={C.grn}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></I>
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Ready to dial</div>
        <div style={{ fontSize: 15, color: C.t2, marginBottom: 28, maxWidth: 320 }}>Phase 2 is wired to the real Twilio dialer flow. Select a campaign to load the queue.</div>
        <div style={{ width: '100%', maxWidth: 460, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {campaigns.map((campaign) => (
            <button key={campaign.id} onClick={() => void handleChooseCampaign(campaign)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderRadius: 14, border: `1.5px solid ${C.bd}`, background: C.bg, cursor: 'pointer', textAlign: 'left', width: '100%' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: STG[campaign.pipeline_stage]?.bg || C.sf, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                {STG[campaign.pipeline_stage]?.l || 'Campaign'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{campaign.name}</div>
                <div style={{ fontSize: 13, color: C.t3, marginTop: 2 }}>{campaign.course_count} courses · {campaign.dialer_mode}</div>
              </div>
              <I s={16} k={C.t3}><polyline points="9 18 15 12 9 6" /></I>
            </button>
          ))}
          {loadingCampaigns && <div style={{ color: C.t3, padding: 20 }}>Loading campaigns...</div>}
          {!loadingCampaigns && campaigns.length === 0 && <div style={{ color: C.t3, padding: 20 }}>No active campaigns found.</div>}
        </div>
      </div>
    );
  }

  if (phase === 'READY') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: 32, textAlign: 'center', background: C.bg }}>
        {ErrorBanner}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: status === 'ready' ? C.grn : status === 'offline' ? C.red : C.amb }} />
          <span style={{ fontSize: 12, color: C.t3 }}>Phone: {status === 'ready' ? 'Connected' : status === 'offline' ? 'Disconnected — check browser console' : status}</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.t3, textTransform: 'uppercase', marginBottom: 8 }}>Campaign loaded</div>
        <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{selectedCampaign.name}</div>
        <div style={{ fontSize: 15, color: C.t2, marginBottom: 24 }}>{queue.length} courses · {selectedCampaign.dialer_mode} dialing</div>
        <div style={{ width: '100%', maxWidth: 420, background: C.sf, borderRadius: 14, border: `1px solid ${C.bd}`, padding: '12px 0', marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.t3, textTransform: 'uppercase', padding: '0 16px 10px', borderBottom: `1px solid ${C.bd}` }}>Queue preview</div>
          {nextQueue.map((item, index) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: index < nextQueue.length - 1 ? `1px solid ${C.rs}` : 'none' }}>
              <M s={14} c={C.t3}>{index + 1}</M>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{item.course.name}</div>
                <div style={{ fontSize: 12, color: C.t3 }}>{item.course.buyer_name || 'Unknown buyer'}</div>
              </div>
              <Pl sg={item.course.pipeline_stage} />
            </div>
          ))}
        </div>
        {dialingStatus && (
          <div style={{ marginBottom: 16, padding: '10px 20px', borderRadius: 10, background: dialingStatus.startsWith('Error') ? C.rD : C.bD, color: dialingStatus.startsWith('Error') ? C.rT : C.bT, fontSize: 13, fontWeight: 600 }}>
            {dialingStatus}
          </div>
        )}
        <button onClick={async () => {
          try {
            setDialingStatus('Requesting mic access...');
            await startDialing();
            setDialingStatus(null);
          } catch (err: any) {
            setDialingStatus(`Error: ${err.message || 'Failed to start dialing'}`);
          }
        }} disabled={!!error || dialingStatus === 'Requesting mic access...'} style={{ padding: '16px 48px', borderRadius: 14, background: error ? C.ac : C.grn, border: 'none', color: 'white', fontSize: 16, fontWeight: 700, cursor: error ? 'not-allowed' : 'pointer', boxShadow: error ? 'none' : '0 4px 16px rgba(16,185,129,0.25)', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <I s={20} k="white" w={2.5}><polygon points="5 3 19 12 5 21 5 3" /></I>
          {dialingStatus === 'Requesting mic access...' ? 'Starting...' : 'Start Dialing'}
        </button>
        <button onClick={() => setSelectedCampaign(null)} style={{ marginTop: 16, background: 'none', border: 'none', color: C.t3, fontSize: 14, cursor: 'pointer', textDecoration: 'underline' }}>Change campaign</button>
      </div>
    );
  }

  if (phase === 'DIALING' || phase === 'RINGING') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '200px minmax(0,1fr) 260px', height: '100vh', overflow: 'hidden', background: C.bg }}>
        {/* Left: Queue */}
        <div style={{ background: C.sf, borderRight: `1px solid ${C.bd}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '8px 12px', borderBottom: `1px solid ${C.bd}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedCampaign.name}</div>
            <M s={11} c={C.t3}>{Math.max(queue.length - currentIndex - 1, 0)}</M>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {queue.slice(currentIndex).map((item, index) => (
              <div key={item.id} style={{ padding: '6px 10px', borderBottom: `1px solid ${C.rs}`, background: index === 0 ? C.bD : 'transparent', borderLeft: index === 0 ? `3px solid ${C.blu}` : '3px solid transparent' }}>
                <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.course.name}</div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 2 }}>
                  <Pl sg={item.course.pipeline_stage} />
                  {index === 0 && <span style={{ fontSize: 10, fontWeight: 600, color: C.blu }}>{phase === 'RINGING' ? 'RINGING' : 'DIALING'}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Status bar + notes area for prep */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flexShrink: 0, padding: '6px 16px', borderBottom: `1px solid ${C.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: phase === 'RINGING' ? C.gD : C.bD }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: phase === 'RINGING' ? C.gT : C.bT }}>{phase === 'RINGING' ? 'Ringing' : 'Dialing'}...</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{currentCourse?.name}</span>
              <span style={{ fontSize: 12, color: C.t3 }}>{displayPhone}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn onClick={() => void pauseDialer()}>Pause</Btn>
              <Btn danger onClick={() => void endCall()}>Stop</Btn>
            </div>
          </div>
          {ErrorBanner}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Prep Notes</div>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Prep notes while it rings..." style={{ width: '100%', minHeight: 120, padding: 12, background: C.sf, border: `1px solid ${C.bd}`, borderRadius: 12, color: C.t1, fontFamily: "'DM Sans',sans-serif", fontSize: 13, lineHeight: 1.6, resize: 'vertical', outline: 'none' }} />
          </div>
        </div>

        {/* Right: Full course detail panel for prep */}
        <div style={{ background: C.sf, borderLeft: `1px solid ${C.bd}`, overflow: 'hidden' }}>
          {currentCourse && <CourseDetailPanel courseId={currentCourse.id} />}
        </div>
      </div>
    );
  }

  if (phase === 'CONNECTED' && currentCourse) {
    const showGateToggle = currentCourse.pipeline_stage === 'cold_list' || currentCourse.pipeline_stage === 'buyer_identified';
    const callerDisplay = currentCallerId ? formatDisplayPhone(currentCallerId) : process.env.NEXT_PUBLIC_TWILIO_PHONE || '(801) 555-9999';

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '200px minmax(0,1fr) 260px', height: '100vh', overflow: 'hidden', background: C.bg }}>
        <div style={{ background: C.sf, borderRight: `1px solid ${C.bd}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '8px 12px', borderBottom: `1px solid ${C.bd}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedCampaign.name}</div>
            <M s={11} c={C.t3}>{Math.max(queue.length - currentIndex - 1, 0)}</M>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {queue.slice(currentIndex).map((item, index) => (
              <div key={item.id} style={{ padding: '6px 10px', borderBottom: `1px solid ${C.rs}`, background: index === 0 ? C.gD : 'transparent', borderLeft: index === 0 ? `3px solid ${C.grn}` : '3px solid transparent' }}>
                <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.course.name}</div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 2 }}>
                  <Pl sg={item.course.pipeline_stage} />
                  {index === 0 && <M s={11} c={C.grn}>{fmt(callDuration)}</M>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Compact call header - single line */}
          <div style={{ flexShrink: 0, padding: '6px 16px', borderBottom: `1px solid ${C.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentCourse.name}</span>
              <Pl sg={currentCourse.pipeline_stage} />
              <span style={{ fontSize: 11, color: C.t3, whiteSpace: 'nowrap' }}>{displayPhone}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              {showGateToggle && (
                <div style={{ display: 'flex', background: C.rs, borderRadius: 8, padding: 2, gap: 2 }}>
                  {(['gatekeeper', 'buyer'] as const).map((value) => (
                    <button key={value} onClick={() => setMode(value)} style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', background: mode === value ? (value === 'buyer' ? C.gD : C.aD) : 'transparent', color: mode === value ? (value === 'buyer' ? C.gT : C.aT) : C.t3 }}>
                      {value === 'gatekeeper' ? 'Gate' : 'Buyer'}
                    </button>
                  ))}
                </div>
              )}
              <M c={C.grn} s={16}>{fmt(callDuration)}</M>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.grn }} />
            </div>
          </div>

          <div style={{ flexShrink: 0, padding: '8px 20px', background: C.bD, borderBottom: `1px solid ${C.bB}`, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.bT }}>IVR:</span>
            {quickIvrButtons.map((item) => (
              <button key={`${item.digit}-${item.label}`} onClick={() => sendDigits(item.digit)} style={{ padding: '5px 14px', borderRadius: 8, background: C.bg, border: `1.5px solid ${C.bB}`, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: C.bT, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>{item.digit}</span>
                {item.label}
              </button>
            ))}
            <button onClick={() => setShowDialpad(true)} style={{ background: 'none', border: 'none', color: C.bT, fontSize: 12, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Full dialpad</button>
            {dtmfDigits && <span style={{ fontSize: 12, color: C.bT }}>Sent: <M s={12} c={C.bT}>{dtmfDigits}</M></span>}
          </div>

          {mode === 'gatekeeper' && (
            <div style={{ flexShrink: 0, padding: '8px 20px', background: C.aD, borderBottom: `1px solid ${C.aB}`, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.aT, whiteSpace: 'nowrap' }}>Quick capture:</span>
              <input value={quickCapture.buyer_name} onChange={(event) => setQuickCaptureField('buyer_name', event.target.value)} onBlur={() => void saveQuickCapture()} placeholder="Buyer name" style={{ flex: 1, minWidth: 120, padding: '6px 10px', borderRadius: 8, border: `1.5px solid ${C.aB}`, fontSize: 13, background: C.bg, color: C.t1 }} />
              <input value={quickCapture.buyer_title} onChange={(event) => setQuickCaptureField('buyer_title', event.target.value)} onBlur={() => void saveQuickCapture()} placeholder="Title" style={{ width: 120, padding: '6px 10px', borderRadius: 8, border: `1.5px solid ${C.aB}`, fontSize: 13, background: C.bg, color: C.t1 }} />
              <input value={quickCapture.buyer_direct_phone} onChange={(event) => setQuickCaptureField('buyer_direct_phone', event.target.value)} onBlur={() => void saveQuickCapture()} placeholder="Direct #" style={{ width: 120, padding: '6px 10px', borderRadius: 8, border: `1.5px solid ${C.aB}`, fontSize: 13, background: C.bg, color: C.t1 }} />
              <input value={quickCapture.ivr_direct_extension} onChange={(event) => setQuickCaptureField('ivr_direct_extension', event.target.value)} onBlur={() => void saveQuickCapture()} placeholder="Ext" style={{ width: 80, padding: '6px 10px', borderRadius: 8, border: `1.5px solid ${C.aB}`, fontSize: 13, background: C.bg, color: C.t1 }} />
              <input value={quickCapture.best_time_to_reach} onChange={(event) => setQuickCaptureField('best_time_to_reach', event.target.value)} onBlur={() => void saveQuickCapture()} placeholder="Best time" style={{ width: 110, padding: '6px 10px', borderRadius: 8, border: `1.5px solid ${C.aB}`, fontSize: 13, background: C.bg, color: C.t1 }} />
              <button onClick={() => void saveQuickCapture()} style={{ padding: '6px 14px', borderRadius: 8, background: C.amb, border: 'none', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Save</button>
            </div>
          )}

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            {ErrorBanner}
            <ScriptPanel 
              script={script} 
              expandedSections={expandedSections} 
              onToggleSection={toggleScriptSection} 
            />
            <div style={{ fontSize: 12, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Notes</div>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Type notes..." style={{ width: '100%', minHeight: 120, padding: 12, background: C.sf, border: `1px solid ${C.bd}`, borderRadius: 12, color: C.t1, fontFamily: "'DM Sans',sans-serif", fontSize: 13, lineHeight: 1.6, resize: 'vertical', outline: 'none' }} />

            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Disposition</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dispositions.map((item, index) => (
                  <button key={`${item.l}-${index}`} onClick={() => {
                    if (item.l === 'Sending sample') {
                      setShowSampleModal(true);
                      return;
                    }
                    if (item.l === 'Placing order!') {
                      setShowOrderModal(true);
                      return;
                    }
                    setDisposition(item.l);
                  }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${disposition === item.l ? item.c : item.p ? `${item.c}55` : C.bd}`, background: disposition === item.l ? `${item.c}12` : item.p ? `${item.c}08` : C.bg, color: C.t1, fontSize: 13, cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.c }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{item.l}</div>
                      <div style={{ fontSize: 11, color: C.t3 }}>{item.a}</div>
                    </div>
                    {item.p ? <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, background: `${item.c}18`, color: item.c, fontWeight: 700 }}>WIN</span> : null}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ flexShrink: 0, padding: '14px 24px 16px', background: C.sf, borderTop: `2px solid ${C.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <CircleButton label={isMuted ? 'Unmute' : 'Mute'} active={isMuted} onClick={mute}>
              <I s={20} k={isMuted ? C.blu : C.t2}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /></I>
            </CircleButton>
            <CircleButton label="Hold" onClick={() => void holdCall()}>
              <I s={20} k={C.t2}><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></I>
            </CircleButton>
            <CircleButton label="Transfer" onClick={() => void handleTransfer()}>
              <I s={20} k={C.t2}><path d="M17 3h4v4" /><path d="M21 3l-7 7" /><path d="M7 21H3v-4" /><path d="M3 21l7-7" /></I>
            </CircleButton>
            <CircleButton label="End" danger onClick={() => void endCall()}>
              <I s={22} k="white"><path d="M2 7.5c6-4 14-4 20 0" /><path d="M5 10v5" /><path d="M19 10v5" /></I>
            </CircleButton>
            <CircleButton label="VM Drop" onClick={() => void handleVmDrop()}>
              <I s={20} k={C.t2}><circle cx="6" cy="12" r="3" /><circle cx="18" cy="12" r="3" /><path d="M9 12h6" /></I>
            </CircleButton>
            <CircleButton label="Skip" onClick={() => void skipCurrent('skip')}>
              <I s={20} k={C.t2}><polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" /></I>
            </CircleButton>
          </div>
        </div>

        {/* Right: Full course detail panel */}
        <div style={{ background: C.sf, borderLeft: `1px solid ${C.bd}`, overflow: 'hidden' }}>
          <CourseDetailPanel courseId={currentCourse.id} />
        </div>

        {showDialpad && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div onClick={() => setShowDialpad(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)' }} />
            <div style={{ position: 'relative', background: C.bg, borderRadius: 20, padding: '24px 28px', width: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 16, fontWeight: 700 }}>Dialpad</span>
                <button onClick={() => setShowDialpad(false)} style={{ background: 'none', border: 'none', color: C.t3, fontSize: 18, cursor: 'pointer' }}>✕</button>
              </div>
              {dtmfDigits && <div style={{ background: C.sf, borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontFamily: "'JetBrains Mono',monospace", fontSize: 22, fontWeight: 600, letterSpacing: 4, textAlign: 'center', color: C.t1 }}>{dtmfDigits}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
                  <button key={digit} onClick={() => sendDigits(digit)} style={{ padding: '16px 0', borderRadius: 12, fontSize: 22, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", background: C.sf, border: `1.5px solid ${C.bd}`, color: C.t1, cursor: 'pointer' }}>{digit}</button>
                ))}
              </div>
              <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
                <input value={quickCapture.ivr_pro_shop_key} onChange={(event) => setQuickCaptureField('ivr_pro_shop_key', event.target.value)} placeholder="Pro shop shortcut" style={{ padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.bd}`, fontSize: 13 }} />
                <input value={quickCapture.ivr_notes} onChange={(event) => setQuickCaptureField('ivr_notes', event.target.value)} placeholder="IVR notes" style={{ padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.bd}`, fontSize: 13 }} />
                <Btn primary onClick={() => void saveIvrShortcut()}>Save shortcut</Btn>
                <button onClick={() => setShowDialpad(false)} style={{ width: '100%', padding: '10px', borderRadius: 10, background: C.sf, border: `1px solid ${C.bd}`, color: C.t2, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (phase === 'WRAP-UP') {
    return (
      <>
      <div style={{ display: 'grid', gridTemplateColumns: '200px minmax(0,1fr) 260px', height: '100vh', overflow: 'hidden', background: C.bg }}>
        {/* Left: Queue */}
        <div style={{ background: C.sf, borderRight: `1px solid ${C.bd}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '8px 12px', borderBottom: `1px solid ${C.bd}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedCampaign.name}</div>
            <M s={11} c={C.t3}>{Math.max(queue.length - currentIndex - 1, 0)}</M>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {queue.slice(currentIndex).map((item, index) => (
              <div key={item.id} style={{ padding: '6px 10px', borderBottom: `1px solid ${C.rs}`, background: index === 0 ? C.aD : 'transparent', borderLeft: index === 0 ? `3px solid ${C.amb}` : '3px solid transparent' }}>
                <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.course.name}</div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 2 }}>
                  <Pl sg={item.course.pipeline_stage} />
                  {index === 0 && <span style={{ fontSize: 10, fontWeight: 600, color: C.amb }}>WRAP-UP</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Notes + Disposition */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header - call ended banner */}
          <div style={{ flexShrink: 0, padding: '10px 20px', borderBottom: `1px solid ${C.bd}`, background: C.aD }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: C.t3 }}>{currentCourse.state || 'US'}</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{currentCourse?.name || 'Unknown'}</span>
                    {currentCourse && <Pl sg={currentCourse.pipeline_stage} />}
                  </div>
                  <div style={{ fontSize: 12, color: C.aT }}>{quickCapture.buyer_name || currentCourse?.buyer_name || 'Unknown buyer'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.aT, padding: '4px 10px', background: C.bg, borderRadius: 8 }}>Call Ended · {fmt(callDuration)}</span>
              </div>
            </div>
          </div>

          {/* Notes + Disposition area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            {ErrorBanner}

            {/* Notes */}
            <div style={{ fontSize: 12, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Notes</div>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Type notes about this call..." style={{ width: '100%', minHeight: 120, padding: 12, background: C.sf, border: `1px solid ${C.bd}`, borderRadius: 12, color: C.t1, fontFamily: "'DM Sans',sans-serif", fontSize: 13, lineHeight: 1.6, resize: 'vertical', outline: 'none' }} />

            {/* Disposition */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Disposition</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dispositions.map((item, index) => (
                  <button key={`${item.l}-${index}`} onClick={() => {
                    if (item.l === 'Sending sample') { setShowSampleModal(true); return; }
                    if (item.l === 'Placing order!') { setShowOrderModal(true); return; }
                    setDisposition(item.l);
                  }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${disposition === item.l ? item.c : item.p ? `${item.c}55` : C.bd}`, background: disposition === item.l ? `${item.c}12` : item.p ? `${item.c}08` : C.bg, color: C.t1, fontSize: 13, cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.c }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{item.l}</div>
                      <div style={{ fontSize: 11, color: C.t3 }}>{item.a}</div>
                    </div>
                    {item.p ? <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, background: `${item.c}18`, color: item.c, fontWeight: 700 }}>WIN</span> : null}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom action bar */}
          <div style={{ flexShrink: 0, padding: '14px 24px 16px', background: C.sf, borderTop: `2px solid ${C.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <Btn primary onClick={() => void handleDialNextNow()} disabled={!disposition}>Dial Next →</Btn>
            <Btn onClick={() => void pauseDialer()}>Pause</Btn>
            <Btn onClick={() => setSelectedCampaign(null)}>End Session</Btn>
          </div>
        </div>

        {/* Right: Full course detail panel */}
        <div style={{ background: C.sf, borderLeft: `1px solid ${C.bd}`, overflow: 'hidden' }}>
          {currentCourse && <CourseDetailPanel courseId={currentCourse.id} />}
        </div>
      </div>
      {showSampleModal && currentCourse ? (
        <SampleModal
          c={{ n: currentCourse.name, b: quickCapture.buyer_name || currentCourse.buyer_name || undefined, bs: undefined, ct: '' }}
          onClose={() => setShowSampleModal(false)}
          onDone={(payload) => void handleSampleSubmit(payload)}
          submitting={submittingSample}
        />
      ) : null}
      {showOrderModal && currentCourse ? (
        <OrderModal
          c={{ n: currentCourse.name, b: quickCapture.buyer_name || currentCourse.buyer_name || undefined }}
          onClose={() => setShowOrderModal(false)}
          onDone={(payload) => void handleOrderSubmit(payload)}
          submitting={submittingOrder}
        />
      ) : null}
      </>
    );
  }

  if (phase === 'PAUSED') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: 32, textAlign: 'center', background: C.bg }}>
        {ErrorBanner}
        <div style={{ fontSize: 13, fontWeight: 600, color: C.t3, textTransform: 'uppercase', marginBottom: 8 }}>Dialer paused</div>
        <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>{selectedCampaign.name}</div>
        <div style={{ fontSize: 15, color: C.t2, marginBottom: 22 }}>Position {Math.min(currentIndex + 1, queue.length)} of {queue.length}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn primary onClick={() => void resumeDialer()}>Resume</Btn>
          <Btn onClick={() => setSelectedCampaign(null)}>End session</Btn>
        </div>
      </div>
    );
  }

  if (phase === 'COMPLETE') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: 32, textAlign: 'center', background: C.bg }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: C.gD, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
          <I s={32} k={C.grn}><polyline points="20 6 9 17 4 12" /></I>
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Campaign complete</div>
        <div style={{ fontSize: 15, color: C.t2, marginBottom: 20 }}>{selectedCampaign.name} is exhausted.</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn primary onClick={() => setSelectedCampaign(null)}>Start another campaign</Btn>
          <Btn onClick={() => void queryWithFallback(TABLES.queue, async (table) => supabase.from(table).update({ status: 'queued' }).eq('campaign_id', selectedCampaign.id).eq('status', 'completed'))}>Re-queue unanswered</Btn>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: C.t3 }}>
      Loading dialer...
    </div>
  );
}
