import { createServerClient } from '@/lib/supabase';
import { createAndCompleteDraftOrder, getSampleVariantId, parseAddress } from '@/lib/shopify';
import { getEstimatedDeliveryDate } from '@/lib/inbound';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = createServerClient();
    const variantId = await getSampleVariantId(String(body.size), String(body.color));
    const shippingAddress = parseAddress(String(body.address || ''), String(body.buyerName || ''));

    const order = await createAndCompleteDraftOrder({
      paymentPending: false,
      note: `Free sample for ${body.buyerName}. Size: ${body.size}, Color: ${body.color}`,
      tags: ['SAMPLE', 'CALLMYNT', `course:${body.courseId}`],
      shippingAddress,
      email: typeof body.buyerEmail === 'string' ? body.buyerEmail : null,
      lineItems: [
        {
          variant_id: variantId,
          quantity: 1,
          applied_discount: {
            title: 'Free Sample',
            value: '100.0',
            value_type: 'percentage',
          },
        },
      ],
    });

    const sampleResult = await supabase
      .from('samples')
      .insert({
        course_id: body.courseId,
        call_id: body.callId || null,
        agent_id: body.agentId,
        buyer_name: body.buyerName,
        shirt_size: body.size,
        color: body.color,
        shipping_address: body.address,
        shopify_draft_order_id: order.draftId,
        shopify_order_id: order.orderId,
        shopify_order_number: order.orderNumber,
        shopify_variant_id: variantId,
        status: 'pending_fulfillment',
        estimated_delivery: getEstimatedDeliveryDate(),
      })
      .select('*')
      .single();

    if (sampleResult.error) throw sampleResult.error;

    await supabase
      .from('courses')
      .update({
        pipeline_stage: 'sending_sample',
        buyer_name: body.buyerName,
        buyer_shirt_size: body.size,
        address: body.address,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.courseId);

    return Response.json({
      ok: true,
      sample: sampleResult.data,
      order,
    });
  } catch (error) {
    console.error('Failed to create sample shipment', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to create sample.' },
      { status: 500 },
    );
  }
}
