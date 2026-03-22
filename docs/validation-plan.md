# 90-Day Validation Plan

**Truth discovery, not product development.**

Every experiment answers a binary question. The answers determine whether we build, narrow scope, or stop.

## Operating Principle

The Lens Project is currently a **hypothesis stack**. The business lives or dies on one loop:

> **Lens → Score → Insight → Behavior Change → Repeat**

If any step fails, the system collapses. The next 90 days test each step. We do not invest in polish, scale, or fundraising until we know the loop works.

---

## Phase 1: Days 0–30 — Validate Core Value

**Central question:** Is the lens compelling? Does it produce immediate insight? Will people finish it?

### Experiment 1: Lens Shock Test
**Question:** Does the lens feel like a step-function improvement over a resume?

**Setup:**
1. Recruit 20–30 users from personal network. Mix: actively searching (10+), employed/exploring (10+), coaches/HR people (5+).
2. Host lens-form.jsx on Vercel. No account required. Just discovery + output.
3. Full 8-section discovery. Track time per section, drop-off points.
4. After completion, 5 minutes to review, then structured feedback.

**Feedback questions:**
1. Is this a better representation of your professional identity than your resume? (Yes / No / Partially)
2. Would you share this with a recruiter or hiring manager? (Yes / No / With edits)
3. Did the discovery process surface anything you hadn't articulated before? (Yes / No)
4. Which section felt most valuable? Which felt weakest?
5. What's missing?
6. On a scale of 1–10, how much does this feel like you?
7. Would you pay $50 for this? What would need to be true?

**Success criteria:**
- **GREEN:** ≥50% "better than resume" AND "would share." ≥60% surfaced something new. Average "feels like me" ≥7/10.
- **YELLOW:** 30–50% positive. Feedback points to execution problems (weak sections, generic AI), not concept rejection.
- **RED:** <30% positive. "Interesting but not useful." Concept rejected.

### Experiment 2: Instant Scoring Insight
**Question:** Does scoring a real opportunity against the lens produce a "holy shit" moment?

**Setup:**
1. Immediately after lens creation, user pastes 3 job postings they're currently considering. Ideally: one they feel good about, one unsure, one they applied to but felt was wrong.
2. Score each via Claude API (lens YAML + job description + Brave Search enrichment).
3. Show scored results: overall score, dimension breakdown, disqualifier flags, tension notes.

**What constitutes a "holy shit" moment:**
- "The lens nailed why that job felt wrong — it hit two of my disqualifiers."
- "I thought Company A was better, but the scoring shows B is more aligned on what I said matters."
- "The tension note about autonomy vs. their process culture — that's exactly what would bother me."
- "This would have saved me from taking my last job."

**Success criteria:**
- **GREEN:** ≥50% report surprise or changed thinking. ≥60% scoring matches gut. Average daily-scoring value ≥7/10.
- **YELLOW:** Confirms known feelings but doesn't reveal anything new.
- **RED:** Feels arbitrary or wrong. Trust breaks immediately.

### Experiment 3: Drop-Off Analysis
**Question:** Where do people disengage, and is it friction or disinterest?

**Setup:** Instrument each section with timing and completion tracking.

**Watch for:**
- Section-specific drop-off → that section needs redesign
- Gradual even drop-off → total length is the issue
- Revision patterns (going back to edit early sections) → discovery deepened understanding (good signal)

**Success criteria:**
- **GREEN:** ≥60% complete all 8 sections. No single section >30% drop-off.
- **YELLOW:** 40–60% complete. Clear drop-off point is fixable.
- **RED:** <40% complete. Total time is the barrier.

### Phase 1 Decision Gate (Day 30)

| Signal | GREEN | YELLOW | RED |
|---|---|---|---|
| Lens quality | ≥50% better than resume | 30-50%, execution fixes | <30%, concept rejected |
| Scoring insight | ≥50% surprised/changed | Confirms, doesn't reveal | Feels arbitrary/wrong |
| Completion rate | ≥60% full 8 sections | 40-60%, drop-off fixable | <40%, too much friction |
| Willingness to pay | Unprompted "yes" | "Maybe if..." | "Interesting but no" |
| **Decision** | **Proceed to Phase 2** | **Fix and retest** | **Stop or pivot** |

---

## Phase 2: Days 30–60 — Validate Behavior Change

**Central question:** Does the daily briefing change how people make decisions? Does a habit form?

### Experiment 4: Concierge Daily Briefing
**Question:** Does a daily scored briefing create a behavior loop?

**Setup:**
1. 10–15 users from Phase 1 who completed lenses. Prioritize actively searching.
2. Each connects 2–3 sources (help with setup, track friction).
3. Self-hosted n8n scoring pipeline daily.
4. Briefing delivered via email every morning.

**Measure:** Open rate (>70% by week 2), action rate (>40%), behavior change (weekly check-in), anticipation, trust calibration.

**Success criteria:**
- **GREEN:** ≥60% changed behavior. >70% daily open rate. "I look forward to this."
- **YELLOW:** Reads but doesn't act differently. Scoring accuracy bottleneck.
- **RED:** Declining open rates. "Doesn't show me anything Indeed doesn't."

### Experiment 5: Scoring Trust Calibration
**Question:** When scoring is wrong, does the user correct it or leave?

**Setup:** Include three score types: clearly right, defensibly ambiguous, known weakness.

**What you learn:**
- Accept obviously wrong → UI doesn't communicate scoring logic
- Flag ambiguous with reasoning → feedback loop working (gold)
- Disengage after wrong → trust is fragile, needs transparency

### Experiment 6: Source Setup Friction Test
**Question:** Can users connect sources without live help?

**Setup:** 10 users, written instructions only, no live support.

**Success criteria:**
- **GREEN:** ≥60% connect ≥2 sources without help.
- **YELLOW:** Most default to paste-only. RSS/email too complex.
- **RED:** <30% connect anything. BYOS model broken.

### Phase 2 Decision Gate (Day 60)

| Signal | GREEN | YELLOW | RED |
|---|---|---|---|
| Behavior change | ≥60% changed decisions | Reads but doesn't act | Disengages week over week |
| Habit formation | Users anticipate briefing | Opens but not habit | Declining open rates |
| Scoring trust | Flags errors constructively | Passive acceptance | Disengages after errors |
| Source setup | ≥60% self-serve | Paste-only fallback | <30% connect anything |
| **Decision** | **Proceed to Phase 3** | **Fix scoring/sources** | **Stop: tool, not marketplace** |

---

## Phase 3: Days 60–90 — Validate Business Viability

**Central question:** Is there a moat? Is there company demand? Tool or marketplace?

### Experiment 7: Coach vs. AI A/B Test
**Question:** Is coach-facilitated discovery measurably better?

**Setup:**
1. 10 AI-only lenses, 10 coach-persona lenses (James Pratt methodology).
2. Third-party blind comparison (coach, HR, or recruiter evaluates anonymized pairs).
3. Users also compare their own outputs.

**Success criteria:**
- **GREEN:** ≥70% blind preference for coach-facilitated. Gap is visible and describable.
- **YELLOW:** Slight preference, not decisive. Partial moat.
- **RED:** No meaningful difference. Coach moat doesn't exist.

### Experiment 8: Company Role Lens Test
**Question:** Do companies find value in structured role self-assessment?

**Setup:**
1. 5 companies (Todd's network). Free role lens as design partners.
2. Manual facilitation (you as interviewer). Record sessions.
3. If candidate lenses exist, run match simulation.

**Success criteria:**
- **GREEN:** ≥3/5 say significantly better than JD, would pay. Match simulation changes evaluation.
- **YELLOW:** Interesting but wouldn't pay. Value real, timing/budget barrier.
- **RED:** "We already know this." No pull.

### Phase 3 Decision Gate (Day 90)

| Signal | GREEN | YELLOW | RED |
|---|---|---|---|
| Coach moat | Visible quality gap | Slight preference | No difference |
| Company pull | ≥3/5 would pay | Interested, won't pay | No value |
| Match simulation | Changes evaluation | Confirms, doesn't change | Arbitrary |
| **Decision** | **Build marketplace** | **Build candidate tool** | **Pivot or stop** |

---

## Master Decision (Day 90)

**GREEN → Fundraise.** Unfreeze investor deck. Update with real data. Begin $750K raise with traction evidence.

**YELLOW → Narrow scope.** Build candidate intelligence tool. Premium coach lenses ($49–149). Smaller raise ($200–400K) or bootstrap. Defer company side.

**RED → Stop.** Core hypothesis wrong. Do not raise money to scale something that doesn't work at small scale.

---

## What to Build This Week

1. **Host lens-form.jsx on Vercel.** No auth, no accounts. Just discovery + output. (1 day)
2. **Build paste-and-score endpoint.** Job description + lens YAML → Claude API → compatibility briefing. Add Brave Search enrichment. (2–3 days)
3. **Recruit 20–30 test users.** Todd, James, Nathan, LinkedIn network. (Parallel)

**Cost:** Under $50 (Vercel free + ~$15-30 Claude API).
**Time:** 1 week to build. 2 weeks to run. Results by day 21.

---

*The investor deck, financial model, coach pitch, and all deliverables are frozen until Phase 1 results are in. The next three weeks determine everything.*
