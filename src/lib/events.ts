// Build-time data for the three event areas: what is coming up, and what has passed (the archive).
// Each area is its own file in content/, edited by its own Decap login.
import areaFile from '../../content/meetings-area.json';
import conventionFile from '../../content/events-convention.json';
import activitiesFile from '../../content/events-activities.json';
import { recurringOccurrences, expiresAt, isUpcoming, type AreaMeetingsFile, type EventItem } from './upcoming.ts';
import { formatWallRange } from './time.ts';

export interface EventView extends EventItem {
  /** "Tue, Dec 15, 7:30 PM - 10:00 PM" */
  when: string;
  /** New York wall clock after which the browser hides the item */
  expires: string;
}

export interface AreaEvents { upcoming: EventView[]; past: EventView[] }
export type AreaKey = 'area' | 'convention' | 'activities';

const view = (ev: EventItem): EventView => ({ ...ev, when: formatWallRange(ev.start, ev.end || undefined), expires: expiresAt(ev) });
const byStart = (a: EventItem, b: EventItem) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0);
const usable = (ev: EventItem) => !!ev.start && !ev.sample;

function split(events: EventItem[], now: Date): AreaEvents {
  const list = events.filter(usable).sort(byStart);
  return {
    upcoming: list.filter((ev) => isUpcoming(ev, now)).map(view),
    past: list.filter((ev) => !isUpcoming(ev, now)).reverse().map(view),
  };
}

export function loadEvents(now: Date): Record<AreaKey, AreaEvents> {
  const area = areaFile as AreaMeetingsFile;
  const extra = area.extra.filter(usable);
  return {
    // The next Area Service meetings are computed; one-off meetings (JAC, budget) come from the file.
    area: {
      // three Area Service dates are plenty; one-off meetings all show
      upcoming: [...recurringOccurrences(area.recurring, now, 3), ...extra.filter((ev) => isUpcoming(ev, now))].sort(byStart).map(view),
      past: extra.filter((ev) => !isUpcoming(ev, now)).sort(byStart).reverse().map(view),
    },
    convention: split(conventionFile.events as EventItem[], now),
    activities: split(activitiesFile.events as EventItem[], now),
  };
}
