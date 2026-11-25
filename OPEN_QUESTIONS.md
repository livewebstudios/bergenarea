# OPEN_QUESTIONS.md

Every judgment call made during the unattended home-demos session (Nov 24, 2026), in the order it came up.
Format: what the handoff said or left open, what was done, and what Jon can flip.

## Pre-flight (task 1)

### P1. Folder check
The project folder held the handoff, the content pack, the full-site spec and `docs/`. No `build/` folder existed. Created it fresh, `git init` on branch `main`.

### P2. Meeting database checks (real output)

Command 1 (meetings, first 600 bytes):
```
[{"id_bigint":"2276","worldid_mixed":"G00387574","shared_group_id_bigint":"","service_body_bigint":"3","weekday_tinyint":"1","venue_type":"1","start_time":"09:30:00","duration_time":"01:00:00","time_zone":"","formats":"O","lang_enum":"en","longitude":"-74.0326823","latitude":"40.8700354","distance_in_km":"","distance_in_miles":"","email_contact":"","published":"1","root_server_uri":"https://bmlt.nanj.org/main_server","format_shared_id_list":"17","meeting_name":"Serenity in the Park","location_text":"Sahara Club","location_info":"Use the door up the ramp","location_street":"24 River Road","loca
```

Command 2 (formats, first 600 bytes):
```
[{"key_string":"M","name_string":"Men","description_string":"This meeting is meant to be attended by men only.","lang":"en","id":"15","world_id":"M","format_type_enum":"FC3","root_server_uri":"https://bmlt.nanj.org/main_server"},{"key_string":"St","name_string":"Step","description_string":"This meeting is focused on discussion of the Twelve Steps of NA.","lang":"en","id":"27","world_id":"STEP","format_type_enum":"FC1","root_server_uri":"https://bmlt.nanj.org/main_server"},{"key_string":"O","name_string":"Open (anyone welcome)","description_string":"This meeting is open to addicts and non-addic
```

Command 3 (CORS header):
```
access-control-allow-origin: *
```

**Path taken: direct.** The API sends `access-control-allow-origin: *`, so the browser refresh calls BMLT directly. No Netlify Function, no `/api/meetings` proxy.

### P3. Astro version
"Current stable" on the build day was Astro 7.4.13 with `@astrojs/react` 7.1.9, React 19.3, TypeScript 7.0. `trailingSlash: 'always'` and `build.format: 'directory'` are set as asked.

### P4. Inspiration screenshots vs section 3
Opened all four. They match the table in section 3. No token was changed from section 5.3, so there was nothing to re-measure beyond the standard contrast run.

### P5. Logo and badge
`docs/logo/logo.png` copied byte for byte to `public/img/logo.png` (verified with `cmp`). `docs/verifiedsecured.png` copied the same way. Note: that file is a JPEG with a `.png` name, 150 x 37. It was not converted or renamed. It renders at 150px wide, height auto.

### P6. `docs/renders/`
Only `README.txt`. No renders. Every scene uses its coded fallback.

### P7. `netlify.toml`
The handoff says not to create or configure a Netlify site. A `netlify.toml` is in the repo anyway, holding only the build command and publish folder the handoff names (`npm run build`, `dist`), the Node version, and an `X-Robots-Tag: noindex, nofollow` header as a second lock on the review gate. No site was created, linked or deployed. Delete the file if you would rather set these in the dashboard.

### P8. Path rule vs Astro
The global LWS rule is relative paths only. The handoff's rule for this stack is one helper that respects `import.meta.env.BASE_URL`, and that is what was built (`src/lib/href.ts`). Astro writes its own bundle URLs as base-prefixed paths (`/_astro/...`), not relative ones. To run in a subfolder, build with `BASE_PATH=/subfolder/ npm run build`. No component hardcodes a `/` path. The canonical tag is the one absolute URL.

### P9. Logo filename
The global rule names `images/logoRGB.png`. The handoff names `docs/logo/logo.png` into `build/public/img/`. Followed the handoff: `public/img/logo.png`, always an `<img>`, in one component (`Logo.astro` and the same markup in each demo's footer).

### P10. Canonical and Open Graph on preview routes
Canonical tags point at `https://bergenarea.org/...` (set by `SITE_URL`, default in `astro.config.mjs`) with a comment to confirm before go-live. All four routes are `noindex, nofollow`, so nothing is indexed either way.

### P11. Find a Meeting and nav targets
The Meetings page is Phase 2. `Find a Meeting` and `FIND A MEETING` jump to the meeting finder on the same page (`#meetings`). Every other nav and footer link is a `#` stub, as the handoff asks.

## Assets and shared kit (task 2)

### K1. New Year New Life flyer: REJECTED
Downloaded `NYNL33-791x1024.jpg` to a scratch folder and looked at it. It shows an armored figure on a horse holding a pen like a lance, with a gloved hand visible. That is a person and a hand, so it fails hard rule 1. It is not in the repo. The Convention card and the notice popup use the `fireworks` drawing instead.
Side note for Jon: the flyer carries facts the JSON does not have (Hanover Marriott, 1401 State Route 10, Whippany, NJ 07981, registration prices). `content/events-convention.json` keeps `location_name` and `address` blank exactly as the handoff seed shows. Add them if you want them on the card.

### K2. App store badges
`androidstore.png` (129 x 45) and `appstore.png` (135 x 40) downloaded from the old site, inspected (wordmarks only, no people), copied unedited to `public/img/`. Nothing else was downloaded as a picture.

### K3. Renders
`docs/renders/` is empty, so all seven slots use coded drawings. They are written by `npm run ink` to `public/ink/<slot>.svg` (black line on white) and placed over the wash with `mix-blend-mode: multiply`, the same pipeline a real render uses. `src/data/ink-manifest.json` records the source per slot. When renders arrive: look at each one, then `node scripts/renders.mjs <slot> ...` for the ones that pass.
Every coded drawing was rasterized and inspected by eye: no people, figures, hands, animals, steeples, crosses or lettering.

### K4. Firework sparks changed from plus signs to rings
The first pass of the `fireworks` drawing ended alternate rays in small "+" marks. A plus sign is a cross at thumbnail size, so they were replaced with open rings and dots.

### K5. Leaf marks inside tree canopies
The first pass used a small double arch for leaf texture. A double arch is also how people doodle a bird in flight, which is a banned motif, so the mark is now a single cupped stroke.

### K6. Wheelchair mark
The standard wheelchair symbol is a stylized person, which hard rule 1 forbids. Wheelchair meetings show the text label `Wheelchair accessible` and no pictogram.

### K7. Venue toggle behavior
The handoff asks for an In person / Virtual toggle and gives no word for "both". Built as two real buttons with `aria-pressed`: neither pressed shows everything (the default, so a visitor sees every meeting today), pressing one filters to it, pressing it again clears it. Hybrid meetings match both.

### K8. One label outside the approved list
An empty meeting list (for example Virtual plus a town with no virtual meeting) needs words. Used `No meetings`. The screen reader announcement reads like `Today, All towns: 5 meetings`. Both are plain and can be changed in `src/content/deck.ts` (`ui`).

### K9. Sample dates
The handoff's own seed shows the JAC sample with a blank `start`. Sample items with a blank start get their date at build time (JAC: build day + 10, Activities: build day + 14), so the `SAMPLE` cards do not expire while the Area reviews. Real items always carry a typed date.

### K10. Snapshot privacy
The BMLT response includes contact name, phone and email fields (blank for this area today). `pickRaw()` drops everything except the 21 fields the site uses before anything is stored, so `src/data/meetings-snapshot.json` can never carry a contact field. A test enforces it.

### K11. County outline: found, used
Bergen County's outline came from the US Census Bureau TIGERweb service (State_County layer, GEOID 34003), simplified by the service to 63 points. Stored in `src/data/bergen-outline.json` with its source line. Demo 3 draws it as a dotted line. Nothing was invented.

### K12. Next meeting when several share a start time
Several meetings often start together (three at 8:00pm on a Tuesday). List views mark all of them `Next meeting`. Demo 2's single tile shows the first by sort order: in person before virtual, then by name.

### K13. Meta description
No marketing copy was written. The meta description on all routes is a verbatim sentence from the About block.

### K14. Night-owl handling
A meeting that runs past midnight still counts as "now" after midnight (none do today, the code and test cover it).
