// Refresh src/data/meetings-snapshot.json from the live meeting database.
// The build falls back to this file when BMLT cannot be reached. Run: npm run snapshot
import fs from 'node:fs';
import { fetchRaw } from '../src/lib/bmlt.ts';

const data = await fetchRaw();
const out = { fetchedAt: new Date().toISOString(), ...data };
fs.mkdirSync(new URL('../src/data/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('../src/data/meetings-snapshot.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
console.log(`Snapshot written: ${data.meetings.length} meetings, ${data.formats.length} formats.`);
