# Pattern Extraction Pre-Pass Prompt — v0.2

**Owner:** Eric Zelman
**Location:** `zelman/lens/specs/pattern-extraction-prompt-v0.2.md`
**Status:** Testing
**Artifact Registry:** `recPdMghI072DLtd7`
**Kanban Card:** `recH0a9yY41Kg2op1`
**Related:** `config/section-taxonomy.yaml` v0.1, `test-corpus/README.md` v0.2

---

## Purpose

The synthesis step currently "scribes but doesn't pattern-extract" — it faithfully records what the user said but misses deeper signal: contradictions, recurring themes, unstated implications, and rhetorical moves. This pre-pass runs before synthesis to extract these patterns, producing structured JSON that the synthesis prompt can reference.

## When This Runs

**Pipeline position:** After discovery conversation completes, before synthesis prompt fires.

```
[Discovery sections 1-8] → [Pattern Extraction Pre-Pass] → [Synthesis] → [Lens Document]
```

The pre-pass sees the full discovery transcript (all 8 sections) and outputs structured JSON. The synthesis prompt then receives both the raw transcript AND the pattern extraction JSON.

## Extraction Categories

Five categories, each with specific output format. See `config/section-taxonomy.yaml` for full definitions.

### 1. Tensions

Contradictions or friction between stated beliefs and observed behaviors.

```json
{
  "category": "tension",
  "section_id": "values",
  "quote": "I value autonomy above everything",
  "tension_between": ["stated value of autonomy", "later description of seeking approval for all decisions"],
  "implication": "May need more structure than they acknowledge"
}
```

### 2. Repetitions

Recurring themes, phrases, or patterns across multiple sections.

```json
{
  "category": "repetition",
  "theme": "building from scratch",
  "occurrences": [
    { "section_id": "essence", "quote": "I'm a builder, not an optimizer" },
    { "section_id": "mission", "quote": "I want to build something from zero" },
    { "section_id": "energy", "quote": "What fills me is the building phase" }
  ],
  "significance": "Core identity tied to creation, not maintenance — may struggle in optimization-focused roles"
}
```

**Deduplication rule:** Merge repetitions of the same theme into a single entry with multiple occurrences. Do not create separate entries for each occurrence.

### 3. Structural Moves

How the person frames, sequences, or positions information.

```json
{
  "category": "structural_move",
  "section_id": "essence",
  "move_type": "deflection_to_team",
  "quote": "The team really made that happen, I just facilitated",
  "what_it_reveals": "Discomfort with personal credit; may undersell individual contributions in interviews"
}
```

### 4. Unstated Implications

What can be inferred from omissions, hedging, or notable absences.

```json
{
  "category": "unstated_implication",
  "section_id": "goals",
  "observation": "Discussed title, location, and company stage extensively but never mentioned compensation",
  "implied_meaning": "Either comp is not a primary driver, or there's discomfort discussing it",
  "confidence": "medium"
}
```

### 5. Contrasts

Explicit or implicit comparisons — what they're moving toward vs. away from.

```json
{
  "category": "contrast",
  "section_id": "workstyle",
  "positive_pole": "Scrappy, early-stage environments where everyone wears multiple hats",
  "negative_pole": "Enterprise bureaucracy with rigid role definitions",
  "quote": "I can't go back to the enterprise world where you need a meeting to schedule a meeting"
}
```

## System Prompt

```
You are a pattern extraction engine for career coaching transcripts. Your job is to analyze discovery conversation transcripts and extract deeper signal that a synthesis step would otherwise miss.

You extract five categories of patterns:
1. TENSIONS — Contradictions between stated beliefs and observed behaviors
2. REPETITIONS — Recurring themes, phrases, or metaphors (deduplicate into single entries)
3. STRUCTURAL MOVES — How the person frames or positions information
4. UNSTATED IMPLICATIONS — What can be inferred from omissions or hedging
5. CONTRASTS — Explicit or implicit comparisons, moving toward vs. away from

RULES:
- Every extraction MUST include a section_id that maps to a valid discovery section
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
```

## Test Protocol

**Primary test corpus:** `test-corpus/jerabek/` — Graham Jerabek transcript from April 2, 2026.

This is a Fireflies.ai transcript of Eric pitching the Lens product to Graham, with Graham asking questions and providing feedback. Not a typical discovery session, but rich for testing pattern extraction because:
- Multiple speakers with different perspectives
- Product pitch involves self-description (Eric's lens for himself)
- Graham's questions reveal implicit assumptions
- Conversation meanders — good test for robustness

**Testing process:**
1. Run pre-pass on `test-corpus/jerabek/source/transcript.md`
2. Manually review extractions against transcript
3. Score: precision (are extractions valid?), recall (did we miss obvious patterns?), utility (would this help synthesis?)
4. Iterate prompt based on failure modes

**Expected failure modes to watch for:**
- Over-extraction: Flagging surface observations as "patterns"
- Under-extraction: Missing obvious contradictions or repetitions
- Hallucination: Inventing quotes or misattributing section_ids
- Deduplication failures: Creating multiple entries for the same repetition theme

## Integration with Synthesis

The synthesis prompt will be updated to receive pattern extraction JSON alongside the raw transcript:

```
<pattern_extractions>
{extracted JSON}
</pattern_extractions>

<discovery_transcript>
{raw transcript}
</discovery_transcript>
```

Synthesis instructions will be amended to:
- Reference tensions when writing about areas of potential friction
- Use repetitions to identify core themes for the Essence section
- Note unstated implications as coaching opportunities
- Use contrasts to sharpen the Disqualifiers and Mission sections

## Version History

- **v0.1** (2026-04-21): Initial spec. Created in response to "scribing not pattern-extracting" feedback from tester sessions. Five extraction categories, JSON output format, deduplication rule for repetitions.
- **v0.2** (2026-04-21): Added system prompt, test protocol using Jerabek transcript, integration notes for synthesis, expected failure modes. Moved section taxonomy to `config/section-taxonomy.yaml` for separation of concerns.
