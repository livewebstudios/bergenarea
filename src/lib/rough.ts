// One place owns the hand-drawn defaults. Every roughjs call on the site goes through Ink,
// always with a fixed seed, so shapes never twitch between server render, hydration and re-render.
import rough from 'roughjs';

const gen = rough.generator();

export type Pt = [number, number];

export interface InkPath {
  d: string;
  /** line = ink stroke, fill = solid ink, white = solid white (drops out under multiply), hatch = thin ink shading, wline = white stroke */
  c: 'line' | 'fill' | 'white' | 'hatch' | 'wline';
  w?: number;
  dash?: string;
}

export interface InkOpts {
  /** stroke width */
  w?: number;
  rough?: number;
  bow?: number;
  fill?: 'ink' | 'white';
  fillStyle?: 'solid' | 'hachure' | 'zigzag' | 'cross-hatch' | 'dots';
  gap?: number;
  angle?: number;
  fillW?: number;
  /** draw the line twice, like a pen going over itself */
  multi?: boolean;
  noStroke?: boolean;
  dash?: string;
  /** keep corners exactly where they are */
  keep?: boolean;
  /** stroke in white instead of ink */
  white?: boolean;
}

/** Small seeded random source (mulberry32). rnd() is 0..1, rnd(a, b) is a..b. */
export function rng(seed: number) {
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
export type Rnd = ReturnType<typeof rng>;

export class Ink {
  paths: InkPath[] = [];
  private n = 0;
  seed: number;
  /** default stroke width */
  w: number;
  /** default roughness */
  rough: number;
  /** how far a line may wander, in drawing units */
  wobble: number;
  constructor(seed = 1, w = 1.5, roughness = 1, wobble = 2) {
    this.seed = seed;
    this.w = w;
    this.rough = roughness;
    this.wobble = wobble;
  }

  private o(p: InkOpts) {
    return {
      seed: this.seed * 1000 + ++this.n,
      roughness: p.rough ?? this.rough,
      bowing: p.bow ?? 1,
      maxRandomnessOffset: this.wobble,
      stroke: '#000',
      strokeWidth: p.w ?? this.w,
      disableMultiStroke: !p.multi,
      disableMultiStrokeFill: true,
      preserveVertices: p.keep ?? false,
      fill: p.fill ? '#000' : undefined,
      fillStyle: p.fillStyle ?? 'solid',
      hachureGap: p.gap ?? 8,
      hachureAngle: p.angle ?? -41,
      fillWeight: p.fillW ?? Math.max(1, (p.w ?? this.w) * 0.6),
      fixedDecimalPlaceDigits: 1,
    };
  }

  private push(drawable: { sets: { type: string; ops: unknown[] }[] }, p: InkOpts) {
    for (const set of drawable.sets) {
      const d = gen.opsToPath(set as never, 1);
      if (!d) continue;
      if (set.type === 'path') {
        if (!p.noStroke) this.paths.push({ d, c: p.white ? 'wline' : 'line', w: p.w ?? this.w, dash: p.dash });
      } else if (set.type === 'fillPath') {
        this.paths.push({ d, c: p.fill === 'white' ? 'white' : 'fill' });
      } else {
        this.paths.push({ d, c: p.fill === 'white' ? 'wline' : 'hatch', w: p.fillW ?? Math.max(1, (p.w ?? this.w) * 0.6) });
      }
    }
    return this;
  }

  line(x1: number, y1: number, x2: number, y2: number, p: InkOpts = {}) { return this.push(gen.line(x1, y1, x2, y2, this.o(p)), p); }
  /** straight segments through points, open */
  linear(pts: Pt[], p: InkOpts = {}) { return this.push(gen.linearPath(pts, this.o(p)), p); }
  /** smooth curve through points, open */
  curve(pts: Pt[], p: InkOpts = {}) { return this.push(gen.curve(pts, this.o(p)), p); }
  poly(pts: Pt[], p: InkOpts = {}) { return this.push(gen.polygon(pts, this.o(p)), p); }
  path(d: string, p: InkOpts = {}) { return this.push(gen.path(d, this.o(p)), p); }
  ellipse(cx: number, cy: number, w: number, h: number, p: InkOpts = {}) { return this.push(gen.ellipse(cx, cy, w, h, this.o(p)), p); }
  circle(cx: number, cy: number, d: number, p: InkOpts = {}) { return this.push(gen.circle(cx, cy, d, this.o(p)), p); }
  arc(cx: number, cy: number, w: number, h: number, start: number, stop: number, p: InkOpts = {}) {
    return this.push(gen.arc(cx, cy, w, h, start, stop, false, this.o(p)), p);
  }
  /** a closed smooth shape through points (white or ink fill optional) */
  blob(pts: Pt[], p: InkOpts = {}) { return this.path(closedPath(pts), p); }
  /** round dots along a smooth curve: the hand-dotted path line */
  dots(pts: Pt[], p: InkOpts = {}) { return this.curve(pts, { w: 3, dash: '0.1 11', rough: 0.8, ...p }); }
}

/** Catmull-Rom through points, closed, as an SVG path. */
export function closedPath(pts: Pt[], tension = 0.5): string {
  const n = pts.length;
  const f = (v: number) => v.toFixed(1);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1: Pt = [p1[0] + ((p2[0] - p0[0]) * tension) / 3, p1[1] + ((p2[1] - p0[1]) * tension) / 3];
    const c2: Pt = [p2[0] - ((p3[0] - p1[0]) * tension) / 3, p2[1] - ((p3[1] - p1[1]) * tension) / 3];
    d += ` C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + ' Z';
}

/** Catmull-Rom through points, open, as an SVG path. */
export function openPath(pts: Pt[], tension = 0.5): string {
  const n = pts.length;
  const f = (v: number) => v.toFixed(1);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(n - 1, i + 2)];
    const c1: Pt = [p1[0] + ((p2[0] - p0[0]) * tension) / 3, p1[1] + ((p2[1] - p0[1]) * tension) / 3];
    const c2: Pt = [p2[0] - ((p3[0] - p1[0]) * tension) / 3, p2[1] - ((p3[1] - p1[1]) * tension) / 3];
    d += ` C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}
