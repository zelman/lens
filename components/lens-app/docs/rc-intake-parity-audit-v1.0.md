# R→C Intake Parity Audit v1.0

**Date:** 2026-04-23
**Auditor:** Claude Code (Opus 4.5)
**Scope:** Read-only comparison of C→C (main intake) vs R→C (recruiter-contextualized) flows
**Verdict:** **6/10** — Functional but missing critical guardrails

---

## Executive Summary

The R→C flow is architecturally sound and shares appropriate infrastructure with C→C, but is missing two **P0 guardrails** that the main intake has: validation gate and timeout budget management. These omissions create risk of hallucination in output documents and Vercel timeout failures in production.

### Top 3 Gaps

| Priority | Gap | Risk |
|----------|-----|------|
| **P0** | R→C synthesize has no validation gate | Hallucinations and sensitivity violations pass through undetected |
| **P0** | R→C synthesize has no timeout budget | 58s Vercel limit can be hit, causing synthesis failures |
| **P1** | SECTION_LABELS has stale naming | Cosmetic drift; `workstyle` falls back to generic formatter |

---

## Layer 1: API Route Map

### Discovery Routes

| Route | C→C | R→C | Notes |
|-------|-----|-----|-------|
| `/api/discover` | ✓ | — | 8 fixed sections, MAX_QUESTIONS_PER_SECTION=4 |
| `/api/rc-discover` | — | ✓ | Dynamic sections from session-config, uses lib/session-timing |
| Model | claude-sonnet-4-6 | claude-sonnet-4-6 | Same |
| MAX_TOKENS | 1000 | 1000 | Same |
| Budget enforcement | Hardcoded (4 per section) | lib/session-timing (dynamic) | R→C more sophisticated |

### Synthesis Routes

| Route | C→C | R→C | Gap? |
|-------|-----|-----|------|
| `/api/synthesize` | ✓ | — | Has 3-phase: synthesis → validation → re-synthesis |
| `/api/rc-synthesize` | — | ✓ | **Single-phase only** (no validation gate) |
| Model | claude-sonnet-4-6 | claude-sonnet-4-6 | Same |
| MAX_TOKENS | 6000 | 6000 | Same |
| Timeout budget | REQUEST_DEADLINE_MS=58000 | **None** | **P0 Gap** |
| Validation gate | ✓ (via validation.js) | **Missing** | **P0 Gap** |
| Sensitivity filter | ✓ (inline) | ✓ (inline) | Both have it, different implementations |

### Supporting Routes

| Route | C→C | R→C | Notes |
|-------|-----|-----|-------|
| `/api/extract-dimensions` | — | ✓ | R→C only (dimension extraction from role context) |
| `/api/generate-session` | — | ✓ | R→C only (session config generation) |
| `/api/rc-session-create` | — | ✓ | R→C only (shareable links via Airtable) |
| `/api/rc-session-fetch` | — | ✓ | R→C only (fetch session by token) |
| `/api/session` | ✓ | — | C→C only (context reflection) |
| `/api/score` | ✓ | — | C→C only (legacy standalone scorer) |
| `/api/merge` | ✓ | — | C→C only (lens merge) |

---

## Layer 2: Prompt/Guardrail Matrix

### Discovery Prompts

| Guardrail | C→C (discovery.js) | R→C (rc-discovery.js) | Status |
|-----------|--------------------|-----------------------|--------|
| Single question per turn | ✓ `RC_SYSTEM_BASE` | ✓ `RC_SYSTEM_BASE` | Parity |
| Reflection before question | ✓ "briefly reflect" | ✓ "briefly reflect" | Parity |
| Cross-section context | ✓ `buildSystemPrompt` | ✓ `buildEstablishedContext` | Parity |
| "I don't know" handling | ✓ Explicit protocol | ✓ Explicit protocol | Parity |
| Section complete marker | ✓ `[SECTION_COMPLETE]` | ✓ `[SECTION_COMPLETE]` | Parity |
| Question limit enforcement | Hardcoded in prompt | Via `maxQuestions` param | Both work |
| Role context injection | — | ✓ RC_SYSTEM_BASE | R→C specific |
| Foundation vs tailored | — | ✓ Different max questions | R→C specific |

### Synthesis Prompts

| Guardrail | C→C (synthesis.js) | R→C (rc-synthesis.js) | Status |
|-----------|--------------------|-----------------------|--------|
| Sensitivity rules | ✓ Inline in system prompt | ✓ Inline in system prompt | Parity |
| 7-section structure | ✓ 6 standard + varies | ✓ 6 standard + Role Fit | Similar |
| Third person voice | ✓ Required | ✓ Required | Parity |
| No bullet points | ✓ Required | ✓ Required | Parity |
| Stats extraction | ✓ Required | ✓ Required | Parity |
| Role fit section | — | ✓ New section for R→C | R→C specific |

### Validation Prompts (P0 Gap)

| Component | C→C | R→C | Status |
|-----------|-----|-----|--------|
| `validation.js` import | ✓ synthesize/route.js:6 | **Missing** | **P0** |
| Gap detection | ✓ VALIDATION_SYSTEM_PROMPT | **Missing** | **P0** |
| Hallucination detection | ✓ VALIDATION_SYSTEM_PROMPT | **Missing** | **P0** |
| Sensitivity violation scan | ✓ VALIDATION_SYSTEM_PROMPT | **Missing** | **P0** |
| Re-synthesis with addendum | ✓ buildRevisionAddendum | **Missing** | **P0** |
| MIN_VALIDATION_BUDGET_MS | ✓ 20000ms | **Missing** | **P0** |

---

## Layer 3: UI Primitive Inventory

### Component Comparison

| Feature | LensIntake.jsx | RecruiterCandidateIntake.jsx | Status |
|---------|----------------|------------------------------|--------|
| BUILD_ID | 2026.04.22-e | 2026.04.22-h | Both current |
| Swiss design tokens | ✓ Same constants | ✓ Same constants | Parity |
| TypewriterText | ✓ | ✓ | Parity |
| Phase state machine | ✓ | ✓ | Different phases |
| localStorage key | `lens-session` | `RC_CANDIDATE_INTAKE_STATE` | Intentional split |
| Progress bar | ✓ 8 fixed sections | ✓ Dynamic from config | R→C more flexible |
| Context reflection phase | ✓ ContextReflectionPhase | **Missing** | Intentional? |
| File upload | ✓ Full upload flow | ✓ (via prior step) | Different UX |
| Demo mode | ✓ | ✓ (sample lens) | Both have it |

### Section Label Constants

| ID | LensIntake.jsx | RecruiterCandidateIntake.jsx | Match? |
|----|----------------|------------------------------|--------|
| essence | "Essence" | "Professional Essence" | ✓ Close |
| workstyle | "Work Style" | **`work_style`** in SECTION_LABELS | **P1 Drift** |
| situation | (not used) | **`situation_timeline`** in SECTION_LABELS | **P1 Drift** |
| values | "Values" | "Values & Priorities" | ✓ Close |
| energy | "Energy" | "Energy & Motivation" | ✓ Close |
| disqualifiers | "Deal-Breakers" | "Deal-Breakers" | ✓ Match |

**Note:** The `formatSectionLabel` fallback converts snake_case to Title Case, so `workstyle` → "Workstyle" works. But explicit labels like `work_style: "Work Style"` won't match the actual ID `workstyle`. This is cosmetic but creates maintenance debt.

---

## Naming Drift Check

### Foundation Section IDs

| Canonical (generator) | rc-discovery.js | rc-synthesis.js | RecruiterCandidateIntake.jsx |
|----------------------|-----------------|-----------------|------------------------------|
| essence | ✓ essence | ✓ essence | ✓ essence |
| workstyle | ✓ workstyle | ✓ workstyle | **work_style** in SECTION_LABELS |
| values | ✓ values | ✓ values | ✓ values |
| energy | ✓ energy | ✓ energy | ✓ energy |
| disqualifiers | ✓ disqualifiers | ✓ disqualifiers | ✓ disqualifiers |
| situation | ✓ situation | ✓ situation | **situation_timeline** in SECTION_LABELS |

**Status:** Core files fixed in e6df3b9. SECTION_LABELS in UI has stale entries that don't affect functionality (fallback handles it) but should be cleaned.

---

## Pattern Pre-Pass Integration Points

### lib/session-timing

| Question | Answer |
|----------|--------|
| Who uses it? | R→C only (`rc-discover/route.js`) |
| Can C→C import it? | Yes, ES module with no R→C dependencies |
| Should C→C use it? | Possible enhancement; currently not needed (fixed 4-question limit works) |
| API surface | `sectionBudgetFromConfig`, `questionsFromDuration`, `getBudgetStatus`, constants |

### Shared Constants

| Constant | Location | Shared? |
|----------|----------|---------|
| QUESTIONS_PER_MINUTE | lib/session-timing | R→C only |
| MIN_QUESTIONS_PER_SECTION | lib/session-timing | R→C only |
| MAX_QUESTIONS_PER_SECTION | discover/route.js (hardcoded 4) | C→C only |
| REQUEST_DEADLINE_MS | synthesize/route.js | **C→C only — R→C missing** |

---

## Refactor Plan

### P0 — Must Fix Before Ship

1. **Add validation gate to rc-synthesize/route.js**
   - Import `validation.js` prompts
   - Add 3-phase flow: synthesis → validation → re-synthesis
   - Add REQUEST_DEADLINE_MS constant (58000)
   - Add MIN_VALIDATION_BUDGET_MS check (20000)
   - Estimated: 50-80 lines, mostly copy from synthesize/route.js

2. **Add timeout budget management to rc-synthesize/route.js**
   - Track start time
   - Check remaining budget before validation
   - Skip validation gracefully if budget exhausted
   - Log timeout skip for telemetry

### P1 — Should Fix

3. **Clean SECTION_LABELS in RecruiterCandidateIntake.jsx**
   - Change `work_style` → `workstyle`
   - Change `situation_timeline` → `situation`
   - Verify no other stale entries
   - Estimated: 5 lines

### P2 — Nice to Have

4. **Consider context reflection for R→C**
   - C→C has ContextReflectionPhase between upload and discovery
   - R→C skips this (candidate materials come from recruiter step)
   - May want lightweight version that summarizes what recruiter provided

5. **Consider lib/session-timing for C→C**
   - Currently hardcoded 4 questions per section
   - Could benefit from dynamic budgeting
   - Low priority — current approach works

---

## Open Questions for Eric

1. **Validation gate priority:** Should we block R→C launch until validation gate is added, or ship with risk and add later?

2. **Timeout strategy:** If validation is skipped due to timeout, should we log a warning to Airtable for recruiter review?

3. **Context reflection for R→C:** Was the omission of ContextReflectionPhase intentional? The candidate doesn't upload materials in R→C (recruiter does), so the reflection would be on recruiter-provided docs.

4. **SECTION_LABELS cleanup:** Should we keep the fallback pattern (which works) or maintain an explicit mapping (which requires updates when generator changes)?

---

## Appendix: File References

### C→C Flow
- `app/api/discover/route.js` — Discovery API
- `app/api/synthesize/route.js` — Synthesis API with validation
- `app/api/_prompts/discovery.js` — Discovery system prompts
- `app/api/_prompts/synthesis.js` — Synthesis system prompts
- `app/api/_prompts/validation.js` — Validation gate prompts
- `app/components/LensIntake.jsx` — Main UI component

### R→C Flow
- `app/api/rc-discover/route.js` — R→C Discovery API
- `app/api/rc-synthesize/route.js` — R→C Synthesis API (missing validation)
- `app/api/_prompts/rc-discovery.js` — R→C discovery prompts
- `app/api/_prompts/rc-synthesis.js` — R→C synthesis prompts
- `app/api/extract-dimensions/route.js` — Dimension extraction from role context
- `app/api/generate-session/route.js` — Session config generation
- `app/components/RecruiterCandidateIntake.jsx` — R→C UI component
- `app/components/RecruiterRoleForm.jsx` — Recruiter role input form
- `lib/session-timing/index.js` — Budget enforcement module

---

*Report generated 2026-04-23. Read-only audit — no code modifications made.*
