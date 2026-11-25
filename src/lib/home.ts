// Build-time data for the home page: the three event areas and the notice.
// Reads the JSON in content/ that Decap will edit in Phase 2.
import areaFile from '../../content/meetings-area.json';
import conventionFile from '../../content/events-convention.json';
import activitiesFile from '../../content/events-activities.json';
import noticeFile from '../../content/notice.json';
import { areaMeetings, resolveSamples, selectUpcoming, expiresAt, type AreaMeetingsFile, type EventItem, type Notice } from './upcoming.ts';
import { formatWallRange } from './time.ts';

export interface EventView extends EventItem {
  /** "Tue, Dec 15, 7:30 PM - 10:00 PM" */
  when: string;
  /** New York wall clock after which the browser hides the item */
  expires: string;
}

const view = (ev: EventItem): EventView => ({ ...ev, when: formatWallRange(ev.start, ev.end || undefined), expires: expiresAt(ev) });

export interface HomeData {
  /** Up to `keep` candidates per area, soonest first. The page shows the first two that are still live. */
  area: EventView[];
  convention: EventView[];
  activities: EventView[];
  notice: Notice;
}

export function loadHome(buildNow: Date, keep = 4): HomeData {
  const areaData = areaFile as AreaMeetingsFile;
  const area = areaMeetings({ recurring: areaData.recurring, extra: resolveSamples(areaData.extra, buildNow, 10) }, buildNow, keep);
  const convention = selectUpcoming(resolveSamples(conventionFile.events as EventItem[], buildNow, 21), buildNow, keep);
  const activities = selectUpcoming(resolveSamples(activitiesFile.events as EventItem[], buildNow, 14, '12:00', '15:00'), buildNow, keep);
  return { area: area.map(view), convention: convention.map(view), activities: activities.map(view), notice: noticeFile as Notice };
}
