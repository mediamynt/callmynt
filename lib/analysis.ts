import { createServerClient } from '@/lib/supabase';
import { hasAnalysisConfig } from '@/lib/app-env';

type AnalysisContext = {
  callId: string;
  transcript: string;
  courseId?: string | null;
  pipelineStage?: string | null;
  buyerName?: string | null;
};

type StoredAnalysis = {
  overall_score: number;
  talk_listen_ratio: { agent: number; prospect: number };
  gatekeeper_navigation: { mentionedBuyer: boolean; gotBuyer: boolean };
  reached_buyer: boolean;
  script_adherence: { score: number; notes: string[] };
  objections_detected: string[];
  prospect_sentiment: string;
  coaching_notes: string[];
  next_step: string;
};

function localHeuristicAnalysis(transcript: string): StoredAnalysis {
  const lower = transcript.toLowerCase();
  const objections = ['price', 'budget', 'email', 'already carry', 'minimum']
    .filter((term) => lower.includes(term));
  const reachedBuyer = lower.includes('buyer') || lower.includes('merchandise');
  const positiveSignals = ['sample', 'order', 'send', 'love', 'interested'].filter((term) => lower.includes(term)).length;
  const negativeSignals = ['not interested', 'busy', 'wrong number'].filter((term) => lower.includes(term)).length;
  const score = Math.max(35, Math.min(98, 62 + positiveSignals * 7 - negativeSignals * 10 - objections.length * 2));

  return {
    overall_score: score,
    talk_listen_ratio: { agent: 52, prospect: 48 },
    gatekeeper_navigation: { mentionedBuyer: reachedBuyer, gotBuyer: lower.includes('buyer name') || lower.includes('merchandise buyer') },
    reached_buyer: reachedBuyer,
    script_adherence: {
      score: Math.max(40, Math.min(95, score - 4)),
      notes: reachedBuyer ? ['Mentioned buyer context during the call.'] : ['Gatekeeper path was not clearly established.'],
    },
    objections_detected: objections,
    prospect_sentiment: positiveSignals >= negativeSignals ? 'positive' : 'guarded',
    coaching_notes: [
      reachedBuyer ? 'Move from rapport into the sample close faster once the buyer is engaged.' : 'Ask for the merchandise buyer by role before pitching product details.',
      objections.includes('price') ? 'Anchor margin earlier when pricing concerns appear.' : 'Use the $25 wholesale / $49-$59 retail framing sooner.',
      positiveSignals > 0 ? 'Reinforce interest with a concrete next step before ending the call.' : 'End with a specific callback or sample ask instead of a soft close.',
    ],
    next_step: positiveSignals > 0 ? 'Schedule follow-up within 2 business days.' : 'Retry with a tighter opener and clearer buyer request.',
  };
}

export async function runCallAnalysis(context: AnalysisContext) {
  let analysis = localHeuristicAnalysis(context.transcript);

  if (hasAnalysisConfig()) {
    const endpoint = process.env.LOCAL_ANALYSIS_URL || `${process.env.OPENCLAW_API_URL}/analyze-call`;
    try {
      const response = await fetch(endpoint!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context),
      });
      if (response.ok) {
        const payload = await response.json() as Partial<StoredAnalysis>;
        analysis = {
          ...analysis,
          ...payload,
          talk_listen_ratio: payload.talk_listen_ratio || analysis.talk_listen_ratio,
          gatekeeper_navigation: payload.gatekeeper_navigation || analysis.gatekeeper_navigation,
          script_adherence: payload.script_adherence || analysis.script_adherence,
          objections_detected: payload.objections_detected || analysis.objections_detected,
          coaching_notes: payload.coaching_notes || analysis.coaching_notes,
        };
      }
    } catch (error) {
      console.error('Local analysis endpoint unavailable, falling back to heuristic analysis', error);
    }
  }

  const supabase = createServerClient();
  const upsert = await supabase
    .from('call_analysis')
    .upsert({
      call_id: context.callId,
      ...analysis,
    }, { onConflict: 'call_id' })
    .select('*')
    .single();

  if (upsert.error) {
    throw upsert.error;
  }

  return upsert.data;
}
