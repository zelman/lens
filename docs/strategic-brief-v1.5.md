# The Lens Project: Strategic Brief & Competitive Analysis

*v1.5 | April 22, 2026 | Comprehensive research summary for external review and critique*
*Revision note: Adds Predictive Index as dominant retained-search competitor with full positioning. Scrubs named private-network individuals (testers, advisors, validation contacts, equity-holders-in-discussion) for distribution safety; generic role descriptions replace names. Supersedes v1.4.*

---

## Purpose of This Document

This document captures the complete research, competitive analysis, product vision, go-to-market strategy, and identified gaps for the Lens Project — a structured discovery and alignment layer for executive search, currently in active tester validation. It is intended to be reviewed critically by outside parties (human or AI) to stress-test the thesis, identify blind spots, and challenge assumptions.

The core question this document tries to answer: **Is there a defensible, fundable business in building structured role alignment and candidate discovery tools (lenses) that help executive search firms win and de-risk high-stakes placements?**

---

## Table of Contents

1. [The Problem Statement](#1-the-problem-statement)
2. [What the Lens Project Is](#2-what-the-lens-project-is)
3. [How It Works — The User Journey](#3-how-it-works--the-user-journey)
4. [The Structured Data Format](#4-the-structured-data-format)
5. [Competitive Landscape — Deep Analysis](#5-competitive-landscape--deep-analysis)
6. [What Makes This Different](#6-what-makes-this-different)
7. [The Moat — And Its Vulnerabilities](#7-the-moat--and-its-vulnerabilities)
8. [Why This Matters for Individuals](#8-why-this-matters-for-individuals)
9. [Why This Matters for Companies](#9-why-this-matters-for-companies)
10. [Why This Matters for Coaches](#10-why-this-matters-for-coaches)
11. [Go-to-Market Strategy](#11-go-to-market-strategy)
12. [Technical Architecture & Scaling Concerns](#12-technical-architecture--scaling-concerns)
13. [Business Model & Revenue](#13-business-model--revenue)
14. [Budget & Fundraise](#14-budget--fundraise)
15. [Known Gaps & Open Questions](#15-known-gaps--open-questions)
16. [Assumptions to Challenge](#16-assumptions-to-challenge)

---

## 1. The Problem Statement

### The Candidate Side

The modern hiring process forces candidates into a state of professional fragmentation. For every job application, a candidate tailors their resume to match the job description's keywords, optimizing for ATS (Applicant Tracking System) parsing rather than truth. Cover letters are performances. LinkedIn profiles are marketing copy. The same person presents dozens of different versions of themselves across dozens of applications.

The result: candidates are selected based on how well they perform the optimization game, not on who they actually are or how well they'd actually fit. 67% of new hires report regret within 6 months. The system selects for keyword-matching ability, not for alignment.

Candidates have no way to express values, energy sources, communication preferences, cultural needs, disqualifiers, or the relational dimensions that actually determine whether they'll thrive in a role. Resumes capture what you've done. They do not capture who you are.

### The Company Side

Companies are equally fragmented. Job descriptions are marketing documents, not honest assessments of what a role requires. They describe an idealized candidate rather than the real dynamics of the team, the actual decision-making culture, or the behavioral patterns that predict whether someone will succeed or fail.

ATS platforms score keyword overlap between resumes and job descriptions — matching two performative documents against each other. Bad hires cost 3-5x annual salary (estimated $240K average). No widely-adopted tool interrogates the company on its culture, communication norms, conflict styles, or the behavioral evidence behind its stated values.

### The Structural Problem

The entire hiring infrastructure — job boards, ATS platforms, LinkedIn, recruiting agencies — runs on the resume-as-currency model. Both sides are performing. Neither side is showing up as themselves. Matches fail because they were never real.

**The gap is not in filtering — it is in what is being filtered.** Every tool in the hiring stack operates on the same shallow input: keywords, titles, credentials, assessment scores. Better filtering of shallow data still produces shallow results. No existing tool collects the data that would make better matching possible: behavioral signals, energy patterns, builder-vs-maintainer orientation, values in practice, disqualifiers. You cannot filter on what was never captured.

This is what the coaching work that originated this project calls "the Severance state." The professional self and the actual self are separated by a wall. The hiring process enforces and rewards that separation.

---

## 2. What the Lens Project Is

### One-Sentence Definition

A structured discovery and alignment layer for executive search that helps firms define what a search actually requires (role lens), discover who candidates actually are (candidate lens), and score fit in both directions — producing client-facing deliverables that prevent expensive misalignment.

### The Core Thesis

**Prevent expensive misalignment in high-stakes searches.** A role lens captures what a search actually requires through structured stakeholder alignment. A candidate lens captures behavioral signals — values as demonstrated through action, energy sources, communication patterns, cultural needs, disqualifiers — not just skills and experience. When both sides produce these documents, matching can operate on who people actually are, not who they claim to be. The output: win searches, save time, show rigor.

### The Tagline

**"Structured discovery and alignment for high-stakes executive search."**

### Where It Lives

The product lives at the client-recruiter boundary, not inside the recruiter's internal workflow. If Lens lives inside the ATS (recruiter's internal workflow), it's a feature that gets absorbed. If it lives at the client-recruiter boundary — producing client-facing deliverables — it's a product. The role lens becomes the "search brief" that looks obviously better than what firms currently produce in Word/PowerPoint. Candidate lenses become the "shortlist comparison" that clients review alongside CVs.

### Three-Sided Platform

The Lens Project connects executive recruiters, candidates, and coaches:

- **Executive recruiters** create role lenses through structured stakeholder alignment. They produce client-facing artifacts and score candidates against the role lens. This is the primary entry point and revenue driver.
- **Candidates** create lens documents through AI-coached discovery. They own the file. Every opportunity they encounter gets scored against it.
- **Coaches** contribute their methodologies to power custom AI coaching personas. They improve discovery quality and earn revenue share. Different coaching styles serve different candidate profiles.

The coach layer is a quality moat, not the primary GTM channel. The stress test confirmed the coach market is too diffuse for volume distribution.

---

## 3. How It Works — The User Journey

### Step 1: Land and Understand (30 seconds)
Single-screen value proposition. No signup required. One button: "Build your lens."

### Step 2: Upload and Orient (2 minutes)
- **Status selection:** Employed (exploring), Actively Searching, In Transition — sets tone and urgency
- **Resume upload:** PDF text extraction. Resume is context, not definition.
- **Optional artifact uploads:** Writing samples, portfolio links, GitHub URL, any digital artifact. Each analyzed for behavioral signals before discovery begins.

### Step 3: AI-Coached Discovery (20-40 minutes)
An AI coach (default persona at launch, multiple coach personas later) walks the user through 8 discovery sections:

1. **Essence** — Identity patterns, throughline across contexts
2. **Skills & Experience** — What to carry forward vs. leave behind
3. **Values** — Behavioral evidence, not poster values. "When have you chosen this value at a cost to yourself?"
4. **Mission & Sector** — Specific problems/organizations worth their time
5. **Work Style** — How they actually work, not interview answers
6. **What Fills You** — Energy sources vs. drains
7. **Disqualifiers** — Hard no's that feed the exclusion filter
8. **Situation & Timeline** — Urgency, constraints, runway

The AI coach pushes back on vague or aspirational answers. It uses artifact evidence to challenge self-report. When someone says "I value collaboration" but their writing samples show a consistently directive style, the coach names that tension.

### Step 4: Review Your Lens (5 minutes)
User sees their 6 scoring dimensions with weights, signal tags, disqualifiers, and narrative sections. They can edit anything. They download as a .md file they own. At this point, the user has gotten value even if they never come back.

### Step 5: Connect Your Sources (5 minutes)
The "bring your firehose" step. Four intake channels:
- **RSS/Atom feeds** from job board saved searches
- **Career page URLs** monitored for new postings
- **Email forwarding** (unique address per user — forward recruiter emails, newsletters, friend recommendations)
- **Manual paste** (copy any job description, get instant score)

The user sources their own opportunities. The system enriches and scores them. This eliminates the need for hundreds of job board API integrations at launch.

### Step 6: The Daily Briefing (2 minutes/day)
Scored list of new opportunities from connected sources. Each opportunity includes: overall match score, dimension-by-dimension breakdown, enrichment context (company stage, funding, team size, Glassdoor sentiment), disqualifier flags, and tension notes. User actions: Pursue, Skip (with optional reason), Flag (scoring error).

### Step 7: Lens Evolution (Ongoing)
The lens isn't static. User behavior (pursuing, skipping, flagging) teaches the system. It suggests refinements: "You've skipped 8 opportunities at companies under 50 employees. Add as disqualifier?" Append, don't overwrite — every change is dated.

---

## 4. The Structured Data Format

### The Candidate Lens

A markdown file with YAML frontmatter. The YAML contains structured, machine-readable scoring signals. The markdown body contains narrative context from the discovery conversation.

**YAML frontmatter includes:**
- Schema version, creation date, coach persona used
- Personal metadata (name, status, location)
- 6 scoring dimensions with weights:
  - Mission (25%) — what problems/sectors drive them
  - Role Fit (20%) — preferred stage, scope, autonomy level
  - Culture (18%) — communication, conflict, feedback, psychological safety preferences
  - Skill (17%) — carry-forward skills, leave-behind skills, learning interests
  - Work Style (12%) — pace, structure, remote, tools, collaboration model
  - Energy (8%) — what fills vs. drains them
- Instant disqualifiers (hard no's)
- Score thresholds (strong match, worth exploring, likely mismatch)

**Markdown body includes:**
- Essence narrative
- Skills & experience story
- Values with behavioral evidence
- Mission alignment narrative
- Work style description
- Energy mapping
- Situational context

### The Role Lens (Company Side)

Same format (YAML frontmatter + markdown body) but from the company's perspective:

**YAML frontmatter includes:**
- Company metadata (name, stage, funding, employee count, industry)
- Company essence (behavioral truth, not marketing)
- Same 6 scoring dimensions, mirrored:
  - Mission — what drives the company in practice, not on the careers page
  - Role Fit — what this role actually needs, stage (0-to-1, 1-to-10, optimization), autonomy, scope clarity, 90-day and 1-year success definitions
  - Culture — decision-making style, conflict norms, feedback culture, psychological safety level, values-in-practice with behavioral evidence
  - Skill — required, preferred, overrated, underrated skills
  - Work Style — pace, structure, remote norms, tools, manager style
  - Energy — what fills this team, team energy description
- Disqualifiers (what would make someone wrong for this role)
- Compatibility notes (known tensions to surface, not hide)
- Compensation details

### Existing Structured Resume Formats

**JSON Resume** is the closest existing analog. It's a community-driven, MIT-licensed, open-source JSON schema for resumes. It covers basics, work history, education, skills, languages, interests, references, and projects. It has CLI tools, themed renderers, and a hosted registry. They're also working on a companion Job Description schema.

**Critical difference:** JSON Resume captures what you've done. The lens captures who you are. JSON Resume has no fields for values, energy sources, disqualifiers, mission alignment, culture signals, work style preferences, or scoring weights. It's the data layer for a traditional resume, not for a professional identity.

**Other formats:** HR-XML (now HR Open Standards) is an enterprise data exchange format for HR systems. The Europass digital credential standard is used in Europe. Both are resume/credential focused, not identity/fit focused. Schema.org has a Person type but nothing standardized for what the lens captures.

**The gap is real:** No open, standardized format exists for structured professional identity data. JSON Resume proved there's appetite for portable, structured career data. A "lens schema" that extends this concept to include values, signals, scoring weights, and disqualifiers would be genuinely novel.

---

## 5. Competitive Landscape — Deep Analysis

### Tier 1: Two-Sided AI Recruiting Platforms

#### Jack & Jill AI (Closest Competitor)
- **What they are:** Two-sided AI recruiting marketplace. "Jack" is an AI career coach for candidates, "Jill" is an AI recruiter for employers. Raised $20M seed (October 2025, led by Creandum). 49,000 candidates in 6 months in London. Expanding to SF.
- **How they work:** Jack conducts a 20-minute AI-powered profile interview, then provides curated job matches and coaching (mock interviews, salary benchmarking, negotiation guidance). Jill builds role profiles, screens candidates from Jack's network, and makes introductions. Companies pay 10% of first-year salary on successful hire (half typical agency fee).
- **Business model:** AI-powered recruiting agency with contingency fees. Free for candidates. Companies pay per hire.
- **What they do well:** Two-sided. Conversational AI on both sides. Lower cost than traditional agencies. Growing fast.
- **What they don't do:**
  - No portable document. Candidate profiles live on their platform.
  - 20-minute intake is shallow. No behavioral evidence layer.
  - No artifact analysis (writing, code, portfolio).
  - No coach methodology integration. Single AI approach.
  - No company-side culture discovery beyond job description parsing.
  - No tension mapping. Matches are presented as good/bad, not nuanced.
  - Candidate has no agency over or ownership of their data.
  - Competitor critique (from Mokka): "Jack represents your company to candidates — you have zero control over how it communicates, what it promises, or how it positions your culture."

#### Otta (now Welcome to the Jungle)
- **What they are:** Curated tech/startup job platform acquired by Welcome to the Jungle (January 2024). 1.7M+ users. Candidate-first with preference-based matching.
- **How they work:** Candidates set preferences (role type, salary, company size, values). Platform matches and surfaces curated opportunities with company profiles including salary transparency, diversity stats, and editorial "takes."
- **What they don't do:** Matching is preference-based (stated filters), not identity-based (behavioral signals). No deep profiling on either side. No coach involvement. No structured document output.

#### Wellfound (formerly AngelList Talent)
- **What they are:** Startup-focused job marketplace. Mandates salary/equity transparency. Direct founder-to-candidate messaging.
- **What they don't do:** Keyword + stated preference matching. No deep discovery. No structured profiles beyond traditional resumes.

#### Plum (Added Post-Stress Test)
- **What they are:** Behavioral assessment + role matching platform. Standardized forced-choice assessment measures 10 talents (innovation, communication, teamwork, etc.). $750/month. High-volume focus, early-career and mid-market.
- **How they work:** Candidates complete a 25-minute assessment. Results produce a Plum Profile matched against role requirements. Companies define "success profiles" for each role.
- **What they do well:** Behavioral assessment with validated psychometric properties. Role matching is systematic, not keyword-based. Bias-audited.
- **What they don't do:** Standardized self-report instrument — not coached discovery. No coaching layer. No stakeholder alignment on the role side. No portable document. High-volume focus means depth is limited. Company→Candidate direction only.
- **Why it matters:** Plum represents the "behavioral assessment + role matching" category that Lens must distinguish itself from. The differentiation is input method (coached conversation vs. forced-choice assessment) and market focus ($300K+ exec search vs. high-volume hiring).

#### Torre.ai (Updated Post-Stress Test)
- **What they are:** AI-powered talent marketplace with a "professional genome" concept. 112 factors scored across skills, personality, and preferences. $10M seed funding. Strong in LATAM and mid-market.
- **How they work:** Candidates build a "genome" profile through self-report and skill verification. Platform matches bidirectionally — candidates see company fit, companies see candidate fit.
- **What they do closer to Lens:** 112-factor genome is the most dimensional competitor profile. Bidirectional matching concept. Portable profile to some degree.
- **What they don't do:** Factors are self-reported, not coached. No stakeholder alignment discovery. No client-facing artifact for exec search. Mid-market focus, not $300K+ placements. No tension mapping.
- **Why it matters:** Torre.ai proves there's appetite for multi-dimensional matching beyond keywords. The question is whether coached conversational extraction produces meaningfully different signals than their 112-factor self-report approach.

### Tier 2: ATS Platforms with AI Assessment

#### Ashby
- **What they are:** Premium all-in-one ATS + CRM + analytics, starting at ~$400/month. Strong in tech/growth companies.
- **AI capabilities:** ML algorithms score candidates on job requirements, culture fit, and historical hiring patterns. Structured feedback scorecards. Quality of Hire tracking. AI candidate assistant with full context access. Notably, Ashby's AI never gives numerical ratings to applicants — a human must always be involved.
- **What they don't do:** Starts from the job description, not from deep company discovery. No company-side culture interrogation. No portable candidate document. No coach involvement. Assessment is one-directional (company evaluates candidate). Third-party bias audits (FairNow) show awareness but not structural innovation.

#### Greenhouse
- **What they are:** Established ATS with 500+ integrations. Recently added AI-powered resume filtering, feedback structuring, and reporting.
- **What they don't do:** Same limitations as Ashby. AI augments existing ATS workflow but doesn't fundamentally change the matching paradigm.

#### Lever (LeverTRM)
- **What they are:** ATS + CRM hybrid focused on talent relationship management and pipeline nurturing.
- **What they don't do:** Good at relationship tracking, but matching is still keyword-based. No deep profiling.

### Tier 3: Dedicated Assessment Platforms

#### The Predictive Index (PI)
- **What they are:** $102M revenue, 447 employees, 8K customers across 142 countries. Cognitive + behavioral assessments mapped to "reference profiles" (e.g., "Maverick," "Strategist"). Founded 1955; decades of accumulated psychometric validation studies.
- **What they do well:** Canonical trait-measurement incumbent with a real moat — published validation evidence, established enterprise trust, and deep channel penetration in retained search (Caldwell Partners is PI's largest certified partner worldwide; other certified partners include Renée Vincent, Shulman Associates, Ascent Select). PI Job Assessment is the closest functional analog to the role lens.
- **What they don't do:** Outputs are assessment verdicts — trait graphs tied to reference profile labels, not narrative identity. No portable candidate-owned document. No coaching layer. No bidirectional role-specific depth that ties stakeholder alignment to a client-facing artifact. The canonical assessment-verdict model Lens deliberately rejects.
- **Positioning vs. Lens:** Not competing on trait measurement — that ground is covered. Lens adds the narrative layer PI structurally doesn't produce, plus the candidate-owned artifact and bidirectional role-specific scoring. For PI-certified firms, Lens is additive. For non-certified boutiques, Lens is the wedge.

#### Pymetrics
- **What they are:** Neuroscience-based gamified assessments measuring cognitive and emotional traits (attention, memory, risk tolerance). Acquired by Harver.
- **What they do well:** Behavioral data from games is harder to fake than self-report. Maps to role-specific success profiles.
- **What they don't do:** Tests candidates only. Does not assess the company. No portable output. No coaching layer. Results stay in the employer's system.

#### Bryq
- **What they are:** Talent assessment platform combining cognitive ability, personality, and culture fit in a single chat-style assessment. Bias-audited. Closed-loop feature connecting assessment results to performance data.
- **What they do well:** Integrates hard/soft skills with culture fit. AI recommends assessments based on job description.
- **What they don't do:** One-directional (candidate assessed, company not). No deep company discovery. No portable document. No coach involvement.

#### HireVue
- **What they are:** Video interview + AI assessment platform. 700+ companies including Fortune 500. Gamified assessments + automated screening.
- **What they do well:** Scale. Can process thousands of candidates with video analysis, NLP, and structured evaluation.
- **What they don't do:** Assessments evaluate performance under test conditions, not behavioral identity. No company-side assessment. Candidate has no access to or ownership of their scores. No coaching layer.

#### TestGorilla
- **What they are:** 400+ test library covering skills, cognitive ability, personality, and culture-add. Anti-cheating features.
- **What they don't do:** Test battery, not identity discovery. No coaching. No portable output.

#### Harver
- **What they are:** High-volume hiring platform with predictive assessments. Notable: assigns an I/O psychologist to work with the company to create an ideal candidate profile and determine key success characteristics. Performance feedback loops optimize over time.
- **What they do closer to Lens:** The I/O psychologist engagement is the closest thing to "interrogating the company" in the market. But it's a human consulting service, not an AI-driven discovery flow. Not scalable.
- **What they don't do:** Human-dependent company profiling. No portable candidate document. No coaching personas. High-volume focus (retail, hospitality, BPOs) rather than leadership/knowledge worker roles.

#### ThriveMap
- **What they are:** Realistic "day-in-the-life" pre-hire assessments. Custom-built for each employer to simulate actual role conditions. Measures cultural fit, commitment, and capabilities against an employer-defined ideal.
- **What they do well:** The thesis that hires fail due to expectation gaps (not skill gaps) aligns with Lens's thesis. Company-customized assessments go deeper than generic tests.
- **What they don't do:** Assessments are employer-controlled, not candidate-owned. No portable output. No coaching layer. Focused on entry-level/high-volume roles.

#### Crosschq
- **What they are:** Hiring Intelligence Platform. 360 digital reference checking + quality of hire prediction. Links pre-hire data to post-hire outcomes.
- **What they do well:** Multi-dimensional data (references, self-assessments, performance data). Closed-loop between hiring signals and outcomes.
- **What they don't do:** Post-application tool. No pre-match identity discovery. No company-side assessment. No coaching.

### Tier 4: AI Sourcing & Talent Intelligence

#### Eightfold AI
- **What they are:** Enterprise talent intelligence platform using deep learning to match on skills and capabilities (not job titles). Internal mobility marketplace.
- **What they do well:** "Skills not titles" thesis overlaps with the Lens "signals not keywords" thesis. Identifies hidden talent based on capability patterns.
- **What they don't do:** Enterprise-only (not accessible to individuals). No portable candidate document. No company-side culture discovery. No coaching. No tension mapping.

#### Juicebox (PeopleGPT)
- **What they are:** AI-powered candidate search across 600M+ profiles from 60+ sources. Natural language queries produce curated shortlists.
- **What they don't do:** Company-side only. Sourcing tool, not identity tool. No candidate agency.

#### Phenom
- **What they are:** Enterprise talent experience platform with AI Fit Score, talent CRM, internal marketplace, and career pathing.
- **What they don't do:** Enterprise suite, not marketplace. Candidates don't interact directly. No portable output.

### Tier 5: Job Profiling Tools

#### Thomas (Thomas International)
- **What they are:** Define human requirements of a job (behaviors, work style, aptitude) beyond just tasks. Profile-aligned hiring conversations.
- **What they do closer to Lens:** Focus on "team-fit + role-fit" rather than generic culture fit. Reduces vague feedback to profile-aligned evaluation.
- **What they don't do:** Company uses it internally. Candidates don't have access. No portable output. No coaching.

#### Carv
- **What they are:** Meeting intelligence platform that joins recruiter interviews, generates candidate write-ups, populates ATS fields. Can create ideal candidate profiles from intake calls.
- **What they do closer to Lens:** Acknowledges that job profiles often don't align with what the hiring manager actually envisions. Uses intake conversations to bridge the gap.
- **What they don't do:** Recruiter tool, not candidate tool. No portable output. No coaching personas.

#### TechWolf
- **What they are:** AI-driven skills intelligence from workforce data. Supports role profiling based on actual skills reality rather than outdated JDs.
- **What they don't do:** Internal workforce tool. No candidate-facing product. No coaching.

### Tier 6: Bidirectional Matching & Prior Art

#### SquarePeg (Cautionary Prior Art)
- **What they were:** Attempted bidirectional psychometric matching — the closest conceptual predecessor to the Lens Project's thesis. Used personality and behavioral assessments on both candidate and company sides to predict fit.
- **What happened:** Pivoted to AI resume screening. The bidirectional matching model didn't achieve traction in its original form.
- **Why it matters:** SquarePeg's trajectory is the strongest cautionary signal. The question isn't whether bidirectional matching is theoretically better — it's whether the market will adopt it. Key differences from Lens: SquarePeg used standardized psychometrics (survey-based), not coaching-depth discovery. Lens's thesis is that the input quality gap (coached behavioral evidence vs. self-report survey) changes the output quality enough to change adoption. This is an assumption, not a fact.

#### Textkernel (Bimetric Scoring)
- **What they are:** Enterprise talent intelligence platform with "bimetric scoring" — bidirectional matching that scores candidates against roles AND roles against candidates simultaneously.
- **How it works:** Scores are based on symmetric skills dimensions. Both sides of the match use the same skill taxonomy.
- **What they don't do:** Skills-only foundation — no identity signals, values, energy, culture, or disqualifiers. Symmetric dimensions (same axes for both sides) vs. Lens's asymmetric architecture (candidate lens and role lens use the same 6 dimension categories but with mirrored, role-appropriate signals within each). No coaching layer. No portable document.
- **Why it matters:** Textkernel proves the bidirectional matching concept has enterprise traction. The differentiation question is whether identity-signal matching produces meaningfully better outcomes than skills-only matching. This is the empirical question Lens needs to answer.

### Competitive Matrix Summary

| Capability | Jack & Jill | Plum | Torre.ai | Ashby | PI | Pymetrics/Bryq | Harver | Eightfold | Textkernel | The Lens |
|---|---|---|---|---|---|---|---|---|---|---|
| Deep candidate profiling | Shallow (20 min) | Standardized | 112-factor | No | Trait graph | Yes (tests) | Yes (tests) | Yes (skills) | No | **Yes (coached)** |
| Deep company/role profiling | No | No | No | No | Job Assessment | No | Partial (human) | No | No | **Yes (role lens)** |
| Portable candidate document | No | No | No | No | No | No | No | No | No | **Yes (.md file)** |
| Coach-driven quality | No | No | No | No | No | No | Partial (I/O psych) | No | No | **Yes (personas)** |
| Tension/risk mapping | No | No | No | No | No | No | No | No | No | **Yes** |
| Candidate owns data | No | No | No | No | No | No | No | No | No | **Yes** |
| Bidirectional matching | Partial | No | Partial | No | Partial (trait match) | No | No | No | **Yes (skills)** | **Yes (identity)** |
| Multi-source intake | No | No | No | N/A | No | No | No | N/A | N/A | **Yes** |
| Behavioral evidence | No | Forced-choice | Self-report | No | Forced-choice | Partial (games) | Partial (sims) | Partial (skills) | No | **Yes (artifacts)** |

**Honest differentiation (post-stress test):** Others match on behavioral signals using standardized self-report instruments (PI, Plum, Torre.ai, Jack & Jill). Lens is differentiated by input method (coached conversational extraction vs. standardized instruments), output format (portable, user-owned narrative document vs. trait graphs or match scores), primary use case ($300K+ executive search), and market position (at the client-recruiter boundary, producing client-facing deliverables). The claim "nobody does both sides with depth" is directionally correct but overstated — Textkernel does bidirectional matching on skills, Torre.ai has partial bidirectional capabilities, and PI's Job Assessment does one-sided role profiling. Lens's differentiation is in the depth and asymmetry of the identity signals and the narrative-over-verdict output format, not in being the only bidirectional system. PI in particular has a real moat in trait measurement — Lens does not compete on that axis; it adds an orthogonal layer.

---

## 6. What Makes This Different

### 1. The Document Is the Product (Not the Platform)

Every other tool in the market creates data that lives on their platform. Candidate profiles in Jack & Jill's database. Assessment scores in Bryq's system. Pipeline records in Ashby's ATS. The user never sees, controls, or owns this data.

The lens is a file the candidate owns. A .md file with YAML frontmatter. It's portable. It works independently of the platform. If the Lens Project shuts down tomorrow, the user still has their structured professional identity document. They can share it with a recruiter, print it before an interview, use it as the basis for their LinkedIn rewrite, or feed it to any other system.

This is the JSON Resume model applied to professional identity, not just work history.

### 2. Bidirectional Discovery with Equal Depth

Every platform profiles candidates deeply and companies shallowly (or not at all). The company side in existing tools is a job description, maybe with some preference filters. Nobody runs a deep, structured, coach-facilitated discovery process against the company that captures:
- How decisions actually get made (vs. how the org chart implies they're made)
- How conflict is actually handled (vs. "we have healthy debate")
- What the communication norms really are (vs. "we value transparency")
- What values look like in practice, with behavioral evidence
- What would make someone quit this role in 6 months

The role lens captures this. The matching engine scores both documents against each other. The output isn't "you're a match" — it's a compatibility briefing that includes predicted tension points.

### 3. Coach-Driven Quality as Structural Moat

The AI coaching persona isn't a chatbot. It's trained on real coaching methodologies from working coaches. Different personas use different discovery approaches — deep/introspective (for mid-career identity work), strategic/executive (for senior leaders who know themselves), career-change specialist, neurodivergent-informed, etc.

The coach layer ensures the lens contains behavioral evidence, not aspirational self-description. Self-serve tools produce shallow profiles. Coach-facilitated discovery produces documents grounded in real patterns.

**Academic inspiration:** Oh, Wang & Mount (2011, *Journal of Applied Psychology* 96:4) demonstrated that observer ratings of personality predict job performance significantly better than self-report ratings. This research inspired Lens's focus on extraction depth: if the quality of how you capture identity signals matters, coached conversational discovery should produce richer, more structured signal than standardized self-report instruments (Plum, DISC, StrengthsFinder).

**Honest framing:** What the lens produces today is higher-resolution structured self-report — not observer-grade assessment. The AI has no independent behavioral history; it's categorizing what the candidate says about themselves through a coaching-informed process. The roadmap includes adding external observer signals (references, peer input, prior manager feedback) to move toward genuine observer-grade validity. A validation study (lens scores vs. supervisor ratings vs. performance outcomes) is planned as a Phase 3 milestone.

This distinction matters: "built on observer-validity research" is an overclaim. "Inspired by observer-validity research, with a roadmap to incorporate external signals" is honest and defensible.

### 4. Tensions, Not Just Fit

Every matching system outputs a binary (match/no match) or a single score. The lens produces a compatibility briefing: overall alignment, dimension-by-dimension breakdown, AND predicted friction points.

A candidate who scores high on autonomy matched with a company that scores high on process oversight isn't necessarily a bad match — but it's a known tension that both sides should enter with clear eyes. This is the "briefing, not a job alert" philosophy.

### 5. Accumulation Over Time

Resumes depreciate. A lens appreciates. The append-don't-overwrite philosophy means the lens becomes a longitudinal record. Your first lens captures who you are now. Six months later, after you've taken a role, it grows: what you learned, what shifted, what you'd now disqualify. User behavior (pursuing, skipping, flagging scored opportunities) continuously refines the scoring.

On the company side, the same principle applies. A role lens updated after a reorg, leadership transition, or cultural shift shows trajectory: "this company valued autonomy in 2025 but added process layers in 2026."

### 6. Bring Your Own Sources

At launch, the user connects their own opportunity sources (RSS feeds, career page URLs, email forwarding, manual paste). The system enriches and scores whatever the user brings in, rather than claiming to cover the entire job market. This eliminates the need for hundreds of job board API integrations at launch, dramatically reduces cost, and means the product is useful on day one regardless of market coverage.

---

## 7. The Moat — And Its Vulnerabilities

### Defensibility Assessment

Technology defensibility is rated 3–4/10 by independent stress testing (4 AI models, 2 prompt versions). The patent helps but is narrow and work-aroundable. Portability ("you own your data") is a sales feature, not a moat — any competitor could add a download button in one sprint. Real defensibility comes from process embedding and data accumulation.

### The Three Moats That Actually Work

1. **White-Label Process Embedding:** Let early firms brand Lens output as their proprietary methodology. Once they're marketing "our structured alignment process" to clients, switching cost is high regardless of whether the underlying tech is copyable. If Lens defines how a firm does stakeholder alignment, removing it means rebuilding their client-facing methodology.

2. **Outcome Data Accumulation:** Track search outcomes — time-to-slate, offer acceptance, early attrition. Over years, this builds evidence that incumbents can't replicate without their own years of usage data. This is the defensibility that compounds.

3. **Per-User Learning System:** Weight calibration, gate refinement, and drift detection compound with usage. Exponential signal decay preserves all history. Three-level feedback loop. This creates individual switching cost — leaving means losing years of calibration data.

### What Is NOT a Moat (Updated)

- **Portability.** "We allow export" is trivially copyable. Portability only becomes a moat if the lens schema becomes a de facto standard that other platforms integrate with or the document accumulates networked data (endorsements, outcomes, recruiter notes).
- **The conversation itself.** A conversational intake powered by any LLM is one sprint of work. The end-to-end workflow + client-facing artifact + analytics is harder, but the conversation alone is not defensible.
- **Coach network lock-in.** Coaches improve quality, but the coach market is too diffuse for volume distribution. Coaches are a quality moat, not a distribution moat.

### Vulnerabilities to Challenge

**V1: Coach dependency vs. AI improvement.** As foundation models improve, will the gap between AI-only and coach-facilitated lenses narrow? If Claude-next can push back on aspirational answers as well as a human coach, does the coach layer lose its value proposition? Counter-argument: the coach's value isn't just push-back technique — it's domain-specific methodology and the human relationship. But this needs honest monitoring.

**V2: Jack & Jill could add depth.** They have $20M and traction. If they decided to make their 20-minute intake into a 40-minute deep discovery and added portable documents, how fast could they catch up? Counter: their business model (contingency recruiting) doesn't incentivize depth — they make money on speed of placement, not quality of matching. But they could pivot.

**V3: An ATS player adds identity features.** Ashby, Greenhouse, or Lever could build something lens-like into their platform. They already have company data and candidate data. Counter: ATS incentives are aligned with the company (their customer), not the candidate. A truly candidate-owned identity document conflicts with the ATS value proposition of controlling candidate data.

**V4: The cold-start problem is three-sided.** A two-sided marketplace is hard. A three-sided platform (candidates, coaches, companies) is harder. The coach-as-channel GTM strategy mitigates this (coaches bring both candidates and companies), but it's still a risk. If coach recruitment is slower than expected, the flywheel stalls.

**V5: Data quality at scale.** The garbage-in-garbage-out concern is existential. If the AI-only lens (free tier) produces documents indistinguishable from personality quizzes, the format loses credibility before coaches can elevate it. The AI prompt engineering for push-back behavior is the critical quality lever at launch.

**V6: The credit reporting problem.** Unless employers adopt the lens format, candidates are still forced to submit traditional resumes through ATS. The lens has standalone utility (scoring against existing job postings, interview prep, self-knowledge), but the full marketplace vision requires employer adoption. The path from "tool for candidates" to "infrastructure for hiring" requires a bridge — and that bridge may be longer than anticipated.

**V7: Source coverage determines daily briefing quality.** The bring-your-own-sources model is capital-efficient but puts setup burden on the user. If someone's lens says "large enterprise, public sector" and they can't easily find RSS feeds for those opportunities, the briefing is empty. The system is only as useful as the sources the user connects.

---

## 8. Why This Matters for Individuals

### Immediate Value (Before Any Employer Adopts)

1. **Self-knowledge artifact.** Most people have never done structured, coached self-assessment of their professional identity. The discovery process alone produces clarity that makes every subsequent career conversation more effective.

2. **Scoring against existing opportunities.** The daily briefing scores real job postings against the lens. Users stop manually gut-checking every posting and instead spend 2 minutes reviewing a scored, enriched briefing.

3. **Interview preparation.** Someone who has articulated their essence, values, disqualifiers, and energy sources walks into interviews with specificity that hiring managers find compelling. They ask better questions. They self-select out of bad fits faster.

4. **Recruiter communication.** Sharing a lens with a recruiter immediately communicates what the user actually wants, replacing the vague "I'm looking for a good culture fit" with structured signals.

5. **Reduced fragmentation.** Instead of tailoring 50 resumes, the user builds one identity document and lets the scoring engine determine fit. The user stays whole.

### Long-Term Value (As the Marketplace Develops)

6. **Bidirectional matching.** When companies create role lenses, the candidate sees not just "this job matches you" but "here's how it matches, here's where it doesn't, and here's what will be hard."

7. **The lens appreciates over time.** Every job the user pursues, skips, or flags refines the scoring. Every career transition adds a dated layer. The document becomes a longitudinal record of professional growth.

8. **Portability.** The user owns their data. They're not locked into any platform. The .md file works anywhere.

---

## 9. Why This Matters for Companies

### The Cost of Bad Hires

Bad hires cost 3-5x annual salary in direct costs (recruiting, onboarding, separation) and indirect costs (team disruption, lost productivity, cultural damage). At a $150K salary, that's $450-750K per bad hire. Companies with 100+ employees make several bad hires per year.

### What the Lens Offers

1. **Pre-profiled candidates with behavioral evidence.** Instead of evaluating resumes (what someone says they've done), companies see structured identity data grounded in coach-facilitated discovery (who someone actually is).

2. **Role lens as honest self-assessment.** The role lens creation process forces companies to articulate what actually matters in a role — beyond the job description. This alone often reveals disconnects between what the hiring manager wants and what the posted JD says.

3. **Compatibility briefings, not applicant rankings.** The output shows fit, compatibility, AND predicted tensions. Both sides enter the relationship with clear eyes. This reduces first-year attrition.

4. **Quality of hire measurement.** The lens scoring provides a baseline prediction that can be compared to actual post-hire outcomes, creating a feedback loop that improves hiring over time.

### The Adoption Bridge

At launch, companies don't need to change anything about their process. The lens operates as a sourcing channel: pre-profiled candidates whose compatibility is already scored. The company accesses this alongside their existing ATS, not instead of it. Over time, companies that create role lenses get better matches. The incentive to participate grows as the candidate lens database grows.

**Update (April 7, 2026):** Validation feedback from a retired Goldman Sachs partner (30+ years, COO Human Capital Management, Chief Diversity Officer) narrows the company-side thesis. The time investment of deep discovery is only justified for high-stakes hires ($300K+/board-level) where a mis-hire is catastrophic and search fees already run $50K-100K. For volume hiring, speed wins over depth. Two tractable company-side entry points:

1. **Executive recruiter channel:** Recruiters placing senior candidates are the natural buyer. They're already paid for quality, and the lens gives them a structured competitive advantage over other recruiters.
2. **Internal mobility:** Companies lose talent because they can't match people to the right internal roles (77% per Aptitude Research). Employees are intrinsically motivated, reducing gaming risk. The Lens identity layer sits on top of existing skills infrastructure (Gloat, Fuel50, Eightfold) as an overlay.

---

## 10. Why This Matters for Coaches

### The ROI Problem Solved

Career coaching produces clarity. But clarity without a concrete artifact is invisible. Clients struggle to articulate what coaching gave them. Referrals depend on vibes, not evidence.

When coaching produces a functional lens document that governs daily job scoring, the outcome becomes concrete and measurable. The client walks away with a file that actively works for them every day. That's the ROI story coaches have never had.

### Scalable Methodology

A coach's methodology, encoded as an AI persona, reaches clients they'll never meet in person. The persona works 24/7. The coach earns revenue from every lens produced through their persona. Their intellectual contribution scales without proportional time investment.

### The Platform Model

The Lens Project is "Spotify for coaching methodologies." The platform doesn't depend on any single coach. The value is the system that encodes methodologies and the matching engine that connects candidates to the right discovery style. Different coaches serve different populations: deep/introspective, strategic/executive, career-change, neurodivergent-informed, returning-to-work, technical-to-management transitions. Each persona produces the same structured output format through a different discovery path.

### Coach Incentive Structure

- **Founding equity grant:** 1-2% for founding coach partners whose methodologies are foundational.
- **Revenue share:** 15-25% of every lens created through their persona. Passive income that scales with adoption.
- **IP protection:** The coach's methodology remains theirs. They grant a license, not an assignment. If the company shuts down, their IP reverts fully.

---

## 11. Go-to-Market Strategy

### Phase 1: Ship the Free Tool (Weeks 1-4) — COMPLETE
AI lens creation tool deployed on Vercel (serverless proxy architecture). Full 8-section discovery flow with live Claude API integration. Session persistence. 5-category file upload. Feedback form deployed separately. Tester cohort active, with multiple testers having completed the full flow and submitted structured feedback. Three tester-driven fixes shipped: bias in discovery prompts toward the founder's profile, redundant questioning across sections, and missing privacy disclosure at flow start. Post-guardrails version deployed with single-question constraint and improved discovery quality.

### Phase 2: Distribution & Learning (Weeks 4-12) — IN PROGRESS
Content marketing around "the indelible you" thesis. LinkedIn launch post (personal story, pending). Advisor C-level network activation (contingent on formalization). Coach network seeding. Core narrative v1.1 built as single source for all positioning materials.

**Active validation pipeline (April 2026):**
- **Senior CPG hiring leader:** 20+ years CPG sales leadership (Fortune 500 consumer brands). Has hired extensively at Director+ level. Validation contact for the hiring-manager perspective.
- **Enterprise consulting VP:** VP-level at major hyperscaler, ~1,200 reports. Validation contact for enterprise internal mobility thesis.
- **Fractional CPO:** Built a custom AI HR system. LinkedIn outreach sent April 2026. Validates the HR tech practitioner perspective.

### Phase 3: Coach Recruitment (Weeks 8-16)
3-5 founding coaches. Methodology capture → persona encoding → testing → refinement → launch. Revenue share model. Starting with a founding coach specializing in deep/introspective methodology. Additional advisor involvement contingent on business formalization.

### Phase 4: Executive Search Wedge (Months 4-8) — RESEQUENCED

The stress test consensus (4 AI models) confirmed: the wedge into exec search is NOT "help me understand this candidate better." It's "help the five partners at this firm agree on what they're actually looking for — and produce a client-facing artifact that's obviously better than the Word doc they currently send."

**Role lens first:**
- Gate 1: Get one recruiter to use a role lens on an active search
- Gate 2: Recruiter confirms the role lens aligned stakeholders faster than their current process
- Gate 3: Add candidate lens as natural extension after role lens proves value

**First customer profile (from stress test):** 10–20 person retained boutique, sector-focused (B2B SaaS, healthcare, PE-backed portfolio cos), 20–60 C-level searches/year, $150–250K average fee. Uses Invenias or Clockwork plus spreadsheets. Prides themselves on white-glove discovery. Under pressure from PE/board clients to show more "rigor."

**Trigger event:** A high-profile mis-hire post-mortem, or a competitive pitch where the firm fears losing to a bigger firm touting proprietary psychometrics.

**Pricing:** $2–5K per search (1 role lens + N candidate lenses + client-facing reporting). Evolve to firm-level subscriptions ($30–80K/year) as proof of value accumulates. At $4K/search across 2,500 searches/year = $10M ARR.

**Two tractable entry paths:**
- **Executive recruiter channel (primary):** Exec recruiters placing senior candidates ($300K+) are the natural buyer. Founder-led consultative sales. This is services-adjacent SaaS — think "Bloomberg Terminal for exec search" — not a self-serve PLG motion.
- **Internal mobility (secondary):** Employees are intrinsically motivated (reducing gaming risk). The Lens identity layer sits on top of existing skills infrastructure (Gloat, Fuel50, Eightfold) as an overlay.

**Competitive reality in this channel:** PI is already present in most retained-search conversations — Caldwell Partners is PI's largest certified partner worldwide, and other top boutiques are certified or in evaluation. This shapes the wedge strategy: target non-certified boutiques first (where Lens is greenfield), and position against PI-certified firms as a complementary narrative layer, not a substitute. Lens is not trying to compete with PI on trait measurement; Lens adds bidirectional role-specific scoring and a client-facing stakeholder-alignment artifact that PI structurally doesn't produce.

### Phase 5: Network Effect (Months 8-12)
More coaches → better discovery → higher quality lenses → more valuable to companies → more companies → more attractive to coaches. The flywheel.

### Strategic Note: Role Lens First (April 2026 — Post-Stress Test)

The weight of stress test evidence (4 independent AI models) confirmed a clear resequencing: **lead with the role lens and stakeholder alignment, not candidate identity extraction.** The consumer-first signal that emerged from founding-coach feedback (3/30/26) and senior-HR-executive validation (4/7/26) is real — self-directed consumer use is validated. But the enterprise entry point is sharper than originally assumed: the role lens solves an immediate, visible pain (stakeholder misalignment) that ties directly to revenue risk for the buyer. Consumer use continues as the free tier and methodology demonstration, but the primary GTM motion is founder-led consultative sales to retained boutiques.

SquarePeg's lesson, confirmed by all 4 stress test models: buyers pay for less work, better optics, and deal-winning — not better judgment. Recruiters believe their judgment IS the product. Every pitch must lead with one of these: time saved, rigor demonstrated, or searches won.

### Why Coach-as-Channel Solves Cold Start

Coaches bring both sides simultaneously. Their clients are the candidates. Their corporate relationships are the companies. You don't need both sides of the marketplace on day one — you need coaches whose clients span both sides.

---

## 12. Technical Architecture & Scaling Concerns

### Launch Architecture (Current as of April 2026)
- **Frontend:** React (LensIntake.jsx, ~2200 lines with live Claude API discovery, session persistence), Vercel hosted
- **Serverless proxy:** Vercel API routes (`/api/discover`, `/api/synthesize`, `/api/score`) handle Claude API calls server-side. Routes return 405 on GET (confirmed live). `/api/score-role` is spec'd but unbuilt (P1, lower urgency given narrowed enterprise timeline).
- **AI:** Claude API (Sonnet for discovery, Haiku for scoring/enrichment)
- **Discovery guardrails:** Single-question constraint, config/guardrails.yaml
- **Synthesis output:** `SYNTHESIS-PROMPT.md` defines third-person narrative voice for AI-generated lens sections. `lens-report-renderer.jsx` produces International Style PDF output.
- **Workflow orchestration:** n8n (self-hosted Community Edition for unlimited executions)
- **Source intake:** RSS polling, career page monitoring, email parsing (Mailgun/Postmark), paste-and-score API
- **Enrichment:** Brave Search API, Crunchbase API, Glassdoor sentiment extraction
- **Scoring:** Claude API call with lens YAML + enriched opportunity as context
- **Storage:** Airtable (Artifact Registry, Testers, Feedback Archive, Lens Feedback, Claude Code Sessions tables)
- **Briefing delivery:** Email (primary) + web dashboard
- **IP:** Provisional patent filed March 24, 2026 (App #64/015,187, micro entity). Convert to nonprovisional by March 24, 2027. Microsoft patent US20250378320A1 flagged as potential prior art — attorney review required before nonprovisional conversion.
- **Company:** Zelman Labs LLC filed (Rhode Island), EIN obtained, SAM.gov registration initiated (2-4 week processing).

### Critical Scaling Concern: n8n Execution Volume

Current personal system: 750 executions/day for 1 user. At 100 users with similar patterns, that's 2.25M executions/month.

n8n cloud pricing makes this untenable: Starter plan is 2,500 executions/month (€24), Pro is 10,000 (€60), Business is 40,000 (€800). Overage is €4,000 per 300,000 additional executions. At 2.25M monthly, that's ~€30,000/month — $360K/year just for workflow execution.

**Solution: Self-host n8n Community Edition** (unlimited executions, ~$50-100/month server cost). Progressive migration to hybrid architecture:

- **Month 1-3:** Self-hosted n8n handles everything for 0-100 users
- **Month 3-6:** Extract high-frequency polling (RSS, career pages) into lightweight Python cron jobs. n8n handles complex orchestration only.
- **Month 6+:** Purpose-built scoring and enrichment services. n8n as orchestration layer for complex workflows only.

The key insight: most of the 750 daily executions are empty polls (checking for new content, finding nothing). A cron job that only triggers downstream processing when new content exists eliminates 90% of execution volume.

### Enrichment Source Coverage

The bring-your-own-sources model means launch doesn't require job board API contracts. But enrichment quality varies by company size/visibility. Well-known companies (Series B+, 100+ employees) have rich Crunchbase/Glassdoor data. Small startups, local businesses, nonprofits, and government agencies will have thinner data.

The system must communicate confidence levels alongside scores. "This score is based on limited enrichment data" is honest and necessary.

Phase 2 native integrations are prioritized by actual user source data: if 300 of the first 1,000 users are pasting from Greenhouse-hosted career pages, that's the first native integration to build.

---

## 13. Business Model & Revenue

### Revenue Streams (Updated Post-Stress Test)

| Stream | Price | Function |
|---|---|---|
| Exec Search (B2B) | $2–5K per search | 1 role lens + N candidate lenses + client-facing deliverable. Primary revenue. |
| Firm Subscription (B2B) | $30–80K/year | Unlimited searches. Evolution of per-search as value proven. |
| Free AI Lens | $0 | Full 8-section discovery. Distribution + methodology demonstration. |
| Consumer Pipeline | $50/month | Scored daily briefings. Secondary to exec search revenue. |
| Coach Lens (premium) | $49-149 | Coach persona + artifacts. Higher quality. Rev share to coach. |
| Coach Platform | $500/month | Per active AI persona. Methodology encoding + analytics. |

### Path to $10M ARR

At $4K/search across 2,500 searches/year = $10M ARR. The $10M path is plausible in 4–6 years with founder-led consultative sales. $50M+ standalone is unlikely; realistic outcomes are: (a) profitable narrow niche ($5–15M ARR), (b) acquisition by LinkedIn/Bullhorn/assessment platform once category is proven, or (c) expansion into in-house executive talent at PE funds and large enterprises.

### Unit Economics (Estimated)

- **Free lens creation cost:** ~$0.50-1.00 (Claude API for 20-40 min discovery)
- **Scoring cost per opportunity:** ~$0.05-0.10 (Claude API for enrichment + scoring)
- **Active user cost:** ~$3-5/month (scoring 50-100 opportunities/month + enrichment)
- **Coach platform margin:** High (SaaS, no marginal cost per lens beyond API)
- **Role lens margin:** High (service + software hybrid, one-time creation)

### Conservative Year 1 Revenue Projection

| Source | Projection |
|---|---|
| Coach Platform Fees | $9,500 |
| Premium Lens Creation | $5,880 |
| Company Role Lenses | $15,000 |
| **Total Year 1** | **~$30,000** |

This is a pre-revenue raise. Year 1 revenue offsets costs slightly but does not approach break-even. The raise funds product development and market validation.

---

## 14. Budget & Fundraise

### The Three Budget Scenarios

**Bootstrap ($2-5K, 8-12 weeks, solo build):**
- Host existing lens-form.jsx on Vercel
- Add source intake channels via n8n (self-hosted)
- Claude API for scoring
- 50-100 users from personal network
- Rough but functional. Proves concept.

**Contractor-assisted ($30-50K, 3-4 months):**
- Senior freelance engineer (15-20 hrs/week) builds web app shell
- Eric owns product logic, n8n workflows, scoring prompts
- Professional-feeling v1 with proper auth and onboarding
- Can handle multiple concurrent users

**Full team ($750K, 12 months):**
- 5-person team: Eric (product), Nathan (business — contingent, no formal commitment as of April 2026), full-stack engineer, ML/AI engineer, fractional designer
- Sophisticated multi-channel intake engine
- Multiple coach personas
- Company-side role lens
- Matching engine
- Infrastructure to scale

**NSF SBIR ($275K Phase I, non-dilutive):**
- Pitch drafted (v0.3), framing Lens as a research problem: can coached identity extraction produce measurably better hiring outcomes than keyword/survey-based approaches?
- RI Innovate Fund (STAC) identified as matching grant source for SBIR applications
- SAM.gov registration in progress (required for federal grants, 2-4 week bottleneck)
- Non-dilutive: no equity given up. Funds research validation that strengthens both the product and the IP position.
- Timeline: 6-12 months from submission to award. Complementary to, not exclusive of, pre-seed raise.

### $750K Pre-Seed Raise Details

- **Equity offered:** 15-20%
- **Pre-money valuation:** $3M-4.25M
- **Team allocation:** ~70% ($525K)
  - Eric: $150K (product lead)
  - Nathan: $120K (business, starts month 3 — contingent on formal commitment)
  - Full-stack engineer: $165K (starts month 2)
  - ML/AI engineer: $120K contract (starts month 4)
  - Fractional designer: $75K (~20hrs/wk, starts month 3)
- **Operating expenses:** ~15% ($110K)
  - Claude API, hosting, job board APIs, tools, legal
- **GTM:** ~10% ($75K)
  - Content marketing, coach onboarding, company outreach
- **Buffer:** ~5% ($40K)

### 12-Month Milestones (at $750K)

- 3,000+ candidate lenses created
- 5 coach personas live
- 170 coach-facilitated lenses
- 15 companies engaged
- 6 role lenses + first matches scored
- Position to raise Seed / Series A

### Key People & Equity

- **Founder/Product:** Full-time. Zelman Labs LLC filed (RI).
- **Founding Advisor/BD (in discussion):** 2-3% equity with milestone-based vesting tied to companies engaged, role lenses created, investor intros. No salary. NDA pending.
- **Founding Coach (in discussion):** 1-2% founding equity + 15-25% revenue share on every lens the coach's persona produces. IP license, not assignment — methodology remains with the coach. NDA pending.
- **Potential Co-Builder (in discussion):** Role and terms TBD. Has contributed strategic reframing (bidirectional matching, enterprise hiring) and persona testing. No formal commitment as of April 2026. Budget line item of $120K is contingent on formalization.
- **Total advisor/coach equity:** 3-5%, leaving 75-80% for founders and 15-20% for investors.

---

## 15. Known Gaps & Open Questions

### Product Gaps

1. **Artifact analysis depth.** The launch spec describes analyzing writing samples, GitHub profiles, and portfolio links for behavioral signals. The AI capability to do this reliably at launch is uncertain. How much of this is aspirational vs. buildable in 4 weeks?

2. **Scoring engine accuracy.** At launch, scoring is a Claude API call. How accurate is this compared to purpose-built matching algorithms? What's the baseline accuracy, and how fast does the feedback loop improve it?

3. **Free tier quality threshold.** How good does the AI-only (no coach) lens need to be to avoid poisoning the format's reputation? Is there a minimum quality bar below which a lens shouldn't be scored against?

4. **Enrichment gaps for non-tech companies.** The enrichment stack (Crunchbase, Glassdoor, Brave Search) is biased toward tech/startup companies. Government, healthcare, education, and nonprofit employers may have thin or no enrichment data. How does scoring work for these?

5. **Email forwarding parsing reliability.** Recruiter emails, newsletters, and job alerts come in wildly different formats. How reliable is automated extraction of opportunity details from forwarded emails?

### Market Gaps

6. **Coach recruitment at scale.** The thesis depends on building a diverse roster of coaching styles. How do you recruit coach #6-20 when the first 5 are personal network connections? Is there a scalable coach acquisition channel?

7. **Enterprise sales vs. self-serve.** Companies don't self-serve on $2,500 role lens creation. This requires sales. Who sells? Nathan? Todd? At what cost per acquisition?

8. **International applicability.** The coaching frameworks, cultural dimensions, and hiring norms in this plan are US/Western-centric. How does the lens translate to hiring in India, Japan, Germany, or Brazil?

### Strategic Gaps

9. **Defensibility timeline.** How long before a well-funded competitor (Jack & Jill, Eightfold, or a new entrant) can replicate the coach persona concept? 6 months? 12 months? What's the minimum coach network size that constitutes a defensible moat?

10. **The "and then what" beyond the daily briefing.** The daily briefing is the immediate value. But what's the endgame? Is this a tool company (SaaS), a marketplace (network effects), or a data company (lens corpus as asset)? The answer affects every strategic decision.

11. **Candidate willingness to pay.** The free tool is distribution. But will candidates pay $49-149 for a coach-facilitated lens? What's the evidence that this price point works for career development products?

12. **ATS integration or independence.** Does the product eventually need to integrate with Greenhouse, Ashby, Lever to be useful on the company side? Or does it stay independent as a sourcing channel? Integration adds distribution but adds dependency. Independence preserves the "candidate-owned" thesis but limits adoption.

### Gaps Added April 2026

13. **Free tool indistinguishable from ChatGPT + resume.** A sophisticated user who uploads their resume, LinkedIn, DISC results, and writing samples to ChatGPT with a well-crafted prompt could get a comparable throughline analysis. The raw AI capability is not the moat. The moat is structured output format (machine-readable YAML a pipeline can parse), methodology encoding (coaching frameworks, not raw chatbot), and pipeline integration (daily scoring the user cannot replicate without technical setup). But if the free standalone lens does not produce a visible "aha" moment, conversion to the paid pipeline will not happen.

14. **Enterprise thesis partially validated — but narrower than assumed.** A founding coach partner (3/30/26) challenged the assumption that companies want precision over volume. **A retired Goldman Sachs partner (4/7/26, 30+ years, COO Human Capital Management, Chief Diversity Officer)** confirmed the risk: deep discovery is only justified for **$300K+/board-level hires** where a mis-hire is catastrophic. For volume hiring, speed wins. She identified **executive recruiters** — not HR, not coaches — as the likely buyer, since they're the ones placing high-stakes candidates where fit-at-depth matters. She also flagged the coach market as too diffuse for volume distribution. **Implication:** The enterprise wedge is real but narrower and higher-end than the original thesis assumed. Internal mobility (where the person is already known and the cost of a bad internal move is retention loss) may be more tractable than external hiring at scale. **Still to validate with senior hiring-manager contacts in the pipeline.**

15. **Gaming and performative answers.** If an employer mandated lens creation for applicants, the instinct to give performative answers would be strong — the same optimization behavior that makes resumes shallow. Multi-source cross-referencing and coaching methodology mitigate this, but intrinsic motivation (self-directed use where shallow input costs you real opportunities) is the real anti-gaming mechanism. The employer-mandated use case is structurally weaker than the self-directed use case. Strongest employer path may be internal mobility (where the employee is motivated) rather than external screening.

16. **Product center of gravity resequenced to role-lens-first (post-stress test).** The stress test synthesis (4 AI models, 2 prompt versions) unanimously agreed: lead with the role lens and stakeholder alignment, not candidate identity extraction. The wedge into exec search is NOT "help me understand this candidate better." It's "help the five partners at this firm agree on what they're actually looking for — and produce a client-facing artifact that's obviously better than the Word doc they currently send." Consumer self-directed use remains validated (founding-coach feedback, tester feedback) but is now positioned as the free tier/methodology demonstration, not the primary GTM motion. The first customer is a 10–20 person retained boutique, post-mis-hire trigger or competitive pitch pressure.

17. **Oh/Wang/Mount overclaim flagged (post-stress test).** All 4 stress test models unanimously flagged the claim that a 45-minute AI conversation produces "observer-informed" data as overstated. The AI has no independent behavioral history — it's categorizing what the candidate says about themselves. Reframed from "exact foundation" to "inspired." Validation study planned for Phase 3. This reframe is critical for credibility with academically informed buyers.

18. **Technology defensibility rated 3–4/10 (post-stress test).** All models rated technology defensibility low. The patent is narrow and work-aroundable. Portability is trivially copyable. Real defensibility comes from process embedding (white-label), outcome data accumulation, and per-user learning — all of which require time and adoption to build. The $10M ARR path is plausible in 4–6 years; $50M+ requires market expansion beyond retained exec search.

---

## 16. Assumptions to Challenge

When reviewing this document, please specifically challenge these assumptions:

1. **"Coach-facilitated discovery produces meaningfully better lens documents than AI-only."** This is the foundational assumption. If it's wrong, the entire coach-as-quality-moat strategy collapses. **Partial evidence:** Oh, Wang & Mount (2011, JAP 96:4) found that observer ratings of personality predict job performance significantly better than self-report. A coach functioning as an informed observer during discovery is the mechanism by which coached lenses would outperform self-directed ones. However, this study used human observers, not AI personas trained on coaching methodology — the transfer assumption remains untested. **Stress test note:** All 4 models flagged the claim that a 45-minute AI conversation produces "observer-informed" data as a stretch. The AI has no independent behavioral history — it's categorizing what the candidate says about themselves. This is structured, conversational self-report, not observer-rated assessment. Reframe as inspiration, not validation. **Resolution needed:** Run 5+ tester sessions comparing Lens output quality to a simple GPT-4o interview (no coaching methodology). If there's no measurable difference in signal richness, the methodology claim is hollow.

2. **"Candidates will invest 20-40 minutes in self-discovery."** Jack & Jill does 20 minutes. Personality quizzes take 5-10 minutes. Is 40 minutes too much friction? Is there a minimum viable discovery time?

3. **"Companies will pay for role lenses."** At $2,500 per role, this is a premium product. What's the evidence that companies will pay for structured self-assessment when they can post a job description for free? **Senior HR validation signal (4/7/26, retired Goldman Sachs partner, 30+ years):** The time investment is only justified for $300K+/board-level hires. At that level, $2,500 is trivial relative to search fees ($50K-100K). Below that level, speed wins. The buyer may be the exec recruiter, not the company directly.

4. **"The bring-your-own-sources model is sufficient at launch."** If source setup is too burdensome, the daily briefing never activates. What percentage of users will successfully connect sources? What's the minimum number of sources for a useful briefing?

5. **"The lens format will gain adoption as a standard."** JSON Resume has existed for years and hasn't replaced the PDF resume. What makes the lens format more likely to achieve adoption?

6. **"Signal matching produces better hiring outcomes than keyword matching."** This is intuitively compelling but empirically unproven at scale. What would a controlled study look like? How long before you have enough data to prove (or disprove) this?

7. **"The three-sided marketplace will achieve equilibrium."** Candidates need coaches and companies. Coaches need candidates and platform revenue. Companies need candidate lenses. Each side's value depends on the other two. What's the minimum viable size for each side?

8. **"Coaches will license their methodology to an AI system."** This requires coaches to trust that their IP is protected and that the AI won't replace them. What's the evidence that coaches will make this leap? What happens when a coach persona produces a lens that the coach disagrees with?

9. **"The daily briefing is more valuable than existing job alerts."** The briefing is scored and enriched, but it depends on user-provided sources and best-effort enrichment. Under what conditions is the briefing actually better than a well-configured Indeed alert?

10. **"$750K is enough to prove the thesis in 12 months."** The plan requires hiring 4 people, building a sophisticated intake engine, onboarding 5 coaches, engaging 15 companies, and processing 3,000+ lens creations. Is this achievable? What gets cut if it's not?

---

## What I'm Asking For

I'm asking reviewers of this document to:

1. **Identify the weakest link in the chain.** Where is this most likely to fail?
2. **Challenge the competitive differentiation.** Is the gap I've identified real, or am I underestimating existing players?
3. **Stress-test the business model.** Do the revenue streams and unit economics hold up?
4. **Question the GTM sequence.** Is coach-as-channel the right first move, or should I lead differently?
5. **Flag blind spots.** What haven't I considered?

---

*v1.5 updated April 22, 2026. Incorporates LLM stress test synthesis (4 models, 2 prompt versions) producing 8 confirmed strategic pivots: Oh/Wang/Mount reframed as inspiration (not validation), role lens leads product (not candidate lens), value prop is "prevent expensive misalignment" (not "deeper identity matching"), product lives at client-recruiter boundary (not inside ATS), moat is process embedding + outcome data (not technology + portability), buyer pitch is "win searches, save time, show rigor" (not "better judgment"), pricing is per-search $2–5K (not per-seat SaaS), first customer is 10–20 person retained boutique (not "executive recruiters" broadly). Also incorporates competitive research (Predictive Index added as dominant retained-search incumbent in v1.5, alongside 16+ competitors already profiled), tester feedback, founding-coach strategic feedback (3/30/26), senior-HR-executive validation (4/7/26, retired Goldman Sachs partner), company formation (Zelman Labs LLC), NSF SBIR pathway, and honest gap analysis. Provisional patent filed App #64/015,187. v1.5 additionally scrubs named private-network individuals for distribution safety — generic role descriptions replace names where referenced. It is intended for critical review, not advocacy.*
