# CONTEXT.md — Lens Project

*Last updated: April 21, 2026*

This is the living context file for the Lens Project — an AI-assisted career identity discovery system with bidirectional signal-based matching. Lives at the root of `zelman/lens` repo. Update when things change.

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

**Enterprise thesis (narrowed April 2026):** Deep discovery is only justified for $300K+/board-level hires where a mis-hire is catastrophic. Below that threshold, speed wins over depth. The buyer at the enterprise level is the **executive recruiter** (not HR, not coaches). Internal mobility is the structurally stronger wedge because the employee is already known (reducing gaming risk and cold-start friction). The **role lens** — capturing stakeholder alignment on what a seat actually requires — leads the product, not the candidate lens.

---

## Key People

- **James Pratt** — Eric's career coach (Nov-Dec 2025). First contributing coach persona (SKILL.md exists). Engaged on AI coaching partnership. Challenged assumption that companies want precision over volume (3/30/26). NDA pending.
- **Todd Gerspach** — Eric's previous career coach. Extensive C-level network. Proposed freemium GTM model. NDA pending.
- **Edie Hunt** (hunt.edith@gmail.com) — retired Goldman Sachs partner (30+ yrs), COO Human Capital Management, CDO. Built Goldman Returnship program. Call completed 4/7/26. Key signal: deep discovery only justified at $300K+/board-level; exec recruiters are the buyer; coach market too diffuse for volume. Sent Beth Stewart intro.
- **Beth Stewart** — CEO Trewstar; places women on corporate boards. Intro email sent by Edie; no response as of 4/13/26. P1 validation conversation.
- **Anne Birdsong** — VP/GM Sales Kimberly-Clark, Sr. Dir General Mills, 11 yrs PepsiCo, Cornell. Call completed 4/8/26. Key signals: (1) Immediately gravitated to consulting firm channel (Accenture-type bringing Lens to clients). (2) Validated cost-of-bad-hire from K-C experience (fired Accenture recruiting for bad-fit candidates). (3) Flagged IP protection unprompted. (4) Chris Lyon intro (CRO at League, ex-Workday). (5) Volunteered to test intake form.
- **Rob Birdsong** — VP Google Cloud Consulting North America. Appears avoidant. Deprioritized.
- **Jenn Monkiewicz** — Fractional CPO; built custom AI HR system with SCX.ai. Met week of 4/7. Follow-up Wednesday 4/15.
- **Nathan Fierley** — potential co-builder. Tested bidirectional lens concept. No NDA needed.
- **Ravi Katam** — early tester, former Bigtincan colleague. Completed discovery flow; provided feedback on redundancy and resume/LinkedIn integration gaps. No NDA needed.
- **Niels Godfredsen** — engineer, consulting at Remedy. Demoed product 4/4; committed to testing.
- **Jared Hibbs** — tester; completed full discovery flow; structured feedback processed.
- **Brendan McCarthy** — tester (~2 hours, post-guardrails refactor). Flagged repetitive questioning.
- **Bob Slaby** — CCO at Bigtincan (Vector Capital hire), now at Showpad. Outreach sent 4/8 for exec recruiter intros; no response. No NDA.
- **David Keane** — Bigtincan founder; skeptical of AI SaaS; received moat-focused deck.
- **Jordan Frank** — runs Traction Software 23+ years. 10-slide intro deck built for meeting 4/13/26.

---

## What's Been Built

### Live Product

**Lens Intake App** — deployed at `lens-app-five.vercel.app` (not lens-red-two). Current production build: `2026.04.12-n`.
- Full 8-section AI-guided discovery with live Claude Sonnet API
- Serverless proxy deployed: `/api/discover`, `/api/synthesize`, `/api/score` return 405 on GET (correctly expecting POST). API keys and system prompts no longer exposed in browser dev tools.
- Sensitivity filter removes sentences with clinical labels (no bracketed placeholders). MAX_TOKENS 6000, temperature 0.5, timeout budget 58s with graceful degradation.
- Guardrails: single-question-per-turn, reflection before questions, no leading multiple-choice prompts
- Session persistence: localStorage under key `lens-session`; files don't need re-upload on return
- Save/return capability deployed
- `/api/score-role` returns 404 — unbuilt (P1, lower urgency given narrowed enterprise timeline)

**Three tester feedback issues addressed (Claude Code complete):**
1. No privacy disclosure at flow start → Swiss Style disclosure UI added
2. Redundant questioning across sections → cross-section context accumulator
3. Bias in discovery prompts toward Eric's profile → all 8 section system prompts rewritten

### Core IP Documents

**Bidirectional Lens System Spec** (`specs/bidirectional-lens-system-v1.0.md`)
~4,000-word technical specification. Role lens schema (8 sections mirroring candidate lens), asymmetric matching algorithm with different weight distributions per direction:
- C→R weights: Mission 25, Role 20, Culture 18, Skill 17, Work Style 12, Energy 8
- R→C weights: Builder Signals 25, Relational Intelligence 22, Domain Expertise 18, Values Alignment 15, Work Style 12, Energy & Sustainability 8

Dimension cross-mapping, hard gate logic in code (not prompt), Gate Tolerance x Analysis Depth = 9 named evaluation modes, Mutual Fit formula = (C→R x 0.5) + (R→C x 0.5), worked example Eric x LeanData MF:72.

**Feedback Loop Learning System Spec** (`specs/feedback-loop-spec-v1.0.md`)
~3,500-word standalone IP document. Signal taxonomy (12 explicit + 8 implicit), signal decay (exponential, configurable lambda), weight adjustment algorithm (learning_rate 0.02), disqualifier refinement, drift detection (stated vs. revealed over 30-day trailing window). Build status: SPECIFIED, not running.

**Competitive Landscape** (`specs/lens-competitive-landscape.md`) — 18 entries in Airtable (migrated 4/7/26). MD file is source of truth for narrative analysis, risks, GTM strategy, and research citations. Includes SquarePeg cautionary tale, Pymetrics/Harver acquisition, BetterUp current state, internal mobility platform landscape (Gloat, Fuel50, Eightfold AI), Recruiterflow, Plum, Torre.ai.

**Strategic Brief** (`specs/strategic-brief-v1.3.md`) — analytical stress-test document. 16 known gaps, 10 assumptions to challenge, competitive matrix, business model with unit economics.

**Signal Reconstructibility Test** — 3 independent AI systems given standard recruiter materials (resume + DISC) reconstructed ~43% of discovery artifact signal. Largest gaps: values (~22%), energy (~30%), disqualifiers (~13%). Prompt/framework (v1.0 md) and findings (v1.0 pdf) in docs/.

### Components (React JSX)

**Role Lens Scorer R→C** (`components/role-lens-scorer-v1.3.jsx`) — Swiss Style, 9 evaluation modes. Deployed to Vercel with serverless API proxy.

**Candidate Lens Scorer C→R** (`components/lens-scorer.jsx`, v2.15) — Dark theme, operational 4+ months.

**Lens Feedback Form** (`components/lens-feedback/`, v1.0) — Swiss Style, Airtable backend. Deployed at lens-feedback.vercel.app.

### Decks (Swiss Style, pptxgenjs)

**Investor Pitch Deck** (`docs/lens-investor-pitch-v5.4.pptx`) — 18 slides. Rebuilt with stress test pivots in progress (April 13).

**Coach Pitch Deck** (`docs/lens-coach-pitch-v4.pptx`) — 11 slides.

**Lens Intro Deck** (`docs/lens-intro-v2.pptx`) — 11 slides. Rebuilt with all 8 stress test pivots applied (April 12).

**Jamie Stern Deck** (`docs/lens-jamie-stern-v3.pptx`) — 22 slides. Rebuilt with stress test pivots (April 13). For retained boutique search firm audience.

**Jordan Frank Intro** (`docs/lens-jordan-frank-intro.pptx`) — 10 slides. Built for 4/13 meeting.

### Positioning Documents

**Core Narrative** (`docs/core-narrative-v1.2.md`) — Single source for product positioning. Updated with exec recruiter audience, coach distribution caveat, $300K+ threshold, internal mobility framing.

**Lens for Hiring Leaders** (`docs/lens-for-hiring-leaders-v2.1.docx`) — Corporate audience doc. Stakeholder misalignment as primary problem, two use cases (exec search + internal mobility), comparison table, diagnosis vs. agency framing, signal test data, "Inspiration not validation" research framing. v2.1 shipped April 13.

**Lens for Executive Recruiting** (`docs/lens-exec-recruiting-v1.2.docx`) — 6-page Briefing Style for Beth Stewart audience. Portfolio inputs table, 3 recruiter use cases, diagnosis-vs-agency section.

**Competitive Stress Test Brief** (`docs/lens-competitive-stress-test-v1.md`) — Adversarial stress test fed to 4 independent AI models.

**Stress Test Synthesis** (`docs/lens-stress-test-synthesis-v1.md`) — 8 strategic pivots derived from 4 LLM stress test runs. Decision document.

**Deck Update Spec** (`docs/deck-update-spec-v1.md`) — Maps every slide change across 3 decks based on stress test pivots.

### Legal Documents (LOCAL ONLY — never in git)

**Provisional Patent — FILED March 24, 2026**
- Application #: 64/015,187
- Entity status: Micro ($65 fee paid)
- **Deadline to convert to nonprovisional: March 24, 2027**
- 10 claims (3 independent). Microsoft Patent US20250378320A1 flagged as strongest prior art anchor — flag for patent attorney before conversion.

**NSF SBIR Project Pitch** (`docs/nsf-project-pitch-draft-v1.md`) — v0.3. Research question: does AI-facilitated structured identity discovery produce professional representations with higher predictive validity than self-report methods? Grounded in Oh, Wang, and Mount (2011).

### Config

**James Pratt SKILL.md** (`config/James_Pratt_Skill.md`) — Coach persona encoding.

**Agent Lens** (v2.15, lives in `zelman/tidepool` repo) — Three-file user architecture in `users/`.

### Competitive Research

Detail lives in `specs/lens-competitive-landscape.md` (zelman/lens). Entries also mirrored in Airtable Competitive Intelligence table (`tbl1n2MWWpmlJqhmf`).

**Key incumbents and the "not that, this" positioning against each:**

- **The Predictive Index (PI)** — $102M revenue, 447 employees, 8K customers across 142 countries, 70-year validity moat. Deeply embedded in retained search: **Caldwell Partners is PI's largest certified partner worldwide**; Renée Vincent, Shulman Associates, Ascent Select also certified. PI Job Assessment is the closest functional analog to Role Lens. PI is the canonical example of the "assessment verdict" model we've explicitly rejected. Use as the foil: *"PI gives you a graph; Lens gives you a conversation."* Do NOT compete on validity, speed, or platform breadth. DO compete on depth of discovery, portable candidate-owned artifact, narrative format, and the catalyst framing. Tier 2, Threat Level Medium.

- **Jack & Jill** — $20M seed, nearest direct competitor (Tier 1). Fast recruiter-level AI matching with structured preferences. Lacks coaching depth, portable document, and coach network.

- **SquarePeg** — closest prior art for bidirectional matching; pivoted away from it. Lessons: frictionless employer-side integration matters, bidirectional intake is hard to scale without a wedge.

- **Pymetrics** — acquired by Harver (2022). Neuroscience games for trait assessment; absorbed into enterprise talent platform. Validates the consolidation trend; doesn't compete on narrative depth.

- **JSON Resume** — structured format precedent, not a product. Relevant as ownership/portability antecedent for the lens-as-document model.

- **DISC / StrengthsFinder / Myers-Briggs** — static assessments, no matching capability. Category Lens is positioned post.

- **360 Feedback tools** — backward-looking, no forward-matching. Observer ratings (Oh/Wang/Mount 2011) are the psychometric ceiling; neither PI nor Lens nor these reach it cleanly today.

- **ATS systems (Greenhouse, Lever, etc.)** — keyword matching, opposite philosophy. PI integrates into this layer; Lens is not planning to own it.

- **Internal mobility platforms (Plum, Torre.ai)** — enterprise wedge, not direct overlap today; worth watching.

**Core gap in the landscape:** no one runs coaching-depth discovery on BOTH sides of a hire (role AND candidate) and produces a portable narrative artifact the candidate owns. This remains our core wedge.

**GTM implication from PI research (added 2026-04-21):** retained search channel is already penetrated by PI. Our GTM must assume PI is present in most conversations with mid-to-large retained firms. Wedge strategy: (a) target firms not yet PI-certified; (b) position Lens as complement (narrative layer over PI's trait data); (c) lean into the candidate-owned artifact angle PI structurally cannot match. Accelerating the coach-persona channel (individual executive coaching methodologies encoded as distinct personas) is our structural answer to PI's certified partner network.

### Airtable Tables (base appFO5zLT7ZehXaBo)

- **Lens Plan** (tblXSpTl6d8U5Q0YY) — kanban board for project tasks
- **Feedback Archive** (tbl0Ec6OPqPqyDTDB) — validation conversation notes and tester feedback
- **Testers** (tbl2PmUHEnwytU3Q8) — tester tracking
- **Competitive Intelligence** (tbl1n2MWWpmlJqhmf) — 18+ records (migrated 4/7/26)
- **Artifact Registry** (tblcE723hIH692lSy) — tracks all artifacts
- **Meetings** (tblvk5GWuVmtpG1w1) — meeting notes
- **Claude Code Sessions (Lens)** (tblLgWUHElcbKABKF) — session logs
- **Lens Feedback** (tblUAyulKOKXiRoOx) — user testing feedback collection

---

## Enterprise Thesis (Narrowed April 2026)

### Validation Signal Summary

**Edie Hunt (4/7/26):** $300K+/board-level only. Exec recruiters are the buyer. Coach market too diffuse for volume. Internal mobility may be more tractable than external hiring.

**Anne Birdsong (4/8/26):** Consulting firm channel (Accenture-type). Validated cost-of-bad-hire from K-C experience. IP protection concern unprompted. Chris Lyon intro pending.

**James Pratt (3/30/26):** Companies want more candidates, not better-filtered ones. Challenged precision-over-volume assumption.

**Stress Test (4/12/26):** 4 independent AI models stress-tested the positioning. 8 pivots: role lens leads, "prevent expensive misalignment" language, Oh/Wang/Mount reframed as "inspired by" not "foundation," first customer = 10-20 person retained boutique, SquarePeg cautionary tale.

### Two Entry Paths

1. **Executive recruiter channel:** Retained boutiques placing $300K+ candidates. Narrower but higher-margin. Beth Stewart and Chris Lyon as validation pipeline.
2. **Internal mobility:** Employees intrinsically motivated, already known, cost of bad move = retention loss. Aptitude Research data: 77% lost talent, 70% investing more, only 25% confident.

---

## Research Foundation

**Oh, Wang, and Mount (2011)** — JAP 96:4, 762-773. Meta-analysis of 44,000+ participants: observer ratings predict job performance significantly better than self-reports. **Framing: "inspired by," not "foundation."** What we produce today is higher-resolution structured self-report — not observer-grade assessment. The research question: how close can AI-facilitated discovery get to the observer-rating ceiling?

**Signal Reconstructibility Test** — ~43% overlap. Largest gaps in values, energy, disqualifiers. Quantifies what hiring teams intuit: standard materials capture less than half of what determines fit.

**Aptitude Research (2023)** — 77% of companies lost talent to lack of career development. 70% investing more in internal mobility. Only 25% confident their approach works. 58% of employees would leave if not considered for internal roles.

**Competitive white space confirmed:** No product occupies the deep-plus-scalable quadrant. Internal mobility platforms (Gloat, Fuel50, Eightfold AI) match on skills only — the identity layer is open.

---

## Company Formation

- **Zelman Labs LLC** — RI LLC filing ($156), EIN obtained. SAM.gov registration completed (2-4 week processing). Eric is registered agent using home address.
- RI minimum annual tax: $400 regardless of revenue. Disregarded entity for federal tax (Schedule C).
- SBIR.gov Company Registry: next after SAM.gov clears.

---

## GTM Sequence (Updated April 2026)

1. **Candidate product first.** Free lens intake → portable artifact. Coach channel as distribution. This is where traction exists.
2. **Internal mobility as enterprise wedge.** Pain point validated by Aptitude data and Edie Hunt.
3. **Executive recruiter channel.** Boutiques placing $300K+ candidates. Beth Stewart, Chris Lyon as validation.
4. **External hiring as scale play.** Bidirectional matching for external candidates. Build toward as data and trust accumulate.

---

## Repo Structure

```
github.com/zelman/lens/
|-- CONTEXT-lens-project.md          # This file
|-- ARTIFACT-WORKFLOW.md             # Commit workflow + artifact management rules
|-- specs/                           # Core IP documents
|-- components/                      # React JSX components + Vercel packages
|-- docs/                            # Decks, plans, explainers, positioning docs
|-- config/                          # Coach personas, scoring configs
|-- legal/                           # .gitignore'd — NEVER committed
```

---

## Build Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Lens intake app (full flow) | Running | Deployed on Vercel, serverless proxy, sensitivity filter, guardrails |
| Role Lens Scorer (R->C) | Running | Deployed to Vercel, 9 modes |
| C->R Scorer | Running | Dark theme, operational 4+ months |
| Bidirectional Lens System | Specified | v1.0 spec complete, not implemented |
| Feedback Loop Learning System | Specified | v1.0 spec complete, not in pipeline |
| Role lens stakeholder intake | In Design | **P0 near-term build** — primary validation focus |
| /api/score-role route | Unbuilt | P1, lower urgency given narrowed timeline |
| Feedback form | Running | Swiss Style, Airtable backend, deployed |
| Connect lens to n8n pipeline | Designed | Architecture clear, not wired |
| Daily briefing email | Designed | Template concept, not built |
| Media intake (audio/video) | Specified | AssemblyAI, speaker diarization, two-pass. Deferred. |
| Multi-call synthesis split | Ready | Config-driven parallel arch with voice primer. Implement when timeouts cluster. |

---

## Key Learnings & Principles

- **Signal matching over keyword matching** — the core thesis
- **Role lens leads.** Stakeholder alignment is the primary pain; the candidate lens follows.
- **"Prevent expensive misalignment"** — outcome language, not feature language
- **Enterprise thesis is speculative but narrowed.** Exec recruiters at $300K+, not broad HR.
- **Oh/Wang/Mount: "inspired by," not "foundation."** We produce higher-resolution self-report, not observer-grade assessment. That's the research question, not the answer.
- **The daily scored briefing is the core product experience**, not the lens document itself.
- **Session length (45-60 min) is a feature**, not a bug. Signals coaching-level depth.
- **Deliver manual first.** Don't build multi-tenant infrastructure until demand is validated.
- **SquarePeg cautionary tale:** attempted bidirectional psychometric matching, pivoted to AI resume screening. "Buyers pay for less work and better optics, not better judgment."
- **Coach channel = quality gate, not volume path.** Coach market too diffuse for enterprise scale.
- **Swiss Style for product identity** — invisible design, content does the work
- **College matching is not a current initiative.** Identity signals in high school too unstable.

---

## Design Language ("Briefing Style")

Swiss base: white background, black type, #D93025 red primary, zero border-radius, hairline rules. Layered richness: all-caps spaced section labels in red (do NOT use wide characterSpacing on "LENS PROJECT" header), #2D6A2D green for positive signals, #E8590C orange for secondary, monospace for scores, subtle card borders (#EEE), #F0F0F0 container background, tinted signal pills.

---

## Near-Term Priorities

- **Role lens stakeholder intake** — P0. Design and build. Primary validation focus.
- **Run role lens validation conversations** — 3-5 boutique partners. Pipeline: Beth Stewart, Chris Lyon, Jenn follow-up.
- **Beth Stewart / Trewstar conversation** — P1. No response to intro email yet.
- **Jenn Monkiewicz follow-up** — Wednesday 4/15.
- **Chris Lyon intro** via Anne Birdsong — pending.
- **Git commit** — 12+ artifacts from stress test sessions need Claude Code commit.
- **SAM.gov registration** processing (~2-4 weeks remaining).
- **Security verification** (proxy Phase 5) — manual browser check before new tester URLs.
- **Nonprovisional patent conversion** deadline: 3/24/27. Flag Microsoft patent for attorney.

---

## Open Questions

- **Does role lens stakeholder intake resonate with retained boutiques?** Primary near-term validation question.
- **Product domain:** tide-pool.org reserved for archive. Need new domain for Lens product.
- **Consulting firm channel (Anne's insight):** Is Accenture-type firm a real distribution path, or does it require enterprise infrastructure that doesn't exist yet?
- **White-label for recruiters:** Should the recruiter embed Lens into their process invisibly, or is the Lens brand part of the value?
- **Coach persona format:** James Pratt SKILL.md exists. What's the standardized format for coach #2, #3?

---

*This project is where the archive practice, the coaching work, and the job search automation converge into a product. The personal system proves the model; this project is about making it work for others.*
