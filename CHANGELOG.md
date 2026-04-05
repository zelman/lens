# Lens Project Changelog

All notable changes to deployed apps and schemas are documented here.

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
