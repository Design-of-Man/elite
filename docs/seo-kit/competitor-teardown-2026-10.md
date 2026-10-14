# Competitor teardown, 2026-10-14

Internal evidence only. Nothing here goes on the site, in a listing or in any message:
never name, report or disparage another practice.

**How it was gathered.** Each homepage or location page was fetched directly and
parsed for title, H1, JSON-LD types and visible word count (raw HTML kept out of the
repo). The Google map pack itself could not be pulled: the Firecrawl account was out of
credits and Google blocks direct fetches, so map-pack positions and Google review
counts are **not recorded here**. Recording them is task 3 in
`docs/COWORK-LOCAL-FIXES.md` (a signed-in browser sees them). Competitors were chosen
from web results for "orthopedic surgeon Port St. Lucie", "orthopedic doctor Palm
Beach Gardens sports medicine knee" and "MAKO robotic knee replacement Palm Beach
Gardens".

## Port St. Lucie

| Site | Page | Title | H1 | JSON-LD types | Words | Reviews shown on page | Office in PSL |
|---|---|---|---|---|---|---|---|
| South Florida Orthopaedics & Sports Medicine (southflaortho.com) | Home | South Florida Orthopaedics & Sports Medicine - Treasure Coast | "24/7/365", "Comprehensive Orthopaedic Care" | Organization, WebSite, WebPage, BreadcrumbList (plugin default) | 1,657 | none | Yes, Tradition (9401 SW Discovery Way), plus Stuart; walk-in injury clinic |
| South Florida Orthopaedics & Sports Medicine | Tradition location page | Orthopaedic Clinic in Tradition (Port St. Lucie) | Orthopaedic Clinic in Tradition (Port St. Lucie, FL) | same plugin default | 1,148 | none | Yes |
| Robert Sellards, MD (robertsellardsmd.com) | Home | Orthopedic Surgeon Port St. Lucie FL - Robert Sellards MD - Stuart FL | Robert Sellards, MD, joint replacement and sports medicine | Physician, MedicalSpecialty, OpeningHoursSpecification, GeoCoordinates | 649 | none | Yes, US-1 |
| Coastal Orthopaedic & Sports Medicine Center (coastal-orthopaedic.com) | Home | not readable (script-rendered) | none in HTML | none in HTML | 803 | a review platform advertises 1,000+ ratings for one of its surgeons | Yes, US-1 |
| Cleveland Clinic (Tradition HealthPark) | directory only | | | | | 238 ratings for one sports medicine surgeon (provider directory) | Yes |
| **Elite** | /areas-we-serve/port-st-lucie-fl/ | Orthopedic Doctor in Port St. Lucie, FL \| Dr. Marc Matarazzo | Orthopedic Doctor in Port St. Lucie | MedicalClinic, MedicalProcedure, BreadcrumbList, OpeningHoursSpecification, GeoCoordinates, SpeakableSpecification | 1,072 | none (0 Google reviews) | Yes, SW St. Lucie West Blvd |

## Palm Beach Gardens

| Site | Page | Title | H1 | JSON-LD types | Words | Reviews shown on page | Office in PBG |
|---|---|---|---|---|---|---|---|
| Palm Beach Orthopaedic Institute (pboi.com) | Home | Palm Beach Orthopaedic Institute \| Orthopedic Care West Palm Beach | "Services Orthopedic Wellness for the Whole Body" | Hospital, AggregateRating (self-serving), ReserveAction | 1,466 | rating markup only | Yes, Burns Rd (38,000 sq ft), plus four other towns |
| Atlantis Orthopaedics (atlantisortho.com) | Home | Homepage - Atlantis Orthopaedics | none | Organization, WebSite, WebPage, BreadcrumbList (plugin default) | 715 | none | Yes, Village Square Crossing; hospital-system affiliated |
| Palm Beach Sports Medicine & Orthopaedic Center | hospital-network page | blocked (403) | | | | | Yes, Burns Rd; hospital-network practice |
| **Elite** | Home | Orthopedic Doctor & Sports Medicine \| Port St. Lucie & Palm Beach Gardens | Elite orthopedic care, built like an athlete's recovery plan | MedicalBusiness + MedicalClinic with two department clinics, Physician (now Physician + Person) with NPI, credentials and verified sameAs, OpeningHoursSpecification, GeoCoordinates | 995 | none | Yes, Prosperity Farms Rd |

## Conclusion

**Not schema.** Elite's structured data is the most complete of every page fetched;
two competitors run plugin defaults and one uses self-serving AggregateRating markup,
which Google ignores at best. No competitor page is meaningfully deeper.

What the winners have that Elite does not:

1. **Review volume on Google.** Elite has zero on both profiles. The 128 reviews
   written about Dr. Matarazzo sit on two practitioner listings at his former
   employer's offices.
2. **More surgeons and more doors.** Every PSL competitor is a group with several
   surgeons; one runs a walk-in injury clinic in Tradition. Proximity cannot be
   changed, so the counterweight is reviews and a distinct offer.
3. **Hospital-system names.** Two PBG competitors are hospital-network practices. Elite's
   equivalent proof is real and sourced: Florida's first MISHA implant, announced by
   Jupiter Medical Center on February 25, 2026. It is now on the bio and MISHA pages
   with the link.
4. **Distinct procedures.** MISHA is the one procedure no competitor page fetched
   mentions. The MISHA page now carries the FDA indication, a comparison table and
   coverage status, which is where that advantage turns into search visibility.
