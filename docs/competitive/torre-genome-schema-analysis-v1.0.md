# Torre.ai Genome — Schema Analysis & Lens Implications

**Version:** v1.0
**Date:** 2026-04-21
**Destination:** `specs/torre-genome-schema-analysis.md` in `zelman/lens`
**Status:** Research brief; input to `candidate-lens-schema.md` (pending) and `role-lens-schema.md` (exists).

---

## TL;DR

Torre's Genome is broad-and-shallow structured-field portability. The Lens approach is narrow-and-deep coaching-driven narrative. **Do not copy Torre's schema; borrow four ideas from it and reject three.**

**Borrow:**
1. **Non-interests as a first-class field** (Torre calls them "non-interests"; we already have Disqualifiers — rename or align).
2. **Self-awareness as a ranking factor** — validates our thesis that deeper self-report predicts better match.
3. **URL-based portability semantics** — every Genome has a canonical URL; we should do the same for every Lens.
4. **Skill graph / ontology** — long-term, we need a way for "Python" and "programming in Python" and "backend Python engineering" to be recognized as related. Not v1, but put a stake in the ground.

**Reject:**
1. **Binary visibility toggle.** Torre has one switch ("visible to talent seekers" or not) and their terms of service explicitly acknowledge public profiles get scraped by search engines. This is NOT a precedent for our public-lens / private-lens PKI vision. Torre has not solved the granular-privacy problem; we still have to.
2. **"Thousands of data points" structured-field density.** Torre treats richness as field count. Lens treats richness as narrative depth per section. Different philosophies; their approach commoditizes candidates into data, ours positions them as subjects of a document.
3. **Platform-bound matching as the point of the artifact.** Torre's Genome exists to feed Torre's 9-model AI matching stack. Our Lens exists to be a shared artifact that ANY scoring system (or human) can use.

**Flag:**
Torre has pivoted toward "Emma" (AI recruiter) + "apply on your behalf" — they're moving into Jack & Jill territory while keeping Genomes as infrastructure. This is strategically interesting: **infrastructure layer + AI agent on top** is a composable architecture worth studying for our own long-term product shape.

---

## What Torre's Genome Actually Contains

Per Torre's public pages (torre.ai/os, torre.ai/apiforcompanies, torre.ai/jobmatchingmodel), the Genome includes:

**Factual layer:**
- Experience (work history)
- Hard skills
- Soft skills
- Certifications
- Portfolio
- Reference checks
- Recommendations
- Contact networks / connections
- Language proficiency (tested)

**Preference layer:**
- Preferences (role attributes desired)
- Interests
- **Non-interests** (explicit opt-outs — Torre treats this as a distinct data type)

**Inferred / deeper layer:**
- Psychometrics (Torre administers psychometric tests)
- Professional behavior
- Self-awareness
- Learning speed and capabilities
- Behavioral traits

**Metadata / ranking layer:**
- Genome completion score (how filled-out is the profile)
- Skill-recommendation weight (how reliably endorsed are the claimed skills)
- Self-awareness factor (do candidates' applications match their stated strengths)

Torre quantifies this as "thousands of data points" and uses 112 factors across 9 AI models to produce match scores.

---

## Architectural comparison

| Dimension | Torre Genome | Lens Document (current design) |
|---|---|---|
| **Intake method** | Self-filled forms + uploaded docs + psychometric tests | Coaching-depth AI-guided conversation (45 min) |
| **Primary format** | Structured fields in Torre's database; exposed via API | Markdown + YAML, candidate-owned file |
| **Richness model** | Broad + shallow — thousands of structured data points | Narrow + deep — 8 sections with narrative + signal extraction |
| **Scoring architecture** | Torre's 9-model proprietary AI stack | Open — any scoring system can read the YAML |
| **Portability** | Genome lives in Torre's platform; URL-based sharing; terms acknowledge scraping | Candidate downloads .md; host-agnostic |
| **Privacy model** | Binary on/off toggle in preferences | TBD (see below) |
| **Updates** | Edits in Torre UI | Append-only (per Eric's working patterns) |
| **Matching target** | Jobs posted on Torre + company talent pools | Role Lens (company-side sibling document) |
| **Monetization** | Free for candidates; paid for companies (subscription + per-post) | Per-search $2–5K to retained firms |

---

## On the privacy / public-vs-private question

Torre's privacy model is **disappointing as a reference**. The actual mechanic:

- Single toggle: "deactivate visibility" in preferences.
- When off, profile does not appear to talent seekers on the platform.
- When on, anyone with the URL can see the full Genome.
- Terms of service explicitly state: *"Professional Genomes, including yours, can be copied by search engines and other third parties accessing the Product."*
- Contact info may be masked at Torre's discretion.

There is no concept of:
- Public sections vs. private sections within the same Genome
- A "public Genome" (summary) distinct from a "full Genome" (detailed)
- Third-party attestation or certificate-authority-style signing
- Time-bounded access grants (share with Firm X for 30 days)

**Implication for Lens:**
Our PKI vision — public lens as shared identity, private lens as candidate-held, recruiter/firm as certificate authority — has no precedent in Torre. They haven't solved it; they've ducked it.

This is actually useful news: there's no incumbent mechanic to compete with, and the obvious analogs (LinkedIn public profile + resume; Torre visibility toggle) are all binary. If Eric designs a real granular-privacy model, it's differentiated by existing — not better.

Concrete design recommendations for the Lens privacy model (informed by what Torre does NOT do):

1. **Two documents, not one with toggles.** `public-lens.md` and `private-lens.md`, with an explicit mapping of which sections propagate from private → public. Binary visibility at the document level is simpler to reason about than section-level toggles within one file.

2. **Public lens = narrative identity only.** Mission, work style, what fills you, situation (high-level). No disqualifiers, no specific compensation, no named organizations in disqualifier lists, no personal circumstance detail.

3. **Private lens = full artifact.** Everything in the public lens plus disqualifiers, values behavioral evidence, situation specifics, timeline, compensation expectations, references.

4. **Recruiter shares the public lens with the client.** Keeps the private lens as candidate↔recruiter shared context. Client sees narrative identity; recruiter holds the detailed evidence. This maps cleanly to how retained search firms already work.

5. **Signing / attestation comes later.** v1.0 is just the two-document split. PKI-style certificate-authority work is a v2 concern once the format is adopted.

---

## Lessons from Torre's pivot

Torre launched as "portable professional Genome." It pivoted toward "Emma the AI recruiter" + "apply on your behalf" + "automate 90% of recruiter work." The Genome is now infrastructure beneath the AI recruiter layer.

Strategic read:
- **The portable artifact alone was not a business.** Torre raised $10M seed on the Genome thesis, then needed the AI recruiter product on top to monetize.
- **The infrastructure-plus-agent architecture is a viable shape.** Genome layer (portable, open) + AI recruiter layer (proprietary, monetized). We could plausibly run that play: open Lens format + proprietary Lens-based matching/briefing pipeline for retained firms.
- **Jack & Jill built the AI recruiter first and didn't bother with a portable layer.** Torre built the portable layer first and had to add the AI recruiter. Both converged on "AI recruiter is where the money is." Eric's differentiation is not "we have both" — it's "our AI operates in service of a candidate-owned artifact, not a platform-locked profile."

---

## Four specific schema changes to consider for the Candidate Lens

Based on Torre comparison, these are candidate schema additions or renamings worth considering for the Lens markdown+YAML spec:

**1. Rename "Disqualifiers" → "Non-interests" OR keep both.**
Torre uses "non-interests" in candidate-facing language. Softer framing that may lower the intake resistance some testers reported. Counterargument: "disqualifier" is more honest about its function (hard exclusion filter). Possible answer: internal key stays `disqualifiers`, UI label is "Non-interests" or "Hard no's."

**2. Add a `self_awareness` signal.**
Not as a user-filled field, but as a derived score from the synthesis pre-pass: does the lens internally contradict itself? Does the candidate's stated values align with the behavioral evidence they describe? This is pattern-extracting at a meta level. Torre validates this as a ranking signal; we should too.

**3. Add explicit `endorsements` or `recommendations` support.**
Torre has reference checks + recommendations baked in. We've been silent on this. For retained search, the reference-check phase is a major cost center. A Lens that can carry structured reference-check signal (even simple: "Name, Role, relationship, 1-sentence endorsement") gives recruiters something they don't get from a PI profile or a resume. Nice-to-have for v1; strong differentiator for v2.

**4. Add a canonical URL / identifier field.**
Every Torre Genome has a URL. Every Lens should have one too — even if it just points to a candidate-held file hash, the concept of "this Lens is addressable" unlocks interop. Candidate owns the file; URL is optional. Format: `lens:{uuid}` or similar.

---

## Three specific schema things to reject

**1. Broad structured-field density.**
Torre's "thousands of data points" model optimizes for AI matching. Our model optimizes for human conversation. Resist any pressure to add 50 new structured fields "for better matching." Depth per section > count of sections.

**2. Platform-mediated skill graph in v1.**
Torre has a skill ontology that normalizes equivalent terms. This is expensive, maintenance-heavy, and only pays off at scale. For retained exec search, we can defer by having recruiters/clients specify skill requirements in natural language and relying on LLM-based matching. Revisit at enterprise tier.

**3. Psychometric tests in the intake.**
Torre administers psychometric assessments as part of Genome building. This is PI's game. Stay out of it. Our discovery is coaching-methodology-driven; if we add psychometric content it undermines the "catalyst not verdict" positioning vs. PI.

---

## Open questions

- Does Torre have a `.torreresume` or equivalent export format the candidate can take away? Research needed — if yes, it's a direct interop candidate. If no, it's just another platform.
- What's Torre's current scale? $10M seed (2021 era), now in Crunchbase as pre-seed (stale data?), CEO Alex Torrenegra, based in San Francisco. Need fresh revenue/customer numbers — unavailable in current search results.
- How does Torre's "Emma" position against Jack & Jill? Direct conversation worth tracking.

---

## Implications for other Lens artifacts

**Triggers revision of:**
- `role-lens-schema.md` — consider adding a `public_summary` section that mirrors the public-lens / private-lens split on the candidate side
- `CONTEXT-lens-project.md` — add brief note under Design Principles that public-lens / private-lens is a two-document model, not a section-level toggle
- Kanban — add a P2 card: "Candidate Lens schema v2 — incorporate non-interests rename, self-awareness signal, canonical URL, endorsements structure"
- Competitive Intelligence row for Torre (`recZnggmURjMWn0at`) — update with "Torre has NOT solved granular privacy; binary toggle only" finding

**Does NOT trigger revision of:**
- Current intake form (v2.15) — schema changes are downstream of getting the synthesis quality right
- Scoring pipeline — current weights are calibrated to the existing schema

---

## Revision log

- **2026-04-21 (v1.0):** Initial analysis based on Torre's public pages (torre.ai/os, /apiforcompanies, /apiforcandidates, /jobmatchingmodel, /terms) and secondary coverage. Claude research session.

---
