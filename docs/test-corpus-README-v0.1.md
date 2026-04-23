# test-corpus/ — v0.1

Paired tester source materials + Lens outputs, used as a regression/eval set for synthesis changes (primarily the pattern-extraction pre-pass).

**This folder is gitignored.** Contents are tester PII and stay local-only, matching the `legal/` precedent. See `.gitignore` for the rule.

## How this folder is used

- Input corpus for re-running synthesis with proposed changes (e.g. pre-pass enabled/disabled) and diffing outputs against what the tester originally received.
- Tester verbatim feedback is the score; the corpus is the regression set.

## Folder convention

```
test-corpus/
  <tester-last-name>/
    source/      # redacted source materials, one file per upload category
    output/      # the Lens document the tester received (redacted)
    notes.md     # session date, build version, verbatim feedback, scores
```

## How materials get here

Testers produce redacted text files per the spec: `../tester-materials-request.md` (v0.1, Artifact Registry `recdfnv5Y8JCRunpy`). Request language and redaction token format are defined there.

## Scope of use

Internal synthesis evaluation only. Not used for training, fine-tuning, or sharing with third parties.

---
**Version:** v0.1 (2026-04-21) — initial stub alongside tester-materials-request v0.1.
