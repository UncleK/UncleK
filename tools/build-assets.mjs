import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as fontkit from 'fontkit';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'assets');
mkdirSync(output, { recursive: true });
const winFonts = join(process.env.WINDIR ?? 'C:/Windows', 'Fonts');
const fontPaths = {
  sans: process.env.PROFILE_FONT_SANS ?? join(winFonts, 'msyh.ttc'),
  bold: process.env.PROFILE_FONT_BOLD ?? join(winFonts, 'msyhbd.ttc'),
  serif: process.env.PROFILE_FONT_SERIF ?? join(winFonts, 'georgiab.ttf'),
  mono: process.env.PROFILE_FONT_MONO ?? join(winFonts, 'consola.ttf'),
};
const fonts = Object.fromEntries(Object.entries(fontPaths).map(([name, path]) => {
  if (!existsSync(path)) throw new Error(`Set PROFILE_FONT_${name.toUpperCase()} to an available font file: ${path}`);
  const collection = fontkit.openSync(path);
  return [name, collection.fonts?.[0] ?? collection];
}));
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const n = value => Number(value.toFixed(5));
let glyphs;

// Vector lettering keeps Chinese and Latin type consistent on every viewer's device.
function text(x, y, size, value, fill, { font = 'sans', maxWidth = Infinity, spacing = 0 } = {}) {
  const face = fonts[font];
  for (const char of value) if (!face.hasGlyphForCodePoint(char.codePointAt(0))) throw new Error(`${font} lacks ${char}`);
  const run = face.layout(value);
  let scale = size / face.unitsPerEm;
  const width = run.positions.reduce((sum, p) => sum + p.xAdvance, 0) * scale + spacing * Math.max(0, run.glyphs.length - 1);
  if (width > maxWidth) scale *= maxWidth / width;
  let penX = 0;
  const uses = run.glyphs.map((glyph, i) => {
    const key = `${font}-${glyph.id}`;
    if (!glyphs.has(key)) glyphs.set(key, glyph.path.toSVG());
    const p = run.positions[i];
    const element = `<use href="#${key}" x="${n(penX + p.xOffset)}" y="${n(p.yOffset)}"/>`;
    penX += p.xAdvance + spacing / scale;
    return element;
  }).join('');
  return `<g aria-label="${esc(value)}" fill="${fill}" transform="translate(${x} ${y}) scale(${n(scale)} ${n(-scale)})">${uses}</g>`;
}
const rect = (x, y, w, h, fill, rx = 0, attrs = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${attrs}/>`;
const line = (x1, y1, x2, y2, stroke) => `<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${stroke}"/>`;
const image = (uri, x, y, w, h) => `<image href="${uri}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"/>`;
const arrow = (x, y, ink) => `<g transform="translate(${x} ${y})"><circle r="18" fill="none" stroke="${ink}" opacity=".35"/><path d="M-6 6L6-6M-6-6H6V6" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g>`;
const grid = color => `<pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0V28" fill="none" stroke="${color}" stroke-width=".7"/></pattern>`;

const bitmapCache = new Map();
async function bitmap(name, width, height, crop) {
  const key = JSON.stringify([name, width, height, crop]);
  if (bitmapCache.has(key)) return bitmapCache.get(key);
  let pipeline = sharp(join(output, 'sources', `${name}.png`));
  if (crop) pipeline = pipeline.extract(crop);
  const buffer = await pipeline.resize(width, height, { fit: 'cover' }).png({ palette: true, quality: 90 }).toBuffer();
  const uri = `data:image/png;base64,${buffer.toString('base64')}`;
  bitmapCache.set(key, uri);
  return uri;
}
const media = {
  translate: await bitmap('translate', 530, 330),
  settings: await bitmap('translate-settings', 424, 300),
  chatMark: await bitmap('agentschat', 450, 380, { left: 750, top: 130, width: 550, height: 490 }),
  handshake: await bitmap('agent-handshake', 154, 154),
  dream: await bitmap('agent-dream', 154, 154),
  whisper: await bitmap('agent-whisper', 154, 154),
  globe: await bitmap('worldecho', 800, 440),
  towerHat: await bitmap('worldecho-models', 144, 186, { left: 430, top: 170, width: 290, height: 430 }),
  towerYellow: await bitmap('worldecho-models', 128, 175, { left: 1240, top: 170, width: 290, height: 430 }),
  sidex: await bitmap('sidex', 760, 390),
};
const flock = [];
for (const sourceIndex of [0, 2, 3, 4, 5, 8, 9, 12, 13, 14, 15, 18, 20, 23, 25, 29]) {
  flock.push(await bitmap('pelicanmap', 172, 153, {
    left: (sourceIndex % 5) * 240 + 8,
    top: Math.floor(sourceIndex / 5) * 183 + 5,
    width: 220, height: 166,
  }));
}
function windowFrame(uri, x, y, w, h, label, accent) {
  return `<g filter="url(#shadow)">${rect(x, y, w, h, '#ffffff', 12)}${rect(x, y, w, 28, '#f6f7fa', 12)}${rect(x, y + 17, w, 11, '#f6f7fa')}<circle cx="${x + 13}" cy="${y + 14}" r="3" fill="#ff877d"/><circle cx="${x + 24}" cy="${y + 14}" r="3" fill="#efc262"/><circle cx="${x + 35}" cy="${y + 14}" r="3" fill="#63bd91"/>${text(x + 54, y + 18, 10, label, '#52616f', { font: 'mono', maxWidth: w - 75 })}${image(uri, x + 3, y + 29, w - 6, h - 33)}${rect(x, y, w, h, 'none', 12, `stroke="${accent}" stroke-opacity=".3"`)}</g>`;
}
function panelTranslate() {
  return `${rect(0, 0, 820, 420, '#2642b9')}${rect(0, 0, 820, 420, 'url(#grid)', 0, 'opacity=".6"')}
    ${text(40, 40, 14, 'ORIGINAL → TRANSLATION', '#d2ddff', { font: 'mono', spacing: 1 })}
    ${windowFrame(media.translate, 33, 70, 482, 300, 'DEEPSEEK HARNESS / THINKING', '#5173ff')}
    ${windowFrame(media.settings, 387, 139, 397, 273, 'THINK TRANSLATION / SETTINGS', '#5173ff')}
    ${rect(602, 44, 176, 48, '#d8f58a', 12)}${text(620, 76, 25, 'EN → 中文', '#193661', { font: 'bold' })}`;
}
function panelChat() {
  return `${rect(0, 0, 820, 420, '#0e1f25')}${rect(0, 0, 820, 420, 'url(#grid)', 0, 'opacity=".4"')}
    ${image(media.chatMark, 265, 32, 336, 288)}
    <g class="float-one">${rect(49, 46, 159, 159, '#17313a', 25, 'stroke="#31515b"')}${image(media.handshake, 55, 52, 147, 147)}${text(66, 227, 15, 'meet / 相遇', '#92c4ca', { font: 'sans' })}</g>
    <g class="float-two">${rect(632, 54, 150, 150, '#17313a', 25, 'stroke="#31515b"')}${image(media.dream, 637, 58, 140, 140)}${text(646, 226, 15, 'share / 分享', '#92c4ca', { font: 'sans' })}</g>
    ${rect(517, 257, 108, 108, '#17313a', 20, 'stroke="#31515b"')}${image(media.whisper, 522, 262, 98, 98)}
    ${text(40, 336, 39, 'Hello, agents.', '#e6f7f6', { font: 'serif' })}
    ${text(42, 379, 15, 'HALL   /   FORUM   /   LIVE', '#70cbd3', { font: 'mono', spacing: 1 })}`;
}
function panelWorld() {
  return `${rect(0, 0, 820, 420, '#04101c')}${image(media.globe, 0, -8, 820, 452)}
    <g transform="translate(595 26) rotate(8)">${rect(0, 0, 157, 214, '#fff8e9', 7)}${image(media.towerHat, 8, 8, 141, 176)}${text(12, 201, 12, 'PARIS, TEXAS', '#6c4233', { font: 'mono' })}</g>
    <g transform="translate(655 247) rotate(-7)">${rect(0, 0, 135, 177, '#fff8e9', 7)}${image(media.towerYellow, 7, 7, 121, 142)}${text(10, 166, 11, 'TAASTRUP', '#6c4233', { font: 'mono' })}</g>
    ${rect(33, 346, 295, 40, '#122332', 12, 'stroke="#52687b" stroke-opacity=".6"')}${text(49, 372, 16, 'DRAG THE GLOBE. FIND A TOWER.', '#edd3a4', { font: 'mono', maxWidth: 264 })}`;
}
function panelPelican() {
  const tiles = flock.map((uri, i) => {
    const x = 23 + (i % 4) * 196;
    const y = -57 + Math.floor(i / 4) * 178;
    return `${rect(x, y, 184, 168, '#fcfaf1', 8)}${image(uri, x + 6, y + 6, 172, 153)}`;
  }).join('');
  return `${rect(0, 0, 820, 420, '#dce6d7')}<g class="flock-scroll">${tiles}</g>${rect(0, 0, 820, 420, 'url(#galleryFade)')}`;
}
function panelSideX() {
  return `${rect(0, 0, 820, 420, '#142846')}${rect(0, 0, 820, 420, 'url(#grid)', 0, 'opacity=".55"')}
    ${text(35, 35, 14, 'TIMELINE + REPLIES / ONE PLACE', '#c1d5f2', { font: 'mono', spacing: .5 })}
    ${windowFrame(media.sidex, 32, 60, 756, 359, 'x.com / SIDEX', '#86aafc')}
    ${rect(568, 92, 212, 314, 'none', 5, 'stroke="#4b82f7" stroke-width="3"')}
    ${rect(508, 20, 272, 48, '#dbe6ff', 12)}${text(527, 52, 24, '评论在右边，阅读不中断。', '#163b77', { font: 'bold', maxWidth: 233 })}`;
}
const projects = [
  { slug: 'translate', title: 'Think Translate', titleSize: 47, number: '01', category: 'LANGUAGE TOOL', bg: '#eef2ff', ink: '#172652', muted: '#52658a', accent: '#3156df', titleFont: 'bold', cn: ['读懂 AI 的思考，', '用你熟悉的语言。'], en: 'Subtitles for AI thinking.', tags: ['8 LANGUAGES', 'OLLAMA'], panel: panelTranslate, grid: '#6c87e3' },
  { slug: 'agentschat', title: 'Agents Chat', titleSize: 52, number: '02', category: 'AGENT COMMUNITY', bg: '#122b31', ink: '#e7f7f5', muted: '#97b6ba', accent: '#63d9df', titleFont: 'bold', cn: ['让 Agent 彼此交流，', '也让人类来围观。'], en: 'A place for agents to meet.', tags: ['COMMUNITY', 'OPENCLAW'], panel: panelChat, grid: '#2c5058' },
  { slug: 'worldecho', title: 'WorldEcho', titleSize: 57, number: '03', category: 'A PLAYFUL PLANET', bg: '#fcf0e2', ink: '#573126', muted: '#8b6553', accent: '#b35538', titleFont: 'serif', cn: ['转动小小地球，', '寻找世界各地的铁塔。'], en: 'One landmark. A world of echoes.', tags: ['3D GLOBE', 'EXPLORE'], panel: panelWorld, grid: '#233d50' },
  { slug: 'pelicanmap', title: 'pelicanmap', titleSize: 55, number: '04', category: 'AI FIELD GUIDE', bg: '#eff2df', ink: '#294b39', muted: '#667951', accent: '#476c42', titleFont: 'serif', cn: ['同一个题目，', 'AI 画出一整群鹈鹕。'], en: 'One prompt. A whole flock.', tags: ['COLLECTION', 'CODE → ART'], panel: panelPelican, grid: '#b7cba8' },
  { slug: 'sidex', title: 'SideX', titleSize: 66, number: '05', category: 'BROWSER TOOL', bg: '#eaf0ff', ink: '#203b69', muted: '#536c94', accent: '#365bba', titleFont: 'bold', cn: ['看推文、读评论，', '留在同一条时间线上。'], en: 'Keep reading. Keep your place.', tags: ['CHROME EXTENSION', 'INLINE REPLIES'], panel: panelSideX, grid: '#3a5579' },
];
function svg(width, height, title, draw, extras = '') {
  glyphs = new Map();
  const body = draw();
  const defs = [...glyphs.entries()].map(([id, path]) => `<path id="${id}" d="${path}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title"><title id="title">${esc(title)}</title><defs>${defs}<clipPath id="outer">${rect(0, 0, width, height, '#fff', 22)}</clipPath><filter id="shadow" x="-10%" y="-10%" width="125%" height="130%"><feDropShadow dx="0" dy="5" stdDeviation="8" flood-opacity=".2"/></filter>${extras}</defs><style>@keyframes drift{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}@keyframes gallery{0%,100%{transform:translateY(0)}50%{transform:translateY(-22px)}}.float-one{animation:drift 7s ease-in-out infinite}.float-two{animation:drift 8s ease-in-out -3s infinite}.flock-scroll{animation:gallery 14s ease-in-out infinite}@media(prefers-reduced-motion:reduce){*{animation:none!important}}</style><g clip-path="url(#outer)">${body}</g>${rect(.5, .5, width - 1, height - 1, 'none', 21.5, 'stroke="#808080" stroke-opacity=".18"')}</svg>\n`;
}
function chips(p) {
  let x = 0;
  return p.tags.map(label => {
    const width = 24 + label.length * 7.5;
    const output = `${rect(x, 326, width, 31, 'none', 15, `stroke="${p.accent}" stroke-opacity=".45"`)}${text(x + 12, 347, 12, label, p.accent, { font: 'mono', spacing: .4 })}`;
    x += width + 10;
    return output;
  }).join('');
}
function leftPanel(p, mobile = false) {
  return `${text(0, 49, 14, `${p.number} / ${p.category}`, p.accent, { font: 'mono', spacing: 1.4 })}
    ${text(-2, 129, p.titleSize, p.title, p.ink, { font: p.titleFont, maxWidth: 410 })}
    ${text(0, 190, 28, p.cn[0], p.ink, { font: 'bold', maxWidth: 410 })}
    ${text(0, 231, 28, p.cn[1], p.ink, { font: 'bold', maxWidth: 410 })}
    ${text(0, 280, 20, p.en, p.muted, { maxWidth: 407 })}
    ${chips(p)}${mobile ? '' : arrow(387, 380, p.accent)}`;
}
const galleryFade = `<linearGradient id="galleryFade" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#dce6d7" stop-opacity=".45"/><stop offset=".18" stop-color="#dce6d7" stop-opacity="0"/><stop offset=".85" stop-color="#dce6d7" stop-opacity="0"/><stop offset="1" stop-color="#dce6d7" stop-opacity=".5"/></linearGradient>`;
for (const p of projects) {
  const extras = grid(p.grid) + galleryFade;
  const title = `${p.number} · ${p.title} — ${p.cn.join('')} ${p.en}`;
  writeFileSync(join(output, `card-${p.slug}.svg`), svg(1300, 420, title, () => `${rect(0, 0, 1300, 420, p.bg)}<g transform="translate(40 0)">${leftPanel(p)}</g><g transform="translate(480 0)">${p.panel()}</g>`, extras));
  writeFileSync(join(output, `card-${p.slug}-mobile.svg`), svg(720, 849, title, () => `${rect(0, 0, 720, 849, p.bg)}<g transform="translate(38 0) scale(1.3)">${leftPanel(p, true)}</g><g transform="translate(0 480) scale(.87805)">${p.panel()}</g>`, extras));
}
function header(mobile = false) {
  const w = mobile ? 720 : 1300;
  const h = mobile ? 470 : 300;
  return svg(w, h, 'UncleK — 写点工具，做点好玩的。AI tools, agent spaces & playful web experiments.', () => {
    const colors = ['#3156df', '#319b9f', '#b35538', '#476c42', '#365bba'];
    const swatches = colors.map((color, i) => rect((mobile ? 39 : 45) + i * 31, mobile ? 379 : 252, 22, 8, color, 4)).join('');
    const miniImages = [media.settings, media.chatMark, media.globe, flock[0], media.sidex];
    const mini = miniImages.map((uri, i) => `<g transform="translate(${mobile ? 328 + (i % 3) * 117 : 723 + i * 109} ${mobile ? 286 + Math.floor(i / 3) * 93 : 164}) rotate(${[-5, 3, -3, 5, -4][i]})">${rect(0, 0, 101, 78, '#fffdf7', 8, 'stroke="#c9c7ba"')}${image(uri, 5, 5, 91, 68)}</g>`).join('');
    if (mobile) return `${rect(0, 0, w, h, '#f4f1e7')}${text(39, 44, 14, 'UNCLEK / INDEPENDENT BUILDER', '#657069', { font: 'mono', spacing: 1 })}${text(32, 145, 91, 'UncleK.', '#243b32', { font: 'serif' })}${text(39, 220, 38, '写点工具，做点好玩的。', '#243b32', { font: 'bold', maxWidth: 648 })}${text(39, 268, 22, 'AI tools, agent spaces & playful web.', '#6c746b', { maxWidth: 630 })}${text(39, 355, 14, 'SELECTED WORK / 01—05', '#6c746b', { font: 'mono' })}${swatches}${mini}`;
    return `${rect(0, 0, w, h, '#f4f1e7')}${line(660, 42, 660, 258, '#cdd2c6')}${text(45, 51, 15, 'UNCLEK / INDEPENDENT BUILDER', '#657069', { font: 'mono', spacing: 1.2 })}${text(38, 172, 108, 'UncleK.', '#243b32', { font: 'serif' })}${text(46, 222, 16, 'AI TOOLS · AGENT SPACES · PLAYFUL WEB', '#6c746b', { font: 'mono', spacing: .4 })}${swatches}${text(714, 88, 34, '写点工具，做点好玩的。', '#243b32', { font: 'bold' })}${text(716, 128, 20, 'Curious ideas. Things you can actually use.', '#6c746b', { maxWidth: 530 })}${mini}${text(1040, 270, 13, 'SELECTED WORK / 01—05', '#6c746b', { font: 'mono' })}`;
  });
}
writeFileSync(join(output, 'header.svg'), header());
writeFileSync(join(output, 'header-mobile.svg'), header(true));
writeFileSync(join(output, 'footer.svg'), svg(1300, 112, '有想法，来项目里聊聊。Find a project, try it, tell me what you think. X: @Kedashu.', () => `${rect(0, 0, 1300, 112, '#f4f1e7')}${text(38, 65, 27, '有想法，来项目里聊聊。', '#294b39', { font: 'bold' })}${text(620, 62, 19, 'TRY SOMETHING. TELL ME WHAT YOU THINK.', '#6c746b', { font: 'mono', maxWidth: 585 })}`));
writeFileSync(join(output, 'footer-mobile.svg'), svg(720, 150, '有想法，来项目里聊聊。Try something. Tell me what you think.', () => `${rect(0, 0, 720, 150, '#f4f1e7')}${text(38, 65, 31, '有想法，来项目里聊聊。', '#294b39', { font: 'bold' })}${text(38, 113, 17, 'TRY SOMETHING. TELL ME WHAT YOU THINK.', '#6c746b', { font: 'mono' })}`));
console.log('Built header, five project cards, mobile variants and footer.');
