# Peptide migration — elitesportsmed.org → regenorthopb.com

**Status: LIVE. Clinical sign-off on the four RegenOrtho pages is still outstanding —
see "Open items".** (Updated 2026-10-13.)

- The redirects were committed 2026-09-17 (`c3d7d7c`, `a9bc769`) and took effect
  when the domain moved to Vercel, which was serving it by 2026-09-21. Checked
  2026-10-13: every peptide URL in the map returns a permanent redirect (308,
  Vercel's `permanent: true`) to its RegenOrtho destination, and the destinations
  return 200.
- Nick confirmed on 2026-10-13 that the redirects stay. Keep them. Restoring the
  Elite pages now would make Google re-sort the same rankings a second time and
  split the cluster across two of the owner's domains.
- Peptide therapy is still an Elite service (Dr. Matarazzo, 2026-10-12), so it can
  stay on his listings under the Elite name (`docs/LISTINGS-AUDIT.md`). The pages
  and the search rankings live on RegenOrtho.

Prepared 2026-09-17 from Search Console data for the 28 days to 2026-09-14
(the first full period after the Aug 17/18 takeovers).

---

## Why

Elite's organic traffic is a peptide site with an orthopedic surgeon attached.
Of 196 clicks in the window:

| page | clicks | impressions | avg position |
|---|---|---|---|
| homepage | 105 | 6,949 | 13.3 |
| `/services/peptide-therapy/ghk-cu/` | 30 | 4,150 | 6.8 |
| `/services/peptide-therapy/kpv/` | 24 | 995 | 7.1 |
| `/services/peptide-therapy/tesamorelin/` | 9 | 356 | 7.6 |
| `/services/peptide-therapy/mots-c/` | 8 | 650 | 9.2 |
| **every orthopedic service page over 100 impr, combined** | **5** | 1,418 | — |

Four peptide pages carry **37% of the site's organic clicks**. Every surgical
service page combined carries 2.6%.

**But it is not patient traffic.** GHK-Cu converts 0.72% from position 6.8 —
that is wrong-intent traffic, not underperformance. Roughly a third of Elite's
impressions come from outside the US (Germany 269 impressions → 0 clicks,
Italy 212 → 0, Singapore 266 → 0, Canada 517 → 1). People searching "ghk-cu"
want a compound, a dose or a supplier, not a consult on PGA Boulevard.

So the ranking is a real asset built for the wrong business. RegenOrtho
already sells peptides, runs a GLP-1 programme, and has a peptide/GLP intake
questionnaire ranking at position 5.1. Move it there rather than delete it.

The strategic line: **Elite is the surgeon. RegenOrtho is the clinic.**

---

## Destination pages (built)

Four new sub-services under `peptide-therapy` in `regenortho/build.py`, so
each retiring URL gets a 1:1 destination rather than being dumped on a hub:

| new page | canonical |
|---|---|
| GHK-Cu Peptide Therapy | `regenorthopb.com/services/ghk-cu` |
| KPV Peptide Therapy | `regenorthopb.com/services/kpv` |
| Tesamorelin Therapy | `regenorthopb.com/services/tesamorelin` |
| MOTS-c Peptide Therapy | `regenorthopb.com/services/mots-c` |

Each carries `REGEN_DISCLAIMER`, the `$249/month` figure already published on
the peptide hub, and is listed in `pricing.md` under **Published prices**.

All four were written from scratch. Measured against the live Elite pages they
share **zero** 8-word runs — see "Copyright" below.

---

## Redirect map

In `elite/vercel.json`. 1:1 where a destination exists, hub otherwise.

| from (elitesportsmed.org) | to (regenorthopb.com) |
|---|---|
| `/services/peptide-therapy/ghk-cu/` | `/services/ghk-cu` |
| `/services/peptide-therapy/kpv/` | `/services/kpv` |
| `/services/peptide-therapy/tesamorelin/` | `/services/tesamorelin` |
| `/services/peptide-therapy/mots-c/` | `/services/mots-c` |
| `/services/peptide-therapy/bpc-157/` | `/services/peptide-therapy` |
| `/services/peptide-therapy/cjc-1295/` | `/services/peptide-therapy` |
| `/services/peptide-therapy/ipamorelin/` | `/services/peptide-therapy` |
| `/services/peptide-therapy/pt-141/` | `/services/peptide-therapy` |
| `/services/peptide-therapy/tb-500/` | `/services/peptide-therapy` |
| `/services/peptide-therapy/` | `/services/peptide-therapy` |

Plus the **legacy bare paths**, which the current WordPress site 301s and our
build would otherwise 404: `/peptide-therapy/{ghk-cu,kpv,tesamorelin,mots-c}/`
1:1, then `/peptide-therapy/:slug*` to the hub. `/peptide-therapy/tesamorelin/`
alone carried 205 impressions in the window. The four specific rules sit
**before** the wildcard — Vercel evaluates `redirects` in order.

---

## Open items

### 1. Clinical sign-off — still outstanding

The four pages are new medical content on RegenOrtho. Facts are carried over
from Elite's published pages (which are hedged throughout: "may be considered
to support", "has been studied for"), and the wording is ours. But per
`regenortho/CLAUDE.md`, medical copy does not ship without the practice
approving it. **They went live without that approval, and as of 2026-10-13 the
practice still has not approved them.** That covers the copy and the `$249/month`
figure on each page. Until it lands, treat the four pages as unapproved: get the
practice to review them, and make any wording changes they ask for on the
RegenOrtho pages. Do not remove the redirects to work around it.

Moving the service line between brands was the other decision this section
waited on. Nick settled that on 2026-10-13: the redirects stay.

### 2. Copyright — see `docs/CONTENT-PROVENANCE.md`

Fifteen other pages in this rebuild are 76–93% verbatim copies of the old
site's body copy. That is separate from, and larger than, the peptide work, and
it is tracked in that file, not here.

### 3. DNS cutover — done

When this was written, `elitesportsmed.org` still pointed at GoDaddy and the
redirects did nothing. The domain now serves from Vercel (see Status), so the
redirects are live.

---

## Early results (Search Console, to 2026-10-10)

| | Sep 13–26 | Sep 27 – Oct 10 |
|---|---|---|
| Elite peptide URLs — clicks / impressions | 33 / 3,351 | 17 / 1,000 |
| RegenOrtho's four destinations — clicks / impressions | 0 / 109 | 5 / 717 |

Elite's `/services/peptide-therapy/ghk-cu/` fell from 1,625 impressions to 4, so
Google has processed that redirect. The RegenOrtho pages rank around positions
8–12 so far (GHK-Cu 9.8, KPV 8.1, MOTS-c 9.9, Tesamorelin 11.6, 28 days to
2026-10-10). That is on track for the 4–8 week settle below; the end of that
range is mid-November.

---

## What to expect after cutover

Cross-domain 301s pass authority but not all of it, and there is no undo.
RegenOrtho's peptide hub currently sits at position 15.0 on 138 impressions;
the four incoming pages sit at 6.8–9.2. The consolidated result will land
somewhere between those, and it may take 4–8 weeks to settle.

Watch, weekly, in Search Console on `sc-domain:regenorthopb.com`:

- `/services/ghk-cu`, `/services/kpv`, `/services/tesamorelin`, `/services/mots-c`
  — impressions should appear within ~2 weeks of the 301s going live.
- The peptide hub's position — should improve as the cluster consolidates.
- Elite's total clicks — will drop by roughly a third. That is the plan
  working, not a regression. Judge Elite on local queries instead:
  "orthopedic doctors port st lucie" was position 28.1 with 0 clicks.
