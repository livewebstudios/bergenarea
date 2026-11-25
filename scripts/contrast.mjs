// Reads src/styles/tokens.css, recomputes every text/background pair the design relies on
// and exits non-zero if any pair is under 4.5:1 (WCAG AA for body text).
// Run: npm run contrast
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
const tokens = {};
for (const m of css.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\b/g)) tokens[m[1]] = m[2];

const lin = (c) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
};
const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };

// [text, [grounds...], use]
const PASS = [
  ['ink', ['paper', 'sand', 'white'], 'body'],
  ['ink', ['tan', 'mint', 'sage', 'sky', 'mist', 'butter', 'peach'], 'any text on a pastel'],
  ['ink', ['pill'], 'button text'],
  ['muted', ['paper', 'sand', 'white', 'mint', 'sky', 'sage', 'tan', 'mist', 'butter'], 'secondary text'],
  ['teal', ['paper', 'white', 'mint', 'sky', 'sand', 'tan', 'mist'], 'links'],
  ['lake', ['paper', 'mist', 'sky', 'white'], 'links, labels'],
  ['forest', ['paper', 'sage'], 'labels'],
  ['rust', ['paper', 'white', 'butter', 'sand'], 'accent text'],
  ['paper', ['lake', 'teal', 'forest', 'ink'], 'text on deep bands'],
  ['white', ['rust', 'teal', 'lake'], 'button text'],
  ['butter', ['lake'], 'butter pill label ground check (ink on butter is the text pair)'],
];
// Pairs the design must never use. Listed so a token change that "fixes" one gets noticed.
const NEVER = [
  ['white', 'pill'], ['teal', 'pill'], ['rust', 'peach'], ['white', 'dusk'], ['ink', 'dusk'],
];

let failed = 0;
let rows = 0;
console.log('Pair                      Ratio   Use');
for (const [text, grounds, use] of PASS) {
  for (const ground of grounds) {
    if (!tokens[text] || !tokens[ground]) { console.error(`Missing token: ${text} or ${ground}`); failed++; continue; }
    const r = ratio(tokens[text], tokens[ground]);
    const ok = r >= 4.5;
    if (!ok) failed++;
    rows++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${(text + ' on ' + ground).padEnd(20)} ${r.toFixed(2).padStart(6)}   ${use}`);
  }
}
console.log('\nNever-use pairs (expected to be under 4.5, or at the edge):');
for (const [text, ground] of NEVER) {
  console.log(`     ${(text + ' on ' + ground).padEnd(20)} ${ratio(tokens[text], tokens[ground]).toFixed(2).padStart(6)}`);
}
const banned = Object.keys(tokens).filter((k) => /pink|rose|mauve|lavender|blush/.test(k));
if (banned.length) { console.error(`\nBanned color token(s): ${banned.join(', ')}`); failed++; }
console.log(`\n${rows} pairs checked, ${failed} failed.`);
process.exit(failed ? 1 : 0);
