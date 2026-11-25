import { afterEach, describe, expect, it } from 'vitest';
import {
  nthWeekday, nyDayKey, nyMinutes, nyParts, nyWall, nyWallToInstant, nyWeekday, compareToWall,
  formatClock, formatClockUpper, formatWallRange, formatWallDate,
} from '../src/lib/time';
import { areaMeetings, isUpcoming, noticeActive, recurringOccurrences, resolveSamples, selectUpcoming, type Notice, type Recurring } from '../src/lib/upcoming';

const ORIGINAL_TZ = process.env.TZ;
afterEach(() => {
  if (ORIGINAL_TZ === undefined) delete process.env.TZ;
  else process.env.TZ = ORIGINAL_TZ;
});

// The real dates from the old site's calendar. Columns: Dec 2026, then Jan to Jun 2027.
const MONTHS: [number, number][] = [[2026, 12], [2027, 1], [2027, 2], [2027, 3], [2027, 4], [2027, 5], [2027, 6]];
const VECTORS: { rule: string; n: number; weekday: number; plus?: number; days: number[] }[] = [
  { rule: '3rd Tuesday (Area Service)', n: 3, weekday: 2, days: [15, 19, 16, 16, 20, 18, 15] },
  { rule: '1st Friday', n: 1, weekday: 5, days: [4, 1, 5, 5, 2, 7, 4] },
  { rule: '3rd Wednesday', n: 3, weekday: 3, days: [16, 20, 17, 17, 21, 19, 16] },
  { rule: '3rd Sunday', n: 3, weekday: 0, days: [20, 17, 21, 21, 18, 16, 20] },
  { rule: '3rd Monday', n: 3, weekday: 1, days: [21, 18, 15, 15, 19, 17, 21] },
  { rule: '4th Sunday', n: 4, weekday: 0, days: [27, 24, 28, 28, 25, 23, 27] },
  { rule: 'Thursday after the 3rd Tuesday', n: 3, weekday: 2, plus: 2, days: [17, 21, 18, 18, 22, 20, 17] },
];

describe('nthWeekday', () => {
  for (const v of VECTORS) {
    it(v.rule, () => {
      const got = MONTHS.map(([y, m]) => nthWeekday(y, m, v.n, v.weekday) + (v.plus ?? 0));
      expect(got).toEqual(v.days);
    });
  }
  it('throws when the month has no such day', () => {
    expect(() => nthWeekday(2027, 2, 5, 1)).toThrow();
  });
});

describe('New York clock, whatever the machine zone', () => {
  // Nov 24, 2026 is a Tuesday. EST is UTC-5.
  const before = new Date('2026-11-25T04:59:00Z'); // 11:59 PM Tuesday in New York
  const after = new Date('2026-11-25T05:01:00Z'); // 12:01 AM Wednesday in New York

  for (const zone of ['UTC', 'America/Los_Angeles', 'Asia/Tokyo']) {
    it(`"today" flips at New York midnight with TZ=${zone}`, () => {
      process.env.TZ = zone;
      expect(nyDayKey(before)).toBe('2026-11-24');
      expect(nyWeekday(before)).toBe(2);
      expect(nyMinutes(before)).toBe(23 * 60 + 59);
      expect(nyDayKey(after)).toBe('2026-11-25');
      expect(nyWeekday(after)).toBe(3);
      expect(nyMinutes(after)).toBe(1);
      expect(nyWall(after)).toBe('2026-11-25T00:01');
    });
  }

  for (const zone of ['UTC', 'America/Los_Angeles']) {
    it(`spring forward, Mar 14 2027, TZ=${zone}`, () => {
      process.env.TZ = zone;
      // 1:59 AM EST is 06:59Z. One minute later the wall clock reads 3:00 AM EDT.
      expect(nyWall(new Date('2027-03-14T06:59:00Z'))).toBe('2027-03-14T01:59');
      expect(nyWall(new Date('2027-03-14T07:00:00Z'))).toBe('2027-03-14T03:00');
      // Midnight that night: 11:59 PM EDT is 03:59Z the next day.
      expect(nyDayKey(new Date('2027-03-15T03:59:00Z'))).toBe('2027-03-14');
      expect(nyWeekday(new Date('2027-03-15T03:59:00Z'))).toBe(0);
      expect(nyDayKey(new Date('2027-03-15T04:01:00Z'))).toBe('2027-03-15');
      expect(nyWeekday(new Date('2027-03-15T04:01:00Z'))).toBe(1);
      expect(nyWallToInstant({ year: 2027, month: 3, day: 14, hour: 1, minute: 30 }).toISOString()).toBe('2027-03-14T06:30:00.000Z');
      expect(nyWallToInstant({ year: 2027, month: 3, day: 14, hour: 3, minute: 30 }).toISOString()).toBe('2027-03-14T07:30:00.000Z');
    });

    it(`fall back, Nov 7 2027, TZ=${zone}`, () => {
      process.env.TZ = zone;
      // 11:59 PM EDT on Nov 6 is 03:59Z. 11:59 PM EST on Nov 7 is 04:59Z on Nov 8.
      expect(nyDayKey(new Date('2027-11-07T03:59:00Z'))).toBe('2027-11-06');
      expect(nyDayKey(new Date('2027-11-07T04:01:00Z'))).toBe('2027-11-07');
      expect(nyDayKey(new Date('2027-11-08T04:59:00Z'))).toBe('2027-11-07');
      expect(nyWeekday(new Date('2027-11-08T04:59:00Z'))).toBe(0);
      expect(nyDayKey(new Date('2027-11-08T05:01:00Z'))).toBe('2027-11-08');
      expect(nyWallToInstant({ year: 2027, month: 11, day: 7, hour: 12, minute: 0 }).toISOString()).toBe('2027-11-07T17:00:00.000Z');
      expect(nyWallToInstant({ year: 2027, month: 11, day: 6, hour: 12, minute: 0 }).toISOString()).toBe('2027-11-06T16:00:00.000Z');
    });
  }

  it('nyParts never reports hour 24', () => {
    expect(nyParts(new Date('2026-11-25T05:00:00Z')).hour).toBe(0);
  });
});

describe('formatting', () => {
  it('meeting clocks match the old site', () => {
    expect(formatClock(19 * 60 + 30)).toBe('7:30pm');
    expect(formatClock(0)).toBe('12:00am');
    expect(formatClock(12 * 60)).toBe('12:00pm');
    expect(formatClock(9 * 60 + 5)).toBe('9:05am');
    expect(formatClockUpper(19 * 60 + 30)).toBe('7:30 PM');
  });
  it('event ranges', () => {
    expect(formatWallRange('2026-12-31T12:00', '2027-01-02T13:00')).toBe('Dec 31, 12:00 PM - Jan 2, 1:00 PM');
    expect(formatWallRange('2026-12-15T19:30', '2026-12-15T22:00')).toBe('Tue, Dec 15, 7:30 PM - 10:00 PM');
    expect(formatWallDate('2026-12-15T19:30')).toBe('Tue, Dec 15');
  });
});

const AREA: Recurring = {
  title: 'Bergen Area Service', nth: 3, weekday: 2, start_time: '19:30', end_time: '22:00',
  location_name: 'Westwood United Methodist Church', address: '105 Fairview Ave, Westwood, NJ 07675', exceptions: [],
};

describe('upcoming', () => {
  const buildDay = new Date('2026-11-24T23:00:00Z'); // 6:00 PM New York

  it('next Area Service is Dec 15, 2026 when built before then', () => {
    const [first, second] = recurringOccurrences(AREA, buildDay, 2);
    expect(first.start).toBe('2026-12-15T19:30');
    expect(first.end).toBe('2026-12-15T22:00');
    expect(second.start).toBe('2027-01-19T19:30');
  });

  it('stays on the list until it ends, then rolls to next month', () => {
    const during = nyWallToInstant({ year: 2026, month: 12, day: 15, hour: 21, minute: 59 });
    const over = nyWallToInstant({ year: 2026, month: 12, day: 15, hour: 22, minute: 1 });
    expect(recurringOccurrences(AREA, during, 1)[0].start).toBe('2026-12-15T19:30');
    expect(recurringOccurrences(AREA, over, 1)[0].start).toBe('2027-01-19T19:30');
  });

  it('honors cancelled and moved exceptions', () => {
    const cancelled = { ...AREA, exceptions: [{ date: '2026-12-15', status: 'cancelled' as const }] };
    expect(recurringOccurrences(cancelled, buildDay, 1)[0].start).toBe('2027-01-19T19:30');
    const moved = { ...AREA, exceptions: [{ date: '2026-12-15', status: 'moved' as const, new_start: '2026-12-16T19:00', note: 'Snow date' }] };
    const [m] = recurringOccurrences(moved, buildDay, 1);
    expect(m.start).toBe('2026-12-16T19:00');
    expect(m.end).toBe('2026-12-16T21:30');
    expect(m.status).toBe('moved');
    expect(m.note).toBe('Snow date');
  });

  it('events drop when their end passes in New York, in any machine zone', () => {
    const ev = { title: 'New Year New Life 33', start: '2026-12-31T12:00', end: '2027-01-02T13:00' };
    for (const zone of ['UTC', 'America/Los_Angeles']) {
      process.env.TZ = zone;
      expect(isUpcoming(ev, new Date('2027-01-02T17:59:00Z'))).toBe(true); // 12:59 PM EST
      expect(isUpcoming(ev, new Date('2027-01-02T18:01:00Z'))).toBe(false); // 1:01 PM EST
    }
    expect(isUpcoming({ title: 'x', start: '2026-12-01T10:00' }, new Date('2026-12-01T15:01:00Z'))).toBe(false);
  });

  it('sorts soonest first and keeps two', () => {
    const list = selectUpcoming(
      [{ title: 'c', start: '2027-03-01T10:00' }, { title: 'a', start: '2026-12-01T10:00' }, { title: 'b', start: '2027-01-01T10:00' }, { title: 'old', start: '2026-01-01T10:00' }],
      buildDay,
    );
    expect(list.map((e) => e.title)).toEqual(['a', 'b']);
  });

  it('sample seeds get a date after the build day', () => {
    const [jac] = resolveSamples([{ title: 'JAC Meeting', start: '', sample: true }], buildDay, 10);
    expect(jac.start).toBe('2026-12-04T19:00');
    expect(jac.end).toBe('2026-12-04T20:30');
    const merged = areaMeetings({ recurring: AREA, extra: [jac] }, buildDay, 2);
    expect(merged.map((e) => e.title)).toEqual(['JAC Meeting', 'Bergen Area Service']);
  });

  it('compareToWall treats a date-only string as the start of that day', () => {
    expect(compareToWall(new Date('2026-11-25T04:59:00Z'), '2026-11-25')).toBe(-1);
    expect(compareToWall(new Date('2026-11-25T05:00:00Z'), '2026-11-25')).toBe(0);
  });

  it('notice respects enabled, dates and scope', () => {
    const notice: Notice = {
      enabled: true, id: 'nynl33', style: 'celebration', title: 't', body: 'b',
      start: '2026-11-24', end: '2027-01-02', frequency: 'once', scope: 'home',
    };
    expect(noticeActive(notice, buildDay)).toBe(true);
    expect(noticeActive({ ...notice, enabled: false }, buildDay)).toBe(false);
    expect(noticeActive(notice, new Date('2026-11-24T04:59:00Z'))).toBe(false); // still Nov 23 in New York
    expect(noticeActive(notice, new Date('2027-01-03T04:59:00Z'))).toBe(true); // 11:59 PM Jan 2
    expect(noticeActive(notice, new Date('2027-01-03T05:01:00Z'))).toBe(false);
    expect(noticeActive(notice, buildDay, 'other')).toBe(false);
    expect(noticeActive({ ...notice, scope: 'all-pages' }, buildDay, 'other')).toBe(true);
  });
});
