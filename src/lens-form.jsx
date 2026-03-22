// =============================================================
// lens-form.jsx — AI-Coached Discovery Intake Form
// =============================================================
//
// TODO: Copy the full component from the Claude conversation where it was built:
// https://claude.ai/chat/73104949-6234-4ff7-afac-494122e685f3
//
// The component is ~800 lines of React with:
// - Status selection (Employed / Actively Searching / In Transition)
// - Resume upload with PDF text extraction
// - 8-section AI-guided discovery flow:
//   1. Essence — identity patterns, throughline across contexts
//   2. Skills & Experience — carry forward vs. leave behind
//   3. Values — behavioral evidence, not poster values
//   4. Mission & Sector — specific orgs/problems worth their time
//   5. Work Style — how they actually work
//   6. What Fills You — energy sources vs. drains
//   7. Disqualifiers — hard no's for exclusion filter
//   8. Situation & Timeline — urgency, constraints, runway
// - Live Claude API integration (Sonnet)
// - Typewriter effect for AI responses
// - YAML frontmatter + markdown lens document output
// - 6 weighted scoring dimensions:
//   Mission (25%), Role (20%), Culture (18%), Skill (17%), Work Style (12%), Energy (8%)
// - Visual scoring tab with weight bars and signal tags
// - Instant disqualifiers display
// - Download .md + copy to clipboard
// - Dark editorial aesthetic (warm neutrals, #a08060 accent)
//
// NOTE: The design aesthetic will be updated to Swiss Style
// (white bg, black type, red/orange accent) before deployment.
// =============================================================

// Paste the full component below this line:
