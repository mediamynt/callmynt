"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { queryWithFallback, TABLES } from "@/lib/data";
import { C } from "@/lib/constants";
import { ErrorState, PageSkeleton } from "@/components/shared/States";

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: C.bg, borderRadius: 14, border: `1px solid ${C.bd}`, padding: "18px 20px" }}>
      <div style={{ fontSize: 11, color: C.t3, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 26, fontWeight: 700, color: color || C.t1 }}>{value}</div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [calls, setCalls] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [samples, setSamples] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [callsResult, ordersResult, samplesResult] = await Promise.all([
      queryWithFallback<any[]>(TABLES.calls, async (table) => {
        const query = await supabase.from(table).select("*");
        return { data: query.data || [], error: query.error, count: null };
      }),
      queryWithFallback<any[]>(TABLES.orders, async (table) => {
        const query = await supabase.from(table).select("*");
        return { data: query.data || [], error: query.error, count: null };
      }),
      queryWithFallback<any[]>(TABLES.samples, async (table) => {
        const query = await supabase.from(table).select("*");
        return { data: query.data || [], error: query.error, count: null };
      }),
    ]);

    if (callsResult.error) {
      setError(callsResult.error.message || "Failed to load analytics.");
      setLoading(false);
      return;
    }

    setCalls(callsResult.data || []);
    setOrders(ordersResult.data || []);
    setSamples(samplesResult.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const metrics = useMemo(() => {
    const totalCalls = calls.length;
    const connected = calls.filter((call) => ["answered", "completed", "wrap_up"].includes(call.status)).length;
    const conversions = orders.length;
    const revenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const connectRate = totalCalls > 0 ? Math.round((connected / totalCalls) * 100) : 0;
    const conversionRate = connected > 0 ? Math.round((conversions / connected) * 100) : 0;
    const avgOrder = conversions > 0 ? Math.round(revenue / conversions) : 0;
    const talkSeconds = calls.reduce((sum, call) => sum + Number(call.duration_seconds || 0), 0);
    const talkHours = (talkSeconds / 3600).toFixed(1);

    return { totalCalls, connected, conversions, revenue, connectRate, conversionRate, avgOrder, talkHours };
  }, [calls, orders]);

  if (loading) return <PageSkeleton lines={5} />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <div style={{ padding: "24px 28px", height: "100%", overflowY: "auto" }}>
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Analytics</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        <Stat label="Total calls" value={`${metrics.totalCalls}`} />
        <Stat label="Connect rate" value={`${metrics.connectRate}%`} color={C.grn} />
        <Stat label="Conversion rate" value={`${metrics.conversionRate}%`} color={C.blu} />
        <Stat label="Revenue" value={`$${metrics.revenue.toLocaleString()}`} color={C.grn} />
        <Stat label="Orders" value={`${metrics.conversions}`} color={C.pur} />
        <Stat label="Samples" value={`${samples.length}`} color={C.amb} />
        <Stat label="Avg order" value={`$${metrics.avgOrder.toLocaleString()}`} />
        <Stat label="Talk time" value={`${metrics.talkHours}h`} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: C.bg, border: `1px solid ${C.bd}`, borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Pipeline summary</div>
          {[
            ["Calls connected", `${metrics.connected} of ${metrics.totalCalls}`],
            ["Samples sent", `${samples.length}`],
            ["Orders placed", `${metrics.conversions}`],
            ["Revenue generated", `$${metrics.revenue.toLocaleString()}`],
          ].map(([label, value], index, array) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: index === array.length - 1 ? "none" : `1px solid ${C.rs}` }}>
              <span style={{ color: C.t3, fontSize: 14 }}>{label}</span>
              <span style={{ color: C.t1, fontSize: 14, fontWeight: 600 }}>{value}</span>
            </div>
          ))}
        </div>

        <div style={{ background: C.bg, border: `1px solid ${C.bd}`, borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Recent performance notes</div>
          <div style={{ fontSize: 14, color: C.t2, lineHeight: 1.7 }}>
            Connect rate is based on recorded call statuses. Conversion rate is measured from connected calls to Shopify-backed orders. Revenue is aggregated directly from the orders table, so the page reflects real order creation instead of the placeholder values from earlier phases.
          </div>
        </div>
      </div>
    </div>
  );
}
