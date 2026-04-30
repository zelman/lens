'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

// ═══════════════════════════════════════════════════════════════════════
// PremiumLensDocument — 8-page premium lens deliverable
// Swiss Style design: system sans-serif, #D93025 red, zero border-radius
// Pages: Cover, Identity Portrait, Dimensions (3), Resume, Next Steps, About
// ═══════════════════════════════════════════════════════════════════════

// Design tokens (Swiss Style)
const C = {
  red: '#D93025',
  orange: '#E8590C',
  green: '#2D6A2D',
  ink: '#1A1A1A',
  gray: '#666666',
  hairline: '#EEEEEE',
  container: '#F0F0F0',
  paper: '#FFFFFF',
};

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
const MONO = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace';

// ═══════════════════════════════════════════════════════════════════════
// PARSING HELPERS
// ═══════════════════════════════════════════════════════════════════════

function parseLensMarkdown(markdown) {
  const sections = {};
  let currentSection = null;
  let currentContent = [];

  // CRITICAL: Strip any leaked premium metadata before parsing
  let cleanMarkdown = markdown;

  // Remove the separator line and everything after it (handle whitespace variations)
  const separatorPatterns = [
    /---\s*PREMIUM_METADATA\s*---[\s\S]*/i,
    /---PREMIUM_METADATA---[\s\S]*/,
  ];
  for (const pattern of separatorPatterns) {
    cleanMarkdown = cleanMarkdown.replace(pattern, '');
  }

  // Remove any JSON blocks that look like metadata (fenced)
  cleanMarkdown = cleanMarkdown.replace(/```json\s*\{[\s\S]*?"soft_gates"[\s\S]*?```/g, '');
  cleanMarkdown = cleanMarkdown.replace(/```json\s*\{[\s\S]*?"essence_statement"[\s\S]*?```/g, '');
  cleanMarkdown = cleanMarkdown.replace(/```json\s*\{[\s\S]*?"key_phrases"[\s\S]*?```/g, '');

  // Remove bare JSON objects containing ANY metadata field (order-independent)
  cleanMarkdown = cleanMarkdown.replace(/\{[^{}]*"soft_gates"[^{}]*\}/g, '');
  cleanMarkdown = cleanMarkdown.replace(/\{[^{}]*"essence_statement"[^{}]*\}/g, '');
  cleanMarkdown = cleanMarkdown.replace(/\{[^{}]*"key_phrases"[^{}]*\}/g, '');
  cleanMarkdown = cleanMarkdown.replace(/\{[^{}]*"suggested_targeting"[^{}]*\}/g, '');

  // Final cleanup: remove any remaining incomplete JSON that starts with metadata-like content
  cleanMarkdown = cleanMarkdown.replace(/\{\s*"essence_statement"[\s\S]*$/g, '');
  cleanMarkdown = cleanMarkdown.replace(/\{\s*"soft_gates"[\s\S]*$/g, '');

  cleanMarkdown = cleanMarkdown.trim();

  // Parse YAML frontmatter
  const frontmatterMatch = cleanMarkdown.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    const frontmatter = {};
    frontmatterMatch[1].split('\n').forEach(line => {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        const key = line.slice(0, colonIdx).trim();
        let value = line.slice(colonIdx + 1).trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        frontmatter[key] = value;
      }
    });
    sections.frontmatter = frontmatter;
  }

  // Remove frontmatter from content for parsing
  const content = cleanMarkdown.replace(/^---\n[\s\S]*?\n---\n?/, '');

  // Parse sections
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentSection) {
        sections[currentSection] = currentContent.join('\n').trim();
      }
      currentSection = line.slice(3).trim();
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentSection) {
    sections[currentSection] = currentContent.join('\n').trim();
  }

  return sections;
}

// Extract a pull quote from section content (first line starting with > or first italic)
function extractPullQuote(content) {
  if (!content) return null;
  // Look for blockquote
  const blockquoteMatch = content.match(/^>\s*(.+)$/m);
  if (blockquoteMatch) return blockquoteMatch[1];
  // Look for first sentence that sounds quotable (contains "I" and isn't too long)
  const sentences = content.split(/[.!?]+/);
  for (const s of sentences) {
    const trimmed = s.trim();
    if (trimmed.length > 20 && trimmed.length < 150 && /\bI\b/.test(trimmed)) {
      return trimmed + '.';
    }
  }
  return null;
}

// Extract person's name from the narrative
// Looks for patterns like "[Name] is a..." or "At [their] core, [Name]..." in the Essence section
function extractNameFromNarrative(sections) {
  const essenceContent = sections['Essence'] || '';
  if (!essenceContent) return null;

  // Pattern 1: "[Name] is a [role/description]" - common opening (handles hyphenated names)
  const isAMatch = essenceContent.match(/^([A-Z][a-z]+(?:[-\s][A-Z][a-z]+)*)\s+is\s+(?:a|an|the)/);
  if (isAMatch) return isAMatch[1];

  // Pattern 2: "At [pronoun] core, [Name]..." or "For [Name],..."
  const coreMatch = essenceContent.match(/(?:At\s+(?:his|her|their)\s+core,?\s*|For\s+)([A-Z][a-z]+(?:[-\s][A-Z][a-z]+)*)/);
  if (coreMatch) return coreMatch[1];

  // Pattern 3: "[Name]'s [noun]..." - possessive opening
  const possessiveMatch = essenceContent.match(/^([A-Z][a-z]+(?:[-\s][A-Z][a-z]+)*)'s\s+/);
  if (possessiveMatch) return possessiveMatch[1];

  // Pattern 4: "As a [role], [Name]..." or "Whether [gerund], [Name]..."
  const asAMatch = essenceContent.match(/(?:As\s+(?:a|an)\s+[^,]+,\s*|Whether\s+[^,]+,\s*)([A-Z][a-z]+(?:[-\s][A-Z][a-z]+)*)/);
  if (asAMatch) return asAMatch[1];

  // Pattern 5: First capitalized name-like word (expanded exclusion list)
  const commonWords = [
    // Articles and pronouns
    'The', 'This', 'That', 'What', 'When', 'Where', 'How', 'Why', 'Who',
    // Prepositions
    'With', 'From', 'Into', 'Over', 'Under', 'Through', 'Between', 'Beyond',
    // Conjunctions and transitions
    'And', 'But', 'Yet', 'Although', 'However', 'Despite', 'Throughout',
    // Common sentence starters
    'Being', 'Having', 'Making', 'Taking', 'Building', 'Creating', 'Leading',
    'Managing', 'Working', 'Developing', 'Growing', 'Driving', 'Bringing',
    // Descriptive words
    'Every', 'Each', 'Some', 'Many', 'Most', 'All', 'Any', 'Both',
  ];

  const words = essenceContent.split(/\s+/);
  for (const word of words.slice(0, 25)) { // Check first 25 words
    // Remove punctuation but keep hyphens for hyphenated names
    const cleaned = word.replace(/[^A-Za-z-]/g, '');
    // Match single names or hyphenated names like "Jean-Pierre"
    if (cleaned.length > 1 && /^[A-Z][a-z]+(-[A-Z][a-z]+)?$/.test(cleaned) && !commonWords.includes(cleaned)) {
      return cleaned;
    }
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════
// RADAR CHART COMPONENT (Inline SVG) - Matches eric_lens_radar_chart_reference.html
// ═══════════════════════════════════════════════════════════════════════

function RadarChart({ dimensions }) {
  // Six axes matching the lens document sections
  const axes = [
    { label: 'Essence', key: 'essence_clarity' },
    { label: 'Skills & Experience', key: 'skill_depth' },
    { label: 'Values', key: 'values_articulation' },
    { label: 'Mission & Direction', key: 'mission_alignment' },
    { label: 'Work Style', key: 'work_style_clarity' },
    { label: 'Non-Negotiables', key: 'boundaries_defined' },
  ];

  // Get values (default to 70 if missing)
  const values = axes.map(a => Math.min(100, Math.max(0, dimensions[a.key] || 70)));

  // Chart dimensions: viewBox 500x480, center at (250, 230)
  const maxRadius = 160;

  // Calculate point coordinates for a given score and axis index
  const getPoint = (score, index) => {
    const angle = (index * 60 - 90) * (Math.PI / 180); // Start from top (-90°), go clockwise
    const radius = (score / 100) * maxRadius;
    return {
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
    };
  };

  // Generate hexagonal grid points for a given radius
  const getHexPoints = (r) => {
    return [0, 1, 2, 3, 4, 5].map(i => {
      const angle = (i * 60 - 90) * (Math.PI / 180);
      return `${r * Math.cos(angle)},${r * Math.sin(angle)}`;
    }).join(' ');
  };

  // Data points
  const dataPoints = values.map((v, i) => getPoint(v, i));
  const polygonPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  // Axis label positions (outside the chart)
  const labelPositions = [
    { x: 0, y: -182, anchor: 'middle' },           // Essence (top)
    { x: 160, y: -90, anchor: 'start' },           // Skills (top-right)
    { x: 160, y: 95, anchor: 'start' },            // Values (bottom-right)
    { x: 0, y: 190, anchor: 'middle' },            // Mission (bottom)
    { x: -160, y: 95, anchor: 'end' },             // Work Style (bottom-left)
    { x: -160, y: -90, anchor: 'end' },            // Non-Neg (top-left)
  ];

  // Score label offsets
  const scoreLabelOffsets = [
    { dx: 12, dy: -4 },   // Essence
    { dx: 10, dy: 4 },    // Skills
    { dx: 10, dy: 6 },    // Values
    { dx: 12, dy: 10 },   // Mission
    { dx: -14, dy: 6 },   // Work Style
    { dx: -14, dy: 0 },   // Non-Neg
  ];

  return (
    <svg viewBox="0 0 500 480" style={{ display: 'block', margin: '0 auto', maxWidth: '400px', width: '100%' }}>
      <g transform="translate(250, 230)">
        {/* Grid hexagons at 25, 50, 75, 100 */}
        {[40, 80, 120, 160].map(r => (
          <polygon
            key={r}
            points={getHexPoints(r)}
            fill="none"
            stroke={C.hairline}
            strokeWidth="0.5"
          />
        ))}

        {/* Grid labels */}
        <text x="6" y="-38" style={{ fontFamily: MONO, fontSize: '9px', fill: C.gray }}>25</text>
        <text x="6" y="-78" style={{ fontFamily: MONO, fontSize: '9px', fill: C.gray }}>50</text>
        <text x="6" y="-118" style={{ fontFamily: MONO, fontSize: '9px', fill: C.gray }}>75</text>
        <text x="6" y="-158" style={{ fontFamily: MONO, fontSize: '9px', fill: C.gray }}>100</text>

        {/* Axis lines from center to vertices */}
        {[0, 1, 2, 3, 4, 5].map(i => {
          const angle = (i * 60 - 90) * (Math.PI / 180);
          const endX = 170 * Math.cos(angle);
          const endY = 170 * Math.sin(angle);
          return (
            <line
              key={i}
              x1="0"
              y1="0"
              x2={endX}
              y2={endY}
              stroke={C.hairline}
              strokeWidth="0.5"
            />
          );
        })}

        {/* Data polygon */}
        <polygon
          points={polygonPoints}
          fill={C.red}
          fillOpacity="0.12"
          stroke={C.red}
          strokeWidth="1.5"
        />

        {/* Data dots */}
        {dataPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3.5"
            fill={C.red}
          />
        ))}

        {/* Axis labels */}
        {axes.map((axis, i) => (
          <text
            key={i}
            x={labelPositions[i].x}
            y={labelPositions[i].y}
            textAnchor={labelPositions[i].anchor}
            style={{
              fontFamily: FONT,
              fontSize: '13px',
              fontWeight: '500',
              fill: C.ink,
            }}
          >
            {axis.label}
          </text>
        ))}

        {/* Score labels near each data point */}
        {dataPoints.map((p, i) => (
          <text
            key={i}
            x={p.x + scoreLabelOffsets[i].dx}
            y={p.y + scoreLabelOffsets[i].dy}
            style={{
              fontFamily: MONO,
              fontSize: '11px',
              fill: C.gray,
            }}
          >
            {values[i]}
          </text>
        ))}
      </g>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// SIGNAL BAR COMPONENT
// ═══════════════════════════════════════════════════════════════════════

function SignalBar({ score }) {
  // Color thresholds: 70+ green, 50-69 orange, <50 gray
  const color = score >= 70 ? C.green : score >= 50 ? C.orange : '#888888';
  const width = Math.min(100, Math.max(0, score));

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
      <div style={{
        flex: 1,
        height: '6px',
        backgroundColor: '#EEEEEE',
        borderRadius: 0,
      }}>
        <div style={{
          width: `${width}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: 0,
        }} />
      </div>
      <span style={{
        fontFamily: MONO,
        fontSize: '13px',
        fontWeight: '600',
        color: color,
        minWidth: '28px',
        textAlign: 'right',
      }}>
        {score}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PAGE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════

// Page 1: Cover
function CoverPage({ name, date, essenceStatement }) {
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
      <h1 style={{
        fontFamily: FONT,
        fontSize: '18px',
        fontWeight: '500',
        color: C.gray,
        margin: 0,
        marginBottom: '8px',
        letterSpacing: '0.02em',
      }}>
        Professional Identity Lens
      </h1>

      {/* Person's name - large and prominent */}
      {name && (
        <h2 style={{
          fontFamily: FONT,
          fontSize: '36px',
          fontWeight: '500',
          color: C.ink,
          margin: 0,
          marginBottom: '12px',
          lineHeight: 1.15,
        }}>
          {name}
        </h2>
      )}

      {/* Date */}
      <p style={{
        fontFamily: FONT,
        fontSize: '14px',
        color: C.gray,
        margin: 0,
        marginBottom: '40px',
      }}>
        {date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </p>

      {/* Hairline rule */}
      <div style={{
        height: '0.5px',
        backgroundColor: C.hairline,
        marginBottom: '40px',
      }} />

      {/* Essence statement */}
      {essenceStatement && (
        <p style={{
          fontFamily: FONT,
          fontSize: '18px',
          fontStyle: 'italic',
          color: C.ink,
          lineHeight: 1.6,
          maxWidth: '480px',
          margin: 0,
        }}>
          {essenceStatement}
        </p>
      )}

      {/* Footer at bottom */}
      <div style={{ marginTop: 'auto', paddingTop: '60px' }}>
        <p style={{
          fontFamily: FONT,
          fontSize: '11px',
          color: C.gray,
          margin: 0,
        }}>
          Generated by Lens.
        </p>
      </div>
    </div>
  );
}

// Page 2: Identity Portrait
function IdentityPortraitPage({ dimensions, keyPhrases }) {
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
        marginBottom: '40px',
      }}>
        IDENTITY PORTRAIT
      </div>

      {/* Radar chart */}
      <div style={{ marginBottom: '48px' }}>
        <RadarChart dimensions={dimensions || {}} />
      </div>

      {/* Key phrases as pills */}
      {keyPhrases && keyPhrases.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          justifyContent: 'center',
        }}>
          {keyPhrases.map((phrase, i) => (
            <span key={i} style={{
              fontFamily: FONT,
              fontSize: '12px',
              color: C.ink,
              backgroundColor: C.container,
              padding: '8px 16px',
              borderRadius: 0,
            }}>
              "{phrase}"
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Pages 3-5: Dimension Deep Dives
function DimensionPage({ dimensions, pageNumber }) {
  // Map page numbers to dimension groups
  const dimensionGroups = {
    3: [
      { key: 'Essence', scoreKey: 'essence_clarity' },
      { key: 'Skills & Experience', scoreKey: 'skill_depth' },
    ],
    4: [
      { key: 'Values', scoreKey: 'values_articulation' },
      { key: 'Mission & Direction', scoreKey: 'mission_alignment' },
    ],
    5: [
      { key: 'Work Style', scoreKey: 'work_style_clarity' },
      { key: 'Non-Negotiables', scoreKey: 'boundaries_defined' },
    ],
  };

  const group = dimensionGroups[pageNumber] || [];

  return (
    <div className="print-page" style={{
      padding: '60px',
      minHeight: '100vh',
      pageBreakAfter: 'always',
      boxSizing: 'border-box',
    }}>
      {group.map((dim, i) => {
        const content = dimensions.sections?.[dim.key] || '';
        const score = dimensions.scores?.[dim.scoreKey] || 70;
        const pullQuote = extractPullQuote(content);

        return (
          <div key={dim.key} style={{ marginBottom: i === 0 ? '48px' : 0 }}>
            {/* Section header */}
            <div style={{
              fontSize: '9px',
              fontWeight: '600',
              color: C.red,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '16px',
            }}>
              {dim.key.toUpperCase()}
            </div>

            {/* Signal bar */}
            <SignalBar score={score} />

            {/* Narrative */}
            <div style={{
              fontFamily: FONT,
              fontSize: '14px',
              color: C.ink,
              lineHeight: 1.7,
              marginBottom: pullQuote ? '24px' : 0,
            }}>
              {content.split('\n\n').map((p, pi) => (
                <p key={pi} style={{ margin: 0, marginBottom: '12px' }}>
                  {p}
                </p>
              ))}
            </div>

            {/* Pull quote - person's own words */}
            {pullQuote && (
              <div style={{
                borderLeft: '2px solid #D93025',
                paddingLeft: '12px',
                fontFamily: FONT,
                fontSize: '14px',
                fontStyle: 'italic',
                color: '#555555',
                lineHeight: 1.6,
                margin: '12px 0',
              }}>
                {pullQuote}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Page 6: Resume Enhancements
function ResumeEnhancementsPage({ suggestions, alignment, hasResumeData }) {
  // If no resume was uploaded, show informational message
  if (!hasResumeData) {
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
          marginBottom: '24px',
        }}>
          RESUME ENHANCEMENTS
        </div>

        <div style={{
          padding: '32px',
          backgroundColor: C.container,
          marginBottom: '24px',
        }}>
          <p style={{
            fontFamily: FONT,
            fontSize: '15px',
            color: C.ink,
            lineHeight: 1.7,
            margin: 0,
            marginBottom: '16px',
          }}>
            No resume was uploaded during this session.
          </p>
          <p style={{
            fontFamily: FONT,
            fontSize: '14px',
            color: C.gray,
            lineHeight: 1.6,
            margin: 0,
          }}>
            To receive personalized resume enhancement suggestions, upload your resume (PDF, DOCX, or TXT)
            at the start of the discovery process. The Lens will analyze gaps between how you present
            yourself on paper and the identity you've articulated here.
          </p>
        </div>
      </div>
    );
  }

  // If resume was uploaded but no suggestions generated (API failed or empty response)
  if (!suggestions || suggestions.length === 0) {
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
          RESUME ENHANCEMENTS
        </div>

        <div style={{
          padding: '32px',
          backgroundColor: C.container,
        }}>
          <p style={{
            fontFamily: FONT,
            fontSize: '14px',
            color: C.gray,
            lineHeight: 1.6,
            margin: 0,
          }}>
            Resume analysis is processing. If this page appears blank, the resume enhancement
            suggestions could not be generated. This sometimes happens with complex PDF formats.
          </p>
        </div>
      </div>
    );
  }

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
        marginBottom: '24px',
      }}>
        RESUME ENHANCEMENTS
      </div>

      {/* Alignment score */}
      {alignment && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '32px',
          padding: '16px',
          backgroundColor: C.container,
        }}>
          <div style={{
            fontFamily: MONO,
            fontSize: '28px',
            fontWeight: '700',
            color: alignment.score >= 70 ? C.green : alignment.score >= 50 ? C.orange : '#888888',
          }}>
            {alignment.score}
          </div>
          <div style={{
            fontFamily: FONT,
            fontSize: '13px',
            color: C.ink,
            lineHeight: 1.5,
          }}>
            {alignment.summary}
          </div>
        </div>
      )}

      {/* Suggestion cards */}
      {suggestions.slice(0, 4).map((s, i) => (
        <div key={i} style={{
          marginBottom: '24px',
          pageBreakInside: 'avoid',
        }}>
          {/* Title */}
          <p style={{
            fontFamily: FONT,
            fontSize: '14px',
            fontWeight: '600',
            color: C.ink,
            margin: 0,
            marginBottom: '8px',
          }}>
            {s.suggestion}
          </p>

          {/* Two columns: lens vs resume */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '12px',
          }}>
            <div>
              <p style={{
                fontFamily: FONT,
                fontSize: '10px',
                fontWeight: '600',
                color: C.gray,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                margin: 0,
                marginBottom: '4px',
              }}>
                Your Lens revealed
              </p>
              <p style={{
                fontFamily: FONT,
                fontSize: '12px',
                color: C.ink,
                margin: 0,
                lineHeight: 1.5,
              }}>
                {s.lens_insight}
              </p>
            </div>
            <div>
              <p style={{
                fontFamily: FONT,
                fontSize: '10px',
                fontWeight: '600',
                color: C.gray,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                margin: 0,
                marginBottom: '4px',
              }}>
                Your resume shows
              </p>
              <p style={{
                fontFamily: FONT,
                fontSize: '12px',
                color: C.ink,
                margin: 0,
                lineHeight: 1.5,
              }}>
                {s.current_gap}
              </p>
            </div>
          </div>

          {/* Action item */}
          {s.example_after && (
            <div style={{
              borderLeft: `2px solid ${C.green}`,
              paddingLeft: '12px',
              fontFamily: FONT,
              fontSize: '12px',
              color: C.ink,
              lineHeight: 1.5,
            }}>
              <strong>Try:</strong> {s.example_after}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Page 7: Next Steps
function NextStepsPage({ nextSteps }) {
  if (!nextSteps || nextSteps.length === 0) return null;

  // Group by timeline
  const groups = {
    this_week: nextSteps.filter(s => s.timeline === 'this week' || s.timeline === 'immediate'),
    in_conversations: nextSteps.filter(s => s.timeline === 'this month' || s.timeline === 'in conversations'),
    ongoing: nextSteps.filter(s => s.timeline === 'ongoing' || s.timeline === 'long-term'),
  };

  // If grouping doesn't work, just show all
  const hasGroups = groups.this_week.length > 0 || groups.in_conversations.length > 0 || groups.ongoing.length > 0;

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
        YOUR NEXT STEPS
      </div>

      {hasGroups ? (
        <>
          {/* This Week */}
          {groups.this_week.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <div style={{
                fontSize: '10px',
                fontWeight: '600',
                color: C.red,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '16px',
              }}>
                THIS WEEK
              </div>
              {groups.this_week.map((step, i) => (
                <NextStepItem key={i} step={step} index={i + 1} />
              ))}
            </div>
          )}

          {/* In Conversations */}
          {groups.in_conversations.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <div style={{
                fontSize: '10px',
                fontWeight: '600',
                color: C.red,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '16px',
              }}>
                IN CONVERSATIONS
              </div>
              {groups.in_conversations.map((step, i) => (
                <NextStepItem key={i} step={step} index={groups.this_week.length + i + 1} />
              ))}
            </div>
          )}

          {/* Ongoing */}
          {groups.ongoing.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <div style={{
                fontSize: '10px',
                fontWeight: '600',
                color: C.red,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '16px',
              }}>
                ONGOING
              </div>
              {groups.ongoing.map((step, i) => (
                <NextStepItem key={i} step={step} index={groups.this_week.length + groups.in_conversations.length + i + 1} />
              ))}
            </div>
          )}
        </>
      ) : (
        // Fallback: just list all steps
        nextSteps.map((step, i) => (
          <NextStepItem key={i} step={step} index={i + 1} />
        ))
      )}
    </div>
  );
}

function NextStepItem({ step, index }) {
  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      marginBottom: '20px',
      pageBreakInside: 'avoid',
    }}>
      <div style={{
        fontFamily: MONO,
        fontSize: '14px',
        fontWeight: '600',
        color: C.red,
        minWidth: '24px',
      }}>
        {index}.
      </div>
      <div style={{ flex: 1 }}>
        <p style={{
          fontFamily: FONT,
          fontSize: '14px',
          fontWeight: '600',
          color: C.ink,
          margin: 0,
          marginBottom: '4px',
        }}>
          {step.title}
        </p>
        <p style={{
          fontFamily: FONT,
          fontSize: '13px',
          color: C.gray,
          margin: 0,
          lineHeight: 1.5,
        }}>
          {step.rationale}
        </p>
      </div>
    </div>
  );
}

// Page 8: About Your Lens
function AboutPage() {
  return (
    <div className="print-page" style={{
      padding: '60px',
      minHeight: '100vh',
      boxSizing: 'border-box',
    }}>
      {/* Section header */}
      <div style={{
        fontSize: '9px',
        fontWeight: '600',
        color: C.red,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: '40px',
      }}>
        ABOUT YOUR LENS
      </div>

      {/* What this is */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{
          fontFamily: FONT,
          fontSize: '16px',
          fontWeight: '600',
          color: C.ink,
          margin: 0,
          marginBottom: '12px',
        }}>
          What this is
        </h3>
        <p style={{
          fontFamily: FONT,
          fontSize: '14px',
          color: C.ink,
          lineHeight: 1.7,
          margin: 0,
        }}>
          A structured portrait of your professional identity, synthesized through AI-guided discovery
          across six dimensions: Essence, Skills & Experience, Values, Mission & Direction, Work Style,
          and Non-Negotiables. The Lens captures not just what you've done, but how you think about
          your work, what energizes you, and what you're building toward.
        </p>
      </div>

      {/* What this isn't */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{
          fontFamily: FONT,
          fontSize: '16px',
          fontWeight: '600',
          color: C.ink,
          margin: 0,
          marginBottom: '12px',
        }}>
          What this isn't
        </h3>
        <p style={{
          fontFamily: FONT,
          fontSize: '14px',
          color: C.ink,
          lineHeight: 1.7,
          margin: 0,
        }}>
          This is not a personality test, assessment score, or career prescription. It doesn't tell
          you what to do—it reflects what you've told us about who you are. Think of it as a
          conversation catalyst: a document that helps others understand you quickly and accurately,
          so you can skip the small talk and get to the real questions.
        </p>
      </div>

      {/* How to use it */}
      <div style={{ marginBottom: '48px' }}>
        <h3 style={{
          fontFamily: FONT,
          fontSize: '16px',
          fontWeight: '600',
          color: C.ink,
          margin: 0,
          marginBottom: '12px',
        }}>
          How to use it
        </h3>
        <ul style={{
          fontFamily: FONT,
          fontSize: '14px',
          color: C.ink,
          lineHeight: 1.7,
          margin: 0,
          paddingLeft: '20px',
        }}>
          <li style={{ marginBottom: '8px' }}>
            <strong>Share with recruiters</strong> — Skip the small talk. A Lens helps recruiters
            match you to opportunities based on fit, not just keywords.
          </li>
          <li style={{ marginBottom: '8px' }}>
            <strong>Reference before interviews</strong> — Stay anchored. Review your own articulation
            of values, mission, and non-negotiables so you stay consistent and confident.
          </li>
          <li>
            <strong>Compare against job descriptions</strong> — Evaluate alignment. Use the dimension
            scores to assess how well a role matches your professional identity.
          </li>
        </ul>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 'auto',
        paddingTop: '40px',
        borderTop: `0.5px solid ${C.hairline}`,
      }}>
        <p style={{
          fontFamily: FONT,
          fontSize: '12px',
          color: C.gray,
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

export default function PremiumLensDocument({
  lensMarkdown,
  metadata,
  nextSteps,
  resumeSuggestions,
  hasResumeData = false, // Whether resume text was available during generation
  onClose,
  inline = false, // If true, renders without modal overlay for preview mode
  buildId = "draft", // Build version for PDF filename
  personNameOverride = null, // Override for person's name (full name from caller)
}) {
  const documentRef = useRef(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // Parse lens markdown
  const sections = parseLensMarkdown(lensMarkdown || '');
  const frontmatter = sections.frontmatter || {};

  // Extract data from metadata
  const keyPhrases = metadata?.key_phrases || [];
  const softGates = metadata?.soft_gates || {};
  const essenceStatement = metadata?.essence_statement || extractPullQuote(sections['Essence']) || null;

  // Extract person's name - priority: override → frontmatter → narrative extraction
  const personName = personNameOverride || frontmatter.name || extractNameFromNarrative(sections) || null;

  // Set document title while modal is open (works for both button click and Cmd+P)
  const originalTitleRef = useRef(null);
  useEffect(() => {
    // Only set title when in modal mode (not inline preview)
    if (inline) return;

    // Title case: "Maria Gutierrez" → "Maria_Gutierrez"
    const userName = personName
      ?.split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("_") || "Candidate";
    const pdfFilename = `${userName}_Lens_Full_${buildId}`;

    // Store original and set PDF filename
    originalTitleRef.current = document.title;
    document.title = pdfFilename;

    // Restore on unmount
    return () => {
      if (originalTitleRef.current) {
        document.title = originalTitleRef.current;
      }
    };
  }, [personName, buildId, inline]);

  // Handle print to PDF
  const handlePrint = useCallback(() => {
    setIsPrinting(true);

    // Set document title for PDF filename: user_name_lens_full_buildId
    const originalTitle = document.title;
    const userName = personName?.toLowerCase().replace(/\s+/g, "_") || "candidate";
    document.title = `${userName}_lens_full_${buildId}`;

    setTimeout(() => {
      window.print();
      setIsPrinting(false);
      // Restore title after print dialog closes
      setTimeout(() => {
        document.title = originalTitle;
      }, 500);
    }, 100);
  }, [personName, buildId]);

  // Build dimension data for pages 3-5
  const dimensionData = {
    sections,
    scores: {
      essence_clarity: softGates.essence_clarity || 75,
      skill_depth: softGates.skill_depth || 70,
      values_articulation: softGates.values_articulation || 70,
      mission_alignment: softGates.mission_alignment || 65,
      work_style_clarity: softGates.work_style_clarity || 70,
      boundaries_defined: softGates.boundaries_defined || 65,
    },
  };

  // Radar chart dimensions - keys must match what RadarChart expects
  const radarDimensions = {
    essence_clarity: softGates.essence_clarity || 75,
    skill_depth: softGates.skill_depth || 70,
    values_articulation: softGates.values_articulation || 70,
    mission_alignment: softGates.mission_alignment || 65,
    work_style_clarity: softGates.work_style_clarity || 70,
    boundaries_defined: softGates.boundaries_defined || 65,
  };

  // Inline mode: render document directly without modal
  if (inline) {
    return (
      <div
        ref={documentRef}
        id="premium-lens-document-inline"
        style={{
          backgroundColor: C.paper,
          border: `1px solid ${C.hairline}`,
        }}
      >
        {/* Condensed Cover */}
        <div style={{ padding: '40px', borderBottom: `1px solid ${C.hairline}` }}>
          <div style={{
            fontSize: '12px',
            fontWeight: '700',
            color: C.red,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            marginBottom: '24px',
          }}>
            LENS
          </div>
          <h1 style={{
            fontFamily: FONT,
            fontSize: '32px',
            fontWeight: '700',
            color: C.ink,
            margin: 0,
            marginBottom: '8px',
            lineHeight: 1.1,
          }}>
            {personName || 'Professional Identity Lens'}
          </h1>
          <p style={{
            fontFamily: FONT,
            fontSize: '14px',
            color: C.gray,
            margin: 0,
            marginBottom: '20px',
          }}>
            {frontmatter.date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
          {essenceStatement && (
            <p style={{
              fontFamily: FONT,
              fontSize: '16px',
              fontStyle: 'italic',
              color: C.ink,
              lineHeight: 1.6,
              margin: 0,
              borderLeft: `2px solid ${C.red}`,
              paddingLeft: '16px',
            }}>
              {essenceStatement}
            </p>
          )}
        </div>

        {/* Identity Portrait with Radar */}
        <div style={{ padding: '40px', borderBottom: `1px solid ${C.hairline}` }}>
          <div style={{
            fontSize: '9px',
            fontWeight: '600',
            color: C.red,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '24px',
          }}>
            IDENTITY PORTRAIT
          </div>
          <RadarChart dimensions={radarDimensions} />
          {keyPhrases.length > 0 && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              justifyContent: 'center',
              marginTop: '24px',
            }}>
              {keyPhrases.slice(0, 4).map((phrase, i) => (
                <span key={i} style={{
                  fontFamily: FONT,
                  fontSize: '11px',
                  color: C.ink,
                  backgroundColor: C.container,
                  padding: '6px 12px',
                  borderRadius: 0,
                }}>
                  "{phrase}"
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Dimension Previews */}
        {['Essence', 'Skills & Experience', 'Values', 'Mission & Direction', 'Work Style', 'Non-Negotiables'].map((dimName, i) => {
          const content = sections[dimName] || '';
          const scoreKeys = ['essence_clarity', 'skill_depth', 'values_articulation', 'mission_alignment', 'work_style_clarity', 'boundaries_defined'];
          const score = dimensionData.scores[scoreKeys[i]] || 70;
          const preview = content.split('\n\n')[0]?.slice(0, 200) || '';

          return (
            <div key={dimName} style={{ padding: '24px 40px', borderBottom: `1px solid ${C.hairline}` }}>
              <div style={{
                fontSize: '9px',
                fontWeight: '600',
                color: C.red,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '12px',
              }}>
                {dimName.toUpperCase()}
              </div>
              <SignalBar score={score} />
              <p style={{
                fontFamily: FONT,
                fontSize: '13px',
                color: C.ink,
                lineHeight: 1.6,
                margin: 0,
              }}>
                {preview}{preview.length >= 200 ? '...' : ''}
              </p>
            </div>
          );
        })}

        {/* Footer teaser */}
        <div style={{ padding: '24px 40px', backgroundColor: C.container }}>
          <p style={{
            fontFamily: FONT,
            fontSize: '12px',
            color: C.gray,
            margin: 0,
            textAlign: 'center',
          }}>
            Download PDF for full document including Next Steps, Resume Enhancements, and About Your Lens
          </p>
        </div>
      </div>
    );
  }

  // Modal mode: full document with print capability
  return (
    <div
      data-premium-modal
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 1000,
        overflow: 'auto',
        padding: '40px',
      }}
    >
      {/* Toolbar (hidden when printing) */}
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
            borderRadius: 0,
          }}
        >
          {isPrinting ? 'Preparing...' : 'Download Your Lens'}
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
            borderRadius: 0,
          }}
        >
          Close
        </button>
      </div>

      {/* Document container */}
      <div
        ref={documentRef}
        id="premium-lens-document"
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          backgroundColor: C.paper,
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Page 1: Cover */}
        <CoverPage
          name={personName}
          date={frontmatter.date}
          essenceStatement={essenceStatement}
        />

        {/* Page 2: Identity Portrait */}
        <IdentityPortraitPage
          dimensions={radarDimensions}
          keyPhrases={keyPhrases}
        />

        {/* Pages 3-5: Dimension Deep Dives */}
        <DimensionPage dimensions={dimensionData} pageNumber={3} />
        <DimensionPage dimensions={dimensionData} pageNumber={4} />
        <DimensionPage dimensions={dimensionData} pageNumber={5} />

        {/* Page 6: Resume Enhancements */}
        <ResumeEnhancementsPage
          suggestions={resumeSuggestions?.suggestions}
          alignment={resumeSuggestions?.overall_alignment}
          hasResumeData={hasResumeData}
        />

        {/* Page 7: Next Steps */}
        <NextStepsPage nextSteps={nextSteps?.next_steps} />

        {/* Page 8: About Your Lens */}
        <AboutPage />
      </div>

      {/* Print styles - injected globally */}
      <style>{`
        @media print {
          /* Reset all elements to be invisible */
          html, body {
            height: auto !important;
            overflow: visible !important;
          }

          /* Hide everything first */
          body * {
            visibility: hidden;
          }

          /* Make the modal overlay and document visible */
          [data-premium-modal],
          [data-premium-modal] *,
          #premium-lens-document,
          #premium-lens-document * {
            visibility: visible;
          }

          /* Reset modal styling for print */
          [data-premium-modal] {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            background: white !important;
            padding: 0 !important;
            overflow: visible !important;
            z-index: 999999 !important;
          }

          /* Document container */
          #premium-lens-document {
            position: relative !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            box-shadow: none !important;
          }

          /* Hide non-printable elements */
          .no-print,
          .no-print * {
            display: none !important;
            visibility: hidden !important;
          }

          /* Page settings */
          @page {
            size: letter;
            margin: 0.5in;
          }

          /* Page breaks */
          .print-page {
            page-break-after: always;
            page-break-inside: avoid;
            min-height: auto !important;
          }

          .print-page:last-child {
            page-break-after: auto;
          }

          /* Print colors */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
