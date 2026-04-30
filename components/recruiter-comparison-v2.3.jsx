"use client";

import { useState, useMemo, useEffect } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

const VERSION = "2.3.2";

// ============================================================================
// DESIGN TOKENS — International Style
// ============================================================================
const COLORS = {
  bg: "#FFFFFF",
  text: "#1A1A1A",
  red: "#D93025",
  green: "#2D6A2D",
  orange: "#E8590C",
  darkRed: "#8B0000",
  rule: "#EEEEEE",
  muted: "#888888",
  light: "#BBBBBB",
  subtle: "#CCCCCC",
};

const CANDIDATE_COLORS = {
  A: "#D93025",
  B: "#1A1A1A",
  C: "#888888",
};

// Score color thresholds
const getScoreColor = (score) => {
  if (score >= 80) return COLORS.green;
  if (score >= 60) return COLORS.orange;
  return COLORS.darkRed;
};

// Derive classification from MF score (dynamic, not static)
const getClassification = (score) => {
  if (score >= 80) return "STRONG FIT";
  if (score >= 60) return "GOOD FIT";
  return "MARGINAL";
};

// Required dimension keys for validation
const REQUIRED_DIMS = ["mission", "role", "culture", "skill", "work_style", "energy"];

// Classification styles
const CLASSIFICATION_STYLES = {
  "STRONG FIT": { bg: "#e8f5e9", color: COLORS.green },
  "GOOD FIT": { bg: "#fff3e0", color: COLORS.orange },
  MARGINAL: { bg: "#fce8e8", color: COLORS.darkRed },
};

// ============================================================================
// FIXTURE DATA
// ============================================================================
const FIXTURE_A = {
  candidate_name: "Maria G.",
  candidate_title: "Director of Customer Success · Evidera Health",
  candidate_location: "New York, NY",
  total_score: 87,
  adjusted_score: 87,
  classification: "STRONG FIT",
  briefing:
    "Deep healthcare domain with proven CS build-from-zero track record. NRR 96→118% at clinical SaaS directly analogous. Cerner background signals client-side workflow understanding.",
  dimensions: { mission: 91, role: 93, culture: 88, skill: 90, work_style: 79, energy: 84 },
  mf_overrides: { strict: 83, standard: 87, flexible: 89 },
};

const FIXTURE_B = {
  candidate_name: "James T.",
  candidate_title: "VP of Customer Success · PayGrid",
  candidate_location: "Chicago, IL",
  total_score: 74,
  adjusted_score: 74,
  classification: "GOOD FIT",
  briefing:
    "Strong enterprise CS operator — Gainsight, tiered CSM model, NRR trajectory signal process maturity. No healthcare domain. Fintech-to-healthcare translation possible but not guaranteed.",
  dimensions: { mission: 55, role: 82, culture: 61, skill: 91, work_style: 88, energy: 58 },
  mf_overrides: { strict: 62, standard: 74, flexible: 79 },
};

const FIXTURE_C = {
  candidate_name: "Rachel K.",
  candidate_title: "Chief of Staff · Wellframe (HealthEdge)",
  candidate_location: "Boston, MA",
  total_score: 76,
  adjusted_score: 76,
  classification: "GOOD FIT",
  briefing:
    "Highest domain credibility — MD, published clinical quality research. Risk: trajectory is strategic/executive, not CS operator. Culture and work style scores reflect friction with hands-on management.",
  dimensions: { mission: 95, role: 68, culture: 59, skill: 74, work_style: 52, energy: 93 },
  mf_overrides: { strict: 61, standard: 76, flexible: 81 },
};

// ============================================================================
// GATE TOLERANCE CONFIG
// ============================================================================
const GATE_MODES = ["strict", "standard", "flexible"];

const GATE_HELPER = {
  strict: "Hard requirements enforced. Gaps in any dimension reduce composite significantly.",
  standard: "Balanced evaluation. Minor gaps are weighted but not disqualifying.",
  flexible: "Emphasis on signal strength. Gaps in lower-weight dimensions are tolerated.",
};

// ============================================================================
// DIMENSION CONFIG
// ============================================================================
const DIMENSIONS = [
  { key: "mission", label: "MISSION", short: "MISSION" },
  { key: "role", label: "ROLE", short: "ROLE" },
  { key: "culture", label: "CULTURE", short: "CULTURE" },
  { key: "skill", label: "SKILL", short: "SKILL" },
  { key: "work_style", label: "WORK STYLE", short: "WORK STY" },
  { key: "energy", label: "ENERGY", short: "ENERGY" },
];

// ============================================================================
// UTILITIES
// ============================================================================
const truncateBrief = (text, maxSentences = 3) => {
  if (!text) return "";
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  if (sentences.length <= maxSentences) return text;
  return sentences.slice(0, maxSentences).join(" ").trim() + "…";
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function RecruiterComparison() {
  const [roleInput, setRoleInput] = useState("");
  const [gate, setGate] = useState("standard");
  const [spreadMode, setSpreadMode] = useState(false);

  // Read role from URL param on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const role = params.get("role");
      if (role) {
        setRoleInput(role);
      }
    }
  }, []);

  const [candidates, setCandidates] = useState({
    A: { ...FIXTURE_A },
    B: { ...FIXTURE_B },
    C: { ...FIXTURE_C },
  });

  const [pasteOpen, setPasteOpen] = useState({ A: false, B: false, C: false });
  const [pasteValue, setPasteValue] = useState({ A: "", B: "", C: "" });
  const [pasteError, setPasteError] = useState({ A: null, B: null, C: null });

  // Get MF score based on current gate mode
  const getMFScore = (candidate) => {
    if (!candidate.mf_overrides) return candidate.total_score;
    return candidate.mf_overrides[gate] ?? candidate.total_score;
  };

  // Build radar data
  const radarData = useMemo(() => {
    const base = DIMENSIONS.map((dim) => ({
      axis: dim.label,
      A: candidates.A.dimensions[dim.key],
      B: candidates.B.dimensions[dim.key],
      C: candidates.C.dimensions[dim.key],
    }));

    if (!spreadMode) return base;

    // Spread mode: normalize per axis
    return base.map((row) => {
      const vals = [row.A, row.B, row.C];
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const range = max - min;

      if (range === 0) {
        return { axis: row.axis, A: 50, B: 50, C: 50 };
      }

      return {
        axis: row.axis,
        A: Math.round(((row.A - min) / range) * 100),
        B: Math.round(((row.B - min) / range) * 100),
        C: Math.round(((row.C - min) / range) * 100),
      };
    });
  }, [candidates, spreadMode]);

  // Paste handler
  const handlePaste = (id) => {
    const text = pasteValue[id].trim();
    if (!text) {
      setPasteError((p) => ({ ...p, [id]: "Paste JSON data" }));
      return;
    }

    try {
      const parsed = JSON.parse(text);

      // Validate required fields
      if (!parsed.candidate_name || !parsed.dimensions) {
        setPasteError((p) => ({ ...p, [id]: "Missing required fields" }));
        return;
      }

      // Validate all dimension keys exist and are numbers
      const missingDims = REQUIRED_DIMS.filter(
        (k) => typeof parsed.dimensions[k] !== "number"
      );
      if (missingDims.length > 0) {
        setPasteError((p) => ({
          ...p,
          [id]: `Missing dimensions: ${missingDims.join(", ")}`,
        }));
        return;
      }

      // Compute total_score from dimension average if missing
      if (typeof parsed.total_score !== "number") {
        const dimValues = REQUIRED_DIMS.map((k) => parsed.dimensions[k]);
        parsed.total_score = Math.round(
          dimValues.reduce((a, b) => a + b, 0) / dimValues.length
        );
      }

      // Ensure mf_overrides exist (use total_score as fallback)
      if (!parsed.mf_overrides) {
        parsed.mf_overrides = {
          strict: parsed.total_score,
          standard: parsed.total_score,
          flexible: parsed.total_score,
        };
      }

      setCandidates((c) => ({ ...c, [id]: parsed }));
      setPasteOpen((p) => ({ ...p, [id]: false }));
      setPasteValue((p) => ({ ...p, [id]: "" }));
      setPasteError((p) => ({ ...p, [id]: null }));
    } catch {
      setPasteError((p) => ({ ...p, [id]: "Invalid JSON" }));
    }
  };

  // Clear all
  const clearAll = () => {
    setCandidates({
      A: { ...FIXTURE_A },
      B: { ...FIXTURE_B },
      C: { ...FIXTURE_C },
    });
    setGate("standard");
    setSpreadMode(false);
    setRoleInput("");
    setPasteOpen({ A: false, B: false, C: false });
    setPasteValue({ A: "", B: "", C: "" });
    setPasteError({ A: null, B: null, C: null });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.bg,
        color: COLORS.text,
        fontFamily: "Carlito, Arial, sans-serif",
        padding: "32px 24px",
      }}
    >
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* ================================================================
            SECTION 1: HEADER
            ================================================================ */}
        <header style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 9,
              letterSpacing: "0.25em",
              color: COLORS.red,
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            LENS
          </div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 300,
              margin: 0,
              marginBottom: 16,
              color: COLORS.text,
            }}
          >
            Candidate Fit Comparison
          </h1>
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 9,
                letterSpacing: "0.15em",
                color: COLORS.red,
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              ROLE
            </div>
            <input
              type="text"
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              placeholder="VP Customer Success · Series B · Healthcare SaaS"
              style={{
                width: "100%",
                maxWidth: 500,
                padding: "8px 0",
                fontSize: 14,
                fontFamily: "inherit",
                border: "none",
                borderBottom: `1px solid ${COLORS.rule}`,
                background: "transparent",
                outline: "none",
                color: COLORS.text,
              }}
            />
          </div>
          <div style={{ borderBottom: `1px solid ${COLORS.rule}` }} />
        </header>

        {/* ================================================================
            SECTION 2: GATE TOLERANCE
            ================================================================ */}
        <section style={{ marginBottom: 24 }}>
          <div style={{ borderTop: `1px solid ${COLORS.rule}`, paddingTop: 16 }}>
            <div
              style={{
                fontSize: 9,
                letterSpacing: "0.15em",
                color: COLORS.red,
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              GATE TOLERANCE
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {GATE_MODES.map((mode) => {
                const isActive = gate === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setGate(mode)}
                    style={{
                      padding: "6px 14px",
                      fontSize: 10,
                      fontFamily: "inherit",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      background: COLORS.bg,
                      border: `1px solid ${isActive ? COLORS.red : COLORS.rule}`,
                      color: isActive ? COLORS.red : COLORS.muted,
                      cursor: "pointer",
                    }}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>

            <div style={{ fontSize: 12, color: COLORS.muted, lineHeight: 1.5, maxWidth: 420 }}>
              {GATE_HELPER[gate]}
            </div>
          </div>
          <div style={{ borderBottom: `1px solid ${COLORS.rule}`, marginTop: 16 }} />
        </section>

        {/* ================================================================
            SECTION 3: CANDIDATE COLUMNS
            ================================================================ */}
        <section style={{ marginBottom: 32 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 14,
            }}
          >
            {["A", "B", "C"].map((id) => {
              const c = candidates[id];
              const mfScore = getMFScore(c);
              // Derive classification dynamically from active MF score
              const classification = getClassification(mfScore);
              const classStyle = CLASSIFICATION_STYLES[classification];

              return (
                <div key={id}>
                  <div
                    style={{
                      border: `1px solid ${COLORS.rule}`,
                      padding: 16,
                    }}
                  >
                    {/* A) HEADER */}
                    <div
                      style={{
                        fontSize: 9,
                        letterSpacing: "0.15em",
                        color: CANDIDATE_COLORS[id],
                        textTransform: "uppercase",
                        marginBottom: 8,
                      }}
                    >
                      CANDIDATE {id}
                    </div>

                    {/* B) SCORE ROW */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 12,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 30,
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 300,
                          color: CANDIDATE_COLORS[id],
                        }}
                      >
                        {mfScore}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          background: classStyle.bg,
                          color: classStyle.color,
                          padding: "3px 8px",
                        }}
                      >
                        {classification}
                      </span>
                    </div>

                    {/* C) IDENTITY BLOCK */}
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 13, color: "#333" }}>{c.candidate_name}</div>
                      <div style={{ fontSize: 11, color: COLORS.muted }}>{c.candidate_title}</div>
                      <div style={{ fontSize: 10, color: COLORS.light }}>{c.candidate_location}</div>
                    </div>

                    {/* D) HAIRLINE */}
                    <div style={{ borderBottom: `1px solid ${COLORS.rule}`, marginBottom: 10 }} />

                    {/* E) DIMENSION BARS */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 10 }}>
                      {DIMENSIONS.map((dim) => {
                        const score = c.dimensions[dim.key];
                        const barColor = getScoreColor(score);
                        const barWidth = (score / 100) * 82;

                        return (
                          <div
                            key={dim.key}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 8,
                                letterSpacing: "0.05em",
                                color: COLORS.light,
                                textTransform: "uppercase",
                                width: 52,
                                flexShrink: 0,
                              }}
                            >
                              {dim.short}
                            </span>
                            <div
                              style={{
                                width: 82,
                                height: 3,
                                background: "#F5F5F5",
                                flexShrink: 0,
                              }}
                            >
                              <div
                                style={{
                                  width: barWidth,
                                  height: 3,
                                  background: barColor,
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontSize: 10,
                                fontFamily: "'JetBrains Mono', monospace",
                                color: barColor,
                              }}
                            >
                              {score}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* F) HAIRLINE */}
                    <div style={{ borderBottom: `1px solid ${COLORS.rule}`, marginBottom: 10 }} />

                    {/* G) BRIEF */}
                    <div
                      style={{
                        fontSize: 11,
                        color: "#555",
                        lineHeight: 1.7,
                      }}
                    >
                      {truncateBrief(c.briefing, 3)}
                    </div>
                  </div>

                  {/* PASTE OVERRIDE */}
                  <div style={{ marginTop: 6 }}>
                    {!pasteOpen[id] ? (
                      <button
                        onClick={() => setPasteOpen((p) => ({ ...p, [id]: true }))}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: 10,
                          color: COLORS.subtle,
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        paste JSON ↓
                      </button>
                    ) : (
                      <div>
                        <textarea
                          value={pasteValue[id]}
                          onChange={(e) => setPasteValue((p) => ({ ...p, [id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handlePaste(id);
                            }
                          }}
                          placeholder='{"candidate_name":"...", "dimensions":{...}}'
                          rows={4}
                          style={{
                            width: "100%",
                            padding: 8,
                            fontSize: 10,
                            fontFamily: "'JetBrains Mono', monospace",
                            border: `1px solid ${COLORS.rule}`,
                            background: "#FAFAFA",
                            resize: "vertical",
                            outline: "none",
                          }}
                        />
                        {pasteError[id] && (
                          <div style={{ fontSize: 10, color: COLORS.darkRed, marginTop: 4 }}>
                            {pasteError[id]}
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                          <button
                            onClick={() => handlePaste(id)}
                            style={{
                              background: "none",
                              border: `1px solid ${COLORS.rule}`,
                              padding: "4px 8px",
                              fontSize: 9,
                              color: COLORS.muted,
                              cursor: "pointer",
                              fontFamily: "inherit",
                            }}
                          >
                            Load
                          </button>
                          <button
                            onClick={() => {
                              setPasteOpen((p) => ({ ...p, [id]: false }));
                              setPasteValue((p) => ({ ...p, [id]: "" }));
                              setPasteError((p) => ({ ...p, [id]: null }));
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              fontSize: 9,
                              color: COLORS.subtle,
                              cursor: "pointer",
                              fontFamily: "inherit",
                            }}
                          >
                            cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================================================================
            SECTION 4: RADAR CHART
            ================================================================ */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ borderTop: `1px solid ${COLORS.rule}`, paddingTop: 20 }}>
            {/* Header row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  letterSpacing: "0.15em",
                  color: COLORS.red,
                  textTransform: "uppercase",
                }}
              >
                CANDIDATE PROFILES
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: COLORS.muted }}>Spread mode:</span>
                <button
                  onClick={() => setSpreadMode(!spreadMode)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: 11,
                    color: COLORS.red,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {spreadMode ? "ON →" : "OFF →"}
                </button>
                {spreadMode && (
                  <span style={{ fontSize: 11, color: "#AAA" }}>(relative scale)</span>
                )}
              </div>
            </div>

            {/* Radar chart */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ width: 400, height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                    <PolarGrid gridType="polygon" stroke={COLORS.rule} />
                    <PolarAngleAxis
                      dataKey="axis"
                      tick={{ fontSize: 11, fill: COLORS.muted, fontFamily: "Arial" }}
                    />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name={candidates.A.candidate_name}
                      dataKey="A"
                      stroke={CANDIDATE_COLORS.A}
                      strokeWidth={1.5}
                      strokeOpacity={0.85}
                      fill={CANDIDATE_COLORS.A}
                      fillOpacity={0.1}
                      dot={{ r: 4, fill: CANDIDATE_COLORS.A }}
                    />
                    <Radar
                      name={candidates.B.candidate_name}
                      dataKey="B"
                      stroke={CANDIDATE_COLORS.B}
                      strokeWidth={1.5}
                      strokeOpacity={0.85}
                      fill={CANDIDATE_COLORS.B}
                      fillOpacity={0.1}
                      dot={{ r: 4, fill: CANDIDATE_COLORS.B }}
                    />
                    <Radar
                      name={candidates.C.candidate_name}
                      dataKey="C"
                      stroke={CANDIDATE_COLORS.C}
                      strokeWidth={1.5}
                      strokeOpacity={0.85}
                      fill={CANDIDATE_COLORS.C}
                      fillOpacity={0.1}
                      dot={{ r: 4, fill: CANDIDATE_COLORS.C }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Legend */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 24,
                marginTop: 16,
              }}
            >
              {["A", "B", "C"].map((id) => (
                <div key={id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      background: CANDIDATE_COLORS[id],
                    }}
                  />
                  <span style={{ fontSize: 11, color: "#555" }}>{candidates[id].candidate_name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================
            SECTION 5: FOOTER
            ================================================================ */}
        <footer style={{ borderTop: `1px solid ${COLORS.rule}`, paddingTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              onClick={clearAll}
              style={{
                background: "none",
                border: "none",
                fontSize: 11,
                color: COLORS.red,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Clear all
            </button>
            <div style={{ fontSize: 10, color: COLORS.subtle }}>Lens Comparison v{VERSION}</div>
          </div>
        </footer>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: #bbb; }
        textarea::placeholder { color: #ccc; }
      `}</style>
    </div>
  );
}
