// Screenshots of the built site (dist/). Serves dist on a local port, then captures
// each route at each width. Usage:
//   node scripts/shots.mjs <out-dir> [--routes=/,/demo/open-road/] [--widths=390,1440] [--notice] [--motion]
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const out = args.find((a) => !a.startsWith('--')) ?? 'screenshots';
const opt = (name, fallback) => (args.find((a) => a.startsWith(`--${name}=`)) ?? `--${name}=${fallback}`).split('=')[1];
const routes = opt('routes', '/,/demo/open-road/,/demo/tonights-board/,/demo/twenty-towns/').split(',');
const widths = opt('widths', '390,1440').split(',').map(Number);
const showNotice = args.includes('--notice');
const motion = args.includes('--motion');
const dist = path.resolve('dist');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.json': 'application/json', '.txt': 'text/plain' };

export function serve(root = dist) {
  const server = http.createServer((req, res) => {
    let file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (file.endsWith(path.sep) || (fs.existsSync(file) && fs.statSync(file).isDirectory())) file = path.join(file, 'index.html');
    if (!file.startsWith(root) || !fs.existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port })));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fs.mkdirSync(out, { recursive: true });
  const { server, port } = await serve();
  const browser = await chromium.launch({ channel: 'chrome' });
  for (const width of widths) {
    const ctx = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : 900 }, deviceScaleFactor: 1, reducedMotion: motion ? 'no-preference' : 'reduce', timezoneId: 'America/New_York' });
    if (!showNotice) await ctx.addInitScript(() => { try { localStorage.setItem('ba-notice-nynl33', '1'); } catch {} });
    for (const route of routes) {
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      await page.goto(`http://127.0.0.1:${port}${route}`, { waitUntil: 'networkidle' });
      await page.evaluate(async () => {
        document.querySelectorAll('img[loading="lazy"]').forEach((img) => { img.loading = 'eager'; });
        await Promise.all([...document.images].map((img) => (img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; }))));
        await document.fonts.ready;
      });
      await page.waitForTimeout(showNotice ? 1400 : 500);
      const name = (route === '/' ? 'chooser' : route.replace(/^\/demo\//, '').replace(/\//g, '')) + `-${width}${showNotice ? '-notice' : ''}`;
      await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: !showNotice });
      const scroll = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      console.log(`${name}: scrollWidth ${scroll.sw} / ${scroll.cw}${scroll.sw > scroll.cw ? '  <-- HORIZONTAL SCROLL' : ''}${errors.length ? `  errors: ${errors.join(' | ')}` : ''}`);
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
  server.close();
}
