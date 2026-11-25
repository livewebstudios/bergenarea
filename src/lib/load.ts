// Build-time loader. Astro calls this once per build: live data first,
// the committed snapshot when the meeting database cannot be reached.
import fs from 'node:fs';
import { fetchRaw, normalize, towns, counts, type Meeting, type Snapshot } from './bmlt.ts';

export interface Loaded {
  meetings: Meeting[];
  towns: string[];
  counts: { groups: number; meetings: number };
  source: 'live' | 'snapshot';
  fetchedAt: string;
}

let cached: Promise<Loaded> | null = null;

export function loadMeetings(): Promise<Loaded> {
  cached ??= (async () => {
    let source: Loaded['source'] = 'live';
    let fetchedAt = new Date().toISOString();
    let raw;
    try {
      raw = await fetchRaw(fetch, 12000);
    } catch (err) {
      const snap = JSON.parse(fs.readFileSync(new URL('../data/meetings-snapshot.json', import.meta.url), 'utf8')) as Snapshot;
      raw = snap;
      source = 'snapshot';
      fetchedAt = snap.fetchedAt;
      const bar = '!'.repeat(78);
      console.warn(`\n${bar}\n!! MEETING DATABASE UNREACHABLE AT BUILD TIME\n!! ${(err as Error).message}\n!! Falling back to src/data/meetings-snapshot.json (saved ${snap.fetchedAt}).\n!! The pages will show the snapshot until the browser refresh reaches BMLT.\n${bar}\n`);
    }
    const meetings = normalize(raw);
    return { meetings, towns: towns(meetings), counts: counts(meetings), source, fetchedAt };
  })();
  return cached;
}
