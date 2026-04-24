"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

const BUILD_ID = "2026.04.24-b";
const RC_STORAGE_KEY = "RC_CANDIDATE_INTAKE_STATE";
const STORAGE_VERSION = "1.0";

// ── Design tokens (Swiss Style) ──
const RED = "#D93025";
const ORANGE = "#E8590C";
const BLK = "#1A1A1A";
const GRY = "#888";
const LT = "#ccc";
const RULE = "#eee";
const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

// ── Section label mapping (convert snake_case IDs to human-readable) ──
const SECTION_LABELS = {
  // Foundation sections
  essence: "Professional Essence",
  work_style: "Work Style",
  values: "Values & Priorities",
  energy: "Energy & Motivation",
  disqualifiers: "Deal-Breakers",
  situation_timeline: "Situation & Timeline",
  // Common tailored dimensions
  leadership_style: "Leadership Style",
  team_building: "Team Building",
  culture_alignment: "Culture Alignment",
  technical_depth: "Technical Depth",
  stakeholder_management: "Stakeholder Management",
  strategic_thinking: "Strategic Thinking",
  execution_style: "Execution Style",
  communication_style: "Communication Style",
  change_management: "Change Management",
  role_fit: "Role Fit",
  motivation: "Motivation & Timing",
};

/**
 * Convert a section ID to a human-readable label
 * @param {string} id - The section ID (e.g., "work_style")
 * @returns {string} Human-readable label (e.g., "Work Style")
 */
function formatSectionLabel(id) {
  if (!id) return "Unknown Section";
  // Check explicit mapping first
  if (SECTION_LABELS[id]) return SECTION_LABELS[id];
  // Fallback: convert snake_case to Title Case
  return id
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// ── Container style ──
const containerStyle = {
  maxWidth: "640px",
  margin: "0 auto",
  padding: "40px 24px",
  fontFamily: FONT,
  color: BLK,
  background: "#fff",
  minHeight: "100vh",
};

// ── Typewriter effect ──
function TypewriterText({ text, speed = 16 }) {
  const [displayed, setDisplayed] = useState("");
  const idx = useRef(0);
  useEffect(() => {
    setDisplayed("");
    idx.current = 0;
    const interval = setInterval(() => {
      if (idx.current < text.length) {
        setDisplayed(text.slice(0, idx.current + 1));
        idx.current++;
      } else clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  return <span>{displayed}</span>;
}

// ── Generate a unique session ID ──
function generateRCSessionId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `rc-${timestamp}-${random}`;
}

// ════════════════════════════════════════
// Main Component
// ════════════════════════════════════════

export default function RecruiterCandidateIntake() {
  // ── Core state ──
  const [phase, setPhase] = useState("loading"); // loading → intro → discovery → synthesis → complete
  const [sessionConfig, setSessionConfig] = useState(null);
  const [candidateData, setCandidateData] = useState(null); // { name, resumeText, email } from fan-out session
  const [loadError, setLoadError] = useState(null);

  // ── Dynamic sections (built from session-config) ──
  const [sections, setSections] = useState([]);
  const [currentSection, setCurrentSection] = useState(0);

  // ── Conversation state ──
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [aiGreeting, setAiGreeting] = useState("");
  const [greetingDone, setGreetingDone] = useState(false);
  const [sectionComplete, setSectionComplete] = useState(false);

  // ── Section data for lens ──
  const [sectionData, setSectionData] = useState({}); // { sectionId: summary }

  // ── Lens document output ──
  const [lens, setLens] = useState(null);
  const [lensError, setLensError] = useState(null);

  // ── Refs ──
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Refs for telemetry to avoid stale closures in beforeunload
  const messagesRef = useRef(messages);
  const sectionsRef = useRef(sections);
  const currentSectionRef = useRef(currentSection);
  const sessionConfigRef = useRef(sessionConfig);
  const lensRef = useRef(lens);

  // Keep refs in sync with state
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { sectionsRef.current = sections; }, [sections]);
  useEffect(() => { currentSectionRef.current = currentSection; }, [currentSection]);
  useEffect(() => { sessionConfigRef.current = sessionConfig; }, [sessionConfig]);
  useEffect(() => { lensRef.current = lens; }, [lens]);

  // ════════════════════════════════════════
  // SESSION TELEMETRY (mirrors LensIntake pattern)
  // ════════════════════════════════════════

  const telemetryRef = useRef({
    sessionId: generateRCSessionId(),
    sessionStart: new Date().toISOString(),
    buildVersion: BUILD_ID,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    // Phase timestamps
    discoveryStart: null,
    discoveryEnd: null,
    synthesisStart: null,
    synthesisEnd: null,
    // Status
    status: null, // Completed / Abandoned / Error
    abandonmentPhase: null,
    abandonmentSection: null,
    // Errors
    apiErrors: [],
    // Transcript persistence
    flow: "R→C", // Recruiter-to-Candidate flow
    modelName: "claude-sonnet-4-6",
    // Logged flag
    _logged: false,
  });

  // Track phase transitions
  const prevPhaseRef = useRef(null);
  useEffect(() => {
    const t = telemetryRef.current;
    const now = new Date().toISOString();
    const prev = prevPhaseRef.current;

    // Mark end of previous phase
    if (prev === "discovery" && phase !== "discovery") t.discoveryEnd = now;

    // Mark start of new phase
    if (phase === "discovery" && prev !== "discovery" && !t.discoveryStart) t.discoveryStart = now;
    if (phase === "synthesis" && prev !== "synthesis" && !t.synthesisStart) t.synthesisStart = now;
    if (phase === "complete" && prev !== "complete") {
      t.synthesisEnd = now;
      t.status = "Completed";
    }

    prevPhaseRef.current = phase;
  }, [phase]);

  // Log telemetry to server (uses refs to avoid stale closures in beforeunload)
  const logTelemetry = useCallback(() => {
    const t = telemetryRef.current;
    if (t._logged) return;
    t._logged = true;

    const start = new Date(t.sessionStart).getTime();
    const totalDuration = Math.round((Date.now() - start) / 1000);

    // Use refs for latest state (avoids stale closures in beforeunload)
    const currentMessages = messagesRef.current;
    const currentSections = sectionsRef.current;
    const currentSectionIdx = currentSectionRef.current;
    const currentSessionConfig = sessionConfigRef.current;
    const currentLens = lensRef.current;

    // Build transcript from messages
    const transcript = currentMessages.map((msg, idx) => ({
      role: msg.role,
      content: msg.content,
      turn: idx,
      section: currentSections[currentSectionIdx]?.id ?? null,
    }));

    const payload = {
      sessionId: t.sessionId,
      name: currentSessionConfig?.candidate_name || null,
      buildVersion: t.buildVersion,
      userAgent: t.userAgent,
      sessionStart: t.sessionStart,
      sessionEnd: new Date().toISOString(),
      totalDuration,
      status: t.status || "Abandoned",
      abandonmentPhase: t.abandonmentPhase,
      abandonmentSection: t.abandonmentSection,
      discoveryStart: t.discoveryStart,
      discoveryEnd: t.discoveryEnd,
      synthesisStart: t.synthesisStart,
      synthesisEnd: t.synthesisEnd,
      apiErrors: t.apiErrors.length > 0 ? t.apiErrors : null,
      // Transcript persistence
      transcript: transcript.length > 0 ? transcript : null,
      finalSynthesisMD: currentLens || null,
      sessionConfig: currentSessionConfig || null,
      flow: t.flow,
      modelName: t.modelName,
    };

    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    navigator.sendBeacon("/api/log-session", blob);
  }, []); // No dependencies - uses refs for latest state

  // Log telemetry when session completes successfully
  useEffect(() => {
    if (phase === "complete" && lens) {
      logTelemetry();
    }
  }, [phase, lens, logTelemetry]);

  // Abandonment detection - only on actual page unload, not tab switches
  // Note: visibilitychange was removed because it fires on tab switches,
  // incorrectly logging "Abandoned" and blocking the real completion log.
  useEffect(() => {
    const handleUnload = () => {
      const t = telemetryRef.current;
      if (t._logged) return;

      t.abandonmentPhase = phase === "loading" ? "Loading"
        : phase === "intro" ? "Intro"
        : phase === "discovery" ? "Discovery"
        : phase === "synthesis" ? "Synthesis"
        : null;

      if (phase === "discovery") {
        t.abandonmentSection = currentSection + 1;
      }

      logTelemetry();
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [phase, currentSection, logTelemetry]);

  // Track API errors
  const trackApiError = useCallback((route, statusCode, message) => {
    telemetryRef.current.apiErrors.push({
      timestamp: new Date().toISOString(),
      route,
      status_code: statusCode,
      error_message: message,
    });
  }, []);

  // ════════════════════════════════════════
  // Demo Mode Sample Data
  // ════════════════════════════════════════

  const DEMO_LENS = `---
name: Maria Gutierrez
title: Customer Success Leader
sector: Healthcare Technology
stage: Series B-C
date: April 2026
role_context: VP of Customer Success at Clarion Health
stats: "15+ years | 24-person CS org built | $40M ARR / 120% NRR | Healthcare focus"
---

## Essence

Maria builds customer success organizations that treat retention as a byproduct of genuine customer transformation — not a metric to be optimized. Her career spans enterprise healthcare technology, where she learned that the difference between a churned customer and a champion often comes down to whether someone on the vendor side truly understood the clinical workflow they were trying to change.

She is not a process-first operator. She is a relationship-first leader who builds processes to scale what she does instinctively: listen deeply, translate between technical and clinical stakeholders, and create accountability without bureaucracy. The teams she builds reflect this — people who can sit in a room with a hospital CIO and earn trust in the first fifteen minutes.

What makes her unusual is the combination of strategic altitude and operational depth. She can present to a board on NRR trends and then jump into a renewal call with a struggling account the same afternoon. Most CS leaders bifurcate into strategists or operators. Maria refuses to choose.

## Skills & Experience

Maria's career arc moves from clinical operations (hospital administration at Mount Sinai) through healthcare IT consulting (Deloitte) into customer success leadership at two healthcare SaaS companies. At MedTech Solutions, she inherited a reactive support team and rebuilt it into a proactive CS function that drove NRR from 94% to 118% over three years. At HealthCloud, she built the CS organization from scratch — hiring 24 people, establishing QBR cadence with 50+ enterprise accounts, and creating the renewal playbook that became company standard.

The clinical background matters. She speaks the language of CMOs and CNOs because she's been on their side of the table. When a customer pushes back on adoption timelines, she understands the reality of nurse scheduling, EHR integration constraints, and compliance review cycles. This fluency is rare in CS leadership.

**What Maria carries forward:** building CS organizations from zero, healthcare domain expertise, executive relationship management, renewal and expansion playbooks, cross-functional leadership between product, sales, and customer teams.

**What Maria is done with:** reactive support cultures, companies that view CS as a cost center, leadership that won't invest in customer outcomes until churn becomes a crisis.

## Values

**Clinical outcomes over vendor metrics.** Maria measures success by whether customers are actually achieving what they bought the product to do — not by whether they renewed. She has walked away from expansion opportunities when she believed the customer wasn't ready, because she knows that a premature upsell creates a detractor, not a champion. This sometimes creates tension with sales-driven cultures, and she's learned to navigate that tension by building credibility through results.

**Radical transparency with customers.** She tells customers what they need to hear, not what they want to hear. If an implementation is off track, she names it early. If a product limitation is real, she acknowledges it and works on alternatives. This candor has cost her in the short term — customers occasionally escalate when they don't like the message — but it builds the trust that drives long-term retention.

**Ownership without authority.** Maria believes that CS leaders must take ownership of outcomes they can't fully control. If churn happens, she doesn't blame product gaps or sales overpromises — she asks what CS could have done differently. This mindset attracts people who want accountability and repels people who want excuses.

## Mission & Direction

Maria is looking for a VP or SVP Customer Success role at a Series B-C healthcare technology company with 30-100 employees. The ideal company has enterprise health system customers (not clinics, not consumers), a product that requires behavior change to deliver value, and leadership that understands customer success as a strategic function rather than a support cost.

She wants to build — either from scratch or from an early foundation. A mature CS organization with established playbooks and a full team is not interesting to her. She wants the ambiguity of creating systems that don't exist yet, hiring the first team members who will shape the culture, and establishing the metrics and rhythms that will scale.

Healthcare is non-negotiable. Her fifteen years of domain expertise are her differentiator, and she's not willing to start over in a sector where she'd be learning the customer's world from scratch.

## Work Style

Maria works best with high autonomy and direct access to the executive team. She needs a CEO or COO who will engage with CS strategy, not just review dashboards. Weekly or biweekly 1:1s with her direct leader are essential — she processes out loud and uses those conversations to pressure-test decisions before rolling them out.

She's remote-first but values in-person time with her team and customers. Quarterly onsites, customer visits, and team offsites are part of how she builds culture. A fully distributed company with no travel budget would be a challenge.

Her energy comes from high-stakes customer conversations and building people. Internal meetings drain her unless they're decision-oriented. She protects her calendar aggressively and expects her team to do the same — she'll push back on meeting cultures that fill days with status updates.

Communication style: direct, fast, allergic to corporate speak. She writes short emails and expects responses within 24 hours. She gives feedback immediately, both positive and constructive. Some people find this intensity energizing; others find it exhausting. She's self-aware about this and tries to modulate for different team members, but she won't pretend to be someone she's not.

## Non-Negotiables

Base compensation below $280K signals that the company doesn't value the CS function at the executive level. She's seen what happens when CS leaders are paid like senior managers — they get treated like senior managers, excluded from strategic decisions, and set up to fail.

PE-backed companies are out. The extraction timeline corrupts the customer success function before anyone can build anything worth keeping. She's lived this twice and won't do it again.

She needs to meet the CEO before accepting any role. The relationship between CEO and CS leader determines whether the function has air cover when hard decisions need to be made. If the CEO views CS as a retention cost center rather than a growth engine, she's not interested.

Title matters less than scope, but she won't take a Director title after having been a VP. It signals a step backward to the market and creates unnecessary friction in customer relationships where executive presence matters.

## Role Fit: VP of Customer Success at Clarion Health

**Where alignment is clear.** Maria's healthcare domain expertise maps directly onto Clarion's need for someone who can speak the language of hospital CIOs and CMOs. Her experience building CS organizations from scratch — twice — matches the reality that Clarion has no CS function beyond the CEO's personal relationships. Her track record of moving NRR from mid-90s to 115%+ is exactly what Clarion needs for their Series C story.

**Where productive tension exists.** Maria is a builder who wants to create systems from scratch. Clarion's CEO, Sarah, has reportedly struggled to delegate customer relationships in the past. This could be generative friction — Maria's confidence and clinical fluency might earn Sarah's trust in ways previous attempts haven't — or it could become a source of ongoing conflict if Sarah can't let go. The COO relationship will matter here; Marcus being "the reasonable voice" suggests Maria would need to build that alliance early.

Maria's direct communication style could also create tension with a CEO who's protective of customer relationships. If Sarah interprets Maria's candor as criticism of how she's handled accounts, the first few months could be rocky. On the other hand, that same directness might be exactly what Sarah needs from a trusted partner — someone who will tell her the truth about accounts rather than just absorbing the work.

**Open questions for the conversation.** What does success look like for Sarah in the first 90 days? What would make her feel comfortable stepping back from the top 10 accounts — and what has prevented that from happening with previous hires? How does Sarah handle disagreement from her leadership team, and is there room for pushback on strategy, or does she need alignment first and input second?

For Maria: How would she approach earning Sarah's trust on accounts where Sarah has deep personal relationships? What's her playbook for the first customer conversation where Sarah has context Maria doesn't — and how would she avoid undermining the relationship while establishing her own credibility?
`;

  const DEMO_SESSION_CONFIG = {
    sessionId: "demo_clarion_vp_cs",
    metadata: {
      roleTitle: "VP of Customer Success",
      company: "Clarion Health",
    },
  };

  // ════════════════════════════════════════
  // Session Loading
  // ════════════════════════════════════════

  useEffect(() => {
    const loadSession = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);

        // Check for demo mode first
        if (urlParams.get("demo") === "true") {
          setSessionConfig(DEMO_SESSION_CONFIG);
          setLens(DEMO_LENS);
          setPhase("complete");
          return;
        }

        // Check for shareable session token in URL
        const sessionToken = urlParams.get("session");
        if (sessionToken) {
          try {
            const res = await fetch(`/api/rc-session-fetch?token=${encodeURIComponent(sessionToken)}`);

            if (res.status === 404) {
              setLoadError("This session link is not valid. Please contact the recruiter who shared it.");
              setPhase("loading");
              return;
            }

            if (res.status === 410) {
              setLoadError("This session link has expired. Please contact the recruiter for a new link.");
              setPhase("loading");
              return;
            }

            if (!res.ok) {
              const errorData = await res.json().catch(() => ({}));
              throw new Error(errorData.error || `Failed to load session (${res.status})`);
            }

            const data = await res.json();

            if (!data.sessionConfig) {
              throw new Error("Invalid session data received");
            }

            // Store in sessionStorage for state persistence
            sessionStorage.setItem("session-config", JSON.stringify(data.sessionConfig));
            if (data.recruiterRoleContext) {
              sessionStorage.setItem("recruiter-role-context", JSON.stringify(data.recruiterRoleContext));
            }

            // Store candidate data if present (fan-out sessions)
            if (data.candidate) {
              setCandidateData(data.candidate);
              // Also store in sessionStorage for state restoration
              sessionStorage.setItem("rc-candidate-data", JSON.stringify(data.candidate));
            }

            // Continue with normal loading using the fetched config
            loadConfigIntoState(data.sessionConfig);
            return;
          } catch (err) {
            console.error("[RecruiterCandidateIntake] Session fetch error:", err);
            setLoadError(err.message || "Failed to load session. Please try again or contact the recruiter.");
            setPhase("loading");
            return;
          }
        }

        // Fall back to sessionStorage (existing behavior)
        const configStr = sessionStorage.getItem("session-config");
        if (!configStr) {
          setLoadError("No session configuration found. Please start from the recruiter dashboard.");
          setPhase("loading");
          return;
        }

        // Restore candidate data from sessionStorage if present
        try {
          const candidateStr = sessionStorage.getItem("rc-candidate-data");
          if (candidateStr) {
            setCandidateData(JSON.parse(candidateStr));
          }
        } catch (e) {
          console.warn("Failed to restore candidate data:", e);
        }

        const config = JSON.parse(configStr);
        loadConfigIntoState(config);
      } catch (err) {
        console.error("[RecruiterCandidateIntake] Session load error:", err);
        setLoadError("Failed to load session configuration.");
        setPhase("loading");
      }
    };

    const loadConfigIntoState = (config) => {
      // Validate required fields
      if (!config.sessionId) {
        setLoadError("Invalid session: missing sessionId. Please regenerate from the recruiter dashboard.");
        setPhase("loading");
        return;
      }

      if (!config.foundation && !config.tailored) {
        setLoadError("Invalid session: missing sections. Please regenerate from the recruiter dashboard.");
        setPhase("loading");
        return;
      }

      // Build unified sections array from foundation + tailored
      const allSections = [];

      // Add foundation sections
      if (config.foundation && Array.isArray(config.foundation)) {
        for (const f of config.foundation) {
          const sectionId = f.sectionId || f.section || f.id;
          allSections.push({
            id: sectionId,
            label: f.label || formatSectionLabel(sectionId),
            type: "foundation",
            instruction: f.instruction,
            extractionTarget: f.extractionTarget,
            mergedWith: f.merged_with_dimension,
            timeAllocation: f.timeAllocation || "2 min",
            questions: 2, // Foundation sections are brief
          });
        }
      }

      // Add tailored sections
      if (config.tailored && Array.isArray(config.tailored)) {
        for (const t of config.tailored) {
          const dimensionId = t.dimensionId || t.id;
          allSections.push({
            id: dimensionId,
            label: t.label || formatSectionLabel(dimensionId),
            type: "tailored",
            importance: t.importance || "moderate",
            openingQuestions: t.openingQuestions,
            followUpGuidance: t.followUpGuidance,
            extractionSchema: t.extractionSchema,
            signals: t.signals,
            redFlags: t.redFlags,
            whatToExplore: t.whatToExplore,
            timeAllocation: t.timeAllocation || "3-4 min",
            questions: t.importance === "critical" ? 4 : t.importance === "high" ? 3 : 2,
          });
        }
      }

      if (allSections.length === 0) {
        setLoadError("Session has no sections defined. Please regenerate from the recruiter dashboard.");
        setPhase("loading");
        return;
      }

      // Check for saved state from this session
      try {
        const savedStr = localStorage.getItem(RC_STORAGE_KEY);
        if (savedStr) {
          const saved = JSON.parse(savedStr);
          if (saved.sessionId === config.sessionId && saved.version === STORAGE_VERSION) {
            // Restore state from same session
            setCurrentSection(saved.currentSection || 0);
            setMessages(saved.messages || []);
            setSectionData(saved.sectionData || {});
            setGreetingDone(saved.greetingDone || false);
            setSectionComplete(saved.sectionComplete || false);
            // If we were in discovery, stay there
            if (saved.phase === "discovery" && saved.currentSection < allSections.length) {
              setSections(allSections);
              setSessionConfig(config);
              setPhase("discovery");
              return;
            }
          }
        }
      } catch (e) {
        console.warn("Failed to restore saved state:", e);
      }

      setSections(allSections);
      setSessionConfig(config);
      setPhase("intro");
    };

    loadSession();
  }, []);

  // ════════════════════════════════════════
  // State Persistence
  // ════════════════════════════════════════

  useEffect(() => {
    if (phase === "loading" || !sessionConfig) return;

    const state = {
      version: STORAGE_VERSION,
      sessionId: sessionConfig.sessionId,
      phase,
      currentSection,
      messages,
      sectionData,
      greetingDone,
      sectionComplete,
      lastUpdated: Date.now(),
    };

    try {
      localStorage.setItem(RC_STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn("Failed to persist RC state:", err);
    }
  }, [phase, currentSection, messages, sectionData, greetingDone, sectionComplete, sessionConfig]);

  // ════════════════════════════════════════
  // Conversation Helpers
  // ════════════════════════════════════════

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Build established context from previous sections
  const establishedContext = useMemo(() => {
    const lines = [];
    for (const [sectionId, data] of Object.entries(sectionData)) {
      if (data && typeof data === "string" && data.trim()) {
        lines.push(`[${sectionId}]: ${data.trim()}`);
      }
    }
    return lines.join("\n\n");
  }, [sectionData]);

  // Call the rc-discover API
  async function callRCDiscover(sectionId, msgs, action = null) {
    const section = sections.find(s => s.id === sectionId);
    if (!section) throw new Error(`Section not found: ${sectionId}`);

    const res = await fetch("/api/rc-discover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionConfig,
        section,
        messages: msgs,
        action,
        context: {
          establishedContext: establishedContext || null,
          currentSectionIndex: currentSection,
          totalSections: sections.length,
        },
        // Include candidate resume if available (fan-out sessions)
        candidateMaterials: candidateData?.resumeText ? {
          resume: candidateData.resumeText,
          candidateName: candidateData.name,
        } : null,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `API error (${res.status})`);
    }

    return res.json();
  }

  // ════════════════════════════════════════
  // Section Flow
  // ════════════════════════════════════════

  async function startSection(idx) {
    setCurrentSection(idx);
    setMessages([]);
    setGreetingDone(false);
    setSectionComplete(false);
    setApiError(null);
    setLoading(true);
    setPhase("discovery");

    try {
      const sec = sections[idx];
      const data = await callRCDiscover(sec.id, [], "greeting");
      setAiGreeting(data.response);
    } catch (err) {
      console.error("startSection error:", err);
      setApiError(err.message || "Failed to start section. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Display greeting with typewriter effect
  useEffect(() => {
    if (aiGreeting && !greetingDone) {
      const timeout = setTimeout(() => {
        setMessages([{ role: "assistant", content: aiGreeting }]);
        setGreetingDone(true);
        setAiGreeting("");
        inputRef.current?.focus();
      }, aiGreeting.length * 18 + 400);
      return () => clearTimeout(timeout);
    }
  }, [aiGreeting, greetingDone]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const sec = sections[currentSection];
    const userMsg = input.trim();
    setInput("");
    const newMsgs = [...messages, { role: "user", content: userMsg }];
    setMessages(newMsgs);
    setApiError(null);
    setLoading(true);

    try {
      const data = await callRCDiscover(sec.id, newMsgs);
      const isComplete = data.sectionComplete;
      const cleanReply = data.response;

      setMessages([...newMsgs, { role: "assistant", content: cleanReply }]);

      if (isComplete) {
        // Get section summary
        const summaryData = await callRCDiscover(
          sec.id,
          [...newMsgs, { role: "assistant", content: cleanReply }],
          "summarize"
        );
        setSectionData((prev) => ({ ...prev, [sec.id]: summaryData.response }));
        setSectionComplete(true);
      }
    } catch (err) {
      console.error("sendMessage error:", err);
      setApiError(err.message || "Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function advanceSection() {
    if (currentSection < sections.length - 1) {
      startSection(currentSection + 1);
    } else {
      generateLens();
    }
  }

  // ════════════════════════════════════════
  // Lens Document Generation
  // ════════════════════════════════════════

  async function generateLens() {
    setPhase("synthesis");
    setApiError(null);
    setLensError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/rc-synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionConfig,
          sectionData,
          candidateContext: candidateData ? {
            name: candidateData.name,
            resumeText: candidateData.resumeText,
            email: candidateData.email,
          } : null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `API error (${res.status})`);
      }

      const data = await res.json();

      if (data.lens) {
        setLens(data.lens);
        setPhase("complete");
        // Clear localStorage since session is complete
        localStorage.removeItem(RC_STORAGE_KEY);
      } else {
        throw new Error(data.error || "Failed to generate lens document");
      }

    } catch (err) {
      console.error("generateLens error:", err);
      setLensError(err.message || "Failed to generate lens document. Please try again.");
      setPhase("discovery"); // Go back so user can retry
    } finally {
      setLoading(false);
    }
  }

  // ════════════════════════════════════════
  // Render: Loading / Error State
  // ════════════════════════════════════════

  if (phase === "loading") {
    if (loadError) {
      return (
        <div style={containerStyle}>
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ width: "48px", height: "2px", background: RED, margin: "0 auto 24px" }} />
            <h2 style={{ fontFamily: FONT, fontSize: "20px", fontWeight: 600, color: BLK, margin: "0 0 16px" }}>
              Session Not Found
            </h2>
            <p style={{ fontSize: "13px", color: GRY, lineHeight: 1.7, maxWidth: "400px", margin: "0 auto 28px" }}>
              {loadError}
            </p>
            <a
              href="/recruiter"
              style={{
                display: "inline-block",
                padding: "14px 28px",
                fontFamily: FONT,
                fontSize: "13px",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                background: RED,
                color: "#fff",
                textDecoration: "none",
                border: "none",
              }}
            >
              Go to Recruiter Dashboard
            </a>
          </div>
        </div>
      );
    }

    return (
      <div style={containerStyle}>
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <div style={{ width: "48px", height: "2px", background: RED, margin: "0 auto 24px" }} />
          <h2 style={{ fontFamily: FONT, fontSize: "20px", fontWeight: 600, color: BLK, margin: "0 0 12px" }}>
            Loading session...
          </h2>
          <div style={{ marginTop: "28px" }}>
            <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: "6px", height: "6px", background: RED, borderRadius: "50%",
                  animation: `pulse 0.8s ease-in-out ${i * 0.2}s infinite alternate`,
                }} />
              ))}
            </div>
          </div>
        </div>
        <style>{`
          @keyframes pulse {
            0% { opacity: 0.3; transform: scale(0.8); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    );
  }

  // ════════════════════════════════════════
  // Render: Intro Phase
  // ════════════════════════════════════════

  if (phase === "intro") {
    const meta = sessionConfig?.metadata || {};
    const intro = sessionConfig?.candidateIntro || {};
    const foundationCount = sections.filter(s => s.type === "foundation").length;
    const tailoredCount = sections.filter(s => s.type === "tailored").length;

    return (
      <div style={containerStyle}>
        {/* Header */}
        <div style={{ borderBottom: `2px solid ${BLK}`, paddingBottom: "12px", marginBottom: "28px" }}>
          <div style={{ fontSize: "10px", color: RED, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "6px", fontWeight: 600 }}>
            Candidate Discovery
          </div>
          <h1 style={{ fontFamily: FONT, fontSize: "26px", fontWeight: 700, color: BLK, margin: 0, lineHeight: 1.2 }}>
            {meta.roleTitle || "Role"} at {meta.company || "Company"}
          </h1>
          {candidateData?.name && (
            <div style={{ fontSize: "14px", color: GRY, marginTop: "8px" }}>
              Session prepared for: <strong style={{ color: BLK }}>{candidateData.name}</strong>
            </div>
          )}
        </div>

        {/* Context */}
        {intro.contextStatement && (
          <div style={{
            padding: "18px 22px",
            background: "#fafafa",
            border: `1px solid ${RULE}`,
            marginBottom: "28px",
            fontSize: "14px",
            color: "#444",
            lineHeight: 1.7,
          }}>
            {intro.contextStatement}
          </div>
        )}

        {/* Section Preview */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ fontSize: "12px", color: GRY, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "14px" }}>
            {sections.length} discovery sections
          </div>

          {/* Foundation sections */}
          {foundationCount > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "11px", color: GRY, marginBottom: "8px" }}>Foundation ({foundationCount})</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {sections.filter(s => s.type === "foundation").map((s, i) => (
                  <div key={s.id} style={{
                    padding: "6px 14px", border: `1px solid ${RULE}`, fontSize: "12px", color: "#555",
                  }}>
                    <span style={{ color: GRY, fontWeight: 600, marginRight: "6px" }}>{String(i + 1).padStart(2, "0")}</span>
                    {s.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tailored sections */}
          {tailoredCount > 0 && (
            <div>
              <div style={{ fontSize: "11px", color: GRY, marginBottom: "8px" }}>Role-Specific ({tailoredCount})</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {sections.filter(s => s.type === "tailored").map((s, i) => (
                  <div key={s.id} style={{
                    padding: "6px 14px",
                    border: `1px solid ${s.importance === "critical" ? RED : s.importance === "high" ? ORANGE : RULE}`,
                    fontSize: "12px",
                    color: "#555",
                  }}>
                    <span style={{
                      color: s.importance === "critical" ? RED : s.importance === "high" ? ORANGE : GRY,
                      fontWeight: 600,
                      marginRight: "6px",
                    }}>
                      {String(foundationCount + i + 1).padStart(2, "0")}
                    </span>
                    {s.label}
                    {s.importance === "critical" && (
                      <span style={{ fontSize: "9px", color: RED, marginLeft: "6px", fontWeight: 600 }}>CRITICAL</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ height: "1px", background: RULE, marginBottom: "28px" }} />

        {/* Time estimate */}
        <div style={{ textAlign: "center", padding: "20px" }}>
          <div style={{
            padding: "14px 24px",
            border: `1px solid ${RULE}`,
            display: "inline-block",
            fontSize: "12px",
            color: GRY,
            lineHeight: 1.6,
            marginBottom: "28px",
          }}>
            Estimated time: <span style={{ color: BLK, fontWeight: 500 }}>
              {meta.estimatedDuration || "15-25 minutes"}
            </span>
          </div>
        </div>

        {/* Privacy notice */}
        <div style={{
          borderTop: `1px solid ${RULE}`,
          borderBottom: `1px solid ${RULE}`,
          padding: "16px 0",
          marginBottom: "24px",
        }}>
          <div style={{
            fontSize: "11px",
            color: RED,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontWeight: 600,
            marginBottom: "8px",
          }}>
            Privacy
          </div>
          <p style={{
            fontSize: "12px",
            color: GRY,
            lineHeight: 1.6,
            margin: 0,
          }}>
            This session is recorded to improve the Lens experience.
            Your conversation and lens document are stored securely.
            Data is not sold or shared with third parties.
          </p>
        </div>

        {/* Start button */}
        <div style={{ borderTop: `2px solid ${BLK}`, paddingTop: "20px" }}>
          <button
            onClick={() => startSection(0)}
            style={{
              width: "100%",
              padding: "14px",
              fontFamily: FONT,
              fontSize: "13px",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              background: RED,
              color: "#fff",
              border: `1.5px solid ${RED}`,
              cursor: "pointer",
              borderRadius: 0,
            }}
          >
            Begin Discovery
          </button>
          <a
            href="/recruiter"
            style={{
              display: "block",
              textAlign: "center",
              padding: "12px",
              fontFamily: FONT,
              fontSize: "12px",
              fontWeight: 500,
              color: GRY,
              textDecoration: "none",
              marginTop: "8px",
            }}
          >
            &larr; Back to recruiter dashboard
          </a>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════
  // Render: Discovery Phase
  // ════════════════════════════════════════

  if (phase === "discovery") {
    const sec = sections[currentSection];
    const meta = sessionConfig?.metadata || {};
    const progressPercent = sections.length > 0 ? Math.round(((currentSection + 1) / sections.length) * 100) : 0;

    return (
      <div style={containerStyle}>
        {/* Progress bar */}
        <div style={{ height: "3px", background: RULE, marginBottom: "20px" }}>
          <div style={{
            width: `${progressPercent}%`,
            height: "100%",
            background: RED,
            transition: "width 0.3s ease",
          }} />
        </div>

        {/* Role context header */}
        <div style={{ borderBottom: `1px solid ${RULE}`, paddingBottom: "12px", marginBottom: "16px" }}>
          <div style={{ fontSize: "11px", color: GRY, letterSpacing: "0.06em" }}>
            {meta.roleTitle} at {meta.company}
          </div>
        </div>

        {/* Section header */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "4px" }}>
            <span style={{
              color: sec.type === "tailored" && sec.importance === "critical" ? RED : ORANGE,
              fontWeight: 700,
              fontSize: "14px",
              fontVariantNumeric: "tabular-nums",
            }}>
              {String(currentSection + 1).padStart(2, "0")}
            </span>
            <span style={{ fontSize: "18px", fontWeight: 600, color: BLK }}>{sec.label}</span>
            {sec.type === "tailored" && sec.importance && (
              <span style={{
                fontSize: "10px",
                fontWeight: 600,
                color: sec.importance === "critical" ? RED : sec.importance === "high" ? ORANGE : GRY,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}>
                {sec.importance}
              </span>
            )}
          </div>
          <div style={{ fontSize: "12px", color: GRY }}>
            Section {currentSection + 1} of {sections.length}
          </div>
        </div>

        {/* Messages */}
        <div style={{
          minHeight: "280px",
          maxHeight: "50vh",
          overflowY: "auto",
          marginBottom: "20px",
          padding: "4px 0",
        }}>
          {/* Typewriter greeting */}
          {aiGreeting && !greetingDone && (
            <div style={{
              padding: "14px 18px",
              background: "#fafafa",
              border: `1px solid ${RULE}`,
              marginBottom: "12px",
              fontSize: "14px",
              color: BLK,
              lineHeight: 1.7,
            }}>
              <TypewriterText text={aiGreeting} speed={18} />
            </div>
          )}

          {/* Conversation history */}
          {messages.map((msg, i) => (
            <div key={i} style={{
              padding: "14px 18px",
              background: msg.role === "assistant" ? "#fafafa" : BLK,
              border: `1px solid ${msg.role === "assistant" ? RULE : BLK}`,
              marginBottom: "12px",
              fontSize: "14px",
              color: msg.role === "assistant" ? BLK : "#fff",
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
            }}>
              {msg.content}
            </div>
          ))}

          {/* Loading indicator */}
          {loading && greetingDone && (
            <div style={{
              padding: "14px 18px",
              background: "#fafafa",
              border: `1px solid ${RULE}`,
              marginBottom: "12px",
            }}>
              <div style={{ display: "flex", gap: "4px" }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{
                    width: "6px", height: "6px", background: RED, borderRadius: "50%",
                    animation: `pulse 0.6s ease-in-out ${i * 0.15}s infinite alternate`,
                  }} />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error display */}
        {apiError && (
          <div style={{
            padding: "12px 16px",
            background: "#fff5f5",
            border: `1px solid ${RED}`,
            marginBottom: "16px",
            fontSize: "13px",
            color: RED,
          }}>
            <strong>Error:</strong> {apiError}
          </div>
        )}

        {/* Input or section complete */}
        {sectionComplete ? (
          <div style={{ borderTop: `2px solid ${BLK}`, paddingTop: "20px" }}>
            <div style={{
              padding: "14px 18px",
              background: "#f8fff8",
              border: `1px solid #2D6A2D`,
              marginBottom: "16px",
              fontSize: "13px",
              color: "#2D6A2D",
            }}>
              Section complete. Ready to continue.
            </div>
            <button
              onClick={advanceSection}
              style={{
                width: "100%",
                padding: "14px",
                fontFamily: FONT,
                fontSize: "13px",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                background: RED,
                color: "#fff",
                border: `1.5px solid ${RED}`,
                cursor: "pointer",
                borderRadius: 0,
              }}
            >
              {currentSection < sections.length - 1 ? "Next Section" : "Generate Lens"}
            </button>
          </div>
        ) : (
          <div style={{ borderTop: `1px solid ${RULE}`, paddingTop: "16px" }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Type your response..."
                disabled={loading || !greetingDone}
                style={{
                  flex: 1,
                  padding: "14px 16px",
                  fontFamily: FONT,
                  fontSize: "14px",
                  border: `1.5px solid #ddd`,
                  borderRadius: 0,
                  outline: "none",
                  color: BLK,
                  background: loading || !greetingDone ? "#f5f5f5" : "#fff",
                }}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !greetingDone || !input.trim()}
                style={{
                  padding: "14px 24px",
                  fontFamily: FONT,
                  fontSize: "13px",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  background: loading || !input.trim() ? GRY : RED,
                  color: "#fff",
                  border: "none",
                  cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                  borderRadius: 0,
                }}
              >
                Send
              </button>
            </div>
          </div>
        )}

        <style>{`
          @keyframes pulse {
            0% { opacity: 0.3; transform: scale(0.8); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    );
  }

  // ════════════════════════════════════════
  // Render: Synthesis Phase
  // ════════════════════════════════════════

  if (phase === "synthesis") {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <div style={{ width: "48px", height: "2px", background: RED, margin: "0 auto 24px" }} />
          <h2 style={{ fontFamily: FONT, fontSize: "20px", fontWeight: 600, color: BLK, margin: "0 0 12px" }}>
            Generating Lens Document
          </h2>
          <p style={{ fontSize: "13px", color: GRY, lineHeight: 1.7 }}>
            Synthesizing discovery conversation into your professional identity document...
          </p>
          <div style={{ marginTop: "28px" }}>
            <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: "6px", height: "6px", background: RED, borderRadius: "50%",
                  animation: `pulse 0.8s ease-in-out ${i * 0.2}s infinite alternate`,
                }} />
              ))}
            </div>
          </div>

          {lensError && (
            <div style={{
              marginTop: "32px",
              padding: "14px 18px",
              background: "#fff5f5",
              border: `1px solid ${RED}`,
              fontSize: "13px",
              color: RED,
              textAlign: "left",
            }}>
              <strong>Error:</strong> {lensError}
              <button
                onClick={generateLens}
                style={{
                  display: "block",
                  marginTop: "12px",
                  padding: "10px 20px",
                  fontFamily: FONT,
                  fontSize: "12px",
                  fontWeight: 600,
                  background: RED,
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
        <style>{`
          @keyframes pulse {
            0% { opacity: 0.3; transform: scale(0.8); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    );
  }

  // ════════════════════════════════════════
  // Render: Complete Phase (Lens Document Display)
  // ════════════════════════════════════════

  if (phase === "complete" && lens) {
    const meta = sessionConfig?.metadata || {};

    // Simple markdown renderer for lens document
    const renderMarkdown = (md) => {
      if (!md) return null;

      const lines = md.split("\n");
      const elements = [];
      let currentParagraph = [];
      let inYamlFrontmatter = false;
      let yamlContent = [];

      // Render inline markdown (bold, italic)
      const renderInlineMarkdown = (text) => {
        // Split on bold (**text**) and italic (*text*) patterns
        const parts = [];
        let remaining = text;
        let key = 0;

        while (remaining.length > 0) {
          // Bold first (greedy match for **)
          const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
          // Italic (single *)
          const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/);

          if (boldMatch && (!italicMatch || boldMatch.index <= italicMatch.index)) {
            if (boldMatch.index > 0) {
              parts.push(<span key={key++}>{remaining.slice(0, boldMatch.index)}</span>);
            }
            parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
            remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
          } else if (italicMatch) {
            if (italicMatch.index > 0) {
              parts.push(<span key={key++}>{remaining.slice(0, italicMatch.index)}</span>);
            }
            parts.push(<em key={key++}>{italicMatch[1]}</em>);
            remaining = remaining.slice(italicMatch.index + italicMatch[0].length);
          } else {
            parts.push(<span key={key++}>{remaining}</span>);
            break;
          }
        }

        return parts.length > 0 ? parts : text;
      };

      const flushParagraph = () => {
        if (currentParagraph.length > 0) {
          const text = currentParagraph.join(" ").trim();
          if (text) {
            elements.push(
              <p key={elements.length} style={{ fontSize: "14px", color: "#333", lineHeight: 1.8, margin: "0 0 16px" }}>
                {renderInlineMarkdown(text)}
              </p>
            );
          }
          currentParagraph = [];
        }
      };

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Handle YAML frontmatter
        if (line.trim() === "---") {
          if (!inYamlFrontmatter && yamlContent.length === 0) {
            inYamlFrontmatter = true;
            continue;
          } else if (inYamlFrontmatter) {
            inYamlFrontmatter = false;
            // Render YAML as stats bar
            const statsLine = yamlContent.find(l => l.startsWith("stats:"));
            const roleLine = yamlContent.find(l => l.startsWith("role_context:"));
            if (statsLine || roleLine) {
              elements.push(
                <div key={elements.length} style={{
                  padding: "16px 20px",
                  background: "#fafafa",
                  border: `1px solid ${RULE}`,
                  marginBottom: "24px",
                  fontSize: "13px",
                  color: GRY,
                }}>
                  {statsLine && (
                    <div style={{ fontWeight: 500, color: BLK }}>
                      {statsLine.replace("stats:", "").trim().replace(/"/g, "")}
                    </div>
                  )}
                  {roleLine && (
                    <div style={{ marginTop: "8px", fontSize: "12px" }}>
                      Role context: {roleLine.replace("role_context:", "").trim().replace(/"/g, "")}
                    </div>
                  )}
                </div>
              );
            }
            yamlContent = [];
            continue;
          }
        }

        if (inYamlFrontmatter) {
          yamlContent.push(line);
          continue;
        }

        // H2 headers
        if (line.startsWith("## ")) {
          flushParagraph();
          const headerText = line.replace("## ", "").trim();
          const isRoleFit = headerText.toLowerCase().startsWith("role fit");
          elements.push(
            <h2 key={elements.length} style={{
              fontFamily: FONT,
              fontSize: "18px",
              fontWeight: 700,
              color: isRoleFit ? RED : BLK,
              margin: "32px 0 16px",
              paddingBottom: "8px",
              borderBottom: isRoleFit ? `2px solid ${RED}` : `1px solid ${RULE}`,
            }}>
              {headerText}
            </h2>
          );
          continue;
        }

        // H1 headers (usually just the name)
        if (line.startsWith("# ")) {
          flushParagraph();
          elements.push(
            <h1 key={elements.length} style={{
              fontFamily: FONT,
              fontSize: "24px",
              fontWeight: 700,
              color: BLK,
              margin: "0 0 8px",
            }}>
              {line.replace("# ", "").trim()}
            </h1>
          );
          continue;
        }

        // Empty line = paragraph break
        if (line.trim() === "") {
          flushParagraph();
          continue;
        }

        // Regular text
        currentParagraph.push(line);
      }

      flushParagraph();
      return elements;
    };

    return (
      <div style={containerStyle}>
        {/* Header */}
        <div style={{ borderBottom: `2px solid ${BLK}`, paddingBottom: "12px", marginBottom: "28px" }}>
          <div style={{ fontSize: "10px", color: RED, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "6px", fontWeight: 600 }}>
            Candidate Lens
          </div>
          <h1 style={{ fontFamily: FONT, fontSize: "24px", fontWeight: 700, color: BLK, margin: 0, lineHeight: 1.2 }}>
            {meta.roleTitle} at {meta.company}
          </h1>
          <div style={{ fontSize: "12px", color: GRY, marginTop: "8px" }}>
            Generated {new Date().toLocaleDateString()}
          </div>
        </div>

        {/* Lens Document */}
        <div style={{ marginBottom: "28px" }}>
          {renderMarkdown(lens)}
        </div>

        {/* Actions */}
        <div style={{ borderTop: `2px solid ${BLK}`, paddingTop: "20px" }}>
          <button
            onClick={() => {
              navigator.clipboard.writeText(lens);
            }}
            style={{
              width: "100%",
              padding: "14px",
              fontFamily: FONT,
              fontSize: "13px",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              background: "#fff",
              color: BLK,
              border: `1.5px solid ${BLK}`,
              cursor: "pointer",
              borderRadius: 0,
              marginBottom: "12px",
            }}
          >
            Copy Lens Markdown
          </button>
          <a
            href="/recruiter"
            style={{
              display: "block",
              width: "100%",
              padding: "14px",
              fontFamily: FONT,
              fontSize: "13px",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              textAlign: "center",
              background: RED,
              color: "#fff",
              textDecoration: "none",
              borderRadius: 0,
              boxSizing: "border-box",
            }}
          >
            Start New Session
          </a>
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}
