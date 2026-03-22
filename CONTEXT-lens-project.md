# CONTEXT.md — Lens Project

*Last updated: March 21, 2026*

This is the living context file for the Lens Project — the product concept for AI-assisted career identity discovery and job matching. Update when things change.

---

## Naming Disambiguation

This project is about **productizing** the approach Eric built for himself. The related but separate workstreams:

- **Tide Pool Job Search** — Eric's personal job search automation (v9 pipeline, VC scrapers, scoring). Operational system, managed in Job Search 2 project + Claude Code for n8n workflow engineering.
- **Tide Pool Archive** — personal curation project at tide-pool.org (separate Claude Project)
- **Tide Pool Agent Lens** — Eric's personal portable context document. The lens concept originated here; this project is about making it a product for others.

---

## What This Is

An AI-assisted product that helps people articulate their professional identity through structured discovery, producing a "lens document" — a markdown file with YAML frontmatter — that governs automated job opportunity scoring and delivery. The core principle is **signal matching over keyword matching**.

The insight: generic AI coaching struggles with ROI. When coaching produces a functional lens document that governs daily job scoring and briefings, the outcome becomes concrete and measurable.

**Tagline direction:** "Indelible" — the version of you that persists, vs. the disposable ATS-optimized resume you rewrite for every application. Alternatives considered: "The actual you," "The durable you," "You, once."

---

## Key People

- **Nathan Fierley** — potential co-builder on the AI coaching concept. Testing the James Pratt coaching persona implementation. Reframed the product as bidirectional (role lens scores candidates on relational/cultural fit). A/B/C collaboration options outlined in his deck — decision pending.
- **James Pratt** — Eric's career coach (Nov–Dec 2025). First contributing coach persona. Engaged and moving forward on AI coaching partnership. His coaching methodology (Be-Have-Do, Authentic Presence, Essence Statement, IAM Model) and session library are the basis for the first persona. SKILL.md exists in project knowledge.
- **Todd Gerspach** — Eric's previous career coach, extensive C-level network. Met recently. Expressed interest in contributing if the project formalizes as a business. Proposed freemium GTM model (free sample report as lead gen → paid coaching + extended reports as revenue layer).
- **Ravi** — Advisory/conversational involvement.

---

## Design Language: Swiss Style

Adopted March 2026. All artifacts, decks, and forms use this system — **no exceptions, no dark editorial aesthetic:**

- **Background:** White (#FFFFFF)
- **Typography:** Helvetica Neue / Helvetica / Arial, sans-serif. Strong hierarchy, black type (#1A1A1A)
- **Primary accent:** Red (#D93025) — buttons, active states, progress bars, links
- **Secondary accent:** Orange (#E8590C) — step numbers, footnote callouts
- **Rules:** Hairline (1-2px), black for section boundaries, light gray (#EEEEEE) for subdivisions
- **Border radius:** Zero. No rounded corners anywhere.
- **Principle:** The design is invisible. Content does the work.

Previously used dark background (#0a0a0a) with warm neutral / gold-brown (#a08060) accent — this is retired for product-facing materials but persists in the original `lens-scorer.jsx` (C→R) and the archive site.

---

## What's Been Built

### Intake Form (`lens-intake.jsx`, ~680 lines)
Full integrated intake flow with four phases and session persistence:

**Phase 1 — Intro ("Build your lens")**
Explains what a lens is, the three-step process, time estimates (25-45 min). Swiss Style design.

**Phase 2 — Context Upload ("Give the AI a head start")**
Five upload categories: resume, LinkedIn profile (with PDF instructions and scroll-for-recommendations tip), writing samples, assessments & frameworks, anything else.

Key insight: LinkedIn recommendations the user *chooses to keep visible* are a lens signal — the curation tells you about self-concept.

**Phase 3 — Status Selection**
Employed / Actively Searching / In Transition — shapes AI tone and matching system routing.

**Phase 4 — Discovery (placeholder)**
Shows loaded context summary and previews 8 discovery sections. In production, this is where the Claude API conversation begins.

**Persistence:** Phase, status, and file metadata saved to storage on every change. Files need re-upload on return.

### Original Intake Form (`lens-form.jsx`, ~800 lines)
Earlier version with live Claude API integration (Sonnet). 6 phases: status → resume → intro → discovery → synthesis → done. 8 discovery sections with per-section system prompts. Still the reference for the discovery conversation implementation.

### Candidate Lens Scorer (`lens-scorer.jsx`)
C→R direction. Scores job opportunities against Eric's candidate profile. 5 dimensions (CS Hire Readiness 25, Stage & Size Fit 25, Role Mandate 20, Sector & Mission 15, Outreach Feasibility 15) + domain distance modifier. Dark theme (#0a0a0a) — predates Swiss Style adoption. Live Claude API (Sonnet).

### Role Lens Scorer (`role-lens-scorer.jsx`) — NEW March 21
R→C direction (reverse of lens-scorer.jsx). Scores candidates against a role lens. Swiss Style (white, Helvetica, red accent). 6 dimensions (Builder Orientation 25, Relational Fit 22, Domain Fluency 18, Values Alignment 15, Work Style Compat. 12, Energy Match 8).

**Two control sliders:**
- **Gate Tolerance** (Lenient / Moderate / Strict) — controls how rigidly disqualifiers are enforced. Lenient flags near-misses but scores everyone. Strict hard-DQs on borderline cases.
- **Analysis Depth** (Quick Screen / Standard / Full Signal) — controls output volume. Quick returns compact scores + 2-line briefing. Standard adds signal matches, tensions, interview questions. Full adds per-dimension confidence scores, confidence gaps, and detailed recommended actions.

**9 named modes** from the 3×3 slider matrix:

| | Quick | Standard | Full |
|---|---|---|---|
| **Lenient** | Pipeline Build | Open Consideration | Open Discovery |
| **Moderate** | Standard Screen | Balanced Evaluation | Deep Evaluation |
| **Strict** | Targeted Screen | Precision Filter | Final Evaluation |

Each mode adjusts: system prompt instructions, output depth, max_tokens allocation. Mode name displays on the score button and in the results header.

Output includes: dimension scores with rationale, signal_matches (candidate signal ↔ role signal), signal_tensions with severity + suggested interview questions, gate_flags for near-miss disqualifiers, confidence_gaps, and recommended_action. Copy JSON and Copy Report export buttons.

Pre-loaded with LeanData role lens as default context. Editable role lens panel.

### Candidate Test Profile (`eric-zelman-test-profile.md`) — NEW March 21
Comprehensive candidate profile for testing the role lens scorer. Compiled from coaching sessions, agent lens, and job search materials. Covers: essence & identity (tide pool metaphor, integration over performance), professional background (18+ years, Bigtincan 0-to-1 build), values with behavioral evidence, work style, energy patterns (fills and drains), mission & role preference, and disqualifiers.

### Bidirectional Lens System Spec (`bidirectional-lens-system.md`) — NEW March 21
**The core IP document.** ~4,000-word technical specification covering:

1. **Role Lens schema** — company-side YAML frontmatter + markdown document format mirroring the Candidate Lens. 8 discovery sections directed at hiring managers: Team Essence, Who Thrives Here, Values Real Talk, Work Style Reality, Energy of the Role, Builder vs. Maintainer Mandate, Disqualifiers, Hiring Context. Each section has systemContext, workflowHint, and scoreDimension mappings.

2. **Matching Algorithm** — asymmetric by design. Two independent scores (C→R using candidate dimensions, R→C using role dimensions) plus a Mutual Fit composite. Dimension cross-mapping table defines which signals in one lens feed which dimensions in the other. Hard-gate logic evaluated in code before LLM scoring. Produces STRONG MUTUAL FIT / GOOD MUTUAL FIT / ASYMMETRIC FIT / MARGINAL / POOR FIT classifications.

3. **Match Report format** — structured output with narrative briefing, alignment map, signal matches (3-5 strongest), tension signals (2-4 most significant with interview questions), disqualifier check, confidence gaps with suggested discovery questions, and recommended actions per classification.

4. **Worked Example: Eric Zelman × LeanData** — full end-to-end scoring across all 12 dimensions (6 per direction). C→R: 71/100 (GOOD FIT). R→C: 73/100 (GOOD FIT). MF: 72 (GOOD MUTUAL FIT). Three alignment signals, three tension signals with interview questions, two confidence gaps identified.

5. **Feedback Loop** — three-level learning system: per-user weight calibration (learning rate 0.02, signal-weighted), per-user disqualifier refinement, global model improvement (anonymized/aggregated). Explicit signals (pursued/skipped/got interview/accepted/declined + match report rating + specific tension/alignment tags). Implicit signals (time on report, click-through, briefing engagement, lens edits). Lens drift detection (surfaces when actions diverge from stated preferences without silently changing the lens — "append, don't overwrite").

6. **Six feedback collection points:** at delivery, 48hr follow-up, after outreach, after interview, after outcome, monthly reflection.

### IP Protection Documents — NEW March 21

**IP Summary** (`Lens_Project_IP_Summary_20260321.docx`)
Timestamped declaration of authorship covering: lens document model, bidirectional matching, focal length/aperture controls, coach-as-channel distribution, coaching ROI through functional output, passive monitoring as retention engine. Lists 17 supporting artifacts with evidence locations. Defines contributor IP boundaries for James Pratt, Nathan, Todd, and Ravi. Declaration section for email-to-self timestamping.

**Mutual NDA** (`Lens_Project_Mutual_NDA.docx`)
Reusable template scoped to the Lens Project. 11 sections: purpose, definition of confidential information, exclusions, obligations (including non-compete clause 4f), IP ownership (Section 5 explicitly names Eric's ownership of core concepts), term (2 years + 3-year survival), return of materials, no obligation, remedies (equitable relief), governing law (Rhode Island), entire agreement. Signature blocks for both parties.

### User Testing Feedback Form (`lens-feedback-form.jsx`)
Swiss Style, 8 structured questions. Q8 tests freemium pricing model per Todd's GTM suggestion.

### Feedback Form Vercel Deployment (`lens-feedback.zip`)
Deployable project with static HTML form + Vercel serverless function proxying to Airtable.

### Airtable: Lens Feedback Table
Base: Archive (`appFO5zLT7ZehXaBo`). Table: Lens Feedback (`tblUAyulKOKXiRoOx`).

### Pitch Decks (Swiss Style, pptxgenjs)
Two audience-specific decks, v3:
- Coach Pitch Deck (`lens-coach-pitch-v3.pptx`) — 10 slides, multi-coach roster framing
- Investor Pitch Deck (`lens-investor-pitch-v3.pptx`) — 12 slides, $750K ask

### FigJam Diagrams (7 total, Mermaid format)
1. Intake Form User Flow
2. Product Architecture
3. GTM Launch Phases
4. User Experience Storyboard
5. Technical Data Flow
6. Coach Onboarding Flow
7. Enterprise Role Lens — bidirectional matching, competitive differentiation

Note: FigJam/Figma MCP only generates Mermaid. No design control. For Swiss Style versions, rebuild as PPTX or SVG.

### Supporting Documents
- Role Lens Schema (`role-lens-schema.md`) — now superseded by `bidirectional-lens-system.md`
- Free Tool Launch Plan (`lens-launch-plan.docx`) — 4-phase GTM with metrics
- Financial Model (`lens-financial-model.xlsx`) — 12-month burn, KPIs, assumptions
- Storyboard (`storyboard-flows.docx`) — Path A, Path B, The Shovel, Predictive Signals

### Competitive Research
- JSON Resume — structured format precedent
- Jack & Jill — nearest competitor ($20M seed, but no depth, no portable document, no coach network)
- Gap analysis showing nobody runs deep discovery on both sides

---

## Coach Persona Concept

Coaches contribute their methodology to power custom AI coaching personas:
- Coach's methods, frameworks, and session recordings train a persona
- Users interact with the AI coach during the discovery flow
- Output is always a functional lens document
- Revenue sharing and brand extension as incentives
- Growth flywheel: more coaches → more users → better data → better lenses → more coaches

James Pratt as first contributing persona (SKILL.md exists). Coach onboarding flow documented in FigJam.

---

## Product Architecture

```
FREE TIER:
  User → Intake Form (context upload + AI discovery) → Lens Document (.md + YAML)

PAID TIER ($50/mo):
  Lens Document → n8n Scoring Pipeline → Daily Briefing Email
    ├── Job Alert Parser (Brave Search enrichment + Claude scoring)
    ├── VC Portfolio Scraper (company discovery + CS-leader fit eval)
    └── Feedback Loop (user engagement signals recalibrate weights)

COACH CHANNEL (B2B2C):
  Coach Partner → Facilitates deeper discovery + Methodology encoded as AI persona

ENTERPRISE (Future):
  Role Lens (company-side) ↔ Candidate Lens = Bidirectional matching
  Differentiated from: ATS (keyword matching), DISC/StrengthsFinder (static, no matching),
    360 Feedback (backward-looking), Jack & Jill (no depth)

BIDIRECTIONAL SCORING ENGINE (Specified March 21):
  Candidate Lens → C→R Score (6 candidate dimensions)
  Role Lens → R→C Score (6 role dimensions)
  Combined → Mutual Fit Score + Match Report
  Gate Tolerance + Analysis Depth sliders control evaluation mode
```

---

## GTM: Four Phases

1. **Validate (Now)** — Build intake form, test with Nathan + James, collect feedback via Airtable
2. **Free Tool Launch** — Deploy intake form (Vercel / tide-pool.org), free lens generation, Todd's network + coach referrals, build email waitlist
3. **Paid Product** — Connect lens to n8n pipeline, daily briefing emails, $50/mo Stripe subscription, passive monitoring as retention engine
4. **Scale** — Onboard coaches 2-5, enterprise role lens, coach channel revenue (B2B2C), raise on data flywheel + coach network moat

---

## IP Protection Strategy — NEW March 21

**Status:** Active. IP protection framework established with three components:

1. **Prior art documentation:** IP Summary emailed to self March 21, 2026. GitHub commit histories in `zelman/tidepool` and `zelman/job_search` repos provide timestamped evidence from Dec 2025 onward. Claude AI conversation logs across multiple projects.

2. **NDAs:** Mutual NDA template created and ready for use with Nathan, James, Todd, and Ravi. To be signed before next substantive sharing session with each person.

3. **Provisional patent consideration:** Prior art search recommended for bidirectional lens matching system and focal length/aperture scoring mechanism. Free patent attorney consultation as next step. Provisional filing ~$200 (micro-entity).

**Contributor IP boundaries (documented in IP Summary):**
- **James Pratt:** His coaching methodology (Be-Have-Do, Authentic Presence, IAM Model) is his IP. The system for encoding it into an AI persona, the technical architecture, and the lens document format are Eric's.
- **Nathan:** Contributed the bidirectional reframe. Underlying architecture, scoring, implementation predate his involvement. No formal agreement yet.
- **Todd:** Advisory input (freemium GTM). No formal agreement yet.
- **Ravi:** Advisory/conversational only.

---

## Key Learnings & Principles

- **Signal matching over keyword matching** — the core thesis
- **Lens works bidirectionally** — candidate lens scores companies; role lens scores candidates (Nathan's reframe, now fully specified)
- **Freemium as distribution, not revenue** — Todd's instinct; value is coach adoption and data flywheel
- **Coaching ROI solved by the lens** — concrete, measurable outcome
- **Coach channel as quality moat** — self-serve can't replicate coach-facilitated depth
- **Passive monitoring as retention engine** — makes the business investable
- **LinkedIn recommendation curation is a signal** — what users choose to display reveals self-concept
- **Swiss Style for product identity** — invisible design, content does the work
- **Asymmetric scoring is the correct model** — candidate and company ask different questions, so dimensions and weights differ per direction
- **Hard gates in code, not prompts** — learned from 74% false-positive rate in job search pipeline
- **Feedback loop must surface drift, not silently correct** — "append, don't overwrite" applies to the learning system too

---

## Design Principles

- Swiss Style: white, black type, red/orange accent, zero border-radius, hairline rules
- Signal matching over keyword matching
- Identity as relational and evolving, not fixed
- Append, don't overwrite
- Concrete outcomes unlock adoption
- Predictive signals over reactive job boards
- The design is invisible — content does the work

---

## Current Status (March 21, 2026)

**Phase:** Active build + IP protection.

**What happened this session (March 21):**
- Established IP protection framework (IP Summary document, Mutual NDA template)
- Built full Bidirectional Lens System specification — role lens schema, matching algorithm, match report format, feedback loop, worked example (Eric × LeanData)
- Built Role Lens Scorer (R→C direction) with Gate Tolerance + Analysis Depth sliders, 9 named modes, Swiss Style
- Created comprehensive candidate test profile from coaching sessions and agent lens materials
- Defined contributor IP boundaries for all four collaborators
- Identified provisional patent path for bidirectional matching and focal length/aperture mechanisms

**Nathan:** Testing James Pratt coaching persona implementation. A/B/C collaboration options still pending.

**James Pratt:** Engaged on AI coaching partnership. First persona. NDA to be signed before next session.

**Todd:** Interested if project formalizes. Freemium GTM model being tested via Q8 in feedback form. NDA to be signed.

**Ravi:** Advisory involvement. NDA to be signed.

## Open Questions

- **Wiring discovery phase:** The intake form's Phase 4 is a placeholder. Need to integrate the Claude API conversation from `lens-form.jsx` into the new `lens-intake.jsx` flow.
- **Vercel deployment:** Feedback form is ready to deploy. Intake form needs the same treatment.
- **Nathan's role:** A/B/C collaboration options still pending decision. NDA needed before any deeper engagement.
- **Pipeline connection:** How does the lens document connect to a generalized scoring pipeline? Fork of v9 or new build?
- **Repo:** No dedicated repo yet. Growing artifact set strongly suggests it's time.
- **Port original lens-scorer.jsx to Swiss Style?** Currently dark theme, inconsistent with all other product artifacts.
- **Prior art search:** Google Patents + USPTO search for bidirectional identity-signal matching to validate provisional patent path.
- **NDA signing cadence:** All four collaborators need signed NDAs before next substantive demos.

---

## File Inventory (all artifacts, current as of March 21)

| File | Type | Description |
|------|------|-------------|
| `lens-intake.jsx` | React | Current intake form, 4 phases, Swiss Style |
| `lens-form.jsx` | React | Original intake form, 8 discovery sections, Claude API |
| `lens-scorer.jsx` | React | C→R scorer, dark theme, 5 dimensions |
| `role-lens-scorer.jsx` | React | R→C scorer, Swiss Style, 6 dimensions, dual sliders, 9 modes |
| `lens-feedback-form.jsx` | React | User testing feedback, Swiss Style, 8 questions |
| `lens-feedback.zip` | Deploy | Vercel-ready feedback form + serverless API |
| `bidirectional-lens-system.md` | Spec | Full system spec: role lens, algorithm, match report, feedback loop |
| `eric-zelman-test-profile.md` | Test | Candidate test profile for R→C scorer testing |
| `Lens_Project_IP_Summary_20260321.docx` | Legal | IP declaration, 17 artifacts cataloged |
| `Lens_Project_Mutual_NDA.docx` | Legal | Reusable mutual NDA, RI governing law |
| `lens-coach-pitch-v3.pptx` | Deck | Coach audience, 10 slides |
| `lens-investor-pitch-v3.pptx` | Deck | Investor audience, 12 slides, $750K ask |
| `lens-launch-plan.docx` | Plan | 4-phase GTM with metrics |
| `lens-financial-model.xlsx` | Model | 12-month burn, KPIs |
| `storyboard-flows.docx` | Design | Path A/B, pipeline architecture, predictive signals |
| `role-lens-schema.md` | Schema | Superseded by bidirectional-lens-system.md |

---

*This project is where the archive practice, the coaching work, and the job search automation converge into a product. The personal system proves the model; this project is about making it work for others.*
