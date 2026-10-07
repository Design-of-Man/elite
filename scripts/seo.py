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
     last commit that changed the page outside the seo:graph block.

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
    follow = [] if (rel.startswith("blog/") and rel != "blog/index.html") or rel.startswith("conditions/") else ["--follow"]
    try:
        log = git("log", *follow, "--format=%H %ad", "--date=short",
                  "--name-only", "--", rel).split("\n")
    except (subprocess.CalledProcessError, FileNotFoundError):
        return FALLBACK_DATE, FALLBACK_DATE
    # Entries come as "<sha> <date>", blank line, "<path at that commit>".
    commits = []
    for i, line in enumerate(log):
        parts = line.split()
        if len(parts) == 2 and len(parts[0]) == 40:
            path = next((p for p in log[i + 1:] if p.strip()), rel)
            commits.append((parts[0], parts[1], path))
    if not commits:
        return FALLBACK_DATE, FALLBACK_DATE
    published = commits[-1][1]

    def content(sha, path):
        try:
            return without_graph(git("show", f"{sha}:{path}"))
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
    # reviewedBy/lastReviewed ONLY where a page carries the marker that
    # scripts/conditions.py writes for a guide Dr. Matarazzo has actually read
    # (its REVIEWED dict). Every other page still omits both, per CLAUDE.md.
    rv = re.search(r"<!-- reviewed: (\d{4}-\d{2}-\d{2}) -->", doc)
    if rv:
        page["reviewedBy"] = {"@id": f"{SITE}/#physician"}
        page["lastReviewed"] = rv.group(1)
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
