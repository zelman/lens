# Competitive Landscape — Lens Project

**Last updated:** March 31, 2026
**Entry count:** 5
**Maintained by:** Eric Zelman

---

## Executive Summary

No existing product combines coached identity discovery, portable machine-readable documents, weighted composite scoring, and bidirectional matching. The closest functional competitor (Jack & Jill, $20M seed) operates at recruiter-level intelligence — structured preference collection and keyword-adjacent matching — but lacks discovery depth, portable output, coach integration, or company-side matching. The Lens Project's defensible position is upstream: coaching-level depth producing a functional artifact that governs automated evaluation, not a faster way to filter jobs. Patent-pending (App #64/015,187, filed 3/24/26) covers the novel combination of identity-signal extraction, asymmetric scoring, and drift detection. No competitor has filed on any of these claims.

---

## Tier 1: Direct Competitors

---

### Jack & Jill AI
**URL:** https://jackandjill.ai / app.jackandjill.ai
**Founded:** ~2023 (London)
**Funding:** $20M seed (October 2025, led by Creandum)
**Users:** ~50,000 (London-focused, US expansion planned)
**Revenue model:** 10% success fee on hires, 3-month refund guarantee. Candidate side free.
**Team note:** 5 ex-PolyAI conversational AI patents (unrelated to matching architecture)
**Last reviewed:** March 31, 2026

**What they do:**
Conversational AI recruitment platform. An AI agent ("Jack") conducts intake via chat or 15-minute call, builds a structured preference profile ("Jack's Brief"), then matches candidates daily against 14M job listings in a swipe-style triage interface. Employer-side agent ("Jill") works with hiring managers to build role briefs and source from Jack's candidate network (~130K engaged candidates). Includes passive discovery opt-in, interview prep modules, and document upload for private context.

**Overlap with Lens Project:**
Both products create a structured candidate preference document that drives automated job matching. Both use tiered fit classification. Both offer conversational AI intake. Jack's Brief is the closest external analog to a lens document. Their "Get Discovered" passive matching (profile shared with companies where Jack sees strong fit) parallels the bidirectional concept at a rudimentary level.

**Key differentiators (theirs):**
- Live product with ~50K users and $20M in funding
- Employer-side marketplace with revenue-generating placement model
- 14M job database with daily matching
- Swipe-style triage UX (fast, mobile-native)
- Voice intake option (15-min call)
- Passive discovery feature connecting candidates to hiring managers
- Interview prep / coaching modules (5 preset topics)
- "Help then redirect" guardrail pattern — when Jack can't help, it redirects rather than hallucinating

**Key differentiators (ours):**
- Coached identity discovery (values, essence, energy patterns) vs. preference collection
- Portable, machine-readable output (markdown + YAML) the user owns vs. platform-locked profile
- Weighted composite scoring with 6 dimensions and configurable weights vs. flat per-signal tier matching
- Coach persona architecture (methodology-encoded AI coaches) vs. generic preset modules
- Bidirectional matching (company-side role lens ↔ candidate lens) vs. candidate-only brief
- Signal library architecture (signals raise dimension scores) vs. equal-weight signal chips
- Gate logic and auto-disqualifiers in code vs. preference-tier filtering
- Builder vs. Maintainer signal detection and domain distance modifiers
- Drift detection over time (planned) — no J&J equivalent
- Patent-pending novel claims (identity-signal extraction, asymmetric scoring, drift detection)

**Gap analysis:**
- Discovery depth: **shallow** vs. Lens **deep** — J&J intake is a structured preference interview (role, stage, comp, location, culture). No values work, no essence/pathway, no "why behind the what." Skills Match dimension is AI-generated ("Auto" badge) rather than discovered through coaching.
- Portable output: **no** vs. Lens **yes** — Jack's Brief lives inside the platform. Users cannot export, share, or use it outside J&J's ecosystem. No markdown, no YAML, no machine-readable format.
- Scoring/matching: **partial** vs. Lens **yes** — J&J uses per-signal tier matching (Excellent/Good/Borderline/Not a Fit applied to each signal independently). No composite scoring, no weighted dimensions, no configurable thresholds. A compensation "Excellent Fit" and a culture "Borderline" produce… unclear results. The Lens uses weighted composite scoring where every dimension contributes proportionally.
- Coach integration: **no** vs. Lens **yes** — J&J's "Coaching" tab offers 5 preset interview prep modules (case interviews, PM interviews, mock interviews, salary negotiation, career goals). These are generic, have no methodology variation, no coach persona architecture, and produce no output artifact. The career goals module asks surface questions. This is interview prep, not coaching.
- Bidirectional: **rudimentary** vs. Lens **yes (designed)** — J&J's "Get Discovered" lets Jill surface candidate profiles to hiring managers, but the matching is symmetric (same signal structure both directions). The Lens Project's Role Lens uses a distinct company-side schema with different dimensions and scoring logic.
- Passive monitoring: **yes** vs. Lens **yes** — Both do daily automated matching. J&J's is live at scale; Lens Project's runs via n8n pipeline for Eric's personal search, productization pending.

#### Jack's Brief: Signal Architecture (March 31, 2026 update)

Deep-dive into J&J's preference document structure based on first-party product screenshots:

**Dimensions observed:**
1. **Role** — Natural language description of target role + tiered signal chips. User-defined.
2. **Company Culture** — Stage, size, sector, environment preferences. User-defined.
3. **Skills Match** — Tagged "Auto" (AI-generated, not user-defined). Evaluates candidate skills against each role.
4. **Location** — Geographic preferences with relocation willingness. User-defined.
5. **Compensation** — Salary floors with equity trade-off logic. User-defined.

**Tier structure (per dimension):**
- Excellent Fit (green-tinted chips)
- Good Fit (light green chips)
- Borderline (yellow/amber chips)
- Not a Fit (neutral/white chips, extensive exclusion lists)

**User editability:** Each tier has "+ Add signal" allowing custom signal chip creation. Signals are natural-language descriptions, not keywords — e.g., "VC-backed Series A or B startup with 20-100 employees" rather than tags.

**What the "Auto" badge reveals:** Skills Match is the only dimension tagged "Auto," meaning J&J's AI infers skill-fit signals from resume data rather than asking the user. All other dimensions (Role, Culture, Location, Comp) are user-stated preferences. This split confirms J&J treats identity as "preferences you state" + "skills we infer" — there's no layer that asks *why* you prefer what you prefer or discovers patterns you haven't articulated.

**Architecture comparison to Lens scoring:**

| Feature | Jack's Brief | Lens Document |
|---------|-------------|---------------|
| Signal structure | Per-signal tier (Excellent/Good/Borderline/Not a Fit) | Weighted composite score (0-100) across 6 dimensions |
| Weight control | None — all signals implicitly equal | User-configurable dimension weights (Mission 25%, Role 20%, etc.) |
| Scoring output | Implicit tier matching (mechanism opaque) | Explicit numeric score with threshold labels (STRONG FIT 80+, GOOD FIT 60-79, etc.) |
| Disqualifiers | "Not a Fit" signals per dimension | Hard gates in code (auto-disqualify before scoring runs) |
| Discovery method | Conversational preference collection | Coached identity discovery (values, essence, energy patterns) |
| Document portability | Platform-locked | Markdown + YAML, user-owned |
| Signal source | User-stated (4 dims) + AI-inferred (1 dim) | Coach-facilitated discovery + user refinement + behavioral evidence |

**Observed "Not a Fit" signals (company culture dimension):**
DTC apps, SMB-focused healthtech (aesthetic practices, small retail clinics), PE-backed companies, developer-focused tools under 50 employees, companies with >150 employees, companies with >$75M total funding, Fortune 500 subsidiaries, highly hierarchical or siloed environments.

**Observed "Not a Fit" signals (role dimension):**
NRR ownership or revenue-carrying CSM roles, CS Ops or tooling-focused roles, optimizing existing CS organizations, individual contributor roles without founding mandate, junior or mid-level support roles.

**Strategic observation:** J&J's exclusion lists are extensive and specific — they clearly learn from user feedback. But exclusions are binary (in/out) rather than graduated. The Lens Project's gate + penalty architecture allows more nuance: a PE-backed company auto-disqualifies, but a company at 180 employees (above J&J's >150 threshold) might score with a penalty rather than being excluded entirely.

**Verdict:**
Jack & Jill is the nearest functional competitor and the one to watch, especially with $20M and US expansion plans. However, their ceiling is recruiter-level intelligence: they help people who already know what they want find it faster. The Lens Project's floor is coaching-level depth: helping people discover what they actually want, encoding it in a portable artifact, and scoring against it with weighted composite logic. J&J's signal architecture validates the general approach (tiered signals, exclusion lists, natural-language descriptions) while confirming they haven't crossed into discovery, portability, or weighted scoring. If J&J evolves toward durable documents or coaching depth, the competitive window narrows — but their marketplace revenue model (10% placement fee) incentivizes speed-to-hire, not depth-of-discovery.

---

## Tier 2: Adjacent Products

---

### JSON Resume
**URL:** https://jsonresume.org
**Founded:** ~2014
**Funding:** Open source / community project
**Last reviewed:** March 15, 2026

**What they do:**
Open standard for structured resume data in JSON format. Community-maintained schema with rendering themes. Establishes the precedent that career data can be structured, portable, and machine-readable.

**Overlap with Lens Project:**
Format precedent. Demonstrates that structured career documents can exist outside proprietary platforms. The lens document's markdown + YAML approach is a spiritual descendant.

**Key differentiators (theirs):**
- Established open standard with community adoption
- Multiple rendering themes
- Developer-friendly ecosystem

**Key differentiators (ours):**
- Identity and values layer (not just career history)
- Scoring/matching capability built into the format
- Discovery process to generate the document (not just data entry)
- Coach methodology integration

**Gap analysis:**
- Discovery depth: **none** (data entry only)
- Portable output: **yes** (JSON, open standard)
- Scoring/matching: **no**
- Coach integration: **no**
- Bidirectional: **no**
- Passive monitoring: **no**

**Verdict:**
Not a competitor. A format precedent that validates portable structured career documents. Worth referencing in positioning but poses zero threat.

---

### DISC / StrengthsFinder (CliftonStrengths) / Myers-Briggs
**URL:** Various
**Founded:** Various (decades-old)
**Funding:** Gallup (CliftonStrengths) is a $2B+ organization; DISC is public domain
**Last reviewed:** March 22, 2026

**What they do:**
Personality and strengths assessment tools that produce trait profiles. Widely used in corporate development, team building, and coaching. CliftonStrengths identifies top 5 (or 34) talent themes. DISC categorizes communication/behavioral styles. MBTI classifies cognitive preferences.

**Overlap with Lens Project:**
All produce a "who you are" artifact. Coaches (including James Pratt) often use these as inputs to their process. Users may compare the lens document to these assessments.

**Key differentiators (theirs):**
- Decades of validation and brand recognition
- Massive installed base (30M+ CliftonStrengths assessments)
- Corporate procurement channels established
- Gallup holds copyright/trade secret protection (not patent) on CliftonStrengths

**Key differentiators (ours):**
- Forward-looking (what do you want next) vs. backward-looking (what are your traits)
- Functional output that governs matching vs. static report
- Contextual to career search vs. general personality
- Continuously updated vs. point-in-time snapshot
- Machine-readable and scorable vs. PDF report

**Gap analysis:**
- Discovery depth: **moderate** (structured assessment, but fixed questions, no coaching dialogue)
- Portable output: **partial** (PDF reports, but not machine-readable or scoring-compatible)
- Scoring/matching: **no**
- Coach integration: **indirect** (coaches use results as input, but tool doesn't integrate coaches)
- Bidirectional: **no**
- Passive monitoring: **no**

**Verdict:**
Not direct competitors. These are upstream inputs that coaches and users bring into the discovery process. The Lens Project can reference and integrate assessment results rather than competing with them. CliftonStrengths' lack of patent protection (copyright/trade secret only) is relevant to our IP positioning.

---

### ATS Systems (Greenhouse, Lever, Ashby)
**URL:** Various
**Funding:** Greenhouse ($110M+), Lever (acquired by Employ), Ashby (growing)
**Last reviewed:** March 22, 2026

**What they do:**
Applicant tracking systems that manage the hiring pipeline from job posting through offer. Core function is workflow management for recruiters and hiring managers. Some include AI-powered candidate matching, resume parsing, and structured interviewing.

**Overlap with Lens Project:**
ATS systems are the infrastructure the Lens Project's enterprise (Role Lens) offering would need to integrate with. They also represent the "keyword matching" philosophy the Lens Project positions against.

**Key differentiators (theirs):**
- Established enterprise infrastructure with massive adoption
- Workflow management beyond just matching
- Compliance, reporting, analytics
- Greenhouse has 3 patents in adjacent space (workflow, not matching)

**Key differentiators (ours):**
- Signal matching vs. keyword matching
- Identity-based fit vs. resume-based screening
- Candidate-owned document vs. company-controlled profile
- Coaching depth vs. form-fill intake
- Greenhouse patents are distinguishable (workflow optimization, not identity-signal extraction)

**Gap analysis:**
- Discovery depth: **none** (application form)
- Portable output: **no** (data locked in ATS)
- Scoring/matching: **partial** (keyword/skill matching, not identity-signal matching)
- Coach integration: **no**
- Bidirectional: **partial** (both sides use the system, but matching is keyword-based)
- Passive monitoring: **no** (job boards, not ongoing scoring)

**Verdict:**
Integration targets, not competitors. The Role Lens (company-side) would ideally feed into or sit alongside ATS systems. Their keyword-matching approach is exactly what the Lens Project positions against, making them useful foils in positioning narrative.

---

### Korn Ferry (Talent Assessment Platform)
**URL:** https://kornferry.com
**Funding:** Public company ($1.7B+ revenue)
**Last reviewed:** March 22, 2026

**What they do:**
Enterprise talent assessment and organizational consulting. Their platform includes competency frameworks, leadership assessments, and talent matching for executive search. US Patent 10,346,804 covers aspects of talent-role matching.

**Overlap with Lens Project:**
Korn Ferry's patent (US10346804) is the closest existing patent to the Lens Project's claims. Their system matches candidate profiles to role requirements using structured assessment data.

**Key differentiators (theirs):**
- Existing patent in adjacent space
- Enterprise-scale with Fortune 500 client base
- Decades of competency framework research
- Full-service consulting model

**Key differentiators (ours):**
- Korn Ferry patent is unidirectional (company evaluates candidate); Lens is asymmetric (both sides score independently with different schemas)
- No coaching discovery layer in Korn Ferry's system
- No portable candidate-owned document
- No drift detection or longitudinal identity tracking
- No feedback loop from daily scoring decisions
- Enterprise price point ($100K+ engagements) vs. Lens's consumer/prosumer model

**Gap analysis:**
- Discovery depth: **moderate** (structured assessment by trained consultants)
- Portable output: **no** (proprietary platform)
- Scoring/matching: **yes** (patented, but unidirectional and keyword/competency based)
- Coach integration: **yes** (human consultants, but not AI-encoded personas)
- Bidirectional: **no** (company-side only)
- Passive monitoring: **no**

**Verdict:**
Closest patent prior art but distinguishable on all five novel claims. Their enterprise model serves a completely different market segment. Worth monitoring but not a competitive threat to the Lens Project's target user.

---

## Tier 3: Ecosystem Players

*(To be expanded as research surfaces relevant platforms)*

- **LinkedIn** — dominant professional network; data source and distribution channel, not a matching competitor
- **Indeed** — job aggregator; potential data source for scoring pipeline
- **Brave Search** — currently used in n8n pipeline for job discovery enrichment
- **Crunchbase** — funding/company data source for VC portfolio scraping

---

## Revision Log

| Date | Change |
|------|--------|
| March 15, 2026 | Initial competitive framing in CONTEXT-lens-project.md |
| March 22, 2026 | Full J&J product walkthrough (19 screenshots), DOCX competitive report created |
| March 22, 2026 | Prior art patent landscape completed (6 competitors surveyed) |
| March 31, 2026 | J&J "Jack's Brief" signal architecture deep-dive (8 new screenshots). Created living competitive-landscape.md per competitive-entry skill format. Added architecture comparison table, "Auto" badge analysis, and exclusion signal inventory. |
