---
# ════════════════════════════════════════════════════════════════
# LENS DOCUMENT — Sarah Chen
# Generated: 2026-03-18
# Status: In Transition (voluntary, 3 weeks)
# Version: 1.0
# ════════════════════════════════════════════════════════════════

name: Sarah Chen
status: in_transition
status_detail: Left voluntarily after integrity conflict over metrics reporting. 3 weeks out.
generated: 2026-03-18
lens_version: 1.0

# ── Scoring Weights ──
# These govern how every opportunity is evaluated.
# Sum = 100. Mission is weighted highest because Sarah has learned
# that no amount of role fit compensates for working on something
# she doesn't believe in.
scoring:
  weights:
    mission: 25
    role: 20
    culture: 18
    skill: 17
    work_style: 12
    energy: 8
  thresholds:
    surface: 75        # Daily briefing — immediate visibility
    include: 60        # Weekly digest — with rationale
    exclude_below: 60  # Filtered out unless manual override
  classification:
    builder_or_maintainer: builder
    builder_confidence: high
    builder_signals:
      - built CS function from scratch 3x
      - hired and scaled teams from 0 or 4 to 35
      - created customer health scoring frameworks where none existed
      - established CS as executive-level voice at 2 companies
    maintainer_signals:
      - can maintain and optimize existing CS orgs
      - has run steady-state renewal books
      - but explicitly does not want this as primary mandate

# ── Domain Preferences ──
# Used for domain distance scoring. Positive = bonus, negative = penalty.
domain:
  strong_fit:          # +3 to +5 domain bonus
    - healthtech
    - edtech
    - workflow_automation
    - developer_tools
    - product_led_growth
  moderate_fit:        # +1 to +2
    - fintech_b2b
    - hr_tech
    - data_infrastructure
    - logistics_saas
  neutral:             # 0
    - general_b2b_saas
    - martech
  poor_fit:            # -2 to -3
    - adtech
    - crypto
    - defense
    - gambling
    - social_media
  domain_notes: >
    Sarah gravitates toward companies where the product solves a tangible
    operational problem for the end user. She describes her ideal as "a product
    that genuinely improves someone's day, not one where the value prop requires
    a 90-minute demo to explain." PLG motion is a strong positive signal.

# ── Matching Signals ──
# These are the tags the scoring engine uses to evaluate fit.
# Each signal maps to one or more scoring dimensions.
signals:
  mission:
    positive:
      - product_improves_daily_work
      - customer_outcome_measurable
      - cs_treated_as_strategic
      - mission_articulated_clearly
      - founders_have_domain_experience
    negative:
      - cs_is_cost_center
      - product_is_nice_to_have
      - mission_is_vague_or_generic
      - company_pivoting_away_from_core
  role:
    positive:
      - first_cs_leader_hire
      - building_function_from_scratch
      - reports_to_ceo_coo_or_cro_with_cs_mandate
      - vp_or_head_title
      - team_size_under_20_with_growth_planned
      - owns_retention_and_expansion
      - cross_functional_influence_expected
    negative:
      - backfill_for_fired_leader
      - cs_reports_into_sales_org
      - title_is_director_with_no_vp_path
      - role_is_primarily_account_management
      - team_over_50_in_maintenance_mode
  culture:
    positive:
      - transparency_valued
      - psychological_safety_practiced
      - data_driven_decisions
      - low_politics
      - diverse_leadership_team
      - skip_levels_welcomed
      - exec_team_admits_mistakes_publicly
    negative:
      - metrics_manipulated_for_board
      - high_performer_toxicity_tolerated
      - blame_culture
      - presenteeism_over_output
      - founder_ego_dominates
  skill:
    positive:
      - customer_health_scoring_needed
      - ebr_program_to_build
      - cs_ops_infrastructure_needed
      - hiring_first_time_managers
      - cross_functional_process_design
      - scaling_from_smb_to_mid_market
    negative:
      - heavy_rfp_involvement
      - primarily_technical_support
      - implementation_focused
      - pre_sales_engineering_expected
  work_style:
    positive:
      - hybrid_2_3_days
      - async_friendly
      - outcome_over_hours
      - meeting_discipline
      - boston_metro_or_northeast
    negative:
      - fully_remote_no_team_rhythm
      - all_day_meetings_culture
      - travel_over_25_pct
      - west_coast_hours_required
  energy:
    positive:
      - first_time_manager_development
      - customer_journey_mapping
      - whiteboarding_with_product
      - turning_skeptical_exec_into_cs_advocate
      - new_hire_first_solo_qbr
    negative:
      - enterprise_account_management
      - weekly_pipeline_reviews
      - internal_headcount_politics
      - travel_heavy_role

# ── Instant Disqualifiers ──
# If ANY of these are true, the opportunity scores 0 regardless of other signals.
# These are hard gates evaluated before scoring runs.
disqualifiers:
  - cs_reports_to_sales_without_cs_mandate
  - no_path_to_vp_or_head_within_12_months
  - fully_remote_with_no_in_person_rhythm
  - seed_only_with_less_than_18_months_runway
  - backfill_for_terminated_leader
  - sales_cycle_over_60_days
  - base_compensation_below_165000

disqualifier_explanations:
  cs_reports_to_sales_without_cs_mandate: >
    Sarah has worked in orgs where CS reports to Sales. Every time,
    the function gets reduced to expansion revenue extraction. She needs CS
    to have strategic independence, which means reporting to CEO, COO,
    or a CRO who explicitly mandates CS as a retention/advocacy function.
  no_path_to_vp_or_head_within_12_months: >
    She's at VP level. Taking a Director title is acceptable only if there's
    a documented, timeline-specific path to VP/Head within the first year.
    "We'll see how it goes" is a disqualifier.
  fully_remote_with_no_in_person_rhythm: >
    Not anti-remote, but needs in-person team rhythm. Her management style
    depends on skip-levels, hallway conversations, and reading body language
    in cross-functional meetings. Fully distributed with no regular in-person
    cadence doesn't work for her.
  seed_only_with_less_than_18_months_runway: >
    She's built in resource-constrained environments and can do it, but
    a company that hasn't cleared seed with reasonable runway signals
    too much existential risk for the builder work she wants to do.
  backfill_for_terminated_leader: >
    If the previous CS leader was fired, the root cause is almost always
    a leadership problem, not a CS problem. She's been burned by this once.
  sales_cycle_over_60_days: >
    Long sales cycles correlate with CS being pulled into pre-sales motions.
    She wants post-sale ownership, not demo support.
  base_compensation_below_165000: >
    Floor based on current market, location (Boston metro), and 15 years
    of progressive CS leadership experience. Total comp target is $200K+
    inclusive of equity/bonus.

# ── Situation & Constraints ──
situation:
  status: in_transition
  weeks_out: 3
  departure_reason: voluntary_integrity_conflict
  runway_months: 5_to_6
  urgency: selective
  geo_preference: boston_metro_hybrid
  relocation: open_for_right_opportunity
  relocation_constraints: >
    Spouse works remote (no geo constraint from partner). Two school-age
    kids. Prefers not to relocate mid-school-year: before June or after
    August. Would consider NYC, Austin, Denver, Seattle corridor.
  compensation:
    base_floor: 165000
    total_target: 200000
    equity_preference: meaningful_early_stage
    notes: >
      Values equity upside in Series A-C over higher base at later stage.
      Will take slightly below base floor for exceptional mission fit
      with strong equity package. Not negotiable below $155K under any
      circumstances.
  timeline:
    ideal_start: 2026-05-01
    latest_acceptable: 2026-08-01
    notes: >
      Prefers to take 1-2 more weeks of intentional downtime before
      starting. Not in a rush but also doesn't want to drift. Active
      networking, selective applications. Would move fast for the right
      opportunity.

# ── Predictive Signal Preferences ──
# These configure what the briefing pipeline monitors beyond job postings.
predictive_signals:
  people:
    - cs_leader_departures_at_target_companies
    - new_ceo_or_cro_hire_at_series_a_c
    - former_colleagues_joining_new_companies
    - hiring_manager_linkedin_activity_spike
  funding:
    - series_a_b_c_announced_last_90_days
    - bridge_rounds_or_down_rounds_as_warning
    - revenue_milestones_in_press
  culture:
    - glassdoor_cs_team_reviews
    - linkedin_cs_team_tenure_distribution
    - exec_team_diversity
    - public_all_hands_or_culture_content
  network:
    - second_degree_connections_at_company
    - former_colleagues_in_leadership
    - warm_intro_paths_available
---

# Sarah Chen — Lens Document

## Essence

Sarah is a builder who creates the conditions for other people to do their best work. Across four companies and three industries, the throughline is the same: she walks into organizations where Customer Success exists in name but not in practice, and builds the function from the ground up. Not just the team and the processes, but the internal credibility that turns CS from a cost center into a strategic voice at the leadership table.

She describes herself as someone who builds scaffolding, not monuments. The structures she creates are designed to hold other people up, and the best evidence they're working is when nobody notices them anymore.

When she reflects on what makes her different from other CS leaders, she points to the cross-functional influence piece. She doesn't just build a CS team; she builds the internal relationships and data infrastructure that make the rest of the company listen to customer signals. At her last company, she got Product to restructure their quarterly planning process around customer health data. That took 18 months of relationship building, not a single presentation.


## Skills & Experience

### Carry Forward
- Building CS functions from scratch (done it 3 times, at companies ranging from 40 to 400 employees)
- Cross-functional influence without positional authority (Product, Engineering, Sales, Marketing)
- Customer health scoring framework design and implementation
- Executive business reviews that drive retention decisions (not just reporting)
- Hiring and developing first-time managers (6 promoted from IC to manager under her leadership)
- Scaling teams from 4 to 35 while maintaining culture
- CS ops: tool selection, workflow design, data architecture for health scoring
- Board-level churn and retention reporting

### Leave Behind
- Enterprise account management (she's done it at one company, it drains her completely)
- RFP-heavy sales cycles and pre-sales involvement
- Any role where CS is measured purely on net revenue retention without customer outcome metrics
- Implementation and onboarding as primary focus (she can oversee it but doesn't want it as her core mandate)


## Values

Transparency over diplomacy. She left her most recent role because leadership asked her to present churn metrics to the board that excluded a cohort of 12 at-risk accounts. She raised the issue privately twice, was overridden both times, and resigned.

Psychological safety on her teams is non-negotiable. She has fired a high performer (a senior CSM billing $180K) for systematically undermining team trust through information hoarding and backchannel politicking. The team's NPS with customers improved within one quarter of that departure.

She values being treated as a strategic partner, not a service function. The litmus test: does the CEO ask for her perspective on product direction, or only call her when churn spikes? She's been in both situations and will only accept the former going forward.

Specific behavioral markers she looks for in interviews:
- Does the hiring manager describe CS wins in terms of customer outcomes or revenue numbers?
- Can they name a time the CS team influenced a product decision?
- Do they talk about CS and Support as separate functions or conflate them?
- How do they describe the previous person in this role (if backfill)?


## Mission & Sector

Drawn to companies solving real operational problems for mid-market customers (50-2000 employees at the customer). She wants a product that makes a tangible daily difference for the user, not something that requires a 90-minute demo to explain the value proposition.

**Strongest domain lanes:** healthtech (clinical workflow, practice management, patient engagement), edtech (institutional, not consumer), and workflow automation (horizontal or vertical).

**Why these domains:** She was a pre-med undergrad before switching to business. Healthtech scratches that itch. Edtech connects to her personal value around access and equity. Workflow automation is where she's seen the clearest product-led CS motion, which she believes is the future of the function.

**Stage:** Series A through C. Early enough to build, funded enough to not be in survival mode. She's open to later stage (Series D+) only if the CS function is still being professionalized and the role is clearly a builder mandate. A $500M company that already has a mature CS org and just needs a steady hand is not interesting to her.

**Geography of customers:** North American customer base preferred. She's managed global CS teams but finds the timezone spread across APAC unsustainable long-term.


## Work Style

- Hybrid with 2-3 days in office preferred. Not anti-remote but her management style depends on physical presence for team development.
- Morning blocker for deep work (no meetings before 10am, non-negotiable in every role she's held)
- Decisions by Thursday, not by committee. She runs a weekly leadership sync on Mondays, expects alignment by midweek, ships by Friday.
- Weekly skip-levels with ICs. She maintains direct relationships 2 levels down. This is how she catches problems early.
- Monthly customer listening sessions she runs personally. Not QBRs, not account reviews. She picks 3-4 customers and has unstructured 30-minute conversations about their experience. This is how she builds product intuition.
- Manages up aggressively. She sends her CEO a weekly 5-bullet email: wins, risks, asks, customer signal, and one thing she's worried about that isn't urgent yet.
- Expects her CEO to tell her when she's wrong directly, not through intermediaries or passive-aggressive calendar invites.

**Communication preferences:** Slack for quick coordination. Email for anything that needs a paper trail. Docs for proposals (not decks). She writes long and thinks in prose, not bullet points.

**Meeting philosophy:** Every meeting needs a decision owner and a time limit. She cancels any recurring meeting that hasn't produced a decision in 3 consecutive weeks.


## What Energizes You

### Energy Sources
- Watching a first-time manager she hired run their first QBR solo and nail it
- The moment a skeptical VP of Engineering starts citing customer health data in sprint planning
- Whiteboarding the customer journey with Product and finding the gap nobody saw
- First-time manager coaching: the 1:1 where someone realizes they can lead
- Building something that didn't exist before and seeing it work
- Cross-functional wins where CS data changes a company decision

### Energy Drains
- Internal politics about headcount and budget when the data clearly supports the ask
- Reporting to someone who views CS as glorified support
- Weekly pipeline reviews or forecasting calls that have nothing to do with her function
- Travel more than 25% of the time (she did 40% at one company and burned out in 8 months)
- Being asked to present metrics she knows are misleading
- Enterprise account management: long cycles, complex stakeholder maps, low agency


## Disqualifiers

These are non-negotiable. No score overrides them.

1. **CS reports into Sales** (not CEO, COO, or CRO with explicit CS mandate). Every time she's seen this, CS becomes an expansion revenue extraction tool. The function loses strategic independence.

2. **No path to VP/Head title within 12 months.** She's at VP level. A Director title is acceptable only if there's a documented, timeline-specific promotion path. "We'll evaluate" is a no.

3. **Fully remote with no in-person team rhythm.** Her management style depends on skip-levels, hallway conversations, and reading body language. Distributed is fine. Fully remote with no regular in-person cadence is not.

4. **Seed-only company with less than 18 months runway.** She can build in resource-constrained environments but needs enough runway for the builder work to actually take root.

5. **Backfill for someone who was fired.** If the previous CS leader was terminated, the root cause is almost always a leadership alignment problem, not a CS execution problem. She's been burned by this.

6. **Product requires 60+ day sales cycle.** Long cycles correlate with CS being pulled into pre-sales. She wants post-sale ownership.

7. **Base compensation below $165K.** Floor based on market, Boston metro location, and 15 years of progressive leadership. Total comp target $200K+ inclusive of equity/bonus. Would accept slightly below base floor ($155K absolute minimum) for exceptional mission fit with strong equity.


## Situation & Timeline

- **Status:** In transition (voluntary, 3 weeks). Left over an integrity conflict about metrics reporting.
- **Runway:** 5-6 months comfortable. Not in financial distress.
- **Urgency:** Selective, not desperate. She'd rather wait 2 months for the right fit than take something convenient.
- **Geography:** Boston metro preferred, hybrid. Open to relocation for the right opportunity. Spouse works remote. Two school-age kids. Prefers not to move mid-school-year (before June or after August). Would consider NYC, Austin, Denver, Seattle.
- **Ideal start:** May 2026. Latest acceptable: August 2026.
- **Approach:** Active networking, selective applications. Would compress timeline for a high-score opportunity. Currently having exploratory conversations with 3 companies (none past first interview).
