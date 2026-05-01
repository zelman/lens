// /api/extract-dimensions - Extract role-specific dimensions from recruiter context
// Server-side only - system prompt never exposed to client
// Uses streaming to avoid Vercel timeout limits

import {
  EXTRACT_DIMENSIONS_SYSTEM_PROMPT,
  buildDimensionExtractionContent,
} from "../_prompts/extract-dimensions";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 4000;
// Note: temperature param removed — deprecated in Claude 4.5+ models

// ═══════════════════════════════════════════════════════════════════════════
// JSON REPAIR HELPERS (ported from generate-session)
// ═══════════════════════════════════════════════════════════════════════════

// Helper: Try to find a valid JSON substring by progressively truncating
function findLastValidJson(text) {
  const closingPositions = [];
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) closingPositions.push(i + 1);
    }
  }

  for (let i = closingPositions.length - 1; i >= 0; i--) {
    const candidate = text.slice(0, closingPositions[i]);
    try {
      JSON.parse(candidate);
      return candidate;
    } catch {
      continue;
    }
  }
  return null;
}

// Helper: Escape unescaped newlines/tabs inside JSON strings
function escapeNewlinesInStrings(text) {
  let result = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      result += char;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }

    if (inString) {
      if (char === '\n') { result += '\\n'; continue; }
      if (char === '\r') { result += '\\r'; continue; }
      if (char === '\t') { result += '\\t'; continue; }
    }

    result += char;
  }

  return result;
}

// Helper: Parse JSON with multiple repair attempts
function parseJsonWithRepairs(fullText) {
  let cleanText = fullText
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  // Extract just the JSON object if there's text before/after
  const jsonStart = cleanText.indexOf('{');
  const jsonEnd = cleanText.lastIndexOf('}');
  if (jsonStart > 0 || (jsonEnd > 0 && jsonEnd < cleanText.length - 1)) {
    cleanText = cleanText.slice(jsonStart, jsonEnd + 1);
  }

  // Attempt 1: Direct parse
  try {
    return { result: JSON.parse(cleanText), error: null };
  } catch (err1) {
    console.log("[extract-dimensions] Direct parse failed:", err1.message);
  }

  // Attempt 2: Fix broken strings where model forgot closing quote
  let brokenStringFixed = cleanText.replace(
    /([^\\])\n(\s*)"([a-zA-Z_][a-zA-Z0-9_]*)"\s*:/g,
    (match, lastChar, whitespace, fieldName) => {
      if (/[a-zA-Z0-9.,;:!?\-'")}\]]/.test(lastChar)) {
        return `${lastChar}",\n${whitespace}"${fieldName}":`;
      }
      return match;
    }
  );

  if (brokenStringFixed !== cleanText) {
    try {
      return { result: JSON.parse(brokenStringFixed), error: null };
    } catch (err2) {
      console.log("[extract-dimensions] Broken string fix failed");
    }
  }

  // Attempt 3: Escape unescaped newlines in strings
  const escapedText = escapeNewlinesInStrings(brokenStringFixed);
  if (escapedText !== brokenStringFixed) {
    try {
      return { result: JSON.parse(escapedText), error: null };
    } catch (err3) {
      console.log("[extract-dimensions] Newline escape failed");
    }
  }

  // Attempt 4: Basic repairs (control chars, trailing commas)
  let repairedText = escapedText
    .replace(/[\x00-\x1F\x7F]/g, (char) => {
      if (char === '\n' || char === '\r' || char === '\t') return ' ';
      return '';
    })
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']');

  try {
    return { result: JSON.parse(repairedText), error: null };
  } catch (err4) {
    console.log("[extract-dimensions] Basic repair failed");
  }

  // Attempt 5: Find longest valid JSON prefix
  const truncated = findLastValidJson(repairedText);
  if (truncated) {
    try {
      return { result: JSON.parse(truncated), error: null };
    } catch (err5) {
      console.log("[extract-dimensions] Truncation repair failed");
    }
  }

  // All repairs failed
  console.error("[extract-dimensions] All JSON repair attempts failed");
  console.error("[extract-dimensions] Raw response (first 500):", fullText.slice(0, 500));
  console.error("[extract-dimensions] Raw response (last 200):", fullText.slice(-200));

  return { result: null, error: "JSON parse failed after all repair attempts" };
}

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error("[extract-dimensions] Missing ANTHROPIC_API_KEY");
    return Response.json(
      { error: "Service temporarily unavailable" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { roleContext } = body;

    // Validate role context
    if (!roleContext || typeof roleContext !== "object") {
      return Response.json(
        { error: "Missing or invalid roleContext" },
        { status: 400 }
      );
    }

    // Check minimum required fields
    if (!roleContext.roleTitle || !roleContext.company) {
      return Response.json(
        { error: "Role title and company are required" },
        { status: 400 }
      );
    }

    // Check payload size (100KB limit for dimension extraction)
    const payloadSize = JSON.stringify(body).length;
    if (payloadSize > 100000) {
      console.log(`[extract-dimensions] Payload rejected: ${payloadSize} bytes exceeds 100KB limit`);
      return Response.json(
        { error: "Request too large" },
        { status: 400 }
      );
    }

    // Build user content from role context
    const userContent = buildDimensionExtractionContent(roleContext);
    console.log(`[extract-dimensions] User content length: ${userContent.length} chars`);

    // Call Anthropic API with streaming to avoid Vercel timeout
    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        stream: true, // Enable streaming
        system: EXTRACT_DIMENSIONS_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent + "\n\nRespond with ONLY valid JSON. Start with { and end with }. No markdown, no backticks, no explanation." }],
      }),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      console.error("[extract-dimensions] Anthropic API error:", res.status, errorText);
      return Response.json(
        { error: "AI service temporarily unavailable" },
        { status: 503 }
      );
    }

    // Process streaming response and collect full text
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let stopReason = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);

            if (parsed.type === "content_block_delta" && parsed.delta?.text) {
              fullText += parsed.delta.text;
            } else if (parsed.type === "message_delta" && parsed.delta?.stop_reason) {
              stopReason = parsed.delta.stop_reason;
            }
          } catch (e) {
            // Skip non-JSON lines
          }
        }
      }
    }

    console.log("[extract-dimensions] Stop reason:", stopReason);
    console.log("[extract-dimensions] Response length:", fullText.length);

    if (!fullText) {
      console.error("[extract-dimensions] Empty response from AI");
      return Response.json(
        { error: "Empty response from AI" },
        { status: 500 }
      );
    }

    // Check if response was truncated
    if (stopReason === "max_tokens") {
      console.error("[extract-dimensions] Response truncated - max_tokens reached");
      return Response.json(
        { error: "Dimension extraction truncated. Please try again with fewer documents." },
        { status: 500 }
      );
    }

    // Parse JSON response with robust repair attempts
    const { result: dimensionResult, error: parseError } = parseJsonWithRepairs(fullText);

    if (!dimensionResult) {
      // Return fallback dimensions when parsing fails
      console.error("[extract-dimensions] Returning fallback dimensions due to:", parseError);
      return Response.json({
        roleContext: {
          summary: `${roleContext.roleTitle} at ${roleContext.company}`,
          roleTitle: roleContext.roleTitle,
          company: roleContext.company,
        },
        dimensions: [
          {
            id: "role_fit",
            label: "Role Fit",
            importance: "critical",
            durationMin: 7,
            sources: ["Role title"],
            whatToExplore: "How well does the candidate's experience align with this role's core responsibilities?",
            signals: ["Relevant experience", "Clear understanding of the role"],
            redFlags: ["Misaligned expectations", "Lack of relevant context"],
          },
          {
            id: "leadership_style",
            label: "Leadership Style",
            importance: "high",
            durationMin: 5,
            sources: ["General"],
            whatToExplore: "How does the candidate lead and influence others?",
            signals: ["Clear leadership philosophy", "Concrete examples"],
            redFlags: ["Vague answers", "No concrete examples"],
          },
          {
            id: "culture_alignment",
            label: "Culture Alignment",
            importance: "high",
            durationMin: 5,
            sources: ["General"],
            whatToExplore: "Will this person thrive in this company's environment?",
            signals: ["Values alignment", "Work style compatibility"],
            redFlags: ["Mismatched expectations", "Red flags about past environments"],
          },
          {
            id: "motivation",
            label: "Motivation & Timing",
            importance: "moderate",
            durationMin: 4,
            sources: ["General"],
            whatToExplore: "Why is this person interested and what's their timeline?",
            signals: ["Clear motivation", "Reasonable timeline"],
            redFlags: ["Unclear motivation", "Unrealistic expectations"],
          },
        ],
        foundationOverlaps: {
          essence: null,
          workstyle: null,
          energy: "motivation",
          disqualifiers: null,
          situation: "motivation",
          values: null,
        },
        contextQuality: "thin",
        contextWarning: "Unable to parse AI response. Using fallback dimensions. Add more context (documents, detailed objectives) for better results.",
      });
    }

    // Validate dimension count
    if (!dimensionResult.dimensions || dimensionResult.dimensions.length < 4) {
      console.warn("[extract-dimensions] Too few dimensions returned:", dimensionResult.dimensions?.length);
    }

    // Ensure we have the required structure
    if (!dimensionResult.roleContext) {
      dimensionResult.roleContext = {
        summary: `${roleContext.roleTitle} at ${roleContext.company}`,
        roleTitle: roleContext.roleTitle,
        company: roleContext.company,
      };
    }

    if (!dimensionResult.foundationOverlaps) {
      dimensionResult.foundationOverlaps = {
        essence: null,
        workstyle: null,
        energy: null,
        disqualifiers: null,
        situation: null,
        values: null,
      };
    }

    return Response.json(dimensionResult);

  } catch (err) {
    console.error("[extract-dimensions] Error:", err);
    return Response.json(
      { error: "Failed to extract dimensions" },
      { status: 500 }
    );
  }
}
