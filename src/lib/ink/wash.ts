// The wash layer: flat pastel shapes that sit under the ink. Always coded, so each demo
// recolors it through --scene-sky, --scene-sun, --scene-a, --scene-b, --scene-c.
// No roughjs here. The wobble is a small deterministic sine mix.
import type { Slot } from './slots.ts';

export interface WashShape { c: 'sky' | 'sun' | 'a' | 'b' | 'c'; d?: string; circle?: [number, number, number] }

const wob = (x: number, seed: number) =>
  Math.sin(x * 0.0041 + seed) * 0.5 + Math.sin(x * 0.0113 + seed * 2.3) * 0.3 + Math.sin(x * 0.0237 + seed * 4.1) * 0.2;

/** A band with a gently wobbling top edge, running to the bottom of the picture. */
function band(w: number, h: number, yLeft: number, yRight: number, amp: number, seed: number): string {
  let d = `M0 ${h} L0 ${yLeft.toFixed(1)}`;
  for (let i = 0; i <= 28; i++) {
    const x = (w * i) / 28;
    const y = yLeft + ((yRight - yLeft) * x) / w + wob(x, seed) * amp;
    d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return `${d} L${w} ${h} Z`;
}

/** An organic blob (reference A). */
export function blobPath(cx: number, cy: number, rx: number, ry: number, seed: number, lumps = 0.14): string {
  const n = 9;
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n;
    const r = 1 + Math.sin(i * 2.4 + seed) * lumps + Math.sin(i * 1.3 + seed * 3.1) * lumps * 0.6;
    pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]);
  }
  const f = (v: number) => v.toFixed(1);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + ' Z';
}

export const WASH: Record<Slot, WashShape[]> = {
  'hero-river': [
    { c: 'sky', d: 'M0 0H2100V900H0Z' },
    { c: 'sun', circle: [1456, 520, 132] },
    { c: 'a', d: band(2100, 900, 452, 430, 18, 1.2) },
    { c: 'b', d: band(2100, 900, 548, 540, 12, 2.9) },
    { c: 'c', d: band(2100, 900, 626, 640, 7, 4.4) },
  ],
  'road-horizon': [
    { c: 'sky', d: 'M0 0H2100V900H0Z' },
    { c: 'sun', circle: [1050, 566, 138] },
    { c: 'a', d: band(2100, 900, 440, 452, 16, 5.1) },
    { c: 'b', d: band(2100, 900, 530, 524, 10, 6.6) },
    { c: 'c', d: band(2100, 900, 604, 604, 3, 7.9) },
  ],
  chairs: [
    { c: 'a', d: blobPath(600, 470, 500, 372, 0.8) },
    { c: 'sun', circle: [950, 180, 84] },
  ],
  table: [
    { c: 'a', d: blobPath(600, 420, 500, 330, 2.1) },
    { c: 'c', d: band(1200, 900, 760, 772, 6, 3.3) },
  ],
  pavilion: [
    { c: 'a', d: 'M0 0H1200V900H0Z' },
    { c: 'sun', circle: [880, 220, 92] },
    { c: 'b', d: band(1200, 900, 560, 548, 12, 1.7) },
    { c: 'c', d: band(1200, 900, 700, 706, 6, 2.6) },
  ],
  fireworks: [
    { c: 'a', d: 'M0 0H1200V900H0Z' },
    { c: 'b', d: band(1200, 900, 540, 556, 14, 3.7) },
    { c: 'c', d: band(1200, 900, 672, 672, 2, 5.2) },
  ],
  keytag: [
    { c: 'a', d: blobPath(450, 440, 380, 350, 4.2) },
    { c: 'c', d: blobPath(450, 762, 420, 74, 6.1, 0.07) },
  ],
};
