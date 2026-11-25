// The seven coded ink drawings. These are the fallbacks used when docs/renders/ has no
// approved render for a slot. Each one is a black line drawing on white, built with roughjs
// and a fixed seed. scripts/ink.mjs writes them to public/ink/<slot>.svg.
//
// Subject matter is the county: river, cliffs, bridge, trees, a road, a pavilion, empty chairs,
// a coffee table, a blank key tag. No people, no hands, no animals, no steeples, no lettering.
import { Ink, rng, type Pt } from '../rough.ts';
import { along, camera, cloud, hardwood, pine, ripple, rock, treeLine, tuft, type Camera } from './parts.ts';
import { SLOTS, type Slot } from './slots.ts';

export interface Drawing { slot: Slot; w: number; h: number; ink: Ink }

// ---------------------------------------------------------------- hero-river (21:9)
function heroRiver(): Ink {
  const ink = new Ink(11, 3.2, 1, 3);
  const rnd = rng(1101);

  // far ridge and the far shore
  ink.curve([[760, 592], [980, 566], [1180, 580], [1420, 552], [1640, 574], [1880, 548], [2100, 566]], { w: 2.2 });
  ink.curve([[1180, 580], [1330, 570], [1500, 578], [1700, 566], [1900, 574], [2100, 560]], { w: 1.4 });
  ink.curve([[1235, 604], [1500, 606], [1800, 618], [2100, 632]], { w: 2.4 });

  // a suspension bridge, small in the far distance
  const deck = 590;
  ink.line(1262, deck, 1648, deck, { w: 2.4, rough: 0.5 });
  ink.line(1262, deck + 5, 1648, deck + 5, { w: 1.2, rough: 0.5 });
  for (const tx of [1372, 1540]) {
    ink.line(tx - 4, deck + 14, tx - 3, deck - 52, { w: 2, rough: 0.4 });
    ink.line(tx + 4, deck + 14, tx + 3, deck - 52, { w: 2, rough: 0.4 });
    ink.line(tx - 5, deck - 50, tx + 5, deck - 50, { w: 2, rough: 0.3 });
    ink.line(tx - 4, deck - 30, tx + 4, deck - 30, { w: 1.2, rough: 0.3 });
  }
  const cable = (x: number) => {
    if (x < 1372) return deck - 52 * ((x - 1262) / 110) ** 1.6;
    if (x > 1540) return deck - 52 * ((1648 - x) / 108) ** 1.6;
    const t = (x - 1372) / 168;
    return deck - 52 + 40 * (1 - (2 * t - 1) ** 2);
  };
  const cablePts: Pt[] = [];
  for (let x = 1262; x <= 1648; x += 22) cablePts.push([x, cable(x)]);
  ink.curve(cablePts, { w: 1.6, rough: 0.3 });
  for (let x = 1284; x < 1640; x += 13) if (deck - cable(x) > 5) ink.line(x, cable(x), x, deck, { w: 0.9, rough: 0.2 });

  // small trees on the far right shore
  treeLine(ink, rnd, 1660, 2100, along([[1660, 612], [2100, 632]]), 22, 58, 26, 0.7);

  // the cliffs along the left bank (white body hides the ridge behind)
  const top = along([[-20, 262], [200, 292], [430, 356], [640, 430], [840, 500], [1010, 556], [1150, 596]]);
  const foot = along([[-20, 640], [300, 652], [560, 650], [800, 636], [1010, 612], [1150, 600]]);
  const body: Pt[] = [];
  for (let x = -20; x <= 1150; x += 45) body.push([x, top(x) + rnd(-7, 7)]);
  body.push([1150, 598]);
  for (let x = 1150; x >= -20; x -= 90) body.push([x, foot(x) + 6]);
  ink.poly(body, { fill: 'white', noStroke: true, rough: 0.2 });
  const rim: Pt[] = [];
  for (let x = -20; x <= 1150; x += 38) rim.push([x, top(x) + rnd(-8, 8)]);
  ink.linear(rim, { w: 3, rough: 1.2 });
  // columns of rock: the face is drawn as tall broken verticals
  for (let x = -10; x < 1140; ) {
    const far = x / 1140;
    const t = top(x) + rnd(4, 14);
    const f = foot(x) - rnd(0, 10);
    const len = f - t;
    if (len > 10) {
      const breakAt = rnd(0.35, 0.75);
      const lean = rnd(-4, 4);
      if (rnd() < 0.7) {
        ink.line(x, t, x + lean, t + len * breakAt, { w: 2.4 - far * 1.2, rough: 0.9 });
        ink.line(x + lean + rnd(-5, 5), t + len * (breakAt + 0.06), x + lean * 1.4, f, { w: 2 - far, rough: 0.9 });
      } else {
        ink.line(x, t, x + lean, f, { w: 2.4 - far * 1.2, rough: 1 });
      }
      if (rnd() < 0.42) {
        const cw = (30 - far * 20) * rnd(0.6, 1);
        const s0 = t + len * rnd(0.05, 0.4);
        const s1 = s0 + len * rnd(0.25, 0.5);
        ink.poly([[x + 2, s0], [x + cw, s0 + 6], [x + cw, s1], [x + 2, s1 + 4]], {
          fill: 'ink', fillStyle: 'hachure', gap: 7 - far * 2.5, angle: 62, fillW: 1.1, noStroke: true,
        });
      }
    }
    x += (34 - far * 22) * rnd(0.7, 1.3);
  }
  // ledges
  for (let i = 0; i < 9; i++) {
    const x = rnd(0, 900);
    const y = top(x) + (foot(x) - top(x)) * rnd(0.3, 0.8);
    ink.line(x, y, x + rnd(40, 110), y + rnd(4, 12), { w: 1.4, rough: 1.2 });
  }
  // trees along the rim, shrinking with distance
  for (let x = 10; x < 1090; ) {
    const far = x / 1100;
    const h = (92 - far * 76) * rnd(0.7, 1.15);
    if (rnd() < 0.78) pine(ink, rnd, x, top(x) + 4, h);
    else hardwood(ink, rnd, x, top(x) + 4, h * 0.85);
    x += (44 - far * 30) * rnd(0.7, 1.3);
  }

  // talus and the near shore of the left bank
  const shore: Pt[] = [[1235, 604], [1080, 616], [900, 648], [740, 690], [640, 724], [575, 772], [625, 832], [700, 905]];
  ink.poly([[-20, 905], [-20, 640], [300, 652], [560, 650], [800, 636], [1010, 612], [1150, 600], ...shore], { fill: 'white', noStroke: true, rough: 0.2 });
  ink.curve([...shore].reverse(), { w: 3.2, rough: 1 });
  // brush at the foot of the cliffs
  treeLine(ink, rnd, 600, 1060, along([[600, 668], [800, 646], [1060, 614]]), 26, 70, 30, 0.72);
  treeLine(ink, rnd, 330, 600, along([[330, 676], [600, 672]]), 70, 130, 46, 0.55);

  // right foreground bank with rocks and tall pines
  const rbank: Pt[] = [[2120, 668], [1900, 682], [1730, 716], [1610, 778], [1550, 850], [1530, 905]];
  ink.poly([...rbank, [2120, 905]], { fill: 'white', noStroke: true, rough: 0.2 });
  ink.curve(rbank, { w: 3.2, rough: 1 });
  hardwood(ink, rnd, 1790, 716, 250);
  pine(ink, rnd, 2060, 700, 300);
  pine(ink, rnd, 1965, 706, 390);
  pine(ink, rnd, 1880, 712, 250);
  rock(ink, rnd, 1700, 800, 190, 96, 3);
  rock(ink, rnd, 1880, 842, 250, 120, 3);
  rock(ink, rnd, 1640, 866, 120, 54, 2.6);
  pine(ink, rnd, 2030, 850, 210);
  for (let i = 0; i < 16; i++) tuft(ink, rnd, rnd(1580, 2090), rnd(790, 890), rnd(14, 26));

  // near bank, bottom left: big trees at the edge of the frame, grass, a rock
  pine(ink, rnd, 60, 792, 470);
  pine(ink, rnd, 178, 808, 360);
  hardwood(ink, rnd, 300, 770, 250);
  pine(ink, rnd, -6, 860, 300);
  rock(ink, rnd, 250, 868, 150, 62, 2.8);
  ink.curve([[0, 800], [200, 812], [380, 800], [560, 786]], { w: 1.6, rough: 1.2 });
  for (let i = 0; i < 22; i++) tuft(ink, rnd, rnd(120, 560), rnd(800, 892), rnd(14, 28));

  // water
  for (let i = 0; i < 46; i++) {
    const t = rnd() ** 0.8; // 0 far, 1 near
    const y = 610 + t * 280;
    const half = 60 + t * 420;
    const centre = 1345 - t * 250;
    const x = centre + rnd(-half, half) * 0.86;
    ripple(ink, rnd, x, y, 26 + t * 90 * rnd(0.6, 1.2), 1 + t * 1.2);
  }

  // low clouds, kept to the sides so the middle of the sky stays empty
  cloud(ink, rnd, 1180, 300, 330, 2.4);
  cloud(ink, rnd, 1620, 420, 260, 2.2);
  cloud(ink, rnd, 620, 250, 230, 2.2);
  return ink;
}

// ---------------------------------------------------------------- road-horizon (21:9)
function roadHorizon(): Ink {
  const ink = new Ink(23, 3, 1, 3);
  const rnd = rng(2301);
  const H = 600;
  const vx = 1050;

  // horizon, broken where the road meets it
  ink.curve([[-20, H + 4], [300, H - 2], [640, H + 3], [990, H]], { w: 2.2 });
  ink.curve([[1110, H], [1450, H + 3], [1800, H - 2], [2120, H + 4]], { w: 2.2 });
  ink.curve([[-20, 548], [260, 520], [520, 544], [760, 526], [960, 548]], { w: 1.4 });
  ink.curve([[1150, 546], [1380, 524], [1660, 548], [1900, 522], [2120, 540]], { w: 1.4 });

  // tree line across the horizon, open at the road
  treeLine(ink, rnd, 0, 2100, () => H + 2, 44, 128, 34, 0.62, (x) => Math.abs(x - vx) < 74);
  treeLine(ink, rnd, 0, 330, () => H + 8, 150, 230, 80, 0.7);
  treeLine(ink, rnd, 1790, 2100, () => H + 8, 150, 240, 78, 0.7);

  // the road: two lanes running straight to the vanishing point
  ink.poly([[vx - 5, H], [vx + 5, H], [1560, 905], [540, 905]], { fill: 'white', noStroke: true, rough: 0.1 });
  ink.line(vx - 5, H, 540, 905, { w: 3.4, rough: 0.7 });
  ink.line(vx + 5, H, 1560, 905, { w: 3.4, rough: 0.7 });
  ink.line(vx - 8, H + 4, 400, 905, { w: 1.4, rough: 0.9 });
  ink.line(vx + 8, H + 4, 1700, 905, { w: 1.4, rough: 0.9 });
  // centre dashes, growing toward the viewer
  let t = 0.03;
  while (t < 1) {
    const len = 0.012 + t * 0.11;
    const y0 = H + t * 305;
    const y1 = H + Math.min(1, t + len) * 305;
    const wHalf = 0.5 + t * 7;
    ink.poly([[vx - wHalf * 0.6, y0], [vx + wHalf * 0.6, y0], [vx + wHalf, y1], [vx - wHalf, y1]], { fill: 'ink', rough: 0.5, w: 1 });
    t += len * 1.9;
  }
  // tar seams and shoulder gravel
  for (let i = 0; i < 12; i++) {
    const tt = rnd(0.25, 1);
    const y = H + tt * 300;
    const half = 5 + tt * 500;
    const x = vx + rnd(-half, half) * 0.8;
    ink.line(x, y, x + rnd(20, 70) * tt, y + rnd(-2, 2), { w: 1, rough: 1 });
  }

  // fields: grass in perspective
  for (let i = 0; i < 70; i++) {
    const tt = rnd() ** 0.7;
    const y = H + 14 + tt * 280;
    const roadHalf = 20 + ((y - H) / 305) * 680;
    const side = rnd() < 0.5 ? -1 : 1;
    const x = vx + side * (roadHalf + rnd(30, 1000 - roadHalf * 0.4));
    if (x < 0 || x > 2100) continue;
    tuft(ink, rnd, x, y, 8 + tt * 24);
  }
  for (let i = 0; i < 9; i++) {
    const side = i % 2 ? -1 : 1;
    const y = 640 + i * 26;
    const x = vx + side * (300 + i * 70 + rnd(0, 200));
    ink.curve([[x, y], [x + 120, y - 4], [x + 260, y + 3]], { w: 1.2, rough: 1 });
  }

  cloud(ink, rnd, 420, 300, 280, 2.2);
  cloud(ink, rnd, 1420, 250, 340, 2.4);
  cloud(ink, rnd, 1820, 380, 200, 2);
  return ink;
}

// ---------------------------------------------------------------- chairs (4:3)
type P3 = [number, number, number];
interface Piece { z: number; draw: () => void }

function foldingChair(ink: Ink, cam: Camera, px: number, pz: number, facing: number, pieces: Piece[]) {
  const sin = Math.sin(facing);
  const cos = Math.cos(facing);
  const world = ([x, y, z]: P3): P3 => [px + x * cos + z * sin, y, pz - x * sin + z * cos];
  const proj = (p: P3): Pt => cam.project(...world(p));
  const depthOf = (pts: P3[]) => pts.reduce((s, p) => s + cam.depth(...world(p)), 0) / pts.length;
  const leg = (a: P3, b: P3, w = 3.6) => pieces.push({ z: depthOf([a, b]), draw: () => { const [p, q] = [proj(a), proj(b)]; ink.line(p[0], p[1], q[0], q[1], { w, rough: 0.6 }); } });
  const panel = (pts: P3[], hatch = false) => pieces.push({
    z: depthOf(pts),
    draw: () => {
      const q = pts.map(proj);
      ink.poly(q, { fill: 'white', w: 3, rough: 0.7 });
      if (hatch) ink.poly(q, { fill: 'ink', fillStyle: 'hachure', gap: 9, angle: -30, fillW: 1, noStroke: true });
    },
  });
  for (const s of [-20, 20]) {
    leg([s, 86, -27], [s, 0, 17]); // back frame runs down to the front foot
    leg([s, 45, 15], [s, 0, -25]); // rear leg
  }
  leg([-20, 9, -18], [20, 9, -18], 2.4);
  leg([-20, 9, 12.5], [20, 9, 12.5], 2.4);
  panel([[-20, 45, -19], [20, 45, -19], [20, 45, 19], [-20, 45, 19]], true);
  panel([[-20, 86, -27], [20, 86, -27], [20, 68, -18], [-20, 68, -18]]);
}

function chairs(): Ink {
  const ink = new Ink(31, 3, 0.8, 2.4);
  const rnd = rng(3101);
  const cam = camera(590, 500, 2.4, 41);
  const R = 156;
  const n = 7;
  const seats: { x: number; z: number; f: number }[] = [];
  for (let i = 0; i < n; i++) {
    const phi = (Math.PI * 2 * i) / n + 0.38;
    let r = R * rnd(0.96, 1.04);
    let twist = rnd(-0.12, 0.12);
    if (i === 1) { r = R * 1.3; twist = 0.5; } // one chair pulled slightly out
    const x = Math.cos(phi) * r;
    const z = Math.sin(phi) * r;
    seats.push({ x, z, f: Math.atan2(-Math.cos(phi), -Math.sin(phi)) + twist });
  }
  // soft floor shadows first
  for (const s of seats) {
    const [gx, gy] = cam.project(s.x, 0, s.z);
    ink.ellipse(gx + 10, gy + 4, 132, 62, { fill: 'ink', fillStyle: 'hachure', gap: 8, angle: -12, fillW: 1, noStroke: true });
  }
  seats.sort((a, b) => a.z - b.z);
  for (const s of seats) {
    const pieces: Piece[] = [];
    foldingChair(ink, cam, s.x, s.z, s.f, pieces);
    pieces.sort((a, b) => a.z - b.z).forEach((p) => p.draw());
  }
  return ink;
}

// ---------------------------------------------------------------- table (4:3)
function cylinder(ink: Ink, cam: Camera, x: number, y0: number, z: number, r0: number, r1: number, h: number, w = 2.6) {
  const [bx, by] = cam.project(x, y0, z);
  const [tx, ty] = cam.project(x, y0 + h, z);
  const s = cam.scale;
  const q = cam.squash;
  ink.poly([[bx - r0 * s, by], [tx - r1 * s, ty], [tx + r1 * s, ty], [bx + r0 * s, by]], { fill: 'white', noStroke: true, rough: 0.1 });
  ink.ellipse(bx, by, r0 * 2 * s, r0 * 2 * s * q, { fill: 'white', noStroke: true, rough: 0.2 });
  ink.arc(bx, by, r0 * 2 * s, r0 * 2 * s * q, 0, Math.PI, { w, rough: 0.5 });
  ink.line(bx - r0 * s, by, tx - r1 * s, ty, { w, rough: 0.5 });
  ink.line(bx + r0 * s, by, tx + r1 * s, ty, { w, rough: 0.5 });
  ink.ellipse(tx, ty, r1 * 2 * s, r1 * 2 * s * q, { fill: 'white', w, rough: 0.5 });
  return { bx, by, tx, ty };
}

function table(): Ink {
  const ink = new Ink(41, 3, 0.8, 2.4);
  const rnd = rng(4101);
  const cam = camera(590, 640, 4.1, 24, -24);
  const P = (x: number, y: number, z: number) => cam.project(x, y, z);
  const quad = (pts: P3[]) => pts.map((p) => P(...p));
  const seg = (a: P3, b: P3, w = 3.4) => { const [p, q] = [P(...a), P(...b)]; ink.line(p[0], p[1], q[0], q[1], { w, rough: 0.6 }); };
  const Y = 74;

  // floor shadow
  const sh = quad([[-84, 0, -14], [92, 0, -14], [98, 0, 40], [-78, 0, 40]]);
  ink.poly(sh, { fill: 'ink', fillStyle: 'hachure', gap: 15, angle: -14, fillW: 1, noStroke: true });

  // far legs, then braces, then near legs
  for (const lx of [-78, 78]) {
    seg([lx, 0, -30], [lx, 70, -30]);
    seg([lx, 18, -30], [lx, 18, 30], 2.4);
    seg([lx, 18, 0], [lx * 0.5, 70, 0], 2.2);
  }
  for (const lx of [-78, 78]) seg([lx, 0, 30], [lx, 70, 30]);

  // top with a skirt
  ink.poly(quad([[-90, Y - 5, 37], [90, Y - 5, 37], [90, Y, 37], [-90, Y, 37]]), { fill: 'white', w: 2.6, rough: 0.6 });
  ink.poly(quad([[90, Y - 5, 37], [90, Y - 5, -37], [90, Y, -37], [90, Y, 37]]), { fill: 'white', w: 2.6, rough: 0.6 });
  ink.poly(quad([[-90, Y, -37], [90, Y, -37], [90, Y, 37], [-90, Y, 37]]), { fill: 'white', w: 3.2, rough: 0.7 });
  // table seam (folding tables fold in the middle)
  seg([0, Y, -37], [0, Y, 37], 1.2);

  // things on the table, far ones first
  // pile of pamphlets, blank covers
  for (let i = 0; i < 6; i++) {
    const a = rnd(-0.22, 0.22);
    const cx = 34 + rnd(-2, 2);
    const cz = -14 + rnd(-2, 2);
    const hw = 11;
    const hd = 15;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const pts: P3[] = ([[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]] as Pt[]).map(([px, pz]) => [cx + px * c - pz * s, Y + 0.4 + i * 0.9, cz + px * s + pz * c]);
    ink.poly(quad(pts), { fill: 'white', w: 2, rough: 0.6 });
    if (i === 5) {
      const fold: P3[] = [[cx - hw * c * 0.02, Y + 0.4 + i * 0.9, cz - hd * 0.94], [cx + hw * s * 0.02, Y + 0.4 + i * 0.9, cz + hd * 0.94]];
      seg(fold[0], fold[1], 1);
    }
  }

  // coffee urn
  const ux = -50;
  const uz = -8;
  for (const [dx, dz] of [[-9, 6], [9, 6], [0, -10]] as Pt[]) seg([ux + dx, Y, uz + dz], [ux + dx, Y + 5, uz + dz], 3);
  const body = cylinder(ink, cam, ux, Y + 5, uz, 15, 15, 44, 3);
  // shade on the right flank
  for (let i = 0; i < 6; i++) {
    const x = body.bx + 15 * cam.scale * (0.5 + i * 0.085);
    ink.line(x, body.by - 6 + i * 1.5, x, body.ty + 10 - i, { w: 1, rough: 0.5 });
  }
  // lid and knob
  ink.path(`M${body.tx - 13 * cam.scale} ${body.ty - 2} Q${body.tx} ${body.ty - 34} ${body.tx + 13 * cam.scale} ${body.ty - 2}`, { w: 2.6, rough: 0.5 });
  ink.ellipse(body.tx, body.ty - 22, 20, 12, { fill: 'white', w: 2.4, rough: 0.5 });
  // handles
  ink.path(`M${body.tx - 15 * cam.scale} ${body.ty + 34} q-26 6 -22 32 q4 16 22 14`, { w: 2.6, rough: 0.5 });
  ink.path(`M${body.tx + 15 * cam.scale} ${body.ty + 34} q26 6 22 32 q-4 16 -22 14`, { w: 2.6, rough: 0.5 });
  // sight glass and spigot
  ink.line(body.bx - 4, body.by - 34, body.bx - 4, body.ty + 30, { w: 1.4, rough: 0.3 });
  ink.line(body.bx + 4, body.by - 34, body.bx + 4, body.ty + 30, { w: 1.4, rough: 0.3 });
  ink.path(`M${body.bx - 8} ${body.by - 22} h16 v12 h-16 Z`, { fill: 'white', w: 2.2, rough: 0.5 });
  ink.path(`M${body.bx} ${body.by - 10} v14 M${body.bx - 9} ${body.by + 5} h18`, { w: 2.4, rough: 0.4 });
  ink.line(body.bx, body.by - 22, body.bx + 12, body.by - 34, { w: 2.4, rough: 0.4 });

  // stacks of paper cups
  const cupStack = (x: number, z: number, count: number) => {
    const base = cylinder(ink, cam, x, Y, z, 3.4, 4.9, 10 + (count - 1) * 2.4, 2);
    for (let i = 1; i < count; i++) {
      const [rx, ry] = P(x, Y + 10 + (i - 1) * 2.4, z);
      ink.arc(rx, ry, 9.8 * cam.scale, 9.8 * cam.scale * cam.squash, 0, Math.PI, { w: 1.4, rough: 0.4 });
    }
    return base;
  };
  cupStack(-12, 8, 9);
  cupStack(0, 16, 5);
  cylinder(ink, cam, 12, Y, 24, 3.4, 4.9, 10, 2);

  // clipboard with a clip and a few ruled lines, and a pen beside it
  const cb = (px: number, pz: number): P3 => {
    const a = 0.2;
    return [62 + px * Math.cos(a) - pz * Math.sin(a), Y + 0.6, 10 + px * Math.sin(a) + pz * Math.cos(a)];
  };
  ink.poly(quad([cb(-12, -17), cb(12, -17), cb(12, 17), cb(-12, 17)]), { fill: 'white', w: 2.8, rough: 0.6 });
  ink.poly(quad([cb(-10, -13), cb(10, -13), cb(10, 15), cb(-10, 15)]), { fill: 'white', w: 1.4, rough: 0.6 });
  ink.poly(quad([cb(-5, -18.5), cb(5, -18.5), cb(5, -14), cb(-5, -14)]), { fill: 'ink', w: 1.6, rough: 0.5 });
  for (let i = 0; i < 5; i++) { const [a, b] = [P(...cb(-7, -8 + i * 4.6)), P(...cb(7, -8 + i * 4.6))]; ink.line(a[0], a[1], b[0], b[1], { w: 1, rough: 0.7 }); }
  seg([80, Y + 0.6, -6], [84, Y + 0.6, 12], 3);

  // floor line
  ink.line(40, 842, 1160, 846, { w: 1.2, rough: 1.2 });
  tuftless(ink, rnd, 180, 870);
  tuftless(ink, rnd, 760, 872);
  return ink;
}
function tuftless(ink: Ink, rnd: ReturnType<typeof rng>, x: number, y: number) {
  ink.line(x, y, x + rnd(60, 130), y + rnd(-2, 2), { w: 1, rough: 1.2 });
}

// ---------------------------------------------------------------- pavilion (4:3)
function picnicTable(ink: Ink, cam: Camera) {
  const P = (x: number, y: number, z: number) => cam.project(x, y, z);
  const seg = (a: P3, b: P3, w = 2.6) => { const [p, q] = [P(...a), P(...b)]; ink.line(p[0], p[1], q[0], q[1], { w, rough: 0.6 }); };
  const slab = (x0: number, x1: number, y: number, z0: number, z1: number) =>
    ink.poly([P(x0, y, z0), P(x1, y, z0), P(x1, y, z1), P(x0, y, z1)], { fill: 'white', w: 2.4, rough: 0.6 });
  for (const lx of [-68, 68]) {
    seg([lx, 74, -26], [lx, 0, 54]);
    seg([lx, 74, 26], [lx, 0, -54]);
    seg([lx, 44, -70], [lx, 44, 70], 2.2);
  }
  slab(-92, 92, 46, -72, -48);
  slab(-92, 92, 76, -36, 36);
  for (const z of [-12, 12]) seg([-92, 76, z], [92, 76, z], 1);
  slab(-92, 92, 46, 48, 72);
}

function pavilion(): Ink {
  const ink = new Ink(51, 3, 0.9, 2.6);
  const rnd = rng(5101);
  const G = 706;

  // distant tree line behind everything
  treeLine(ink, rnd, 240, 980, () => 642, 56, 104, 62, 0.6);
  ink.curve([[-10, 646], [300, 640], [700, 644], [1210, 638]], { w: 1.6 });

  // big trees behind the roof line
  pine(ink, rnd, 196, 690, 420);
  pine(ink, rnd, 1010, 694, 360);

  // slab
  ink.poly([[250, G], [956, G], [900, 668], [306, 668]], { fill: 'white', w: 2.4, rough: 0.8 });

  // back posts
  for (const x of [330, 474, 618, 762, 880]) {
    ink.poly([[x - 4, 428], [x + 4, 428], [x + 4, 668], [x - 4, 668]], { fill: 'white', w: 1.6, rough: 0.5 });
  }

  // two picnic tables under the roof
  picnicTable(ink, camera(452, 688, 1.02, 22, -18));
  picnicTable(ink, camera(736, 692, 1.02, 22, 14));

  // roof: a long low hip
  const eaveY = 412;
  const ridgeY = 300;
  const roof: Pt[] = [[226, eaveY], [392, ridgeY], [816, ridgeY], [982, eaveY]];
  ink.poly(roof, { fill: 'white', w: 3.4, rough: 0.8 });
  ink.poly([[226, eaveY], [982, eaveY], [976, eaveY + 18], [232, eaveY + 18]], { fill: 'white', w: 2.6, rough: 0.7 });
  for (let i = 1; i < 6; i++) {
    const t = i / 6;
    const y = ridgeY + (eaveY - ridgeY) * t;
    const inset = (1 - t) * 166;
    ink.curve([[226 + inset + 8, y], [600, y + rnd(-3, 3)], [982 - inset - 8, y]], { w: 1.3, rough: 1 });
  }
  for (let x = 300; x < 940; x += rnd(24, 44)) {
    const row = Math.floor(rnd(0, 5));
    const t0 = (row + 1) / 6;
    const y0 = ridgeY + (eaveY - ridgeY) * t0;
    const inset = (1 - t0) * 166;
    if (x > 226 + inset + 12 && x < 982 - inset - 12) ink.line(x, y0 - (eaveY - ridgeY) / 6 + 2, x + rnd(-2, 2), y0 - 2, { w: 1, rough: 0.6 });
  }
  ink.line(392, ridgeY, 226, eaveY, { w: 1.4, rough: 0.6 });

  // front posts with knee braces
  for (const x of [268, 436, 604, 772, 940]) {
    ink.line(x - 30, eaveY + 20, x - 7, eaveY + 56, { w: 2.4, rough: 0.6 });
    ink.line(x + 30, eaveY + 20, x + 7, eaveY + 56, { w: 2.4, rough: 0.6 });
    ink.poly([[x - 7, eaveY + 18], [x + 7, eaveY + 18], [x + 7, G], [x - 7, G]], { fill: 'white', w: 2.6, rough: 0.6 });
    ink.line(x + 3, eaveY + 30, x + 3, G - 6, { w: 1, rough: 0.5 });
  }

  // big trees in front, framing
  hardwood(ink, rnd, 96, 736, 520);
  hardwood(ink, rnd, 1112, 742, 470);
  pine(ink, rnd, 1186, 760, 300);

  // ground
  ink.curve([[-10, 730], [200, 724], [260, 708]], { w: 2.2 });
  ink.curve([[950, 708], [1020, 738], [1210, 730]], { w: 2.2 });
  ink.curve([[470, 905], [520, 800], [560, 708]], { w: 1.8, rough: 1 });
  ink.curve([[760, 905], [700, 800], [660, 708]], { w: 1.8, rough: 1 });
  for (let i = 0; i < 26; i++) {
    const x = rnd(20, 1180);
    const y = rnd(748, 890);
    if (x > 450 && x < 780) continue;
    tuft(ink, rnd, x, y, rnd(14, 26));
  }
  cloud(ink, rnd, 520, 170, 250, 2.2);
  return ink;
}

// ---------------------------------------------------------------- fireworks (4:3)
function burst(ink: Ink, rnd: ReturnType<typeof rng>, cx: number, cy: number, R: number) {
  const rays = Math.round(15 + R / 22);
  for (let k = 0; k < rays; k++) {
    const a = (Math.PI * 2 * k) / rays + rnd(-0.09, 0.09);
    const len = R * rnd(0.8, 1.05);
    const g = R * 0.2;
    const pts: Pt[] = [];
    for (const t of [0.2, 0.45, 0.72, 1]) pts.push([cx + Math.cos(a) * len * t, cy + Math.sin(a) * len * t + g * t * t]);
    ink.curve(pts, { w: 2.6, rough: 0.7 });
    const [ex, ey] = pts[3];
    if (k % 2 === 0) ink.circle(ex, ey, R * 0.05 + 4, { fill: 'ink', w: 1, rough: 0.6 });
    else ink.circle(ex, ey, R * 0.05 + 6, { w: 1.8, rough: 0.6 });
    // short inner spark between rays
    const b = a + Math.PI / rays;
    ink.line(cx + Math.cos(b) * R * 0.34, cy + Math.sin(b) * R * 0.34, cx + Math.cos(b) * R * 0.52, cy + Math.sin(b) * R * 0.52 + 4, { w: 1.4, rough: 0.6, dash: '5 7' });
  }
  for (let k = 0; k < 9; k++) {
    const a = rnd(0, Math.PI * 2);
    const r = R * rnd(1.08, 1.25);
    ink.circle(cx + Math.cos(a) * r, cy + Math.sin(a) * r + R * 0.22, 4, { fill: 'ink', w: 1, rough: 0.4 });
  }
}

function fireworks(): Ink {
  const ink = new Ink(61, 3, 0.9, 2.4);
  const rnd = rng(6101);
  const bank = 660;
  const shots: [number, number, number][] = [[330, 250, 180], [760, 205, 235], [585, 440, 118], [1010, 395, 128]];

  // rising trails, dotted
  for (const [cx, cy, R] of shots) {
    const x0 = cx + rnd(-60, 60);
    ink.curve([[x0, bank - 40], [(x0 + cx) / 2 + rnd(-14, 14), (bank + cy) / 2], [cx, cy + R * 0.22]], { w: 2, rough: 0.6, dash: '2 12' });
  }
  for (const [cx, cy, R] of shots) burst(ink, rnd, cx, cy, R);

  // dark tree line on the far bank
  ink.poly([[-20, bank + 8], [1220, bank + 8], [1220, bank - 14], [900, bank - 20], [600, bank - 12], [300, bank - 22], [-20, bank - 12]], { fill: 'ink', w: 1.4, rough: 1.4 });
  for (let x = -6; x < 1210; x += rnd(18, 34)) {
    const h = rnd(44, 128);
    if (rnd() < 0.7) pine(ink, rnd, x, bank - 8, h);
    else ink.ellipse(x, bank - 12 - h * 0.34, h * 0.62, h * 0.7, { fill: 'ink', w: 1.2, rough: 1.6 });
  }

  // the river, with broken reflections under each burst
  ink.curve([[-20, bank + 12], [300, bank + 16], [700, bank + 10], [1220, bank + 16]], { w: 2.4 });
  for (let i = 0; i < 30; i++) {
    const t = rnd() ** 0.8;
    ripple(ink, rnd, rnd(0, 1100), bank + 34 + t * 190, 40 + t * 110, 1.2 + t);
  }
  for (const [cx, , R] of shots) {
    for (let i = 0; i < 9; i++) {
      const y = bank + 30 + i * 22 + rnd(-4, 4);
      const half = (R * 0.42 * (9 - i)) / 9 + 8;
      ink.line(cx - half * rnd(0.6, 1), y, cx + half * rnd(0.6, 1), y + rnd(-2, 2), { w: 2.2 - i * 0.12, rough: 0.9 });
    }
  }
  return ink;
}

// ---------------------------------------------------------------- keytag (1:1)
function keytag(): Ink {
  const ink = new Ink(71, 3.4, 0.9, 2.4);
  const rnd = rng(7101);
  const ring: Pt = [330, 300];
  const R = 142;
  const alpha = (48 * Math.PI) / 180; // where the tag hangs on the ring
  const beta = (58 * Math.PI) / 180; // which way the tag lies
  const hole: Pt = [ring[0] + R * Math.cos(alpha), ring[1] + R * Math.sin(alpha)];
  const ax: Pt = [Math.cos(beta), Math.sin(beta)]; // tag's long axis
  const bx: Pt = [-ax[1], ax[0]]; // across the tag
  const at = (u: number, v: number): Pt => [hole[0] + ax[0] * v + bx[0] * u, hole[1] + ax[1] * v + bx[1] * u];

  // outline of the tag in its own coordinates (u across, v along)
  const outline = (scale = 1, shift = 0): Pt[] => {
    const local: Pt[] = [];
    for (let a = 180; a <= 360; a += 20) local.push([Math.cos((a * Math.PI) / 180) * 56, Math.sin((a * Math.PI) / 180) * 56]);
    local.push([70, 44], [102, 86], [108, 150], [108, 300], [100, 350], [62, 386], [0, 394], [-62, 386], [-100, 350], [-108, 300], [-108, 150], [-102, 86], [-70, 44]);
    const cv = 190;
    return local.map(([u, v]) => at(u * scale, cv + (v - cv) * scale + shift));
  };

  // table edge and grain
  ink.line(30, 742, 870, 748, { w: 2, rough: 1.2 });
  for (let i = 0; i < 7; i++) ink.line(rnd(40, 700), 772 + i * 14, rnd(40, 700) + rnd(80, 160), 772 + i * 14 + rnd(-2, 2), { w: 1, rough: 1.2 });

  // cast shadow under the tag
  ink.poly(outline(1, 0).map(([x, y]) => [x + 22, y + 26] as Pt), { fill: 'ink', fillStyle: 'hachure', gap: 9, angle: -24, fillW: 1.1, noStroke: true, rough: 0.4 });
  ink.ellipse(ring[0] + 16, ring[1] + 22, R * 2 + 6, R * 2 + 6, { fill: 'ink', fillStyle: 'hachure', gap: 12, angle: -24, fillW: 0.9, noStroke: true });
  ink.circle(ring[0] + 16, ring[1] + 22, R * 2 - 34, { fill: 'white', noStroke: true });

  // split ring: two passes of wire
  ink.circle(ring[0], ring[1], R * 2 + 14, { fill: 'white', w: 3.4, rough: 0.6 });
  ink.circle(ring[0], ring[1], R * 2 - 16, { fill: 'white', w: 3.4, rough: 0.6 });
  ink.arc(ring[0], ring[1], R * 2 - 1, R * 2 - 1, 0.4, Math.PI * 1.55, { w: 1.4, rough: 0.5 });
  ink.line(ring[0] - R - 8, ring[1] - 16, ring[0] - R + 9, ring[1] + 4, { w: 2.6, rough: 0.4 });

  // the tag, blank
  ink.blob(outline(), { fill: 'white', w: 4, rough: 0.7 });
  ink.blob(outline(0.86), { w: 1.6, rough: 0.7 });
  // light hatching along the lower edge, for thickness
  for (let i = 0; i < 12; i++) {
    const u = -84 + i * 15;
    const [x0, y0] = at(u, 352 - Math.abs(u) * 0.12);
    const [x1, y1] = at(u + 9, 372 - Math.abs(u) * 0.16);
    ink.line(x0, y0, x1, y1, { w: 1.2, rough: 0.5 });
  }
  // a glint
  const [g0x, g0y] = at(-74, 132);
  const [g1x, g1y] = at(-74, 222);
  ink.line(g0x, g0y, g1x, g1y, { w: 1.6, rough: 0.8 });
  const [g2x, g2y] = at(-60, 142);
  const [g3x, g3y] = at(-60, 182);
  ink.line(g2x, g2y, g3x, g3y, { w: 1.2, rough: 0.8 });

  // the hole, and the ring passing through it
  ink.circle(hole[0], hole[1], 46, { fill: 'white', w: 3, rough: 0.5 });
  const a0 = alpha - 0.36;
  const a1 = alpha + 0.02;
  for (const rr of [R + 7, R - 8]) {
    const pts: Pt[] = [];
    for (let a = a0; a <= a1 + 0.001; a += (a1 - a0) / 5) pts.push([ring[0] + rr * Math.cos(a), ring[1] + rr * Math.sin(a)]);
    ink.curve(pts, { w: 3.4, rough: 0.3 });
  }
  return ink;
}

const BUILDERS: Record<Slot, () => Ink> = {
  'hero-river': heroRiver,
  'road-horizon': roadHorizon,
  chairs,
  table,
  pavilion,
  fireworks,
  keytag,
};

export function draw(slot: Slot): Drawing {
  const { w, h } = SLOTS[slot];
  return { slot, w, h, ink: BUILDERS[slot]() };
}

/** A complete SVG file: black line on white, ready to sit over a wash with mix-blend-mode: multiply. */
export function toSvgFile(drawing: Drawing, inkColor = '#1C1A17'): string {
  const { w, h, ink } = drawing;
  const parts = ink.paths.map((p) => {
    const dash = p.dash ? ` stroke-dasharray="${p.dash}"` : '';
    switch (p.c) {
      case 'fill': return `<path d="${p.d}" fill="${inkColor}"/>`;
      case 'white': return `<path d="${p.d}" fill="#fff"/>`;
      case 'wline': return `<path d="${p.d}" fill="none" stroke="#fff" stroke-width="${p.w}"${dash}/>`;
      default: return `<path d="${p.d}" fill="none" stroke="${inkColor}" stroke-width="${p.w}"${dash}/>`;
    }
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" stroke-linecap="round" stroke-linejoin="round"><rect width="${w}" height="${h}" fill="#fff"/>${parts.join('')}</svg>\n`;
}
