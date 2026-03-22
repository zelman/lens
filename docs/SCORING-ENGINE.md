# Scoring Engine: Architecture & Evolution

*How the scoring pipeline works today (personal system) and how it evolves into the Lens Project product.*

*Last updated: March 19, 2026 (v6.5 calibration updates)*

---

## How to Read This Document

Eric's personal job search pipeline (v9) is the working proof of concept for the Lens Project's scoring engine. It runs daily, scoring real opportunities against a real lens. The system described here serves two purposes simultaneously:

1. **Right now:** It helps Eric find a job. He is case study #1. Every false positive caught, every scoring tweak made, every behavioral pattern observed feeds directly into the product design.
2. **In the future:** This scoring engine becomes the core of the Lens Project product, generalized for any user with any lens.

The document is organized as: what exists today → what we've learned → how it evolves. The current system's hard-won lessons (empirically derived guardrails, false positive patterns, data quality heuristics) are domain knowledge that must be preserved through every iteration.

---

## Current Architecture (v9 — Personal Pipeline)

### Pipeline Flow

```
1. INGEST
   ├── VC Portfolio Scrapers (Bessemer, a16z, sector-specific funds)
   ├── Job Board Scrapers (Work at a Startup, Indeed, First Round Jobs)
   ├── Email Parsers (LinkedIn alerts, job alert emails)
   └── All sources → n8n workflows on zelman.app.n8n.cloud

2. ENRICH
   ├── Brave Search (company context, news, funding, team info)
   └── Company websites (careers page, about, leadership)

3. PRE-FILTER (binary gates — saves API costs)
   ├── Reject: PE-backed, wrong stage, excluded industries
   ├── Reject: >200 employees, >$500M funding, public company
   ├── Reject: Non-US primary market
   └── Pass → proceed to scoring

4. LLM SCORING
   ├── Prompt assembled from agent lens (v2.3) + enrichment data
   ├── Claude evaluates across scoring dimensions
   └── Structured JSON response with score + reasoning

5. POST-PROCESS (guardrails)
   ├── Apply caps (CX vendor cap, stale funding cap, etc.)
   ├── Apply adjustments (sector bonus, recent funding bonus, etc.)
   └── Calculate final score

6. OUTPUT
   ├── Final score (0-100) + explanation breakdown
   ├── Write to Airtable (base: appFEzXvPWvRtXgRY)
   └── Available for daily review
```

### Two Parallel Pipelines

The system currently runs two separate n8n workflows:

- **Job Alert Parser:** Processes job board alerts with full Brave Search enrichment and Claude scoring. More enriched, higher accuracy.
- **VC Portfolio Scraper:** Processes company lists from VC portfolios. Less enriched — identified gap. Needs Brave Search enrichment layer added to match job alert pipeline quality.

**Known issue:** Scoring logic is partially duplicated across these two workflows. The PRODUCT-VISION.md (November 2024) identified this as a consolidation target — a single "Scoring Service" sub-workflow both pipelines call.

### The Agent Lens (v2.3)

The current scoring prompt is built from Eric's personal agent lens document, which lives in the `zelman/tidepool` repo and is consumed at runtime by n8n workflows via raw GitHub URL. This lens is hand-built — the product of coaching work with James Pratt (November–December 2025) and months of self-reflection.

The lens encodes:
- Target role profile (VP/Head/Director of Customer Support)
- Builder vs. maintainer distinction (critical scoring signal)
- Sector preferences and anti-sectors
- Company stage preferences
- Auto-disqualifiers (PE-backed, >200 employees, public company, etc.)
- Scoring priorities and weights

**This hand-built lens is the prototype for what the Lens Project's AI-coached discovery process will produce for any user.** The scoring engine doesn't care whether the lens was hand-built by Eric or generated through a 30-minute AI coaching session — it consumes the same YAML structure either way.

### Current Execution Volume

~750 executions/day for 1 user. This breaks down approximately as:
- ~600-650: Polling and checking (RSS, email, VC feeds — mostly empty results)
- ~50-100: Actual scoring events (new opportunities found, enriched, scored)

This volume is manageable on n8n cloud at Pro tier but will not scale to multiple users. See "Scaling Path" section below.

---

## Empirical Guardrails (Hard-Won Lessons)

These rules were derived from months of daily use. Each one represents a real false positive or false negative that was caught, diagnosed, and fixed. They are the most valuable engineering artifact in the system — more important than the code itself.

### Caps (Post-Scoring Ceilings)

Caps enforce known constraints AFTER the LLM scores. The LLM doesn't always catch these patterns, so the caps act as safety nets.

| Cap | Max Score | Condition | Origin Story |
|-----|-----------|-----------|--------------|
| CS hire unlikely | 65 | Company shows no signal of needing CS leadership | Fullview.io scored 82 — CX tooling company with no CS hire signal |
| Self-serve, no ops gap | 60 | PLG product without operational complexity | Multiple PLG companies scoring high despite no CS need |
| CX tooling vendor | 55 | Company sells CX software (not a buyer of CS leadership) | Fullview.io — cobrowsing vendor got false sector match |
| Stale early stage | 70 | Seed/Series A, >3 years since funding, <100 employees | Multiple zombie companies showing growth signals that weren't real |

### Adjustments (Score Modifiers)

Adjustments are additive bonuses or penalties. They stack.

| Adjustment | Value | Trigger | Notes |
|------------|-------|---------|-------|
| Builder language | +40 | JD contains "build from scratch", "first hire", "greenfield", etc. | v6.5: Highest-weighted positive signal |
| Leadership title | +15 | Head of, Director, VP titles | v6.5: Seniority alignment |
| Sector match (Healthcare B2B) | +15 | Healthcare B2B SaaS | v6.5: Increased from +10 |
| Sector match (other preferred) | +10 | Enterprise SaaS, dev tools with enterprise motion | |
| Recent funding | +10 | Raised within last year | Indicates growth and hiring intent |
| Active CS hiring | +10 | Has open CX/CS job posting | Direct signal of need |
| Network connection | +5 | LinkedIn connection at company | Warm path in |
| Stale funding penalty | -10 | Early stage, >3 years since funding | Zombie risk |
| Employee/funding mismatch | -15 | Employee count suspicious for stage | Browserbase scored 10 due to bad data (10 vs actual ~50) |
| Title penalty (context-dependent) | -5 to -20 | Non-Director titles; varies by company size | v6.5: <25 emp = -5, 25-50 = -10, >50 IC = -15, >100 IC = -20 |
| Insufficient JD data | -10 | Title only, no job description | v6.5: Cannot evaluate without details |

### Data Quality Rules

| Rule | What It Does | Why It Exists |
|------|-------------|---------------|
| Employee count cross-reference | Compare enrichment data with funding stage expectations | Browserbase had 10 employees in enrichment data, actual ~50. Bad data nearly rejected a strong match. |
| Funding recency calculation | Compute years since last funding round | Stale seed companies were scoring like fresh ones |
| Source priority for conflicts | When data sources disagree, prefer: company website > Crunchbase > Brave Search results | Different sources report different employee counts; needed a hierarchy |
| Fortune 500 integrity check | v6.5: Flag when enrichment shows <100 employees for known Fortune 500 companies | Wolters Kluwer returned 16 employees for a 21,000-person company |
| Enrichment failure detection | v6.5: Skip evaluation when enrichment data contradicts known company profile (Salesforce, Philips, PagerDuty, SAP) | 5 jobs in calibration sample affected by corrupted data |
| Partial evaluation path | v6.5: Score what's available when enrichment is incomplete but JD contains positive builder signals | Jobs were zeroing out instead of scoring partial data |

### False Positive / Negative Log

Preserve this log. Every entry is a test case for the regression suite.

| Company | Scored | Expected | Issue | Fix Applied |
|---------|--------|----------|-------|-------------|
| Fullview.io | 82 | 50-55 | CX tooling vendor got sector match | Added CX vendor cap (55) |
| Browserbase | 10 (rejected) | 75-85 | Bad employee data from enrichment | Added employee/funding cross-reference |
| Assort Health | 0 | 45-65 | Dealbreaker gates too aggressive | v6.5: MANUAL_REVIEW tier, partial scoring |
| Parakeet Health | 32 | 50-70 | Builder signals not amplified enough | v6.5: +40 builder bonus |
| Ashby (Head of Global Support) | 0 | 45-65 | Later stage zeroed despite build mandate | v6.5: Series C routes to MANUAL_REVIEW with builder signals |
| Wolters Kluwer | 0 | 40-55 | Enrichment returned 16 employees for 21K company | v6.5: Data integrity check, enrichment failure flag |
| *Add entries as discovered* | | | | |

### Regression Testing

Every false positive/negative fix should become a regression test case:

```javascript
const regressionSuite = [
  {
    company: "Fullview.io",
    expectedRange: [45, 55],
    mustTrigger: ["cx_tooling_vendor cap"],
    reason: "CX tooling company - sells cobrowsing software"
  },
  {
    company: "Browserbase",
    expectedRange: [70, 85],
    mustTrigger: ["employee_funding_mismatch flag"],
    mustNotTrigger: ["auto-reject"],
    reason: "Series B infrastructure - bad employee data should flag, not reject"
  },
  // v6.5 calibration cases - jobs Eric actually applied to
  {
    company: "Assort Health",
    expectedRange: [45, 65],
    mustTrigger: ["manual_review_tier"],
    mustNotTrigger: ["auto-reject"],
    reason: "v6.5: Applied job - partial match should not zero out"
  },
  {
    company: "Parakeet Health",
    expectedRange: [50, 70],
    mustTrigger: ["builder_bonus"],
    reason: "v6.5: Applied job - builder signals must be amplified"
  },
  {
    company: "Ashby",
    role: "Head of Global Support",
    expectedRange: [45, 65],
    mustTrigger: ["manual_review_tier", "builder_signals_detected"],
    reason: "v6.5: Later stage but 'nearly double this team' = genuine build mandate"
  },
  {
    company: "Wolters Kluwer",
    expectedRange: [40, 55],
    mustTrigger: ["data_integrity_flag", "enrichment_failure"],
    mustNotTrigger: ["auto-reject"],
    reason: "v6.5: Known Fortune 500 with 16 employees in enrichment = bad data"
  }
];
```

**When to run:** On every scoring config change. Scoring changes that break existing test cases must be evaluated deliberately, not accidentally.

---

## How the Current System Maps to the Lens Project

### Two Layers, Not One

The current system conflates two things that the Lens Project separates:

1. **The Lens** — Who you are. Identity signals, values, energy sources, disqualifiers, scoring dimension weights. In the current system, this is the agent lens document (v2.3). In the product, this is what the AI-coached discovery process produces.

2. **The Scoring Config** — Mechanical guardrails. Pre-filters, caps, adjustments, data quality rules, prompt assembly logic. In the current system, this is scattered across n8n workflow nodes. In the product, this is a structured config object.

The lens answers: "What matters to this person?"
The scoring config answers: "How do we reliably turn that into accurate scores?"

Both are needed. The lens without the config produces scores that are directionally right but have false positive/negative patterns. The config without the lens produces mechanical filtering without identity-level matching.

### Mapping Table

| Current System (Eric's v9) | Lens Project (Product) |
|---|---|
| Hand-built agent lens (v2.3) | AI-coached discovery → lens document (YAML + markdown) |
| n8n scoring prompt | Prompt assembled from lens YAML + scoring config + enrichment |
| Hardcoded disqualifiers in prompt | Disqualifiers extracted from discovery, stored in lens YAML |
| Caps in n8n JavaScript nodes | Scoring config `caps` object (shared across all users) |
| Adjustments in n8n JavaScript nodes | Scoring config `adjustments` (some shared, some per-lens) |
| Brave Search enrichment | Same, plus expanded sources |
| Airtable output | Airtable → Postgres at scale |
| Manual daily review | Daily briefing email + web dashboard |
| Eric tunes scoring by editing n8n nodes | Users tune scoring by editing their lens; system tunes config from aggregate feedback |

### What Transfers Directly

- **Enrichment pipeline:** Brave Search integration, company data extraction patterns, data quality heuristics. All of this transfers.
- **Guardrails:** The caps and adjustments table above. These are universal scoring truths (CX vendors are false positives, stale funding is a risk signal) that apply regardless of which user's lens is being scored.
- **Prompt engineering patterns:** The tiered prompt structure (Tier 1 = non-negotiable rules, Tier 2 = user preferences, Tier 3 = output format) is the right architecture for multi-user scoring.
- **Regression test methodology:** The principle of turning every false positive/negative into a test case.

### What Changes

- **Lens source:** From hand-built to AI-generated. The scoring engine consumes the same YAML structure but the input comes from a discovery flow instead of manual authoring.
- **Scoring dimensionality:** The current system scores on a single 0-100 scale. The product scores across 6 weighted dimensions (Mission 25%, Role 20%, Culture 18%, Skill 17%, Work Style 12%, Energy 8%) with a composite score.
- **Source intake:** From Eric's curated n8n scrapers to user-connected sources (BYOS: RSS, career pages, email forwarding, paste).
- **Output:** From Airtable rows to scored briefings with dimension breakdowns, enrichment context, and tension notes.
- **Feedback loop:** From Eric manually tuning n8n nodes to users Pursuing/Skipping/Flagging scored opportunities, which feeds back into scoring accuracy.

---

## Config-Driven Scoring Architecture (Target)

### The Scoring Config Object

```javascript
const scoringConfig = {
  version: "2026-03-18",
  changelog: "Migrated from PRODUCT-VISION.md; aligned with lens YAML schema",

  // Pre-scoring binary gates (saves API costs)
  filters: {
    // Universal filters (apply to all users)
    reject_pe_backed: true,
    exclude_industries: ["consulting", "staffing", "recruiting"],
    min_employees: 5,

    // User-lens-derived filters (populated from lens YAML disqualifiers)
    // These are extracted from the user's lens, not set manually
    max_employees: null,  // from lens: disqualifiers.hard
    min_stage: null,      // from lens: role_fit.preferred_stage
    max_stage: null,
  },

  // Post-scoring ceilings (universal domain knowledge)
  caps: {
    cs_hire_unlikely: { max: 65, condition: "cs_hire_likelihood === 'unlikely'" },
    self_serve_no_ops_gap: { max: 60, condition: "product_type === 'self_serve' && !ops_gap" },
    cx_tooling_vendor: { max: 55, condition: "is_cx_tooling_company === true" },
    stale_early_stage: { max: 70, condition: "funding_age_years > 3 && stage in ['seed', 'series_a']" },
    // NOTE: Some caps are role-specific (cs_hire_unlikely applies to CS roles).
    // As the product supports multiple role types, caps need role-type tagging.
  },

  // Score modifiers (some universal, some lens-derived)
  adjustments: {
    sector_match: { value: 15, trigger: "industry in lens.mission.sectors" },
    recent_funding: { value: 10, trigger: "funding_age_years < 1" },
    active_role_hiring: { value: 10, trigger: "has_matching_job_posting" },
    network_connection: { value: 5, trigger: "has_network_connection" },
    stale_funding_penalty: { value: -10, trigger: "funding_age_years >= 3 && early_stage" },
    employee_funding_mismatch: { value: -15, trigger: "employee_count_suspicious" },
  },

  // Data quality heuristics
  dataQuality: {
    employee_count: {
      cross_reference: true,
      source_priority: ["company_website", "crunchbase", "brave_search", "linkedin"],
      stage_floors: { seed: 5, series_a: 15, series_b: 50 },
    },
    funding_recency: {
      calculate: true,
      stale_threshold_years: 3,
    },
  },

  // Prompt assembly
  promptConfig: {
    tier1_rules: "Non-negotiable scoring rules. Never override.",
    tier2_criteria: "Assembled from user's lens YAML.",
    tier3_output: "Structured JSON with per-dimension scores + reasoning.",
  }
};
```

### How the Lens YAML Feeds the Scoring Config

When a user creates a lens, their YAML frontmatter populates the user-specific parts of the scoring config:

```
Lens YAML                          → Scoring Config
─────────────────────────────────────────────────────
disqualifiers.hard                 → filters (binary gates)
scoring.weights                    → dimension weighting
mission.sectors                    → adjustments.sector_match trigger
mission.anti_sectors               → filters.exclude_industries
role_fit.preferred_stage           → filters.min_stage / max_stage
role_fit.autonomy_need             → prompt context for LLM
culture.values_behavioral          → prompt context for LLM
work_style.remote                  → filters or adjustments
energy.fills / energy.drains       → prompt context for LLM
thresholds                         → briefing display thresholds
```

The universal guardrails (caps, data quality rules) stay constant across users. The user-specific parameters come from the lens. This is how the same scoring engine serves Eric's CS leadership search and someone else's engineering management search — the engine is the same, the lens is different.

---

## Scoring Output: From Single Score to Compatibility Briefing

### Current Output (Personal System)

```javascript
{
  company: "Acme Corp",
  final_score: 72,
  llm_reasoning: "B2B healthcare SaaS with enterprise focus...",
  caps_applied: [],
  adjustments_applied: [
    { rule: "sector_match", effect: +15 },
    { rule: "stale_funding_penalty", effect: -10 }
  ],
  data_quality_notes: ["Employee count flagged for review"]
}
```

### Target Output (Lens Product)

```javascript
{
  company: "Acme Corp",
  composite_score: 78,

  dimensions: {
    mission:    { score: 92, weight: 0.25, signals: ["Healthcare B2B", "Patient outcome focus"] },
    role_fit:   { score: 85, weight: 0.20, signals: ["Series B", "Building CS from scratch"] },
    culture:    { score: 70, weight: 0.18, signals: ["Remote-first", "Async-heavy"], warnings: ["Glassdoor mentions micromanagement"] },
    skill:      { score: 80, weight: 0.17, signals: ["Zendesk stack", "Enterprise support experience valued"] },
    work_style: { score: 72, weight: 0.12, signals: ["Flexible hours"], warnings: ["4+ hrs/day in meetings per reviews"] },
    energy:     { score: 65, weight: 0.08, signals: ["Mission-driven team"], warnings: ["Rapid growth may mean firefighting phase"] }
  },

  disqualifiers_triggered: [],

  tensions: [
    { dimension: "culture", note: "Your lens values high autonomy. Glassdoor reviews suggest increasing process overhead." },
    { dimension: "work_style", note: "Meeting load (4+ hrs/day) conflicts with your preference for async communication." }
  ],

  enrichment: {
    stage: "Series B",
    funding: "$45M raised, 14 months ago",
    employees: "~85",
    glassdoor: "3.9 (trending down from 4.2)",
    recent_news: "Launched enterprise tier Q4 2025"
  },

  guardrails: {
    caps_applied: [],
    adjustments_applied: [
      { rule: "sector_match", effect: "+15 on mission", reason: "Healthcare sector" }
    ],
    data_quality_notes: [],
    confidence: "high"  // based on enrichment data completeness
  },

  config_version: "2026-03-18",
  scored_at: "2026-03-18T08:00:00Z"
}
```

The key evolution: from a single score with explanation to a multi-dimensional compatibility briefing with tensions. The tensions are what make this different from every other scoring system — they don't just say "match" or "no match," they say "here's what will be hard."

---

## Scaling Path

### Current: n8n Cloud (1 User)

750 executions/day, ~22,500/month. Pro tier (10,000/month) is already exceeded. Managing through workflow optimization.

### Phase 1: Self-Hosted n8n (1-100 Users)

Move to n8n Community Edition on a $50-100/month server (DigitalOcean or AWS). Unlimited executions. Eric's existing workflows transfer directly. This handles the 90-day validation period.

### Phase 2: Hybrid Architecture (100-500 Users)

Extract high-frequency polling (RSS checks, career page monitoring) into lightweight Python cron jobs. These fire only when new content is detected, then push to a processing queue. n8n handles complex orchestration (enrichment chains, multi-step scoring, edge case handling).

This eliminates ~90% of execution volume (empty polls that find nothing).

### Phase 3: Purpose-Built Services (500+ Users)

Scoring and enrichment become their own services (Python workers processing a queue). n8n remains for workflow orchestration and exception handling. Scoring calls move from n8n-embedded Claude API calls to a dedicated scoring service that can batch, cache, and optimize.

### The Abstraction That Matters

Regardless of what runs the pipeline (n8n, cron jobs, or purpose-built services), the interface stays the same:

```
Input:  { lens_yaml, opportunity_data, enrichment_data }
Output: { compatibility_briefing }
```

Design the scoring engine as a function with this interface from day one. The infrastructure underneath can change without touching the scoring logic.

---

## What Eric Is Testing Right Now

As case study #1, Eric's daily use of the pipeline generates continuous validation data:

### Signals to Track

- **Scoring accuracy:** When Eric pursues or skips an opportunity, was the score predictive? Track agreement rate.
- **False positive patterns:** New companies that score well but are obviously wrong. Each one is a new regression test case and potentially a new cap or adjustment.
- **Enrichment gaps:** Companies where the score feels wrong because the enrichment data was thin. Which data sources would have helped?
- **Dimension balance:** Does the composite score feel right, or is one dimension dominating inappropriately? Do the weights need tuning?
- **Tension utility:** When the output includes tension notes, are they useful? Do they surface things Eric hadn't considered?
- **Briefing behavior:** Does Eric act on the briefing daily? What does he look at first? What does he ignore? This is UX data for the product.

### How This Feeds the Product

Every scoring tweak Eric makes to his personal pipeline is a product design decision:
- A new cap → a universal guardrail that benefits all future users
- A weight adjustment → a hypothesis about which dimensions matter most
- A source addition → evidence of what sources people need
- A false positive diagnosis → a regression test case
- A behavior pattern (skipping high-scored opportunities) → a signal that the scoring needs refinement on a specific dimension

**The personal system and the product are not separate tracks. The personal system IS the product's R&D environment.**

---

## Open Questions

1. **Role-specific caps:** The current caps (CX vendor, self-serve no ops gap) are specific to CS leadership roles. As the product supports other role types, caps need role-type tagging. Which caps are universal vs. role-specific?

2. **Adjustment values as constants vs. learned:** The current adjustment values (+15 for sector match, -10 for stale funding) are hand-tuned. Should these be learned from aggregate user feedback over time?

3. **Confidence scoring:** When enrichment data is thin, the scoring engine should indicate lower confidence. How should this be communicated to the user? A confidence badge? Muted display? Explicit "limited data" warning?

4. **Prompt assembly for multi-dimensional scoring:** The current prompt produces a single score. The target produces 6 dimension scores. How does the prompt change? One call with 6-part output, or 6 separate calls? (Cost and latency implications.)

5. **Feedback loop mechanics:** When a user Skips a high-scored opportunity, how does that feedback flow back? Does it adjust the lens? The scoring config? Both? Neither (just logged for analysis)?

---

*This document bridges the current personal system with the Lens Project product vision. Update it as the pipeline evolves. Every lesson learned in Eric's daily use is a product design input.*
