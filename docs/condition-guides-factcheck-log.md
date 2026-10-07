# ELITE Sports Medicine condition pages: independent fact-check log
Date: 2026-10-07. Method: /home/claude/research/FACTCHECK.md, with practice rules from /home/claude/research/elite/BRIEF.md.
Global checks, all 10 files: every procedure_links path is in the brief's list (PASS); writing-rule lint (dashes, banned words, exclamation marks, field lengths) PASS before and after edits; JSON valid after edits; no Medicare/insurance, price, outcome-rate, testimonial or hospital claims found.
Source URL resolution: bash curl is blocked by the sandbox proxy (403 CONNECT), so every cited URL was opened with WebFetch or Firecrawl instead. All resolved; doi.org/10.1016/S0140-6736(17)32457-1 returns a 302 to the Lancet (Elsevier) record. Europe PMC REST rate-limited (429) once; the knee-dislocation review was read through Firecrawl instead.

## acl-tear
- >200,000 ACL injuries/yr (AAOS) -> SUPPORTED -> kept
- Female 2 to 8 times male rate (AAOS) -> SUPPORTED -> kept
- ACL keeps tibia from sliding in front of femur (AAOS) -> SUPPORTED -> kept
- Risk: higher BMI, laxity, weaker leg strength (AAOS) -> SUPPORTED -> kept
- Sports list incl. lacrosse and gymnastics -> UNSUPPORTED (AAOS lists volleyball, soccer, football, basketball) -> trimmed to AAOS list
- Swelling within 24 h, joint-line tenderness, loss of ROM (AAOS) -> SUPPORTED
- X-ray avulsion fracture (AAOS) -> SUPPORTED
- Mayo: nonsurgical suits partial tears / no instability / lower activity -> SUPPORTED
- "Reconstruction generally recommended for highly active people, complete tears..." -> MISATTRIBUTED (Mayo criteria: athletes in jumping/cutting/pivoting sports, more than one ligament injured, buckling in daily life) -> rewritten to Mayo criteria
- PT "core of nonsurgical care and a strong foundation before surgery" (AAOS) -> partly UNSUPPORTED (pre-op foundation not in source) -> cut to AAOS wording (quadriceps rebuilding in nonsurgical care)
- Repair for partial tears or tears near bone; reconstruction most common (AAOS) -> SUPPORTED
- Up to one third reinjure within two years (Mayo) -> SUPPORTED
- Return to play a year or more (Mayo) -> SUPPORTED
- Recovery 6 to 9 months (Cleveland Clinic) -> SUPPORTED
- Ice 20 min every two hours (Mayo) -> SUPPORTED
- Walking FAQ "straight walking does not depend much on the ACL" -> UNSUPPORTED -> reframed on AAOS "rotational stability" statement
- "Fully torn ACL generally does not grow back" -> SUPPORTED by Cleveland Clinic ("can't heal on its own") -> attribution added
- Red flags (cannot bear weight, deformed, calf pain/blue color, gives way) (MedlinePlus knee pain) -> SUPPORTED
- ICD-10 null -> OK

## knee-arthritis
- OA most often age 50+ (AAOS) -> SUPPORTED
- RA, posttraumatic types (AAOS) -> SUPPORTED
- Symptoms incl. weather, buckling, creaking (AAOS) -> SUPPORTED
- Mayo risk factors (age, female, weight, injury, repetitive stress, genetics, bone deformity) -> SUPPORTED
- No cure (AAOS) -> SUPPORTED
- Swimming/cycling instead of jogging (AAOS) -> SUPPORTED
- Weight loss reduces stress (AAOS) -> SUPPORTED
- NSAID caution with heart/kidney disease (AAOS) -> SUPPORTED
- Steroid injections limited to 3 or 4 per year; frequent injections may increase damage (AAOS) -> SUPPORTED
- Avoid opioids (AAOS) -> SUPPORTED
- Brace, cane (AAOS) -> SUPPORTED
- PRP: "AAOS says evidence still limited" -> roughly SUPPORTED; reworded to AAOS ("show promise, clinical studies have yet to confirm their value")
- PRP FAQ "Some people report less pain afterward" -> UNSUPPORTED efficacy claim -> removed
- "Surgery, from realignment (osteotomy)..." offered by Dr. Matarazzo -> violates brief (osteotomy not a listed procedure) -> removed from intro and recovery
- MISHA "for select patients with inner-side arthritis" -> UNSUPPORTED (no source) -> verified against FDA De Novo DEN220033 (medial knee implanted shock absorber, granted 04/10/2023); wording narrowed to the indication; FDA source added
- MedlinePlus: avoid downhill running, ice up to 15 min, 3 days of home care, fever/redness, calf signs -> SUPPORTED
- ICD-10 M17.9 "Osteoarthritis of knee, unspecified", billable (ICD10Data) -> SUPPORTED

## knee-cartilage-damage
- Cartilage has no direct blood supply (Cleveland Clinic) -> SUPPORTED; "heals often incompletely" -> softened to the CC wording
- "Pothole" (Mayo) -> SUPPORTED
- Cartilage damage found with meniscus/ligament tears (AAOS) -> SUPPORTED
- Best candidates young adults with single lesion; older or many lesions less likely to benefit (AAOS) -> SUPPORTED
- Twisting/pivoting sports mechanism -> UNSUPPORTED -> generalized to "knee injury"
- PT and injections reduce symptoms, may slow progression, do not replace cartilage (Mayo) -> SUPPORTED
- "Steroids may interfere with repair tissue, so timing matters" (Mayo) -> MISATTRIBUTED/WRONG (Mayo calls them inadvisable for cartilage lesions) -> corrected
- Orthobiologics: evidence developing, no cartilage regrowth -> SUPPORTED (Mayo: biologics may form scar-like fibrocartilage) and brief-compliant
- Microfracture: fibrocartilage less durable, best for smaller lesions in less active patients (AAOS) -> SUPPORTED
- MACI for defects larger than 2 cm (AAOS) -> SUPPORTED
- Cartilage not visible on X-ray (no calcium) (AAOS) -> SUPPORTED
- Recovery: crutches, CPM, several months to sports (AAOS) -> SUPPORTED
- Red flags (MedlinePlus knee pain list) -> SUPPORTED
- ICD-10 null -> OK

## knee-ligament-injuries
- MCL/LCL control side-to-side motion (AAOS) -> SUPPORTED
- PCL stronger than ACL, rarely hurt by misstep, dashboard mechanism (AAOS) -> SUPPORTED
- MCL sports football/soccer/skiing (Cleveland Clinic) -> SUPPORTED
- "LCL tear usually comes with ACL or meniscus damage" (Cleveland Clinic) -> MISATTRIBUTED (CC: ACL tear or other knee problem) -> corrected in body and FAQ
- Grades 1 to 3 definitions (AAOS) -> SUPPORTED
- Hinged brace, RICE, PT; surgery when ligament off bone or combined (AAOS) -> SUPPORTED
- PCL quadriceps key to recovery; PCL brace (AAOS) -> SUPPORTED
- MCL 1 to 3 / 4 to 6 / 6+ weeks; LCL 3 to 4 / 8 to 12 / 8 to 12 weeks (Cleveland Clinic) -> SUPPORTED
- PCL PT 1 to 4 weeks post-op, full recovery 6 to 12 months (AAOS) -> SUPPORTED
- "Weak leg muscles or a prior knee injury" cause / schema risk factors -> UNSUPPORTED -> removed; schema now uses sourced factors
- Lower-leg numbness/tingling/weakness red flag (Cleveland Clinic LCL) -> SUPPORTED
- Knee dislocation with vascular risk red flag -> MISSING -> ADDED as an emergency item, sourced to Medina et al. 2014 systematic review (Clin Orthop Relat Res; vascular injury 18%, nerve injury 25%, "potentially limb-threatening") and Cleveland Clinic dislocation page (go to the ER, nerve and blood vessel damage); red flags restructured to stay at 6
- ICD-10 null -> OK

## kneecap-dislocation
- MPFL prevents patella moving too far sideways (AAOS) -> SUPPORTED; "often torn" softened to "can be damaged"
- Causes: pivot, twist, fall, direct blow; groove, valgus, rotation, tubercle position (AAOS) -> SUPPORTED
- Relatively low recurrence after nonsurgical first dislocation (AAOS) -> SUPPORTED (verbatim)
- Redislocation <10% after surgery (AAOS) -> SUPPORTED
- Return 1 to 3 months; cycling (AAOS) -> SUPPORTED
- Brace about 3 weeks; surgery for bone/cartilage damage or ongoing instability; repeat dislocations raise OA risk (MedlinePlus) -> SUPPORTED
- Walking soon, full recovery several months (NHS) -> SUPPORTED
- Exam, X-ray, MRI, CT (AAOS) -> SUPPORTED
- "Very swollen very quickly" listed without urgency -> NHS lists it under A&E -> marked as emergency
- FAQ on self-reduction "safer to have it checked" -> under-stated; NHS says do not put it back yourself -> answer now says so
- Dislocation vs subluxation definitions -> general clinical knowledge, not in a fetched page -> kept (standard, low risk), flagged
- ICD-10 null -> OK

## meniscus-tear
- Shock absorbers; tear types; degenerative tear from getting up from chair (AAOS) -> SUPPORTED
- McMurray test (AAOS) -> SUPPORTED
- MRI best imaging (Mayo) -> SUPPORTED
- Non-locking tears become less painful over time; arthritis-linked tears settle with arthritis care (Mayo) -> SUPPORTED
- Surgery if locking or persistent pain (Mayo) -> SUPPORTED
- "Repair tends to be more successful in younger patients" (Mayo) -> MISATTRIBUTED (Mayo: repair "sometimes possible, especially in children and younger adults") -> corrected
- RICE, NSAIDs, steroid injection (AAOS) -> SUPPORTED
- Meniscectomy 3 to 6 weeks, repair 3 to 6 months, immediate weight bearing after meniscectomy (AAOS) -> SUPPORTED
- "Meniscus weakens and thins with age" -> slightly beyond source -> softened to "wears with age"
- Red flags (MedlinePlus knee pain) -> SUPPORTED
- ICD-10 null -> OK

## rotator-cuff-tear
- "Close to 2 million people... because of a rotator cuff problem" -> WRONG wording (AAOS: "almost 2 million... because of rotator cuff tears") -> corrected
- Over 40, dominant arm, painters/carpenters/pitchers/tennis (AAOS) -> SUPPORTED
- Blood supply decreases with age (AAOS) -> SUPPORTED
- Nonsurgical success 80 to 85% (AAOS) -> SUPPORTED
- Steroid relief in about two-thirds for at least 3 months (AAOS) -> SUPPORTED
- Surgery indications 6 to 12 months, >3 cm, weakness, acute injury; pain main reason (AAOS) -> SUPPORTED
- Tear can get larger (AAOS) -> SUPPORTED
- Open, mini-open, arthroscopic similar results; arthroscopic same-day (AAOS) -> SUPPORTED
- Rehab: sling 0 to 6 weeks, passive motion 4 to 6, strengthening 8 to 12, function 4 to 6 months (AAOS) -> SUPPORTED
- Retracted full-thickness tears do not heal; outlook factors; large tears may need open surgery (MedlinePlus) -> SUPPORTED
- Reverse TSA for cuff tear arthropathy (AAOS) -> SUPPORTED
- Ice "20 minutes, 3 to 4 times a day" -> UNSUPPORTED in cited sources -> changed to MedlinePlus (15 on/15 off, 3 to 4 times daily for 2 to 3 days)
- 911 chest-pain line -> SUPPORTED but incomplete -> aligned with MedlinePlus (left jaw/arm/neck, dizziness, sweating)
- Pain >2 to 4 weeks, fever/redness (MedlinePlus) -> SUPPORTED; persistent pins and needles (NHS) -> SUPPORTED
- ICD-10 M75.1 "Rotator cuff tear or rupture, not specified as traumatic" (ICD10Data) -> SUPPORTED but non-billable header -> kept, flagged

## shoulder-arthritis
- Two joints; OA over 50; RA; posttraumatic; cuff tear arthropathy; AVN (AAOS) -> SUPPORTED
- Symptoms; X-ray joint narrowing and bone spurs (AAOS) -> SUPPORTED
- Nonsurgical list incl. ROM exercise, ice/heat, acetaminophen/NSAIDs, cortisone, hyaluronic acid (Johns Hopkins) -> SUPPORTED (hyaluronic acid off-label in shoulder; flagged)
- Reverse TSA for cuff damage (AAOS, Hopkins) -> SUPPORTED
- Replacement candidates: cabinet, dressing, toileting, washing; rest pain; failed other care (AAOS) -> SUPPORTED
- Home day after surgery; sling 2 to 6 weeks; no driving 2 to 6 weeks; nothing heavier than a glass of water; simple tasks in 2 weeks (AAOS) -> SUPPORTED
- NHS: not improved after 2 weeks, both shoulders, fever, shape change -> SUPPORTED
- 911 line -> aligned with MedlinePlus wording
- ICD-10 M19.01 "Primary osteoarthritis, shoulder" (ICD10Data) -> SUPPORTED, non-billable header, covers primary OA only -> kept, flagged

## shoulder-impingement
- Subacromial space narrows on arm elevation (AAOS) -> SUPPORTED
- Tendinitis/bursitis most common cause of shoulder pain (MedlinePlus) -> SUPPORTED
- Athletes (swimming, baseball, tennis, volleyball), painting/construction (AAOS) -> SUPPORTED
- Holding arm in one position, sleeping on same arm, posture, aging (MedlinePlus causes) -> SUPPORTED
- "Pain spreads down side of arm, stopping above the elbow" -> partly UNSUPPORTED (elbow stop not in source) -> trimmed
- Nonsurgical list; several weeks to months to recover (AAOS) -> SUPPORTED
- Post-arthroscopy relief 2 to 4 months, up to a year (AAOS) -> SUPPORTED
- CSAW (Lancet 2018): decompression no extra benefit over arthroscopy only; gain over no treatment not clinically important -> SUPPORTED (consistent with the published conclusion; DOI resolves; abstract not re-read due to rate limit)
- NHS: 6 months or longer; exercises 6 to 8 weeks -> SUPPORTED
- Ice "about 20 minutes, up to 3 or 4 times daily" -> frequency UNSUPPORTED -> aligned to NHS (up to 20 min, 3 times a day)
- Night-pain FAQ: "AAOS lists severe night pain as sign of advanced symptoms" and MedlinePlus night-pain quote -> MISATTRIBUTED -> replaced with AAOS "pain typically at its worst at night"
- 911 line -> aligned with MedlinePlus
- ICD-10 M75.4 "Impingement syndrome of shoulder" -> SUPPORTED, non-billable header -> kept, flagged

## shoulder-labral-tear
- Labrum deepens socket up to 50%; ligament and biceps attachment (AAOS) -> SUPPORTED
- SLAP, Bankart, posterior definitions (AAOS) -> SUPPORTED
- Causes: fall on outstretched arm, blow, sudden pull, throwers, weightlifters (AAOS) -> SUPPORTED
- Bracing for instability, PT, NSAIDs (AAOS) -> SUPPORTED
- "Instability guidance centers on a home exercise program" -> loosely SUPPORTED -> reworded to AAOS (PT for strengthening and shoulder control)
- Arthroscopic same-day; open option (AAOS chronic instability) -> SUPPORTED
- Sling 2 to 6 weeks, lifting limits about 12 weeks, healed 4 to 6 months (AAOS labrum page) -> SUPPORTED
- Mayo: teens and 20s; higher redislocation risk; go to ER/urgent care, do not pop it back -> SUPPORTED
- Arm hot or cold, numbness, pins and needles (NHS) -> SUPPORTED
- ICD-10 S43.43 -> WRONG for this page (S43.43- is "Superior glenoid labrum lesion", SLAP only; no verified code covers Bankart and posterior tears) -> set to null; ICD10Data source removed
