# R→C Steps 2-4: Candidate Discovery Configuration — Claude Code Brief v1.2

> **Updated:** April 22, 2026
> **Depends on:** RecruiterRoleForm.jsx (Step 1), /api/extract-dimensions (Step 2), /api/generate-session (Step 3)
> **Consumes:** `session-config` from sessionStorage (written by Step 3)
> **Produces:** A candidate lens document shaped by the role context
> **Status:** COMPLETE
> **Decision Record:** Kanban card recP3JqyWV1bwR9K7

---

## CHANGELOG FROM v1.1

### v1.2 Changes (April 2026)

1. **Values joins foundation (6 subsections)**: The foundation layer now includes Values as the 6th subsection:
   - Essence — identity patterns, throughline across career contexts
   - Work Style — how they operate day-to-day
   - Energy — energy sources and drains
   - Disqualifiers — hard no's, dealbreakers
   - Situation — urgency, constraints, timeline
   - **Values** — lived values, not stated values; what they've sacrificed for and what they refuse to do

2. **Default foundation duration 8 → 10 min**: To accommodate the added Values subsection.

3. **valuesWarning removed**: No longer needed since Values is now guaranteed in foundation.

4. **Synthesis contract alignment**: This change aligns the discovery flow with the synthesis contract, which already expected a `values` section in foundationIds (`rc-synthesis.js:187`).

### Why Values moved back into foundation

The v1.1 refactor cut foundation from 6 to 5 subsections without updating the synthesis contract. The bidirectional matching spec (`specs/bidirectional-lens-system-v1.0.md`) weights Values Alignment at 15 (top half of 6 dimensions in R→C scoring). Without a guaranteed Values section in foundation, the synthesis was expected to infer Values content from other sections — producing thin signal on a weight-15 dimension.

This is a contract-alignment fix, not a product pivot.

---

## CHANGELOG FROM v1.0

### v1.1 Changes (April 2026)

1. **Duration as primary input**: Recruiters now set explicit durations (minutes) per dimension, replacing the importance-cycle badge. Importance is derived from duration:
   - 4 min → moderate
   - 5-6 min → high
   - 7+ min → critical

2. **Universal 4-minute floor**: All sections (foundation and tailored dimensions) have a minimum of 4 minutes. No hard ceiling.

3. **Foundation card in UI**: A fixed Foundation card appears at the top of DimensionReviewPhase with its own duration stepper (default 10 min, floor 4 min). No add/remove/reorder controls for foundation.

4. **Overlap detection and merge affordance**: Extract-dimensions now flags when tailored dimensions overlap with foundation subsections. The UI shows overlap warnings, and the session generator merges overlapping sections (explores deeper instead of duplicating).

5. **Live session total**: The footer shows "Estimated session: N min" with live updates. Total > 25 min shifts text to orange (#E8590C) as a soft warning.

---

## UPDATED SESSION CONFIG SCHEMA (v1.2)

The `/api/generate-session` endpoint now produces:

```json
{
  "sessionId": "ses_clarion_vp_cs_20260422",
  "metadata": {
    "roleTitle": "VP Customer Success",
    "company": "Clarion Health",
    "estimatedDuration": "23 minutes",
    "candidatePreloaded": false,
    "generatedAt": "2026-04-22T10:30:00Z"
  },
  "foundation": {
    "durationMin": 10,
    "subsections": ["essence", "workstyle", "energy", "disqualifiers", "situation", "values"],
    "sections": [
      {
        "sectionId": "essence",
        "label": "Professional Essence",
        "timeAllocation": "2 min",
        "merged_with_dimension": null,
        "instruction": "...",
        "extractionTarget": "..."
      }
    ]
  },
  "tailored": [
    {
      "dimensionId": "healthcare_domain_expertise",
      "label": "Healthcare Domain Expertise",
      "importance": "critical",
      "durationMin": 7,
      "openingQuestions": ["...", "..."],
      "followUpGuidance": { ... },
      "extractionSchema": { ... }
    }
  ],
  "primerProbes": [ ... ],
  "conversationConfig": { ... }
}
```

### Key Schema Changes

| Field | v1.1 | v1.2 |
|-------|------|------|
| `foundation.durationMin` | Default 8 | Default 10 |
| `foundation.subsections` | 5 elements | 6 elements (+ values) |
| `valuesWarning` | Present in extract-dimensions output | Removed |

---

## DIMENSION EXTRACTION (Step 2 Updates)

### Output Schema

```json
{
  "roleContext": { ... },
  "dimensions": [
    {
      "id": "healthcare_domain_expertise",
      "label": "Healthcare Domain Expertise",
      "importance": "critical",
      "durationMin": 7,
      "sources": ["JD", "Stakeholder notes"],
      "whatToExplore": "...",
      "signals": ["..."],
      "redFlags": ["..."]
    }
  ],
  "foundationOverlaps": {
    "essence": null,
    "workstyle": "operational_cadence",
    "energy": null,
    "disqualifiers": "travel_constraints",
    "situation": null,
    "values": null
  },
  "contextQuality": "rich|adequate|thin",
  "contextWarning": null
}
```

### Foundation Overlap Detection

When extract-dimensions identifies that a tailored dimension covers similar ground to a foundation subsection, it maps them in `foundationOverlaps`. For example:

- A "Work Environment Fit" dimension might overlap with `workstyle`
- A "Travel Flexibility" dimension might overlap with `disqualifiers`
- A "Timeline Alignment" dimension might overlap with `situation`
- A "Culture Fit" dimension might overlap with `values`

The generate-session step then merges these: instead of running foundation-values AND tailored-culture-fit separately, they're combined into a single deeper exploration.

---

## UI CHANGES (DimensionReviewPhase)

### Duration Stepper Component

Each dimension card now displays:
1. **Duration stepper** (−/+) with 1-minute increments
2. **Numeric display** in Consolas/monospace font
3. **Derived importance label** (read-only, updates automatically)

```
[ − ]  5  [ + ] min   HIGH
```

Design constraints:
- 4-minute floor for all sections
- No hard ceiling (soft warning at total > 25 min)
- Swiss Style: hairline borders, zero border-radius, Calibri for text, Consolas for numbers

### Foundation Card

Fixed card at top of dimension list:
- Title: "FOUNDATION" (uppercase, bold)
- Description: "Runs for every candidate regardless of role. Covers: Essence, Work Style, Energy, Disqualifiers, Situation, Values."
- Duration stepper: default 10 min, floor 4 min
- No add/remove/reorder controls (foundation is fixed)

### Footer Summary

```
"Estimated session: N min"
```

Live total updates on every stepper change. Text shifts to #E8590C (orange) when total > 25 min.

---

## ENGINE-SIDE ENFORCEMENT (IMPLEMENTED)

Duration budgets are enforced server-side via question count (not wall-clock time). This approach is chosen because:
- Serverless routes are stateless across turns
- Wall-clock reconstruction adds complexity and surface area
- Question count aligns with how synthesis chunks the conversation
- More predictable UX (N questions vs "about X minutes")

### Shared Timing Module

`lib/session-timing/index.js` exports:

| Export | Purpose |
|--------|---------|
| `QUESTIONS_PER_MINUTE` | Conversion constant: `1.5` |
| `MIN_QUESTIONS_PER_SECTION` | Floor: `2` questions minimum |
| `sectionBudgetFromConfig(section)` | Returns `{ maxQuestions, durationMinHint }` |
| `questionsFromDuration(durationMin)` | Utility: `ceil(durationMin * 1.5)`, floor 2 |
| `isSectionBudgetExhausted(sectionState)` | Returns `true` if at limit |
| `getBudgetStatus(sectionState)` | Returns `{ exhausted, remaining, atLimit, nearLimit }` |
| `buildTransitionSignal({ fromSection, toSection, reason })` | Builds transition payload |

### Budget Calculation

```
maxQuestions = max(ceil(durationMin × 1.5), 2)

Examples:
- durationMin: 2 → maxQuestions: 3
- durationMin: 4 → maxQuestions: 6
- durationMin: 5 → maxQuestions: 8
- durationMin: 7 → maxQuestions: 11
```

### API Response Payload

Every `/api/rc-discover` response now includes:

```json
{
  "response": "...",
  "sectionComplete": false,
  "budgetStatus": {
    "questionsAsked": 3,
    "maxQuestions": 6,
    "remaining": 3,
    "exhausted": false
  }
}
```

When a section completes (AI marker or budget exhaustion):

```json
{
  "response": "...",
  "sectionComplete": true,
  "budgetStatus": { ... },
  "transition": {
    "from": "essence",
    "to": "section_1",
    "reason": "budget_exhausted|section_complete",
    "timestamp": "2026-04-22T10:30:00Z",
    "isSessionComplete": false
  }
}
```

### Test Fixture

`test-configs/short-budget.json` provides a minimal session (6 foundation subsections + 1 tailored) for verifying budget enforcement triggers transitions at correct question counts.

---

## DESIGN CONSTRAINTS

- **Swiss Style**: white bg (#FFFFFF), #1A1A1A text, #D93025 red, zero border-radius, hairline rules (#EEEEEE)
- **Typography**: Calibri/Helvetica for headers/body, Consolas for numeric display
- **No wide character spacing** on all-caps labels
- **Colors**: #2D6A2D green for positive signals, #E8590C orange for warnings/secondary

---

## TESTING

After implementation, verify:

### UI Tests
1. **Duration stepper UI**: Click +/− changes duration, importance label updates
2. **Foundation card**: Appears at top, has own duration stepper, lists 6 subsections
3. **Live total**: Footer updates in real-time; orange warning appears at > 25 min
4. **Overlap warning**: When dimension overlaps with foundation (including values), warning displays on card
5. **Session config output**: New schema with foundation.durationMin=10 and 6 subsections

### Engine-Side Tests
6. **Budget enforcement**: Use `test-configs/short-budget.json` to verify sections transition at maxQuestions
7. **budgetStatus response**: Every `/api/rc-discover` response includes budgetStatus object
8. **Transition signals**: When section completes, response includes transition object with from/to/reason
9. **Force transition**: When budget exhausted before AI completes, forceTransition triggers automatic section end
10. **Greeting includes budget**: First response (action: "greeting") includes budgetStatus with maxQuestions
11. **Values section populated**: Synthesis output includes a populated Values section from discovery data

---

*This brief supersedes v1.1. Values is now guaranteed in foundation, aligning the discovery flow with the synthesis contract.*
