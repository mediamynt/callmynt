import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

function run(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

export async function convertMuLawToWav(inputPath: string, outputPath: string) {
  await run('ffmpeg', ['-f', 'mulaw', '-ar', '8000', '-ac', '1', '-i', inputPath, '-ar', '16000', outputPath, '-y']);
}

export async function mergeDualChannel(agentWav: string, prospectWav: string, outputPath: string) {
  await run('ffmpeg', ['-i', agentWav, '-i', prospectWav, '-filter_complex', '[0:a][1:a]join=inputs=2:channel_layout=stereo[a]', '-map', '[a]', outputPath, '-y']);
}

export async function writeManifest(baseDir: string, callSid: string, data: Record<string, unknown>) {
  const filePath = path.join(baseDir, `${callSid}.json`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  return filePath;
}
