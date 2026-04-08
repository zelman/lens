# Media Intake: Audio & Video Support for Lens Discovery

**Version:** 1.0  
**Status:** Draft — for future consideration  
**Date:** April 8, 2026  
**Author:** Eric Zelman  
**Repo:** `zelman/lens` → `specs/lens-media-intake-spec-v1.0.md`

---

## Summary

Add audio and video file upload to the Lens intake form's context upload phase. Recordings — coaching sessions, self-reflections, presentations, performance conversations — contain identity signals that are difficult to capture through written documents alone. Spoken language reveals priorities, emotional weight, and self-concept in ways resumes and writing samples cannot.

The core constraint: media must be transcribed and processed *before* the discovery conversation begins, because the discovery AI needs this context to avoid redundant questions and to probe signals the user has already surfaced.

---

## Motivation

The current intake form accepts five categories of written context: resume, LinkedIn PDF, writing samples, assessments/frameworks, and freeform uploads. All are text-extractable at API call time with near-zero latency.

Audio and video introduce the richest signal type available — natural spoken language in conversational or reflective contexts — but they require a processing step (transcription + signal extraction) that written documents do not.

### What kinds of recordings are useful?

| Recording type | Signal value | Typical length | Example |
|---|---|---|---|
| Coaching session | Very high — coach-facilitated self-reflection surfaces identity patterns, values conflicts, energy sources | 30–60 min | James Pratt sessions with Eric |
| Self-recorded reflection | High — unfiltered thinking about career direction, what matters, what's missing | 5–20 min | Voice memo after a bad day at work |
| Presentation or talk | Medium — reveals communication style, what topics the person gravitates toward, how they frame problems | 15–45 min | Conference talk, team all-hands |
| Performance review conversation | Medium-high — reveals how others perceive the person, gaps between self-concept and external perception | 30–60 min | Annual review recording |
| Interview (practice or real) | Medium — reveals positioning instincts, what the person emphasizes under pressure | 20–45 min | Mock interview with a friend |

### Why this matters for discovery quality

A user who uploads a coaching session recording where they said "I realized I don't actually want to manage people — I want to build systems that make people better at their jobs" gives the discovery AI a much stronger starting signal than a resume bullet that says "managed team of 12." The discovery conversation can skip surface-level questions and go deeper, faster.

---

## User Experience Design

### Current flow

```
Phase 1: Intro ("Build your lens")
Phase 2: Context Upload (5 categories)
Phase 3: Status Selection
Phase 4: Discovery (Claude API conversation)
```

### Proposed flow

```
Phase 1: Intro ("Build your lens")
  └─ NEW: Media upload prompt at bottom of intro
     "Have recordings? Upload them now — we'll process them while you continue."
Phase 2: Context Upload (5 existing categories + 1 new)
  └─ NEW: Category 6 — "Recordings"
Phase 3: Status Selection
  └─ Processing gate (if media still processing, show status; block discovery start)
Phase 4: Discovery (Claude API conversation, now with transcript context)
```

### UX strategy: upload early, process in background

The key insight is that transcription takes real time (30–90 seconds per 30 minutes of audio), but the user spends 2–5 minutes reading the intro, uploading text documents, and selecting status. If media upload is prompted early — at the bottom of the intro phase or the top of the context upload phase — processing can happen in parallel with the user's existing workflow.

**Three states to design for:**

1. **Happy path (most common):** User uploads 1–2 recordings during intro/upload phases. By the time they reach Discovery, transcription is complete. No waiting.

2. **Still processing:** User moves quickly or uploads long/many recordings. At the Discovery gate, show: "Still processing your recordings — almost done" with a progress indicator. Estimated time remaining if available from the transcription API.

3. **No media uploaded:** Flow is identical to today. No changes.

### Upload category: "Recordings"

**Position:** 6th category in Phase 2, after "Anything else"

**Accepted formats:** MP3, M4A, WAV, OGG, FLAC, MP4, MOV, WEBM

**Guidance copy (draft):**
> Coaching sessions, self-reflections, presentations, interviews — any recording where you're thinking out loud about your career, your strengths, or what you want next. These are often the richest signals we can work with.
>
> We'll transcribe the audio and use it as context during your discovery conversation. The recording itself is not stored — only the transcript.

**File constraints:**
- Max file size: 500 MB per file (covers ~60 min of video)
- Max total media: 1 GB across all recordings
- Max files: 5 recordings

**Upload UX:**
- Drag-and-drop or file picker (consistent with existing categories)
- Per-file progress bar during upload
- Per-file processing status after upload: Uploading → Processing → Ready ✓
- If a file fails processing, show: "We couldn't process this recording. It may be corrupted or in an unsupported format." Allow retry or removal.

### Privacy disclosure (critical)

Audio/video raises the privacy bar significantly. The existing privacy disclosure (added from tester feedback) needs to be extended for media:

**Additional disclosure for media uploads:**
> Your recordings are sent to a transcription service for processing. Only the text transcript is retained — the original audio/video file is deleted after transcription completes. The transcript is used as context during your discovery conversation and is included in your lens document's source materials. No recordings are stored permanently.

This disclosure should appear:
1. In the intro phase, near the early media upload prompt
2. In the Recordings upload category description
3. In the general privacy/data handling document (P2, already planned)

### Session persistence implications

Current behavior: file metadata is saved to localStorage, but binary files need re-upload on return. For media files, this is a much bigger problem — re-uploading a 300MB video is a significant ask.

**Recommendation:** Store completed transcripts server-side (or in localStorage if small enough). On session return, the transcript is available even though the original recording is gone. The "if you close the tab" notice should say:

> Your recordings don't need to be re-uploaded — we've already processed them and saved the transcripts.

This requires the session persistence spec (branch `feature/session-persistence`) to account for transcript storage, either as a localStorage blob or via a lightweight server-side session store.

---

## Technical Architecture

### Processing pipeline

```
User uploads media file
  → Client: Extract audio from video (if video) via browser-side FFmpeg.wasm
  → Client: Upload audio to /api/transcribe (new serverless route)
  → Server: Send to transcription API (AssemblyAI recommended)
  → Server: Receive transcript with speaker diarization
  → Server: Run signal extraction pass (Claude API — summarize identity-relevant content)
  → Server: Return structured transcript + extracted signals to client
  → Client: Store transcript in session state
  → Client: Include transcript context in discovery API calls
```

### New serverless route: `/api/transcribe`

Fits within the existing serverless proxy architecture (spec: `lens-serverless-proxy-architecture-v1.0.md`).

**Request:**
```json
{
  "audio": "<base64-encoded audio or multipart upload>",
  "format": "mp3",
  "options": {
    "speaker_diarization": true,
    "language": "en"
  }
}
```

**Response:**
```json
{
  "status": "complete",
  "transcript": {
    "full_text": "...",
    "segments": [
      {
        "speaker": "Speaker 1",
        "start": 0.0,
        "end": 12.4,
        "text": "So when I think about what I actually want..."
      }
    ],
    "duration_seconds": 1847,
    "word_count": 6230
  },
  "signals": {
    "summary": "User discussed frustration with people management and desire to build systems...",
    "identity_markers": [
      "Expressed strong preference for systems-building over people-management",
      "Named anxiety about career transition timeline",
      "Referenced 'buoy identity' pattern — staying predictable for family stability"
    ],
    "relevant_sections": ["essence", "values", "work_style", "what_fills_you"]
  }
}
```

The `signals` object is produced by a Claude API call that takes the raw transcript and extracts identity-relevant content, mapped to the 8 discovery sections. This condensed version is what gets injected into the discovery conversation — not the full transcript (which could be 5,000–7,000 words for a 30-minute recording).

### Transcription provider comparison

| Provider | Cost/min | Diarization | Max file | Latency (30 min file) | Notes |
|---|---|---|---|---|---|
| AssemblyAI | ~$0.01 | Built-in, high quality | 5 GB | 30–60 sec | Best for conversational audio. Recommended. |
| Deepgram | ~$0.0043 | Available | 2 GB | 15–30 sec | Fastest. Good for scale. |
| OpenAI Whisper API | ~$0.006 | Not built-in | 25 MB | 30–90 sec | File size limit requires chunking. |
| Whisper (self-hosted) | Compute cost | Via pyannote | Unlimited | Variable | Full control. Complex to deploy. |

**Recommendation:** AssemblyAI for the initial build. Speaker diarization quality matters — coaching sessions where you can distinguish coach vs. client produce far richer signals. Deepgram as fallback/scale option.

### Cost model

| Scenario | Recordings | Total minutes | Transcription cost | Signal extraction (Claude) | Total |
|---|---|---|---|---|---|
| Light user | 1 short reflection | 10 min | $0.10 | ~$0.02 | ~$0.12 |
| Typical user | 2 coaching sessions | 60 min | $0.60 | ~$0.06 | ~$0.66 |
| Heavy user | 3 sessions + 2 reflections | 120 min | $1.20 | ~$0.10 | ~$1.30 |

At current tester volumes this is negligible. At scale (1,000 users/month, average 60 min), transcription adds ~$600/month. Worth tracking in the financial model but not a blocker.

### Video handling

For video files (MP4, MOV, WEBM):
- Extract audio track only — visual content (slides, body language) is not processed in v1
- Use FFmpeg.wasm in the browser for client-side extraction before upload, reducing upload size by 80–90%
- If FFmpeg.wasm is too heavy for the client bundle, extract server-side via FFmpeg in the serverless function

Rationale: a presentation's slides are better uploaded as a PDF. Body language analysis is a future consideration, not v1 scope.

### Context window management

A single 30-minute transcript is ~5,000–7,000 words (~6,000–8,000 tokens). Multiple recordings could push 20,000+ tokens of transcript context, competing with resume, LinkedIn, writing samples, and the discovery conversation itself for context window space.

**Mitigation: two-pass processing**

1. **Pass 1 — Transcribe:** Raw transcript with diarization (stored in full for session persistence)
2. **Pass 2 — Extract signals:** Claude API call condenses the transcript to 500–1,000 words of identity-relevant observations, tagged by discovery section. This condensed version is what enters the discovery context.

The full transcript is available if the discovery AI needs to drill into a specific moment ("You mentioned a turning point in your second coaching session — can you tell me more about that?"), but the default context load is the condensed signals.

### Integration with discovery system prompts

The 8 discovery sections each have `systemContext` and `workflowHint` fields. Media-derived signals would be injected as a new context block:

```
[CONTEXT FROM RECORDINGS]
Source: Coaching session (Speaker 1 = coach, Speaker 2 = user), 32 minutes

Identity signals extracted:
- User expressed strong preference for systems-building over people-management
- Named "buoy identity" pattern — stability for family vs. personal growth tension
- Articulated goal: "moving away from anxiety and depression and into happiness"
- Referenced time pressure and desire to model healthier relationship to work for children

Relevant to: Essence, Values, Work Style, What Fills You
```

The discovery AI should be instructed to:
- Reference transcript signals naturally ("You mentioned in a coaching session that...")
- Not re-ask questions the transcript already answers
- Probe deeper on topics the transcript surfaced but didn't resolve
- Weight spoken, unfiltered statements higher than polished written documents

---

## Dependencies and sequencing

| Dependency | Status | Required for media intake? |
|---|---|---|
| Serverless proxy architecture | Specced, not built | Yes — `/api/transcribe` route |
| Session persistence | Specced (v1.1), branch exists | Yes — transcript storage on return |
| Privacy/data handling doc | P2, not started | Yes — media raises the bar |
| Guardrails v1.0 | Committed to config | No change needed |
| Tester URL stability | Ongoing constraint | Must maintain |

**Recommended sequencing:**
1. Build serverless proxy (already P0) — this unblocks both media intake and prompt security
2. Build session persistence (already specced) — this unblocks transcript storage
3. Build media intake on top of both

Media intake should NOT be built before the serverless proxy and session persistence are in place. It depends on both.

---

## Scope boundaries

### In scope (v1)
- Audio file upload (MP3, M4A, WAV, OGG, FLAC)
- Video file upload with audio-only extraction (MP4, MOV, WEBM)
- Third-party transcription with speaker diarization
- Signal extraction pass (Claude API)
- Background processing during intake flow
- Processing gate before discovery
- Transcript persistence across sessions
- Privacy disclosure for media

### Out of scope (v1)
- Video visual analysis (slides, body language, facial expression)
- Real-time recording within the app (record a reflection now)
- Multi-language transcription (English only for v1)
- Transcript editing by the user before discovery
- Coach-specific diarization labels (auto-detecting "this is the coach" vs. "this is the client")
- Streaming transcription (live processing during upload)

### Future considerations
- **In-app recording:** "Record a 5-minute reflection right now" as an alternative to file upload. Lower friction, but requires microphone permissions and a recording UI.
- **Coach-labeled diarization:** If the user identifies which speaker is the coach, the signal extraction can weight coach observations differently from client self-report (connects to the Oh/Wang/Mount 2011 observer-rating thesis).
- **Video analysis:** Presentation slides extracted as images, analyzed for topic emphasis and communication style. Body language analysis is speculative and likely not worth the complexity.
- **Transcript review:** Let users read and annotate their transcript before discovery, flagging "this is important" or "ignore this part." Adds friction but improves signal quality.

---

## Open questions

1. **Client-side vs. server-side audio extraction from video.** FFmpeg.wasm adds ~25MB to the client bundle. Is that acceptable, or should extraction happen server-side?

2. **Transcript storage location.** localStorage has a ~5MB limit. A 60-minute transcript is ~40KB as text, so individual transcripts fit, but multiple recordings plus other session state could get tight. Server-side session store may be needed regardless.

3. **Speaker identification.** Diarization labels speakers as "Speaker 1" and "Speaker 2." Should the user be asked to identify speakers ("Which one is you?") or should the system infer from context?

4. **Cost pass-through.** At $0.66/typical user for transcription, does this remain free-tier, or does media processing become a paid feature? Connects to the freemium model design.

5. **Consent for coaching recordings.** A coaching session recording involves two people. Does the user need to confirm they have consent from their coach to upload? Legal/ethical consideration for the privacy doc.

---

## Changelog

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-04-08 | Initial draft |
