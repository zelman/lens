// /api/log-session - Server-side proxy for session telemetry
// Writes session data to Airtable, captures IP server-side

const AIRTABLE_API_URL = "https://api.airtable.com/v0";
const BASE_ID = "appFO5zLT7ZehXaBo";
const TABLE_ID = "tblNJ7gBSIlAEhstI";

// Field ID mapping for Lens Sessions table
const FIELDS = {
  sessionId: "fldYT3MDxeDQ2GJV2",
  name: "fldVg8gl4G0Z5qITb",
  buildVersion: "fldHE0F4xQ8WtwUOr",
  userAgent: "fldlnKoL5wvZKqPuW",
  ipAddress: "fldMk2OBUopTLrlvk",
  sessionStart: "fldb58CbZm6rIAplU",
  sessionEnd: "fldzvz6kdYaBvjYm9",
  totalDuration: "fldsLPxXXw0VqNabL",
  status: "fldlTNQY35AIGWuuS",
  abandonmentPhase: "fldSMV4Non9AvWfpG",
  abandonmentSection: "fldWtOuoKRc9swclp",
  materialsStart: "fldp9tdhkHYYeDE0k",
  materialsEnd: "fldcoNs4xSz7oCqXr",
  statusStart: "fldNyWoHWPU3HqP8I",
  statusEnd: "fldCTKrblED5isRMX",
  contextStart: "fldqQrrDqfOJmM18f",
  contextEnd: "fld6PBNgspg65TQbZ",
  discoveryStart: "fldSZbThJGQkYEiAY",
  discoveryEnd: "fldziv9BjASmPrFkV",
  synthesisStart: "fldZAhcv5FyBWYIAC",
  synthesisEnd: "fldNhAG9XVWvXM3rf",
  fileCount: "fldVFPMdEPhtLpV30",
  preTruncationTotalChars: "fld39uxIfQ6PS7Vqp",
  totalExtractedChars: "fldsG4ojVnL4bBrt0",
  charsTruncated: "fldrHjkFxI6L6Shla",
  contentBudgetApplied: "fldtS06qbKZvH6NBW",
  fileBreakdown: "fldCaRoZrxUoFrakw",
  discoverySectionTiming: "fldvEaccNncp1Njdx",
  reflectionResult: "fldBZdIZIdn1mtQ9Z",
  apiErrors: "fldnlTUhKJqot6A0T",
};

export async function POST(request) {
  const apiKey = process.env.AIRTABLE_API_KEY;

  if (!apiKey) {
    console.error("[log-session] Missing AIRTABLE_API_KEY");
    return Response.json({ error: "Service unavailable" }, { status: 500 });
  }

  try {
    const body = await request.json();

    // Capture IP address from request headers (server-side only)
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ipAddress = forwarded?.split(",")[0]?.trim() || realIp || "unknown";

    // Build Airtable record fields
    const fields = {};

    // Session Identity
    if (body.sessionId) fields[FIELDS.sessionId] = body.sessionId;
    if (body.name) fields[FIELDS.name] = body.name;
    if (body.buildVersion) fields[FIELDS.buildVersion] = body.buildVersion;
    if (body.userAgent) fields[FIELDS.userAgent] = body.userAgent?.slice(0, 500); // Truncate long UAs
    fields[FIELDS.ipAddress] = ipAddress;

    // Session Lifecycle
    if (body.sessionStart) fields[FIELDS.sessionStart] = body.sessionStart;
    if (body.sessionEnd) fields[FIELDS.sessionEnd] = body.sessionEnd;
    if (typeof body.totalDuration === "number") fields[FIELDS.totalDuration] = Math.round(body.totalDuration);
    if (body.status) fields[FIELDS.status] = body.status;
    if (body.abandonmentPhase) fields[FIELDS.abandonmentPhase] = body.abandonmentPhase;
    if (typeof body.abandonmentSection === "number") fields[FIELDS.abandonmentSection] = body.abandonmentSection;

    // Phase Timestamps
    if (body.materialsStart) fields[FIELDS.materialsStart] = body.materialsStart;
    if (body.materialsEnd) fields[FIELDS.materialsEnd] = body.materialsEnd;
    if (body.statusStart) fields[FIELDS.statusStart] = body.statusStart;
    if (body.statusEnd) fields[FIELDS.statusEnd] = body.statusEnd;
    if (body.contextStart) fields[FIELDS.contextStart] = body.contextStart;
    if (body.contextEnd) fields[FIELDS.contextEnd] = body.contextEnd;
    if (body.discoveryStart) fields[FIELDS.discoveryStart] = body.discoveryStart;
    if (body.discoveryEnd) fields[FIELDS.discoveryEnd] = body.discoveryEnd;
    if (body.synthesisStart) fields[FIELDS.synthesisStart] = body.synthesisStart;
    if (body.synthesisEnd) fields[FIELDS.synthesisEnd] = body.synthesisEnd;

    // File Upload Metrics
    if (typeof body.fileCount === "number") fields[FIELDS.fileCount] = body.fileCount;
    if (typeof body.preTruncationTotalChars === "number") fields[FIELDS.preTruncationTotalChars] = body.preTruncationTotalChars;
    if (typeof body.totalExtractedChars === "number") fields[FIELDS.totalExtractedChars] = body.totalExtractedChars;
    if (typeof body.charsTruncated === "number") fields[FIELDS.charsTruncated] = body.charsTruncated;
    if (typeof body.contentBudgetApplied === "boolean") fields[FIELDS.contentBudgetApplied] = body.contentBudgetApplied;
    if (body.fileBreakdown) fields[FIELDS.fileBreakdown] = typeof body.fileBreakdown === "string"
      ? body.fileBreakdown
      : JSON.stringify(body.fileBreakdown);

    // Discovery Section Timing
    if (body.discoverySectionTiming) fields[FIELDS.discoverySectionTiming] = typeof body.discoverySectionTiming === "string"
      ? body.discoverySectionTiming
      : JSON.stringify(body.discoverySectionTiming);

    // Error Tracking
    if (body.reflectionResult) fields[FIELDS.reflectionResult] = body.reflectionResult;
    if (body.apiErrors) fields[FIELDS.apiErrors] = typeof body.apiErrors === "string"
      ? body.apiErrors
      : JSON.stringify(body.apiErrors);

    // Write to Airtable
    const res = await fetch(`${AIRTABLE_API_URL}/${BASE_ID}/${TABLE_ID}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: [{ fields }],
        typecast: true,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      console.error("[log-session] Airtable error:", res.status, errorText);
      return Response.json({ error: "Failed to log session" }, { status: 502 });
    }

    const data = await res.json();
    return Response.json({ success: true, recordId: data.records?.[0]?.id });

  } catch (err) {
    console.error("[log-session] Error:", err);
    return Response.json({ error: "Failed to log session" }, { status: 500 });
  }
}
