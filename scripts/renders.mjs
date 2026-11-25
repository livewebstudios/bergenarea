// Bring approved ink renders into the site. Run ONLY after looking at each image (handoff 5.10):
// reject any render with a person, face, figure, hand, dove-like animal, church, steeple, cross,
// religious object, lettering or signage, yoga or lotus motif, or any color or gray fill.
//
// Usage: node scripts/renders.mjs hero-river chairs     (the slots that passed inspection)
// Reads  ../docs/renders/<slot>.png
// Writes public/ink/<slot>.webp and public/ink/<slot>.png (grayscale, background pushed to
//        pure white, capped at 2400px wide) and flips the slot to "render" in src/data/ink-manifest.json.
// To go back to the coded drawing, set the slot's entry back to { "source": "coded", "file": "<slot>.svg" }.
import fs from 'node:fs';
import sharp from 'sharp';

const SLOTS = ['hero-river', 'road-horizon', 'chairs', 'table', 'pavilion', 'fireworks', 'keytag'];
const picked = process.argv.slice(2);
if (!picked.length) { console.error('Name the slots that passed inspection.'); process.exit(1); }
const manifestUrl = new URL('../src/data/ink-manifest.json', import.meta.url);
const manifest = JSON.parse(fs.readFileSync(manifestUrl, 'utf8'));

for (const slot of picked) {
  if (!SLOTS.includes(slot)) { console.error(`Unknown slot: ${slot}`); continue; }
  const src = new URL(`../../docs/renders/${slot}.png`, import.meta.url);
  if (!fs.existsSync(src)) { console.error(`Missing: docs/renders/${slot}.png`); continue; }
  const before = fs.statSync(src).size;
  const base = sharp(fs.readFileSync(src))
    .rotate()
    .flatten({ background: '#ffffff' })
    .grayscale()
    .resize({ width: 2400, withoutEnlargement: true })
    .linear(1.25, -22) // levels: push paper to pure white, keep the line black
    .normalise({ lower: 2, upper: 92 });
  await base.clone().webp({ quality: 82 }).toFile(new URL(`../public/ink/${slot}.webp`, import.meta.url).pathname);
  await base.clone().png({ compressionLevel: 9, palette: true }).toFile(new URL(`../public/ink/${slot}.png`, import.meta.url).pathname);
  manifest[slot] = { source: 'render', file: `${slot}.webp` };
  const after = fs.statSync(new URL(`../public/ink/${slot}.webp`, import.meta.url)).size;
  console.log(`${slot}: ${(before / 1024).toFixed(0)} KB -> ${(after / 1024).toFixed(0)} KB webp`);
}
fs.writeFileSync(manifestUrl, JSON.stringify(manifest, null, 2) + '\n');
