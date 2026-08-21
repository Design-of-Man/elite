// Build-time asset fetch for the cinematic homepage frame sequence.
// The generated Seedance frames are published as a tar.gz bundle; this script
// downloads and unpacks it into assets/sequence/ at deploy time (Vercel build)
// or on a developer machine: `node scripts/fetch-assets.mjs`.
import { createWriteStream, existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const seqDir = path.join(root, 'assets', 'sequence');
const framesDir = path.join(seqDir, 'frames');
const manifestPath = path.join(seqDir, 'manifest.json');

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

const have = existsSync(framesDir) ? readdirSync(framesDir).filter(f => f.endsWith('.webp')).length : 0;
if (have >= manifest.frames) {
  console.log(`frames already present (${have}/${manifest.frames}) — skipping fetch`);
  process.exit(0);
}

if (!manifest.bundle) {
  console.warn('manifest has no bundle URL; site will fall back to placeholder frames');
  process.exit(0);
}

console.log(`fetching frame bundle: ${manifest.bundle}`);
const res = await fetch(manifest.bundle);
if (!res.ok) {
  console.error(`bundle fetch failed: HTTP ${res.status} — site will fall back to placeholder frames`);
  process.exit(0); // do not fail the whole deploy over the film asset
}
mkdirSync(seqDir, { recursive: true });
const tarPath = path.join(seqDir, 'bundle.tgz');
await pipeline(Readable.fromWeb(res.body), createWriteStream(tarPath));
if (manifest.sha256) {
  const digest = createHash('sha256').update(readFileSync(tarPath)).digest('hex');
  if (digest !== manifest.sha256) {
    console.error(`bundle checksum mismatch: expected ${manifest.sha256}, got ${digest}`);
    process.exit(1);
  }
  console.log('bundle sha256 verified');
}
execFileSync('tar', ['-xzf', tarPath, '-C', seqDir], { stdio: 'inherit' });
execFileSync('rm', ['-f', tarPath]);
const now = readdirSync(framesDir).filter(f => f.endsWith('.webp')).length;
console.log(`unpacked ${now} frames into assets/sequence/frames`);
if (now < manifest.frames) {
  console.error(`expected ${manifest.frames} frames, found ${now}`);
  process.exit(1);
}
