import { createServerClient } from '@/lib/supabase';

type AnalysisRow = {
  overall_score?: number | null;
  coaching_notes?: string[] | null;
  created_at?: string | null;
};

async function main() {
  const supabase = createServerClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const analysisResult = await supabase
    .from('call_analysis')
    .select('overall_score, coaching_notes, created_at')
    .gte('created_at', since);

  if (analysisResult.error) {
    throw analysisResult.error;
  }

  const rows = (analysisResult.data || []) as AnalysisRow[];
  const avgScore = rows.length
    ? Math.round(rows.reduce((sum, row) => sum + Number(row.overall_score || 0), 0) / rows.length)
    : 0;
  const topNotes = rows
    .flatMap((row) => row.coaching_notes || [])
    .reduce<Record<string, number>>((acc, note) => {
      acc[note] = (acc[note] || 0) + 1;
      return acc;
    }, {});

  const payload = {
    report_type: 'weekly',
    generated_at: new Date().toISOString(),
    avg_score: avgScore,
    analyzed_calls: rows.length,
    top_notes: Object.entries(topNotes)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5)
      .map(([note, count]) => ({ note, count })),
  };

  const result = await supabase.from('coaching_reports').insert(payload).select('*').single();
  if (result.error) throw result.error;
  console.log(JSON.stringify(result.data, null, 2));
}

if (require.main === module) {
  void main();
}
