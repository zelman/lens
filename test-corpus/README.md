# test-corpus/ — v0.2

Paired tester source materials + Lens outputs, used as the ground truth regression set for synthesis changes (primarily the pattern-extraction pre-pass).

**This folder is gitignored.** Contents are tester PII and stay local-only, matching the `legal/` precedent. The `.gitignore` in this folder blocks all content except itself and this README.

## How this folder is used

- Input corpus for re-running synthesis with proposed changes (e.g., pre-pass enabled/disabled) and diffing outputs against what the tester originally received.
- Tester verbatim feedback is the ground truth; the corpus is the regression set.

## Folder convention

```
test-corpus/
  <tester-last-name>/
    source/      # redacted source materials, one file per upload category
    output/      # the Lens document the tester received (redacted)
    notes.md     # session date, build version, verbatim feedback, scores
```

**Example:**
```
test-corpus/
  chen/
    source/
      resume.txt
      linkedin.txt
      role-context.txt
    output/
      lens-report-v1.md
    notes.md
```

## How materials get here

Testers produce redacted text files per the request spec (`specs/tester-materials-request.md`). Request language and redaction token format are defined there.

**Redaction format:** `[REDACTED: description]` — e.g., `[REDACTED: employer name]`, `[REDACTED: phone number]`

## Scope of use

Internal synthesis evaluation only. Not used for training, fine-tuning, or sharing with third parties.

---
**Version:** v0.2 (2026-04-21) | Artifact Registry: `rec1DoHC8tRoXYBVt`
