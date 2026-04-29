// /api/recruiter-brief - Generate single-page recruiter brief from lens + role context
// Primary R→C deliverable per Mike Toohey feedback
// Voice: recruiter-to-client, direct, specific, opinionated
// Output: Structured JSON for RecruiterBrief.jsx component

import Anthropic from "@anthropic-ai/sdk";
import {
  RECRUITER_BRIEF_SYSTEM_PROMPT,
  buildRecruiterBriefUserContent,
  parseRecruiterBriefResponse,
} from "../_prompts/recruiter-brief";

const MODEL = "claude-sonnet-4-6"; // Needs nuance and voice quality
const MAX_TOKENS = 3000;
const TIMEOUT_MS = 90000; // 90s - processing 17k+ char lens documents takes time

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
    const { lensMarkdown, metadata, roleContext, candidateProfile } = body;

    // Validate required fields
    if (!lensMarkdown || typeof lensMarkdown !== "string") {
      return Response.json(
        { error: "Missing or invalid lensMarkdown" },
        { status: 400 }
      );
    }

    if (!roleContext || !roleContext.title || !roleContext.company) {
      return Response.json(
        { error: "Missing roleContext (title and company required)" },
        { status: 400 }
      );
    }

    // Check payload size (50KB limit for brief generation)
    const payloadSize = JSON.stringify(body).length;
    if (payloadSize > 50000) {
      return Response.json(
        { error: "Request too large" },
        { status: 400 }
      );
    }

    console.log(`[Recruiter-Brief] Generating brief for ${roleContext.title} at ${roleContext.company}, payload: ${payloadSize} bytes`);

    // Build user content
    const userContent = buildRecruiterBriefUserContent({
      lensMarkdown,
      metadata: metadata || null,
      roleContext,
      candidateProfile: candidateProfile || null,
    });

    // Call Claude API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: RECRUITER_BRIEF_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
      }, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const rawResponse = response.content?.[0]?.text || "";

      if (!rawResponse) {
        console.error("[Recruiter-Brief] Empty response from AI");
        return Response.json(
          { error: "Empty response from AI" },
          { status: 500 }
        );
      }

      // Parse response
      const { error: parseError, brief } = parseRecruiterBriefResponse(rawResponse);

      if (parseError) {
        console.error("[Recruiter-Brief] Parse error:", parseError);
        console.error("[Recruiter-Brief] Raw response:", rawResponse.slice(0, 500));
        return Response.json(
          { error: `Failed to parse brief: ${parseError}` },
          { status: 500 }
        );
      }

      console.log(`[Recruiter-Brief] Brief generated successfully: ${brief.signal?.length || 0} signals, ${brief.roleFit?.openQuestions?.length || 0} questions`);

      return Response.json({ brief });

    } catch (err) {
      clearTimeout(timeoutId);

      if (err.name === "AbortError") {
        console.error("[Recruiter-Brief] Request timed out");
        return Response.json(
          { error: "Request timed out" },
          { status: 504 }
        );
      }

      throw err;
    }

  } catch (err) {
    console.error("[Recruiter-Brief] Route error:", {
      name: err.name,
      message: err.message,
      stack: err.stack?.split("\n").slice(0, 3).join(" | "),
    });
    return Response.json(
      { error: "Failed to generate recruiter brief" },
      { status: 500 }
    );
  }
}
