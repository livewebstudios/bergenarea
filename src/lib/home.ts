// Build-time data for the home page's three event cards: a few candidates per area, soonest first.
// The page shows the first two that are still live; the browser drops the rest as they pass.
import { loadEvents, type EventView } from './events.ts';

export type { EventView };

export interface HomeData { area: EventView[]; convention: EventView[]; activities: EventView[] }

export function loadHome(buildNow: Date, keep = 13): HomeData {
  const e = loadEvents(buildNow);
  return { area: e.area.upcoming.slice(0, keep), convention: e.convention.upcoming.slice(0, keep), activities: e.activities.upcoming.slice(0, keep) };
}
