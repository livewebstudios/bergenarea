// One helper for every internal link and asset path.
// It respects import.meta.env.BASE_URL so the site works at a domain root or in a subfolder.
const RAW_BASE: string = import.meta.env.BASE_URL || '/';
const BASE = RAW_BASE.endsWith('/') ? RAW_BASE : RAW_BASE + '/';

/** Internal route or public asset. href('meetings/') or href('img/logo.svg'). */
export function href(path = ''): string {
  return BASE + path.replace(/^\/+/, '');
}

/** Every page on the site. Old WordPress slugs are kept so saved links keep working. */
export const R = {
  home: '',
  meetings: 'meetings/',
  printable: 'meetings/printable/',
  service: 'service/',
  activities: 'service/activities/',
  convention: 'service/convention/',
  fd: 'service/fd/',
  handi: 'service/handi/',
  pr: 'service/pr/',
  rcm: 'service/rcm/',
  events: 'events/',
  public: 'for-the-public/',
  cleantime: 'cleantime/',
  startDates: 'group-start-dates/',
  contact: 'contact-us/',
  donations: 'donations/',
  seventh: '7th-tradition-donation-information/',
  car: 'car-report/',
  privacy: 'privacy/',
} as const;

export type RouteKey = keyof typeof R;
export const route = (key: RouteKey) => href(R[key]);
