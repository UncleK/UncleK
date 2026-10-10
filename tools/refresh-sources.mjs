import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const sourceDir = fileURLToPath(new URL('../assets/sources/', import.meta.url));
const outputDir = fileURLToPath(new URL('../output/', import.meta.url));
mkdirSync(sourceDir, { recursive: true });
mkdirSync(outputDir, { recursive: true });

const inputs = [
  { repo: 'dsh-think-translate', path: 'demo/demo.gif', name: 'translate', frame: 55 },
  { repo: 'dsh-think-translate', path: 'demo/demo2.gif', name: 'translate-settings', frame: 207 },
  { repo: 'agentschat', path: 'docs/readme/hero-homepage.png', name: 'agentschat' },
  { repo: 'agentschat', path: 'web/public/agentmoji/handshake.png', name: 'agent-handshake' },
  { repo: 'agentschat', path: 'web/public/agentmoji/dream.png', name: 'agent-dream' },
  { repo: 'agentschat', path: 'web/public/agentmoji/whisper.png', name: 'agent-whisper' },
  { repo: 'WorldEcho', path: 'docs/assets/globe-source.png', name: 'worldecho' },
  { repo: 'WorldEcho', path: 'docs/assets/model-personalities.png', name: 'worldecho-models' },
  { repo: 'pelicanmap', path: 'docs/assets/pelican-wall.png', name: 'pelicanmap' },
  { repo: 'SideX', path: 'demo/demo.gif', name: 'sidex', frame: 49 },
];
const provenance = [];
const refs = new Map();
for (const input of inputs) {
  if (!refs.has(input.repo)) {
    const repo = JSON.parse(execFileSync('gh', ['api', `repos/UncleK/${input.repo}/commits/HEAD`], { encoding: 'utf8' }));
    refs.set(input.repo, repo.sha);
  }
  const ref = refs.get(input.repo);
  const bytes = execFileSync('gh', ['api', '-H', 'Accept: application/vnd.github.raw', `repos/UncleK/${input.repo}/contents/${input.path}?ref=${ref}`], { maxBuffer: 20 * 1024 * 1024 });
  const meta = await sharp(bytes).metadata();
  if (meta.pages > 1) {
    const pages = [...new Set([0, 0.2, 0.4, 0.6, 0.8, 0.98].map(f => Math.floor((meta.pages - 1) * f)))];
    const thumbs = await Promise.all(pages.map(async (page, i) => ({
      input: await sharp(bytes, { page }).resize(600, 380, { fit: 'contain', background: '#e5e7eb' }).png().toBuffer(),
      left: (i % 2) * 600, top: Math.floor(i / 2) * 380,
    })));
    await sharp({ create: { width: 1200, height: Math.ceil(pages.length / 2) * 380, channels: 4, background: '#e5e7eb' } }).composite(thumbs).png().toFile(`${outputDir}/${input.name}-frames.png`);
    console.log(`${input.name}: ${meta.width}x${meta.pageHeight ?? meta.height}, ${meta.pages} frames; samples ${pages.join(', ')}`);
    // Keep the original animation only as an ignored local input for frame selection.
    writeFileSync(`${outputDir}/${input.name}-original.gif`, bytes);
  }
  await sharp(bytes, { page: input.frame ?? 0 }).resize({ width: 1600, withoutEnlargement: true }).png().toFile(`${sourceDir}/${input.name}.png`);
  provenance.push({ repo: `UncleK/${input.repo}`, ref, path: input.path, frame: input.frame ?? null, output: `assets/sources/${input.name}.png`, url: `https://github.com/UncleK/${input.repo}/blob/${ref}/${input.path}` });
}
writeFileSync(`${sourceDir}/provenance.json`, JSON.stringify(provenance, null, 2) + '\n');
console.log(`Prepared ${inputs.length} public project images.`);
