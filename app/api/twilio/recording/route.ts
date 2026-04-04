import { createServerClient } from '@/lib/supabase';
import { getRecordingHttpUrl } from '@/lib/app-env';
import { markInboundCallVoicemail } from '@/lib/inbound';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.formData();
    const callSid = String(body.get('CallSid') || '');
    const recordingUrl = String(body.get('RecordingUrl') || '');
    const recordingDuration = Number(body.get('RecordingDuration') || 0);
    const supabase = createServerClient();

    const callResult = await supabase
      .from('calls')
      .select('id, direction, status')
      .eq('provider_call_id', callSid)
      .maybeSingle();

    const internalCallId = callResult.data?.id || callSid;
    const playbackBase = getRecordingHttpUrl();
    const storagePath = playbackBase
      ? `${playbackBase}/recordings/${callSid}/${callSid}.wav`
      : `${recordingUrl}.wav`;

    await supabase.from('call_recordings').upsert({
      call_id: internalCallId,
      storage_path: storagePath,
      duration_seconds: recordingDuration,
      transcription_status: 'pending',
      analysis_status: 'pending',
    }, { onConflict: 'call_id' });

    if (callResult.data?.direction === 'inbound' && callResult.data.status === 'voicemail') {
      await markInboundCallVoicemail(internalCallId).catch(() => null);
    }

    console.log(`Recording for ${callSid}: ${storagePath} (${recordingDuration}s)`);
    return new Response('OK');
  } catch (error) {
    console.error('Failed to handle recording webhook', error);
    return new Response('ERROR', { status: 500 });
  }
}
