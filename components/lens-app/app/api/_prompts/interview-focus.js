// Interview Focus Areas Prompt
// Generates targeted interview questions based on candidate-role match analysis
// Groups into: Explore (gaps), Validate (strengths), Watch (risks)

export const INTERVIEW_FOCUS_SYSTEM_PROMPT = `You are a hiring advisor. You have a candidate-role match report showing dimension scores, gaps, and alignment. Generate interview focus areas for the hiring manager.

THE 6 DIMENSIONS:
- essence_clarity: Professional identity and self-awareness
- skill_depth: Technical/functional expertise depth
- values_articulation: Demonstrated values and principles
- mission_alignment: Connection to company/product mission
- work_style_clarity: Work environment and collaboration fit
- boundaries_defined: Clear constraints and non-negotiables

RULES:
- Generate 2-3 items per group (Explore, Validate, Watch)
- Every question must reference a SPECIFIC dimension gap or alignment point from the match data
- Questions should be behavioral ("Tell me about a time when...") or situational ("How would you handle...")
- For gaps: frame questions that determine if the gap is real or an artifact of how the JD was written
- For strengths: frame questions that confirm the signal beyond resume talking points
- For red flags: frame questions that let the candidate address the concern directly without leading
- Do NOT include generic interview questions. Every item must be grounded in THIS specific match
- Keep titles to 5-8 words
- Keep context to 1-2 sentences

OUTPUT FORMAT:
Return ONLY the JSON object below. Do not include any text before or after. Start with { and end with }.

{
  "explore": [
    {
      "title": "Short focus area title (5-8 words)",
      "question": "Specific behavioral or situational question",
      "context": "Why this matters based on the match data (1-2 sentences)",
      "source_dimension": "essence_clarity|skill_depth|values_articulation|mission_alignment|work_style_clarity|boundaries_defined"
    }
  ],
  "validate": [
    {
      "title": "...",
      "question": "...",
      "context": "...",
      "source_dimension": "..."
    }
  ],
  "watch": [
    {
      "title": "...",
      "question": "...",
      "context": "...",
      "source_dimension": "..."
    }
  ]
}`;

export function buildInterviewFocusUserContent({
  matchData,
  candidateDimensions,
  roleDimensions,
  gaps,
  redFlags,
  strengths,
}) {
  let content = `Generate interview focus areas based on this candidate-role match analysis.\n\n`;

  content += `## DIMENSION SCORES\n\n`;
  content += `| Dimension | Candidate | Role Requires | Gap |\n`;
  content += `|-----------|-----------|---------------|-----|\n`;

  const dimensionLabels = {
    essence_clarity: 'Essence Clarity',
    skill_depth: 'Skill Depth',
    values_articulation: 'Values Articulation',
    mission_alignment: 'Mission Alignment',
    work_style_clarity: 'Work Style Clarity',
    boundaries_defined: 'Boundaries Defined',
  };

  for (const [key, label] of Object.entries(dimensionLabels)) {
    const candScore = candidateDimensions?.[key] || 50;
    const roleScore = roleDimensions?.[key] || 50;
    const gap = candScore - roleScore;
    const gapStr = gap > 0 ? `+${gap}` : gap.toString();
    content += `| ${label} | ${candScore} | ${roleScore} | ${gapStr} |\n`;
  }

  if (gaps && gaps.length > 0) {
    content += `\n## LARGEST GAPS (candidate below role requirement)\n`;
    gaps.filter(g => g.direction === 'under').slice(0, 3).forEach(g => {
      content += `- ${g.dimension}: candidate ${g.candidateScore}, role requires ${g.roleScore} (gap: ${g.gap})\n`;
    });
  }

  if (strengths && strengths.length > 0) {
    content += `\n## STRENGTHS (from match data)\n`;
    strengths.slice(0, 5).forEach(s => {
      content += `- ${s}\n`;
    });
  }

  if (redFlags && redFlags.length > 0) {
    content += `\n## RED FLAGS / CONCERNS\n`;
    redFlags.slice(0, 5).forEach(f => {
      content += `- ${f}\n`;
    });
  }

  if (matchData?.briefing) {
    content += `\n## MATCH BRIEFING\n${matchData.briefing}\n`;
  }

  if (matchData?.classification) {
    content += `\n## CLASSIFICATION: ${matchData.classification}\n`;
  }

  content += `\n---\n\nGenerate interview focus areas. Return only valid JSON.`;

  return content;
}
