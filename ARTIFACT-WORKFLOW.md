# Lens Project — Artifact Management Workflow

*Last updated: March 22, 2026*

## The Problem

Artifacts are created in three places that don't automatically sync:

1. **Claude.ai (this project)** — specs, decks, legal docs, components (JSX)
2. **Claude Code** — git operations, local file changes, n8n engineering
3. **Vercel / FigJam / Airtable** — deployed artifacts, diagrams, data

Without a system, files exist only in conversation outputs, never reach git, and the CONTEXT.md goes stale.

## The System

### Single Source of Truth: Airtable Artifact Registry

**Table:** `Artifact Registry` in base `appFO5zLT7ZehXaBo`

Every artifact gets a row with:
- **Artifact** — name
- **Version** — semantic (v1.0, v1.1, v2.0)
- **Category** — Spec, Component, Deck, Legal, Document, Diagram, Config, Template
- **File** — filename
- **Location** — where the canonical version lives
- **In Git?** — checkbox
- **Deployed?** — checkbox
- **Date** — last updated
- **Notes** — context, warnings (e.g., "DO NOT commit to public git")

### Three Rules

1. **Every artifact created in Claude.ai gets a row in the registry immediately.** Before the conversation moves on.

2. **Every session that creates or updates artifacts ends with a git commit checklist.** The checklist is generated from the registry by filtering `In Git? = false` and `Location != FigJam`.

3. **Legal documents (Category = Legal) NEVER go in public git.** They go in a local-only folder or a private repo. The registry tracks them but the git workflow skips them.

## Git Repository Structure

### Standalone repo: `zelman/lens`

```
github.com/zelman/lens/
├── README.md
├── CONTEXT-lens-project.md
├── ARTIFACT-WORKFLOW.md
├── specs/
│   ├── bidirectional-lens-system-v1.0.md
│   ├── feedback-loop-spec-v1.0.md
│   └── ...future specs
├── components/
│   ├── role-lens-scorer-v1.3.jsx
│   ├── lens-scorer.jsx
│   ├── lens-intake.jsx
│   ├── lens-form.jsx
│   └── lens-feedback/
│       ├── api/
│       ├── public/
│       └── vercel.json
├── docs/
│   ├── Lens_for_Beginners_v1.1.docx
│   ├── lens-launch-plan-v2.0.docx
│   ├── lens-investor-pitch-v5.3.pptx
│   ├── lens-coach-pitch-v4.pptx
│   └── eric-zelman-test-profile-v1.0.md
├── config/
│   ├── James_Pratt_Skill.md
│   └── scoring-config.yaml
└── legal/                            # .gitignore'd — NEVER committed
    ├── .gitignore                    # Contains: *
    ├── Lens_Project_Provisional_Patent_v1.4.docx
    ├── Lens_Project_Patent_Claims_v1.4.docx
    ├── Lens_Project_IP_Summary_v1.1_20260321.docx
    └── Lens_Project_Mutual_NDA_v1.1.docx
```

### What stays in `zelman/tidepool`

- Archive project files (tide-pool.org)
- Agent lens monolith (`tide-pool-agent-lens.md` at root) — n8n consumes via raw GitHub URL
- `users/` directory with lens/scoring/sources YAML files
- Remove the `tidepool/lens/` subdirectory once `zelman/lens` has all the files

### .gitignore for legal/

```
# legal/.gitignore
# NEVER commit legal documents to public git
*
!.gitignore
```

## Workflow: After Every Claude.ai Session

### Step 1: Download artifacts from Claude.ai

Every file created in a session appears in the conversation as a download link. Download all new/updated files to your local Lens project folder.

### Step 2: Open Claude Code

```bash
cd ~/Desktop/Quarantine/Side\ Projects/Lens && claude
```

(Or use your shell alias once set up)

### Step 3: Ask Claude Code to run the commit checklist

Paste this prompt:

```
Check the Airtable Artifact Registry (base appFO5zLT7ZehXaBo, table Artifact Registry) 
for all records where "In Git?" is false and Category is not "Legal" and Category is not 
"Diagram". For each one, check if the file exists locally. If it does, git add it and 
prepare a commit. Update the Airtable record to set "In Git?" = true and "Location" to 
the appropriate git repo.
```

### Step 4: Commit and push

Claude Code handles git operations. One commit per session with a descriptive message:

```
git commit -m "March 22: Add bidirectional spec v1.0, feedback loop spec v1.0, role lens scorer v1.3, investor deck v5.3"
git push
```

### Step 5: Update CONTEXT-lens-project.md

After committing, update the CONTEXT file with:
- What was built/changed this session
- Current file inventory (or reference the Airtable registry)
- Any open questions or blockers

## Workflow: Creating New Artifacts in Claude.ai

When you ask me to create something, I will:

1. Build the artifact
2. Present the file for download
3. Add a row to the Airtable Artifact Registry with Location = "Claude.ai only" and In Git? = false
4. Add a kanban card if it's a task-level deliverable

When you later commit via Claude Code, the registry gets updated to reflect the new location.

## What Lives Where

| Content | Location | Git? |
|---------|----------|------|
| Specs (bidirectional, feedback loop) | `lens/specs/` | Yes |
| Components (scorers, forms) | `lens/components/` | Yes |
| Decks and docs | `lens/docs/` | Yes |
| Config (SKILL.md, scoring) | `lens/config/` | Yes |
| Legal (patent, NDA, IP summary) | `lens/legal/` (gitignored) | **NO** |
| Diagrams | FigJam | No (Mermaid source in FigJam) |
| Agent Lens (n8n runtime) | `tidepool/` repo | Yes (separate repo) |
| Job search pipelines | `job_search/` repo | Yes (separate repo) |
| Kanban board | Airtable `Lens Plan` table | N/A |
| Artifact registry | Airtable `Artifact Registry` table | N/A |
| Feedback data | Airtable `Lens Feedback` table | N/A |

## Immediate Action Items

The following artifacts are currently "Claude.ai only" and need to be committed to `zelman/lens`:

- [ ] bidirectional-lens-system-v1.0.md → `specs/`
- [ ] feedback-loop-spec-v1.0.md → `specs/`
- [ ] role-lens-scorer-v1.3.jsx → `components/`
- [ ] lens-scorer.jsx → `components/`
- [ ] lens-intake.jsx → `components/`
- [ ] lens-form.jsx → `components/`
- [ ] lens-feedback.zip → unzip to `components/lens-feedback/`
- [ ] lens-investor-pitch-v5.3.pptx → `docs/`
- [ ] lens-coach-pitch-v4.pptx → `docs/`
- [ ] lens-launch-plan-v2.0.docx → `docs/`
- [ ] Lens_for_Beginners_v1.1.docx → `docs/`
- [ ] eric-zelman-test-profile-v1.0.md → `docs/`
- [ ] James_Pratt_Skill.md → `config/`
- [ ] CONTEXT-lens-project.md → repo root
- [ ] ARTIFACT-WORKFLOW.md → repo root

Legal docs (patent, claims, IP summary, NDA) → `legal/` (gitignored, local only)

**First step: Create `zelman/lens` on GitHub, set up folder structure, add .gitignore for legal/.**
**Then: Remove `tidepool/lens/` subdirectory once everything is in the new repo.**
