# Recruiter → Candidate Lens Spec

**Version:** v0.2
**Date:** April 15, 2026
**Status:** Draft — pending recruiter workflow validation
**Author:** Eric Zelman + Claude (Lens Project)
**Changelog:** v0.2 adds engagement detection patterns to §5 conversation design and conversationConfig schema. v0.1 was initial 10-question spec.

---

## Purpose

This spec defines the recruiter-facing Candidate Lens — the flow in which a recruiter uses the Lens product to build a structured professional identity document about a candidate they're placing. This is distinct from the self-service Candidate Lens (where a candidate builds their own lens independently).

The recruiter→Candidate Lens is the primary product for the target buyer: boutique retained executive search firms placing $300K+ candidates.

---

## Core Principles

1. **The Lens is a conversation catalyst, not an assessment verdict.** The output isn't a score — it's a shared object that enables better conversations between recruiter↔candidate, recruiter↔client, and eventually peer↔peer. (Source: Jordan Frank insight on DISC peer discussions, April 2026.)

2. **Signal matching over keyword matching.** The system extracts identity-level signal, not resume keywords.

3. **AI + radiologist > AI alone.** The AI surfaces patterns the recruiter can't see unaided. The recruiter brings judgment, context, and relationship. Neither is sufficient alone. (Source: Anne Birdsong x-ray analogy.)

---

## 1. Initiation Model

**Decision:** Model C (recruiter-primed candidate session) is the target. Model B (candidate self-service with recruiter editorial) is viable for MVP/POC.

- **Model B (MVP):** Recruiter sends candidate a link. Candidate completes a discovery session. Recruiter reviews output and adds annotations.
- **Model C (target):** Recruiter builds a Role Lens first. Role lens context primes a tailored AI conversation with the candidate. Recruiter reviews output with both self-reported and role-specific signal.

**Implication:** The Role Lens is the prerequisite for Model C. It must exist before the candidate session can be intelligently primed. Role lens leads in both pitch sequencing and product sequencing.

---

## 2. Recruiter Inputs

The recruiter holds signal a candidate would never self-report:

- What the client actually said about the role (vs. the JD)
- Behavioral observations from intake calls
- What references actually said (vs. candidate's expectations)
- How the candidate compares to others in the pool
- Red flags and pattern recognition from experience

### Three input buckets

| Bucket | Description | Visibility |
|---|---|---|
| **Injected context** | Recruiter explicitly opts in to feed this into the AI session. Shapes emphasis and depth of discovery. | Invisible to candidate, shapes their session |
| **Recruiter notes** | Private observations, gut feelings, reference concerns, comparison notes. Never enters the AI session. | Recruiter-only |
| **Auto-derived signals** | System-generated observations from the candidate session itself (future state). | Recruiter-only, surfaced as observations not conclusions |

### Sensitive data toggle

Each piece of recruiter context gets a toggle: "inject into candidate session" vs. "recruiter notes only." Default is OFF (safe by default). Recruiter actively opts in.

**Design constraint:** Injected context should shape *emphasis and depth*, not inject specific lines of questioning that feel planted. The AI covers all sections regardless — it just goes deeper where the recruiter flagged. This prevents candidates from detecting that hidden context is shaping their session.

### How hidden context could leak

- AI asks suspiciously specific questions the candidate didn't prompt
- AI knows things it shouldn't (e.g., compensation expectations)
- AI conspicuously skips topics (signaling pre-loaded agenda)
- Candidates comparing sessions reverse-engineer differential tailoring

---

## 3. Output Document

One underlying data object with three views:

### Candidate view
- Their discovery output + scoring dimensions
- Minus anything recruiter marked as private
- Feels like "their" document
- What the candidate reviews and approves

### Recruiter view
- Everything: Candidate Lens + injected primer + recruiter notes + auto-derived signals + match score against Role Lens + candidate comparison within the search
- The recruiter's working document

### Client view (MVP: auto-generated brief)
- Auto-generated candidate brief the recruiter edits and forwards
- Replaces/augments the traditional 2-page candidate write-up
- **MVP delivery:** Email-forward-ready document (PDF or link)
- **Future:** Live document with interactive features

### Auto-generated brief pattern
System drafts the brief from the Candidate Lens + Role Lens match. Recruiter edits before sending. Same mental model as AI-assisted writing — you don't want a blank page, you want a strong draft to shape.

### Future: Dynamic client view
- Live document with sliders to re-weight scoring dimensions
- Side-by-side candidate comparison against Role Lens
- Dimensions are generated from the specific Role Lens, not hardcoded
- Slider guardrails prevent extreme/invalid weightings
- **Key moment:** Sliders make stakeholder misalignment visible. Different stakeholders weight differently → rank order shifts → recruiter surfaces a disagreement the client didn't know they had.

---

## 4. Role Lens Connection

**Decision:** Model B — the Role Lens generates the candidate session.

The Role Lens captures stakeholder-aligned requirements for a specific search. The candidate session is tailored to explore dimensions that matter for this role. This means:

- Every search produces a role-specific candidate session
- The AI doesn't re-ask things the recruiter already knows
- It goes deeper on gaps and ambiguities specific to this role

### Matching architecture

| Match type | Description | Example |
|---|---|---|
| **Direct alignment** | Shared dimension, score proximity | Candidate wants greenfield → role is greenfield |
| **Inferred alignment** | Different dimensions, system infers connection | Candidate thrives in high-autonomy → CEO is hands-off |
| **Tension surfacing** | Active conflict, flagged explicitly | Candidate disqualifier = no travel → role requires 40% travel |

Tensions are called out separately from scores. No amount of re-weighting fixes a hard conflict.

### Shared taxonomy (future state)

A meta-dimension layer that both Role Lenses and Candidate Lenses map to. Enables:
- Cross-search candidate comparison
- Enterprise organizational lens (shared culture/values + role-specific variations)
- Internal mobility (re-score existing Candidate Lens against new Role Lens)

**Decision:** Shared taxonomy emerges from usage, not imposed upfront. Build for Model B now; architecture should not preclude taxonomy layer.

---

## 5. Conversation Design

Three-layer structure, adapting to candidate state:

### Layer 1: Foundation (baseline, ~15 min)
Every candidate session covers core territory regardless of role:
- Who are you
- How do you work
- What do you want
- Hard no's / disqualifiers

Ensures a complete Lens document. Feeds the shared taxonomy in future state. Consistent baseline signal across all candidates.

### Layer 2: Tailored deep-dive (from Role Lens, ~15-20 min)
Generated from Role Lens dimensions. Questions that don't exist in generic discovery:
- "How have you handled inherited messes?"
- "Tell me about rebuilding trust with enterprise accounts"
- "What's your approach when customers are already angry?"

This is where Model B's differentiated signal lives.

### Layer 3: Recruiter primer probes (from injected context, ~5 min)
Woven into the flow naturally, not a separate visible section:
- "Explore their narrative about the transition from Company B"
- "They're considering two other opportunities — explore what would make this one the clear winner"

Candidate should not notice a gear shift.

### Depth tiers

| Tier | Duration | When used | Signal quality |
|---|---|---|---|
| **Quick screen** | 5-7 min | Initial pool (one of 8+), possibly smart form not conversation | Baseline pass/fail |
| **Standard discovery** | 15-20 min | Serious candidates (2-3 per search past screening) | Role-specific signal |
| **Full depth** | 30-40 min | Finalists or candidates in genuine discovery state | Coaching-depth signal |

**MVP:** One depth tier — standard discovery (15-20 min).

**Key insight:** The candidate does the session asynchronously. The recruiter's time investment is reviewing the output (~5-10 min per candidate), not sitting through sessions. This scales.

### Performative response pattern

Candidates sent a link by a recruiter will perform, not reflect. This is structural, not fixable. Design around it:

- **Performative responses are still signal.** What someone emphasizes, skips, and how they frame failures is readable even when they're performing.
- **The Lens is a structured self-presentation, honestly labeled.** Not pretending to be deeper.
- **Pre-session curation choices are behavioral signal.** Which documents they upload, which LinkedIn recommendations they kept, what they chose to share — captured before performance begins.
- **The coaching framing helps at the margins** but doesn't solve the fundamental incentive.
- **The real honesty unlock is the conversation that follows,** not the session itself. The lens creates the scaffolding for a human conversation where probing, clarification, and authentic signal emerge.

### Engagement detection (in-session, MVP)

The AI must actively monitor how the candidate engages, not just what they say. A human interviewer notices mismatches, rehearsed answers, avoidance, and energy shifts — the AI must do the same. This is distinct from the AI Observer Signal layer (§6, future state) — engagement detection is real-time conversation behavior that makes the session feel human, not a post-hoc analysis feature.

Six detection patterns:

| Pattern | What it looks like | AI response | Signal value |
|---|---|---|---|
| **Mismatch** | Answer doesn't address the question asked | Acknowledge, then gently re-ask. Name the redirect. | The pivot itself is signal — avoidance or different interpretation |
| **Rehearsed material** | Polished, no pauses, sounds like a pitch | Shift to an unexpected follow-up that forces real-time thinking | Gap between rehearsed and authentic reveals self-awareness |
| **Repetition** | Candidate reuses a story from earlier | Name it gently, ask for a different example | May indicate limited experience breadth |
| **Surface-level engagement** | Brief, non-specific answers across multiple questions | Ask for a specific story or moment; name the pattern if persistent | Performance mode — the pattern is the signal |
| **Emotional shifts** | Energy or specificity changes between topics | Name positive shifts ("you seem energized by that"); note negative shifts silently | Maps to energy/drain patterns in the Lens |
| **Contradictions** | Statement conflicts with earlier answer | Probe gently ("help me understand how those fit together") | Response reveals growth, context-shifting, or avoidance |

These patterns are captured in the session config's `conversationConfig.engagementDetection` field and are instructions for the conversation AI, not a separate feature. They should make the conversation feel responsive and human without making the candidate feel surveilled.

### Three signal types (honestly labeled)

1. **Structured self-presentation** — from the candidate session
2. **Behavioral signal from curation** — from uploaded materials and choices
3. **Observer assessment** — from the recruiter's annotations and (future) AI-derived observations

---

## 6. Observer Signal

Four observer types, layered:

| Observer | Source | Enters system via | MVP? |
|---|---|---|---|
| **Recruiter** | Intake calls, references, behavioral observations | Structured annotations per Lens section | Yes |
| **AI** | Conversation pattern analysis (response specificity, energy shifts, contradictions) | Auto-derived, surfaced as observations not conclusions | No — next layer |
| **Client** | Interaction analytics on live document (time spent, slider adjustments, sections explored) | Passive capture | No — future |
| **Peer** | Team members reviewing each other's lenses | Structured prompts after peer review | No — enterprise expansion |

**Convergence/divergence across observers is the highest-value signal.** When all observers agree, confidence is high. When they diverge, that's the conversation the recruiter needs to facilitate.

**X-ray analogy (Anne Birdsong):** The AI observer is the imaging. The recruiter is the radiologist. The candidate session is the patient history. The client conversation is the treatment decision. All in the room together.

---

## 7. Ownership

| Layer | Owner | Rationale |
|---|---|---|
| Candidate's self-presentation | Firm (recruiter flow) / Candidate (self-service flow) | Recruiter-commissioned = firm asset. Self-service = candidate asset. |
| Recruiter observations | Firm | Proprietary judgment, competitive advantage |
| Match analysis | Shared | Joint product of two inputs |
| Role lens | Firm (co-owned with client) | Firm did the work; client's truth is raw material |

### Portability (design principle, not launch feature)

- Build the Lens format so it doesn't preclude portability
- Recruiter flow produces firm-owned asset at launch
- Self-service flow produces candidate-owned asset
- Both output the same format
- Someday the format could be a standard

### Vision: PKI analogy (parked)

"Lens is to jobs as PKI is to security."
- Public lens = shared professional identity (public key)
- Private lens = kept by candidate (private key)
- Recruiter/firm = certificate authority (validates the lens)
- Interoperable protocol = any Candidate Lens scores against any Role Lens
- Long-term: professional identity verification layer embedded in hiring

---

## 8. Workflow Fit

**Status: TBD — dependent on recruiter validation.**

### Hypothesized search phases and lens entry points

| Phase | Timeline | What happens today | Lens entry point |
|---|---|---|---|
| Client engagement | Weeks 1-2 | Written spec / internal brief | Role Lens (future) |
| Sourcing | Weeks 2-4 | LinkedIn, network, referrals | None (unless candidate has prior Lens) |
| First-round screening | Weeks 3-6 | 30-min phone screens, narrow to 8-10 | Quick screen tier |
| Deep evaluation | Weeks 5-8 | Substantive conversations, references | Standard discovery |
| Finalist presentation | Weeks 7-10 | Written brief, verbal walkthrough | Auto-generated candidate brief |
| Interview support | Weeks 8-14 | Coaching both sides | Lens as prep tool (future) |

### Wedge hypothesis
Phase 5 (finalist presentation) is the wedge. Pain is most acute — the recruiter spent 8 weeks building conviction and has 30 minutes to convey it. A better candidate brief pulls adoption backward through the workflow.

### Validation needed (Mike Toohey meeting, Jenn Monkiewicz follow-up)
- How do you share candidate information with hiring managers?
- What does the hiring manager look at before an interview?
- How does the debrief happen — structured or freeform?
- General workflow validation: 8 questions sent via email

---

## 9. Client Presentation

**Status: TBD — dependent on same recruiter validation as #8.**

### Working assumption
Email-forward-and-discuss, not live dashboard. The recruiter emails candidate materials with commentary. Client skims, forwards to stakeholders, schedules interviews.

### MVP
Auto-generated candidate brief (PDF or link) that the recruiter edits and forwards. Replaces/augments the traditional 2-page write-up.

### Future
Live document with sliders, side-by-side comparison, interview prep generation. Adopted after trust is established — probably the 2nd or 3rd search a firm runs with the tool.

---

## 10. MVP / POC

### Five-step flow

```
1. Recruiter enters role context (structured form, not full AI Role Lens)
        ↓
2. System generates a tailored candidate session
        ↓
3. Candidate completes the session (15-20 min, asynchronous)
        ↓
4. Recruiter reviews output, adds annotations
        ↓
5. System generates candidate brief → recruiter edits → forwards to client
```

### What's in

- Structured role input (key dimensions, priorities, context — form-based)
- Single-depth candidate session (15-20 min, role-context-shaped)
- Candidate Lens output (YAML + markdown)
- Recruiter review and annotation interface
- Auto-generated candidate brief for forwarding

### What's out (for now)

- Full AI-facilitated Role Lens builder
- Multiple depth tiers (quick screen, full depth)
- AI observer signal surfacing
- Dynamic sliders and re-weighting
- Live client dashboard
- Shared taxonomy / cross-search comparison
- Candidate portability
- Peer observer layer

### Success criteria
A recruiter uses the POC on a live search and says: "The candidate brief was good enough that I sent it to my client without rewriting it from scratch, and the conversation that followed was better than usual."

---

## Open Dependencies

| Dependency | Status | Blocker for |
|---|---|---|
| Mike Toohey meeting (next week) | Scheduled | #8 workflow validation, #9 client presentation |
| Jenn Monkiewicz follow-up | Email sent | Workflow validation + lens testing |
| Beth Stewart response | Pending (P1) | Retained search practitioner access |
| Chris Lyon intro (via Anne Birdsong) | Pending | Additional recruiter perspective |
| Edie Hunt follow-up | Call completed 4/7 | Buyer validation done; workflow detail needed |

---

## Roadmap Sequence

```
NOW:    POC (5-step flow above)
        ↓
NEXT:   Full Role Lens builder
        Multiple depth tiers
        AI observer signal layer
        ↓
THEN:   Dynamic client view with sliders
        Cross-search comparison
        Shared taxonomy
        ↓
LATER:  Enterprise organizational lens
        Internal mobility scoring
        Peer observer layer
        Candidate portability
        ↓
VISION: PKI — professional identity verification protocol
```

---

*Living document. Update as recruiter validation data comes in and POC build progresses.*
