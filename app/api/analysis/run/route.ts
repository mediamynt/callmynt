import { createServerClient } from '@/lib/supabase';
import { runCallAnalysis } from '@/lib/analysis';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = createServerClient();

    let transcript = typeof body.transcript === 'string' ? body.transcript : '';
    if (!transcript && typeof body.callId === 'string') {
      const transcriptResult = await supabase
        .from('call_transcripts')
        .select('full_text')
        .eq('call_id', body.callId)
        .maybeSingle();
      transcript = transcriptResult.data?.full_text || '';
    }

    if (!transcript) {
      return Response.json({ error: 'Transcript required.' }, { status: 400 });
    }

    const callResult = typeof body.callId === 'string'
      ? await supabase.from('calls').select('course_id, pipeline_stage_after').eq('id', body.callId).maybeSingle()
      : { data: null };

    const analysis = await runCallAnalysis({
      callId: String(body.callId),
      transcript,
      courseId: callResult.data?.course_id || null,
      pipelineStage: callResult.data?.pipeline_stage_after || null,
    });

    await supabase
      .from('call_recordings')
      .update({ analysis_status: 'completed' })
      .eq('call_id', body.callId);

    return Response.json({ ok: true, analysis });
  } catch (error) {
    console.error('Failed to run call analysis', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Analysis failed.' },
      { status: 500 },
    );
  }
}
