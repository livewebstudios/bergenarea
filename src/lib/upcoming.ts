// Which events, area meetings and notices are showing right now.
// Everything compares New York wall-clock strings. No device zone is ever trusted.
import {
  addDays, compareToWall, formatWall, nthWeekday, nyDayKey, nyParts, parseWall, clockToMinutes, type WallParts,
} from './time.ts';

export interface EventItem {
  title: string;
  /** New York wall clock, "2026-12-31T12:00" */
  start: string;
  end?: string;
  location_name?: string;
  address?: string;
  virtual_link?: string;
  virtual_info?: string;
  summary?: string;
  flyer?: string;
  flyer_alt?: string;
  link_label?: string;
  link_url?: string;
  note?: string;
  sample?: boolean;
  /** set by this module, never typed in */
  status?: 'moved';
}

export interface Recurring {
  title: string;
  /** 3 = third */
  nth: number;
  /** 0 = Sunday */
  weekday: number;
  start_time: string;
  end_time: string;
  location_name: string;
  address: string;
  exceptions: { date: string; status: 'cancelled' | 'moved'; new_start?: string; note?: string }[];
}

export interface AreaMeetingsFile { recurring: Recurring; extra: EventItem[] }

export interface Notice {
  enabled: boolean;
  id: string;
  style: 'info' | 'urgent' | 'celebration';
  title: string;
  body: string;
  image?: string;
  image_alt?: string;
  button_label?: string;
  button_url?: string;
  /** New York dates, "2026-11-24" */
  start: string;
  end: string;
  frequency: 'once' | 'every-visit';
  scope: 'home' | 'all-pages';
}

/** When an item stops being "upcoming": its end, or its start when there is no end. */
export const expiresAt = (ev: EventItem) => ev.end || ev.start;

/** An event is upcoming until its end (or its start if it has no end) passes in New York time. */
export function isUpcoming(ev: EventItem, now: Date): boolean {
  const until = expiresAt(ev);
  if (!until) return false;
  return compareToWall(now, until) <= 0;
}

/** Soonest first, past ones dropped, cut to `limit`. Home shows up to 2 per area. */
export function selectUpcoming(events: EventItem[], now: Date, limit = 2): EventItem[] {
  return events
    .filter((ev) => isUpcoming(ev, now))
    .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0))
    .slice(0, limit);
}

/**
 * Seed items marked `sample: true` with a blank start get a date a fixed number of days
 * after the build day, so the SAMPLE card never goes stale while the Area is reviewing.
 */
export function resolveSamples(events: EventItem[], buildNow: Date, daysAhead: number, startClock = '19:00', endClock = '20:30'): EventItem[] {
  return events.map((ev) => {
    if (!ev.sample || ev.start) return ev;
    const day = addDays({ ...nyParts(buildNow), hour: 0, minute: 0 }, daysAhead);
    const at = (clock: string): string => {
      const mins = clockToMinutes(clock);
      return formatWall({ ...day, hour: Math.floor(mins / 60), minute: mins % 60 });
    };
    return { ...ev, start: at(startClock), end: at(endClock) };
  });
}

/** The next dates of the recurring Area Service meeting. Computed, so nobody types it in each month. */
export function recurringOccurrences(rule: Recurring, now: Date, count = 3): EventItem[] {
  const out: EventItem[] = [];
  const p = nyParts(now);
  let year = p.year;
  let month = p.month;
  for (let i = 0; i < 18 && out.length < count; i++) {
    let day: number;
    try {
      day = nthWeekday(year, month, rule.nth, rule.weekday);
    } catch {
      day = 0;
    }
    if (day) {
      const date: WallParts = { year, month, day, hour: 0, minute: 0 };
      const dateKey = formatWall(date).slice(0, 10);
      const exception = rule.exceptions?.find((x) => x.date === dateKey);
      if (exception?.status !== 'cancelled') {
        const startMin = clockToMinutes(rule.start_time);
        const endMin = clockToMinutes(rule.end_time);
        let start = formatWall({ ...date, hour: Math.floor(startMin / 60), minute: startMin % 60 });
        let end = formatWall({ ...date, hour: Math.floor(endMin / 60), minute: endMin % 60 });
        let status: EventItem['status'];
        if (exception?.status === 'moved' && exception.new_start) {
          const moved = parseWall(exception.new_start);
          start = formatWall(moved);
          const total = moved.hour * 60 + moved.minute + Math.max(0, endMin - startMin);
          end = formatWall({ ...addDays(moved, Math.floor(total / 1440)), hour: Math.floor((total % 1440) / 60), minute: total % 60 });
          status = 'moved';
        }
        const item: EventItem = {
          title: rule.title, start, end, location_name: rule.location_name, address: rule.address, note: exception?.note || '', status,
        };
        if (isUpcoming(item, now)) out.push(item);
      }
    }
    month += 1;
    if (month > 12) { month = 1; year += 1; }
  }
  return out;
}

/** Area Service plus JAC, budget and other one-off area meetings, soonest first. */
export function areaMeetings(file: AreaMeetingsFile, now: Date, limit = 2): EventItem[] {
  const pool = [...recurringOccurrences(file.recurring, now, limit + 1), ...file.extra.filter((e) => e.start)];
  return selectUpcoming(pool, now, limit);
}

/** Shows only when enabled, today is inside start..end (New York), and scope matches. */
export function noticeActive(notice: Notice, now: Date, page: 'home' | 'other' = 'home'): boolean {
  if (!notice.enabled) return false;
  if (page !== 'home' && notice.scope !== 'all-pages') return false;
  const todayKey = nyDayKey(now);
  if (notice.start && todayKey < notice.start) return false;
  if (notice.end && todayKey > notice.end) return false;
  return true;
}
