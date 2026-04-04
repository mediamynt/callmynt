"use client";

import { useCallback, useEffect, useState } from "react";
import { queryWithFallback, TABLES } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { C } from "@/lib/constants";
import { EmptyState, ErrorState, PageSkeleton } from "@/components/shared/States";

type OrderRecord = {
  id: string;
  course_id?: string | null;
  total_units?: number | null;
  total?: number | null;
  status?: string | null;
  created_at?: string | null;
  shopify_order_id?: number | null;
  items?: unknown;
};

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return <div style={{ background: C.bg, borderRadius: 14, border: `1px solid ${C.bd}`, padding: "18px 20px" }}><div style={{ fontSize: 11, color: C.t3, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{label}</div><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 26, fontWeight: 600, color: color || C.t1 }}>{value}</span></div>;
}

function getOrderItemSummary(items: unknown) {
  if (!Array.isArray(items) || items.length === 0) return "No line items stored";
  return items
    .map((item) => {
      if (typeof item !== "object" || !item) return "";
      const row = item as Record<string, unknown>;
      return [row.title, row.color, row.quantity].filter(Boolean).join(" · ");
    })
    .filter(Boolean)
    .join(", ");
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [courseNames, setCourseNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const ordersResult = await queryWithFallback<OrderRecord[]>(TABLES.orders, async (table) => {
      const query = await supabase.from(table).select("*").order("created_at", { ascending: false });
      return { data: query.data || [], error: query.error, count: null };
    });

    if (ordersResult.error) {
      setError(ordersResult.error.message || "Failed to load orders.");
      setLoading(false);
      return;
    }

    const orderRows = ordersResult.data || [];
    setOrders(orderRows);
    const courseIds = [...new Set(orderRows.map((order) => order.course_id).filter(Boolean))] as string[];
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

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const avgOrder = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;
  const totalUnits = orders.reduce((sum, order) => sum + Number(order.total_units || 0), 0);

  if (loading) return <PageSkeleton lines={5} />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (orders.length === 0) {
    return <EmptyState title="No orders yet" detail="Orders are created when buyers convert from samples or place an order on a live call." />;
  }

  return (
    <div style={{ padding: "24px 28px", height: "100%", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>Wholesale orders</div>
        <div style={{ fontSize: 13, color: C.t2, background: C.sf, padding: "8px 14px", borderRadius: 10, border: `1px solid ${C.bd}` }}>
          Created from course detail or live dialer flows
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        <Stat label="Orders" value={orders.length} color={C.t1} />
        <Stat label="Revenue" value={`$${totalRevenue.toLocaleString()}`} color={C.grn} />
        <Stat label="Avg order" value={`$${avgOrder.toLocaleString()}`} color={C.blu} />
        <Stat label="Units sold" value={totalUnits} color={C.pur} />
      </div>
      <div style={{ background: C.bg, border: `1px solid ${C.bd}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "90px 1.6fr 1.6fr 110px 90px 120px", padding: "12px 20px", borderBottom: `1px solid ${C.bd}`, fontSize: 11, color: C.t3, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700, background: C.sf }}>
          <span>Order</span>
          <span>Course</span>
          <span>Items</span>
          <span>Total</span>
          <span>Units</span>
          <span>Status</span>
        </div>
        {orders.map((order) => (
          <div key={order.id} style={{ display: "grid", gridTemplateColumns: "90px 1.6fr 1.6fr 110px 90px 120px", padding: "14px 20px", borderBottom: `1px solid ${C.rs}`, alignItems: "center", fontSize: 14 }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 600 }}>#{order.shopify_order_id || order.id}</span>
            <div>
              <div style={{ fontWeight: 700 }}>{courseNames[order.course_id || ""] || "Unknown course"}</div>
              <div style={{ fontSize: 12, color: C.t3, marginTop: 3 }}>{order.created_at ? new Date(order.created_at).toLocaleDateString() : "—"}</div>
            </div>
            <span style={{ color: C.t2 }}>{getOrderItemSummary(order.items)}</span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, fontWeight: 600, color: C.grn }}>${Number(order.total || 0).toLocaleString()}</span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 600 }}>{order.total_units || 0}</span>
            <span style={{ color: order.status === "paid" || order.status === "fulfilled" ? C.grn : order.status === "pending" ? C.amb : C.t2, fontWeight: 600 }}>{order.status || "pending"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
