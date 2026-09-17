# Content provenance

**Status: resolved for every page that could be rewritten. Two forms remain, by design.**

Measured 2026-09-17: each rebuild page sharing a URL with the live marketer site was
fetched and compared against it by overlapping 8-word runs of visible body text.

## What was found

16 pages reproduced the live site's body copy at 31-93%, median 79%. Spot-checked side
by side, the worst were word-for-word rather than paraphrase.

## What was done

All 16 rewritten in original wording. Clinical facts, procedure names, timelines,
figures and credentials are unchanged — only the expression.

| page | was | now |
|---|---|---|
| `second-opinions/index.html` | 93% | <2.7% |
| `services/knee-ligaments-reconstructions/index.html` | 92% | <2.7% |
| `services/shoulder-and-knee-surgery/index.html` | 91% | <2.7% |
| `services/independent-medical-examinations/index.html` | 90% | <2.7% |
| `services/mako-total-and-partial-knee-replacement/index.html` | 89% | <2.7% |
| `services/shockwave-therapy/index.html` | 89% | <2.7% |
| `services/total-knee-replacement/index.html` | 88% | <2.7% |
| `services/misha-minimally-invasive-implantable-shock-absorber-implant/index.html` | 87% | <2.7% |
| `services/meniscus-repair/index.html` | 87% | <2.7% |
| `services/dolorclast-radial-shockwave-therapy/index.html` | 86% | <2.7% |
| `services/articular-cartilage-restoration-and-maci-procedures/index.html` | 86% | <2.7% |
| `services/mls-multiwave-laser-therapy/index.html` | 86% | <2.7% |
| `services/patellar-dislocation-surgery/index.html` | 85% | <2.7% |
| `services/laser-therapy/index.html` | 79% | <2.7% |
| `services/orthobiologics-regenerative-orthopedic-therapies/index.html` | 76% | <2.7% |
| `mako-robotic-assisted-knee-replacement-system/index.html` | 31% | <2.7% |

Every page now sits between 0.7% and 2.7%, which is the floor for two documents
covering the same procedures — shared anatomy and procedure names, not shared prose.

Re-run the measurement any time with the method at the end of this file.

## The two forms are deliberately untouched

| page | overlap | why it stays |
|---|---|---|
| `new-patient-intake-form/index.html` | 53% | Field labels ("First Name", "Date of Birth"), HIPAA privacy-notice wording, and medical/financial consent clauses |
| `elite-injection-consent-form/index.html` | 41% | Informed-consent language and the standard injection risk disclosure |

This text is **legally operative**, not marketing copy. Rewording a consent clause can
change what a patient is agreeing to, and rewording a HIPAA notice can break its
compliance. It is also largely standard template language that appears across medical
practices, so it is weak ground for a copyright claim in the first place — short factual
labels and standard disclosures attract little or no protection.

If the practice wants these changed, it is a job for their counsel or a compliance
vendor, not a copywriting pass.

## Defects fixed along the way

The rewrite surfaced real errors the previous vendor left in, all of them live:

- `total-knee-replacement` — the last two FAQ answers were transposed. "Is it safe?"
  returned the phone number; "How do I schedule?" returned "Yes, it is safe."
- `laser-therapy` — "Is Laser Therapy painful?" was asked twice, and the downtime
  question was answered with the painfulness answer.
- `dolorclast-radial-shockwave-therapy` — three FAQ answers were the same copy-pasted
  text; "Is there any downtime?" was answered "Yes" on a page that states there is none;
  and an answer had a stray "RESULTS YOU CAN EXPECT" heading spliced into it.
- `mls-multiwave-laser-therapy` — the treatment plan claimed to be "based on orthopedic
  **shockwave** protocols" on a laser page, copy-pasted from the DolorClast page. Also
  carried a double colon and an "SFaster" typo.
- `dolorclast` and `mls` — "TYPICAL TREATMENT PLAN" rendered as a checklist bullet
  because the plan had been mashed into the effects list. Both pulled out into their own
  section, and the crammed condition paragraphs turned into real lists.
- `independent-medical-examinations` — closed on "return to the activities you enjoy",
  wrong for an assessment the same page states is not treatment.
- `meniscus-repair` — heading read "About Meniscus Repair's".
- `areas-we-serve/palm-beach-gardens-fl` and `areas-we-serve/port-st-lucie-fl` — both
  had an unclosed `<main>`. These are the two real office pages. Pre-existing; fixed.

## SEO note

The formulaic headings ("About X", "Common Issues We Treat in X", "Benefits of X
Treatment") were replaced with question-shaped ones ("When is it time to replace the
knee?", "Why does a kneecap keep dislocating?"). That is original expression, and it is
also what AI answer engines retrieve against — the same reasoning documented for
condition pages in the regenortho repo.

FAQ answers exist twice per page, in the visible markup and in FAQPage JSON-LD. Both
were updated together and verified in sync; Google requires them to match.

## Images

The rebuild ships 5 image assets, none sharing a filename with the live site's WordPress
uploads, so no stock or photography licence travels with it. Two are worth confirming
provenance on with the practice: `assets/img/dr-matarazzo-portrait.jpg` and
`assets/img/patella-displacement-diagram.jpg`.

## Still worth getting

The previous marketer's contract or SOW, checked for an IP assignment clause. The
rewrite means the answer no longer gates the cutover, but it settles whether anything
else of his — images, the domain, the Google Business Profile — was ever assigned.

## Method

Fetch each live URL, strip nav/header/footer/script/style, normalise whitespace and
case, and compare sets of overlapping 8-word runs.
