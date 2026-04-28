'use client';

import { useState, useRef, useEffect } from "react";
import PremiumMatchDocument from "../components/PremiumMatchDocument";
import candidateLensProfile from "../../config/candidate-lens-profile.json";

const VERSION = "1.4-premium";

const DEFAULT_ROLE_LENS = `Role: Head of Customer Success
Company: LeanData (Series B, ~150 employees, ~$100M funding)
Hiring Manager: Dave Ginsburg, CCO (new hire)
Role Type: Hybrid/Rebuilder — existing team of ~8, new leadership direction
Urgency: Medium — CCO building his team within 60 days

WHO THRIVES HERE:
- Comfortable earning trust from existing team while changing how they work
- Understands revenue operations deeply enough to speak the customer's language
- Comfortable being CCO's right hand while building independent authority
- Data-driven but not dashboard-obsessed — can tell the story behind the numbers

WHO DOESN'T:
- Needs to build from absolute zero — there's an existing team and customers
- Cannot work within someone else's strategic framework initially
- Avoids executive communication — this role reports to CCO and presents to board

VALUES (REAL TALK):
- Revenue accountability is real — CS owns NRR
- Cross-functional collaboration with Sales and Product is expected, not optional
- New CCO is bringing a vision but it's unproven — you're helping build it

ANTI-VALUES:
- CS as cost center
- Finger-pointing between Sales and CS
- Empire building
- Process for process's sake

WORK STYLE:
- Slack + Zoom, enterprise cadences
- 3-4 hours/day meetings currently, goal to reduce to 2
- Fast decisions (24hr) — new CCO wants speed
- High autonomy once trust established (30-60 days)
- Fully remote but SF team grabs lunch weekly — no remote disadvantage

ENERGY OF THIS ROLE:
Fills: Transforming CS from reactive to strategic revenue partner; building the executive story; developing existing team's skills
Drains: Political navigation during leadership transition; enterprise deal complexity; inherited angry customers

DISQUALIFIERS:
- No experience with enterprise SaaS CS at scale
- Cannot manage a team while also being strategic
- No revenue accountability experience (renewals, expansion)
- Only startup experience — no process discipline
- Views support as cost center, not growth engine

COMPENSATION: $150K-$185K + 0.15-0.25% equity`;

const GATE_LEVELS = [
  { key: "lenient", label: "Lenient", description: "Score everyone. Flag near-misses but don't disqualify." },
  { key: "moderate", label: "Moderate", description: "DQ on clear matches. Score close-but-not-exact with a flag." },
  { key: "strict", label: "Strict", description: "Hard DQ on any disqualifier match, even borderline." },
];

const DEPTH_LEVELS = [
  { key: "quick", label: "Quick Screen", description: "Scores + classification + 2-line briefing." },
  { key: "standard", label: "Standard", description: "Scores + briefing + signal matches and tensions." },
  { key: "full", label: "Full Signal", description: "Everything: signals, interview questions, confidence gaps, actions." },
];

const MODE_NAMES = {
  "lenient-quick": { name: "Pipeline Build", desc: "Cast a wide net, fast triage" },
  "lenient-standard": { name: "Open Consideration", desc: "Broad pool, moderate depth" },
  "lenient-full": { name: "Open Discovery", desc: "Broad consideration, full analysis" },
  "moderate-quick": { name: "Standard Screen", desc: "Balanced gating, fast pass" },
  "moderate-standard": { name: "Balanced Evaluation", desc: "Default — good for most evaluations" },
  "moderate-full": { name: "Deep Evaluation", desc: "Balanced gating, maximum signal extraction" },
  "strict-quick": { name: "Targeted Screen", desc: "Narrow pool, fast yes/no" },
  "strict-standard": { name: "Precision Filter", desc: "Tight criteria, clear reasoning" },
  "strict-full": { name: "Final Evaluation", desc: "Tight criteria, full signal report" },
};

const CATEGORIES = [
  { key: "builder_orientation", label: "Builder Orientation", max: 25 },
  { key: "relational_fit", label: "Relational Fit", max: 22 },
  { key: "domain_fluency", label: "Domain Fluency", max: 18 },
  { key: "values_alignment", label: "Values Alignment", max: 15 },
  { key: "work_style_compatibility", label: "Work Style Compat.", max: 12 },
  { key: "energy_match", label: "Energy Match", max: 8 },
];

function buildSystemPrompt(gate, depth) {
  const gateMap = {
    lenient: "LENIENT: Only DQ on absolute mismatches. For borderline cases, score them but add gate_flags noting near-misses.",
    moderate: "MODERATE: DQ on clear matches. For borderline cases, score but add gate_flags. If a hiring manager would still want to see them, don't DQ.",
    strict: "STRICT: DQ on ANY match including borderline. Zero false positives. Set gate_flags to [].",
  };
  const depthMap = {
    quick: "QUICK: 1-sentence rationale per dimension. 2-sentence briefing. Set signal_matches, signal_tensions, confidence_gaps to []. Short response.",
    standard: "STANDARD: 2-sentence rationale per dimension. 3-sentence briefing. Top 3 signal_matches and signal_tensions with interview_question each. Set confidence_gaps to [].",
    full: "FULL: Detailed rationale with confidence (0.0-1.0) per dimension. 4-sentence briefing. All signal_matches/tensions with interview questions. Include confidence_gaps for dimensions with confidence < 0.6.",
  };

  return `Role Lens candidate scorer. Score from the COMPANY's perspective. Be ruthless and honest.

GATE MODE: ${gateMap[gate]}
DEPTH: ${depthMap[depth]}

DIMENSIONS (100 pts): builder_orientation(0-25) match to role mandate | relational_fit(0-22) essence/identity match to who thrives here | domain_fluency(0-18) sector knowledge | values_alignment(0-15) lived values match | work_style_compatibility(0-12) actual work rhythm fit | energy_match(0-8) fills vs drains

THRESHOLDS: 80+=STRONG FIT, 60-79=GOOD FIT, 40-59=MARGINAL, <40=POOR FIT

CRITICAL: Keep rationales to 1-2 sentences max. Keep briefing concise. Produce compact JSON.

Respond with ONLY valid JSON: {"disqualified":bool,"disqualify_reason":str|null,"gate_flags":[str],"classification":str,"total_score":int,"scores":{"builder_orientation":{"score":int,"max":25,"confidence":float,"rationale":str},...same for relational_fit(max 22),domain_fluency(18),values_alignment(15),work_style_compatibility(12),energy_match(8)},"briefing":str,"signal_matches":[{"candidate_signal":str,"role_signal":str,"dimension":str,"strength":str}],"signal_tensions":[{"candidate_signal":str,"role_signal":str,"dimension":str,"severity":str,"interview_question":str}],"confidence_gaps":[str],"recommended_action":str}`;
}

function ScoreBar({ score, max, label, rationale, confidence, showConfidence }) {
  const pct = Math.round((score / max) * 100);
  const color = pct >= 70 ? "#1a7a2e" : pct >= 40 ? "#b35c00" : "#D93025";
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: "#1A1A1A", letterSpacing: "0.03em", fontWeight: 500 }}>{label}</span>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          {showConfidence && confidence !== undefined && (
            <span style={{ fontSize: 10, color: confidence < 0.6 ? "#D93025" : "#999", fontFamily: "monospace" }}>
              {Math.round(confidence * 100)}% conf
            </span>
          )}
          <span style={{ fontSize: 13, color: "#1A1A1A", fontFamily: "monospace", fontWeight: 600 }}>{score}/{max}</span>
        </div>
      </div>
      <div style={{ height: 3, background: "#EEEEEE", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, transition: "width 0.8s ease" }} />
      </div>
      {rationale && <div style={{ fontSize: 11, color: "#666", lineHeight: 1.6, marginTop: 6 }}>{rationale}</div>}
    </div>
  );
}

function Tag({ children, variant = "neutral" }) {
  const styles = {
    match: { color: "#1a7a2e", borderColor: "#c8e6c9", bg: "#f1f8f1" },
    tension: { color: "#D93025", borderColor: "#f8d0cd", bg: "#fef5f4" },
    flag: { color: "#b35c00", borderColor: "#ffe0b2", bg: "#fff8f0" },
    neutral: { color: "#666", borderColor: "#ddd", bg: "#fafafa" },
    mode: { color: "#1A1A1A", borderColor: "#1A1A1A", bg: "#fff" },
  };
  const s = styles[variant] || styles.neutral;
  return (
    <span style={{
      fontSize: 10, color: s.color, padding: "3px 8px",
      border: `1px solid ${s.borderColor}`, background: s.bg,
      letterSpacing: "0.03em", display: "inline-block", marginRight: 4, marginBottom: 4,
    }}>
      {children}
    </span>
  );
}

function Slider({ levels, value, onChange, label }) {
  const idx = levels.findIndex(l => l.key === value);
  const current = levels[idx];
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <span style={{ fontSize: 11, letterSpacing: "0.12em", color: "#999", textTransform: "uppercase" }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A" }}>{current.label}</span>
      </div>
      <div style={{ position: "relative", height: 36, display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: "#EEEEEE" }} />
        <div style={{
          position: "absolute", left: 0, height: 2, background: "#D93025",
          width: `${(idx / (levels.length - 1)) * 100}%`, transition: "width 0.2s ease",
        }} />
        {levels.map((l, i) => (
          <div key={l.key} onClick={() => onChange(l.key)} style={{
            position: "absolute", left: `${(i / (levels.length - 1)) * 100}%`,
            transform: "translateX(-50%)", cursor: "pointer", zIndex: 2,
            width: i === idx ? 16 : 10, height: i === idx ? 16 : 10, borderRadius: "50%",
            background: i <= idx ? "#D93025" : "#ddd",
            border: i === idx ? "2px solid #1A1A1A" : "2px solid transparent",
            transition: "all 0.2s ease",
          }} />
        ))}
        {levels.map((l, i) => (
          <div key={`lbl-${l.key}`} onClick={() => onChange(l.key)} style={{
            position: "absolute", left: `${(i / (levels.length - 1)) * 100}%`,
            transform: "translateX(-50%)", top: 26,
            fontSize: 9, color: i === idx ? "#1A1A1A" : "#bbb",
            cursor: "pointer", whiteSpace: "nowrap", letterSpacing: "0.04em",
            fontWeight: i === idx ? 600 : 400, transition: "color 0.15s",
          }}>
            {l.label}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: "#999", marginTop: 20, lineHeight: 1.5 }}>{current.description}</div>
    </div>
  );
}

export default function ScorerPage() {
  const [roleLens, setRoleLens] = useState(DEFAULT_ROLE_LENS);
  const [candidateInput, setCandidateInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showRoleLens, setShowRoleLens] = useState(false);
  const [gate, setGate] = useState("moderate");
  const [depth, setDepth] = useState("standard");
  const candidateRef = useRef(null);

  // Premium doc state
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [showPremiumDoc, setShowPremiumDoc] = useState(false);
  const [roleProfile, setRoleProfile] = useState(null);
  const [interviewFocus, setInterviewFocus] = useState(null);
  const [jdSuggestions, setJdSuggestions] = useState(null);

  useEffect(() => { if (candidateRef.current) candidateRef.current.focus(); }, []);

  const modeKey = `${gate}-${depth}`;
  const mode = MODE_NAMES[modeKey] || { name: "Custom", desc: "" };
  const showConfidence = depth === "full";
  const showSignals = depth === "standard" || depth === "full";
  const showGaps = depth === "full";

  // Extract role title and company from role lens
  const extractRoleInfo = () => {
    const roleMatch = roleLens.match(/Role:\s*(.+)/i);
    const companyMatch = roleLens.match(/Company:\s*(.+)/i);
    return {
      roleTitle: roleMatch ? roleMatch[1].trim() : "Role",
      companyName: companyMatch ? companyMatch[1].split('(')[0].trim() : "",
    };
  };

  const score = async () => {
    if (!candidateInput.trim() || !roleLens.trim()) return;
    setLoading(true); setError(null); setResult(null);
    // Reset premium doc state
    setRoleProfile(null);
    setInterviewFocus(null);
    setJdSuggestions(null);
    setShowPremiumDoc(false);

    try {
      const response = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt: buildSystemPrompt(gate, depth),
          roleLens: roleLens.trim(),
          candidateInput: candidateInput.trim(),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error || `API returned ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || "Scoring failed — unknown error");
    } finally {
      setLoading(false);
    }
  };

  const generatePremiumReport = async () => {
    if (!result) return;
    setGeneratingReport(true);
    setReportError(null);

    const { roleTitle, companyName } = extractRoleInfo();
    const candidateDimensions = candidateLensProfile.dimension_scores;

    try {
      // Step 1: Generate role profile from JD
      console.log("[PremiumReport] Step 1: Generating role profile...");
      const roleProfileRes = await fetch("/api/role-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jdText: roleLens,
          roleTitle,
          companyName,
        }),
      });

      if (!roleProfileRes.ok) {
        throw new Error("Failed to generate role profile");
      }
      const roleProfileData = await roleProfileRes.json();
      setRoleProfile(roleProfileData);
      console.log("[PremiumReport] Role profile generated:", roleProfileData);

      // Calculate gaps for subsequent calls
      const { calculateDualAlignment } = await import("../components/DualRadarChart");
      const alignment = calculateDualAlignment(candidateDimensions, roleProfileData.dimension_scores);

      // Step 2 & 3: Generate interview focus and JD suggestions in parallel
      console.log("[PremiumReport] Steps 2-3: Generating interview focus and JD suggestions...");
      const [interviewRes, jdRes] = await Promise.all([
        fetch("/api/interview-focus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matchData: result,
            candidateDimensions,
            roleDimensions: roleProfileData.dimension_scores,
            gaps: alignment.gaps,
            redFlags: result.gate_flags || [],
            strengths: result.signal_matches?.map(m => m.candidate_signal) || [],
          }),
        }),
        fetch("/api/jd-suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jdText: roleLens,
            matchData: result,
            candidateDimensions,
            roleDimensions: roleProfileData.dimension_scores,
            gaps: alignment.gaps,
          }),
        }),
      ]);

      if (interviewRes.ok) {
        const interviewData = await interviewRes.json();
        setInterviewFocus(interviewData);
        console.log("[PremiumReport] Interview focus generated:", interviewData);
      } else {
        console.warn("[PremiumReport] Interview focus failed, continuing...");
      }

      if (jdRes.ok) {
        const jdData = await jdRes.json();
        setJdSuggestions(jdData);
        console.log("[PremiumReport] JD suggestions generated:", jdData);
      } else {
        console.warn("[PremiumReport] JD suggestions failed, continuing...");
      }

      // Show the premium document
      setShowPremiumDoc(true);

    } catch (err) {
      console.error("[PremiumReport] Error:", err);
      setReportError(err.message || "Failed to generate premium report");
    } finally {
      setGeneratingReport(false);
    }
  };

  const classColor = (c) => {
    if (c === "STRONG FIT") return "#1a7a2e";
    if (c === "GOOD FIT") return "#b35c00";
    if (c === "MARGINAL") return "#996600";
    return "#D93025";
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setCandidateInput("");
    setRoleProfile(null);
    setInterviewFocus(null);
    setJdSuggestions(null);
    setShowPremiumDoc(false);
    setTimeout(() => candidateRef.current?.focus(), 50);
  };

  const buildReportText = () => {
    if (!result) return "";
    const lines = [
      `ROLE LENS MATCH REPORT`, `${"=".repeat(50)}`,
      `Classification: ${result.classification}`, `Score: ${result.total_score}/100`,
      `Mode: ${mode.name} (Gate: ${gate}, Depth: ${depth})`,
      `Scorer: v${VERSION}`,
      result.recommended_action ? `Action: ${result.recommended_action}` : null,
      ``, `BRIEFING:`, result.briefing,
    ].filter(x => x !== null);
    if (result.gate_flags?.length > 0) {
      lines.push(``, `GATE FLAGS:`);
      result.gate_flags.forEach(f => lines.push(`  * ${f}`));
    }
    lines.push(``, `DIMENSION SCORES:`);
    CATEGORIES.forEach(c => {
      const s = result.scores?.[c.key];
      if (s) lines.push(`  ${c.label}: ${s.score}/${c.max}${s.confidence ? ` (${Math.round(s.confidence * 100)}% conf)` : ""} — ${s.rationale}`);
    });
    if (showSignals && result.signal_matches?.length > 0) {
      lines.push(``, `ALIGNMENT SIGNALS:`);
      result.signal_matches.forEach(m => lines.push(`  [${m.dimension}] Candidate: ${m.candidate_signal} <> Role: ${m.role_signal}`));
    }
    if (showSignals && result.signal_tensions?.length > 0) {
      lines.push(``, `TENSION SIGNALS:`);
      result.signal_tensions.forEach(t => { lines.push(`  [${t.dimension}] ${t.candidate_signal} vs ${t.role_signal}`); if (t.interview_question) lines.push(`    Ask: "${t.interview_question}"`); });
    }
    if (showGaps && result.confidence_gaps?.length > 0) {
      lines.push(``, `CONFIDENCE GAPS:`);
      result.confidence_gaps.forEach(g => lines.push(`  — ${g}`));
    }
    return lines.join("\n");
  };

  const btn = (extra) => ({ padding: "10px 24px", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", border: "none", fontFamily: "inherit", transition: "all 0.15s", ...extra });

  const { roleTitle, companyName } = extractRoleInfo();

  return (
    <div style={{ minHeight: "100vh", background: "#FFFFFF", color: "#1A1A1A", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", display: "flex", justifyContent: "center", padding: "48px 24px" }}>
      <div style={{ width: "100%", maxWidth: 680 }}>

        {/* Header */}
        <div style={{ marginBottom: 40, borderBottom: "2px solid #1A1A1A", paddingBottom: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.25em", color: "#999", textTransform: "uppercase", marginBottom: 6 }}>Lens Project — Bidirectional Scoring — v{VERSION}</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>Role Lens Scorer</h1>
          <div style={{ fontSize: 13, color: "#666", marginTop: 8, lineHeight: 1.6 }}>Evaluate a candidate against the role lens across 6 identity dimensions. Adjust gate tolerance and analysis depth to control the evaluation.</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "#999" }}>R→C</span>
            <Tag variant="mode">{mode.name}</Tag>
            <span style={{ fontSize: 10, color: "#bbb" }}>{mode.desc}</span>
          </div>
        </div>

        {!result ? (
          <div>
            {/* Sliders */}
            <div style={{ marginBottom: 32, padding: "24px 24px 0", border: "1px solid #EEEEEE", background: "#FCFCFC" }}>
              <Slider levels={GATE_LEVELS} value={gate} onChange={setGate} label="Gate Tolerance" />
              <Slider levels={DEPTH_LEVELS} value={depth} onChange={setDepth} label="Analysis Depth" />
            </div>

            {/* Role Lens Toggle */}
            <div style={{ marginBottom: 24 }}>
              <button onClick={() => setShowRoleLens(!showRoleLens)} style={btn({ padding: "8px 16px", background: "transparent", border: "1px solid #ddd", color: "#666", display: "flex", alignItems: "center", gap: 6 })}>
                <span style={{ fontSize: 14, transform: showRoleLens ? "rotate(90deg)" : "none", transition: "transform 0.15s", display: "inline-block" }}>▸</span>
                {showRoleLens ? "Hide" : "Edit"} Role Lens Context
              </button>
              {showRoleLens && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, color: "#999", marginBottom: 6 }}>Pre-loaded with LeanData example. Edit or replace with any role description.</div>
                  <textarea value={roleLens} onChange={(e) => setRoleLens(e.target.value)} rows={16}
                    style={{ width: "100%", background: "#FAFAFA", border: "1px solid #ddd", padding: "14px 16px", color: "#333", fontSize: 12, fontFamily: "monospace", lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box" }}
                    onFocus={(e) => (e.target.style.borderColor = "#999")} onBlur={(e) => (e.target.style.borderColor = "#ddd")} />
                </div>
              )}
            </div>

            {/* Candidate Input */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#999", textTransform: "uppercase", marginBottom: 8 }}>Candidate Profile</div>
              <textarea ref={candidateRef} value={candidateInput} onChange={(e) => setCandidateInput(e.target.value)}
                placeholder={"Paste candidate information here:\n\n— Resume text\n— LinkedIn profile content\n— Lens document (YAML + markdown)\n— Recruiter notes\n— Any combination"}
                rows={14} style={{ width: "100%", background: "#FAFAFA", border: "1px solid #ddd", padding: "14px 16px", color: "#1A1A1A", fontSize: 13, fontFamily: "inherit", lineHeight: 1.7, resize: "vertical", outline: "none", boxSizing: "border-box" }}
                onFocus={(e) => (e.target.style.borderColor = "#D93025")} onBlur={(e) => (e.target.style.borderColor = "#ddd")} />
            </div>

            {/* Score Button */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button onClick={score} disabled={loading || !candidateInput.trim()}
                style={btn({ background: loading || !candidateInput.trim() ? "#eee" : "#D93025", color: loading || !candidateInput.trim() ? "#aaa" : "#fff", cursor: loading || !candidateInput.trim() ? "default" : "pointer", fontWeight: 600 })}>
                {loading ? "Evaluating…" : `Score — ${mode.name}`}
              </button>
              <span style={{ fontSize: 11, color: "#bbb" }}>{candidateInput.length > 0 ? `${candidateInput.length.toLocaleString()} chars` : ""}</span>
            </div>

            {loading && <div style={{ display: "flex", gap: 4, marginTop: 24, justifyContent: "center" }}>{[0,1,2,3,4].map(i => <div key={i} style={{ width: 3, height: 18, background: "#D93025", animation: `pulse 0.8s ease-in-out ${i*0.1}s infinite alternate` }} />)}</div>}
            {error && <div style={{ marginTop: 16, padding: "12px 16px", background: "#fef5f4", border: "1px solid #f8d0cd", fontSize: 12, color: "#D93025" }}>{error}</div>}
          </div>
        ) : (
          <div>
            {/* Mode tags */}
            <div style={{ marginBottom: 16 }}>
              <Tag variant="mode">{mode.name}</Tag>
              <Tag variant="neutral">Gate: {gate}</Tag>
              <Tag variant="neutral">Depth: {depth}</Tag>
            </div>

            {/* Classification */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 8, paddingBottom: 24, borderBottom: "2px solid #1A1A1A" }}>
              {result.disqualified ? (
                <div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: "#D93025" }}>DISQUALIFIED</div>
                  <div style={{ fontSize: 13, color: "#D93025", marginTop: 6 }}>{result.disqualify_reason}</div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 48, fontWeight: 300, fontFamily: "monospace", color: classColor(result.classification), lineHeight: 1 }}>{result.total_score}</div>
                  <div>
                    <div style={{ fontSize: 14, letterSpacing: "0.15em", color: classColor(result.classification), textTransform: "uppercase", fontWeight: 700 }}>{result.classification}</div>
                    {result.recommended_action && <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>→ {result.recommended_action}</div>}
                  </div>
                </>
              )}
            </div>

            {/* Gate Flags */}
            {result.gate_flags?.length > 0 && (
              <div style={{ marginBottom: 24, padding: "12px 16px", background: "#fff8f0", border: "1px solid #ffe0b2" }}>
                <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "#b35c00", textTransform: "uppercase", marginBottom: 8, fontWeight: 600 }}>Gate Flags — Near-Misses</div>
                {result.gate_flags.map((f, i) => <div key={i} style={{ fontSize: 12, color: "#996600", lineHeight: 1.6, marginBottom: 4 }}>⚠ {f}</div>)}
              </div>
            )}

            {/* Briefing */}
            {result.briefing && <div style={{ fontSize: 14, color: "#444", lineHeight: 1.8, marginBottom: 28, paddingBottom: 24, borderBottom: "1px solid #EEEEEE" }}>{result.briefing}</div>}

            {/* Scores */}
            {!result.disqualified && result.scores && (
              <div style={{ marginBottom: 28, paddingBottom: 24, borderBottom: "1px solid #EEEEEE" }}>
                <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#999", textTransform: "uppercase", marginBottom: 18 }}>Dimension Scores</div>
                {CATEGORIES.map(cat => { const s = result.scores[cat.key]; return s ? <ScoreBar key={cat.key} score={s.score} max={cat.max} label={cat.label} rationale={s.rationale} confidence={s.confidence} showConfidence={showConfidence} /> : null; })}
              </div>
            )}

            {/* Matches */}
            {showSignals && result.signal_matches?.length > 0 && (
              <div style={{ marginBottom: 28, paddingBottom: 24, borderBottom: "1px solid #EEEEEE" }}>
                <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#999", textTransform: "uppercase", marginBottom: 14 }}>Alignment Signals</div>
                {result.signal_matches.map((m, i) => (
                  <div key={i} style={{ marginBottom: 14, paddingLeft: 12, borderLeft: "2px solid #1a7a2e" }}>
                    <div style={{ display: "flex", gap: 6, marginBottom: 4, flexWrap: "wrap" }}><Tag variant="match">{m.dimension}</Tag><Tag variant="match">{m.strength}</Tag></div>
                    <div style={{ fontSize: 12, color: "#333", lineHeight: 1.6 }}><span style={{ fontWeight: 600 }}>Candidate:</span> {m.candidate_signal}</div>
                    <div style={{ fontSize: 12, color: "#333", lineHeight: 1.6 }}><span style={{ fontWeight: 600 }}>Role needs:</span> {m.role_signal}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Tensions */}
            {showSignals && result.signal_tensions?.length > 0 && (
              <div style={{ marginBottom: 28, paddingBottom: 24, borderBottom: "1px solid #EEEEEE" }}>
                <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#999", textTransform: "uppercase", marginBottom: 14 }}>Tension Signals</div>
                {result.signal_tensions.map((t, i) => (
                  <div key={i} style={{ marginBottom: 18, paddingLeft: 12, borderLeft: "2px solid #D93025" }}>
                    <div style={{ display: "flex", gap: 6, marginBottom: 4, flexWrap: "wrap" }}><Tag variant="tension">{t.dimension}</Tag><Tag variant="tension">{t.severity}</Tag></div>
                    <div style={{ fontSize: 12, color: "#333", lineHeight: 1.6 }}><span style={{ fontWeight: 600 }}>Candidate:</span> {t.candidate_signal}</div>
                    <div style={{ fontSize: 12, color: "#333", lineHeight: 1.6 }}><span style={{ fontWeight: 600 }}>Role needs:</span> {t.role_signal}</div>
                    {t.interview_question && <div style={{ fontSize: 12, color: "#E8590C", lineHeight: 1.6, marginTop: 6, fontStyle: "italic" }}>Ask: "{t.interview_question}"</div>}
                  </div>
                ))}
              </div>
            )}

            {/* Confidence Gaps */}
            {showGaps && result.confidence_gaps?.length > 0 && (
              <div style={{ marginBottom: 28, paddingBottom: 24, borderBottom: "1px solid #EEEEEE" }}>
                <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#999", textTransform: "uppercase", marginBottom: 14 }}>Confidence Gaps</div>
                {result.confidence_gaps.map((g, i) => <div key={i} style={{ fontSize: 12, color: "#666", lineHeight: 1.7, marginBottom: 8, paddingLeft: 12, borderLeft: "2px solid #EEEEEE" }}>{g}</div>)}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={reset} style={btn({ background: "transparent", border: "1px solid #D93025", color: "#D93025" })}>Score another</button>
              <button
                onClick={generatePremiumReport}
                disabled={generatingReport}
                style={btn({
                  background: generatingReport ? "#eee" : "#1a7a2e",
                  color: generatingReport ? "#aaa" : "#fff",
                  cursor: generatingReport ? "default" : "pointer",
                  fontWeight: 600,
                })}
              >
                {generatingReport ? "Generating..." : "Download Match Report"}
              </button>
              <button onClick={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2))} style={btn({ background: "transparent", border: "1px solid #ddd", color: "#999" })}>Copy JSON</button>
              <button onClick={() => navigator.clipboard.writeText(buildReportText())} style={btn({ background: "transparent", border: "1px solid #ddd", color: "#999" })}>Copy Report</button>
            </div>

            {/* Report generation error */}
            {reportError && (
              <div style={{ marginTop: 16, padding: "12px 16px", background: "#fef5f4", border: "1px solid #f8d0cd", fontSize: 12, color: "#D93025" }}>
                {reportError}
              </div>
            )}

            {/* Report generation progress */}
            {generatingReport && (
              <div style={{ marginTop: 16, padding: "12px 16px", background: "#f1f8f1", border: "1px solid #c8e6c9", fontSize: 12, color: "#1a7a2e" }}>
                Generating premium match report... This takes 5-10 seconds.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Premium Match Document Modal */}
      {showPremiumDoc && (
        <PremiumMatchDocument
          roleTitle={roleTitle}
          companyName={companyName}
          candidateName={candidateLensProfile.name}
          candidateDimensions={candidateLensProfile.dimension_scores}
          roleDimensions={roleProfile?.dimension_scores}
          roleProfile={roleProfile}
          matchData={result}
          interviewFocus={interviewFocus}
          jdSuggestions={jdSuggestions}
          onClose={() => setShowPremiumDoc(false)}
        />
      )}

      <style>{`@keyframes pulse { 0% { opacity: 0.15 } 100% { opacity: 0.9 } } textarea::placeholder { color: #bbb } * { box-sizing: border-box }`}</style>
    </div>
  );
}
