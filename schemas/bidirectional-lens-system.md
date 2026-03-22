# Bidirectional Lens System — Technical Specification

**Author:** Eric Zelman
**Date:** March 21, 2026
**Version:** 1.0
**Status:** CONFIDENTIAL — Subject to Mutual NDA

---

## 1. System Overview

The Bidirectional Lens System is a method for evaluating mutual fit between job seekers and hiring organizations using structured identity signals rather than keyword matching. The system operates two parallel document types — a Candidate Lens and a Role Lens — each produced through guided discovery, and runs a matching algorithm that scores each against the other to produce a Match Report with signal-based reasoning.

The core insight: existing hiring tools score in one direction (does the candidate match the job description?) using surface-level signals (keywords, years of experience, title matching). The Bidirectional Lens System scores in both directions (does the candidate fit the role AND does the role fit the candidate?) using deep identity signals (values alignment, energy patterns, work style compatibility, relational fit, cultural real talk).

### What makes this distinct from existing tools

| Tool | Direction | Signal Type | Output |
|------|-----------|-------------|--------|
| ATS (Greenhouse, Lever) | Company → Candidate | Keyword overlap | Pass/fail screen |
| DISC / StrengthsFinder | Neither (self-assessment) | Static trait inventory | Profile report |
| 360 Feedback | Backward-looking | Peer perception | Development plan |
| Jack & Jill | Candidate → Company | Shallow preference match | Job recommendations |
| **Bidirectional Lens** | **Both directions** | **Deep identity signals** | **Mutual fit score + reasoning** |

---

## 2. Document Architecture

Both lens types share the same file format: markdown with YAML frontmatter. This means the same parsing, scoring, and display infrastructure handles both. The structural symmetry is intentional — it's what makes the matching algorithm possible.

### 2.1 Candidate Lens (existing, summarized for reference)

```yaml
---
lens_type: candidate
version: "1.0"
generated: 2026-03-21
subject: "Eric Zelman"
status: actively_searching  # employed | actively_searching | in_transition

scoring:
  dimensions:
    mission: 25
    role: 20
    culture: 18
    skill: 17
    work_style: 12
    energy: 8

  disqualifiers:
    - "PE-backed company"
    - "Public company or Fortune 500"
    - ">200 employees"
    - "Quota-carrying CSM role"
    - "Consumer/B2C"

  domain_affinity:
    primary: "Healthcare B2B SaaS"
    modifiers:
      "Healthcare B2B SaaS": +5
      "Clinical Operations": +5
      "Care Coordination": +4
      "Patient Engagement": +3
      "Developer Tools": +2
      "General Enterprise SaaS": 0
      "IT Operations/ITSM": -8
      "Physical Security": -10

signals:
  essence:
    throughline: "Building scaffolding for others to thrive"
    identity_pattern: "Integration over performance"
    metaphor: "Tide pool — creating spaces for others to live their entire existence"

  values:
    behavioral:
      - "Treats direct reports as whole people, not headcount"
      - "Defaults to transparency even when it's uncomfortable"
      - "Prioritizes sustainable pace over heroic effort"
    anti_values:
      - "Performance theater"
      - "Metrics without meaning"
      - "Growth at any human cost"

  work_style:
    communication: "Async-first, synchronous for relationship-building"
    decision_making: "Holds decisions until the last responsible moment"
    collaboration: "Collaborative but needs autonomy to think"
    energy_rhythm: "Deep work in morning, meetings in afternoon"

  energy:
    fills:
      - "Seeing someone I mentored succeed independently"
      - "Building a system from scratch that actually works"
      - "Substantive conversation about how things really work"
    drains:
      - "Political navigation without substance"
      - "Maintaining someone else's broken system"
      - "Being measured on metrics I can't influence"

  mission:
    sectors: ["Healthcare B2B SaaS", "Regulated industries", "Developer tools with enterprise motion"]
    problem_affinity: "Post-sales experience at the inflection point where founder-led relationships break down"
    role_type: "Builder (0-to-1), not Maintainer (scale existing)"

  situation:
    timeline: "Actively searching, open to immediate start"
    compensation_floor: 125000
    location: "Remote preferred; Providence, Boston, NYC, LA, SF, EU/UK acceptable"
    constraints: ["No relocation required for family reasons"]
---

# Eric Zelman — Candidate Lens

[Discovery narrative sections follow...]
```

### 2.2 Role Lens (NEW — company-side document)

The Role Lens is produced through a parallel discovery process, conducted with a hiring manager, team lead, or founder. It captures the same depth of identity signals but from the organizational perspective: who actually thrives here, what the team's real working culture is (not the careers page), what drains the people already in this role, and what the hard no's are from lived experience.

```yaml
---
lens_type: role
version: "1.0"
generated: 2026-03-21
organization: "Company Name"
role_title: "Head of Customer Success"
hiring_manager: "Jane Doe, CEO"
team_size_current: 0  # 0 = greenfield hire
team_size_planned: 5
stage: "Series A"
employee_count: 45
funding_total: 12000000

scoring:
  dimensions:
    builder_orientation: 25
    relational_fit: 22
    domain_fluency: 18
    values_alignment: 15
    work_style_compatibility: 12
    energy_match: 8

  disqualifiers:
    - "No experience building a CS function from zero"
    - "Only managed teams >20 (can't do IC work)"
    - "Requires rigid process before understanding the customer"
    - "Views support as cost center, not growth engine"
    - "Cannot operate without established playbook"

  role_type: builder  # builder | maintainer | hybrid
  urgency: high       # low | medium | high | critical

signals:
  team_essence:
    identity: "Small team that ships fast and talks to customers daily"
    throughline: "We believe post-sales is where the real product gets built"
    stage_reality: "Founder still handles renewals personally — this hire takes that over and builds the function"

  who_thrives_here:
    traits:
      - "Comfortable with ambiguity — there is no playbook yet"
      - "Can talk to a nurse about their workflow AND to a CTO about integration architecture"
      - "Gets energy from building the plane while flying it"
      - "Treats the first 5 hires as the most important hiring decisions of their career"
    anti_traits:
      - "Needs to manage a large existing team to feel important"
      - "Wants to execute a proven playbook"
      - "Sees customer interaction as beneath a VP"
      - "Optimizes for metrics dashboards before understanding the customer"

  values_real_talk:
    lived:
      - "We actually do unlimited PTO and people take it — founder models 3 weeks/year"
      - "Disagreement happens in the open, not in back-channels"
      - "We've fired fast when values misalignment was clear, even with strong performers"
    aspirational_but_honest:
      - "We want async-first but we're honestly still in too-many-meetings mode"
      - "We say 'no ego' but the founder is deeply opinionated — you need to push back, not defer"
    anti_values:
      - "Empire building"
      - "Process for process's sake"
      - "Title-consciousness"

  work_style_reality:
    communication: "Slack-heavy, Zoom for anything emotional or complex"
    meetings: "3-4 hours/day of meetings currently, goal is to reduce to 2"
    decision_speed: "Fast — most decisions are made in 24 hours"
    autonomy: "High once trust is established (usually 30-60 days)"
    remote_reality: "Fully remote but the 3 people in SF grab lunch weekly — no disadvantage for remote"

  energy_of_the_role:
    fills:
      - "Seeing a customer go from frustrated to advocate because of something you built"
      - "Hiring your first team member and watching them grow"
      - "Presenting retention data to the board and showing the CS function's impact on revenue"
    drains:
      - "First 90 days are lonely — you're the only CS person"
      - "Founder will second-guess your first few decisions until trust is built"
      - "Some existing customers are angry — inherited mess from no CS function"

  what_this_role_is_not:
    - "Not a pure support/ticketing role — this is strategic CS with revenue accountability"
    - "Not a hiring-only role — you will be IC for the first 6 months"
    - "Not autonomous from day one — founder is closely involved in CS decisions initially"

  hiring_context:
    why_now: "Series A closed 4 months ago, churn is the board's top concern"
    who_failed: "Tried to promote an AE into this role — wrong skill set"
    compensation_range: [140000, 170000]
    equity: "0.15-0.25% standard for this stage"
    timeline: "Want someone within 45 days"
    process: "Founder screen → team panel → case study → reference calls → offer"
---

# Head of Customer Success — Role Lens

[Discovery narrative sections follow...]
```

### 2.3 Role Lens Discovery Sections

The Role Lens is generated through 8 discovery sections that mirror the Candidate Lens but are directed at the hiring manager or founder. Each section has the same structural elements: `systemContext` (AI coaching instructions), `workflowHint` (what signals to extract), and `scoreDimension` (which scoring dimension this maps to).

#### Section 1: Team Essence
**What it captures:** The team's actual identity — not the mission statement, but how the people here describe what they do when they're being honest. What's the throughline across the people who've stayed and thrived?
**systemContext:** "You're trying to surface the team's real identity. Push past the careers page language. Ask: 'If you had to describe this team to a friend over drinks, what would you say?' and 'What do the people who've stayed longest have in common?'"
**workflowHint:** Extract identity patterns, stage-of-company reality, founder relationship dynamics.
**scoreDimension:** relational_fit

#### Section 2: Who Thrives Here
**What it captures:** The behavioral profile of people who've succeeded in this environment — and who hasn't. Not skills or experience, but how they work, how they handle ambiguity, how they relate to others.
**systemContext:** "Ask for specific stories. 'Tell me about someone who crushed it here — what did they do in their first 90 days?' Then: 'Tell me about someone who looked great on paper but didn't work out — what went wrong?' Extract the behavioral patterns, not the resume lines."
**workflowHint:** Extract thriving-trait signals and anti-trait signals for scoring against candidate essence and work style.
**scoreDimension:** relational_fit, builder_orientation

#### Section 3: Values Real Talk
**What it captures:** The gap between stated values and lived values. Every company has a careers page with values. This section surfaces which of those are real, which are aspirational, and what the actual anti-values are.
**systemContext:** "Don't ask 'what are your values?' — they'll recite the website. Instead ask: 'Tell me about a time the company made a decision that was expensive or painful because of a value you hold. What happened?' Then: 'What behavior would get someone fired here even if they were a top performer?'"
**workflowHint:** Extract lived-value evidence, aspirational-but-honest signals (things they want to be true but aren't yet), and hard anti-values.
**scoreDimension:** values_alignment

#### Section 4: Work Style Reality
**What it captures:** How people actually work here day-to-day. Meeting load, communication patterns, decision speed, remote reality, autonomy timeline.
**systemContext:** "Ask them to walk you through a typical Tuesday. How many meetings? How much deep work time? When do decisions actually get made — in meetings or in Slack threads afterward? If someone is remote, do they actually have the same access and influence as people in the office?"
**workflowHint:** Extract concrete work-pattern signals for matching against candidate work style preferences.
**scoreDimension:** work_style_compatibility

#### Section 5: Energy of the Role
**What it captures:** What energizes and drains people in this specific role at this specific company. Not generic job pros/cons, but the emotional reality of this seat.
**systemContext:** "Ask: 'When the person in this role goes home on a Friday feeling great, what happened that week?' Then: 'When they go home drained, what caused it?' Get to the specific moments, not abstractions."
**workflowHint:** Extract energy-fill and energy-drain signals for matching against candidate energy patterns.
**scoreDimension:** energy_match

#### Section 6: Builder vs. Maintainer Mandate
**What it captures:** Whether this role is building from zero, scaling something early, or maintaining/optimizing an existing function. The clearest single predictor of candidate-role mismatch.
**systemContext:** "Ask directly: 'Is there an existing team, existing processes, existing metrics? Or is this person creating all of that?' Follow up: 'What does success look like at 90 days, 6 months, 1 year?' The answers reveal the real mandate regardless of what the job description says."
**workflowHint:** Extract builder/maintainer signals, greenfield indicators, existing infrastructure details.
**scoreDimension:** builder_orientation

#### Section 7: Disqualifiers
**What it captures:** The hard no's from the hiring manager's lived experience. Not "nice to haves" — the things that, if present, mean this person will fail regardless of other strengths.
**systemContext:** "Ask: 'Think about the worst hire you've made for a role like this. What was the trait or behavior that doomed them?' Then: 'If you could screen for exactly one thing, what would it be?' These are your hard gates."
**workflowHint:** Extract disqualifier signals for hard-gate filtering before scoring runs.
**scoreDimension:** N/A (gates, not scores)

#### Section 8: Hiring Context
**What it captures:** Why this role is open now, what's been tried before, compensation parameters, timeline, process. The practical context that shapes how the matching system should weight urgency and accessibility.
**systemContext:** "Ask: 'Why is this role open now — what changed?' and 'Has someone been in this role before? What happened?' This surfaces whether the need is growth-driven (positive) or failure-driven (may indicate systemic issues). Get compensation range and timeline as concrete numbers."
**workflowHint:** Extract urgency signals, predecessor signals, compensation and timeline data.
**scoreDimension:** N/A (metadata, not scored)

---

## 3. Matching Algorithm

### 3.1 Design Principles

The matching algorithm is **asymmetric by design**. The Candidate Lens and Role Lens use different scoring dimensions with different weights because the two sides are asking different questions. The candidate asks: "Is this the right opportunity for my career and identity?" The company asks: "Is this the right person for our team and stage?" These are related but not identical questions, and the scoring must reflect that.

The system produces **two independent scores plus a mutual fit composite**, not a single number. A high candidate-to-role score with a low role-to-candidate score means "the candidate would love this job, but the company wouldn't pick them." A high role-to-candidate score with a low candidate-to-role score means "the company would love this candidate, but the candidate would be miserable." Both situations are useful information.

### 3.2 Scoring Dimensions

#### Candidate → Role Score (C→R): "How well does this opportunity fit me?"

Uses the Candidate Lens's scoring dimensions:

| Dimension | Weight | What it measures |
|-----------|--------|-----------------|
| Mission | 25 | Does this company's sector, problem space, and stage match what I'm drawn to? |
| Role | 20 | Is this a builder or maintainer mandate? Does the role match my desired scope? |
| Culture | 18 | Do the lived values (from role lens) match my values? Can I be authentic here? |
| Skill | 17 | Can I do this job? Does it use the skills I want to carry forward? |
| Work Style | 12 | Does their actual working rhythm match how I work best? |
| Energy | 8 | Will the fills outweigh the drains based on the energy signals? |

Plus domain distance modifier (existing system).

#### Role → Candidate Score (R→C): "How well does this candidate fit our role?"

Uses the Role Lens's scoring dimensions:

| Dimension | Weight | What it measures |
|-----------|--------|-----------------|
| Builder Orientation | 25 | Does this candidate have evidence of building from zero (or maintaining, if that's the need)? |
| Relational Fit | 22 | Does their essence and identity pattern match who thrives here? |
| Domain Fluency | 18 | Do they understand our sector, our customers, our technical environment? |
| Values Alignment | 15 | Do their lived values match our lived values (not our aspirational ones)? |
| Work Style Compatibility | 12 | Can they operate in our actual working rhythm? |
| Energy Match | 8 | Will the energy patterns of this role fill them more than drain them? |

#### Mutual Fit Score (MF)

```
MF = (C→R × 0.5) + (R→C × 0.5)
```

Equal weighting by default. In practice, the weighting can be adjusted:
- In a candidate's market (high demand, low supply), weight R→C higher because the candidate has more choices
- In an employer's market, weight C→R higher because the company has more choices
- When a coach is involved, the coach can adjust the weights based on what they know about the candidate's priorities

### 3.3 Dimension Cross-Mapping

This is the core of the matching algorithm — how signals from one lens score against dimensions of the other. Each scoring dimension draws from specific signal fields in the opposing lens.

#### C→R Dimension Sources (what in the Role Lens feeds the Candidate's score?)

| Candidate Dimension | Role Lens Signal Sources |
|--------------------|------------------------|
| Mission (25) | `organization`, `stage`, `hiring_context.why_now`, `team_essence.stage_reality` |
| Role (20) | `role_type`, `team_size_current`, `signals.builder_vs_maintainer`, `signals.what_this_role_is_not` |
| Culture (18) | `signals.values_real_talk.lived`, `signals.values_real_talk.anti_values`, `signals.who_thrives_here.traits` |
| Skill (17) | `role_title`, `signals.who_thrives_here.traits`, `signals.hiring_context` |
| Work Style (12) | `signals.work_style_reality` (all subfields) |
| Energy (8) | `signals.energy_of_the_role.fills`, `signals.energy_of_the_role.drains` |

#### R→C Dimension Sources (what in the Candidate Lens feeds the Role's score?)

| Role Dimension | Candidate Lens Signal Sources |
|---------------|------------------------------|
| Builder Orientation (25) | `signals.mission.role_type`, `signals.essence.throughline`, work history builder/maintainer signals |
| Relational Fit (22) | `signals.essence`, `signals.values.behavioral`, `signals.energy.fills` |
| Domain Fluency (18) | `scoring.domain_affinity`, work history sector signals, `signals.mission.sectors` |
| Values Alignment (15) | `signals.values.behavioral` vs role `signals.values_real_talk.lived`, anti-value cross-check |
| Work Style Compatibility (12) | `signals.work_style` vs role `signals.work_style_reality` |
| Energy Match (8) | `signals.energy.fills` vs role `signals.energy_of_the_role.fills`, drain cross-check |

### 3.4 Hard Gate Logic

Before scoring runs in either direction, hard gates are evaluated. If any gate fails, scoring stops and the match is marked as disqualified with the reason.

**C→R Gates (Candidate's disqualifiers checked against Role Lens metadata):**
```
FOR EACH candidate.scoring.disqualifiers:
  IF role_lens matches disqualifier pattern → DISQUALIFY
  
Examples:
  "PE-backed company" → check role_lens.stage, role_lens.funding context
  ">200 employees" → check role_lens.employee_count
  "Consumer/B2C" → check role_lens.organization sector signals
```

**R→C Gates (Role's disqualifiers checked against Candidate Lens signals):**
```
FOR EACH role.scoring.disqualifiers:
  IF candidate_lens matches disqualifier pattern → DISQUALIFY

Examples:
  "No experience building CS from zero" → check candidate work history for 0-to-1 evidence
  "Cannot operate without established playbook" → check candidate.signals.mission.role_type
  "Views support as cost center" → check candidate.signals.values, essence throughline
```

Gates are evaluated in code, not by the LLM. This prevents the false-positive problem where the LLM assumes gates have passed (learned from the v9 pipeline experience where ~74% false positive rate was caused by gates existing in prompt language rather than code).

### 3.5 Score Calculation Method

Each dimension score is calculated by an LLM (Claude) that receives:
1. The full scoring lens (the one whose dimensions are being scored)
2. The relevant signal fields from the opposing lens (per the cross-mapping table)
3. Explicit instructions to score on a 0-to-max scale with rationale

The LLM returns a JSON object per dimension:
```json
{
  "score": 18,
  "max": 25,
  "confidence": 0.8,
  "rationale": "Strong builder evidence: built CS function from zero at Bigtincan, explicitly seeks 0-to-1 mandate. However, most recent experience was at a company that grew to 200+ employees, so late-stage maintenance experience may have diluted the builder instinct. High confidence on builder history, moderate confidence on current preference.",
  "signal_matches": [
    { "candidate_signal": "role_type: builder", "role_signal": "role_type: builder", "strength": "strong" },
    { "candidate_signal": "throughline: building scaffolding for others", "role_signal": "stage_reality: founder still handles renewals", "strength": "strong" }
  ],
  "signal_tensions": [
    { "candidate_signal": "energy_drain: maintaining broken system", "role_signal": "energy_drain: inherited mess from no CS function", "tension": "Candidate dislikes maintaining broken systems but this role involves inheriting frustrated customers — tension between the candidate's preference and the role's reality in months 1-3" }
  ]
}
```

The `confidence` field (0.0-1.0) reflects how much signal the LLM had to work with. Low confidence scores are flagged in the match report as areas where more discovery is needed.

### 3.6 Thresholds

| Classification | C→R Score | R→C Score | Mutual Fit |
|---------------|-----------|-----------|------------|
| STRONG MUTUAL FIT | 80+ | 80+ | 80+ |
| GOOD MUTUAL FIT | 60+ | 60+ | 60+ |
| ASYMMETRIC FIT | One 60+, other <60 | — | Flagged |
| MARGINAL | 40-59 | 40-59 | 40-59 |
| POOR FIT | <40 | <40 | <40 |

ASYMMETRIC FIT is the most interesting classification — it means the match is strong in one direction but not the other. The match report explicitly names the asymmetry and explains what would need to change for the fit to become mutual.

---

## 4. Match Report Format

The Match Report is the primary output of the bidirectional system. It's what the candidate sees, what the hiring manager sees (in the enterprise product), and what a coach uses to guide next steps. Each audience gets the same data presented with different emphasis.

### 4.1 Structure

```
MATCH REPORT
============

[Header]
  Candidate: {name}
  Role: {role_title} at {organization}
  Generated: {date}
  Classification: {STRONG MUTUAL FIT | GOOD MUTUAL FIT | ASYMMETRIC FIT | MARGINAL | POOR FIT}

[Score Summary]
  Candidate → Role:  {score}/100  ({classification})
  Role → Candidate:  {score}/100  ({classification})
  Mutual Fit:        {score}/100  ({classification})

[Narrative Briefing]
  2-3 paragraph human-readable summary of the match. Leads with the strongest
  signal, names the primary tension, and ends with a recommended action.

[Alignment Map]
  Visual representation of where the two lenses align and diverge.
  Each dimension pair is shown with:
    - Candidate dimension score → Role dimension score
    - Signal matches (what aligns)
    - Signal tensions (what diverges)
    - Confidence level

[Strong Alignment Signals]
  The 3-5 strongest signal matches across all dimensions. Each includes:
    - What the candidate signal is
    - What the role signal is
    - Why this alignment is meaningful (not just "both said X")

[Tension Signals]
  The 2-4 most significant tensions. Each includes:
    - What the candidate signal is
    - What the role signal is
    - Why this tension matters
    - Whether it's resolvable (preference vs. dealbreaker)
    - What question to ask in an interview to test it

[Disqualifier Check]
  Pass/fail status for all hard gates in both directions.
  If any failed: which one and why.

[Confidence Gaps]
  Dimensions where confidence was below 0.6, meaning there wasn't
  enough signal in one or both lenses to score reliably.
  Each gap includes a suggested discovery question to fill it.

[Recommended Actions]
  Based on classification:
    STRONG MUTUAL FIT → Pursue. Here's what to emphasize in outreach.
    GOOD MUTUAL FIT → Pursue with awareness. Here are the tensions to probe.
    ASYMMETRIC FIT → Proceed with caution. Here's what's misaligned and how to test it.
    MARGINAL → Monitor. Here's what would need to change.
    POOR FIT → Skip. Here's why in one sentence.

[Feedback Prompt]
  "Did you pursue this opportunity? What happened? Your response
  improves the matching system for everyone."
```

---

## 5. Worked Example: Eric Zelman × LeanData

### 5.1 Context

LeanData is Eric's highest-priority warm lead. Series B revenue operations platform, recently hired a new CCO (Dave Ginsburg). Eric has warm paths through Niels and Matt Stager. The company is in the revenue intelligence / lead routing space — not healthcare, but enterprise B2B SaaS with a CS motion that's likely being rebuilt under new leadership.

*Note: The Role Lens below is constructed from publicly available information and reasonable inference, not from actual discovery with LeanData's hiring manager. In production, this would be generated through the 8-section discovery process.*

### 5.2 Candidate Lens (Eric Zelman — abbreviated)

See Section 2.1 above for the full YAML. Key signals for this match:

- **Essence:** Building scaffolding for others; integration over performance
- **Role type:** Builder (0-to-1)
- **Sectors:** Healthcare B2B SaaS preferred, Enterprise SaaS acceptable
- **Disqualifiers:** PE-backed, >200 employees, public company, consumer/B2C
- **Work style:** Async-first, holds decisions, collaborative but needs autonomy
- **Energy fills:** Seeing mentored people succeed, building from scratch, substantive conversation
- **Energy drains:** Political navigation, maintaining broken systems, metrics without influence
- **Compensation floor:** $125K

### 5.3 Role Lens (LeanData — Head of Customer Success, inferred)

```yaml
---
lens_type: role
version: "1.0"
generated: 2026-03-21
organization: "LeanData"
role_title: "Head of Customer Success"
hiring_manager: "Dave Ginsburg, CCO (new)"
team_size_current: ~8  # existing CS team under prior leadership
team_size_planned: 10-12
stage: "Series B"
employee_count: ~150
funding_total: ~100000000

scoring:
  dimensions:
    builder_orientation: 25
    relational_fit: 22
    domain_fluency: 18
    values_alignment: 15
    work_style_compatibility: 12
    energy_match: 8

  disqualifiers:
    - "No experience with enterprise SaaS CS at scale"
    - "Cannot manage a team while also being strategic"
    - "No revenue accountability experience (renewals, expansion)"
    - "Only startup experience — no process discipline"

  role_type: hybrid  # rebuilder — existing team, new leadership, new direction
  urgency: medium

signals:
  team_essence:
    identity: "Revenue operations platform team going through a leadership transition"
    throughline: "The CS function exists but needs to be rebuilt under new CCO vision"
    stage_reality: "New CCO hired to transform the post-sales motion. Existing CS team has operated without strong strategic leadership. This hire is the CCO's first major move."

  who_thrives_here:
    traits:
      - "Can earn trust from an existing team while changing how they work"
      - "Understands revenue operations deeply enough to speak the customer's language"
      - "Comfortable being the CCO's right hand while building independent authority"
      - "Data-driven but not dashboard-obsessed — can tell the story behind the numbers"
    anti_traits:
      - "Needs to build from absolute zero — there's an existing team and existing customers"
      - "Cannot work within someone else's strategic framework initially"
      - "Avoids executive communication — this role reports to CCO and presents to board"

  values_real_talk:
    lived:
      - "Revenue accountability is real — CS owns NRR"
      - "Cross-functional collaboration with Sales and Product is expected, not optional"
    aspirational_but_honest:
      - "New CCO is bringing a vision but it's unproven at LeanData — you're helping build it"
    anti_values:
      - "CS as cost center"
      - "Finger-pointing between Sales and CS"

  work_style_reality:
    communication: "Slack + Zoom, enterprise cadences"
    meetings: "Moderate — enterprise customers require regular business reviews"
    decision_speed: "Medium — enterprise processes, but new CCO wants to move faster"
    autonomy: "High within CCO's strategic framework"
    remote_reality: "Hybrid-friendly, HQ in Sunnyvale"

  energy_of_the_role:
    fills:
      - "Transforming a CS function from reactive support to strategic revenue partner"
      - "Building the executive story — proving CS impact on revenue"
      - "Developing an existing team's skills and confidence under new direction"
    drains:
      - "Political navigation during leadership transition — some people are loyal to old ways"
      - "Enterprise deal complexity — long cycles, many stakeholders"
      - "Existing customer relationships that predate your arrival"

  hiring_context:
    why_now: "New CCO (Dave Ginsburg) is rebuilding the post-sales org"
    who_failed: "Prior CS leadership left during/before the leadership change"
    compensation_range: [150000, 185000]
    timeline: "Within 60 days — CCO is building his team"
---
```

### 5.4 Scoring

#### C→R Score (How well does LeanData fit Eric?)

| Dimension | Score | Max | Rationale |
|-----------|-------|-----|-----------|
| Mission | 16 | 25 | Enterprise SaaS with real CS motion, but not healthcare. Revenue operations is adjacent to Eric's experience but not his primary draw. New CCO signals genuine investment in post-sales. Score held back by sector distance. |
| Role | 13 | 20 | Hybrid mandate — rebuilding under new leadership, not pure 0-to-1. Existing team of ~8 means managing people from day one, which is positive, but the "rebuilding someone else's vision" dynamic differs from Eric's preferred greenfield build. |
| Culture | 14 | 18 | Revenue accountability aligns strongly. Cross-functional expectation fits Eric's collaborative nature. But enterprise process cadence is slower than Eric's preferred startup pace. |
| Skill | 15 | 17 | Strong skill match — Eric's NRR accountability, team building, and CS leadership directly apply. Enterprise SaaS experience from Bigtincan translates. |
| Work Style | 8 | 12 | Moderate tension — Eric prefers async-first; enterprise CS requires significant synchronous customer-facing time. Hybrid/Sunnyvale HQ with remote acceptable reduces friction. Decision speed is medium, which may frustrate Eric's preference for decisive action. |
| Energy | 5 | 8 | Mixed — "developing an existing team's skills" fills Eric. But "political navigation during leadership transition" and "existing customer relationships that predate you" are explicitly listed as Eric's drains. |

**C→R Total: 71/100 + Domain Distance: 0 (General Enterprise SaaS) = 71**
**Classification: GOOD FIT**

#### R→C Score (How well does Eric fit LeanData's need?)

| Dimension | Score | Max | Rationale |
|-----------|-------|-----|-----------|
| Builder Orientation | 17 | 25 | Eric's builder instinct is strong (Bigtincan from scratch), but this role is hybrid/rebuilder, not pure builder. Eric's 0-to-1 preference may not map perfectly to "transform existing team under new CCO." His throughline of building scaffolding for others is highly relevant. Score deducted for potential mismatch between his builder preference and the role's rebuilder reality. |
| Relational Fit | 18 | 22 | Eric's "integration over performance" identity and his scaffolding metaphor align well with developing an existing team. His collaborative nature fits the cross-functional expectation. Tension: Eric's decision-holding pattern may conflict with a new CCO who wants to move fast. |
| Domain Fluency | 11 | 18 | Eric's domain is healthcare B2B SaaS and general enterprise, not revenue operations specifically. He understands enterprise CS motions deeply but would need to learn the RevOps/lead-routing domain. Not disqualifying but not a strength. |
| Values Alignment | 13 | 15 | Strong alignment on revenue accountability, treating CS as growth engine, transparency. Eric's "no metrics without meaning" value aligns with "tell the story behind the numbers." Minor tension on process discipline — Eric's startup orientation may need calibration for enterprise. |
| Work Style | 9 | 12 | Moderate fit. Eric can do synchronous enterprise work (Bigtincan proves this) but prefers async. His morning deep-work rhythm would need to accommodate customer meeting schedules. Autonomy within CCO framework is acceptable to Eric. |
| Energy Match | 5 | 8 | "Developing team skills" fills both sides. But the political dynamics of a leadership transition and inherited customer relationships are explicit drains for Eric. The first 90 days would be high-drain. |

**R→C Total: 73/100**
**Classification: GOOD FIT**

#### Mutual Fit Score

```
MF = (71 × 0.5) + (73 × 0.5) = 72
Classification: GOOD MUTUAL FIT
```

### 5.5 Match Report Output

```
MATCH REPORT
============

Candidate:      Eric Zelman
Role:           Head of Customer Success at LeanData
Generated:      March 21, 2026
Classification: GOOD MUTUAL FIT

Score Summary
─────────────
Candidate → Role:    71/100   (GOOD FIT)
Role → Candidate:    73/100   (GOOD FIT)
Mutual Fit:          72/100   (GOOD MUTUAL FIT)
```

**Narrative Briefing:**

This is a solid mutual fit with specific, nameable tensions that should be tested in conversation. The strongest alignment is around Eric's CS leadership depth and LeanData's genuine need for someone who treats post-sales as a revenue function, not a cost center. Eric's 18 years of building and leading CS teams, his direct NRR accountability, and his instinct for developing people all map cleanly to what LeanData's new CCO needs.

The primary tension is the builder-vs-rebuilder distinction. Eric's strongest energy comes from 0-to-1 builds; LeanData has an existing team of ~8 and existing customer relationships that predate any new hire. This isn't a dealbreaker — Eric's Bigtincan experience included inheriting and transforming an existing function — but it means the role's first 90 days will draw on his least-preferred mode (navigating politics, managing inherited relationships) before he can shift into his preferred mode (building systems, developing people). The question for Eric is whether the new CCO's mandate provides enough "greenfield within the existing" to satisfy his builder orientation.

Domain distance is neutral. LeanData's revenue operations platform isn't healthcare, which means Eric loses the sector energy bonus, but the enterprise CS motion is directly transferable.

**Strong Alignment Signals:**

1. **Revenue accountability match.** Eric's NRR ownership at Bigtincan → Role's "CS owns NRR" expectation. This is the highest-confidence signal. Both sides define CS as a revenue function.

2. **People development orientation.** Eric's "building scaffolding for others" throughline → Role's "developing existing team under new direction." Eric's energy explicitly fills from watching mentored people succeed; the role explicitly needs someone who can elevate an existing team.

3. **No-BS values alignment.** Eric's anti-value of "performance theater" → Role's anti-value of "CS as cost center." Eric's transparency default → Role's "disagreement in the open" aspiration. Values alignment is high-confidence.

**Tension Signals:**

1. **Builder vs. Rebuilder** (Resolvable — test in interview)
   - Eric: "role_type: builder, 0-to-1"
   - Role: "role_type: hybrid — existing team, new direction"
   - Interview question: "How much of the CS playbook, team structure, and process am I expected to keep vs. rebuild? What's sacred and what's mine to change?"

2. **Political navigation energy drain** (Monitor — may not be resolvable)
   - Eric: "Energy drain: political navigation without substance"
   - Role: "Drain: political navigation during leadership transition"
   - The role *knows* this is a drain. The question is duration — if the political phase lasts 90 days, Eric can manage it. If it's the permanent state, it's a dealbreaker.
   - Interview question: "When you say leadership transition — is this a 90-day adjustment or is there active resistance to the new direction?"

3. **Decision speed mismatch** (Minor — likely adaptable)
   - Eric: "Holds decisions until last responsible moment" + prefers decisive environments
   - Role: "Medium decision speed — enterprise processes, CCO wants faster"
   - Both sides want faster decisions; the tension is whether the enterprise infrastructure allows it.

**Confidence Gaps:**

- **Work style compatibility (confidence: 0.6):** The role lens is inferred, not generated from actual discovery. Real work-style signals from a conversation with Dave Ginsburg would significantly change this score in either direction.
- **Energy match (confidence: 0.55):** The drain signals are well-mapped but the fill signals need more depth. Would Eric find the "build the executive story" aspect energizing or political?

**Recommended Actions:**

GOOD MUTUAL FIT — Pursue with awareness. Leverage the warm paths (Niels, Matt Stager → Dave Ginsburg). In the conversation, lead with the revenue accountability alignment and people development instinct. Probe the builder-vs-rebuilder tension directly — ask how much of the existing CS function the new CCO considers worth keeping. Pay attention to how Ginsburg describes the political landscape; if he minimizes it, that's a yellow flag.

---

## 6. Feedback Loop Specification

### 6.1 Signal Types

The feedback loop operates on user actions that produce implicit and explicit signals. These signals adjust scoring weights, dimension cross-mapping confidence, and threshold calibration over time.

#### Explicit Signals (user provides directly)

| Signal | Type | What it adjusts |
|--------|------|-----------------|
| "Pursued" / "Skipped" | Binary | Reinforces or penalizes the overall score range that produced this recommendation |
| "Got interview" | Positive outcome | Boosts confidence in the alignment signals that were flagged as strong |
| "Rejected after interview" | Negative outcome | Reduces confidence in alignment signals; boosts tension signals |
| "Accepted offer" | Strongest positive | Full reinforcement of all dimension scores and weights |
| "Declined offer" | Complex signal | Candidate liked the match (they pursued it far) but something was wrong — probe which tension signal was the deciding factor |
| Match report rating (1-5) | Quality signal | Adjusts the LLM scoring prompt — "the user felt this report was too generous / too harsh / missed the key issue" |
| "This tension was the dealbreaker" | Specific tension tag | Increases the weight of that specific dimension in future scoring |
| "This alignment was what sold me" | Specific alignment tag | Increases the weight of that specific dimension in future scoring |

#### Implicit Signals (observed from behavior)

| Signal | Type | What it adjusts |
|--------|------|-----------------|
| Time spent on match report | Engagement | Higher engagement on MARGINAL matches suggests thresholds may be too conservative |
| Clicked through to company site | Interest | Mild positive signal — above threshold for attention |
| Opened briefing email | Baseline engagement | Used for retention metrics, not scoring adjustment |
| Ignored briefing for 3+ days | Disengagement | May indicate the Focal Length is too wide (too many results) |
| Changed Focal Length / Aperture settings | Preference signal | Direct indication that the user wants more/fewer results at more/less depth |
| Edited their lens document | Identity evolution | Triggers re-scoring of all active matches; tracked as "lens drift" over time |

### 6.2 Adjustment Mechanism

Feedback signals adjust the system at three levels:

**Level 1: Per-user weight calibration.** If a user consistently pursues matches where Culture scored highest and skips matches where Skill scored highest, the system gradually increases the Culture weight and decreases Skill weight *for that user*. This happens in the `scoring.dimensions` weights in their Candidate Lens YAML.

```
Adjustment formula:
  new_weight = current_weight + (learning_rate × signal_direction × signal_strength)
  
  learning_rate = 0.02 (slow — prevents overfitting to single decisions)
  signal_direction = +1 (pursued) or -1 (skipped)
  signal_strength = 1.0 (accepted offer) to 0.2 (opened email)
  
  Weights are renormalized to sum to 100 after each adjustment.
```

**Level 2: Per-user disqualifier refinement.** If a user consistently pursues matches that technically fail a soft disqualifier (e.g., company is 210 employees when the threshold is 200), the system suggests relaxing that gate. If a user consistently skips matches that pass all gates, the system suggests adding a new disqualifier based on the common characteristics of skipped matches.

**Level 3: Global model improvement.** Anonymized and aggregated across all users. If a specific signal pattern (e.g., "both sides say 'async-first' but the role's actual meeting load is >4 hours/day") consistently produces DECLINED OFFER outcomes, the system learns to weight that pattern as a tension signal rather than an alignment signal, improving scoring for all future users.

### 6.3 Feedback Collection Points

1. **At match delivery** — "Quick: is this one worth a look?" (thumbs up / thumbs down / save for later)
2. **After 48 hours** — if not interacted with, mark as implicit skip
3. **After outreach** — "Did you reach out? What happened?" (pursued / skipped / monitoring)
4. **After interview** — "How did it go?" (advancing / rejected / withdrew)
5. **After outcome** — "Final result?" (accepted / declined / ghosted / no response)
6. **Monthly reflection** — "Looking back at this month's matches, which 3 felt most like 'you' and which 3 felt least like 'you'?" (recalibrates the lens itself, not just the scoring)

### 6.4 Lens Drift Detection

Over time, a user's actions may diverge from what their lens document says they want. This is natural — people's priorities evolve, especially during a job search. The system tracks "lens drift" as the gap between stated signals and revealed preferences.

When drift exceeds a threshold (e.g., the user has pursued 5+ matches that score low on their stated top dimension), the system prompts a lens refresh:

> "Your recent activity suggests your priorities may be shifting. Over the past month, you've pursued opportunities that scored highest on Culture and Energy, but your lens weights Mission and Role most heavily. Would you like to update your lens to reflect where you are now?"

This is the "append, don't overwrite" principle in action — the system doesn't silently change the lens. It surfaces the drift and lets the user decide whether to update or whether they were just exploring.

---

## 7. What This Specification Establishes

This document, combined with the IP Summary dated March 21, 2026, establishes:

1. **The Role Lens** as a structured company-side document with 8 discovery sections, YAML frontmatter schema, and signal extraction methodology that mirrors the Candidate Lens architecture.

2. **The Matching Algorithm** as an asymmetric, bidirectional scoring method that produces two independent scores plus a mutual fit composite, using dimension cross-mapping between opposing lens documents, with hard-gate logic evaluated in code before LLM scoring runs.

3. **The Match Report** as a structured output format that provides narrative reasoning, signal-level alignment and tension analysis, confidence gaps, and recommended actions — differentiated from ATS pass/fail screening by its signal-based explanatory reasoning.

4. **The Feedback Loop** as a three-level learning system (per-user weight calibration, per-user disqualifier refinement, global model improvement) with explicit and implicit signal collection, lens drift detection, and the "append, don't overwrite" design principle.

All of the above are the original intellectual property of Eric Zelman, conceived and documented between November 2025 and March 2026.

---

*Document version 1.0 — March 21, 2026*
*Eric Zelman — Providence, RI*
*CONFIDENTIAL — Subject to Mutual NDA*
