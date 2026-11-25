// Turns the short link forms used in the data files into real addresses.
//   "doc:OrderForm2026.pdf"  a file in public/docs/ (or the old site's copy until it is moved over)
//   "route:contact"          a page on this site
//   "/contact-us/"           a page on this site, old-site style
//   "https://..."            somewhere else, opens in a new tab
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import documents from '../data/documents.json';
import { href, R, type RouteKey } from './href';

export function docUrl(file: string): string {
  if (existsSync(join(process.cwd(), 'public', 'docs', file))) return href(`docs/${file}`);
  const old = documents.files.find((d) => d.file === file)?.old_url;
  if (!old) throw new Error(`documents.json has no entry for ${file}`);
  return old;
}

export function resolveLink(raw: string): { url: string; external: boolean } {
  if (raw.startsWith('doc:')) return { url: docUrl(raw.slice(4)), external: false };
  if (raw.startsWith('route:')) return { url: href(R[raw.slice(6) as RouteKey]), external: false };
  if (raw.startsWith('/')) return { url: href(raw), external: false };
  if (raw.startsWith('mailto:') || raw.startsWith('tel:') || raw.startsWith('#')) return { url: raw, external: false };
  return { url: raw, external: true };
}

export const policyUrl = (label: string) => documents.policies.find((p) => p.label === label)?.href;
