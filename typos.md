# typos.md

The old site's typos, kept exactly as they are because the rule is "exactly" (content pack section 15).
Each one lives in a single place, so flipping it is a one-line edit.
After any edit run `npm run build && npm run deck`. The deck check will fail until `scripts/deck-diff.mjs`
expects the same new words, which is the point: no wording changes by accident.

## In this repo now (home page)

| # | File and line | Old text (as shipped) | Likely meant |
|---|---|---|---|
| 1 | `src/content/deck.ts:91` | `fill our this submission form here` | fill out |
| 2 | `src/content/deck.ts:94` | `to see if its been submitted already` | it's |
| 3 | `src/content/deck.ts:77` | `Download the the NA World Board approved meeting finder:` | the |

## From the meeting database (fix it there, not on the site)

| # | Where | Text | Likely meant |
|---|---|---|---|
| 4 | BMLT, `location_municipality` on the Thursday 7:00pm "Recovery Room" meeting | `Woodridge` | Wood-Ridge |

It shows in the towns sentence, the town picker, the demo 3 map and `deck.meetings.townsFallback`
(`src/content/deck.ts:70`). When the database is corrected the site follows on the next build and on the
next browser refresh. Update the fallback list in the deck at the same time.

## Not in this repo yet (inner pages, Phase 2)

These come over with the pages they belong to. Listed here so they are fixed, or kept, in one pass.

| # | Page | Old text | Likely meant |
|---|---|---|---|
| 5 | Events | `will not allowed to be posted` | will not be allowed |
| 6 | Area Service | `policies and procedures for in the following documents` | for the Area in |
| 7 | Contact form | `specific subcomittee` | subcommittee |
| 8 | Contact form | `ONLY virtual))?` | one bracket |
| 9 | Report an Update | `Report and Update` (H2) | Report an Update |
| 10 | For the Public | `Title: Virtual NA Meeting Resources` | stray "Title:" |
| 11 | For the Public | `if you have any comments, are not able to find something` | or are not able |
| 12 | 7th Tradition | `pay rent and literature the rest is passed on` | missing period |
| 13 | CAR Report | `discussed , what needs` | stray space |
| 14 | Old URL | `/service/regional-commitee-member-rcm/` | committee (redirect the old path, spell the new one right) |

## Not typos, but worth a look

- `Spiritual Principle A Day` is the title of an NA book. It stays as written.
- Venue names (for example `Cavalry United Methodist`, which may be "Calvary") come from the meeting database and are shown exactly as the database gives them.
