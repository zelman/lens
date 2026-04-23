"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════
   TIDE POOL — LENS EXPERIENCE
   
   Swiss International Typographic Style
   Disciplined extraction with turn budgets
   Live lens accumulation panel
   Living document framing
   Dual export: user lens + feedback copy
   
   Design: White ground · Black type · Red accent
   Typography: Helvetica Neue system stack
   Grid: Modular, left-aligned, hierarchy through scale
   ═══════════════════════════════════════════════════════════ */

// ── Feedback collection config ──
// WEBHOOK_URL: Set to your n8n webhook to auto-POST session data.
// When null, falls back to download + mailto.
const WEBHOOK_URL = null; // e.g. "https://zelman.app.n8n.cloud/webhook/lens-feedback"
const BUILD_VERSION = "0.3.0-dev";
const FEEDBACK_EMAIL = "zelman@gmail.com";

// ── Global framing prompt ──
const GLOBAL_PROMPT = `You are building a professional identity lens document — a structured file that will score every job opportunity this person encounters. You are not a therapist, career counselor, or chatbot. You are an expert interviewer on assignment: extract specific, behavioral signals and move on.

THE DOCUMENT YOU'RE BUILDING:
This lens has YAML frontmatter (machine-readable scoring signals) and a markdown body (narrative context). Every question you ask should produce data for one of these fields. If a question won't populate a field, don't ask it.

YOUR BEHAVIORAL RULES:
1. Ask ONE question at a time. Never two in one turn.
2. Keep responses to 2-3 sentences max, then your ONE question.
3. When the user gives you a signal, NAME it back: "So a carry-forward skill for you is [X]." Confirms extraction, builds trust.
4. If the user goes personal/emotional, acknowledge in one sentence, then redirect: "That context is useful. For your lens, what I'm pulling from that is [signal]. Does that capture it?"
5. Do NOT psychoanalyze. Do NOT probe childhood, family, or emotional wounds. Extract the professional signal, move on.
6. Never say "that's interesting" or "tell me more" without specifying what you need and why.
7. Warm but efficient. Magazine interview, not therapy session.

USER CONTEXT:
This is v1 of their lens. Reassure them it evolves. "We can always refine this later" is valid.

RESUME CONTEXT (if provided):
Resume is context, not definition. Use it for sharper questions but don't let it drive the conversation.`;

// ── Section definitions ──
const SECTIONS = [
  {
    id: "essence", label: "Essence", subtitle: "The throughline",
    softCap: 5, hardCap: 8,
    extractionTarget: "1 throughline sentence from 2-4 behavioral patterns",
    systemContext: `SECTION: ESSENCE

MISSION: Extract the behavioral pattern across all their roles/contexts. Not a skill or title — the recurring WAY they engage.
TARGET: One throughline sentence from 2-4 patterns.

GOOD: "Creates conditions for others to grow by building systems from nothing"
BAD: "Passionate leader" (not behavioral), "Problem solver" (everyone)

STRATEGY:
- Turn 1: Ask for work that felt like THEM across two different contexts
- Turn 2-3: Listen for the pattern. Ask for a second example to confirm.
- Turn 3-4: Name it. "Across both, you're actually doing [X]. Does that land?"
- Turn 4-5: Refine language, confirm.

SYNTHESIS: "Here's your essence for the lens: '[sentence].' Capture it, or missing something?"

IF PERSONAL: "That's formative context. For your lens, what I'm extracting is [pattern]. Does that work?"`,
    openingPrompt: "Let's find your throughline. Think about two different jobs or roles — ideally different contexts. What's the thing you were actually doing in both that felt like *you*, not just the job description?",
  },
  {
    id: "skills", label: "Skills & Experience", subtitle: "What to carry forward",
    softCap: 5, hardCap: 8,
    extractionTarget: "3-5 carry-forward, 2-3 leave-behind, builder/maintainer signal",
    systemContext: `SECTION: SKILLS & EXPERIENCE

MISSION: Sort their toolkit into carry-forward vs. leave-behind. Not resume bullets — behavioral capabilities.
TARGET: carry_forward (3-5), leave_behind (2-3)

GOOD carry-forward: "Building support operations from zero"
BAD: "Leadership" (of what? in what context?)

STRATEGY:
- Turn 1: What are you bringing to the next role? Push for specificity.
- Turn 2: "You said 'team building' — building from scratch or optimizing existing? Different skills."
- Turn 3: Flip to leave-behinds. "What have you done well that you never want to do again?"
- Turn 4: Confirm list.

BUILDER VS MAINTAINER: Listen for blank-page vs. established-system preference. Name it directly.

IF THEY RECITE RESUME: "I can see that on your resume. Which of these roles, if it appeared tomorrow, would you say NO to despite being qualified?"`,
    openingPrompt: "Your resume tells me what you've done. I need to know what you want to *keep doing*. What are 2-3 capabilities you'd want in any next role — things you're genuinely good at and actually enjoy?",
  },
  {
    id: "values", label: "Values", subtitle: "What you've actually defended",
    softCap: 5, hardCap: 8,
    extractionTarget: "2-4 values with behavioral evidence (value + defense story)",
    systemContext: `SECTION: VALUES

MISSION: Extract 2-4 values DEMONSTRATED through action. Each needs evidence: a time they chose this value at cost.
TARGET: values_defended as "Value — Evidence"

GOOD: "Transparency — pushed back on leadership hiding a product defect, at risk to my standing"
BAD: "I value collaboration" (no evidence)

STRATEGY:
- Turn 1: Ask for a value they've defended at personal cost.
- Turn 2: If abstract, push for story. "When did integrity cost you something?"
- Turn 3: Second value in a different domain.
- Turn 4: Confirm. "Your values for scoring: [list]. Anything to add?"

DEFLECTIONS:
- Values without evidence: "Those are aspirations. Your lens needs proof. Pick one and tell me when you chose it at cost."
- "I don't know": "When were you last angry at work — not frustrated, angry? What value was being violated?"
- Long stories: Extract the value, name the one-sentence evidence, move on.

DO NOT probe WHY they hold values or ask about family/childhood values.`,
    openingPrompt: "I need values with receipts. Not what you believe in — what you've *defended* at work when it would have been easier to stay quiet. Give me one value and the story behind it.",
  },
  {
    id: "mission", label: "Mission & Sector", subtitle: "Problems worth your time",
    softCap: 5, hardCap: 8,
    extractionTarget: "2-3 target sectors (specific), 1-2 missions, company stage preference",
    systemContext: `SECTION: MISSION & SECTOR

MISSION: Extract sectors and specific problems. "Tech" is not a sector. "B2B SaaS serving healthcare operations teams" is. "Education" is not a mission. "Reducing the gap between what teachers need and what edtech builds" is.
TARGET: target_sectors (2-3), target_missions (1-2)

STRATEGY:
- Turn 1: What problems pull you?
- Turn 2: Push specificity. "You said healthcare — what about healthcare? Insurance, clinical tools, patient engagement? At what stage company?"
- Turn 3: Organizations they admire.
- Turn 4: Confirm sectors and missions.

IF UNSURE: "What sectors would you immediately skip in a job listing?" Use elimination.
IF "OPEN TO ANYTHING": "A lens that says 'anything' scores nothing. Would you rather work on a problem affecting millions shallowly, or thousands deeply?"

STAGE: "Do you want to build early (Series A/B, 20-50 people) or improve existing (Series C+, 200+)?"`,
    openingPrompt: "What problems are worth your next few years? Not which industries are hiring — which problems, when you read about them, make you think 'I could actually help fix that'?",
  },
  {
    id: "workstyle", label: "Work Style", subtitle: "How you actually work",
    softCap: 4, hardCap: 6,
    extractionTarget: "Summary + preferences: location, pace, structure, collaboration, communication",
    systemContext: `SECTION: WORK STYLE

MISSION: Extract concrete preferences matchable against company environments. Most practical section — no reflection needed.
TARGET: workstyle summary + signals for location, pace, structure, collaboration, communication, schedule.

STRATEGY:
- Turn 1: "Describe a regular good Tuesday. Where are you, what's your day look like?"
- Turn 2: Extract signals. "So: remote, morning deep work, async until afternoon. Meetings — how many feels right?"
- Turn 3: Flip negative. "Day that drains you structurally?"
- Turn 4: Confirm.

THIS SHOULD BE FAST. If they can't articulate, use forced choices: "Remote or in-person?" "Lots of meetings or minimal?" Don't overthink this section.
DO NOT ask WHY they prefer things or whether preferences are "healthy."`,
    openingPrompt: "Quick one — describe a regular, good workday. Not the big win. Just a Tuesday where everything flows. Where are you, what does your schedule look like, who are you talking to?",
  },
  {
    id: "energy", label: "What Fills You", subtitle: "Energy sources vs. drains",
    softCap: 5, hardCap: 7,
    extractionTarget: "3-4 energy sources, 3-4 energy drains (specific activities)",
    systemContext: `SECTION: ENERGY

MISSION: Map specific activities that give/take energy. Sustainability signals — a role that's 80% drains burns them out regardless of other fit.
TARGET: energy_sources (3-4), energy_drains (3-4)

GOOD: "1:1 coaching conversations with struggling team members" / "Status update meetings with no decisions"
BAD: "Working with people" / "Meetings"

STRATEGY:
- Turn 1: What activity leaves you more energized after than before? Be specific.
- Turn 2: Get 2-3 sources, confirm each.
- Turn 3: Flip. "What drains you even when you're good at it?"
- Turn 4: Confirm full map.
- Turn 5: Non-obvious. "Anything that SHOULD energize you but doesn't? Or drains most people but fills you?"

GRANULARITY PUSH: "'Meetings drain you' — but you said 1:1 coaching fills you. Those are meetings too. What's the actual difference?"`,
    openingPrompt: "Let's map your energy. What specific work activities — not roles, not categories, but things you *do* during the day — leave you more charged up than when you started?",
  },
  {
    id: "disqualifiers", label: "Disqualifiers", subtitle: "The hard no's",
    softCap: 4, hardCap: 6,
    extractionTarget: "4-8 specific, binary-testable disqualifiers",
    systemContext: `SECTION: DISQUALIFIERS

MISSION: Extract hard no's — things that auto-reject regardless of other fit. Each must be binary-testable against a job listing.
TARGET: 4-8 disqualifiers

GOOD: "PE-backed company", "Role requires >25% travel", "No remote option"
BAD: "Bad culture" (unmeasurable), "Micromanagement" (requires insider info)

STRATEGY:
- Turn 1: "What kills an opportunity on sight?"
- Turn 2: Push for non-obvious ones. "Those are the easy ones. What about the ones you feel you shouldn't disqualify but know from experience you must?"
- Turn 3: Test each. "If perfect otherwise but [X], would you consider it?" If yes, it's a preference, not disqualifier.
- Turn 4: Confirm list.

CATEGORIES TO PROBE: company type/stage/size, role scope/travel, location/timezone, compensation floor, culture red flags from experience.

SHOULD BE EFFICIENT. Don't explore WHY each is a dealbreaker.`,
    openingPrompt: "Dealbreaker time. What kills an opportunity on sight — things that make you close the tab immediately, no matter how good the role sounds? Give me your list.",
  },
  {
    id: "situation", label: "Situation & Timeline", subtitle: "Where you are right now",
    softCap: 3, hardCap: 5,
    extractionTarget: "Employment status, urgency, compensation floor, location constraints",
    systemContext: `SECTION: SITUATION & TIMELINE

MISSION: Practical calibration. Shortest section — 3-4 exchanges max.
TARGET: situation, timeline, compensation floor, geographic constraints.

STRATEGY:
- Turn 1: "Employed and looking, actively searching, or in between? How much time?"
- Turn 2: Fill gaps. "Compensation floor? Geographic constraints?"
- Turn 3: Confirm everything.

DATA COLLECTION, NOT DISCOVERY. Don't explore feelings about unemployment. Don't assess financial stress. Get parameters, confirm.

SENSITIVITY: If difficult situation, one sentence acknowledgment, then data collection.`,
    openingPrompt: "Last section — just the practical stuff. Are you currently employed, actively searching, or somewhere in between? And how much time do you have before you need to land somewhere?",
  },
];

const MIRROR_POINTS = {
  2: {
    label: "A pattern is forming",
    systemContext: `You've extracted signals across essence, skills, and values. Synthesize ONE pattern connecting them — something the person may not have stated explicitly. THIS IS NOT THERAPY — it's pattern recognition for a scoring document.

GOOD: "Your essence is building from nothing. Your carry-forward skills are all about creation. The value you defended most was autonomy. Your lens is pointing at early-stage companies where you'd be the first hire in your function."

BAD: "I'm sensing your need to build might come from a desire to prove yourself..." (therapy, not extraction)

3-4 sentences. Reference extracted signals. End with what this means for scoring. No questions.`,
  },
  5: {
    label: "Your scoring profile is taking shape",
    systemContext: `You've extracted signals across six sections. Synthesize the full scoring profile as a BRIEFING:
- What company type scores highest?
- What's the tension or tradeoff in their profile?
- What will the scoring engine prioritize?

GOOD: "Your profile scores for early-stage, mission-driven, small teams where you'd build post-sales from scratch. Tension: you want deep long-term relationships but you're drawn to chaotic early-stage where people cycle fast. Scoring will weight retention culture heavily."

4-5 sentences. Specific. Reference signals by name. No questions.`,
  },
};

// ── Empty lens ──
const EMPTY_LENS = {
  essence: null, carry_forward: [], leave_behind: [], values_defended: [],
  target_sectors: [], target_missions: [], workstyle: null,
  energy_sources: [], energy_drains: [], disqualifiers: [],
  situation: null, timeline: null,
  score_weights: { mission: 0.25, role: 0.20, culture: 0.18, skill: 0.17, workstyle: 0.12, energy: 0.08 },
};

// ── Swiss Design Tokens ──
const T = {
  white: "#ffffff",
  black: "#000000",
  red: "#e8000b",
  redLight: "#e8000b18",
  grey90: "#1a1a1a",
  grey70: "#4d4d4d",
  grey50: "#808080",
  grey30: "#b3b3b3",
  grey15: "#d9d9d9",
  grey05: "#f2f2f2",
  border: "#d9d9d9",
  sans: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  mono: "'SF Mono', 'Menlo', 'Monaco', 'Consolas', monospace",
};

// ── Build system prompt with turn awareness ──
function buildSystemPrompt(section, turnCount, fullHistory) {
  const prior = fullHistory
    .filter(t => t.role === "assistant" && t.section !== section.id)
    .slice(-12)
    .map(t => `[${t.section}] ${t.content}`)
    .join("\n");
  const historyCtx = prior ? `\n\n[ACCUMULATED SIGNALS from earlier sections:\n${prior}\n]` : "";

  let turnNote = "";
  if (turnCount >= section.hardCap) {
    turnNote = `\n\nFINAL EXCHANGE. Synthesize all extracted signals as a confirmed list. "Here's what your lens has for this section: [signals]. Moving on — you can refine later." Do NOT ask another question.`;
  } else if (turnCount >= section.softCap) {
    turnNote = `\n\nSYNTHESIS TIME (${turnCount}/${section.softCap}). Present signals extracted so far: "For your lens, I have: [signals]. Does that capture it, or one more thing?" If confirmed, close section.`;
  } else if (turnCount >= section.softCap - 1) {
    turnNote = `\n\nApproaching synthesis point (${turnCount}/${section.softCap}). Start steering toward confirmation.`;
  }

  return GLOBAL_PROMPT + "\n\n" + section.systemContext + historyCtx + turnNote;
}

// ── Extraction prompts ──
function getExtractionPrompt(sectionId, conversation) {
  const convText = conversation.map(t => `${t.role}: ${t.content}`).join("\n");
  const schemas = {
    essence: { fmt: '{"essence":"throughline sentence"}', note: "Specific enough that only THIS person would recognize it." },
    skills: { fmt: '{"carry_forward":["skill1","skill2"],"leave_behind":["thing1"]}', note: "Each specific enough to match against a job description." },
    values: { fmt: '{"values_defended":["value — evidence","value — evidence"]}', note: "Drop values without behavioral evidence." },
    mission: { fmt: '{"target_sectors":["sector1"],"target_missions":["problem statement"]}', note: "Sectors include stage/type/sub-industry. Missions are problems, not labels." },
    workstyle: { fmt: '{"workstyle":"summary with key preferences embedded"}', note: "Include location, pace, structure, collaboration mode." },
    energy: { fmt: '{"energy_sources":["activity1"],"energy_drains":["activity1"]}', note: "Specific activities, not abstractions." },
    disqualifiers: { fmt: '{"disqualifiers":["criterion1","criterion2"]}', note: "Each must produce binary yes/no against a job listing." },
    situation: { fmt: '{"situation":"status — context","timeline":"urgency with timeframe"}', note: "Include comp floor and location constraints if mentioned." },
  };
  const s = schemas[sectionId];
  if (!s) return null;
  return `Extract structured signals from this "${sectionId}" lens discovery conversation.\n${s.note}\nReturn ONLY valid JSON: ${s.fmt}\nNo backticks, no preamble.\n\nConversation:\n${convText}`;
}

// ── Should show advance ──
function shouldShowAdvance(turnCount, section) {
  return turnCount >= 2;
}

// ── Typewriter ──
function useTypewriter(text, speed = 16) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!text) { setDisplayed(""); setDone(false); return; }
    setDisplayed(""); setDone(false);
    let i = 0;
    const iv = setInterval(() => {
      i++; setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(iv); setDone(true); }
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed]);
  return { displayed, done };
}

// ── Fade-in ──
function FadeIn({ children, delay = 0, duration = 600, style = {} }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{
      opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(6px)",
      transition: `opacity ${duration}ms ease, transform ${duration}ms ease`, ...style,
    }}>{children}</div>
  );
}

// ── Live Lens Panel ──
function LensPanel({ lens, currentSection, isOpen, onToggle }) {
  return (
    <div style={{
      position: "fixed", top: 32, right: 0, width: isOpen ? 380 : 44, height: "calc(100vh - 32px)",
      background: T.white, borderLeft: `1px solid ${T.border}`,
      transition: "width 0.35s cubic-bezier(0.4, 0, 0.2, 1)", zIndex: 100,
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      <button onClick={onToggle} style={{
        position: "absolute", top: 20, left: isOpen ? 16 : 8,
        background: "none", border: "none", color: T.red, cursor: "pointer",
        fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
        fontFamily: T.sans, padding: "4px 6px", zIndex: 2, whiteSpace: "nowrap",
      }}>
        {isOpen ? "Close" : "◈"}
      </button>

      {isOpen && (
        <div style={{ padding: "54px 24px 24px", overflowY: "auto", flex: 1 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 9, letterSpacing: "0.25em", color: T.grey30, textTransform: "uppercase", marginBottom: 4, fontFamily: T.sans }}>
              Your Lens — Live
            </div>
            <div style={{ fontSize: 11, color: T.grey50, lineHeight: 1.6, fontFamily: T.sans }}>
              Building in real time. This document evolves.
            </div>
          </div>

          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 20,
            padding: "7px 11px", border: `1px solid ${T.redLight.replace("18","30")}`,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.red, animation: "pulse 2.5s ease-in-out infinite" }} />
            <span style={{ fontSize: 9, color: T.red, letterSpacing: "0.08em", fontFamily: T.sans, textTransform: "uppercase" }}>
              v1 forming
            </span>
          </div>

          <div style={{ fontFamily: T.mono, fontSize: 10.5, lineHeight: 1.9 }}>
            <YField label="essence" value={lens.essence} active={currentSection === "essence"} />
            <YArray label="carry_forward" values={lens.carry_forward} active={currentSection === "skills"} />
            <YArray label="leave_behind" values={lens.leave_behind} active={currentSection === "skills"} />
            <YArray label="values_defended" values={lens.values_defended} active={currentSection === "values"} />
            <YArray label="target_sectors" values={lens.target_sectors} active={currentSection === "mission"} />
            <YArray label="target_missions" values={lens.target_missions} active={currentSection === "mission"} />
            <YField label="workstyle" value={lens.workstyle} active={currentSection === "workstyle"} />
            <YArray label="energy_sources" values={lens.energy_sources} active={currentSection === "energy"} />
            <YArray label="energy_drains" values={lens.energy_drains} active={currentSection === "energy"} />
            <YArray label="disqualifiers" values={lens.disqualifiers} active={currentSection === "disqualifiers"} red />
            <YField label="situation" value={lens.situation} active={currentSection === "situation"} />
            <YField label="timeline" value={lens.timeline} active={currentSection === "situation"} />

            <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${T.grey15}` }}>
              <div style={{ color: T.grey30, marginBottom: 4 }}>score_weights:</div>
              {Object.entries(lens.score_weights).map(([k, v]) => (
                <div key={k} style={{ paddingLeft: 14, color: T.grey50 }}>
                  <span style={{ color: T.grey30 }}>{k}:</span> {v}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function YField({ label, value, active, red }) {
  return (
    <div style={{ marginBottom: 6, opacity: value ? 1 : (active ? 0.6 : 0.25), transition: "opacity 0.4s" }}>
      <span style={{ color: active ? T.red : T.grey50 }}>{label}:</span>{" "}
      <span style={{ color: value ? (red ? T.red : T.grey90) : T.grey30, fontStyle: value ? "normal" : "italic" }}>
        {value || "~"}
      </span>
      {active && !value && <span style={{ color: T.red, animation: "pulse 1.5s ease-in-out infinite" }}> ●</span>}
    </div>
  );
}

function YArray({ label, values, active, red }) {
  return (
    <div style={{ marginBottom: 6, opacity: values.length > 0 || active ? 1 : 0.25, transition: "opacity 0.4s" }}>
      <div style={{ color: active ? T.red : T.grey50 }}>{label}:</div>
      {values.length === 0 && (
        <div style={{ paddingLeft: 14, color: T.grey30, fontStyle: "italic" }}>
          []{active && <span style={{ color: T.red, animation: "pulse 1.5s ease-in-out infinite" }}> ●</span>}
        </div>
      )}
      {values.map((v, i) => (
        <FadeIn key={`${label}-${i}`} delay={i * 80} duration={400}>
          <div style={{ paddingLeft: 14, color: red ? T.red : T.grey70 }}>- "{v}"</div>
        </FadeIn>
      ))}
    </div>
  );
}

// ── Section Transition ──
function SectionTransition({ section, sectionIndex, mirror, onContinue }) {
  const [phase, setPhase] = useState("enter");
  useEffect(() => {
    if (mirror) {
      const t = setTimeout(() => setPhase("mirror"), 500);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setPhase("ready"), 300);
      return () => clearTimeout(t);
    }
  }, [mirror]);

  const mirrorTyped = useTypewriter(phase === "mirror" ? mirror : "", 18);
  useEffect(() => {
    if (mirrorTyped.done && phase === "mirror") {
      const t = setTimeout(() => setPhase("ready"), 1000);
      return () => clearTimeout(t);
    }
  }, [mirrorTyped.done, phase]);

  return (
    <div style={{
      minHeight: "40vh", display: "flex", flexDirection: "column",
      justifyContent: "center", padding: "60px 0",
    }}>
      <FadeIn delay={0} duration={500}>
        <div style={{
          fontSize: 9, letterSpacing: "0.3em", color: T.grey30,
          textTransform: "uppercase", marginBottom: 12, fontFamily: T.sans,
        }}>
          Section {sectionIndex + 1} of {SECTIONS.length}
        </div>
      </FadeIn>

      <FadeIn delay={80} duration={700}>
        <h2 style={{
          fontFamily: T.sans, fontSize: 42, fontWeight: 700, color: T.black,
          margin: "0 0 6px", lineHeight: 1.1, letterSpacing: "-0.02em",
        }}>
          {section.label}
        </h2>
      </FadeIn>

      <FadeIn delay={160} duration={700}>
        <div style={{ fontSize: 14, color: T.grey50, fontFamily: T.sans, marginBottom: 6 }}>
          {section.subtitle}
        </div>
      </FadeIn>

      <FadeIn delay={240} duration={600}>
        <div style={{ fontSize: 11, color: T.grey30, fontFamily: T.mono, marginBottom: 32 }}>
          Target: {section.extractionTarget}
        </div>
      </FadeIn>

      {mirror && phase === "mirror" && (
        <div style={{
          maxWidth: 560, padding: "20px 24px", borderLeft: `3px solid ${T.red}`,
          marginBottom: 32, background: T.grey05,
        }}>
          <div style={{
            fontSize: 9, letterSpacing: "0.2em", color: T.red,
            textTransform: "uppercase", marginBottom: 8, fontFamily: T.sans,
          }}>
            ◈ {MIRROR_POINTS[sectionIndex - 1]?.label || "Pattern detected"}
          </div>
          <div style={{ fontFamily: T.sans, fontSize: 15, color: T.grey70, lineHeight: 1.8 }}>
            {mirrorTyped.displayed}
            {!mirrorTyped.done && <span style={{ color: T.red }}>|</span>}
          </div>
        </div>
      )}

      {phase === "ready" && (
        <FadeIn delay={0} duration={500}>
          <button onClick={onContinue} style={{
            padding: "10px 28px", background: T.black, border: "none",
            color: T.white, fontSize: 11, letterSpacing: "0.14em",
            textTransform: "uppercase", cursor: "pointer", fontFamily: T.sans,
          }}
          onMouseEnter={e => { e.target.style.background = T.red; }}
          onMouseLeave={e => { e.target.style.background = T.black; }}
          >
            Begin
          </button>
        </FadeIn>
      )}
    </div>
  );
}

// ── Conversation Turn (Swiss editorial) ──
function ConversationTurn({ role, text, isLatest }) {
  const typed = useTypewriter(role === "assistant" && isLatest ? text : "", 14);
  const display = role === "assistant" && isLatest ? typed.displayed : text;
  const cursor = role === "assistant" && isLatest && !typed.done;

  if (role === "assistant") {
    return (
      <div style={{ marginBottom: 28, maxWidth: 600 }}>
        <div style={{
          fontFamily: T.sans, fontSize: 17, color: T.black, lineHeight: 1.75,
          fontWeight: 400, letterSpacing: "0.005em",
        }}>
          {display}{cursor && <span style={{ color: T.red }}>|</span>}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      marginBottom: 32, paddingLeft: 20, borderLeft: `3px solid ${T.red}`,
      maxWidth: 600,
    }}>
      <div style={{ fontFamily: T.sans, fontSize: 15, color: T.grey70, lineHeight: 1.75 }}>
        {text}
      </div>
    </div>
  );
}

// ── Main ──
export default function LensExperience() {
  const [phase, setPhase] = useState("welcome");
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [sectionPhase, setSectionPhase] = useState("transition");
  const [conversation, setConversation] = useState([]);
  const [fullHistory, setFullHistory] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lens, setLens] = useState(JSON.parse(JSON.stringify(EMPTY_LENS)));
  const [lensOpen, setLensOpen] = useState(false);
  const [mirrorText, setMirrorText] = useState(null);
  const [turnCount, setTurnCount] = useState(0);
  const [synthesisText, setSynthesisText] = useState("");
  const [lensDocument, setLensDocument] = useState("");
  const [sessionMeta, setSessionMeta] = useState({
    startedAt: null,
    completedAt: null,
    sectionStats: {},  // { sectionId: { turns, startedAt, completedAt } }
    buildVersion: BUILD_VERSION,
  });
  const [submitStatus, setSubmitStatus] = useState(null); // null | "sending" | "sent" | "error"

  const inputRef = useRef(null);
  const endRef = useRef(null);
  const currentSection = SECTIONS[currentSectionIndex];

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [conversation, loading]);
  useEffect(() => { if (sectionPhase === "conversation") setTimeout(() => inputRef.current?.focus(), 300); }, [sectionPhase, conversation]);

  const callAPI = useCallback(async (messages, systemPrompt) => {
    try {
      const res = await fetch("/api/claude", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, system: systemPrompt, messages }),
      });
      const data = await res.json();
      return data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "";
    } catch (err) { console.error(err); return "Let me rephrase. Can you give me a specific example?"; }
  }, []);

  const extractLensSignals = useCallback(async (sectionId, sectionConv) => {
    const prompt = getExtractionPrompt(sectionId, sectionConv);
    if (!prompt) return null;
    try {
      const res = await fetch("/api/claude", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 500, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "";
      return JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch (err) { console.error(err); return null; }
  }, []);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput(""); setLoading(true);

    const newConv = [...conversation, { role: "user", content: userMsg }];
    setConversation(newConv);
    setFullHistory(prev => [...prev, { section: currentSection.id, role: "user", content: userMsg }]);

    const newTurnCount = turnCount + 1;
    const systemPrompt = buildSystemPrompt(currentSection, newTurnCount, fullHistory);
    const apiMessages = newConv.map(t => ({ role: t.role, content: t.content }));
    const reply = await callAPI(apiMessages, systemPrompt);

    setConversation([...newConv, { role: "assistant", content: reply }]);
    setFullHistory(prev => [...prev, { section: currentSection.id, role: "assistant", content: reply }]);
    setTurnCount(newTurnCount);
    setLoading(false);

    // Auto-advance at hard cap
    if (newTurnCount >= currentSection.hardCap) {
      setTimeout(() => advanceSection(), 3500);
    }
  };

  const advanceSection = async () => {
    setLoading(true);
    // Record section completion metadata
    setSessionMeta(prev => ({
      ...prev,
      sectionStats: {
        ...prev.sectionStats,
        [currentSection.id]: {
          ...prev.sectionStats[currentSection.id],
          turns: turnCount,
          completedAt: new Date().toISOString(),
        },
      },
    }));

    if (conversation.length > 1) {
      const signals = await extractLensSignals(currentSection.id, conversation);
      if (signals) {
        setLens(prev => {
          const updated = { ...prev };
          Object.keys(signals).forEach(key => {
            if (Array.isArray(signals[key])) updated[key] = [...(updated[key] || []), ...signals[key]];
            else if (signals[key]) updated[key] = signals[key];
          });
          return updated;
        });
      }
    }

    const mirrorConfig = MIRROR_POINTS[currentSectionIndex];
    if (mirrorConfig) {
      const historyText = fullHistory.map(t => `[${t.section}] ${t.role}: ${t.content}`).join("\n");
      const mirrorResponse = await callAPI(
        [{ role: "user", content: `Conversation history:\n\n${historyText}` }],
        mirrorConfig.systemContext
      );
      setMirrorText(mirrorResponse);
    } else { setMirrorText(null); }

    setLoading(false);
    if (currentSectionIndex < SECTIONS.length - 1) {
      setCurrentSectionIndex(prev => prev + 1);
      setConversation([]); setTurnCount(0); setSectionPhase("transition");
    } else { synthesizeLens(); }
  };

  const beginSection = () => {
    setSectionPhase("conversation");
    setConversation([{ role: "assistant", content: currentSection.openingPrompt }]);
    setFullHistory(prev => [...prev, { section: currentSection.id, role: "assistant", content: currentSection.openingPrompt }]);
    setMirrorText(null);
    if (!lensOpen && currentSectionIndex >= 1) setLensOpen(true);
    // Track metadata
    const now = new Date().toISOString();
    if (!sessionMeta.startedAt) setSessionMeta(prev => ({ ...prev, startedAt: now }));
    setSessionMeta(prev => ({
      ...prev,
      sectionStats: {
        ...prev.sectionStats,
        [currentSection.id]: { turns: 0, startedAt: now, completedAt: null },
      },
    }));
  };

  // ── Build feedback package (richer version for review) ──
  function buildFeedbackPackage() {
    const now = new Date().toISOString();
    const transcript = fullHistory.map(t =>
      `[${t.section}] ${t.role.toUpperCase()}: ${t.content}`
    ).join("\n\n");

    const sectionSummary = Object.entries(sessionMeta.sectionStats).map(([id, stats]) => {
      const section = SECTIONS.find(s => s.id === id);
      const duration = stats.startedAt && stats.completedAt
        ? Math.round((new Date(stats.completedAt) - new Date(stats.startedAt)) / 1000)
        : null;
      return `${section?.label || id}: ${stats.turns} turns` +
        (duration ? ` · ${Math.floor(duration / 60)}m ${duration % 60}s` : '') +
        ` (budget: ${section?.softCap}-${section?.hardCap})`;
    }).join("\n");

    const totalDuration = sessionMeta.startedAt
      ? Math.round((new Date(now) - new Date(sessionMeta.startedAt)) / 1000 / 60)
      : null;

    const feedbackDoc = `# Lens Session — Feedback Copy
# Generated: ${now.split("T")[0]}
# Build: ${BUILD_VERSION}
# Session duration: ${totalDuration ? totalDuration + " minutes" : "unknown"}
# Total exchanges: ${fullHistory.filter(t => t.role === "user").length}

## Section Performance
${sectionSummary}

## Extracted Signals (JSON)
\`\`\`json
${JSON.stringify(lens, null, 2)}
\`\`\`

## Synthesized Lens Document
${synthesisText}

## Full Transcript
${transcript}
`;

    return {
      version: BUILD_VERSION,
      sessionId: sessionMeta.startedAt || now,
      startedAt: sessionMeta.startedAt,
      completedAt: now,
      totalExchanges: fullHistory.filter(t => t.role === "user").length,
      totalDurationMinutes: totalDuration,
      sectionStats: sessionMeta.sectionStats,
      lens,
      synthesisText,
      lensDocument,
      transcript: fullHistory,
      feedbackDoc,
    };
  }

  // ── Submit feedback: webhook → email+download fallback ──
  const submitFeedback = async () => {
    const pkg = buildFeedbackPackage();

    if (WEBHOOK_URL) {
      setSubmitStatus("sending");
      try {
        const res = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pkg),
        });
        if (res.ok) { setSubmitStatus("sent"); return; }
        throw new Error(`${res.status}`);
      } catch (err) {
        console.error("Webhook failed, falling back to email:", err);
      }
    }

    // Fallback: download file + open mailto with summary
    downloadFeedbackCopy(pkg.feedbackDoc);

    // Build concise email body with key stats
    const sectionLines = Object.entries(sessionMeta.sectionStats).map(([id, stats]) => {
      const sec = SECTIONS.find(s => s.id === id);
      return `  ${sec?.label || id}: ${stats.turns} turns (budget ${sec?.softCap}-${sec?.hardCap})`;
    }).join("\n");

    const essencePreview = lens.essence ? `Essence: "${lens.essence}"` : "Essence: not extracted";
    const disqCount = lens.disqualifiers?.length || 0;

    const body = `Lens session feedback — ${BUILD_VERSION}

Date: ${new Date().toISOString().split("T")[0]}
Duration: ${pkg.totalDurationMinutes || "?"}min
Exchanges: ${pkg.totalExchanges}

${essencePreview}
Disqualifiers: ${disqCount}
Values extracted: ${lens.values_defended?.length || 0}

Section performance:
${sectionLines}

Full feedback file downloaded separately — please attach it to this email.
Filename: lens-feedback-${new Date().toISOString().split("T")[0]}.md`;

    const subject = `Lens feedback · ${BUILD_VERSION} · ${pkg.totalExchanges} exchanges · ${new Date().toISOString().split("T")[0]}`;

    // Open mailto (encodeURIComponent handles special chars)
    const mailto = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, "_blank");

    setSubmitStatus("sent");
  };

  function downloadFeedbackCopy(feedbackDoc) {
    const blob = new Blob([feedbackDoc], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lens-feedback-${new Date().toISOString().split("T")[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const synthesizeLens = async () => {
    setPhase("synthesis");
    setSessionMeta(prev => ({ ...prev, completedAt: new Date().toISOString() }));
    const historyText = fullHistory.map(t => `[${t.section}] ${t.role}: ${t.content}`).join("\n");
    const synthesisResponse = await callAPI(
      [{ role: "user", content: `Complete discovery session:\n\n${historyText}\n\nExtracted signals:\n${JSON.stringify(lens, null, 2)}` }],
      `Synthesize a career identity lens document. Write as a first-person document in the person's authentic voice — not a report about them.

Start with 2-3 sentence essence statement. Organize: What I Carry Forward, What I've Left Behind, Values I Defend, Where I Point This, How I Work, What Fills Me, What Empties Me, Hard No's, Where I Am Now.

Markdown. Bold, specific, honest. Sharp enough to score against, true enough to trust.

CRITICAL: This is v1 of a living document. Frame the ending to reinforce it evolves with new conversations and experiences.`
    );
    setSynthesisText(synthesisResponse);
    const yaml = buildYAML(lens);
    setLensDocument(`---\n${yaml}---\n\n${synthesisResponse}`);
    setPhase("complete");
  };

  function buildYAML(l) {
    let y = `# Tide Pool Lens Document\n# Generated: ${new Date().toISOString().split("T")[0]}\n# Version: 1.0\n\n`;
    if (l.essence) y += `essence: "${l.essence}"\n\n`;
    const arrays = ["carry_forward","leave_behind","values_defended","target_sectors","target_missions","energy_sources","energy_drains","disqualifiers"];
    arrays.forEach(k => { if (l[k]?.length) { y += `${k}:\n`; l[k].forEach(s => { y += `  - "${s}"\n`; }); y += "\n"; } });
    if (l.workstyle) y += `workstyle: "${l.workstyle}"\n\n`;
    if (l.situation) y += `situation: "${l.situation}"\n`;
    if (l.timeline) y += `timeline: "${l.timeline}"\n\n`;
    y += `score_weights:\n`; Object.entries(l.score_weights).forEach(([k, v]) => { y += `  ${k}: ${v}\n`; }); y += "\n";
    return y;
  }

  // ═══ WELCOME ═══
  if (phase === "welcome") {
    return (
      <div style={{ minHeight: "100vh", background: T.white, fontFamily: T.sans, display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 80px" }}>
        
        {/* Dev banner */}
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
          background: T.black, padding: "8px 80px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 9, letterSpacing: "0.15em", color: T.red, textTransform: "uppercase", fontWeight: 700 }}>
              Development Build {BUILD_VERSION}
            </span>
            <span style={{ fontSize: 10, color: T.grey50 }}>
              Session data is collected for product improvement
            </span>
          </div>
          <span style={{ fontSize: 10, color: T.grey50, fontFamily: T.mono }}>
            feedback → {WEBHOOK_URL ? "webhook" : FEEDBACK_EMAIL}
          </span>
        </div>

        <FadeIn delay={100} duration={800}>
          <div style={{ fontSize: 9, letterSpacing: "0.35em", color: T.grey30, textTransform: "uppercase", marginBottom: 24 }}>
            Tide Pool
          </div>
        </FadeIn>

        <FadeIn delay={300} duration={1000}>
          <h1 style={{ fontFamily: T.sans, fontSize: 72, fontWeight: 700, color: T.black, margin: 0, lineHeight: 1.05, letterSpacing: "-0.03em", maxWidth: 700 }}>
            Build your<br />lens
          </h1>
        </FadeIn>

        <FadeIn delay={600} duration={800}>
          <div style={{ width: 60, height: 3, background: T.red, margin: "28px 0" }} />
        </FadeIn>

        <FadeIn delay={800} duration={800}>
          <p style={{ fontSize: 17, color: T.grey70, lineHeight: 1.75, maxWidth: 520, margin: "0 0 8px" }}>
            A lens is a living document — your professional identity distilled into something sharp enough to score every opportunity you encounter.
          </p>
        </FadeIn>

        <FadeIn delay={950} duration={800}>
          <p style={{ fontSize: 14, color: T.grey50, lineHeight: 1.7, maxWidth: 480, margin: "0 0 40px" }}>
            This is version one. Every conversation sharpens it. Every decision teaches it. The lens grows with you.
          </p>
        </FadeIn>

        <FadeIn delay={1200} duration={700}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <button
              onClick={() => setPhase("discovery")}
              style={{
                padding: "12px 36px", background: T.black, border: "none",
                color: T.white, fontSize: 11, letterSpacing: "0.16em",
                textTransform: "uppercase", cursor: "pointer", fontFamily: T.sans,
              }}
              onMouseEnter={e => { e.target.style.background = T.red; }}
              onMouseLeave={e => { e.target.style.background = T.black; }}
            >
              Start discovery
            </button>
            <span style={{ fontSize: 11, color: T.grey30, fontFamily: T.mono }}>
              ~25 min · 8 sections · one document
            </span>
          </div>
        </FadeIn>

        <FadeIn delay={1400} duration={700}>
          <div style={{
            marginTop: 28, padding: "14px 18px", border: `1px solid ${T.grey15}`,
            maxWidth: 520,
          }}>
            <div style={{ fontSize: 10, color: T.grey70, lineHeight: 1.7 }}>
              <span style={{ fontWeight: 700 }}>Development preview.</span> Your lens document is yours to keep. At the end of the session, you'll be asked to email a copy of the conversation transcript and session data to <span style={{ fontFamily: T.mono }}>{FEEDBACK_EMAIL}</span> for product improvement. Participation is optional. No data is sold or shared with third parties.
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={1600} duration={1000}>
          <div style={{ marginTop: 80, display: "flex", gap: 20, alignItems: "baseline" }}>
            {["v1", "v1.1", "v1.2", "v2", "..."].map((v, i) => (
              <span key={v} style={{
                fontSize: i === 0 ? 14 : 11, fontFamily: T.mono,
                color: i === 0 ? T.red : T.grey15, fontWeight: i === 0 ? 700 : 400,
              }}>{v}</span>
            ))}
          </div>
          <div style={{ fontSize: 10, color: T.grey30, marginTop: 6, letterSpacing: "0.04em" }}>
            Each conversation evolves the lens
          </div>
        </FadeIn>

        <style>{`
          @keyframes pulse { 0%, 100% { opacity: 0.3 } 50% { opacity: 1 } }
          @keyframes blink { 0%, 50% { opacity: 1 } 51%, 100% { opacity: 0 } }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          ::selection { background: ${T.redLight}; color: ${T.black}; }
          ::-webkit-scrollbar { width: 3px }
          ::-webkit-scrollbar-track { background: transparent }
          ::-webkit-scrollbar-thumb { background: ${T.grey15} }
        `}</style>
      </div>
    );
  }

  // ═══ SYNTHESIS LOADING ═══
  if (phase === "synthesis") {
    return (
      <div style={{ minHeight: "100vh", background: T.white, fontFamily: T.sans, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", padding: "60px 80px" }}>
        <div style={{ width: 32, height: 32, border: `2px solid ${T.grey15}`, borderTop: `2px solid ${T.red}`, borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: 24 }} />
        <div style={{ fontSize: 24, fontWeight: 700, color: T.black, marginBottom: 6 }}>Synthesizing your lens</div>
        <div style={{ fontSize: 13, color: T.grey50, fontFamily: T.mono }}>
          {fullHistory.filter(t => t.role === "user").length} responses → one document
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } } * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>
      </div>
    );
  }

  // ═══ COMPLETE ═══
  if (phase === "complete") {
    return (
      <div style={{ minHeight: "100vh", background: T.white, fontFamily: T.sans, padding: "60px 80px" }}>
        {/* Dev banner persists */}
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
          background: T.black, padding: "8px 80px",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 9, letterSpacing: "0.15em", color: T.red, textTransform: "uppercase", fontWeight: 700 }}>
            Dev {BUILD_VERSION}
          </span>
          <span style={{ fontSize: 10, color: T.grey50 }}>
            {submitStatus === "sent" ? "✓ Feedback sent" : "Session complete — please send feedback below"}
          </span>
        </div>

        <div style={{ maxWidth: 660, marginTop: 20 }}>
          <FadeIn delay={100} duration={800}>
            <div style={{ fontSize: 9, letterSpacing: "0.3em", color: T.grey30, textTransform: "uppercase", marginBottom: 8 }}>
              Your Lens — v1.0
            </div>
            <h1 style={{ fontFamily: T.sans, fontSize: 42, fontWeight: 700, color: T.black, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
              Your lens is alive
            </h1>
            <div style={{ width: 40, height: 3, background: T.red, margin: "16px 0 20px" }} />
            <p style={{ fontSize: 15, color: T.grey70, lineHeight: 1.8, marginBottom: 28 }}>
              Version one — shaped by what you shared today. It sharpens with every conversation, every decision, every opportunity you evaluate.
            </p>
          </FadeIn>

          <FadeIn delay={400} duration={700}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28, padding: "10px 14px", border: `1px solid ${T.redLight.replace("18","30")}` }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: T.red, animation: "pulse 2.5s ease-in-out infinite" }} />
              <span style={{ fontSize: 10, color: T.red, letterSpacing: "0.08em", textTransform: "uppercase" }}>Living document — updates with each session</span>
              <span style={{ fontSize: 10, color: T.grey30, marginLeft: "auto", fontFamily: T.mono }}>{new Date().toISOString().split("T")[0]}</span>
            </div>
          </FadeIn>

          {/* Lens content */}
          <FadeIn delay={600} duration={800}>
            <div style={{ background: T.grey05, padding: "28px 24px", marginBottom: 20, border: `1px solid ${T.grey15}` }}>
              <div style={{ fontFamily: T.sans, fontSize: 15, color: T.grey90, lineHeight: 1.85, whiteSpace: "pre-wrap" }}>
                {synthesisText}
              </div>
            </div>
          </FadeIn>

          {/* YAML preview */}
          <FadeIn delay={800} duration={600}>
            <details style={{ marginBottom: 28 }}>
              <summary style={{ fontSize: 11, color: T.grey50, cursor: "pointer", letterSpacing: "0.06em", fontFamily: T.sans, padding: "8px 0" }}>
                View YAML frontmatter (machine-readable scoring data)
              </summary>
              <pre style={{ background: T.grey05, border: `1px solid ${T.grey15}`, padding: 18, fontFamily: T.mono, fontSize: 10.5, color: T.grey70, lineHeight: 1.8, overflowX: "auto", marginTop: 6 }}>
                {lensDocument.split("---")[1]}
              </pre>
            </details>
          </FadeIn>

          {/* What happens next */}
          <FadeIn delay={900} duration={600}>
            <div style={{ padding: "20px 24px", borderLeft: `3px solid ${T.red}`, background: T.grey05, marginBottom: 28 }}>
              <div style={{ fontSize: 9, letterSpacing: "0.2em", color: T.red, textTransform: "uppercase", marginBottom: 8 }}>What happens next</div>
              <div style={{ fontSize: 14, color: T.grey70, lineHeight: 1.85 }}>
                This lens scores every opportunity in your pipeline — signal matching, not keyword matching. Come back anytime to refine a section, add signals, or tell the lens what you've learned.
              </div>
            </div>
          </FadeIn>

          {/* ── Your copy: download/clipboard ── */}
          <FadeIn delay={1050} duration={500}>
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 9, letterSpacing: "0.2em", color: T.grey30, textTransform: "uppercase", marginBottom: 12 }}>
                Your copy
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={() => {
                    const b = new Blob([lensDocument], { type: "text/markdown" });
                    const u = URL.createObjectURL(b);
                    const a = document.createElement("a");
                    a.href = u;
                    a.download = `my-lens-v1-${new Date().toISOString().split("T")[0]}.md`;
                    a.click();
                    URL.revokeObjectURL(u);
                  }}
                  style={{
                    padding: "10px 24px", background: T.black, border: "none",
                    color: T.white, fontSize: 11, letterSpacing: "0.12em",
                    textTransform: "uppercase", cursor: "pointer", fontFamily: T.sans,
                  }}
                  onMouseEnter={e => { e.target.style.background = T.red; }}
                  onMouseLeave={e => { e.target.style.background = T.black; }}
                >
                  Download lens .md
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(lensDocument)}
                  style={{
                    padding: "10px 24px", background: "transparent",
                    border: `1px solid ${T.grey15}`, color: T.grey50,
                    fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase",
                    cursor: "pointer", fontFamily: T.sans,
                  }}
                >
                  Copy to clipboard
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(JSON.stringify(lens, null, 2))}
                  style={{
                    padding: "10px 24px", background: "transparent",
                    border: `1px solid ${T.grey15}`, color: T.grey50,
                    fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase",
                    cursor: "pointer", fontFamily: T.sans,
                  }}
                >
                  Copy JSON
                </button>
              </div>
            </div>
          </FadeIn>

          {/* ── Feedback submission ── */}
          <FadeIn delay={1200} duration={500}>
            <div style={{
              padding: "24px 24px", border: `1px solid ${T.black}`,
              marginBottom: 32, background: T.white,
            }}>
              <div style={{ fontSize: 9, letterSpacing: "0.2em", color: T.red, textTransform: "uppercase", marginBottom: 10, fontWeight: 700 }}>
                Help us improve — send your session
              </div>
              <div style={{ fontSize: 13, color: T.grey70, lineHeight: 1.75, marginBottom: 16 }}>
                This is a development build. Clicking below downloads your session file (lens + full transcript + timing data) and opens an email to <span style={{ fontFamily: T.mono, fontSize: 12 }}>{FEEDBACK_EMAIL}</span> with a summary. Please attach the downloaded file and send. Your data is used only to improve the discovery process.
              </div>

              {/* Session stats preview */}
              <div style={{
                display: "flex", gap: 20, marginBottom: 16, padding: "12px 16px",
                background: T.grey05, fontFamily: T.mono, fontSize: 10,
              }}>
                <div>
                  <span style={{ color: T.grey30 }}>Exchanges:</span>{" "}
                  <span style={{ color: T.black, fontWeight: 700 }}>{fullHistory.filter(t => t.role === "user").length}</span>
                </div>
                <div>
                  <span style={{ color: T.grey30 }}>Sections:</span>{" "}
                  <span style={{ color: T.black, fontWeight: 700 }}>{Object.keys(sessionMeta.sectionStats).length}</span>
                </div>
                <div>
                  <span style={{ color: T.grey30 }}>Duration:</span>{" "}
                  <span style={{ color: T.black, fontWeight: 700 }}>
                    {sessionMeta.startedAt
                      ? Math.round((Date.now() - new Date(sessionMeta.startedAt)) / 1000 / 60) + "m"
                      : "—"}
                  </span>
                </div>
                <div>
                  <span style={{ color: T.grey30 }}>Build:</span>{" "}
                  <span style={{ color: T.grey50 }}>{BUILD_VERSION}</span>
                </div>
              </div>

              {/* Submit button */}
              {submitStatus === "sent" ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, color: T.red, fontWeight: 700 }}>✓</span>
                  <span style={{ fontSize: 12, color: T.grey70 }}>
                    {WEBHOOK_URL ? "Session submitted. Thank you." : "File downloaded and email opened. Please attach the file and send."}
                  </span>
                </div>
              ) : submitStatus === "error" ? (
                <div>
                  <div style={{ fontSize: 12, color: T.red, marginBottom: 8 }}>
                    Something went wrong. The feedback file was downloaded — please email it manually to {FEEDBACK_EMAIL}.
                  </div>
                  <button onClick={submitFeedback} style={{
                    padding: "10px 24px", background: T.black, border: "none",
                    color: T.white, fontSize: 11, letterSpacing: "0.12em",
                    textTransform: "uppercase", cursor: "pointer", fontFamily: T.sans,
                  }}>Retry</button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <button
                    onClick={submitFeedback}
                    disabled={submitStatus === "sending"}
                    style={{
                      padding: "10px 24px",
                      background: submitStatus === "sending" ? T.grey30 : T.red,
                      border: "none", color: T.white, fontSize: 11,
                      letterSpacing: "0.12em", textTransform: "uppercase",
                      cursor: submitStatus === "sending" ? "default" : "pointer",
                      fontFamily: T.sans,
                    }}
                  >
                    {submitStatus === "sending" ? "Preparing..." : (WEBHOOK_URL ? "Submit for review" : "Download & email feedback")}
                  </button>
                  <span style={{ fontSize: 10, color: T.grey30 }}>
                    → {FEEDBACK_EMAIL}
                  </span>
                </div>
              )}
            </div>
          </FadeIn>

          {/* Session detail (collapsible) */}
          <FadeIn delay={1350} duration={500}>
            <details style={{ marginBottom: 32 }}>
              <summary style={{ fontSize: 11, color: T.grey50, cursor: "pointer", letterSpacing: "0.06em", fontFamily: T.sans, padding: "8px 0" }}>
                View session details (what gets submitted)
              </summary>
              <div style={{ marginTop: 8, background: T.grey05, border: `1px solid ${T.grey15}`, padding: 18 }}>
                <div style={{ fontSize: 10, fontFamily: T.mono, color: T.grey50, marginBottom: 12 }}>
                  Section performance:
                </div>
                {Object.entries(sessionMeta.sectionStats).map(([id, stats]) => {
                  const section = SECTIONS.find(s => s.id === id);
                  const duration = stats.startedAt && stats.completedAt
                    ? Math.round((new Date(stats.completedAt) - new Date(stats.startedAt)) / 1000)
                    : null;
                  return (
                    <div key={id} style={{
                      display: "flex", justifyContent: "space-between",
                      fontSize: 11, fontFamily: T.mono, color: T.grey70,
                      padding: "3px 0", borderBottom: `1px solid ${T.grey15}`,
                    }}>
                      <span>{section?.label || id}</span>
                      <span>
                        {stats.turns} turns
                        {duration ? ` · ${Math.floor(duration / 60)}m ${duration % 60}s` : ""}
                        <span style={{ color: T.grey30 }}> (budget: {section?.softCap}-{section?.hardCap})</span>
                      </span>
                    </div>
                  );
                })}
                <div style={{ marginTop: 14, fontSize: 10, fontFamily: T.mono, color: T.grey50 }}>
                  Full transcript: {fullHistory.length} messages across {Object.keys(sessionMeta.sectionStats).length} sections
                </div>
              </div>
            </details>
          </FadeIn>
        </div>

        <style>{`
          @keyframes pulse { 0%, 100% { opacity: 0.3 } 50% { opacity: 1 } }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          ::selection { background: ${T.redLight}; color: ${T.black}; }
          ::-webkit-scrollbar { width: 3px }
          ::-webkit-scrollbar-track { background: transparent }
          ::-webkit-scrollbar-thumb { background: ${T.grey15} }
        `}</style>
      </div>
    );
  }

  // ═══ DISCOVERY ═══
  return (
    <div style={{ minHeight: "100vh", background: T.white, fontFamily: T.sans, display: "flex" }}>
      {/* Persistent dev banner */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        background: T.black, padding: "8px 80px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <span style={{ fontSize: 9, letterSpacing: "0.15em", color: T.red, textTransform: "uppercase", fontWeight: 700 }}>
          Dev {BUILD_VERSION}
        </span>
        <span style={{ fontSize: 10, color: T.grey50 }}>
          Section {currentSectionIndex + 1}/{SECTIONS.length}: {currentSection.label}
        </span>
        <span style={{ fontSize: 10, color: T.grey30, marginLeft: "auto", fontFamily: T.mono }}>
          {fullHistory.filter(t => t.role === "user").length} exchanges
        </span>
      </div>

      <div style={{
        flex: 1, marginRight: lensOpen ? 380 : 44,
        transition: "margin-right 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        padding: "52px 80px 32px", maxWidth: 820,
      }}>
        {/* Breadcrumb */}
        <div style={{
          position: "sticky", top: 0, background: T.white, zIndex: 10,
          paddingBottom: 12, marginBottom: 16, borderBottom: `1px solid ${T.grey15}`,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 9, letterSpacing: "0.25em", color: T.grey30, textTransform: "uppercase" }}>Tide Pool</span>
          {SECTIONS.map((s, i) => (
            <span key={s.id} style={{
              fontSize: 10, fontFamily: T.mono, fontWeight: i === currentSectionIndex ? 700 : 400,
              color: i === currentSectionIndex ? T.red : i < currentSectionIndex ? T.black : T.grey30,
            }}>
              {i < currentSectionIndex ? "✓" : (i + 1)}
            </span>
          ))}
          {turnCount > 0 && sectionPhase === "conversation" && (
            <span style={{ fontSize: 10, fontFamily: T.mono, color: T.grey30, marginLeft: "auto" }}>
              {turnCount}/{currentSection.softCap}
            </span>
          )}
        </div>

        {sectionPhase === "transition" ? (
          <SectionTransition
            section={currentSection} sectionIndex={currentSectionIndex}
            mirror={mirrorText} onContinue={beginSection}
          />
        ) : (
          <>
            {/* Section header */}
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontFamily: T.sans, fontSize: 28, fontWeight: 700, color: T.black, margin: 0, letterSpacing: "-0.01em" }}>
                {currentSection.label}
              </h2>
              <div style={{ fontSize: 12, color: T.grey50, marginTop: 3 }}>{currentSection.subtitle}</div>
            </div>

            {/* Conversation */}
            <div style={{ marginBottom: 140 }}>
              {conversation.map((turn, i) => (
                <ConversationTurn key={i} role={turn.role} text={turn.content} isLatest={i === conversation.length - 1} />
              ))}
              {loading && (
                <div style={{ display: "flex", gap: 5, padding: "8px 0" }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: T.grey30, animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div style={{
              position: "fixed", bottom: 0, left: 0,
              right: lensOpen ? 380 : 44,
              background: `linear-gradient(transparent, ${T.white} 24%)`,
              padding: "48px 80px 28px",
              transition: "right 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            }}>
              <div style={{ maxWidth: 700 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                  <textarea ref={inputRef} value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                    placeholder="Your response..."
                    rows={2}
                    style={{
                      flex: 1, background: T.grey05, border: `1px solid ${T.grey15}`,
                      padding: "10px 14px", color: T.black, fontSize: 15, fontFamily: T.sans,
                      lineHeight: 1.65, resize: "none", outline: "none",
                    }}
                    onFocus={e => { e.target.style.borderColor = T.red; }}
                    onBlur={e => { e.target.style.borderColor = T.grey15; }}
                  />
                  <button onClick={send} disabled={!input.trim() || loading} style={{
                    padding: "10px 18px", background: T.black, border: "none",
                    color: T.white, fontSize: 10, letterSpacing: "0.12em",
                    textTransform: "uppercase", cursor: !input.trim() || loading ? "default" : "pointer",
                    opacity: !input.trim() || loading ? 0.2 : 1, fontFamily: T.sans, whiteSpace: "nowrap",
                  }}>Send</button>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  <span style={{ fontSize: 10, color: T.grey30, fontFamily: T.mono }}>
                    {turnCount >= currentSection.softCap
                      ? "Synthesis point reached"
                      : "shift+enter for new line"}
                  </span>
                  {shouldShowAdvance(turnCount, currentSection) && (
                    <button onClick={advanceSection} style={{
                      padding: "5px 14px", background: "transparent",
                      border: `1px solid ${turnCount >= currentSection.softCap ? T.red : T.grey15}`,
                      color: turnCount >= currentSection.softCap ? T.red : T.grey50,
                      fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
                      cursor: "pointer", fontFamily: T.sans,
                    }}
                    onMouseEnter={e => { e.target.style.background = T.redLight; e.target.style.borderColor = T.red; e.target.style.color = T.red; }}
                    onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.borderColor = turnCount >= currentSection.softCap ? T.red : T.grey15; e.target.style.color = turnCount >= currentSection.softCap ? T.red : T.grey50; }}
                    >
                      {currentSectionIndex < SECTIONS.length - 1 ? "Next section →" : "Complete & synthesize →"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <LensPanel lens={lens} currentSection={currentSection?.id} isOpen={lensOpen} onToggle={() => setLensOpen(!lensOpen)} />

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.3 } 50% { opacity: 1 } }
        @keyframes blink { 0%, 50% { opacity: 1 } 51%, 100% { opacity: 0 } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: ${T.redLight}; color: ${T.black}; }
        textarea::placeholder { color: ${T.grey30} }
        ::-webkit-scrollbar { width: 3px }
        ::-webkit-scrollbar-track { background: transparent }
        ::-webkit-scrollbar-thumb { background: ${T.grey15} }
      `}</style>
    </div>
  );
}
