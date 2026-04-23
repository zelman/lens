# Claude Code Session Brief: R→C Session Generation Engine

**Date:** April 14, 2026
**Kanban card:** "R→C: Session Generation (role context → tailored questions)"
**Spec reference:** `recruiter-candidate-lens-spec-v0.1.md` (§4, §5, §10)
**Depends on:** Role input form (built, outputs JSON to session storage)
**Repo:** `zelman/lens`
**Deploy target:** `lens-app-five.vercel.app`

---

## Objective

Build the engine that transforms a recruiter's role context into a tailored candidate discovery session. This is the core intelligence of the product — what makes a Lens session different from a generic AI conversation.

The engine has four steps:
1. **Dimension extraction** — AI reads role context, outputs structured dimensions
2. **Recruiter review** — lightweight UI to confirm/adjust dimensions
3. **Session config generation** — dimensions + candidate materials → full session config
4. **Candidate conversation** — multi-turn AI session driven by the config

This brief covers Steps 1-3. Step 4 (the candidate conversation) is a separate brief that consumes the session config output.

---

## Architecture Overview

```
Role Context JSON ──→ /api/extract-dimensions ──→ Dimension Set
                                                        │
                                                        ▼
                                               Recruiter Review UI
                                              (confirm/edit/reorder)
                                                        │
                                                        ▼
Dimension Set + Candidate Materials ──→ /api/generate-session ──→ Session Config
                                                                       │
                                                                       ▼
                                                          Candidate Discovery
                                                          (separate brief)
```

---

## Design System

Same International Style as all Lens UI. See `rc-role-input-form-brief.md` for full token reference. The recruiter review step is a new UI screen within the recruiter flow.

---

## API Proxy (CRITICAL)

All Anthropic API calls go through Vercel serverless functions. No client-side API keys. Same pattern as existing app:
- Production model: `claude-sonnet-4-6`
- MAX_TOKENS: 4000 for dimension extraction, 6000 for session config generation
- Temperature: 0.3 (we want consistency, not creativity)
- Timeout budget: 58s with graceful degradation

---

## Step 1: Dimension Extraction

### Endpoint: `/api/extract-dimensions`

**Input:** The full role context JSON from the role input form (the exact structure Eric tested — see the JSON blob in this project's conversation history, or test with the Clarion Health scenario from `rc-lens-test-data-v1.0.md`).

**System prompt design:**

```
You are a dimension extraction engine for executive search. You read a recruiter's 
role context — including structured fields, uploaded documents, and recruiter notes — 
and identify the 4-8 most important dimensions to explore in a candidate discovery 
session.

A "dimension" is a specific quality, capability, or characteristic that matters for 
THIS search. Not generic competencies — role-specific ones that emerged from the 
recruiter's context.

Rules:
- Extract 4-8 dimensions. No fewer than 4, no more than 8.
- Rank by importance: "critical" (must explore deeply), "high" (significant time), 
  "moderate" (touch on in foundation).
- For each dimension, identify what to explore, what good signal looks like, and 
  what red flags look like.
- Draw from ALL sources: form fields, JD text, stakeholder notes, team context docs, 
  and any other uploaded materials.
- Dimensions should be specific to this search, not generic. "Leadership ability" is 
  too generic. "Trust-building with a protective founder who has failed to delegate 
  before" is specific.
- Do NOT include dimensions that come solely from the "recruiterOnly" field — that 
  content is private and should not shape candidate-visible exploration.
- DO use recruiterOnly content to inform your understanding of the role dynamics, 
  but the dimensions themselves should be derivable from non-private sources.

Respond with ONLY valid JSON, no markdown, no backticks, no preamble.
```

**Output schema:**

```json
{
  "roleContext": {
    "summary": "VP of Customer Success at Clarion Health, Series B healthcare SaaS. Greenfield build, 42 enterprise health system clients, CEO is protective of client relationships.",
    "roleTitle": "VP of Customer Success",
    "company": "Clarion Health"
  },
  "dimensions": [
    {
      "id": "clinical_fluency",
      "label": "Clinical Fluency",
      "importance": "critical",
      "sources": ["CEO quotes in stakeholder notes", "JD requirements", "team context showing clinical gaps"],
      "whatToExplore": "Can this person engage credibly with CMOs and CIOs about quality measures, clinical workflows, and health system operations? Do they understand healthcare from the inside?",
      "signals": [
        "Specific clinical terminology used naturally, not rehearsed",
        "Examples involving clinical stakeholders by role, not just 'the client'",
        "Understanding of regulatory context (CMS, Joint Commission, HEDIS)"
      ],
      "redFlags": [
        "Generic enterprise language applied to healthcare contexts",
        "No examples involving clinicians directly",
        "Clinical knowledge that sounds memorized rather than experiential"
      ]
    },
    {
      "id": "builder_orientation",
      "label": "Builder vs. Operator",
      "importance": "critical",
      "sources": ["JD (greenfield, build from scratch)", "role context (no playbook, no process)"],
      "whatToExplore": "Has this person built a CS function from zero, or have they only scaled existing ones? Are they energized by ambiguity or do they need structure?",
      "signals": [
        "Specific stories about creating something from nothing",
        "Comfort describing messy early stages without retrospective cleanup",
        "Language like 'figured it out' vs 'implemented the playbook'"
      ],
      "redFlags": [
        "Every example starts with 'I inherited a team of...'",
        "Heavy emphasis on tooling and process without first-principles thinking",
        "Discomfort when asked about working without established systems"
      ]
    }
    // ... 2-6 more dimensions
  ],
  "foundationOverlaps": {
    "work_style": "builder_orientation",
    "values": null,
    "essence": null,
    "mission_sector": "clinical_fluency",
    "energy": null,
    "disqualifiers": null,
    "situation_timeline": null
  }
}
```

The `foundationOverlaps` field maps standard discovery sections to extracted dimensions. When a foundation section overlaps with a tailored dimension, the session merges them (go deeper instead of duplicating).

### Error handling
- If the role context is too thin (e.g., only a title and company, no documents), return a minimum of 4 generic-but-reasonable dimensions and flag to the recruiter: "We extracted these dimensions from limited context. Upload more documents or add detail to improve session quality."
- If the API call times out, return a graceful error and let the recruiter retry.

---

## Step 2: Recruiter Review UI

### New screen in the recruiter flow (after role input, before generating candidate link)

**Layout:** 

Header: "Based on your search context, we'll explore these dimensions with candidates:"

Then a list of dimension cards, each showing:
- **Label** (editable inline — click to rename)
- **Importance badge** (critical / high / moderate — click to cycle)
- **Drag handle** for reordering

Below the list:
- **"+ Add dimension"** button — opens a text input for the recruiter to add a custom dimension (label only — the AI will flesh it out in Step 3)
- **"Remove"** — small X on each card to delete a dimension

Footer:
- Summary line: "3 critical, 2 high, 1 moderate — estimated session time: 18 minutes"
- **"Generate candidate session"** button — triggers Step 3

**What the recruiter does NOT see:**
- `whatToExplore` (AI instruction, not for human consumption)
- `signals` and `redFlags` (AI instruction)
- `sources` (internal attribution)
- `foundationOverlaps` (architectural detail)

**What the recruiter DOES see:**
- Dimension labels and importance levels
- The ability to reorder, rename, add, remove, and change importance
- A time estimate that updates dynamically based on dimension count and importance

**Time estimation logic:**
- Critical dimension: ~4 minutes of session time
- High dimension: ~3 minutes
- Moderate dimension: ~1.5 minutes
- Foundation (fixed): ~7 minutes
- Total = foundation + sum of dimension times
- Display as a range: "Estimated session: 16-22 minutes"

**Persistence:** Save the reviewed dimension set to session storage. This is the input for Step 3.

---

## Step 3: Session Config Generation

### Endpoint: `/api/generate-session`

**Input:** Two things:
1. The reviewed dimension set (from Step 2, which includes the original role context)
2. Candidate pre-loaded materials (if available — resume, LinkedIn, etc.)

The candidate materials may or may not exist at this point. If the recruiter uploaded them in the "Candidate materials to pre-load" category during role input, they're available. If not, the session runs without pre-load adjustments.

**System prompt design:**

```
You are a session config generator for an AI-facilitated candidate discovery 
conversation. You take a set of role-specific dimensions and (optionally) a 
candidate's pre-loaded materials, and produce a complete session configuration 
that will drive a 15-20 minute discovery conversation.

The session has three layers:

FOUNDATION LAYER (~40% of session time):
Standard discovery sections that every candidate goes through regardless of role.
These ensure a complete lens document. The sections are:
1. Essence — identity patterns, throughline across career contexts
2. Values — behavioral evidence of what they actually value
3. Work Style — how they operate day-to-day
4. What Fills You — energy sources and drains
5. Disqualifiers — hard no's
6. Situation & Timeline — urgency, constraints

If a foundation section overlaps with a tailored dimension (indicated in 
foundationOverlaps), MERGE them — go deeper on the overlapping topic instead 
of covering it twice.

If candidate materials are pre-loaded, adjust the foundation:
- Skip topics fully covered by the resume (career walkthrough, education)
- Go deeper on topics the resume raises but doesn't explain (career transitions,
  gaps, role changes)
- Reference specific resume details to ask better questions

TAILORED LAYER (~50% of session time):
Role-specific exploration driven by the extracted dimensions. For each dimension:
- Generate 1-2 opening questions that enter the topic naturally (coaching style,
  not interrogation)
- Provide follow-up guidance for the AI (what "good" vs "thin" signal sounds like)
- Define what to extract from the candidate's responses (structured observations)

Opening questions should be:
- Specific enough to target the dimension
- Open enough to let the candidate reveal themselves
- Grounded in the candidate's context if pre-loaded materials are available
- NOT leading or evaluative ("How good are you at X?" is bad)
- Coaching-style ("Tell me about a time..." or "Walk me through how you 
  approached..." or "What was going through your mind when...")

PRIMER LAYER (~10% of session time):
If the role context includes injected recruiter primer probes, weave them into 
the conversation naturally. These should NOT be separate visible sections — they 
should feel like natural follow-ups within the foundation or tailored layers.

CONVERSATION INSTRUCTIONS:
- Tone: coaching — warm, curious, non-evaluative
- Transparency: tell the candidate this session is tailored to the opportunity
- Framing: "There are no right answers — we're exploring fit, not testing performance"
- Pacing: don't rush. Let silences happen. Follow the candidate's energy.
- Transitions: move naturally between topics. Don't announce "now we'll discuss X"
- If the candidate gives a thin answer, probe once. If still thin, note it and move on.
- If the candidate goes deep on something unexpected but relevant, follow it.

ENGAGEMENT DETECTION (apply throughout the conversation):
You are not just asking questions — you are actively listening and responding to 
how the candidate engages, not just what they say. A human interviewer notices 
when someone dodges a question, recites a rehearsed answer, contradicts themselves, 
or lights up on one topic and goes flat on another. You must do the same.

- MISMATCH: If the candidate's answer doesn't address the question you asked, 
  acknowledge what they said, then gently re-ask. Name the redirect: "I noticed 
  you went to X — that's useful. But I'm also curious about Y specifically." The 
  mismatch itself is signal — note it in extraction.

- REHEARSED MATERIAL: If an answer sounds polished and prepared (no pauses, sounds 
  like a pitch), shift to a follow-up that forces real-time thinking: "what would 
  you do differently?" or "what if X hadn't worked?" Note the shift from rehearsed 
  to authentic as signal.

- REPETITION: If the candidate reuses a story or example from earlier in the 
  session, name it gently: "You mentioned that earlier — it's clearly important. 
  Can you give me a different example?" Repetition may indicate limited breadth.

- SURFACE-LEVEL ENGAGEMENT: If the candidate gives brief, non-specific answers 
  across multiple questions, try: ask for a specific story, ask about a specific 
  moment, or name the pattern: "I'd love to go deeper on one thing — pick an 
  example and walk me through it step by step." If still surface after probing, 
  note the pattern — this is performance mode.

- EMOTIONAL SHIFTS: Notice when energy or specificity changes between topics. If 
  they light up on one dimension and go flat on another, the shift is signal. Name 
  positive shifts: "You seem really energized by that — tell me more." Don't name 
  negative shifts directly — note them in extraction.

- CONTRADICTIONS: If the candidate contradicts an earlier statement, don't confront. 
  Probe gently: "Earlier you mentioned X, and now you're describing something a bit 
  different — help me understand how those fit together." The response to the probe 
  reveals whether it's growth, context-shifting, or avoidance.

Respond with ONLY valid JSON, no markdown, no backticks, no preamble.
```

**Output schema:**

```json
{
  "sessionId": "ses_clarion_vp_cs_20260414",
  "metadata": {
    "roleTitle": "VP of Customer Success",
    "company": "Clarion Health",
    "estimatedDuration": "16-22 minutes",
    "depthTier": "standard",
    "candidatePreloaded": true,
    "generatedAt": "2026-04-14T23:52:16Z"
  },
  "candidateIntro": {
    "greeting": "Thanks for taking the time to do this. Your recruiter has set up this discovery session specifically for the opportunity at Clarion Health. There are no right answers here — the goal is to understand how you work and what matters to you, so we can assess fit honestly. This should take about 18 minutes.",
    "contextStatement": "I've reviewed your background, so I won't ask you to walk through your resume. Instead, I'd like to go deeper on some specific topics."
  },
  "foundation": [
    {
      "section": "essence",
      "timeAllocation": "2 min",
      "merged_with_dimension": null,
      "instruction": "Candidate has a clear healthcare CS identity on paper. Don't rehash. Ask: 'Looking across your career from Mount Sinai to Cerner to Evidera — what's the thread? What keeps pulling you back to healthcare technology?'",
      "extractionTarget": "Core identity narrative, career throughline, motivation pattern"
    },
    {
      "section": "work_style",
      "timeAllocation": "4 min",
      "merged_with_dimension": "builder_orientation",
      "instruction": "This section merges with the Builder vs. Operator dimension. Skip generic work style questions. Go directly to: 'At Evidera, you built CS from zero. Take me back to week one — what did you do first, and why that?' Follow with: 'What's the hardest part of building something when there's no playbook?'",
      "extractionTarget": "Builder evidence, comfort with ambiguity, first-principles approach"
    },
    {
      "section": "values",
      "timeAllocation": "1.5 min",
      "merged_with_dimension": null,
      "instruction": "Brief exploration. Ask: 'When you think about the best team you've ever been on, what made it work? Not the results — the way people treated each other.'",
      "extractionTarget": "Behavioral values, team culture preferences"
    },
    {
      "section": "energy",
      "timeAllocation": "1.5 min",
      "merged_with_dimension": null,
      "instruction": "Ask: 'In your current role, what gives you energy and what drains it? Be specific — not categories, actual moments in your week.'",
      "extractionTarget": "Energy patterns, sustainability signals"
    },
    {
      "section": "disqualifiers",
      "timeAllocation": "1 min",
      "merged_with_dimension": null,
      "instruction": "Ask: 'Is there anything that would make you walk away from an opportunity regardless of everything else — a hard no?'",
      "extractionTarget": "Non-negotiables, deal-breakers"
    },
    {
      "section": "situation_timeline",
      "timeAllocation": "1 min",
      "merged_with_dimension": null,
      "instruction": "Ask: 'Where are you in your search right now? What's your timeline and what else are you considering?'",
      "extractionTarget": "Urgency, competing opportunities, availability"
    }
  ],
  "tailored": [
    {
      "dimensionId": "clinical_fluency",
      "label": "Clinical Fluency",
      "importance": "critical",
      "timeAllocation": "4-5 min",
      "openingQuestions": [
        "You've worked with health system clients for most of your career. When you walk into a meeting with a CMO or a quality director, how do you think about preparing for that conversation differently than a meeting with, say, a CIO or a VP of Operations?",
        "Tell me about a time a clinical stakeholder pushed back on something your team recommended. What was the disagreement and how did you navigate it?"
      ],
      "followUpGuidance": {
        "ifStrong": "Candidate uses clinical terminology naturally, references specific quality measures or regulatory frameworks, describes clinical stakeholders as peers. Go deeper: 'What's the biggest gap you see between what health tech vendors promise and what clinical teams actually need?'",
        "ifThin": "Candidate speaks generically about 'healthcare clients' without clinical specificity. Probe once: 'Can you give me a specific example — a particular quality measure or clinical workflow — where your understanding of the clinical side made a difference in the outcome?' If still thin, note it and move on.",
        "ifAvoided": "Candidate pivots to business metrics or technology. Note the pivot as a signal."
      },
      "extractionSchema": {
        "observations": [
          "Clinical terminology used (specific terms, natural vs. rehearsed)",
          "Clinical stakeholder engagement examples (by role/title)",
          "Regulatory awareness (CMS, HEDIS, Joint Commission mentions)",
          "Clinical vs. business framing preference"
        ],
        "signalStrength": "strong | moderate | thin | absent"
      }
    },
    {
      "dimensionId": "trust_building_with_founder",
      "label": "Trust-Building with Protective Founder",
      "importance": "high",
      "timeAllocation": "3-4 min",
      "openingQuestions": [
        "This role involves taking over client relationships that the CEO has personally managed since founding the company. That's a sensitive transition. Have you ever been in a situation where you had to earn a founder's or senior leader's trust before they'd let you take over something they cared deeply about? What did you do?",
        "When you've inherited important relationships from someone senior, what's your approach in the first 30 days?"
      ],
      "followUpGuidance": {
        "ifStrong": "Candidate describes a proactive trust-building strategy, shows empathy for the founder's attachment, has specific examples. Go deeper: 'What did you do when the founder or leader started to pull back — wanted to re-engage with the clients you'd taken over?'",
        "ifThin": "Candidate describes a passive approach ('I was given the accounts and managed them'). Probe: 'Was there a moment when the person who handed off the relationships pushed back or expressed concern? How did you handle it?'",
        "ifAvoided": "Note as significant — this is one of the highest-risk dimensions for this role."
      },
      "extractionSchema": {
        "observations": [
          "Relationship inheritance examples (specificity and outcome)",
          "Trust-building strategy (proactive vs. passive)",
          "Managing-up awareness",
          "Empathy for founder attachment"
        ],
        "signalStrength": "strong | moderate | thin | absent"
      }
    },
    {
      "dimensionId": "team_assessment",
      "label": "Team Assessment & Development",
      "importance": "high",
      "timeAllocation": "3 min",
      "openingQuestions": [
        "Imagine you walk into this role on day one. You have three support specialists with different strengths and ceilings, and a sales engineer who wants to move to CS. How do you think about assessing a team you've inherited — what's your framework for figuring out who can grow and who can't?"
      ],
      "followUpGuidance": {
        "ifStrong": "Candidate has a clear assessment framework, is willing to make hard calls, balances development with performance standards. Ask: 'How quickly do you form those judgments? And have you ever been wrong?'",
        "ifThin": "Candidate defaults to 'I always try to develop everyone.' Probe: 'But realistically — have you ever inherited someone you knew in the first two weeks wasn't going to make it? What did you do?'",
        "ifAvoided": "Note — may indicate discomfort with performance management."
      },
      "extractionSchema": {
        "observations": [
          "Assessment framework described (structured vs. intuitive)",
          "Hard call examples (transitions, terminations)",
          "Development vs. performance management balance",
          "Speed of assessment"
        ],
        "signalStrength": "strong | moderate | thin | absent"
      }
    },
    {
      "dimensionId": "executive_presence",
      "label": "Executive Presence with Health System Leadership",
      "importance": "high",
      "timeAllocation": "2-3 min",
      "openingQuestions": [
        "Tell me about the most senior health system executive you've worked with closely — a CIO, CMO, or CFO. What was the relationship and how did you earn their confidence?"
      ],
      "followUpGuidance": {
        "ifStrong": "Candidate names specific executives by title, describes the dynamics naturally. Ask: 'What's different about selling to or managing a relationship with a clinician-executive vs. a business executive?'",
        "ifThin": "Candidate describes executive engagement at VP level or below. Note the ceiling.",
        "ifAvoided": "May indicate limited executive exposure. Significant for this role."
      },
      "extractionSchema": {
        "observations": [
          "Highest-level health system executive engaged",
          "Clinical vs. administrative executive preference",
          "Confidence level describing executive interactions",
          "Domain-specific authority vs. generic presence"
        ],
        "signalStrength": "strong | moderate | thin | absent"
      }
    },
    {
      "dimensionId": "ambiguity_tolerance",
      "label": "Comfort with Ambiguity",
      "importance": "moderate",
      "timeAllocation": "1.5-2 min",
      "openingQuestions": [
        "What's the messiest operational environment you've ever walked into? Not a crisis — just a situation where nothing was defined and you had to figure it out."
      ],
      "followUpGuidance": {
        "ifStrong": "Candidate lights up describing the mess. They enjoy it. Ask: 'What did you build first, and why?'",
        "ifThin": "Candidate describes messes they cleaned up that were already partially structured. Note the difference.",
        "ifAvoided": "May prefer structured environments. Important signal."
      },
      "extractionSchema": {
        "observations": [
          "Messiest environment described (how unstructured?)",
          "Emotional response to ambiguity (energized vs. stressed)",
          "First-move approach (process vs. relationship vs. data)",
          "Comparison to structured environments"
        ],
        "signalStrength": "strong | moderate | thin | absent"
      }
    }
  ],
  "primerProbes": [
    {
      "source": "recruiter_injected",
      "context": "Reference from Evidera CEO hedged on ability to manage up",
      "instruction": "Within the trust-building or work-style discussion, explore: 'When you disagree with a leadership decision that affects your clients, how do you handle it? Can you give me a specific example?' Do NOT reference the specific feedback.",
      "weaveInto": "trust_building_with_founder"
    }
  ],
  "conversationConfig": {
    "model": "claude-sonnet-4-6",
    "maxTokens": 6000,
    "temperature": 0.5,
    "tone": "coaching — warm, curious, non-evaluative",
    "transparency": "Tell the candidate this session is tailored to the specific opportunity. Frame as fit exploration, not performance evaluation.",
    "pacing": "Don't rush. Let silences happen. One question at a time. Follow the candidate's energy when it diverges productively.",
    "transitions": "Move naturally between topics. Don't announce section changes.",
    "thinSignalProtocol": "If a candidate gives a thin answer, probe once with a specific follow-up. If still thin, note it in the extraction and move on. Don't push — thin signal IS signal.",
    "unexpectedDepth": "If the candidate goes deep on something unexpected but role-relevant, follow it. The best signal often comes from unscripted moments.",
    "engagementDetection": {
      "mismatchResponse": "If the candidate's answer doesn't address the question asked, acknowledge what they said ('That's interesting — I want to come back to that'), then gently re-ask the original question. The mismatch itself is signal — note it in extraction. A candidate who pivots away from a question may be avoiding it or may have heard it differently. Name the redirect: 'I noticed you went to X — that's useful. But I'm also curious about Y specifically.'",
      "rehearsedMaterial": "If the candidate sounds like they're reciting a prepared answer (polished phrasing, no pauses, sounds like a pitch), shift to something unexpected that forces real-time thinking. Ask a 'what if' or 'what would you do differently' follow-up that can't be prepared for. Note the shift from rehearsed to authentic as signal.",
      "repetition": "If the candidate repeats a story or example they already shared, name it gently: 'You mentioned that earlier — it's clearly important to you. Can you give me a different example that shows the same thing?' Repetition may indicate limited experience breadth.",
      "surfaceLevelEngagement": "If the candidate consistently gives brief, non-specific answers across multiple questions, try one of: (a) ask them to tell a story instead of answering abstractly, (b) ask about a specific moment rather than a pattern, (c) name the pattern: 'I'm getting high-level answers but I'd love to go deeper on one thing — pick an example and walk me through it step by step.' If they still stay surface, note it — this is performance mode and the signal is the pattern, not the individual answers.",
      "emotionalShifts": "Notice when the candidate's energy or specificity changes between topics. If they light up on one dimension and go flat on another, that shift is signal. Name it when useful: 'You seem really energized by that — tell me more.' Don't name negative shifts directly — just note them in extraction.",
      "contradictions": "If the candidate says something that contradicts an earlier statement, note it but don't confront. Probe gently: 'Earlier you mentioned X, and now you're describing something that sounds a bit different — help me understand how those fit together.' Contradictions can be growth, context-shifting, or avoidance — the response to the probe reveals which."
    }
  },
  "candidatePreloadAdjustments": {
    "resumeAvailable": true,
    "keyFactsExtracted": [
      "15 years CS/healthcare tech experience",
      "Built CS from 0 to 8 at Evidera Health (Series B, clinical decision support)",
      "NRR improvement: 96% to 118%",
      "Cerner background in clinical solutions implementation",
      "Mount Sinai clinical quality coordination background",
      "MHA from University of Michigan"
    ],
    "sectionAdjustments": [
      {
        "section": "essence",
        "adjustment": "Skip career walkthrough. Resume is clear. Ask about the throughline instead — what keeps pulling her back to healthcare technology."
      },
      {
        "section": "skills_experience",
        "adjustment": "Skip entirely — resume covers this. Fold any skills questions into the tailored dimensions where they'll get deeper answers."
      }
    ],
    "contextForOpeningQuestions": "Candidate's Evidera experience (0-to-8 CS build) directly maps to this role's builder requirement. Reference it specifically in the builder_orientation opening. Cerner implementation background maps to clinical fluency — reference it to go deeper rather than re-establish."
  }
}
```

### Candidate preload processing

When candidate materials are available, the `/api/generate-session` endpoint should:

1. Extract key facts from the candidate's resume/documents
2. Identify which foundation sections are already covered (skip or compress)
3. Find natural connection points between the candidate's background and the role dimensions (use these to craft better opening questions)
4. Feed all of this into the session config prompt

When candidate materials are NOT available:
- Foundation sections run at full length (career walkthrough included)
- Opening questions are generic but still role-tailored
- `candidatePreloadAdjustments` section is null

---

## Data Flow Summary

```
Role Input Form
    │
    ▼
Session Storage: role_context.json
    │
    ▼
/api/extract-dimensions (Anthropic API call, temp 0.3)
    │
    ▼
Session Storage: dimensions.json
    │
    ▼
Recruiter Review UI (edit, reorder, confirm)
    │
    ▼
Session Storage: reviewed_dimensions.json
    │
    ▼
/api/generate-session (Anthropic API call, temp 0.3)
    │
    ▼
Session Storage: session_config.json
    │
    ▼
Candidate Discovery (separate brief — consumes session_config.json)
```

---

## Files to Create

### API Routes (Vercel serverless functions)
- `/api/extract-dimensions.js` — takes role context JSON, returns dimensions
- `/api/generate-session.js` — takes dimensions + candidate materials, returns session config

### UI Components
- Dimension review screen (new phase in the recruiter flow, between role input and "generate link")
- Dimension card component (label, importance badge, drag handle, remove button)
- Add dimension input
- Time estimate display

### Shared
- `lib/prompts/extract-dimensions.js` — system prompt for dimension extraction
- `lib/prompts/generate-session.js` — system prompt for session config generation
- `lib/schemas/dimension.js` — TypeScript-style validation for dimension objects
- `lib/schemas/session-config.js` — validation for session config objects

---

## Testing with Test Data

Use the Clarion Health scenario from `rc-lens-test-data-v1.0.md`:

1. Feed the Clarion Health role context into `/api/extract-dimensions`
2. Verify it produces 5-7 dimensions including clinical fluency, builder orientation, and trust-building
3. Feed the approved dimensions + Maria Gutierrez's resume into `/api/generate-session`
4. Verify the session config:
   - References Maria's Evidera experience specifically in opening questions
   - Skips career walkthrough in foundation
   - Merges work_style with builder_orientation
   - Includes the primer probe about managing up
   - Estimates ~18 minutes

Then repeat with James Thornton (no healthcare experience — should produce different opening questions) and Rachel Kim (no CS title — should produce different dimension emphasis).

---

## Definition of Done

- [ ] `/api/extract-dimensions` endpoint deployed and returning valid dimension JSON
- [ ] `/api/generate-session` endpoint deployed and returning valid session config JSON
- [ ] Dimension review UI screen functional (view, edit label, change importance, reorder, add, remove)
- [ ] Time estimate displays and updates dynamically
- [ ] Session config stored to session storage for consumption by candidate discovery flow
- [ ] Tested with all 3 search scenarios from test data (Clarion, Nuvolo, MedAlliance)
- [ ] Tested with and without candidate pre-loaded materials
- [ ] Error handling for thin role context (too few sources)
- [ ] Error handling for API timeout
- [ ] No API keys in client bundle
- [ ] Deployed to `lens-app-five.vercel.app`
- [ ] Claude Code session row written to Airtable

---

## Reference Files
- `rc-role-input-form-brief.md` — role input form spec (design system, API proxy pattern)
- `recruiter-candidate-lens-spec-v0.1.md` — full R→C spec
- `rc-lens-test-data-v1.0.md` — test scenarios and candidate profiles
- `lens-form.jsx` (~800 lines) — existing discovery flow with Claude API integration
- `lens-intake.jsx` (~680 lines) — existing intake flow (design reference)
