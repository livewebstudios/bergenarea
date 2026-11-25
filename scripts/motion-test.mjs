// Motion checks on the built pages: each demo's one signature move fires, and
// prefers-reduced-motion shows the finished result with no movement.
// Usage: node scripts/motion-test.mjs   (run `npm run build` first)
import { chromium } from 'playwright';
import { serve } from './shots.mjs';

const { server, port } = await serve();
const browser = await chromium.launch({ channel: 'chrome' });
let failed = 0;
const check = (label, ok, detail = '') => { if (!ok) failed++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? `  (${detail})` : ''}`); };
const open = async (route, reducedMotion, opts = {}) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion, timezoneId: 'America/New_York', ...opts });
  await ctx.addInitScript(() => { try { localStorage.setItem('ba-notice-nynl33', '1'); } catch {} });
  const page = await ctx.newPage();
  return { ctx, page, go: () => page.goto(`http://127.0.0.1:${port}${route}`, { waitUntil: 'load' }) };
};

// ---- Demo 1: the dotted path draws stretch by stretch as sections come into view
for (const mode of ['no-preference', 'reduce']) {
  const { ctx, page, go } = await open('/demo/open-road/', mode);
  await go();
  await page.waitForTimeout(1200);
  const state = () => page.evaluate(() => [...document.querySelectorAll('[data-path-stop]')].map((s) => {
    const r = s.querySelector('.d1-path__reveal');
    return { seen: s.classList.contains('is-seen'), offset: r ? getComputedStyle(r).strokeDashoffset : 'none' };
  }));
  const before = await state();
  if (mode === 'no-preference') {
    check('demo 1: path stretches exist on a wide screen', before.every((s) => s.offset !== 'none'), `${before.length} stretches`);
    check('demo 1: hero stretch is drawn, far stretches wait', before[0].offset === '0px' && before[before.length - 1].offset === '1px', before.map((s) => s.offset).join(' '));
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    const after = await state();
    check('demo 1: last stretch draws when scrolled into view (700ms)', after[after.length - 1].offset === '0px', after[after.length - 1].offset);
    const scrolled = await page.evaluate(() => window.scrollY);
    check('demo 1: the path does not move the page', scrolled > 0);
  } else {
    check('demo 1 reduced motion: the whole path is simply there', before.every((s) => s.offset === '0px'), before.map((s) => s.offset).join(' '));
  }
  await ctx.close();
}

// ---- Demo 2: the Next Meeting tile counts down, changes to Happening now, and flips once to the next answer
for (const mode of ['no-preference', 'reduce']) {
  const { ctx, page, go } = await open('/demo/tonights-board/', mode);
  await page.clock.install({ time: new Date('2026-11-24T19:57:10-05:00') }); // Tuesday 7:57 PM New York
  await go();
  await page.clock.runFor(4000);
  await page.waitForTimeout(300);
  const read = () => page.evaluate(() => ({
    label: document.querySelector('.d2-next__label')?.textContent,
    name: document.querySelector('.d2-next__name')?.textContent,
    count: document.querySelector('.d2-next__count')?.textContent,
    live: document.querySelector('.d2-next [aria-live="polite"]')?.textContent,
    off: document.querySelector('.d2-next__count')?.getAttribute('aria-live'),
    anims: document.querySelector('.d2-next__face')?.getAnimations().length,
  }));
  const a = await read();
  check(`demo 2 ${mode}: counts down inside the last hour`, a.label === 'Next meeting' && a.count === 'Starts in 3 min', `${a.label} / ${a.name} / ${a.count}`);
  check(`demo 2 ${mode}: ticking text is aria-live off, summary is polite`, a.off === 'off' && /^Next meeting: /.test(a.live || ''), a.live);
  await page.clock.runFor(60000);
  await page.waitForTimeout(200);
  const b = await read();
  check(`demo 2 ${mode}: countdown updates once a minute`, b.count === 'Starts in 2 min', b.count);
  await page.clock.runFor(120000);
  await page.waitForTimeout(300);
  const c = await read();
  check(`demo 2 ${mode}: changes to Happening now when the meeting starts, same tile, no flip`, c.label === 'Happening now' && c.name === a.name && c.anims === 0, `${c.label} / ${c.name} / anims ${c.anims}`);
  await page.clock.runFor(3600000); // one hour on: 9:00 PM, nothing is on, tomorrow's first meeting is the answer
  const mid = await read();
  await page.waitForTimeout(700);
  const d = await read();
  if (mode === 'no-preference') check('demo 2: the tile turns over once when the next meeting becomes the answer', mid.anims >= 1 && d.anims === 0 && d.name !== c.name && d.label === 'Next meeting', `anims ${mid.anims} then ${d.anims}, now "${d.name}", ${d.count}`);
  else check('demo 2 reduced motion: content swaps with no flip', mid.anims === 0 && d.name !== c.name && d.label === 'Next meeting', `anims ${mid.anims}, now "${d.name}"`);
  check(`demo 2 ${mode}: polite summary announces the new meeting`, (d.live || '').includes(d.name || '???'), d.live);
  await ctx.close();
}

// ---- Demo 3: the map inks itself in, pins drop, choosing a town draws a ring
for (const mode of ['no-preference', 'reduce']) {
  const { ctx, page, go } = await open('/demo/twenty-towns/', mode);
  await go();
  const names = await page.evaluate(() => ({
    wipe: getComputedStyle(document.querySelector('.d3-wipe')).animationName,
    dot: getComputedStyle(document.querySelector('.d3-dot')).animationName,
    lastDelay: getComputedStyle(document.querySelector('.d3-dots > g:last-child')).animationDelay,
    dots: document.querySelectorAll('.d3-dot').length,
  }));
  if (mode === 'no-preference') {
    check('demo 3: outline and river draw, dots land in a stagger', names.wipe === 'd3-wipe' && names.dot === 'd3-dot', `${names.dots} dots, last delay ${names.lastDelay}`);
    check('demo 3: every dot has landed inside 1.2s', parseFloat(names.lastDelay) * 1000 + 200 <= 1200, `${parseFloat(names.lastDelay) * 1000 + 200}ms`);
    await page.waitForTimeout(2200);
    const running = await page.evaluate(() => document.getAnimations().filter((x) => x.playState === 'running').length);
    check('demo 3: nothing is still moving after the ink-in (no loops)', running === 0, `${running} running`);
    const pins = await page.evaluate(() => document.querySelectorAll('.d3-pin').length);
    check('demo 3: pins dropped on today\'s towns', pins > 0, `${pins} pins`);
    await page.locator('button.d3-town--ridgewood').click();
    const ring = await page.evaluate(() => ({ name: getComputedStyle(document.querySelector('.d3-ring__reveal')).animationName, dash: getComputedStyle(document.querySelector('.d3-ring')).strokeDasharray }));
    check('demo 3: choosing a town draws one dotted ring', ring.name === 'd3-ring' && ring.dash !== 'none', `${ring.name}, dash ${ring.dash}`);
  } else {
    check('demo 3 reduced motion: everything is in place at once', names.wipe === 'none' && names.dot === 'none', `${names.wipe} / ${names.dot}`);
    await page.waitForTimeout(600);
    await page.locator('button.d3-town--ridgewood').click();
    const ring = await page.evaluate(() => getComputedStyle(document.querySelector('.d3-ring')).strokeDasharray);
    check('demo 3 reduced motion: selection is a solid ring', ring === 'none', ring);
  }
  await ctx.close();
}

await browser.close();
server.close();
console.log(failed ? `\n${failed} motion check(s) failed.` : '\nAll motion checks passed.');
process.exit(failed ? 1 : 0);
