import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = join(root, 'output');
mkdirSync(out, { recursive: true });
const slugs = ['translate', 'agentschat', 'worldecho', 'pelicanmap', 'sidex'];
const descriptions = [
  ['给 AI 的思考过程加上字幕。', '八种目标语言 · 本地 Ollama · 自定义提供方', '了解与安装 ↗  ·  查看演示'],
  ['一个让 Agent 相遇、交流和辩论的社区。', '公开讨论 · 人类围观 · 管理接入的 Agent', '进入社区 ↗  ·  源码  ·  接入 Agent'],
  ['同一个熟悉的轮廓，在世界各地长出不同的性格。', '转动 3D 地球，探索各地模型、资料来源和互动。', '转动地球 ↗  ·  浏览档案  ·  源码'],
  ['“画一只骑自行车的鹈鹕。”然后看看 AI 给出了什么。', '不同模型与时间的实际输出，原始来源、成功和翻车。', '看鹈鹕 ↗  ·  逛时间线  ·  源码'],
  ['评论在右边，阅读留在原地。', '侧栏阅读评论，原地展开长文，保留时间线位置。', '安装扩展 ↗  ·  演示与源码'],
];
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
function caption(lines, width, height, mobile = false) {
  const size = mobile ? 20 : 24;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><g font-family="Microsoft YaHei, sans-serif"><text x="0" y="${size + 8}" fill="#24292f" font-size="${size}" font-weight="600">${escape(lines[0])}</text><text x="0" y="${size * 2 + 23}" fill="#57606a" font-size="${mobile ? 17 : 21}">${escape(lines[1])}</text><text x="0" y="${size * 3 + 38}" fill="#0969da" font-size="${mobile ? 17 : 21}">${escape(lines[2])}</text></g></svg>`);
}
for (const mobile of [false, true]) {
  const width = mobile ? 720 : 1300;
  const padding = mobile ? 28 : 40;
  const elements = [];
  let y = padding;
  const add = async input => {
    const bytes = await sharp(input).resize({ width }).png().toBuffer();
    const meta = await sharp(bytes).metadata();
    elements.push({ input: bytes, left: padding, top: y });
    y += meta.height;
  };
  await add(join(root, 'assets', `header${mobile ? '-mobile' : ''}.svg`));
  y += 18;
  await add(caption(['独立开发者。写点工具，做点好玩的。', 'AI tools, agent spaces & playful web experiments.', 'X / @Kedashu ↗  ·  全部项目 / All projects ↗'], width, 134, mobile));
  y += 22;
  for (const [i, slug] of slugs.entries()) {
    await add(join(root, 'assets', `card-${slug}${mobile ? '-mobile' : ''}.svg`));
    y += 18;
    await add(caption(descriptions[i], width, mobile ? 122 : 148, mobile));
    y += 22;
  }
  await add(join(root, 'assets', `footer${mobile ? '-mobile' : ''}.svg`));
  await sharp({ create: { width: width + padding * 2, height: y + padding, channels: 4, background: '#ffffff' } }).composite(elements).png().toFile(join(out, `profile-${mobile ? 'mobile' : 'desktop'}.png`));
}
const readme = readFileSync(join(root, 'README.md'), 'utf8');
const html = execFileSync('gh', ['api', 'markdown', '--input', '-'], {
  input: JSON.stringify({ text: readme, mode: 'gfm', context: 'UncleK/UncleK' }), encoding: 'utf8', maxBuffer: 1024 * 1024,
});
writeFileSync(join(out, 'readme-github.html'), html);
const page = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>UncleK · Profile preview</title><style>body{background:#fff;color:#24292f;font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif;margin:0}main{max-width:880px;margin:32px auto;padding:32px;border:1px solid #d0d7de;border-radius:8px}img{max-width:100%;height:auto}a{color:#0969da;text-decoration:none}sub{color:#57606a;font-size:.9em}p{margin:16px 0}picture{display:block}@media(max-width:640px){main{margin:0;padding:16px;border:0}}</style><main>${html.replaceAll('src="./assets/', 'src="../assets/').replaceAll('srcset="./assets/', 'srcset="../assets/')}</main></html>`;
writeFileSync(join(out, 'profile-preview.html'), page);
console.log('Wrote desktop/mobile visual proofs and GitHub-rendered Markdown preview.');
