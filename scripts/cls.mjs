// Dev helper: which elements shift during load on a phone. Usage: node scripts/cls.mjs
import { chromium } from 'playwright';
import { serve } from './shots.mjs';
const { server, port } = await serve();
const browser = await chromium.launch({ channel: 'chrome' });
for (const demo of ['open-road', 'tonights-board', 'twenty-towns']) {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.addInitScript(() => {
    window.__shifts = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.hadRecentInput) continue;
        window.__shifts.push({ v: e.value, t: Math.round(e.startTime), s: e.sources.map((x) => { const n = x.node; const el = n && (n.nodeType === 1 ? n : n.parentElement); return el ? `${el.tagName.toLowerCase()}.${String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className).split(' ').slice(0, 2).join('.')} ${Math.round(x.previousRect.y)}->${Math.round(x.currentRect.y)} h${Math.round(x.previousRect.height)}->${Math.round(x.currentRect.height)}` : '?'; }) });
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto(`http://127.0.0.1:${port}/demo/${demo}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  const shifts = await page.evaluate(() => window.__shifts);
  console.log(`\n${demo}: CLS ${shifts.reduce((s, x) => s + x.v, 0).toFixed(3)}`);
  for (const s of shifts) console.log(`  ${s.v.toFixed(4)} at ${s.t}ms  ${s.s.slice(0, 4).join(' | ')}`);
  await ctx.close();
}
await browser.close();
server.close();
