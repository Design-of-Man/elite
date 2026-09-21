# ELITE Sports Medicine — Website (elitesportsmed.org)

Static site, 51 hand-written HTML pages. There is no build step and no template
engine: each page is edited directly. Two scripts own the things that must stay
identical across all 51 files — run them after any edit that touches what they
manage.

## Scripts (run from anywhere in the repo)
- `python3 scripts/stamp-assets.py` — rewrites the `?v=` cache-buster on
  `/assets/css/v2.css` and `/assets/js/main.js` from the file's own bytes. Run
  after ANY edit to either asset: `/assets/*` is served `immutable` for a week,
  so an unchanged URL means visitors keep the old file.
- `python3 scripts/seo.py` — rewrites the per-page schema graph (the block
  between the `<!-- seo:graph -->` markers) and regenerates `sitemap.xml`. Run
  after adding a page, or after changing any page's `<title>`, description or
  `og:image`. It is idempotent; a run with nothing to do prints `0 page(s)`.

## Page anatomy (keep consistent — the scripts depend on it)
- Every page has exactly one `</head>`. Two location pages shipped without one
  for a while and silently missed every head-level injection.
- `<h1 data-split-words>` inside `.hero`, lede in `.hero-lede`. Those two
  selectors are the `SpeakableSpecification` emitted by `seo.py` — rename either
  class and you must update the selectors there too.
- Each page carries its own unique title (~50–60 chars, keyword + city
  front-loaded), description (~150–160), canonical, OG/Twitter tags, and a
  `BreadcrumbList`. Interior pages also carry their subject node
  (`MedicalProcedure`, `Physician`, `FAQPage`, `MedicalClinic`).

## Business facts (canonical — never invent beyond these)
- ELITE Sports Medicine · Marc F. Matarazzo, MD — board-certified,
  fellowship-trained, MAKO-certified, first surgeon in Florida to implant the
  MISHA Knee System; over a decade as a team physician (NY Jets, NY Islanders).
- 561-202-8886 · info@elitesportsmed.org
- Port St. Lucie: 1100 SW St. Lucie West Blvd., Ste. 105, FL 34986
- Palm Beach Gardens: 11380 Prosperity Farms Rd, Ste 204, FL 33410
- Socials: instagram.com/drmarcmatarazzo · linkedin.com/in/matarazzo
- Office hours are **Monday–Friday, 8:00 AM–4:00 PM**, the same at both offices
  (supplied by the practice 2026-09-21). They appear in five places and must be
  changed in all of them together, or the page and the schema disagree: the
  footer Contact column on every page, both office cards on
  `/schedule-appointment/`, the `office-note` line on each `/areas-we-serve/`
  office page, `llms.txt`, and `openingHoursSpecification` on the organization
  node plus both `department` nodes plus each location page's `MedicalClinic`
  node. Whatever is on the Google Business Profile has to match exactly — a
  mismatch there is what Google surfaces, not what the page says.
- No prices are published, including membership tiers. See `/pricing.md`.

## SEO — keep maximized
- Canonical host is `https://elitesportsmed.org` — non-www, trailing slash
  (`"trailingSlash": true` in vercel.json). `www` already 301s to the apex at the
  domain level, verified 2026-09-21:
  `curl -s -o /dev/null -w '%{http_code}' https://www.elitesportsmed.org/` → 301.
  If that ever returns 200, www is serving the whole site as a live duplicate —
  fix it before anything else. (The sibling site regenorthopb.com lost 45% of its
  impressions to exactly that.)
- One organization node lives on the homepage: `MedicalBusiness` +
  `MedicalClinic` at `@id {SITE}/#organization`, with the two offices as
  `department` `MedicalClinic` nodes (`#clinic-port-st-lucie`,
  `#clinic-palm-beach-gardens`) and Dr. Matarazzo at `#physician`. Every other
  page links back to it through the `WebSite`/`WebPage` nodes `seo.py` emits —
  that is what tells search engines the per-page procedure nodes belong to one
  practice. Never duplicate the org node onto another page.
- Clinical pages (everything under `/services/`, plus regenerative-treatments,
  minimally-invasive-procedures, joint-replacements-shoulder-knee, the MAKO page
  and second-opinions) get `MedicalWebPage` + a `MedicalAudience`. That list is
  `CLINICAL_PREFIXES` in `scripts/seo.py`; add new clinical pages to it.
- `<lastmod>` comes from the last commit that touched the file, not a sitewide
  constant — a frozen date on every URL is noise Google learns to discount. Known
  and harmless: the build that introduces a change still emits the previous date;
  the next run after committing picks up the new one. Don't stamp today's date.
- `robots.txt` names the AI crawlers (GPTBot, ClaudeBot, PerplexityBot,
  Google-Extended, Applebot-Extended…) with `Allow: /` — several treat silence as
  refusal, which costs AI-answer visibility. Robots meta carries
  `max-snippet:-1` + `max-image-preview:large`.
- `llms.txt` is the assistant-facing site map, `pricing.md` the machine-readable
  price reference. Both are served as `text/plain` by vercel.json. `pricing.md`
  exists to FENCE prices: it states that none are published and tells an
  assistant not to infer one. Never put a figure in it that is not on a page.
- DELIBERATE: no `aggregateRating` in our own schema (Google guideline), and no
  `reviewedBy`/`lastReviewed` on MedicalWebPage — both assert a named clinician
  signed off on the page, and that sign-off does not exist on record.
- `vercel.json` 301-maps every old WordPress URL (including the peptide pages,
  which now point at regenorthopb.com) — keep them ≥12 months post-launch. It is
  a standalone file; edit it directly.
- `vercel.json` also sends `X-Robots-Tag: noindex, nofollow` on any host matching
  `.*\.vercel\.app`. Any such host serving this repo is a duplicate of
  elitesportsmed.org, and a duplicate is what cost regenorthopb.com 45% of its
  impressions. Vercel already marks its OWN preview deploys noindex, but a
  deployment promoted to production on any project does not get that — and this
  repo is connected to a second, stale Vercel account (`cambo421-1638s-projects`,
  projects `elite` and `elite-cinematic`) whose builds fail today but would be
  indexable if they ever succeeded. The rule keys on hostname, so the real domain
  is untouched; it sits directly after the sitewide header block so the stricter
  PHI rules still win on those three pages. jupiterlaser.com carries the same
  guard. Don't drop the `has` and apply it to `/(.*)` unconditionally — that
  would noindex the live site.
- IndexNow key file `5b1495cc7c963fae41d9396f8b82b92a.txt` sits at the root. It
  does nothing by itself — ping on change:
  `curl -s "https://api.indexnow.org/indexnow?url=https://elitesportsmed.org/&key=5b1495cc7c963fae41d9396f8b82b92a"`
  Bing and Yandex act in minutes; Google ignores it.

## Patient forms — PHI (do not regress)
`/new-patient-intake-form/`, `/elite-injection-consent-form/` and
`/elite-medical-records-request/` collect PHI and are built to keep it in the
browser: `onsubmit="return false"`, no form action, no fetch/XHR/beacon, and the
on-page notice promises the form is not submitted online. Consequently:
- No analytics or third-party script may be added to those three pages. They are
  the only pages without the Vercel Web Analytics tag, and that is on purpose.
- They are `noindex` in robots meta, and vercel.json sends `no-store` plus
  `X-Robots-Tag: noindex, noarchive, nosnippet` for each.
- Do NOT point them at FormSubmit, Formspree, Zapier or a plain mailbox.
  Electronic delivery of PHI needs a HIPAA-eligible destination under a signed
  BAA, plus encryption, access controls, audit logging and a retention schedule —
  and the on-page notice would have to be rewritten in the same change.
- `/schedule-appointment/` is different: it collects contact details and a reason
  for calling, not clinical history, and may keep using FormSubmit.

## Analytics
Vercel Web Analytics (`/_vercel/insights/script.js`, cookieless, no consent
banner) is on every page except the three PHI forms above. That counts
pageviews and nothing else, so `main.js` adds the lead funnel on top — the same
four events, under the same names, as jupiterlaser.com and regenorthopb.com, so
one decision about what counts as a conversion applies to all three properties:

| Event | Fires when | Payload |
|---|---|---|
| `call_click` | any `tel:` link is clicked | `path`, `location` |
| `email_click` | any `mailto:` link is clicked | `path`, `location` |
| `appointment_cta` | a link to `/schedule-appointment/` is followed | `path`, `location` |
| `form_submit` | `/thank-you/` loads | `path`, `form` |

- `location` comes from `placementOf()`: `mobile-nav`, `header`, `footer`,
  `hero`, `assistant`, `body`. The listener is delegated in the CAPTURE phase so
  it records a `tel:` click that navigates away immediately, and covers markup
  added later without each page opting in.
- **`form_submit` fires on `/thank-you/`, not on submit.** The appointment form
  is a plain POST to FormSubmit, which only follows its `_next` redirect to that
  page once the send actually succeeded — so the page IS the confirmed-delivery
  signal. Counting the submit instead would count sends that failed, which is
  precisely how jupiterlaser.com reported leads it never received. A
  sessionStorage flag stops a refresh counting twice.
- **Payload is placement and path only.** Never a field value, never a service
  or condition name — attaching "knee pain" to an individual visitor's action is
  where analytics becomes a health-privacy problem.
- `leadEvent()` hard-bails on the three PHI paths, on top of those pages having
  no analytics tag at all. Two independent guards on purpose.
- `window.gtag` is mirrored but no GA4 tag is loaded here yet. It is what Google
  Ads imports as a conversion; the call no-ops until a tag is added, so that day
  needs no code change.

Verified in Chromium (2026-09-21): all four events fire with correct placements,
the PHI page stays silent, `/thank-you/` counts once and not on reload, and the
page throws nothing when no analytics script is present at all.

## Facts discipline
All claims, credentials, prices and reviews come from the practice's own
published content. Never invent credentials, statistics, outcomes, hours,
prices or testimonials.
