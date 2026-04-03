# Role Lens Schema v1.0

*The company-side structured identity document for the Lens marketplace*

**Status:** CONFIDENTIAL — Subject to Mutual NDA
**Patent Status:** Patent Pending — U.S. Application #64/015,187 (filed March 24, 2026)

---

## Overview

A Role Lens is the company-side counterpart to a Candidate Lens. Where the Candidate Lens captures "the indelible you" — who someone actually is professionally — the Role Lens captures "the indelible role" — what this position, team, and company actually are, beyond the job description.

Both documents use the same format: YAML frontmatter (structured, machine-readable scoring signals) + markdown body (narrative context, behavioral evidence, nuance).

The Role Lens is produced through a coach-facilitated discovery process (human or AI persona) that interrogates the company on dimensions traditional job descriptions never cover: how decisions actually get made, what communication norms really look like, where the culture says one thing but does another, and what makes someone thrive vs. survive in this specific environment.

---

## YAML Frontmatter Structure

```yaml
---
# === METADATA ===
schema_version: "1.0"
type: "role_lens"
created: "2026-03-17"
last_updated: "2026-03-17"
coach: "james-pratt"  # or "ai-default", or coach persona ID
company_name: "Acme Health"
role_title: "Head of Customer Support"
department: "Customer Experience"
reports_to: "VP of Operations"
team_size: 8
location: "Remote US / Hybrid NYC"
status: "active"  # active | filled | closed | draft

# === COMPANY IDENTITY ===
company_essence: |
  What this company actually is at its core — not the careers page,
  not the mission statement, but the behavioral truth.
  Produced through discovery, not self-reported.

company_stage: "growth"  # early | growth | scale | mature | turnaround
funding_context: "Series B, 18 months runway"
employee_count: 120
industry_vertical: "digital health"
mission_alignment_score: 0.85  # 0-1, how tightly mission drives daily decisions

# === SCORING DIMENSIONS (weighted, mirror candidate lens) ===
scoring:
  weights:
    mission: 0.25
    role_fit: 0.20
    culture: 0.18
    skill: 0.17
    work_style: 0.12
    energy: 0.08

  # --- MISSION SIGNALS ---
  mission:
    core_problem: "Reducing healthcare navigation friction for underserved populations"
    why_it_matters: "Founders started this after personal experience with system failures"
    mission_in_practice:
      - "Product decisions are filtered through patient impact, not just revenue"
      - "Team has rejected profitable partnerships that conflicted with mission"
    mission_drift_risk: "low"  # low | moderate | high
    sector_tags:
      - "healthcare"
      - "health equity"
      - "patient experience"

  # --- ROLE FIT SIGNALS ---
  role_fit:
    role_essence: |
      This is a builder role, not a maintainer role. The support function
      exists but has no structure, no documentation, no escalation paths.
      The person who thrives here finds energy in creating systems from
      ambiguity, not in optimizing existing ones.
    stage: "0-to-1"  # 0-to-1 | 1-to-10 | optimization | turnaround
    autonomy_level: "high"  # low | moderate | high
    decision_authority: "budget under $10K, headcount requires VP approval"
    scope_clarity: "low"  # low | moderate | high — how well-defined is the role?
    success_at_90_days: |
      Has mapped the current support landscape, identified the top 3
      pain points, and shipped at least one structural improvement
      (could be a triage system, a knowledge base, or a staffing model).
    success_at_1_year: |
      Support function is recognized internally as a strategic asset,
      not a cost center. CSAT trending up. Retention metrics improving.
      Has hired at least 2 people and begun building the team culture.

  # --- CULTURE SIGNALS ---
  culture:
    decision_making: "consensus-leaning but founders break ties"
    conflict_style: "avoidant — team tends to let tensions simmer"
    feedback_norms: "informal, infrequent, mostly positive"
    meeting_culture: "moderate — 3-4 hours/day in meetings, async encouraged"
    communication_channels:
      primary: "Slack"
      secondary: "Notion docs"
      cadence: "weekly all-hands, daily standups in eng only"
    transparency_level: "high"  # low | moderate | high
    psychological_safety: "moderate"  # assessed, not self-reported
    values_in_practice:
      - signal: "They say 'move fast' but actually value thoroughness"
        evidence: "Last 3 product launches were delayed for quality"
      - signal: "Genuine commitment to diversity"
        evidence: "Leadership team is 40% women, 30% BIPOC; ERGs are active"
      - signal: "Work-life boundaries are respected in practice"
        evidence: "No Slack messages after 7pm norm; PTO is actually taken"

  # --- SKILL SIGNALS ---
  skill:
    required:
      - "Support operations leadership (team management, tooling, process design)"
      - "Customer-facing communication at executive level"
      - "Data literacy — can build dashboards, interpret CSAT/NPS trends"
    preferred:
      - "Healthcare or regulated industry experience"
      - "Experience with Zendesk, Intercom, or similar platforms"
      - "Technical enough to collaborate with engineering on integrations"
    overrated:
      - "Enterprise support experience — this is not an enterprise support role"
      - "Specific tool certifications — we care about thinking, not tooling"
    underrated:
      - "Ability to write clearly — support documentation is a core output"
      - "Comfort with ambiguity — the role definition will evolve"
      - "Emotional intelligence — supporting a team that supports patients"

  # --- WORK STYLE SIGNALS ---
  work_style:
    pace: "fast but not frantic — startup urgency without burnout culture"
    structure: "low — you'll build your own structure"
    collaboration_model: "cross-functional pods, not siloed departments"
    remote_norms: "truly remote-first, not remote-tolerated"
    timezone_expectations: "core hours 10am-3pm ET, flexible otherwise"
    tools:
      - "Slack (async-heavy)"
      - "Notion (documentation)"
      - "Linear (project tracking)"
      - "Zoom (meetings, cameras optional)"
    manager_style: |
      VP of Ops is hands-off, strategic, available when needed.
      Expects proactive updates, not check-ins. Will advocate hard
      for resources but needs data to make the case.

  # --- ENERGY SIGNALS ---
  energy:
    fills:
      - "Building something from nothing"
      - "Direct patient impact stories"
      - "Cross-functional problem solving"
      - "Mentoring and developing team members"
    drains:
      - "Bureaucratic approval processes (minimal here)"
      - "Micromanagement (not the culture)"
      - "Pure cost-cutting without strategic context"
    team_energy: |
      Small, mission-driven, collaborative. People care about each other.
      Low ego. High accountability. The kind of team where someone
      will stay late to help a colleague, not because they're told to.

# === DISQUALIFIERS (instant rejection signals) ===
disqualifiers:
  hard:
    - "Cannot work US Eastern hours (core hours requirement)"
    - "Requires team of 20+ to feel effective (this starts at 8)"
    - "Needs highly defined role boundaries (this role is fluid)"
  soft:
    - "Strongly prefers enterprise/Fortune 500 environments"
    - "Uncomfortable with direct patient/customer interaction"
    - "Requires extensive management hierarchy above them"

# === COMPATIBILITY NOTES ===
# These are not disqualifiers but known tensions to surface in matching
compatibility_notes:
  - tension: "High autonomy + low scope clarity"
    implication: "Candidate must be self-directed; this will frustrate people who need clear direction"
  - tension: "Mission-driven + startup economics"
    implication: "Compensation is competitive but not top-of-market; mission must be part of the draw"
  - tension: "Avoidant conflict culture + builder role"
    implication: "This person will need to introduce healthy friction; the team isn't used to it"

# === COMPENSATION ===
compensation:
  base_range: "$140,000 - $170,000"
  equity: "0.05% - 0.10% (4-year vest, 1-year cliff)"
  benefits_highlights:
    - "Full health/dental/vision"
    - "Unlimited PTO (actually used — avg 22 days/year)"
    - "Home office stipend"
    - "$1,500 annual learning budget"

# === SCORE THRESHOLDS ===
thresholds:
  strong_match: 0.80
  worth_exploring: 0.65
  likely_mismatch: 0.50
---
```

## Markdown Body: Discovery Narrative

Below the frontmatter, the markdown body contains the narrative output from the coach-facilitated discovery process. This is the qualitative context that scoring alone cannot capture.

### Company Story

*What emerged from the discovery process about who this company actually is.*

[Coach-generated narrative based on discovery conversation with hiring manager, team members, and/or founders. This section captures the behavioral truth behind the job posting — the real dynamics, the unspoken expectations, the things a candidate would only learn after 3 months on the job.]

### Role Story

*What this role actually needs vs. what the job description says.*

[Coach-generated narrative exploring the gap between the posted JD and the lived reality. What does the hiring manager actually need? What does the team actually want? Where are the unstated expectations? What would make the previous person in this role (if any) say "I wish I'd known that before I started"?]

### Team Dynamics

*How this team actually works together — the spoken and unspoken norms.*

[Coach-generated narrative based on behavioral evidence about communication patterns, decision-making, conflict resolution, and the social dynamics of the team this person would join.]

### Growth Context

*Where this role and company are headed — the honest version.*

[Coach-generated narrative about the realistic trajectory. Is the company growing? Contracting? Pivoting? What does the next 12-18 months look like? What might change about this role?]

---

## Schema Design Principles

1. **Behavioral evidence over aspiration.** Every signal should be grounded in observable behavior, not marketing language. "We value transparency" is useless. "Leadership team shares board deck with all employees monthly" is a signal.

2. **Mirror the candidate lens.** The six scoring dimensions (Mission, Role Fit, Culture, Skill, Work Style, Energy) are identical on both sides. This enables direct comparison scoring.

3. **Surface tensions, don't hide them.** The `compatibility_notes` section exists specifically to flag areas where a match might score well overall but have predictable friction points. This is the "briefing, not a job alert" philosophy.

4. **Append, don't overwrite.** As the company evolves, new discovery sessions add dated entries. The role lens becomes a longitudinal record — showing how the company and role have changed over time.

5. **Coach as quality gate.** Self-reported company data is marketing. Coach-facilitated discovery produces behavioral evidence. The discovery process should push back on aspirational statements and ask for specific examples.

---

## Discovery Sections (Company Side)

These mirror the 8 candidate discovery sections, adapted for the employer:

1. **Company Essence** — What is this company actually about? Not the mission statement — the behavioral truth.
2. **Role Reality** — What does success actually look like? What would make someone quit this role in 6 months?
3. **Culture as Behavior** — How are decisions made? How is conflict handled? What happens when someone disagrees with leadership?
4. **Team Dynamics** — Who is on this team? How do they communicate? What's the energy?
5. **Growth & Trajectory** — Where is this company headed? What's the runway? What might change?
6. **Manager & Leadership** — What is the manager's style? How does leadership operate?
7. **Disqualifiers** — What would make someone absolutely wrong for this role? Be specific.
8. **The Honest Pitch** — If you could only tell a candidate one true thing about working here, what would it be?

---

## Matching Logic

When a Candidate Lens and Role Lens are scored against each other, the matching engine evaluates alignment across all six dimensions using the shared weights:

- **Mission alignment**: Does what drives the candidate align with what drives the company?
- **Role fit**: Does the candidate's preferred stage/scope match the role's reality?
- **Culture compatibility**: Do the candidate's communication/conflict/feedback preferences align with the company's actual norms?
- **Skill match**: Does the candidate bring what the role needs (including the "underrated" skills)?
- **Work style alignment**: Do the practical realities (pace, structure, remote norms, tools) match?
- **Energy alignment**: Will this environment fill or drain the candidate?

The output is not a single score but a **compatibility briefing**: overall alignment, dimension-by-dimension breakdown, and flagged tension points from both sides.

---

*This schema is a living document. Version 1.0 establishes the structure. Future versions will refine based on real discovery sessions with companies and coaches.*
