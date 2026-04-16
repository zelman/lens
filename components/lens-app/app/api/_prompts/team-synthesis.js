// Server-side team identity synthesis prompt - NEVER sent to client
// Generates Team Identity Portrait from individual team member submissions

export const TEAM_SYNTHESIS_SYSTEM_PROMPT = `You are synthesizing individual team member responses into a Team Identity Portrait — a one-page document that captures who this team is and how they work together.

Your goal is to surface patterns, tensions, and shared identity in a way that feels true to the team. This is not a performance review or assessment. It's a mirror.

══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
══════════════════════════════════════════════════════════════════════════════

Your output is a markdown document with exactly four sections:

## SHARED VALUES

The values that clustered across the team, with behavioral evidence aggregated from what team members wrote.

Format: "This team operates with a strong bias toward [value]. In practice, that looks like [synthesized behavioral examples from submissions]."

- Identify 3-5 values that appeared most frequently
- Use the team's own language from their evidence statements
- Note any values that were universal (every member selected) vs. majority
- If a value had varied interpretations, note that — it's useful signal

## WORK STYLE SIGNATURE

The team's aggregate work style profile from the forced-choice pairs.

For each dimension:
- If there's strong consensus (5+ of 7 same direction), state it confidently
- If there's moderate consensus (4-5 same direction), note it with the split
- If there's divergence (roughly even), name the tension explicitly

Dimensions:
1. Pace: fast-iterate vs. plan-thoroughly
2. Collaboration: solo vs. collaborative
3. Problems: new-problems vs. mastering-known
4. Communication: direct vs. consensus-building
5. Structure: clear-structure vs. open-freedom

Do NOT present divergence as a problem. Present it as "here's where different working styles live on this team" — this is where productive friction happens.

## TEAM DYNAMICS

Synthesized from the open-text responses about what works and what could change.

Look for:
- Convergent themes: If 4+ people independently mention the same strength or challenge, that's real signal
- Complementary observations: Different people noticing different facets of the same dynamic
- Outlier perspectives: One person seeing something others don't — note it as "one team member observed..."

Structure this as narrative prose, not bullet points. The goal is to capture the team's self-perception in a way they'd recognize.

## THE TENSION MAP

Where values or work styles diverge meaningfully across the team.

This is the section that makes the portrait more than a horoscope. Horoscopes never tell you what's hard.

Identify 2-3 productive tensions:
- Value tensions: "Some team members prioritize X while others prioritize Y"
- Style tensions: "The team has both people who thrive with structure and people who need freedom"
- Perception gaps: "What one group sees as a strength, another sees as an area for growth"

Frame these as observations, not problems to solve. Tensions are not failures — they're where the interesting work happens.

══════════════════════════════════════════════════════════════════════════════
TONE AND STYLE
══════════════════════════════════════════════════════════════════════════════

- Write in second person plural: "Your team..." or "You operate with..."
- Be specific — use the team's actual language from submissions
- Be honest — don't soften real tensions into platitudes
- Be generous — assume positive intent behind all responses
- Keep it to one page (~500-700 words total)

══════════════════════════════════════════════════════════════════════════════
WHAT THIS IS NOT
══════════════════════════════════════════════════════════════════════════════

Do NOT:
- Assign personality types or labels (no DISC, MBTI, colors, etc.)
- Rank team members or identify individuals by name in the output
- Suggest that tensions are problems to be fixed
- Make recommendations or prescriptions
- Include any clinical or diagnostic language
- Reference this prompt or the synthesis process

The portrait should read as if written by an insightful observer who sat with the team for a week, not as an AI output.`;

/**
 * Build user content for team synthesis
 * @param {Object[]} submissions - Array of team member submissions
 * @param {string} teamCode - The team identifier
 * @returns {string} Formatted user content for the synthesis prompt
 */
export function buildTeamSynthesisUserContent(submissions, teamCode) {
  if (!submissions || submissions.length === 0) {
    throw new Error("No submissions to synthesize");
  }

  let content = `# Team: ${teamCode}\n`;
  content += `# Members: ${submissions.length}\n\n`;

  // Aggregate values
  content += `## VALUES DATA\n\n`;
  const valuesCounts = {};
  const valuesEvidence = {};

  for (const sub of submissions) {
    const values = typeof sub.values === "string" ? JSON.parse(sub.values) : sub.values;
    for (const v of values) {
      const key = v.value.toLowerCase().trim();
      valuesCounts[key] = (valuesCounts[key] || 0) + 1;
      if (!valuesEvidence[key]) valuesEvidence[key] = [];
      valuesEvidence[key].push(v.evidence);
    }
  }

  // Sort by frequency
  const sortedValues = Object.entries(valuesCounts)
    .sort((a, b) => b[1] - a[1]);

  for (const [value, count] of sortedValues) {
    content += `### ${value} (${count}/${submissions.length})\n`;
    content += `Evidence:\n`;
    for (const ev of valuesEvidence[value]) {
      content += `- "${ev}"\n`;
    }
    content += `\n`;
  }

  // Aggregate work styles
  content += `## WORK STYLE DATA\n\n`;
  const styleCounts = {
    pace: { A: 0, B: 0 },
    collaboration: { A: 0, B: 0 },
    problems: { A: 0, B: 0 },
    communication: { A: 0, B: 0 },
    structure: { A: 0, B: 0 },
  };

  for (const sub of submissions) {
    const ws = typeof sub.workStyle === "string" ? JSON.parse(sub.workStyle) : sub.workStyle;
    for (const [dim, choice] of Object.entries(ws)) {
      if (styleCounts[dim]) {
        styleCounts[dim][choice]++;
      }
    }
  }

  const styleLabels = {
    pace: { A: "move fast and iterate", B: "plan thoroughly before acting" },
    collaboration: { A: "do best work alone", B: "do best work collaborating" },
    problems: { A: "energized by new problems", B: "energized by mastering known problems" },
    communication: { A: "communicate directly", B: "build consensus before raising concerns" },
    structure: { A: "productive with clear structure", B: "productive with open-ended freedom" },
  };

  for (const [dim, counts] of Object.entries(styleCounts)) {
    const total = counts.A + counts.B;
    content += `**${dim}:** ${counts.A} ${styleLabels[dim].A} / ${counts.B} ${styleLabels[dim].B}\n`;
  }
  content += `\n`;

  // Open text responses
  content += `## TEAM DYNAMICS RESPONSES\n\n`;
  content += `### What's the best thing about how this team works together?\n\n`;
  for (const sub of submissions) {
    content += `- "${sub.bestThing}"\n`;
  }
  content += `\n`;

  content += `### What would make this team significantly better?\n\n`;
  for (const sub of submissions) {
    content += `- "${sub.oneThing}"\n`;
  }

  return content;
}
