# Lens Project Changelog

All notable changes to deployed apps and schemas are documented here.

## [2026-05-02] Template-Leak Structural Fix

### Build 2026.05.02-a

**Fixed:** Template-leak follow-up — structural move persists after build c phrase fix.

**Background:** Build c (2026.05.01-c) removed the verbatim "What [name] carries forward / done with" scaffolding. But the structural pattern survived: every Lens document still ended the Skills & Experience section with a paired retain-vs-discard summary. Five docs across 3 testers, 3 build versions — the pattern appeared every time.

**Root cause:** Build c targeted the lexical scaffolding (the exact phrases) but left the structural instruction intact. Three sources in `synthesis.js`:
1. Lines 77-78: "Close this section by distinguishing transferable capabilities from what they've outgrown..." — explicit instruction to END with the pattern
2. Lines 155-158: Example using "What he carries from the technical side..." — trained the model toward the phrase
3. Line 183: "When distinguishing transferable capabilities from outgrown patterns..." — reinforced the structure

**Fix:**
1. Removed "Close this section by" instruction — replaced with "Let the section end naturally based on the person's career arc — there is no required closing structure"
2. Rewrote the example to use "His engineering background gives him..." instead of "What he carries from..."
3. Removed line 183's reference to "distinguishing transferable capabilities from outgrown patterns"

**Verification required:** Run 2-3 fresh C→C sessions on this build. Check each for paired retain-vs-discard language at end of Skills section. If absent across all runs, the fix is complete.

**Files Changed:**
- `app/api/_prompts/synthesis.js` — removed structural instruction, updated example, removed reinforcing reference

### Build 2026.05.02-b

**Fixed:** Pull quote provenance — synthesized phrases attributed to user as quotes.

**Issue:** Pull quotes on the Identity Portrait page (page 2) are rendered with quotation marks, implying they're extracted from the user's words or synthesis body. But the prompt instruction said "Use their own words when vivid, or synthesize when clearer" — explicitly allowing fabrication.

**Evidence (build j):**
- "builds the systems that outlast him" — NEVER appears in body text (fabricated)
- "authority is a tool he reaches for..." — verbatim in body ✓
- "preventive infrastructure, not reactive response" — partial match only

**Fix:** Changed Key Phrases Guidelines to require verbatim extraction:
- Old: "Use their own words when vivid, or synthesize when clearer"
- New: "Extract 2-3 phrases VERBATIM from the Lens document you just wrote... Each phrase must appear word-for-word in one of the 6 narrative sections"

Applied to both C→C (`synthesis.js`) and R→C (`rc-synthesis.js`) prompts.

**Verification:** Post-fix, grep every pull quote against the synthesis body. 100% match required.

**Files Changed:**
- `app/api/_prompts/synthesis.js` — key_phrases must be verbatim extractions
- `app/api/_prompts/rc-synthesis.js` — same fix

---

## [2026-05-01] Fix C→C Transcript Persistence

### Build 2026.05.01-a

**Fixed:** C→C transcript persistence now stores ALL messages from ALL sections, not just the current section.

**Root cause:** The `messages` array resets on each section advance (correct for prompt context window management), but the persisted Transcript field was being snapshotted from this resetting array instead of from a session-level append-only log.

**Fix:**
- Added `fullTranscript` state to `DiscoveryPhase` component — accumulates ALL messages across ALL sections with section metadata
- Each message entry now includes: `{role, content, turn, section, timestamp}`
- `fullTranscript` persists across section transitions (unlike `messages` which resets per section)
- Updated `logTelemetry` to use `fullTranscript` instead of `messages`
- Added localStorage trim logic for `fullTranscript` (keeps last 50 turns if storage quota exceeded)
- Falls back to current section messages for backwards compatibility
- Fixed stale closure bug in useEffect (per Opus review): ref updated before setState, turn computed from prev.length

**Impact:** Pattern-extraction pre-pass, synthesis-vs-transcript diffing, and tester feedback analysis will now have complete conversation data.

**Files Changed:**
- `app/components/LensIntake.jsx` — fullTranscript state, useEffect for message accumulation, updated logTelemetry

### Build 2026.05.01-b

**Added:** Tester field auto-linking on Lens Sessions.

**Implementation:**
1. URL param (primary): `?tester=recXXX` in page URL captures tester record ID
2. Name-match fallback: If no param, server queries Testers table by `LOWER({First Name})` + `LOWER({Last Name})`
3. Links tester if exactly one match; leaves unlinked (with warning log) if zero or multiple matches
4. Never auto-creates Tester records

**Usage:** Generate per-tester invite links: `https://lens-app-five.vercel.app/?tester=recRI2CYx3jcCYwsX`

**Security (per Opus review):**
- Strict name validation regex to prevent Airtable formula injection
- Tester record ID format validation (`rec` + 14 alphanumeric)

**Files Changed:**
- `app/components/LensIntake.jsx` — reads `tester` URL param, passes to telemetry
- `app/api/log-session/route.js` — `matchTesterByName()` helper with injection protection, fallback logic

### Build 2026.05.01-c

**Fixed:** Synthesis prompt template-leak — "carries forward / done with" scaffolding.

**Evidence:** Cross-tester pattern audit found verbatim "What [X] carries forward:" / "What [X] is done with:" phrasing in 4/4 lens documents across 3 testers and 2 build versions. Two runs on identical session data produced the same scaffold with different content, confirming the model generates this structure from the prompt, not from user input.

**Root cause:** Lines 74-80 of synthesis.js explicitly instructed:
```
End with two short paragraphs:
- "What [they] carry forward:" — ...
- "What [they're] done with:" — ...
```

**Fix:** Removed prescribed phrase structure. Now instructs model to "distinguish transferable capabilities from what they've outgrown" using "the person's own language if they articulated this distinction; otherwise, synthesize from the evidence without imposing a fixed phrase structure."

**Files Changed:**
- `app/api/_prompts/synthesis.js` — removed 3 instances of template scaffolding language

### Build 2026.05.01-d

**Fixed:** Premium metadata parser regex can't handle nested JSON braces.

**Root cause (per Opus code review):** The `parsePremiumSynthesisResponse` function used regex patterns like `/\{[\s\S]*?"soft_gates"[\s\S]*?\}/g` to strip JSON from markdown. These patterns match the FIRST closing brace after the marker, not the correct matching brace for nested objects. For objects with nested structures (like `soft_gates`), this left partial JSON fragments in the output.

**Fix:**
- Added `stripJsonObject()` helper with brace counting to correctly handle nested JSON when stripping from markdown
- Added `extractJsonObject()` helper with brace counting to correctly extract JSON from metadata sections
- Removed redundant inline brace-counting code that duplicated the new helpers
- Both helpers traverse character-by-character, incrementing/decrementing brace count to find the matching closer

**Files Changed:**
- `app/api/_prompts/synthesis.js` — added brace-counting helpers, replaced regex-based JSON handling

### Build 2026.05.01-e

**Fixed:** Resume Enhancements section: intermittent failure renders fallback message in PDF export.

**Evidence:** Two runs of the same C→C session produced different outcomes — one with full resume enhancements, one with fallback copy "Resume analysis is processing... This sometimes happens with complex PDF formats."

**Root cause:** Race condition / intermittent API failure. The flow:
1. `setHasResumeData(true)` is called BEFORE the `/api/resume-suggestions` API call
2. If the API times out, returns 502, or JSON parse fails, `premiumResumeSuggestions` remains null
3. Component receives `hasResumeData=true` but `suggestions=null`, triggering the fallback message

**Fix:** When resume was uploaded but suggestions failed to generate, suppress the Resume Enhancements section entirely rather than rendering fallback copy. The user can re-run the generation to retry; a processing message in the final PDF deliverable is unacceptable.

**Files Changed:**
- `app/components/PremiumLensDocument.jsx` — return null instead of fallback message when hasResumeData but no suggestions

### Build 2026.05.01-f

**Fixed:** Hide `/skip` command response in production (R→C demo only).

**Issue:** R→C sessions where user types `/skip` returned visible message: "Demo mode is not enabled. The /skip command only works when NEXT_PUBLIC_DEMO_MODE=true." This reveals dev affordance and breaks conversational tone.

**Fix:** Only intercept `/skip` when `NEXT_PUBLIC_DEMO_MODE=true`. When demo mode is disabled, `/skip` flows through as a normal user message to the AI (no special handling, no error message).

**Files Changed:**
- `app/components/RecruiterCandidateIntake.jsx` — changed condition from `if (userMsg === "/skip") { if (!isDemoModeEnabled()) ... }` to `if (isDemoModeEnabled() && userMsg === "/skip")`

### Build 2026.05.01-g

**Fixed:** R→C validation was comparing Lens output against conversation summaries, not the actual resume.

**Root cause:** `buildRCSourceMaterial()` only used `sectionData` (discovery summaries) and `sessionConfig.metadata` (role title/company). It ignored `candidateContext.resumeText` and `candidateContext.supportingDocsText` — the actual source documents that validation needs to detect hallucinations like "9 years vs 13 years" tenure errors.

**Evidence:** The 4/23 R→C parity session claimed "full validation parity" but validation couldn't catch factual errors because it had no ground truth to compare against.

**Fix:** Updated `buildRCSourceMaterial()` to accept `candidateContext` and include:
1. `[RESUME]` section with actual resume text (primary source)
2. `[SUPPORTING DOCUMENTS]` section with LinkedIn/portfolio/notes (secondary)
3. Section summaries as conversation context (tertiary)

**Files Changed:**
- `app/api/rc-synthesize/route.js` — `buildRCSourceMaterial()` now includes resume and supporting docs; call site updated to pass `candidateContext`

### Build 2026.05.01-h

**Fixed:** Validation API calls can hang indefinitely, blocking the entire synthesis pipeline.

**Root cause (per Opus code review):** The validation call in `rc-synthesize/route.js` used `anthropic.messages.create()` with no AbortController or timeout. If the Anthropic API hung or returned a 429 rate-limit error that blocked for 60+ seconds, the request would exhaust the remaining time budget and Vercel would kill the entire request — losing the already-generated lens output.

The `synthesize-premium/route.js` used streaming with a full 150s timeout, which is excessive for validation (small response) and doesn't match the expected 30s budget.

**Fix:**
1. **rc-synthesize/route.js:** Added AbortController with 30s timeout (or remaining budget - 5s, whichever is smaller). On abort, logs warning and skips validation gracefully — returns un-validated lens instead of failing entirely.

2. **synthesize-premium/route.js:** Switched from streaming to non-streaming for validation (appropriate for small response). Added `VALIDATION_TIMEOUT_MS = 30000` constant and AbortController with 30s timeout. Same graceful fallback on timeout.

**Impact:** Validation timeouts no longer block the pipeline. Users get their lens even if validation times out.

**Files Changed:**
- `app/api/rc-synthesize/route.js` — AbortController + 30s timeout for validation
- `app/api/synthesize-premium/route.js` — VALIDATION_TIMEOUT_MS constant, non-streaming validation with AbortController

### Build 2026.05.01-i

**Fixed:** Three pre-existing issues flagged by Opus code review.

**1. Regex backtracking in `buildSentencePattern`:**
- Changed `[^.!?]*` to `[^.!?\n]{0,500}` — bounded quantifier prevents catastrophic backtracking on long inputs, newline inclusion prevents cross-line sentence matching

**2. SENSITIVE_TERMS false positives:**
- Removed standalone DISC dimension words: "Dominance", "Steadiness", "Compliance", "Influencing", "Peacemaker"
- These are common English words that caused false positives (e.g., "regulatory compliance", "market dominance", "natural peacemaker")
- The term "DISC" itself catches assessment references; added specific DISC patterns: "SC profile", "Di style", "CS style", "High D/I/S/C"

**3. `stream.finalMessage()` lacks try-catch:**
- Wrapped in try-catch so failure to retrieve metadata doesn't crash the synthesis
- The truncation warning is useful but not critical to the output

**Files Changed:**
- `app/api/rc-synthesize/route.js` — all three fixes
- `app/api/synthesize-premium/route.js` — all three fixes

### Build 2026.05.01-j

**Added:** Synthesis output caching — stabilizes lens artifacts so re-runs don't produce different output.

**Problem:** Each call to `generatePremiumDoc()` re-ran synthesis, producing slightly different artifacts even on identical input. This variance was problematic for testers expecting consistent output and for reproducing feedback reports.

**Solution:**
1. **Client-side caching:** Premium state (metadata, nextSteps, resumeSuggestions, cached flag) now persists to localStorage via `savedDiscoveryState`. On page reload or component remount, cached premium output is restored instead of re-synthesized.

2. **Early return on cache hit:** `generatePremiumDoc()` checks `premiumCached` flag — if true and `forceRegenerate` not set, shows cached version immediately without API call.

3. **Server-side persistence:** After successful synthesis, premium output is written to Airtable session record (`finalSynthesisMD`, `finalSynthesisYAML` fields) for audit trail and cross-device recovery.

4. **Explicit regeneration:** "Regenerate Lens" button appears only when cached version exists. Requires user confirmation: "Regenerating will produce a different artifact. Your current Lens will be replaced."

**Impact:** Testers now see consistent output across page reloads; variance only on explicit regeneration.

**Also fixed (per Opus review):** `lastMessageCountRef` not reset on section change — when `startSection` cleared messages to `[]`, the ref wasn't reset. Early messages in subsequent sections could be missed from `fullTranscript` because the append effect compared against the stale ref value.

**Files Changed:**
- `app/components/LensIntake.jsx` — premium state persistence, cache check in generatePremiumDoc, handleRegenerateLens function, Regenerate button, lastMessageCountRef reset

---

## [2026-04-30] Thesis-Hero Investor Pitch Deck

### docs/lens-investor-pitch-thesis-hero-v1.0.pptx

**Added thesis-as-hero investor pitch deck (18 slides):**

New deck artifact line for vision-stage capital. Uses Wallace ABS structure (4 AND / 5 BUT / 8 SO / 1 Ask) with thesis as hero rather than customer segment.

**Structure:**
- ACT I — AND (slides 1-4): Title, stake, future tense, why now (inevitability timeline)
- ACT II — BUT (slides 5-9): Structural deficiency, cost, existing approaches, empirical gap, the primitive
- ACT III — SO (slides 10-17): Architecture (PKI), what's built, early instances, moat, founder story, business model, horizon
- ASK (slide 17): Raise amount, milestones, investor profile (placeholders)
- Closing (slide 18): Bookend with slide 1

**Visual design:**
- Briefing Style: white ground, black/red palette, Calibri, hairline rules, zero border-radius
- Mockup-accurate layouts for slides 4, 5, 9, 10, 16 (from `lens-slide-mockups-v1.1.html`)
- Visual rhyme: slide 5 (fragmented identity, dashed center) ↔ slide 10 (PKI, solid center with red seal)
- Section labels with red accent rules

**Build tooling:**
- `docs/build-thesis-hero-deck.js` — pptxgenjs build script (reusable for regeneration)
- `docs/package.json` — pptxgenjs dependency

**Open items (placeholders in deck):**
- Slide 17: [AMOUNT], [12–18 months], [milestone], milestone Ns
- Slide 6: First stat shows "~40%" — update when stronger publicly defensible figure available

**Files Created:**
- `docs/build-thesis-hero-deck.js`
- `docs/lens-investor-pitch-thesis-hero-v1.0.pptx`
- `docs/package.json`, `docs/package-lock.json`

**Commit:** a99404a

---

## [2026-04-30] Recruiter Comparison Component

### lens-app 2026.04.30-recruiter-compare

**Added `/recruiter-compare` route for side-by-side candidate fit comparison:**

Three-column layout allowing recruiters to compare up to 3 scored candidates simultaneously. Supports loading JSON score data via paste or file upload.

**Features:**
- International Style design matching role-lens-scorer
- Empty state with clear loading instructions
- JSON validation with specific error messages
- Clear/reset functionality per column
- Responsive score card display with:
  - Total score with classification badge
  - Dimension scores with confidence indicators
  - Top signals (positive/negative)
  - Disqualification handling

**Accessibility (v1.1 fixes):**
- ARIA labels on all interactive elements
- Semantic HTML with proper form labels
- Text truncation for long content (names, briefings, reasons)
- Stable React keys

**Files:**
- `components/lens-app/app/recruiter-compare/page.jsx` — Route component
- `components/recruiter-comparison-v1.0.jsx` — Standalone archive copy

---

## [2026-04-30] Score API Dimensions Block

### lens-app 2026.04.30-score-dimensions

**Added `dimensions` block to /api/score response:**

The score API now returns a standardized `dimensions` object alongside the existing `scores` for compatibility. This provides a consistent interface for downstream consumers.

**Before:**
```json
{
  "total_score": 72,
  "scores": {
    "builder_orientation": {"score": 18, "max": 25, "confidence": 0.8, "rationale": "..."},
    "relational_fit": {...},
    "domain_fluency": {...},
    "values_alignment": {...},
    "work_style_compatibility": {...},
    "energy_match": {...}
  }
}
```

**After:**
```json
{
  "total_score": 72,
  "scores": {...},
  "dimensions": {
    "mission": {"score": 12, "confidence": 0.7, "evidence": "..."},
    "role": {"score": 18, "confidence": 0.8, "evidence": "..."},
    "culture": {"score": 17, "confidence": 0.85, "evidence": "..."},
    "skill": {"score": 14, "confidence": 0.75, "evidence": "..."},
    "work_style": {"score": 10, "confidence": 0.9, "evidence": "..."},
    "energy": {"score": 6, "confidence": 0.8, "evidence": "..."}
  }
}
```

**Key mapping:**
- `values_alignment` → `mission`
- `builder_orientation` → `role`
- `relational_fit` → `culture`
- `domain_fluency` → `skill`
- `work_style_compatibility` → `work_style`
- `energy_match` → `energy`

**Also fixed:**
- Converted route from Pages Router to App Router syntax
- Route now parses Claude's JSON response instead of returning raw API envelope
- Added support for both scorer format (`systemPrompt`, `roleLens`, `candidateInput`) and legacy format (`system`, `userMessage`)
- Changed model from `claude-opus-4-7` to `claude-sonnet-4-6` (per model selection guidelines)

---

## [2026-04-30] PDF Filename & Demo Mode Fixes

### lens-app 2026.04.30-m

**Title case PDF filenames:**

Filenames now use professional title case formatting: `Maria_Gutierrez_Lens_Full_2026.04.30-m.pdf` instead of lowercase `maria_gutierrez_lens_full_...`.

**Changes:**
- PremiumLensDocument, RecruiterBrief, LensIntake: Name words capitalized and joined with underscores
- `_Lens_Full_` and `_Lens_Brief_` now capitalized

---

### lens-app 2026.04.30-k

**Cmd+P browser print now uses custom filename:**

Previously only the React "Save as PDF" button set the filename. Now both methods work because document.title is set when the modal mounts (not on beforeprint event which had timing issues).

---

### lens-app 2026.04.30-h, -i, -j

**PDF filename fixes:**
- Added 100ms delay before window.print() to ensure title is set (-h)
- Full name in filename instead of first name only via `personNameOverride` prop (-i)
- Added beforeprint/afterprint listeners for Cmd+P support (-j, later replaced by mount approach in -k)

---

### lens-app 2026.04.30-g

**Fixed blank RecruiterBrief PDF:**

Print CSS was hiding modal container with `[style*="position: fixed"]`, which also hid nested content. Fixed by adding `data-recruiter-brief-modal` attribute and making modal `position: static` for print instead of hiding.

---

### lens-app 2026.04.30-f

**PDF filenames now use build ID instead of date:**

Previously PDFs were saved with date-based filenames like `sarah_chen_lens_full_2026.04.30.pdf`. Now they use the build ID for better traceability: `sarah_chen_lens_full_2026.04.30-f.pdf`.

**Changes:**
- PremiumLensDocument: Added `buildId` prop, updated `handlePrint` to use buildId
- RecruiterBrief: Already had buildId support from earlier fix
- LensIntake: Passes BUILD_ID to both PremiumLensDocument components
- RecruiterCandidateIntake: Passes BUILD_ID to PremiumLensDocument

**Also in this session (builds 2026.04.30-a through -e):**
- Demo mode enabled via hardcode in `config/demo-candidates.js` (workaround for Vercel env var root directory issue)
- Fixed blank PDF issue: Print CSS was using `body * { visibility: hidden }` pattern that didn't work with `position: absolute` — changed to `position: static` and removed visibility pattern
- RecruiterBrief filename convention implemented: `{user_name}_lens_brief_{buildId}.pdf`

---

## [2026-04-28] Premium Lens Document Feature

### lens-app 2026.04.28-f

**Synced preview with PDF - both now use PremiumLensDocument format:**

The done phase preview was showing the old "Lens Report" format (numbered sections like "01 SKILLS & EXPERIENCE") while the PDF used the new 8-page premium layout. Now both are in sync.

**Changes:**
- Added `inline` prop to PremiumLensDocument for preview mode (no modal overlay)
- Inline preview shows: cover (LENS wordmark, name, date, essence), radar chart, 6 dimension previews with signal bars, footer teaser
- Removed unused LensReport import and parsedLens memo from LensIntake.jsx
- Preview shows truncated content; full document available in PDF

**User flow:**
1. User sees inline premium preview on done phase
2. User clicks "Download PDF"
3. Premium synthesis runs (generating metadata for radar chart, key phrases)
4. Modal opens with full 8-page document
5. User prints to PDF

---

### lens-app 2026.04.28-e

**Fixed PDF printing app content instead of premium document:**

Root cause: Print CSS selector `body > div[style*="position: fixed"]` was too specific and didn't hide the rest of the app. The done phase UI, navigation, and lens report content were all printing alongside the premium document.

**Fix:**
- Added `data-premium-modal` attribute to modal wrapper
- Print CSS now hides ALL `body > *` children first
- Then explicitly shows only `[data-premium-modal]` and its contents
- Toolbar hidden via `.no-print` class (already present)

---

### lens-app 2026.04.28-d

**Wired premium metadata and full 8-page Swiss Style layout:**

Root cause fix: `generatePremiumDoc()` never called `/api/synthesize-premium`, so metadata was always null. Cover page quotes, radar chart, and signal bars were rendering empty.

**Data flow fix:**
- `generatePremiumDoc()` now calls `/api/synthesize-premium` FIRST
- Stores metadata via `setPremiumMetadata()`
- Passes premium lens + metadata to subsequent API calls
- PremiumLensDocument receives populated metadata object

**Full 8-page layout (Swiss Style):**
| Page | Content |
|------|---------|
| 1 | Cover: LENS wordmark, name, date, essence statement in italics |
| 2 | Identity Portrait: SVG radar chart (6 dimensions), key phrases as pills |
| 3-5 | Dimension Deep Dives: signal bars, narrative, pull quotes |
| 6 | Resume Enhancements (conditional): lens vs resume comparison cards |
| 7 | Next Steps: grouped by timeframe (this_week, in_conversations, ongoing) |
| 8 | About Your Lens: static explainer content |

**Design tokens:**
- `#D93025` red, `#2D6A2D` green, `#E8590C` orange
- `#F0F0F0` container bg, `#EEEEEE` hairline (0.5px)
- Zero border-radius everywhere
- Monospace for scores, system sans-serif for text

---

### lens-app 2026.04.28-c

**UI polish: consolidated PDF buttons**

- Done phase button: "Download PDF" (was "Download Premium PDF")
- Modal button: "Save as PDF" (unchanged)
- Reduces confusion from having two differently-labeled PDF actions

---

### lens-app 2026.04.28-b

**Fixed print-to-PDF blank output and simplified UI:**

- Fixed print CSS that was hiding all content (missing element targeting)
- Removed Report/Markdown tabs from done phase
- Single "Download Premium PDF" button replaces old button cluster
- Print styles now properly preserve colors and remove overlay

---

### lens-app 2026.04.28-a

**Added premium multi-page PDF deliverable with actionable guidance:**

New "Premium PDF with next steps" button in the done phase generates an enhanced document including:
- Cover page with key phrases and signal strength visualization
- Full Lens narrative (all 6 sections)
- 3 actionable next steps with sub-tasks and timelines
- Resume alignment suggestions (when resume uploaded)

**New API routes:**
| Route | Model | Purpose |
|-------|-------|---------|
| `/api/synthesize-premium` | Sonnet | Lens + structured metadata JSON |
| `/api/next-steps` | Haiku | 3 actionable career steps |
| `/api/resume-suggestions` | Haiku | Resume revision suggestions |

**Architecture:**
- All changes additive — existing Report/Markdown tabs unchanged
- Premium metadata appended to synthesis via opt-in flag
- Print-to-PDF via browser (no new dependencies)
- Swiss Style design tokens throughout

**Files Created:**
- `app/api/_prompts/next-steps.js`
- `app/api/_prompts/resume-suggestions.js`
- `app/api/next-steps/route.js`
- `app/api/resume-suggestions/route.js`
- `app/api/synthesize-premium/route.js`
- `app/components/PremiumLensDocument.jsx`

**Files Modified:**
- `app/api/_prompts/synthesis.js` (added `PREMIUM_METADATA_INSTRUCTIONS`, `parsePremiumSynthesisResponse()`)
- `app/components/LensIntake.jsx` (premium state, button, modal)

---

## [2026-04-24] Streaming API for Synthesis Timeouts

### lens-app 2026.04.24-a

**Fixed synthesis timeouts caused by 58s Vercel limit:**

Morgan Cohen hit 4 consecutive 500 errors at 02:04-02:08 AM. Root cause: Claude API latency exceeded the hard 58s timeout budget.

**Solution:** Switched `/api/synthesize` from fetch-based calls to Anthropic SDK streaming.

| Before | After |
|--------|-------|
| `fetch()` with `AbortSignal.timeout(58s)` | `anthropic.messages.stream()` |
| Hard 58s timeout cliff | 120s budget (streaming keeps connection alive) |
| Timeout kills request mid-generation | Chunks flow continuously |

**Changes:**
- Added `@anthropic-ai/sdk ^0.52.0`
- Replaced `callAnthropic()` with `callAnthropicStreaming()`
- Added AbortController with 120s timeout protection
- Added stream error handling with proper cleanup

**Files Modified:**
- `app/api/synthesize/route.js` (v1.1 → v1.2)
- `app/components/LensIntake.jsx` (build bump)
- `package.json`

---

## [2026-04-24] Plural-Aware Generate Button & Success Path

### lens-app 2026.04.24-f

**Generate button and success path now reflect roster count:**

| sessionCount | Static button | Loading label | Post-generation header |
|---|---|---|---|
| 1 | Generate Candidate Session | Generating session… | Session created |
| N (≥2) | Generate N Candidate Sessions | Generating N sessions… | N sessions created |

**Logic:** `sessionCount = max(1, validCandidates.length)` — 0 cards creates 1 session (legacy path)

**ConfirmationPhase updates:**
- Header: "Session created" → "N sessions created"
- Description: "A tailored discovery session..." → "N tailored discovery sessions..."

**Files Modified:**
- `app/components/RecruiterRoleForm.jsx` (v2026.04.24-f)

---

## [2026-04-24] Continue Button Counter Enhancement

### lens-app 2026.04.24-e

**Continue button now shows semantic counts:**

| Role docs | Candidates | Button label |
|-----------|-----------|--------------|
| 0 | 0 | Continue without files |
| N | 0 | Continue with N document(s) |
| 0 | M | Continue with M candidate(s) |
| N | M | Continue with N document(s) and M candidate(s) |

- Candidates counted = cards with valid resume (not individual files within them)
- Singular/plural handled: "1 document" vs "2 documents", "1 candidate" vs "3 candidates"
- Updates live as recruiter adds/removes uploads or cards

**Files Modified:**
- `app/components/RecruiterRoleForm.jsx` (v2026.04.24-e)

---

## [2026-04-24] R→C Session Fan-Out Hardening

### lens-app 2026.04.24-d (API Hardening)

**Fixes per fan-out build brief:**

**rc-session-create:**
- Empty `candidates: []` now creates single-link session (was erroring)
- Apply `truncateField(100K)` to roleContext and sessionConfig
- Added `typecast: true` to legacy path

**rc-session-fetch:**
- Added null-content safety check: if roleContext is null (after retention purge), return 410 instead of partial data
- Same for null sessionConfig

**RecruiterCandidateIntake:**
- Unified error message for 404/410: "This link has expired or is no longer valid. Please contact the recruiter who shared it."

**Files Modified:**
- `app/api/rc-session-create/route.js`
- `app/api/rc-session-fetch/route.js`
- `app/components/RecruiterCandidateIntake.jsx`
- `app/components/RecruiterRoleForm.jsx` (v2026.04.24-d)

---

## [2026-04-24] Per-Candidate Cards: Validation & Empty Default State

### lens-app 2026.04.24-c (Validation + Two-Path UX)

**Fixes from build brief:** Restructures per-candidate cards to support two paths:
1. **Fan-out path:** Recruiter adds N candidate cards (each requires resume) → generates N links
2. **Single-link legacy path:** Recruiter adds 0 cards → generates 1 link → candidate uploads own resume

**UI Changes:**
- Default state: 0 visible cards + "Add candidate" button (not 1 empty card)
- Resume marked as REQUIRED with red asterisk
- Copy updated: "Skip this section to share a single link where the candidate uploads their own resume"
- Remove button always visible on cards (not conditional on >1 cards)

**Validation:**
- Empty roster (0 cards) → valid, proceeds to single-link path
- Card without resume → inline error "Resume required, or remove this candidate" + blocks Continue
- No silent filtering — user must explicitly resolve incomplete cards
- Validation errors clear on resume upload or card removal

**SessionStorage:**
- Only valid cards (with resumeText) serialized to storage
- Empty array = legacy single-link path

**Bug Fix (Opus P1):** ConfirmationPhase now uses `validCandidates.length` for display counts instead of raw `candidateRoster.length`

**Files Modified:**
- `app/components/RecruiterRoleForm.jsx` (v2026.04.24-c)

---

## [2026-04-24] Candidate Fan-Out v2: Per-Candidate Cards with Supporting Docs

### lens-app 2026.04.24-b (Per-Candidate Cards + Supporting Docs)

**Breaking Change from v1:** Restructures candidate roster from bulk multi-file upload to per-candidate cards. Each card is a self-contained unit with resume + supporting documents.

**UI Changes:**
- Removed "Candidate materials to pre-load" category from role documents (predates fan-out)
- 1 empty candidate card visible by default
- Each card contains:
  - Name input (auto-extracted from resume or fallback "Candidate N")
  - Email input (optional)
  - Resume upload (single file)
  - Supporting Documents (multi-file: LinkedIn, portfolio, reference letters, recruiter notes)
  - Remove button (disabled if only 1 card)
- "Add another candidate" button to create new cards
- Empty cards (no resume) are filtered out on Continue

**Data Shape:**
```javascript
// sessionStorage: recruiter-candidate-roster
[{
  name: "Jane Doe",
  email: "jane@example.com",
  resumeText: "...",
  resumeFilename: "jane-doe-resume.pdf",
  supportingDocs: [{ filename: "linkedin.pdf", text: "..." }]
}]
```

**API Changes:**
- `/api/rc-session-create` now accepts `supportingDocsText` in candidates array
- `/api/rc-session-fetch` returns `supportingDocsText` in candidate object
- New Airtable field: `Candidate Supporting Docs` (fld4xkxtIO7mnPm1U)

**Prompt Injection:**
- Resume: 8K char budget in system prompt
- Supporting docs: 4K char budget (supplementary context)

**Migration:** Old roster data automatically migrated (adds supportingDocs: [], renames fileName→resumeFilename)

**Files Modified:**
- `app/components/RecruiterRoleForm.jsx` (v2026.04.24-b)
- `app/components/RecruiterCandidateIntake.jsx`
- `app/api/rc-session-create/route.js`
- `app/api/rc-session-fetch/route.js`
- `app/api/_prompts/rc-discovery.js`

---

## [2026-04-24] Candidate Fan-Out v1 (superseded by v2)

### lens-app 2026.04.24-a (Bulk Resume Upload)

Initial implementation with multi-file bulk upload. Superseded by v2 per-candidate card structure.

**Part 1: Candidate Roster Upload (2026.04.24-a)**
- New "Candidates (optional)" section in RecruiterRoleForm UploadPhase
- Multi-file PDF/DOCX upload using existing extraction pipeline
- Per-candidate row with editable name/email fields
- Auto-extracts candidate name from resume first line (heuristic)
- Auto-extracts email via regex
- Persists to sessionStorage under `recruiter-candidate-roster`
- Privacy notice: resumes stored for 30 days after link generation

**Part 2: Fan-Out Session Create**
- `/api/rc-session-create` now accepts `candidates[]` array
- Creates N Airtable rows (one per candidate) with shared role context
- Returns `{ sessions: [{ token, url, candidateName }] }`
- Backward compatible: no `candidates` key → legacy single-link path
- New Airtable fields: Candidate Name, Candidate Resume, Candidate Email

**Part 2: Per-Candidate Hydration**
- `/api/rc-session-fetch` returns `candidate: { name, resumeText, email }`
- RecruiterCandidateIntake hydrates candidate data on session load
- Candidate resume passed to discovery API for personalized conversation
- Intro screen shows "Session prepared for: {candidate name}"

**ConfirmationPhase UI Updates:**
- Non-empty roster → "GENERATE N CANDIDATE LINKS" button
- Roster list with per-link Copy buttons
- "Copy all links" bulk affordance
- Empty roster → preserves single-link path

**Note:** Requires 4 new Airtable fields in R→C Sessions table (`tbleGAd6aEFbDm5nK`):
- `Candidate Name` (singleLineText) - flddzuiohWbL8ew3p
- `Candidate Resume` (longText, 100K char limit) - fldtcb8BLS7WynjiT
- `Candidate Email` (singleLineText) - fldGCjvYTycxIRvgy
- `Candidate Supporting Docs` (longText) - fld4xkxtIO7mnPm1U

---

## [2026-04-24] JSON Parsing Reliability Fix

### generate-session Route Fix
Fixes JSON parsing failures in `/api/generate-session` where model output with literal newlines in strings caused parse errors despite successful completion (stop_reason: "end_turn").

**Root Cause:** Model occasionally outputs literal `\n` characters inside JSON string values instead of escaped `\\n`. Previous fix (22a2f54) added escape handling but had a cascade bug where later repair attempts operated on the original text instead of cascading from repaired versions.

**Fixes Applied (5547fe2):**
- Repair cascade now flows: `cleanText → escapedText → repairedText → truncated`
- Added `\f` (form feed) and `\b` (backspace) control character escaping
- Previous attempts built from `cleanText` discarding earlier repairs

**Files Modified:**
- `app/api/generate-session/route.js`

---

## [2026-04-22] R→C Shareable Candidate Links

### lens-app 2026.04.22-f/g (Shareable Session Links)
Adds shareable link generation for R→C workflow. Recruiters can generate a unique URL to share with candidates, allowing candidates to complete the discovery flow without the recruiter being present.

**New API Routes:**
- `/api/rc-session-create` — POST creates session in Airtable, returns unique 10-char token + URL
- `/api/rc-session-fetch` — GET retrieves session by token, handles 404/410 for invalid/expired

**Airtable Table:** R→C Sessions (`tbleGAd6aEFbDm5nK`)
- Fields: Session Token, Recruiter Role Context (JSON), Session Config (JSON), Expires At (30 days), Claimed At, Recruiter Name

**RecruiterRoleForm.jsx (2026.04.22-f):**
- ConfirmationPhase now includes "GENERATE CANDIDATE LINK" button
- Copy to clipboard with "COPIED" feedback
- Swiss Style UI with RED border accent

**RecruiterCandidateIntake.jsx (2026.04.22-g):**
- URL parameter hydration: reads `?session=xxx` from URL
- Falls back to sessionStorage for existing flow
- Error states for 404 (invalid link) and 410 (expired link)

**Files Created:**
- `app/api/rc-session-create/route.js`
- `app/api/rc-session-fetch/route.js`

**Files Modified:**
- `app/components/RecruiterRoleForm.jsx`
- `app/components/RecruiterCandidateIntake.jsx`

---

## [2026-04-15] Team Identity Validation Experiment

### lens-app 2026.04.15-p (Team Identity Form)
Adds Team Identity Validation experiment per James Pratt spec (v1.0). Tests core hypothesis: can AI synthesize individual inputs into a team identity portrait that teams recognize as accurate?

**New Route:** `/team-validation`
- 4-phase flow: Intro → Values → Work Style → Team Dynamics → Complete
- Team code parameter supports `?team=CODE` URL pattern for shareable links
- 10-minute target completion time

**Form Sections:**
1. **Values** — Select 5 from 40 curated values + write behavioral evidence for each
2. **Work Style** — 5 forced-choice pairs (pace, collaboration, problems, communication, structure)
3. **Team Dynamics** — Two open-text questions (best thing, one thing to change)

**New API Routes:**
- `/api/team-submit` — Stores submissions to Airtable (Team Validation table)
- `/api/team-synthesize` — Fetches team submissions, generates Team Identity Portrait

**New Airtable Table:** Team Validation (`tblfxCLxn4GPD9C4f`)
- Fields: Name, Team Code, Values (JSON), Work Style (JSON), Best Thing, One Thing to Change, Submitted At, Synthesized

**Team Identity Portrait Output (4 sections):**
1. SHARED VALUES — Clustered values with aggregated behavioral evidence
2. WORK STYLE SIGNATURE — Aggregate profile with consensus/divergence noted
3. TEAM DYNAMICS — Synthesized from open-text responses
4. THE TENSION MAP — Meaningful divergences (values, styles, perception gaps)

**Files Created:**
- `app/team-validation/page.js`
- `app/components/TeamValidationForm.jsx`
- `app/api/team-submit/route.js`
- `app/api/team-synthesize/route.js`
- `app/api/_prompts/team-synthesis.js`

---

## [2026-04-15] Replace Scorecard with Lens Document (P0 Fix)

### lens-app 2026.04.15-n (Lens Document Output)
Fixes deviation from brief: R→C Step 4 now produces a **Lens document** (markdown + YAML) instead of a JSON scorecard. Per the brief: "The Lens is a conversation catalyst, not an assessment verdict."

**Key Changes:**
1. **rc-synthesis.js** — Complete rewrite. Now produces 7-section Lens document (standard 6 + Role Fit section) instead of JSON scorecard. Role Fit section addresses alignment, productive tension, and open questions without scoring/verdicts.

2. **rc-synthesize/route.js** — Returns `{ lens: markdownText }` instead of `{ scorecard: jsonObject }`. Added streaming for timeout avoidance and sensitivity filtering.

3. **RecruiterCandidateIntake.jsx** — Complete phase now renders Lens document with inline markdown parser. Displays stats bar from YAML frontmatter, section headers, and prose. "Copy Lens Markdown" replaces "Copy Scorecard JSON".

**Why this matters:**
- Scorecard implied assessment verdict (fit score 1-5, "Advance/Do Not Advance")
- Lens document is a conversation catalyst that both candidate and recruiter can use
- Candidate owns their Lens document — it's their professional identity, not an evaluation
- Role Fit section gives language for discussing fit without reducing to a score

**Files Modified:**
- `app/api/_prompts/rc-synthesis.js` — Full rewrite
- `app/api/rc-synthesize/route.js` — Full rewrite
- `app/components/RecruiterCandidateIntake.jsx` — State, synthesis, and display changes

---

## [2026-04-15] Candidate Discovery UX Fixes

### lens-app 2026.04.15-m (UX Polish)
Fixes three UX issues identified during candidate discovery testing:

1. **Consistent section titles** — Section labels now display human-readable titles (e.g., "Work Style") instead of raw IDs (e.g., "work_style"). Added `SECTION_LABELS` mapping with fallback to auto-convert snake_case IDs to Title Case.

2. **Sections end with acknowledgement** — Updated `rc-discovery.js` prompt to explicitly instruct AI to end sections with acknowledgement/reflection statements, NOT questions. Candidates can't respond after `[SECTION_COMPLETE]`, so ending on a question was confusing.

3. **Visual distinction for user messages** — User messages now display with black background (`#1A1A1A`) and white text, matching the C→C intake pattern. AI messages remain light gray (`#fafafa`) with dark text.

**Files Modified:**
- `app/components/RecruiterCandidateIntake.jsx`: Added `SECTION_LABELS` mapping, `formatSectionLabel()` helper, user message styling
- `app/api/_prompts/rc-discovery.js`: Updated SECTION COMPLETION instructions to require acknowledgement

---

## [2026-04-15] Candidate Discovery Fork (R→C POC Step 4)

### lens-app 2026.04.15-a (Recruiter Candidate Intake)
Adds the candidate discovery conversation fork for R→C flow. Consumes `session-config` from sessionStorage (created by Step 3) and runs dynamic sections instead of hardcoded 8 sections.

**Architecture Decision:** FORK (not parameterize)
- System prompts fundamentally different (R→C context-aware, includes role context)
- Sections dynamic from session-config (foundation + tailored) vs. hardcoded 8
- Synthesis output different (JSON scorecard vs. Lens document)
- Preserves existing C→C flow without risk of regression

**New Route:** `/recruiter/candidate`
- Phase flow: Loading → Intro → Discovery → Synthesis → Complete
- Loads session-config from sessionStorage on mount
- Shows role context header (title, company) throughout discovery
- Dynamic progress bar based on section count
- Generates scorecard on completion

**New API Routes:**
- `/api/rc-discover` — R→C discovery conversation endpoint
  - Model: claude-sonnet-4-20250514, max_tokens 1000
  - Accepts dynamic section config with signals/red flags
  - Actions: greeting, summarize, regular conversation
  - Dynamic question limits (foundation: 2, tailored: 3-4)
- `/api/rc-synthesize` — Scorecard generation endpoint
  - Model: claude-sonnet-4-20250514, temp 0.3, max_tokens 4000
  - Returns structured JSON scorecard with dimension scores
  - Includes overall assessment, recommendation, recruiter notes

**New System Prompts (server-side only):**
- `app/api/_prompts/rc-discovery.js`
  - RC_SYSTEM_BASE: R→C-specific coaching instructions
  - FOUNDATION_CONTEXTS: Default openers for foundation sections
  - buildRCSystemPrompt(): Includes role context, signals, red flags
  - getSectionOpeningPrompt(): Dynamic section openers
- `app/api/_prompts/rc-synthesis.js`
  - RC_SYNTHESIS_SYSTEM_PROMPT: Scorecard generation instructions
  - buildRCSynthesisUserContent(): Formats section data for synthesis

**Scorecard Output Schema:**
```json
{
  "overallAssessment": { "fitScore": 1-5, "fitLabel": "...", "recommendation": "..." },
  "dimensionScores": [{ "dimensionId": "...", "score": 1-5, "signalStrength": "...", "evidence": "..." }],
  "recruiterNotes": { "suggestedProbes": [...], "contextForClient": "...", "riskFactors": [...] }
}
```

**State Persistence:**
- localStorage key: `RC_CANDIDATE_INTAKE_STATE`
- Session recovery if same session-config sessionId matches
- Cleared on completion

**Files Created:**
- `app/recruiter/candidate/page.js`: Route entry point
- `app/components/RecruiterCandidateIntake.jsx`: Main component (~800 lines)
- `app/api/rc-discover/route.js`: Discovery API
- `app/api/rc-synthesize/route.js`: Synthesis API
- `app/api/_prompts/rc-discovery.js`: Discovery prompts
- `app/api/_prompts/rc-synthesis.js`: Synthesis prompts

---

## [2026-04-14] Session Generation Engine (R→C POC Steps 1-3)

### lens-app 2026.04.14-g (Dimension Extraction & Session Generation)
Adds the session generation engine that transforms recruiter role context into a tailored candidate discovery session. Builds on the recruiter role form (2026.04.14-f).

**New API Routes:**
- `/api/extract-dimensions` — Extracts 4-8 role-specific dimensions from role context
  - Model: claude-sonnet-4-20250514, temp 0.3, max_tokens 4000
  - Returns dimensions with importance levels, signals, red flags
  - Includes fallback dimensions for thin context with warning
- `/api/generate-session` — Generates full session config from reviewed dimensions
  - Model: claude-sonnet-4-20250514, temp 0.5, max_tokens 6000
  - Returns session config with foundation + tailored layers
  - Accepts optional candidate materials for pre-loaded adjustments

**New System Prompts (server-side only):**
- `app/api/_prompts/extract-dimensions.js` — Dimension extraction prompt
- `app/api/_prompts/generate-session.js` — Session config generation prompt

**UI Changes (RecruiterRoleForm.jsx):**
- New "Dimensions" phase (Step 4 of 4) after Review
- DimensionReviewPhase component with:
  - Dimension cards with importance badges (click to cycle)
  - Inline label editing
  - Reorder dimensions (up/down buttons)
  - Add custom dimensions
  - Remove dimensions (minimum 2)
  - Dynamic time estimate display
- Updated progress bar: ["Role", "Documents", "Review", "Dimensions"]
- Extraction loading state with spinner
- Session generation with "Generating session..." state

**Output Storage:**
- `sessionStorage["recruiter-role-context"]` — Role context JSON
- `sessionStorage["session-config"]` — Generated session config JSON

**Files Created:**
- `app/api/_prompts/extract-dimensions.js`
- `app/api/extract-dimensions/route.js`
- `app/api/_prompts/generate-session.js`
- `app/api/generate-session/route.js`

**Files Modified:**
- `app/components/RecruiterRoleForm.jsx` (~+300 lines)

---

## [2026-04-14] Recruiter Role Input Form (R→C POC Step 1)

### lens-app 2026.04.14-f (Recruiter Role Form)
Adds recruiter-facing role input form at `/recruiter` route — Step 1 of the R→C (Recruiter to Candidate) POC.

**New Route:** `/recruiter`
- 4-phase flow: Intro → Role Context → Document Upload → Review & Confirm
- International Style design matching candidate intake form exactly
- Session persistence to localStorage (separate key from candidate form)
- Outputs structured role context object to sessionStorage for downstream consumption

**Form Fields (Role Context):**
- Required: Role title, Company, Stakeholders, 12-month objective, Top 3-5 priorities (ranked)
- Optional: Compensation, Location, Company stage, Last person in seat, Failure mode, Recruiter-only notes

**Document Upload Categories:**
- Job description (single file)
- Stakeholder notes (multiple)
- Team/org context (multiple, including images)
- Candidate materials to pre-load (multiple)
- Anything else (multiple, any type)

**Privacy Features:**
- Expandable "How we handle your data" section
- Clear messaging: no server storage, TLS encryption, session-scoped documents
- Recruiter-only notes field (never injected to candidate AI)

**Files Created:**
- `app/recruiter/page.js`: Route entry point
- `app/components/RecruiterRoleForm.jsx`: Main component (~950 lines)

---

## [2026-04-14] Session Telemetry & Content Budget Fixes

### lens-app 2026.04.14-e (Per-File Extraction Limit Increase)
Increases per-file text extraction limit from 30K to 50K characters.

**Problem:** DISC assessments and other text-heavy documents were being truncated at extraction (30K chars) before the content budget could prioritize them.

**Fix:** Increased `MAX_CHARS` in `extractText()` from 30,000 to 50,000 characters per file. Content budget (60K total) still handles cross-file prioritization.

---

### lens-app 2026.04.14-d (Session Telemetry Instrumentation)
Adds comprehensive session telemetry to Airtable for analytics on user behavior, timing, and abandonment.

**New Airtable Table:** "Lens Sessions" (tblNJ7gBSIlAEhstI) with 30 fields:
- Session identity: UUID, name, build version, user agent, IP address (server-side)
- Lifecycle: start/end timestamps, total duration, status (Completed/Abandoned/Error)
- Phase timestamps: Materials, Status, Context, Discovery, Synthesis (start/end each)
- File metrics: count, pre-truncation chars, post-truncation chars, truncation flag, per-file breakdown
- Discovery timing: per-section start/end/duration/message count
- Error tracking: reflection result, API error log

**New API Route:** `/api/log-session`
- Server-side proxy for session telemetry
- Captures IP address from request headers (x-forwarded-for, x-real-ip)
- Fire-and-forget writes to Airtable

**Client Instrumentation:**
- Session UUID generated on mount
- Phase transitions tracked automatically
- File stats captured from content budget function
- Discovery section timing reported as sections complete
- Synthesis start/end tracked with success flag
- Abandonment detection via beforeunload + visibilitychange
- Uses sendBeacon for reliability on page unload

**Files Changed:**
- `LensIntake.jsx`: Telemetry state, phase tracking, callbacks, beforeunload handler
- `api/log-session/route.js`: New route for Airtable writes
- `buildFileContextWithBudget()`: Now returns { text, stats } for telemetry capture

---

### lens-app 2026.04.14-c (Synthesis Timeout Fix)
Fixes synthesis timeout when users upload many files.

**Problem:** Synthesis route times out (58s Vercel limit) when rawDocumentText from uploaded files is too large. Combined with sectionData from all 8 discovery sections, the model can't complete within timeout.

**Fix:**
- Truncate `rawDocumentText` to 8K chars before synthesis (sectionData already contains extracted insights)
- Pass truncated text to validation as well so it only flags gaps from content synthesis actually saw
- Without this consistency fix, validation could flag gaps that re-synthesis could never fix

**Files Changed:**
- `synthesize/route.js`: Added MAX_RAW_TEXT_FOR_SYNTHESIS = 8000, truncation logic at lines 130-138, validation asymmetry fix at line 224-227
- `LensIntake.jsx`: BUILD_ID bump

---

### lens-app 2026.04.14-b (Content Budget Fix - Slice Bug)
Fixes slice bug in content budget logic that allowed budget to be exceeded.

**Bug:** `slice(0, negative)` doesn't truncate to zero - it removes chars from the end. When remaining budget was small (e.g., 18 chars), `slice(0, 18-50)` = `slice(0, -32)` returned 29968 chars instead of truncating.

**Fix:**
- Use `Math.max(0, remainingBudget - markerLength)` to prevent negative slice indices
- Added 200-char minimum threshold - skip files entirely if budget nearly exhausted
- Explicit truncation flag tracking
- Console logging when files are skipped due to budget

---

### lens-app 2026.04.14-a (Content Budget for Heavy Uploads)
Fixes API 400 errors when users upload large amounts of content (8+ files, coaching transcripts, assessments).

**Problem:**
- `/api/discover` reflection call sends all extracted file text concatenated with no size cap
- Heavy uploaders blow past Claude's input token limit causing 400 errors
- Confirmed repro: resume + DISC assessment + IAM framework + writing sample + 4 coaching transcripts

**Root Cause:** Combined extracted text from uploaded files exceeds model context window. No content budget between file extraction and API call.

**Fix Part 1 - Content Budget:**
- Total cap: 60K characters (~15K tokens)
- Priority order for budget allocation:
  1. Resume (densest signal-per-character)
  2. Assessments & frameworks (structured self-knowledge)
  3. Writing samples (shows thinking and communication style)
  4. Other (coaching transcripts, letters, decks)
  5. LinkedIn (largely redundant with resume, fill last)
- Files exceeding remaining budget are truncated with `[content truncated for length]` marker
- Console logging shows per-file character counts for debugging

**Fix Part 2 - Upload Guidance Copy:**
Added two italicized guidance lines at top of Materials (Phase 2) upload step:
- "The AI reads your materials closely — a focused selection of 15–20 pages of text works better than uploading everything. Your resume plus one or two of your strongest pieces is plenty."
- "Working with images or visual portfolios? The AI extracts text, not visuals — keep image files under 5MB each. You'll have a chance to describe your creative work during the conversation."

**Files Changed:**
- `LensIntake.jsx`: Added `buildFileContextWithBudget()` helper, priority constants, upload guidance copy
- `discover/route.js`: Increased MAX_UPLOAD_SUMMARY_LENGTH from 30K to 60K, added content size logging

---

## [2026-04-12] Integration Spec Addendum v1.1

### lens-app 2026.04.12-n (Faster Synthesis Settings)
Reduces MAX_TOKENS and temperature to speed up synthesis and avoid timeouts.

**Changes:**
- MAX_TOKENS: 8000 → 6000 (lens typically uses ~4000 tokens)
- TEMPERATURE: 0.7 → 0.5 (faster sampling)

Should reduce synthesis time by 10-15s to stay under Vercel's 60s limit.

---

### lens-app 2026.04.12-m (Natural Rewrites Instead of Bracketed Placeholders)
Fixes sensitivity filter to produce fluent prose instead of code-artifact-style brackets.

**Problem:**
- Post-processing filter replaced clinical labels with `[work style note]`, `[process orientation]`, etc.
- These bracketed placeholders appeared in final PDF output — unprofessional

**Fix:**

1. **Updated synthesis prompt** with explicit SENSITIVITY RULES section:
   - Never write bracketed placeholders
   - Never name neurodivergence diagnoses (ADHD, ASD, dyslexia)
   - Never name assessment frameworks (DISC, Myers-Briggs)
   - Instead: describe behavioral patterns in natural professional language
   - Professional certifications (ISO, SOC-2, HIPAA) are NOT sensitive — keep them

2. **Updated post-processing filter** strategy:
   - Instead of replacing terms with brackets, remove entire sentences containing sensitive terms
   - The surrounding prose flows naturally without artifacts
   - Added bracket patterns to blocklist in case model generates them despite instructions

**Examples from prompt:**
- WRONG: "Eric has ADHD" or "Eric has [work style note]"
- RIGHT: "Eric thrives with quick feedback loops and visible impact — long-term projects without milestones leave him spinning"

---

### lens-app 2026.04.12-l (Timeout Budget Increase)
Increases synthesis timeout budget from 55s to 58s.

**Problem:** Synthesis taking 45-55s, hitting the 55s budget limit and causing timeouts.

**Fix:** Push REQUEST_DEADLINE_MS from 55000 to 58000 (Vercel Pro allows 60s).

---

### lens-app 2026.04.12-k (Hard Post-Processing Filter)
Adds code-level filter to catch clinical labels that slip through prompt-based filtering.

**Problem:**
- Build 2026.04.12-j's timeout fix caused validation to be skipped
- Without validation, ADHD label appeared in Lens output: "Eric has ADHD, which means..."
- Model-based prohibition in synthesis prompt is not 100% reliable

**Solution: Belt-and-suspenders approach**
Added `sanitizeLensOutput()` function that runs AFTER synthesis, BEFORE returning:

1. **Sentence blockers** — Removes entire sentences that reference clinical labels:
   - "Eric has ADHD, which means..." → [removed entirely]
   - "Their ADHD shapes..." → [removed entirely]

2. **Term replacements** — Catches any remaining blocked terms:
   - ADHD, ADD, attention deficit
   - anxiety, depression, bipolar, OCD
   - DISC, Myers-Briggs, MBTI, Enneagram
   - Peacemaker, Dominance, Influencing, Steadiness, Compliance

3. **Logging** — Console warns when filter catches violations for debugging

**Why this works:**
- Regex-based filtering is deterministic, unlike model-based instructions
- Runs regardless of timeout budget (validation can be skipped, this cannot)
- Violations are logged so we can track model compliance over time

---

### lens-app 2026.04.12-j (Synthesis Timeout Fix)
Fixes synthesis timeout errors by adding time budget checks before validation/re-synthesis.

**Root Cause (from Vercel logs):**
- 3 timeout errors on `/api/synthesize` (500 status)
- Chain of synthesis → validation → re-synthesis exceeds 55s budget
- Initial synthesis can take 30-40s, validation 10-15s, re-synthesis another 30-40s
- Total: 70-95s, exceeding Vercel Pro's 60s limit

**Fixes:**
1. **Added `MIN_VALIDATION_BUDGET_MS` (20s)** — Skip validation if less than 20s remaining after synthesis
2. **Added re-synthesis budget check (15s)** — Skip re-synthesis if not enough time remaining
3. **Reduced `VALIDATION_MAX_TOKENS`** — From 2000 to 1500 (gap report doesn't need as many tokens)
4. **Added timing logs** — Logs remaining budget at each decision point for debugging

**Behavior:**
- If synthesis takes <35s: full validation + re-synthesis if needed
- If synthesis takes 35-40s: validation runs but re-synthesis skipped if issues found
- If synthesis takes >35s: validation skipped entirely, returns original lens
- This graceful degradation prevents timeouts while preserving quality when time permits

---

### lens-app 2026.04.12-i (Context Acknowledgment Sensitivity Fix + Opus Fixes)
Fixes DISC/assessment labels appearing in "Here's what I see" overview page, plus Opus review fixes.

**Root Cause:**
- Context Acknowledgment ("Here's what I see") is generated by `/api/discover?action=reflect`
- This uses a separate `reflectionSystemPrompt` that had NO sensitivity filtering
- The synthesis prompt was filtered, but the discovery-phase overview was not

**Fix:**
- Added CLINICAL LABEL PROHIBITION block to `reflectionSystemPrompt` in `/api/discover/route.js`
- Added reminder to greeting contextNote when uploadSummary is passed
- Same blocklist: ADHD, DISC, Myers-Briggs, Peacemaker, etc.

**Opus Review Fixes:**
- **Critical**: Summarize action now self-contained with own system prompt (was using wrong discovery prompt)
- **Major**: Added `MAX_UPLOAD_SUMMARY_LENGTH` (30KB) to prevent oversized API calls
- **Minor**: Added `MIN_UPLOAD_SUMMARY_LENGTH` constant (100 chars)
- **Minor**: Fixed content type filtering: `data.content?.find(b => b.type === "text")?.text`
- **Minor**: Summarize action now includes sensitivity filter in its system prompt
- **Minor**: Summarize max_tokens increased to 1500 (needs more for narrative + signals)

**Three-Point Sensitivity Filter Now Complete:**
1. ✅ Context Acknowledgment (discover route, action=reflect)
2. ✅ Per-section discovery prompts (discovery.js ASSESSMENT HANDLING)
3. ✅ Synthesis prompt (synthesis.js CLINICAL LABEL PROHIBITION)
4. ✅ Summarize action (discover route, action=summarize) — added in Opus fix

---

### lens-app 2026.04.12-h (Clinical Label Filter Fix)
Fixes ADHD label leaking through sensitivity filter.

**Root Cause:**
- Sensitivity filter was positioned at line 190, after all structure guidance
- No explicit blocklist format for model to pattern-match
- Validation didn't detect clinical labels in output

**Fixes:**
1. **Moved blocklist to TOP of system prompt** — "CRITICAL: CLINICAL LABEL PROHIBITION" section now appears immediately after the intro, before any structure guidance
2. **Explicit blocklist format** — Exact strings that must never appear: ADHD, ADD, anxiety, depression, DISC, Myers-Briggs, etc.
3. **Added sensitivity violation detection to validation** — Scans output for blocked terms, flags as critical severity
4. **Re-synthesis triggers on sensitivity violations** — Priority higher than gaps or hallucinations
5. **Revision addendum includes sensitivity fix instructions** — Rules 12-16 for translating clinical labels

**Acceptance Test:**
Regenerate lens with same inputs. Search for: ADHD, ADD, DISC, Peacemaker, SC. None should appear. Behavioral signals should still be present in work-style language.

---

### lens-app 2026.04.12-g (Audience Mode Architecture)
Adds `audienceMode` parameter to synthesis — architectural hook for future enterprise tiers.

**Audience Mode Config:**
- `audienceMode` parameter added to `buildSynthesisUserContent()` (default: "candidate")
- Sensitivity filter section now explicitly states it applies in "candidate" mode
- Future modes documented: "employer" (full signal), "external" (middle ground)
- No behavior change — always uses "candidate" mode currently

**Purpose:**
Sets up architecture for enterprise product tiers where internal recruiters get full assessment signal (DISC scores, development areas) while self-service users get sanitized output. The flag exists; the employer-mode rules will be written when that product phase begins.

---

### lens-app 2026.04.12-f (Self-Test Fixes)
Implements `integration-spec-addendum-v1.1.md` — addresses three issues found during Eric Zelman's self-test.

**New: Career Generalization Prohibition**
- Discovery and synthesis prompts now explicitly prohibit attributing capabilities to companies where the resume shows a different role
- Example: "built CS at Apple" is now flagged when resume says "Account Executive at Apple"
- LensIntake.jsx extracts per-company role data as structured objects `{ company, title, years, function }`
- Discovery prompt references per-company objects to prevent narrative flattening

**New: Sensitive Information Filter (Synthesis)**
- Assessment data (DISC, Myers-Briggs, ADHD, therapy notes) now INFORMS voice but never APPEARS in output
- Hard rules: no clinical labels, no assessment scores, no 360 feedback verbatim
- "Recruiter test": only include what the user would want a recruiter to read
- Reframe vulnerabilities as positive work style preferences

**New: Persona-Agnostic Stats Extraction**
- Stats bar no longer defaults to CS-specific template
- Extracts whatever metrics are most impressive for THIS person's career
- Examples by persona: Designer, Sales Leader, Engineer, Marketing (not just CS)

**New: Hallucination Detection (Validation)**
- Validation prompt now detects FABRICATED evidence, not just MISSING evidence
- Checks: company-role attribution, metrics cited, career arc claims
- New JSON fields: `has_hallucinations`, `hallucinations[]`
- High/medium hallucinations trigger re-synthesis with priority fix instructions
- "Hallucination fixes take priority over gap integration"

**Files Changed:**
- `app/api/_prompts/discovery.js` — CAREER GENERALIZATION PROHIBITION, ASSESSMENT HANDLING
- `app/api/_prompts/synthesis.js` — CAREER GENERALIZATION PROHIBITION, SENSITIVE INFORMATION FILTER, PERSONA-AGNOSTIC STATS
- `app/api/_prompts/validation.js` — HALLUCINATION DETECTION section, updated JSON schema, revision addendum
- `app/api/synthesize/route.js` — hallucination-triggered re-synthesis
- `app/components/LensIntake.jsx` — per-company role extraction in documentContext

---

### lens-app 2026.04.12-e (Opus Review Fixes for Validation Gate)
- **Fix**: Added `lensMarkdown` null/empty check in `buildValidationUserContent` (was causing "undefined" injection)
- **Fix**: Store `originalLensDoc` before re-synthesis for fallback (prevents data loss on failed re-synthesis)
- **Fix**: Shared timeout budget via `getRemainingTimeout()` (prevents 4 × 50s exceeding Vercel 60s limit)
- **Fix**: Added `RETRY_TEMPERATURE = 0.8` for retry variation (was identical inputs)
- **Fix**: Validate revised Lens section count before accepting (prevents accepting malformed re-synthesis)

---

## [2026-04-12] Document Context Integration (Spec v1.0)

### lens-app 2026.04.12-d (Validation Gate)
Implements `lens-validation-prompt-v1.0.md` — post-synthesis QA gate that catches gaps and triggers re-synthesis.

**New: Post-Synthesis Validation**
- Added `app/api/_prompts/validation.js` with validation system prompt and revision addendum
- Validation runs after synthesis if source materials exist
- Checks for identity gaps, evidence gaps, scope gaps, stats gaps
- Returns structured JSON gap report with severity (none/low/medium/high)
- If high/medium severity: triggers re-synthesis with revision instructions
- If validation fails or no source materials: gracefully continues with original lens

**Pipeline Flow:**
```
Discovery → Synthesis → Validation → [Re-synthesis if gaps] → Render
```

**Cost/Latency:**
- Validation call: ~1500 input tokens, ~500-800 output tokens (fast)
- Re-synthesis: same as original synthesis, adds 5-10s when triggered
- Expected to decrease as upstream prompts improve

---

### lens-app 2026.04.12-b (Opus Review Fixes)
- **Fix**: Added null check on `startSectionRef.current` before calling (prevents TypeError on re-entry)
- **Security**: `/skip` dev command now guarded with `process.env.NODE_ENV === "development"`
- **Fix**: Enterprise/tool name matching now uses word boundaries (prevents "ford" matching "afford")
- **Fix**: `buildSynthesisUserContent` now handles null/undefined sectionData gracefully
- **Fix**: Increased MAX_TOKENS from 4000 to 8000 (prevents lens truncation)
- **Fix**: Added 50s timeout on Anthropic fetch (prevents Vercel timeout)
- **Fix**: Retry logic now validates second attempt quality (returns 502 if still malformed)

### lens-app 2026.04.12-a
Implements `lens-context-integration-spec-v1.0.md` — uploaded documents (resume, LinkedIn, assessments) now flow into synthesis for evidence-grounded Lens output.

**New: Document Context Extraction**
- Added `documentContext` extraction from uploaded files (memoized)
- Extracts structured data: years of experience, team size, ARR/revenue, NRR, geographic scope, enterprise clients, tools
- Pattern-based extraction with multiple fallback patterns per field
- Extraction runs client-side for performance

**New: Synthesis Document Integration**
- Updated synthesis prompt with DOCUMENT CONTEXT INTEGRATION section
- Per-section guidance for integrating document evidence (Essence, Skills, Mission, Non-Negotiables)
- Stats bar now populated from extracted documentContext
- Raw document text included for Claude to reference specific companies/metrics
- Added weak/strong examples for each section

**API Changes**
- `/api/synthesize` now accepts `documentContext` (object) and `rawDocumentText` (string)
- Both optional — graceful fallback when no documents uploaded
- Validation added for documentContext shape

**Impact**
- Essence section now includes professional identity with scale (not just behavioral patterns)
- Skills & Experience grounds career arc in specific companies, metrics, enterprise clients
- Stats bar populates from document data: `15+ years | 24-person CS org | $40M ARR / 120% NRR | NA + EMEA`
- Addresses "resume ignored in synthesis" feedback from Ravi Katam test

---

## [2026-04-10] Discovery Flow Improvements (Ravi/Brendan Feedback)

### lens-app 2026.04.10-a
Based on tester feedback from Ravi Katam (4/10/26) and Brendan McCarthy (early April):

**New: Context Reflection Phase**
- Added new phase between Status and Discovery
- AI summarizes uploaded materials before conversation begins
- User confirms/corrects the summary before discovery starts
- Demonstrates AI has "read" their materials (addresses "uploaded into a void" feedback)
- If no materials uploaded, skips automatically

**Section Timing Guardrails**
- Hard cap of 4 questions per section (prevents psychoanalysis mode)
- Question counter in route.js enforces limit
- Warning at 3 questions, forced completion at 4
- Target: 4-5 minutes per section, hard cap at 8 minutes
- Reduced total session target from 2+ hours to 25-35 minutes

**Context-Aware Questioning**
- Updated all 8 section systemContext strings to reference prior answers
- Essence section now references uploaded materials in opener
- Each section opener demonstrates continuity with prior sections
- Prevents re-asking information already covered

**"I Don't Know" Handling**
- Added system prompt rules for handling uncertainty gracefully
- AI acknowledges and moves on without pushing for examples
- Added user-facing guidance in IntroPhase and ContextReflectionPhase

**Redundancy Prevention**
- Added explicit rules to prevent cross-section redundancy
- AI checks conversation history before asking questions
- Immediate acknowledgment if user says "I already mentioned this"

### API Changes
- `/api/discover` now accepts `action: "reflect"` for context reflection
- Added `contextReflection` to context object passed to discovery
- Greeting action now includes uploaded materials and context reflection

### lens-app 2026.04.10-b (Opus Review Fixes)
- **Security fix**: Moved `establishedContext` to AFTER system instructions in prompt building (prevents prompt injection)
- **Bug fix**: Retry logic now correctly removes user message and any following assistant response (was removing wrong message)
- **Bug fix**: Re-entry useEffect now uses ref pattern to avoid stale closures, added `subPhase` to deps
- **Bug fix**: ContextReflectionPhase auto-skip uses ref pattern for `onSkip` callback
- **Bug fix**: FileChip size calculation uses numeric types instead of string coercion
- **Validation**: Empty message content now rejected (non-empty string required)
- **Validation**: Payload size check now uses accurate byte count (TextEncoder)
- **Fix**: [SECTION_COMPLETE] marker removal now uses `replaceAll` (handles multiple occurrences)

---

## [2026-04-07] Timing & Drop-off Instrumentation

### lens-app 2026.04.07-b
- **Opus code review fixes**:
  - Fixed sendBeacon Content-Type (use Blob with application/json)
  - Memoized fileContext computation for performance
  - Added recordId format validation (rec + 14 alphanumeric)
  - Added isComplete/abandoned conflict rejection
  - Added sectionTimings type validation
  - Added empty fields short-circuit in PATCH
  - Added recordId existence check in POST response

### lens-app 2026.04.07-a
- **Timing instrumentation**: Added session tracking to measure user progress through discovery
  - Creates Airtable session record when discovery starts
  - Tracks per-section timing (entry, completion, duration, message count)
  - Records drop-off section when user abandons mid-flow (via beforeunload)
  - Marks completion when lens is generated
- **Feedback integration**: Added feedback link in "done" phase with session ID
  - Links feedback responses to same Airtable record as timing data
  - Enables correlation between engagement metrics and qualitative feedback

### lens-feedback
- **Session linking**: Feedback form now parses `?session=` URL param
  - Updates existing session record instead of creating new one
  - Preserves timing data while adding feedback fields

### Airtable Schema
Added 9 fields to `Lens Feedback` table:
- Session Started At (dateTime)
- Session Completed At (dateTime)
- Is Complete (checkbox)
- Last Section Visited (number)
- Drop-off Section (number)
- Section Timings (multilineText - JSON)
- Total Duration Sec (number)
- Total Messages (number)
- Build ID (singleLineText)

### New API Route
- `/api/session` - POST to create session, PATCH to update timing data

---

## [2026-04-05] Serverless Proxy & Tester Feedback Fixes

### lens-app 2026.04.05-c
- **Build a**: Jared Hibbs feedback fixes
  - Added privacy disclosure to intro screen
  - Implemented cross-section context accumulator to prevent redundant questioning
  - Rewrote all discovery prompts to be neutral (removed Eric-specific bias)
- **Build b**: Serverless proxy architecture
  - Created `/api/discover` route for discovery conversations
  - Created `/api/synthesize` route for Lens generation
  - Moved all system prompts to server-side (`app/api/_prompts/`)
  - Refactored client to use proxy routes (prompts no longer in browser)
- **Build c**: Opus code review fixes
  - Created `/api/merge` route with server-side merge prompt
  - Fixed error sanitization in `/api/chat` (no internal details leaked)
  - Restored `prompt` field to client-side SECTIONS for UI display

### Security
- System prompts (IP) now protected server-side, never sent to client
- API key validation errors return generic "Service temporarily unavailable"

---

## [2026-04-03] Documentation Update

### docs/SCORING-ENGINE.md
- Aligned with `config/scoring-config.yaml` v2.0
- Renamed "Config-Driven Scoring Architecture (Target)" → "(Implemented)"
- Documented dual-mode architecture (pipeline vs product)
- Added signal library concept and YAML examples
- Corrected dimension weights: Company Stage 25%, Role Fit 25%, Mission 20%, Culture 15%, Work Style 10%, Energy 5%
- Updated mapping table with signal library and dual-mode references
- Removed obsolete "Skill" dimension (absorbed into role_fit)

---

## [2026-03-22] Initial Release

### lens-app v1.0.0
- **URL**: https://lens-app-five.vercel.app/
- Four-phase intake form: intro, file uploads, job status, 8-section guided conversation
- Auto-save progress with session recovery
- Claude API integration for conversational intake
- Sample briefing page at `/weekly-inflection-briefing-sample.html`

### lens-feedback v1.1.0
- **URL**: https://lens-feedback.vercel.app
- Feedback form for user testing
- Submits to Airtable (Lens Feedback table)
- Fields: Name, Better Than Resume, Would Share, Surfaced New Insights, Most/Weakest Section, What's Missing, Feels Like You (1-10), Pricing Reaction

### role-lens-scorer v1.3.0
- **URL**: https://role-lens-scorer.vercel.app
- AI scoring API using Claude
- Evaluates role fit against user lens

---

## Schema Versions

| Schema | Version | Location |
|--------|---------|----------|
| Lens Spec | v1.0 | `specs/LENS-SPEC.md` |
| Candidate Lens | v1.0 | `specs/candidate-lens-v1.md` |
| Role Lens Schema | v1.0 | `specs/role-lens-schema-v1.md` |
| Bidirectional Lens | v1.0 | `specs/bidirectional-lens-system-v1.0.md` |
| Feedback Loop Spec | v1.0 | `specs/feedback-loop-spec-v1.0.md` |
| Sources Template | v1.0 | `specs/sources-template.yaml` |
| Scoring Config | v2.0 | `config/scoring-config.yaml` |

---

## Release Process

When deploying changes:
1. Update this file with the date and changes
2. Increment version numbers as appropriate
3. Commit changelog with the deployment
