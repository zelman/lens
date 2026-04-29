# The Lens Document Specification

> **Version:** 0.1 (Draft)
> **Status:** Working spec — codifying what exists in practice, identifying gaps
> **Patent Status:** Patent Pending — U.S. Application #64/015,187 (filed March 24, 2026)
> **Location:** `lens/schemas/LENS-SPEC.md`
> **Last updated:** March 2026

---

## What This Document Is

This is the technical specification for the Lens Document — a structured, machine-readable file that encodes a person's professional identity, values, and decision criteria in a format that automated scoring systems can consume.

A Lens document is not a profile, not a resume, and not a preferences file. It is a **scoring contract** — a protocol that governs how an automated pipeline evaluates opportunities on someone's behalf.

This spec defines three layers of intellectual property:

1. **Schema** — what fields exist, what types they take, how they relate
2. **Extraction Methodology** — how signals are drawn out of a person and into those fields
3. **Scoring Protocol** — how a pipeline consumes the document and produces decisions

---

## Part 1: Schema Specification

### File Format

A Lens document is a Markdown file (`.md`) with YAML frontmatter. This format is:

- Human-readable (opens in any text editor)
- Machine-parseable (standard YAML libraries in any language)
- Version-controllable (Git tracks every change)
- Portable (no vendor lock-in, no database dependency)
- Appendable (the markdown body grows over time; frontmatter is the contract)

### Document Structure

```
---
# YAML frontmatter: the machine-readable scoring contract
[schema fields]
---

# Markdown body: the human-readable narrative
[identity narrative, coaching notes, context]
```

The frontmatter is what the scoring engine reads. The body is what gives the frontmatter meaning — it's the evidence, the reasoning, the story behind the signals. A Lens without a body is a config file. A Lens without frontmatter is a journal entry. Both are required.

### Schema Fields

#### Meta

| Field | Type | Required | Description |
|---|---|---|---|
| `version` | string | yes | Schema version (semver) |
| `created` | date | yes | Initial creation date |
| `updated` | date | yes | Last modification date |
| `channel` | string | yes | How this Lens was produced: `self-serve`, `coach:[persona-id]`, `hybrid` |
| `coach_persona` | string | no | If coach-facilitated, which persona (e.g., `james-pratt-v1`) |
| `status` | enum | yes | `draft`, `active`, `archived` |

#### Identity

These fields capture who the person is — not what they want, but what's true about them. This is the layer most people can't self-report accurately, and where coach-facilitated extraction produces the highest signal quality.

| Field | Type | Required | Description |
|---|---|---|---|
| `essence` | string | yes | Core throughline — the pattern that persists across all contexts. Not an elevator pitch. A sentence that someone who knows you well would recognize as true. |
| `throughline` | string | yes | The connecting thread between what you do personally and professionally. What makes you the same person in both contexts. |
| `orientation` | enum | yes | `builder`, `maintainer`, `optimizer`, `rescuer`. Primary mode of engagement. |
| `orientation_signals` | object | yes | Evidence for orientation classification. `positive: string[]`, `negative: string[]` — terms that indicate fit vs. misfit for this orientation. |

#### Scoring Dimensions

The lens defines weighted dimensions that the scoring engine evaluates independently. Weights must sum to 100.

| Field | Type | Required | Description |
|---|---|---|---|
| `dimensions` | object[] | yes | Array of scoring dimensions, each with fields below |
| `dimensions[].id` | string | yes | Machine-readable key (e.g., `mission_alignment`) |
| `dimensions[].label` | string | yes | Human-readable name |
| `dimensions[].weight` | integer | yes | Points allocated (all weights sum to 100) |
| `dimensions[].signals` | string[] | yes | What the scorer looks for — specific, observable indicators |
| `dimensions[].anti_signals` | string[] | no | What counts against this dimension |

**Default dimensions** (a starting lens should include at least these; coaches may add or restructure):

```yaml
dimensions:
  - id: mission_alignment
    label: Mission & Sector
    weight: 25
    signals: []
    anti_signals: []
  - id: role_fit
    label: Role Mandate
    weight: 20
    signals: []
    anti_signals: []
  - id: culture_match
    label: Culture & Values
    weight: 18
    signals: []
    anti_signals: []
  - id: skill_leverage
    label: Skill Leverage
    weight: 17
    signals: []
    anti_signals: []
  - id: work_style
    label: Work Style
    weight: 12
    signals: []
    anti_signals: []
  - id: energy
    label: Energy & Sustainability
    weight: 8
    signals: []
    anti_signals: []
```

#### Disqualifiers

This is the most underappreciated layer. Most matching systems are purely additive. The lens treats exclusion as a first-class operation.

| Field | Type | Required | Description |
|---|---|---|---|
| `disqualifiers` | object[] | yes | Array of hard-no conditions |
| `disqualifiers[].rule` | string | yes | Machine-readable condition (e.g., `employees > 200`) |
| `disqualifiers[].label` | string | yes | Human-readable description |
| `disqualifiers[].rationale` | string | no | Why this is a hard no — the story behind the rule |

When any disqualifier matches, scoring stops immediately. The opportunity is classified as `PASS` with score 0. No partial credit, no "but the mission is great." This mirrors how humans actually make decisions — certain conditions are binary, not weighted.

#### Domain Distance

A signed modifier that adjusts the raw score based on sector proximity to the person's ideal domain.

| Field | Type | Required | Description |
|---|---|---|---|
| `domain_distance` | object[] | yes | Array of domain modifiers |
| `domain_distance[].domain` | string | yes | Sector or domain label |
| `domain_distance[].modifier` | integer | yes | Signed integer added to raw score. Positive = closer to ideal, negative = further. |

```yaml
domain_distance:
  - domain: "Healthcare B2B SaaS"
    modifier: +5
  - domain: "Clinical Operations"
    modifier: +5
  - domain: "Developer Tools"
    modifier: +2
  - domain: "General Enterprise SaaS"
    modifier: 0
  - domain: "IT Operations/ITSM"
    modifier: -8
```

#### Thresholds

| Field | Type | Required | Description |
|---|---|---|---|
| `thresholds` | object | yes | Classification boundaries |
| `thresholds.apply` | integer | yes | Minimum adjusted score to classify as APPLY |
| `thresholds.watch` | integer | yes | Minimum adjusted score to classify as WATCH |

Everything below `watch` is `PASS`. These thresholds are personal — a risk-tolerant person in an urgent search might set `apply: 50`. Someone employed and selective might set `apply: 75`.

#### Constraints

Practical parameters that filter before scoring even begins.

| Field | Type | Required | Description |
|---|---|---|---|
| `constraints` | object | yes | Hard filters |
| `constraints.compensation_floor` | integer | no | Minimum acceptable compensation |
| `constraints.location` | string[] | no | Acceptable locations/remote |
| `constraints.company_stage` | string[] | no | Acceptable funding stages |
| `constraints.team_size_range` | string | no | e.g., `20-100` |

#### Temporal

| Field | Type | Required | Description |
|---|---|---|---|
| `search_status` | enum | yes | `employed`, `active`, `transition` |
| `urgency` | enum | yes | `passive`, `moderate`, `urgent` |
| `runway` | string | no | How long they can sustain current state |

---

## Part 2: Extraction Methodology

### The Core Problem

If you ask someone "what do you want in a job?" you get keywords. Keywords are what matching systems already use. The lens needs signals — and signals require extraction, not collection.

The difference:

| Collection (what exists) | Extraction (what we do) |
|---|---|
| "I want a mission-driven company" | Mission-driven means specifically healthcare or education, not "we make the world better" in a pitch deck |
| "I'm a good leader" | You build scaffolding for others — you create conditions for people to succeed rather than directing them |
| "I don't want a big company" | >200 employees is a hard no because past that size, the work becomes maintenance not building |
| "Culture matters to me" | You need space for questioning and dissent — organizations that treat pushback as disloyalty are depleting |

Collection gives you what someone thinks they want. Extraction gives you what would actually work.

### Extraction Channels

#### Channel 1: Self-Serve (Form-Driven)

The intake form (`lens-form.jsx`) walks someone through 8 discovery sections with AI-guided conversation. Each section has:

- `systemContext` — coaching instructions that tell the AI *how* to probe, not just what to ask
- `workflowHint` — what signals to extract from the responses
- `scoreDimension` — which schema field this section feeds

**Discovery Sections → Schema Mapping:**

| Section | Extracts Into | Signal Quality |
|---|---|---|
| 1. Essence | `identity.essence`, `identity.throughline` | Medium — people can approximate but often produce aspirational rather than descriptive statements |
| 2. Skills & Experience | `dimensions[skill_leverage].signals`, `identity.orientation` | High — concrete and verifiable |
| 3. Values | `dimensions[culture_match].signals` | Low-Medium — people report "poster values" not behavioral values without probing |
| 4. Mission & Sector | `dimensions[mission_alignment].signals`, `domain_distance` | Medium — people know sectors but not *why* those sectors |
| 5. Work Style | `dimensions[work_style].signals`, `constraints` | Medium-High — observable patterns are easier to self-report |
| 6. What Fills You | `dimensions[energy].signals` | Low — most people haven't done this work; this is where coaching adds the most |
| 7. Disqualifiers | `disqualifiers` | High — people know their hard no's |
| 8. Situation & Timeline | `temporal`, `thresholds` | High — factual and current |

**Self-serve signal quality ceiling:** ~60-70% of what a coach-facilitated session produces. The gap is in sections 1, 3, and 6 — identity, values, and energy — where people lack the vocabulary or self-awareness to articulate accurately.

#### Channel 2: Coach-Facilitated

A human coach (or an AI coach persona trained on a specific methodology) conducts the discovery. The coach's job is to:

1. **Surface patterns the person can't see.** "You keep describing yourself as someone who builds things for others. Let's name that."
2. **Distinguish behavioral values from aspirational values.** "You say you value collaboration, but every story you've told is about working independently and then sharing. What does that tell us?"
3. **Find the throughline.** "The way you describe curating music and the way you describe building a support team — those are the same instinct. What would you call it?"
4. **Operationalize vague preferences into scoring signals.** "When you say 'mission-driven,' what would you see on a company's website that would make you believe it? What would make you not believe it?"
5. **Extract disqualifiers from emotional responses.** "You got tense when I mentioned PE-backed companies. What happened there?" → `disqualifiers[]: { rule: "funding_type = PE", label: "PE-backed company", rationale: "..." }`

**Coach-facilitated signal quality ceiling:** ~90-95%. The remaining gap is filled by the feedback loop (Part 3).

#### Channel 3: Hybrid (Coach + Form)

The highest-quality path. Coach conducts initial discovery, form captures structured data, coach reviews the generated lens and refines. This is the premium offering.

### The Extraction Differentiation

What makes this methodology IP rather than "just asking good questions":

1. **The questions feed a schema.** Every probe has a target field. The coach isn't exploring — they're extracting structured data through unstructured conversation. The schema defines what "complete" looks like.

2. **Signal quality is measurable.** Each section has an expected signal quality by channel. You can compare a self-serve lens to a coach-facilitated lens and quantify the difference — not in subjective quality, but in the specificity and operationalizability of the signals produced.

3. **The methodology is separable from the person.** James Pratt's methodology (Be-Have-Do, Essence Statement, IAM Model) produces different signals than a career coach using StrengthsFinder. Both are valid. The schema is the constant; the extraction methodology is the variable. This is what makes coach personas a platform feature, not a single implementation.

4. **Resume is context, not definition.** The form accepts a resume upload, but it feeds the conversation as background — "I see you were at Bigtincan for 3 years. What did you build there that you'd want to build again?" The resume is never the source of identity signals. This is a philosophical choice with structural implications.

5. **Behavioral evidence over self-report.** The methodology probes for stories and patterns, not preferences. "Tell me about a time you were energized at work" extracts different data than "what kind of work energizes you?" The first gives you signals; the second gives you keywords.

### Discovery Section → Output Field Mapping

Discovery sections are not 1:1 with output sections. Each discovery conversation extracts signals that populate multiple schema fields. The mapping below shows where signals from each discovery section land in the Lens document.

| Discovery Section (guardrails.yaml) | Primary Output Fields | Secondary Output Fields |
|---|---|---|
| Professional Identity | `identity.essence`, `identity.throughline`, `identity.orientation` | `dimensions[role_fit].signals` |
| Work Environment | `dimensions[work_style].signals`, `dimensions[energy].signals` | `disqualifiers` (environment-based) |
| Values & Motivation | `dimensions[culture_match].signals`, `dimensions[culture_match].anti_signals` | `dimensions[energy].signals` |
| Leadership & Collaboration | `dimensions[role_fit].signals`, `dimensions[culture_match].signals` | `identity.orientation_signals` |
| Skills & Craft | `dimensions[skill_leverage].signals`, `dimensions[skill_leverage].anti_signals` | `identity.orientation` (builder vs maintainer evidence) |
| Growth & Aspiration | `dimensions[role_fit].signals`, `dimensions[mission_alignment].signals` | `identity.throughline` (refinement) |
| Domain & Sector | `dimensions[mission_alignment].signals`, `domain_distance[]` | `disqualifiers` (sector-based) |
| Integration & Synthesis | All fields (validation pass) | User corrections feed back as highest-confidence signals |

**Key design implication:** The discovery flow is organized around the *human conversation* (what's natural to talk about in sequence). The output schema is organized around the *scoring engine* (what needs to be machine-readable). The mapping layer between them is where coach persona quality matters most — a good persona extracts the right signals from a natural conversation and routes them to the right schema fields.

**"Disqualifiers" and "Situation & Timeline"** appear in the output schema but have no dedicated discovery section. Disqualifiers emerge organically from anti-signals across all sections (especially Values, Work Environment, and Domain). Situation and timeline are captured in the intake form's status selection and context upload phases, before discovery begins.

---

## Part 3: Scoring Protocol

### How the Pipeline Consumes a Lens

The scoring engine receives two inputs: a Lens document and an opportunity (job listing, company profile, or both). It produces a structured decision.

#### Step 1: Constraint Filtering

Before scoring begins, check hard constraints. If the opportunity doesn't meet `constraints.compensation_floor`, `constraints.location`, `constraints.company_stage`, or `constraints.team_size_range`, it is excluded. No score is generated.

This is a pre-filter, not a disqualifier. Constraints are practical ("I need $125K minimum"). Disqualifiers are identity-based ("PE-backed companies are fundamentally misaligned with how I want to work").

#### Step 2: Disqualifier Check

Evaluate each `disqualifier[].rule` against the opportunity data. If any match:
- Score = 0
- Classification = `PASS`
- `disqualified = true`
- `disqualify_reason` = the matching rule's label
- Stop. Do not score dimensions.

This is the most important architectural decision in the protocol. Disqualifiers are not "heavy negative weights." They are circuit breakers. This reflects how humans actually make career decisions — certain conditions are binary. No amount of mission alignment compensates for a PE-backed company if that's your hard no.

#### Step 3: Orientation Check

Evaluate `identity.orientation` and `identity.orientation_signals` against the opportunity. If the opportunity's signals are predominantly in the `negative` list (e.g., "established processes" and "proven playbook" for a `builder`), it is classified as an orientation mismatch.

This isn't a disqualifier (some roles blend), but it applies a significant scoring penalty and surfaces in the briefing as a red flag.

#### Step 4: Dimension Scoring

For each `dimension` in the Lens:
1. Evaluate the opportunity against the dimension's `signals` and `anti_signals`
2. Produce a score from 0 to the dimension's `weight` (max points)
3. Include a rationale explaining the score

Sum all dimension scores to produce the **raw score** (0-100).

Scoring is not keyword matching. The engine evaluates whether the opportunity *evidences* the signals, not whether it *contains* the words. "We're building our CS function from the ground up" evidences the builder signal "greenfield" even though the word doesn't appear.

#### Step 5: Domain Distance

Look up the opportunity's sector/domain in `domain_distance[]`. Apply the signed modifier to the raw score.

`adjusted_score = raw_score + domain_distance_modifier`

#### Step 6: Classification

Compare `adjusted_score` to `thresholds`:

| Adjusted Score | Classification | Action |
|---|---|---|
| ≥ `thresholds.apply` | `APPLY` | Worth pursuing — surface to user with full briefing |
| ≥ `thresholds.watch` | `WATCH` | Monitor for changes — company might become a fit |
| < `thresholds.watch` | `PASS` | Not a fit — log but don't surface |

#### Step 7: Briefing Output

The scoring engine produces a structured output:

```json
{
  "disqualified": false,
  "disqualify_reason": null,
  "classification": "APPLY",
  "total_score": 72,
  "domain_distance": 5,
  "adjusted_score": 77,
  "orientation": "Builder",
  "orientation_signals": {
    "positive": ["first hire", "greenfield"],
    "negative": []
  },
  "dimensions": {
    "mission_alignment": { "score": 20, "max": 25, "rationale": "..." },
    "role_fit": { "score": 16, "max": 20, "rationale": "..." },
    "culture_match": { "score": 14, "max": 18, "rationale": "..." },
    "skill_leverage": { "score": 12, "max": 17, "rationale": "..." },
    "work_style": { "score": 6, "max": 12, "rationale": "..." },
    "energy": { "score": 4, "max": 8, "rationale": "..." }
  },
  "domain": "Healthcare B2B SaaS",
  "briefing": "Narrative summary — why this is or isn't a fit",
  "red_flags": [],
  "strengths": []
}
```

This is a **briefing, not a job alert.** The output explains *why* — it doesn't just rank.

### The Feedback Loop

The scoring protocol is not static. User decisions refine it over time.

#### Signal Refinement

When a user marks an `APPLY` opportunity as "not interested" or marks a `WATCH` as "actually, pursue this":

1. Record the delta between the system's classification and the user's decision
2. Identify which dimensions were over- or under-weighted
3. Surface the pattern to the user: "You've declined 3 APPLY-classified opportunities that scored high on mission but low on work style. Should we increase work_style weight?"
4. With user approval, adjust dimension weights

This is not automatic reweighting. The lens is the user's document. Changes require explicit consent. But the system surfaces the data that makes intelligent adjustments possible.

#### Disqualifier Discovery

If a user consistently declines opportunities with a common characteristic (e.g., always passes on companies with >150 employees even though the disqualifier is set at 200), the system can suggest a new or tightened disqualifier.

#### Threshold Calibration

If a user is ignoring `WATCH` items entirely, the system can suggest raising the `watch` threshold to reduce noise. If they're pursuing `WATCH` items frequently, it can suggest lowering `apply`.

### The Bidirectional Extension

The same protocol works in reverse. A "Role Lens" encodes what a company is looking for — not keywords and years of experience, but orientation, culture signals, values alignment, and working style.

When a Candidate Lens and a Role Lens are scored against each other, you get a **mutual fit score** — not "does this person have the right keywords" but "would these two actually work well together?"

This is the enterprise hiring use case. It differentiates from DISC, 360 feedback, StrengthsFinder, and ATS keyword matching because it produces an operational decision (score + classification), not a personality report.

---

## What Makes This a Standard, Not Just a File

| A text dump... | A Lens document... |
|---|---|
| Has no required fields | Has a schema that scoring engines validate against |
| Can't be consumed programmatically | YAML frontmatter parses into structured data in any language |
| Is static | Has a version, a status, and a temporal layer that evolves |
| Treats everything as a preference | Distinguishes constraints, disqualifiers, weighted signals, and domain modifiers as separate operations |
| Can only be read by humans | Governs an automated pipeline that makes daily decisions |
| Has no quality metric | Has measurable signal quality by extraction channel |
| Is the same regardless of who made it | Records its provenance — which coach persona, which methodology, which version |
| Produces no output | Produces classified, scored briefings with rationale |

The Lens document is portable (markdown), human-readable, machine-consumable, version-controlled, methodology-agnostic, and decision-producing. That combination is the IP.

---

## Open Questions

- **Schema versioning:** How do we handle backward compatibility when the schema evolves? Lens documents in the wild need to keep working.
- **Signal quality scoring:** Can we formalize the quality gap between self-serve and coach-facilitated? E.g., a `signal_confidence` field per dimension?
- **Multi-domain lenses:** Some people are open to genuinely different career paths. Does the schema support multiple orientation profiles?
- **Role Lens schema:** How much of this spec transfers directly to the enterprise/bidirectional use case? What fields change?
- **Minimum viable Lens:** What's the smallest valid Lens document that a scoring engine can meaningfully consume? This defines the self-serve floor.
- **Coach persona certification:** What makes a coach persona "good enough" to produce Lens documents? Is there a quality bar for the extraction methodology?

---

*This spec codifies what Eric's personal system already does. The IP is in making it a generalizable, portable, methodology-agnostic standard that any scoring pipeline can consume and any extraction methodology can target.*
