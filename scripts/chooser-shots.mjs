// Makes the three chooser card pictures (1200 x 750, the top of each demo at 1440 wide)
// and the Open Graph picture (1200 x 630). Run after `npm run build`, then build again.
// DEMO SCAFFOLDING: the chooser pictures go away at promote. Keep og.png or replace it.
import { chromium } from 'playwright';
import sharp from 'sharp';
import { serve } from './shots.mjs';

const { server, port } = await serve();
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce', timezoneId: 'America/New_York' });
await ctx.addInitScript(() => { try { localStorage.setItem('ba-notice-nynl33', '1'); } catch {} });
const DEMOS = [[1, 'open-road'], [2, 'tonights-board'], [3, 'twenty-towns']];
for (const [n, slug] of DEMOS) {
  const page = await ctx.newPage();
  await page.goto(`http://127.0.0.1:${port}/demo/${slug}/`, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: '.demo-switcher{display:none!important}' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  const shot = await page.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 900 } });
  await sharp(shot).resize(1200, 750).png({ compressionLevel: 9, palette: true, colours: 256 }).toFile(`public/img/chooser-${n}.png`);
  if (n === 1) {
    // Open Graph: the hero title and the river valley, no chrome
    await page.setViewportSize({ width: 1200, height: 630 });
    await page.addStyleTag({ content: '.d1-helpline,.d1-nav{display:none!important}.d1-hero{padding-top:2.5rem!important}.d1-hero__title{font-size:5.5rem!important}.d1-hero__scene{margin-top:-5rem!important}' });
    await page.waitForTimeout(300);
    const og = await page.screenshot({ clip: { x: 0, y: 0, width: 1200, height: 630 } });
    await sharp(og).png({ compressionLevel: 9, palette: true, colours: 256 }).toFile('public/img/og.png');
  }
  await page.close();
}
await browser.close();
server.close();
console.log('chooser-1.png, chooser-2.png, chooser-3.png and og.png written to public/img/');
