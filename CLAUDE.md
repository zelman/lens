# Claude Code Project Instructions

## CRITICAL: Deployment Rules

**NEVER push to main or deploy without explicit user confirmation.**

The workflow is:
1. Make changes locally
2. Run build to verify
3. Stage changes with `git add`
4. **ASK USER** before committing and pushing
5. Only push after user says "deploy", "push", "ship it", or similar explicit approval

Commits to main auto-deploy to Vercel. Pushing without approval wastes the user's time if changes need revision.

---

## Repository Overview

This is the Lens Project product repo. It contains the Next.js intake app, JSX scorers, scoring configuration, schemas, documentation, and deliverables. This is the product being built for other users.

Eric's personal agent lens monolith and user files live in a **separate repo**: `zelman/tidepool`.

## Architecture

- **`components/`** — JSX scorers and standalone components
- **`app/`** — Next.js intake application (pages, components, API routes)
- **`schemas/`** — Lens document spec, Candidate Lens format, source templates
- **`docs/`** — Enhancement tracking, scoring engine architecture, enhancements backlog
- **`deliverables/`** — Pitch decks, reports
- **`public/`** — Static assets
- **`review-profiles/`** — Code review context files (5 profiles for automated review)
- **`config/`** — Configuration files (guardrails.yaml)
- **`meetings/`** — Meeting notes and transcripts (tester feedback, partner calls)

## Scoring: Dual-Mode Architecture

`scoring-config.yaml` at repo root defines a **signal library** that supports two scoring modes:

- **Pipeline mode** (n8n): Additive scoring. Signals trigger fixed point bonuses (+50 Series A, +40 builder language). Scores can exceed 100. Backward-compatible.
- **Product mode** (JSX scorer, sliders): Weighted composite. Each dimension scored 0-100, multiplied by user weight. Composite always 0-100. Signals raise/lower dimension scores instead of adding flat bonuses.

Same signals, same gates, same investor lookup. Different math. User's `scoring.yaml` (in the tidepool repo) declares which mode via `mode: pipeline | product`.

## Claude API Integration Pattern

The lens-app uses a **serverless proxy architecture** to protect IP:

- **Server-side routes:** `/api/discover`, `/api/synthesize`, `/api/merge`
- **System prompts:** Stored in `app/api/_prompts/` (discovery.js, synthesis.js) — NEVER sent to client
- **Auth:** API key in environment variable (`ANTHROPIC_API_KEY`), accessed only server-side

**Model Selection:**
| Model | Use Case |
|-------|----------|
| `claude-opus-4-7` | Heavy reasoning (complex scoring logic, architectural decisions) |
| `claude-sonnet-4-6` | General synthesis (Lens generation, discovery conversations) |
| `claude-haiku-4-5-20251001` | Fast/cheap operations (validation, simple transforms) |

**Migration Rule:** When editing or creating code, check for `claude-sonnet-4-20250514` and migrate to the appropriate model above. Update `claude-sonnet-4-migration.md` in the Job Search repo to track progress.

- **Client code:** Sends section ID and user messages; receives responses only
- **Error handling:** Sanitized errors returned to client (no internal details leaked)

The `/api/chat` route remains for legacy/testing but should not be used with client-side system prompts.

## Key Files

| File | Purpose | Who Edits |
|---|---|---|
| `scoring-config.yaml` | Shared signal library, dual-mode scoring | Platform (not users) |
| `components/lens-scorer.jsx` | Swiss Style scorer, fetches lens at runtime | Claude AI / Claude Code |
| `components/lens-scorer-compare.jsx` | Dual-schema comparison with weight sliders | Claude AI / Claude Code |
| `schemas/LENS-SPEC.md` | Formal schema spec (the real product spec) | Claude Code |
| `schemas/candidate-lens-v1.md` | Product lens format with 6-dim schema | Claude Code |
| `schemas/sources-template.yaml` | Template for source config generation | Claude Code |
| `docs/enhancements.md` | Enhancement tracking (check before starting work) | Both |
| `docs/SCORING-ENGINE.md` | Pipeline architecture and evolution | Claude Code |
| `app/` | Next.js intake application | Claude Code |
| `review-profiles/` | Code review context files (5 profiles) | Claude Code |
| `code-review.mjs` | Automated code review script with profile support | Claude Code |

## Versioning Rules

When editing `scoring-config.yaml`:
1. Increment version
2. Update `last_updated`
3. Ensure both pipeline and product mode entries stay in sync for shared signals

## Build Versioning & Changelog

**IMPORTANT: Always update the changelog after creating a build.**

### Build ID Convention
The lens-app uses build IDs in `LensIntake.jsx`:
- Format: `YYYY.MM.DD-letter` (e.g., `2026.04.05-c`)
- Letter increments for each build on the same day (a, b, c, d...)
- Displayed in the app footer for debugging

### Changelog Requirements
After every build that changes app behavior:
1. Bump the `BUILD_ID` constant in `LensIntake.jsx`
2. Add an entry to `CHANGELOG.md` at the project root
3. Group related changes under the date heading
4. Include: what changed, why, and any security implications

The changelog is the source of truth for what's deployed and when.

## Design Language: Swiss Style

All product-facing artifacts use:
- Background: White (#FFFFFF)
- Typography: Helvetica Neue / Helvetica / Arial
- Primary accent: Red (#D93025)
- Secondary accent: Orange (#E8590C)
- Border radius: Zero everywhere
- Rules: 2px black for major boundaries, 1px #EEEEEE for subdivisions

The old dark theme (#0a0a0a, #a08060 gold) is retired for product materials. All remaining dark-theme components (lens-scorer.jsx, lens-form.jsx) are tech debt pending Swiss migration. Do not extend dark-theme patterns.

## Naming Conventions

- **Discovery sections:** 0-indexed in code arrays, 1-indexed in user-facing display (sections 0-7 internally = sections 1-8 in UI)
- **Scoring dimension keys:** snake_case (`cs_hire_readiness`, `stage_size_fit`, `role_mandate`, `sector_mission`, `outreach_feasibility`)
- **Coach persona IDs:** kebab-case (`james-pratt`)
- **JSX files:** kebab-case (`lens-scorer.jsx`, `lens-intake.jsx`)
- **YAML keys:** snake_case for machine fields, sentence-case for human-readable descriptions
- **Design tokens:** Raw hex codes (not CSS variables): #D93025 red, #E8590C orange, #1A1A1A text, #EEEEEE rules, #2D6A2D positive signals

## What Lives Where (Repo Boundaries)

- **lens** (this repo): Product code, scoring config, schemas, scorers, docs, deliverables, review profiles
- **tidepool** (separate repo): Agent Lens monolith, user files (`users/`), cross-project context, James Pratt skill
- **job_search** (separate repo): n8n workflow JSON, pipeline execution code, PE detection modules, Airtable integration
- **work** (separate repo): Resume, cover letters, career materials

Do NOT put n8n execution code (JavaScript modules, workflow JSON) in this repo. Do NOT put user Lens files here — they go in `zelman/tidepool/users/`. Scoring *configuration* (what signals to look for, how to weight them) belongs here. Scoring *execution* (the n8n nodes that run the evaluation) belongs in job_search.

## Local Development & File Handoff

### Local Clone

```
/Users/zelman/Desktop/Quarantine/Side Projects/Lens
```

### Sibling Repos

| Repo | Local Path |
|---|---|
| `zelman/tidepool` | `/Users/zelman/Desktop/Quarantine/Side Projects/tidepool` |
| `zelman/job_search` | `/Users/zelman/Desktop/Quarantine/Side Projects/job_search` |
| `zelman/work` | `/Users/zelman/Desktop/Quarantine/Side Projects/work` |

Shell alias: `tidepool` launches Claude Code in the tidepool directory (not this one).

### File Handoff from Claude AI

Claude AI (claude.ai) creates JSX components, scoring configs, markdown docs, and other artifacts. These are downloaded to the user's machine and should be placed in the correct repo location before committing.

**Where files go:**

| File type | Repo path |
|---|---|
| JSX scorers, components | `components/` |
| Next.js app components | `app/components/` |
| Next.js API routes | `app/api/` |
| Schema specs, templates | `schemas/` |
| Documentation | `docs/` |
| Pitch decks, reports | `deliverables/` |
| Static/public assets | `public/` |
| Scoring configuration | repo root (`scoring-config.yaml`) |
| Review profiles | `review-profiles/` |
| User Lens files | **DO NOT PUT HERE** — goes in `zelman/tidepool/users/` |
| n8n workflow JSON | **DO NOT PUT HERE** — goes in `zelman/job_search` |

### Local Development Server

**Always run localhost when iterating on code.** Do not deploy to Vercel for testing during development — it wastes time waiting for builds.

```bash
cd "/Users/zelman/Desktop/Quarantine/Side Projects/Lens/components/lens-app"
npm run dev
```

Test at `http://localhost:3000`. Changes hot-reload immediately. Only push to Vercel when the feature is ready for tester deployment.

### Vercel Deployment

The Next.js app deploys to Vercel. When Claude Code receives a JSX component to add:
1. Place it in the correct path per the table above
2. If it's a page component, wire it into `app/page.js` or create a new route
3. If it has API dependencies (Claude API calls), add the route in `app/api/`
4. Commit, push, and Vercel auto-deploys from the `main` branch

Active deployments: `lens-app-five.vercel.app`, `lens-feedback.vercel.app`

**Environment Variables Check:** Before deploying features that use external services, verify the required env vars are set in Vercel:
- `ANTHROPIC_API_KEY` — Claude API calls (discovery, synthesis, scoring)
- `AIRTABLE_API_KEY` — Feedback form, session timing, telemetry
- `AIRTABLE_BASE_ID` — Lens Project base (appFO5zLT7ZehXaBo)

Missing env vars cause silent failures in production (e.g., feedback not saving, sessions not tracked). Check Vercel dashboard → Project Settings → Environment Variables.

### Ideal Workflow

1. Eric works with Claude AI (claude.ai Lens Project) to design/iterate on components
2. Claude AI produces files (JSX, YAML, MD) — these download to `~/Downloads`
3. Eric tells Claude Code: "Move ~/Downloads/[filename] to [repo path] and commit"
4. Claude Code moves file into repo, commits, pushes — Vercel auto-deploys

**Example:**
```
Move ~/Downloads/lens-scorer.jsx to components/lens-scorer.jsx and commit with message "Swiss Style scorer with runtime Lens fetch"
```

Claude Code should use the file placement table above to suggest the correct destination if Eric doesn't specify one.

## Code Review

This repo includes a profile-based code review system. Run reviews from the repo root:

```bash
# Auto-detects profile from filename + content
node code-review.mjs components/lens-scorer.jsx --model sonnet --log

# Manual profile override
node code-review.mjs schemas/LENS-SPEC.md --profile general --model sonnet --log

# Use Opus for complex changes (scoring logic, system prompts, gate parameters)
node code-review.mjs components/lens-scorer.jsx --model opus --log
```

**Profiles** (in `review-profiles/`): `form`, `scoring`, `coach`, `config`, `general` (fallback). Each injects ~600-800 tokens of project context into the review call.

**Always review on change:** `components/lens-scorer.jsx`, `components/lens-intake.jsx`, `components/lens-form.jsx`, `scoring-config.yaml`

**Use Opus when:** System prompt changes, Lens document schema changes, auto-disqualifier logic changes, coach persona integration changes.

## Current State (April 2026)

- Next.js intake app in `app/` with serverless proxy architecture (build 2026.04.05-c)
- System prompts protected server-side in `app/api/_prompts/` — IP no longer exposed to browser
- Dual-mode scoring config committed
- Enhancement backlog in `docs/enhancements.md`
- Provisional patent filed 3/24/26 (App #64/015,187). Convert to nonprovisional by 3/24/27.
- 5 warm testers in pipeline (Ravi, Nathan, Edith, Brendan, Graham)
- Dark theme → Swiss Style migration: decided April 1, 2026. All components will migrate.
- Review profiles system added (`review-profiles/`) for code review context injection
- scoring-config.yaml moved from tidepool to this repo (last week)

## Known Bugs & Active Issues

### Coach Persona State Persistence (OPEN)
**Symptom:** Coach persona selection resets when navigating between discovery sections in lens-form.jsx.
**Root cause:** Persona ID stored in component-level state, not lifted or persisted to session storage.
**Impact:** Users must re-select their coach persona on each section transition.
**Workaround:** None.

### Flat Bonuses Override Weight Sliders (ARCHITECTURAL)
**Symptom:** In pipeline mode, fixed bonuses (+50 Series A, +40 builder) dominate the score, making dimension weight sliders functionally cosmetic.
**Root cause:** Additive bonuses bypass the weighted composite math. This is by design in pipeline mode but creates a UX mismatch when sliders are shown.
**Status:** Signal library architecture (signals raise dimension scores instead of flat bonuses) is the planned fix. Product mode in scoring-config.yaml is the implementation path.

### Config Drift Between scoring-config.yaml and JSX System Prompts (ACTIVE)
**Symptom:** Threshold values, gate parameters, or dimension weights may differ between the YAML config file and the hardcoded system prompts in lens-scorer.jsx.
**Root cause:** JSX system prompts haven't been wired to read scoring-config.yaml at runtime. Both are edited independently.
**Impact:** Reviewer can't trust either source as canonical without checking both.
**Workaround:** Check both files when reviewing scoring changes. scoring-config.yaml is intended to become the single source of truth.

## Previously Fixed (do not re-flag)

- **Infinite re-render on section change** — Fixed by memoizing prompt construction in lens-form.jsx. The memoization may look unnecessary to a reviewer; it's load-bearing.
- **Dark theme in lens-scorer.jsx** — Uses #0a0a0a background, #a08060 accent. This is tech debt pending Swiss Style migration (decided April 1, 2026), not a design choice. Don't fix dark-theme styling bugs — the whole visual layer will be replaced. DO flag any new code that introduces dark-theme patterns.

---

## Session Hygiene

At the end of any substantive session, generate a wrap-up before the user disconnects. This prevents knowledge from dying in the terminal.

### End-of-Session Checklist

1. **Artifacts:** List every file created or modified this session with version numbers (before → after). New files need an Artifact Registry entry in Airtable (base appFO5zLT7ZehXaBo, table tblcE723hIH692lSy).

2. **Decisions:** Bullet any architectural, strategic, or design decisions made. One sentence each: what was decided and why.

3. **CONTEXT update:** Draft the specific text to add or replace in this repo's CONTEXT file. Write the actual paragraph, not a vague reminder. For lens, update CONTEXT-cross-project.md (in Claude.ai Lens Project knowledge) if changes affect sibling projects.

4. **Commit:** Stage and commit with a descriptive message. Group related changes. Don't bundle unrelated work.

5. **Memory flag:** If anything changed that should persist in Claude.ai memory (stable facts, tool configs, project structure), note it explicitly so the user can add it in their next Claude.ai session.

6. **Profile updates:** Note any review profile changes needed from this session. Format:
   `Profile updates: none` or
   `Profile updates: form.md — add [bug name] to Known Bugs; scoring.md — update dimension weights`
   Triggers: new bug discovered, bug fixed (move to Previously Fixed), component version bump, scoring dimension or weight change, coach persona added/modified, API integration pattern changed.

7. **Claude Code Sessions:** Write a row to Airtable (base `appFO5zLT7ZehXaBo`, table `tblLgWUHElcbKABKF`) with:
   - Summary: 2-4 sentences of what was accomplished
   - Session Date: ISO timestamp
   - Commits: List of commit hashes + messages
   - Files Changed: Key files created/modified
   - Build ID: If a build was created
   - Open Items: Unfinished work or blockers
   - Decisions Made: Architectural/strategic decisions
   - Context for AI: What Claude AI needs to continue
   - Agent: `Claude Code`
   - Status: `Complete`, `Interrupted`, or `Handoff`

### Versioning

All artifacts use semantic versioning (v1.0, v1.1, v2.0). Track in filenames or internal version constants. Bump on every meaningful change.

### What Goes Where

- **Git (this repo):** Code, components, specs, config, strategy docs
- **Airtable Artifact Registry:** Row for every versioned artifact with location and git status
- **Airtable Competitive Intelligence:** Competitor analysis, market research, feature comparisons (NOT specs/competitive-landscape.md)
- **Airtable Lens Feedback:** Session timing data, drop-off tracking, user feedback responses
- **Airtable Claude Code Sessions:** Session summaries for context sync between Claude Code and Claude AI
- **Claude.ai CONTEXT files:** Living state summaries, updated via session wrap-up
- **Claude.ai memory:** Stable personal facts, tool configs, project structure (slow-changing)
- **Local only (gitignored):** Signed legal documents, credentials, API keys
