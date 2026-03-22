# The Lens Project: Strategic Brief & Competitive Analysis

*March 2026 | Comprehensive research summary for external review and critique*

---

## Purpose of This Document

This document captures the complete research, competitive analysis, product vision, go-to-market strategy, and identified gaps for the Lens Project — a proposed bidirectional identity marketplace for hiring. It is intended to be reviewed critically by outside parties (human or AI) to stress-test the thesis, identify blind spots, and challenge assumptions.

The core question this document tries to answer: **Is there a defensible, fundable business in building structured professional identity documents (lenses) that replace keyword-matched resumes with signal-matched profiles, on both sides of every hire?**

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

This is what we call "the Severance state" — a term borrowed from the coaching work that originated this project. The professional self and the actual self are separated by a wall. The hiring process enforces and rewards that separation.

---

## 2. What the Lens Project Is

### One-Sentence Definition

A bidirectional identity marketplace for hiring where candidates and companies each create structured identity documents — lenses — through AI-coached discovery, and a matching engine scores compatibility, flags tensions, and produces briefings instead of job alerts.

### The Core Thesis

**Signal matching over keyword matching.** A lens document captures behavioral signals — values as demonstrated through action, energy sources, communication patterns, cultural needs, disqualifiers — not just skills and experience. When both sides produce these documents, matching can operate on who people actually are, not who they claim to be.

### The Tagline

**"The indelible you. Not the ATS-optimized, job-specific you."**

The word "indelible" is deliberate: it means permanent, can't be erased or washed away. The ATS-optimized resume is disposable — you throw it away after each application. The lens captures the version that persists. The lens is built once, evolves over time (append, don't overwrite), and serves as the foundation for all opportunity scoring.

### Three-Sided Platform

The Lens Project is a three-sided platform connecting candidates, coaches, and companies:

- **Candidates** create lens documents through AI-coached discovery. They own the file. Every opportunity they encounter gets scored against it.
- **Coaches** contribute their methodologies to power custom AI coaching personas. They earn revenue from every lens their persona produces. Different coaching styles serve different candidate profiles.
- **Companies** create role lenses — structured documents about who actually thrives in a specific role — through coach-facilitated discovery. They match against candidate lenses.

The coach layer is the quality gate that distinguishes this from every other assessment or matching tool. Without coach-facilitated discovery, the product is just another personality quiz.

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
The "bring us your firehose" step. Four intake channels:
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

#### Torre
- **What they are:** AI-powered talent marketplace matching candidates to roles based on skills and preferences.
- **What they don't do:** Still resume-forward. No identity-level profiling. No company-side discovery.

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
- **What they do closer to us:** The I/O psychologist engagement is the closest thing to "interrogating the company" in the market. But it's a human consulting service, not an AI-driven discovery flow. Not scalable.
- **What they don't do:** Human-dependent company profiling. No portable candidate document. No coaching personas. High-volume focus (retail, hospitality, BPOs) rather than leadership/knowledge worker roles.

#### ThriveMap
- **What they are:** Realistic "day-in-the-life" pre-hire assessments. Custom-built for each employer to simulate actual role conditions. Measures cultural fit, commitment, and capabilities against an employer-defined ideal.
- **What they do well:** The thesis that hires fail due to expectation gaps (not skill gaps) aligns with ours. Company-customized assessments go deeper than generic tests.
- **What they don't do:** Assessments are employer-controlled, not candidate-owned. No portable output. No coaching layer. Focused on entry-level/high-volume roles.

#### Crosschq
- **What they are:** Hiring Intelligence Platform. 360 digital reference checking + quality of hire prediction. Links pre-hire data to post-hire outcomes.
- **What they do well:** Multi-dimensional data (references, self-assessments, performance data). Closed-loop between hiring signals and outcomes.
- **What they don't do:** Post-application tool. No pre-match identity discovery. No company-side assessment. No coaching.

### Tier 4: AI Sourcing & Talent Intelligence

#### Eightfold AI
- **What they are:** Enterprise talent intelligence platform using deep learning to match on skills and capabilities (not job titles). Internal mobility marketplace.
- **What they do well:** "Skills not titles" thesis overlaps with our "signals not keywords" thesis. Identifies hidden talent based on capability patterns.
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
- **What they do closer to us:** Focus on "team-fit + role-fit" rather than generic culture fit. Reduces vague feedback to profile-aligned evaluation.
- **What they don't do:** Company uses it internally. Candidates don't have access. No portable output. No coaching.

#### Carv
- **What they are:** Meeting intelligence platform that joins recruiter interviews, generates candidate write-ups, populates ATS fields. Can create ideal candidate profiles from intake calls.
- **What they do closer to us:** Acknowledges that job profiles often don't align with what the hiring manager actually envisions. Uses intake conversations to bridge the gap.
- **What they don't do:** Recruiter tool, not candidate tool. No portable output. No coaching personas.

#### TechWolf
- **What they are:** AI-driven skills intelligence from workforce data. Supports role profiling based on actual skills reality rather than outdated JDs.
- **What they don't do:** Internal workforce tool. No candidate-facing product. No coaching.

### Competitive Matrix Summary

| Capability | Jack & Jill | Ashby | Pymetrics/Bryq | Harver | Eightfold | The Lens |
|---|---|---|---|---|---|---|
| Deep candidate profiling | Shallow (20 min) | No | Yes (tests) | Yes (tests) | Yes (skills) | **Yes (coach-driven)** |
| Deep company profiling | No | No | No | Partial (human) | No | **Yes (coach-driven)** |
| Portable candidate document | No | No | No | No | No | **Yes (.md file)** |
| Coach-driven quality | No | No | No | Partial (I/O psych) | No | **Yes (persona network)** |
| Tension/risk mapping | No | No | No | No | No | **Yes** |
| Candidate owns data | No | No | No | No | No | **Yes** |
| Bidirectional matching | Partial | No | No | No | No | **Yes** |
| Multi-source intake | No | N/A | No | No | N/A | **Yes (user-provided)** |
| Behavioral evidence (not self-report) | No | No | Partial (games) | Partial (simulations) | Partial (skills) | **Yes (artifacts + coaching)** |

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

This is analogous to the difference between a self-taken headshot and a professional portrait. Both produce images. One is consistently higher quality because of the scaffolding the professional provides.

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

### The Four Moats

1. **Coach Network Lock-In:** Each coach's methodology is the training data for their AI persona. They can't port it to a competitor without rebuilding from scratch. The more coaches embedded, the harder to replicate.

2. **Lens Data Asset:** Every lens accumulates signal over time. Switching cost is years of identity data. User behavior feedback continuously improves scoring accuracy.

3. **Quality Differentiation:** Self-serve tools produce shallow profiles. Coach-facilitated lenses produce behavioral evidence. The quality gap is visible and measurable. Competitors can't close it without building their own coach network.

4. **Bidirectional Network Effect:** More candidate lenses make the platform more valuable to companies. More company role lenses make it more valuable to candidates. More coaches make both sides better.

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

### Phase 1: Ship the Free Tool (Weeks 1-4)
Host the AI lens creation tool as a free, public web application. Full 8-section discovery flow. No paywall. The goal is format adoption, proof of concept, and learning.

### Phase 2: Distribution & Learning (Weeks 4-12)
Content marketing around "the indelible you" thesis. LinkedIn launch post (personal story). Todd's C-level network activation. James's coaching network seeding. Weekly follow-up posts with anonymized insights from real lenses.

### Phase 3: Coach Recruitment (Weeks 8-16)
3-5 founding coaches. Methodology capture → persona encoding → testing → refinement → launch. Revenue share model. Starting with James Pratt (deep/introspective) and Todd Gerspach (executive/strategic).

### Phase 4: Company Side (Months 4-8)
With candidate lenses in circulation and coach quality demonstrated, approach companies through Todd's network. Pitch: pre-profiled candidates whose compatibility is already scored. Offer free role lens creation for design partners.

### Phase 5: Network Effect (Months 8-12)
More coaches → better discovery → higher quality lenses → more valuable to companies → more companies → more attractive to coaches. The flywheel.

### Why Coach-as-Channel Solves Cold Start

Coaches bring both sides simultaneously. Their clients are the candidates. Their corporate relationships are the companies. You don't need both sides of the marketplace on day one — you need coaches whose clients span both sides.

---

## 12. Technical Architecture & Scaling Concerns

### Launch Architecture
- **Frontend:** React (evolved from existing 800-line lens-form.jsx), Vercel hosted
- **AI:** Claude API (Sonnet for discovery, Haiku for scoring/enrichment)
- **Workflow orchestration:** n8n (self-hosted Community Edition for unlimited executions)
- **Source intake:** RSS polling, career page monitoring, email parsing (Mailgun/Postmark), paste-and-score API
- **Enrichment:** Brave Search API, Crunchbase API, Glassdoor sentiment extraction
- **Scoring:** Claude API call with lens YAML + enriched opportunity as context
- **Storage:** Airtable (migrating to Postgres at scale)
- **Briefing delivery:** Email (primary) + web dashboard

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

### Revenue Streams

| Stream | Price | Function |
|---|---|---|
| Free AI Lens | $0 | Full 8-section discovery. Distribution + data flywheel. |
| Coach Lens (premium) | $49-149 | Coach persona + artifacts. Higher quality. Rev share to coach. |
| Coach Platform | $500/month | Per active AI persona. Methodology encoding + analytics. |
| Company Role Lens | $2,500 | Company-side discovery. Structured role document + matching access. |
| Placement revenue (future) | 5-10% of salary | When marketplace matches produce hires. |

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
- 5-person team: Eric (product), Nathan (business), full-stack engineer, ML/AI engineer, fractional designer
- Sophisticated multi-channel intake engine
- Multiple coach personas
- Company-side role lens
- Matching engine
- Infrastructure to scale

### $750K Pre-Seed Raise Details

- **Equity offered:** 15-20%
- **Pre-money valuation:** $3M-4.25M
- **Team allocation:** ~70% ($525K)
  - Eric: $150K (product lead)
  - Nathan: $120K (business, starts month 3)
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

- **Todd Gerspach (Advisor/BD):** 2-3% equity with milestone-based vesting tied to companies engaged, role lenses created, investor intros. No salary.
- **James Pratt (Founding Coach):** 1-2% founding equity + 15-25% revenue share on every lens his persona produces. IP license, not assignment — methodology remains his.
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

---

## 16. Assumptions to Challenge

When reviewing this document, please specifically challenge these assumptions:

1. **"Coach-facilitated discovery produces meaningfully better lens documents than AI-only."** This is the foundational assumption. If it's wrong, the entire coach-as-channel strategy collapses. What evidence exists that human-guided self-assessment produces better outcomes than AI-guided self-assessment?

2. **"Candidates will invest 20-40 minutes in self-discovery."** Jack & Jill does 20 minutes. Personality quizzes take 5-10 minutes. Is 40 minutes too much friction? Is there a minimum viable discovery time?

3. **"Companies will pay for role lenses."** At $2,500 per role, this is a premium product. What's the evidence that companies will pay for structured self-assessment when they can post a job description for free?

4. **"The bring-your-own-sources model is sufficient at launch."** If source setup is too burdensome, the daily briefing never activates. What percentage of users will successfully connect sources? What's the minimum number of sources for a useful briefing?

5. **"The lens format will gain adoption as a standard."** JSON Resume has existed for years and hasn't replaced the PDF resume. What makes the lens format more likely to achieve adoption?

6. **"Signal matching produces better hiring outcomes than keyword matching."** This is intuitively compelling but empirically unproven at scale. What would a controlled study look like? How long before you have enough data to prove (or disprove) this?

7. **"The three-sided marketplace will achieve equilibrium."** Candidates need coaches and companies. Coaches need candidates and platform revenue. Companies need candidate lenses. Each side's value depends on the other two. What's the minimum viable size for each side?

8. **"Coaches will license their methodology to an AI system."** This requires coaches to trust that their IP is protected and that the AI won't replace them. What's the evidence that coaches will make this leap? What happens when a coach persona produces a lens that the coach disagrees with?

9. **"The daily briefing is more valuable than existing job alerts."** The briefing is scored and enriched, but it depends on user-provided sources and best-effort enrichment. Under what conditions is the briefing actually better than a well-configured Indeed alert?

10. **"$750K is enough to prove the thesis in 12 months."** The plan requires hiring 4 people, building a sophisticated intake engine, onboarding 5 coaches, engaging 15 companies, and processing 3,000+ lens creations. Is this achievable? What gets cut if it's not?

---

## What We're Asking For

We're asking reviewers of this document to:

1. **Identify the weakest link in the chain.** Where is this most likely to fail?
2. **Challenge the competitive differentiation.** Is the gap we've identified real, or are we underestimating existing players?
3. **Stress-test the business model.** Do the revenue streams and unit economics hold up?
4. **Question the GTM sequence.** Is coach-as-channel the right first move, or should we lead differently?
5. **Flag blind spots.** What haven't we considered?

---

*This document was produced in March 2026 as part of strategic planning for the Lens Project. It incorporates primary competitive research, product design work, financial modeling, and honest gap analysis. It is intended for critical review, not advocacy.*
