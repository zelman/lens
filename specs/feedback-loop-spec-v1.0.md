# Feedback Loop Learning System — Technical Specification

**Author:** Eric Zelman
**Date:** March 21, 2026
**Version:** 1.0
**Status:** CONFIDENTIAL — Subject to Mutual NDA
**Patent Status:** Patent Pending — U.S. Application #64/015,187 (filed March 24, 2026)
**Extends:** Bidirectional Lens System v1.0, Section 6

---

## 1. Purpose

This document specifies the feedback loop that makes the Lens Project a learning system rather than a static tool. The loop operates at three levels: per-user weight calibration, per-user disqualifier refinement, and global model improvement. The core design principle is **"append, don't overwrite"** — the system surfaces insights and asks the user to confirm changes rather than silently adjusting behavior.

The feedback loop is what makes the product investable. Without it, the lens is a one-time document generator. With it, the lens becomes a persistent, self-improving matching engine with compounding data value.

---

## 2. Signal Taxonomy

### 2.1 Explicit Signals (user-provided)

These are actions the user takes deliberately. Each has a defined strength, direction, and what it adjusts.

| Signal | Trigger | Strength | Direction | Adjusts |
|--------|---------|----------|-----------|---------|
| **Pursued** | User clicks "Pursue" on a match | 0.6 | Positive | Dimension weights that scored highest on this match |
| **Skipped** | User clicks "Skip" on a match | 0.4 | Negative | Dimension weights that scored highest on this match |
| **Saved for Later** | User saves but doesn't pursue | 0.2 | Neutral | Recorded but no immediate adjustment; revisited at monthly reflection |
| **Got Interview** | User reports advancing to interview | 0.8 | Positive | Confirms alignment signals; boosts confidence on matched dimensions |
| **Rejected After Interview** | User reports rejection | 0.5 | Negative on confidence | Reduces confidence in alignment signals that were flagged as strong; does NOT reduce the dimension score itself |
| **Withdrew** | User withdrew from process | 0.3 | Complex | Probes which tension signal was the deciding factor (user selects from the tensions listed in the match report) |
| **Accepted Offer** | User accepted a job | 1.0 | Strongest positive | Full reinforcement of all dimension scores and weights for this match |
| **Declined Offer** | User declined after receiving offer | 0.7 | Complex | Strong signal that something was wrong despite strong mutual fit. System asks: "What was the deciding factor?" and maps response to a specific dimension or disqualifier |
| **Match Report Rating** | User rates the report 1-5 | 0.3 | Meta-signal | Adjusts prompt behavior: "too generous" → lower scores next time; "too harsh" → raise floor; "missed the point" → review cross-mapping |
| **"This alignment sold me"** | User tags a specific alignment signal | 0.5 | Dimension-specific positive | Increases weight of the tagged dimension by signal_strength × learning_rate |
| **"This tension was the dealbreaker"** | User tags a specific tension signal | 0.7 | Dimension-specific negative | Adds a soft disqualifier or increases weight of the tagged dimension |
| **Lens Edit** | User manually edits their lens document | 0.0 (trigger only) | N/A | Triggers re-scoring of all active matches; creates a lens version snapshot for drift tracking |

### 2.2 Implicit Signals (observed from behavior)

These are inferred from user behavior without explicit input. Lower strength because the inference is uncertain.

| Signal | Observation | Strength | Inference | Adjusts |
|--------|------------|----------|-----------|---------|
| **Time on match report** | >3 minutes on a single match report | 0.15 | Interest / careful evaluation | Mild positive weight toward dimensions that scored highest |
| **Quick dismiss** | <5 seconds before skip | 0.2 | Strong disinterest | Mild negative; if pattern repeats for similar match types, suggests a missing disqualifier |
| **Click-through to company** | User clicks the company URL from the briefing | 0.1 | Interest beyond the match report | Baseline engagement signal |
| **Briefing open** | User opens the daily briefing email | 0.0 | Baseline | Retention metric only, not used for scoring adjustment |
| **Briefing ignored (3+ days)** | No briefing opens for 3+ consecutive days | 0.0 | Disengagement | Triggers focal length check: "You haven't opened your briefings in a few days. Would you like fewer, more targeted matches?" |
| **Multiple skips in a row** | 5+ consecutive skips without a pursue | 0.3 | Pipeline too wide | Suggests narrowing focal length; records as aggregate signal |
| **Focal length / aperture change** | User adjusts the pipeline controls | 0.0 (trigger only) | Preference shift | Direct indication of desired pipeline behavior; logged for drift tracking |
| **Session frequency** | How often the user logs in | 0.0 | Engagement level | Retention metric; informs passive monitoring cadence |

### 2.3 Signal Decay

Signals lose relevance over time. A "Pursued" signal from 6 months ago should matter less than one from last week.

```
effective_strength = base_strength × decay_factor

decay_factor = e^(-λ × days_since_signal)

λ = 0.01 (half-life ≈ 69 days)
```

This means:
- Signal from today: 100% strength
- Signal from 1 week ago: 93% strength
- Signal from 1 month ago: 74% strength
- Signal from 3 months ago: 41% strength
- Signal from 6 months ago: 17% strength

The decay function ensures the system adapts to evolving preferences without requiring the user to explicitly update their lens. But it doesn't zero out old signals — they always contribute some residual weight, honoring the "append, don't overwrite" principle.

---

## 3. Weight Adjustment Algorithm

### 3.1 Per-User Weight Calibration

Each user's lens document has a `scoring.dimensions` object with weights that sum to 100:

```yaml
scoring:
  dimensions:
    mission: 25
    role: 20
    culture: 18
    skill: 17
    work_style: 12
    energy: 8
```

When a signal fires, the system adjusts weights based on which dimensions contributed most to the match that triggered the signal.

#### Step 1: Identify contributing dimensions

For a given match, the system knows each dimension's score and its percentage of the total. The "contributing dimensions" for a positive signal are those that scored above their weighted average (i.e., the dimensions that made this match score well). For a negative signal, they're the dimensions that scored highest (i.e., the dimensions the system thought were strong but the user disagreed).

```
For each dimension d in match:
  contribution_ratio[d] = (score[d] / max[d]) × (weight[d] / 100)
  
  # Normalize so contributions sum to 1.0
  total = sum(contribution_ratio)
  normalized_contribution[d] = contribution_ratio[d] / total
```

#### Step 2: Calculate adjustment per dimension

```
For each dimension d:
  adjustment[d] = learning_rate × signal_strength × signal_direction × normalized_contribution[d] × decay_factor

Where:
  learning_rate = 0.02 (global constant — slow learning prevents overfitting)
  signal_strength = from signal taxonomy (0.0 to 1.0)
  signal_direction = +1 (positive signals) or -1 (negative signals)
  decay_factor = e^(-0.01 × days_since_signal) — always 1.0 for real-time signals
```

#### Step 3: Apply adjustment

```
For each dimension d:
  new_weight[d] = current_weight[d] + adjustment[d]
  
  # Floor: no dimension drops below 3
  new_weight[d] = max(new_weight[d], 3)
  
  # Ceiling: no dimension exceeds 40
  new_weight[d] = min(new_weight[d], 40)
```

#### Step 4: Renormalize

```
total = sum(new_weight[d] for all d)
For each dimension d:
  final_weight[d] = round(new_weight[d] / total × 100)

# Adjust rounding error on the largest weight
rounding_error = 100 - sum(final_weight)
largest_dimension = argmax(final_weight)
final_weight[largest_dimension] += rounding_error
```

#### Worked Example

User's current weights: Mission 25, Role 20, Culture 18, Skill 17, Work Style 12, Energy 8.

Match with score breakdown: Mission 20/25, Role 15/20, Culture 16/18, Skill 10/17, Work Style 8/12, Energy 5/8.

User clicks "Pursued" (strength 0.6, direction +1).

Step 1 — Contribution ratios:
```
Mission:    (20/25) × (25/100) = 0.200
Role:       (15/20) × (20/100) = 0.150
Culture:    (16/18) × (18/100) = 0.160
Skill:      (10/17) × (17/100) = 0.100
Work Style: (8/12)  × (12/100) = 0.080
Energy:     (5/8)   × (8/100)  = 0.050

Total: 0.740
Normalized: Mission 0.270, Role 0.203, Culture 0.216, Skill 0.135, WS 0.108, Energy 0.068
```

Step 2 — Adjustments (learning_rate 0.02, strength 0.6, direction +1, decay 1.0):
```
Mission:    0.02 × 0.6 × 1 × 0.270 × 1.0 = +0.00324
Role:       0.02 × 0.6 × 1 × 0.203 × 1.0 = +0.00244
Culture:    0.02 × 0.6 × 1 × 0.216 × 1.0 = +0.00259
Skill:      0.02 × 0.6 × 1 × 0.135 × 1.0 = +0.00162
Work Style: 0.02 × 0.6 × 1 × 0.108 × 1.0 = +0.00130
Energy:     0.02 × 0.6 × 1 × 0.068 × 1.0 = +0.00082
```

Step 3 — New weights (before renormalization):
```
Mission: 25.00324, Role: 20.00244, Culture: 18.00259, Skill: 17.00162, WS: 12.00130, Energy: 8.00082
```

Step 4 — After renormalization: identical to original (the single-signal adjustment is intentionally tiny).

**This is by design.** A single signal barely moves the weights. After 50 signals in the same direction, the cumulative effect becomes visible: ~1-2 points of weight shift. After 200+ signals, the weights may look meaningfully different from the starting position. The system learns slowly and deliberately.

### 3.2 Cold Start

New users have no feedback history. The system handles this in three ways:

1. **Default weights from discovery.** The intake form's 8 discovery sections map to scoring dimensions. The AI extracts signal strength from the user's answers and sets initial weights based on emphasis. If a user spent extensive time on the Values section and gave rich answers, Values gets a higher initial weight.

2. **Cohort priors (global model).** Once the global model has data from 100+ users, new users receive a cohort-adjusted starting weight based on their status (Employed / Actively Searching / In Transition) and their role type (Builder / Maintainer / Hybrid). For example, if Builders across the platform consistently end up weighting Role higher than the default, new Builders start with that adjustment.

3. **Fast-learning period.** For the first 20 signals, learning_rate doubles to 0.04. This allows early signals to shape the weights faster, then the system slows to the standard 0.02 for stability.

### 3.3 Convergence and Stability

The algorithm converges because:

- Floor (3) and ceiling (40) prevent any dimension from dominating or vanishing
- Renormalization keeps the total at 100
- Decay ensures old signals gradually lose influence
- The learning rate (0.02) is slow enough that noise (a single impulsive skip) doesn't distort the model

**Estimated convergence time:** ~100-150 signals to reach stable weights for a typical user. At 5 matches per daily briefing and ~50% engagement rate, this is roughly 40-60 days of active use.

---

## 4. Disqualifier Refinement

### 4.1 Soft Gate Detection

When a user consistently pursues matches that technically trigger a disqualifier or near-miss, the system detects the pattern and suggests relaxation.

```
For each disqualifier D:
  track: how many matches that triggered D (or near-missed D) were pursued vs. skipped
  
  If pursued_count[D] / total_triggered[D] > 0.6 AND total_triggered[D] >= 5:
    → Surface suggestion: "You've pursued 4 of the last 6 matches that were flagged 
       for '{D}'. Would you like to remove this as a disqualifier, or soften it to 
       a preference?"
    
    User options:
      a) Remove disqualifier entirely
      b) Convert to "soft preference" (scored as a -5 penalty instead of hard DQ)
      c) Keep as hard DQ (user was exploring, not reconsidering)
```

### 4.2 Missing Gate Detection

When a user consistently skips matches that pass all gates with high scores, the system looks for commonalities among the skipped matches to suggest a new disqualifier.

```
After every 10th consecutive skip (or 10 skips in a 7-day window):
  Analyze the skipped matches for common attributes not currently gated:
    - Company size range
    - Sector/domain
    - Role type
    - Funding stage
    - Geographic pattern
    - Work style signals (e.g., always skipping high-meeting-load roles)
  
  If a common attribute appears in >70% of skipped matches:
    → Surface suggestion: "You've been skipping matches that involve 
       '{attribute}'. Would you like to add this as a filter?"
    
    User options:
      a) Add as hard disqualifier
      b) Add as soft preference (-5 penalty)
      c) Ignore (just coincidence)
```

### 4.3 Data Schema for Gate Tracking

```yaml
gate_events:
  - match_id: "match_20260321_001"
    disqualifier: ">200 employees"
    event: "near_miss"  # triggered | near_miss | passed
    user_action: "pursued"  # pursued | skipped | saved
    timestamp: "2026-03-21T14:30:00Z"
    match_score: 68
    gate_score: 150  # employee count that triggered the flag
    gate_threshold: 200
```

---

## 5. Drift Detection

### 5.1 What Drift Is

Drift is the measurable gap between what a user's lens says they want and what their actions reveal they actually pursue. Some drift is normal — preferences evolve, especially during a job search. The system's job is to surface drift transparently, not correct it silently.

### 5.2 How Drift Is Measured

For each dimension, the system maintains two values:

- **Stated weight:** The current weight in the lens document (e.g., Mission: 25)
- **Revealed weight:** The weight implied by the user's feedback signals over the trailing 30 days

```
revealed_weight[d] = Σ(signal_strength × signal_direction × normalized_contribution[d] × decay_factor) 
                     for all signals in trailing 30 days

# Normalize revealed weights to sum to 100
# Compare against stated weights
```

Drift score per dimension:
```
drift[d] = |stated_weight[d] - revealed_weight[d]|
```

Overall drift score:
```
total_drift = Σ(drift[d]) for all dimensions
```

### 5.3 Drift Thresholds

| Total Drift | Classification | Action |
|-------------|---------------|--------|
| 0-10 | Aligned | No action. Stated and revealed preferences match. |
| 11-20 | Minor drift | Log only. Normal fluctuation. |
| 21-30 | Notable drift | Surface at monthly reflection: "Your recent activity suggests your priorities may be shifting." |
| 31+ | Significant drift | Proactive prompt: "Your stated priorities and your actual pursuit patterns are diverging meaningfully. Here's what's changed." |

### 5.4 Drift Prompt UX

When drift crosses the "notable" threshold, the system presents a specific comparison:

```
YOUR LENS SAYS:               YOUR ACTIONS SUGGEST:
─────────────────             ─────────────────────
Mission:     25  ████████     Mission:     18  ██████
Role:        20  ██████       Role:        15  █████
Culture:     18  ██████       Culture:     28  █████████
Skill:       17  █████        Skill:       17  █████
Work Style:  12  ████         Work Style:  14  ████
Energy:       8  ██           Energy:       8  ██

"Over the past month, you've been pursuing opportunities where Culture 
scored highest, even when Mission scored low. Your lens weights Mission 
as your top priority, but your actions suggest Culture matters more 
right now."

Options:
  [ Update my lens to match my actions ]  → Adjusts weights to revealed
  [ Keep my lens as-is ]                  → Resets drift counter
  [ I was exploring, not shifting ]       → Marks trailing signals as exploratory (reduced weight)
```

The third option ("I was exploring") is critical — it prevents the system from interpreting a period of broad exploration as a permanent preference shift. The signals from this period are re-weighted at 0.3× their original strength.

### 5.5 Drift History

Every drift detection event is logged:

```yaml
drift_events:
  - timestamp: "2026-04-15T09:00:00Z"
    total_drift: 24
    classification: "notable"
    dimension_drifts:
      mission: -7
      culture: +10
      work_style: +2
    user_response: "keep_as_is"  # update | keep | exploring
    lens_version_at_detection: "v1.3"
```

This history is valuable for two reasons: it's part of the global model's training data (anonymized), and it provides the user (or their coach) with a retrospective view of how their priorities evolved during their search.

---

## 6. Feedback Collection Points

Six structured moments where the system collects feedback. Each is designed to minimize friction while maximizing signal quality.

### 6.1 At Match Delivery

**When:** Every match in the daily briefing.
**UI:** Three buttons below each match: Pursue (green), Skip (gray), Save (yellow).
**Friction:** Zero — single click. No explanation required.
**Signal:** Explicit (pursued/skipped/saved), strength 0.6/0.4/0.2.

### 6.2 48-Hour Follow-Up

**When:** 48 hours after a match was delivered, if no action taken.
**UI:** None — implicit signal only.
**Friction:** Zero — no user interaction.
**Signal:** Implicit (ignored), strength 0.15. Treated as a weak skip.

### 6.3 After Outreach

**When:** User reports they've made contact with the company.
**UI:** Prompt in the app: "Did you reach out to [Company]? What happened?"
**Options:** "Reached out" / "Decided to skip" / "Still deciding"
**Friction:** Low — single selection.
**Signal:** "Reached out" = strong positive (0.8). "Decided to skip" = delayed negative (0.5). "Still deciding" = no adjustment, ask again in 7 days.

### 6.4 After Interview

**When:** User reports an interview (manual input or detected from calendar integration if available).
**UI:** "How did the interview go?" with options.
**Options:** "Advancing" / "Rejected" / "I withdrew" / "Waiting to hear"
**Friction:** Low — single selection + optional free-text.
**Signal:**
- "Advancing" (0.8 positive, boosts confidence on alignment signals)
- "Rejected" (0.5 negative on confidence, NOT on dimension scores — the company's decision doesn't mean the user's preferences were wrong)
- "I withdrew" (0.3, probes: "What was the deciding factor?" with tension signals from the match report pre-populated as options)
- "Waiting" (no adjustment, ask again in 14 days)

### 6.5 After Outcome

**When:** User reports a final result.
**UI:** "Final update on [Company]?"
**Options:** "Accepted offer" / "Declined offer" / "Ghosted/no response" / "Position filled"
**Friction:** Low — single selection + "What was the deciding factor?" for Declined.
**Signal:**
- "Accepted" (1.0, full reinforcement)
- "Declined" (0.7, complex — system asks which tension was the deciding factor)
- "Ghosted" (0.1, minimal negative — not the user's preference signal, just a market outcome)
- "Position filled" (0.0, no adjustment — external event)

### 6.6 Monthly Reflection

**When:** Last Sunday of each month.
**UI:** Email or in-app prompt with a curated review.
**Content:**
```
THIS MONTH:
- 87 matches scored
- You pursued 12, skipped 61, saved 14
- 3 reached outreach stage, 1 reached interview

TOP 3 MATCHES (by your engagement):
  1. [Company A] — Score 78, Pursued, Interview
  2. [Company B] — Score 72, Pursued, Outreach
  3. [Company C] — Score 65, Saved

Which 3 felt most like "you"?  [select from list]
Which 3 felt least like "you"? [select from list]
```

**Friction:** Medium — requires 2-3 minutes of reflection. But this is the highest-quality signal. The "most like you" / "least like you" selection directly recalibrates the lens because the user is making a holistic judgment, not reacting to a single match.

**Signal:** "Most like me" selections generate a positive signal of 0.6 across all dimensions. "Least like me" generate a negative signal of 0.5. These are the only signals that adjust ALL dimensions simultaneously rather than targeting specific ones.

---

## 7. Global Model

### 7.1 What It Learns

The global model aggregates anonymized patterns across all users. It does not share individual lens content, match decisions, or personal data. It learns statistical relationships between signal patterns and outcomes.

Examples of what the global model captures:

- "When both candidate and role say 'async-first' but the role's actual meeting load is >4 hours/day, the match produces DECLINED OFFER 73% of the time." → System learns to score this as a tension, not an alignment.
- "Builder-type candidates who accept offers at companies with >100 employees have a 2.3× higher 6-month turnover rate." → System adds a soft warning to match reports for this pattern.
- "Candidates who rate 'Culture' as their top dimension in discovery but consistently pursue matches where 'Role' scores highest are in a drift pattern that typically resolves toward 'Role' weighting." → Informs the cohort priors for cold-start users with similar profiles.

### 7.2 Privacy Architecture

```
User's device / browser:
  → Lens document (stored locally or in user's cloud)
  → Match history (user-visible, user-owned)
  → Feedback signals (user-visible, user-owned)

Platform (Airtable / database):
  → Anonymized signal patterns (no PII, no lens content)
  → Aggregated outcome statistics
  → Cohort priors (Builder average weights, etc.)
  → Global tension/alignment pattern library
```

The user owns their data. The platform owns the aggregate patterns. A user can export or delete their data at any time. The global model is trained on patterns, not on individual records.

### 7.3 Minimum Data for Global Model Activation

The global model requires statistical significance before it influences individual scoring:

- **Cohort priors:** Activated after 100+ users in a cohort (e.g., "Builders who are Actively Searching")
- **Pattern detection:** Activated after 50+ instances of a specific signal pattern produce consistent outcomes
- **Tension/alignment reclassification:** Requires 20+ matching instances where a signal consistently correlates with a specific outcome (DECLINED, WITHDREW, etc.)

Below these thresholds, the global model contributes nothing — all scoring is per-user.

---

## 8. Data Schema

### 8.1 Feedback Signal Record

```yaml
signal:
  id: "sig_20260321_001"
  user_id: "user_abc"
  match_id: "match_20260321_001"
  signal_type: "pursued"           # from signal taxonomy
  signal_category: "explicit"      # explicit | implicit
  strength: 0.6
  direction: 1                     # +1 | -1 | 0
  timestamp: "2026-03-21T14:30:00Z"
  dimension_contributions:         # from the match that triggered this signal
    mission: 0.270
    role: 0.203
    culture: 0.216
    skill: 0.135
    work_style: 0.108
    energy: 0.068
  decay_at_creation: 1.0           # always 1.0 at creation
  tagged_dimension: null           # populated if user tagged a specific signal
  tagged_signal_id: null           # populated if user tagged "this alignment/tension"
  lens_version: "v1.2"            # which version of the lens was active
  metadata:
    match_score: 72
    match_classification: "GOOD FIT"
    collection_point: "at_delivery" # which of the 6 collection points
```

### 8.2 Weight History Record

```yaml
weight_adjustment:
  id: "wadj_20260321_001"
  user_id: "user_abc"
  trigger_signal_id: "sig_20260321_001"
  timestamp: "2026-03-21T14:30:00Z"
  weights_before:
    mission: 25
    role: 20
    culture: 18
    skill: 17
    work_style: 12
    energy: 8
  weights_after:
    mission: 25
    role: 20
    culture: 18
    skill: 17
    work_style: 12
    energy: 8
  total_signals_to_date: 1
  learning_rate_used: 0.04         # 0.04 during fast-learning period, 0.02 after
```

### 8.3 Lens Version Snapshot

```yaml
lens_snapshot:
  id: "snap_20260321_001"
  user_id: "user_abc"
  version: "v1.2"
  timestamp: "2026-03-21T14:30:00Z"
  trigger: "user_edit"             # user_edit | drift_update | initial_generation
  weights:
    mission: 25
    role: 20
    culture: 18
    skill: 17
    work_style: 12
    energy: 8
  disqualifiers: ["PE-backed", ">350 employees", "B2C"]
  total_signals_at_snapshot: 47
  drift_score_at_snapshot: 12
```

---

## 9. Implementation Priority

| Component | Phase | Dependencies | Complexity |
|-----------|-------|-------------|------------|
| Explicit signal collection (pursue/skip/save) | Phase 3 (Paid Product) | Daily briefing delivery | Low |
| Weight adjustment algorithm | Phase 3 | Signal collection | Medium |
| Renormalization + floor/ceiling | Phase 3 | Weight adjustment | Low |
| Signal decay function | Phase 3 | Signal storage | Low |
| Implicit signal detection (time on report, click-through) | Phase 3 | Analytics instrumentation | Medium |
| After-outreach prompt | Phase 3 | User engagement flow | Low |
| After-interview prompt | Phase 3 | User engagement flow | Low |
| After-outcome prompt | Phase 3 | User engagement flow | Low |
| Monthly reflection | Phase 3 | 30 days of signal history | Medium |
| Disqualifier refinement (soft gate detection) | Phase 3 | Gate tracking schema | Medium |
| Missing gate detection | Phase 3 | 10+ skip pattern analysis | Medium |
| Drift detection | Phase 3 | 30 days of signal history | Medium-High |
| Drift prompt UX | Phase 3 | Drift detection | Medium |
| Fast-learning period (cold start) | Phase 3 | Weight adjustment | Low |
| Cohort priors (global model, cold start) | Phase 4 (Scale) | 100+ users | High |
| Global pattern detection | Phase 4 | 50+ pattern instances | High |
| Tension/alignment reclassification | Phase 4 | 20+ matching instances | High |
| Privacy architecture (anonymization pipeline) | Phase 4 | Global model | High |

---

## 10. What This Specification Establishes

This document, dated March 21, 2026, formally specifies:

1. A **signal taxonomy** with 12 explicit and 8 implicit signal types, each with defined strength, direction, and adjustment targets.

2. A **weight adjustment algorithm** with contribution-based dimension targeting, exponential signal decay (λ=0.01), floor/ceiling constraints (3/40), normalization to 100, and a learning rate of 0.02 (doubled to 0.04 during cold start).

3. A **disqualifier refinement system** that detects when hard gates are consistently overridden and suggests relaxation, and that detects when missing gates are causing consistent skips and suggests additions.

4. A **drift detection mechanism** that measures the gap between stated weights and revealed weights over a trailing 30-day window, classifies drift severity, and presents the user with a transparent comparison and three response options (update, keep, exploring).

5. A **feedback collection framework** with 6 defined touchpoints, friction levels, signal types, and UX specifications.

6. A **global model architecture** with privacy-preserving anonymization, minimum data thresholds for activation, and specific pattern types it learns.

7. **Data schemas** for signal records, weight history, and lens version snapshots.

All of the above are the original intellectual property of Eric Zelman. Patent-pending as of March 24, 2026 (U.S. Application #64/015,187).

---

*Document version 1.0 — March 21, 2026*
*Eric Zelman — Providence, RI*
*CONFIDENTIAL — Subject to Mutual NDA*
