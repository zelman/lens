"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

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

// ════════════════════════════════════════
// Main Component
// ════════════════════════════════════════

export default function RecruiterCandidateIntake() {
  // ── Core state ──
  const [phase, setPhase] = useState("loading"); // loading → intro → discovery → synthesis → complete
  const [sessionConfig, setSessionConfig] = useState(null);
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

  // ── Section data for scorecard ──
  const [sectionData, setSectionData] = useState({}); // { sectionId: summary }

  // ── Scorecard output ──
  const [scorecard, setScorecard] = useState(null);
  const [scorecardError, setScorecardError] = useState(null);

  // ── Refs ──
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // ════════════════════════════════════════
  // Session Loading
  // ════════════════════════════════════════

  useEffect(() => {
    const loadSession = () => {
      try {
        const configStr = sessionStorage.getItem("session-config");
        if (!configStr) {
          setLoadError("No session configuration found. Please start from the recruiter dashboard.");
          setPhase("loading");
          return;
        }

        const config = JSON.parse(configStr);

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
            allSections.push({
              id: f.sectionId || f.section || f.id,
              label: f.label || f.section || f.sectionId,
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
            allSections.push({
              id: t.dimensionId || t.id,
              label: t.label || t.dimensionId,
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

      } catch (err) {
        console.error("Failed to load session config:", err);
        setLoadError("Failed to load session. Please try again.");
        setPhase("loading");
      }
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
      generateScorecard();
    }
  }

  // ════════════════════════════════════════
  // Scorecard Generation
  // ════════════════════════════════════════

  async function generateScorecard() {
    setPhase("synthesis");
    setApiError(null);
    setScorecardError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/rc-synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionConfig,
          sectionData,
          candidateContext: null, // Could be enhanced with candidate name, etc.
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `API error (${res.status})`);
      }

      const data = await res.json();

      if (data.scorecard) {
        setScorecard(data.scorecard);
        setPhase("complete");
        // Clear localStorage since session is complete
        localStorage.removeItem(RC_STORAGE_KEY);
      } else {
        throw new Error(data.error || "Failed to generate scorecard");
      }

    } catch (err) {
      console.error("generateScorecard error:", err);
      setScorecardError(err.message || "Failed to generate scorecard. Please try again.");
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
              background: msg.role === "assistant" ? "#fafafa" : "#fff",
              border: `1px solid ${msg.role === "assistant" ? RULE : "#ddd"}`,
              marginBottom: "12px",
              fontSize: "14px",
              color: BLK,
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
              {currentSection < sections.length - 1 ? "Next Section" : "Generate Scorecard"}
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
            Generating Scorecard
          </h2>
          <p style={{ fontSize: "13px", color: GRY, lineHeight: 1.7 }}>
            Synthesizing discovery conversation into candidate assessment...
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

          {scorecardError && (
            <div style={{
              marginTop: "32px",
              padding: "14px 18px",
              background: "#fff5f5",
              border: `1px solid ${RED}`,
              fontSize: "13px",
              color: RED,
              textAlign: "left",
            }}>
              <strong>Error:</strong> {scorecardError}
              <button
                onClick={generateScorecard}
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
  // Render: Complete Phase (Scorecard Display)
  // ════════════════════════════════════════

  if (phase === "complete" && scorecard) {
    const meta = sessionConfig?.metadata || {};
    const overall = scorecard.overallAssessment || {};
    const dimensions = scorecard.dimensionScores || [];

    const fitColors = {
      5: "#2D6A2D", // Strong Fit
      4: "#4A7C59", // Good Fit
      3: ORANGE,    // Moderate Fit
      2: "#CC4A00", // Weak Fit
      1: RED,       // Poor Fit
    };

    return (
      <div style={containerStyle}>
        {/* Header */}
        <div style={{ borderBottom: `2px solid ${BLK}`, paddingBottom: "12px", marginBottom: "28px" }}>
          <div style={{ fontSize: "10px", color: RED, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "6px", fontWeight: 600 }}>
            Candidate Scorecard
          </div>
          <h1 style={{ fontFamily: FONT, fontSize: "24px", fontWeight: 700, color: BLK, margin: 0, lineHeight: 1.2 }}>
            {meta.roleTitle} at {meta.company}
          </h1>
          <div style={{ fontSize: "12px", color: GRY, marginTop: "8px" }}>
            Generated {new Date(scorecard.generatedAt || Date.now()).toLocaleDateString()}
          </div>
        </div>

        {/* Overall Assessment */}
        <div style={{
          padding: "20px 24px",
          background: "#fafafa",
          border: `2px solid ${fitColors[overall.fitScore] || GRY}`,
          marginBottom: "28px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
            <div>
              <div style={{ fontSize: "11px", color: GRY, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "4px" }}>
                Overall Fit
              </div>
              <div style={{
                fontSize: "28px",
                fontWeight: 700,
                color: fitColors[overall.fitScore] || BLK,
              }}>
                {overall.fitLabel || `${overall.fitScore}/5`}
              </div>
            </div>
            <div style={{
              padding: "8px 16px",
              background: fitColors[overall.fitScore] || GRY,
              color: "#fff",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.06em",
            }}>
              {overall.recommendation || "Assessment Complete"}
            </div>
          </div>

          {overall.summary && (
            <p style={{ fontSize: "14px", color: "#444", lineHeight: 1.7, margin: "0 0 16px" }}>
              {overall.summary}
            </p>
          )}

          <div style={{ display: "flex", gap: "24px" }}>
            {overall.topStrengths?.length > 0 && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "11px", color: "#2D6A2D", fontWeight: 600, marginBottom: "6px" }}>
                  Top Strengths
                </div>
                <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "13px", color: "#444", lineHeight: 1.6 }}>
                  {overall.topStrengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
            {overall.topConcerns?.length > 0 && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "11px", color: RED, fontWeight: 600, marginBottom: "6px" }}>
                  Top Concerns
                </div>
                <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "13px", color: "#444", lineHeight: 1.6 }}>
                  {overall.topConcerns.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Dimension Scores */}
        {dimensions.length > 0 && (
          <div style={{ marginBottom: "28px" }}>
            <div style={{ fontSize: "12px", color: GRY, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "14px" }}>
              Dimension Scores
            </div>

            {dimensions.map((dim, i) => (
              <div key={dim.dimensionId || i} style={{
                padding: "16px 20px",
                border: `1px solid ${RULE}`,
                marginBottom: "12px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div>
                    <span style={{ fontWeight: 600, color: BLK }}>{dim.label || dim.dimensionId}</span>
                    {dim.importance && (
                      <span style={{
                        fontSize: "10px",
                        color: dim.importance === "critical" ? RED : dim.importance === "high" ? ORANGE : GRY,
                        marginLeft: "8px",
                        fontWeight: 600,
                      }}>
                        {dim.importance.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{
                      fontSize: "10px",
                      color: dim.signalStrength === "strong" ? "#2D6A2D" : dim.signalStrength === "moderate" ? ORANGE : RED,
                      fontWeight: 600,
                    }}>
                      {dim.signalStrength?.toUpperCase() || "N/A"}
                    </span>
                    <span style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      color: fitColors[dim.score] || GRY,
                    }}>
                      {dim.score}/5
                    </span>
                  </div>
                </div>

                {dim.evidence && (
                  <p style={{ fontSize: "13px", color: "#555", lineHeight: 1.6, margin: "0 0 8px" }}>
                    {dim.evidence}
                  </p>
                )}

                {dim.signalsMatched?.length > 0 && (
                  <div style={{ fontSize: "11px", color: "#2D6A2D", marginTop: "6px" }}>
                    Signals matched: {dim.signalsMatched.join(", ")}
                  </div>
                )}

                {dim.redFlagsTriggered?.length > 0 && (
                  <div style={{ fontSize: "11px", color: RED, marginTop: "4px" }}>
                    Red flags: {dim.redFlagsTriggered.join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Recruiter Notes */}
        {scorecard.recruiterNotes && (
          <div style={{
            padding: "18px 22px",
            background: "#fffaf5",
            border: `1px solid ${ORANGE}33`,
            marginBottom: "28px",
          }}>
            <div style={{ fontSize: "12px", color: ORANGE, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "12px" }}>
              Recruiter Notes
            </div>

            {scorecard.recruiterNotes.suggestedProbes?.length > 0 && (
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "11px", color: GRY, marginBottom: "4px" }}>Suggested follow-up questions:</div>
                <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "13px", color: "#444", lineHeight: 1.6 }}>
                  {scorecard.recruiterNotes.suggestedProbes.map((q, i) => <li key={i}>{q}</li>)}
                </ul>
              </div>
            )}

            {scorecard.recruiterNotes.contextForClient && (
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "11px", color: GRY, marginBottom: "4px" }}>Context for hiring manager:</div>
                <p style={{ margin: 0, fontSize: "13px", color: "#444", lineHeight: 1.6 }}>
                  {scorecard.recruiterNotes.contextForClient}
                </p>
              </div>
            )}

            {scorecard.recruiterNotes.riskFactors?.length > 0 && (
              <div>
                <div style={{ fontSize: "11px", color: RED, marginBottom: "4px" }}>Risk factors:</div>
                <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "13px", color: "#444", lineHeight: 1.6 }}>
                  {scorecard.recruiterNotes.riskFactors.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ borderTop: `2px solid ${BLK}`, paddingTop: "20px" }}>
          <button
            onClick={() => {
              const json = JSON.stringify(scorecard, null, 2);
              navigator.clipboard.writeText(json);
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
            Copy Scorecard JSON
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
