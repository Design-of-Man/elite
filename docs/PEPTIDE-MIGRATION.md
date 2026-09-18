# Peptide migration — elitesportsmed.org → regenorthopb.com

**Status: built, not cut over. Blocked on two approvals — see "Before cutover".**

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

## Before cutover

### 1. Clinical sign-off — required

The four pages are new medical content on RegenOrtho. Facts are carried over
from Elite's published pages (which are hedged throughout: "may be considered
to support", "has been studied for"), and the wording is ours. But per
`regenortho/CLAUDE.md`, medical copy does not ship without the practice
approving it. **Nobody has approved these yet.**

Moving a service line between two of the owner's brands is also a positioning
decision, not a build decision. The practice confirms it, not us.

### 2. Copyright — see `docs/CONTENT-PROVENANCE.md`

Fifteen other pages in this rebuild are 76–93% verbatim copies of the live
site's body copy. That is a separate and larger issue than the peptide work,
and it gates the whole cutover, not just this migration.

### 3. We do not control the cutover

`elitesportsmed.org` resolves to 160.153.0.85 (GoDaddy) behind Cloudflare, and
the account has not been transferred. DNS has to move before any of this takes
effect. Until then these redirects are inert.

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
