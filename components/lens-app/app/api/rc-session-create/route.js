// /api/rc-session-create - Create shareable R→C session link(s)
// Writes session config to Airtable, returns unique token + URL per candidate
// Supports fan-out: one role context → N candidate sessions

const AIRTABLE_API_URL = "https://api.airtable.com/v0";
const BASE_ID = "appFO5zLT7ZehXaBo";
const TABLE_ID = "tbleGAd6aEFbDm5nK"; // R→C Sessions

// Field IDs for R→C Sessions table
const FIELDS = {
  sessionToken: "fldnuWc4FLYaPNvgU",
  recruiterRoleContext: "fldeWSKVOdDCd0Cfb",
  sessionConfig: "fldlaGMcV8jAzu99U",
  expiresAt: "fldaofxjXJVRw3TYt",
  claimedAt: "fldAYxjLyvPs24I1L",
  recruiterName: "fldIypcMRmtbUrGk8",
  // Candidate fan-out fields
  candidateName: "flddzuiohWbL8ew3p",
  candidateResume: "fldtcb8BLS7WynjiT",
  candidateEmail: "fldGCjvYTycxIRvgy",
  candidateSupportingDocs: "fld4xkxtIO7mnPm1U",
};

// Max chars for resume text (Airtable long text limit)
const MAX_RESUME_CHARS = 100000;

// URL-safe alphabet for token generation (no lookalikes: 0O1lI)
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";
const TOKEN_LENGTH = 10;

function generateToken() {
  let token = "";
  const array = new Uint8Array(TOKEN_LENGTH);
  crypto.getRandomValues(array);
  for (let i = 0; i < TOKEN_LENGTH; i++) {
    token += ALPHABET[array[i] % ALPHABET.length];
  }
  return token;
}

function truncateField(value, limit = MAX_RESUME_CHARS) {
  if (typeof value !== "string") return value;
  if (value.length <= limit) return value;
  return value.slice(0, limit - 50) + "\n\n[TRUNCATED - exceeded " + limit + " chars]";
}

export async function POST(request) {
  const apiKey = process.env.AIRTABLE_API_KEY;

  if (!apiKey) {
    console.error("[rc-session-create] Missing AIRTABLE_API_KEY");
    return Response.json(
      { error: "Service temporarily unavailable" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { recruiterRoleContext, sessionConfig, recruiterName, candidates } = body;

    // Validate required fields
    if (!recruiterRoleContext || typeof recruiterRoleContext !== "object") {
      return Response.json(
        { error: "Missing or invalid recruiterRoleContext" },
        { status: 400 }
      );
    }

    if (!sessionConfig || typeof sessionConfig !== "object") {
      return Response.json(
        { error: "Missing or invalid sessionConfig" },
        { status: 400 }
      );
    }

    // Serialize context objects
    const roleContextStr = JSON.stringify(recruiterRoleContext);
    const sessionConfigStr = JSON.stringify(sessionConfig);

    // Build base URL for shareable links
    const origin = request.headers.get("origin") || request.headers.get("host") || "https://lens-app-five.vercel.app";
    const protocol = origin.startsWith("localhost") ? "http://" : "https://";
    const baseUrl = origin.startsWith("http") ? origin : `${protocol}${origin}`;

    // Calculate expiration (30 days from now)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Apply truncation to large JSON fields
    const truncatedRoleContextStr = truncateField(roleContextStr);
    const truncatedSessionConfigStr = truncateField(sessionConfigStr);

    // ─────────────────────────────────────────────────────────────────
    // Fan-out path: candidates array provided with content
    // ─────────────────────────────────────────────────────────────────
    if (candidates && Array.isArray(candidates) && candidates.length > 0) {
      if (candidates.length > 50) {
        return Response.json(
          { error: "Maximum 50 candidates per batch" },
          { status: 400 }
        );
      }

      console.log(`[rc-session-create] Fan-out: creating ${candidates.length} sessions`);

      // Create records for each candidate
      const sessions = [];
      const errors = [];

      for (const candidate of candidates) {
        const token = generateToken();
        const candidateName = candidate.name || "Unnamed Candidate";

        const record = {
          fields: {
            [FIELDS.sessionToken]: token,
            [FIELDS.recruiterRoleContext]: truncatedRoleContextStr,
            [FIELDS.sessionConfig]: truncatedSessionConfigStr,
            [FIELDS.expiresAt]: expiresAt,
          },
          typecast: true,
        };

        // Add optional fields
        if (recruiterName && typeof recruiterName === "string") {
          record.fields[FIELDS.recruiterName] = recruiterName.slice(0, 100);
        }

        // Add candidate-specific fields
        if (candidateName) {
          record.fields[FIELDS.candidateName] = candidateName.slice(0, 200);
        }
        if (candidate.resumeText) {
          record.fields[FIELDS.candidateResume] = truncateField(candidate.resumeText);
        }
        if (candidate.email) {
          record.fields[FIELDS.candidateEmail] = candidate.email.slice(0, 200);
        }
        if (candidate.supportingDocsText) {
          record.fields[FIELDS.candidateSupportingDocs] = truncateField(candidate.supportingDocsText);
        }

        // Submit to Airtable
        try {
          const res = await fetch(`${AIRTABLE_API_URL}/${BASE_ID}/${TABLE_ID}`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(record),
          });

          if (!res.ok) {
            const errorBody = await res.text().catch(() => "unknown");
            console.error(`[rc-session-create] Airtable error for ${candidateName}:`, res.status, errorBody);
            errors.push({ candidateName, error: `Airtable error: ${res.status}` });
            continue;
          }

          const data = await res.json();
          console.log(`[rc-session-create] Created session ${token} for ${candidateName} (record: ${data.id})`);

          sessions.push({
            token,
            url: `${baseUrl}/recruiter/candidate?session=${token}`,
            candidateName,
          });
        } catch (err) {
          console.error(`[rc-session-create] Failed to create session for ${candidateName}:`, err);
          errors.push({ candidateName, error: err.message });
        }
      }

      // Return results
      if (sessions.length === 0) {
        return Response.json(
          { error: "Failed to create any sessions", errors },
          { status: 500 }
        );
      }

      return Response.json({
        sessions,
        errors: errors.length > 0 ? errors : undefined,
        expiresAt,
      });
    }

    // ─────────────────────────────────────────────────────────────────
    // Legacy path: no candidates array OR empty array (single-link mode)
    // ─────────────────────────────────────────────────────────────────
    console.log(`[rc-session-create] Legacy path: single session (no candidates)`);

    const totalSize = truncatedRoleContextStr.length + truncatedSessionConfigStr.length;
    console.log(`[rc-session-create] Payload size: ${totalSize} chars`);

    // Generate unique token
    const token = generateToken();

    // Build Airtable record - no candidate fields (candidate uploads own resume)
    const record = {
      fields: {
        [FIELDS.sessionToken]: token,
        [FIELDS.recruiterRoleContext]: truncatedRoleContextStr,
        [FIELDS.sessionConfig]: truncatedSessionConfigStr,
        [FIELDS.expiresAt]: expiresAt,
      },
      typecast: true,
    };

    // Add optional recruiter name
    if (recruiterName && typeof recruiterName === "string") {
      record.fields[FIELDS.recruiterName] = recruiterName.slice(0, 100);
    }

    // Submit to Airtable
    const res = await fetch(`${AIRTABLE_API_URL}/${BASE_ID}/${TABLE_ID}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(record),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "unknown");
      console.error("[rc-session-create] Airtable error:", res.status, errorBody);
      return Response.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    const data = await res.json();
    console.log(`[rc-session-create] Created session ${token} (record: ${data.id})`);

    // Build shareable URL
    const url = `${baseUrl}/recruiter/candidate?session=${token}`;

    return Response.json({
      token,
      url,
      expiresAt,
    });

  } catch (err) {
    console.error("[rc-session-create] Route error:", err);
    return Response.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
