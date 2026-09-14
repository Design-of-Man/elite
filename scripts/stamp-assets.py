#!/usr/bin/env python3
"""Stamp a content hash onto the CSS and JS query strings in every HTML file.

Vercel serves /assets/* as `immutable, max-age=604800`, so a browser that has
fetched v2.css will not revalidate it for a week. The only thing that makes it
refetch is a different URL. A hand-typed token gets forgotten -- it was left at
"hero1" across three separate stylesheet rewrites, and every visitor kept the
first one. Deriving the token from the file's own bytes removes the judgement
call: change the file, the URL changes.

Run after any edit to assets/css/v2.css or assets/js/main.js.
"""
import hashlib
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
ASSETS = {
    "css": ROOT / "assets" / "css" / "v2.css",
    "js": ROOT / "assets" / "js" / "main.js",
}


def short_hash(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()[:10]


def main():
    tokens = {kind: short_hash(p) for kind, p in ASSETS.items()}
    patterns = {
        "css": re.compile(r'(href="/assets/css/v2\.css)(?:\?v=[^"]*)?(")'),
        "js": re.compile(r'(src="/assets/js/main\.js)(?:\?v=[^"]*)?(")'),
    }

    changed = 0
    for html in sorted(ROOT.rglob("*.html")):
        if ".git" in html.parts:
            continue
        original = html.read_text(encoding="utf-8")
        text = original
        for kind, pattern in patterns.items():
            text = pattern.sub(rf'\g<1>?v={tokens[kind]}\g<2>', text)
        if text != original:
            html.write_text(text, encoding="utf-8")
            changed += 1

    print(f"css={tokens['css']} js={tokens['js']} -> {changed} file(s) restamped")
    return 0


if __name__ == "__main__":
    sys.exit(main())
