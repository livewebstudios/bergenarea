// Build-time loader. Astro calls this once per build: live data first,
// the committed snapshot when the meeting database cannot be reached.
import snapshot from '../data/meetings-snapshot.json';
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
      // The snapshot is bundled with the build, so the fallback never depends on a file path.
      const snap = snapshot as unknown as Snapshot;
      raw = snap;
      source = 'snapshot';
      fetchedAt = snap.fetchedAt;
      const bar = '!'.repeat(78);
      console.warn(`\n${bar}\n!! MEETING DATABASE UNREACHABLE AT BUILD TIME\n!! ${(err as Error).message}\n!! Falling back to src/data/meetings-snapshot.json (saved ${snap.fetchedAt}).\n!! The pages will show the snapshot until the browser refresh reaches BMLT.\n${bar}\n`);
    }
    const meetings = normalize(raw);
    if (source === 'live') console.log(`[bmlt] live data: ${meetings.length} meetings, ${counts(meetings).groups} groups, ${towns(meetings).length} towns`);
    return { meetings, towns: towns(meetings), counts: counts(meetings), source, fetchedAt };
  })();
  return cached;
}
