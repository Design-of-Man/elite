# Content provenance — read before cutover

**Status: unresolved. This gates the elitesportsmed.org cutover.**

Measured 2026-09-17: every rebuild page that shares a URL with the live site was
fetched and compared against it by overlapping 8-word runs of visible body text.

## The finding

**18 pages in this rebuild reproduce the live site's body copy at 25–93%.**
The median across all 36 compared pages is 79%. Spot-checked side by side, the
top pages are word-for-word identical, not paraphrase.

| overlap | shared 8-word runs | page |
|---|---|---|
| 93% | 498 | `second-opinions/index.html` |
| 92% | 605 | `services/knee-ligaments-reconstructions/index.html` |
| 91% | 629 | `services/shoulder-and-knee-surgery/index.html` |
| 90% | 521 | `services/independent-medical-examinations/index.html` |
| 89% | 481 | `services/mako-total-and-partial-knee-replacement/index.html` |
| 89% | 488 | `services/shockwave-therapy/index.html` |
| 88% | 447 | `services/total-knee-replacement/index.html` |
| 87% | 531 | `services/misha-minimally-invasive-implantable-shock-absorber-implant/index.html` |
| 87% | 492 | `services/meniscus-repair/index.html` |
| 86% | 410 | `services/dolorclast-radial-shockwave-therapy/index.html` |
| 86% | 500 | `services/articular-cartilage-restoration-and-maci-procedures/index.html` |
| 86% | 419 | `services/mls-multiwave-laser-therapy/index.html` |
| 85% | 464 | `services/patellar-dislocation-surgery/index.html` |
| 79% | 388 | `services/laser-therapy/index.html` |
| 76% | 502 | `services/orthobiologics-regenerative-orthopedic-therapies/index.html` |
| 53% | 674 | `new-patient-intake-form/index.html` |
| 41% | 82 | `elite-injection-consent-form/index.html` |
| 31% | 83 | `mako-robotic-assisted-knee-replacement-system/index.html` |

## Why this matters

Website copy is copyrightable. Under US law a contractor keeps copyright in what
they write unless there is a **signed written assignment** — it does not transfer
just because the client paid for it. "Work made for hire" does not close the gap
either: for commissioned work it needs a signed agreement *and* the work must fall
into one of nine statutory categories, which website copy generally does not.

So the default assumption is that the previous marketer owns this copy and the
practice holds, at most, an implied licence to use it **on the site he built**.
Whether that licence extends to a replacement site built by a different agency is
exactly the question that produces claims.

Aggravating factors specific to this matter:

- He is losing the account. An adverse former vendor is the most motivated
  plaintiff there is, and he will see the new site the day it launches.
- 15 pages at 76–93% verbatim is not a close factual call.
- If he registered the copyright before any infringement, statutory damages and
  attorney's fees come into play, which changes the economics of even a weak claim.
  Without registration he is limited to actual damages, which are likely small.

None of this is legal advice — nobody here is a lawyer. It is a description of
the exposure so the practice can take advice on it.

## What resolves it

**One document.** Get the practice to produce the previous marketer's contract,
SOW or engagement letter and look for an intellectual-property assignment clause.

- **Assignment exists, covering the copy** → the practice owns it, reuse is fine,
  ship as built. Nothing below is needed.
- **No assignment, or no contract can be found** → rewrite the pages in the table
  above before cutover. Same clinical facts, original expression. Roughly a day of
  work, and it needs clinical review because these are surgical procedure pages.

Until that document is in hand, **do not cut over.**

## Already cleared

- **The four new RegenOrtho peptide pages** (`services/{ghk-cu,kpv,tesamorelin,mots-c}`)
  were first drafted close to Elite's wording, then rewritten. They now share
  **zero** 8-word runs with the live Elite pages. Facts kept, expression original.
  The only near-matches left are standard scientific descriptions of the compounds
  themselves, which are facts and are not protectable — and which should not be
  reworded, because distorting a chemical definition to look different is a
  clinical error, not a legal fix.
- **Images.** The rebuild ships 5 image assets and none share a filename with the
  live site's WordPress uploads, so no stock or photography licence travels with it.
  Two are worth confirming provenance on with the practice, since a licence that
  covers the old site may not cover the new one:
  `assets/img/dr-matarazzo-portrait.jpg` and `assets/img/patella-displacement-diagram.jpg`.

## Method

Reproduce with the comparison used here: fetch each live URL, strip nav/header/
footer/script/style, normalise whitespace and case, and compare sets of
overlapping 8-word runs. Raw figures: `/tmp/elite-overlap.json` at time of writing.
