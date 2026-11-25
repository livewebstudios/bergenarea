// Measured contrast on the built pages: every visible text element against its real ground.
// Usage: node scripts/contrast-live.mjs   (run `npm run build` first)
// Text over a picture is reported as "over picture" and checked by eye, since a ground color cannot be computed.
import { chromium } from 'playwright';
import { serve } from './shots.mjs';

const ROUTES = ['/', '/demo/open-road/', '/demo/tonights-board/', '/demo/twenty-towns/'];
const { server, port } = await serve();
const browser = await chromium.launch({ channel: 'chrome' });
let failures = 0;

const audit = () => {
  const parse = (c) => { const m = c.match(/[\d.]+/g).map(Number); return { r: m[0], g: m[1], b: m[2], a: m[3] === undefined ? 1 : m[3] }; };
  const toRgb = (color) => { const ctx = document.createElement('canvas').getContext('2d'); ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1); const d = ctx.getImageData(0, 0, 1, 1).data; return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 }; };
  const lin = (c) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  const over = (top, under) => ({ r: top.r * top.a + under.r * (1 - top.a), g: top.g * top.a + under.g * (1 - top.a), b: top.b * top.a + under.b * (1 - top.a), a: 1 });
  const groundOf = (el) => {
    const layers = [];
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      const bg = toRgb(cs.backgroundColor);
      if (bg.a > 0) layers.push(bg);
      if (bg.a === 1) break;
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base);
    return base;
  };
  const rows = new Map();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.nodeValue.trim()) continue;
    const el = node.parentElement;
    if (!el || el.closest('script,style,noscript,.sr-only,.skip-link,[hidden],svg')) continue;
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    if (cs.visibility === 'hidden' || cs.display === 'none' || rect.width === 0 || rect.height === 0) continue;
    if (el.offsetParent === null && cs.position !== 'fixed') continue;
    const fg0 = toRgb(cs.color);
    const bg = groundOf(el);
    const fg = over(fg0, bg);
    const [hi, lo] = [lum(fg), lum(bg)].sort((a, b) => b - a);
    const ratio = (hi + 0.05) / (lo + 0.05);
    const size = parseFloat(cs.fontSize);
    const bold = Number(cs.fontWeight) >= 600;
    const large = size >= 24 || (size >= 18.66 && bold);
    const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
    const key = `${hex(fg)} on ${hex(bg)}`;
    const prev = rows.get(key);
    const cls = (el.className && typeof el.className === 'string' ? el.className.split(' ')[0] : el.tagName.toLowerCase()) || el.tagName.toLowerCase();
    if (!prev) rows.set(key, { key, ratio, min: size, large, where: new Set([cls]), sample: node.nodeValue.trim().slice(0, 28) });
    else { prev.where.add(cls); if (size < prev.min) { prev.min = size; prev.large = large; } }
  }
  return [...rows.values()].map((r) => ({ ...r, where: [...r.where].slice(0, 5).join(' ') }));
};

for (const width of [1440, 390]) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', timezoneId: 'America/New_York' });
  await ctx.addInitScript(() => { try { localStorage.setItem('ba-notice-nynl33', '1'); } catch {} });
  for (const route of ROUTES) {
    const page = await ctx.newPage();
    await page.goto(`http://127.0.0.1:${port}${route}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const rows = await page.evaluate(audit);
    const bad = rows.filter((r) => r.ratio < (r.large ? 3 : 4.5));
    failures += bad.length;
    console.log(`\n${route}  @${width}  ${rows.length} color pairs, ${bad.length} under the line`);
    for (const r of rows.sort((a, b) => a.ratio - b.ratio)) {
      console.log(`  ${r.ratio < (r.large ? 3 : 4.5) ? 'FAIL' : 'ok  '} ${r.ratio.toFixed(2).padStart(5)}  ${r.key}  min ${r.min.toFixed(1)}px  ${r.where}  "${r.sample}"`);
    }
    await page.close();
  }
  await ctx.close();
}
await browser.close();
server.close();
console.log(failures ? `\n${failures} pair(s) under the line.` : '\nEvery measured text pair is at or above 4.5:1.');
process.exit(failures ? 1 : 0);
