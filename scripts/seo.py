#!/usr/bin/env python3
"""Regenerate the per-page schema graph and the sitemap.

This site is hand-written HTML, so anything that has to be identical on 50
pages drifts unless a script owns it. Two things qualify:

  1. The WebSite + WebPage nodes that tie every page back to the one
     organization node on the homepage (@id .../#organization). Without them
     each page's Physician/MedicalProcedure node floats unattached and search
     engines have to guess that they belong to the same practice.
  2. <lastmod> in sitemap.xml. It used to be one frozen date stamped on every
     URL, which is a signal Google learns to discount. Dates now come from the
     last commit that changed the page's own content (see page_content()):
     its <main>, title, description, og:image or hand-written JSON-LD. Edits
     to the shared header, footer or asset cache-busters do not re-date it.

The graph block is delimited by the seo:graph markers and rewritten in place,
so running this repeatedly is a no-op until a page's title, description or
commit date actually changes.

Usage: python3 scripts/seo.py   (from anywhere; paths resolve off the repo)
"""
import html
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://elitesportsmed.org"
ORG = f"{SITE}/#organization"
WEBSITE = f"{SITE}/#website"
DEFAULT_IMAGE = f"{SITE}/assets/img/og-cover.jpg"
FALLBACK_DATE = "2026-09-14"

START = "<!-- seo:graph -->"
END = "<!-- /seo:graph -->"

# Pages whose subject is a treatment, procedure or clinical decision. Google
# reads MedicalWebPage differently from a generic WebPage, and these are the
# pages where that distinction is true.
CLINICAL_PREFIXES = (
    "services/",
    "regenerative-treatments/",
    "minimally-invasive-procedures/",
    "joint-replacements-shoulder-knee/",
    "mako-robotic-assisted-knee-replacement-system/",
    "second-opinions/",
    "conditions/",
)


def without_graph(doc):
    """The page minus the block this script writes, so its own output never
    counts as an edit to the page."""
    return re.sub(re.escape(START) + r".*?" + re.escape(END), "", doc, flags=re.S)


def page_content(doc):
    """What a page says, as opposed to the chrome every page shares.

    Dating on the whole file made every sitewide edit (a footer link, the
    header logo, the assistant's disclaimer, an asset cache-buster restamped
    by stamp-assets.py) re-date all 64 URLs to the same day: on 2026-10-14
    every <lastmod> in sitemap.xml read 2026-10-12 for exactly that reason.
    A page's date now moves only when its own <main>, title, description,
    og:image or hand-written JSON-LD changes. Files without a <main> fall back
    to the whole document.
    """
    doc = without_graph(doc)
    main = re.search(r"<main\b.*?</main>", doc, flags=re.S)
    if not main:
        return doc
    head = doc.split("</head>", 1)[0]
    keep = re.findall(r"<title>.*?</title>"
                      r'|<meta name="description" content=".*?">'
                      r'|<meta property="og:image" content=".*?">'
                      r'|<script type="application/ld\+json">.*?</script>',
                      head, flags=re.S)
    return "\n".join(keep) + "\n" + main.group(0)


def git(*args):
    return subprocess.run(["git", *args], cwd=ROOT, capture_output=True,
                          text=True, check=True).stdout


def git_dates(rel):
    """(first commit date, last content-change date) for a file, yyyy-mm-dd.

    The modified date skips commits whose only change to the file was inside
    the seo:graph block. Without that, committing this script's output (which
    carries dateModified) made the next run re-date every page to the day of
    that commit, and the run after that again, forever.
    """
    # --follow tracks renames, which is right for a page that moved. It is wrong
    # for a blog post rendered by scripts/blog.py: the page shell is ~95%
    # identical to every other page, so git reports a new post as a COPY of an
    # existing page and hands it that page's whole history (in testing, a post
    # published 2026-10-07 got datePublished 2026-08-19). Posts are never
    # renamed (the slug is the URL), so they are dated from their own commits.
    follow = [] if rel.startswith("blog/") and rel != "blog/index.html" else ["--follow"]
    try:
        log = git("log", *follow, "--format=%H %ad", "--date=short",
                  "--name-only", "--", rel).split("\n")
    except (subprocess.CalledProcessError, FileNotFoundError):
        return FALLBACK_DATE, FALLBACK_DATE
    # Entries come as "<sha> <date>", blank line, "<path at that commit>".
    commits = []
    header = re.compile(r"^[0-9a-f]{40} \d{4}-\d{2}-\d{2}$")
    for i, line in enumerate(log):
        parts = line.split()
        if len(parts) == 2 and len(parts[0]) == 40:
            path = next((p for p in log[i + 1:] if p.strip()), rel)
            # A merge commit lists no file names, so the next non-empty line is
            # the NEXT commit's header. Taking that as a path made content()
            # fail, read as "changed", and dated the page to the merge (every
            # merged PR re-dated the pages it carried). Reuse the last path.
            if header.match(path):
                path = commits[-1][2] if commits else rel
            commits.append((parts[0], parts[1], path))
    # The blog exemption above does not cover a new page hand-built from another
    # page's shell: /conditions/ pages built from a service page came out dated
    # to the day that service page was published. A rename leaves the old path
    # gone from the tree; a "copy" leaves it still tracked. So history stops at
    # the first commit whose path is some other page that still exists.
    tracked = set(git("ls-files").split("\n"))
    for i, (_, _, path) in enumerate(commits):
        if path != rel and path in tracked:
            commits = commits[:i]
            break
    if not commits:
        return FALLBACK_DATE, FALLBACK_DATE
    published = commits[-1][1]

    def content(sha, path):
        try:
            return page_content(git("show", f"{sha}:{path}"))
        except subprocess.CalledProcessError:
            return None

    newer = content(commits[0][0], commits[0][2])
    for i, (_, date, _) in enumerate(commits):
        older = (content(commits[i + 1][0], commits[i + 1][2])
                 if i + 1 < len(commits) else None)
        if newer != older:
            return published, date
        newer = older
    return published, published


def meta(doc, pattern):
    m = re.search(pattern, doc)
    return html.unescape(m.group(1)) if m else ""


def page_url(rel):
    if rel == "index.html":
        return f"{SITE}/"
    return f"{SITE}/{rel[:-len('index.html')]}"


def graph_for(rel, doc):
    url = page_url(rel)
    title = meta(doc, r"<title>(.*?)</title>")
    desc = meta(doc, r'<meta name="description" content="(.*?)">')
    image = meta(doc, r'<meta property="og:image" content="(.*?)">') or DEFAULT_IMAGE
    published, modified = git_dates(rel)
    clinical = any(rel.startswith(p) for p in CLINICAL_PREFIXES)

    page = {
        "@type": "MedicalWebPage" if clinical else "WebPage",
        "@id": f"{url}#webpage",
        "url": url,
        "name": title,
        "description": desc,
        "inLanguage": "en-US",
        "isPartOf": {"@id": WEBSITE},
        "about": {"@id": ORG},
        "primaryImageOfPage": {"@type": "ImageObject", "url": image},
        "datePublished": published,
        "dateModified": modified,
    }
    if clinical:
        page["audience"] = {"@type": "MedicalAudience", "audienceType": "Patient"}
    # The hero heading and lede are what a voice assistant should read back.
    # If .hero h1 / .hero-lede are ever renamed, update these selectors.
    if '"hero-lede"' in doc:
        page["speakable"] = {
            "@type": "SpeakableSpecification",
            "cssSelector": [".hero h1", ".hero-lede"],
        }
    return {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebSite",
                "@id": WEBSITE,
                "url": f"{SITE}/",
                "name": "Elite Sports Medicine",
                "inLanguage": "en-US",
                "publisher": {"@id": ORG},
            },
            page,
        ],
    }


def indexable(doc):
    return "noindex" not in meta(doc, r'<meta name="robots" content="(.*?)">')


def main():
    pages, urls = [], []
    for path in sorted(ROOT.rglob("*.html")):
        if ".git" in path.parts:
            continue
        rel = path.relative_to(ROOT).as_posix()
        if rel == "404.html":
            continue
        doc = path.read_text(encoding="utf-8")
        if not indexable(doc):
            # Still strip a stale block if the page was de-indexed later.
            cleaned = re.sub(re.escape(START) + r".*?" + re.escape(END) + r"\n?",
                             "", doc, flags=re.S)
            if cleaned != doc:
                path.write_text(cleaned, encoding="utf-8")
                pages.append(rel)
            continue

        block = (START + "\n<script type=\"application/ld+json\">"
                 + json.dumps(graph_for(rel, doc), separators=(", ", ": "))
                 + "</script>\n" + END)
        if START in doc:
            new = re.sub(re.escape(START) + r".*?" + re.escape(END),
                         lambda _: block, doc, flags=re.S)
        else:
            new = doc.replace("</head>", block + "\n</head>", 1)
        if new != doc:
            path.write_text(new, encoding="utf-8")
            pages.append(rel)
        urls.append((page_url(rel), git_dates(rel)[1]))

    sitemap = ['<?xml version="1.0" encoding="UTF-8"?>',
               '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for url, lastmod in sorted(urls):
        sitemap.append(f"  <url><loc>{url}</loc><lastmod>{lastmod}</lastmod></url>")
    sitemap.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(sitemap) + "\n", encoding="utf-8")

    print(f"schema: {len(pages)} page(s) updated")
    print(f"sitemap: {len(urls)} url(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
