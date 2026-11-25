// One helper for every internal link and asset path.
// It respects import.meta.env.BASE_URL so the site works at a domain root or in a subfolder.
const RAW_BASE: string = import.meta.env.BASE_URL || '/';
const BASE = RAW_BASE.endsWith('/') ? RAW_BASE : RAW_BASE + '/';

/** Internal route or public asset. href('demo/open-road/') or href('img/logo.png'). */
export function href(path = ''): string {
  return BASE + path.replace(/^\/+/, '');
}

/** Phase 2 pages do not exist yet. Their links are stubs. */
export const STUB = '#';

export const routes = {
  chooser: () => href(''),
  demo1: () => href('demo/open-road/'),
  demo2: () => href('demo/tonights-board/'),
  demo3: () => href('demo/twenty-towns/'),
};
