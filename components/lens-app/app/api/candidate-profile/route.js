// /api/candidate-profile - Generate candidate profile from resume
// Extracts 6-dimension C-lens scores from candidate materials
// Uses Haiku for fast, cost-effective generation (~$0.02 per call)

import Anthropic from "@anthropic-ai/sdk";
import { CANDIDATE_PROFILE_SYSTEM_PROMPT, buildCandidateProfileUserContent } from "../_prompts/candidate-profile";
import { validateDimensionScores, DIMENSION_KEYS } from "../../lib/dimensions";

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 2000;
const TIMEOUT_MS = 30000;

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
    const { resumeText, candidateName, supportingDocsText } = body;

    // Validate required inputs
    if (!resumeText || typeof resumeText !== "string") {
      return Response.json(
        { error: "Missing or invalid resumeText" },
        { status: 400 }
      );
    }

    // Check payload size (100KB limit for resume + docs)
    const totalSize = (resumeText?.length || 0) + (supportingDocsText?.length || 0);
    if (totalSize > 100000) {
      return Response.json(
        { error: "Candidate materials too large (max 100KB)" },
        { status: 400 }
      );
    }

    console.log(`[CandidateProfile] Generating profile for ${candidateName || "unnamed"}, resume: ${resumeText.length} chars`);

    // Build user content
    const userContent = buildCandidateProfileUserContent({
      resumeText,
      candidateName,
      supportingDocsText,
    });

    // Call Anthropic API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: CANDIDATE_PROFILE_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
      }, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = response.content[0]?.text || "";
      console.log(`[CandidateProfile] Response length: ${responseText.length}`);

      // Parse JSON response
      let candidateProfile;
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

        candidateProfile = JSON.parse(jsonText);
      } catch (parseErr) {
        console.error("[CandidateProfile] Failed to parse response as JSON:", parseErr.message);
        console.error("[CandidateProfile] Raw response:", responseText.slice(0, 500));
        return Response.json(
          { error: "Failed to generate valid candidate profile" },
          { status: 502 }
        );
      }

      // Validate structure
      if (!candidateProfile.dimension_scores) {
        console.error("[CandidateProfile] Invalid response structure - missing dimension_scores");
        return Response.json(
          { error: "Invalid candidate profile structure" },
          { status: 502 }
        );
      }

      // Validate and clamp dimension scores
      const requiredDimensions = DIMENSION_KEYS;
      for (const dim of requiredDimensions) {
        if (typeof candidateProfile.dimension_scores[dim] !== 'number') {
          candidateProfile.dimension_scores[dim] = 50; // Default to middle if missing
        }
        // Clamp to valid range
        candidateProfile.dimension_scores[dim] = Math.max(0, Math.min(100, candidateProfile.dimension_scores[dim]));
      }

      // Provide defaults for optional fields
      if (!candidateProfile.summary) {
        candidateProfile.summary = "";
      }
      if (!Array.isArray(candidateProfile.key_strengths)) {
        candidateProfile.key_strengths = [];
      }
      if (!Array.isArray(candidateProfile.growth_areas)) {
        candidateProfile.growth_areas = [];
      }
      if (!candidateProfile.career_stage) {
        candidateProfile.career_stage = "mid-career";
      }

      // Add candidate name to response
      candidateProfile.name = candidateName || "Candidate";

      return Response.json(candidateProfile);

    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        console.error("[CandidateProfile] Request timed out");
        return Response.json(
          { error: "Request timed out" },
          { status: 504 }
        );
      }

      throw error;
    }

  } catch (err) {
    console.error("CandidateProfile route error:", {
      name: err.name,
      message: err.message,
    });
    return Response.json(
      { error: "Failed to generate candidate profile" },
      { status: 500 }
    );
  }
}
