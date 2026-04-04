import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

function getArg(flag: string) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : '';
}

async function transcribeChannel(filePath: string, outputStem: string) {
  const whisperBin = process.env.WHISPER_CPP_BIN || '/Users/dezmon/whisper.cpp/main';
  const whisperModel = process.env.WHISPER_CPP_MODEL || '/Users/dezmon/whisper.cpp/models/ggml-large-v3.bin';
  await execFileAsync(whisperBin, [
    '-m', whisperModel,
    '-f', filePath,
    '-otxt',
    '-oj',
    '--output-file', outputStem,
    '-l', 'en',
    '-t', process.env.WHISPER_THREADS || '8',
  ], { env: process.env, maxBuffer: 10 * 1024 * 1024 });
}

function readTranscript(stem: string, speaker: string) {
  const txtPath = `${stem}.txt`;
  const jsonPath = `${stem}.json`;
  const text = fs.existsSync(txtPath) ? fs.readFileSync(txtPath, 'utf8').trim() : '';
  const parsed = fs.existsSync(jsonPath) ? JSON.parse(fs.readFileSync(jsonPath, 'utf8')) : {};
  const segments = Array.isArray(parsed.transcription)
    ? parsed.transcription.map((segment: any) => ({
        speaker,
        start: segment.offsets?.from / 100,
        end: segment.offsets?.to / 100,
        text: segment.text?.trim() || '',
      }))
    : [];
  return { text, segments };
}

async function main() {
  const wavPath = getArg('--wav');
  const metadataPath = getArg('--meta');
  if (!wavPath || !metadataPath) {
    throw new Error('Usage: node scripts/transcribe.ts --wav /path/file.wav --meta /path/file.json');
  }

  const dir = path.dirname(wavPath);
  const callSid = path.basename(wavPath, '.wav');
  const inboundWav = path.join(dir, `${callSid}-inbound.wav`);
  const outboundWav = path.join(dir, `${callSid}-outbound.wav`);

  const inboundStem = path.join(dir, `${callSid}-inbound`);
  const outboundStem = path.join(dir, `${callSid}-outbound`);

  await Promise.all([
    transcribeChannel(inboundWav, inboundStem),
    transcribeChannel(outboundWav, outboundStem),
  ]);

  const inbound = readTranscript(inboundStem, 'prospect');
  const outbound = readTranscript(outboundStem, 'agent');
  const mergedSegments = [...inbound.segments, ...outbound.segments].sort((a, b) => Number(a.start || 0) - Number(b.start || 0));
  const fullText = mergedSegments.map((segment) => `${segment.speaker}: ${segment.text}`).join('\n');
  const transcriptPath = path.join(dir, `${callSid}.txt`);
  const segmentsPath = path.join(dir, `${callSid}-segments.json`);

  fs.writeFileSync(transcriptPath, fullText);
  fs.writeFileSync(segmentsPath, JSON.stringify(mergedSegments, null, 2));

  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  await fetch(`${baseUrl.replace(/\/$/, '')}/api/analysis/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callId: metadata.callId,
      transcript: fullText,
      segments: mergedSegments,
      context: metadata,
    }),
  });
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
