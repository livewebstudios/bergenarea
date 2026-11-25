import { afterEach, describe, expect, it } from 'vitest';
import snapshot from '../src/data/meetings-snapshot.json';
import {
  counts, happeningNow, nextUp, nextUpAll, normalize, pickRaw, stripBirthPrefix, today, towns, upcoming, type RawData,
} from '../src/lib/bmlt';
import { deck } from '../src/content/deck';

const ORIGINAL_TZ = process.env.TZ;
afterEach(() => {
  if (ORIGINAL_TZ === undefined) delete process.env.TZ;
  else process.env.TZ = ORIGINAL_TZ;
});

const data = snapshot as unknown as RawData;
const meetings = normalize(data);

const raw = (over: Record<string, string>) => ({
  id_bigint: '1', weekday_tinyint: '3', start_time: '19:30:00', duration_time: '01:30:00', venue_type: '1', formats: 'O,WC,ZZ',
  meeting_name: 'Test Group', location_text: 'Hall', location_street: '1 Main St', location_municipality: 'Paramus',
  location_province: 'NJ', location_postal_code_1: '', location_info: '', comments: '', latitude: '40.9', longitude: '-74.1',
  virtual_meeting_link: '', virtual_meeting_additional_info: '', phone_meeting_number: '', birth_date: 'Birthdate#@-@#May 2020', published: '1',
  ...over,
});
const FORMATS = [{ key_string: 'O', name_string: 'Open (anyone welcome)' }, { key_string: 'WC', name_string: 'Wheelchair' }];

describe('normalize', () => {
  it('shapes one meeting', () => {
    const [m] = normalize({ meetings: [raw({})], formats: FORMATS });
    expect(m.day).toBe(2);
    expect(m.start).toBe(1170);
    expect(m.end).toBe(1260);
    expect(m.timeLabel).toBe('7:30pm - 9:00pm');
    expect(m.venue).toBe('in-person');
    expect(m.address).toBe('1 Main St, Paramus, NJ');
    expect(m.formats).toEqual([
      { code: 'O', name: 'Open (anyone welcome)' },
      { code: 'WC', name: 'Wheelchair' },
      { code: 'ZZ', name: 'ZZ' }, // unknown code: show the code alone
    ]);
    expect(m.wheelchair).toBe(true);
    expect(m.mapUrl).toBe('https://www.google.com/maps/search/?api=1&query=40.9,-74.1');
    expect(m.startDate).toBe('May 2020');
  });

  it('virtual meetings get no map link, hybrid ones do', () => {
    const [v] = normalize({ meetings: [raw({ venue_type: '2', virtual_meeting_link: 'https://zoom.us/j/1' })], formats: FORMATS });
    expect(v.venue).toBe('virtual');
    expect(v.mapUrl).toBe('');
    const [h] = normalize({ meetings: [raw({ venue_type: '3' })], formats: FORMATS });
    expect(h.venue).toBe('hybrid');
    expect(h.mapUrl).not.toBe('');
  });

  it('drops anything not published', () => {
    expect(normalize({ meetings: [raw({ published: '0' }), raw({ published: '' })], formats: FORMATS })).toHaveLength(0);
  });

  it('strips the birth date prefix only when it is there', () => {
    expect(stripBirthPrefix('Birthdate#@-@#September 1999')).toBe('September 1999');
    expect(stripBirthPrefix('November 1986')).toBe('November 1986');
    expect(stripBirthPrefix('')).toBe('');
  });

  it('pickRaw keeps only the fields the site uses', () => {
    const picked = pickRaw({ meetings: [{ ...raw({}), contact_name_1: 'Somebody', contact_phone_1: '555' }], formats: FORMATS });
    expect(Object.keys(picked.meetings[0])).not.toContain('contact_name_1');
    expect(JSON.stringify(picked)).not.toContain('Somebody');
  });
});

describe('the committed snapshot', () => {
  it('has the counts the old site showed on Nov 24, 2026', () => {
    expect(counts(meetings)).toEqual({ groups: 33, meetings: 44 });
  });

  it('derives the twenty towns, A to Z, matching the old site sentence', () => {
    const list = towns(meetings);
    expect(list).toHaveLength(20);
    expect(list).toEqual([...deck.meetings.townsFallback]);
    expect(deck.meetings.townsSentence(list)).toBe(
      'Serving the communities of Allendale, Bogota, Dumont, Englewood, Fair Lawn, Fort Lee, Hackensack, Hasbrouck Heights, Leonia, Midland Park, Paramus, Ramsey, Ridgefield, Ridgewood, River Edge, Teaneck, Westwood, Woodcliff Lake, Woodridge, Wyckoff.',
    );
  });

  it('holds no contact fields', () => {
    expect(JSON.stringify(snapshot)).not.toMatch(/contact_(name|phone|email)/);
  });

  it('is sorted by day then start', () => {
    for (let i = 1; i < meetings.length; i++) {
      const a = meetings[i - 1];
      const b = meetings[i];
      expect(a.day < b.day || (a.day === b.day && a.start <= b.start)).toBe(true);
    }
  });
});

describe('today, now and next in New York time', () => {
  for (const zone of ['UTC', 'America/Los_Angeles']) {
    it(`today flips at New York midnight with TZ=${zone}`, () => {
      process.env.TZ = zone;
      const tue = today(meetings, new Date('2026-11-25T04:59:00Z')); // 11:59 PM Tuesday
      const wed = today(meetings, new Date('2026-11-25T05:01:00Z')); // 12:01 AM Wednesday
      expect(tue.every((m) => m.day === 2)).toBe(true);
      expect(wed.every((m) => m.day === 3)).toBe(true);
      expect(tue.length).toBe(5);
      expect(wed.length).toBe(7);
    });

    it(`a meeting is "now" from start to end with TZ=${zone}`, () => {
      process.env.TZ = zone;
      // Tuesday 8:00pm to 9:00pm: HOW, Cyber Serenity Group, The Phoenix.
      const at = (iso: string) => happeningNow(meetings, new Date(iso)).map((m) => m.name).sort();
      expect(at('2026-11-25T00:59:00Z')).toEqual([]); // 7:59 PM
      expect(at('2026-11-25T01:00:00Z')).toEqual(['Cyber Serenity Group', 'HOW', 'The Phoenix']); // 8:00 PM
      expect(at('2026-11-25T01:59:00Z')).toEqual(['Cyber Serenity Group', 'HOW', 'The Phoenix']); // 8:59 PM
      expect(at('2026-11-25T02:00:00Z')).toEqual([]); // 9:00 PM
    });

    it(`nextUp rolls to tomorrow after the last meeting with TZ=${zone}`, () => {
      process.env.TZ = zone;
      const evening = nextUp(meetings, new Date('2026-11-24T23:00:00Z'))!; // 6:00 PM Tuesday
      expect(evening.daysAhead).toBe(0);
      expect(evening.meeting.start).toBe(20 * 60);
      expect(evening.minutesUntil).toBe(120);
      const late = nextUp(meetings, new Date('2026-11-25T02:30:00Z'))!; // 9:30 PM Tuesday
      expect(late.daysAhead).toBe(1);
      expect(late.meeting.day).toBe(3);
      expect(late.meeting.name).toBe('The Nooner’s Group of NA');
      expect(late.startsAt.toISOString()).toBe('2026-11-25T17:00:00.000Z'); // Wednesday noon EST
    });
  }

  it('nextUpAll returns every meeting sharing the next start', () => {
    const all = nextUpAll(meetings, new Date('2026-11-24T23:00:00Z'));
    expect(all.map((u) => u.meeting.name).sort()).toEqual(['Cyber Serenity Group', 'HOW', 'The Phoenix']);
  });

  it('counts real minutes across the spring clock change', () => {
    // Saturday Mar 13, 2027, 11:45 PM EST. Next meeting: Sunday 9:30am EDT. The clock skips an hour overnight.
    const u = nextUp(meetings, new Date('2027-03-14T04:45:00Z'))!;
    expect(u.meeting.name).toBe('Serenity in the Park');
    expect(u.startsAt.toISOString()).toBe('2027-03-14T13:30:00.000Z');
    expect(u.minutesUntil).toBe(525);
  });

  it('upcoming walks the whole week', () => {
    const list = upcoming(meetings, new Date('2026-11-24T23:00:00Z'), 200);
    expect(list).toHaveLength(meetings.length);
  });
});
