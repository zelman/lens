# CONTEXT.md — Lens Project

*Last updated: March 24, 2026*

This is the living context file for the Lens Project — an AI-assisted career identity discovery system with bidirectional job matching. Lives at the root of `zelman/lens` repo. Update when things change.

---

## Naming Disambiguation

- **Lens Project** — this product. Standalone repo: `zelman/lens`. Domain TBD (not tide-pool.org).
- **Tide Pool Job Search** — Eric's personal job search automation (v9 pipeline, VC scrapers). Repo: `zelman/job_search`. Managed in "Job Search 2" Claude Project.
- **Tide Pool Archive** — personal curation project at tide-pool.org. Repo: `zelman/tidepool`.
- **Agent Lens** — Eric's personal portable context doc (v2.15). Lives at `zelman/tidepool` repo root. Consumed at runtime by n8n job search workflows via raw GitHub URL. The template for what this product produces for others.

---

## What This Is

An AI-assisted system that helps people articulate their professional identity through structured discovery (optionally coach-facilitated), producing a "lens document" — markdown with YAML frontmatter — that governs automated, bidirectional job opportunity scoring. The core principle is **signal matching over keyword matching**.

Two directions:
- **Candidate → Role (C→R):** The user's lens scores companies and roles against their identity signals.
- **Role → Candidate (R→C):** A company's role lens scores candidates against relational and cultural fit signals.

The insight: generic AI coaching struggles with ROI. When coaching produces a functional lens document that governs daily job scoring and briefings, the outcome becomes concrete and measurable. When the same system works bidirectionally, it becomes an enterprise hiring product.

---

## Key People

- **Nathan Fierley** — potential co-builder. Independently developing AI coaching concept. Testing the James Pratt coaching persona implementation. Proposed A/B/C collaboration options (decision pending). Priority audience for investor deck.
- **James Pratt** — Eric's career coach (Nov-Dec 2025). First contributing coach persona (SKILL.md exists). Engaged on AI coaching partnership. Session archive as potential training material. NDA pending.
- **Todd Gerspach** — Eric's previous career coach. Extensive C-level network. Met recently, expressed interest in contributing if the project formalizes as a business. Proposed freemium GTM model (free sample report as lead gen, paid coaching + extended reports as revenue). Potential angel intro source. NDA pending.
- **Ravi** — advisory. NDA pending.

---

## What's Been Built

### Core IP Documents

**Bidirectional Lens System Spec** (`specs/bidirectional-lens-system-v1.0.md`)
~4,000-word technical specification. Role lens schema (8 sections mirroring candidate lens), asymmetric matching algorithm with different weight distributions per direction:
- C→R weights: Mission 25, Role 20, Culture 18, Skill 17, Work Style 12, Energy 8
- R→C weights: Builder Signals 25, Relational Intelligence 22, Domain Expertise 18, Values Alignment 15, Work Style 12, Energy & Sustainability 8

Dimension cross-mapping between directions, hard gate logic in code (not prompt), Gate Tolerance x Analysis Depth = 9 named evaluation modes, Mutual Fit formula = (C→R x 0.5) + (R→C x 0.5), Match Report format, worked example Eric x LeanData MF:72.

**Feedback Loop Learning System Spec** (`specs/feedback-loop-spec-v1.0.md`)
~3,500-word standalone IP document covering:
- Signal taxonomy: 12 explicit + 8 implicit signals with strength/direction values
- Signal decay: effective_strength = base_strength x e^(-lambda x days), configurable lambda (0.01 default, half-life ~69 days). Asymptotic, never reaches zero. Alternative embodiments: lambda=0.03 (urgent), lambda=0.005 (passive), adaptive lambda
- Weight adjustment: 4-step algorithm (contribution ratios, adjustment x learning_rate 0.02, floor 3/ceiling 40, renormalize to 100). Cold start: learning_rate 0.04 for first 20 signals
- Disqualifier refinement: >60% pursued rate triggers relaxation suggestion; 10 skips in 7 days triggers new gate suggestion
- Drift detection: stated vs. revealed weights over 30-day trailing window. Thresholds: 0-10 aligned, 11-20 minor, 21-30 notable, 31+ significant. Three-option UX
- 6 collection points: at delivery, 48hr, after outreach, after interview, after outcome, monthly reflection
- Global model: activated at 100+ users per cohort, 50+ pattern instances
- Build status: SPECIFIED. Not running in n8n. Pipelines are static-weight scoring only.

### Components (React JSX)

**Role Lens Scorer R→C** (`components/role-lens-scorer-v1.3.jsx`) — Swiss Style, 9 evaluation modes (Gate Tolerance x Analysis Depth sliders). Deployed to Vercel with serverless API proxy (`api/score.js`). Uses structured LLM prompting with JSON output schema. Reduced false-positive rate from ~74% to <15%.

**Candidate Lens Scorer C→R** (`components/lens-scorer.jsx`, v2.15) — Dark theme, operational 4+ months. Needs Swiss Style port. The original scorer that powers Eric's personal job search pipeline.

**Lens Intake Form** (`components/lens-intake.jsx`, v1.0) — Swiss Style. Intro page + context upload (5-category file upload: resume, LinkedIn PDF, writing samples, assessments, anything else). Phase 4 (discovery) still placeholder. Session persistence (phase + status saved).

**Lens Discovery Form** (`components/lens-form.jsx`, v1.0, ~800 lines) — Live Claude API integration (Sonnet). 8 discovery sections with per-section system prompts (Essence, Skills, Values, Mission, Work Style, Energy, Disqualifiers, Situation). Typewriter effect. YAML frontmatter + markdown output. This is the core discovery engine. Needs integration into lens-intake.jsx.

**Lens Feedback Form** (`components/lens-feedback/`, v1.0) — Swiss Style, 8 questions, Q8 tests freemium pricing model. Airtable backend (tblUAyulKOKXiRoOx in archive base). Vercel-deployable (api/submit.js + public/index.html + vercel.json). Ready to deploy.

### Decks (Swiss Style, pptxgenjs)

**Investor Pitch Deck** (`docs/lens-investor-pitch-v5.3.pptx`) — 18 slides with full speaker notes on every slide. Includes: TAM $35.2B / SAM $4.2B / SOM $12M Y3, 3-stream revenue model (B2C + Coach B2B2C + Enterprise), bootstrapping path to breakeven at ~100 subscribers, expansion markets (internal mobility, founder-investor, team composition, outplacement), build status labels (Running/Specified/Done), competitive patent column, dual ask (bootstrap OR $750K seed).

**Coach Pitch Deck** (`docs/lens-coach-pitch-v4.pptx`) — 11 slides. Bidirectional slide, enterprise opportunity, feedback loop as coaching philosophy.

### Legal Documents (LOCAL ONLY — never in git)

**Provisional Patent — FILED March 24, 2026**
- Application #: 64/015,187
- Confirmation #: 1709
- Patent Center #: 74987549
- Entity status: Micro ($65 fee paid)
- **Deadline to convert to nonprovisional: March 24, 2027** (calendar reminders set)
- Filed spec: `Provisional_Patent_Specification_Filed_v2.0_20260324.docx`
- Filed drawings: `Provisional_Patent_Drawings_v2.0_20260324.pdf`
- Receipt: `USPTO_Receipt_64-015-187_20260324.pdf`

10 claims (3 independent: identity document as scoring governance, asymmetric bidirectional matching, transparent preference drift detection). Alternative embodiments: internal mobility, founder-investor, team composition, coach-client, outplacement.

**Prior Art Landscape** (v1.0) — DONE. Research complete. Key finding: no competitor has filed on identity-signal matching, asymmetric bidirectional scoring, or transparent preference drift detection. Korn Ferry US10346804 is closest but distinguishable.

**IP Summary** (v1.1) — 17 artifacts cataloged, contributor IP boundaries, timestamped authorship declaration.

**Mutual NDA** (v1.0) — RI governing law, 2-year term. Section 5 IP ownership clause. Sign with Nathan, James, Todd, Ravi.

### Supporting Documents

**Core Narrative** (`docs/core-narrative.md`, v1.1) — The single source for all product positioning. Every deck, one-pager, and audience document derives from this. Sections: The Problem, What Exists, What a Lens Is, The Feedback Loop, Signal Matching Over Keyword Matching, Bidirectional Scoring, Where It Stands, Audience Routing (job seekers, hiring leaders, coaches, investors, testers).

**Lens for Beginners** (`docs/Lens_for_Beginners_v1.1.docx`) — Shareable explainer. Problem, what a lens is, comparison table (Resume/ATS vs Personality Tests vs Lens), 4-step how it works, bidirectional explanation, who it's for. Closing pull-quote about replacing resumes with a structured identity system.

**Launch Plan** (`docs/lens-launch-plan-v2.0.docx`) — 4 phases with dates, deliverables (DONE markers for Phase 1), success metrics tables, risk mitigations.

**Eric Zelman Test Profile** (`docs/eric-zelman-test-profile-v1.0.md`) — Pasteable test profile for R→C scorer demos.

### Config

**James Pratt SKILL.md** (`config/James_Pratt_Skill.md`) — Coach persona encoding. Be-Have-Do, Authentic Presence (Essence + Pathway), IAM Model (Intention, Attention, Manifestation), Tide Pool vs. Buoy metaphor.

**Agent Lens** (v2.15, lives in `zelman/tidepool` repo) — Monolith at repo root for n8n backward compat. Three-file user architecture in `users/` (lens.md, scoring.yaml, sources.yaml). Dual-mode scoring-config.yaml.

### FigJam Diagrams (10 total, Mermaid format)

Original 7: User flow, product architecture, GTM phases, UX storyboard, data flow, coach onboarding, enterprise role lens.

3 added March 22: Product Architecture v2 (4 tiers with bidirectional scoring), Feedback Loop Architecture v1 (6 collection points, 3 levels, drift detection), User Journey Storyboard v2 (3-month practical timeline).

Note: FigJam/Figma MCP generates Mermaid-format only. No control over typography or design language.

### Airtable Tables

- **Lens Feedback** (tblUAyulKOKXiRoOx in appFO5zLT7ZehXaBo) — user testing feedback collection
- **Lens Plan** (tblXSpTl6d8U5Q0YY in appFO5zLT7ZehXaBo) — kanban board for project tasks
- **Artifact Registry** (tblcE723hIH692lSy in appFO5zLT7ZehXaBo) — tracks all artifacts with version, category, location, git status, deploy status. 24+ rows. Single source of truth for what exists and where.

---

## Product Architecture

```
FREE TIER:
  User -> Intake Form (context upload + AI/coach-persona discovery)
    -> Lens Document (.md + YAML frontmatter)

PAID TIER ($50/mo):
  Lens Document -> n8n Scoring Pipeline -> Daily Briefing Email
    |-- Job Alert Parser (Brave Search enrichment + Claude scoring)
    |-- VC Portfolio Scraper (company discovery + fit evaluation)
    |-- Feedback Loop (user signals recalibrate weights over time)

COACH CHANNEL (B2B2C):
  Coach Partner -> Facilitates deeper discovery -> Methodology encoded as AI persona
    -> Revenue sharing + brand extension

ENTERPRISE (Future):
  Role Lens (company-side) <-> Candidate Lens = Bidirectional matching
    -> Match Reports with Mutual Fit scores, gate analysis, interview questions
    -> Differentiated from: ATS (keyword), DISC/StrengthsFinder (static),
      360 Feedback (backward-looking), Jack & Jill (no depth, no document, no feedback loop)
```

---

## Competitive Landscape

Patent search results (March 2026):
- Greenhouse: no patents on matching methods
- Lever: no patents
- Gallup/CliftonStrengths: copyright/trade secret only, no utility patents, no job matching
- DISC: public domain since 1928
- Jack & Jill ($20M seed, est. 2025): zero patent filings. 10-20 min intake, symmetric matching, no structured document, no feedback loop
- Korn Ferry: US10346804 (2019) — four-category self-assessment, unidirectional, no coaching discovery, no feedback loop. Closest prior art but distinguishable on method, direction, and adaptivity.

Key differentiation: No competitor has filed on identity-signal matching, asymmetric bidirectional scoring, or transparent preference drift detection.

---

## GTM: Four Phases

1. **Validate (Now)** — Build intake form, test with Nathan + James, collect feedback via Airtable. Patent filed March 24, 2026.
2. **Free Tool Launch** — Deploy intake form (Vercel), free lens generation, Todd's network + coach referrals, email waitlist
3. **Paid Product** — Connect lens to n8n pipeline, daily briefing emails, $50/mo Stripe, passive monitoring as retention engine
4. **Scale** — Onboard coaches 2-5, enterprise role lens, coach channel revenue (B2B2C), raise on data flywheel + coach network moat

---

## Revenue Model

| Stream | Year 1 | Year 2 | Year 3 |
|--------|--------|--------|--------|
| B2C (subscriptions) | $30K | $180K | $600K |
| Coach B2B2C | $12K | $72K | $180K |
| Enterprise | $0 | $60K | $420K |
| Total | $42K | $312K | $1.2M |

94% gross margin. Breakeven at ~100 subscribers.

---

## Repo Structure

```
github.com/zelman/lens/
|-- CONTEXT-lens-project.md          # This file
|-- ARTIFACT-WORKFLOW.md             # Commit workflow + artifact management rules
|-- specs/                           # Core IP documents
|-- components/                      # React JSX components + Vercel packages
|-- docs/                            # Decks, plans, explainers
|-- config/                          # Coach personas, scoring configs
|-- legal/                           # .gitignore'd — NEVER committed
```

See ARTIFACT-WORKFLOW.md for the three rules: registry row immediately, git commit checklist per session, legal never in public git.

---

## Artifact Management

**Airtable Artifact Registry** (tblcE723hIH692lSy in appFO5zLT7ZehXaBo) is the single source of truth. Every artifact gets a row tracking name, version, category, filename, location, git status, deploy status, and notes.

Workflow: Claude.ai creates artifacts -> adds registry row -> Eric downloads files -> Claude Code commits to git -> registry updated with In Git = true. Legal docs stay local only.

---

## Build Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Intake form (intro + upload) | Running | Swiss Style, needs discovery wiring |
| Discovery form (lens-form.jsx) | Running | ~800 lines, Claude API, 8 sections |
| Feedback form | Running | Swiss Style, Airtable backend, ready for Vercel |
| Role Lens Scorer (R->C) | Running | Deployed to Vercel, 9 modes |
| C->R Scorer | Running | Dark theme, operational 4+ months |
| Bidirectional Lens System | Specified | v1.0 spec complete, not implemented |
| Feedback Loop Learning System | Specified | v1.0 spec complete, not in pipeline |
| Enterprise role lens | Specified | Spec done, intake not built |
| Connect lens to n8n pipeline | Designed | Architecture clear, not wired |
| Daily briefing email | Designed | Template concept, not built |
| Stripe integration | Planned | Phase 3 |
| Coach onboarding #2/#3 | Planned | After James Pratt validates model |

---

## Funding Situation (March 2026)

Unemployment ends ~5 weeks (late April 2026). Infrastructure cost: ~$200-300/month currently, scales to ~$500/month at 100 users. n8n scalability is a Phase 3 problem (not before ~100 paying users).

Paths (priority order):
1. Personal loan from father-in-law (~$25K) — promissory note, NOT equity/SAFE. Covers 3-4 months.
2. Angel round via Todd's network ($100-150K) — SAFE note. v5.3 deck works.
3. Fractional CS work — bridge income, materials exist from February.
4. Accelerator (YC/Techstars) — $125-500K for 7-10%, but timeline doesn't solve 5-week problem.

The real raise: $750K seed for engineering team + scaling infrastructure. But bootstrapping path exists: breakeven at ~100 subscribers without any external capital.

---

## Key Learnings & Principles

- **Signal matching over keyword matching** — the core thesis
- **Lens works bidirectionally** — candidate lens scores companies; role lens scores candidates. This unlocks enterprise.
- **Freemium as distribution, not revenue** — Todd's instinct; value is coach adoption and data flywheel
- **Coaching ROI solved by the lens** — when coaching produces a functional document that governs scoring, the outcome is concrete
- **Coach channel as quality moat** — self-serve can't replicate coach-facilitated depth
- **Passive monitoring as retention engine** — makes the business investable
- **Integration over performance** — authentic voice and values alignment matter more than performing expected roles
- **Append, don't overwrite** — applies to metadata, self-reflection, and the feedback loop's weight adjustment
- **Swiss Style for product identity** — invisible design, content does the work

---

## Design Language ("Briefing Style")

Swiss base: white background, black type, #D93025 red primary, zero border-radius, hairline rules. Layered richness: all-caps spaced section labels in red, #2D6A2D green for positive signals, #E8590C orange for secondary, monospace for scores, subtle card borders (#EEE), #F0F0F0 container background, tinted signal pills. DM Sans / DM Mono typography.

Apply to ALL decks and product materials.

---

## Immediate Action Items

- [x] File provisional patent — **DONE March 24, 2026** (Application #64/015,187)
- [x] Create zelman/lens repo — **DONE** (committed all artifacts)
- [x] Prior art search — **DONE** (prior-art-landscape-v1.0.docx)
- [x] Deploy feedback form to Vercel — **DONE** (https://lens-feedback.vercel.app)
- [ ] Email IP Summary to self — zelman@gmail.com, timestamp is evidence
- [ ] Sign NDAs with Nathan, James, Todd, Ravi before next substantive demos
- [ ] Choose product domain (not tide-pool.org)
- [ ] Reach out to Todd — show v5.3 deck, ask for 2-3 angel intros
- [ ] Wire discovery phase — integrate lens-form.jsx into lens-intake.jsx Phase 4
- [ ] Build father-in-law one-pager — simple promissory note framing, separate from investor deck
- [ ] Restart fractional CS outreach — bridge income

---

## Open Questions

- **Nathan's role:** A/B/C collaboration options pending decision. NDA first.
- **Product domain:** tide-pool.org reserved for archive. Need new domain for Lens product.
- **Pipeline connection:** How does the generalized lens connect to scoring pipeline? Fork of v9 or new build?
- **n8n scalability:** Current architecture works to ~100 users. Phase 3 problem.
- **Coach persona format:** James Pratt SKILL.md exists. What's the standardized format for coach #2, #3?

---

*This project is where the archive practice, the coaching work, and the job search automation converge into a product. The personal system proves the model; this project is about making it work for others.*
