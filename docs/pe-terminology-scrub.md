# PE Terminology Scrub — Lens Project

*Generated: 2026-04-28*

## Context

Scrubbing all references to "private equity" and its abbreviation "PE" from Lens product code and documentation. This is a preemptive measure given the grey area around VC/funding discussions ahead. The Job Search project (separate repo) will retain PE detection logic — this scrub is Lens-only.

## Decision Needed

What replacement terminology should we use? Options:

| Current Term | Option A | Option B | Option C |
|--------------|----------|----------|----------|
| "PE-backed" | "short-horizon investor-backed" | "extraction-timeline company" | "aggressive-exit investor-backed" |
| "PE-backed company" | "company with misaligned investor timeline" | "investor-backed with short exit horizon" | "growth equity (aggressive exit)" |
| "No PE" / "not PE" | "mission-aligned investors only" | "founder-friendly capital" | "patient capital" |
| `investor_type: [PE]` | Remove entirely | Replace with `["Late-stage Growth"]` | Generic `["Misaligned Exit Timeline"]` |

**Recommendation:** Option B feels most precise — it describes the *actual problem* (exit timeline pressure) rather than using a category label.

---

## Full Occurrence List

### 1. "private equity" (full phrase) — 1 occurrence

| File | Line | Context | Action |
|------|------|---------|--------|
| `docs/competitive-entry-LRI-LRA.md` | 16 | "...banking, investment management, private equity, mass media, and pharma..." | **Keep** — describes LRI's client industries, not Lens product logic |

---

### 2. Config Files — 4 occurrences

| File | Line | Current Text | Proposed Replacement |
|------|------|--------------|----------------------|
| `config/guardrails.yaml` | 121 | `"PE-backed companies"` | `"short-horizon investor-backed companies"` |
| `config/guardrails.yaml` | 123 | `"company types to exclude (PE-backed, public, etc.)"` | `"company types to exclude (short-horizon investor-backed, public, etc.)"` |
| `config/scoring-config.yaml` | 42 | `investor_type: [PE, "Growth Equity"]` | `investor_type: ["Late-stage Growth", "Growth Equity"]` or remove |
| `config/scoring-config.yaml` | 106 | `condition: "VC investors (not PE)"` | `condition: "VC investors (patient capital)"` |

---

### 3. Specs — 12 occurrences

| File | Line | Current Text |
|------|------|--------------|
| `specs/bidirectional-lens-system-v1.0.md` | 53 | `"PE-backed company"` |
| `specs/bidirectional-lens-system-v1.0.md` | 363 | `"PE-backed company" → check role_lens.stage...` |
| `specs/bidirectional-lens-system-v1.0.md` | 507 | `Disqualifiers: PE-backed, >200 employees...` |
| `specs/candidate-lens-v1.md` | 122 | `"PE-backed company"` |
| `specs/feedback-loop-spec-v1.0.md` | 552 | `disqualifiers: ["PE-backed", ">350 employees"...]` |
| `specs/lens-context-integration-spec-v1.0.md` | 181 | `short stints at PE-backed companies` |
| `specs/lens-product-format-eric.md` | 31 | `investor_type: [PE, Growth Equity]` |
| `specs/lens-product-split-spec.md` | 52 | `Investor type lookup table (VC vs PE vs Growth Equity)` |
| `specs/LENS-SPEC.md` | 243 | `"You got tense when I mentioned PE-backed companies..."` |
| `specs/LENS-SPEC.md` | 296 | `"PE-backed companies are fundamentally misaligned..."` |
| `specs/LENS-SPEC.md` | 307 | `No amount of mission alignment compensates for a PE-backed company...` |
| `specs/legacy/lens-template.md` | 36 | `Auto-disqualify: PE-backed, 1000+ employees...` |

---

### 4. Documentation — 14 occurrences

| File | Line | Current Text |
|------|------|--------------|
| `docs/SCORING-ENGINE.md` | 36 | `Reject: PE-backed, wrong stage...` |
| `docs/SCORING-ENGINE.md` | 75 | `Auto-disqualifiers (PE-backed, >200 employees...)` |
| `docs/SCORING-ENGINE.md` | 234 | `PE-backed = auto-reject` |
| `docs/SCORING-ENGINE.md` | 269 | `investor_type: [PE, "Growth Equity"]` |
| `docs/SCORING-ENGINE.md` | 363 | `PE detection is centralized in the config` |
| `docs/SYNTHESIS-PROMPT.md` | 82 | `"PE-backed companies are out — the extraction timeline..."` |
| `docs/strategic-brief-v1.6.md` | 545 | `PE-backed portfolio cos... Under pressure from PE/board clients` |
| `docs/strategic-brief-v1.6.md` | 628 | `expansion into in-house executive talent at PE funds` |
| `docs/lens-stress-test-synthesis-v1.md` | 79 | `PE-backed portfolio cos` |
| `docs/lens-stress-test-synthesis-v1.md` | 82 | `under pressure from PE/board clients` |
| `docs/lens-stress-test-synthesis-v1.md` | 122 | `expansion into in-house executive talent at PE funds` |
| `docs/lens-stress-test-synthesis-v1.md` | 159 | `PE funds and large enterprises` |
| `docs/deck-update-spec-v1.md` | 96 | `PE-backed` |
| `docs/core-narrative-v1.6.md` | 106 | `expansion into PE/enterprise in-house talent` |
| `docs/competitive/lens-competitive-landscape-v2.1.md` | 120 | `No PE exclusion` |

---

### 5. Meetings — 3 occurrences

| File | Line | Current Text |
|------|------|--------------|
| `meetings/brief-jamrich-entromy-v1.0.md` | 14 | `PE buyer dynamics` |
| `meetings/brief-jamrich-entromy-v1.0.md` | 33 | `PE-portfolio embedding` |
| `meetings/brief-jamrich-entromy-v1.0.md` | 40 | `How do PE buyers evaluate AI analytics tools?` |

---

### 6. Testing Files — 6 occurrences

| File | Line | Current Text |
|------|------|--------------|
| `testing/eric-zelman-test-profile.md` | 105 | `PE-backed companies — misaligned incentives` |
| `testing/eric-zelman-test-profile.md` | 112 | `PE-backed company` |
| `testing/eric-zelman-lens-v3.md` | 59 | `PE-backed companies are out — the extraction timeline...` |
| `testing/lens-document.md` | 12 | `"PE-owned companies"` |
| `testing/lens-document.md` | 46 | `PE-owned companies, organizations over 300 people...` |
| `testing/lens-document-v2.md` | 12, 45 | `PE-backed companies` |

---

### 7. Review Profiles — 1 occurrence

| File | Line | Current Text |
|------|------|--------------|
| `review-profiles/scoring.md` | 18 | `Auto-disqualifiers: PE-backed, >200 employees...` |

---

### 8. Components (lens-app) — 8 occurrences

| File | Line | Current Text |
|------|------|--------------|
| `components/lens-app/app/components/LensIntake.jsx` | 1594 | `PE-backed companies are out — the extraction timeline...` |
| `components/lens-app/app/components/LensIntake.jsx` | 1597 | `- No PE-backed companies` |
| `components/lens-app/app/components/LensExperience.jsx` | 192 | `"PE-backed company"` (example in prompt) |
| `components/lens-app/app/components/RecruiterCandidateIntake.jsx` | 349 | `PE-backed companies are out. The extraction timeline...` |
| `components/lens-app/app/components/lens-report-renderer.jsx` | 67 | `PE-backed companies are out — the extraction timeline...` |
| `components/lens-app/app/api/_prompts/synthesis.js` | 112 | `"PE-backed companies are out — the extraction timeline..."` |
| `components/lens-app/app/api/_prompts/synthesis.js` | 189 | `short stints at PE-backed companies` |

---

### 9. HTML Samples — 2 occurrences (duplicated in two locations)

| File | Line | Current Text |
|------|------|--------------|
| `docs/weekly-inflection-briefing-sample.html` | 527 | `no PE-backed` |
| `docs/weekly-inflection-briefing-sample.html` | 819 | `GATE: Flock Safety — PE-backed` |
| `components/lens-app/public/weekly-inflection-briefing-sample.html` | 527, 819 | (same as above) |

---

### 10. CLAUDE.md — 1 occurrence (documentation only)

| File | Line | Current Text | Action |
|------|------|--------------|--------|
| `CLAUDE.md` | 134 | `PE detection modules` | **Keep or update** — describes job_search repo contents, not Lens logic |

---

## Summary

| Category | Count | Notes |
|----------|-------|-------|
| Config files | 4 | Core scoring logic — must update |
| Specs | 12 | Product definitions — must update |
| Docs | 14 | Strategy/architecture — must update |
| Meetings | 3 | Historical notes — consider keeping for accuracy |
| Testing | 6 | Test data — must update |
| Review profiles | 1 | Must update |
| Components | 8 | Production code — must update |
| HTML samples | 4 | Sample output — must update |
| CLAUDE.md | 1 | Documentation — optional |
| Competitive entry | 1 | Describes competitor's clients — keep |
| **Total** | **54** | |

---

## Questions for Discussion

1. **Replacement term:** Which option above? Or something else entirely?

2. **Meeting notes:** Should historical meeting prep docs retain original terminology for accuracy, or scrub everything?

3. **Competitive analysis:** The LRI entry describes *their* clients including PE — keep as-is?

4. **CLAUDE.md reference:** Update the job_search description, or leave it since it's accurate about that repo?

5. **Test profiles:** Eric's test profile uses PE as a real disqualifier. Replace with generic term, or use a different example disqualifier entirely?

6. **Strategic docs:** The stress test and strategic brief reference PE firms as potential buyers/expansion targets. Replace with "institutional investor talent teams" or similar?

---

## Execution Plan

Once terminology is decided:

1. Update `config/scoring-config.yaml` and `config/guardrails.yaml` first (source of truth)
2. Update specs in order: `LENS-SPEC.md` → `candidate-lens-v1.md` → others
3. Update component code (`LensIntake.jsx`, `synthesis.js`, etc.)
4. Update docs and HTML samples
5. Update test profiles
6. Run build to verify no breaks
7. Commit with message: "Scrub PE terminology from Lens product"
