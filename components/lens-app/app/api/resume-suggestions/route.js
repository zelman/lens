// /api/resume-suggestions - Generate resume revision suggestions from lens + resume
// Uses haiku for fast, cost-effective generation

import Anthropic from "@anthropic-ai/sdk";
import { RESUME_SUGGESTIONS_SYSTEM_PROMPT, buildResumeSuggestionsUserContent } from "../_prompts/resume-suggestions";

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 3000;
const TIMEOUT_MS = 45000; // 45 seconds for potentially longer analysis

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
    const { lensMarkdown, resumeText, metadata } = body;

    // Validate required inputs
    if (!lensMarkdown || typeof lensMarkdown !== "string") {
      return Response.json(
        { error: "Missing or invalid lensMarkdown" },
        { status: 400 }
      );
    }

    if (!resumeText || typeof resumeText !== "string") {
      return Response.json(
        { error: "Missing or invalid resumeText" },
        { status: 400 }
      );
    }

    // Check payload size (100KB limit for this endpoint)
    const payloadSize = JSON.stringify(body).length;
    if (payloadSize > 100000) {
      return Response.json(
        { error: "Request too large" },
        { status: 400 }
      );
    }

    console.log(`[ResumeSuggestions] Generating suggestions, lens: ${lensMarkdown.length}, resume: ${resumeText.length}`);

    // Truncate resume if needed (keep first 15K chars)
    const MAX_RESUME_LENGTH = 15000;
    let truncatedResume = resumeText;
    if (resumeText.length > MAX_RESUME_LENGTH) {
      console.log(`[ResumeSuggestions] Truncating resume from ${resumeText.length} to ${MAX_RESUME_LENGTH}`);
      truncatedResume = resumeText.slice(0, MAX_RESUME_LENGTH) + "\n\n[content truncated]";
    }

    // Build user content
    const userContent = buildResumeSuggestionsUserContent({
      lensMarkdown,
      resumeText: truncatedResume,
      metadata,
    });

    // Call Anthropic API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: RESUME_SUGGESTIONS_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
      }, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = response.content[0]?.text || "";
      console.log(`[ResumeSuggestions] Response length: ${responseText.length}`);

      // Parse JSON response
      let suggestions;
      try {
        // Handle potential markdown code fence wrapping
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
        console.error("[ResumeSuggestions] Failed to parse response as JSON:", parseErr.message);
        console.error("[ResumeSuggestions] Raw response:", responseText.slice(0, 500));
        return Response.json(
          { error: "Failed to generate valid suggestions" },
          { status: 502 }
        );
      }

      // Validate structure
      if (!suggestions.suggestions || !Array.isArray(suggestions.suggestions)) {
        console.error("[ResumeSuggestions] Invalid response structure - missing suggestions array");
        return Response.json(
          { error: "Invalid response structure" },
          { status: 502 }
        );
      }

      // Sort by priority if not already sorted
      suggestions.suggestions.sort((a, b) => (a.priority || 5) - (b.priority || 5));

      return Response.json(suggestions);

    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        console.error("[ResumeSuggestions] Request timed out");
        return Response.json(
          { error: "Request timed out" },
          { status: 504 }
        );
      }

      throw error;
    }

  } catch (err) {
    console.error("ResumeSuggestions route error:", {
      name: err.name,
      message: err.message,
    });
    return Response.json(
      { error: "Failed to generate resume suggestions" },
      { status: 500 }
    );
  }
}
