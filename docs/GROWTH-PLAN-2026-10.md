# ELITE Sports Medicine growth audit and plan, October 2026

Prepared 2026-10-14 from Search Console (`docs/GSC-DEEP-DIVE-2026-10.md`), both
Google Business Profiles through Windsor.ai, Vercel Web Analytics and its lead events,
the CMS NPI Registry, the physician's public profiles, the FDA, and a fetch of the
competing practices' sites (`docs/seo-kit/competitor-teardown-2026-10.md`). Nothing
patient-identifiable is in this file.

## 1. Bottom line: the levers, ranked

1. **Google reviews. Both Elite profiles have zero.** Every competitor in the map pack
   is a multi-surgeon group with years of reviews. Ask every patient, at checkout, by
   text, with each office's own review link. Nothing on the website moves the map pack
   as much as this, and it costs nothing.
2. **Claim the two "Dr. Marc Matarazzo" practitioner listings** at his former
   employer's offices (64 reviews each), then move each to the Elite office where he
   practises now and ask Google to merge. That is 128 existing reviews pointed at the
   right place. People already search those old addresses with his name (176 times in
   90 days).
3. **Fix his records, NPPES first.** His individual NPI still has the closed Jupiter
   office as primary and no Palm Beach Gardens; Healthgrades, Doximity, Jupiter
   Medical Center and Stryker all show old offices or old practices, and they are the
   pages that rank above Elite for his name. Cowork prompt: `docs/COWORK-LOCAL-FIXES.md`.
4. **Measure leads in GA4.** The four lead events fire to Vercel today (30 days: 25
   booking clicks, 19 call taps, 1 confirmed form). The `gtag` mirror is ready but no
   GA4 property is loaded; it needs a measurement ID from Nick.
5. **Depth on pages that already rank, not more pages.** MISHA (positions 11 to 17)
   and the MAKO article (4 to 6 for Palm Beach Gardens robotic knee queries) were
   deepened or retitled in this PR. Most surgical pages (ACL, meniscus, cartilage,
   shoulder) do not yet rank in striking distance; they need the review and citation
   work above more than they need words.

## 2. What the data says

**Search (28 days to Oct 11 vs the 28 before):** 148 clicks (194), 16,128 impressions
(15,827), CTR 0.92% (1.23%), position 11.6 (11.6). The click drop is mostly the
peptide pages moving to regenorthopb.com by design (72 to 49 clicks on peptide URLs
that now redirect) plus 27 fewer homepage clicks. One query, "mark matarazzo", is 30%
of impressions and is mostly searchers abroad looking for someone else; without it
CTR is 1.28%. 76 striking-distance queries; 50 of the 67 orthopedic ones land on
town pages for offices that do not exist, with zero clicks.

**His name:** the homepage already ranks 1.8 to 3 for "marc matarazzo", "dr marc
matarazzo" and "marc matarazzo md". Above it: his directory profiles, all out of date.
The bio page is the second most visited page (75 visitors in 30 days) but rarely the
search landing page.

**Business Profiles:** Port St. Lucie 135 to 261 impressions a month this year, 0 to 9
calls, 15 website clicks in September. Palm Beach Gardens has one full month of data
(September: 58 impressions, 5 calls). "elite sports medicine" is the only search term
above Google's reporting threshold.

**Analytics (Vercel, Sep 14 to Oct 13):** 292 visitors to the homepage, 75 to the bio,
30 to the booking page. 161 visitors from Google search, 24 from Bing. Lead events:
`appointment_cta` 25 (header 10, hero 10, body 3), `call_click` 19, `form_submit` 1.
`/thank-you/` had 5 visitors against 1 `form_submit`; the event's one-per-session
guard and the spam labelling explain part of that, but worth a look.

**Fact errors found and fixed:** seven passages said he "spent over a decade as a team
physician for the NY Jets and NY Islanders". The Jets and Islanders role was an
assistant team physician post during his 2001 to 2002 Lenox Hill fellowship
(Doximity, Stryker). The decade-plus figure is his head team physician role at Palm
Beach Atlantic University. Corrected on every page, in the assistant's fact sheet and
in llms.txt; both Business Profile descriptions still carry it (Cowork task 1).

## 3. Shipped in this PR

| Change | Pages | Why |
|---|---|---|
| Team-physician claim corrected | 14 pages (2 of them blog posts, edited at their _posts/ source), api/chat.js, llms.txt | Facts as sourced |
| Physician page: hero booking buttons; degree, residency and fellowship years; NPI name; MISHA claim linked to the hospital's release; AAOS Fellow; timeline rebuilt from sources | /marc-f-matarazzo/ | Make it the page of record for his name |
| Physician + Person schema: names, honorifics, alumniOf, degree and fellowship credentials, AAOS role, AOSSM, knowsAbout, subjectOf the JMC release, verified sameAs kept | bio page; homepage node aligned | Entity clarity for knowledge panel and AI answers |
| MISHA page: first-in-Florida with source, FDA indication (DEN220033), comparison table, insurance and Medicare status, 3 FAQs (visible and in FAQPage) | MISHA service page | Striking distance 11 to 17 |
| MAKO article retitled "Robotic Knee Replacement (MAKO) \| Palm Beach Gardens, FL"; offices named | MAKO article | Ranks 4 to 6 with no clicks |
| Insurance and first-visit card on the booking page | /schedule-appointment/ | Insurance reachable from booking (Medical Clinic must-have) |
| Patient glossary, 42 terms, DefinedTermSet from the same list | /orthopedic-glossary/, scripts/glossary.py, footer link | Brief item 6 |
| Header logo link named; IG/in labels fixed; assistant disclaimer em dash | every page | axe: 2 issues on every page, now 0 |
| seo.py dates pages by their own content, and merge commits no longer re-date pages | scripts/seo.py, sitemap | All 64 lastmods read 2026-10-12; now seven real dates |

**Before and after** (Lighthouse mobile, local static server, same machine; axe 4 at
393 and 1440 px after animations settle; axe counts are affected nodes):

| Page | Perf | A11y | LCP | CLS | axe issues (393 / 1440) |
|---|---|---|---|---|---|
| Home | 72 to 76 | 95 to 100 | 4.4 s to 4.4 s | 0 | 3 / 3 to 0 / 0 |
| Bio | 83 to 83 | 100 to 100 | 3.4 s to 3.4 s | 0 | 2 / 2 to 0 / 0 |
| MISHA | 86 to 85 | 96 to 100 | 3.1 s to 3.2 s | 0 | 3 / 3 to 0 / 0 |
| MAKO article | 85 to 86 | 100 to 100 | 3.1 s to 3.1 s | 0 | 2 / 2 to 0 / 0 |
| Booking | 88 to 85 | 100 to 100 | 3.0 s to 3.1 s | 0 | 2 / 2 to 0 / 0 |
| ACL | 82 to 83 | 96 to 100 | 3.5 s to 3.4 s | 0 | 3 / 3 to 0 / 0 |
| PSL office | 86 to 86 | 100 to 100 | 3.1 s to 3.1 s | 0 | 2 / 2 to 0 / 0 |
| Glossary (new) | 84 | 100 | 3.3 s | 0 | 0 / 0 |

Performance is unchanged within noise. The homepage LCP element is the hero lede, held
back by two render-blocking stylesheets (Google Fonts CSS and v2.css, about 1.9 s of
estimated savings). Self-hosting the three font families, as RegenOrtho did, is the
next performance step; it touches every page's head and is left for its own PR.

## 4. Owner actions (no code), in order

1. **Reviews:** turn on asking at checkout in both offices, using each profile's own
   review link (Cowork task 1e records them). Target below.
2. **Run the Cowork prompt** (`docs/COWORK-LOCAL-FIXES.md`): GBP description and
   booking link, the two practitioner listings, Healthgrades, map-pack recording.
3. **Dr. Matarazzo:** NPPES (primary location to Palm Beach Gardens, remove Jupiter,
   clear the fax), Doximity, his FL DOH practitioner profile.
4. **GA4:** send the measurement ID; then mark `call_click`, `appointment_cta` and
   `form_submit` as key events.
5. **Instagram and LinkedIn bios:** "Palm Beach Gardens + Port St. Lucie".
6. **Ask Jupiter Medical Center** to link his directory profile to elitesportsmed.org.

## 5. Questions for Nick

1. **GA4 measurement ID** for elitesportsmed.org (none is loaded; no property was
   created).
2. **Ortho Florida, LLC.** Both organization NPIs carrying "Elite Sports Medicine" are
   subparts of Ortho Florida, LLC, controlled by its CEO. Which entity bills for
   Elite? Nothing is filed until you say.
3. **Timeline.** The bio says he founded Elite in 2002. His public profiles show him in
   Texas from 2020 and at another Palm Beach practice from 2022. "Ever since" was
   removed. Is 2002 the right founding year, and should the bio say when Elite
   reopened?
4. **AOSSM.** The bio says "active member"; the only external source is his Stryker
   profile. Confirm, or it comes out of the page and the schema.
5. **Hospital affiliation.** Jupiter Medical Center lists him and announced his MISHA
   case. The FAQ deliberately does not name hospitals. May the site say where he
   operates?
6. **MISHA coverage paragraph.** It says some insurers list the implant as
   investigational and that a CPT code starts January 1, 2027 (sourced). Is the
   practice comfortable with that wording?
7. **Port St. Lucie GBP attributes** (Italian and Spanish spoken, garage parking,
   check and NFC payments, LGBTQ+): which are true?
8. **Six town pages without an office** (Stuart, Fort Pierce, Jensen Beach, Jupiter,
   North Palm Beach, West Palm Beach) took 50 of 67 orthopedic striking-distance
   queries in 28 days with zero clicks. Re-read on 2026-11-11 after the 2026-10-09
   retarget; then keep, consolidate, or noindex?
9. **Drive-time lines** on the West Palm Beach and Palm Beach Gardens pages ("about 20
   minutes", "minutes from I-95 and US-1") predate this PR and have no source. Confirm
   or remove.
10. **The AI chat assistant** (api/chat.js) sends what visitors type to Anthropic, with
    xAI as fallback. Visitors may type symptoms. Is there a BAA with either provider,
    or should the assistant's notice tell people not to share health details?

## 6. Next 90 days and how we will know

| Metric | Baseline (Oct 2026) | Target by mid-January |
|---|---|---|
| Google reviews, PSL / PBG | 0 / 0 | 15 / 15 |
| Practitioner listings claimed | 0 of 2 | 2 of 2, moved and merged |
| NPPES primary location | Jupiter (closed) | Palm Beach Gardens |
| GSC clicks per 28 days, excluding peptide URLs | about 100 | 140 |
| Name-query clicks per 28 days (excluding "mark matarazzo") | 17 | 30 |
| MISHA page average position for "misha knee system" | 16.3 | under 10 |
| GBP calls per month, both profiles | 6 (Sep) | 20 |
| Confirmed form submits per month (`form_submit`) | 1 | 6 |

Re-read Search Console on 2026-11-11 for every page changed here (dates in the GSC deep
dive).

## 7. Guardrails

ELITE only on his profiles. No PHI in the repo, analytics or schema; no analytics on the
three PHI forms. No review or AggregateRating markup; no `reviewedBy`. No new town
pages. No fact without a source; unconfirmed items stay in section 5.
