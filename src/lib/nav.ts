// The site menu. Labels are the old site's, word for word (deck.site.nav). This file only adds where each goes.
import { deck } from '../content/deck';
import { R, type RouteKey } from './href';

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
  Members: 'jft',
  'Just For Today': 'jft',
  'Spiritual Principle A Day': 'spad',
  'Cleantime Calculator': 'cleantime',
  'Group Start Dates': 'startDates',
  Contact: 'contact',
};

export interface NavLink { label: string; path: string }
export interface NavItem extends NavLink { children?: NavLink[] }

const link = (label: string): NavLink => {
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
  return item.path === here || !!item.children?.some((c) => c.path === here);
}
