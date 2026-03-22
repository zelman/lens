# CONTEXT.md — Lens Project

*Last updated: March 19, 2026*

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

---

## Design Language: Swiss Style

Adopted March 2026. All artifacts, decks, and forms use this system:

- **Background:** White (#FFFFFF)
- **Typography:** Helvetica Neue / Helvetica / Arial, sans-serif. Strong hierarchy, black type (#1A1A1A)
- **Primary accent:** Red (#D93025) — buttons, active states, progress bars, links
- **Secondary accent:** Orange (#E8590C) — step numbers, footnote callouts
- **Rules:** Hairline (1-2px), black for section boundaries, light gray (#EEEEEE) for subdivisions
- **Border radius:** Zero. No rounded corners anywhere.
- **Principle:** The design is invisible. Content does the work.

Previously used dark background (#0a0a0a) with warm neutral / gold-brown (#a08060) accent — this is retired for product-facing materials but may persist in the archive site.

---

## What's Been Built

### Intake Form (`lens-intake.jsx`, ~680 lines)
Full integrated intake flow with four phases and session persistence:

**Phase 1 — Intro ("Build your lens")**
- Explains what a lens is, the three-step process, time estimates (25-45 min)
- "If you close the tab" notice explaining what's saved vs. what needs re-upload
- Swiss Style design

**Phase 2 — Context Upload ("Give the AI a head start")**
Five upload categories with guidance copy:
1. Resume (PDF, DOCX, TXT, MD — single file)
2. LinkedIn profile (PDF — with print-to-PDF instructions, scroll-for-recommendations tip)
3. Writing samples (PDF, DOCX, TXT, MD, HTML — multiple files)
4. Assessments & frameworks (DISC, StrengthsFinder, Myers-Briggs, 360, Enneagram, coaching notes, performance reviews — multiple files, includes image formats for screenshots)
5. Anything else (any file type — letters, decks, Slack messages, journal entries)

Key insight: LinkedIn recommendations the user *chooses to keep visible* are a lens signal — the curation tells you about self-concept, not just content.

**Phase 3 — Status Selection**
Employed / Actively Searching / In Transition — shapes AI tone and matching system routing.

**Phase 4 — Discovery (placeholder)**
Shows loaded context summary and previews 8 discovery sections. In production, this is where the Claude API conversation begins.

**Persistence:** Phase, status, and file metadata saved to storage on every change. Files need re-upload on return (binary can't serialize), but user gets a warm notice listing previously uploaded file names. "Start over" button in progress bar clears all state.

### Original Intake Form (`lens-form.jsx`, ~800 lines)
The earlier version with live Claude API integration (Sonnet). 6 phases: status → resume → intro → discovery → synthesis → done. 8 discovery sections with per-section system prompts. Still the reference for the discovery conversation implementation.

### User Testing Feedback Form (`lens-feedback-form.jsx`)
Swiss Style, 8 structured questions:
1. Better representation than resume? (Yes/No/Partially)
2. Would share with recruiter? (Yes/No/With edits)
3. Surfaced new insights? (Yes/No)
4. Most valuable section? (free text)
5. Weakest section? (free text)
6. What's missing? (free text)
7. Feels like you? (1-10 scale)
8. Freemium pricing reaction — "The discovery process you just completed could be offered for free. The paid product ($50/month) would use your lens to deliver daily personalized briefings — matched opportunities, curated sources, and alerts. Does that pricing feel right? What would need to be true?"

Q8 deliberately mirrors Todd's freemium GTM model to collect signal that maps directly to the business model being evaluated.

### Feedback Form Vercel Deployment (`lens-feedback.zip`)
Deployable project with:
- `public/index.html` — static vanilla HTML/CSS/JS form (no build step)
- `api/submit.js` — Vercel serverless function proxying writes to Airtable (token server-side)
- `vercel.json` — routing config

### Airtable: Lens Feedback Table
- **Base:** Archive (`appFO5zLT7ZehXaBo`)
- **Table:** Lens Feedback (`tblUAyulKOKXiRoOx`)
- **Fields:** Name, Better Than Resume, Would Share, Surfaced New Insights, Most Valuable Section, Weakest Section, Whats Missing, Feels Like You (1-10), Pricing Reaction, Submitted At

### Pitch Decks (Swiss Style, pptxgenjs)
Two audience-specific decks, v3:
- **Coach Pitch Deck** (`lens-coach-pitch-v3.pptx`) — 10 slides, multi-coach roster framing
- **Investor Pitch Deck** (`lens-investor-pitch-v3.pptx`) — 12 slides, $750K ask

Both include "What is it" slide (slide 2), red (#D93025) primary accent, orange (#E8590C) secondary. White background, black type, hairline rules.

### FigJam Diagrams (7 total, Mermaid format)
1. Intake Form User Flow — step-by-step journey through all phases
2. Product Architecture — free tier, paid tier, coach channel, enterprise
3. GTM Launch Phases — four-phase roadmap from validation to scale
4. User Experience Storyboard — emotional journey with key "aha" moments
5. Technical Data Flow — data movement from uploads through pipeline to delivery
6. Coach Onboarding Flow — recruitment → persona encoding → testing → live deployment → growth flywheel
7. Enterprise Role Lens — bidirectional matching, competitive differentiation, revenue model

Note: FigJam/Figma MCP only generates Mermaid-format diagrams. No control over typography, colors, or design language. For Swiss Style versions, rebuild as PPTX or SVG.

### Supporting Documents
- **Role Lens Schema** (`role-lens-schema.md`) — company-side document format
- **Free Tool Launch Plan** (`lens-launch-plan.docx`) — 4-phase GTM with metrics
- **Financial Model** (`lens-financial-model.xlsx`) — 12-month burn, KPIs, assumptions
- **Storyboard** (`storyboard-flows.docx`) — Path A (AI-driven), Path B (Coach-driven), The Shovel (pipeline architecture), Predictive Signals

### Competitive Research
- **JSON Resume** — structured format precedent
- **Jack & Jill** — nearest competitor ($20M seed, but no depth, no portable document, no coach network)
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
```

---

## GTM: Four Phases

1. **Validate (Now)** — Build intake form, test with Nathan + James, collect feedback via Airtable
2. **Free Tool Launch** — Deploy intake form (Vercel / tide-pool.org), free lens generation, Todd's network + coach referrals, build email waitlist
3. **Paid Product** — Connect lens to n8n pipeline, daily briefing emails, $50/mo Stripe subscription, passive monitoring as retention engine
4. **Scale** — Onboard coaches 2-5, enterprise role lens, coach channel revenue (B2B2C), raise on data flywheel + coach network moat

---

## Key Learnings & Principles

- **Signal matching over keyword matching** — the core thesis
- **Lens works bidirectionally** — candidate lens scores companies; role lens scores candidates (Nathan's reframe)
- **Freemium as distribution, not revenue** — Todd's instinct; value is coach adoption and data flywheel
- **Coaching ROI solved by the lens** — concrete, measurable outcome
- **Coach channel as quality moat** — self-serve can't replicate coach-facilitated depth
- **Passive monitoring as retention engine** — makes the business investable
- **LinkedIn recommendation curation is a signal** — what users choose to display reveals self-concept
- **Swiss Style for product identity** — invisible design, content does the work

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

## Current Status (March 19, 2026)

**Phase:** Active build + testing preparation.

**What happened this session:**
- Built user testing feedback form (Swiss Style, Airtable-backed)
- Created Airtable table for feedback collection (Lens Feedback in Archive base)
- Built Vercel-deployable version of feedback form with serverless API route
- Redesigned Q8 to test freemium pricing model per Todd's GTM suggestion
- Built full intake form with intro → context upload → status → discovery flow
- Added 5-category file upload (resume, LinkedIn PDF, writing samples, assessments, anything else)
- Added session persistence (phase + status saved, file metadata for re-upload prompts)
- Added honest "if you close the tab" messaging throughout
- Created 7 FigJam architecture diagrams (Mermaid format — not Swiss styled)
- Confirmed Figma MCP limitation: always Mermaid, no design control

**Nathan:** Testing James Pratt coaching persona implementation.

**James Pratt:** Engaged on AI coaching partnership. First persona.

**Todd:** Interested if project formalizes. Freemium GTM model being tested via Q8 in feedback form.

## Open Questions

- **Wiring discovery phase:** The intake form's Phase 4 is a placeholder. Need to integrate the Claude API conversation from `lens-form.jsx` into the new `lens-intake.jsx` flow.
- **Vercel deployment:** Feedback form is ready to deploy. Intake form needs the same treatment (Airtable backend for session persistence vs. localStorage).
- **Swiss Style diagrams:** FigJam can't do it. Rebuild as PPTX slides or SVG when needed for presentations.
- **Nathan's role:** A/B/C collaboration options still pending decision.
- **Pipeline connection:** How does the lens document connect to a generalized scoring pipeline? Fork of v9 or new build?
- **Repo:** No dedicated repo yet. Growing artifact set suggests it's time.

---

*This project is where the archive practice, the coaching work, and the job search automation converge into a product. The personal system proves the model; this project is about making it work for others.*
