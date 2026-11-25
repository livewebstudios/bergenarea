// All time math for the site. Everything is computed in America/New_York,
// no matter what zone the phone or the build machine is set to.
// Content JSON holds New York wall-clock strings with no offset ("2026-12-31T12:00").
// They are never fed to `new Date()`. They are compared as strings, or converted
// to an instant with nyWallToInstant().

export const TZ = 'America/New_York';

export interface WallParts {
  year: number;
  month: number; // 1 to 12
  day: number;
  hour: number;
  minute: number;
}
export interface NYParts extends WallParts {
  second: number;
  weekday: number; // 0 = Sunday
}

const partsFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

const pad = (n: number) => String(n).padStart(2, '0');

/** The New York wall clock for an instant. */
export function nyParts(date: Date): NYParts {
  const out: Record<string, number> = {};
  for (const p of partsFormat.formatToParts(date)) {
    if (p.type !== 'literal') out[p.type] = Number(p.value);
  }
  const hour = out.hour === 24 ? 0 : out.hour;
  return {
    year: out.year,
    month: out.month,
    day: out.day,
    hour,
    minute: out.minute,
    second: out.second,
    weekday: weekdayOf(out.year, out.month, out.day),
  };
}

/** Day of week for a calendar date. 0 = Sunday. Pure calendar math, no zones. */
export function weekdayOf(year: number, month: number, day: number): number {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** "2026-12-15" for an instant, in New York. */
export function nyDayKey(date: Date): string {
  const p = nyParts(date);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** "2026-12-15T19:30" for an instant, in New York. Sorts and compares as a string. */
export function nyWall(date: Date): string {
  const p = nyParts(date);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/** Minutes since New York midnight for an instant. */
export function nyMinutes(date: Date): number {
  const p = nyParts(date);
  return p.hour * 60 + p.minute;
}

/** Day of week in New York for an instant. 0 = Sunday. */
export function nyWeekday(date: Date): number {
  return nyParts(date).weekday;
}

/** Parse "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm" without touching the device zone. */
export function parseWall(wall: string): WallParts {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(wall);
  if (!m) throw new Error(`Bad wall-clock string: "${wall}"`);
  return { year: +m[1], month: +m[2], day: +m[3], hour: m[4] ? +m[4] : 0, minute: m[5] ? +m[5] : 0 };
}

export function formatWall(p: WallParts): string {
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/** Add whole days to a calendar date. Pure calendar math. */
export function addDays(p: WallParts, days: number): WallParts {
  const d = new Date(Date.UTC(p.year, p.month - 1, p.day + days));
  return { ...p, year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/** The instant at which the New York wall clock reads the given time. */
export function nyWallToInstant(p: WallParts): Date {
  const target = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  let guess = target;
  for (let i = 0; i < 3; i++) {
    const g = nyParts(new Date(guess));
    const seen = Date.UTC(g.year, g.month - 1, g.day, g.hour, g.minute);
    const diff = target - seen;
    if (diff === 0) break;
    guess += diff;
  }
  return new Date(guess);
}

/** -1 when the instant is before the wall time, 0 same minute, 1 after. A date-only string means the start of that day. */
export function compareToWall(now: Date, wall: string): number {
  const a = nyWall(now);
  const b = formatWall(parseWall(wall));
  return a < b ? -1 : a > b ? 1 : 0;
}

/** nth weekday of a month. weekday 0 = Sunday. Area Service is (3, 2): the 3rd Tuesday. Returns the day of the month. */
export function nthWeekday(year: number, month: number, n: number, weekday: number): number {
  const first = weekdayOf(year, month, 1);
  const day = 1 + ((weekday - first + 7) % 7) + (n - 1) * 7;
  if (day > daysInMonth(year, month)) throw new Error(`No ${n}th weekday ${weekday} in ${year}-${month}`);
  return day;
}

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/** 1170 -> "7:30pm". Same format as the old site's meeting list. */
export function formatClock(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const mm = m % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${pad(mm)}${h24 < 12 ? 'am' : 'pm'}`;
}

/** 1170 -> "7:30 PM". Used for event times, as the old events list wrote them. */
export function formatClockUpper(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const mm = m % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${pad(mm)} ${h24 < 12 ? 'AM' : 'PM'}`;
}

/** "HH:MM" or "HH:MM:SS" -> minutes. */
export function clockToMinutes(clock: string): number {
  const [h, m] = clock.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** "Tue, Dec 15" for a wall-clock string. */
export function formatWallDate(wall: string): string {
  const p = parseWall(wall);
  return `${DAY_SHORT[weekdayOf(p.year, p.month, p.day)]}, ${MONTH_SHORT[p.month - 1]} ${p.day}`;
}

/** Event range in the old site's style: "Dec 31, 12:00 PM - Jan 2, 1:00 PM" or "Tue, Dec 15, 7:30 PM - 10:00 PM". */
export function formatWallRange(start: string, end?: string): string {
  const s = parseWall(start);
  const sTime = formatClockUpper(s.hour * 60 + s.minute);
  if (!end) return `${formatWallDate(start)}, ${sTime}`;
  const e = parseWall(end);
  const eTime = formatClockUpper(e.hour * 60 + e.minute);
  if (s.year === e.year && s.month === e.month && s.day === e.day) {
    return `${formatWallDate(start)}, ${sTime} - ${eTime}`;
  }
  return `${MONTH_SHORT[s.month - 1]} ${s.day}, ${sTime} - ${MONTH_SHORT[e.month - 1]} ${e.day}, ${eTime}`;
}
