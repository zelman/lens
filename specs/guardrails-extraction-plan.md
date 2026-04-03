# Guardrails Extraction Plan — v1.0

**Status:** Ready to execute after current user testing completes  
**URL impact:** None. Vercel routes and domain unchanged. Existing links continue to work.  
**Risk level:** Low. Behavioral parity is the goal — same prompts, new delivery mechanism.

---

## What This Does

Moves all AI behavior configuration (system prompts, tone rules, boundaries, persona overrides) out of `lens-form.jsx` / `lens-intake.jsx` and into `guardrails.yaml`, hosted in the `zelman/lens` repo. The form fetches this file at runtime from GitHub's raw URL. Pushing to `main` changes behavior without a Vercel redeploy.

---

## Why Now (But Not Yet)

Current testers (Nathan, James's persona testing) are using the hardcoded version. Swapping the plumbing mid-test would muddy the feedback. Once their sessions are complete and feedback is collected, the next deploy bundles this change alongside any prompt tweaks their feedback suggests — two birds, one deploy.

---

## Pre-Work (Do Now, While Testers Are Active)

These steps don't touch the deployed form. Safe to do anytime.

### 1. Finalize `guardrails.yaml` schema

- Review the v1.0 schema (created this session)
- Compare section prompts against what's hardcoded in `lens-form.jsx`
- Port exact current prompts into the YAML so initial deploy is behavioral parity
- Add any new sections or tweaks from tester feedback

### 2. Add to `zelman/lens` repo

```
zelman/lens/
  config/
    guardrails.yaml          ← the file
    guardrails-pratt.yaml    ← future: James Pratt variant (not needed yet)
  README section update
```

Push to a branch (`guardrails-config`), not `main` — the form doesn't fetch it yet, but good hygiene.

### 3. Write the fetch utility

A small helper function that the form will use. Draft it now, integrate later:

```javascript
// utils/fetchGuardrails.js

const GUARDRAILS_URL =
  "https://raw.githubusercontent.com/zelman/lens/main/config/guardrails.yaml";

const FALLBACK_TTL = 1000 * 60 * 60; // 1 hour cache in sessionStorage

export async function fetchGuardrails() {
  // Check sessionStorage cache first (avoids re-fetch on tab restore)
  const cached = sessionStorage.getItem("lens_guardrails");
  const cachedAt = sessionStorage.getItem("lens_guardrails_ts");
  if (cached && cachedAt && Date.now() - Number(cachedAt) < FALLBACK_TTL) {
    return JSON.parse(cached); // Already parsed from YAML
  }

  try {
    const res = await fetch(GUARDRAILS_URL);
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const yamlText = await res.text();
    const parsed = parseYAML(yamlText); // js-yaml or yaml-wasm
    sessionStorage.setItem("lens_guardrails", JSON.stringify(parsed));
    sessionStorage.setItem("lens_guardrails_ts", String(Date.now()));
    return parsed;
  } catch (err) {
    console.error("Guardrails fetch failed, using hardcoded fallback", err);
    return HARDCODED_FALLBACK; // Keep a frozen copy in code as safety net
  }
}
```

Key decisions baked in:
- **Cache in sessionStorage** so a page refresh doesn't re-fetch mid-session
- **Hardcoded fallback** stays in the JSX — if GitHub is down, the form still works
- **YAML parsing** needs a library (`js-yaml` is 30KB, fine for this)

---

## Deploy Steps (After Testing Completes)

### 4. Collect and incorporate tester feedback

- Pull feedback from Airtable (Lens Feedback table)
- Identify any prompt or flow changes needed
- Update `guardrails.yaml` with those changes (this is the first real win — you're editing YAML, not JSX)

### 5. Refactor `lens-form.jsx` / `lens-intake.jsx`

The core change: replace every hardcoded system prompt string with a reference to the guardrails object.

**Before:**
```jsx
const systemPrompt = `You're exploring how this person thinks about their professional identity...`;
```

**After:**
```jsx
const section = guardrails.sections.find(s => s.id === currentSectionId);
const persona = guardrails.personas[activePersona] || guardrails.personas.default;

const systemPrompt = buildPrompt({
  global: guardrails.global,
  section: section,
  persona: persona,
});
```

The `buildPrompt()` function assembles the final system prompt by layering:
1. Global identity + boundaries + tone
2. Section-specific system prompt
3. Persona overrides (appended, not replaced)

### 6. Add `js-yaml` dependency

```bash
npm install js-yaml
```

Or, if keeping the Vercel project zero-build (static HTML), use the CDN version and parse client-side.

### 7. Merge `guardrails-config` branch to `main`

This makes the YAML available at the raw GitHub URL. The form won't fetch it yet — that happens when the JSX refactor deploys.

### 8. Deploy to Vercel

Single deploy that includes:
- Refactored JSX (fetch + prompt assembly)
- js-yaml dependency
- Any prompt/flow changes from tester feedback
- Hardcoded fallback (frozen copy of guardrails v1.0)

Same URL. Same routes. Testers can use the same links if they come back.

### 9. Smoke test

- Load the form, verify guardrails fetched (check Network tab)
- Run through one full discovery flow
- Confirm behavioral parity with pre-refactor version
- Kill GitHub raw URL temporarily (rename file) to verify fallback works
- Restore and confirm cache behavior

---

## After Deploy: The Payoff

Once this is live, the workflow becomes:

1. Notice a prompt issue (too aggressive, too vague, wrong tone)
2. Edit `guardrails.yaml` in the `zelman/lens` repo
3. Push to `main`
4. Next user who loads the form gets the new behavior
5. No Vercel deploy. No code change. No broken links.

### Future extensions (not in v1.0):
- **Per-persona guardrail files** (`guardrails-pratt.yaml`) selected at session start
- **A/B testing** via branching: `main` vs. `experiment/deeper-probing`
- **Version pinning** in the form: fetch a specific commit SHA instead of `main` for stability
- **Admin UI** (way later): a simple form that edits the YAML and pushes to GitHub via API
- **Real-time output classifier** — a lightweight post-generation check that evaluates each AI response before it streams to the user. Catches cases where the system prompt alone isn't enough: off-topic drift, accidental therapy-speak, persona leakage, or responses that stray from the current section's signal targets. Could be a second (cheap/fast) model call (e.g. Haiku) that scores the response against the active section's guardrail rules and either passes, rewrites, or flags. Only worth adding if testing reveals consistent breakouts that prompt-level guardrails can't handle. Inspired by what Jack & Jill appears to run — their async output moderation that deleted the JSON fix response. Our version would be synchronous (check before streaming, not delete after).

---

## Checklist Summary

| Step | When | Touches deployed form? |
|------|------|----------------------|
| 1. Finalize schema | Now | No |
| 2. Add to repo (branch) | Now | No |
| 3. Write fetch utility | Now | No |
| 4. Incorporate feedback | After testing | No |
| 5. Refactor JSX | After testing | Yes (deploy) |
| 6. Add js-yaml | After testing | Yes (deploy) |
| 7. Merge branch to main | Deploy day | No (config only) |
| 8. Deploy to Vercel | Deploy day | Yes |
| 9. Smoke test | Deploy day | No |

Steps 1-3 are safe to do today. Steps 4-9 are one coordinated deploy after testers finish.
