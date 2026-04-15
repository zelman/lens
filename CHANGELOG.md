# Lens Project Changelog

All notable changes to deployed apps and schemas are documented here.

## [2026-04-15] Candidate Discovery Fork (R→C POC Step 4)

### lens-app 2026.04.15-a (Recruiter Candidate Intake)
Adds the candidate discovery conversation fork for R→C flow. Consumes `session-config` from sessionStorage (created by Step 3) and runs dynamic sections instead of hardcoded 8 sections.

**Architecture Decision:** FORK (not parameterize)
- System prompts fundamentally different (R→C context-aware, includes role context)
- Sections dynamic from session-config (foundation + tailored) vs. hardcoded 8
- Synthesis output different (JSON scorecard vs. lens document)
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
- Without validation, ADHD label appeared in lens output: "Eric has ADHD, which means..."
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
- **Fix**: Validate revised lens section count before accepting (prevents accepting malformed re-synthesis)

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
Implements `lens-context-integration-spec-v1.0.md` — uploaded documents (resume, LinkedIn, assessments) now flow into synthesis for evidence-grounded lens output.

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
  - Created `/api/synthesize` route for lens generation
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
