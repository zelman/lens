# Lens Project — Market Position Stress Test

**Purpose:** Feed this prompt to multiple AI models (GPT-4o, Gemini, Perplexity, etc.) to pressure-test the Lens Project's market thesis. The goal is honest pushback, not validation.

**Instructions for use:** Copy everything below the line into the other model. Do NOT cherry-pick — the full context is needed for a rigorous answer.

---

## PROMPT STARTS HERE

You are a skeptical venture analyst and former executive search partner. I'm going to describe a product thesis and its claimed market position. Your job is to **stress-test it ruthlessly** — find the holes, identify why this might fail, and most importantly, answer this question: **If this gap is real, why hasn't someone already filled it?**

Do not be polite. Do not hedge. If the thesis is weak, say so and explain why. If it's strong, explain what the founder is still underestimating.

### THE PRODUCT

**Lens** is an AI-powered professional identity discovery and career-opportunity matching platform. Here's what it does:

1. **Identity extraction through coached discovery.** Instead of parsing a resume, Lens runs a 25-45 minute AI-guided conversational intake (modeled on real executive coaching methodology from a certified coach). The conversation probes 8 dimensions: professional identity, skills & experience, values, mission & sector, work style, energy sources, disqualifiers, and situation/timeline. The output is a structured "lens document" — a YAML + markdown file that captures who someone actually is, not what their resume says.

2. **Signal-based scoring.** The lens document powers a weighted multi-dimensional scoring engine (Mission 25%, Role 20%, Culture 18%, Skill 17%, Work Style 12%, Energy 8%) that evaluates job opportunities against identity signals rather than keyword matches.

3. **Bidirectional matching (the core IP, patent pending).** Both sides get a lens: a candidate lens scores companies (C→R), and a role lens scores candidates (R→C). The role lens captures what a company actually needs — leadership style, team dynamics, growth stage requirements — not just a job description's keyword list. Match quality comes from scoring both documents against each other using asymmetric, weighted identity dimensions.

4. **Academic foundation.** Built on Oh, Wang & Mount (2011, Journal of Applied Psychology 96:4) — observer ratings of personality predict job performance better than self-reports. A resume is the ultimate self-report. A coached discovery conversation functions as an observer-informed extraction.

### THE MARKET LANDSCAPE (freshly researched, April 2026)

I evaluated 33+ executive search software tools from a comprehensive market analysis. Here's what I found:

**The entire market clusters into the left half of a 2x2 quadrant:**
- X-axis: Discovery depth (resume/self-report → coached identity signals)
- Y-axis: Matching sophistication (keyword/criteria → signal-based scoring)

**Category 1: Traditional ATS (bottom-left) — ~20 tools**
Greenhouse, Workday, iCIMS, Zoho Recruit, Jobvite, Workable, Recruitee, Vincere, TrackerRMS, Crelate, CEIPAL, PCRecruiter, iSmartRecruit, Recruit CRM, TalentLyft, Longlist, Firefish, SmartRecruiters, Deel, Jobvite.
→ Keyword matching against resumes. Operational workflow tools.

**Category 2: AI-enhanced search (top-left) — 6 tools**
Recruiterflow (AIRA Matchmaker), hireEZ, SeekOut, Loxo, Manatal, Atlas.
→ AI-powered matching and scoring, but still operating on resume data and CRM history. Natural language criteria, explainable scores. Recruiterflow's AIRA Matchmaker is the most advanced — plain English criteria, ranked shortlists with reasoning — but it only matches against what's already in the database (resumes, notes, emails, call transcripts).

**Category 3: Retained search specialists (mid-left) — 5 tools**
Clockwork ($149/user/mo), Invenias by Bullhorn ($99/user/mo), Talentis ($119/user/mo), Thrive TRM, Cluen.
→ Purpose-built for retained/executive search. Strong on relationship tracking, client portals, off-limits rules, decades of history. But still matching against the same resume-and-notes substrate.

**Category 4: Assessments (bottom-right) — 3+ categories**
DISC, StrengthsFinder, 360 feedback tools.
→ Deeper understanding of the person, but static snapshots with no matching engine, no portability, no connection to opportunity evaluation.

**Category 5: Direct competitors (near center)**
Jack & Jill ($20M seed) — structured preference-based matching but no coaching depth, no portable document, no bidirectional scoring.
SquarePeg — attempted bidirectional psychometric matching, pivoted to AI resume screening (cautionary prior art).

**Category 6: Lens (top-right) — alone**
Coached identity extraction feeding signal-based bidirectional scoring. Nobody else occupies this quadrant.

### THE CLAIMED THESIS

"Every tool in the executive search market optimizes the search. None improves the input."

All 33+ tools make recruiters faster at working with resume data. Nobody is making the resume data itself more accurate, more predictive, or more identity-rich. Lens sits upstream of every tool in the market — it produces the input that makes existing ATS/CRM matching dramatically more accurate.

**Target buyer:** Executive recruiters placing $300K+/board-level candidates, where mis-hire cost is catastrophic (estimated 3-5x annual salary). At this level, the resume is the weak link in the chain, and no existing tool strengthens it.

**Validation signal:** A retired Goldman Sachs partner (30 years, COO of Human Capital Management, built the Goldman Returnship program) independently reached the same conclusion: the time investment of deep discovery is only justified at $300K+ placements, and executive recruiters — not HR, not coaches — are the likely buyer.

### YOUR ASSIGNMENT

Answer these questions with maximum honesty:

1. **Is the gap real?** Is there genuinely no product doing coached identity extraction for matching purposes in executive search? Or am I missing something?

2. **Why hasn't someone filled this gap?** This is the most important question. If identity-signal matching is genuinely better than resume matching, and the academic research supports it, and the market is worth billions — why hasn't a well-funded company built this? Consider:
   - Is the problem technically harder than it sounds?
   - Is the sales cycle to exec recruiters prohibitively long?
   - Is the coaching-depth intake too friction-heavy for adoption?
   - Do exec recruiters believe they already do this (via interviews and "gut feel")?
   - Is the data too subjective to score reliably?
   - Are there regulatory or liability barriers?
   - Did SquarePeg's pivot reveal something fundamental about market demand?

3. **What's the weakest link in the thesis?** Where is this most likely to fail — product, market, distribution, or business model?

4. **Who would build this if not a startup?** Could LinkedIn, Indeed, Greenhouse, or one of the retained search platforms (Invenias, Clockwork) add this as a feature? What would stop them?

5. **What would change your mind?** What evidence would you need to see to move from "interesting but speculative" to "this is a real business"?

6. **Rate the overall thesis from 1-10** on defensibility, market timing, and likelihood of building a $50M+ business. Explain your rating.

Be specific. Cite your reasoning. Don't tell me what I want to hear.

## PROMPT ENDS HERE
