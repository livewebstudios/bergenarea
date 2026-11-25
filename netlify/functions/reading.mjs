// Today's Just For Today or Spiritual Principle A Day reading from NA World Services.
// GET /.netlify/functions/reading?kind=jft|spad  ->  { date, title, page, quote, source, content[], thought, copyright }
// Same sources and the same table layout as the bmlt-enabled fetch-meditation library.
// Nothing is stored. The answer is cached at the edge for an hour. The copyright line the feed sends is kept.

const SOURCES = {
  jft: { urls: ['https://jft.na.org/', 'https://na.org/jftna/'], keys: ['date', 'title', 'page', 'quote', 'source', 'content', 'thought', 'copyright'] },
  spad: { urls: ['https://spad.na.org/', 'https://na.org/spadna/'], keys: ['date', 'title', 'page', 'quote', 'source', 'content', 'divider', 'thought', 'copyright'] },
};
const TZ = 'America/New_York';
const DEFAULT_COPYRIGHT = `Copyright (c) 2007-${new Date().getFullYear()}, NA World Services, Inc. All Rights Reserved`;

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', mdash: '—', ndash: '–', hellip: '…' };
const decode = (s) => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m);
const text = (html) => decode(html.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();

function parse(html, keys) {
  const cells = [...html.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => m[1]);
  if (cells.length < keys.length - 1) return null;
  const out = {};
  keys.forEach((key, i) => {
    const cell = cells[i] ?? '';
    if (key === 'divider') return;
    if (key === 'content') {
      out.content = cell.split(/<br\s*\/?>/i).map(text).filter(Boolean);
    } else {
      out[key] = text(cell);
    }
  });
  if (!out.copyright) out.copyright = DEFAULT_COPYRIGHT;
  return out.title && out.content?.length ? out : null;
}

export default async (req) => {
  const kind = new URL(req.url).searchParams.get('kind');
  const source = SOURCES[kind];
  if (!source) return Response.json({ error: 'kind must be jft or spad' }, { status: 400 });

  for (const url of source.urls) {
    try {
      const res = await fetch(`${url}?timeZone=${encodeURIComponent(TZ)}`, {
        headers: { accept: 'text/html', 'user-agent': 'BergenAreaNA-reading/1.0 (+https://bergenarea.org/)' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const reading = parse(await res.text(), source.keys);
      if (reading) {
        return Response.json(reading, {
          headers: { 'cache-control': 'public, max-age=600', 'netlify-cdn-cache-control': 'public, s-maxage=3600, stale-while-revalidate=600' },
        });
      }
    } catch {
      // try the next source
    }
  }
  return Response.json({ error: 'all_sources_failed' }, { status: 502, headers: { 'cache-control': 'no-store' } });
};
