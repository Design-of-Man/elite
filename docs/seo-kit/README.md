# SEO and growth kit: START HERE

Everything from the October 2026 takeover audit is in this repo. This page says what
each file is, whether it is current, and which file wins when two disagree.

**Order of authority.** When two documents disagree, follow the first one on this list:
1. `CLAUDE.md` (repo rules and the practice's standing decisions)
2. The pages themselves and the scripts that own them (`scripts/seo.py`,
   `scripts/blog.py`, `scripts/glossary.py`, `scripts/stamp-assets.py`)
3. The dated audits in `docs/` listed below
4. This kit (`docs/seo-kit/`), which is evidence and reference

## The current plan and evidence (read these first)

| File | Status | What it is |
|---|---|---|
| `docs/GROWTH-PLAN-2026-10.md` | Current (2026-10-14) | Levers ranked, what the data says, what shipped in the takeover PR with before and after measurements, owner actions, questions for Nick, 90-day targets |
| `docs/GSC-DEEP-DIVE-2026-10.md` | Current (2026-10-14) | The five numbers, his name queries (including why "mark matarazzo" is not a target), striking distance by page, cannibalization, every change made from the data with its re-read date (2026-11-11) |
| `docs/LOCAL-AUTHORITY-AUDIT-2026-10.md` | Current (2026-10-14) | Why the map pack is not a schema problem, both Business Profiles, NPPES (individual and the two Ortho Florida organization NPIs), every citation error with who fixes it, specialty directories and earned links, brand plan |
| `docs/COWORK-LOCAL-FIXES.md` | Ready to run | Paste-ready Cowork prompt that fixes the listings in a browser. Owner-run, not Code |
| `docs/LISTINGS-AUDIT.md` | Current (2026-10-12), extended by the local authority audit | The original listing-by-listing record and the ELITE-only rule |
| `docs/PEPTIDE-MIGRATION.md` | Live | Why the peptide pages redirect to regenorthopb.com; explains most of the October click drop |
| `docs/CONTENT-PROVENANCE.md` | Resolved | The 2026-09 rewrite of copy shared with the previous marketer's site |

## The kit files

| File | Status | Use it for |
|---|---|---|
| `competitor-teardown-2026-10.md` | Current | Per-site evidence: title, H1, JSON-LD types, word count for the PSL and PBG competitors. Google review counts and map-pack positions still to be recorded (Cowork task 3) |
| `scripts/check_schema_visible_match.py` | Usable | Checks a page's JSON-LD against its visible text. Run it on any page whose JSON-LD you change: `python3 docs/seo-kit/scripts/check_schema_visible_match.py <page>/index.html` |

## Questions that keep coming up

**Is competitor schema why they rank higher?** No. Elite's markup is the most complete of
any page compared. They win on reviews (Elite has none on Google), more surgeons and
offices, and hospital-network names.

**The "mark matarazzo" impressions.** 16,331 in 90 days, mostly mobile and half from
outside the US. Searchers looking for someone else. Not a target; never put the
misspelling on the site.

**The team-physician line.** He was Assistant Team Physician to the NY Jets and NY
Islanders during his 2001 to 2002 Lenox Hill fellowship, and head team physician at
Palm Beach Atlantic University for more than ten years. Never "a decade as a Jets or
Islanders team physician".

**More town pages?** No. The six existing pages for towns without an office collect
generic impressions and no clicks. City intent is a Business Profile lever.

**The glossary.** Edit `TERMS` in `scripts/glossary.py`, run it, then `scripts/seo.py`.
Never hand-edit `/orthopedic-glossary/`.
