"use client";

import { useState, useEffect } from "react";

const BUILD_ID = "2026.04.15-p";

// 40 curated work values
const VALUES_LIST = [
  "Autonomy",
  "Collaboration",
  "Innovation",
  "Stability",
  "Growth",
  "Excellence",
  "Speed",
  "Quality",
  "Transparency",
  "Trust",
  "Accountability",
  "Creativity",
  "Impact",
  "Learning",
  "Mentorship",
  "Ownership",
  "Simplicity",
  "Resilience",
  "Adaptability",
  "Integrity",
  "Curiosity",
  "Empathy",
  "Directness",
  "Inclusivity",
  "Meritocracy",
  "Work-life balance",
  "Ambition",
  "Pragmatism",
  "Customer focus",
  "Data-driven",
  "Experimentation",
  "Resourcefulness",
  "Humility",
  "Courage",
  "Persistence",
  "Optimism",
  "Discipline",
  "Flexibility",
  "Playfulness",
  "Purpose",
];

// 5 forced-choice work style pairs
const WORKSTYLE_PAIRS = [
  {
    id: "pace",
    optionA: "I prefer to move fast and iterate",
    optionB: "I prefer to plan thoroughly before acting",
  },
  {
    id: "collaboration",
    optionA: "I do my best work alone",
    optionB: "I do my best work collaborating",
  },
  {
    id: "problems",
    optionA: "I'm energized by new problems",
    optionB: "I'm energized by mastering known problems",
  },
  {
    id: "communication",
    optionA: "I communicate directly, even if it's uncomfortable",
    optionB: "I prefer to build consensus before raising concerns",
  },
  {
    id: "structure",
    optionA: "I'm most productive with clear structure",
    optionB: "I'm most productive with open-ended freedom",
  },
];

export default function TeamValidationForm() {
  const [phase, setPhase] = useState("intro");
  const [teamCode, setTeamCode] = useState("");
  const [name, setName] = useState("");
  const [selectedValues, setSelectedValues] = useState([]);
  const [valueEvidence, setValueEvidence] = useState({});
  const [workStyle, setWorkStyle] = useState({});
  const [bestThing, setBestThing] = useState("");
  const [oneThing, setOneThing] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [otherValue, setOtherValue] = useState("");

  // Load team code from URL if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("team");
    if (code) {
      setTeamCode(code);
    }
  }, []);

  const handleValueToggle = (value) => {
    if (selectedValues.includes(value)) {
      setSelectedValues(selectedValues.filter((v) => v !== value));
      const newEvidence = { ...valueEvidence };
      delete newEvidence[value];
      setValueEvidence(newEvidence);
    } else if (selectedValues.length < 5) {
      setSelectedValues([...selectedValues, value]);
    }
  };

  const handleAddOtherValue = () => {
    if (otherValue.trim() && selectedValues.length < 5 && !selectedValues.includes(otherValue.trim())) {
      setSelectedValues([...selectedValues, otherValue.trim()]);
      setOtherValue("");
    }
  };

  const handleEvidenceChange = (value, evidence) => {
    setValueEvidence({ ...valueEvidence, [value]: evidence });
  };

  const handleWorkStyleSelect = (pairId, option) => {
    setWorkStyle({ ...workStyle, [pairId]: option });
  };

  const canProceedFromIntro = teamCode.trim() && name.trim();
  const canProceedFromValues = selectedValues.length === 5 && selectedValues.every((v) => valueEvidence[v]?.trim());
  const canProceedFromWorkStyle = Object.keys(workStyle).length === 5;
  const canSubmit = bestThing.trim() && oneThing.trim();

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    const submission = {
      teamCode: teamCode.trim(),
      name: name.trim(),
      values: selectedValues.map((v) => ({
        value: v,
        evidence: valueEvidence[v],
      })),
      workStyle,
      bestThing: bestThing.trim(),
      oneThing: oneThing.trim(),
      submittedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/team-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Submission failed");
      }

      setPhase("complete");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Styles
  const containerStyle = {
    minHeight: "100vh",
    backgroundColor: "#FFFFFF",
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
    color: "#1A1A1A",
  };

  const headerStyle = {
    borderBottom: "2px solid #1A1A1A",
    padding: "24px 32px",
  };

  const titleStyle = {
    fontSize: "28px",
    fontWeight: "700",
    letterSpacing: "-0.5px",
    margin: 0,
  };

  const subtitleStyle = {
    fontSize: "14px",
    color: "#666666",
    marginTop: "8px",
  };

  const mainStyle = {
    maxWidth: "720px",
    margin: "0 auto",
    padding: "48px 32px",
  };

  const sectionTitleStyle = {
    fontSize: "20px",
    fontWeight: "600",
    marginBottom: "8px",
  };

  const sectionDescStyle = {
    fontSize: "15px",
    color: "#444444",
    marginBottom: "24px",
    lineHeight: "1.5",
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    fontSize: "15px",
    border: "1px solid #CCCCCC",
    borderRadius: "0",
    backgroundColor: "#FFFFFF",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "6px",
    color: "#1A1A1A",
  };

  const buttonStyle = {
    backgroundColor: "#D93025",
    color: "#FFFFFF",
    border: "none",
    padding: "14px 32px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    borderRadius: "0",
  };

  const buttonDisabledStyle = {
    ...buttonStyle,
    backgroundColor: "#CCCCCC",
    cursor: "not-allowed",
  };

  const valueChipStyle = (selected) => ({
    display: "inline-block",
    padding: "8px 14px",
    margin: "4px",
    fontSize: "14px",
    border: selected ? "2px solid #D93025" : "1px solid #CCCCCC",
    backgroundColor: selected ? "#FEF2F2" : "#FFFFFF",
    cursor: selectedValues.length >= 5 && !selected ? "not-allowed" : "pointer",
    opacity: selectedValues.length >= 5 && !selected ? 0.5 : 1,
    fontWeight: selected ? "600" : "400",
  });

  const workStyleOptionStyle = (selected) => ({
    padding: "16px",
    border: selected ? "2px solid #D93025" : "1px solid #CCCCCC",
    backgroundColor: selected ? "#FEF2F2" : "#FFFFFF",
    cursor: "pointer",
    fontSize: "14px",
    lineHeight: "1.4",
    flex: 1,
  });

  const progressStyle = {
    display: "flex",
    gap: "8px",
    marginBottom: "32px",
  };

  const progressDotStyle = (active, completed) => ({
    width: "12px",
    height: "12px",
    borderRadius: "0",
    backgroundColor: completed ? "#D93025" : active ? "#E8590C" : "#EEEEEE",
    border: active ? "2px solid #D93025" : "none",
  });

  const phases = ["intro", "values", "workstyle", "dynamics", "complete"];
  const currentPhaseIndex = phases.indexOf(phase);

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>Team Identity Validation</h1>
        <p style={subtitleStyle}>~10 minutes to complete</p>
      </header>

      <main style={mainStyle}>
        {/* Progress indicator */}
        {phase !== "complete" && (
          <div style={progressStyle}>
            {phases.slice(0, -1).map((p, i) => (
              <div
                key={p}
                style={progressDotStyle(i === currentPhaseIndex, i < currentPhaseIndex)}
              />
            ))}
          </div>
        )}

        {/* INTRO PHASE */}
        {phase === "intro" && (
          <div>
            <h2 style={sectionTitleStyle}>Welcome</h2>
            <p style={sectionDescStyle}>
              We're exploring how AI can capture team identity. Your responses will be combined
              with your teammates' to create a Team Identity Portrait — a one-page document
              describing who your team is and how you work together.
            </p>
            <p style={sectionDescStyle}>
              There are no right answers. We're looking for how your team actually operates,
              not how you think it should.
            </p>

            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}>Team Code</label>
              <input
                type="text"
                style={inputStyle}
                placeholder="Enter the code your team lead shared"
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: "32px" }}>
              <label style={labelStyle}>Your Name</label>
              <input
                type="text"
                style={inputStyle}
                placeholder="First name is fine"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <button
              style={canProceedFromIntro ? buttonStyle : buttonDisabledStyle}
              disabled={!canProceedFromIntro}
              onClick={() => setPhase("values")}
            >
              Continue
            </button>
          </div>
        )}

        {/* VALUES PHASE */}
        {phase === "values" && (
          <div>
            <h2 style={sectionTitleStyle}>Your Values</h2>
            <p style={sectionDescStyle}>
              Pick 5 values that most shape how you work. For each, write one sentence about
              what it looks like in practice — not what it means in the dictionary, but how
              it shows up on your team.
            </p>

            <div style={{ marginBottom: "24px" }}>
              <p style={{ fontSize: "13px", color: "#666666", marginBottom: "12px" }}>
                Selected: {selectedValues.length}/5
              </p>
              <div>
                {VALUES_LIST.map((value) => (
                  <span
                    key={value}
                    style={valueChipStyle(selectedValues.includes(value))}
                    onClick={() => handleValueToggle(value)}
                  >
                    {value}
                  </span>
                ))}
              </div>
              <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="Add your own value..."
                  value={otherValue}
                  onChange={(e) => setOtherValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddOtherValue()}
                  disabled={selectedValues.length >= 5}
                />
                <button
                  style={selectedValues.length < 5 && otherValue.trim() ? buttonStyle : buttonDisabledStyle}
                  disabled={selectedValues.length >= 5 || !otherValue.trim()}
                  onClick={handleAddOtherValue}
                >
                  Add
                </button>
              </div>
            </div>

            {selectedValues.length > 0 && (
              <div style={{ marginBottom: "32px" }}>
                <p style={{ ...labelStyle, marginBottom: "16px" }}>
                  Describe how each value shows up on your team:
                </p>
                {selectedValues.map((value) => (
                  <div key={value} style={{ marginBottom: "16px" }}>
                    <label style={{ ...labelStyle, color: "#D93025" }}>{value}</label>
                    <input
                      type="text"
                      style={inputStyle}
                      placeholder={`How does "${value}" show up in practice?`}
                      value={valueEvidence[value] || ""}
                      onChange={(e) => handleEvidenceChange(value, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                style={{ ...buttonStyle, backgroundColor: "#666666" }}
                onClick={() => setPhase("intro")}
              >
                Back
              </button>
              <button
                style={canProceedFromValues ? buttonStyle : buttonDisabledStyle}
                disabled={!canProceedFromValues}
                onClick={() => setPhase("workstyle")}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* WORKSTYLE PHASE */}
        {phase === "workstyle" && (
          <div>
            <h2 style={sectionTitleStyle}>Work Style</h2>
            <p style={sectionDescStyle}>
              For each pair, pick the statement that's more true of you. There are no right
              answers — we're mapping preferences, not judging them.
            </p>

            {WORKSTYLE_PAIRS.map((pair, index) => (
              <div key={pair.id} style={{ marginBottom: "24px" }}>
                <p style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px", color: "#666666" }}>
                  {index + 1} of 5
                </p>
                <div style={{ display: "flex", gap: "12px" }}>
                  <div
                    style={workStyleOptionStyle(workStyle[pair.id] === "A")}
                    onClick={() => handleWorkStyleSelect(pair.id, "A")}
                  >
                    {pair.optionA}
                  </div>
                  <div
                    style={workStyleOptionStyle(workStyle[pair.id] === "B")}
                    onClick={() => handleWorkStyleSelect(pair.id, "B")}
                  >
                    {pair.optionB}
                  </div>
                </div>
              </div>
            ))}

            <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
              <button
                style={{ ...buttonStyle, backgroundColor: "#666666" }}
                onClick={() => setPhase("values")}
              >
                Back
              </button>
              <button
                style={canProceedFromWorkStyle ? buttonStyle : buttonDisabledStyle}
                disabled={!canProceedFromWorkStyle}
                onClick={() => setPhase("dynamics")}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* DYNAMICS PHASE */}
        {phase === "dynamics" && (
          <div>
            <h2 style={sectionTitleStyle}>Team Dynamics</h2>
            <p style={sectionDescStyle}>
              These two questions help us understand how your team actually works together.
              Be specific — the details matter.
            </p>

            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}>
                What's the best thing about how this team works together?
              </label>
              <textarea
                style={{ ...inputStyle, minHeight: "120px", resize: "vertical" }}
                placeholder="Think of a specific moment or pattern that shows your team at its best..."
                value={bestThing}
                onChange={(e) => setBestThing(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: "32px" }}>
              <label style={labelStyle}>
                What's the one thing that, if it changed, would make this team significantly better?
              </label>
              <textarea
                style={{ ...inputStyle, minHeight: "120px", resize: "vertical" }}
                placeholder="Be honest — this is where the real signal lives..."
                value={oneThing}
                onChange={(e) => setOneThing(e.target.value)}
              />
            </div>

            {error && (
              <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #D93025", padding: "12px", marginBottom: "16px", fontSize: "14px", color: "#D93025" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                style={{ ...buttonStyle, backgroundColor: "#666666" }}
                onClick={() => setPhase("workstyle")}
              >
                Back
              </button>
              <button
                style={canSubmit && !submitting ? buttonStyle : buttonDisabledStyle}
                disabled={!canSubmit || submitting}
                onClick={handleSubmit}
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        )}

        {/* COMPLETE PHASE */}
        {phase === "complete" && (
          <div style={{ textAlign: "center", paddingTop: "48px" }}>
            <div style={{ fontSize: "48px", marginBottom: "24px" }}>&#10003;</div>
            <h2 style={sectionTitleStyle}>Thank You</h2>
            <p style={sectionDescStyle}>
              Your responses have been recorded. Once all team members have completed the form,
              we'll synthesize your Team Identity Portrait and share it with the group.
            </p>
            <p style={{ fontSize: "14px", color: "#666666" }}>
              Team: {teamCode}
            </p>
          </div>
        )}
      </main>

      <footer style={{ textAlign: "center", padding: "24px", fontSize: "12px", color: "#999999", borderTop: "1px solid #EEEEEE" }}>
        Lens Project — Team Identity Validation Experiment — Build {BUILD_ID}
      </footer>
    </div>
  );
}
