// Acceptance checks (handoff section 9) run against the built site in a real browser.
// Usage: node scripts/functional-test.mjs   (run `npm run build` first)
import { chromium } from 'playwright';
import fs from 'node:fs';
import { serve } from './shots.mjs';

const { server, port } = await serve();
const browser = await chromium.launch({ channel: 'chrome' });
const base = `http://127.0.0.1:${port}`;
let failed = 0;
let passed = 0;
const check = (label, ok, detail = '') => { ok ? passed++ : failed++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? `  (${detail})` : ''}`); };

const DEMOS = [
  { n: 1, route: '/demo/open-road/', row: '.d1-row', day: '.d1-day', inPerson: '.d1-venue button:nth-child(1)', virtual: '.d1-venue button:nth-child(2)', title: '.d1-finder__title', detail: '.d1-detail', town: 'select' },
  { n: 2, route: '/demo/tonights-board/', row: '.d2-card', day: '.d2-day', inPerson: '.d2-seg button:nth-child(1)', virtual: '.d2-seg button:nth-child(2)', title: '.d2-today__title', detail: '.d2-detail', town: 'select' },
  { n: 3, route: '/demo/twenty-towns/', row: '.d3-item', day: '.d3-day', inPerson: '.d3-venue button:nth-child(1)', virtual: '.d3-venue button:nth-child(2)', title: '.d3-panel__title', detail: '.d3-detail', town: 'map' },
];
const newPage = async (opts = {}, quiet = true) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', timezoneId: 'America/New_York', ...opts });
  if (quiet) await ctx.addInitScript(() => { try { localStorage.setItem('ba-notice-nynl33', '1'); } catch {} });
  const page = await ctx.newPage();
  return { ctx, page };
};

// ---------- review gate
for (const route of ['/', ...DEMOS.map((d) => d.route)]) {
  const html = await (await fetch(base + route)).text();
  check(`noindex on ${route}`, /<meta name="robots" content="noindex, nofollow">/.test(html));
}
const robots = await (await fetch(base + '/robots.txt')).text();
check('robots.txt disallows everything', /User-agent: \*\s+Disallow: \//.test(robots), robots.trim().replace(/\n/g, ' | '));
check('no sitemap in this session', !fs.existsSync('dist/sitemap.xml') && !fs.existsSync('dist/sitemap-index.xml'));

// ---------- per demo
for (const d of DEMOS) {
  const tag = `demo ${d.n}`;
  const html = fs.readFileSync(`dist${d.route}index.html`, 'utf8');
  check(`${tag}: both helpline numbers dial`, html.includes('href="tel:+18009920401"') && html.includes('href="tel:+17329330462"'));
  check(`${tag}: next Area Service date is computed (Dec 15, 2026)`, html.includes('Tue, Dec 15, 7:30 PM - 10:00 PM'));
  check(`${tag}: logo is an <img>, never wider than 312`, /<img[^>]+src="[^"]*img\/logo\.png"[^>]+width="(\d+)"/.test(html) && [...html.matchAll(/<img[^>]+src="[^"]*img\/logo\.png"[^>]+width="(\d+)"/g)].every((m) => Number(m[1]) <= 312));
  check(`${tag}: badge is 150 wide`, /verifiedsecured\.png"[^>]+width="150"/.test(html));

  // third-party requests before any user action
  {
    const { ctx, page } = await newPage();
    const hosts = new Set();
    page.on('request', (r) => { const h = new URL(r.url()).host; if (h !== `127.0.0.1:${port}`) hosts.add(h); });
    await page.goto(base + d.route, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    const before = [...hosts];
    check(`${tag}: no third-party request before a user action, except the meeting API`, before.every((h) => h === 'bmlt.nanj.org'), before.join(', ') || 'none at all');
    await page.locator('.video__poster').scrollIntoViewIfNeeded();
    const noFrame = await page.locator('iframe').count();
    await page.locator('.video__poster').click();
    await page.waitForTimeout(1200);
    const src = await page.locator('iframe.video__frame').getAttribute('src');
    check(`${tag}: video loads nothing until clicked, then youtube-nocookie with autoplay`, noFrame === 0 && /^https:\/\/www\.youtube-nocookie\.com\/embed\/cYJnZBg53vc\?autoplay=1/.test(src || ''), src);
    await ctx.close();
  }

  // JavaScript off
  {
    const { ctx, page } = await newPage({ javaScriptEnabled: false });
    await page.goto(base + d.route);
    const rows = await page.locator(d.row).count();
    const first = (await page.locator(d.row).first().innerText()).replace(/\s+/g, ' ').slice(0, 60);
    const heading = await page.locator(d.title).innerText();
    const flags = await page.getByText(/^(Next meeting|Happening now)$/i).filter({ visible: true }).count();
    check(`${tag}: JavaScript off, the build day's list is readable`, rows > 0 && /am|pm/.test(first), `${rows} meetings under "${heading}", first: ${first}`);
    check(`${tag}: JavaScript off makes no live claims`, !/today|tomorrow/i.test(heading) && flags === 0, `heading "${heading}", ${flags} live flags`);
    await ctx.close();
  }

  // New York time with the machine set to UTC and to Los Angeles
  for (const zone of ['UTC', 'America/Los_Angeles']) {
    const { ctx, page } = await newPage({ timezoneId: zone });
    await page.clock.install({ time: new Date('2026-11-25T04:59:00Z') }); // 11:59 PM Tuesday in New York
    await page.goto(base + d.route, { waitUntil: 'load' });
    await page.clock.runFor(1500);
    await page.waitForTimeout(600);
    const before = { title: await page.locator(d.title).innerText(), rows: await page.locator(d.row).count(), pressed: await page.locator(`${d.day}[aria-pressed="true"]`).innerText() };
    await page.clock.runFor(120000); // two minutes on: 12:01 AM Wednesday
    await page.waitForTimeout(400);
    const after = { title: await page.locator(d.title).innerText(), rows: await page.locator(d.row).count(), pressed: await page.locator(`${d.day}[aria-pressed="true"]`).innerText() };
    check(`${tag}: "today" is New York's Tuesday at 11:59 PM with the machine on ${zone}`, before.title === 'Today' && before.rows === 5 && /tue|today/i.test(before.pressed), `${before.rows} meetings, tab "${before.pressed.replace(/\s+/g, ' ')}"`);
    check(`${tag}: rolls to Wednesday at 12:01 AM New York with the machine on ${zone}`, after.title === 'Today' && after.rows === 7 && /wed|today/i.test(after.pressed), `${after.rows} meetings, tab "${after.pressed.replace(/\s+/g, ' ')}"`);
    const flag = await page.locator(d.row).filter({ hasText: /next meeting/i }).count();
    check(`${tag}: "next" after midnight is Wednesday's first meeting (${zone})`, flag >= 1, `${flag} row(s) flagged`);
    await ctx.close();
  }

  // filters, details, links: keyboard on desktop, touch on a phone
  for (const input of ['keyboard', 'touch']) {
    const { ctx, page } = await newPage(input === 'touch' ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } : {});
    await page.clock.install({ time: new Date('2026-11-24T15:00:00-05:00') }); // Tuesday 3:00 PM New York
    await page.goto(base + d.route, { waitUntil: 'load' });
    await page.clock.runFor(1500);
    await page.waitForTimeout(500);
    const act = async (loc) => { if (input === 'touch') { await loc.scrollIntoViewIfNeeded(); await loc.tap(); } else { await loc.focus(); await page.keyboard.press('Enter'); } await page.waitForTimeout(120); };
    const all = await page.locator(d.row).count();

    await act(page.locator(d.virtual));
    const virt = await page.locator(d.row).allInnerTexts();
    check(`${tag} ${input}: Virtual filter`, virt.length > 0 && virt.length < all && virt.every((t) => /virtual/i.test(t)), `${virt.length} of ${all}`);
    await act(page.locator(d.row).first());
    const dlg = page.locator(d.detail);
    const vLinks = await dlg.locator('a').evaluateAll((as) => as.map((a) => `${a.textContent.trim()}|${a.getAttribute('href')}`));
    check(`${tag} ${input}: virtual meeting has Join on Zoom and no Directions`, vLinks.some((l) => /^Join on Zoom\|https:\/\/(us02web\.)?zoom\.us\//.test(l)) && !vLinks.some((l) => /^Directions/.test(l)), vLinks.join(' ; ').slice(0, 110));
    const role = await dlg.evaluate((el) => `${el.getAttribute('role')} ${el.getAttribute('aria-modal')} ${document.getElementById(el.getAttribute('aria-labelledby'))?.textContent}`);
    check(`${tag} ${input}: details is a real dialog labelled by the meeting name`, /^dialog true \S/.test(role), role);
    if (input === 'keyboard') {
      for (let i = 0; i < 9; i++) await page.keyboard.press('Tab');
      check(`${tag} keyboard: focus is trapped in the dialog`, await page.evaluate((sel) => !!document.activeElement.closest(sel), d.detail));
      await page.keyboard.press('Escape');
      await page.waitForTimeout(150);
      check(`${tag} keyboard: Escape closes and focus returns to the row`, (await dlg.count()) === 0 && await page.evaluate((sel) => document.activeElement.matches(sel), d.row));
    } else {
      await dlg.getByRole('button', { name: 'Close' }).tap();
      await page.waitForTimeout(150);
      check(`${tag} touch: Close button closes`, (await dlg.count()) === 0);
    }

    await act(page.locator(d.inPerson));
    const inp = await page.locator(d.row).allInnerTexts();
    check(`${tag} ${input}: In person filter`, inp.length > 0 && inp.every((t) => !/\bvirtual\b/i.test(t)), `${inp.length} of ${all}`);
    await act(page.locator(d.row).first());
    const pLinks = await dlg.locator('a').evaluateAll((as) => as.map((a) => `${a.textContent.trim()}|${a.getAttribute('href')}`));
    check(`${tag} ${input}: in-person meeting has Directions to its coordinates`, pLinks.some((l) => /^Directions\|https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=4\d\.\d+,-7\d\.\d+$/.test(l)), pLinks.join(' ; ').slice(0, 110));
    const formats = await dlg.getByText('Formats').count();
    check(`${tag} ${input}: format names are spelled out`, formats === 1 && /Open \(anyone welcome\)|Discussion|Closed/.test(await dlg.innerText()));
    if (input === 'touch') await page.touchscreen.tap(8, 60); else await page.mouse.click(8, 60); // the backdrop
    await page.waitForTimeout(150);
    check(`${tag} ${input}: backdrop closes`, (await dlg.count()) === 0);
    await act(page.locator(d.inPerson)); // clear the filter

    // a dial-in number: Sunday's "Steppin' It Up" carries one
    const sunday = page.locator(d.day).filter({ hasText: /sun/i });
    await act(sunday);
    const sun = await page.locator(d.row).count();
    check(`${tag} ${input}: day tabs`, sun === 7, `Sunday shows ${sun} meetings`);
    await act(page.locator(d.row).filter({ hasText: 'Steppin' }).first());
    const call = await dlg.locator('a[href^="tel:"]').evaluateAll((as) => as.map((a) => `${a.textContent.trim()}|${a.getAttribute('href')}`));
    check(`${tag} ${input}: dial-in number dials`, call.some((l) => /^Call in 646-558-8656\|tel:\+16465588656$/.test(l)), call.join(' ; '));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);

    // town picker
    if (d.town === 'select') {
      await page.locator(`${d.n === 1 ? '.d1-town' : '.d2-town'} select`).selectOption('Ridgewood');
      await act(page.locator(d.day).filter({ hasText: /mon/i }));
      const rw = await page.locator(d.row).allInnerTexts();
      check(`${tag} ${input}: town picker`, rw.length === 1 && /Living Clean Book Discussion/.test(rw[0]), rw.join(' / ').replace(/\s+/g, ' ').slice(0, 80));
    } else {
      const target = input === 'touch' ? page.locator('.d3-chip', { hasText: 'Ridgewood' }) : page.locator('button.d3-town--ridgewood');
      await act(target);
      const rw = await page.locator(d.row).count();
      const title = await page.locator(d.title).innerText();
      const pressed = await page.locator('button.d3-town--ridgewood').getAttribute('aria-pressed');
      check(`${tag} ${input}: tapping a town shows that town's week`, title === 'Ridgewood' && rw === 3 && pressed === 'true', `${rw} meetings, map button aria-pressed=${pressed}`);
      await act(page.locator('.d3-reset'));
      check(`${tag} ${input}: All towns resets`, (await page.locator(d.title).innerText()) !== 'Ridgewood');
      if (input === 'keyboard') {
        const order = await page.locator('.d3-town').evaluateAll((els) => els.map((e) => e.textContent.trim()));
        check(`${tag}: towns are real buttons in A to Z tab order`, order.length === 20 && [...order].sort((a, b) => a.localeCompare(b)).join() === order.join(), `${order.length} buttons`);
      }
    }
    const live = await page.locator('[aria-live="polite"]').allInnerTexts();
    check(`${tag} ${input}: results announce through aria-live`, live.some((t) => /meetings?$|No meetings$/.test(t.trim())), live.map((t) => t.trim()).filter(Boolean).join(' | ').slice(0, 90));
    await ctx.close();
  }

  // the notice popup
  {
    const { ctx, page } = await newPage({}, false);
    await page.goto(base + d.route, { waitUntil: 'load' });
    await page.waitForTimeout(450);
    const early = await page.locator('.notice').count();
    await page.waitForTimeout(900);
    const n = page.locator('.notice');
    const info = await n.evaluate((el) => ({ role: el.getAttribute('role'), modal: el.getAttribute('aria-modal'), title: document.getElementById(el.getAttribute('aria-labelledby'))?.textContent, focusIn: el.contains(document.activeElement), locked: document.documentElement.classList.contains('dialog-open') && getComputedStyle(document.documentElement).overflow === 'hidden' })).catch(() => null);
    check(`${tag}: notice opens about 800ms after load, not before`, early === 0 && !!info);
    check(`${tag}: notice is a labelled modal dialog, focus moves in, page behind is locked`, !!info && info.role === 'dialog' && info.modal === 'true' && info.title === 'New Year New Life 33' && info.focusIn && info.locked, JSON.stringify(info));
    for (let i = 0; i < 7; i++) await page.keyboard.press('Tab');
    check(`${tag}: notice traps focus`, await page.evaluate(() => !!document.activeElement.closest('.notice')));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    check(`${tag}: Escape closes the notice`, (await n.count()) === 0);
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(1500);
    check(`${tag}: notice shows once and remembers`, (await n.count()) === 0);
    const replay = page.locator('[data-notice-replay]');
    await replay.click();
    await page.waitForTimeout(250);
    check(`${tag}: NOTICE in the switcher replays it regardless of memory`, (await n.count()) === 1);
    await n.getByRole('button', { name: 'Close' }).click();
    await page.waitForTimeout(200);
    check(`${tag}: Close button closes and focus returns to where it was`, (await n.count()) === 0 && await replay.evaluate((el) => el === document.activeElement));
    await replay.click();
    await page.waitForTimeout(250);
    await page.mouse.click(8, 60);
    await page.waitForTimeout(200);
    check(`${tag}: backdrop closes the notice`, (await n.count()) === 0);
    await ctx.close();
    for (const [when, label] of [['2026-11-23T12:00:00-05:00', 'before its start date'], ['2027-01-03T12:00:00-05:00', 'after its end date']]) {
      const x = await newPage({}, false);
      await x.page.clock.install({ time: new Date(when) });
      await x.page.goto(base + d.route, { waitUntil: 'load' });
      await x.page.clock.runFor(3000);
      await x.page.waitForTimeout(300);
      check(`${tag}: notice stays shut ${label}`, (await x.page.locator('.notice').count()) === 0);
      await x.ctx.close();
    }
  }

  // events drop off in the browser without a rebuild
  {
    const { ctx, page } = await newPage();
    await page.clock.install({ time: new Date('2027-01-05T12:00:00-05:00') });
    await page.goto(base + d.route, { waitUntil: 'load' });
    await page.clock.runFor(2000);
    await page.waitForTimeout(300);
    const areas = await page.locator('[data-upcoming]').evaluateAll((boxes) => boxes.map((b) => ({ shown: [...b.querySelectorAll('[data-expires]')].filter((i) => !i.hidden).map((i) => i.querySelector('p').textContent.trim()), empty: !b.querySelector('[data-empty]').hidden, text: b.querySelector('[data-empty]').textContent })));
    check(`${tag}: past events drop off in the browser, empty areas say so`, areas.length === 3 && areas[1].shown.length === 0 && areas[1].empty && areas[1].text === 'Nothing posted right now.' && areas[0].shown.length >= 1 && areas[0].shown.every((t) => t === 'Bergen Area Service'), JSON.stringify(areas.map((a) => a.shown.length ? a.shown : 'EMPTY')));
    await ctx.close();
  }
}

// chooser
{
  const { ctx, page } = await newPage({}, false);
  await page.goto(base + '/', { waitUntil: 'load' });
  await page.waitForTimeout(1600);
  check('chooser: the notice never shows here', (await page.locator('.notice').count()) === 0);
  const cards = await page.locator('.chooser-card__btn').allInnerTexts();
  check('chooser: three cards with OPEN DESIGN buttons', cards.join() === 'OPEN DESIGN 1,OPEN DESIGN 2,OPEN DESIGN 3', cards.join(', '));
  const fonts = await page.evaluate(() => [...document.fonts].map((f) => f.family));
  check('chooser: no demo styling leaks onto it', fonts.length === 0 && (await page.locator('[class^="d1-"],[class^="d2-"],[class^="d3-"]').count()) === 0, `${fonts.length} web fonts`);
  await ctx.close();
}

await browser.close();
server.close();
console.log(`\n${passed} passed, ${failed} failed.`);
process.exit(failed ? 1 : 0);
