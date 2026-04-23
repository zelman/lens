# R→C Steps 2-4: Candidate Discovery Configuration — Claude Code Brief v1.1

> **Updated:** April 22, 2026
> **Depends on:** RecruiterRoleForm.jsx (Step 1), /api/extract-dimensions (Step 2), /api/generate-session (Step 3)
> **Consumes:** `session-config` from sessionStorage (written by Step 3)
> **Produces:** A candidate lens document shaped by the role context
> **Status:** IMPLEMENTATION IN PROGRESS (feature/rc-duration-stepper-foundation branch)

---

## CHANGELOG FROM v1.0

### v1.1 Changes (April 2026)

1. **Duration as primary input**: Recruiters now set explicit durations (minutes) per dimension, replacing the importance-cycle badge. Importance is derived from duration:
   - 4 min → moderate
   - 5-6 min → high
   - 7+ min → critical

2. **Universal 4-minute floor**: All sections (foundation and tailored dimensions) have a minimum of 4 minutes. No hard ceiling.

3. **Foundation composition (5 subsections)**: The foundation layer now explicitly consists of:
   - Essence — identity patterns, throughline across career contexts
   - Work Style — how they operate day-to-day
   - Energy — energy sources and drains
   - Disqualifiers — hard no's, dealbreakers
   - Situation — urgency, constraints, timeline

   **IMPORTANT**: Values is NOT a foundation subsection. It must come from a tailored dimension.

4. **Foundation card in UI**: A fixed Foundation card appears at the top of DimensionReviewPhase with its own duration stepper (default 8 min, floor 4 min). No add/remove/reorder controls for foundation.

5. **Overlap detection and merge affordance**: Extract-dimensions now flags when tailored dimensions overlap with foundation subsections. The UI shows overlap warnings, and the session generator merges overlapping sections (explores deeper instead of duplicating).

6. **Values warning**: If no Values-adjacent dimension is extracted, the UI displays a warning prompting recruiters to add one.

7. **Live session total**: The footer shows "Estimated session: N min" with live updates. Total > 25 min shifts text to orange (#E8590C) as a soft warning.

---

## UPDATED SESSION CONFIG SCHEMA (v1.1)

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
    "durationMin": 8,
    "subsections": ["essence", "workstyle", "energy", "disqualifiers", "situation"],
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

| Field | v1.0 | v1.1 |
|-------|------|------|
| `foundation` | Array of section objects | Object with `durationMin`, `subsections`, and `sections` |
| `foundation.durationMin` | N/A | Total minutes for foundation (recruiter-set, default 8) |
| `foundation.subsections` | N/A | Fixed: `["essence", "workstyle", "energy", "disqualifiers", "situation"]` |
| `tailored[].durationMin` | N/A | Per-dimension duration (recruiter-set, min 4) |
| `tailored[].importance` | Primary input | Derived from durationMin |
| `tailored[].timeAllocation` | Primary time spec | Deprecated in favor of durationMin |

---

## DIMENSION EXTRACTION (Step 2 Updates)

### New Output Schema

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
    "situation": null
  },
  "valuesWarning": "No Values/Culture dimension found. Consider adding one.",
  "contextQuality": "rich|adequate|thin",
  "contextWarning": null
}
```

### Foundation Overlap Detection

When extract-dimensions identifies that a tailored dimension covers similar ground to a foundation subsection, it maps them in `foundationOverlaps`. For example:

- A "Work Environment Fit" dimension might overlap with `workstyle`
- A "Travel Flexibility" dimension might overlap with `disqualifiers`
- A "Timeline Alignment" dimension might overlap with `situation`

The generate-session step then merges these: instead of running foundation-workstyle AND tailored-work-environment-fit separately, they're combined into a single deeper exploration.

### Values Warning

Values is explicitly NOT a foundation subsection. The system expects recruiters to define a Values-related dimension (Culture Fit, Values Alignment, etc.) if important for the role. If no such dimension exists in the extracted set, `valuesWarning` is populated and displayed in the UI.

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
- Description: "Runs for every candidate regardless of role. Covers: Essence, Work Style, Energy, Disqualifiers, Situation."
- Duration stepper: default 8 min, floor 4 min
- No add/remove/reorder controls (foundation is fixed)

### Footer Summary

Replaced:
```
"X critical, Y high, Z moderate — estimated 18 min"
```

With:
```
"Estimated session: N min"
```

Live total updates on every stepper change. Text shifts to #E8590C (orange) when total > 25 min.

---

## ENGINE-SIDE ENFORCEMENT (DEPENDENCY)

**WARNING**: Per-section timing guardrails in the candidate discovery engine must enforce duration as a real budget, not a suggestion. This is tracked separately and is a blocking dependency.

This work (feature/rc-duration-stepper-foundation branch) does NOT merge to main until engine-side enforcement lands alongside it.

---

## DESIGN CONSTRAINTS

- **Swiss Style**: white bg (#FFFFFF), #1A1A1A text, #D93025 red, zero border-radius, hairline rules (#EEEEEE)
- **Typography**: Calibri/Helvetica for headers/body, Consolas for numeric display
- **No wide character spacing** on all-caps labels
- **Colors**: #2D6A2D green for positive signals, #E8590C orange for warnings/secondary

---

## TESTING

After implementation, verify:

1. **Duration stepper UI**: Click +/− changes duration, importance label updates
2. **Foundation card**: Appears at top, has own duration stepper, cannot be removed/reordered
3. **Live total**: Footer updates in real-time; orange warning appears at > 25 min
4. **Overlap warning**: When dimension overlaps with foundation, warning displays on card
5. **Values warning**: When no Values dimension exists, warning appears in UI
6. **Session config output**: New schema with foundation.durationMin and tailored[].durationMin

---

*This brief supersedes v1.0. The changes enable recruiter control over session pacing while maintaining the coaching (not interview) experience for candidates.*
