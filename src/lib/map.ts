// The demo 3 map is drawn from the data, not from memory. Nothing here is hand-placed.
// Each town sits at the average latitude and longitude of its in-person and hybrid meetings
// (a town with only virtual meetings uses those coordinates). The projection is a plain
// equirectangular one corrected by the cosine of the mean latitude, fitted to the viewBox.
import type { Meeting } from './bmlt.ts';

/** Small seeded random source, so the tree stamps land in the same place on every render. */
function rng(seed: number) {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return (a?: number, b?: number) => (a === undefined ? next() : b === undefined ? next() * a : a + next() * (b - a));
}

export type Pt = [number, number];
/** Where a label sits relative to its dot. h: which way it runs. v: above, level or below. gx, gy: gaps from the dot's centre, in map units. */
export interface LabelSpot { h: 'e' | 'w' | 'c'; v: 'n' | 's' | 'c'; gx: number; gy: number }

export interface MapTown {
  name: string;
  slug: string;
  /** all meetings filed under this town */
  count: number;
  x: number;
  y: number;
  r: number;
  /** where the label sits, chosen by the collision pass */
  spot: LabelSpot;
}

export interface MapModel {
  w: number;
  h: number;
  towns: MapTown[];
  /** county outline, projected. Empty when no trustworthy outline is available. */
  outline: Pt[];
  /** the Hudson: one line down the east side */
  river: Pt[];
  riverLabel: { x: number; y: number; angle: number };
  north: Pt;
  trees: { x: number; y: number; kind: 'pine' | 'hardwood' }[];
}

export const slugify = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const FONT = 24; // label size in map units (3% of the map width)
const CHAR = FONT * 0.5;
const LINE = FONT * 1.2;

interface Box { x0: number; y0: number; x1: number; y1: number }
const overlap = (a: Box, b: Box) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));

function labelBox(t: { x: number; y: number; name: string }, spot: LabelSpot): Box {
  const wd = t.name.length * CHAR;
  const x0 = spot.h === 'e' ? t.x + spot.gx : spot.h === 'w' ? t.x - spot.gx - wd : t.x - wd / 2;
  const y0 = spot.v === 's' ? t.y + spot.gy : spot.v === 'n' ? t.y - spot.gy - LINE : t.y - LINE / 2;
  return { x0, y0, x1: x0 + wd, y1: y0 + LINE };
}

/** Candidate spots in order of preference: beside the dot first, then diagonals, then further out. */
function spots(r: number): LabelSpot[] {
  const g = r + 7;
  const d = r * 0.72 + 5;
  return [
    { h: 'e', v: 'c', gx: g, gy: 0 },
    { h: 'w', v: 'c', gx: g, gy: 0 },
    { h: 'e', v: 'n', gx: d, gy: d },
    { h: 'e', v: 's', gx: d, gy: d },
    { h: 'w', v: 'n', gx: d, gy: d },
    { h: 'w', v: 's', gx: d, gy: d },
    { h: 'c', v: 's', gx: 0, gy: g },
    { h: 'c', v: 'n', gx: 0, gy: g },
    { h: 'e', v: 'c', gx: g + 26, gy: 0 },
    { h: 'w', v: 'c', gx: g + 26, gy: 0 },
    { h: 'e', v: 's', gx: d, gy: d + 18 },
    { h: 'w', v: 's', gx: d, gy: d + 18 },
    { h: 'e', v: 'n', gx: d, gy: d + 18 },
    { h: 'w', v: 'n', gx: d, gy: d + 18 },
    { h: 'c', v: 's', gx: 0, gy: g + 22 },
    { h: 'c', v: 'n', gx: 0, gy: g + 22 },
  ];
}

function inside(p: Pt, poly: Pt[]): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

export function buildMap(meetings: Meeting[], ring: [number, number][] = [], w = 800, h = 1000, pad = 58): MapModel {
  // 1. where each town is
  const groups = new Map<string, Meeting[]>();
  for (const m of meetings) {
    if (!m.town) continue;
    if (!groups.has(m.town)) groups.set(m.town, []);
    groups.get(m.town)!.push(m);
  }
  const raw: { name: string; count: number; lat: number; lng: number }[] = [];
  for (const [name, list] of groups) {
    const placed = list.filter((m) => m.venue !== 'virtual' && m.lat !== null && m.lng !== null);
    const use = placed.length ? placed : list.filter((m) => m.lat !== null && m.lng !== null);
    if (!use.length) continue;
    raw.push({
      name,
      count: list.length,
      lat: use.reduce((s, m) => s + (m.lat as number), 0) / use.length,
      lng: use.reduce((s, m) => s + (m.lng as number), 0) / use.length,
    });
  }
  raw.sort((a, b) => a.name.localeCompare(b.name));

  // 2. project and fit
  const lats = [...raw.map((t) => t.lat), ...ring.map((p) => p[1])];
  const lngs = [...raw.map((t) => t.lng), ...ring.map((p) => p[0])];
  if (!lats.length) return { w, h, towns: [], outline: [], river: [], riverLabel: { x: 0, y: 0, angle: 0 }, north: [0, 0], trees: [] };
  const meanLat = lats.reduce((s, v) => s + v, 0) / lats.length;
  const k = Math.cos((meanLat * Math.PI) / 180);
  const minX = Math.min(...lngs) * k;
  const maxX = Math.max(...lngs) * k;
  const minY = Math.min(...lats);
  const maxY = Math.max(...lats);
  const scale = Math.min((w - pad * 2) / (maxX - minX || 1), (h - pad * 2) / (maxY - minY || 1));
  const offX = (w - (maxX - minX) * scale) / 2;
  const offY = (h - (maxY - minY) * scale) / 2;
  const project = (lng: number, lat: number): Pt => [offX + (lng * k - minX) * scale, offY + (maxY - lat) * scale];

  const outline = ring.map(([lng, lat]) => project(lng, lat));
  const towns: MapTown[] = raw.map((t) => {
    const [x, y] = project(t.lng, t.lat);
    const r = 6.5 + Math.sqrt(t.count) * 4.2;
    return { name: t.name, slug: slugify(t.name), count: t.count, x, y, r, spot: spots(r)[0] };
  });

  // 3. the Hudson: the county's east edge is the river, so the line follows that edge, just offshore
  let river: Pt[] = [];
  if (ring.length) {
    const eastLng = Math.max(...ring.map((p) => p[0]));
    const edge = ring.filter(([lng]) => lng > eastLng - 0.11).sort((a, b) => b[1] - a[1]);
    const seenLat = new Set<string>();
    edge.forEach(([lng, lat], i) => {
      const key = lat.toFixed(2);
      if (seenLat.has(key)) return;
      seenLat.add(key);
      const [x, y] = project(lng, lat);
      river.push([Math.min(w - 8, x + 20 + Math.sin(i * 1.9) * 4), y]);
    });
    if (river.length >= 2) {
      const first = river[0];
      const last = river[river.length - 1];
      river.unshift([Math.min(w - 8, first[0] + 8), first[1] - 34]);
      river.push([last[0] - 12, last[1] + 34]);
    }
  } else {
    const east = Math.max(...towns.map((t) => t.x)) + 60;
    for (let i = 0; i <= 8; i++) river.push([Math.min(w - 8, east + Math.sin(i * 1.9) * 5), pad + ((h - pad * 2) * i) / 8]);
  }
  // The label sits along the upper reach, just inland, where there are no towns. It reads up the river.
  const rA = river[Math.max(0, Math.floor(river.length * 0.12))];
  const rB = river[Math.floor(river.length * 0.5)];
  const angle = (Math.atan2(rA[1] - rB[1], rA[0] - rB[0]) * 180) / Math.PI;
  const along = Math.hypot(rA[0] - rB[0], rA[1] - rB[1]) || 1;
  const inland: Pt = [(rA[1] - rB[1]) / along, -(rA[0] - rB[0]) / along];
  const sign = inland[0] < 0 ? 1 : -1; // point west, away from the water
  const riverLabel = { x: (rA[0] + rB[0]) / 2 + inland[0] * sign * 30, y: (rA[1] + rB[1]) / 2 + inland[1] * sign * 30, angle };
  // Things a town label must not sit on: the river line and its label.
  const water: Box[] = [];
  for (let i = 1; i < river.length; i++) {
    for (let k = 0; k <= 4; k++) {
      const x = river[i - 1][0] + ((river[i][0] - river[i - 1][0]) * k) / 4;
      const y = river[i - 1][1] + ((river[i][1] - river[i - 1][1]) * k) / 4;
      water.push({ x0: x - 12, y0: y - 12, x1: x + 22, y1: y + 12 });
    }
  }
  for (let k = -3; k <= 3; k++) {
    const x = riverLabel.x + ((rA[0] - rB[0]) / along) * k * 24;
    const y = riverLabel.y + ((rA[1] - rB[1]) / along) * k * 24;
    water.push({ x0: x - 16, y0: y - 16, x1: x + 16, y1: y + 16 });
  }



  // 4. label collision pass: most crowded towns choose first, then two rounds of second thoughts
  const dots: Box[] = towns.map((t) => ({ x0: t.x - t.r - 3, y0: t.y - t.r - 3, x1: t.x + t.r + 3, y1: t.y + t.r + 3 }));
  // Any town may carry a pin on a given day, so the space just above every dot is kept clear too.
  const pinRoom: Box[] = towns.map((t) => ({ x0: t.x - 15, y0: t.y - t.r - 44, x1: t.x + 15, y1: t.y - t.r }));
  const crowd = (t: MapTown) => towns.filter((o) => o !== t && Math.hypot(o.x - t.x, o.y - t.y) < 150).length;
  const order = [...towns].sort((a, b) => crowd(b) - crowd(a));
  const chosen = new Map<MapTown, Box>();
  const cost = (t: MapTown, spot: LabelSpot, rank: number): number => {
    const box = labelBox(t, spot);
    let c = rank * 9;
    for (const [other, ob] of chosen) if (other !== t) c += overlap(box, ob) * 6;
    towns.forEach((o, i) => {
      if (o !== t) c += overlap(box, dots[i]) * 6;
      c += overlap(box, pinRoom[i]) * 3;
    });
    for (const wb of water) c += overlap(box, wb) * 3;
    c += Math.max(0, 10 - box.x0) * 60 + Math.max(0, box.x1 - (w - 10)) * 60 + Math.max(0, 10 - box.y0) * 60 + Math.max(0, box.y1 - (h - 10)) * 60;
    return c;
  };
  for (let round = 0; round < 4; round++) {
    for (const t of order) {
      let best = t.spot;
      let bestCost = Infinity;
      spots(t.r).forEach((spot, rank) => {
        const c = cost(t, spot, rank);
        if (c < bestCost) { bestCost = c; best = spot; }
      });
      t.spot = best;
      chosen.set(t, labelBox(t, best));
    }
  }

  // 5. a few tree stamps in the empty country, never over a label or a dot
  const rnd = rng(3003);
  const trees: MapModel['trees'] = [];
  const blocked: Box[] = [...chosen.values(), ...dots, ...pinRoom];
  for (let tries = 0; tries < 400 && trees.length < 16; tries++) {
    const p: Pt = [rnd(pad, w - pad), rnd(pad, h - pad)];
    if (outline.length && !inside(p, outline)) continue;
    const box: Box = { x0: p[0] - 26, y0: p[1] - 30, x1: p[0] + 26, y1: p[1] + 30 };
    if (blocked.some((b) => overlap(box, b) > 0)) continue;
    if (trees.some((t) => Math.hypot(t.x - p[0], t.y - p[1]) < 70)) continue;
    if (water.some((b) => overlap(box, b) > 0)) continue;
    trees.push({ x: p[0], y: p[1], kind: rnd() < 0.6 ? 'pine' : 'hardwood' });
  }

  return { w, h, towns, outline, river, riverLabel, north: [pad + 6, h - pad - 4], trees };
}

export const LABEL_FONT = FONT;
