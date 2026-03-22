# Candidate Lens Schema v1.0

*The candidate-side structured identity document*

---

## Format

YAML frontmatter (structured, machine-readable scoring signals) + markdown body (narrative context, behavioral evidence).

## YAML Frontmatter Structure

```yaml
---
schema_version: "1.0"
type: "candidate_lens"
created: "2026-03-18"
last_updated: "2026-03-18"
coach: "ai-default"  # or coach persona ID (e.g., "james-pratt")
status: "searching"  # employed | searching | transitioning

# === IDENTITY ===
name: "Jane Doe"
location: "Portland, OR"
current_role: "Senior Customer Success Manager"
years_experience: 12

# === SCORING DIMENSIONS (weighted) ===
scoring:
  weights:
    mission: 0.25
    role_fit: 0.20
    culture: 0.18
    skill: 0.17
    work_style: 0.12
    energy: 0.08

  # --- MISSION (25%) ---
  mission:
    core_drive: "Reducing friction in systems that affect vulnerable people"
    sectors:
      - "healthcare"
      - "education"
      - "public benefit tech"
    sector_signals:
      - "Mission must be more than marketing — evidence of mission-driven decisions"
      - "Company has turned down revenue to stay aligned with mission"
    anti_sectors:
      - "adtech"
      - "crypto/web3"
      - "defense"

  # --- ROLE FIT (20%) ---
  role_fit:
    preferred_stage: "0-to-1"  # 0-to-1 | 1-to-10 | optimization | turnaround
    scope: "Build support function from scratch, hire team, define processes"
    autonomy_need: "high"
    title_range:
      - "Head of Customer Support"
      - "VP of Customer Experience"
      - "Director of Customer Success"
    team_size_preference: "building from 0-5 to 10-15"

  # --- CULTURE (18%) ---
  culture:
    communication_style: "direct but kind; written-first; async-comfortable"
    conflict_preference: "address early, not avoid"
    feedback_need: "honest, specific, frequent"
    values_behavioral:
      - signal: "Values diverse perspectives"
        evidence: "Actively sought out dissenting views when building team processes"
      - signal: "Transparency over comfort"
        evidence: "Shared difficult metrics with team rather than filtering bad news"
    psychological_safety_need: "high"

  # --- SKILL (17%) ---
  skill:
    carry_forward:
      - "Support operations design and scaling"
      - "Cross-functional program management"
      - "Data-driven decision making (CSAT, NPS, resolution time)"
      - "Hiring and team development"
    leave_behind:
      - "Individual contributor account management"
      - "Cold outbound sales"
    learning_interests:
      - "AI/ML applications in customer support"
      - "Product-led growth intersections"

  # --- WORK STYLE (12%) ---
  work_style:
    pace: "steady intensity, not crisis-driven"
    structure: "builds own structure; needs autonomy to design systems"
    remote: "remote-first strongly preferred"
    timezone: "US Pacific or flexible"
    tools_comfort:
      - "Zendesk / Intercom"
      - "Slack (async-heavy)"
      - "Notion / Confluence"
      - "SQL / basic data tools"
    meeting_tolerance: "3-4 hrs/day max; async over meetings"

  # --- ENERGY (8%) ---
  energy:
    fills:
      - "Building something that didn't exist before"
      - "Mentoring and watching team members grow"
      - "Solving systemic problems, not just tickets"
      - "Direct impact on people's lives through the product"
    drains:
      - "Political maneuvering"
      - "Performative culture (values on the wall, not in practice)"
      - "Firefighting without addressing root causes"
      - "Being asked to optimize for cost at the expense of quality"

# === DISQUALIFIERS (instant rejection) ===
disqualifiers:
  hard:
    - "PE-backed company"
    - "Company >200 employees"
    - "On-site required >2 days/week"
    - "Base compensation <$125K"
    - "Role is maintainer, not builder"
  soft:
    - "No clear mission beyond revenue growth"
    - "Leadership team lacks diversity"
    - "Glassdoor reviews mention micromanagement consistently"

# === SCORE THRESHOLDS ===
thresholds:
  strong_match: 0.80
  worth_exploring: 0.65
  likely_mismatch: 0.50
---
```

## Markdown Body Structure

Below the frontmatter, the markdown body contains narrative output from the discovery conversation:

### Essence
*Who you are across every context. The throughline.*

[AI-generated narrative from discovery section 1]

### Skills & Experience
*What you carry forward. What you leave behind.*

[AI-generated narrative from discovery section 2]

### Values
*What you've chosen at a cost to yourself.*

[AI-generated narrative from discovery section 3]

### Mission & Sector
*What problems are worth your time.*

[AI-generated narrative from discovery section 4]

### Work Style
*How you actually work.*

[AI-generated narrative from discovery section 5]

### What Fills You
*Energy sources and drains.*

[AI-generated narrative from discovery section 6]

### Disqualifiers
*Hard no's. Non-negotiable.*

[AI-generated narrative from discovery section 7]

### Situation & Timeline
*Where you are now. What's urgent.*

[AI-generated narrative from discovery section 8]

---

## Design Principles

1. **Behavioral evidence over aspiration.** Every signal should be grounded in action, not self-description.
2. **Append, don't overwrite.** Returning to the lens adds dated layers. The document grows over time.
3. **Portable and owned.** The user downloads and controls their file. No platform lock-in.
4. **Machine-readable + human-readable.** YAML for scoring engines. Markdown for people.
5. **Coach as quality gate.** Self-serve produces a draft. Coach-facilitated produces the real thing.

## Relationship to Role Lens

The candidate lens and role lens use the same 6 scoring dimensions with the same weights. This enables direct comparison scoring. See `role-lens-schema-v1.md` for the company-side schema.
