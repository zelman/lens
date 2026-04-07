// /api/session - Server-side proxy for session timing data
// Creates and updates Airtable records for timing/drop-off instrumentation

const BASE_ID = 'appFO5zLT7ZehXaBo';
const TABLE_ID = 'tblUAyulKOKXiRoOx';

export async function POST(request) {
  const token = process.env.AIRTABLE_TOKEN;

  if (!token) {
    return Response.json(
      { error: "Service temporarily unavailable" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { buildId } = body;

    // Create a new session record
    const fields = {
      'Session Started At': new Date().toISOString(),
      'Is Complete': false,
      'Last Section Visited': 0,
      'Build ID': buildId || 'unknown',
    };

    const response = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records: [{ fields }] }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('Airtable create error:', err);
      return Response.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const recordId = data.records?.[0]?.id;

    if (!recordId) {
      console.error('Airtable returned no record ID:', JSON.stringify(data));
      return Response.json(
        { error: 'Failed to create session - no record ID returned' },
        { status: 500 }
      );
    }

    return Response.json({ recordId });
  } catch (err) {
    console.error('Session create error:', err);
    return Response.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  const token = process.env.AIRTABLE_TOKEN;

  if (!token) {
    return Response.json(
      { error: "Service temporarily unavailable" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const {
      recordId,
      currentSection,
      sectionTimings,
      totalMessages,
      isComplete,
      abandoned,
      dropOffSection,
    } = body;

    // Validate recordId format (Airtable record IDs start with 'rec' + alphanumeric)
    if (!recordId || !/^rec[A-Za-z0-9]{10,20}$/.test(recordId)) {
      return Response.json(
        { error: 'Invalid recordId' },
        { status: 400 }
      );
    }

    // Reject conflicting flags
    if (isComplete && abandoned) {
      return Response.json(
        { error: 'Cannot set both isComplete and abandoned' },
        { status: 400 }
      );
    }

    // Build the fields to update
    const fields = {};

    if (currentSection !== undefined) {
      fields['Last Section Visited'] = currentSection;
    }

    // Validate sectionTimings is a plain object before processing
    if (sectionTimings && typeof sectionTimings === 'object' && !Array.isArray(sectionTimings)) {
      fields['Section Timings'] = JSON.stringify(sectionTimings);

      // Calculate total duration from section timings
      let totalDuration = 0;
      for (const timing of Object.values(sectionTimings)) {
        if (timing && typeof timing.duration === 'number' && isFinite(timing.duration)) {
          totalDuration += timing.duration;
        }
      }
      if (totalDuration > 0) {
        fields['Total Duration Sec'] = Math.round(totalDuration);
      }
    }

    if (totalMessages !== undefined) {
      fields['Total Messages'] = totalMessages;
    }

    if (isComplete) {
      fields['Is Complete'] = true;
      fields['Session Completed At'] = new Date().toISOString();
    }

    if (abandoned) {
      fields['Is Complete'] = false;
      if (dropOffSection !== undefined) {
        fields['Drop-off Section'] = dropOffSection;
      }
    }

    // Skip API call if no fields to update
    if (Object.keys(fields).length === 0) {
      return Response.json({ success: true });
    }

    const response = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}/${recordId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('Airtable update error:', err);
      return Response.json(
        { error: 'Failed to update session' },
        { status: 500 }
      );
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('Session update error:', err);
    return Response.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}
