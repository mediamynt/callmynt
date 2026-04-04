export async function runOpenClawAnalysis(payload: Record<string, unknown>) {
  const baseUrl = process.env.OPENCLAW_API_URL || process.env.LOCAL_ANALYSIS_URL || 'http://localhost:3001';
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/analyze-call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`OpenClaw analysis failed: ${response.status} ${await response.text()}`);
  }

  return response.json() as Promise<Record<string, any>>;
}

export async function generateCoachingReport(payload: Record<string, unknown>) {
  const baseUrl = process.env.OPENCLAW_API_URL || 'http://localhost:3001';
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/generate-coaching-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`OpenClaw coaching report failed: ${response.status} ${await response.text()}`);
  }

  return response.json() as Promise<Record<string, any>>;
}
