#!/usr/bin/env python3
"""Render blog posts from _posts/*.json into blog/{slug}/index.html, and list
them on /blog/.

WHY THIS EXISTS. The rest of this site is hand-written and has no build step.
Blog posts are the exception because they are not written here: the agency
portal (JARVIS, Design-of-Man/ClientPortal) publishes an approved draft by
committing ONE source file, _posts/{slug}.json, and nothing else. The rebuild
Action (.github/workflows/rebuild.yml) then runs this script and seo.py and
commits what they produce. The portal never writes page HTML, so the header,
footer, nav and stylesheet a post ships with are always this repo's current
ones, not a copy the portal took at some earlier date.

SOURCE FORMAT, one file per post:

    {
      "slug": "broken-shoulder-surgery",          # URL: /blog/{slug}/
      "title": "Broken Shoulder ...",              # plain text
      "date": "2026-10-05",                        # YYYY-MM-DD, shown to readers
      "description": "One or two sentences ...",   # meta description + card text
      "body_html": "<h2>...</h2>\n\n<p>...</p>"    # the article body, no <h1>
    }

WHAT IT WRITES, and nothing else:
  - blog/{slug}/index.html for every post. The page shell (everything outside
    <main>) is taken from blog/index.html at run time, with the title,
    description, canonical, Open Graph tags and breadcrumb swapped for the
    post's own. The seo:graph block is removed; seo.py writes the real one.
  - The cards between the blog:posts markers in blog/index.html, newest first.
    The hand-written cards after the end marker are left alone.

FAILS LOUDLY. Every substitution must match exactly once, or the script exits
non-zero and the Action fails. The portal reads a failed run as
`publish_failed` and pages #alerts, which is the right outcome: a post page
built from a shell this script no longer understands is worse than no page.

NO BYLINE. The source carries no author, so pages say "Elite Sports Medicine",
not "By Marc F. Matarazzo, MD". A physician byline is a claim about who wrote
or reviewed the article, and nothing on record says that happened for an
agency-written post. Add an author to the source format if that changes.

Idempotent: a run with nothing new rewrites every file byte-for-byte.
Usage: python3 scripts/blog.py   (from anywhere; paths resolve off the repo)
"""
import datetime
import html
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://elitesportsmed.org"
POSTS = ROOT / "_posts"
INDEX = ROOT / "blog" / "index.html"
CTA_SOURCE = ROOT / "minimally-invasive-procedures" / "index.html"

START = "<!-- blog:posts -->"
END = "<!-- /blog:posts -->"
SLUG = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

CRUMB_SEP = ('<svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" '
             'fill="none" stroke="currentColor" stroke-width="2">'
             '<polyline points="9 18 15 12 9 6"/></svg>')
ARROW = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" '
         'stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>')


class BuildError(Exception):
    pass


def esc(text):
    return html.escape(text, quote=True)


def sub_once(pattern, repl, doc, what):
    new, n = re.subn(pattern, lambda _: repl, doc, flags=re.S)
    if n != 1:
        raise BuildError(f"blog/index.html: expected exactly one {what}, found {n}. "
                         "The page shell changed; update scripts/blog.py to match.")
    return new


def human_date(iso):
    d = datetime.date.fromisoformat(iso)
    return f"{d.strftime('%B')} {d.day}, {d.year}"


def card_date(iso):
    d = datetime.date.fromisoformat(iso)
    return f"{d.strftime('%b')} {d.day}, {d.year}"


def load_posts():
    posts = []
    for path in sorted(POSTS.glob("*.json")):
        try:
            post = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            raise BuildError(f"{path.relative_to(ROOT)}: not valid JSON ({e})")
        for key in ("slug", "title", "date", "description", "body_html"):
            if not isinstance(post.get(key), str) or not post[key].strip():
                raise BuildError(f"{path.relative_to(ROOT)}: missing or empty '{key}'")
        if not SLUG.match(post["slug"]):
            raise BuildError(f"{path.relative_to(ROOT)}: slug '{post['slug']}' is not a-z0-9 and hyphens")
        if path.stem != post["slug"]:
            raise BuildError(f"{path.relative_to(ROOT)}: file name and slug '{post['slug']}' disagree")
        if not DATE.match(post["date"]):
            raise BuildError(f"{path.relative_to(ROOT)}: date '{post['date']}' is not YYYY-MM-DD")
        if (ROOT / post["slug"]).exists() and not (ROOT / "blog" / post["slug"]).exists():
            # Not a collision (posts live under /blog/), but a near-duplicate URL is
            # worth stopping on before it is indexed.
            raise BuildError(f"/{post['slug']}/ already exists as a page; pick a different slug")
        posts.append(post)
    # Newest first; slug breaks ties so the order never depends on the filesystem.
    posts.sort(key=lambda p: (p["date"], p["slug"]), reverse=True)
    return posts


def cta_band():
    """The site's closing call-to-action, copied from an existing article page."""
    if not CTA_SOURCE.exists():
        return ""
    m = re.search(r'\n  <section class="cta-band">.*?\n  </section>\n', CTA_SOURCE.read_text(encoding="utf-8"), re.S)
    return m.group(0) if m else ""


def render_post(shell_head, shell_tail, post, cta):
    url = f"{SITE}/blog/{post['slug']}/"
    title = esc(f"{post['title']} | Elite Sports Medicine")
    desc = esc(post["description"])
    crumbs = json.dumps({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{SITE}/"},
            {"@type": "ListItem", "position": 2, "name": "Blog", "item": f"{SITE}/blog/"},
            {"@type": "ListItem", "position": 3, "name": post["title"], "item": url},
        ],
    }, ensure_ascii=False)

    head = shell_head
    head = sub_once(r"<title>.*?</title>", f"<title>{title}</title>", head, "<title>")
    head = sub_once(r'<meta name="description" content=".*?">',
                    f'<meta name="description" content="{desc}">', head, "meta description")
    head = sub_once(r'<link rel="canonical" href=".*?">',
                    f'<link rel="canonical" href="{url}">', head, "canonical")
    head = sub_once(r'<meta property="og:type" content=".*?">',
                    '<meta property="og:type" content="article">', head, "og:type")
    head = sub_once(r'<meta property="og:title" content=".*?">',
                    f'<meta property="og:title" content="{title}">', head, "og:title")
    head = sub_once(r'<meta property="og:description" content=".*?">',
                    f'<meta property="og:description" content="{desc}">', head, "og:description")
    head = sub_once(r'<meta property="og:url" content=".*?">',
                    f'<meta property="og:url" content="{url}">', head, "og:url")
    head = sub_once(r'<script type="application/ld\+json">\{"@context": "https://schema.org", "@type": "BreadcrumbList".*?</script>',
                    f'<script type="application/ld+json">{crumbs}</script>', head, "BreadcrumbList")
    # seo.py owns this block and re-adds it with the post's own dates.
    head = re.sub(r"<!-- seo:graph -->.*?<!-- /seo:graph -->\n?", "", head, flags=re.S)

    main = f"""<main id="main">

  <section class="hero" style="min-height:42vh">
    <div class="hero-glow"></div>
    <div class="container">
      <nav class="crumbs" aria-label="Breadcrumb">
        <ol><li><a href="/">Home</a>{CRUMB_SEP}</li><li><a href="/blog/">Blog</a>{CRUMB_SEP}</li><li><span aria-current="page">{esc(post['title'])}</span></li></ol>
      </nav>
      <p class="eyebrow">Blog</p>
      <h1 data-split-words>{esc(post['title'])}</h1>
      <p class="hero-lede">Elite Sports Medicine &middot; <time datetime="{post['date']}">{human_date(post['date'])}</time></p>
    </div>
  </section>

  <section class="section">
    <div class="container container--reading">
{post['body_html'].strip(chr(10)).rstrip()}
    </div>
  </section>
{cta}
"""
    return head + main + shell_tail


def render_cards(posts):
    cards = []
    for i, post in enumerate(posts):
        cards.append(f"""        <div class="card reveal" style="--i:{i}">
          <span class="num">{card_date(post['date'])}</span>
          <h3>{esc(post['title'])}</h3>
          <p>{esc(post['description'])}</p>
          <a class="card-link" href="/blog/{post['slug']}/">Read the article {ARROW}</a>
        </div>""")
    return START + ("\n" + "\n".join(cards) + "\n        " if cards else "") + END


def main():
    index = INDEX.read_text(encoding="utf-8")
    if index.count(START) != 1 or index.count(END) != 1:
        raise BuildError(f"blog/index.html must contain exactly one '{START}' and one '{END}'.")
    if index.count('<main id="main">') != 1 or index.count("</main>") != 1:
        raise BuildError("blog/index.html must contain exactly one <main id=\"main\"> and one </main>.")

    shell_head = index.split('<main id="main">')[0]
    shell_tail = index[index.index("</main>"):]
    posts = load_posts()
    cta = cta_band()

    written = 0
    for post in posts:
        out = ROOT / "blog" / post["slug"] / "index.html"
        page = render_post(shell_head, shell_tail, post, cta)
        if out.exists():
            # Keep the schema block seo.py already wrote, at the spot seo.py puts it.
            # Dropping it on every run would rewrite every post page each time a new one
            # is published — a "Render blog posts" commit that touches a page counts as a
            # content change and moves that page's dateModified.
            graph = re.search(r"<!-- seo:graph -->.*?<!-- /seo:graph -->", out.read_text(encoding="utf-8"), re.S)
            if graph:
                page = page.replace("</head>", graph.group(0) + "\n</head>", 1)
        if not out.exists() or out.read_text(encoding="utf-8") != page:
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_text(page, encoding="utf-8")
            written += 1

    new_index = re.sub(re.escape(START) + r".*?" + re.escape(END),
                       lambda _: render_cards(posts), index, flags=re.S)
    if new_index != index:
        INDEX.write_text(new_index, encoding="utf-8")
        written += 1

    print(f"blog: {len(posts)} post(s), {written} file(s) written")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except BuildError as e:
        print(f"blog.py: {e}", file=sys.stderr)
        sys.exit(1)
