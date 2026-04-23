import { useState, useEffect, useRef } from "react";

const LENS_URL =
  "https://raw.githubusercontent.com/zelman/tidepool/refs/heads/main/tide-pool-agent-lens.md";

// Tier 1: Universal scoring engine instructions (same for every user, every source)
const TIER_1_SYSTEM = `You are a job opportunity scoring engine. You receive a candidate's full lens document and evaluate opportunities against it. You score ruthlessly and honestly — the goal is signal, not encouragement.

## SCORING PROCESS

1. **Parse the lens document's YAML frontmatter** for machine-readable disqualifiers, penalties, bonuses, and thresholds.
2. **Apply hard gates first** (YAML \`disqualify\` section). If any gate triggers, stop and return disqualified=true with reason.
3. **Apply the Customer Persona Gate** if present in the lens. Classify the opportunity's end-user persona and check enterprise exceptions.
4. **Apply the Pre-CS Inflection check** — if the company appears to be below the lens's minimum employee threshold, disqualify.
5. **Score using the lens's scoring framework** (Company Stage & Fit, Role Type, Mission Alignment, plus any bonuses/penalties defined in the lens).
6. **Apply penalties and bonuses** as specific point values from the lens YAML.
7. **Classify using the lens's thresholds** (not your own — use whatever thresholds the lens defines).

## CRITICAL RULES

- Use the scoring weights, thresholds, bonuses, and penalties FROM THE LENS DOCUMENT. Do not substitute your own.
- The lens is the candidate's voice. Trust its disqualifiers, its sector preferences, its title flexibility guidance.
- Builder vs. Maintainer is a spectrum, not a binary. Score builder signals positively but do not auto-disqualify roles that blend both unless the lens explicitly says to.
- IC roles are acceptable at early-stage companies if the lens's title flexibility section permits it. Apply IC penalties as defined in the lens, scaled by company size.
- If data is insufficient to score confidently, say so. Don't guess funding stages or employee counts.
- "Outreach feasibility" is not a scoring dimension — it's operational. Score the opportunity itself.

## OUTPUT FORMAT

Respond with ONLY a valid JSON object. No markdown, no backticks, no preamble.`;

// Tier 3: Output schema (same for every user)
const TIER_3_OUTPUT = `
## REQUIRED JSON STRUCTURE

Use the classification names from the lens thresholds. The v2.15 lens uses:
STRONG_FIT (80+), GOOD_FIT (60-79), MARGINAL (40-59), SKIP (<40).

{
  "disqualified": false,
  "disqualify_reason": null,
  "classification": "STRONG_FIT",
  "total_score": 72,
  "scores": {
    "company_stage_fit": { "score": 40, "max": 50, "rationale": "..." },
    "role_type": { "score": 22, "max": 30, "rationale": "..." },
    "mission_alignment": { "score": 10, "max": 20, "rationale": "..." }
  },
  "bonuses_applied": [
    { "rule": "Builder language in JD", "points": 40 },
    { "rule": "Healthcare B2B SaaS", "points": 15 }
  ],
  "penalties_applied": [
    { "rule": "Support title without Director/VP/Head", "points": -5 }
  ],
  "adjusted_score": 77,
  "builder_or_maintainer": "Builder",
  "builder_signals": ["first hire", "build from scratch"],
  "maintainer_signals": [],
  "customer_persona": "business_user",
  "briefing": "2-3 sentence narrative summary of why this is or isn't a fit",
  "red_flags": ["any concerns"],
  "strengths": ["what's compelling"],
  "data_gaps": ["anything you couldn't verify"]
}`;

const SCORE_CATEGORIES = [
  { key: "company_stage_fit", label: "Company Stage & Fit", max: 50 },
  { key: "role_type", label: "Role Type", max: 30 },
  { key: "mission_alignment", label: "Mission Alignment", max: 20 },
];

function ScoreBar({ score, max, label, rationale }) {
  const pct = Math.round((score / max) * 100);
  const color = pct >= 70 ? "#1A1A1A" : pct >= 40 ? "#666666" : "#D93025";
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: "#1A1A1A", letterSpacing: "0.02em" }}>{label}</span>
        <span style={{ fontSize: 12, color: "#666", fontFamily: "monospace" }}>{score}/{max}</span>
      </div>
      <div style={{ height: 2, background: "#EEEEEE", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, transition: "width 0.8s ease" }} />
      </div>
      {rationale && (
        <div style={{ fontSize: 12, color: "#666", lineHeight: 1.6, marginTop: 6 }}>{rationale}</div>
      )}
    </div>
  );
}

function Tag({ children, variant = "default" }) {
  const styles = {
    builder: { color: "#1A1A1A", borderColor: "#1A1A1A" },
    maintainer: { color: "#D93025", borderColor: "#D93025" },
    default: { color: "#666", borderColor: "#CCCCCC" },
  };
  const s = styles[variant] || styles.default;
  return (
    <span style={{
      fontSize: 11, color: s.color, padding: "3px 8px",
      border: `1px solid ${s.borderColor}`, letterSpacing: "0.02em", display: "inline-block",
    }}>
      {children}
    </span>
  );
}

function LensStatus({ status, onRetry }) {
  if (status === "loading") {
    return <div style={{ fontSize: 12, color: "#999", marginBottom: 20 }}>Fetching lens from GitHub...</div>;
  }
  if (status === "error") {
    return (
      <div style={{ fontSize: 12, color: "#D93025", marginBottom: 20, padding: "12px 16px", border: "1px solid #D93025", background: "#FFF5F5" }}>
        Could not fetch lens from GitHub. You can paste the lens document manually, or{" "}
        <span onClick={onRetry} style={{ textDecoration: "underline", cursor: "pointer" }}>retry</span>.
      </div>
    );
  }
  if (status === "loaded") {
    return (
      <div style={{ fontSize: 12, color: "#666", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ display: "inline-block", width: 6, height: 6, background: "#1A1A1A" }} />
        Lens loaded from GitHub
      </div>
    );
  }
  if (status === "manual") {
    return (
      <div style={{ fontSize: 12, color: "#E8590C", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ display: "inline-block", width: 6, height: 6, background: "#E8590C" }} />
        Using manually pasted lens
      </div>
    );
  }
  return null;
}

export default function LensScorer() {
  const [lens, setLens] = useState("");
  const [lensStatus, setLensStatus] = useState("loading");
  const [showLensEditor, setShowLensEditor] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const textareaRef = useRef(null);

  const fetchLens = async () => {
    setLensStatus("loading");
    try {
      const res = await fetch(LENS_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (text && text.length > 500) {
        setLens(text);
        setLensStatus("loaded");
      } else {
        throw new Error("Response too short");
      }
    } catch {
      setLensStatus("error");
    }
  };

  useEffect(() => { fetchLens(); }, []);

  useEffect(() => {
    if (textareaRef.current && (lensStatus === "loaded" || lensStatus === "manual")) {
      textareaRef.current.focus();
    }
  }, [lensStatus]);

  const score = async () => {
    if (!input.trim() || !lens.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const systemPrompt = [
      TIER_1_SYSTEM,
      "\n\n## CANDIDATE LENS DOCUMENT (Tier 2 — from candidate's lens file)\n\n",
      lens,
      "\n\n",
      TIER_3_OUTPUT,
    ].join("");

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-opus-4-7",
          max_tokens: 2000,
          system: systemPrompt,
          messages: [{ role: "user", content: `Score this opportunity against the lens:\n\n${input.trim()}` }],
        }),
      });

      const data = await response.json();
      const text = data.content?.filter((b) => b.type === "text").map((b) => b.text).join("");
      if (!text) throw new Error("No response from scoring engine");
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
    } catch (err) {
      setError(err.message || "Scoring failed");
    } finally {
      setLoading(false);
    }
  };

  const classColor = (c) => {
    if (c === "STRONG_FIT") return "#1A1A1A";
    if (c === "GOOD_FIT") return "#E8590C";
    if (c === "MARGINAL") return "#666";
    return "#D93025";
  };

  const classLabel = (c) => {
    if (c === "STRONG_FIT") return "Strong Fit";
    if (c === "GOOD_FIT") return "Good Fit";
    if (c === "MARGINAL") return "Marginal";
    if (c === "SKIP") return "Skip";
    return c;
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setInput("");
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const lensVersion = lens.match(/version:\s*"?([^"\n]+)"?/)?.[1] || "—";
  const lensUpdated = lens.match(/last_updated:\s*"?([^"\n]+)"?/)?.[1] || "";

  return (
    <div style={{
      minHeight: "100vh", background: "#FFFFFF", color: "#1A1A1A",
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      display: "flex", justifyContent: "center", padding: "48px 24px",
    }}>
      <div style={{ width: "100%", maxWidth: 640 }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#999", textTransform: "uppercase", marginBottom: 8 }}>
            Tide Pool
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1A1A1A", margin: 0, lineHeight: 1.2 }}>
            Lens Scorer
          </h1>
          <div style={{ fontSize: 14, color: "#666", marginTop: 8, lineHeight: 1.6 }}>
            Paste a job listing or company description. Scores against your lens document using the same model as the n8n pipeline.
          </div>
          <div style={{ height: 2, background: "#1A1A1A", marginTop: 20 }} />
        </div>

        {/* Lens Status */}
        <LensStatus status={lensStatus} onRetry={fetchLens} />

        {/* Lens controls */}
        {(lensStatus === "loaded" || lensStatus === "manual") && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 12, color: "#999" }}>
                v{lensVersion}{lensUpdated ? ` · ${lensUpdated}` : ""}{" · "}{Math.round(lens.length / 1024)}KB
              </div>
              <button
                onClick={() => setShowLensEditor(!showLensEditor)}
                style={{ fontSize: 11, color: "#999", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0, fontFamily: "inherit" }}
              >
                {showLensEditor ? "Hide lens" : "View / edit lens"}
              </button>
            </div>
            {showLensEditor && (
              <textarea
                value={lens}
                onChange={(e) => { setLens(e.target.value); setLensStatus("manual"); }}
                rows={10}
                style={{
                  width: "100%", marginTop: 10, background: "#FAFAFA", border: "1px solid #EEEEEE",
                  padding: "12px 14px", color: "#1A1A1A", fontSize: 11, fontFamily: "monospace",
                  lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box",
                }}
              />
            )}
          </div>
        )}

        {/* Manual lens paste fallback */}
        {lensStatus === "error" && !lens && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>Paste your lens document:</div>
            <textarea
              value={lens}
              onChange={(e) => { setLens(e.target.value); if (e.target.value.length > 500) setLensStatus("manual"); }}
              placeholder="Paste your tide-pool-agent-lens.md content here..."
              rows={8}
              style={{
                width: "100%", background: "#FAFAFA", border: "1px solid #CCCCCC",
                padding: "12px 14px", color: "#1A1A1A", fontSize: 12, fontFamily: "monospace",
                lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
        )}

        {/* Opportunity Input */}
        {!result && (lensStatus === "loaded" || lensStatus === "manual") && (
          <div>
            <div style={{ height: 1, background: "#EEEEEE", marginBottom: 20 }} />
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste job listing, company description, or job URL content here..."
              rows={12}
              style={{
                width: "100%", background: "#FFFFFF", border: "1px solid #CCCCCC",
                padding: "14px 16px", color: "#1A1A1A", fontSize: 14,
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                lineHeight: 1.7, resize: "vertical", outline: "none", boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#1A1A1A")}
              onBlur={(e) => (e.target.style.borderColor = "#CCCCCC")}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
              <button
                onClick={score}
                disabled={loading || !input.trim()}
                style={{
                  padding: "12px 28px",
                  background: loading || !input.trim() ? "#EEEEEE" : "#D93025",
                  border: "none",
                  color: loading || !input.trim() ? "#999" : "#FFFFFF",
                  fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
                  cursor: loading || !input.trim() ? "default" : "pointer",
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                }}
              >
                {loading ? "Scoring..." : "Score this opportunity"}
              </button>
              <span style={{ fontSize: 12, color: "#999" }}>
                {input.length > 0 ? `${input.length.toLocaleString()} chars` : ""}
              </span>
            </div>

            {loading && (
              <div style={{ marginTop: 24, display: "flex", gap: 6, justifyContent: "center" }}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} style={{
                    width: 3, height: 18, background: "#D93025",
                    animation: `bar 0.9s ease-in-out ${i * 0.1}s infinite alternate`,
                  }} />
                ))}
              </div>
            )}

            {error && (
              <div style={{ marginTop: 16, padding: "12px 16px", background: "#FFF5F5", border: "1px solid #D93025", fontSize: 13, color: "#D93025" }}>
                {error}
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {result && (
          <div>
            {/* Classification Banner */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 8, paddingBottom: 24, borderBottom: "2px solid #1A1A1A" }}>
              {result.disqualified ? (
                <div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: "#D93025" }}>DISQUALIFIED</div>
                  <div style={{ fontSize: 14, color: "#D93025", marginTop: 6 }}>{result.disqualify_reason}</div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 48, fontWeight: 700, color: classColor(result.classification), lineHeight: 1 }}>
                    {result.adjusted_score ?? result.total_score}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, letterSpacing: "0.15em", color: classColor(result.classification), textTransform: "uppercase", fontWeight: 700 }}>
                      {classLabel(result.classification)}
                    </div>
                    {result.adjusted_score != null && result.adjusted_score !== result.total_score && (
                      <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                        {result.total_score} base {result.adjusted_score > result.total_score ? "+" : ""}{result.adjusted_score - result.total_score} adj.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Briefing */}
            {result.briefing && (
              <div style={{ fontSize: 14, color: "#444", lineHeight: 1.8, paddingTop: 20, paddingBottom: 24, borderBottom: "1px solid #EEEEEE" }}>
                {result.briefing}
              </div>
            )}

            {/* Builder / Maintainer + Customer Persona */}
            {!result.disqualified && (
              <div style={{ paddingTop: 20, paddingBottom: 24, borderBottom: "1px solid #EEEEEE" }}>
                <div style={{ display: "flex", gap: 32, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#999", textTransform: "uppercase", marginBottom: 6 }}>Role Type</div>
                    <div style={{
                      fontSize: 16, fontWeight: 700,
                      color: result.builder_or_maintainer === "Builder" ? "#1A1A1A" : result.builder_or_maintainer === "Maintainer" ? "#D93025" : "#666",
                    }}>
                      {result.builder_or_maintainer}
                    </div>
                  </div>
                  {result.customer_persona && (
                    <div>
                      <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#999", textTransform: "uppercase", marginBottom: 6 }}>Customer Persona</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A" }}>{result.customer_persona.replace(/_/g, " ")}</div>
                    </div>
                  )}
                </div>
                {result.builder_signals?.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                    {result.builder_signals.map((s) => <Tag key={s} variant="builder">{s}</Tag>)}
                  </div>
                )}
                {result.maintainer_signals?.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {result.maintainer_signals.map((s) => <Tag key={s} variant="maintainer">{s}</Tag>)}
                  </div>
                )}
              </div>
            )}

            {/* Score Breakdown */}
            {!result.disqualified && result.scores && (
              <div style={{ paddingTop: 20, paddingBottom: 24, borderBottom: "1px solid #EEEEEE" }}>
                <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#999", textTransform: "uppercase", marginBottom: 16 }}>
                  Score Breakdown
                </div>
                {SCORE_CATEGORIES.map((cat) => {
                  const s = result.scores[cat.key];
                  if (!s) return null;
                  return <ScoreBar key={cat.key} score={s.score} max={cat.max} label={cat.label} rationale={s.rationale} />;
                })}
              </div>
            )}

            {/* Bonuses & Penalties */}
            {!result.disqualified && (result.bonuses_applied?.length > 0 || result.penalties_applied?.length > 0) && (
              <div style={{ paddingTop: 20, paddingBottom: 24, borderBottom: "1px solid #EEEEEE" }}>
                <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#999", textTransform: "uppercase", marginBottom: 12 }}>
                  Adjustments
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {result.bonuses_applied?.map((b, i) => (
                    <div key={`b${i}`} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#1A1A1A" }}>{b.rule}</span>
                      <span style={{ fontFamily: "monospace", color: "#1A1A1A", fontWeight: 600 }}>+{b.points}</span>
                    </div>
                  ))}
                  {result.penalties_applied?.map((p, i) => (
                    <div key={`p${i}`} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#D93025" }}>{p.rule}</span>
                      <span style={{ fontFamily: "monospace", color: "#D93025", fontWeight: 600 }}>{p.points}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths & Red Flags */}
            {(result.strengths?.length > 0 || result.red_flags?.length > 0) && (
              <div style={{ paddingTop: 20, paddingBottom: 24, borderBottom: "1px solid #EEEEEE" }}>
                {result.strengths?.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#999", textTransform: "uppercase", marginBottom: 10 }}>Strengths</div>
                    {result.strengths.map((s, i) => (
                      <div key={i} style={{ fontSize: 13, color: "#1A1A1A", lineHeight: 1.7, paddingLeft: 12, borderLeft: "2px solid #1A1A1A", marginBottom: 6 }}>{s}</div>
                    ))}
                  </div>
                )}
                {result.red_flags?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#999", textTransform: "uppercase", marginBottom: 10 }}>Red Flags</div>
                    {result.red_flags.map((s, i) => (
                      <div key={i} style={{ fontSize: 13, color: "#D93025", lineHeight: 1.7, paddingLeft: 12, borderLeft: "2px solid #D93025", marginBottom: 6 }}>{s}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Data Gaps */}
            {result.data_gaps?.length > 0 && (
              <div style={{ paddingTop: 20, paddingBottom: 24, borderBottom: "1px solid #EEEEEE" }}>
                <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#999", textTransform: "uppercase", marginBottom: 10 }}>Data Gaps</div>
                {result.data_gaps.map((g, i) => (
                  <div key={i} style={{ fontSize: 13, color: "#E8590C", lineHeight: 1.7, paddingLeft: 12, borderLeft: "2px solid #E8590C", marginBottom: 6 }}>{g}</div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 12, paddingTop: 24 }}>
              <button onClick={reset} style={{
                padding: "12px 28px", background: "#D93025", border: "none", color: "#FFFFFF",
                fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
                cursor: "pointer", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              }}>
                Score another
              </button>
              <button onClick={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2))} style={{
                padding: "12px 28px", background: "#FFFFFF", border: "1px solid #CCCCCC", color: "#666",
                fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
                cursor: "pointer", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              }}>
                Copy JSON
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes bar { 0% { opacity: 0.15 } 100% { opacity: 1 } }
        textarea::placeholder { color: #CCCCCC }
        ::-webkit-scrollbar { width: 3px }
        ::-webkit-scrollbar-track { background: transparent }
        ::-webkit-scrollbar-thumb { background: #EEEEEE }
      `}</style>
    </div>
  );
}
