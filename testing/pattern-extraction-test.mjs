#!/usr/bin/env node

/**
 * Pattern Extraction Test Harness
 *
 * Usage:
 *   node testing/pattern-extraction-test.mjs <tester-name> [--synthesize]
 *
 * Examples:
 *   node testing/pattern-extraction-test.mjs jerabek
 *   node testing/pattern-extraction-test.mjs jerabek --synthesize
 *
 * Requires:
 *   ANTHROPIC_API_KEY environment variable
 *
 * Input:
 *   test-corpus/<tester-name>/source/transcript.md
 *
 * Output:
 *   test-corpus/<tester-name>/output/pattern-extraction-v<n>.json
 *   test-corpus/<tester-name>/output/lens-with-extraction-v<n>.md (if --synthesize)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
// Two-stage validation protocol:
// Stage 1: Opus 4.7 (current) — validate approach on test corpus
// Stage 2: Sonnet 4.6 — calibrate for production cost if quality matches
const MODEL = "claude-opus-4-7";
const EXTRACTION_MAX_TOKENS = 4000;
const SYNTHESIS_MAX_TOKENS = 6000;
const TEMPERATURE = 0.3; // Lower for extraction (more deterministic)

// ═══════════════════════════════════════════════════════════════════════════
// PATTERN EXTRACTION SYSTEM PROMPT (from specs/pattern-extraction-prompt-v0.2.md)
// ═══════════════════════════════════════════════════════════════════════════

const PATTERN_EXTRACTION_PROMPT = `You are a pattern extraction engine for career coaching transcripts. Your job is to analyze discovery conversation transcripts and extract deeper signal that a synthesis step would otherwise miss.

You extract five categories of patterns:
1. TENSIONS — Contradictions between stated beliefs and observed behaviors
2. REPETITIONS — Recurring themes, phrases, or metaphors (deduplicate into single entries)
3. STRUCTURAL MOVES — How the person frames or positions information
4. UNSTATED IMPLICATIONS — What can be inferred from omissions or hedging
5. CONTRASTS — Explicit or implicit comparisons, moving toward vs. away from

RULES:
- Every extraction MUST include a section_id that maps to a valid discovery section (essence, values, mission, workstyle, energy, disqualifiers, goals, synthesis)
- Every extraction MUST include at least one verbatim or near-verbatim quote
- For repetitions, merge all occurrences of the same theme into ONE entry
- For unstated implications, include confidence level (high/medium/low)
- Maximum 10 extractions per category
- Do not extract surface-level observations — only patterns that reveal something non-obvious
- If a pattern spans multiple sections, note all relevant section_ids

OUTPUT FORMAT:
Return a JSON object with five arrays:
{
  "tensions": [...],
  "repetitions": [...],
  "structural_moves": [...],
  "unstated_implications": [...],
  "contrasts": [...]
}

If a category has no meaningful extractions, return an empty array.

TENSION FORMAT:
{
  "category": "tension",
  "section_id": "<section>",
  "quote": "<verbatim quote>",
  "tension_between": ["<pole 1>", "<pole 2>"],
  "implication": "<what this reveals>"
}

REPETITION FORMAT:
{
  "category": "repetition",
  "theme": "<theme name>",
  "occurrences": [
    { "section_id": "<section>", "quote": "<quote>" }
  ],
  "significance": "<why this matters>"
}

STRUCTURAL MOVE FORMAT:
{
  "category": "structural_move",
  "section_id": "<section>",
  "move_type": "<type of framing>",
  "quote": "<verbatim quote>",
  "what_it_reveals": "<insight>"
}

UNSTATED IMPLICATION FORMAT:
{
  "category": "unstated_implication",
  "section_id": "<section>",
  "observation": "<what was NOT said or hedged>",
  "implied_meaning": "<what this suggests>",
  "confidence": "high|medium|low"
}

CONTRAST FORMAT:
{
  "category": "contrast",
  "section_id": "<section>",
  "positive_pole": "<what they're moving toward>",
  "negative_pole": "<what they're moving away from>",
  "quote": "<verbatim quote>"
}`;

// ═══════════════════════════════════════════════════════════════════════════
// API CALL HELPER
// ═══════════════════════════════════════════════════════════════════════════

async function callClaude(systemPrompt, userContent, maxTokens, apiKey) {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      temperature: TEMPERATURE,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text;

  if (!text) {
    throw new Error("Empty response from Claude");
  }

  return text;
}

// ═══════════════════════════════════════════════════════════════════════════
// FILE HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function getNextVersion(outputDir, prefix) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    return 1;
  }

  const files = fs.readdirSync(outputDir);
  const pattern = new RegExp(`^${prefix}-v(\\d+)\\.(json|md)$`);

  let maxVersion = 0;
  for (const file of files) {
    const match = file.match(pattern);
    if (match) {
      maxVersion = Math.max(maxVersion, parseInt(match[1], 10));
    }
  }

  return maxVersion + 1;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  // Parse arguments
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Pattern Extraction Test Harness

Usage:
  node testing/pattern-extraction-test.mjs <tester-name> [--synthesize]

Arguments:
  <tester-name>   Name of the tester (folder name in test-corpus/)
  --synthesize    Also run synthesis with extractions (optional)

Environment:
  ANTHROPIC_API_KEY   Required. Your Anthropic API key.

Examples:
  node testing/pattern-extraction-test.mjs jerabek
  node testing/pattern-extraction-test.mjs jerabek --synthesize
`);
    process.exit(0);
  }

  const testerName = args.find(a => !a.startsWith('--'));
  const runSynthesis = args.includes('--synthesize');

  if (!testerName) {
    console.error("Error: Missing tester name");
    process.exit(1);
  }

  // Check API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("Error: ANTHROPIC_API_KEY environment variable not set");
    console.error("Set it with: export ANTHROPIC_API_KEY=your-key-here");
    process.exit(1);
  }

  // Build paths
  const corpusDir = path.join(PROJECT_ROOT, 'test-corpus', testerName);
  const transcriptPath = path.join(corpusDir, 'source', 'transcript.md');
  const outputDir = path.join(corpusDir, 'output');

  // Validate input exists
  if (!fs.existsSync(transcriptPath)) {
    console.error(`Error: Transcript not found at ${transcriptPath}`);
    console.error(`Make sure test-corpus/${testerName}/source/transcript.md exists`);
    process.exit(1);
  }

  // Read transcript
  console.log(`\n📖 Reading transcript: ${transcriptPath}`);
  const transcript = fs.readFileSync(transcriptPath, 'utf-8');
  console.log(`   ${transcript.length} characters, ~${Math.round(transcript.length / 4)} tokens`);

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 1: Pattern Extraction
  // ═══════════════════════════════════════════════════════════════════════
  console.log(`\n🔍 Running pattern extraction...`);
  const extractionStart = Date.now();

  let extractionJson;
  try {
    const userContent = `Analyze this discovery conversation transcript and extract patterns:\n\n${transcript}`;
    const rawResponse = await callClaude(PATTERN_EXTRACTION_PROMPT, userContent, EXTRACTION_MAX_TOKENS, apiKey);

    // Parse JSON from response (handle potential markdown code blocks)
    let jsonStr = rawResponse.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    extractionJson = JSON.parse(jsonStr);
  } catch (err) {
    console.error(`❌ Extraction failed: ${err.message}`);
    process.exit(1);
  }

  const extractionMs = Date.now() - extractionStart;
  console.log(`   ✓ Completed in ${(extractionMs / 1000).toFixed(1)}s`);

  // Count extractions
  const counts = {
    tensions: extractionJson.tensions?.length || 0,
    repetitions: extractionJson.repetitions?.length || 0,
    structural_moves: extractionJson.structural_moves?.length || 0,
    unstated_implications: extractionJson.unstated_implications?.length || 0,
    contrasts: extractionJson.contrasts?.length || 0,
  };
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  console.log(`\n📊 Extraction Summary:`);
  console.log(`   Tensions: ${counts.tensions}`);
  console.log(`   Repetitions: ${counts.repetitions}`);
  console.log(`   Structural Moves: ${counts.structural_moves}`);
  console.log(`   Unstated Implications: ${counts.unstated_implications}`);
  console.log(`   Contrasts: ${counts.contrasts}`);
  console.log(`   ─────────────────`);
  console.log(`   Total: ${total} extractions`);

  // Add metadata
  const outputData = {
    metadata: {
      version: getNextVersion(outputDir, 'pattern-extraction').toString(),
      extraction_date: new Date().toISOString().split('T')[0],
      source: `test-corpus/${testerName}/source/transcript.md`,
      prompt_version: "specs/pattern-extraction-prompt-v0.2.md",
      model: MODEL,
      extraction_time_ms: extractionMs,
    },
    ...extractionJson,
  };

  // Save extraction
  const version = getNextVersion(outputDir, 'pattern-extraction');
  const extractionOutputPath = path.join(outputDir, `pattern-extraction-v${version}.json`);
  fs.writeFileSync(extractionOutputPath, JSON.stringify(outputData, null, 2));
  console.log(`\n💾 Saved: ${extractionOutputPath}`);

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 2: Synthesis with Extractions (optional)
  // ═══════════════════════════════════════════════════════════════════════
  if (runSynthesis) {
    console.log(`\n📝 Running synthesis with pattern extractions...`);
    console.log(`   (This would call the synthesis prompt with patternExtractions parameter)`);
    console.log(`   Not implemented yet - use the app or modify /api/synthesize for testing`);

    // TODO: Import synthesis prompt and run with extractions
    // This requires refactoring buildSynthesisUserContent to work standalone
    // For now, print instructions for manual testing

    console.log(`\n   To test synthesis integration:`);
    console.log(`   1. Start local dev server: cd components/lens-app && npm run dev`);
    console.log(`   2. Modify /api/synthesize/route.js to inject patternExtractions`);
    console.log(`   3. Run a discovery session through the app`);
  }

  console.log(`\n✅ Done\n`);
}

main().catch(err => {
  console.error(`\n❌ Fatal error: ${err.message}\n`);
  process.exit(1);
});
