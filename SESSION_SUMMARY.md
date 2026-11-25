# SESSION_SUMMARY.md

Bergen Area NA: three home page demos. Unattended session, Nov 24, 2026. All six tasks done in order.

- Repo: https://github.com/livewebstudios/bergenarea (public, branch `main`, pushed)
- Local: `~/Desktop/local_files/website-clients/bergenarea/build`
- Netlify: nothing created or connected. Connect the repo with build command `npm run build`, publish `dist`.
- Every route is `noindex, nofollow`, `robots.txt` disallows everything, no sitemap.

To look at it locally:

```bash
npm run build && npm run preview
```

## 1. What was built

| Route | What it is |
|---|---|
| `/` | Chooser. Logo, "Same words, same meetings, three designs. Pick one.", three cards with real screenshots and `OPEN DESIGN 1/2/3`. Neutral styling, no web fonts, no popup. |
| `/demo/open-road/` | Demo 1. Warm paper and sand, Instrument Serif, a full-width pen-and-ink river valley, today's list in one white card, three tinted event cards, mint pill buttons. Signature move: a hand-dotted path that starts at the pin in the hero and draws itself down the page to the road in the closing picture. |
| `/demo/tonights-board/` | Demo 2. White page, outlined tiles with hard offset shadows on sage and mint blobs, Bricolage Grotesque and Plex Mono. Signature move: the Next Meeting tile counts down, changes to `Happening now`, and turns over once when the next meeting becomes the answer. |
| `/demo/twenty-towns/` | Demo 3. Cool sky, layered hills and a butter sun, Fraunces, a hand-drawn county map computed from the meeting data with a panel beside it. Signature move: the map inks itself in, pins drop on today's towns, choosing a town draws a dotted ring. |

Shared by all three: the same copy deck (`src/content/deck.ts`), the same live meeting data (`src/lib/bmlt.ts`), New York time math (`src/lib/time.ts`), event and notice logic (`src/lib/upcoming.ts`), the Scene system (wash + ink + pin), the icon set, the dialog, the notice core, the video poster, the helpline bar. Nothing in `components/demo1`, `demo2` or `demo3` is shared between demos.

Every demo has: helpline bar with two working `tel:` links, sticky ALL CAPS nav, the finder (day tabs, In person / Virtual, town picker, list, meeting details with Directions, Join on Zoom and Call in), the three event areas, the notice popup in its own skin, a click-to-play video behind a drawn poster, Other Links, a closing road picture and a footer with the badge at 150px.

## 2. Git log

Real output of `git log --oneline -8`, taken after the task 6 commit (this summary file is committed after it):

```
1f5833d Task 6: QA passes, acceptance tests, screenshots, typos [skip netlify]
8e5324e Task 5: Demo 3 Twenty Towns [skip netlify]
b95de38 Task 4: Demo 2 Tonight's Board [skip netlify]
c6c6e03 Task 3: Demo 1 Open Road [skip netlify]
fa21688 Task 2: assets, tokens, ink scenes, shared kit, data layer, tests [skip netlify]
306c56a Task 1: pre-flight, routes, chooser shell, demo switcher [skip netlify]
```

Six commits, one per task. Every message ends with `[skip netlify]`.

## 3. Lighthouse and bundle numbers

Lighthouse mobile, run against the built site served locally with gzip (`npm run lighthouse`):

| Demo | Performance | Accessibility | Best Practices | LCP | CLS | TBT |
|---|---|---|---|---|---|---|
| 1 Open Road | 99 | 100 | 100 | 2.3 s | 0.007 | 0 ms |
| 2 Tonight's Board | 100 | 100 | 100 | 1.1 s | 0.025 | 0 ms |
| 3 Twenty Towns | 100 | 100 | 100 | 1.1 s | 0 | 0 ms |

Lighthouse SEO reads 69 on all three. That is the `noindex` gate being reported, as intended.

JavaScript shipped per demo, gzipped (budget 120 KB):

| Demo | JavaScript | HTML |
|---|---|---|
| 1 Open Road | 91.2 KB in 13 files | 17.6 KB |
| 2 Tonight's Board | 81.3 KB in 11 files | 16.5 KB |
| 3 Twenty Towns | 93.9 KB in 13 files | 26.9 KB |

Whole `dist/` folder: 2.8 MB.

## 4. Pre-flight meeting database checks

Command 1 (meetings, first 600 bytes):
```
[{"id_bigint":"2276","worldid_mixed":"G00387574","shared_group_id_bigint":"","service_body_bigint":"3","weekday_tinyint":"1","venue_type":"1","start_time":"09:30:00","duration_time":"01:00:00","time_zone":"","formats":"O","lang_enum":"en","longitude":"-74.0326823","latitude":"40.8700354","distance_in_km":"","distance_in_miles":"","email_contact":"","published":"1","root_server_uri":"https://bmlt.nanj.org/main_server","format_shared_id_list":"17","meeting_name":"Serenity in the Park","location_text":"Sahara Club","location_info":"Use the door up the ramp","location_street":"24 River Road","loca
```

Command 2 (formats, first 600 bytes):
```
[{"key_string":"M","name_string":"Men","description_string":"This meeting is meant to be attended by men only.","lang":"en","id":"15","world_id":"M","format_type_enum":"FC3","root_server_uri":"https://bmlt.nanj.org/main_server"},{"key_string":"St","name_string":"Step","description_string":"This meeting is focused on discussion of the Twelve Steps of NA.","lang":"en","id":"27","world_id":"STEP","format_type_enum":"FC1","root_server_uri":"https://bmlt.nanj.org/main_server"},{"key_string":"O","name_string":"Open (anyone welcome)","description_string":"This meeting is open to addicts and non-addic
```

Command 3 (CORS):
```
access-control-allow-origin: *
```

Counts on build day: 44 meetings, 33 groups, 20 towns, 39 formats (26 in person, 18 virtual, no hybrid). They match the old site and the content pack.

**Browser refresh path: direct.** BMLT sends `access-control-allow-origin: *`, so the island calls `bmlt.nanj.org` itself. No Netlify Function and no `/api/meetings` proxy were built.

## 5. Scenes: renders or fallbacks

`docs/renders/` held only its README, so **all seven slots use the coded fallback drawings**:

| Slot | Source | Used in |
|---|---|---|
| `hero-river` | coded | Demo 1 hero and video poster. Demo 3 About. Open Graph image. |
| `road-horizon` | coded | Closing picture in all three. |
| `chairs` | coded | Demo 1 finder corner. Demo 2 Next Meeting tile. |
| `table` | coded | Upcoming meetings in all three. Demo 3 video poster. |
| `pavilion` | coded | Activities in all three. Demo 2 video poster. |
| `fireworks` | coded | Convention in all three. Notice popup header. |
| `keytag` | coded | Demo 1 and demo 2 About. |

The drawings are written to `public/ink/<slot>.svg` by `npm run ink` and sit over the wash with `mix-blend-mode: multiply`, exactly as a render would. When renders arrive, look at each one, then run `node scripts/renders.mjs <slot> ...` for the ones that pass. `src/data/ink-manifest.json` records the source per slot.

Flyer: the New Year New Life 33 flyer was downloaded, inspected and **rejected** (it shows an armored figure on horseback). It is not in the repo.

## 6. Acceptance checklist (handoff section 9), with evidence

One command reruns everything except Lighthouse: `npm run qa`.

**Function**
- [x] All three list live meetings, counts match the API on build day. Build log: `[bmlt] live data: 44 meetings, 33 groups, 20 towns`. API at the same moment: 44 meetings, 33 groups.
- [x] Today and "next" are right in New York time with the machine on UTC and on Los Angeles. Unit tests (44 passing, including 11:59 PM, 12:01 AM, both clock changes) plus browser tests in all three demos under both zones.
- [x] Day tabs, venue toggle, town picker and meeting details work by mouse, touch and keyboard in all three. `npm run functional`: 162 checks passed, 0 failed.
- [x] Zoom links, dial-in numbers and Directions links work. Virtual meetings show no Directions button.
- [x] Both helpline numbers dial (`tel:+18009920401`, `tel:+17329330462`).
- [x] Next Area Service date is computed: `Tue, Dec 15, 7:30 PM - 10:00 PM`.
- [x] Popup: shows once after about 800ms, remembers, replays from the switcher, respects its dates, closes three ways, traps and returns focus, locks the page behind.
- [x] Empty states: all three event files emptied, each demo screenshotted, seeds restored (`git status` clean in `content/`).
- [x] JavaScript off: the build day's list is readable in all three, named by its day, with no live claims.
- [x] Build succeeds with the network off: `npm run build:offline` exits 0 and prints the `MEETING DATABASE UNREACHABLE` warning. This test found and fixed a real bug (see Q4).
- [x] Every scene renders with `docs/renders/` empty.

**Rules**
- [x] Zero people, faces or hands. Every file in `public/` and every inline drawing was rasterized and looked at.
- [x] Zero religious imagery and zero banned motifs. Word scan of interface strings and alt text: zero hits (the only matches are a venue name from the content pack and the rule text in a script comment).
- [x] No pink, rose, mauve or lavender in `tokens.css`. Peach appears only in scene washes. `--dusk` is never under text.
- [x] Nothing from `docs/inspiration/` is used as an asset.
- [x] Deck diff passes: `npm run deck` clean in all three, and `deck.ts` matches the content pack on 51 strings and 8 links.
- [x] No em dash anywhere in the repo. Kill-list phrases: none outside `deck.ts`.
- [x] No emoji anywhere.
- [x] Logo file is byte-identical to `docs/logo/logo.png`, always an `<img>`, never wider than 312px, only on paper, sand or white (a paper plate on demo 3's lake footer).

**Quality**
- [x] `npm run contrast` passes (45 pairs). `npm test` passes (44 tests). Live contrast: every text pairing on all four pages at 1440 and 390 is at or above 4.5:1 (lowest 5.11).
- [x] One H1 per page, no skipped heading levels, every image has alt text and width and height.
- [x] No horizontal scroll at 320, 360, 375, 390, 768, 1024, 1440, 1920.
- [x] Lighthouse mobile: Accessibility 100, Best Practices 100, Performance 99 / 100 / 100.
- [x] Island JavaScript under 120 KB gzipped: 91.2 / 81.3 / 93.9 KB.
- [x] `noindex` on all four routes, `robots.txt` disallows all.
- [x] No request to Google Fonts, YouTube or any third party before a user action, except the meeting API. YouTube loads only after the poster is clicked, from `youtube-nocookie.com`.

Also verified: the build works in a subfolder (`BASE_PATH=/preview/ npm run build`, all 88 internal URLs honor the base).

Screenshots of each demo and the chooser at 390 and 1440 are in `screenshots/` (gitignored). The three chooser card pictures are `public/img/chooser-1.png` to `chooser-3.png` (1200 x 750).

## 7. Not done, and things to know before the preview goes out

- **UI/UX Pro Max was not run.** The handoff lists the four Impeccable passes, which were run in order. The LWS QA spec wants Pro Max before a client sees anything. Run it before sharing the link.
- **The polish pass did not rewrite copy.** The deck is verbatim by the handoff's rule.
- **Some map labels sit a short way from their dots** in the crowded southeast corner of demo 3 (Englewood, Teaneck, Bogota). No labels overlap. Each name is tappable.
- **On phones, demo 3's list is below the map** (one scroll), as its mobile spec asks. Demo 2 is the one that answers above the fold.
- **The two `SAMPLE` cards** get fresh dates on every build so they do not expire during review.
- **Lighthouse was run locally**, not against Netlify. Real numbers on the preview may differ a little.

## 8. Every logged judgment call

Full reasoning for each is in `OPEN_QUESTIONS.md` under the same ID.

Pre-flight
- P1 Folder was clean, `build/` created fresh.
- P2 Database checks pasted, direct path taken.
- P3 Astro 7.4.13 was current stable.
- P4 No token changed after comparing the screenshots.
- P5 Logo and badge copied byte for byte. The badge is a JPEG with a `.png` name.
- P6 No renders supplied.
- P7 A `netlify.toml` is in the repo (build settings and a noindex header only). No site was created.
- P8 Paths go through one `BASE_URL` helper, as the handoff asks, instead of pure relative paths.
- P9 Logo lives at `public/img/logo.png`, not `images/logoRGB.png`.
- P10 Canonical tags point at `bergenarea.org` with a confirm-before-launch comment.
- P11 `Find a Meeting` jumps to the finder on the page. Other nav links are `#` stubs.

Assets and kit
- K1 Flyer rejected (figure on horseback).
- K2 App badges downloaded, inspected, used unedited.
- K3 All seven scenes are coded drawings.
- K4 Firework sparks changed from plus signs to rings (a plus is a cross at small size).
- K5 Leaf marks changed to small loops (arches can read as birds in flight).
- K6 No wheelchair pictogram (it is a person). Text label only.
- K7 Venue toggle: neither pressed shows everything, pressing one filters.
- K8 One label outside the approved list: `No meetings`.
- K9 Sample items with a blank start are dated at build time.
- K10 Contact fields are stripped before anything is stored.
- K11 County outline from the US Census TIGERweb service. Used.
- K12 Several meetings can share a start time. Lists flag all of them.
- K13 Meta description is a verbatim deck sentence.
- K14 Meetings running past midnight still count as "now".

Demo 1
- O1 The finder heading is the day word (`Today`, `Tomorrow`, day name).
- O2 Day tabs run Sunday to Saturday, today circled.
- O3 The dotted path runs in the side gutters behind content. Below about 1270px it is a straight line down the left edge.
- O4 Only the right corner arc shows on wide screens.
- O5 About card is white on a sand mat.
- O6 Video poster uses `hero-river`.
- O7 Which links are stubs.
- O8 Small non-body labels (skip link, landmark name, badge alt, "Built by").
- O9 Dialogs render at the end of `<body>` and focus the dialog itself.

Demo 2
- T1 What "the answer" on the tile is, and when it flips.
- T2 Day tabs start from today.
- T3 With JavaScript off the tile is hidden and nothing claims "Today".
- T4 The notice does not slide. Motion budget won over the skin note.
- T5 Events heading sits above the tiles, paragraph after.
- T6 `FIND A MEETING` is a quiet link in the header band, hidden on phones.
- T7 The ink shadow on ink buttons reads as a heavier edge.
- T8 Helpline and nav stick together on phones.
- T9 Which picture goes where.

Demo 3
- M1 Map positions are computed from meeting coordinates.
- M2 Label collision pass, sixteen spots, four rounds.
- M3 Outline and Hudson line.
- M4 The map is the town picker. A chosen town shows its whole week.
- M5 Labels show at 544px map width and up. Chips show below that.
- M6 The Virtual box is the same control as the Virtual button.
- M7 The ink-in animation is plain CSS and needs no JavaScript.
- M8 The `AREA SERVICE` heading on the lake band is paper, not ink (contrast).
- M9 Dusk sits only under ink and opaque cards.
- M10 Which picture goes where.
- M11 Count sentence sits in the MEETINGS block in this demo.

QA
- Q1 Polish did not rewrite the deck.
- Q2 No `window.LWS.observe`, no extra entrance animations.
- Q3 React islands, as the handoff sets.
- Q4 Offline fallback bug found and fixed.
- Q5 Demo 1's phone drawer leaves a backdrop strip.
- Q6 Demo 3's small map uses chips as the control, tap picks the nearest dot.
- Q7 Metric-matched fallback fonts removed the layout shift.
- Q8 Demo 1's controls got a hairline.
- Q9 Smallest text raised from 11px to 12px.
- Q10 Lighthouse SEO 69 is the noindex gate.
- Q11 UI/UX Pro Max not run.
- Q12 Open Graph image is a capture of demo 1's hero.
- Q13 The handoff's open items for Jon, with where each stands.

## 9. Demo scaffolding to strip at promote

Everything marked `DEMO SCAFFOLDING` in the code, plus:

1. **Chooser:** `src/pages/index.astro`, `src/styles/chooser.css`, `public/img/chooser-1.png` to `chooser-3.png`, `scripts/chooser-shots.mjs` and the `chooser` npm script.
2. **Switcher:** `src/components/shared/DemoSwitcher.astro`, its `<DemoSwitcher />` line and the `has-switcher` body class in each demo page, and the `.demo-switcher` and `.has-switcher` rules in `src/styles/base.css`.
3. **Notice replay:** the `ba:notice-replay` listener in `src/components/shared/NoticeCore.tsx`.
4. **The two unpicked demos:** their page folder under `src/pages/demo/`, their `src/components/demoN/` folder, their `src/styles/demoN.css`, and their Fontsource packages in `package.json`. If demo 2 is not picked, also the `html:has(.d2)` rule in `base.css`.
5. **Routes:** the winning demo moves from `/demo/<name>/` to `/`. `routes` in `src/lib/href.ts` goes away. `#meetings` anchors and every `STUB` link become real pages.
6. **Samples:** the two `"sample": true` seed items in `content/meetings-area.json` and `content/events-activities.json`. `resolveSamples()` and the `SAMPLE` tag can stay for Decap previews or go.
7. **Review gate (at launch, not at promote):** the `noindex` meta in `src/layouts/Base.astro`, `public/robots.txt`, the `X-Robots-Tag` header in `netlify.toml`, and `[skip netlify]` in commit messages.
8. **Dev helpers, optional:** `scripts/shoot-ink.mjs`, `shoot-el.mjs`, `probe.mjs`, `cls.mjs`, `font-metrics.mjs`. The test scripts (`functional-test`, `motion-test`, `layout-audit`, `contrast-live`, `deck-diff`, `lighthouse`) are worth keeping, with the two dropped demos removed from their lists.
9. **Open Graph image:** replace `public/img/og.png` if demo 1 is not the pick.
