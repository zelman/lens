// /api/rc-session-create - Create shareable R→C session link
// Writes session config to Airtable, returns unique token + URL

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
};

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
    const { recruiterRoleContext, sessionConfig, recruiterName } = body;

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

    // Log payload size for budget tuning
    const roleContextStr = JSON.stringify(recruiterRoleContext);
    const sessionConfigStr = JSON.stringify(sessionConfig);
    const totalSize = roleContextStr.length + sessionConfigStr.length;
    console.log(`[rc-session-create] Payload size: ${totalSize} chars (roleContext: ${roleContextStr.length}, sessionConfig: ${sessionConfigStr.length})`);

    // Generate unique token
    const token = generateToken();

    // Calculate expiration (30 days from now)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Build Airtable record
    const record = {
      fields: {
        [FIELDS.sessionToken]: token,
        [FIELDS.recruiterRoleContext]: roleContextStr,
        [FIELDS.sessionConfig]: sessionConfigStr,
        [FIELDS.expiresAt]: expiresAt,
      },
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
    const origin = request.headers.get("origin") || request.headers.get("host") || "https://lens-app-five.vercel.app";
    const protocol = origin.startsWith("localhost") ? "http://" : "https://";
    const baseUrl = origin.startsWith("http") ? origin : `${protocol}${origin}`;
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
