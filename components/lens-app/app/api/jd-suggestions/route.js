// /api/jd-suggestions - Generate JD enhancement suggestions
// Identifies gaps between role requirements and what JD communicates
// Uses Haiku for fast, cost-effective generation (~$0.03 per call)

import Anthropic from "@anthropic-ai/sdk";
import { JD_SUGGESTIONS_SYSTEM_PROMPT, buildJdSuggestionsUserContent } from "../_prompts/jd-suggestions";

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 2500;
const TIMEOUT_MS = 40000;

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "Service temporarily unavailable" },
      { status: 500 }
    );
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const body = await request.json();
    const {
      jdText,
      matchData,
      candidateDimensions,
      roleDimensions,
      gaps,
    } = body;

    // Validate required inputs
    if (!jdText || typeof jdText !== "string") {
      return Response.json(
        { error: "Missing or invalid jdText" },
        { status: 400 }
      );
    }

    if (!roleDimensions) {
      return Response.json(
        { error: "Missing roleDimensions" },
        { status: 400 }
      );
    }

    // Check payload size (50KB limit for JD)
    if (jdText.length > 50000) {
      return Response.json(
        { error: "Job description too large (max 50KB)" },
        { status: 400 }
      );
    }

    console.log(`[JdSuggestions] Generating JD suggestions, JD length: ${jdText.length}`);

    // Build user content
    const userContent = buildJdSuggestionsUserContent({
      jdText,
      matchData,
      candidateDimensions,
      roleDimensions,
      gaps,
    });

    // Call Anthropic API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: JD_SUGGESTIONS_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
      }, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = response.content[0]?.text || "";
      console.log(`[JdSuggestions] Response length: ${responseText.length}`);

      // Parse JSON response
      let suggestions;
      try {
        let jsonText = responseText.trim();
        if (jsonText.startsWith("```json")) {
          jsonText = jsonText.slice(7);
        } else if (jsonText.startsWith("```")) {
          jsonText = jsonText.slice(3);
        }
        if (jsonText.endsWith("```")) {
          jsonText = jsonText.slice(0, -3);
        }
        jsonText = jsonText.trim();

        suggestions = JSON.parse(jsonText);
      } catch (parseErr) {
        console.error("[JdSuggestions] Failed to parse response as JSON:", parseErr.message);
        console.error("[JdSuggestions] Raw response:", responseText.slice(0, 500));
        return Response.json(
          { error: "Failed to generate valid JD suggestions" },
          { status: 502 }
        );
      }

      // Validate structure and provide defaults
      if (!Array.isArray(suggestions.suggestions)) {
        suggestions.suggestions = [];
      }

      if (typeof suggestions.alignment_notes !== 'string') {
        suggestions.alignment_notes = "";
      }

      // Validate each suggestion has required fields
      suggestions.suggestions = suggestions.suggestions.map(s => ({
        title: s.title || "Suggestion",
        role_requires: s.role_requires || "",
        jd_communicates: s.jd_communicates || "Not addressed",
        action: s.action || "",
        source_dimension: s.source_dimension || "unknown",
        priority: ["high", "medium", "low"].includes(s.priority) ? s.priority : "medium",
      }));

      // Sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      suggestions.suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

      return Response.json(suggestions);

    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        console.error("[JdSuggestions] Request timed out");
        return Response.json(
          { error: "Request timed out" },
          { status: 504 }
        );
      }

      throw error;
    }

  } catch (err) {
    console.error("JdSuggestions route error:", {
      name: err.name,
      message: err.message,
    });
    return Response.json(
      { error: "Failed to generate JD suggestions" },
      { status: 500 }
    );
  }
}
