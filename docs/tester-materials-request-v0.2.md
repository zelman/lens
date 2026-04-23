# Tester Materials Request — v0.2

**Owner:** Eric Zelman
**Location:** `zelman/lens/specs/tester-materials-request.md`
**Status:** Active
**Related:** `pattern-extraction-prompt-v0.1.md` (Artifact Registry: `recPdMghI072DLtd7`), `test-corpus/README.md` v0.2 (Artifact Registry: `rec1DoHC8tRoXYBVt`)

---

## Purpose

When a tester completes a Lens session, we ask them for two things:

1. **The source materials they uploaded during the session** (resume, assessments, writing samples, transcripts, etc.)
2. **The Lens output document they received** (PDF or markdown)

Paired together in a `test-corpus/<tester-last-name>/` folder, these serve as the ground truth regression set for synthesis changes: we can re-run the pipeline on the same inputs with a new pre-pass (or different parameters) and diff the output against what the tester originally received and verbally rated.

This is the highest-fidelity feedback mechanism we have — tester verbatim feedback is the ground truth, and the corpus is the regression set.

## Why text, not PDFs with visual redaction

The synthesis pipeline parses **text**, not visual layout. A visually "blacked out" PDF still contains the underlying text, so the black-out doesn't protect the tester's privacy from our pipeline, and it creates more work for the tester than necessary.

**Ask testers to copy text into plain files and replace sensitive values with structured tokens instead.** This is both lower-friction for the tester and higher-fidelity signal for us: the redaction tokens preserve sentence structure so the pre-pass still sees "there was a number here" without seeing the number.

## What we ask testers to do

### Source materials

For each source (resume, assessment, writing sample, transcript, etc.):

1. Copy the text into a plain `.md` or `.txt` file — one file per source.
2. Replace sensitive values with bracketed tokens that describe what was removed. Format: `[REDACTED: description]`. Examples:

| Category | Token |
|---|---|
| Current or prior compensation | `[REDACTED: current comp]` / `[REDACTED: prior comp]` |
| Home address | `[REDACTED: address]` |
| Personal phone | `[REDACTED: phone]` |
| Personal email | `[REDACTED: email]` |
| Date of birth | `[REDACTED: DOB]` |
| SSN / government ID | `[REDACTED: SSN]` |
| Financial account numbers | `[REDACTED: account]` |
| Names of minor family members | `[REDACTED: family]` |
| Confidential client names (NDA) | `[REDACTED: client]` |

3. Safe (and useful) to keep — these are the signal the pattern extraction needs:
   - Job titles, company names, dates, tenure
   - Accomplishments, metrics, outcomes
   - Skills, tools, technologies
   - Career narrative, transitions, decisions
   - Values, strengths, weaknesses, preferences

### Lens output

Same method — paste the PDF text into a `.md` file and scrub the same categories. Or send the PDF as-is and we scrub on our end. Tester's choice.

## Email template (paste-ready)

Use this when asking any tester for materials:

> Since I run source materials through a text-based eval pipeline, a visual black-out in a PDF doesn't actually protect the underlying text. The easier and more useful approach is plain text.
>
> **Source materials** (resume, assessments, writing samples, etc.):
> - Copy the text from each source into a plain `.md` or `.txt` file — one file per source.
> - Replace any sensitive values with bracketed tokens that preserve meaning, e.g.:
>   - Compensation → `[REDACTED: current comp]` or `[REDACTED: prior comp]`
>   - Home address → `[REDACTED: address]`
>   - Personal phone / email → `[REDACTED: phone]` / `[REDACTED: email]`
>   - DOB / SSN / financial account numbers → `[REDACTED: DOB]` etc.
>   - Family members' names (especially minors) → `[REDACTED: family]`
> - Safe (and useful) to keep: job titles, company names, dates, accomplishments, skills, career narrative, values, strengths/weaknesses — that's the signal the pattern extraction actually needs.
>
> **Lens output**: same approach — paste the PDF text into a `.md` and scrub the same categories. Or send the PDF as-is and I'll do the scrub on my end; whichever is easier.

## Corpus archive convention

**Location:** `zelman/lens/test-corpus/<tester-last-name>/`

The corpus lives at repo root, as a sibling of `specs/` and `legal/` — not nested inside `specs/`. This matches the `legal/` precedent (sensitive-data folders are siblings, not children of specification folders) and keeps `specs/` semantically clean (specifications only, not evaluation data).

**Contents per folder:**
- `source/` — redacted source materials, one file per upload category
- `output/` — the Lens document the tester received (redacted)
- `notes.md` — session date, build version, tester's verbatim feedback, authenticity score, key verdicts

**Example:**
```
zelman/lens/
  specs/
    tester-materials-request.md      # this file
    pattern-extraction-prompt-v0.1.md
    ...
  legal/                             # local only, self-contained .gitignore
  test-corpus/                       # local only, self-contained .gitignore
    .gitignore
    README.md
    chipman/
      source/
        resume.md
        disc-assessment.md
        writing-sample.md
      output/
        lens-output.md
      notes.md
    jerabek/
      source/
        transcript.md
      output/
        lens-output.md
      notes.md
```

## Gitignore convention

**`test-corpus/` uses a self-contained folder-local `.gitignore`.** This matches the `legal/` precedent and makes the folder portable: move it anywhere and the privacy rule travels with it.

The folder-local `.gitignore` blocks all contents except itself and the README, so:
- Documentation of the convention (`README.md`, `.gitignore`) is tracked in git
- All actual tester materials stay local-only

Even redacted materials are tester PII and stay local-only. Sanitized eval artifacts (aggregate diffs, scores, anonymized excerpts) can be promoted into committed `specs/` or `docs/` files once they've been stripped of all tester-identifying content.

## Scope of use

- Primary use: regression testing of synthesis changes (especially the pattern-extraction pre-pass).
- Secondary use: pattern discovery across testers — which kinds of source materials produce which kinds of synthesis failures.
- **Not** used for: training, fine-tuning, sharing with third parties, or any purpose beyond internal synthesis evaluation.

## Version history

- **v0.1** (2026-04-21): Initial spec. Triggered by Jeremy Chipman feedback session (`rec4fVNddJTUc5eir`), where tester unprompted flagged comp figure in Lens output and asked how to redact. Codified text-based redaction method, token format, folder convention, and gitignore rule.
- **v0.2** (2026-04-21): Path correction — corpus location moved from `specs/test-corpus/` to `test-corpus/` at repo root, matching the `legal/` precedent and keeping `specs/` semantically focused on specifications. Gitignore guidance updated to reflect the self-contained folder-local pattern that was actually implemented (cleaner, more portable than a top-level rule). "Ground truth" language adopted from the README v0.2 refinement for consistency.
