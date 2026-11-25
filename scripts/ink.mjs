// Writes the coded fallback drawings to public/ink/<slot>.svg.
// Run after changing anything in src/lib/ink/: npm run ink
import fs from 'node:fs';
import { draw, toSvgFile } from '../src/lib/ink/scenes.ts';
import { SLOT_NAMES } from '../src/lib/ink/slots.ts';

const css = fs.readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
const ink = /--ink:\s*(#[0-9a-fA-F]{6})/.exec(css)?.[1] ?? '#1C1A17';
const only = process.argv.slice(2);
fs.mkdirSync(new URL('../public/ink/', import.meta.url), { recursive: true });
for (const slot of SLOT_NAMES) {
  if (only.length && !only.includes(slot)) continue;
  const svg = toSvgFile(draw(slot), ink);
  fs.writeFileSync(new URL(`../public/ink/${slot}.svg`, import.meta.url), svg);
  console.log(`${slot.padEnd(14)} ${(svg.length / 1024).toFixed(1)} KB`);
}
