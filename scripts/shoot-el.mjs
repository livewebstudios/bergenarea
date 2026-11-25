// Dev helper: screenshot one element of a built page. Usage: node scripts/shoot-el.mjs <out.png> <route> <width> <selector> [clickSelector]
import { chromium } from 'playwright';
import { serve } from './shots.mjs';
const [out, route, width, selector, click] = process.argv.slice(2);
const { server, port } = await serve();
const browser = await chromium.launch({ channel: 'chrome' });
const w = Number(width);
const ctx = await browser.newContext({ viewport: { width: w, height: w < 600 ? 844 : 1000 }, deviceScaleFactor: 2, reducedMotion: 'reduce', timezoneId: 'America/New_York' });
await ctx.addInitScript(() => { try { localStorage.setItem('ba-notice-nynl33', '1'); } catch {} });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('pageerror', String(e)));
await page.goto(`http://127.0.0.1:${port}${route}`, { waitUntil: 'networkidle' });
await page.addStyleTag({ content: '.demo-switcher{display:none!important}' });
if (click) { await page.locator(click).first().click(); await page.waitForTimeout(500); }
await page.waitForTimeout(400);
await page.locator(selector).first().screenshot({ path: out });
await browser.close();
server.close();
