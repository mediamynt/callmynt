import { createServerClient } from '@/lib/supabase';
import { createAndCompleteDraftOrder, parseAddress } from '@/lib/shopify';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const lineItems = (Array.isArray(body.lineItems) ? body.lineItems : []) as Array<Record<string, unknown>>;
    const totalUnits = lineItems.reduce((sum: number, item) => sum + Number(item.quantity || 0), 0);
    const total = lineItems.reduce((sum: number, item) => sum + Number(item.quantity || 0) * Number(item.price || 0), 0);
    const supabase = createServerClient();

    const order = await createAndCompleteDraftOrder({
      paymentPending: body.paymentTerms !== 'Pay now',
      note: `Wholesale order created in CallMynt. Terms: ${body.paymentTerms || 'Net 30'}`,
      tags: ['ORDER', 'CALLMYNT', `course:${body.courseId}`],
      email: typeof body.buyerEmail === 'string' ? body.buyerEmail : null,
      shippingAddress: parseAddress(String(body.shippingAddress || ''), String(body.buyerName || '')),
      lineItems: lineItems.map((item: Record<string, unknown>) => ({
        title: item.title,
        quantity: Number(item.quantity || 0),
        original_unit_price: Number(item.price || 25),
        sku: item.sku || undefined,
        properties: [
          { name: 'color', value: item.color || '' },
          { name: 'size_breakdown', value: JSON.stringify(item.sizes || {}) },
        ],
      })),
    });

    const insert = await supabase
      .from('orders')
      .insert({
        course_id: body.courseId,
        agent_id: body.agentId,
        call_id: body.callId || null,
        shopify_order_id: order.orderId,
        items: lineItems,
        total_units: totalUnits,
        total,
        status: body.paymentTerms === 'Pay now' ? 'paid' : 'pending',
      })
      .select('*')
      .single();

    if (insert.error) throw insert.error;

    await supabase
      .from('callmynt_courses')
      .update({
        pipeline_stage: 'first_order',
        total_orders: 1,
        lifetime_revenue: total,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.courseId);

    return Response.json({ ok: true, order: insert.data, shopify: order });
  } catch (error) {
    console.error('Failed to create wholesale order', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to create order.' },
      { status: 500 },
    );
  }
}
