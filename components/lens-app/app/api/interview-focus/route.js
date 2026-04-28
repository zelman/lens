// /api/interview-focus - Generate interview focus areas from match data
// Groups into: Explore (gaps), Validate (strengths), Watch (risks)
// Uses Haiku for fast, cost-effective generation (~$0.02 per call)

import Anthropic from "@anthropic-ai/sdk";
import { INTERVIEW_FOCUS_SYSTEM_PROMPT, buildInterviewFocusUserContent } from "../_prompts/interview-focus";

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 2000;
const TIMEOUT_MS = 35000;

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
      matchData,
      candidateDimensions,
      roleDimensions,
      gaps,
      redFlags,
      strengths,
    } = body;

    // Validate required inputs
    if (!candidateDimensions || !roleDimensions) {
      return Response.json(
        { error: "Missing candidateDimensions or roleDimensions" },
        { status: 400 }
      );
    }

    console.log(`[InterviewFocus] Generating interview focus areas`);

    // Build user content
    const userContent = buildInterviewFocusUserContent({
      matchData,
      candidateDimensions,
      roleDimensions,
      gaps,
      redFlags,
      strengths,
    });

    // Call Anthropic API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: INTERVIEW_FOCUS_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
      }, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = response.content[0]?.text || "";
      console.log(`[InterviewFocus] Response length: ${responseText.length}`);

      // Parse JSON response
      let focusAreas;
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

        focusAreas = JSON.parse(jsonText);
      } catch (parseErr) {
        console.error("[InterviewFocus] Failed to parse response as JSON:", parseErr.message);
        console.error("[InterviewFocus] Raw response:", responseText.slice(0, 500));
        return Response.json(
          { error: "Failed to generate valid interview focus areas" },
          { status: 502 }
        );
      }

      // Validate structure and provide defaults
      if (!Array.isArray(focusAreas.explore)) {
        focusAreas.explore = [];
      }
      if (!Array.isArray(focusAreas.validate)) {
        focusAreas.validate = [];
      }
      if (!Array.isArray(focusAreas.watch)) {
        focusAreas.watch = [];
      }

      // Validate each item has required fields
      const validateItem = (item) => ({
        title: item.title || "Focus area",
        question: item.question || "",
        context: item.context || "",
        source_dimension: item.source_dimension || "unknown",
      });

      focusAreas.explore = focusAreas.explore.map(validateItem);
      focusAreas.validate = focusAreas.validate.map(validateItem);
      focusAreas.watch = focusAreas.watch.map(validateItem);

      return Response.json(focusAreas);

    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        console.error("[InterviewFocus] Request timed out");
        return Response.json(
          { error: "Request timed out" },
          { status: 504 }
        );
      }

      throw error;
    }

  } catch (err) {
    console.error("InterviewFocus route error:", {
      name: err.name,
      message: err.message,
    });
    return Response.json(
      { error: "Failed to generate interview focus areas" },
      { status: 500 }
    );
  }
}
