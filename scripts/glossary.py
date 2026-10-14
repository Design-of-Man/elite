#!/usr/bin/env python3
"""Render the patient glossary at /orthopedic-glossary/ from one list of terms.

WHY A SCRIPT. The page carries two copies of every definition: the visible
<dl> a patient reads, and the DefinedTermSet JSON-LD a search engine or AI
assistant reads. Google treats structured data that says something the page
does not show as spam, so the two must never drift. Both are generated from
TERMS below, on every run, so they cannot.

WHAT IT WRITES, and nothing else: orthopedic-glossary/index.html. The page
shell (everything outside <main>, the header, footer, nav and stylesheet link)
is taken from conditions/index.html at run time, the same way scripts/blog.py
borrows the blog shell, so the glossary always ships the site's current
chrome. The seo:graph block already on the page is kept; run scripts/seo.py
afterwards as usual (it is idempotent).

TO EDIT A DEFINITION: change TERMS, run `python3 scripts/glossary.py`, then
`python3 scripts/seo.py`. Never hand-edit the generated page.

RULES FOR DEFINITIONS. Plain language, one or two sentences, general medical
meaning only. No outcome figures, no success rates, no prices, nothing about a
named patient. Where the site has a page on the subject, link it; the link is
the place for anything practice-specific.

Usage: python3 scripts/glossary.py   (from anywhere; paths resolve off the repo)
"""
import html
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://elitesportsmed.org"
SLUG = "orthopedic-glossary"
URL = f"{SITE}/{SLUG}/"
SHELL = ROOT / "conditions" / "index.html"
OUT = ROOT / SLUG / "index.html"

TITLE = "Orthopedic Glossary: Knee, Shoulder &amp; Sports Terms | Elite"
DESC = ("Plain-English definitions of the orthopedic terms patients hear: ACL, "
        "meniscus, MACI, MAKO, MISHA, arthroscopy, IME and more, from Elite "
        "Sports Medicine.")
H1 = "Orthopedic Glossary"
LEDE = ("The words you will hear in an orthopedic visit, explained in plain "
        "English. Each entry links to the page that covers it in more depth.")

# (term, definition HTML, optional link path)
TERMS = [
    ("ACL (anterior cruciate ligament)",
     "A ligament in the center of the knee that stops the shin bone sliding forward under the thigh bone and helps control twisting. It is commonly torn in pivoting sports.",
     "/conditions/acl-tear/"),
    ("ACL reconstruction",
     "Surgery that replaces a torn ACL with a graft, usually performed arthroscopically through small incisions.",
     "/services/acl-reconstruction/"),
    ("Arthritis",
     "Inflammation of a joint. In orthopedics the word most often means osteoarthritis, the wearing away of the cartilage that lines the joint.",
     "/conditions/knee-arthritis/"),
    ("Arthroplasty",
     "The surgical term for replacing or reconstructing a joint, as in total knee arthroplasty (total knee replacement).",
     "/joint-replacements-shoulder-knee/"),
    ("Arthroscopy",
     "Surgery performed through small incisions with a camera (the arthroscope) and slim instruments, so the surgeon can see and work inside the joint without opening it fully.",
     "/minimally-invasive-procedures/"),
    ("Articular cartilage",
     "The smooth, slippery tissue covering the ends of bones inside a joint. It has almost no blood supply, which is why damage to it rarely heals on its own.",
     "/services/articular-cartilage-restoration-and-maci-procedures/"),
    ("Autograft and allograft",
     "Tissue used to rebuild a ligament or fill a defect. An autograft comes from your own body; an allograft comes from a donor.",
     None),
    ("Board certification",
     "Certification by a specialty board after residency training and examinations. For orthopedic surgeons in the United States the board is the American Board of Orthopaedic Surgery.",
     "/marc-f-matarazzo/"),
    ("Bursitis",
     "Inflammation of a bursa, one of the small fluid-filled sacs that cushion tendons and muscles where they pass over bone.",
     None),
    ("Cartilage restoration",
     "Procedures that repair or replace damaged articular cartilage, such as microfracture, an osteochondral graft or MACI.",
     "/services/articular-cartilage-restoration-and-maci-procedures/"),
    ("CME (compulsory medical examination)",
     "A formal medical assessment required for a legal, insurance or employment purpose, performed by a physician who is not treating the person examined.",
     "/services/compulsory-medical-examination/"),
    ("Corticosteroid (cortisone) injection",
     "An anti-inflammatory medicine injected into or near a joint to calm pain and swelling. It treats symptoms rather than the underlying damage.",
     None),
    ("CT scan",
     "Computed tomography: a series of X-rays combined into detailed cross-sectional images of bone. MAKO robotic surgery is planned on a CT scan of your joint.",
     "/mako-robotic-assisted-knee-replacement-system/"),
    ("Effusion",
     "Excess fluid inside a joint, often called &ldquo;water on the knee.&rdquo; It is a sign that something in the joint is irritated or injured.",
     None),
    ("Fellowship",
     "Additional training of a year or more after residency, focused on one area of a specialty, such as sports medicine and arthroscopy.",
     "/marc-f-matarazzo/"),
    ("IME (independent medical examination)",
     "An examination by a physician who is not treating the patient, requested by an insurer, employer or attorney to answer questions about an injury. It is an assessment, not treatment.",
     "/services/independent-medical-examinations/"),
    ("Implantable shock absorber",
     "A device placed outside the knee joint, on its inner side, that takes load off a worn medial compartment without removing bone or cartilage. The MISHA Knee System is one.",
     "/services/misha-minimally-invasive-implantable-shock-absorber-implant/"),
    ("Ligament",
     "A tough band of tissue that connects one bone to another and keeps a joint stable.",
     "/services/knee-ligaments-reconstructions/"),
    ("MACI",
     "Matrix-induced autologous chondrocyte implantation. Some of your own cartilage cells are taken, grown in a laboratory, and implanted on a membrane into a cartilage defect.",
     "/services/articular-cartilage-restoration-and-maci-procedures/"),
    ("MAKO robotic-assisted surgery",
     "A robotic-arm system made by Stryker and used in joint replacement. The operation is planned on a 3D model built from a CT scan, and the surgeon performs it with the arm keeping the instruments to that plan.",
     "/services/mako-total-and-partial-knee-replacement/"),
    ("Medial and lateral",
     "Medial means the inner side of a joint, toward the middle of the body; lateral means the outer side.",
     None),
    ("Medial compartment",
     "The inner part of the knee joint, where the inner end of the thigh bone meets the shin bone.",
     "/conditions/knee-arthritis/"),
    ("Meniscus",
     "One of two C-shaped cartilage cushions between the thigh bone and the shin bone in each knee. Tears cause pain, swelling, catching or locking.",
     "/conditions/meniscus-tear/"),
    ("Meniscus repair and meniscectomy",
     "Two ways of treating a torn meniscus. A repair stitches the tear so it can heal; a meniscectomy trims away the torn part.",
     "/services/meniscus-repair/"),
    ("MISHA Knee System",
     "An implantable shock absorber for osteoarthritis on the inner side of the knee. The FDA authorized it in April 2023.",
     "/services/misha-minimally-invasive-implantable-shock-absorber-implant/"),
    ("MRI",
     "Magnetic resonance imaging, which shows soft tissue such as ligaments, tendons, the meniscus and cartilage in detail, without radiation.",
     None),
    ("Orthobiologics",
     "Treatments that use substances from your own body, such as concentrated platelets, to support the repair of tendons, ligaments, cartilage and joints.",
     "/services/orthobiologics-regenerative-orthopedic-therapies/"),
    ("Orthopedic surgeon",
     "A physician who specializes in bones, joints, ligaments, tendons and muscles, and treats them both surgically and without surgery.",
     "/marc-f-matarazzo/"),
    ("Osteoarthritis",
     "Gradual wear of the cartilage lining a joint, causing pain, stiffness and swelling.",
     "/conditions/knee-arthritis/"),
    ("Partial knee replacement",
     "Surgery that resurfaces only the damaged compartment of the knee and keeps the rest of the joint, including healthy ligaments. Also called unicompartmental knee replacement.",
     "/services/partial-knee-replacement/"),
    ("Patella and patellar dislocation",
     "The patella is the kneecap. A patellar dislocation is when it slips out of its groove at the end of the thigh bone, usually toward the outside of the knee.",
     "/services/patellar-dislocation-surgery/"),
    ("PRP (platelet-rich plasma)",
     "A concentrate of platelets prepared from a sample of your own blood and injected into an injured tendon, ligament or joint.",
     "/services/prp-injections/"),
    ("Reverse shoulder replacement",
     "A shoulder replacement in which the ball and socket swap places, so the deltoid muscle can lift the arm when the rotator cuff no longer works.",
     "/services/reverse-shoulder-replacement/"),
    ("Rotator cuff",
     "Four muscles and their tendons around the shoulder joint that keep the ball centered in the socket and help lift and rotate the arm.",
     "/services/rotator-cuff-repair/"),
    ("Second opinion",
     "A review of your diagnosis and treatment plan by another surgeon, usually before committing to an operation.",
     "/second-opinions/"),
    ("Shockwave therapy",
     "A non-surgical, in-office treatment that delivers acoustic pressure waves to persistent tendon and soft-tissue problems.",
     "/services/shockwave-therapy/"),
    ("Sports medicine",
     "The diagnosis, treatment, rehabilitation and prevention of injuries that happen during sport, exercise and everyday activity.",
     "/services/sports-medicine/"),
    ("Tendon and tendinopathy",
     "A tendon connects muscle to bone. Tendinopathy is a painful, worn or irritated tendon, often from overuse.",
     None),
    ("Total knee replacement",
     "Surgery that resurfaces the worn ends of the thigh bone, shin bone and usually the kneecap with metal and plastic implants.",
     "/services/total-knee-replacement/"),
    ("Total shoulder replacement",
     "Surgery that replaces the worn ball and socket of the shoulder joint with implants.",
     "/services/total-shoulder-replacement-surgery-elite-sports-medicine/"),
    ("Varus and valgus",
     "Ways a leg can be aligned. Varus is bow-legged, which loads the inner side of the knee; valgus is knock-kneed, which loads the outer side.",
     None),
    ("Workers&rsquo; compensation",
     "The insurance system that covers medical care and lost wages for injuries that happen on the job.",
     "/services/workers-compensation-injuries/"),
]

T_START, T_END = "<!-- glossary:terms -->", "<!-- /glossary:terms -->"
S_START, S_END = "<!-- glossary:schema -->", "<!-- /glossary:schema -->"
G_START, G_END = "<!-- seo:graph -->", "<!-- /seo:graph -->"


def slugify(term):
    text = html.unescape(re.sub(r"<[^>]+>", "", term)).lower()
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-")


def plain(fragment):
    return html.unescape(re.sub(r"<[^>]+>", "", fragment)).strip()


def letter_of(term):
    return plain(term)[0].upper()


def render_terms():
    terms = sorted(TERMS, key=lambda t: plain(t[0]).lower())
    letters = sorted({letter_of(t[0]) for t in terms})
    nav = "\n".join(f'        <li><a href="#letter-{l.lower()}">{l}</a></li>' for l in letters)
    out = [T_START,
           '      <nav class="glossary-index" aria-label="Glossary letters">',
           '        <ul>', nav, '        </ul>', '      </nav>']
    current = None
    for term, definition, link in terms:
        letter = letter_of(term)
        if letter != current:
            if current is not None:
                out.append("      </dl>")
            out.append(f'      <h2 class="glossary-letter" id="letter-{letter.lower()}">{letter}</h2>')
            out.append('      <dl class="glossary-list">')
            current = letter
        more = f' <a href="{link}">More on {html.escape(plain(term))}</a>' if link else ""
        out.append(f'        <dt id="{slugify(term)}">{term}</dt>')
        out.append(f"        <dd>{definition}{more}</dd>")
    out.append("      </dl>")
    out.append(T_END)
    return "\n".join(out)


def render_schema():
    terms = sorted(TERMS, key=lambda t: plain(t[0]).lower())
    data = {
        "@context": "https://schema.org",
        "@type": "DefinedTermSet",
        "@id": f"{URL}#glossary",
        "name": "Orthopedic glossary",
        "url": URL,
        "inLanguage": "en-US",
        "publisher": {"@id": f"{SITE}/#organization"},
        "hasDefinedTerm": [
            {
                "@type": "DefinedTerm",
                "@id": f"{URL}#{slugify(t)}",
                "name": plain(t),
                "description": plain(d),
                "url": f"{URL}#{slugify(t)}",
                "inDefinedTermSet": {"@id": f"{URL}#glossary"},
            }
            for t, d, _ in terms
        ],
    }
    crumbs = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{SITE}/"},
            {"@type": "ListItem", "position": 2, "name": H1, "item": URL},
        ],
    }
    return (S_START + "\n<script type=\"application/ld+json\">"
            + json.dumps(data, ensure_ascii=False, separators=(", ", ": "))
            + "</script>\n<script type=\"application/ld+json\">"
            + json.dumps(crumbs, separators=(", ", ": ")) + "</script>\n" + S_END)


MAIN = f"""<main id="main">

  <section class="hero hero--dark hero--service">
    <div class="hero-glow"></div>
    <div class="container">
      <nav class="crumbs" aria-label="Breadcrumb">
        <ol><li><a href="/">Home</a><svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></li><li><span aria-current="page">{H1}</span></li></ol>
      </nav>
      <div class="hero-rule" aria-hidden="true"></div>
      <h1 data-split-words>{H1}</h1>
      <p class="hero-lede">{LEDE}</p>
      <div class="hero-actions">
        <a class="btn btn--gold" href="/schedule-appointment/">Schedule a Consultation</a>
        <a class="btn btn--outline" href="tel:+15612028886">561-202-8886</a>
      </div>
    </div>
  </section>
  <section class="section">
    <div class="container container--reading glossary">
      <p>These are general definitions, not advice about your own knee or shoulder. What a term means for you is something to ask Dr. Matarazzo at your visit. For conditions, start with <a href="/conditions/">conditions we treat</a>; for questions about appointments and insurance, see the <a href="/faq/">FAQ</a>.</p>
{{terms}}
    </div>
  </section>

  <section class="cta-band">
    <div class="container reveal">
      <h2>Have a question the glossary does not answer?</h2>
      <div style="margin-top:var(--sp-lg)">
        <a class="btn btn--gold" href="/schedule-appointment/">Schedule Appointment</a>
        <a class="btn btn--outline" href="tel:+15612028886">Call 561-202-8886</a>
      </div>
    </div>
  </section>

</main>"""


def sub_once(pattern, repl, text):
    new, n = re.subn(pattern, lambda _: repl, text, count=1, flags=re.S)
    if n != 1:
        sys.exit(f"glossary.py: shell pattern not found: {pattern[:60]}")
    return new


def main():
    shell = SHELL.read_text(encoding="utf-8")
    page = shell
    page = sub_once(r"<title>.*?</title>", f"<title>{TITLE}</title>", page)
    page = sub_once(r'<meta name="description" content=".*?">', f'<meta name="description" content="{DESC}">', page)
    page = sub_once(r'<link rel="canonical" href=".*?">', f'<link rel="canonical" href="{URL}">', page)
    page = sub_once(r'<meta property="og:title" content=".*?">', f'<meta property="og:title" content="{TITLE}">', page)
    page = sub_once(r'<meta property="og:description" content=".*?">', f'<meta property="og:description" content="{DESC}">', page)
    page = sub_once(r'<meta property="og:url" content=".*?">', f'<meta property="og:url" content="{URL}">', page)
    # Drop the shell's own page-level JSON-LD (its breadcrumb) and its graph;
    # ours goes in their place.
    head, rest = page.split("</head>", 1)
    head = re.sub(r'<script type="application/ld\+json">.*?</script>\n?', "", head, flags=re.S)
    head = re.sub(re.escape(G_START) + r".*?" + re.escape(G_END) + r"\n?", "", head, flags=re.S)
    graph = ""
    if OUT.exists():
        m = re.search(re.escape(G_START) + r".*?" + re.escape(G_END), OUT.read_text(encoding="utf-8"), re.S)
        graph = m.group(0) + "\n" if m else ""
    head = head.rstrip("\n") + "\n\n" + render_schema() + "\n" + graph
    page = head + "</head>" + rest
    page = sub_once(r"<main id=\"main\">.*?</main>", MAIN.replace("{terms}", render_terms()), page)

    OUT.parent.mkdir(exist_ok=True)
    old = OUT.read_text(encoding="utf-8") if OUT.exists() else None
    if page != old:
        OUT.write_text(page, encoding="utf-8")
        print(f"glossary: {len(TERMS)} term(s), page written")
    else:
        print(f"glossary: {len(TERMS)} term(s), no change")
    return 0


if __name__ == "__main__":
    sys.exit(main())
