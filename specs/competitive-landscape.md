# Competitive Landscape — Lens Project

**Last updated:** April 3, 2026
**Entry count:** 12
**Maintained by:** Eric Zelman
**Patent Pending:** App #64/015,187 — Confidential

---

## Executive Summary

No existing product combines coached identity discovery, portable machine-readable documents, weighted composite scoring, and bidirectional matching. The closest functional competitor (Jack & Jill, $20M seed) operates at recruiter-level intelligence — structured preference collection and keyword-adjacent matching — but lacks discovery depth, portable output, coach integration, or company-side matching. SquarePeg tried bidirectional psychometric matching and pivoted away. BetterUp proved enterprise coaching demand ($628M raised) but produces no functional artifact. The Lens Project's defensible position is upstream: coaching-level depth producing a functional artifact that governs automated evaluation, not a faster way to filter jobs. Patent-pending (App #64/015,187, filed 3/24/26) covers the novel combination of identity-signal extraction, asymmetric scoring, and drift detection. No competitor has filed on any of these claims.

---

## The Three Stacked Bets

The Lens Project isn't making one bet — it's making three, and each one has to hold for the next to matter.

**Bet A: "Fit" is the unsolved problem in hiring.** The dominant systems optimize for efficiency (sourcing, screening, compliance), not for predicting whether someone will thrive in a specific seat. The biggest cost is mis-hire, not slow hiring.

**Bet B: Identity can be structured and operationalized.** A person's values, energy patterns, work style, and constraints can be reliably elicited, encoded into a machine-readable format, and used as a matching signal.

**Bet C: Bidirectional matching is possible and valuable.** Employers can be modeled with the same depth as candidates, and matching improves when both sides are deeply profiled.

---

## Why Deep-Fit Assessment Hasn't Been Built at Scale

All three AI platforms (Gemini, ChatGPT, Perplexity) converged on the same answer: this is a structural incentive problem, not a technical limitation.

**The speed-over-signal trap.** Time-to-fill remains the primary TA KPI. Deep-fit discovery is perceived as friction that slows the pipeline. Budget flows to sourcing, CRM, and automation — not to multi-hour discovery processes.

**The buyer persona mismatch.** ATS platforms are sold to recruiters (who value volume and efficiency). Deep-fit tools are needed by hiring managers (who feel the pain of a culture misfit six months later). The person writing the check isn't the one feeling the pain.

**The ground-truth data problem.** To validate a fit-prediction model, you need rich pre-hire data linked to long-horizon post-hire outcomes (thriving, engagement, regretted attrition) at the role/team level. Almost no company systematically captures this. The Lens Project creates this feedback loop by generating the pre-hire data (the lens) and then tracking what happens. That's not just a feature — it's the moat.

**The candidate friction problem.** Tolerance for long, introspective workflows is low unless candidates clearly see personal benefit (career clarity, coaching, development) — not just "better matching for this job." The free lens as a standalone value prop addresses this directly.

---

## The Lens Gap (Where Nobody Sits)

```
                    DEPTH OF UNDERSTANDING
                    Low ◄──────────────────► High

SCALE   High │  LinkedIn        │               │
             │  Indeed           │               │
             │  ATS platforms    │    [LENS]     │
             │                   │               │
        Low  │  Resume builders  │  BetterUp     │
             │  AI assistants    │  Human coaches │
             │  Jack & Jill      │  Psychometrics │
```

The Lens Project sits in the upper-right quadrant: **deep AND scalable**. It gets there by using AI-guided discovery (scalable) to produce a coaching-depth artifact (deep) that then governs automated matching (scalable again).

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

### SquarePeg
**URL:** https://squarepeghires.com
**Founded:** 2016, NYC (Claire McTaggart)
**Funding:** Unknown
**Last reviewed:** April 3, 2026

**What they do:**
Originally built psychometric-driven matching: 19 personality traits, values, environment fit, work style. Assessed both candidates AND companies for bidirectional fit. Has since **pivoted toward AI-powered resume screening and candidate sourcing** — moved away from deep-fit matching toward speed and efficiency.

**Why this matters:**
SquarePeg is the cautionary tale. They tried bidirectional psychometric matching and it stayed niche.

**What went wrong:**
1. Employer adoption of deep self-assessment was hard to get
2. Adding assessment friction early in funnel slowed pipelines
3. Demonstrating ROI in CFO-legible terms proved difficult

**Gap vs. Lens:**
- Self-report assessments produce shallow data — coaching-facilitated discovery produces deeper, more honest data
- The role lens must be embedded in existing workflows (req creation, intake meetings), not added as an extra exercise
- Need proxy signals early (early attrition reduction, interview-to-offer improvement) before claiming long-term fit prediction

**Verdict:**
Low threat — they abandoned the fit thesis. But their pivot is instructive: the Lens Project must make the employer side frictionless or enterprise adoption will stall.

---

## Tier 2: Assessment & Matching Platforms

---

### Pymetrics (acquired by Harver, August 2022)
**Funding:** ~$60.7M raised
**Founded by:** Frida Polli (CEO noted: "people are notoriously bad at knowing themselves and then reporting that in an accurate way")
**Last reviewed:** April 3, 2026

**What they did:**
Neuroscience-based games to capture behavioral/cognitive traits. Employer-side only: candidates had to "play the game" for every company. Not portable — no persistent identity layer.

**Gap vs. Lens:**
Pymetrics solved for behavioral traits but made the experience non-portable and employer-controlled. Acquisition by Harver absorbed it into traditional assessment stack. Lens is candidate-owned and portable.

---

### Harver (acquired Pymetrics, previously known as Outmatch)
Industry-leading hiring assessment platform combining I/O psychology and cognitive science. Focus on hourly and professional role hiring decisions.

**Gap vs. Lens:**
Employer-facing, assessment-based, no identity discovery, no coaching integration, no bidirectional matching.

---

### Plum.io / Criteria Corp
Traditional I/O psychology assessments for hiring decisions. Static, one-time use, employer-controlled.

**Gap vs. Lens:**
Static reports, not living documents. No coaching integration. Not candidate-owned.

---

### iMocha
AI-powered skills matching for internal career pathing. Inches toward "fit" but in a skills/capability framing only. Values and energy patterns are not primary axes.

**Gap vs. Lens:**
Strong on skills, weak on identity. No deep discovery. Internal-only.

---

## Tier 3: Coaching Platforms (Depth, No Scale)

---

### BetterUp
**HQ:** Austin
**Funding:** $628M raised, $4.7B peak valuation (2021)
**ARR:** ~$250M (2023), growth slowed from 127% to ~40% YoY
**Status:** Three rounds of layoffs, executive turnover, strategic instability
**Last reviewed:** April 3, 2026

**What they do:**
AI-powered coaching + human coaching network (~3,000 coaches). Launched AI coaching features (BetterUp Grow, roleplay, Slack/Teams integration). Sells to enterprise (Google, Salesforce, Workday). Revenue model: SaaS subscription, takes cut from coach fees.

**Gap vs. Lens:**
Coaching is conversational, not artifact-producing. No portable document. No matching layer. Expensive ($2K-3K per session historically). Coaching outcomes are qualitative, not machine-readable.

**What BetterUp's struggles teach you:**
BetterUp raised $628M and hit $250M ARR, proving enterprise willingness to pay for coaching at scale. But their challenges — layoffs, strategy shifts, coach retention, the "SaaSy not SaaS" identity crisis — suggest that coaching-as-service without a functional artifact is structurally fragile. The Lens insight: coaching produces measurable ROI when it generates a functional artifact that governs downstream decisions.

---

### CoachHub
**HQ:** Berlin
**Funding:** ~$200M+
**Last reviewed:** April 3, 2026

Digital coaching platform for European market. AI coaching features emerging.

**Gap vs. Lens:**
Same ceiling as BetterUp — coaching without a functional artifact.

---

## Tier 4: Traditional Psychometrics (Static, No Matching)

---

### DISC / CliftonStrengths (Gallup) / Myers-Briggs / Hogan
**URL:** Various
**Founded:** Various (decades-old)
**Funding:** Gallup (CliftonStrengths) is a $2B+ organization; DISC is public domain
**Last reviewed:** March 22, 2026

**What they do:**
Personality and strengths assessment tools that produce trait profiles. Widely used in corporate development, team building, and coaching. CliftonStrengths identifies top 5 (or 34) talent themes. DISC categorizes communication/behavioral styles. MBTI classifies cognitive preferences. Massive installed base (30M+ CliftonStrengths assessments).

**Overlap with Lens Project:**
All produce a "who you are" artifact. Coaches (including James Pratt) often use these as inputs to their process. Users may compare the lens document to these assessments.

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
Not direct competitors. These are upstream inputs that coaches and users bring into the discovery process. The Lens Project can reference and integrate assessment results rather than competing with them. The lens must avoid the "astrology with better UX" perception risk while still producing something people trust. CliftonStrengths' lack of patent protection (copyright/trade secret only) is relevant to our IP positioning.

---

## Tier 5: ATS / Job Boards (Scale, No Depth)

---

### LinkedIn / Indeed / Greenhouse / Lever / Ashby
**Funding:** Greenhouse ($110M+), Lever (acquired by Employ), Ashby (growing)
**Last reviewed:** March 22, 2026

**What they do:**
High-volume keyword matching and workflow management. LinkedIn has the data to build something deeper but optimizes for engagement/ads. ATS platforms are compliance and workflow databases, not identity data platforms. Core function is managing the hiring pipeline from job posting through offer.

**Gap vs. Lens:**
Surface-level matching, high noise-to-signal ratio. Store text tied to job reqs, not longitudinal candidate identity data. Keyword matching vs. signal matching. Greenhouse has 3 patents in adjacent space (workflow optimization, not identity-signal extraction — distinguishable).

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

## Tier 6: Ecosystem Players

- **LinkedIn** — dominant professional network; data source and distribution channel, not a matching competitor
- **Indeed** — job aggregator; potential data source for scoring pipeline
- **Brave Search** — currently used in n8n pipeline for job discovery enrichment
- **Crunchbase** — funding/company data source for VC portfolio scraping

---

## Emerging / Watch List

**PersonaSight** (referenced by Perplexity) — Appears to be more academic/research concept than commercial product. Text-based personality inference from small samples. Worth monitoring if it commercializes, but not a current competitor.

**Delenta** — AI coaching platform producing "actionable intelligence" summaries. Moves toward artifact-producing coaching but focused on coaching practice management, not matching.

**AI career assistants (emerging wave)** — Resume builders, interview prep bots, application copilots. All optimize for speed and volume. None produce a persistent identity artifact.

---

## Critical Risks (Ranked by Severity)

### 🔴 Risk 1: Is this the problem buyers actually pay for?

If CHROs say "our issue is pipeline, not fit" or "we solve fit via managers + interviews" — the enterprise wedge weakens. Perplexity's reframing: don't position "fit prediction" as the value prop. Position it as the mechanism that moves metrics buyers already care about — early attrition, quality-of-hire, internal redeployment. **Test this in the Edie Hunt and Anne/Rob Birdsong conversations.**

### 🔴 Risk 2: Can "fit" be measured in a way people trust?

Even if technically possible, the product could feel too subjective for enterprise adoption. Needs either predictive validity or perceived legitimacy. The coaching-facilitated, artifact-producing model is the right counter — it's not a personality label, it's a working document that governs real decisions.

### 🔴 Risk 3: Is the required behavior change too large?

The system requires candidates to do deep introspection AND employers to expose real cultural truth. That's a multi-sided adoption problem. **Mitigation:** Coach channel solves candidate-side adoption (coaches bring their clients). Making the role lens a byproduct of existing work (req creation, intake meetings) reduces employer-side friction.

### 🟡 Risk 4: Lens document becomes static

If users don't revisit/update it, it decays like a resume. **Mitigation:** "Append, don't overwrite" philosophy. Feedback loops from scoring pipeline recalibrate. The paid tier creates ongoing engagement through daily briefings.

### 🟡 Risk 5: Employer-side data honesty

Companies may resist codifying unflattering truths about teams. Legal/comms organizations may prefer generic, positive language. **Mitigation:** Frame role lens as a tool for the hiring manager, not a public document. Start with teams that self-select (high-integrity orgs, startups, internal mobility programs).

---

## Strategic Implications

### Positioning

**Don't say:** "We predict fit before you hire."
**Do say:** "We help you understand what someone actually needs to thrive — and whether this seat is the right one — before either side commits."

**Enterprise framing:** "Teams that use structured role lenses have lower early attrition and higher new-hire performance." (Need to build the data to back this up.)

**Candidate framing:** "It's not about finding jobs faster. It's about finding what's right for you."

### GTM Sequence

1. **Candidate product first.** Free lens intake → portable artifact. Coach channel as distribution. This is where you have traction and where adoption friction is lowest.
2. **Internal mobility as enterprise wedge.** All three platforms flagged this as adjacent and potentially more tractable than external hiring. "We're losing great people because we don't help them find the right internal roles" is a pain point hiring leaders already articulate.
3. **External hiring as the scale play.** Bidirectional matching for external candidates is the big vision but requires both sides to be deeply profiled. Build toward this as the data and trust accumulate.

### The Feedback Loop Is the Moat

The lens creates pre-hire identity data. The scoring pipeline tracks engagement. User decisions (apply, skip, save) generate feedback. Over time, this produces the ground-truth dataset that nobody else has — rich pre-hire profiles linked to post-hire outcomes. This is what makes the model improve and what makes the product defensible.

### What SquarePeg's Pivot Teaches You

SquarePeg tried psychometric-driven bidirectional matching and pivoted to AI resume screening. The lesson isn't "bidirectional matching doesn't work." The lesson is:
- Self-report assessments produce shallow data — coaching-facilitated discovery produces deeper, more honest data
- Employers resisted doing the work — the role lens must be embedded in existing workflows, not added as an extra step
- ROI was hard to prove — you need proxy signals early (early attrition reduction, interview-to-offer improvement) before you can claim long-term fit prediction

### What BetterUp's Struggles Teach You

BetterUp raised $628M and hit $250M ARR, proving enterprise willingness to pay for coaching at scale. But their challenges — layoffs, strategy shifts, coach retention, the "SaaSy not SaaS" identity crisis — suggest that coaching-as-service without a functional artifact is structurally fragile. The Lens insight: coaching produces measurable ROI when it generates a functional artifact that governs downstream decisions.

---

## Key Questions for Validation Conversations

1. When you think about your worst hires — the ones that looked great on paper — what was the thing you missed?
2. Does your organization have a structured way to evaluate whether someone will thrive in a specific seat, or is that still mostly judgment?
3. If someone handed you a document about a candidate that told you what they actually care about, how they work, and what their dealbreakers are — would that change how you interview them?
4. Is "predicting fit before the offer" even the right problem? Or is the real pain somewhere else?
5. Why haven't the major platforms built this?

---

## Competitor Quick Reference

| Company | What They Do | Funding | Status | Threat Level |
|---------|-------------|---------|--------|-------------|
| Jack & Jill AI | AI career agent | ~$20M seed | Active | Medium — speed-focused, no depth |
| SquarePeg | AI resume screening (pivoted from fit matching) | Unknown | Active | Low — abandoned the fit thesis |
| Pymetrics | Neuroscience behavioral assessment | $60.7M | Acquired by Harver (2022) | Low — absorbed into assessment stack |
| BetterUp | AI + human coaching platform | $628M | Active, struggling | Low — no artifact, no matching |
| CoachHub | Digital coaching (EU) | ~$200M+ | Active | Low — same ceiling as BetterUp |
| Gallup/DISC/Hogan | Static psychometric assessments | Established | Active | Low — no matching, no portability |
| iMocha | Skills + internal mobility | ~$14M | Active | Low — skills only, no identity |
| Korn Ferry | Enterprise talent assessment | Public ($1.7B rev) | Active | Low — different market, distinguishable patent |

---

## Revision Log

| Date | Change |
|------|--------|
| March 15, 2026 | Initial competitive framing in CONTEXT-lens-project.md |
| March 22, 2026 | Full J&J product walkthrough (19 screenshots), DOCX competitive report created |
| March 22, 2026 | Prior art patent landscape completed (6 competitors surveyed) |
| March 31, 2026 | J&J "Jack's Brief" signal architecture deep-dive (8 new screenshots). Created living competitive-landscape.md per competitive-entry skill format. Added architecture comparison table, "Auto" badge analysis, and exclusion signal inventory. |
| April 3, 2026 | Major expansion: Added Three Stacked Bets, structural analysis (why deep-fit hasn't been built), SquarePeg cautionary tale, BetterUp struggles analysis, Pymetrics/Harver, Plum.io, iMocha, CoachHub. Added Critical Risks, Strategic Implications, GTM sequence, validation questions, quick reference table. Entry count 5 → 12. |

---

*This is a living document. Update when new competitors surface, when validation conversations produce new signal, or when the competitive thesis changes.*
