#!/usr/bin/env python3
"""Render condition guides from _conditions/*.json into conditions/{slug}/index.html.

WHY THIS EXISTS. The site describes procedures (/services/meniscus-repair/) but
people search conditions ("meniscus tear treatment", "rotator cuff tear without
surgery"). Each guide answers one condition: what it is, symptoms, causes, the
full range of care from nonsurgical to surgical, the first visit, recovery,
red flags, FAQs and the sources it rests on, then links to the procedure pages.

Content was researched from AAOS OrthoInfo, AOSSM, Mayo Clinic, Cleveland Clinic,
MedlinePlus, NHS and peer-reviewed reviews, and fact-checked claim by claim by a
separate pass (docs/condition-guides-factcheck-log.md).

THE REVIEW GATE. CLAUDE.md is explicit that no page may claim a clinician signed
off when that sign-off is not on record. So every guide renders noindex, stays
out of the sitemap (seo.py skips noindex pages), and is not listed on
/conditions/ until its slug is in REVIEWED with the date Dr. Matarazzo read it.
That entry (1) lifts the noindex, (2) lists the guide on /conditions/, (3) shows
"Medically reviewed by Marc F. Matarazzo, MD" on the page, and (4) writes a
`<!-- reviewed: YYYY-MM-DD -->` marker that seo.py turns into reviewedBy +
lastReviewed on the MedicalWebPage. Never add a slug on his behalf.
/conditions/review/ (unlisted, noindex) lists every guide with its open questions.

Shell: the page chrome is taken from blog/index.html at run time, exactly like
scripts/blog.py, so header/footer/nav always match the live site. Every
substitution must match exactly once or the script exits non-zero.

Usage: python3 scripts/conditions.py && python3 scripts/seo.py
"""
import html
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://elitesportsmed.org"
DATA = ROOT / "_conditions"
SHELL = ROOT / "blog" / "index.html"
CTA_SOURCE = ROOT / "minimally-invasive-procedures" / "index.html"

# slug -> "YYYY-MM-DD" Dr. Matarazzo reviewed it. Empty until he has.
REVIEWED = {
    # "meniscus-tear": "2026-10-20",
}

HUBS = {"knee": "Knee", "shoulder": "Shoulder"}
CRUMB_SEP = ('<svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" '
             'fill="none" stroke="currentColor" stroke-width="2">'
             '<polyline points="9 18 15 12 9 6"/></svg>')
TICK = ('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
        'stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>')
ROBOTS_LIVE = "index, follow, max-image-preview:large, max-snippet:-1"
ROBOTS_HELD = "noindex, follow"


class BuildError(Exception):
    pass


def esc(t):
    return html.escape(t, quote=True)


def sub_once(pattern, repl, doc, what):
    new, n = re.subn(pattern, lambda _: repl, doc, flags=re.S)
    if n != 1:
        raise BuildError(f"blog/index.html: expected exactly one {what}, found {n}; update scripts/conditions.py")
    return new


def load():
    out = {}
    for p in sorted(DATA.glob("*.json")):
        d = json.loads(p.read_text(encoding="utf-8"))
        if p.stem != d["slug"]:
            raise BuildError(f"{p.name}: file name and slug disagree")
        out[d["slug"]] = d
    for s in REVIEWED:
        if s not in out:
            raise BuildError(f"REVIEWED lists '{s}' but _conditions/{s}.json does not exist")
    return out


def cta_band():
    m = re.search(r'\n  <section class="cta-band">.*?\n  </section>\n',
                  CTA_SOURCE.read_text(encoding="utf-8"), re.S)
    return m.group(0) if m else ""


def head_for(shell_head, *, title, desc, url, robots, crumbs, extra_ld, reviewed=None):
    h = shell_head
    h = sub_once(r"<title>.*?</title>", f"<title>{esc(title)}</title>", h, "<title>")
    h = sub_once(r'<meta name="description" content=".*?">', f'<meta name="description" content="{esc(desc)}">', h, "description")
    h = sub_once(r'<meta name="robots" content=".*?">', f'<meta name="robots" content="{robots}">', h, "robots")
    h = sub_once(r'<link rel="canonical" href=".*?">', f'<link rel="canonical" href="{url}">', h, "canonical")
    h = sub_once(r'<meta property="og:title" content=".*?">', f'<meta property="og:title" content="{esc(title)}">', h, "og:title")
    h = sub_once(r'<meta property="og:description" content=".*?">', f'<meta property="og:description" content="{esc(desc)}">', h, "og:description")
    h = sub_once(r'<meta property="og:url" content=".*?">', f'<meta property="og:url" content="{url}">', h, "og:url")
    bc = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": n, "item": u} for i, (n, u) in enumerate(crumbs)]}
    h = sub_once(r'<script type="application/ld\+json">\{"@context": "https://schema.org", "@type": "BreadcrumbList".*?</script>',
                 f'<script type="application/ld+json">{json.dumps(bc, ensure_ascii=False)}</script>', h, "BreadcrumbList")
    h = re.sub(r"<!-- seo:graph -->.*?<!-- /seo:graph -->\n?", "", h, flags=re.S)
    marker = f"<!-- reviewed: {reviewed} -->\n" if reviewed else ""
    ld = "".join(f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>\n' for x in extra_ld)
    return h.replace("</head>", marker + ld + "</head>", 1)


def crumbs_html(items):
    lis = []
    for i, (name, href) in enumerate(items):
        if i == len(items) - 1:
            lis.append(f'<li><span aria-current="page">{esc(name)}</span></li>')
        else:
            lis.append(f'<li><a href="{href}">{esc(name)}</a>{CRUMB_SEP}</li>')
    return f'<nav class="crumbs" aria-label="Breadcrumb"><ol>{"".join(lis)}</ol></nav>'


def hero(title, lede, crumbs):
    return f"""
  <section class="hero hero--dark hero--service">
    <div class="hero-glow"></div>
    <div class="container">
      {crumbs_html(crumbs)}
      <div class="hero-rule" aria-hidden="true"></div>
      <h1 data-split-words>{esc(title)}</h1>
      <p class="hero-lede">{esc(lede)}</p>
      <div class="hero-actions">
        <a class="btn btn--gold" href="/schedule-appointment/">Schedule a Consultation</a>
        <a class="btn btn--outline" href="tel:+15612028886">561-202-8886</a>
      </div>
    </div>
  </section>"""


def what_heading(name):
    """Question-shaped H2 that reads naturally: 'What is an ACL tear?', 'About MCL, PCL and LCL ...'."""
    base = name.split(" (")[0]
    if " and " in base or "," in base or base.endswith("Injuries"):
        return f"About {base}"
    words = [w if w.isupper() else w.lower() for w in base.split()]
    phrase = " ".join(words)
    if base.endswith(("Tear", "Dislocation")):
        phrase = ("an " if phrase[0] in "aeiouAEIOU" else "a ") + phrase
    return f"What is {phrase}?"


def tick_list(items):
    return '<ul class="credential-list">' + "".join(f"<li>{TICK}<span>{esc(i)}</span></li>" for i in items) + "</ul>"


def render(shell_head, shell_tail, d, cta, live_slugs):
    slug = d["slug"]
    url = f"{SITE}/conditions/{slug}/"
    reviewed = REVIEWED.get(slug)
    sch = d.get("schema", {})
    cond = {"@context": "https://schema.org", "@type": "MedicalCondition", "@id": url + "#condition",
            "name": d["name"], "alternateName": d.get("also_called", []), "description": d["lede"],
            "signOrSymptom": [{"@type": "MedicalSignOrSymptom", "name": s} for s in sch.get("signOrSymptom", [])],
            "riskFactor": [{"@type": "MedicalRiskFactor", "name": s} for s in sch.get("riskFactor", [])],
            "possibleTreatment": [{"@type": "MedicalTherapy", "name": t} for t in sch.get("possibleTreatment", [])]
            + [{"@type": "MedicalProcedure", "name": lbl, "url": SITE + p} for p, lbl in d.get("procedure_links", [])],
            "subjectOf": {"@id": url + "#webpage"}}
    if sch.get("associatedAnatomy"):
        cond["associatedAnatomy"] = {"@type": "AnatomicalStructure", "name": sch["associatedAnatomy"]}
    if sch.get("icd10"):
        cond["code"] = {"@type": "MedicalCode", "codeValue": sch["icd10"], "codingSystem": "ICD-10"}
    faq = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": f["q"], "acceptedAnswer": {"@type": "Answer", "text": f["a"]}} for f in d["faqs"]]}
    crumbs = [("Home", f"{SITE}/"), ("Conditions", f"{SITE}/conditions/"), (d["name"], url)]
    head = head_for(shell_head, title=d["seo_title"], desc=d["seo_desc"], url=url,
                    robots=ROBOTS_LIVE if reviewed else ROBOTS_HELD, crumbs=crumbs,
                    extra_ld=[cond, faq], reviewed=reviewed)

    methods = "".join(f'<h3 style="margin-top:var(--sp-md)">{esc(a)}</h3><p>{esc(b)}</p>'
                      for a, b in d["how_therapy_helps"]["methods"])
    paras = "".join(f"<p>{esc(p)}</p>" for p in d["what_it_is"])
    review_line = (f'<p class="eyebrow">Medically reviewed by <a href="/marc-f-matarazzo/">Marc F. Matarazzo, MD</a> &middot; {reviewed}</p>'
                   if reviewed else "")
    aka = f'<p><em>Also called: {esc(", ".join(d["also_called"]))}</em></p>' if d.get("also_called") else ""
    faqs = "".join(f"""
        <div class="faq-item reveal">
          <button class="faq-q" aria-expanded="false"><span>{esc(f["q"])}</span><span class="plus"></span></button>
          <div class="faq-a"><p>{esc(f["a"])}</p></div>
        </div>""" for f in d["faqs"])
    related = [(p, lbl) for p, lbl in d.get("procedure_links", [])]
    related += [(f"/conditions/{s}/", DETAILS[s]["name"]) for s in live_slugs if s != slug and DETAILS[s]["hub"] == d["hub"]][:3]
    cards = "".join(f'<div class="card reveal" style="--i:{i}"><h3>{esc(lbl)}</h3><a class="card-link" href="{p}">{esc(lbl)} &rarr;</a></div>'
                    for i, (p, lbl) in enumerate(related))
    sources = "".join(f'<li><a href="{esc(s["url"])}" rel="noopener">{esc(s["title"])}</a>, {esc(s.get("publisher", ""))}</li>'
                      for s in d["sources"])
    main = f"""<main id="main">
{hero(d["name"], d["lede"], [("Home", "/"), ("Conditions", "/conditions/"), (d["name"], "")])}
  <section class="section">
    <div class="container container--reading">
      {review_line}{aka}
      <h2>{esc(what_heading(d["name"]))}</h2>
      {paras}
      <h2 style="margin-top:var(--sp-lg)">What are the symptoms?</h2>
      {tick_list(d["symptoms"])}
      <h2 style="margin-top:var(--sp-lg)">What causes it?</h2>
      {tick_list(d["causes"])}
      <h2 style="margin-top:var(--sp-lg)">How is it treated, with and without surgery?</h2>
      <p>{esc(d["how_therapy_helps"]["intro"])}</p>
      {methods}
      <h2 style="margin-top:var(--sp-lg)">What happens at the first visit?</h2>
      <p>{esc(d["first_visit"])}</p>
      <h2 style="margin-top:var(--sp-lg)">What does recovery look like?</h2>
      <p>{esc(d["recovery"])}</p>
      <h2 style="margin-top:var(--sp-lg)">What can I do in the meantime?</h2>
      {tick_list(d["self_care"])}
      <h2 style="margin-top:var(--sp-lg)">When should I get care right away?</h2>
      {tick_list(d["see_a_doctor"])}
    </div>
  </section>

  <section class="section section--paper2">
    <div class="container container--narrow">
      <div class="section-head reveal"><p class="eyebrow">FAQ</p><h2>{esc(d["name"].split(" (")[0])}: Common Questions</h2></div>
      <div class="faq-list">{faqs}</div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="section-head reveal"><p class="eyebrow">Related</p><h2>Related care</h2></div>
      <div class="grid grid--3 reveal-stagger reveal">{cards}</div>
    </div>
  </section>

  <section class="section section--tight">
    <div class="container container--reading">
      <h2>Sources</h2>
      <ol>{sources}</ol>
      <p><small>General information, not medical advice. Please see a physician about your own symptoms.</small></p>
      <p>Seen at both offices: <a href="/areas-we-serve/port-st-lucie-fl/">Port St.&nbsp;Lucie</a> (1100 SW St. Lucie West Blvd., Ste. 105) and <a href="/areas-we-serve/palm-beach-gardens-fl/">Palm Beach Gardens</a> (11380 Prosperity Farms Rd, Ste 204). Call <a href="tel:+15612028886">561-202-8886</a>.</p>
    </div>
  </section>
{cta}"""
    return head + main + shell_tail


def render_hub(shell_head, shell_tail, live_slugs, cta):
    url = f"{SITE}/conditions/"
    blocks = []
    for hub, label in HUBS.items():
        items = [s for s in live_slugs if DETAILS[s]["hub"] == hub]
        if not items:
            continue
        cards = "".join(f'<div class="card reveal" style="--i:{i}"><h3>{esc(DETAILS[s]["name"])}</h3><p>{esc(DETAILS[s]["lede"])}</p>'
                        f'<a class="card-link" href="/conditions/{s}/">Read the guide &rarr;</a></div>' for i, s in enumerate(items))
        blocks.append(f'<div class="section-head reveal"><p class="eyebrow">{label}</p><h2>{label} conditions</h2></div>'
                      f'<div class="grid grid--3 reveal-stagger reveal">{cards}</div>')
    body = "".join(blocks) or ('<p>Condition guides are being reviewed by Dr. Matarazzo. In the meantime, see '
                               '<a href="/services/">all services</a> or call <a href="tel:+15612028886">561-202-8886</a>.</p>')
    head = head_for(shell_head, title="Knee & Shoulder Conditions | Elite Sports Medicine",
                    desc="Guides to the knee and shoulder conditions Dr. Marc Matarazzo treats in Port St. Lucie and Palm Beach Gardens, from nonsurgical care to surgery.",
                    url=url, robots=ROBOTS_LIVE if live_slugs else ROBOTS_HELD,
                    crumbs=[("Home", f"{SITE}/"), ("Conditions", url)], extra_ld=[])
    main = f"""<main id="main">
{hero("Knee and Shoulder Conditions", "What each condition is, how it is treated with and without surgery, and when it is worth a surgical opinion.", [("Home", "/"), ("Conditions", "")])}
  <section class="section"><div class="container">{body}</div></section>
{cta}"""
    return head + main + shell_tail


def render_review(shell_head, shell_tail):
    rows = []
    for s, d in DETAILS.items():
        status = f"Reviewed {REVIEWED[s]}" if s in REVIEWED else "Waiting for Dr. Matarazzo (hidden from Google)"
        notes = "".join(f"<li>{esc(n)}</li>" for n in d.get("notes_for_reviewer", []))
        rows.append(f"""
        <div class="faq-item">
          <button class="faq-q" aria-expanded="false"><span>{esc(d["name"])} &middot; {status}</span><span class="plus"></span></button>
          <div class="faq-a"><p><a href="/conditions/{s}/">Open the guide</a> &middot; {len(d["sources"])} sources</p><p><strong>Please confirm:</strong></p><ul>{notes}</ul></div>
        </div>""")
    head = head_for(shell_head, title="Condition Guide Review | Elite Sports Medicine",
                    desc="Internal review list for condition guides.", url=f"{SITE}/conditions/review/",
                    robots="noindex, nofollow", crumbs=[("Home", f"{SITE}/"), ("Review", f"{SITE}/conditions/review/")], extra_ld=[])
    main = f"""<main id="main">
{hero("Condition guides: review", f"{len(DETAILS)} guides built, {len(DETAILS) - len(REVIEWED)} waiting. Each stays hidden from Google until Dr. Matarazzo has read it.", [("Home", "/"), ("Review", "")])}
  <section class="section"><div class="container container--narrow">
    <p>Read each guide as a patient would. Send corrections to Nick. When a guide is right, tell Nick the date you reviewed it; one line publishes it with "Medically reviewed by Marc F. Matarazzo, MD".</p>
    <div class="faq-list">{"".join(rows)}</div>
  </div></section>
"""
    return head + main + shell_tail


def write(path, page):
    if path.exists():
        graph = re.search(r"<!-- seo:graph -->.*?<!-- /seo:graph -->", path.read_text(encoding="utf-8"), re.S)
        if graph:  # keep seo.py's block so an unchanged guide is byte-identical
            page = page.replace("</head>", graph.group(0) + "\n</head>", 1)
    if not path.exists() or path.read_text(encoding="utf-8") != page:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(page, encoding="utf-8")
        return 1
    return 0


def main():
    global DETAILS
    shell = SHELL.read_text(encoding="utf-8")
    shell_head = shell.split('<main id="main">')[0]
    shell_tail = shell[shell.index("</main>"):]
    DETAILS = load()
    live = [s for s in DETAILS if s in REVIEWED]
    cta = cta_band()
    n = 0
    for s, d in DETAILS.items():
        n += write(ROOT / "conditions" / s / "index.html", render(shell_head, shell_tail, d, cta, live))
    n += write(ROOT / "conditions" / "index.html", render_hub(shell_head, shell_tail, live, cta))
    n += write(ROOT / "conditions" / "review" / "index.html", render_review(shell_head, shell_tail))
    print(f"conditions: {len(DETAILS)} guide(s), {len(live)} reviewed, {n} file(s) written")
    return 0


DETAILS = {}

if __name__ == "__main__":
    try:
        sys.exit(main())
    except BuildError as e:
        print(f"conditions.py: {e}", file=sys.stderr)
        sys.exit(1)
