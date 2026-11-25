// Reusable pen-and-ink parts: trees, clouds, rocks, grass, water.
// Subject matter is the county itself. No people, no animals, no buildings with spires.
import { Ink, type Pt, type Rnd } from '../rough.ts';

/** A pine: ragged tiers, nearly solid ink, a few white flecks so it reads as drawn, not stamped. */
export function pine(ink: Ink, rnd: Rnd, x: number, base: number, h: number) {
  const tiers = Math.max(4, Math.round(h / 30));
  const half = h * 0.2;
  const top: Pt = [x + rnd(-1, 1), base - h];
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i < tiers; i++) {
    const t0 = i / tiers;
    const t1 = (i + 1) / tiers;
    const y0 = base - h + h * 0.86 * t0 + h * 0.05;
    const y1 = base - h + h * 0.86 * t1 + h * 0.03;
    const win = half * (0.12 + t0 * 0.5);
    const wout = half * (0.34 + t1 * 0.72);
    left.push([x - win * rnd(0.7, 1.1), y0], [x - wout * rnd(0.85, 1.2), y1 + rnd(-2, 3)]);
    right.push([x + win * rnd(0.7, 1.1), y0], [x + wout * rnd(0.85, 1.2), y1 + rnd(-2, 3)]);
  }
  ink.line(x, base + 1, x + rnd(-1.5, 1.5), base - h * 0.2, { w: Math.max(1.5, h * 0.035) });
  ink.poly([top, ...right, ...left.reverse()], { fill: 'ink', rough: 1.3, w: 1.2 });
  if (h > 70) {
    const flecks = Math.round(h / 45);
    for (let k = 0; k < flecks; k++) {
      const t = rnd(0.3, 0.9);
      const y = base - h + h * 0.86 * t;
      const w = half * (0.2 + t * 0.55);
      const fx = x + rnd(-w, w) * 0.7;
      ink.line(fx - w * 0.3, y + rnd(-2, 2), fx + w * 0.3, y + rnd(2, 6), { white: true, w: Math.max(1.2, h * 0.012), rough: 1.4 });
    }
  }
}

/** A hardwood: forked trunk, a scalloped cloud of a canopy with leaf marks and shade on one side. */
export function hardwood(ink: Ink, rnd: Rnd, x: number, base: number, h: number) {
  const trunk = h * 0.42;
  const rx = h * rnd(0.3, 0.36);
  const ry = h * rnd(0.29, 0.33);
  const cy = base - trunk - ry * 0.72;
  const tw = Math.max(1.6, Math.min(h * 0.04, 13));
  const lw = Math.max(1.3, Math.min(h * 0.011, 3));
  // trunk and fork
  ink.path(`M${x - tw} ${base + 1} Q${x - tw * 0.5} ${base - trunk * 0.5} ${x - tw * 0.7} ${base - trunk * 1.05}`, { w: lw });
  ink.path(`M${x + tw} ${base + 1} Q${x + tw * 0.4} ${base - trunk * 0.5} ${x + tw * 0.8} ${base - trunk * 1.05}`, { w: lw });
  if (h > 90) {
    ink.line(x, base - trunk * 0.7, x - rx * 0.45, base - trunk - ry * 0.25, { w: lw });
    ink.line(x + tw * 0.4, base - trunk * 0.6, x + rx * 0.5, base - trunk - ry * 0.2, { w: lw });
    for (let k = 0; k < 3; k++) ink.line(x - tw * 0.4 + k * tw * 0.4, base - rnd(0, trunk * 0.3), x - tw * 0.3 + k * tw * 0.4, base - trunk * rnd(0.45, 0.8), { w: 1 });
  }
  // canopy: a ring of bumps
  const n = Math.max(6, Math.min(15, Math.round((rx + ry) / 17)));
  const pts: Pt[] = [];
  for (let k = 0; k < n; k++) {
    const a = (Math.PI * 2 * k) / n + rnd(-0.1, 0.1);
    const r = 1 + rnd(-0.1, 0.08);
    pts.push([x + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]);
  }
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let k = 0; k < n; k++) {
    const p0 = pts[k];
    const p1 = pts[(k + 1) % n];
    const mx = (p0[0] + p1[0]) / 2;
    const my = (p0[1] + p1[1]) / 2;
    const ox = mx - x;
    const oy = my - cy;
    const ol = Math.hypot(ox, oy) || 1;
    const bulge = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) * rnd(0.42, 0.62);
    d += ` Q${(mx + (ox / ol) * bulge).toFixed(1)} ${(my + (oy / ol) * bulge).toFixed(1)} ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}`;
  }
  ink.path(d + ' Z', { fill: 'white', w: lw, rough: 0.7 });
  // leaf marks
  const s0 = Math.max(4, Math.min(h * 0.055, 15));
  const marks = Math.round(Math.min(h / 22, 16));
  for (let k = 0; k < marks; k++) {
    const a = rnd(0, Math.PI * 2);
    const r = Math.sqrt(rnd()) * 0.7;
    const sx = x + Math.cos(a) * rx * r;
    const sy = cy + Math.sin(a) * ry * r;
    const sz = s0 * rnd(0.7, 1.2);
    // one small cupped stroke per leaf cluster (never a double arch, which can read as a bird)
    ink.path(`M${sx - sz * 0.6} ${sy - sz * 0.3} q${sz * 0.5} ${sz * 0.85} ${sz * 1.2} ${sz * 0.1}`, { w: Math.max(1, lw * 0.7), rough: 0.6 });
  }
  // shade, lower right
  const shade = Math.round(Math.min(h / 12, 26));
  for (let k = 0; k < shade; k++) {
    const a = rnd(-0.25, 1.35);
    const r = rnd(0.5, 0.92);
    const sx = x + Math.cos(a) * rx * r;
    const sy = cy + Math.sin(a) * ry * r;
    const l = Math.min(h * rnd(0.04, 0.08), 26);
    ink.line(sx - l * 0.6, sy + l * 0.6, sx + l * 0.6, sy - l * 0.6, { w: 1, rough: 0.6 });
  }
}

/** A cloud: uneven bumps piling up over a long, flat, open base. Outline only. */
export function cloud(ink: Ink, rnd: Rnd, x: number, y: number, w: number, lw = 2) {
  const n = 4 + Math.round(rnd(0, 1.4));
  const widths: number[] = [];
  let total = 0;
  for (let i = 0; i < n; i++) { const v = rnd(0.55, 1.5); widths.push(v); total += v; }
  const joints: Pt[] = [[x, y]];
  let cx = x;
  for (let i = 0; i < n; i++) {
    cx += (widths[i] / total) * w;
    const t = (i + 1) / n;
    const lift = i === n - 1 ? 0 : w * (0.05 + 0.1 * Math.sin(Math.PI * t)) * rnd(0.6, 1.2);
    joints.push([cx, y - lift]);
  }
  let d = `M${joints[0][0].toFixed(1)} ${joints[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const [ax, ay] = joints[i];
    const [bx, by] = joints[i + 1];
    const span = bx - ax;
    const rise = w * (0.07 + 0.15 * Math.sin((Math.PI * (i + 0.5)) / n)) * rnd(0.75, 1.2);
    d += ` C${(ax + span * 0.02).toFixed(1)} ${(ay - rise * 1.3).toFixed(1)} ${(bx - span * 0.1).toFixed(1)} ${(Math.min(ay, by) - rise * 1.35).toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`;
  }
  ink.path(d, { w: lw, rough: 0.7 });
  // the base: one long stroke and a short one that overshoots
  ink.curve([[x - w * 0.08, y + 3], [x + w * 0.3, y + w * 0.012], [x + w * 0.62, y + 4]], { w: lw * 0.85, rough: 0.8 });
  ink.curve([[x + w * 0.7, y + 2], [x + w * 0.9, y + w * 0.01], [x + w * 1.1, y + 4]], { w: lw * 0.85, rough: 0.8 });
}

/** A rock: an angular lump, white so it hides what is behind it, shaded on the right. */
export function rock(ink: Ink, rnd: Rnd, x: number, base: number, w: number, h: number, lw = 2.5) {
  const pts: Pt[] = [
    [x - w * 0.5, base],
    [x - w * 0.42, base - h * rnd(0.45, 0.65)],
    [x - w * rnd(0.12, 0.22), base - h * rnd(0.9, 1)],
    [x + w * rnd(0.12, 0.25), base - h * rnd(0.78, 0.95)],
    [x + w * 0.46, base - h * rnd(0.3, 0.5)],
    [x + w * 0.52, base],
  ];
  ink.poly(pts, { fill: 'white', w: lw, rough: 1.1 });
  ink.poly([pts[3], pts[4], pts[5], [x + w * 0.12, base]], { fill: 'ink', fillStyle: 'hachure', gap: Math.max(5, w * 0.06), angle: -60, fillW: 1.2, noStroke: true });
  ink.line(pts[3][0], pts[3][1], x + w * 0.12, base - h * 0.08, { w: lw * 0.6 });
}

/** A tuft of grass: three or four short strokes fanning up. */
export function tuft(ink: Ink, rnd: Rnd, x: number, y: number, s: number) {
  const n = 3 + Math.round(rnd(0, 1.4));
  for (let i = 0; i < n; i++) {
    const lean = (i - (n - 1) / 2) * s * 0.35 + rnd(-1, 1);
    ink.path(`M${x + lean * 0.3} ${y} q${lean * 0.4} ${-s * 0.6} ${lean} ${-s * rnd(0.8, 1.2)}`, { w: Math.max(1, s * 0.09), rough: 0.6 });
  }
}

/** One short ripple on still water. */
export function ripple(ink: Ink, rnd: Rnd, x: number, y: number, l: number, lw = 1.6) {
  ink.curve([[x, y], [x + l * 0.3, y - rnd(1, 3)], [x + l * 0.65, y + rnd(1, 3)], [x + l, y]], { w: lw, rough: 0.5 });
}

/** A row of mixed trees along a line. `skip` leaves gaps (a road, a pavilion). */
export function treeLine(
  ink: Ink, rnd: Rnd, x0: number, x1: number, yAt: (x: number) => number, hMin: number, hMax: number,
  step: number, pineShare = 0.6, skip: (x: number) => boolean = () => false,
) {
  for (let x = x0; x <= x1; x += step * rnd(0.7, 1.4)) {
    if (skip(x)) continue;
    const h = rnd(hMin, hMax);
    if (rnd() < pineShare) pine(ink, rnd, x, yAt(x) + rnd(-2, 2), h);
    else hardwood(ink, rnd, x, yAt(x) + rnd(-2, 2), h * 0.85);
  }
}

/** Piecewise-linear lookup through [x, y] knots. */
export function along(knots: Pt[]) {
  return (x: number) => {
    if (x <= knots[0][0]) return knots[0][1];
    for (let i = 1; i < knots.length; i++) {
      if (x <= knots[i][0]) {
        const [x0, y0] = knots[i - 1];
        const [x1, y1] = knots[i];
        return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
      }
    }
    return knots[knots.length - 1][1];
  };
}

/** A tiny orthographic camera for furniture: yaw about the vertical, then tilt down. */
export function camera(cx: number, cy: number, scale: number, pitchDeg: number, yawDeg = 0) {
  const p = (pitchDeg * Math.PI) / 180;
  const yw = (yawDeg * Math.PI) / 180;
  const project = (x: number, y: number, z: number): Pt => {
    const xr = x * Math.cos(yw) + z * Math.sin(yw);
    const zr = -x * Math.sin(yw) + z * Math.cos(yw);
    return [cx + scale * xr, cy - scale * y * Math.cos(p) + scale * zr * Math.sin(p)];
  };
  const depth = (x: number, _y: number, z: number) => -x * Math.sin(yw) + z * Math.cos(yw);
  return { project, depth, scale, squash: Math.sin(p) };
}
export type Camera = ReturnType<typeof camera>;
