import { createClient } from '@supabase/supabase-js';
import { generateCoachingReport } from '../lib/openclaw';

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const analysisResult = await supabase
    .from('call_analysis')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(250);

  if (analysisResult.error) {
    throw analysisResult.error;
  }

  const report = await generateCoachingReport({
    analyses: analysisResult.data || [],
    generatedAt: new Date().toISOString(),
  });

  const payload = {
    title: report.title || 'Nightly coaching report',
    summary: report.summary || '',
    body: report.body || JSON.stringify(report, null, 2),
    created_at: new Date().toISOString(),
  };

  const insert = await supabase.from('coaching_reports').insert(payload);
  if (insert.error) {
    throw insert.error;
  }
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
