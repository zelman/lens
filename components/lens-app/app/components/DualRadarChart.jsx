'use client';

// ═══════════════════════════════════════════════════════════════════════
// DualRadarChart — Two overlaid polygons for candidate vs role comparison
// Swiss Style design: #D93025 candidate (red), #2D6A2D role (green)
// Dimensions: same 6 axes as C lens (Essence, Skills, Values, Mission, Work Style, Non-Neg)
// ═══════════════════════════════════════════════════════════════════════

// Design tokens (Swiss Style)
const C = {
  red: '#D93025',      // Candidate
  green: '#2D6A2D',    // Role
  ink: '#1A1A1A',
  gray: '#666666',
  hairline: '#EEEEEE',
};

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
const MONO = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace';

// Six axes matching the C lens dimensions
const AXES = [
  { label: 'Essence', key: 'essence_clarity' },
  { label: 'Skills & Experience', key: 'skill_depth' },
  { label: 'Values', key: 'values_articulation' },
  { label: 'Mission & Direction', key: 'mission_alignment' },
  { label: 'Work Style', key: 'work_style_clarity' },
  { label: 'Non-Negotiables', key: 'boundaries_defined' },
];

export default function DualRadarChart({
  candidateDimensions,  // { essence_clarity: 75, skill_depth: 70, ... }
  roleDimensions,       // { essence_clarity: 80, skill_depth: 85, ... }
  showLegend = true,
  showScores = true,
  compact = false,      // Smaller size for inline use
}) {
  // Chart dimensions: viewBox 500x480 (or 400x400 for compact), center offset for labels
  const maxRadius = compact ? 120 : 160;
  const viewBoxWidth = compact ? 400 : 500;
  const viewBoxHeight = compact ? 380 : 480;
  const centerX = viewBoxWidth / 2;
  const centerY = compact ? 170 : 230;

  // Get values (default to 50 if missing)
  const candidateValues = AXES.map(a => Math.min(100, Math.max(0, candidateDimensions?.[a.key] || 50)));
  const roleValues = AXES.map(a => Math.min(100, Math.max(0, roleDimensions?.[a.key] || 50)));

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

  // Data points for both polygons
  const candidatePoints = candidateValues.map((v, i) => getPoint(v, i));
  const rolePoints = roleValues.map((v, i) => getPoint(v, i));

  const candidatePolygon = candidatePoints.map(p => `${p.x},${p.y}`).join(' ');
  const rolePolygon = rolePoints.map(p => `${p.x},${p.y}`).join(' ');

  // Axis label positions (outside the chart)
  const labelOffset = maxRadius + (compact ? 15 : 22);
  const labelPositions = compact ? [
    { x: 0, y: -labelOffset - 10, anchor: 'middle' },
    { x: labelOffset + 30, y: -labelOffset/2 + 10, anchor: 'start' },
    { x: labelOffset + 30, y: labelOffset/2 + 5, anchor: 'start' },
    { x: 0, y: labelOffset + 20, anchor: 'middle' },
    { x: -labelOffset - 30, y: labelOffset/2 + 5, anchor: 'end' },
    { x: -labelOffset - 30, y: -labelOffset/2 + 10, anchor: 'end' },
  ] : [
    { x: 0, y: -182, anchor: 'middle' },           // Essence (top)
    { x: 160, y: -90, anchor: 'start' },           // Skills (top-right)
    { x: 160, y: 95, anchor: 'start' },            // Values (bottom-right)
    { x: 0, y: 190, anchor: 'middle' },            // Mission (bottom)
    { x: -160, y: 95, anchor: 'end' },             // Work Style (bottom-left)
    { x: -160, y: -90, anchor: 'end' },            // Non-Neg (top-left)
  ];

  // Score label offsets for candidate (red) scores
  const candidateScoreOffsets = [
    { dx: 12, dy: -4 },
    { dx: 10, dy: 4 },
    { dx: 10, dy: 6 },
    { dx: 12, dy: 10 },
    { dx: -24, dy: 6 },
    { dx: -24, dy: 0 },
  ];

  // Score label offsets for role (green) scores - offset further to avoid overlap
  const roleScoreOffsets = [
    { dx: -24, dy: -4 },
    { dx: 10, dy: -14 },
    { dx: 10, dy: 18 },
    { dx: -24, dy: 10 },
    { dx: -24, dy: -6 },
    { dx: 10, dy: 0 },
  ];

  // Calculate grid radii based on maxRadius
  const gridRadii = [0.25, 0.5, 0.75, 1].map(pct => pct * maxRadius);

  // Calculate alignment score (simple average of how close dimensions are)
  const calculateAlignment = () => {
    let totalDiff = 0;
    for (let i = 0; i < 6; i++) {
      totalDiff += Math.abs(candidateValues[i] - roleValues[i]);
    }
    // Max difference would be 100 * 6 = 600, convert to percentage alignment
    return Math.round(100 - (totalDiff / 6));
  };

  // Find largest gap
  const findLargestGap = () => {
    let maxGap = 0;
    let gapDimension = '';
    let gapDirection = '';
    let candidateScore = 0;
    let roleScore = 0;

    for (let i = 0; i < 6; i++) {
      const gap = Math.abs(candidateValues[i] - roleValues[i]);
      if (gap > maxGap) {
        maxGap = gap;
        gapDimension = AXES[i].label;
        gapDirection = candidateValues[i] < roleValues[i] ? 'under' : 'over';
        candidateScore = candidateValues[i];
        roleScore = roleValues[i];
      }
    }

    return { dimension: gapDimension, gap: maxGap, direction: gapDirection, candidateScore, roleScore };
  };

  const alignment = calculateAlignment();
  const largestGap = findLargestGap();

  return (
    <div style={{ width: '100%' }}>
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        style={{ display: 'block', margin: '0 auto', maxWidth: compact ? '350px' : '450px', width: '100%' }}
      >
        <g transform={`translate(${centerX}, ${centerY})`}>
          {/* Grid hexagons at 25, 50, 75, 100 */}
          {gridRadii.map((r, i) => (
            <polygon
              key={r}
              points={getHexPoints(r)}
              fill="none"
              stroke={C.hairline}
              strokeWidth="0.5"
            />
          ))}

          {/* Grid labels */}
          {!compact && (
            <>
              <text x="6" y={-gridRadii[0] + 2} style={{ fontFamily: MONO, fontSize: '9px', fill: C.gray }}>25</text>
              <text x="6" y={-gridRadii[1] + 2} style={{ fontFamily: MONO, fontSize: '9px', fill: C.gray }}>50</text>
              <text x="6" y={-gridRadii[2] + 2} style={{ fontFamily: MONO, fontSize: '9px', fill: C.gray }}>75</text>
              <text x="6" y={-gridRadii[3] + 2} style={{ fontFamily: MONO, fontSize: '9px', fill: C.gray }}>100</text>
            </>
          )}

          {/* Axis lines from center to vertices */}
          {[0, 1, 2, 3, 4, 5].map(i => {
            const angle = (i * 60 - 90) * (Math.PI / 180);
            const endX = (maxRadius + 10) * Math.cos(angle);
            const endY = (maxRadius + 10) * Math.sin(angle);
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

          {/* Role polygon (green, dashed - render first so candidate is on top) */}
          <polygon
            points={rolePolygon}
            fill={C.green}
            fillOpacity="0.10"
            stroke={C.green}
            strokeWidth="1.5"
            strokeDasharray="6,3"
          />

          {/* Candidate polygon (red, solid) */}
          <polygon
            points={candidatePolygon}
            fill={C.red}
            fillOpacity="0.12"
            stroke={C.red}
            strokeWidth="1.5"
          />

          {/* Role data dots (green) */}
          {rolePoints.map((p, i) => (
            <circle
              key={`role-${i}`}
              cx={p.x}
              cy={p.y}
              r="3.5"
              fill={C.green}
            />
          ))}

          {/* Candidate data dots (red) */}
          {candidatePoints.map((p, i) => (
            <circle
              key={`cand-${i}`}
              cx={p.x}
              cy={p.y}
              r="3.5"
              fill={C.red}
            />
          ))}

          {/* Axis labels */}
          {AXES.map((axis, i) => (
            <text
              key={i}
              x={labelPositions[i].x}
              y={labelPositions[i].y}
              textAnchor={labelPositions[i].anchor}
              style={{
                fontFamily: FONT,
                fontSize: compact ? '11px' : '13px',
                fontWeight: '500',
                fill: C.ink,
              }}
            >
              {axis.label}
            </text>
          ))}

          {/* Score labels (only if showScores is true and not compact) */}
          {/* When scores are close (within 12 pts), show combined "C/R" label to avoid overlap */}
          {showScores && !compact && (
            <>
              {candidatePoints.map((p, i) => {
                const candScore = candidateValues[i];
                const roleScore = roleValues[i];
                const scoreDiff = Math.abs(candScore - roleScore);
                const midPoint = {
                  x: (candidatePoints[i].x + rolePoints[i].x) / 2,
                  y: (candidatePoints[i].y + rolePoints[i].y) / 2,
                };

                // When scores are close, show combined label at midpoint
                if (scoreDiff <= 12) {
                  return (
                    <text
                      key={`combined-score-${i}`}
                      x={midPoint.x + candidateScoreOffsets[i].dx}
                      y={midPoint.y + candidateScoreOffsets[i].dy}
                      style={{
                        fontFamily: MONO,
                        fontSize: '9px',
                        fontWeight: '600',
                      }}
                    >
                      <tspan fill={C.red}>{candScore}</tspan>
                      <tspan fill={C.gray}>/</tspan>
                      <tspan fill={C.green}>{roleScore}</tspan>
                    </text>
                  );
                }

                // When scores differ significantly, show separate labels
                return (
                  <g key={`scores-${i}`}>
                    <text
                      x={p.x + candidateScoreOffsets[i].dx}
                      y={p.y + candidateScoreOffsets[i].dy}
                      style={{
                        fontFamily: MONO,
                        fontSize: '10px',
                        fill: C.red,
                        fontWeight: '600',
                      }}
                    >
                      {candScore}
                    </text>
                    <text
                      x={rolePoints[i].x + roleScoreOffsets[i].dx}
                      y={rolePoints[i].y + roleScoreOffsets[i].dy}
                      style={{
                        fontFamily: MONO,
                        fontSize: '10px',
                        fill: C.green,
                        fontWeight: '600',
                      }}
                    >
                      {roleScore}
                    </text>
                  </g>
                );
              })}
            </>
          )}
        </g>
      </svg>

      {/* Legend */}
      {showLegend && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          marginTop: '16px',
          fontFamily: FONT,
          fontSize: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '16px',
              height: '16px',
              backgroundColor: C.red,
              opacity: 0.15,
              border: `2px solid ${C.red}`,
            }} />
            <span style={{ color: C.ink }}>Candidate profile</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '16px',
              height: '16px',
              backgroundColor: C.green,
              opacity: 0.15,
              border: `2px dashed ${C.green}`,
            }} />
            <span style={{ color: C.ink }}>Role requirements</span>
          </div>
        </div>
      )}

      {/* Alignment metrics */}
      {showLegend && !compact && (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          backgroundColor: '#F8F8F8',
          fontFamily: FONT,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}>
            <span style={{ fontSize: '11px', color: C.gray, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Alignment Score
            </span>
            <span style={{
              fontFamily: MONO,
              fontSize: '20px',
              fontWeight: '700',
              color: alignment >= 70 ? C.green : alignment >= 50 ? '#E8590C' : C.red,
            }}>
              {alignment}%
            </span>
          </div>
          {largestGap.gap > 15 && (
            <div style={{ fontSize: '12px', color: C.ink, lineHeight: 1.5 }}>
              <strong>Largest gap:</strong> {largestGap.dimension} —
              candidate scores {largestGap.candidateScore}, role requires {largestGap.roleScore}
              {largestGap.direction === 'under' ? ' (candidate below requirement)' : ' (candidate exceeds requirement)'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Export alignment calculation for use elsewhere
export function calculateDualAlignment(candidateDimensions, roleDimensions) {
  const candidateValues = AXES.map(a => candidateDimensions?.[a.key] || 50);
  const roleValues = AXES.map(a => roleDimensions?.[a.key] || 50);

  let totalDiff = 0;
  const gaps = [];

  for (let i = 0; i < 6; i++) {
    const diff = Math.abs(candidateValues[i] - roleValues[i]);
    totalDiff += diff;
    gaps.push({
      dimension: AXES[i].label,
      dimensionKey: AXES[i].key,
      candidateScore: candidateValues[i],
      roleScore: roleValues[i],
      gap: diff,
      direction: candidateValues[i] < roleValues[i] ? 'under' : candidateValues[i] > roleValues[i] ? 'over' : 'aligned',
    });
  }

  // Sort once, use the sorted array for both return values
  const sortedGaps = [...gaps].sort((a, b) => b.gap - a.gap);

  return {
    alignmentScore: Math.round(100 - (totalDiff / 6)),
    gaps: sortedGaps,
    largestGap: sortedGaps[0],
  };
}
