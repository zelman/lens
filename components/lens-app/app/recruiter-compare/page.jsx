'use client';

import { useState } from "react";

const VERSION = "1.1";

// Design tokens — International Style (matches role-lens-scorer-v1.3)
const COLORS = {
  text: "#1A1A1A",
  muted: "#666",
  faint: "#999",
  rule: "#EEEEEE",
  red: "#D93025",
  green: "#2D6A2D",
  orange: "#E8590C",
  darkRed: "#8B0000",
  white: "#FFFFFF",
  bg: "#FAFAFA",
};

const FONTS = {
  prose: "'Carlito', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  mono: "'JetBrains Mono', 'Consolas', monospace",
};

// Score categories from role-lens-scorer
const CATEGORIES = [
  { key: "builder_orientation", label: "Builder", max: 25 },
  { key: "relational_fit", label: "Relational", max: 22 },
  { key: "domain_fluency", label: "Domain", max: 18 },
  { key: "values_alignment", label: "Values", max: 15 },
  { key: "work_style_compatibility", label: "Work Style", max: 12 },
  { key: "energy_match", label: "Energy", max: 8 },
];

// Truncate text at word boundary
function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > maxLength * 0.7 ? truncated.substring(0, lastSpace) : truncated) + "...";
}

// Validate score data structure
function validateScoreData(data) {
  if (typeof data !== "object" || data === null) {
    return { valid: false, error: "Invalid JSON object" };
  }

  // Disqualified candidates have minimal required fields
  if (data.disqualified === true) {
    return { valid: true };
  }

  // Non-disqualified candidates need total_score and classification
  if (typeof data.total_score !== "number") {
    return { valid: false, error: "Missing or invalid total_score" };
  }

  if (data.total_score < 0 || data.total_score > 100) {
    return { valid: false, error: "total_score must be 0-100" };
  }

  if (typeof data.classification !== "string" || !data.classification) {
    return { valid: false, error: "Missing classification" };
  }

  // Validate scores object if present
  if (data.scores !== undefined) {
    if (typeof data.scores !== "object" || data.scores === null) {
      return { valid: false, error: "Invalid scores object" };
    }

    // Check each dimension score if present
    for (const cat of CATEGORIES) {
      const dimScore = data.scores[cat.key];
      if (dimScore !== undefined) {
        if (typeof dimScore !== "object" || dimScore === null) {
          return { valid: false, error: `Invalid ${cat.key} score` };
        }
        if (typeof dimScore.score !== "number" || dimScore.score < 0) {
          return { valid: false, error: `Invalid ${cat.key} score value` };
        }
      }
    }
  }

  return { valid: true };
}

// Color based on percentage
function getScoreColor(score, max) {
  if (max <= 0) return COLORS.faint;
  const pct = (score / max) * 100;
  if (pct >= 80) return COLORS.green;
  if (pct >= 60) return COLORS.orange;
  return COLORS.darkRed;
}

// Classification color
function getClassColor(classification) {
  if (classification === "STRONG FIT") return COLORS.green;
  if (classification === "GOOD FIT") return COLORS.orange;
  if (classification === "MARGINAL") return "#996600";
  return COLORS.red;
}

// Compact score bar for comparison view
function CompactScoreBar({ score, max, label }) {
  const safeScore = Math.max(0, score || 0);
  const safeMax = Math.max(1, max || 1);
  const pct = Math.min(100, Math.round((safeScore / safeMax) * 100));
  const color = getScoreColor(safeScore, safeMax);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
        <span style={{ fontSize: 10, color: COLORS.muted, letterSpacing: "0.02em" }}>{label}</span>
        <span style={{ fontSize: 11, color: COLORS.text, fontFamily: FONTS.mono, fontWeight: 600 }}>{safeScore}/{safeMax}</span>
      </div>
      <div style={{ height: 2, background: COLORS.rule, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}

// Classification pill
function ClassificationPill({ classification, disqualified }) {
  if (disqualified) {
    return (
      <span
        style={{
          display: "inline-block",
          padding: "4px 10px",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: COLORS.white,
          background: COLORS.red,
        }}
        role="status"
        aria-label="Candidate disqualified"
      >
        SKIP
      </span>
    );
  }

  const color = getClassColor(classification);
  const bgMap = {
    "STRONG FIT": "#e8f5e9",
    "GOOD FIT": "#fff3e0",
    "MARGINAL": "#fff8e1",
    "POOR FIT": "#ffebee",
  };

  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 10px",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: color,
        background: bgMap[classification] || "#f5f5f5",
        border: `1px solid ${color}`,
      }}
      role="status"
      aria-label={`Classification: ${classification}`}
    >
      {classification || "UNCLASSIFIED"}
    </span>
  );
}

// Single candidate column
function CandidateColumn({ slot, data, onLoad, onClear }) {
  const [inputValue, setInputValue] = useState("");
  const [parseError, setParseError] = useState(null);

  const slotLabel = ["A", "B", "C"][slot] || String(slot + 1);

  const handleLoad = () => {
    setParseError(null);
    try {
      const parsed = JSON.parse(inputValue.trim());
      const validation = validateScoreData(parsed);
      if (!validation.valid) {
        setParseError(validation.error);
        return;
      }
      onLoad(parsed);
      setInputValue("");
    } catch (err) {
      setParseError("Invalid JSON format");
    }
  };

  const handleClear = () => {
    setInputValue("");
    setParseError(null);
    onClear();
  };

  // STATE A — Empty
  if (!data) {
    return (
      <div
        style={{
          background: COLORS.white,
          border: `1px solid ${COLORS.rule}`,
          padding: 20,
          minHeight: 400,
        }}
        role="region"
        aria-label={`Candidate ${slotLabel} input`}
      >
        <div style={{
          fontSize: 10,
          letterSpacing: "0.15em",
          color: COLORS.red,
          textTransform: "uppercase",
          fontWeight: 600,
          marginBottom: 16,
        }}>
          CANDIDATE {slotLabel}
        </div>

        <label htmlFor={`candidate-${slot}-input`} className="sr-only" style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          border: 0,
        }}>
          Paste score JSON for Candidate {slotLabel}
        </label>
        <textarea
          id={`candidate-${slot}-input`}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Paste score JSON here..."
          rows={8}
          aria-describedby={parseError ? `candidate-${slot}-error` : undefined}
          style={{
            width: "100%",
            background: COLORS.bg,
            border: `1px solid ${COLORS.rule}`,
            padding: "12px 14px",
            fontSize: 11,
            fontFamily: FONTS.mono,
            color: COLORS.text,
            resize: "vertical",
            outline: "none",
            boxSizing: "border-box",
          }}
          onFocus={(e) => e.target.style.borderColor = COLORS.faint}
          onBlur={(e) => e.target.style.borderColor = COLORS.rule}
        />

        {parseError && (
          <div
            id={`candidate-${slot}-error`}
            role="alert"
            style={{
              marginTop: 8,
              fontSize: 11,
              color: COLORS.darkRed,
            }}
          >
            {parseError}
          </div>
        )}

        <button
          onClick={handleLoad}
          disabled={!inputValue.trim()}
          aria-label={`Load score data for Candidate ${slotLabel}`}
          style={{
            marginTop: 12,
            padding: "8px 20px",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontFamily: FONTS.prose,
            background: "transparent",
            color: inputValue.trim() ? COLORS.text : COLORS.faint,
            border: `1px solid ${inputValue.trim() ? COLORS.text : COLORS.rule}`,
            cursor: inputValue.trim() ? "pointer" : "default",
            transition: "all 0.15s",
          }}
        >
          Load
        </button>
      </div>
    );
  }

  // STATE B — Loaded
  const rawName = data.candidate_name || `Candidate ${slotLabel}`;
  const candidateName = truncateText(rawName, 40);

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.rule}`,
        padding: 20,
        minHeight: 400,
      }}
      role="region"
      aria-label={`Candidate ${slotLabel}: ${rawName}`}
    >
      {/* Header with name */}
      <div style={{
        fontSize: 10,
        letterSpacing: "0.15em",
        color: COLORS.red,
        textTransform: "uppercase",
        fontWeight: 600,
        marginBottom: 6,
      }}>
        CANDIDATE {slotLabel}
      </div>

      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: COLORS.text,
          marginBottom: 12,
          fontFamily: FONTS.prose,
        }}
        title={rawName.length > 40 ? rawName : undefined}
      >
        {candidateName}
      </div>

      {/* Classification pill */}
      <div style={{ marginBottom: 16 }}>
        <ClassificationPill
          classification={data.classification}
          disqualified={data.disqualified}
        />
      </div>

      {/* Total score */}
      {!data.disqualified && (
        <div style={{
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: `1px solid ${COLORS.rule}`,
        }}>
          <div
            style={{
              fontSize: 36,
              fontWeight: 300,
              fontFamily: FONTS.mono,
              color: getClassColor(data.classification),
              lineHeight: 1,
            }}
            aria-label={`Total score: ${data.total_score} out of 100`}
          >
            {data.total_score}
          </div>
          <div style={{
            fontSize: 10,
            color: COLORS.faint,
            letterSpacing: "0.1em",
            marginTop: 4,
          }}>
            / 100
          </div>
        </div>
      )}

      {/* Disqualified reason */}
      {data.disqualified && data.disqualify_reason && (
        <div style={{
          marginBottom: 16,
          padding: "10px 12px",
          background: "#ffebee",
          fontSize: 11,
          color: COLORS.darkRed,
          lineHeight: 1.5,
        }}>
          {truncateText(data.disqualify_reason, 200)}
        </div>
      )}

      {/* Dimension scores */}
      {!data.disqualified && data.scores && typeof data.scores === "object" && (
        <div style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: 9,
            letterSpacing: "0.15em",
            color: COLORS.faint,
            textTransform: "uppercase",
            marginBottom: 12,
          }}>
            Dimensions
          </div>
          {CATEGORIES.map(cat => {
            const s = data.scores[cat.key];
            if (!s || typeof s.score !== "number") return null;
            return (
              <CompactScoreBar
                key={cat.key}
                score={s.score}
                max={cat.max}
                label={cat.label}
              />
            );
          })}
        </div>
      )}

      {/* Briefing (truncated) */}
      {data.briefing && (
        <div style={{
          fontSize: 11,
          color: COLORS.muted,
          lineHeight: 1.6,
          marginBottom: 16,
          paddingTop: 12,
          borderTop: `1px solid ${COLORS.rule}`,
        }}>
          {truncateText(data.briefing, 180)}
        </div>
      )}

      {/* Gate flags */}
      {Array.isArray(data.gate_flags) && data.gate_flags.length > 0 && (
        <div style={{
          marginBottom: 16,
          padding: "8px 10px",
          background: "#fff8f0",
          border: `1px solid #ffe0b2`,
        }}>
          <div style={{
            fontSize: 9,
            letterSpacing: "0.1em",
            color: COLORS.orange,
            textTransform: "uppercase",
            fontWeight: 600,
            marginBottom: 6,
          }}>
            Flags
          </div>
          {data.gate_flags.slice(0, 2).map((f, i) => (
            <div key={`flag-${i}`} style={{
              fontSize: 10,
              color: "#996600",
              lineHeight: 1.5,
              marginBottom: 2,
            }}>
              {truncateText(String(f), 60)}
            </div>
          ))}
          {data.gate_flags.length > 2 && (
            <div style={{ fontSize: 10, color: COLORS.faint }}>
              +{data.gate_flags.length - 2} more
            </div>
          )}
        </div>
      )}

      {/* Clear button */}
      <button
        onClick={handleClear}
        aria-label={`Clear Candidate ${slotLabel}`}
        style={{
          padding: "6px 14px",
          fontSize: 9,
          fontWeight: 500,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontFamily: FONTS.prose,
          background: "transparent",
          color: COLORS.faint,
          border: `1px solid ${COLORS.rule}`,
          cursor: "pointer",
          transition: "all 0.15s",
        }}
      >
        Clear
      </button>
    </div>
  );
}

// Main comparison component
export default function RecruiterComparison() {
  const [candidates, setCandidates] = useState([null, null, null]);
  const [roleInput, setRoleInput] = useState("");

  const handleLoad = (slot, data) => {
    const updated = [...candidates];
    updated[slot] = data;
    setCandidates(updated);
  };

  const handleClear = (slot) => {
    const updated = [...candidates];
    updated[slot] = null;
    setCandidates(updated);
  };

  const loadedCount = candidates.filter(c => c !== null).length;

  return (
    <div style={{
      minHeight: "100vh",
      background: COLORS.white,
      color: COLORS.text,
      fontFamily: FONTS.prose,
      padding: "48px 32px",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Header */}
        <header style={{ marginBottom: 40 }}>
          <div style={{
            fontSize: 10,
            letterSpacing: "0.2em",
            color: COLORS.red,
            textTransform: "uppercase",
            fontWeight: 600,
            marginBottom: 8,
          }}>
            LENS
          </div>

          <h1 style={{
            fontSize: 32,
            fontWeight: 300,
            color: COLORS.text,
            margin: 0,
            lineHeight: 1.2,
            fontFamily: FONTS.prose,
          }}>
            Candidate Fit Comparison
          </h1>

          {/* Role input */}
          <div style={{ marginTop: 24, maxWidth: 400 }}>
            <label
              htmlFor="role-input"
              style={{
                display: "block",
                fontSize: 10,
                letterSpacing: "0.15em",
                color: COLORS.red,
                textTransform: "uppercase",
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              ROLE
            </label>
            <input
              id="role-input"
              type="text"
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              placeholder="VP Sales · Series B"
              style={{
                width: "100%",
                padding: "8px 0",
                fontSize: 14,
                fontFamily: FONTS.prose,
                color: COLORS.text,
                background: "transparent",
                border: "none",
                borderBottom: `1px solid ${COLORS.rule}`,
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => e.target.style.borderBottomColor = COLORS.text}
              onBlur={(e) => e.target.style.borderBottomColor = COLORS.rule}
            />
          </div>

          {/* Status line */}
          <div
            style={{
              marginTop: 16,
              fontSize: 11,
              color: COLORS.faint,
            }}
            role="status"
            aria-live="polite"
          >
            {loadedCount === 0
              ? "Paste score JSON into each column to compare candidates"
              : `${loadedCount} candidate${loadedCount !== 1 ? "s" : ""} loaded`
            }
          </div>
        </header>

        {/* Hairline rule */}
        <div style={{
          height: 1,
          background: COLORS.rule,
          marginBottom: 32,
        }} />

        {/* Three-column grid */}
        <main
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 24,
          }}
          aria-label="Candidate comparison columns"
        >
          {candidates.map((data, i) => (
            <CandidateColumn
              key={`slot-${i}`}
              slot={i}
              data={data}
              onLoad={(parsed) => handleLoad(i, parsed)}
              onClear={() => handleClear(i)}
            />
          ))}
        </main>

        {/* Footer */}
        <footer style={{
          marginTop: 48,
          paddingTop: 24,
          borderTop: `1px solid ${COLORS.rule}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div style={{
            fontSize: 10,
            color: COLORS.faint,
            letterSpacing: "0.05em",
          }}>
            Lens Project · Recruiter Comparison · v{VERSION}
          </div>

          {loadedCount > 0 && (
            <button
              onClick={() => setCandidates([null, null, null])}
              aria-label="Clear all candidates"
              style={{
                padding: "8px 16px",
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontFamily: FONTS.prose,
                background: "transparent",
                color: COLORS.faint,
                border: `1px solid ${COLORS.rule}`,
                cursor: "pointer",
              }}
            >
              Clear All
            </button>
          )}
        </footer>
      </div>

      {/* Global styles */}
      <style>{`
        * { box-sizing: border-box; }
        input::placeholder { color: ${COLORS.faint}; }
        textarea::placeholder { color: ${COLORS.faint}; }
        @import url('https://fonts.googleapis.com/css2?family=Carlito:wght@400;700&family=JetBrains+Mono:wght@400;600&display=swap');
      `}</style>
    </div>
  );
}
