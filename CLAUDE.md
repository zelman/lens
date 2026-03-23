# Claude Code Project Instructions

## Repository Overview

This is the Tide Pool repo. It contains three things:

1. **Eric's personal agent lens** (`tide-pool-agent-lens.md` at root) — consumed at runtime by n8n job search pipelines via raw GitHub URL. This is the monolith (39KB). Still the canonical source for n8n. Do not break backward compatibility.
2. **The Lens Project product** (`lens/`) — Next.js intake app, scoring schemas, scorers, deliverables. This is the product being built for other users.
3. **User files** (`users/`) — per-user lens, scoring config, and sources. The product architecture. Eric is the first user; Ravi Katam is an example.

## Architecture: Three User Files

The product uses three files per user, all in `users/{name}/`:

- **`lens.md`** — Identity + preferences. What the intake form produces. ~7KB. Contains YAML frontmatter (disqualifiers, sector preferences, scoring weights) and markdown body (essence, values, professional identity, work style, energy).
- **`scoring.yaml`** — User's scoring configuration. Slider weights (must sum to 100), personal gates, sector signals, thresholds. This is what changes when a user drags a weight slider.
- **`sources.yaml`** — Which job boards, VC portfolios, alert keywords, and enrichment sources to monitor. Assembled from sector preferences during intake.

These are separate from the monolith. The monolith stays at root for n8n backward compatibility until n8n is updated to read the split files.

## Scoring: Dual-Mode Architecture

`scoring-config.yaml` at repo root defines a **signal library** that supports two scoring modes:

- **Pipeline mode** (n8n): Additive scoring. Signals trigger fixed point bonuses (+50 Series A, +40 builder language). Scores can exceed 100. Backward-compatible.
- **Product mode** (JSX scorer, sliders): Weighted composite. Each dimension scored 0-100, multiplied by user weight. Composite always 0-100. Signals raise/lower dimension scores instead of adding flat bonuses.

Same signals, same gates, same investor lookup. Different math. User's `scoring.yaml` declares which mode via `mode: pipeline | product`.

## Key Files

| File | Purpose | Who Edits |
|---|---|---|
| `tide-pool-agent-lens.md` | Monolith lens v2.15. n8n reads this. | Eric via Claude Code |
| `scoring-config.yaml` | Shared signal library, dual-mode scoring | Platform (not users) |
| `users/eric-zelman/lens.md` | Eric's identity in product format | Intake form / Eric |
| `users/eric-zelman/scoring.yaml` | Eric's weights and gates | Sliders / Eric |
| `users/eric-zelman/sources.yaml` | Eric's feeds, VCs, boards | Eric |
| `lens/src/lens-scorer.jsx` | Swiss Style scorer, fetches lens at runtime | Claude AI / Claude Code |
| `lens/src/lens-scorer-compare.jsx` | Dual-schema comparison with weight sliders | Claude AI / Claude Code |
| `lens/schemas/LENS-SPEC.md` | Formal schema spec (the real product spec) | Claude Code |
| `lens/schemas/candidate-lens-v1.md` | Product lens format with 6-dim schema | Claude Code |
| `lens/schemas/sources-template.yaml` | Template for source config generation | Claude Code |
| `lens/docs/enhancements.md` | Enhancement tracking (check before starting work) | Both |
| `lens/docs/SCORING-ENGINE.md` | Pipeline architecture and evolution | Claude Code |
| `lens/app/` | Next.js intake application | Claude Code |
| `CONTEXT-cross-project.md` | Sibling project awareness | Both |

## Versioning Rules

When editing `tide-pool-agent-lens.md`:
1. Update `last_updated` in YAML frontmatter (format: "YYYY-MM-DD")
2. Increment version (e.g., 2.15 -> 2.16)
3. Update footer version and date
4. Add changelog entry
5. Keep YAML and body text consistent (employee counts, penalty values, thresholds)

When editing `scoring-config.yaml`:
1. Increment version
2. Update `last_updated`
3. Ensure both pipeline and product mode entries stay in sync for shared signals

## Design Language: Swiss Style

All product-facing artifacts use:
- Background: White (#FFFFFF)
- Typography: Helvetica Neue / Helvetica / Arial
- Primary accent: Red (#D93025)
- Secondary accent: Orange (#E8590C)
- Border radius: Zero everywhere
- Rules: 2px black for major boundaries, 1px #EEEEEE for subdivisions

The old dark theme (#0a0a0a, #a08060 gold) is retired for product materials.

## What Lives Where (Repo Boundaries)

- **tidepool** (this repo): Lens documents, scoring config, product code, schemas, user files
- **job_search** (separate repo): n8n workflow JSON, pipeline execution code, PE detection modules, Airtable integration
- **work** (separate repo): Resume, cover letters, career materials

Do NOT put n8n execution code (JavaScript modules, workflow JSON) in this repo. Scoring *configuration* (what signals to look for, how to weight them) belongs here. Scoring *execution* (the n8n nodes that run the evaluation) belongs in job_search.

## Local Development & File Handoff

### Local Clone

The canonical local copy of this repo is:
```
/Users/zelman/Desktop/Quarantine/Side Projects/tidepool
```

Shell alias: `tidepool` (launches Claude Code in this directory)

### File Handoff from Claude AI

Claude AI (claude.ai) creates JSX components, scoring configs, markdown docs, and other artifacts. These are downloaded to the user's machine and should be placed in the correct repo location before committing.

**Where files go:**

| File type | Repo path |
|---|---|
| JSX scorers, components | `lens/src/` |
| Next.js app components | `lens/app/components/` |
| Next.js API routes | `lens/app/api/` |
| Schema specs, templates | `lens/schemas/` |
| Documentation | `lens/docs/` |
| Pitch decks, reports | `lens/deliverables/` |
| Static/public assets | `lens/public/` |
| User lens files | `users/{name}/lens.md` |
| User scoring configs | `users/{name}/scoring.yaml` |
| User source configs | `users/{name}/sources.yaml` |
| n8n workflow JSON | **DO NOT PUT HERE** — goes in `zelman/job_search` |

### Vercel Deployment

The Next.js app in `lens/` deploys to Vercel. When Claude Code receives a JSX component to add:
1. Place it in the correct path per the table above
2. If it's a page component, wire it into `lens/app/page.js` or create a new route
3. If it has API dependencies (Claude API calls), add the route in `lens/app/api/`
4. Commit, push, and Vercel auto-deploys from the `main` branch

### Ideal Workflow

1. Eric works with Claude AI (claude.ai Lens Project) to design/iterate on components
2. Claude AI produces files (JSX, YAML, MD) — these download to `~/Downloads`
3. Eric tells Claude Code: "Move ~/Downloads/[filename] to [repo path] and commit"
4. Claude Code moves file into repo, commits, pushes — Vercel auto-deploys

**Example:**
```
Move ~/Downloads/lens-scorer.jsx to lens/src/lens-scorer.jsx and commit with message "Swiss Style scorer with runtime lens fetch"
```

Claude Code should use the file placement table above to suggest the correct destination if Eric doesn't specify one.

## Current State (March 2026)

- Agent lens at v2.15 (gates loosened, bonuses restored, thresholds renamed)
- Next.js intake app in `lens/app/` (built yesterday)
- Dual-mode scoring config committed
- User architecture (`users/`) committed with Eric + Ravi example
- Enhancement backlog in `lens/docs/enhancements.md`
- n8n still reads the monolith; split file migration is on the backlog

---

## Session Hygiene

At the end of any substantive session, generate a wrap-up before the user disconnects. This prevents knowledge from dying in the terminal.

### End-of-Session Checklist

1. **Artifacts:** List every file created or modified this session with version numbers (before → after). New files need an Artifact Registry entry in Airtable (base appFO5zLT7ZehXaBo, table tblcE723hIH692lSy).

2. **Decisions:** Bullet any architectural, strategic, or design decisions made. One sentence each: what was decided and why.

3. **CONTEXT update:** Draft the specific text to add or replace in CONTEXT-lens-project.md. Write the actual paragraph, not a vague reminder.

4. **Commit:** Stage and commit with a descriptive message. Group related changes. Don't bundle unrelated work.

5. **Memory flag:** If anything changed that should persist in Claude.ai memory (stable facts, tool configs, project structure), note it explicitly so the user can add it in their next Claude.ai session.

### Versioning

All artifacts use semantic versioning (v1.0, v1.1, v2.0). Track in filenames or internal version constants. Bump on every meaningful change.

### Legal Files

Signed NDAs, patent application drafts, and attorney correspondence are local only — never committed to git. Strategy reasoning (IP-STRATEGY.md, competitive-landscape.md) is committed normally.

### What Goes Where

- **Git (this repo):** Product code, specs, schemas, scorers, deliverables, strategy docs
- **Airtable Artifact Registry:** Row for every versioned artifact with location and git status
- **Claude.ai CONTEXT files:** Living state summaries, updated via session wrap-up
- **Claude.ai memory:** Stable personal facts, tool configs, project structure (slow-changing)
- **Local only (gitignored):** Signed legal documents, credentials, API keys
