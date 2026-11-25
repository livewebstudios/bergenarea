// Dev helper: open a built page, run a few interactions, save screenshots.
// Usage: node scripts/probe.mjs <out-dir> <route> <width> <name> <action> [selector]
// action: notice | click | hover
import { chromium } from 'playwright';
import { serve } from './shots.mjs';
const [out, route, width, name, action, selector] = process.argv.slice(2);
const { server, port } = await serve();
const browser = await chromium.launch({ channel: 'chrome' });
const w = Number(width);
const ctx = await browser.newContext({ viewport: { width: w, height: w < 600 ? 844 : 900 }, reducedMotion: 'reduce', timezoneId: 'America/New_York' });
if (action !== 'notice') await ctx.addInitScript(() => { try { localStorage.setItem('ba-notice-nynl33', '1'); } catch {} });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('pageerror', String(e)));
await page.goto(`http://127.0.0.1:${port}${route}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(action === 'notice' ? 1500 : 400);
if (action === 'click') { await page.locator(selector).first().scrollIntoViewIfNeeded(); await page.locator(selector).first().click(); await page.waitForTimeout(400); }
if (action === 'hover') { await page.locator(selector).first().hover(); await page.waitForTimeout(300); }
await page.screenshot({ path: `${out}/${name}.png` });
await browser.close();
server.close();
