import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const output = fileURLToPath(new URL('../assets/', import.meta.url));
mkdirSync(output, { recursive: true });
const themes = {
  dark: { bg: '#0c131d', panel: '#111e2b', text: '#edf5fc', muted: '#90a6bc', line: '#293b4c', cyan: '#39d5e7', purple: '#b995ff' },
  light: { bg: '#f4f8fc', panel: '#eaf1f7', text: '#142a40', muted: '#526d87', line: '#ccdae6', cyan: '#007e91', purple: '#7650bf' },
};
const text = (x, y, size, value, color, extra = '') => `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" ${extra}>${value}</text>`;
const wrap = (w, h, name, p, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="title">
<title id="title">${name}</title>
<defs><linearGradient id="accent" x2="1" y2="1"><stop stop-color="${p.cyan}"/><stop offset="1" stop-color="${p.purple}"/></linearGradient><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="${p.line}" stroke-width="0.6"/></pattern></defs>
<rect width="${w}" height="${h}" rx="22" fill="${p.bg}"/>
<g font-family="Segoe UI,Arial,sans-serif">${body}</g></svg>\n`;

for (const [theme, p] of Object.entries(themes)) {
  const header = wrap(1200, 370, 'UncleK — AI hunter. Agents, tools and experiments.', p, `
    <rect x="690" width="510" height="370" rx="22" fill="url(#grid)" opacity="0.5"/>
    <path d="M48 43H72" stroke="${p.cyan}" stroke-width="3"/>
    ${text(86, 49, 16, 'UNCLEK / AI HUNTER', p.muted, 'letter-spacing="3"')}
    ${text(46, 142, 76, 'Agents, tools', p.text, 'font-weight="700" letter-spacing="-3"')}
    ${text(46, 227, 76, '&amp; experiments.', 'url(#accent)', 'font-weight="700" letter-spacing="-3"')}
    ${text(48, 318, 19, 'CONNECT. COMMUNICATE. CREATE.', p.muted, 'letter-spacing="2"')}
    <g transform="translate(946 183)">
      <circle r="133" fill="none" stroke="${p.line}"/>
      <ellipse rx="172" ry="70" transform="rotate(-34)" fill="none" stroke="${p.cyan}" stroke-width="2" opacity="0.8"/>
      <ellipse rx="172" ry="70" transform="rotate(34)" fill="none" stroke="${p.purple}" stroke-width="2" opacity="0.8"/>
      <path d="M-123-38L96-84L109 84Z" fill="${p.panel}" stroke="${p.line}"/>
      <path d="M-123-38L0 0L96-84M0 0L109 84" fill="none" stroke="url(#accent)" stroke-width="2"/>
      <circle cx="-123" cy="-38" r="12" fill="${p.cyan}"/>
      <circle cx="96" cy="-84" r="9" fill="${p.purple}"/>
      <circle cx="109" cy="84" r="9" fill="${p.cyan}"/>
      <circle r="31" fill="${p.bg}" stroke="url(#accent)" stroke-width="2"/>
      <path d="M-11 0H11M0-11V11" stroke="${p.text}" stroke-width="2"/>
    </g>`);
  writeFileSync(`${output}/header-${theme}.svg`, header);

  const chat = wrap(1200, 220, 'Agents Chat — A community for AI agents.', p, `
    <rect x="0" y="25" width="4" height="170" rx="2" fill="${p.cyan}"/>
    ${text(36, 45, 15, '01 / AGENT COMMUNITY', p.cyan, 'letter-spacing="2"')}
    ${text(34, 121, 60, 'Agents Chat', p.text, 'font-weight="700" letter-spacing="-2"')}
    ${text(36, 174, 26, 'All agents welcome. Humans too.', p.muted)}
    <g transform="translate(938 110)" fill="none" stroke="url(#accent)" stroke-width="3">
      <path d="M-58-12L30-50L74 38L-58-12M30-50L2 66"/>
      <circle cx="-58" cy="-12" r="29" fill="${p.bg}"/><circle cx="30" cy="-50" r="21" fill="${p.bg}"/>
      <circle cx="74" cy="38" r="24" fill="${p.bg}"/><circle cx="2" cy="66" r="15" fill="${p.bg}"/>
    </g>
    <path d="M1118 48H1150V80M1150 48L1118 80" fill="none" stroke="${p.muted}" stroke-width="2"/>`);
  writeFileSync(`${output}/agentschat-${theme}.svg`, chat);

  for (const [slug, number, label, title, subtitle] of [
    ['agentscant', '02', 'AUDIO PROTOCOL', 'AgentsCant', 'Sound as a protocol'],
    ['translate', '03', 'LANGUAGE TOOL', 'Think Translate', 'Read across languages'],
  ]) {
    const color = slug === 'agentscant' ? p.purple : p.cyan;
    const icon = slug === 'agentscant'
      ? [13, 24, 39, 26, 17, 31, 45, 24, 12].map((h, i) => `<path d="M${416 + i * 12} ${68 - h / 2}v${h}" stroke="${color}" stroke-width="4" stroke-linecap="round"/>`).join('')
      : `${text(446, 87, 48, 'A', color, 'font-weight="600"')}<path d="M510 45L522 57L510 69M522 57H493" fill="none" stroke="${color}" stroke-width="3"/>`;
    writeFileSync(`${output}/${slug}-${theme}.svg`, wrap(580, 225, `${title} — ${subtitle}`, p, `
      ${text(24, 39, 13, `${number} / ${label}`, color, 'letter-spacing="1.3"')}
      ${text(23, 130, 46, title, p.text, 'font-weight="700" letter-spacing="-1.5"')}
      ${text(24, 184, 23, subtitle, p.muted)}${icon}`));
  }
}
