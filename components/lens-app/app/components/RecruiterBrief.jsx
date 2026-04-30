"use client";

import { useRef } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS (Swiss Style)
// ═══════════════════════════════════════════════════════════════════════════

const C = {
  ink: "#1A1A1A",
  paper: "#FFFFFF",
  red: "#D93025",
  green: "#2D6A2D",
  orange: "#E8590C",
  muted: "#888888",
  hairline: "#EEEEEE",
  glanceBg: "#F8F8F8",
};

const FONT = "system-ui, -apple-system, 'Segoe UI', sans-serif";
const MONO = "'JetBrains Mono', 'SF Mono', Consolas, monospace";

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * RecruiterBrief - Single-page recruiter brief renderer
 * @param {Object} props
 * @param {Object} props.brief - Structured brief data from /api/recruiter-brief
 * @param {Function} props.onClose - Callback when closing modal
 * @param {boolean} props.inline - If true, renders without modal wrapper
 * @param {string} props.buildId - Build version for PDF filename
 */
export default function RecruiterBrief({ brief, onClose, inline = false, buildId = "draft" }) {
  const printRef = useRef(null);

  if (!brief) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: C.muted }}>
        No brief data available.
      </div>
    );
  }

  const { header, atAGlance, signal, roleFit } = brief;

  // ─────────────────────────────────────────────────────────────────────────
  // HEADER
  // ─────────────────────────────────────────────────────────────────────────
  const Header = () => (
    <div style={{ marginBottom: "20px" }}>
      {/* Masthead */}
      <div style={{
        fontSize: "9px",
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: C.red,
        marginBottom: "8px",
      }}>
        CANDIDATE LENS · RECRUITER VIEW
      </div>

      {/* Red rule */}
      <div style={{ height: "2px", background: C.red, marginBottom: "12px" }} />

      {/* Name + Role */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: C.ink, marginBottom: "2px" }}>
            {header?.name || "Unknown Candidate"}
          </div>
          <div style={{ fontSize: "14px", color: C.ink }}>
            {header?.role || "Role"} · {header?.company || "Company"}
          </div>
          <div style={{ fontSize: "10px", color: C.muted, marginTop: "4px" }}>
            {header?.date || new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </div>
        </div>

        {/* Metadata pills */}
        <div style={{ textAlign: "right" }}>
          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", flexWrap: "wrap" }}>
            {header?.tenure && <MetadataPill>{header.tenure}</MetadataPill>}
            {header?.domain && <MetadataPill>{header.domain}</MetadataPill>}
          </div>
          {header?.trackRecord && (
            <div style={{
              marginTop: "6px",
              fontSize: "9px",
              fontFamily: MONO,
              color: C.ink,
              background: "#F0F0F0",
              padding: "4px 8px",
              display: "inline-block",
            }}>
              {header.trackRecord}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // AT A GLANCE (6 rows)
  // ─────────────────────────────────────────────────────────────────────────
  const AtAGlance = () => {
    if (!atAGlance) return null;

    const rows = [
      {
        label: "COMP FLOOR",
        value: atAGlance.compFloor ? (
          <>
            <strong>{atAGlance.compFloor.value}</strong>
            {atAGlance.compFloor.signal && (
              <span style={{ color: C.muted }}> — {atAGlance.compFloor.signal}</span>
            )}
          </>
        ) : "—",
      },
      {
        label: "TARGET",
        value: atAGlance.target || "—",
      },
      {
        label: "DOMAIN LOCK",
        value: atAGlance.domainLock ? (
          <>
            <strong>{atAGlance.domainLock.domain}</strong>
            {atAGlance.domainLock.rationale && (
              <span style={{ color: C.muted }}> — {atAGlance.domainLock.rationale}</span>
            )}
          </>
        ) : "—",
      },
      {
        label: "LOCATION",
        value: atAGlance.location ? (
          <>
            <LocationDot signal={atAGlance.location.fitSignal} />
            <span>
              {atAGlance.location.candidateCity}
              {atAGlance.location.roleArrangement && ` · ${atAGlance.location.roleArrangement}`}
            </span>
          </>
        ) : "—",
      },
      {
        label: "TRACK RECORD",
        value: atAGlance.trackRecord || "—",
      },
      {
        label: "HARD NO'S",
        value: atAGlance.hardNos?.length > 0 ? atAGlance.hardNos.join(" · ") : "—",
      },
    ];

    return (
      <div style={{ marginBottom: "16px" }}>
        <SectionLabel>AT A GLANCE</SectionLabel>
        <div style={{
          background: C.glanceBg,
          border: `0.5px solid ${C.hairline}`,
          padding: "10px 12px",
        }}>
          {rows.map((row, idx) => (
            <div key={idx} style={{
              display: "flex",
              gap: "12px",
              marginBottom: idx < rows.length - 1 ? "4px" : 0,
              fontSize: "10px",
              lineHeight: 1.4,
            }}>
              <div style={{
                width: "90px",
                flexShrink: 0,
                fontWeight: 700,
                fontSize: "9px",
                textTransform: "uppercase",
                color: C.ink,
              }}>
                {row.label}
              </div>
              <div style={{ flex: 1, color: C.ink }}>
                {row.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SIGNAL (Strengths / Watches)
  // ─────────────────────────────────────────────────────────────────────────
  const Signal = () => {
    if (!signal || signal.length === 0) return null;

    return (
      <div style={{ marginBottom: "16px" }}>
        <SectionLabel>SIGNAL · STRENGTH / WATCH</SectionLabel>
        <div style={{ paddingLeft: "2px" }}>
          {signal.map((item, idx) => (
            <div key={idx} style={{
              display: "flex",
              gap: "8px",
              marginBottom: "4px",
              fontSize: "9.5px",
              lineHeight: 1.5,
            }}>
              <span style={{
                color: item.type === "strength" ? C.green : C.orange,
                fontSize: "8px",
                marginTop: "2px",
              }}>
                ●
              </span>
              <span style={{ color: C.ink }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ROLE FIT
  // ─────────────────────────────────────────────────────────────────────────
  const RoleFit = () => {
    if (!roleFit) return null;

    return (
      <div style={{ marginBottom: "16px" }}>
        <SectionLabel>ROLE FIT</SectionLabel>
        <div style={{
          fontSize: "11px",
          color: C.ink,
          marginBottom: "10px",
        }}>
          {header?.role} · {header?.company}
        </div>

        <div style={{ fontSize: "9.5px", lineHeight: 1.6 }}>
          {/* Lines Up */}
          {roleFit.linesUp && (
            <p style={{ margin: "0 0 8px" }}>
              <strong style={{ textTransform: "uppercase", fontSize: "9px" }}>LINES UP.</strong>{" "}
              {roleFit.linesUp}
            </p>
          )}

          {/* Tension */}
          {roleFit.tension && (
            <p style={{ margin: "0 0 8px" }}>
              <strong style={{ textTransform: "uppercase", fontSize: "9px" }}>TENSION / LANDMINE.</strong>{" "}
              {roleFit.tension}
            </p>
          )}

          {/* Open Questions */}
          {roleFit.openQuestions && roleFit.openQuestions.length > 0 && (
            <div>
              <strong style={{ textTransform: "uppercase", fontSize: "9px" }}>OPEN QUESTIONS.</strong>
              <div style={{ marginTop: "4px" }}>
                {roleFit.openQuestions.map((q, idx) => (
                  <div key={idx} style={{
                    display: "flex",
                    gap: "6px",
                    marginBottom: "3px",
                  }}>
                    <span style={{ color: C.muted }}>?</span>
                    <span style={{
                      color: q.audience === "candidate" ? C.muted : C.ink,
                      fontStyle: q.audience === "candidate" ? "italic" : "normal",
                    }}>
                      {q.audience === "candidate" && (
                        <span style={{ fontSize: "8px", textTransform: "uppercase", marginRight: "4px" }}>
                          FOR {header?.name?.split(" ")[0]?.toUpperCase() || "CANDIDATE"}:
                        </span>
                      )}
                      {q.question}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // FOOTER
  // ─────────────────────────────────────────────────────────────────────────
  const Footer = () => (
    <div style={{
      borderTop: `0.5px solid ${C.hairline}`,
      paddingTop: "8px",
      marginTop: "auto",
      display: "flex",
      justifyContent: "space-between",
      fontSize: "8px",
      color: C.muted,
    }}>
      <span>LENS · RECRUITER VIEW · DRAFT v0.3</span>
      <span>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // PRINT HANDLER
  // ─────────────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    // Set document title for PDF filename: user_name_lens_brief_buildId
    const originalTitle = document.title;
    const userName = header?.name?.toLowerCase().replace(/\s+/g, "_") || "candidate";
    document.title = `${userName}_lens_brief_${buildId}`;

    // Small delay to ensure title is set before print dialog opens
    setTimeout(() => {
      window.print();

      // Restore title after print dialog closes
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    }, 100);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // DOCUMENT CONTENT
  // ─────────────────────────────────────────────────────────────────────────
  const documentContent = (
    <div
      ref={printRef}
      className="recruiter-brief-page"
      style={{
        width: "100%",
        maxWidth: "8.5in",
        minHeight: inline ? "auto" : "11in",
        margin: "0 auto",
        padding: "0.55in 0.75in",
        background: C.paper,
        fontFamily: FONT,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header />
      <AtAGlance />
      <Signal />
      <RoleFit />
      <Footer />
    </div>
  );

  // Inline mode - just render the document
  if (inline) {
    return (
      <>
        {documentContent}
        <PrintStyles />
      </>
    );
  }

  // Modal mode - full screen with controls
  return (
    <>
      <div
        data-recruiter-brief-modal
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.85)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
        }}
      >
        {/* Toolbar */}
        <div style={{
          position: "sticky",
          top: 0,
          background: C.ink,
          padding: "12px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 10000,
        }}
        className="no-print"
        >
          <div style={{ color: C.paper, fontSize: "13px", fontWeight: 600 }}>
            Recruiter Brief Preview
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={handlePrint}
              style={{
                padding: "8px 16px",
                background: C.red,
                color: C.paper,
                border: "none",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Save as PDF
            </button>
            <button
              onClick={onClose}
              style={{
                padding: "8px 16px",
                background: "transparent",
                color: C.paper,
                border: `1px solid ${C.paper}`,
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>

        {/* Document */}
        <div style={{
          flex: 1,
          padding: "40px",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
        }}>
          <div style={{
            boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
          }}>
            {documentContent}
          </div>
        </div>
      </div>
      <PrintStyles />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: "9px",
      fontWeight: 600,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: C.red,
      marginBottom: "8px",
    }}>
      {children}
    </div>
  );
}

function MetadataPill({ children }) {
  return (
    <span style={{
      fontSize: "9px",
      fontFamily: MONO,
      background: "#F0F0F0",
      padding: "3px 8px",
      border: "0.5px solid #E0E0E0",
    }}>
      {children}
    </span>
  );
}

function LocationDot({ signal }) {
  const color = signal === "green" ? C.green : signal === "orange" ? C.orange : C.red;
  return (
    <span style={{
      display: "inline-block",
      width: "6px",
      height: "6px",
      borderRadius: "50%",
      background: color,
      marginRight: "6px",
    }} />
  );
}

function PrintStyles() {
  return (
    <style>{`
      @media print {
        /* Reset body and html for clean printing */
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
          overflow: visible !important;
          height: auto !important;
        }

        /* Hide toolbar and other non-print elements */
        .no-print {
          display: none !important;
        }

        /* Reset modal container for printing */
        [data-recruiter-brief-modal] {
          position: static !important;
          background: white !important;
          padding: 0 !important;
          overflow: visible !important;
          display: block !important;
        }

        /* Hide modal's inner wrapper divs, show only the document */
        [data-recruiter-brief-modal] > div:not(.no-print) {
          display: contents !important;
        }

        /* Brief page styling */
        .recruiter-brief-page {
          position: static !important;
          display: block !important;
          width: 100% !important;
          max-width: none !important;
          min-height: auto !important;
          height: auto !important;
          padding: 0.5in 0.65in !important;
          margin: 0 !important;
          box-shadow: none !important;
          overflow: visible !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* Page setup */
        @page {
          size: letter portrait;
          margin: 0.25in;
        }
      }
    `}</style>
  );
}
