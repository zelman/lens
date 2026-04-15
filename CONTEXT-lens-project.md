# CONTEXT.md — Lens Project

*Last updated: April 12, 2026*

This is the living context file for the Lens Project — a bidirectional identity marketplace for hiring, currently in active tester validation with a provisional patent filed. Update when things change.

---

## Naming Disambiguation

This project is about **productizing** the approach Eric built for himself. The related but separate workstreams:

- **Tide Pool Job Search** — Eric's personal job search automation (v9 pipeline, VC scrapers, scoring). Operational system, managed in Job Search 2 project + Claude Code for n8n workflow engineering.
- **Tide Pool Archive** — personal curation project at tide-pool.org (separate Claude Project). tide-pool.org is Archive only — do NOT embed it in Lens product materials.
- **Tide Pool Agent Lens** — Eric's personal portable context document (v2.15). The lens concept originated here; this project is about making it a product for others.

**Repos (all `github.com/zelman/`):**
- `lens` — product repo (`components/`, `schemas/`, `docs/`, `scoring-config.yaml`, `review-profiles/`). This is the canonical product codebase.
- `tidepool` — agent lens monolith + cross-project context. Has NO `lens/` subdirectory.
- `job_search` — pipeline code
- `work` — resume + career materials

**Company:** Zelman Labs LLC (Rhode Island). EIN obtained. SAM.gov registration in progress.

---

## What This Is

A bidirectional identity marketplace for hiring where candidates and companies each create structured identity documents — lenses — through AI-coached discovery, and a matching engine scores compatibility, flags tensions, and produces briefings instead of job alerts.

**Core thesis:** Signal matching over keyword matching. A lens document captures behavioral signals — values as demonstrated through action, energy sources, communication patterns, cultural needs, disqualifiers — not just skills and experience.

**Bidirectional:** Candidate lens scores companies (C→R). Role lens scores candidates (R→C). Both sides produce structured documents. Matching operates on who people actually are, not who they claim to be.

**Academic foundation:** Oh, Wang & Mount (2011, *Journal of Applied Psychology* 96:4) — observer ratings of personality predict job performance significantly better than self-report ratings. This is the empirical basis for why coached discovery (an informed observer challenging self-assessment) produces more predictive identity documents than surveys or self-directed AI chat.

**Tagline direction:** "The indelible you. Not the ATS-optimized, job-specific you."

**IP:** Provisional patent filed March 24, 2026 — App #64/015,187, micro entity. Nonprovisional conversion deadline: March 24, 2027. Microsoft patent US20250378320A1 flagged as potential prior art — attorney review required before conversion.

---

## Key People

### Core Team
- **Eric Zelman** — Founder/Product. 18+ years CS/CX/Support leadership. Built the personal system that proves the model.
- **Nathan Fierley** — Potential co-builder. Tested James Pratt persona. Reframed product toward enterprise hiring and bidirectional matching. No formal commitment — role TBD. No NDA needed.

### Coaches & Advisors
- **James Pratt** — Career coach (Nov–Dec 2025). First contributing coach persona. Methodology encoded: Be-Have-Do, Authentic Presence, Essence Statement, IAM Model. Session library is the basis for the first AI coaching persona. Challenged enterprise precision assumption (3/30/26). NDA pending.
- **Todd Gerspach** — Previous career coach, extensive C-level network. Freemium GTM advocate (free lens as lead gen → paid coaching + extended reports). NDA pending.

### Validation Contacts
- **Edie Hunt** (hunt.edith@gmail.com) — Retired Goldman Sachs partner (~30 yrs), COO Human Capital Management, Chief Diversity Officer. Built Goldman Returnship program. Produced the most significant strategic reframe (4/7/26): deep discovery only justified at $300K+/board-level hires; executive recruiters (not HR, not coaches) are the likely buyer; coach market too diffuse for volume. NDA pending review.
- **Anne Birdsong** — 20+ yrs CPG sales leadership (Kimberly-Clark, General Mills, PepsiCo, Kraft). Has hired extensively at Director+ level. Validation contact.
- **Rob Birdsong** — VP Google Cloud Consulting North America, ~1,200 reports. Validation contact for enterprise internal mobility thesis.
- **Jenn Monkiewicz** — Fractional CPO, built custom AI HR system with SCX.ai. LinkedIn outreach sent 4/5/26 via David Keane connection.

### Testers
- **Jared Hibbs** — Completed full discovery flow. Submitted structured feedback.
- **Brendan McCarthy** — ~2 hours. Flagged repetitive questioning. Recruited by Edith McCarthy.
- **Niels Godfredsen** — Engineer, consulting at Remedy. Demoed product 4/4/26, committed to testing.
- **Graham Jerabek** — Tester. Strongest positioning feedback: simplify pitch, use Jack & Jill as anchor comparison.
- **Luis Sampaio** — Tester. Challenged assumption that product only works for people who already know what they want. Advocated fully free model first.
- **Ravi Katam** — Longtime CS colleague from Bigtincan, early tester.

### Other
- **Edith McCarthy** — Demoed product, recruited testers Brendan and Graham. NDA pending. Separate from Edie Hunt.
- **David Keane** — Bigtincan founder. Connected Jenn Monkiewicz intro.
- **Howard** — Eric's father-in-law. Introduced Edie Hunt.

---

## What's Been Built

### Serverless Proxy Architecture (Vercel)
- `/api/discover` — Claude API discovery calls (405 on GET = confirmed live)
- `/api/synthesize` — lens synthesis (405 on GET = confirmed live)
- `/api/score` — opportunity scoring (405 on GET = confirmed live)
- `/api/score-role` — role-side scoring (returns 404 — unbuilt, P1 lower urgency given narrowed enterprise timeline)
- Security verification (manual browser check) is the gate before any new tester URLs go out.

### React Intake Form (LensIntake.jsx, ~2200 lines)
Live Claude API integration (Sonnet). Full 8-section discovery flow with session persistence.

**Discovery sections:**
1. Essence — identity patterns, throughline across contexts
2. Skills & Experience — what to carry forward vs. leave behind
3. Values — behavioral evidence, not poster values
4. Mission & Sector — specific orgs/problems worth their time
5. Work Style — how they actually work, not interview answers
6. What Fills You — energy sources vs. drains
7. Disqualifiers — hard no's that feed the exclusion filter
8. Situation & Timeline — urgency, constraints, runway

**Guardrails:** Single-question constraint (`config/guardrails.yaml`). Three tester-driven fixes shipped: bias in discovery prompts toward Eric's profile, redundant questioning across sections, missing privacy disclosure at flow start.

**Persistence:** Phase, status, and file metadata saved to storage on every change. Files need re-upload on return (binary can't serialize), but user gets warm notice.

### Synthesis & Output
- `SYNTHESIS-PROMPT.md` — defines third-person narrative voice for AI-generated lens sections
- `lens-report-renderer.jsx` — International Style PDF output
- YAML frontmatter + markdown body format
- 6 scoring dimensions: Mission (25%), Role Fit (20%), Culture (18%), Skill (17%), Work Style (12%), Energy (8%)

### Original Intake Form (`lens-form.jsx`, ~800 lines)
Earlier version. 6 phases: status → resume → intro → discovery → synthesis → done. Reference for discovery conversation implementation.

### User Testing Feedback Form (`lens-feedback-form.jsx`)
International Style, 8 structured questions. Q8 tests freemium pricing (mirrors Todd's GTM model). Vercel-deployable with serverless Airtable proxy.

### Media Intake Spec
`lens-media-intake-spec-v1.0.md` — audio/video intake specification. AssemblyAI recommended for speaker diarization. Registered in Artifact Registry. Not yet implemented.

---

## Design Language: International Style ("Briefing Style")

Adopted March 2026. Wife-approved. Applied to ALL decks and product materials.

- **Background:** White (#FFFFFF)
- **Typography:** Helvetica Neue / Helvetica / Arial, sans-serif
- **Primary accent:** Red (#D93025)
- **Positive signals:** Green (#2D6A2D)
- **Secondary accent:** Orange (#E8590C)
- **Monospace:** For scores and data
- **Rules:** Hairline rules, zero border radius
- **Section labels:** All-caps, spaced, in red. Do NOT use wide `characterSpacing` on headers — use standard letter spacing.
- **Cards:** Subtle borders (#EEE), gray (#F0F0F0) container backgrounds, tinted signal pills

The design is invisible — content does the work.

---

## Three-Sided Platform

- **Candidates** create lens documents through AI-coached discovery. They own the file. Every opportunity gets scored against it.
- **Coaches** contribute methodologies to power custom AI coaching personas. Revenue share on every lens their persona produces. Different styles serve different candidate profiles.
- **Companies** create role lenses — structured documents about who actually thrives in a specific role — through coach-facilitated discovery. Match against candidate lenses.

The coach layer is the quality gate. Without it, the product is just another personality quiz.

---

## Business Model Direction

| Stream | Price | Function |
|---|---|---|
| Free AI Lens | $0 | Full 8-section discovery. Distribution + data flywheel. |
| Coach Lens (premium) | $49-149 | Coach persona + artifacts. Higher quality. Rev share to coach. |
| Coach Platform | $500/month | Per active AI persona. Methodology encoding + analytics. |
| Company Role Lens | $2,500 | Company-side discovery. Structured role document + matching access. |
| Placement revenue (future) | 5-10% of salary | When marketplace matches produce hires. |

**Freemium model:** Free lens intake as methodology demonstration; paid for scored briefings or enterprise use.

**Funding pathways:** Bootstrap ($2-5K), contractor-assisted ($30-50K), full team pre-seed ($750K), and NSF SBIR Phase I ($275K, non-dilutive). SBIR pitch drafted (v0.3). RI Innovate Fund (STAC) identified as matching grant source.

---

## Competitive Landscape

Canonical source: `specs/lens-competitive-landscape.md` in the lens repo (16+ entries).
Per-competitor source of truth: Airtable Competitive Intelligence table (`tbl1n2MWWpmlJqhmf`).

**Key competitors:**
- **Jack & Jill AI** — Closest competitor. Two-sided AI recruiting marketplace. $20M seed. 20-minute intake (shallow). No portable document. No coach layer. Contingency fee model.
- **Textkernel** — "Bimetric scoring" — bidirectional matching prior art. Skills-only, symmetric dimensions. Proves the concept has enterprise traction. Distinguished from Lens by asymmetric identity-signal architecture.
- **SquarePeg** — Cautionary prior art. Attempted bidirectional psychometric matching, pivoted to AI resume screening. Strongest signal that market adoption (not theoretical superiority) is the risk.
- **Eightfold AI** — Enterprise talent intelligence, skills-based. Internal mobility marketplace. No identity layer.

**The gap:** No existing tool collects deep behavioral identity data on BOTH sides of a hire and matches on it. Every tool profiles candidates deeply and companies shallowly (or not at all).

---

## Validation Findings (as of April 2026)

**Enterprise thesis — narrowed but validated directionally:**
- Deep discovery only justified at $300K+/board-level hires (Edie Hunt, 4/7/26)
- Executive recruiters (not HR, not coaches) are the likely buyer
- Coach market too diffuse for volume distribution
- Internal mobility is the sharpest enterprise wedge (Aptitude Research: 77% lost talent, 70% investing more, only 25% confident)

**Consumer-first signal convergence:**
- James Pratt (3/30/26): consumer self-service for mid-career professionals more validated than enterprise hiring precision
- Multiple testers confirmed self-discovery value independent of job search
- Edie Hunt (4/7/26): narrowed enterprise wedge reinforces consumer-first launch sequence
- Emerging posture: lead with consumer tool, let enterprise follow through exec recruiters and internal mobility

**Tester feedback patterns:**
- Session persistence is a confirmed blocker (flagged by multiple testers)
- Privacy disclosure at flow start is necessary for trust
- Redundant questioning across discovery sections degrades experience
- Prompt bias toward Eric's profile must be actively prevented
- 45-minute session length is a feature (coaching depth), but save/return capability needed
- "This only works for people who know what they want" (Luis) — pitch isn't yet landing the coaching-guided discovery distinction

---

## Airtable Tables (base `appFO5zLT7ZehXaBo`)

| Table | ID | Purpose |
|---|---|---|
| Lens Plan (kanban) | `tblXSpTl6d8U5Q0YY` | Single source of truth for action items |
| Feedback | `tblUAyulKOKXiRoOx` | Structured tester feedback (8 questions) |
| Testers | `tbl2PmUHEnwytU3Q8` | Tester roster and status |
| Competitive Intelligence | `tbl1n2MWWpmlJqhmf` | Per-competitor source of truth |
| Artifact Registry | `tblcE723hIH692lSy` | All artifacts with versions |
| Feedback Archive | `tbl0Ec6OPqPqyDTDB` | Qualitative discussion notes |
| Meetings | `tblvk5GWuVmtpG1w1` | Meeting records |
| Claude Code Sessions | `tblLgWUHElcbKABKF` | Syncs context between Claude Code and Claude AI |

**Claude Code Sessions workflow:** Claude Code should write a row to this table ([view](https://airtable.com/appFO5zLT7ZehXaBo/tblLgWUHElcbKABKF/viwm16G91N1PhRL0V)) when completing code changes, so Claude AI has visibility into recent work. This is part of the **session-wrapup skill** — include Sessions table updates in the cleanup/handoff checklist. Claude AI should check this table when picking up work after a gap or when Claude Code activity is uncertain. Job Search equivalent: `tblHhzGpsgNJUIqy0` in base `appFEzXvPWvRtXgRY` ([view](https://airtable.com/appFEzXvPWvRtXgRY/tblHhzGpsgNJUIqy0/viwQhRbvnMi7cqzBN)).

---

## Current Status (April 12, 2026)

**Phase:** Active tester validation + validation outreach to exec recruiters and hiring leaders.

**What's live:** Serverless proxy on Vercel. Discovery flow with guardrails. Feedback form. Session persistence.

**What's next:**
- Anne and Rob Birdsong validation outreach
- Jenn Monkiewicz follow-up
- Jenn Monkiewicz follow-up
- Security verification browser check before next tester wave
- NSF SBIR pitch refinement and formal submission process
- `/api/score-role` serverless route (P1, lower urgency)
- Nonprovisional patent conversion by 3/24/27

**Build state:** The product is functional and being tested. Not concept, not production — in validation.

---

## Open Questions

- **Consumer-first or parallel tracks?** Weight of evidence pulls consumer-first. But enterprise revenue (exec recruiter channel) is where the money is. Sequence decision pending further exec recruiter validation.
- **Coach persona quality bar:** How good does AI-only (free tier) lens need to be to avoid poisoning the format's reputation? What's the minimum quality threshold?
- **Scoring engine accuracy:** At launch, scoring is a Claude API call. How accurate vs. purpose-built matching algorithms? Baseline accuracy unknown.
- **LinkedIn intake:** Scraping ruled out (ToS violation). Data export option viable but has latency UX issues. Decision deferred pending tester feedback on cold-start friction.
- **Nathan's role:** Potential co-builder, but no formal commitment. Budget line contingent.

---

## Key Principles

- **Signal matching over keyword matching** — the core thesis
- **Lens document = machine-readable scoring contract** (YAML frontmatter + markdown narrative), not a profile or resume
- **Bidirectional:** candidate lens scores companies (C→R), role lens scores candidates (R→C)
- **Freemium as distribution, not revenue** — value is coach adoption and data flywheel
- **Coaching ROI solved by the lens** — concrete, measurable outcome
- **Coach channel as quality moat** — self-serve can't replicate coach-facilitated depth
- **Append, don't overwrite** — every change is dated
- **Identity as relational and evolving, not fixed**
- **Do NOT embed "tide pool" language in product-facing materials** — personal metaphor, not universal
- **Scoring language, pipeline references, and automation terminology stay out of tester-facing documents**
- **International Style for product identity** — invisible design, content does the work

---

## Artifact Management

- ALL artifacts require version numbers (semantic versioning: v1.0, v1.1, v2.0)
- Airtable Artifact Registry (`tblcE723hIH692lSy`) tracks all artifacts; log immediately upon creation
- `ARTIFACT-WORKFLOW.md` at `zelman/lens` root defines commit workflow and folder structure: `specs/`, `components/`, `docs/`, `config/`, `legal/`
- Legal docs: local only, gitignored, never in repo
- Location field in Artifact Registry uses exact string "Git (lens)"

---

*This project is where the archive practice, the coaching work, and the job search automation converge into a product. The personal system proves the model; this project is about making it work for others.*
