# Lens Document Architecture: The Split

*Product spec addition. March 20, 2026.*

---

## The Problem

The current agent lens (v2.15) is a single 39KB file serving three audiences simultaneously:

1. **n8n pipeline** reads the YAML frontmatter for machine-readable gates, penalties, bonuses, thresholds
2. **Eric** reads the prose sections for manual evaluation reference
3. **LLM scoring engine** receives the entire document as context, wasting tokens on identity content irrelevant to scoring

This creates redundancies (employee thresholds stated in 5 places), conflicts (YAML says -5 for title penalty, body says -10), and context bloat (the Pathway Statement and Investor Type lookup table both go to the scorer, but only one is useful).

## The Split

Two files, two consumers:

### `lens.md` — Identity + Preferences

**What it is:** The portable, personal document. What the intake form produces. What you'd share with a recruiter or coach.

**Contains:**
- YAML frontmatter: name, status, target roles, compensation, location, disqualifiers, sector preferences
- Essence and pathway (the "who")
- Values with behavioral evidence
- Professional identity and career arc
- Work style and energy signals
- Sector and mission preferences
- Hard disqualifiers (what you'd never consider)

**Who produces it:** The intake form's discovery flow (AI-guided or coach-persona-guided).

**Who consumes it:** The scoring engine (as Tier 2 context), the user (as self-knowledge), recruiters/coaches (as candidate context).

**Size target:** ~15KB. Fits comfortably in LLM context alongside opportunity data.

**Ravi would have one.** So would any product user. The structure is the same; the content is unique.

### `scoring-config.yaml` — Pipeline Machinery

**What it is:** The operational configuration that turns lens preferences into reliable scores. Infrastructure, not identity.

**Contains:**
- Point values for bonuses and penalties (Builder language +40, Series A +50, etc.)
- Scoring thresholds (STRONG FIT 80+, GOOD FIT 60-79, etc.)
- Data validation flags (impossible combinations like Seed + $20M funding)
- Business model gate logic and examples
- Customer persona gate classification rules
- Investor type lookup table (VC vs PE vs Growth Equity)
- Pre-CS inflection logic
- Stalled company detection rules
- Enrichment-specific caps and adjustments

**Who produces it:** The platform team. Calibrated from aggregate feedback loops across all users.

**Who consumes it:** The scoring engine (as Tier 1 context), the n8n pipeline (parsed as config).

**What's user-specific vs shared:**
- **Shared across all users:** Point values, threshold bands, data validation, investor lookup, business model gate examples
- **Assembled per-user from their lens:** Disqualifier list, sector bonuses, role type preferences, penalties specific to their context

**The assembly step:** When the pipeline scores an opportunity for a user, it reads their `lens.md` YAML for preferences and merges it with the shared `scoring-config.yaml` to produce the complete prompt. The engine doesn't care whether the lens was hand-built by Eric or generated through a 30-minute AI coaching session; it consumes the same YAML structure.

## How the JSX Scorer Changes

Currently: fetches the full agent lens from GitHub, dumps everything into the system prompt.

After the split:
- **Tier 1** = universal engine instructions + `scoring-config.yaml` (hardcoded or fetched once)
- **Tier 2** = user's `lens.md` (fetched from GitHub or pasted)
- **Tier 3** = output schema (hardcoded)

The scorer becomes genuinely user-agnostic. Eric's URL produces Eric's scores. Ravi's URL produces Ravi's scores. Same engine, same config, different lens.

## What Doesn't Change

- The lens document format (markdown + YAML frontmatter)
- The scoring dimensions (Company Stage 50, Role Type 30, Mission 20)
- The bonus/penalty architecture
- The threshold bands
- The n8n pipeline structure

## Schema Note: 3-Dimension vs 6-Dimension Models

Eric's personal pipeline uses a 3-dimension weight model (Company Stage 50, Role Type 30, Mission 20) that was calibrated through months of daily scoring before the product schema was formalized. This is a **user-specific weight implementation** — a collapsed version of the 6-dimension model where Culture, Work Style, and Energy are evaluated qualitatively within the LLM prompt rather than scored as independent weighted dimensions.

The **product standard is 6 dimensions** (Mission, Role Fit, Culture, Skill, Work Style, Energy summing to 100). This is what the candidate lens schema, role lens schema, bidirectional system spec, and LENS-SPEC all define. New users, coach personas, and the intake form all produce 6-dimension lenses.

Eric's 3-dimension config will be migrated to the 6-dimension model when his personal pipeline is refactored to use the product scoring engine. Until then, both models coexist — Eric's as a working implementation, the 6-dimension model as the product specification.

## Migration Path

1. Extract `scoring-config.yaml` from the current lens (the YAML penalties, bonuses, thresholds, data validation, customer persona gate)
2. Strip those sections from the lens, leaving identity + preferences + user-specific disqualifiers
3. Update n8n to read config from a separate file (or inline in the workflow)
4. Update the JSX scorer to load config separately from the lens
5. Update the intake form's output format to match the leaner lens structure
