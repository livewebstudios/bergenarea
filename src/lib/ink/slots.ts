// The seven illustration slots (handoff 5.10). No roughjs here, so the browser can import it cheaply.
export const SLOTS = {
  'hero-river': { w: 2100, h: 900, shape: '21x9', pin: [470, 818, 1] },
  'road-horizon': { w: 2100, h: 900, shape: '21x9', pin: [1050, 600, 0.62] },
  chairs: { w: 1200, h: 900, shape: '4x3', pin: [935, 792, 0.8] },
  table: { w: 1200, h: 900, shape: '4x3', pin: [1010, 800, 0.8] },
  pavilion: { w: 1200, h: 900, shape: '4x3', pin: [610, 852, 0.8] },
  fireworks: { w: 1200, h: 900, shape: '4x3', pin: [1085, 652, 0.6] },
  keytag: { w: 900, h: 900, shape: '1x1', pin: [712, 700, 0.75] },
} as const satisfies Record<string, { w: number; h: number; shape: '21x9' | '4x3' | '1x1'; pin: readonly [number, number, number] }>;

export type Slot = keyof typeof SLOTS;
export const SLOT_NAMES = Object.keys(SLOTS) as Slot[];
