// /api/get-session - Fetch session by record ID for recruiter comparison
// Returns status and score object for loaded candidates
// Build: 2026.04.30-recruiter-comparison-v2.0

const AIRTABLE_BASE_ID = "appFO5zLT7ZehXaBo";
const AIRTABLE_TABLE_ID = "tblNJ7gBSIlAEhstI"; // Lens Sessions

export async function GET(request) {
  const apiKey = process.env.AIRTABLE_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "Airtable API key not configured" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const recordId = searchParams.get("id");

  if (!recordId) {
    return Response.json(
      { error: "Missing required parameter: id" },
      { status: 400 }
    );
  }

  // Validate record ID format (Airtable record IDs start with "rec")
  if (!recordId.startsWith("rec") || recordId.length !== 17) {
    return Response.json(
      { error: "Invalid record ID format" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${recordId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return Response.json(
          { error: "Session not found" },
          { status: 404 }
        );
      }
      const errData = await response.json().catch(() => ({}));
      return Response.json(
        { error: errData?.error?.message || "Airtable API error" },
        { status: response.status }
      );
    }

    const record = await response.json();
    const fields = record.fields || {};

    // Determine status from Airtable Status field or score presence
    // Field IDs: fldlTNQY35AIGWuuS = Status, fldflcOeyef07v3dB = Final Synthesis MD
    // For now, we check for a score field - since none exists yet, we use synthesis as proxy

    let status = "awaiting";
    let score = null;
    let candidateName = fields["Name"] || null;

    // Check the Status field (singleSelect)
    const airtableStatus = fields["Status"];
    if (airtableStatus) {
      // Map Airtable status values to our status enum
      const statusLower = (typeof airtableStatus === "object"
        ? airtableStatus.name
        : airtableStatus
      )?.toLowerCase();

      if (statusLower === "complete" || statusLower === "completed") {
        status = "complete";
      } else if (statusLower === "in_progress" || statusLower === "in progress" || statusLower === "started") {
        status = "in_progress";
      } else {
        status = "awaiting";
      }
    }

    // Try to parse score from a dedicated Score field or synthesized data
    // Since there's no dedicated score field yet, check for Final Synthesis YAML
    // which might contain score data embedded
    const synthYaml = fields["Final Synthesis YAML"];
    const synthMd = fields["Final Synthesis MD"];

    // Future: when a Score JSON field is added, parse it here
    // For now, if we have synthesis data and status is complete, construct minimal score
    if (status === "complete" && (synthYaml || synthMd)) {
      // Placeholder: In production, the score would come from a dedicated field
      // or be extracted from the synthesis output
      score = {
        status: "complete",
        candidateName,
        synthesisAvailable: true,
        // Actual dimensions would be populated from real score data
      };
    }

    return Response.json({
      status,
      candidateName,
      score,
      recordId: record.id,
    });

  } catch (err) {
    console.error("[/api/get-session] Error:", err);
    return Response.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
