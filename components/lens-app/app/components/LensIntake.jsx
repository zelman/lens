"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const STORAGE_KEY = "lens-intake-progress";

// ── Design tokens ──
const RED = "#D93025";
const ORANGE = "#E8590C";
const BLK = "#1A1A1A";
const GRY = "#888";
const LT = "#ccc";
const RULE = "#eee";
const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

// ── Text extraction from uploaded files ──
let pdfjsLoaded = false;

async function loadPdfJs() {
  if (pdfjsLoaded) return;
  await new Promise((resolve, reject) => {
    if (document.querySelector('script[data-pdfjs]')) { resolve(); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    s.setAttribute("data-pdfjs", "true");
    s.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      pdfjsLoaded = true;
      resolve();
    };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function extractText(file) {
  const name = file.name.toLowerCase();
  const MAX_CHARS = 30000; // Keep context window manageable

  try {
    // Plain text formats
    if (name.match(/\.(txt|md|csv|html|htm)$/)) {
      const text = await file.text();
      return text.slice(0, MAX_CHARS);
    }

    // DOCX via mammoth
    if (name.match(/\.(docx)$/)) {
      const mammoth = await import("mammoth");
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return (result.value || "").slice(0, MAX_CHARS);
    }

    // PDF via pdf.js
    if (name.match(/\.(pdf)$/)) {
      await loadPdfJs();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pages = [];
      for (let i = 1; i <= Math.min(pdf.numPages, 30); i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        pages.push(content.items.map(item => item.str).join(" "));
      }
      return pages.join("\n\n").slice(0, MAX_CHARS);
    }
  } catch (e) {
    console.warn(`Text extraction failed for ${file.name}:`, e);
  }

  return null; // Unsupported or failed
}

// ── Upload categories ──
const CATEGORIES = [
  {
    id: "resume",
    label: "Resume",
    accept: ".pdf,.docx,.doc,.txt,.md",
    hint: "The starting point. PDF, Word, or plain text.",
    multiple: false,
  },
  {
    id: "writing",
    label: "Writing samples",
    accept: ".pdf,.docx,.doc,.txt,.md,.html",
    hint: "Blog posts, project briefs, presentations, emails you're proud of — anything that shows how you think and communicate.",
    multiple: true,
  },
  {
    id: "assessments",
    label: "Assessments & frameworks",
    accept: ".pdf,.docx,.doc,.txt,.md,.png,.jpg,.jpeg",
    hint: "DISC profile, StrengthsFinder results, Myers-Briggs, 360 feedback, Enneagram, coaching notes, performance reviews — any structured reflection on who you are.",
    multiple: true,
  },
  {
    id: "other",
    label: "Anything else",
    accept: "",
    hint: "A letter of recommendation, a deck you built, a Slack message that captures your voice, a journal entry. If it says something about you, it's useful.",
    multiple: true,
  },
];

// ── AI coaching system prompt ──
const SYSTEM_BASE = `You are a thoughtful coach helping someone build a lens document — a structured profile that captures who they are and what they need. You're conducting a discovery conversation, one section at a time.

Your tone is warm but direct, curious but not invasive. You ask follow-up questions that go deeper, not wider. You reflect back what you hear with precision. You never use corporate jargon, HR-speak, or generic coaching platitudes.

CRITICAL CONTEXT: The lens document you are helping build will be consumed by an automated job-matching pipeline. It will score real job listings against the person's profile daily. This means every section must produce SPECIFIC, FILTERABLE content — not just narrative insight. "I care about mission-driven work" is useless to a pipeline. "B2B SaaS in healthcare, Series A-B, 15-200 employees" is actionable.

Your dual mandate:
1. DEPTH — Help the person articulate authentic patterns, values, and preferences they may not have language for yet. This is real coaching.
2. UTILITY — Ensure every section captures criteria that a scoring engine can match against job listings, company profiles, and role descriptions. If the person gives you poetry, reflect it back warmly — then ask for the specifics.

When the person talks about aspirations (founding a company, side projects, long-term dreams), acknowledge them — then redirect: "That's clearly important to you. For the lens document, though, let's focus on the next role you'd actually accept. What would that company look like?"

Do not let sections end without concrete, filterable output. If someone completes the Mission section without naming specific sectors, company stages, or org sizes, ask directly before wrapping up.`;

// ── Discovery sections ──
const SECTIONS = [
  {
    number: "01", label: "Essence", id: "essence",
    prompt: "Let's start with what makes you, you. Not your title, not your resume — the thing people notice about how you work across every context. What's the throughline?",
    systemContext: "This section is about identity patterns — what's consistent across roles, contexts, and chapters. Push past titles and skills into the 'how' and 'why' of their work. PIPELINE NOTE: The essence section helps score culture fit and role type. Extract whether they're a builder vs. maintainer, leader vs. IC, structured vs. improvisational. Keep responses under 80 words.",
  },
  {
    number: "02", label: "Values", id: "values",
    prompt: "When you say something matters to you at work, what does that actually look like? Tell me about a time your values were honored — or violated.",
    systemContext: "This section is about behavioral values, not aspirational ones. You want evidence: stories, friction points, moments of alignment or betrayal. Push past 'I value collaboration' into 'here's what happened when collaboration broke down.' PIPELINE NOTE: Values feed culture fit scoring. Extract observable signals a company would exhibit (or violate). Before completing, ensure you have at least 2-3 values grounded in specific stories. Keep responses under 80 words.",
  },
  {
    number: "03", label: "Mission", id: "mission",
    prompt: "Think about the next role you'd actually say yes to — not someday, but in the next few months. What is that company doing? What sector are they in? How big are they? What stage?",
    systemContext: "This is the most pipeline-critical section. You MUST extract: specific sectors/industries (e.g. 'healthcare B2B SaaS', not just 'tech'), company stage (seed, Series A, Series B, growth, etc.), employee count range, funding preferences (VC-backed, bootstrapped, etc.), and business model (B2B, B2C, marketplace, etc.). If the person drifts into aspirations, side projects, or founding their own company, acknowledge it warmly and redirect: 'That's clearly where your energy is long-term. For matching you to real opportunities right now, what kind of company and role would you say yes to this quarter?' Do NOT complete this section without at least: 1-2 specific sectors, a company stage preference, and a size range. Keep responses under 80 words.",
  },
  {
    number: "04", label: "Work Style", id: "workstyle",
    prompt: "Describe the best working day you've had in the last few years. What made it good — the pace, the people, the problem, the autonomy?",
    systemContext: "This section captures how they actually work — not how they think they should. Environment, pace, collaboration style, relationship to structure and autonomy. Real patterns, not interview answers. PIPELINE NOTE: This feeds work style match scoring. Extract: remote vs. in-person preference, team size they thrive in, meeting cadence, communication style, timezone/schedule needs. Keep responses under 80 words.",
  },
  {
    number: "05", label: "What Fills You", id: "energy",
    prompt: "There are things you're good at that drain you, and things that light you up that no one's paying you for yet. What fills your tank at work?",
    systemContext: "This section distinguishes between competence and energy. Someone might be great at spreadsheets but die inside doing them. Find what gives energy vs. what merely looks good on a resume. PIPELINE NOTE: Energy signals help score role fit — the KIND of work matters. Extract: problem types (building vs. optimizing, people vs. systems, strategic vs. tactical), outputs they're proud of, contexts that energize vs. drain. Keep responses under 80 words.",
  },
  {
    number: "06", label: "Disqualifiers", id: "disqualifiers",
    prompt: "What would make you walk away from an opportunity — even if the title and comp were perfect? What are your hard stops?",
    systemContext: "This section builds the exclusion filter — the most powerful part of the pipeline. Get concrete and specific: company types (PE-backed, public, etc.), industries to exclude, cultural patterns, structural realities, ethical lines, minimum comp. These become instant-reject rules. BEFORE completing: confirm each disqualifier is specific enough to be a yes/no filter. 'Toxic culture' is too vague. 'PE-backed companies' or 'orgs over 300 people' are filterable. Push for specificity. Keep responses under 80 words.",
  },
  {
    number: "07", label: "Goals", id: "goals",
    prompt: "What does the next chapter look like if it goes well? What title, comp range, and location work for you — and what's your timeline?",
    systemContext: "This section captures job search parameters. MUST extract: target titles (and title flexibility — would they accept a senior IC role at the right company?), compensation floor, location preferences (remote, hybrid, specific cities, relocation willingness), timeline/urgency, and any structural constraints (visa, non-compete, notice period). If they only talk about life goals or feelings, acknowledge those and redirect: 'That paints a clear picture of what matters. Now let's get practical — what title, comp, and location make this real?' Keep responses under 80 words.",
  },
  {
    number: "08", label: "Synthesis", id: "synthesis",
    prompt: "Looking back at everything you've shared — the patterns, the values, the energy sources, the hard stops — what feels most true? What surprised you?",
    systemContext: "This is the final reflection. Help them see the through-line across all sections. Reflect back the most important themes. Also use this as a gap-check: if any critical pipeline data is missing from earlier sections (sectors, company size, comp, titles, disqualifiers), ask for it now. This isn't just a mirror — it's quality control. Keep responses under 80 words.",
  },
];

const STATUS_OPTIONS = [
  { id: "employed", label: "Employed", sub: "Not actively looking, but open to the right thing" },
  { id: "searching", label: "Actively Searching", sub: "In the market, applying, or about to be" },
  { id: "transitioning", label: "In Transition", sub: "Between roles, figuring out the next chapter" },
];

// ════════════════════════════════════════
// Components
// ════════════════════════════════════════

function TypewriterText({ text, speed = 16 }) {
  const [displayed, setDisplayed] = useState("");
  const idx = useRef(0);
  useEffect(() => {
    setDisplayed("");
    idx.current = 0;
    const interval = setInterval(() => {
      if (idx.current < text.length) {
        setDisplayed(text.slice(0, idx.current + 1));
        idx.current++;
      } else clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  return <span>{displayed}</span>;
}

function FileChip({ name, size, parsed, onRemove }) {
  const kb = (size / 1024).toFixed(0);
  const display = kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: "8px",
      padding: "6px 12px", border: `1px solid ${parsed ? "#ccc" : RULE}`, background: "#fafafa",
      fontSize: "12px", color: BLK, fontFamily: FONT, marginTop: "8px", marginRight: "6px",
    }}>
      {parsed && (
        <span style={{ width: "6px", height: "6px", background: RED, display: "inline-block", flexShrink: 0 }}
          title="Content extracted — the AI can read this file" />
      )}
      <span style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
      <span style={{ color: LT, fontSize: "11px" }}>{display}</span>
      <button onClick={onRemove} style={{
        background: "none", border: "none", color: GRY, cursor: "pointer",
        fontSize: "14px", lineHeight: 1, padding: "0 2px", fontFamily: FONT,
      }} title="Remove">&times;</button>
    </div>
  );
}

function UploadSlot({ category, files, onAdd, onRemove, index }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) onAdd(category.id, category.multiple ? dropped : [dropped[0]]);
  }, [category, onAdd]);

  const handleChange = (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length) onAdd(category.id, category.multiple ? selected : [selected[0]]);
    e.target.value = "";
  };

  const hasFiles = files.length > 0;

  return (
    <div style={{ marginBottom: "28px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "4px" }}>
        <span style={{ color: ORANGE, fontWeight: 600, fontSize: "12px", fontVariantNumeric: "tabular-nums" }}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <span style={{ fontSize: "14px", fontWeight: 500, color: BLK }}>{category.label}</span>
      </div>
      <p style={{ fontSize: "12px", color: GRY, lineHeight: 1.6, margin: "0 0 10px 26px", maxWidth: "480px" }}>
        {category.hint}
      </p>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          marginLeft: "26px", padding: hasFiles ? "14px 16px" : "24px 16px",
          border: dragOver ? `1.5px solid ${RED}` : "1.5px dashed #ddd",
          background: dragOver ? "rgba(217,48,37,0.03)" : "#fff",
          cursor: "pointer", transition: "all 0.15s ease",
          textAlign: hasFiles ? "left" : "center",
        }}
      >
        {!hasFiles && (
          <div>
            <div style={{ fontSize: "13px", color: BLK, marginBottom: "4px" }}>
              Drop files here or <span style={{ color: RED, fontWeight: 500 }}>browse</span>
            </div>
            <div style={{ fontSize: "11px", color: LT }}>
              {category.accept
                ? category.accept.split(",").map(e => e.replace(".", "").toUpperCase()).join(", ")
                : "Any file type"}
            </div>
          </div>
        )}
        {hasFiles && (
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {files.map((f, i) => (
              <FileChip key={`${f.name}-${i}`} name={f.name} size={f.size} parsed={!!f._textContent}
                onRemove={(e) => { e.stopPropagation(); onRemove(category.id, i); }} />
            ))}
            <div style={{
              display: "inline-flex", alignItems: "center", padding: "6px 12px",
              fontSize: "12px", color: RED, fontWeight: 500, marginTop: "8px", cursor: "pointer",
            }}>
              + Add {category.multiple ? "more" : "different"}
            </div>
          </div>
        )}
        <input ref={inputRef} type="file" accept={category.accept || undefined}
          multiple={category.multiple} onChange={handleChange} style={{ display: "none" }} />
      </div>
    </div>
  );
}

// ════════════════════════════════════════
// Phase views
// ════════════════════════════════════════

function IntroPhase({ onContinue }) {
  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ borderBottom: `2px solid ${BLK}`, paddingBottom: "12px", marginBottom: "32px" }}>
        <div style={{ fontSize: "10px", color: RED, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "6px", fontWeight: 600 }}>
          The Lens Project
        </div>
        <h1 style={{ fontFamily: FONT, fontSize: "28px", fontWeight: 700, color: BLK, margin: 0, lineHeight: 1.2 }}>
          Build your lens
        </h1>
      </div>

      {/* What is it */}
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: 600, color: BLK, margin: "0 0 10px" }}>What is a lens?</h2>
        <p style={{ fontSize: "14px", color: "#444", lineHeight: 1.75, margin: "0 0 12px", maxWidth: "500px" }}>
          A lens is a structured document that captures who you actually are professionally. Not keywords optimized for an algorithm. Not a two-page summary of job titles. Your values, your patterns, your working identity — the things that don't change when you update your resume for the next application.
        </p>
        <p style={{ fontSize: "14px", color: "#444", lineHeight: 1.75, margin: 0, maxWidth: "500px" }}>
          Once built, your lens can power daily job matching, personalized opportunity briefings, and smarter career decisions — because the system knows what actually matters to you, not just what you've done.
        </p>
      </div>

      <div style={{ height: "1px", background: RULE, marginBottom: "32px" }} />

      {/* How it works */}
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: 600, color: BLK, margin: "0 0 16px" }}>How it works</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {[
            {
              num: "01",
              title: "Upload your materials",
              desc: "Resume, writing samples, assessment results — whatever you have. The AI reads everything before the conversation begins, so it can skip the obvious and go deeper.",
              time: "2–5 min",
            },
            {
              num: "02",
              title: "Guided discovery conversation",
              desc: "Eight sections, each exploring a different dimension of your professional identity: essence, values, mission, work style, what energizes you, what you won't tolerate, and where you're headed. The AI asks follow-up questions, reflects back what it hears, and decides when to move on.",
              time: "20–40 min",
            },
            {
              num: "03",
              title: "Your lens document",
              desc: "A portable, structured profile in your voice — part narrative, part scoring framework. Machine-readable for job matching. Human-readable for you, a recruiter, or a coach.",
              time: "Generated automatically",
            },
          ].map((step) => (
            <div key={step.num} style={{ display: "flex", gap: "14px" }}>
              <div style={{
                fontSize: "12px", fontWeight: 600, color: ORANGE, fontVariantNumeric: "tabular-nums",
                minWidth: "22px", paddingTop: "2px",
              }}>
                {step.num}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 500, color: BLK }}>{step.title}</span>
                  <span style={{ fontSize: "11px", color: LT, letterSpacing: "0.04em" }}>{step.time}</span>
                </div>
                <p style={{ fontSize: "13px", color: GRY, lineHeight: 1.65, margin: 0, maxWidth: "440px" }}>
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: "1px", background: RULE, marginBottom: "32px" }} />

      {/* What you'll need */}
      <div style={{ marginBottom: "36px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: 600, color: BLK, margin: "0 0 10px" }}>What you'll need</h2>
        <p style={{ fontSize: "13px", color: GRY, lineHeight: 1.7, margin: 0, maxWidth: "500px" }}>
          Nothing is required. You can start from scratch and the AI will work with whatever you bring. But the more context you provide upfront — a resume, a DISC assessment, some writing samples — the faster the conversation gets past surface-level and into the stuff that actually matters.
        </p>
      </div>

      {/* Time estimate callout */}
      <div style={{
        padding: "16px 20px", border: `1px solid ${RULE}`, marginBottom: "16px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ fontSize: "11px", color: GRY, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "2px" }}>
            Total time
          </div>
          <div style={{ fontSize: "16px", fontWeight: 600, color: BLK }}>
            25–45 minutes
          </div>
        </div>
        <div style={{ fontSize: "12px", color: GRY, textAlign: "right", maxWidth: "240px", lineHeight: 1.5 }}>
          You can pause and return anytime. Your progress is saved.
        </div>
      </div>
      <div style={{
        padding: "12px 20px", background: "#fafafa", marginBottom: "32px",
        fontSize: "12px", color: GRY, lineHeight: 1.6,
      }}>
        <span style={{ fontWeight: 500, color: BLK }}>If you close the tab:</span> Your place in the process and your selections are saved automatically. Uploaded files will need to be re-added when you return, so it helps to keep them handy. Conversation progress during discovery is also saved.
      </div>

      {/* CTA */}
      <div style={{ borderTop: `2px solid ${BLK}`, paddingTop: "20px" }}>
        <button onClick={onContinue} style={{
          width: "100%", padding: "14px", fontFamily: FONT, fontSize: "13px", fontWeight: 600,
          letterSpacing: "0.1em", textTransform: "uppercase", background: RED, color: "#fff",
          border: `1.5px solid ${RED}`, cursor: "pointer", transition: "all 0.15s ease", borderRadius: 0,
        }}>
          Get started
        </button>
      </div>
    </div>
  );
}

function UploadPhase({ files, onAdd, onRemove, onContinue, onBack }) {
  const totalFiles = Object.values(files).reduce((sum, arr) => sum + arr.length, 0);
  const fileSummary = CATEGORIES.filter(c => files[c.id].length > 0)
    .map(c => `${c.label} (${files[c.id].length})`).join(", ");

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ borderBottom: `2px solid ${BLK}`, paddingBottom: "12px", marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "10px", color: RED, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "6px", fontWeight: 600 }}>
                Step 1 of 3
              </div>
              <h1 style={{ fontFamily: FONT, fontSize: "26px", fontWeight: 700, color: BLK, margin: 0, lineHeight: 1.2 }}>
                Give the AI a head start
              </h1>
            </div>
            <button onClick={onBack} style={{
              background: "none", border: "none", color: GRY, fontFamily: FONT,
              fontSize: "12px", cursor: "pointer", padding: "4px 0", marginTop: "6px",
            }}>
              &larr; Back
            </button>
          </div>
        </div>
        <p style={{ fontSize: "13px", color: GRY, lineHeight: 1.7, maxWidth: "500px", margin: 0 }}>
          The more context you provide, the deeper the conversation goes. None of these are required — but the AI will use whatever you bring to ask better questions and skip the surface-level stuff your resume already covers.
        </p>
      </div>

      <div style={{ height: "1px", background: RULE, marginBottom: "28px" }} />

      {/* Upload slots */}
      {CATEGORIES.map((cat, i) => (
        <UploadSlot key={cat.id} category={cat} files={files[cat.id]}
          onAdd={onAdd} onRemove={onRemove} index={i} />
      ))}

      {/* Footer */}
      <div style={{ marginTop: "8px", paddingTop: "20px", borderTop: `2px solid ${BLK}` }}>
        {totalFiles > 0 && (
          <div style={{ fontSize: "12px", color: GRY, marginBottom: "12px" }}>
            {totalFiles} file{totalFiles !== 1 ? "s" : ""} uploaded: {fileSummary}
          </div>
        )}
        <button onClick={onContinue} style={{
          width: "100%", padding: "13px", fontFamily: FONT, fontSize: "13px", fontWeight: 600,
          letterSpacing: "0.1em", textTransform: "uppercase", background: RED, color: "#fff",
          border: `1.5px solid ${RED}`, cursor: "pointer", transition: "all 0.15s ease", borderRadius: 0,
        }}>
          {totalFiles > 0 ? "Continue" : "Skip — start from scratch"}
        </button>
        {totalFiles === 0 ? (
          <p style={{ fontSize: "11px", color: LT, textAlign: "center", marginTop: "10px" }}>
            You can always come back and add materials later.
          </p>
        ) : (
          <p style={{ fontSize: "11px", color: LT, textAlign: "center", marginTop: "10px" }}>
            If you close the tab, you'll need to re-add your files when you return. Everything else is saved automatically.
          </p>
        )}
      </div>
    </div>
  );
}

function StatusPhase({ status, setStatus, onContinue, onBack }) {
  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ borderBottom: `2px solid ${BLK}`, paddingBottom: "12px", marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "10px", color: RED, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "6px", fontWeight: 600 }}>
                Step 2 of 3
              </div>
              <h1 style={{ fontFamily: FONT, fontSize: "26px", fontWeight: 700, color: BLK, margin: 0, lineHeight: 1.2 }}>
                Where are you right now?
              </h1>
            </div>
            <button onClick={onBack} style={{
              background: "none", border: "none", color: GRY, fontFamily: FONT,
              fontSize: "12px", cursor: "pointer", padding: "4px 0", marginTop: "6px",
            }}>
              &larr; Back
            </button>
          </div>
        </div>
        <p style={{ fontSize: "13px", color: GRY, lineHeight: 1.7, maxWidth: "480px", margin: 0 }}>
          This shapes the conversation and how your lens document is used by the matching system.
        </p>
      </div>

      <div style={{ height: "1px", background: RULE, marginBottom: "28px" }} />

      {/* Status options */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "36px" }}>
        {STATUS_OPTIONS.map(opt => (
          <button key={opt.id} onClick={() => setStatus(opt.id)} style={{
            padding: "18px 20px", textAlign: "left",
            background: status === opt.id ? "rgba(217,48,37,0.04)" : "#fff",
            border: status === opt.id ? `1.5px solid ${RED}` : "1.5px solid #ddd",
            cursor: "pointer", transition: "all 0.15s ease", borderRadius: 0,
            display: "flex", flexDirection: "column", gap: "4px",
          }}>
            <span style={{
              fontSize: "14px", fontWeight: 500, fontFamily: FONT,
              color: status === opt.id ? RED : BLK,
            }}>
              {opt.label}
            </span>
            <span style={{ fontSize: "12px", color: GRY, fontFamily: FONT }}>
              {opt.sub}
            </span>
          </button>
        ))}
      </div>

      {/* Continue */}
      <div style={{ borderTop: `2px solid ${BLK}`, paddingTop: "20px" }}>
        <button onClick={onContinue} disabled={!status} style={{
          width: "100%", padding: "13px", fontFamily: FONT, fontSize: "13px", fontWeight: 600,
          letterSpacing: "0.1em", textTransform: "uppercase",
          background: status ? RED : "#f5f5f5", color: status ? "#fff" : LT,
          border: status ? `1.5px solid ${RED}` : "1.5px solid #eee",
          cursor: status ? "pointer" : "default",
          transition: "all 0.15s ease", borderRadius: 0,
        }}>
          Begin discovery
        </button>
      </div>
    </div>
  );
}

function DiscoveryPhase({ status, totalFiles, files, onBack, onStartOver }) {
  const [subPhase, setSubPhase] = useState("preview"); // preview | conversation | synthesis | done
  const [currentSection, setCurrentSection] = useState(0);
  const [messages, setMessages] = useState([]);
  const [sectionData, setSectionData] = useState({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiGreeting, setAiGreeting] = useState("");
  const [greetingDone, setGreetingDone] = useState(false);
  const [lensDoc, setLensDoc] = useState(null);
  const [copyLabel, setCopyLabel] = useState("Copy markdown");
  const [sectionComplete, setSectionComplete] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Build file context string from uploaded files
  const fileContext = (() => {
    const parts = [];
    for (const [cat, arr] of Object.entries(files)) {
      for (const f of arr) {
        if (f._textContent) {
          parts.push(`[${CATEGORIES.find(c => c.id === cat)?.label}: ${f.name}]\n${f._textContent}`);
        }
      }
    }
    return parts.length > 0 ? parts.join("\n\n---\n\n") : "";
  })();

  const parsedCount = Object.values(files).flat().filter(f => f._textContent).length;

  async function callClaude(msgs, systemExtra = "") {
    const fileNote = fileContext
      ? `\n\nThe user has uploaded the following materials. Use them to inform your questions — skip what their resume already covers and go deeper:\n\n${fileContext}`
      : "";
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: SYSTEM_BASE + fileNote + (systemExtra ? "\n\n" + systemExtra : ""),
        messages: msgs,
      }),
    });
    const data = await res.json();
    return data.content?.[0]?.text || "";
  }

  async function startSection(idx) {
    setCurrentSection(idx);
    setSubPhase("conversation");
    setMessages([]);
    setGreetingDone(false);
    setSectionComplete(false);
    setLoading(true);

    const sec = SECTIONS[idx];
    const prevContext = Object.entries(sectionData)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
    const statusNote = `The user's current employment status is: ${status}.`;
    const contextPrompt = prevContext
      ? `${statusNote}\n\nPrior context from earlier sections:\n${prevContext}\n\nNow introduce the next section with this prompt to the user: "${sec.prompt}". Keep your opener to 2-3 sentences max.`
      : `${statusNote}\n\nIntroduce this section with the following prompt: "${sec.prompt}". Keep your opener to 2-3 sentences max. Start warm but don't over-introduce yourself.`;

    const greeting = await callClaude(
      [{ role: "user", content: contextPrompt }],
      sec.systemContext
    );
    setAiGreeting(greeting);
    setLoading(false);
  }

  useEffect(() => {
    if (aiGreeting && !greetingDone) {
      const timeout = setTimeout(() => {
        setMessages([{ role: "assistant", content: aiGreeting }]);
        setGreetingDone(true);
        setAiGreeting("");
        inputRef.current?.focus();
      }, aiGreeting.length * 18 + 400);
      return () => clearTimeout(timeout);
    }
  }, [aiGreeting, greetingDone]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const sec = SECTIONS[currentSection];
    const userMsg = input.trim();
    setInput("");
    const newMsgs = [...messages, { role: "user", content: userMsg }];
    setMessages(newMsgs);
    setLoading(true);

    const userMsgCount = newMsgs.filter((m) => m.role === "user").length;
    const minMessages = ["mission", "disqualifiers", "goals"].includes(sec.id) ? 3 : 2;
    const isLongEnough = userMsgCount >= minMessages;

    const systemExtra =
      sec.systemContext +
      (isLongEnough
        ? `\n\nYou may have enough to synthesize. Before ending, verify you have the specific, filterable data this section requires (see PIPELINE NOTE above). If critical specifics are missing, ask one more targeted question instead of completing. If the section has what it needs, end with exactly: [SECTION_COMPLETE]`
        : "");

    const reply = await callClaude(newMsgs, systemExtra);
    const isComplete = reply.includes("[SECTION_COMPLETE]");
    const cleanReply = reply.replace("[SECTION_COMPLETE]", "").trim();

    setMessages([...newMsgs, { role: "assistant", content: cleanReply }]);
    setLoading(false);

    if (isComplete) {
      const summary = await callClaude(
        [
          ...newMsgs,
          { role: "assistant", content: cleanReply },
          {
            role: "user",
            content: `Synthesize what you learned about me in this section into content for my lens document. Include TWO parts:

1. NARRATIVE (3-5 sentences): First person, present tense, specific. Captures the authentic patterns and insights from our conversation.

2. SIGNALS (bullet list): The specific, filterable criteria a job-matching pipeline can score against. These should be concrete: sector names, company sizes, title preferences, behavioral indicators, hard boundaries — whatever this section surfaced that a scoring engine needs.

No preamble — start with the narrative, then the signals.`,
          },
        ],
        sec.systemContext
      );
      setSectionData((prev) => ({ ...prev, [sec.label]: summary }));

      // Signal section is done — user decides when to advance
      setSectionComplete(true);
    }
  }

  function advanceSection() {
    if (currentSection < SECTIONS.length - 1) {
      startSection(currentSection + 1);
    } else {
      generateLens();
    }
  }

  async function generateLens() {
    setSubPhase("synthesis");
    setLoading(true);
    const allSections = Object.entries(sectionData)
      .map(([k, v]) => `## ${k}\n${v}`)
      .join("\n\n");
    const statusLabel = STATUS_OPTIONS.find((s) => s.id === status)?.label || status;

    const doc = await callClaude(
      [
        {
          role: "user",
          content: `Here is everything from the discovery conversation:\n\nStatus: ${statusLabel}\n\n${allSections}\n\nNow write the complete lens document. Start with YAML frontmatter (---) that includes: name (leave as "TBD" — the user will fill this in), status, scoring weights for mission_alignment (25), role_fit (20), culture_fit (18), skill_match (17), work_style (12), energy_match (8), and instant_disqualifiers extracted from the Disqualifiers section.\n\nThen write narrative markdown sections:\n\n## Essence\n[Their throughline. What they're known for. What they want to carry forward. Specific.]\n\n## Values\n[Genuine values with evidence or grounding. No platitudes.]\n\n## Mission & Sector Fit\n[Where the work needs to matter. Specific sectors, org types, cause areas, stage preferences.]\n\n## Work Style\n[How they work best. Environment, pace, autonomy, collaboration. Grounded in real patterns.]\n\n## What Fills Them\n[Problem types, outputs, and contexts that give energy. Distinguishes from what merely looks good.]\n\n## Disqualifiers\n[Hard stops — cultural, structural, ethical, interpersonal. Specific enough to filter with.]\n\n## Goals & Timeline\n[Current state, runway, urgency, geographic or structural constraints. What success looks like.]\n\n## How to Use This Document\n[2-3 sentences: what this lens is for, how the workflow should apply it, what it shouldn't be used to do.]\n\nWrite the entire document. Be specific. Be honest. No generic career language.`,
        },
      ],
      "You are synthesizing a personal lens document for career intelligence use. The YAML frontmatter will be machine-parsed to route this person to relevant opportunities. The narrative sections will be read by human collaborators. Both must be specific and useful."
    );
    setLensDoc(doc);
    setLoading(false);
    setSubPhase("done");
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(lensDoc);
    setCopyLabel("Copied");
    setTimeout(() => setCopyLabel("Copy markdown"), 2000);
  }

  function downloadMarkdown() {
    const blob = new Blob([lensDoc], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lens-document.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  const sec = SECTIONS[currentSection];

  // ── Preview / landing screen ──
  if (subPhase === "preview") {
    return (
      <div style={containerStyle}>
        <div style={{ borderBottom: `2px solid ${BLK}`, paddingBottom: "12px", marginBottom: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "10px", color: RED, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "6px", fontWeight: 600 }}>
                Step 3 of 3
              </div>
              <h1 style={{ fontFamily: FONT, fontSize: "26px", fontWeight: 700, color: BLK, margin: 0, lineHeight: 1.2 }}>
                Discovery
              </h1>
            </div>
            <button onClick={onBack} style={{
              background: "none", border: "none", color: GRY, fontFamily: FONT,
              fontSize: "12px", cursor: "pointer", padding: "4px 0", marginTop: "6px",
            }}>
              &larr; Back
            </button>
          </div>
        </div>

        {/* Status bar */}
        <div style={{
          display: "flex", gap: "16px", padding: "14px 18px",
          border: `1px solid ${RULE}`, marginBottom: "28px", alignItems: "center",
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "11px", color: GRY, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "2px" }}>Status</div>
            <div style={{ fontSize: "14px", fontWeight: 500, color: BLK }}>
              {STATUS_OPTIONS.find(s => s.id === status)?.label}
            </div>
          </div>
          <div style={{ width: "1px", height: "28px", background: RULE }} />
          <div>
            <div style={{ fontSize: "11px", color: GRY, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "2px" }}>Context</div>
            <div style={{ fontSize: "14px", fontWeight: 500, color: BLK }}>
              {totalFiles > 0
                ? parsedCount > 0
                  ? `${parsedCount} file${parsedCount !== 1 ? "s" : ""} readable`
                  : `${totalFiles} file${totalFiles !== 1 ? "s" : ""} uploaded`
                : "Starting fresh"}
            </div>
            {totalFiles > 0 && parsedCount > 0 && parsedCount < totalFiles && (
              <div style={{ fontSize: "11px", color: GRY, marginTop: "2px" }}>
                {totalFiles - parsedCount} could not be read
              </div>
            )}
          </div>
        </div>

        {/* Sections preview */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ fontSize: "12px", color: GRY, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "14px" }}>
            8 discovery sections
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {SECTIONS.map(s => (
              <div key={s.number} style={{
                padding: "6px 14px", border: `1px solid ${RULE}`, fontSize: "12px", color: "#555",
              }}>
                <span style={{ color: ORANGE, fontWeight: 600, marginRight: "6px" }}>{s.number}</span>
                {s.label}
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: "1px", background: RULE, marginBottom: "28px" }} />

        {/* CTA */}
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ width: "48px", height: "2px", background: RED, margin: "0 auto 20px" }} />
          <p style={{ fontSize: "15px", color: BLK, lineHeight: 1.7, maxWidth: "400px", margin: "0 auto 10px" }}>
            Ready to begin.
          </p>
          <p style={{ fontSize: "13px", color: GRY, lineHeight: 1.7, maxWidth: "400px", margin: "0 auto 28px" }}>
            An AI-guided conversation — informed by your uploaded materials, tailored to your status, one section at a time.
          </p>
          <div style={{
            padding: "14px 24px", border: `1px solid ${RULE}`, display: "inline-block",
            fontSize: "12px", color: GRY, lineHeight: 1.6, marginBottom: "32px",
          }}>
            Estimated time remaining: <span style={{ color: BLK, fontWeight: 500 }}>20–40 minutes</span>
          </div>
          <div>
            <button
              onClick={() => startSection(0)}
              style={{
                padding: "14px 40px", background: RED, border: `1.5px solid ${RED}`,
                color: "#fff", fontSize: "13px", fontWeight: 600, fontFamily: FONT,
                letterSpacing: "0.1em", textTransform: "uppercase",
                cursor: "pointer", borderRadius: 0, transition: "all 0.15s ease",
              }}
            >
              Begin discovery
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Synthesis / generating ──
  if (subPhase === "synthesis") {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <div style={{ width: "48px", height: "2px", background: RED, margin: "0 auto 24px" }} />
          <h2 style={{ fontFamily: FONT, fontSize: "20px", fontWeight: 600, color: BLK, margin: "0 0 12px" }}>
            Synthesizing your lens
          </h2>
          <p style={{ fontSize: "13px", color: GRY, lineHeight: 1.7 }}>
            Building your lens document from everything you shared across all 8 sections...
          </p>
          <div style={{ marginTop: "28px" }}>
            <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: "6px", height: "6px", background: RED, borderRadius: "50%",
                  animation: `bar 0.8s ease-in-out ${i * 0.2}s infinite alternate`,
                }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Done / lens document output ──
  if (subPhase === "done" && lensDoc) {
    return (
      <div style={containerStyle}>
        <div style={{ borderBottom: `2px solid ${BLK}`, paddingBottom: "12px", marginBottom: "28px" }}>
          <div style={{ fontSize: "10px", color: RED, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "6px", fontWeight: 600 }}>
            Complete
          </div>
          <h1 style={{ fontFamily: FONT, fontSize: "26px", fontWeight: 700, color: BLK, margin: 0, lineHeight: 1.2 }}>
            Your lens document
          </h1>
        </div>

        <p style={{ fontSize: "13px", color: GRY, lineHeight: 1.7, marginBottom: "24px" }}>
          This is yours. Download it, share it with a recruiter, or connect it to the scoring pipeline.
        </p>

        {/* Lens document display */}
        <div style={{
          padding: "24px", border: `1px solid ${RULE}`, marginBottom: "24px",
          background: "#fafafa", maxHeight: "480px", overflowY: "auto",
        }}>
          <pre style={{
            fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Courier New', monospace",
            fontSize: "12px", lineHeight: 1.7, color: BLK, whiteSpace: "pre-wrap",
            wordBreak: "break-word", margin: 0,
          }}>
            {lensDoc}
          </pre>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
          <button onClick={downloadMarkdown} style={{
            flex: 1, padding: "13px", fontFamily: FONT, fontSize: "13px", fontWeight: 600,
            letterSpacing: "0.1em", textTransform: "uppercase", background: RED, color: "#fff",
            border: `1.5px solid ${RED}`, cursor: "pointer", borderRadius: 0,
          }}>
            Download .md
          </button>
          <button onClick={copyToClipboard} style={{
            flex: 1, padding: "13px", fontFamily: FONT, fontSize: "13px", fontWeight: 600,
            letterSpacing: "0.1em", textTransform: "uppercase", background: "#fff",
            color: GRY, border: `1.5px solid #ddd`, cursor: "pointer", borderRadius: 0,
          }}>
            {copyLabel}
          </button>
        </div>

        <button onClick={onStartOver} style={{
          width: "100%", padding: "11px", fontFamily: FONT, fontSize: "12px",
          color: GRY, background: "none", border: "none", cursor: "pointer",
          letterSpacing: "0.04em",
        }}>
          Start over
        </button>
      </div>
    );
  }

  // ── Active conversation ──
  return (
    <div style={{ ...containerStyle, display: "flex", flexDirection: "column", minHeight: "calc(100vh - 60px)" }}>
      {/* Section header */}
      <div style={{ borderBottom: `2px solid ${BLK}`, paddingBottom: "12px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: "10px", color: RED, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "6px", fontWeight: 600 }}>
              {sec.number} — {sec.label}
            </div>
            <h2 style={{ fontFamily: FONT, fontSize: "20px", fontWeight: 700, color: BLK, margin: 0 }}>
              Discovery
            </h2>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "11px", color: GRY, letterSpacing: "0.06em", marginBottom: "4px" }}>
              {currentSection + 1} / {SECTIONS.length}
            </div>
            <div style={{ width: "80px", height: "2px", background: RULE }}>
              <div style={{
                height: "100%", background: RED,
                width: `${((currentSection + 1) / SECTIONS.length) * 100}%`,
                transition: "width 0.6s ease",
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
        {loading && !greetingDone && !aiGreeting && (
          <div style={{ padding: "14px 16px", background: "#fafafa", border: `1px solid ${RULE}`, alignSelf: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ display: "flex", gap: "4px" }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{
                    width: "5px", height: "5px", background: RED, borderRadius: "50%",
                    animation: `bar 0.8s ease-in-out ${i * 0.2}s infinite alternate`,
                  }} />
                ))}
              </div>
              <span style={{ fontSize: "12px", color: GRY }}>Preparing your session...</span>
            </div>
          </div>
        )}
        {!greetingDone && aiGreeting && (
          <div style={{
            padding: "14px 16px", background: "#fafafa", border: `1px solid ${RULE}`,
            fontSize: "14px", lineHeight: 1.75, color: "#444",
          }}>
            <TypewriterText text={aiGreeting} />
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "85%",
            padding: "12px 16px",
            background: m.role === "user" ? BLK : "#fafafa",
            color: m.role === "user" ? "#fff" : "#444",
            border: m.role === "user" ? "none" : `1px solid ${RULE}`,
            fontSize: "14px",
            lineHeight: 1.75,
          }}>
            {m.content}
          </div>
        ))}
        {loading && greetingDone && (
          <div style={{ padding: "12px 16px", background: "#fafafa", border: `1px solid ${RULE}`, alignSelf: "flex-start" }}>
            <div style={{ display: "flex", gap: "4px" }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: "5px", height: "5px", background: GRY, borderRadius: "50%",
                  animation: `bar 0.8s ease-in-out ${i * 0.2}s infinite alternate`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Section complete — user advances */}
      {sectionComplete && (
        <div style={{ borderTop: `2px solid ${BLK}`, paddingTop: "20px", textAlign: "center" }}>
          <p style={{ fontSize: "12px", color: GRY, marginBottom: "14px", fontFamily: FONT }}>
            Section {currentSection + 1} of {SECTIONS.length} complete.
          </p>
          <button
            onClick={advanceSection}
            style={{
              padding: "13px 36px", fontFamily: FONT, fontSize: "13px", fontWeight: 600,
              letterSpacing: "0.1em", textTransform: "uppercase",
              background: RED, color: "#fff", border: `1.5px solid ${RED}`,
              cursor: "pointer", borderRadius: 0, transition: "all 0.15s ease",
            }}
          >
            {currentSection < SECTIONS.length - 1
              ? `Continue to ${SECTIONS[currentSection + 1].label}`
              : "Generate lens document"}
          </button>
        </div>
      )}

      {/* Input — hidden when section is complete */}
      {!sectionComplete && (
      <div style={{ borderTop: `1px solid ${RULE}`, paddingTop: "16px" }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Type your response..."
            disabled={loading || !greetingDone}
            rows={3}
            style={{
              flex: 1, padding: "12px 14px", fontFamily: FONT, fontSize: "14px",
              border: `1.5px solid #ddd`, borderRadius: 0, color: BLK,
              outline: "none", background: "#fff", resize: "vertical",
              lineHeight: 1.6, minHeight: "72px",
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim() || !greetingDone}
            style={{
              padding: "12px 20px", fontFamily: FONT, fontSize: "12px", fontWeight: 600,
              letterSpacing: "0.08em", textTransform: "uppercase",
              background: input.trim() && !loading ? RED : "#f5f5f5",
              color: input.trim() && !loading ? "#fff" : LT,
              border: input.trim() && !loading ? `1.5px solid ${RED}` : "1.5px solid #eee",
              cursor: input.trim() && !loading ? "pointer" : "default",
              borderRadius: 0, transition: "all 0.15s ease",
              alignSelf: "flex-end", minHeight: "44px",
            }}
          >
            Send
          </button>
        </div>
      </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════
// Main app
// ════════════════════════════════════════

export default function LensIntake() {
  const [phase, setPhase] = useState("intro");
  const [files, setFiles] = useState({
    resume: [], writing: [], assessments: [], other: [],
  });
  const [status, setStatus] = useState(null);
  const [previousFiles, setPreviousFiles] = useState(null); // metadata from prior session
  const [loaded, setLoaded] = useState(false);

  // ── Load saved progress on mount ──
  useEffect(() => {
    (async () => {
      try {
        const saved = await window.storage.get(STORAGE_KEY);
        if (saved && saved.value) {
          const data = JSON.parse(saved.value);
          if (data.phase) setPhase(data.phase);
          if (data.status) setStatus(data.status);
          if (data.fileMeta) setPreviousFiles(data.fileMeta);
        }
      } catch (e) {
        // No saved state — fresh start
      }
      setLoaded(true);
    })();
  }, []);

  // ── Save progress on every change ──
  useEffect(() => {
    if (!loaded) return;
    const fileMeta = {};
    for (const [cat, arr] of Object.entries(files)) {
      if (arr.length > 0) {
        fileMeta[cat] = arr.map(f => ({ name: f.name, size: f.size }));
      }
    }
    const data = { phase, status, fileMeta: Object.keys(fileMeta).length > 0 ? fileMeta : null };
    try {
      window.storage.set(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // Silent fail
    }
  }, [phase, status, files, loaded]);

  // ── Clear saved progress ──
  const handleStartOver = async () => {
    setPhase("intro");
    setFiles({ resume: [], writing: [], assessments: [], other: [] });
    setStatus(null);
    setPreviousFiles(null);
    try { await window.storage.delete(STORAGE_KEY); } catch (e) {}
  };

  const handleAdd = async (catId, newFiles) => {
    // Extract text from each file before adding to state
    const enriched = await Promise.all(
      newFiles.map(async (f) => {
        const text = await extractText(f);
        if (text) f._textContent = text;
        return f;
      })
    );

    setFiles(prev => {
      const cat = CATEGORIES.find(c => c.id === catId);
      if (!cat.multiple) return { ...prev, [catId]: [enriched[0]] };
      return { ...prev, [catId]: [...prev[catId], ...enriched] };
    });
    // Clear the "previous files" notice for this category once they re-upload
    if (previousFiles && previousFiles[catId]) {
      setPreviousFiles(prev => {
        const next = { ...prev };
        delete next[catId];
        return Object.keys(next).length > 0 ? next : null;
      });
    }
  };

  const handleRemove = (catId, index) => {
    setFiles(prev => ({ ...prev, [catId]: prev[catId].filter((_, i) => i !== index) }));
  };

  const totalFiles = Object.values(files).reduce((sum, arr) => sum + arr.length, 0);

  // Top progress indicator
  const phaseIndex = ["intro", "upload", "status", "discovery"].indexOf(phase);

  // Show nothing while loading saved state (prevents flash)
  if (!loaded) {
    return (
      <div style={{ background: "#fff", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: "12px", color: LT, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: FONT }}>
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      {/* Progress bar */}
      {phase !== "intro" && (
        <div style={{ position: "sticky", top: 0, zIndex: 10, background: "#fff", borderBottom: `1px solid ${RULE}` }}>
          <div style={{ maxWidth: "560px", margin: "0 auto", padding: "0 32px" }}>
            <div style={{ display: "flex", gap: "4px", padding: "12px 0", alignItems: "flex-start" }}>
              {["Materials", "Status", "Discovery"].map((label, i) => (
                <div key={label} style={{ flex: 1 }}>
                  <div style={{
                    height: "2px", marginBottom: "4px",
                    background: i < phaseIndex ? RED : i === phaseIndex ? RED : RULE,
                    opacity: i === phaseIndex ? 0.5 : 1,
                    transition: "all 0.3s ease",
                  }} />
                  <div style={{
                    fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase",
                    color: i <= phaseIndex ? BLK : LT,
                    fontWeight: i === phaseIndex ? 600 : 400,
                    fontFamily: FONT,
                  }}>
                    {label}
                  </div>
                </div>
              ))}
              <button onClick={handleStartOver} style={{
                background: "none", border: "none", color: LT, fontFamily: FONT,
                fontSize: "10px", cursor: "pointer", padding: "0", marginLeft: "8px",
                letterSpacing: "0.04em", whiteSpace: "nowrap",
              }}>
                Start over
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Returning user notice */}
      {phase === "upload" && previousFiles && (
        <div style={{ maxWidth: "560px", margin: "0 auto", padding: "0 32px" }}>
          <div style={{
            margin: "12px 0 0", padding: "12px 16px", background: "#fffaf5",
            border: `1px solid ${ORANGE}33`, fontSize: "12px", color: ORANGE, lineHeight: 1.6,
          }}>
            Welcome back. Your progress was saved, but uploaded files need to be re-added.
            {Object.entries(previousFiles).map(([cat, arr]) => (
              <span key={cat} style={{ display: "block", color: GRY, marginTop: "2px" }}>
                {CATEGORIES.find(c => c.id === cat)?.label}: {arr.map(f => f.name).join(", ")}
              </span>
            ))}
          </div>
        </div>
      )}

      {phase === "intro" && (
        <IntroPhase onContinue={() => setPhase("upload")} />
      )}

      {phase === "upload" && (
        <UploadPhase files={files} onAdd={handleAdd} onRemove={handleRemove}
          onContinue={() => setPhase("status")} onBack={() => setPhase("intro")} />
      )}

      {phase === "status" && (
        <StatusPhase status={status} setStatus={setStatus}
          onContinue={() => setPhase("discovery")} onBack={() => setPhase("upload")} />
      )}

      {phase === "discovery" && (
        <DiscoveryPhase status={status} totalFiles={totalFiles} files={files}
          onBack={() => setPhase("status")} onStartOver={handleStartOver} />
      )}

      <style>{`
        @keyframes bar { 0% { opacity: 0.15 } 100% { opacity: 1 } }
        input::placeholder, textarea::placeholder { color: #ccc }
      `}</style>
    </div>
  );
}

const containerStyle = {
  maxWidth: "560px",
  margin: "0 auto",
  padding: "40px 32px 64px",
  fontFamily: FONT,
  color: BLK,
};
