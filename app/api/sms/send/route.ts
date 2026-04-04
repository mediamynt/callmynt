import { getTwilioClient } from '@/lib/callmynt-calls';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const client = getTwilioClient();
    const message = await client.messages.create({
      to: String(body.to),
      from: body.from || process.env.TWILIO_PHONE_NUMBER || process.env.NEXT_PUBLIC_TWILIO_PHONE,
      body: String(body.body || ''),
    });

    return Response.json({ ok: true, sid: message.sid });
  } catch (error) {
    console.error('Failed to send SMS', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'SMS failed.' },
      { status: 500 },
    );
  }
}
