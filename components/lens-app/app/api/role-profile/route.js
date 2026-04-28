// /api/role-profile - Generate role requirement profile from JD
// Outputs scores on the 6 C-lens dimensions for dual radar chart
// Uses Haiku for fast, cost-effective generation (~$0.01 per call)

import Anthropic from "@anthropic-ai/sdk";
import { ROLE_PROFILE_SYSTEM_PROMPT, buildRoleProfileUserContent } from "../_prompts/role-profile";

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 1500;
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
    const { jdText, roleTitle, companyName } = body;

    // Validate required input
    if (!jdText || typeof jdText !== "string") {
      return Response.json(
        { error: "Missing or invalid jdText" },
        { status: 400 }
      );
    }

    // Check payload size (50KB limit for JD text)
    if (jdText.length > 50000) {
      return Response.json(
        { error: "Job description too large (max 50KB)" },
        { status: 400 }
      );
    }

    console.log(`[RoleProfile] Generating role profile, JD length: ${jdText.length}`);

    // Build user content
    const userContent = buildRoleProfileUserContent({
      jdText,
      roleTitle,
      companyName,
    });

    // Call Anthropic API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: ROLE_PROFILE_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
      }, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = response.content[0]?.text || "";
      console.log(`[RoleProfile] Response length: ${responseText.length}`);

      // Parse JSON response
      let roleProfile;
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

        roleProfile = JSON.parse(jsonText);
      } catch (parseErr) {
        console.error("[RoleProfile] Failed to parse response as JSON:", parseErr.message);
        console.error("[RoleProfile] Raw response:", responseText.slice(0, 500));
        return Response.json(
          { error: "Failed to generate valid role profile" },
          { status: 502 }
        );
      }

      // Validate structure
      if (!roleProfile.dimension_scores) {
        console.error("[RoleProfile] Invalid response structure - missing dimension_scores");
        return Response.json(
          { error: "Invalid response structure" },
          { status: 502 }
        );
      }

      // Ensure all dimension scores are present and valid
      const requiredDimensions = [
        'essence_clarity',
        'skill_depth',
        'values_articulation',
        'mission_alignment',
        'work_style_clarity',
        'boundaries_defined'
      ];

      for (const dim of requiredDimensions) {
        if (typeof roleProfile.dimension_scores[dim] !== 'number') {
          roleProfile.dimension_scores[dim] = 50; // Default to middle if missing
        }
        // Clamp to valid range
        roleProfile.dimension_scores[dim] = Math.max(0, Math.min(100, roleProfile.dimension_scores[dim]));
      }

      // Ensure optional fields have valid defaults
      if (!Array.isArray(roleProfile.signature_requirements)) {
        roleProfile.signature_requirements = [];
      }
      if (!Array.isArray(roleProfile.flexibility_areas)) {
        roleProfile.flexibility_areas = [];
      }
      if (typeof roleProfile.role_archetype !== 'string') {
        roleProfile.role_archetype = 'Unclassified';
      }

      return Response.json(roleProfile);

    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        console.error("[RoleProfile] Request timed out");
        return Response.json(
          { error: "Request timed out" },
          { status: 504 }
        );
      }

      throw error;
    }

  } catch (err) {
    console.error("RoleProfile route error:", {
      name: err.name,
      message: err.message,
    });
    return Response.json(
      { error: "Failed to generate role profile" },
      { status: 500 }
    );
  }
}
