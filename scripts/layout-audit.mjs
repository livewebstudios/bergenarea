// Layout audit on the built pages: horizontal scroll, clipped text, tap targets, image sizes, heading order.
// Usage: node scripts/layout-audit.mjs   (run `npm run build` first)
import { chromium } from 'playwright';
import { serve } from './shots.mjs';

const ROUTES = ['/', '/demo/open-road/', '/demo/tonights-board/', '/demo/twenty-towns/'];
const WIDTHS = [320, 360, 375, 390, 768, 1024, 1440, 1920];
const { server, port } = await serve();
const browser = await chromium.launch({ channel: 'chrome' });
let problems = 0;

const audit = () => {
  const out = { scroll: document.documentElement.scrollWidth - document.documentElement.clientWidth, small: [], clipped: [], images: [], headings: [], h1: document.querySelectorAll('h1').length };
  const vw = document.documentElement.clientWidth;
  const visible = (el) => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0 && !el.closest('[hidden]'); };
  const name = (el) => `${el.tagName.toLowerCase()}.${(typeof el.className === 'string' ? el.className : '').split(' ')[0]} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 24)}"`;
  // tap targets: 44px in both directions (inline links inside a sentence are exempt, as WCAG 2.5.8 allows)
  document.querySelectorAll('a[href], button, select, input').forEach((el) => {
    if (!visible(el) || el.closest('.sr-only, .skip-link')) return;
    const r = el.getBoundingClientRect();
    const inline = el.tagName === 'A' && getComputedStyle(el).display === 'inline' && el.parentElement && el.parentElement.textContent.trim().length > el.textContent.trim().length + 4;
    if (inline) return;
    if (r.width < 43.5 || r.height < 43.5) out.small.push(`${name(el)} ${Math.round(r.width)}x${Math.round(r.height)}`);
  });
  // text that pokes out of the viewport
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (walker.nextNode()) {
    const el = walker.currentNode.parentElement;
    if (!walker.currentNode.nodeValue.trim() || !el || seen.has(el) || !visible(el) || el.closest('.sr-only, .skip-link, .d3-chips, svg, script, style')) continue;
    seen.add(el);
    const range = document.createRange();
    range.selectNodeContents(walker.currentNode);
    const r = range.getBoundingClientRect();
    if (r.width && (r.right > vw + 1 || r.left < -1)) out.clipped.push(`${name(el)} left ${Math.round(r.left)} right ${Math.round(r.right)} of ${vw}`);
  }
  document.querySelectorAll('img').forEach((img) => {
    if (!img.hasAttribute('width') || !img.hasAttribute('height')) out.images.push(`no size: ${img.getAttribute('src')}`);
    if (!img.hasAttribute('alt')) out.images.push(`no alt: ${img.getAttribute('src')}`);
    if (img.naturalWidth === 0 && img.complete) out.images.push(`broken: ${img.getAttribute('src')}`);
    if (/logo\.png$/.test(img.getAttribute('src') || '') && img.getBoundingClientRect().width > 312) out.images.push('logo wider than 312px');
  });
  let last = 0;
  document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
    if (h.closest('[role="dialog"]')) return;
    const level = Number(h.tagName[1]);
    if (level > last + 1) out.headings.push(`skip: h${last} to h${level} "${h.textContent.trim().slice(0, 30)}"`);
    last = level;
  });
  return out;
};

for (const route of ROUTES) {
  for (const width of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width, height: width < 600 ? 800 : 900 }, reducedMotion: 'reduce', timezoneId: 'America/New_York' });
    await ctx.addInitScript(() => { try { localStorage.setItem('ba-notice-nynl33', '1'); } catch {} });
    const page = await ctx.newPage();
    await page.goto(`http://127.0.0.1:${port}${route}`, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      document.querySelectorAll('img[loading="lazy"]').forEach((img) => { img.loading = 'eager'; });
      await Promise.all([...document.images].map((img) => (img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; }))));
    });
    await page.waitForTimeout(250);
    const r = await page.evaluate(audit);
    const issues = [];
    if (r.scroll > 0) issues.push(`HORIZONTAL SCROLL ${r.scroll}px`);
    if (r.h1 !== 1) issues.push(`${r.h1} H1`);
    issues.push(...r.small.map((s) => `tap target: ${s}`), ...r.clipped.map((s) => `clipped: ${s}`), ...r.images, ...r.headings);
    problems += issues.length;
    console.log(`${route.padEnd(24)} ${String(width).padStart(4)}  ${issues.length ? '' : 'clean'}`);
    for (const i of issues.slice(0, 14)) console.log(`      ${i}`);
    if (issues.length > 14) console.log(`      ... and ${issues.length - 14} more`);
    await ctx.close();
  }
}
await browser.close();
server.close();
console.log(problems ? `\n${problems} item(s) to look at.` : '\nLayout audit clean at every width.');
process.exit(problems ? 1 : 0);
