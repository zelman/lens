# UI Test Spec: Materials Upload Step (Brendan Feedback)

**Source:** Brendan McCarthy demo feedback (2026-03-30)
**Feedback Archive:** `tbl0Ec6OPqPqyDTDB`, record for Brendan
**File under test:** `lens-intake.jsx` (the intake form, Phase 2 — Context Upload)
**Vercel deployment:** `lens-red-two.vercel.app`

---

## Context

Brendan flagged that the Materials upload step (Step 1 of 3) lacks a visible "Continue" button. The only CTA is **"SKIP — START FROM SCRATCH"**, which is styled as the primary action (filled red, full-width). Users who upload files have no obvious next step, and users who *intend* to upload may reflexively click Skip because it's the only button.

The session persistence (save/resume on refresh) works correctly once a user is in the form. This spec is about the **Materials → Status transition** only.

---

## Required Changes

### TEST 1: Continue button exists
- [ ] A "Continue" button is rendered on the Materials upload step
- [ ] The button is visible without scrolling past the upload slots (or at minimum, visible alongside the Skip option at the bottom)
- [ ] The button navigates the user to Step 2 (Status selection)

### TEST 2: Continue button is the primary CTA
- [ ] The Continue button uses the primary style: filled red background (`#D93025`), white text, full-width
- [ ] The Skip button is visually secondary: outlined or text-only (NOT filled red)
- [ ] Visual hierarchy is clear — a first-time user would identify Continue as the default action

### TEST 3: Continue button reflects upload state
- [ ] When 0 files are uploaded: button reads **"Continue without files"** or **"Continue"** (acceptable either way)
- [ ] When 1+ files are uploaded: button reads **"Continue with N file(s)"** (showing count) OR the button label updates to acknowledge uploads
- [ ] The file count is accurate across all upload categories combined

### TEST 4: Skip is repositioned as secondary
- [ ] The Skip option appears BELOW the Continue button, or as a text link rather than a button
- [ ] Skip does NOT use filled red (`#D93025`) background — use outlined, ghost, or text-link style
- [ ] Skip still functions correctly (advances to Status step with no files)
- [ ] The helper text "You can always come back and add materials later." is retained near the Skip option

### TEST 5: Upload categories match spec
Per CONTEXT-lens-project.md, Phase 2 should have **5** upload categories:
- [ ] 01 — Resume (PDF, DOCX, TXT, MD — single file)
- [ ] 02 — LinkedIn profile (PDF — with print-to-PDF instructions)
- [ ] 03 — Writing samples (PDF, DOCX, TXT, MD, HTML — multiple files)
- [ ] 04 — Assessments & frameworks (PDF, DOCX, TXT, MD, PNG, JPG, JPEG — multiple files)
- [ ] 05 — Anything else (any file type — multiple files)

**Note:** The current build screenshot shows only 4 categories (LinkedIn is missing). Verify whether this was an intentional removal or a regression.

### TEST 6: Navigation consistency
- [ ] "← Back" button is present and returns to the Intro phase
- [ ] Progress bar shows MATERIALS as active (red underline)
- [ ] "Start over" in the progress bar area clears all state (per existing behavior)

### TEST 7: No disruption to existing tester URLs
- [ ] Changes are deployed to a preview/feature branch URL first
- [ ] The production URL (`lens-red-two.vercel.app`) is NOT redeployed until current test cycle completes
- [ ] Verify by checking that the production URL still shows the current (pre-change) version

---

## Visual Reference

**Current state (broken):**
```
[Upload slots 01-04]
─────────────────────────
[██ SKIP — START FROM SCRATCH ██]  ← filled red, primary style
  You can always come back...
```

**Expected state (fixed):**
```
[Upload slots 01-05]
─────────────────────────
[██ CONTINUE WITH 3 FILES ██████]  ← filled red, primary style
                 or
      Skip — start from scratch    ← text link or outlined, secondary
  You can always come back...
```

---

## Acceptance Criteria

All of Tests 1-4 must pass. Test 5 needs verification (LinkedIn may have been intentionally removed). Tests 6-7 are guardrails that must not regress.

**Do not merge to main until Tests 1-4 pass and Test 7 is confirmed.**
