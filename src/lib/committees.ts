// Subcommittee meeting dates, computed from a rule so nobody types them in each month.
import { addDays, clockToMinutes, formatWall, nthWeekday, nyParts, type WallParts } from './time.ts';
import { isUpcoming, type EventItem } from './upcoming.ts';

export interface MeetRule {
  label: string;
  /** 3 = third */
  nth: number;
  /** 0 = Sunday */
  weekday: number;
  /** a day after the nth weekday: PR meets 2 days after the 3rd Tuesday */
  plus_days?: number;
  /** months (1-12) with no meeting */
  skip_months?: number[];
  start: string;
  end: string;
  place?: string;
  address?: string;
  zoom?: string;
  zoom_id?: string;
  zoom_password?: string;
  confirm?: boolean;
}

/** The next `count` dates for one rule, soonest first, as event items. */
export function ruleDates(rule: MeetRule, now: Date, count = 3): EventItem[] {
  const out: EventItem[] = [];
  const p = nyParts(now);
  let year = p.year;
  let month = p.month;
  for (let i = 0; i < 24 && out.length < count; i++) {
    if (!rule.skip_months?.includes(month)) {
      let day = 0;
      try { day = nthWeekday(year, month, rule.nth, rule.weekday); } catch { day = 0; }
      if (day) {
        const date: WallParts = addDays({ year, month, day, hour: 0, minute: 0 }, rule.plus_days ?? 0);
        const at = (clock: string) => {
          const m = clockToMinutes(clock);
          return formatWall({ ...date, hour: Math.floor(m / 60), minute: m % 60 });
        };
        const item: EventItem = { title: rule.label, start: at(rule.start), end: at(rule.end), location_name: rule.place, address: rule.address };
        if (isUpcoming(item, now)) out.push(item);
      }
    }
    month += 1;
    if (month > 12) { month = 1; year += 1; }
  }
  return out;
}

/** Every rule's next dates merged, soonest first. */
export function nextDates(rules: MeetRule[], now: Date, count = 4): (EventItem & { rule: MeetRule })[] {
  return rules
    .flatMap((rule) => ruleDates(rule, now, count).map((ev) => ({ ...ev, rule })))
    .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0))
    .slice(0, count);
}
