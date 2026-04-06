'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { queryWithFallback, TABLES } from '@/lib/data';
import { useToast } from '@/components/providers/ToastProvider';

const C = { bg: "#FFFFFF", sf: "#F7F8FB", rs: "#EFF1F6", hv: "#E6E9F0", ac: "#DDE0E9", bd: "#E2E5ED", bdH: "#CDD1DB", t1: "#1A1D26", t2: "#5C6070", t3: "#9198A8", grn: "#10B981", gD: "#ECFDF5", gB: "#A7F3D0", gT: "#065F46", blu: "#3B82F6", bD: "#EFF6FF", bB: "#BFDBFE", bT: "#1E40AF", amb: "#F59E0B", aD: "#FFFBEB", aB: "#FDE68A", aT: "#92400E", red: "#EF4444", rD: "#FEF2F2", rB: "#FECACA", rT: "#991B1B", pur: "#8B5CF6", pD: "#F5F3FF", pB: "#DDD6FE", pT: "#5B21B6", org: "#F97316", oD: "#FFF7ED", oB: "#FED7AA", oT: "#9A3412" };

const STG: Record<string, { l: string; c: string; bg: string; bd: string }> = {
  cold_list: { l: "Cold list", c: C.t3, bg: C.rs, bd: C.bd },
  buyer_identified: { l: "Buyer ID'd", c: C.bT, bg: C.bD, bd: C.bB },
  sending_sample: { l: "Sent", c: C.pT, bg: C.pD, bd: C.pB },
  sample_follow_up: { l: "Follow up", c: C.oT, bg: C.oD, bd: C.oB },
  first_order: { l: "Ordered", c: C.gT, bg: C.gD, bd: C.gB },
  reorder: { l: "Reorder", c: "#0E7490", bg: "#ECFEFF", bd: "#A5F3FC" }
};

interface Course {
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
}

interface Call {
  id: string;
  disposition?: string | null;
  spoke_to?: string | null;
  started_at?: string | null;
  duration_seconds?: number | null;
  notes?: string | null;
}

interface Sample {
  id: string;
  buyer_name?: string | null;
  shirt_size?: string | null;
  color?: string | null;
  status?: string | null;
  tracking_number?: string | null;
}

interface Order {
  id: string;
  order_number?: string | null;
  buyer_name?: string | null;
  total?: number | null;
  status?: string | null;
  created_at?: string | null;
}

export function CourseDetailPanel({ courseId, compact = false }: { courseId: string; compact?: boolean }) {
  const [course, setCourse] = useState<Course | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    if (!courseId) return;
    loadCourse();
  }, [courseId]);

  async function loadCourse() {
    setLoading(true);
    const { data: c } = await supabase.from(TABLES.courses[0]).select('*').eq('id', courseId).single();
    if (c) setCourse(c as Course);

    const { data: callsData } = await supabase.from('calls').select('id,disposition,spoke_to,started_at,duration_seconds,notes').eq('course_id', courseId).order('started_at', { ascending: false }).limit(10);
    setCalls((callsData as Call[]) || []);

    const { data: samplesData } = await supabase.from('samples').select('id,buyer_name,shirt_size,color,status,tracking_number').eq('course_id', courseId).order('created_at', { ascending: false }).limit(5);
    setSamples((samplesData as Sample[]) || []);

    const { data: ordersData } = await supabase.from('orders').select('id,order_number,buyer_name,total,status,created_at').eq('course_id', courseId).order('created_at', { ascending: false }).limit(5);
    setOrders((ordersData as Order[]) || []);

    setLoading(false);
  }

  const stage = course?.pipeline_stage ? STG[course.pipeline_stage] : STG.cold_list;

  if (loading) {
    return <div style={{ padding: 20, color: C.t3 }}>Loading...</div>;
  }

  if (!course) {
    return <div style={{ padding: 20, color: C.t3 }}>Course not found</div>;
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: C.bg }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.bd}`, background: C.sf }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: C.t1 }}>{course.name}</span>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: stage.bg, color: stage.c, border: `1px solid ${stage.bd}` }}>{stage.l}</span>
          {course.dnc && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: C.rD, color: C.rT, border: `1px solid ${C.rB}` }}>DNC</span>}
        </div>
        <div style={{ fontSize: 12, color: C.t3, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[course.city, course.state, course.course_type].filter(Boolean).join(' · ')}
          {course.website && <a href={course.website} target="_blank" rel="noopener" style={{ color: C.blu }}>Website</a>}
        </div>
      </div>

      {/* Phones */}
      <Section title="Contact">
        <Row label="Main" value={course.main_phone || '—'} />
        <Row label="Pro shop" value={course.pro_shop_phone || '—'} />
        <Row label="Address" value={[course.address, course.city, course.state, course.zip].filter(Boolean).join(', ') || '—'} />
      </Section>

      {/* Buyer */}
      <Section title="Buyer">
        <Row label="Name" value={course.buyer_name || 'Unknown'} />
        <Row label="Title" value={course.buyer_title || '—'} />
        <Row label="Direct" value={course.buyer_direct_phone || '—'} />
        <Row label="Email" value={course.buyer_email || '—'} />
        <Row label="Shirt size" value={course.buyer_shirt_size || '—'} />
      </Section>

      {/* Stats */}
      <Section title="Stats">
        <Row label="AI Score" value={course.ai_score?.toString() || '—'} />
        <Row label="Total calls" value={(course.total_attempts || 0).toString()} />
        <Row label="Total orders" value={(course.total_orders || 0).toString()} />
        <Row label="Lifetime revenue" value={course.lifetime_revenue ? `$${course.lifetime_revenue.toLocaleString()}` : '$0'} />
      </Section>

      {/* Call History */}
      <Section title={`Call History (${calls.length})`}>
        {calls.length === 0 ? <Empty> No calls yet</Empty> : calls.map(c => (
          <div key={c.id} style={{ padding: '8px 0', borderBottom: `1px solid ${C.rs}`, fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 500 }}>{c.disposition || 'Call'}</span>
              <span style={{ color: C.t3 }}>{c.started_at ? new Date(c.started_at).toLocaleDateString() : ''}</span>
            </div>
            {c.spoke_to && <div style={{ color: C.t2 }}>Spoke to: {c.spoke_to}</div>}
            {c.notes && <div style={{ color: C.t3, marginTop: 2 }}>{c.notes}</div>}
          </div>
        ))}
      </Section>

      {/* Samples */}
      {samples.length > 0 && (
        <Section title={`Samples (${samples.length})`}>
          {samples.map(s => (
            <div key={s.id} style={{ padding: '8px 0', borderBottom: `1px solid ${C.rs}`, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 500 }}>{s.buyer_name || 'Sample'}</span>
                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: s.status === 'delivered' ? C.gD : s.status === 'shipped' ? C.bD : C.rs, color: s.status === 'delivered' ? C.gT : s.status === 'shipped' ? C.bT : C.t3 }}>{s.status || 'pending'}</span>
              </div>
              <div style={{ color: C.t2 }}>{s.color} · {s.shirt_size}</div>
              {s.tracking_number && <div style={{ color: C.t3, fontSize: 11 }}>{s.tracking_number}</div>}
            </div>
          ))}
        </Section>
      )}

      {/* Orders */}
      {orders.length > 0 && (
        <Section title={`Orders (${orders.length})`}>
          {orders.map(o => (
            <div key={o.id} style={{ padding: '8px 0', borderBottom: `1px solid ${C.rs}`, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 500 }}>{o.order_number || 'Order'}</span>
                <span style={{ fontWeight: 600, color: C.grn }}>${o.total?.toLocaleString() || '0'}</span>
              </div>
              <div style={{ color: C.t2 }}>{o.buyer_name} · {o.status}</div>
            </div>
          ))}
        </Section>
      )}

      {/* Notes */}
      <Section title="Notes">
        <div style={{ fontSize: 12, color: C.t2, whiteSpace: 'pre-wrap' }}>{course.notes || 'No notes'}</div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.bd}` }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}>
      <span style={{ color: C.t3 }}>{label}</span>
      <span style={{ color: C.t1, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: '12px 0', fontSize: 12, color: C.t3 }}>{children}</div>;
}
