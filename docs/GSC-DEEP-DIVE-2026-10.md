# Search Console deep dive, October 2026

Pulled 2026-10-14 with `gsc.py` against the URL-prefix property
`https://elitesportsmed.org/` (the only Elite property the key can read). Aggregates
only; raw exports stay out of the repo. Windows end 2026-10-11 because Search Console
finalises on a three-day lag.

- **28-day totals** come from the zero-dimension API row, so they are exact.
- **Query figures** come from the query table, which Google truncates and anonymises.
  Treat every query-level number below as directional. Positions are
  impression-weighted across every URL that ranked for the query.
- **Brand** means a query containing "elite" or any spelling of "Matarazzo".

## The five numbers

| Metric | Previous 28 days (Aug 17 to Sep 13) | Last 28 days (Sep 14 to Oct 11) | Change |
|---|---|---|---|
| Clicks | 194 | **148** | -24% |
| Impressions | 15,827 | **16,128** | +2% |
| CTR | 1.23% | **0.92%** | -0.31 pts |
| Average position | 11.6 | **11.6** | flat |
| Striking-distance queries (position 4 to 20, 10+ impressions, non-brand) | | **76** (67 orthopedic, 9 peptide) | |

90 days (Jul 14 to Oct 11): 578 clicks, 51,868 impressions, CTR 1.11%, position 11.6.
122 striking-distance queries over 90 days, 45 of them peptide.

**What the drop is.** Three things, none of them a ranking collapse:

1. **The peptide pages moved to RegenOrtho.** The redirects took effect around
   Sep 18 to 21 (docs/PEPTIDE-MIGRATION.md). Peptide URLs earned 72 clicks in the
   previous window and 49 in this one, and Google is still showing the old Elite
   URLs while it consolidates. That loss is by design; the rankings now belong to
   regenorthopb.com.
2. **The homepage lost 27 clicks** (106 to 79) while its position improved from 12.9
   to 9.8. Brand and name clicks fell from 57 to 36 (query table). The cause is not
   clear from Search Console alone; see the name section.
3. **One query distorts CTR.** "mark matarazzo" alone is 4,781 of this window's
   impressions (30%) at position 5.4 with 3 clicks. Remove it and CTR is 1.28%
   (145 / 11,347) this window and 1.68% (190 / 11,302) last window. Those are the
   true totals minus that one query's own row.

## 1. His name

| Query family, last 28 days | Impressions | Clicks | Where it lands |
|---|---|---|---|
| "marc matarazzo", "dr marc matarazzo", "marc matarazzo md", "dr matarazzo orthopedic" and variants | 716 | 17 | Homepage at position 1.8 to 3; the bio page almost never |
| "mark matarazzo" | 4,781 | 3 | Homepage, position 5.4 |
| The two old practice addresses typed with his name (582 NW University Blvd; 875 Military Trail) | 57 | 0 | Homepage |

- **"mark matarazzo" is mostly not him.** Over 90 days it drew 16,331 impressions,
  89% on mobile and about half from outside the US (Mexico 1,106, UK 835, Canada 557,
  Germany 532, Italy 465, Spain 320, Argentina 309). That is the profile of people
  looking for someone else with the surname, not patients misspelling a surgeon. It
  is not a target. Nothing on the site uses the misspelling, and nothing should.
- **The name queries he can win are already won by the homepage** at positions 1.8
  to 3. What sits above it is his directory profiles (Healthgrades, Doximity,
  Stryker, Jupiter Medical Center), every one of which still shows old practices or
  the closed Jupiter office. Fixing those listings (COWORK-LOCAL-FIXES.md) turns
  the results above us into pages that send people to Elite instead of away from it.
- **People are searching the old practice addresses with his name** (176 impressions
  in 90 days). Those are the two "Dr. Marc Matarazzo" practitioner listings on Google
  Maps that Elite does not own. Claiming and moving them is in the Cowork prompt.
- **The bio page is the second most visited page on the site** (Vercel: 75 visitors,
  Sep 14 to Oct 13) but gets almost no search entrances. It now carries the verified
  credentials, the sourced MISHA claim and the full Physician + Person entity, so it
  is the page AI answers and the knowledge panel can cite. Re-read on 2026-11-11.

## 2. Striking distance, by page

Last 28 days, orthopedic queries only (67):

| Group (disjoint) | Queries | Impressions | Clicks | Reading |
|---|---|---|---|---|
| City-qualified (Palm Beach Gardens, West Palm Beach, PSL, Stuart...) | 37 | 581 | 0 | The map pack answers these. A Business Profile lever. |
| "near me" with no city | 11 | 318 | 0 | Map pack again. Proximity and reviews decide it. |
| Generic, no city | 19 | 877 | 0 | "orthopedic sports medicine", "knee surgeon", "sports medicine doctor", plus the content targets below |
| *Across all three: top page is an /areas-we-serve/ town page* | *50* | *1,413* | *0* | *Mostly the Stuart and Fort Pierce pages, where there is no office* |

The content targets (90 days):

| Page | Query | Impressions | Position |
|---|---|---|---|
| MISHA | misha knee system | 28 | 16.3 |
| MISHA | misha implant / misha knee system near me | 19 | 13.6 to 16.8 |
| MISHA | is the misha knee system covered by medicare | 15 | 30.3 |
| MAKO article | robotic knee surgery / replacement palm beach gardens fl | 24 | 4.4 to 6.4 |
| IME | orthopedic ime / what is an orthopedic ime / orthopedic panel ime | 62 | 15.5 to 19.3 |
| CME | what is a cme medical exam / cme medical exam | 34 | 10.0 to 14.6 |
| Patellar dislocation | patella / kneecap dislocation surgery | 168 | 16.9 to 21.7, national |
| Regenerative | regenerative medicine port st. lucie, prp injections port st. lucie | 28 | 11.0 to 14.4 |

**Not in striking distance:** ACL reconstruction, meniscus repair, cartilage/MACI,
total shoulder and reverse shoulder (all 23 to 90, mostly national queries for other
cities). Second opinions ranks 39 to 96. The brief's "recovery timeline" and "second
opinion before surgery" guides were therefore not written: no page ranks for them.

**Workers' compensation:** 5 impressions in 90 days. No demand to build for. IME and
CME have modest definitional demand and both pages already exist; their titles were
changed on 2026-10-09 and are left alone until that change can be read.

## 3. Cannibalization

| Query (90 days) | Pages splitting it |
|---|---|
| robotic knee replacement palm beach gardens fl | MAKO article (4.4), North Palm Beach town page, Palm Beach Gardens office page |
| sports medicine doctor / sports doctor | homepage (~20), Stuart town page |
| orthopedic sports medicine (and 8 variants) | Stuart and Fort Pierce town pages, never the homepage or /services/sports-medicine/ |
| mako robotic knee surgery | MAKO article (27.4) and /services/mako-total-and-partial-knee-replacement/ (28.8) |

The town pages were retargeted at "sports medicine" searches on 2026-10-09. Five days
of data cannot judge that. Re-read on 2026-11-11; if the six no-office town pages are
still collecting generic impressions with no clicks, that is a decision for Nick
(questions in the growth plan), not a reason to add more pages.

## 4. Changes made from this data (2026-10-14)

| Page | Change | Re-read |
|---|---|---|
| /mako-robotic-assisted-knee-replacement-system/ | Title "How MAKO Robotic Knee Replacement Works \| Elite Sports" became "Robotic Knee Replacement (MAKO) \| Palm Beach Gardens, FL"; description names both offices. Last title change 2026-08-20 | 2026-11-11 |
| /services/misha-...-implant/ | About 700 words added: first-in-Florida with source, FDA indication, comparison table, insurance and Medicare status, three FAQs. Title untouched (changed 2026-10-09) | 2026-11-11 |
| /marc-f-matarazzo/ | Credentials, timeline and Physician + Person schema; booking buttons in the hero. Title untouched | 2026-11-11 |
| Every page | "Former NY Jets and Islanders team physician" corrected to "assistant team physician" in 8 town-page descriptions and the sports medicine page description | 2026-11-11 |

## How this was pulled

```
gsc.py compare --property https://elitesportsmed.org/ --days 28
gsc.py summary --property https://elitesportsmed.org/ --days 90
gsc.py raw --dimensions query,page --days 90 --limit 25000 --json
gsc.py raw --dimensions page --days 28 [--end 2026-09-13] --json
gsc.py raw --dimensions query,country | query,device | query,date --days 90 --json
```
