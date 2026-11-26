// The site menu. Labels are the old site's, word for word (deck.site.nav). This file only adds where each goes.
import { deck } from '../content/deck';
import { R, type RouteKey } from './href';
import { readings } from '../content/pages';

const TARGET: Record<string, RouteKey> = {
  Meetings: 'meetings',
  Service: 'service',
  'Area Service': 'service',
  Activities: 'activities',
  Convention: 'convention',
  'Fellowship Development': 'fd',
  'Hospitals & Institutions': 'handi',
  'Public Relations': 'pr',
  'Regional Committee Member (RCM)': 'rcm',
  Events: 'events',
  'For the Public': 'public',
  Members: 'cleantime',
  'Cleantime Calculator': 'cleantime',
  'Group Start Dates': 'startDates',
  Contact: 'contact',
};

/** path is a page on this site; url is somewhere else (opens in a new tab) */
export interface NavLink { label: string; path: string; url?: string }
export interface NavItem extends NavLink { children?: NavLink[] }

/** Menu items that leave the site. */
const OUTSIDE: Record<string, string> = {
  'Just For Today': readings.jft,
  'Spiritual Principle A Day': readings.spad,
};

const link = (label: string): NavLink => {
  if (OUTSIDE[label]) return { label, path: '', url: OUTSIDE[label] };
  const key = TARGET[label];
  if (!key) throw new Error(`nav: no page for "${label}"`);
  return { label, path: R[key] };
};

export const NAV: NavItem[] = deck.site.nav.map((item) => ({
  ...link(item.label),
  children: item.children?.map(link),
}));

export const FOOTER_NAV: NavLink[] = deck.site.footerNav.map(link);

/** Is this nav item (or one of its children) the page being shown? */
export function isCurrent(item: NavItem, path: string): boolean {
  const here = path.replace(/^\/+/, '');
  return item.path === here || !!item.children?.some((c) => !c.url && c.path === here);
}
