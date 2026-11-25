// Deck diff: the rendered text of each demo must equal the copy deck, character for character.
// Reads dist/ (run `npm run build` first). Exits non-zero on any drift.
// Run: npm run deck
import fs from 'node:fs';
import { parse } from 'node-html-parser';
import { deck, aboutFirstText, eventsParagraphText } from '../src/content/deck.ts';

const DEMOS = ['open-road', 'tonights-board', 'twenty-towns'];
const year = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric' }).format(new Date()));

/** key -> exact expected text, or a function that checks a live sentence frame */
const EXPECT = {
  helpline: deck.site.helpline.full,
  'header-button': deck.site.headerButton,
  kicker: deck.hero.kicker,
  h1: deck.hero.h1,
  'hero-button': deck.hero.button,
  'meetings-heading': deck.meetings.heading,
  towns: (text) => {
    const m = /^Serving the communities of (.+)\.$/.exec(text);
    if (!m) return 'sentence frame broken';
    const names = m[1].split(', ');
    if (deck.meetings.townsSentence(names) !== text) return 'separator drift';
    if ([...names].sort((a, b) => a.localeCompare(b)).join('|') !== names.join('|')) return 'towns not A to Z';
    return names.length >= 1 ? null : 'no towns';
  },
  'meetings-second': deck.meetings.second,
  'meetings-button': deck.meetings.button,
  app: deck.meetings.app,
  count: (text) => {
    const m = /^There are (\d+) groups that make up (\d+) meetings in Bergen Area\.$/.exec(text);
    if (!m) return 'sentence frame broken';
    return deck.meetings.countSentence(Number(m[1]), Number(m[2])) === text ? null : 'frame drift';
  },
  'events-heading': deck.events.heading,
  'events-paragraph': eventsParagraphText,
  'events-button': deck.events.button,
  'area-heading': deck.areaService.heading,
  'area-p1': deck.areaService.paragraphs[0],
  'area-p2': deck.areaService.paragraphs[1],
  'area-button': deck.areaService.button,
  'about-p1': aboutFirstText,
  'about-p2': deck.about.rest[0],
  'about-p3': deck.about.rest[1],
  'about-p4': deck.about.rest[2],
  'about-p5': deck.about.rest[3],
  'links-heading': deck.otherLinks.heading,
  'link-1': deck.otherLinks.links[0].label,
  'link-2': deck.otherLinks.links[1].label,
  'link-3': deck.otherLinks.links[2].label,
  'link-4': deck.otherLinks.links[3].label,
  copyright: deck.site.copyright(year),
};

let failures = 0;
const fail = (demo, msg) => { failures++; console.error(`FAIL ${demo}: ${msg}`); };
const firstDiff = (a, b) => { let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; return i; };

for (const demo of DEMOS) {
  const file = `dist/demo/${demo}/index.html`;
  if (!fs.existsSync(file)) { fail(demo, `${file} is missing. Run npm run build.`); continue; }
  const root = parse(fs.readFileSync(file, 'utf8'));
  let checked = 0;
  for (const [key, want] of Object.entries(EXPECT)) {
    const nodes = root.querySelectorAll(`[data-deck="${key}"]`);
    if (nodes.length !== 1) { fail(demo, `"${key}" appears ${nodes.length} times, expected 1`); continue; }
    const got = nodes[0].text;
    if (typeof want === 'function') {
      const problem = want(got);
      if (problem) fail(demo, `"${key}": ${problem}: ${JSON.stringify(got)}`);
    } else if (got !== want) {
      const at = firstDiff(got, want);
      fail(demo, `"${key}" drifts at character ${at}\n   want: ${JSON.stringify(want.slice(Math.max(0, at - 20), at + 30))}\n   got:  ${JSON.stringify(got.slice(Math.max(0, at - 20), at + 30))}`);
    }
    checked++;
  }

  // the bold phrase stays bold
  const bold = deck.about.first.find((p) => p.bold).text;
  if (root.querySelector('[data-deck="about-p1"] strong')?.text !== bold) fail(demo, 'the bold phrase in the About block is not bold or has drifted');

  // links: the href is the truth
  const hrefs = new Set(root.querySelectorAll('a').map((a) => a.getAttribute('href')));
  const need = [
    deck.site.helpline.first.href, deck.site.helpline.second.href,
    ...deck.events.paragraph.filter((p) => p.href).map((p) => p.href),
    ...deck.otherLinks.links.map((l) => l.href),
    ...deck.meetings.badges.map((b) => b.href),
    `mailto:${deck.site.email}`,
  ];
  for (const h of need) if (!hrefs.has(h)) fail(demo, `missing link: ${h}`);
  for (const link of deck.otherLinks.links) {
    const a = root.querySelectorAll('a').find((x) => x.text.trim() === link.label && x.getAttribute('href') === link.href);
    if (!a) fail(demo, `Other Links: "${link.label}" does not point at ${link.href}`);
  }

  // nav labels, in order, and one H1
  const navText = root.querySelectorAll('header nav > ul > li').map((li) => (li.querySelector(':scope > a, :scope > button') ?? li.firstChild).text.trim());
  const wantNav = deck.site.nav.map((n) => n.label);
  if (navText.join('|') !== wantNav.join('|')) fail(demo, `nav labels drift: ${navText.join(', ')}`);
  const subs = root.querySelectorAll('header nav ul ul a').map((a) => a.text.trim());
  const wantSubs = deck.site.nav.flatMap((n) => n.children ?? []);
  if (subs.join('|') !== wantSubs.join('|')) fail(demo, `sub-menu labels drift: ${subs.join(', ')}`);
  const footNav = root.querySelectorAll('footer nav a').map((a) => a.text.trim());
  if (footNav.join('|') !== deck.site.footerNav.join('|')) fail(demo, `footer nav drift: ${footNav.join(', ')}`);
  const h1 = root.querySelectorAll('h1');
  if (h1.length !== 1) fail(demo, `${h1.length} H1 elements`);
  if (root.querySelector('title')?.text !== deck.site.browserTitle) fail(demo, 'browser title drift');

  console.log(`${demo.padEnd(16)} ${checked} deck entries checked, nav and links checked`);
}
console.log(failures ? `\n${failures} failure(s).` : '\nDeck diff clean: rendered copy equals the content pack in all three demos.');
process.exit(failures ? 1 : 0);
