// Lighthouse (mobile) on each demo, plus the gzipped JavaScript each demo ships.
// Serves dist/ with gzip, the way a real host would. Usage: node scripts/lighthouse.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { chromium } from 'playwright';

const dist = path.resolve('dist');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json', '.txt': 'text/plain' };
const server = http.createServer((req, res) => {
  let file = path.join(dist, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!file.startsWith(dist) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  const ext = path.extname(file);
  const body = fs.readFileSync(file);
  const headers = { 'content-type': TYPES[ext] ?? 'application/octet-stream', 'cache-control': file.includes('/_astro/') ? 'public, max-age=31536000, immutable' : 'public, max-age=0' };
  if (['.html', '.css', '.js', '.svg', '.json', '.txt'].includes(ext) && /gzip/.test(req.headers['accept-encoding'] || '')) {
    res.writeHead(200, { ...headers, 'content-encoding': 'gzip' });
    res.end(zlib.gzipSync(body));
  } else { res.writeHead(200, headers); res.end(body); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const DEMOS = ['open-road', 'tonights-board', 'twenty-towns'];

// JavaScript per demo, gzipped
const browser = await chromium.launch({ channel: 'chrome' });
console.log('JavaScript shipped per demo (gzip):');
for (const demo of DEMOS) {
  const page = await browser.newPage();
  const files = new Map();
  page.on('response', async (r) => {
    const u = new URL(r.url());
    if (u.host === `127.0.0.1:${port}` && u.pathname.endsWith('.js')) files.set(u.pathname, zlib.gzipSync(fs.readFileSync(path.join(dist, u.pathname))).length);
  });
  await page.goto(`http://127.0.0.1:${port}/demo/${demo}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const total = [...files.values()].reduce((s, v) => s + v, 0);
  const html = zlib.gzipSync(fs.readFileSync(path.join(dist, 'demo', demo, 'index.html'))).length;
  console.log(`  ${demo.padEnd(16)} ${(total / 1024).toFixed(1)} KB in ${files.size} files   (HTML ${(html / 1024).toFixed(1)} KB gzip)`);
  await page.close();
}
await browser.close();

const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new', '--no-first-run'] });
console.log('\nLighthouse mobile:');
for (const demo of DEMOS) {
  const result = await lighthouse(`http://127.0.0.1:${port}/demo/${demo}/`, { port: chrome.port, onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'], output: 'json', logLevel: 'error' });
  const c = result.lhr.categories;
  const a = result.lhr.audits;
  const score = (x) => Math.round(x.score * 100);
  console.log(`  ${demo.padEnd(16)} Performance ${score(c.performance)}  Accessibility ${score(c.accessibility)}  Best Practices ${score(c['best-practices'])}  SEO ${score(c.seo)}   LCP ${a['largest-contentful-paint'].displayValue}  CLS ${a['cumulative-layout-shift'].displayValue}  TBT ${a['total-blocking-time'].displayValue}`);
  for (const cat of ['accessibility', 'best-practices']) {
    for (const ref of c[cat].auditRefs) {
      const audit = a[ref.id];
      if (audit.score !== null && audit.score < 1 && ref.weight > 0) console.log(`      ${cat}: ${audit.id}: ${audit.title}${audit.details?.items?.[0]?.node?.snippet ? '  ' + audit.details.items[0].node.snippet.slice(0, 110) : ''}`);
    }
  }
}
await chrome.kill();
server.close();
