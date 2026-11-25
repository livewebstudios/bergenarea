// Shared finder logic. Each demo draws its own finder. They all think with this hook.
// The island shows the build-time list at once, then refreshes from the meeting database
// and swaps quietly if anything changed. A failed refresh changes nothing on screen.
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchRaw, happeningNow, isInPerson, isVirtual, nextUpAll, normalize, signature, towns as townsOf, counts as countsOf,
  type Meeting, type Upcoming,
} from './bmlt';
import { DAY_NAMES, DAY_SHORT, formatClock, nyWeekday } from './time';
import { ui } from '../content/deck';

export type VenueFilter = 'all' | 'in-person' | 'virtual';
export type Status = 'now' | 'next' | undefined;

export interface FinderOptions {
  /** how often the clock ticks, ms. The visible countdown updates once a minute. */
  tickMs?: number;
}

export function useFinder(initial: Meeting[], buildNow: number, opts: FinderOptions = {}) {
  const [meetings, setMeetings] = useState(initial);
  // Start on the build clock so server HTML and first client render agree, then switch to the real clock.
  const [now, setNow] = useState(() => new Date(buildNow));
  const [pickedDay, setPickedDay] = useState<number | null>(null);
  const [venue, setVenue] = useState<VenueFilter>('all');
  const [town, setTown] = useState('');
  const [detail, setDetail] = useState<Meeting | null>(null);
  // false in the server HTML and on the first client render. With JavaScript off the page never claims
  // "Today" or "Next meeting": it shows the build day by name and no live flags.
  const [live, setLive] = useState(false);

  // the clock
  useEffect(() => {
    setNow(new Date());
    setLive(true);
    const tick = opts.tickMs ?? 60000;
    let interval: number | undefined;
    const align = window.setTimeout(() => {
      setNow(new Date());
      interval = window.setInterval(() => setNow(new Date()), tick);
    }, tick - (Date.now() % tick) + 50);
    const wake = () => { if (!document.hidden) setNow(new Date()); };
    document.addEventListener('visibilitychange', wake);
    return () => {
      window.clearTimeout(align);
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', wake);
    };
  }, [opts.tickMs]);

  // the quiet refresh
  useEffect(() => {
    let cancelled = false;
    const run = () => {
      fetchRaw(fetch, 15000)
        .then((raw) => {
          if (cancelled) return;
          const fresh = normalize(raw);
          setMeetings((old) => (signature(old) === signature(fresh) ? old : fresh));
        })
        .catch(() => { /* keep what is on screen */ });
    };
    const timer = window.setTimeout(run, 1200);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, []);

  const todayIdx = nyWeekday(now);
  const day = pickedDay ?? todayIdx;

  const nowList = useMemo(() => happeningNow(meetings, now), [meetings, now]);
  const nextList = useMemo(() => nextUpAll(meetings, now), [meetings, now]);
  const nowIds = useMemo(() => new Set(nowList.map((m) => m.id)), [nowList]);
  const nextIds = useMemo(() => new Set(nextList.map((u) => u.meeting.id)), [nextList]);

  const matches = useCallback(
    (m: Meeting) => (venue === 'all' || (venue === 'in-person' ? isInPerson(m) : isVirtual(m))) && (!town || m.town === town),
    [venue, town],
  );
  const list = useMemo(() => meetings.filter((m) => m.day === day && matches(m)), [meetings, day, matches]);
  const week = useMemo(() => meetings.filter(matches), [meetings, matches]);

  const status = useCallback(
    (m: Meeting): Status => (!live ? undefined : nowIds.has(m.id) ? 'now' : nextIds.has(m.id) ? 'next' : undefined),
    [live, nowIds, nextIds],
  );

  const townList = useMemo(() => townsOf(meetings), [meetings]);
  const counts = useMemo(() => countsOf(meetings), [meetings]);

  return {
    meetings, now, live, todayIdx, day, setDay: setPickedDay, venue, setVenue, town, setTown,
    list, week, status, nowList, nextList, detail, setDetail, townList, counts,
    /** toggles a venue filter: pressing the lit one clears it */
    toggleVenue: (v: Exclude<VenueFilter, 'all'>) => setVenue((cur) => (cur === v ? 'all' : v)),
  };
}

export type Finder = ReturnType<typeof useFinder>;

/** "Today", "Tomorrow" or the day name, relative to New York's today. */
export function dayLabel(day: number, todayIdx: number, relative = true): string {
  if (relative && day === todayIdx) return ui.today;
  if (relative && day === (todayIdx + 1) % 7) return ui.tomorrow;
  return DAY_NAMES[day];
}
export const dayShort = (day: number) => DAY_SHORT[day];
export const dayName = (day: number) => DAY_NAMES[day];

export function venueLabel(m: Meeting): string {
  return m.venue === 'virtual' ? ui.virtual : m.venue === 'hybrid' ? ui.hybrid : ui.inPerson;
}

/** Where a meeting is, in one short line for a list row. */
export function placeLine(m: Meeting): string {
  if (m.venue === 'virtual') return m.town ? `${ui.virtual} (${m.town})` : ui.virtual;
  return m.locationName || m.address;
}

/** "301-715-8592" -> "tel:+13017158592". Keeps pauses and # for conference codes. */
export function telHref(phone: string): string {
  const raw = phone.trim();
  const main = raw.split(/[,;x]/i)[0].replace(/[^\d+]/g, '');
  const rest = raw.slice(raw.split(/[,;x]/i)[0].length).replace(/[^\d,#*]/g, '');
  const digits = main.replace(/\D/g, '');
  const e164 = main.startsWith('+') ? `+${digits}` : digits.length === 10 ? `+1${digits}` : digits.length === 11 && digits.startsWith('1') ? `+${digits}` : digits;
  return `tel:${e164}${rest}`;
}

/** The live line for the next meeting: "Happening now", "Starts in 12 min" or "Starts at 7:30pm". */
export function startLine(u: Upcoming | null, happening: boolean): string {
  if (happening) return ui.happeningNow;
  if (!u) return '';
  if (u.minutesUntil <= 60) return ui.startsIn(u.minutesUntil);
  return ui.startsAt(formatClock(u.meeting.start));
}

/** What the screen reader hears when the filters change. */
export function announce(count: number, day: number, todayIdx: number, venue: VenueFilter, town: string): string {
  const parts = [dayLabel(day, todayIdx)];
  if (venue !== 'all') parts.push(venue === 'virtual' ? ui.virtual : ui.inPerson);
  parts.push(town || ui.allTowns);
  return `${parts.join(', ')}: ${count === 0 ? ui.noMeetings : `${count} ${count === 1 ? 'meeting' : 'meetings'}`}`;
}
