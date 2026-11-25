// The meeting data layer. One public JSON API (BMLT) replaces the three WordPress plugins
// (crouton, bread, list-locations-bmlt). Nothing here knows about any demo's design.
import { TZ as NY, clockToMinutes, formatClock, nyMinutes, nyWeekday, nyParts, nyWallToInstant, addDays } from './time.ts';

export const ROOT = 'https://bmlt.nanj.org/main_server';
export const SERVICE_BODY = 3;
export const TZ = NY;

export const MEETINGS_URL = `${ROOT}/client_interface/json/?switcher=GetSearchResults&services=${SERVICE_BODY}&recursive=1&sort_keys=weekday_tinyint,start_time`;
export const FORMATS_URL = `${ROOT}/client_interface/json/?switcher=GetFormats`;

/** The raw fields the site uses. All strings. Everything else (contact fields etc.) is dropped on arrival. */
export const RAW_FIELDS = [
  'id_bigint', 'weekday_tinyint', 'start_time', 'duration_time', 'venue_type', 'formats',
  'meeting_name', 'location_text', 'location_street', 'location_municipality', 'location_province',
  'location_postal_code_1', 'location_info', 'comments', 'latitude', 'longitude',
  'virtual_meeting_link', 'virtual_meeting_additional_info', 'phone_meeting_number', 'birth_date', 'published',
] as const;
export type RawMeeting = Partial<Record<(typeof RAW_FIELDS)[number], string>>;
export interface RawFormat { key_string?: string; name_string?: string }

export interface RawData { meetings: RawMeeting[]; formats: RawFormat[] }
export interface Snapshot extends RawData { fetchedAt: string }

export type Venue = 'in-person' | 'virtual' | 'hybrid';
export interface Format { code: string; name: string }

export interface Meeting {
  id: string;
  /** 0 to 6, Sunday 0 */
  day: number;
  /** minutes from midnight */
  start: number;
  /** start + duration. May pass 1440 when a meeting runs over midnight. */
  end: number;
  /** "7:30pm - 9:00pm" */
  timeLabel: string;
  name: string;
  venue: Venue;
  locationName: string;
  /** street, town, state, zip joined with commas, blanks skipped */
  address: string;
  town: string;
  locationInfo: string;
  comments: string;
  formats: Format[];
  wheelchair: boolean;
  /** in person and hybrid only */
  mapUrl: string;
  lat: number | null;
  lng: number | null;
  virtualLink: string;
  virtualInfo: string;
  phone: string;
  /** birth_date with everything up to and including "#@-@#" removed. Phase 2 uses it. */
  startDate: string;
}

const clean = (s: string | undefined) => (s ?? '').trim();

/** Keep only the fields the site uses. Run on anything that came off the wire. */
export function pickRaw(data: { meetings: unknown; formats: unknown }): RawData {
  const meetings = (Array.isArray(data.meetings) ? data.meetings : []).map((row: Record<string, unknown>) => {
    const out: RawMeeting = {};
    for (const key of RAW_FIELDS) out[key] = typeof row?.[key] === 'string' ? (row[key] as string) : '';
    return out;
  });
  const formats = (Array.isArray(data.formats) ? data.formats : []).map((row: Record<string, unknown>) => ({
    key_string: typeof row?.key_string === 'string' ? row.key_string : '',
    name_string: typeof row?.name_string === 'string' ? row.name_string : '',
  }));
  return { meetings, formats };
}

const VENUES: Record<string, Venue> = { '1': 'in-person', '2': 'virtual', '3': 'hybrid' };

export function normalize(data: RawData): Meeting[] {
  const names = new Map<string, string>();
  for (const f of data.formats) {
    const code = clean(f.key_string);
    if (code && !names.has(code)) names.set(code, clean(f.name_string));
  }
  const out: Meeting[] = [];
  for (const raw of data.meetings) {
    if (clean(raw.published) !== '1') continue;
    const weekday = Number(raw.weekday_tinyint);
    if (!(weekday >= 1 && weekday <= 7)) continue;
    const start = clockToMinutes(clean(raw.start_time) || '00:00');
    const end = start + clockToMinutes(clean(raw.duration_time) || '01:00');
    const venue = VENUES[clean(raw.venue_type)] ?? 'in-person';
    const codes = clean(raw.formats).split(',').map((c) => c.trim()).filter(Boolean);
    const formats = codes.map((code) => ({ code, name: names.get(code) || code }));
    const lat = Number.parseFloat(clean(raw.latitude));
    const lng = Number.parseFloat(clean(raw.longitude));
    const hasPoint = Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0);
    const address = [raw.location_street, raw.location_municipality, raw.location_province, raw.location_postal_code_1]
      .map(clean).filter(Boolean).join(', ');
    out.push({
      id: clean(raw.id_bigint),
      day: weekday - 1,
      start,
      end,
      timeLabel: `${formatClock(start)} - ${formatClock(end)}`,
      name: clean(raw.meeting_name),
      venue,
      locationName: clean(raw.location_text),
      address,
      town: clean(raw.location_municipality),
      locationInfo: clean(raw.location_info),
      comments: clean(raw.comments),
      formats,
      wheelchair: codes.includes('WC'),
      mapUrl: venue !== 'virtual' && hasPoint ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : '',
      lat: hasPoint ? lat : null,
      lng: hasPoint ? lng : null,
      virtualLink: clean(raw.virtual_meeting_link),
      virtualInfo: clean(raw.virtual_meeting_additional_info),
      phone: clean(raw.phone_meeting_number),
      startDate: stripBirthPrefix(clean(raw.birth_date)),
    });
  }
  return out.sort(byDayThenStart);
}

export function stripBirthPrefix(value: string): string {
  const mark = '#@-@#';
  const at = value.indexOf(mark);
  return at === -1 ? value : value.slice(at + mark.length).trim();
}

const venueRank: Record<Venue, number> = { 'in-person': 0, hybrid: 1, virtual: 2 };
function byDayThenStart(a: Meeting, b: Meeting): number {
  return a.day - b.day || a.start - b.start || venueRank[a.venue] - venueRank[b.venue] || a.name.localeCompare(b.name);
}

/** Distinct towns, A to Z. This is all `list-locations-bmlt` ever did. */
export function towns(meetings: Meeting[]): string[] {
  return [...new Set(meetings.map((m) => m.town).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

export function counts(meetings: Meeting[]): { groups: number; meetings: number } {
  return { groups: new Set(meetings.map((m) => m.name)).size, meetings: meetings.length };
}

export const isInPerson = (m: Meeting) => m.venue !== 'virtual';
export const isVirtual = (m: Meeting) => m.venue !== 'in-person';

/** Meetings on New York's "today", in start order. */
export function today(meetings: Meeting[], now: Date): Meeting[] {
  const day = nyWeekday(now);
  return meetings.filter((m) => m.day === day);
}

/** Meetings running at this instant. A meeting is "now" from its start to its end, including one that started before midnight. */
export function happeningNow(meetings: Meeting[], now: Date): Meeting[] {
  const day = nyWeekday(now);
  const minutes = nyMinutes(now);
  const yesterday = (day + 6) % 7;
  return meetings.filter(
    (m) => (m.day === day && m.start <= minutes && minutes < m.end) || (m.day === yesterday && m.end > 1440 && minutes < m.end - 1440),
  );
}

export interface Upcoming {
  meeting: Meeting;
  /** 0 = today, 1 = tomorrow ... */
  daysAhead: number;
  /** The instant it starts. */
  startsAt: Date;
  /** Whole minutes from now until it starts. */
  minutesUntil: number;
}

/** The next meetings that have not started yet. After the last meeting of the day it rolls to tomorrow, and on through the week. */
export function upcoming(meetings: Meeting[], now: Date, limit = 1): Upcoming[] {
  const p = nyParts(now);
  const minutes = p.hour * 60 + p.minute;
  const out: Upcoming[] = [];
  for (let ahead = 0; ahead <= 7 && out.length < limit; ahead++) {
    const day = (p.weekday + ahead) % 7;
    const date = addDays(p, ahead);
    for (const m of meetings) {
      if (m.day !== day) continue;
      if (ahead === 0 && m.start <= minutes) continue;
      if (ahead === 7 && m.start > minutes) continue;
      const startsAt = nyWallToInstant({ ...date, hour: Math.floor(m.start / 60), minute: m.start % 60 });
      out.push({ meeting: m, daysAhead: ahead, startsAt, minutesUntil: Math.max(0, Math.ceil((startsAt.getTime() - now.getTime()) / 60000)) });
      if (out.length >= limit) break;
    }
  }
  return out;
}

export function nextUp(meetings: Meeting[], now: Date): Upcoming | null {
  return upcoming(meetings, now, 1)[0] ?? null;
}

/** Every meeting that shares the next start time (two rooms often open at noon). */
export function nextUpAll(meetings: Meeting[], now: Date): Upcoming[] {
  const list = upcoming(meetings, now, 12);
  if (!list.length) return [];
  const first = list[0];
  return list.filter((u) => u.daysAhead === first.daysAhead && u.meeting.start === first.meeting.start);
}

/** A cheap fingerprint so the browser refresh can tell whether anything changed. */
export function signature(meetings: Meeting[]): string {
  return JSON.stringify(meetings);
}

/** Fetch both calls. Throws on any failure so the caller can fall back. */
export async function fetchRaw(fetchImpl: typeof fetch = fetch, timeoutMs = 10000): Promise<RawData> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const [m, f] = await Promise.all([
      fetchImpl(MEETINGS_URL, { signal: ctrl.signal }),
      fetchImpl(FORMATS_URL, { signal: ctrl.signal }),
    ]);
    if (!m.ok || !f.ok) throw new Error(`BMLT answered ${m.status} / ${f.status}`);
    const data = pickRaw({ meetings: await m.json(), formats: await f.json() });
    if (!data.meetings.length) throw new Error('BMLT returned no meetings');
    return data;
  } finally {
    clearTimeout(timer);
  }
}
