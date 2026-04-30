"use client";

import { useState, useCallback } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from "recharts";

const VERSION = "2.2";

// Demo data for testing radar chart
const DEMO_DATA = {
  A: {
    candidateName: "Sarah Chen",
    total_score: 84,
    classification: "STRONG FIT",
    briefing: "Former VP CS at Series B healthcare SaaS. Built team from 3 to 22. Strong operator with builder DNA. Values alignment on patient outcomes. High energy match.",
    dimensions: {
      mission: { score: 92, confidence: "high", evidence: "Deep healthcare background, patient-first language throughout" },
      role: { score: 88, confidence: "high", evidence: "VP-level experience, scaled CS org 7x" },
      culture: { score: 78, confidence: "medium", evidence: "Collaborative but prefers structured environments" },
      skill: { score: 85, confidence: "high", evidence: "Strong metrics orientation, Gainsight certified" },
      work_style: { score: 72, confidence: "medium", evidence: "Prefers async, may need adjustment for high-touch exec team" },
      energy: { score: 88, confidence: "high", evidence: "Marathon runner, built previous team during hypergrowth" },
    },
  },
  B: {
    candidateName: "Marcus Johnson",
    total_score: 71,
    classification: "GOOD FIT",
    briefing: "Director CS at enterprise fintech. Strong process builder but less startup experience. Cultural fit concerns around ambiguity tolerance.",
    dimensions: {
      mission: { score: 65, confidence: "medium", evidence: "Fintech background, healthcare interest unclear" },
      role: { score: 82, confidence: "high", evidence: "Director-level, managed 15 CSMs" },
      culture: { score: 58, confidence: "medium", evidence: "Enterprise mindset, may struggle with startup pace" },
      skill: { score: 90, confidence: "high", evidence: "Exceptional renewals track record, 97% NRR" },
      work_style: { score: 68, confidence: "medium", evidence: "Process-heavy, needs defined playbooks" },
      energy: { score: 72, confidence: "medium", evidence: "Steady performer, not a sprinter" },
    },
  },
  C: {
    candidateName: "Elena Rodriguez",
    total_score: 76,
    classification: "GOOD FIT",
    briefing: "Head of CS at early-stage health-tech. Scrappy builder, strong mission alignment. Less experience at scale but high growth trajectory.",
    dimensions: {
      mission: { score: 95, confidence: "high", evidence: "Healthcare passion evident, previous nonprofit board work" },
      role: { score: 70, confidence: "medium", evidence: "Head of CS but smaller team (8), first VP role would be stretch" },
      culture: { score: 88, confidence: "high", evidence: "Thrives in ambiguity, startup DNA" },
      skill: { score: 72, confidence: "medium", evidence: "Good instincts, less formal training" },
      work_style: { score: 85, confidence: "high", evidence: "Highly adaptable, remote-first experience" },
      energy: { score: 80, confidence: "high", evidence: "High energy, may need sustainability coaching" },
    },
  },
};

// Design tokens - International Style
const COLORS = {
  bg: "#FFFFFF",
  text: "#1A1A1A",
  red: "#D93025",
  rule: "#EEEEEE",
  muted: "#888888",
  orange: "#E8590C",
};

// Candidate colors (fixed)
const CANDIDATE_COLORS = {
  A: "#D93025", // red
  B: "#1A1A1A", // black
  C: "#888888", // gray
};

// Classification colors
const CLASSIFICATION_COLORS = {
  "STRONG FIT": "#1a7a2e",
  "GOOD FIT": "#E8590C",
  MARGINAL: "#996600",
  SKIP: "#444444",
  "POOR FIT": "#D93025",
};

// Radar dimensions (clockwise from top)
const DIMENSIONS = [
  { key: "mission", label: "Mission" },
  { key: "role", label: "Role" },
  { key: "culture", label: "Culture" },
  { key: "skill", label: "Skill" },
  { key: "work_style", label: "Work Style" },
  { key: "energy", label: "Energy" },
];

// Gate tolerance levels
const GATE_LEVELS = ["Strict", "Standard", "Flexible"];
const DEPTH_LEVELS = ["Surface", "Balanced", "Deep"];

// Gate tolerance helper text
const GATE_HELPER_TEXT = {
  Strict: "Hard requirements enforced. Gaps in any dimension reduce composite significantly.",
  Standard: "Balanced evaluation. Minor gaps are weighted but not disqualifying.",
  Flexible: "Emphasis on signal strength. Gaps in lower-weight dimensions are tolerated.",
};

// Weight multipliers per mode (from role-lens-scorer.jsx logic)
// Base weights: role=25, culture=22, skill=18, mission=15, work_style=12, energy=8 (total=100)
const BASE_WEIGHTS = {
  mission: 15,
  role: 25,
  culture: 22,
  skill: 18,
  work_style: 12,
  energy: 8,
};

// Mode adjustments: gate affects threshold interpretation, depth affects weight distribution
const MODE_ADJUSTMENTS = {
  "Strict-Surface": { mission: 1.0, role: 1.2, culture: 0.9, skill: 1.1, work_style: 0.8, energy: 0.8 },
  "Strict-Balanced": { mission: 1.0, role: 1.1, culture: 1.0, skill: 1.0, work_style: 0.9, energy: 0.9 },
  "Strict-Deep": { mission: 1.1, role: 1.0, culture: 1.1, skill: 0.9, work_style: 1.0, energy: 1.0 },
  "Standard-Surface": { mission: 0.9, role: 1.1, culture: 0.9, skill: 1.1, work_style: 0.9, energy: 0.9 },
  "Standard-Balanced": { mission: 1.0, role: 1.0, culture: 1.0, skill: 1.0, work_style: 1.0, energy: 1.0 },
  "Standard-Deep": { mission: 1.1, role: 0.9, culture: 1.1, skill: 0.9, work_style: 1.1, energy: 1.0 },
  "Flexible-Surface": { mission: 0.8, role: 1.0, culture: 0.8, skill: 1.2, work_style: 0.9, energy: 0.8 },
  "Flexible-Balanced": { mission: 0.9, role: 0.9, culture: 1.0, skill: 1.0, work_style: 1.1, energy: 1.0 },
  "Flexible-Deep": { mission: 1.0, role: 0.8, culture: 1.1, skill: 0.9, work_style: 1.2, energy: 1.1 },
};

// Calculate adjusted score based on mode
function calculateAdjustedScore(dimensions, gate, depth) {
  if (!dimensions) return null;
  const modeKey = `${gate}-${depth}`;
  const adjustments = MODE_ADJUSTMENTS[modeKey] || MODE_ADJUSTMENTS["Standard-Balanced"];

  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const dim of DIMENSIONS) {
    const rawScore = dimensions[dim.key]?.score;
    if (typeof rawScore !== "number") continue;
    const baseWeight = BASE_WEIGHTS[dim.key];
    const adjustment = adjustments[dim.key];
    const adjustedWeight = baseWeight * adjustment;
    totalWeightedScore += rawScore * adjustment;
    totalWeight += adjustedWeight;
  }

  if (totalWeight === 0) return null;
  return Math.round((totalWeightedScore / totalWeight) * 100);
}

// Validate score JSON structure
function validateScoreData(data) {
  if (typeof data !== "object" || data === null) {
    return { valid: false, error: "Invalid JSON object" };
  }
  if (data.disqualified === true) {
    return { valid: true };
  }
  if (typeof data.total_score !== "number") {
    return { valid: false, error: "Missing total_score" };
  }
  if (!data.dimensions && !data.scores) {
    return { valid: false, error: "Missing dimensions or scores" };
  }
  return { valid: true };
}

// Extract dimensions from score data (handles both formats)
function extractDimensions(scoreData) {
  if (scoreData.dimensions) {
    return scoreData.dimensions;
  }
  if (scoreData.scores) {
    const DIMENSION_MAP = {
      builder_orientation: "role",
      relational_fit: "culture",
      domain_fluency: "skill",
      values_alignment: "mission",
      work_style_compatibility: "work_style",
      energy_match: "energy",
    };
    const dims = {};
    for (const [oldKey, newKey] of Object.entries(DIMENSION_MAP)) {
      const s = scoreData.scores[oldKey];
      if (s) {
        const max = s.max || 25;
        dims[newKey] = {
          score: Math.round((s.score / max) * 100),
          confidence: s.confidence,
          evidence: s.rationale,
        };
      }
    }
    return dims;
  }
  return null;
}

// Truncate text at word boundary
function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text || "";
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > maxLength * 0.7 ? truncated.substring(0, lastSpace) : truncated) + "...";
}

export default function RecruiterComparison() {
  const [roleInput, setRoleInput] = useState("");
  const [candidates, setCandidates] = useState([
    { id: "A", state: "empty", inputMode: "session", inputValue: "", data: null, error: null },
    { id: "B", state: "empty", inputMode: "session", inputValue: "", data: null, error: null },
    { id: "C", state: "empty", inputMode: "session", inputValue: "", data: null, error: null },
  ]);
  const [spreadMode, setSpreadMode] = useState(false);
  const [gate, setGate] = useState("Standard");
  const [depth, setDepth] = useState("Balanced");

  const updateCandidate = useCallback((index, updates) => {
    setCandidates((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  }, []);

  const loadSession = async (index) => {
    const candidate = candidates[index];
    const sessionId = candidate.inputValue.trim();

    if (!sessionId) {
      updateCandidate(index, { error: "Enter a session ID" });
      return;
    }

    updateCandidate(index, { error: null, state: "loading" });

    try {
      const response = await fetch(`/api/get-session?id=${encodeURIComponent(sessionId)}`);
      const data = await response.json();

      if (!response.ok) {
        updateCandidate(index, { state: "empty", error: data.error || "Failed to load session" });
        return;
      }

      if (data.status === "awaiting") {
        updateCandidate(index, {
          state: "awaiting",
          data: { status: "awaiting", candidateName: data.candidateName },
          error: null,
        });
      } else if (data.status === "in_progress") {
        updateCandidate(index, {
          state: "in_progress",
          data: { status: "in_progress", candidateName: data.candidateName },
          error: null,
        });
      } else if (data.status === "complete" && data.score) {
        const dimensions = extractDimensions(data.score);
        updateCandidate(index, {
          state: "ready",
          data: {
            ...data.score,
            candidateName: data.candidateName || data.score.candidateName,
            dimensions,
          },
          error: null,
        });
      } else {
        updateCandidate(index, { state: "empty", error: "Session has no score data" });
      }
    } catch (err) {
      updateCandidate(index, { state: "empty", error: err.message || "Network error" });
    }
  };

  const loadFromPaste = (index) => {
    const candidate = candidates[index];
    const jsonText = candidate.inputValue.trim();

    if (!jsonText) {
      updateCandidate(index, { error: "Paste JSON data" });
      return;
    }

    try {
      const parsed = JSON.parse(jsonText);
      const validation = validateScoreData(parsed);

      if (!validation.valid) {
        updateCandidate(index, { error: validation.error });
        return;
      }

      // Extract or preserve dimensions
      const dimensions = extractDimensions(parsed);

      // Build data object, ensuring dimensions are set
      const data = {
        ...parsed,
        dimensions: dimensions || parsed.dimensions || null,
      };

      updateCandidate(index, {
        state: "ready",
        data,
        error: null,
      });
    } catch (err) {
      updateCandidate(index, { error: "Invalid JSON" });
    }
  };

  const clearCandidate = (index) => {
    updateCandidate(index, {
      state: "empty",
      inputMode: "session",
      inputValue: "",
      data: null,
      error: null,
    });
  };

  const clearAll = () => {
    setCandidates([
      { id: "A", state: "empty", inputMode: "session", inputValue: "", data: null, error: null },
      { id: "B", state: "empty", inputMode: "session", inputValue: "", data: null, error: null },
      { id: "C", state: "empty", inputMode: "session", inputValue: "", data: null, error: null },
    ]);
    setRoleInput("");
    setGate("Standard");
    setDepth("Balanced");
    setSpreadMode(false);
  };

  const loadDemo = () => {
    setCandidates([
      { id: "A", state: "ready", inputMode: "session", inputValue: "", data: DEMO_DATA.A, error: null },
      { id: "B", state: "ready", inputMode: "session", inputValue: "", data: DEMO_DATA.B, error: null },
      { id: "C", state: "ready", inputMode: "session", inputValue: "", data: DEMO_DATA.C, error: null },
    ]);
    setRoleInput("VP Customer Success · Series B · Healthcare SaaS");
  };

  const readyCandidates = candidates.filter((c) => c.state === "ready" && c.data);

  const buildRadarData = () => {
    if (readyCandidates.length === 0) return [];

    // Build radar data in the shape recharts expects:
    // [{ axis: "Mission", A: 88, B: 72, C: 91 }, ...]
    const data = DIMENSIONS.map((dim) => {
      const entry = { axis: dim.label };
      readyCandidates.forEach((c) => {
        // Get score from dimensions object, fallback to 0
        const dims = c.data.dimensions;
        const dimData = dims?.[dim.key];
        const score = typeof dimData?.score === "number" ? dimData.score : 0;
        entry[c.id] = score;
      });
      return entry;
    });

    if (spreadMode && readyCandidates.length > 0) {
      // Normalize scores relative to loaded candidates (spread mode)
      DIMENSIONS.forEach((dim, i) => {
        const scores = readyCandidates.map((c) => data[i][c.id]);
        const min = Math.min(...scores);
        const max = Math.max(...scores);
        const range = max - min || 1;
        readyCandidates.forEach((c) => {
          data[i][c.id] = Math.round(((data[i][c.id] - min) / range) * 100);
        });
      });
    }

    return data;
  };

  const getMutualFitScore = (candidateData) => {
    if (!candidateData || candidateData.disqualified) return null;
    const dims = candidateData.dimensions;
    if (!dims) return candidateData.total_score;
    return calculateAdjustedScore(dims, gate, depth);
  };

  const radarData = buildRadarData();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.bg,
        color: COLORS.text,
        fontFamily: "Carlito, 'Helvetica Neue', Helvetica, Arial, sans-serif",
        padding: "48px 24px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* SECTION 1: HEADER */}
        <header style={{ marginBottom: 48 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.2em",
              color: COLORS.red,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            LENS
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 24, marginBottom: 24 }}>
            <h1
              style={{
                fontSize: 36,
                fontWeight: 300,
                margin: 0,
                color: COLORS.text,
              }}
            >
              Candidate Fit Comparison
            </h1>
            <button
              onClick={loadDemo}
              style={{
                background: "none",
                border: `1px solid ${COLORS.rule}`,
                padding: "6px 12px",
                fontSize: 11,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color: COLORS.muted,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
              aria-label="Load demo data"
            >
              Load Demo
            </button>
          </div>
          <div>
            <label
              htmlFor="role-input"
              style={{
                fontSize: 11,
                letterSpacing: "0.15em",
                color: COLORS.red,
                textTransform: "uppercase",
                display: "block",
                marginBottom: 6,
              }}
            >
              ROLE
            </label>
            <input
              id="role-input"
              type="text"
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              placeholder="VP Customer Success · Series B · Healthcare SaaS"
              style={{
                width: "100%",
                maxWidth: 600,
                padding: "12px 0",
                fontSize: 16,
                fontFamily: "inherit",
                border: "none",
                borderBottom: `1px solid ${COLORS.rule}`,
                background: "transparent",
                outline: "none",
                color: COLORS.text,
              }}
              aria-label="Role description"
            />
          </div>
        </header>

        {/* SECTION 2: CANDIDATE STATUS COLUMNS */}
        <section style={{ marginBottom: 48 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 24,
            }}
          >
            {candidates.map((candidate, index) => (
              <CandidateColumn
                key={candidate.id}
                candidate={candidate}
                index={index}
                updateCandidate={updateCandidate}
                loadSession={loadSession}
                loadFromPaste={loadFromPaste}
                clearCandidate={clearCandidate}
                mutualFitScore={getMutualFitScore(candidate.data)}
              />
            ))}
          </div>
        </section>

        {/* SECTION 3: OVERLAID RADAR CHART */}
        {readyCandidates.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <div style={{ borderTop: `1px solid ${COLORS.rule}`, paddingTop: 32 }}>
              <div style={{ textAlign: "right", marginBottom: 16 }}>
                <button
                  onClick={() => setSpreadMode(!spreadMode)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: 12,
                    color: COLORS.muted,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                  aria-label={`Spread mode: ${spreadMode ? "ON" : "OFF"}`}
                >
                  Spread mode:{" "}
                  <span style={{ color: spreadMode ? COLORS.red : COLORS.text, fontWeight: 600 }}>
                    {spreadMode ? "ON" : "OFF"}
                  </span>
                </button>
              </div>

              <div style={{ display: "flex", justifyContent: "center" }}>
                <div style={{ width: 480, height: 480 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                      <PolarGrid stroke={COLORS.rule} />
                      <PolarAngleAxis
                        dataKey="axis"
                        tick={{ fontSize: 11, fill: COLORS.muted, fontFamily: "Carlito" }}
                      />
                      {readyCandidates.map((c) => (
                        <Radar
                          key={c.id}
                          name={c.data.candidateName || `Candidate ${c.id}`}
                          dataKey={c.id}
                          stroke={CANDIDATE_COLORS[c.id]}
                          strokeWidth={1.5}
                          strokeOpacity={0.9}
                          fill={CANDIDATE_COLORS[c.id]}
                          fillOpacity={0.15}
                          dot={{ r: 4, fill: CANDIDATE_COLORS[c.id] }}
                        />
                      ))}
                      <Legend
                        wrapperStyle={{ paddingTop: 24 }}
                        formatter={(value) => (
                          <span style={{ color: COLORS.text, fontSize: 12 }}>{value}</span>
                        )}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {spreadMode && (
                <div
                  style={{
                    textAlign: "center",
                    fontSize: 11,
                    color: COLORS.muted,
                    marginTop: 8,
                  }}
                >
                  (relative scale)
                </div>
              )}
            </div>
          </section>
        )}

        {/* SECTION 4: GATE TOLERANCE */}
        {readyCandidates.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <div style={{ borderTop: `1px solid ${COLORS.rule}`, paddingTop: 32 }}>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.15em",
                  color: COLORS.red,
                  textTransform: "uppercase",
                  marginBottom: 16,
                }}
              >
                GATE TOLERANCE
              </div>

              {/* 3-option horizontal toggle */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                {GATE_LEVELS.map((g) => {
                  const isActive = gate === g;
                  return (
                    <button
                      key={g}
                      onClick={() => setGate(g)}
                      style={{
                        padding: "10px 24px",
                        fontSize: 11,
                        fontFamily: "inherit",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        background: COLORS.bg,
                        border: isActive ? `2px solid ${COLORS.red}` : `1px solid ${COLORS.rule}`,
                        color: isActive ? COLORS.red : COLORS.muted,
                        cursor: "pointer",
                        fontWeight: isActive ? 600 : 400,
                      }}
                      aria-pressed={isActive}
                      aria-label={`${g} gate tolerance`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>

              {/* Helper text */}
              <div
                style={{
                  fontSize: 12,
                  color: COLORS.muted,
                  lineHeight: 1.5,
                  maxWidth: 480,
                }}
              >
                {GATE_HELPER_TEXT[gate]}
              </div>
            </div>
          </section>
        )}

        {/* SECTION 5: CANDIDATE BRIEFS */}
        {readyCandidates.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <div style={{ borderTop: `1px solid ${COLORS.rule}`, paddingTop: 32 }}>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.15em",
                  color: COLORS.red,
                  textTransform: "uppercase",
                  marginBottom: 24,
                }}
              >
                CANDIDATE BRIEFS
              </div>

              {readyCandidates.map((c, i) => (
                <div
                  key={c.id}
                  style={{
                    display: "flex",
                    borderBottom:
                      i < readyCandidates.length - 1 ? `1px solid ${COLORS.rule}` : "none",
                    paddingBottom: 20,
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      width: 3,
                      background: CANDIDATE_COLORS[c.id],
                      marginRight: 16,
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        letterSpacing: "0.1em",
                        color: CANDIDATE_COLORS[c.id],
                        textTransform: "uppercase",
                        marginBottom: 8,
                        fontWeight: 600,
                      }}
                    >
                      {c.data.candidateName || `Candidate ${c.id}`}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "#444",
                        lineHeight: 1.8,
                        fontFamily: "Carlito, 'Helvetica Neue', Helvetica, Arial, sans-serif",
                      }}
                    >
                      {c.data.briefing || "No briefing available."}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FOOTER */}
        <footer style={{ borderTop: `1px solid ${COLORS.rule}`, paddingTop: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              onClick={clearAll}
              style={{
                background: "none",
                border: "none",
                fontSize: 12,
                color: COLORS.muted,
                cursor: "pointer",
                fontFamily: "inherit",
                textDecoration: "underline",
              }}
              aria-label="Clear all candidates and reset form"
            >
              Clear all
            </button>
            <div style={{ fontSize: 11, color: COLORS.muted }}>
              Lens Comparison v{VERSION}
            </div>
          </div>
        </footer>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Carlito:wght@400;700&family=JetBrains+Mono:wght@400;600&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: #bbb; }
        textarea::placeholder { color: #bbb; }
      `}</style>
    </div>
  );
}

function CandidateColumn({
  candidate,
  index,
  updateCandidate,
  loadSession,
  loadFromPaste,
  clearCandidate,
  mutualFitScore,
}) {
  const color = CANDIDATE_COLORS[candidate.id];
  const isPasteMode = candidate.inputMode === "paste";

  // STATE A: EMPTY
  if (candidate.state === "empty" || candidate.state === "loading") {
    return (
      <div
        style={{
          padding: 24,
          border: `1px solid ${COLORS.rule}`,
          minHeight: 280,
        }}
      >
        <div
          style={{
            fontSize: 12,
            letterSpacing: "0.15em",
            color: color,
            textTransform: "uppercase",
            fontWeight: 600,
            marginBottom: 20,
          }}
        >
          CANDIDATE {candidate.id}
        </div>

        {isPasteMode ? (
          <>
            <label
              htmlFor={`paste-${candidate.id}`}
              style={{ fontSize: 11, color: COLORS.muted, display: "block", marginBottom: 6 }}
            >
              Paste JSON
            </label>
            <textarea
              id={`paste-${candidate.id}`}
              value={candidate.inputValue}
              onChange={(e) => updateCandidate(index, { inputValue: e.target.value })}
              placeholder='{"total_score": 72, "classification": "GOOD FIT", ...}'
              rows={6}
              style={{
                width: "100%",
                padding: 12,
                fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace",
                border: `1px solid ${COLORS.rule}`,
                background: "#FAFAFA",
                resize: "vertical",
                outline: "none",
              }}
              aria-label={`Paste JSON for Candidate ${candidate.id}`}
            />
          </>
        ) : (
          <>
            <label
              htmlFor={`session-${candidate.id}`}
              style={{ fontSize: 11, color: COLORS.muted, display: "block", marginBottom: 6 }}
            >
              Session ID
            </label>
            <input
              id={`session-${candidate.id}`}
              type="text"
              value={candidate.inputValue}
              onChange={(e) => updateCandidate(index, { inputValue: e.target.value })}
              placeholder="e.g. recABC123"
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                border: `1px solid ${COLORS.rule}`,
                background: COLORS.bg,
                outline: "none",
              }}
              aria-label={`Session ID for Candidate ${candidate.id}`}
            />
          </>
        )}

        <button
          onClick={() => (isPasteMode ? loadFromPaste(index) : loadSession(index))}
          disabled={candidate.state === "loading"}
          style={{
            marginTop: 12,
            width: "100%",
            padding: "10px 16px",
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontFamily: "inherit",
            background: COLORS.bg,
            border: `1px solid ${color}`,
            color: color,
            cursor: candidate.state === "loading" ? "wait" : "pointer",
            fontWeight: 600,
          }}
          aria-label={`Load Candidate ${candidate.id}`}
        >
          {candidate.state === "loading" ? "Loading..." : "Load"}
        </button>

        <button
          onClick={() =>
            updateCandidate(index, {
              inputMode: isPasteMode ? "session" : "paste",
              inputValue: "",
              error: null,
            })
          }
          style={{
            marginTop: 8,
            background: "none",
            border: "none",
            fontSize: 11,
            color: COLORS.muted,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
          aria-label={isPasteMode ? "Switch to session ID input" : "Switch to paste JSON input"}
        >
          {isPasteMode ? "← back to session ID" : "or paste JSON →"}
        </button>

        {candidate.error && (
          <div style={{ marginTop: 12, fontSize: 11, color: COLORS.red }}>{candidate.error}</div>
        )}
      </div>
    );
  }

  // STATE B: AWAITING / IN PROGRESS
  if (candidate.state === "awaiting" || candidate.state === "in_progress") {
    const isInProgress = candidate.state === "in_progress";
    return (
      <div
        style={{
          padding: 24,
          border: `1px solid ${COLORS.rule}`,
          minHeight: 280,
          position: "relative",
        }}
      >
        <button
          onClick={() => clearCandidate(index)}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "none",
            border: "none",
            fontSize: 16,
            color: COLORS.muted,
            cursor: "pointer",
            lineHeight: 1,
          }}
          aria-label={`Clear Candidate ${candidate.id}`}
        >
          ×
        </button>

        <div
          style={{
            fontSize: 12,
            letterSpacing: "0.15em",
            color: color,
            textTransform: "uppercase",
            fontWeight: 600,
            marginBottom: 20,
          }}
        >
          CANDIDATE {candidate.id}
        </div>

        <div
          style={{
            display: "inline-block",
            padding: "6px 12px",
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            background: isInProgress ? "#FFF3E0" : "#F5F5F5",
            color: isInProgress ? COLORS.orange : COLORS.muted,
            marginBottom: 12,
          }}
        >
          {isInProgress ? "🔄 IN PROGRESS" : "⏳ AWAITING RESPONSE"}
        </div>

        <div style={{ fontSize: 12, color: COLORS.muted, lineHeight: 1.6 }}>
          Check back when session is complete.
        </div>
      </div>
    );
  }

  // STATE C: READY
  if (candidate.state === "ready" && candidate.data) {
    const data = candidate.data;
    const classification = data.disqualified ? "SKIP" : data.classification;
    const classColor = CLASSIFICATION_COLORS[classification] || COLORS.muted;

    return (
      <div
        style={{
          padding: 24,
          border: `1px solid ${COLORS.rule}`,
          minHeight: 280,
          position: "relative",
        }}
      >
        <button
          onClick={() => clearCandidate(index)}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "none",
            border: "none",
            fontSize: 16,
            color: COLORS.muted,
            cursor: "pointer",
            lineHeight: 1,
          }}
          aria-label={`Clear Candidate ${candidate.id}`}
        >
          ×
        </button>

        <div
          style={{
            fontSize: 14,
            letterSpacing: "0.1em",
            color: color,
            textTransform: "uppercase",
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          {truncateText(data.candidateName, 30) || `CANDIDATE ${candidate.id}`}
        </div>

        <div
          style={{
            display: "inline-block",
            padding: "6px 12px",
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            background: data.disqualified ? "#F5F5F5" : `${classColor}15`,
            color: classColor,
            marginBottom: 16,
          }}
        >
          {data.disqualified ? "DISQUALIFIED" : classification}
        </div>

        {!data.disqualified && mutualFitScore !== null && (
          <div>
            <div style={{ fontSize: 10, color: COLORS.muted, marginBottom: 4, letterSpacing: "0.1em" }}>
              MUTUAL FIT
            </div>
            <div
              style={{
                fontSize: 48,
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600,
                color: color,
                lineHeight: 1,
              }}
            >
              {mutualFitScore}
            </div>
          </div>
        )}

        {data.disqualified && data.disqualify_reason && (
          <div style={{ fontSize: 12, color: COLORS.red, lineHeight: 1.6, marginTop: 8 }}>
            {truncateText(data.disqualify_reason, 120)}
          </div>
        )}
      </div>
    );
  }

  return null;
}
