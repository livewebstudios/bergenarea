// Dev helper: rasterize public/ink/*.svg so the drawings can be inspected by eye.
// Usage: node scripts/shoot-ink.mjs <out-dir> [slot ...]
import { chromium } from 'playwright';
import fs from 'node:fs';
const out = process.argv[2];
const only = process.argv.slice(3);
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
for (const f of fs.readdirSync('public/ink').filter((f) => f.endsWith('.svg'))) {
  const slot = f.replace('.svg', '');
  if (only.length && !only.includes(slot)) continue;
  const svg = fs.readFileSync(`public/ink/${f}`, 'utf8');
  const [, w, h] = /viewBox="0 0 (\d+) (\d+)"/.exec(svg);
  const scale = 1200 / w;
  await page.setContent(`<body style="margin:0;background:#FDEECE">${svg.replace('<svg ', '<svg style="width:100%;height:auto;display:block;mix-blend-mode:multiply" ')}</body>`);
  await page.screenshot({ path: `${out}/${slot}.png`, clip: { x: 0, y: 0, width: 1200, height: Math.round(h * scale) } });
}
await browser.close();
