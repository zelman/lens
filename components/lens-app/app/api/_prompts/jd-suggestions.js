// JD Enhancement Suggestions Prompt
// Analyzes gaps between role requirements and what the JD communicates
// Helps recruiters improve JD to attract right candidates

export const JD_SUGGESTIONS_SYSTEM_PROMPT = `You are a job description analyst. You have two inputs:
1. A role-candidate match report showing dimension scores and gaps
2. The original job description text

Your job is to identify where the JD fails to communicate what the role actually requires, based on the match analysis. These are signals that the hiring manager cares about but the JD doesn't express.

THE 6 DIMENSIONS:
- essence_clarity: How clearly the role requires articulated professional identity
- skill_depth: Technical/functional expertise requirements
- values_articulation: Values alignment expectations
- mission_alignment: Connection to company/product mission
- work_style_clarity: Work environment and collaboration specifics
- boundaries_defined: Constraints, dealbreakers, non-negotiables

RULES:
- Generate 3-5 specific enhancement suggestions
- Each must cite: the match dimension, what the role actually requires (from the match data), and where the JD is silent or misleading
- Be CONCRETE: "Add a line under Responsibilities that signals genuine decision-making authority" not "consider being more specific"
- Do NOT give generic JD advice (no "use inclusive language" or "add salary range")
- Focus on signals that would attract the RIGHT candidates and filter the WRONG ones
- If the JD is well-written for a particular dimension, note it briefly in alignment_notes
- Priority should be: high (critical gap), medium (notable gap), low (minor improvement)

OUTPUT FORMAT:
Return ONLY the JSON object below. Do not include any text before or after. Start with { and end with }.

{
  "suggestions": [
    {
      "title": "Short gap title (4-7 words)",
      "role_requires": "What the match data shows the role actually needs (1-2 sentences)",
      "jd_communicates": "What the JD currently says about this (1-2 sentences, or 'Not addressed')",
      "action": "Specific rewrite suggestion with example language",
      "source_dimension": "essence_clarity|skill_depth|values_articulation|mission_alignment|work_style_clarity|boundaries_defined",
      "priority": "high|medium|low"
    }
  ],
  "alignment_notes": "1-2 sentences on where JD and role requirements ARE well-aligned (what's working)"
}`;

export function buildJdSuggestionsUserContent({
  jdText,
  matchData,
  candidateDimensions,
  roleDimensions,
  gaps,
}) {
  let content = `Analyze this job description against the role requirements and suggest improvements.\n\n`;

  content += `## ROLE REQUIREMENT SCORES (what the role actually needs)\n\n`;
  content += `| Dimension | Role Requires | Candidate Has | Gap |\n`;
  content += `|-----------|---------------|---------------|-----|\n`;

  const dimensionLabels = {
    essence_clarity: 'Essence Clarity',
    skill_depth: 'Skill Depth',
    values_articulation: 'Values Articulation',
    mission_alignment: 'Mission Alignment',
    work_style_clarity: 'Work Style Clarity',
    boundaries_defined: 'Boundaries Defined',
  };

  for (const [key, label] of Object.entries(dimensionLabels)) {
    const roleScore = roleDimensions?.[key] || 50;
    const candScore = candidateDimensions?.[key] || 50;
    const gap = candScore - roleScore;
    const gapStr = gap > 0 ? `+${gap}` : gap.toString();
    content += `| ${label} | ${roleScore} | ${candScore} | ${gapStr} |\n`;
  }

  if (gaps && gaps.length > 0) {
    content += `\n## KEY GAPS TO ADDRESS\n`;
    gaps.slice(0, 4).forEach(g => {
      content += `- ${g.dimension}: role requires ${g.roleScore}, but JD may not communicate this clearly\n`;
    });
  }

  if (matchData?.briefing) {
    content += `\n## MATCH BRIEFING\n${matchData.briefing}\n`;
  }

  content += `\n---JOB DESCRIPTION---\n${jdText}\n---END JOB DESCRIPTION---\n\n`;

  content += `Identify where the JD fails to communicate what the role actually requires. Return only valid JSON.`;

  return content;
}
