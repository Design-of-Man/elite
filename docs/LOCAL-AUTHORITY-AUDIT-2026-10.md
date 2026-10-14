# Local authority audit, October 2026

Prepared 2026-10-14. Builds on `docs/LISTINGS-AUDIT.md` (2026-10-12), which stays the
listing-by-listing record; this file adds what was verified today, the Google Business
Profile numbers, the NPPES detail, and the plan. The paste-ready browser prompt that
fixes the listings is `docs/COWORK-LOCAL-FIXES.md`.

**The rule that governs every listing:** Dr. Matarazzo's profiles show ELITE Sports
Medicine only. Never RegenOrtho Palm Beach's name or 833-783-6561 (decided
2026-10-12). Peptide therapy is an Elite service and may appear under the Elite name.
The Jupiter office (108 Intracoastal Pointe Dr) is closed and must appear nowhere.

## 1. Why Elite is not in the map pack (not schema)

Elite's markup is already the richest of any practice compared
(`docs/seo-kit/competitor-teardown-2026-10.md`). What the map pack weighs, and where
Elite stands:

| Factor | Elite today | Competitors |
|---|---|---|
| Google reviews | **0 on both Elite profiles** (Windsor, all time) | Multi-surgeon groups with years of reviews; one PSL surgeon advertises 1,000+ ratings on a review platform |
| Reviews that exist for him | 64 + 64 on two "Dr. Marc Matarazzo" practitioner listings Elite does not own, both at his former employer's offices; 160 ratings (4.7) on Healthgrades | |
| Proximity | One office in each town | Several offices each, walk-in clinic in Tradition |
| Citations | NPPES, Healthgrades, Doximity, JMC and Stryker still show the closed Jupiter office or former practices | Consistent |
| Affiliation | First MISHA implant in Florida at Jupiter Medical Center (Feb 2026) | Hospital-system groups (HCA, Tenet, Cleveland Clinic) |

**Reviews are the lever.** A profile with zero reviews is rarely shown in a three-pack
against groups with hundreds. Both levers below (asking every patient, and claiming the
two practitioner listings so their 128 reviews move to Elite's offices) matter more
than anything on the website.

## 2. Google Business Profile, both offices (Windsor, read-only)

| | Port St. Lucie (locations/8689948599312691435) | Palm Beach Gardens (locations/13510812082515088638) |
|---|---|---|
| Primary category | Orthopedic surgeon | Orthopedic surgeon |
| Additional | Orthopedic clinic, Sports medicine clinic, Sports medicine physician | same |
| Hours | Mon to Fri 8:30 to 4:00 | Mon to Fri 8:30 to 4:00 |
| Website | /areas-we-serve/port-st-lucie-fl/ | /areas-we-serve/palm-beach-gardens-fl/ |
| Reviews | 0 | 0 |
| Impressions, Sep 2026 | 224 (Jan to Sep: 135 to 261 a month) | 58 (first full month of data) |
| Calls, Sep | 1 (0 to 9 a month in 2026) | 5 |
| Website clicks, Sep | 15 | 3 |
| Direction requests, Sep | 36 | 14 |
| Searches with a reportable volume | "elite sports medicine" 16 to 17 a month; everything else under Google's threshold of 15 | under threshold |

Against the 2026-10-12 "still to do" list:

| Item | Status 2026-10-14 |
|---|---|
| Services list on both profiles | **Done** (21 services each) |
| Peptide therapy in the services list | **Missing on both.** The audit said keep it on Palm Beach Gardens |
| Appointment link to /schedule-appointment/ | **Not set** on either |
| Instagram and LinkedIn on Port St. Lucie | **Done** |
| PSL attributes to confirm (Italian and Spanish spoken, free garage and street parking, check and NFC payments, LGBTQ+ friendly) | Still set, still unconfirmed. Palm Beach Gardens lists English only |
| Description | Both say "over a decade as a team physician for the NY Jets and NY Islanders". The record says assistant team physician during his 2001 to 2002 fellowship. Replacement text is in the Cowork prompt |

**The shared suite.** Palm Beach Gardens Ste 204 holds three orthopedic listings: Elite,
RegenOrtho Palm Beach, and a third physician's. RegenOrtho's profile carries
"Orthopedic surgeon" and "Sports medicine clinic" as additional categories, the same
as Elite's primary and one of its additional categories. RegenOrtho's own CLAUDE.md
says Elite owns "Orthopedic surgeon". Two profiles at one suite competing on the same
category split the signal. Passed to the coordinator as a cross-client item; nothing
here changes RegenOrtho's profile.

## 3. NPPES, verified 2026-10-14 (CMS NPI Registry API)

**Individual NPI 1083678452**, Marc Francis Matarazzo, MD. Enumerated 2006-04-13,
last updated 2025-05-14.

| Field | Shows | Should show |
|---|---|---|
| Primary practice location | 108 Intracoastal Pointe Dr Ste 200, Jupiter (closed) | 11380 Prosperity Farms Rd Ste 204, Palm Beach Gardens |
| Other practice location | 1100 SW Saint Lucie West Blvd Ste 105, PSL | keep |
| Palm Beach Gardens | missing | add |
| Fax | 561-202-8886 (same as phone) | a real fax line, or blank |
| Mailing address | a private address in Stuart | leave as is; never publish it |
| Taxonomies | Orthopaedic Surgery, Sports Medicine (FL ME85839, primary); Orthopaedic Surgery (FL); Sports Medicine (TX S8206) | fine if the Texas license is still held |

Only Dr. Matarazzo can change it (CMS Identity & Access login), and he certifies it
himself. NPPES feeds Healthgrades, WebMD, Vitals, US News, insurer directories and AI
answers, so it goes first.

**Organization NPIs 1356139000 and 1518755255.** Both are "ORTHO FLORIDA, LLC" with
"Elite Sports Medicine" as a doing-business-as name, both flagged as an
**organizational subpart** of the parent ORTHO FLORIDA, LLC, both enumerated
2025-04-30, authorized official Ortho Florida's CEO. 1356139000 is at the PSL suite;
1518755255 has the closed Jupiter office as primary and PSL as secondary. Neither has
Palm Beach Gardens. ORTHO FLORIDA, LLC holds about 50 subpart NPIs across Florida.
There is no organization NPI under MF Matarazzo MD LLC or ORTHO MFM LLC.

Only Ortho Florida's authorized official can change or deactivate these. **Nothing is
filed until Nick confirms the relationship** (questions in the growth plan): if Ortho
Florida bills for Elite, Jupiter comes off and Palm Beach Gardens goes on; if MF
Matarazzo MD LLC bills, it needs its own Type 2 NPI and Ortho Florida removes the DBA.

## 4. Citation errors, re-checked where reachable

One row per error. "Re-checked" means fetched today; the rest are carried from the
2026-10-12 audit.

| Source | Error | Fix | Who |
|---|---|---|---|
| NPPES individual | Jupiter primary; PBG missing; fax = phone (re-checked) | Section 3 | Dr. Matarazzo |
| NPPES organization x2 | Ortho Florida subparts, one at Jupiter (re-checked) | Section 3 | Ortho Florida, after Nick |
| Google practitioner listings x2 | "Dr. Marc Matarazzo" at 582 NW University Blvd PSL and 875 Military Trail Jupiter, 64 reviews each; 176 searches in 90 days typed those addresses with his name | Request access, then move to the Elite office and merge | Cowork, then Google support |
| Healthgrades | 4 offices: Jupiter (875 Military Trl) and PSL (582 NW University) with 561-798-6600, Lake Worth with 561-967-6500, PBG correct; Elite's PSL office missing; 4.7 from 160 ratings (re-checked) | Free provider claim; Elite offices only | Cowork, then Dr. Matarazzo |
| Doximity | Bio "employed at the Center for Bone and Joint Surgery since 2022"; summary says Jupiter; fax = phone; no PSL (re-checked) | He edits his own profile | Dr. Matarazzo |
| Jupiter Medical Center find-a-physician | Practice "Elite Sports Medicine" at the closed Jupiter address; fax = phone (re-checked) | Ask the medical staff office to list PBG and PSL | Cowork drafts the email |
| Stryker Mako surgeon finder | Lists PBG, PSL and "108 Intracoastal Point Drive" Jupiter (misspelled, closed) (re-checked); bio still says Palm Beach County 2002 to 2020 | Ask the Stryker rep to remove Jupiter | Cowork drafts the email |
| US News | Practice shows "Christus Trinity Clinic" (503 today, not re-checked) | Recheck after NPPES and Doximity | |
| Medicare Care Compare | PBG phone 561-624-4800 (another physician's); Boca Raton addresses | PECOS | Billing |
| Zocdoc, Vitals, WebMD | Former practices, Longview TX | Claim each | Cowork, stop at verification |
| Insurer directories | Former practice addresses | Provider relations | Billing |
| FL DOH (ME85839) | Stale secondary offices and privileges | MQA profile | Dr. Matarazzo |
| marcmatarazzomd.com | Old Wix site: Jupiter, phone 561-202-8889 | 301 the domain to elitesportsmed.org | Whoever holds the Wix account |
| Instagram and LinkedIn bios | "Jupiter + Port St. Lucie" | "Palm Beach Gardens + Port St. Lucie" | Cowork |
| Bing | Only the two practitioner entries | Import from GBP once Google is clean | Cowork, last |
| Apple Business | No Palm Beach Gardens place | Needs EIN plus a DNS TXT record in Wix | Nick |
| Both GBP descriptions | Team-physician wording | Cowork task 1 | Cowork |

## 5. Specialty directories and earned links

These are the most relevant links available to an orthopedic surgeon. Each should list
Elite's two offices and link elitesportsmed.org.

- **AAOS Find an Orthopaedist** (he is a Fellow, per Doximity and Stryker).
- **AOSSM** member directory (the bio page says active member; confirm).
- **ABOS** certification lookup (verification only, no link).
- **Moximed's MISHA surgeon locator.** He performed the first implant in Florida; the
  manufacturer's locator should show Elite's offices.
- **Stryker Mako surgeon finder** (already lists him; fix Jupiter).
- **Jupiter Medical Center.** The February 25, 2026 MISHA release names him but does
  not link Elite. Ask the hospital to link his find-a-physician profile to
  elitesportsmed.org. Becker's Spine and South Florida Hospital News carried the
  release.
- **Team history:** Palm Beach Atlantic University (10+ years as head team physician)
  and Palm Beach State College athletics may list team physicians historically.
  Contextual links only; never a sitewide footer swap.

## 6. Brand plan

"Elite Sports Medicine" is a common name. Other unrelated practices use it in other
states and other Florida cities, and Search Console shows a stray "elite sports
medicine nashville" query. There is no collision in either of Elite's two towns.

- Always write the full name with the towns where space allows: "ELITE Sports Medicine,
  Port St. Lucie and Palm Beach Gardens", and "Marc F. Matarazzo, MD".
- Win the brand by volume of reviews and consistent citations, not by mentioning anyone
  else. Never name, report or bid on another practice.
- Do not chase "mark matarazzo": its 16,331 impressions in 90 days are mostly people
  outside the US looking for someone else.

## 7. What not to do

- No new town or city pages. Six no-office town pages already exist and earn no clicks
  (GSC deep dive, section 2). City intent is a Business Profile lever.
- No third Business Profile at either suite. Move the practitioner listings into the
  existing ones.
- No reviews of any kind except asking real patients; no review gating, no incentives,
  no review markup on the site.
- Nothing filed on the Ortho Florida NPIs until Nick answers.
