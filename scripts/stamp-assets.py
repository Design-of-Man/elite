#!/usr/bin/env python3
"""Minify the stylesheet and script, then stamp a content hash onto every page's
reference to them.

  assets/css/v2.css   (the source you edit)  ->  assets/css/v2.min.css  (served)
  assets/js/main.js   (the source you edit)  ->  assets/js/main.min.js  (served)

Pages link the .min files. Never edit a .min file by hand: the next run
overwrites it from the source. Both .min files are committed, because Vercel
serves this repo as-is with no build step.

Why minify (2026-11-06): Semrush flagged 132 "unminified JavaScript and CSS"
warnings (two per page) and Lighthouse put ~20 KB of whitespace and comments on
the render-blocking path of every page. The sources keep their comments, which
are the site's documentation, so they stay the files people read and edit.

The minifiers below are deliberately conservative and dependency-free (this
repo's scripts run on a bare python3):
  * CSS: drops comments, collapses whitespace, removes spaces around { } ; , >
    and after ':', and the last ';' in a block. Never touches spaces next to
    '(' ')' '+' '-' (`and (`, calc()) or before ':' (`.x :focus` is a
    descendant selector).
  * JS: drops comments and indentation and joins tokens, but keeps a line break
    wherever the source had one unless the break sits after { ; , ( [ or before
    } ) ] ; , . ? : -- so automatic semicolon insertion reads the file exactly as
    it read the source. Strings, regex literals and template literals are copied
    byte for byte. A template literal containing a nested template literal
    inside ${...} is not supported (main.js has none); the run fails loudly
    rather than guess.

Why stamp: Vercel serves /assets/css and /assets/js as `immutable` for a year,
so a browser that has fetched v2.min.css will not revalidate it. The only thing
that makes it refetch is a different URL. A hand-typed token gets forgotten --
it was left at "hero1" across three separate stylesheet rewrites, and every
visitor kept the first one. Deriving the token from the served file's own bytes
removes the judgement call: change the file, the URL changes.

Run after any edit to assets/css/v2.css or assets/js/main.js.
"""
import hashlib
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
ASSETS = {
    "css": (ROOT / "assets" / "css" / "v2.css", ROOT / "assets" / "css" / "v2.min.css"),
    "js": (ROOT / "assets" / "js" / "main.js", ROOT / "assets" / "js" / "main.min.js"),
}


# ----------------------------------------------------------------------------
# CSS
# ----------------------------------------------------------------------------
def minify_css(src):
    out = []
    i, n = 0, len(src)
    pending_space = False

    def emit(tok):
        nonlocal pending_space
        if pending_space and out:
            prev = out[-1][-1]
            if prev not in "{};,>:" and tok[0] not in "{};,>":
                out.append(" ")
        pending_space = False
        out.append(tok)

    while i < n:
        c = src[i]
        if src.startswith("/*", i):
            end = src.find("*/", i + 2)
            if end < 0:
                raise ValueError("unterminated CSS comment")
            i = end + 2
            pending_space = True
        elif c in " \t\r\n\f":
            while i < n and src[i] in " \t\r\n\f":
                i += 1
            pending_space = True
        elif c in "\"'":
            j = i + 1
            while j < n and src[j] != c:
                j += 2 if src[j] == "\\" else 1
            emit(src[i:j + 1])
            i = j + 1
        elif src.startswith("url(", i) or src.startswith("URL(", i):
            j = src.find(")", i)
            emit(src[i:j + 1])
            i = j + 1
        else:
            if c in "{};,>:":
                j = i + 1
            else:
                j = i
                while (j < n and src[j] not in " \t\r\n\f\"'{};,>:"
                       and not src.startswith("/*", j)
                       and not (j > i and src.startswith("url(", j))):
                    j += 1
            tok = src[i:j]
            if tok == "}" and out and out[-1] == ";":
                out.pop()  # last declaration needs no semicolon
                pending_space = False
            emit(tok)
            i = j
    return "".join(out).strip() + "\n"


# ----------------------------------------------------------------------------
# JS
# ----------------------------------------------------------------------------
IDENT = re.compile(r"[A-Za-z0-9_$\u0080-￿]")
# After these keywords a '/' starts a regex literal, not a division.
REGEX_AFTER_WORDS = {"return", "typeof", "case", "in", "of", "new", "delete", "void",
                     "throw", "instanceof", "do", "else", "yield", "await"}
NO_BREAK_AFTER = set("{;,([")
NO_BREAK_BEFORE = set("});],.?:")


def minify_js(src):
    toks = []          # list of [text, ws_before] ; ws_before: None, " " or "\n"
    ws = None
    i, n = 0, len(src)

    def last_sig():
        return toks[-1][0] if toks else ""

    def regex_allowed():
        t = last_sig()
        if not t:
            return True
        if t in REGEX_AFTER_WORDS:
            return True
        if t[-1] in ")]}" or IDENT.match(t[-1]):
            return False
        return True

    def add(text):
        nonlocal ws
        toks.append([text, ws])
        ws = None

    while i < n:
        c = src[i]
        if c in " \t\r\n\f\v ﻿":
            j = i
            while j < n and src[j] in " \t\r\n\f\v ﻿":
                j += 1
            ws = "\n" if ("\n" in src[i:j] or ws == "\n") else (ws or " ")
            i = j
        elif src.startswith("//", i):
            j = src.find("\n", i)
            i = n if j < 0 else j
            ws = ws or " "
        elif src.startswith("/*", i):
            j = src.find("*/", i + 2)
            if j < 0:
                raise ValueError("unterminated JS comment")
            ws = "\n" if ("\n" in src[i:j] or ws == "\n") else (ws or " ")
            i = j + 2
        elif c in "\"'":
            j = i + 1
            while j < n and src[j] != c:
                if src[j] == "\n":
                    raise ValueError("unterminated JS string near offset %d" % i)
                j += 2 if src[j] == "\\" else 1
            add(src[i:j + 1])
            i = j + 1
        elif c == "`":
            j = i + 1
            while j < n and src[j] != "`":
                if src.startswith("${", j) and "`" in src[j:src.find("}", j)]:
                    raise ValueError("nested template literal near offset %d; "
                                     "the minifier does not support it" % i)
                j += 2 if src[j] == "\\" else 1
            add(src[i:j + 1])
            i = j + 1
        elif c == "/" and regex_allowed():
            j = i + 1
            in_class = False
            while j < n:
                ch = src[j]
                if ch == "\\":
                    j += 2
                    continue
                if ch == "\n":
                    raise ValueError("unterminated regex near offset %d" % i)
                if ch == "[":
                    in_class = True
                elif ch == "]":
                    in_class = False
                elif ch == "/" and not in_class:
                    break
                j += 1
            j += 1
            while j < n and IDENT.match(src[j]):
                j += 1  # flags
            add(src[i:j])
            i = j
        elif IDENT.match(c):
            j = i
            while j < n and IDENT.match(src[j]):
                j += 1
            add(src[i:j])
            i = j
        else:
            add(c)
            i += 1

    out = []
    for k, (text, before) in enumerate(toks):
        if before and out:
            prev = out[-1][-1]
            nxt = text[0]
            if before == "\n" and prev not in NO_BREAK_AFTER and nxt not in NO_BREAK_BEFORE:
                out.append("\n")
            elif IDENT.match(prev) and IDENT.match(nxt):
                out.append(" ")
            elif (prev == nxt and prev in "+-/") or (prev == "/" and nxt == "*"):
                out.append(" ")
        out.append(text)
    return "".join(out).strip() + "\n"


MINIFY = {"css": minify_css, "js": minify_js}


def short_hash(data):
    return hashlib.sha256(data).hexdigest()[:10]


def main():
    tokens = {}
    for kind, (source, target) in ASSETS.items():
        text = source.read_text(encoding="utf-8")
        minified = MINIFY[kind](text).encode("utf-8")
        if not target.exists() or target.read_bytes() != minified:
            target.write_bytes(minified)  # bytes, so Windows never writes CRLF
        tokens[kind] = short_hash(minified)
        print(f"{source.relative_to(ROOT).as_posix()}: {len(text.encode('utf-8'))} -> "
              f"{len(minified)} bytes")

    patterns = {
        "css": (re.compile(r'(href=")/assets/css/v2(?:\.min)?\.css(?:\?v=[^"]*)?(")'),
                "/assets/css/v2.min.css"),
        "js": (re.compile(r'(src=")/assets/js/main(?:\.min)?\.js(?:\?v=[^"]*)?(")'),
               "/assets/js/main.min.js"),
    }

    changed = 0
    for html in sorted(ROOT.rglob("*.html")):
        if ".git" in html.parts:
            continue
        original = html.read_bytes().decode("utf-8")
        text = original
        for kind, (pattern, url) in patterns.items():
            text = pattern.sub(rf'\g<1>{url}?v={tokens[kind]}\g<2>', text)
        if text != original:
            html.write_bytes(text.encode("utf-8"))
            changed += 1

    print(f"css={tokens['css']} js={tokens['js']} -> {changed} file(s) restamped")
    return 0


if __name__ == "__main__":
    sys.exit(main())
