# Lens Project — Market Position Stress Test v2

**Purpose:** Feed this prompt to multiple AI models (GPT-4o, Gemini, Perplexity, etc.) to pressure-test the Lens Project's market thesis. The goal is honest pushback, not validation.

**v2 changes:** Incorporates feedback from Perplexity v1 run. Corrects overclaims about uniqueness. Explicitly distinguishes coached discovery from psychometric assessment. Addresses the "why hasn't someone done this" question head-on with known prior art.

**Instructions for use:** Copy everything below the line into the other model. Do NOT cherry-pick — the full context is needed for a rigorous answer.

---

## PROMPT STARTS HERE

You are a skeptical venture analyst and former executive search partner. I'm going to describe a product thesis and its claimed market position. Your job is to **stress-test it ruthlessly** — find the holes, identify why this might fail, and most importantly, tell me what I'm still getting wrong.

I've already run this thesis through one AI stress test. The feedback was valuable — it identified real competitors I'd missed and called out overclaims. I've revised the thesis accordingly. Now I need you to find what's STILL wrong.

Do not be polite. Do not hedge. If the thesis is weak, say so and explain why. If it's strong, explain what the founder is still underestimating.

### THE PRODUCT

**Lens** is an AI-powered professional identity discovery and career-opportunity matching platform. Here's what it does:

1. **Identity extraction through coached discovery (not surveys).** Instead of parsing a resume OR administering a standardized psychometric assessment, Lens runs a 25-45 minute AI-guided conversational intake modeled on real executive coaching methodology from a certified coach. The conversation probes 8 dimensions: professional identity, skills & experience, values, mission & sector, work style, energy sources, disqualifiers, and situation/timeline. The AI probes, challenges, and draws out signals the person wouldn't put on a survey or a resume. The output is a structured "lens document" — a YAML + markdown file that captures who someone actually is.

2. **Signal-based scoring.** The lens document powers a weighted multi-dimensional scoring engine (Mission 25%, Role 20%, Culture 18%, Skill 17%, Work Style 12%, Energy 8%) that evaluates job opportunities against identity signals rather than keyword matches.

3. **Bidirectional matching (the core IP, patent pending).** Both sides get a lens: a candidate lens scores companies (C→R), and a role lens scores candidates (R→C). The role lens captures what a company actually needs — leadership style, team dynamics, growth stage requirements — not just a job description's keyword list.

4. **Portable, user-owned output.** The candidate owns their lens document. It's a machine-readable file they can carry across opportunities, firms, and platforms — unlike every ATS, CRM, and assessment tool where the data is locked inside the employer's or recruiter's system.

5. **Academic foundation.** Built on Oh, Wang & Mount (2011, Journal of Applied Psychology 96:4) — observer ratings of personality predict job performance better than self-reports. A resume is a self-report. A standardized psychometric assessment (DISC, Plum, StrengthsFinder) is a structured self-report. A coached discovery conversation is designed to function as an observer-informed extraction — the AI acts as the observer, drawing out signals the person can't or won't articulate in a survey.

### WHAT I'M NOT CLAIMING

Previous stress testing revealed overclaims. Here's what I've corrected:

- **I am NOT claiming identity-based matching is a new concept.** Multiple platforms already match on behavioral/psychometric signals: Plum (standardized behavioral assessment + role matching, $750/mo, focused on high-volume hiring), Torre.ai ($10M seed, "professional genomes" with 112 matching factors and 40+ behavioral traits), SquarePeg (bidirectional psychometric matching on values/working style/culture — pivoted to AI resume screening), Jack & Jill ($20M seed, 20-minute AI preference interviews on both sides).

- **I AM claiming the input method is different and that the difference matters.** Every existing platform uses standardized self-report instruments (forced-choice questions, personality inventories, preference surveys). The academic research (Oh/Wang/Mount 2011) shows observer ratings are more predictive of job performance than self-reports. Lens's coached conversation is designed to be the first productization of observer-informed extraction, not the first identity-based matching system.

- **I am NOT claiming Lens is alone in the entire market.** I AM claiming it's alone at the intersection of: (a) coached discovery as input method, (b) bidirectional matching architecture, (c) portable user-owned output, and (d) $300K+/board-level exec search focus.

### THE MARKET LANDSCAPE (freshly researched, April 2026)

**33+ executive search software tools evaluated** from a Recruiterflow market analysis, plus broader competitive research:

**ATS/Workflow tools (bottom-left of the market):** Greenhouse, Workday, iCIMS, Zoho Recruit, Jobvite, Workable, Recruitee, Vincere, Crelate, CEIPAL, PCRecruiter, SmartRecruiters, etc. (~20 tools)
→ Keyword matching against resumes. Operational workflow tools. No identity layer.

**AI-enhanced search (top-left):** Recruiterflow (AIRA Matchmaker), hireEZ, SeekOut, Loxo, Manatal, Atlas. (~6 tools)
→ AI matching, but still against resume data and CRM history. Natural language criteria, explainable scores.

**Retained search specialists (mid-left):** Clockwork ($149/user/mo), Invenias by Bullhorn ($99/user/mo), Talentis ($119/user/mo), Thrive TRM, Cluen. (~5 tools)
→ Purpose-built for exec search. Strong on relationships and confidentiality. Still matching against resume-and-notes substrate.

**Psychometric assessment + matching platforms (adjacent):** Plum (behavioral assessment + role matching, high-volume/early-career), Torre.ai (112-factor "professional genome" matching, Latin American market), DISC/StrengthsFinder/360 tools (static snapshots, no matching engine).
→ The closest category to Lens conceptually. But all use standardized self-report instruments, not coached discovery. None focus on retained exec search.

**Direct competitors (nearest):** Jack & Jill ($20M seed, 20-min AI preference interview, bidirectional matching — but shallow relative to 45-min coaching), SquarePeg (bidirectional psychometric matching — pivoted to resume screening, cautionary prior art).

**Target buyer:** Executive recruiters placing $300K+/board-level candidates, where mis-hire cost is catastrophic (estimated 3-5x annual salary).

**Validation signal:** A retired Goldman Sachs partner (30 years, COO of Human Capital Management, built the Goldman Returnship program) independently concluded: the time investment of deep discovery is only justified at $300K+ placements, and executive recruiters — not HR, not coaches — are the likely buyer.

### KNOWN OBJECTIONS (from v1 stress test)

The previous stress test identified these barriers. I'm listing them so you don't repeat what I've already heard — build on these or challenge whether my counters are sufficient:

1. **"Recruiters think they ARE the product."** Their value prop is judgment, not tools. Any system that structuralizes discovery may feel like a threat.
   - *My counter:* "Lens doesn't replace your judgment — it gives you structured substrate for the judgment you're already making. Right now your discovery lives in handwritten notes and memory. Lens makes it searchable, scorable, and shareable with clients."

2. **"Candidate friction at the $300K+ level."** Time-poor, choice-rich candidates won't sit through another system.
   - *My counter:* The 45-minute intake replaces the recruiter's existing discovery calls, not adds to them. If positioned as "this replaces 2-3 of your preliminary interviews," it saves time.

3. **"SquarePeg pivoted away from this."** They had bidirectional psychometric matching and ended up doing resume screening.
   - *My counter:* SquarePeg used standardized self-report instruments, tried to serve the broad market, and couldn't get both sides to complete heavy assessments. Lens uses coached discovery (more predictive per research), focuses on $300K+ only (justified ROI), and produces a portable document (candidate motivation to participate).

4. **"Defensibility is low — 3/10."** Incumbents could build this quickly once category is validated.
   - *My counter:* The coaching methodology encoding (James Pratt's system) + patent pending + narrow buyer trust are the moat. Speed to category definition matters more than technology barriers.

5. **"Data is squishy and hard to sell as objective."** AI-generated identity profiles are politically riskier than resumes + references.
   - *My counter:* The lens document accompanies traditional materials, doesn't replace them. It adds signal, not risk. Equivalent to a recruiter's own written assessment but structured and scorable.

### YOUR ASSIGNMENT

Given that I've already addressed the obvious objections, push deeper:

1. **Is the "coached discovery vs. self-report" distinction real or academic?** Does Oh/Wang/Mount (2011) actually apply here? An AI chatbot is not a human observer. Is calling a 45-minute AI conversation "observer-informed" intellectually honest, or am I stretching the research beyond its scope?

2. **Is the portable document a moat or a feature?** Could Torre.ai or Plum add a "download your profile" button tomorrow and eliminate this differentiator?

3. **Who is the actual first customer?** Not "executive recruiters" broadly — which specific firm profile, at which specific moment in their workflow, writes the first check? Describe the persona, the pain point, and the trigger event.

4. **What does SquarePeg's pivot REALLY tell us?** Was it (a) the bidirectional concept that failed, (b) the psychometric input method, (c) the market segment, or (d) the go-to-market? Which of these does Lens actually solve vs. just claim to solve differently?

5. **Is this a product or a feature?** Could Clockwork, Invenias, or Talentis add a "conversational intake" tab using GPT-4o in a product sprint and neutralize Lens's positioning?

6. **The Goldman validation — how much weight should I give it?** One retired executive's opinion about where the market should go vs. revealed preference of thousands of working recruiters who keep buying ATS/CRM tools. Which matters more?

7. **Give me the steel-man case for why this DOES work.** After tearing it apart — if you were advising this founder, what's the one path to $10M ARR that you'd bet on? Be specific about buyer, pricing, channel, and timeline.

8. **Rate the revised thesis from 1-10** on defensibility, market timing, and likelihood of building a $50M+ business. Has the positioning correction moved the needle from v1?

Be specific. Cite your reasoning. Don't tell me what I want to hear.

## PROMPT ENDS HERE
