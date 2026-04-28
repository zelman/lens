'use client';

import { useState, useRef, useCallback } from 'react';
import DualRadarChart, { calculateDualAlignment } from './DualRadarChart';

// ═══════════════════════════════════════════════════════════════════════
// PremiumMatchDocument — 5-page R→C match report for recruiters
// Swiss Style design: #D93025 candidate red, #2D6A2D role green
// Pages: Cover, Dual Radar, Dimension Breakdown, Interview Focus, JD Suggestions
// ═══════════════════════════════════════════════════════════════════════

// Design tokens (Swiss Style)
const C = {
  red: '#D93025',      // Candidate / PASS
  green: '#2D6A2D',    // Role / APPLY
  orange: '#E8590C',   // WATCH
  ink: '#1A1A1A',
  gray: '#666666',
  muted: '#999999',
  hairline: '#EEEEEE',
  container: '#F0F0F0',
  paper: '#FFFFFF',
};

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
const MONO = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace';

// Dimension labels
const DIMENSION_LABELS = {
  essence_clarity: 'Essence Clarity',
  skill_depth: 'Skills & Experience',
  values_articulation: 'Values',
  mission_alignment: 'Mission & Direction',
  work_style_clarity: 'Work Style',
  boundaries_defined: 'Non-Negotiables',
};

// Classification colors
function getClassificationColor(classification) {
  if (!classification) return C.gray;
  const upper = classification.toUpperCase();
  if (upper.includes('STRONG') || upper.includes('GOOD') || upper === 'APPLY') return C.green;
  if (upper.includes('WATCH') || upper.includes('MARGINAL')) return C.orange;
  return C.red;
}

// ═══════════════════════════════════════════════════════════════════════
// DUAL SCORE BAR COMPONENT
// ═══════════════════════════════════════════════════════════════════════

function DualScoreBar({ candidateScore, roleScore, label }) {
  const gap = candidateScore - roleScore;
  const gapColor = gap >= 0 ? C.green : C.red;

  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: '8px',
      }}>
        <span style={{
          fontSize: '11px',
          fontWeight: '600',
          color: C.red,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          {label}
        </span>
        <span style={{
          fontFamily: MONO,
          fontSize: '11px',
          color: gapColor,
          fontWeight: '600',
        }}>
          {gap >= 0 ? `+${gap}` : gap}
        </span>
      </div>

      {/* Candidate bar (top) */}
      <div style={{ marginBottom: '4px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ fontSize: '9px', color: C.muted, width: '60px' }}>Candidate</span>
          <div style={{ flex: 1, height: '6px', backgroundColor: C.hairline }}>
            <div style={{
              width: `${Math.min(100, Math.max(0, candidateScore))}%`,
              height: '100%',
              backgroundColor: C.red,
            }} />
          </div>
          <span style={{ fontFamily: MONO, fontSize: '11px', color: C.red, width: '28px', textAlign: 'right' }}>
            {candidateScore}
          </span>
        </div>
      </div>

      {/* Role bar (bottom) */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ fontSize: '9px', color: C.muted, width: '60px' }}>Role needs</span>
          <div style={{ flex: 1, height: '6px', backgroundColor: C.hairline }}>
            <div style={{
              width: `${Math.min(100, Math.max(0, roleScore))}%`,
              height: '100%',
              backgroundColor: C.green,
            }} />
          </div>
          <span style={{ fontFamily: MONO, fontSize: '11px', color: C.green, width: '28px', textAlign: 'right' }}>
            {roleScore}
          </span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PAGE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════

// Page 1: Cover
function CoverPage({ roleTitle, companyName, candidateName, matchData, date }) {
  const classification = matchData?.classification || 'UNSCORED';
  const score = matchData?.total_score;
  const briefing = matchData?.briefing;
  const disqualified = matchData?.disqualified;
  const disqualifyReason = matchData?.disqualify_reason;

  return (
    <div className="print-page" style={{
      padding: '80px 60px 60px',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      pageBreakAfter: 'always',
      boxSizing: 'border-box',
    }}>
      {/* LENS wordmark */}
      <div style={{
        fontSize: '14px',
        fontWeight: '700',
        color: C.red,
        letterSpacing: '0.3em',
        textTransform: 'uppercase',
        marginBottom: '48px',
      }}>
        LENS
      </div>

      {/* Document title */}
      <div style={{
        fontFamily: FONT,
        fontSize: '14px',
        color: C.gray,
        marginBottom: '8px',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}>
        Match Report
      </div>

      {/* Role title */}
      <h1 style={{
        fontFamily: FONT,
        fontSize: '32px',
        fontWeight: '600',
        color: C.ink,
        margin: 0,
        marginBottom: '8px',
        lineHeight: 1.2,
      }}>
        {roleTitle || 'Role Title'}
      </h1>

      {/* Company name */}
      {companyName && (
        <p style={{
          fontFamily: FONT,
          fontSize: '18px',
          color: C.gray,
          margin: 0,
          marginBottom: '24px',
        }}>
          {companyName}
        </p>
      )}

      {/* Candidate name */}
      <p style={{
        fontFamily: FONT,
        fontSize: '16px',
        color: C.ink,
        margin: 0,
        marginBottom: '8px',
      }}>
        <strong>Candidate:</strong> {candidateName || 'Unknown'}
      </p>

      {/* Date */}
      <p style={{
        fontFamily: FONT,
        fontSize: '14px',
        color: C.muted,
        margin: 0,
        marginBottom: '40px',
      }}>
        {date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
      </p>

      {/* Score and Classification */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        marginBottom: '32px',
        padding: '24px',
        backgroundColor: C.container,
      }}>
        {disqualified ? (
          <div>
            <div style={{
              fontFamily: MONO,
              fontSize: '14px',
              fontWeight: '700',
              color: C.red,
              letterSpacing: '0.1em',
            }}>
              DISQUALIFIED
            </div>
            <div style={{
              fontSize: '13px',
              color: C.red,
              marginTop: '8px',
              lineHeight: 1.5,
            }}>
              {disqualifyReason}
            </div>
          </div>
        ) : (
          <>
            {score !== undefined && (
              <div style={{
                fontFamily: MONO,
                fontSize: '48px',
                fontWeight: '300',
                color: getClassificationColor(classification),
                lineHeight: 1,
              }}>
                {score}
              </div>
            )}
            <div>
              <div style={{
                fontFamily: FONT,
                fontSize: '14px',
                fontWeight: '700',
                color: getClassificationColor(classification),
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}>
                {classification}
              </div>
              {matchData?.recommended_action && (
                <div style={{
                  fontSize: '12px',
                  color: C.gray,
                  marginTop: '4px',
                }}>
                  → {matchData.recommended_action}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Briefing */}
      {briefing && (
        <p style={{
          fontFamily: FONT,
          fontSize: '15px',
          color: C.ink,
          lineHeight: 1.7,
          margin: 0,
          maxWidth: '520px',
        }}>
          {briefing}
        </p>
      )}

      {/* Footer */}
      <div style={{ marginTop: 'auto', paddingTop: '60px' }}>
        <p style={{
          fontFamily: FONT,
          fontSize: '11px',
          color: C.muted,
          margin: 0,
        }}>
          Generated by Lens.
        </p>
      </div>
    </div>
  );
}

// Page 2: Dual Radar Chart
function DualRadarPage({ candidateDimensions, roleDimensions, roleArchetype, signatureRequirements }) {
  const alignment = calculateDualAlignment(candidateDimensions, roleDimensions);

  return (
    <div className="print-page" style={{
      padding: '60px',
      minHeight: '100vh',
      pageBreakAfter: 'always',
      boxSizing: 'border-box',
    }}>
      {/* Section header */}
      <div style={{
        fontSize: '9px',
        fontWeight: '600',
        color: C.red,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: '32px',
      }}>
        ALIGNMENT PORTRAIT
      </div>

      {/* Role archetype badge */}
      {roleArchetype && (
        <div style={{
          display: 'inline-block',
          padding: '6px 12px',
          backgroundColor: C.container,
          fontSize: '11px',
          color: C.ink,
          marginBottom: '24px',
          fontWeight: '500',
        }}>
          Role archetype: {roleArchetype}
        </div>
      )}

      {/* Dual radar chart */}
      <DualRadarChart
        candidateDimensions={candidateDimensions}
        roleDimensions={roleDimensions}
        showLegend={true}
        showScores={true}
      />

      {/* Signature requirements */}
      {signatureRequirements && signatureRequirements.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <div style={{
            fontSize: '10px',
            fontWeight: '600',
            color: C.gray,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: '12px',
          }}>
            Role's Signature Requirements
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {signatureRequirements.map((req, i) => (
              <span key={i} style={{
                fontSize: '12px',
                color: C.ink,
                backgroundColor: C.container,
                padding: '6px 12px',
              }}>
                {req}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Page 3: Dimension Match Breakdown
function DimensionBreakdownPage({ candidateDimensions, roleDimensions, matchData }) {
  const alignment = calculateDualAlignment(candidateDimensions, roleDimensions);

  return (
    <div className="print-page" style={{
      padding: '60px',
      minHeight: '100vh',
      pageBreakAfter: 'always',
      boxSizing: 'border-box',
    }}>
      {/* Section header */}
      <div style={{
        fontSize: '9px',
        fontWeight: '600',
        color: C.red,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: '32px',
      }}>
        DIMENSION BREAKDOWN
      </div>

      {/* Score bars for each dimension */}
      {Object.entries(DIMENSION_LABELS).map(([key, label]) => {
        const candScore = candidateDimensions?.[key] || 50;
        const roleScore = roleDimensions?.[key] || 50;

        return (
          <DualScoreBar
            key={key}
            label={label}
            candidateScore={candScore}
            roleScore={roleScore}
          />
        );
      })}

      {/* Gap summary */}
      {alignment.largestGap && alignment.largestGap.gap > 10 && (
        <div style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: alignment.largestGap.direction === 'under' ? '#fef5f4' : '#f1f8f1',
          borderLeft: `3px solid ${alignment.largestGap.direction === 'under' ? C.red : C.green}`,
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: '600',
            color: alignment.largestGap.direction === 'under' ? C.red : C.green,
            marginBottom: '8px',
          }}>
            {alignment.largestGap.direction === 'under' ? 'LARGEST GAP' : 'EXCEEDS REQUIREMENTS'}
          </div>
          <div style={{ fontSize: '13px', color: C.ink, lineHeight: 1.5 }}>
            <strong>{alignment.largestGap.dimension}:</strong> Candidate scores {alignment.largestGap.candidateScore},
            role requires {alignment.largestGap.roleScore}
            {alignment.largestGap.direction === 'under'
              ? ' — probe this area in interviews'
              : ' — may be overqualified for this dimension'}
          </div>
        </div>
      )}

      {/* Signal matches/tensions from match data */}
      {matchData?.signal_matches?.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <div style={{
            fontSize: '10px',
            fontWeight: '600',
            color: C.green,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: '12px',
          }}>
            ALIGNMENT SIGNALS
          </div>
          {matchData.signal_matches.slice(0, 3).map((m, i) => (
            <div key={i} style={{
              fontSize: '12px',
              color: C.ink,
              lineHeight: 1.6,
              marginBottom: '8px',
              paddingLeft: '12px',
              borderLeft: `2px solid ${C.green}`,
            }}>
              <strong>{m.dimension}:</strong> {m.candidate_signal}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Page 4: Interview Focus Areas
function InterviewFocusPage({ interviewFocus }) {
  if (!interviewFocus) {
    return (
      <div className="print-page" style={{
        padding: '60px',
        minHeight: '100vh',
        pageBreakAfter: 'always',
        boxSizing: 'border-box',
      }}>
        <div style={{
          fontSize: '9px',
          fontWeight: '600',
          color: C.red,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '24px',
        }}>
          INTERVIEW FOCUS AREAS
        </div>
        <p style={{ fontSize: '14px', color: C.gray }}>
          Interview focus areas could not be generated.
        </p>
      </div>
    );
  }

  const { explore = [], validate = [], watch = [] } = interviewFocus;

  const renderGroup = (items, title, color, icon) => {
    if (items.length === 0) return null;
    return (
      <div style={{ marginBottom: '28px' }}>
        <div style={{
          fontSize: '10px',
          fontWeight: '600',
          color: color,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: '14px',
        }}>
          {icon} {title}
        </div>
        {items.map((item, i) => (
          <div key={i} style={{
            marginBottom: '16px',
            paddingLeft: '12px',
            borderLeft: `2px solid ${color}`,
          }}>
            <div style={{
              fontSize: '13px',
              fontWeight: '600',
              color: C.ink,
              marginBottom: '4px',
            }}>
              {item.title}
            </div>
            <div style={{
              fontSize: '12px',
              color: C.ink,
              lineHeight: 1.6,
              marginBottom: '6px',
              fontStyle: 'italic',
            }}>
              "{item.question}"
            </div>
            <div style={{
              fontSize: '11px',
              color: C.gray,
              lineHeight: 1.5,
            }}>
              {item.context}
              {item.source_dimension && (
                <span style={{ fontFamily: MONO, marginLeft: '8px', color: C.muted }}>
                  [{item.source_dimension}]
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="print-page" style={{
      padding: '60px',
      minHeight: '100vh',
      pageBreakAfter: 'always',
      boxSizing: 'border-box',
    }}>
      <div style={{
        fontSize: '9px',
        fontWeight: '600',
        color: C.red,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: '32px',
      }}>
        INTERVIEW FOCUS AREAS
      </div>

      {renderGroup(explore, 'Explore — Gaps to Investigate', C.orange, '🔍')}
      {renderGroup(validate, 'Validate — Strengths to Confirm', C.green, '✓')}
      {renderGroup(watch, 'Watch — Risk Signals', C.red, '⚠')}
    </div>
  );
}

// Page 5: JD Enhancement Suggestions
function JdSuggestionsPage({ jdSuggestions }) {
  if (!jdSuggestions || !jdSuggestions.suggestions?.length) {
    return (
      <div className="print-page" style={{
        padding: '60px',
        minHeight: '100vh',
        boxSizing: 'border-box',
      }}>
        <div style={{
          fontSize: '9px',
          fontWeight: '600',
          color: C.red,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '24px',
        }}>
          JD ENHANCEMENT SUGGESTIONS
        </div>
        <p style={{ fontSize: '14px', color: C.gray }}>
          JD enhancement suggestions could not be generated.
        </p>
      </div>
    );
  }

  const { suggestions, alignment_notes } = jdSuggestions;
  const priorityColors = { high: C.red, medium: C.orange, low: C.gray };

  return (
    <div className="print-page" style={{
      padding: '60px',
      minHeight: '100vh',
      boxSizing: 'border-box',
    }}>
      <div style={{
        fontSize: '9px',
        fontWeight: '600',
        color: C.red,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: '32px',
      }}>
        JD ENHANCEMENT SUGGESTIONS
      </div>

      {/* Alignment notes */}
      {alignment_notes && (
        <div style={{
          marginBottom: '24px',
          padding: '12px 16px',
          backgroundColor: '#f1f8f1',
          borderLeft: `3px solid ${C.green}`,
          fontSize: '13px',
          color: C.ink,
          lineHeight: 1.6,
        }}>
          <strong>What's working:</strong> {alignment_notes}
        </div>
      )}

      {/* Suggestions */}
      {suggestions.map((s, i) => (
        <div key={i} style={{
          marginBottom: '24px',
          pageBreakInside: 'avoid',
        }}>
          {/* Title with priority badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
          }}>
            <span style={{
              fontSize: '13px',
              fontWeight: '600',
              color: C.ink,
            }}>
              {s.title}
            </span>
            <span style={{
              fontSize: '9px',
              fontWeight: '600',
              color: priorityColors[s.priority] || C.gray,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {s.priority}
            </span>
          </div>

          {/* Two-column comparison */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '12px',
          }}>
            <div>
              <div style={{
                fontSize: '9px',
                fontWeight: '600',
                color: C.green,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '6px',
              }}>
                Your role requires
              </div>
              <div style={{
                fontSize: '12px',
                color: C.ink,
                lineHeight: 1.5,
              }}>
                {s.role_requires}
              </div>
            </div>
            <div>
              <div style={{
                fontSize: '9px',
                fontWeight: '600',
                color: C.muted,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '6px',
              }}>
                Your JD communicates
              </div>
              <div style={{
                fontSize: '12px',
                color: C.ink,
                lineHeight: 1.5,
              }}>
                {s.jd_communicates}
              </div>
            </div>
          </div>

          {/* Action */}
          {s.action && (
            <div style={{
              borderLeft: `2px solid ${C.green}`,
              paddingLeft: '12px',
              fontSize: '12px',
              color: C.ink,
              lineHeight: 1.5,
            }}>
              <strong>Try:</strong> {s.action}
            </div>
          )}
        </div>
      ))}

      {/* Footer */}
      <div style={{
        marginTop: 'auto',
        paddingTop: '40px',
        borderTop: `0.5px solid ${C.hairline}`,
      }}>
        <p style={{
          fontFamily: FONT,
          fontSize: '11px',
          color: C.muted,
          margin: 0,
          textAlign: 'center',
        }}>
          Built by Lens — signal matching over keyword matching.
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export default function PremiumMatchDocument({
  roleTitle,
  companyName,
  candidateName,
  candidateDimensions,
  roleDimensions,
  roleProfile,           // { dimension_scores, signature_requirements, flexibility_areas, role_archetype }
  matchData,             // Full match data from R→C scorer
  interviewFocus,        // { explore, validate, watch }
  jdSuggestions,         // { suggestions, alignment_notes }
  onClose,
}) {
  const documentRef = useRef(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // Handle print to PDF
  const handlePrint = useCallback(() => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  }, []);

  // Use roleProfile dimensions if provided, otherwise fall back to roleDimensions prop
  const effectiveRoleDimensions = roleProfile?.dimension_scores || roleDimensions || {};

  return (
    <div
      data-premium-match-modal
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 1000,
        overflow: 'auto',
        padding: '40px',
      }}
    >
      {/* Toolbar */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        display: 'flex',
        gap: '12px',
        zIndex: 1001,
      }} className="no-print">
        <button
          onClick={handlePrint}
          disabled={isPrinting}
          style={{
            fontFamily: FONT,
            padding: '12px 24px',
            backgroundColor: C.red,
            color: C.paper,
            border: 'none',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            opacity: isPrinting ? 0.7 : 1,
          }}
        >
          {isPrinting ? 'Preparing...' : 'Save as PDF'}
        </button>
        <button
          onClick={onClose}
          style={{
            fontFamily: FONT,
            padding: '12px 24px',
            backgroundColor: C.paper,
            color: C.ink,
            border: `1px solid ${C.hairline}`,
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>

      {/* Document container */}
      <div
        ref={documentRef}
        id="premium-match-document"
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          backgroundColor: C.paper,
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Page 1: Cover */}
        <CoverPage
          roleTitle={roleTitle}
          companyName={companyName}
          candidateName={candidateName}
          matchData={matchData}
        />

        {/* Page 2: Dual Radar Chart */}
        <DualRadarPage
          candidateDimensions={candidateDimensions}
          roleDimensions={effectiveRoleDimensions}
          roleArchetype={roleProfile?.role_archetype}
          signatureRequirements={roleProfile?.signature_requirements}
        />

        {/* Page 3: Dimension Breakdown */}
        <DimensionBreakdownPage
          candidateDimensions={candidateDimensions}
          roleDimensions={effectiveRoleDimensions}
          matchData={matchData}
        />

        {/* Page 4: Interview Focus Areas */}
        <InterviewFocusPage interviewFocus={interviewFocus} />

        {/* Page 5: JD Enhancement Suggestions */}
        <JdSuggestionsPage jdSuggestions={jdSuggestions} />
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          html, body {
            height: auto !important;
            overflow: visible !important;
          }

          body * {
            visibility: hidden;
          }

          [data-premium-match-modal],
          [data-premium-match-modal] *,
          #premium-match-document,
          #premium-match-document * {
            visibility: visible;
          }

          [data-premium-match-modal] {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            background: white !important;
            padding: 0 !important;
            overflow: visible !important;
            z-index: 999999 !important;
          }

          #premium-match-document {
            position: relative !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            box-shadow: none !important;
          }

          .no-print,
          .no-print * {
            display: none !important;
            visibility: hidden !important;
          }

          @page {
            size: letter;
            margin: 0.5in;
          }

          .print-page {
            page-break-after: always;
            page-break-inside: avoid;
            min-height: auto !important;
          }

          .print-page:last-child {
            page-break-after: auto;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
