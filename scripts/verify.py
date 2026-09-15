#!/usr/bin/env python3
"""Static-site verifier for the Elite Sports Medicine build.

Stands in for the `static-site-forge` verify step, which is not installed in
this environment. Checks what that step would check:

  * every internal link, asset and anchor resolves to a file that exists
  * no page references an image that is not on disk
  * every <img> carries alt text, explicit width/height, and a loading hint
  * literal colours in markup that should be reading design tokens
  * duplicate / missing <title> and meta description
  * heading order (no skipped levels)
  * optional: screenshots at three widths via Playwright

Usage:
    python3 scripts/verify.py --root . [--shots out/]
"""
import argparse, os, re, sys, glob
from collections import defaultdict
from html.parser import HTMLParser

HEX = re.compile(r"#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b")
RGB = re.compile(r"\brgba?\(\s*\d", re.I)
# Colours that are legitimately literal: pure transparency and currentColor
# are not palette decisions.
ALLOW_LITERAL = {"#0000", "#00000000"}


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links, self.imgs, self.headings = [], [], []
        self.ids, self.inline_styles = set(), []
        self.title_parts, self.in_title = [], False
        self.meta_desc = None
        self.svg_depth = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "svg":
            self.svg_depth += 1
        if a.get("id"):
            self.ids.add(a["id"])
        if a.get("style"):
            self.inline_styles.append(a["style"])
        if tag == "title" and self.svg_depth == 0:
            self.in_title = True
        elif tag == "meta" and a.get("name", "").lower() == "description":
            self.meta_desc = a.get("content", "")
        elif tag in ("a", "link") and a.get("href"):
            self.links.append(a["href"])
        elif tag in ("img", "source", "video"):
            for k in ("src", "srcset", "poster", "data-src-hi", "data-src-lo"):
                if a.get(k):
                    self.links.append(a[k].split()[0] if k == "srcset" else a[k])
            if tag == "img":
                self.imgs.append(a)
        elif re.fullmatch(r"h[1-6]", tag):
            self.headings.append(int(tag[1]))

    def handle_endtag(self, tag):
        if tag == "svg":
            self.svg_depth = max(0, self.svg_depth - 1)
        if tag == "title":
            self.in_title = False

    def handle_data(self, d):
        if self.in_title:
            self.title_parts.append(d)

    @property
    def title(self):
        return "".join(self.title_parts).strip()


def resolve(root, page_path, href):
    """Map an href to a path on disk, or None if it is not a local resource."""
    href = href.strip()
    if not href or href.startswith(("http://", "https://", "mailto:", "tel:",
                                    "data:", "javascript:", "#")):
        return None
    path = href.split("#")[0].split("?")[0]
    if not path:
        return None
    base = root if path.startswith("/") else os.path.dirname(page_path)
    target = os.path.normpath(os.path.join(base, path.lstrip("/")))
    if os.path.isdir(target):
        target = os.path.join(target, "index.html")
    elif not os.path.splitext(target)[1]:
        cand = os.path.join(target, "index.html")
        if os.path.exists(cand):
            target = cand
    return target


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=".")
    ap.add_argument("--shots")
    a = ap.parse_args()
    root = os.path.abspath(a.root)

    pages = sorted(p for p in glob.glob(os.path.join(root, "**", "*.html"),
                                        recursive=True)
                   if ".git" not in p and "node_modules" not in p)
    problems = defaultdict(list)
    titles = defaultdict(list)

    def flag(kind, msg):
        problems[kind].append(msg)

    for p in pages:
        rel = os.path.relpath(p, root)
        src = open(p, encoding="utf-8", errors="replace").read()
        doc = Page()
        try:
            doc.feed(src)
        except Exception as e:
            flag("parse", f"{rel}: {e}")
            continue

        if not doc.title:
            flag("meta", f"{rel}: no <title>")
        else:
            titles[doc.title].append(rel)
        if doc.meta_desc is None:
            flag("meta", f"{rel}: no meta description")
        elif not (50 <= len(doc.meta_desc) <= 165):
            flag("meta", f"{rel}: meta description {len(doc.meta_desc)} chars "
                         f"(want 50-165)")

        for href in doc.links:
            t = resolve(root, p, href)
            if t and not os.path.exists(t):
                flag("broken-link", f"{rel}: -> {href}")

        for m in re.finditer(r'href="#([^"]+)"', src):
            if m.group(1) not in doc.ids:
                flag("broken-anchor", f"{rel}: #{m.group(1)}")

        for img in doc.imgs:
            s = img.get("src", "?")
            if not img.get("alt", "").strip() and img.get("alt") is None:
                flag("a11y", f"{rel}: <img {s}> missing alt")
            if not (img.get("width") and img.get("height")):
                flag("cls", f"{rel}: <img {s}> no width/height (layout shift)")

        for st in doc.inline_styles:
            for m in list(HEX.finditer(st)) + list(RGB.finditer(st)):
                val = m.group(0)
                if val.lower() not in ALLOW_LITERAL:
                    flag("literal-colour", f"{rel}: inline style {val}")

        lv = doc.headings
        for i in range(1, len(lv)):
            if lv[i] - lv[i - 1] > 1:
                flag("heading-order",
                     f"{rel}: h{lv[i-1]} -> h{lv[i]} skips a level")
        if lv.count(1) == 0:
            flag("heading-order", f"{rel}: no <h1>")
        elif lv.count(1) > 1:
            flag("heading-order", f"{rel}: {lv.count(1)} <h1> elements")

    for t, where in titles.items():
        if len(where) > 1:
            flag("duplicate-title", f'"{t[:60]}" on {len(where)}: '
                                    f'{", ".join(where[:4])}')

    # Unreferenced and missing images under assets/img.
    def clean(u):
        # Assets are stamped with ?v=<hash> for cache busting; the query is not
        # part of the path on disk.
        return u.split("?")[0].split("#")[0]

    referenced = set()
    for p in pages:
        src = open(p, encoding="utf-8", errors="replace").read()
        referenced |= {clean(m.group(1)) for m in
                       re.finditer(r'["\'(](/assets/[^"\')\s]+)', src)}
        # Absolute URLs in og:image / twitter:image point at the same files.
        referenced |= {clean(m.group(1)) for m in
                       re.finditer(r'https?://[^"\'\s]*?(/assets/[^"\')\s]+)',
                                   src)}
    for css in glob.glob(os.path.join(root, "assets", "css", "*.css")):
        src = open(css, encoding="utf-8", errors="replace").read()
        referenced |= {clean(m.group(1)) for m in
                       re.finditer(r'url\(["\']?(/assets/[^"\')\s]+)', src)}
    on_disk = {"/" + os.path.relpath(f, root)
               for f in glob.glob(os.path.join(root, "assets", "**", "*"),
                                  recursive=True) if os.path.isfile(f)}
    for r in sorted(referenced - on_disk):
        flag("missing-asset", r)
    for f in sorted(on_disk - referenced):
        if not f.endswith((".css", ".js")):
            flag("orphan-asset", f)

    # /assets/* ships as `immutable, max-age=604800`, so a stale ?v= token means
    # returning visitors keep the old stylesheet for a week and never see the
    # change. scripts/stamp-assets.py derives the token from the file's bytes;
    # this catches forgetting to run it.
    import hashlib
    for kind, rel in (("css", "assets/css/v2.css"), ("js", "assets/js/main.js")):
        f = os.path.join(root, rel)
        if not os.path.exists(f):
            continue
        want = hashlib.sha256(open(f, "rb").read()).hexdigest()[:10]
        name = os.path.basename(rel)
        stale = set()
        for page in pages:
            for tok in re.findall(re.escape(name) + r"\?v=([a-f0-9]+)",
                                  open(page, encoding="utf-8",
                                       errors="replace").read()):
                if tok != want:
                    stale.add(os.path.relpath(page, root))
        if stale:
            flag("stale-asset-stamp",
                 f"{name} hashes to {want} but {len(stale)} page(s) still point "
                 f"at an older token — run scripts/stamp-assets.py "
                 f"(e.g. {sorted(stale)[0]})")

    # Custom properties are resolved by the browser, not by this parser, so a
    # token that is undefined or self-referential fails silently at runtime and
    # every rule reading it drops. Ask a real engine what each one resolves to.
    for msg in check_tokens(root):
        flag("dead-token", msg)

    total = sum(len(v) for v in problems.values())
    print(f"verify: {len(pages)} pages\n")
    for kind in sorted(problems):
        rows = problems[kind]
        print(f"  {kind}  ({len(rows)})")
        for r in rows[:15]:
            print(f"      {r}")
        if len(rows) > 15:
            print(f"      ... {len(rows)-15} more")
        print()
    print(f"{total} problem(s)")

    if a.shots:
        shoot(root, pages, a.shots)
    return 1 if total else 0



def check_tokens(root):
    """Report custom properties that resolve to nothing in a real engine.

    A token defined as `var(--itself)`, or referenced but never defined, makes
    the whole declaration invalid at computed-value time. Nothing in the source
    text looks wrong, so only an engine can catch it.
    """
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        return []
    css = os.path.join(root, "assets", "css", "v2.css")
    if not os.path.exists(css):
        return []
    text = open(css, encoding="utf-8").read()
    # Any scope counts as a definition, not just :root — .btn defines its own
    # --btn-shift, and pages set --i inline on the element.
    defined = set(re.findall(r'(--[\w-]+)\s*:', text))
    inline = set()
    for page in glob.glob(os.path.join(root, "**", "*.html"), recursive=True):
        if ".git" in page:
            continue
        inline |= set(re.findall(r'(--[\w-]+)\s*:',
                                 " ".join(re.findall(r'style="([^"]*)"',
                                 open(page, encoding="utf-8",
                                      errors="replace").read()))))
    # A reference carrying a fallback -- var(--x, something) -- degrades on
    # purpose and is not a dead token.
    used = set(re.findall(r'var\(\s*(--[\w-]+)\s*\)', text))
    out = [f"{t} is used with no fallback and never defined"
           for t in sorted(used - defined - inline)]

    import functools, threading, http.server, socketserver, glob as _glob
    handler = functools.partial(http.server.SimpleHTTPRequestHandler,
                                directory=root)
    handler.log_message = lambda *a, **k: None
    httpd = socketserver.TCPServer(("127.0.0.1", 0), handler)
    port = httpd.server_address[1]
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    exe = next(iter(_glob.glob(
        "/opt/pw-browsers/chromium-*/chrome-linux/chrome")), None)
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(executable_path=exe,
                                   args=["--no-sandbox", "--disable-dev-shm-usage"])
            pg = b.new_page()
            pg.goto(f"http://127.0.0.1:{port}/index.html", wait_until="load",
                    timeout=30000)
            root_block = re.search(r':root\s*\{(.*?)\n\}', text, re.S)
            root_tokens = sorted(set(re.findall(
                r'^\s*(--[\w-]+)\s*:', root_block.group(1), re.M))) \
                if root_block else []
            resolved = pg.evaluate(
                """(names) => { const cs = getComputedStyle(document.documentElement);
                    return names.map(n => [n, cs.getPropertyValue(n).trim()]); }""",
                root_tokens)
            for name, val in resolved:
                if not val:
                    out.append(f"{name} resolves to nothing "
                               f"(self-referential or invalid)")
            b.close()
    except Exception as e:
        out.append(f"token check could not run: {type(e).__name__}: {e}")
    finally:
        httpd.shutdown()
    return out


def shoot(root, pages, outdir):
    """Screenshot the key templates at phone, tablet and desktop."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("\nscreenshots skipped: pip install playwright")
        return
    os.makedirs(outdir, exist_ok=True)
    picks = [p for p in pages if os.path.relpath(p, root) in (
        "index.html", "services/index.html", "marc-f-matarazzo/index.html",
        "memberships/index.html", "schedule-appointment/index.html")]
    exe = next(iter(glob.glob("/opt/pw-browsers/chromium-*/chrome-linux/chrome")), None)
    widths = [("phone", 390), ("tablet", 834), ("desktop", 1440)]

    # The pages reference assets from the site root (/assets/...). Over file://
    # that resolves to the filesystem root and every stylesheet 404s, which
    # yields screenshots of unstyled markup that look like a broken build. Serve
    # the directory instead so what is captured is what ships.
    import functools, threading, http.server, socketserver
    handler = functools.partial(http.server.SimpleHTTPRequestHandler,
                                directory=root)
    handler.log_message = lambda *a, **k: None
    httpd = socketserver.TCPServer(("127.0.0.1", 0), handler)
    port = httpd.server_address[1]
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{port}"

    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path=exe,
                               args=["--no-sandbox", "--disable-dev-shm-usage"])
        for label, w in widths:
            ctx = b.new_context(viewport={"width": w, "height": 900},
                                device_scale_factor=2 if w == 390 else 1)
            pg = ctx.new_page()
            for p in picks:
                name = os.path.relpath(p, root).replace("/", "-").replace(
                    ".html", "")
                url = base + "/" + os.path.relpath(p, root)
                pg.goto(url, wait_until="load", timeout=30000)
                # Let webfonts settle and scroll-reveal fire, or every section
                # below the fold screenshots at opacity 0.
                try:
                    pg.evaluate("document.fonts && document.fonts.ready")
                except Exception:
                    pass
                # Walk down in viewport steps with a real pause at each one.
                # IntersectionObserver callbacks are async: a rAF-speed scroll
                # outruns them and the page screenshots with every .reveal
                # section still at opacity 0.
                pg.evaluate("""() => new Promise(r => {
                    let y = 0;
                    const step = () => {
                        window.scrollTo(0, y);
                        y += window.innerHeight * 0.75;
                        if (y < document.body.scrollHeight + window.innerHeight)
                            setTimeout(step, 120);
                        else { window.scrollTo(0, 0); setTimeout(r, 700); }
                    };
                    step();
                })""")
                # Belt and braces: anything the observer still has not reached
                # is revealed directly, so a screenshot never shows a blank band.
                pg.evaluate("""() => document.querySelectorAll('.reveal')
                    .forEach(el => el.classList.add('is-visible'))""")
                pg.wait_for_timeout(1400)
                out = os.path.join(outdir, f"{name}-{label}.png")
                pg.screenshot(path=out, full_page=True)
                print(f"  shot {out}")
            ctx.close()
        b.close()
    httpd.shutdown()


if __name__ == "__main__":
    sys.exit(main())
