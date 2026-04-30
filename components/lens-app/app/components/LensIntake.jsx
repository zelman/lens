"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { PRINT_CSS } from "./lens-report-renderer";
import PremiumLensDocument from "./PremiumLensDocument";

const STORAGE_KEY = "lens-session";
const STORAGE_VERSION = "1.0";

// Maximum size for localStorage (~5MB limit, leave headroom)
const MAX_STORAGE_SIZE = 4 * 1024 * 1024; // 4MB

// ── Build info ──
const BUILD_ID = "2026.04.30-f";

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
  const MAX_CHARS = 50000; // Per-file limit; content budget handles total across files

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
    id: "linkedin",
    label: "LinkedIn profile",
    accept: ".pdf",
    hint: "Print your LinkedIn profile to PDF: Profile → More → Save to PDF. The AI can read it directly.",
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

// ── Content budget for uploaded materials ──
// Total cap ~60K chars (~15K tokens), leaving room for system prompt + instructions
const TOTAL_CONTENT_BUDGET = 60000;
// Priority order: resume densest signal, linkedin last (redundant with resume)
const CATEGORY_PRIORITY = ["resume", "assessments", "writing", "other", "linkedin"];

/**
 * Build file context string with priority-based budget allocation.
 * Fills budget in priority order, truncating large files rather than dropping.
 * Returns { text, stats } where stats contains metrics for telemetry.
 */
function buildFileContextWithBudget(files, categories) {
  const parts = [];
  let remainingBudget = TOTAL_CONTENT_BUDGET;
  let totalChars = 0;
  let preTruncationTotal = 0;
  const perFileStats = [];
  const TRUNCATION_MARKER = "\n\n[content truncated for length]";
  const MIN_USEFUL_CHARS = 200; // Don't include files if we can only fit < 200 chars
  let fileCount = 0;

  // Process categories in priority order
  for (const catId of CATEGORY_PRIORITY) {
    const arr = files[catId] || [];
    const catLabel = categories.find(c => c.id === catId)?.label || catId;

    for (const f of arr) {
      // Count all files with content (even if skipped)
      if (f._textContent) {
        fileCount++;
        preTruncationTotal += f._textContent.length;
      }

      // Skip if no content or budget exhausted
      if (!f._textContent) continue;
      if (remainingBudget < MIN_USEFUL_CHARS) {
        console.log(`[Content Budget] Skipping ${f.name}: only ${remainingBudget} chars remaining`);
        perFileStats.push({
          category: catId,
          filename: f.name,
          size_kb: Math.round(f.size / 1024),
          extracted_chars: f._textContent.length,
          truncated_to: 0,
        });
        continue;
      }

      const originalLength = f._textContent.length;
      let content = f._textContent;
      let truncated = false;

      // If content exceeds remaining budget, truncate with marker
      if (content.length > remainingBudget) {
        const truncateAt = Math.max(0, remainingBudget - TRUNCATION_MARKER.length);
        content = content.slice(0, truncateAt) + TRUNCATION_MARKER;
        truncated = true;
      }

      parts.push(`[${catLabel}: ${f.name}]\n${content}`);
      const usedChars = content.length;
      remainingBudget -= usedChars;
      totalChars += usedChars;

      perFileStats.push({
        category: catId,
        filename: f.name,
        size_kb: Math.round(f.size / 1024),
        extracted_chars: originalLength,
        truncated_to: truncated ? usedChars : null,
      });
    }
  }

  // Log stats for debugging (visible in browser console)
  if (perFileStats.length > 0) {
    console.log(`[Content Budget] Total: ${totalChars}/${TOTAL_CONTENT_BUDGET} chars used`);
    console.log(`[Content Budget] Files:`, perFileStats);
  }

  const text = parts.length > 0 ? parts.join("\n\n---\n\n") : "";
  const stats = {
    fileCount,
    preTruncationTotalChars: preTruncationTotal,
    totalExtractedChars: totalChars,
    charsTruncated: preTruncationTotal - totalChars,
    contentBudgetApplied: preTruncationTotal > totalChars,
    fileBreakdown: perFileStats,
  };

  return { text, stats };
}

// Generate UUID for session tracking
function generateSessionId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ── Discovery sections (UI display only - actual coaching prompts are server-side) ──
const SECTIONS = [
  { number: "01", label: "Essence", id: "essence", prompt: "What's the throughline across everything you do? The pattern people notice about how you work, regardless of title or context." },
  { number: "02", label: "Values", id: "values", prompt: "When you say something matters at work, what does that look like in practice? Values grounded in real stories and friction points." },
  { number: "03", label: "Mission", id: "mission", prompt: "What kind of problem do you want to be solving? What kind of organization would you actually say yes to?" },
  { number: "04", label: "Work Style", id: "workstyle", prompt: "How do you actually work best? Pace, people, autonomy, environment — the conditions where you thrive." },
  { number: "05", label: "What Fills You", id: "energy", prompt: "What gives you energy vs. what drains you — even if you're good at both. The difference between competence and fulfillment." },
  { number: "06", label: "Disqualifiers", id: "disqualifiers", prompt: "Your hard stops. What would make you walk away, even if the title and comp were perfect?" },
  { number: "07", label: "Goals", id: "goals", prompt: "What does success look like in your next chapter? Practical constraints like role level, compensation, location, and timeline." },
  { number: "08", label: "Synthesis", id: "synthesis", prompt: "The through-line across all sections. What patterns emerged? What feels most true?" },
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
  const kb = size / 1024;
  const display = kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
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
          Build your Lens
        </h1>
      </div>

      {/* What is it */}
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: 600, color: BLK, margin: "0 0 10px" }}>What is a Lens?</h2>
        <p style={{ fontSize: "14px", color: "#444", lineHeight: 1.75, margin: "0 0 12px", maxWidth: "500px" }}>
          A Lens is a structured document that captures who you actually are professionally. Not keywords optimized for an algorithm. Not a two-page summary of job titles. Your values, your patterns, your working identity — the things that don't change when you update your resume for the next application.
        </p>
        <p style={{ fontSize: "14px", color: "#444", lineHeight: 1.75, margin: 0, maxWidth: "500px" }}>
          Once built, your Lens can power daily job matching, personalized opportunity briefings, and smarter career decisions — because the system knows what actually matters to you, not just what you've done.
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
              title: "Your Lens document",
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

      {/* "I don't know" is valid guidance */}
      <div style={{
        padding: "14px 20px", background: "#fffaf5", marginBottom: "16px",
        fontSize: "12px", color: GRY, lineHeight: 1.6, border: `1px solid ${ORANGE}33`,
      }}>
        <span style={{ fontWeight: 600, color: BLK }}>Good to know:</span> You don't have to answer every question in depth. If something doesn't resonate or you're unsure, just say so — the AI will move on. There are no wrong answers, and "I don't know" is always valid.
      </div>

      <div style={{
        padding: "12px 20px", background: "#fafafa", marginBottom: "32px",
        fontSize: "12px", color: GRY, lineHeight: 1.6,
      }}>
        <span style={{ fontWeight: 500, color: BLK }}>If you close the tab:</span> Your place in the process and your selections are saved automatically. Uploaded files will need to be re-added when you return, so it helps to keep them handy. Conversation progress during discovery is also saved.
      </div>

      {/* Privacy notice */}
      <div style={{
        borderTop: `1px solid ${RULE}`,
        borderBottom: `1px solid ${RULE}`,
        padding: "20px 0",
        marginBottom: "24px",
      }}>
        <div style={{
          fontSize: "11px",
          color: RED,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontWeight: 600,
          marginBottom: "10px",
        }}>
          Your data, your control
        </div>
        <p style={{
          fontSize: "13px",
          color: GRY,
          lineHeight: 1.7,
          margin: 0,
          maxWidth: "500px",
        }}>
          This session is recorded to improve the Lens experience.
          Your conversation and Lens document are stored securely to help us refine the system.
          Your data is not sold or shared with third parties.
          Processing is handled by Claude (Anthropic) — the same privacy protections that apply to any Claude conversation apply here.
        </p>
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

function UploadPhase({ files, onAdd, onRemove, onContinue, onBack, savedFileContext, previousFiles }) {
  const [showUploadUI, setShowUploadUI] = useState(false);
  const totalFiles = Object.values(files).reduce((sum, arr) => sum + arr.length, 0);
  const fileSummary = CATEGORIES.filter(c => files[c.id].length > 0)
    .map(c => `${c.label} (${files[c.id].length})`).join(", ");

  // Check if we have saved file context from a previous session
  const hasSavedContext = savedFileContext && Object.keys(savedFileContext).length > 0;
  const savedFileNames = hasSavedContext
    ? Object.keys(savedFileContext).map(key => key.split(':')[1])
    : [];

  // If returning user with saved context and no new uploads, show simplified view
  if (hasSavedContext && totalFiles === 0 && !showUploadUI) {
    return (
      <div style={containerStyle}>
        <div style={{ marginBottom: "32px" }}>
          <div style={{ borderBottom: `2px solid ${BLK}`, paddingBottom: "12px", marginBottom: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: "10px", color: RED, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "6px", fontWeight: 600 }}>
                  Materials
                </div>
                <h1 style={{ fontFamily: FONT, fontSize: "26px", fontWeight: 700, color: BLK, margin: 0, lineHeight: 1.2 }}>
                  Your previous files are still loaded
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
            The AI has context from your previously uploaded files. You can continue with what you have or add new materials.
          </p>
        </div>

        <div style={{ padding: "16px 18px", border: `1px solid ${RULE}`, marginBottom: "28px", background: "#fafafa" }}>
          <div style={{ fontSize: "11px", color: GRY, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "8px" }}>
            Loaded from previous session
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {savedFileNames.map((name, i) => (
              <span key={i} style={{
                padding: "4px 10px", background: "#fff", border: `1px solid ${RULE}`,
                fontSize: "12px", color: BLK,
              }}>
                {name}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button onClick={onContinue} style={{
            width: "100%", padding: "14px", fontFamily: FONT, fontSize: "13px", fontWeight: 600,
            letterSpacing: "0.1em", textTransform: "uppercase", background: RED, color: "#fff",
            border: `1.5px solid ${RED}`, cursor: "pointer", borderRadius: 0,
          }}>
            Continue to discovery
          </button>
          <button onClick={() => setShowUploadUI(true)} style={{
            width: "100%", padding: "14px", fontFamily: FONT, fontSize: "13px", fontWeight: 500,
            letterSpacing: "0.08em", textTransform: "uppercase", background: "#fff", color: GRY,
            border: `1.5px solid #ddd`, cursor: "pointer", borderRadius: 0,
          }}>
            Add new materials
          </button>
        </div>
      </div>
    );
  }

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

      {/* Show saved files notice if returning user is adding more */}
      {hasSavedContext && (
        <div style={{ padding: "12px 16px", background: "#fafafa", border: `1px solid ${RULE}`, marginBottom: "20px" }}>
          <div style={{ fontSize: "12px", color: GRY }}>
            <strong style={{ color: BLK }}>Previous files still loaded:</strong> {savedFileNames.join(", ")}
          </div>
        </div>
      )}

      <div style={{ height: "1px", background: RULE, marginBottom: "20px" }} />

      {/* Upload guidance */}
      <div style={{ marginBottom: "24px" }}>
        <p style={{ fontSize: "12px", color: GRY, lineHeight: 1.7, margin: "0 0 8px", fontStyle: "italic" }}>
          The AI reads your materials closely — a focused selection of 15–20 pages of text works better than uploading everything. Your resume plus one or two of your strongest pieces is plenty.
        </p>
        <p style={{ fontSize: "12px", color: GRY, lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>
          Working with images or visual portfolios? The AI extracts text, not visuals — keep image files under 5MB each. You'll have a chance to describe your creative work during the conversation.
        </p>
      </div>

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
        {/* Primary CTA: Continue button */}
        <button onClick={onContinue} style={{
          width: "100%", padding: "13px", fontFamily: FONT, fontSize: "13px", fontWeight: 600,
          letterSpacing: "0.1em", textTransform: "uppercase", background: RED, color: "#fff",
          border: `1.5px solid ${RED}`, cursor: "pointer", transition: "all 0.15s ease", borderRadius: 0,
        }}>
          {totalFiles > 0 ? `Continue with ${totalFiles} file${totalFiles !== 1 ? "s" : ""}` :
           hasSavedContext ? "Continue with previous files" : "Continue"}
        </button>
        {/* Secondary option: Skip link (only when no files uploaded and no saved context) */}
        {totalFiles === 0 && !hasSavedContext && (
          <button onClick={onContinue} style={{
            width: "100%", padding: "12px", fontFamily: FONT, fontSize: "12px", fontWeight: 500,
            letterSpacing: "0.06em", background: "transparent", color: GRY,
            border: "none", cursor: "pointer", marginTop: "8px",
          }}>
            Skip — start from scratch
          </button>
        )}
        <p style={{ fontSize: "11px", color: LT, textAlign: "center", marginTop: "10px" }}>
          {totalFiles === 0 && !hasSavedContext
            ? "You can always come back and add materials later."
            : hasSavedContext
              ? "New files will be added to your existing context."
              : "If you close the tab, you'll need to re-add your files when you return. Everything else is saved automatically."}
        </p>
      </div>
    </div>
  );
}

const PRONOUN_OPTIONS = [
  { id: "he/him", label: "He/Him" },
  { id: "she/her", label: "She/Her" },
  { id: "they/them", label: "They/Them" },
];

// ════════════════════════════════════════
// Context Reflection Phase (between Status and Discovery)
// ════════════════════════════════════════

function ContextReflectionPhase({ files, userName, status, onContinue, onBack, onSkip, onReflectionResult }) {
  const [loading, setLoading] = useState(true);
  const [reflection, setReflection] = useState("");
  const [userCorrection, setUserCorrection] = useState("");
  const [hasContext, setHasContext] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  // Use ref for onSkip to avoid stale closure in auto-skip effect
  const onSkipRef = useRef(onSkip);
  onSkipRef.current = onSkip;

  // Build file context string from uploaded files (with content budget)
  const { text: fileContext } = useMemo(() => {
    return buildFileContextWithBudget(files, CATEGORIES);
  }, [files]);

  // Generate reflection on mount
  useEffect(() => {
    async function generateReflection() {
      if (!fileContext || fileContext.length < 100) {
        // No meaningful context - skip this phase
        setHasContext(false);
        setLoading(false);
        if (onReflectionResult) onReflectionResult("Skipped");
        return;
      }

      try {
        const res = await fetch("/api/discover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            section: "essence", // Use essence section as placeholder
            messages: [],
            action: "reflect",
            context: {
              status,
              uploadSummary: fileContext,
              userName,
            },
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to generate reflection");
        }

        const data = await res.json();
        setReflection(data.response);
        setHasContext(data.hasContext);
        if (onReflectionResult) onReflectionResult(data.hasContext ? "Success" : "Skipped");
      } catch (err) {
        console.error("Context reflection error:", err);
        setApiError(err.message);
        if (onReflectionResult) onReflectionResult("Failed");
      } finally {
        setLoading(false);
      }
    }

    generateReflection();
  }, [fileContext, status, userName, onReflectionResult]);

  // If no context, skip automatically after brief delay
  useEffect(() => {
    if (!loading && !hasContext && !apiError) {
      const timeout = setTimeout(() => {
        onSkipRef.current();
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [loading, hasContext, apiError]);

  // Handle continuation
  const handleContinue = () => {
    // Combine reflection with user corrections
    const finalContext = userCorrection.trim()
      ? `${reflection}\n\nUser corrections/additions: ${userCorrection.trim()}`
      : reflection;
    onContinue(finalContext);
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <div style={{ width: "48px", height: "2px", background: RED, margin: "0 auto 24px" }} />
          <h2 style={{ fontFamily: FONT, fontSize: "20px", fontWeight: 600, color: BLK, margin: "0 0 12px" }}>
            Reading your materials
          </h2>
          <p style={{ fontSize: "13px", color: GRY, lineHeight: 1.7 }}>
            Processing your resume, LinkedIn, and other uploads...
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

  if (!hasContext && !apiError) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ width: "48px", height: "2px", background: RED, margin: "0 auto 24px" }} />
          <h2 style={{ fontFamily: FONT, fontSize: "20px", fontWeight: 600, color: BLK, margin: "0 0 12px" }}>
            Starting from scratch
          </h2>
          <p style={{ fontSize: "13px", color: GRY, lineHeight: 1.7, maxWidth: "400px", margin: "0 auto" }}>
            No materials to review — I'll learn about you through our conversation.
          </p>
        </div>
      </div>
    );
  }

  if (apiError) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{
            padding: "16px 20px", background: "#FEF2F2", border: `1px solid ${RED}`,
            marginBottom: "20px",
          }}>
            <div style={{ fontSize: "13px", color: RED, fontWeight: 600, marginBottom: "8px" }}>
              Couldn't process materials
            </div>
            <div style={{ fontSize: "12px", color: "#7F1D1D", marginBottom: "16px" }}>
              {apiError}
            </div>
            <button
              onClick={onSkip}
              style={{
                padding: "10px 20px", fontFamily: FONT, fontSize: "12px", fontWeight: 600,
                background: RED, color: "#fff", border: "none", cursor: "pointer", borderRadius: 0,
              }}
            >
              Continue without context
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ borderBottom: `2px solid ${BLK}`, paddingBottom: "12px", marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "10px", color: RED, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "6px", fontWeight: 600 }}>
                Before we begin
              </div>
              <h1 style={{ fontFamily: FONT, fontSize: "26px", fontWeight: 700, color: BLK, margin: 0, lineHeight: 1.2 }}>
                Here's what I see
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
          Based on your uploaded materials, here's my understanding of who you are. Let me know if anything needs correcting before we dive deeper.
        </p>
      </div>

      {/* AI Reflection */}
      <div style={{
        padding: "20px 24px", background: "#fafafa", border: `1px solid ${RULE}`,
        marginBottom: "20px",
      }}>
        <div style={{ fontSize: "14px", color: "#444", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
          {reflection}
        </div>
      </div>

      {/* User correction input */}
      {!confirmed && (
        <div style={{ marginBottom: "24px" }}>
          <label style={{
            fontSize: "12px", fontWeight: 600, color: BLK, letterSpacing: "0.06em",
            textTransform: "uppercase", display: "block", marginBottom: "8px",
          }}>
            Anything to add or correct? <span style={{ fontWeight: 400, color: GRY }}>(optional)</span>
          </label>
          <textarea
            value={userCorrection}
            onChange={(e) => setUserCorrection(e.target.value)}
            placeholder="E.g., 'I'm actually looking to transition into product management...' or 'The CS leadership role was more recent than shown...'"
            rows={3}
            style={{
              width: "100%", padding: "12px 14px", fontFamily: FONT, fontSize: "14px",
              border: `1.5px solid #ddd`, borderRadius: 0, color: BLK,
              outline: "none", background: "#fff", resize: "vertical",
              lineHeight: 1.6, minHeight: "72px", boxSizing: "border-box",
            }}
          />
        </div>
      )}

      {/* Guidelines reminder */}
      <div style={{
        padding: "14px 18px", background: "#fffaf5", border: `1px solid ${ORANGE}33`,
        marginBottom: "24px", fontSize: "12px", color: GRY, lineHeight: 1.6,
      }}>
        <strong style={{ color: BLK }}>Good to know:</strong> During discovery, you don't have to answer every question in depth. If something doesn't resonate or you're unsure, just say so — the AI will move on. There are no wrong answers, and "I don't know" is always valid.
      </div>

      {/* Continue button */}
      <div style={{ borderTop: `2px solid ${BLK}`, paddingTop: "20px" }}>
        <button onClick={handleContinue} style={{
          width: "100%", padding: "14px", fontFamily: FONT, fontSize: "13px", fontWeight: 600,
          letterSpacing: "0.1em", textTransform: "uppercase", background: RED, color: "#fff",
          border: `1.5px solid ${RED}`, cursor: "pointer", borderRadius: 0,
        }}>
          {userCorrection.trim() ? "Continue with my corrections" : "This looks right — let's go"}
        </button>
        <button onClick={() => onSkip()} style={{
          width: "100%", padding: "12px", fontFamily: FONT, fontSize: "12px", fontWeight: 500,
          letterSpacing: "0.06em", background: "transparent", color: GRY,
          border: "none", cursor: "pointer", marginTop: "8px",
        }}>
          Skip and start discovery
        </button>
      </div>
    </div>
  );
}

function StatusPhase({ status, setStatus, userName, setUserName, pronouns, setPronouns, onContinue, onBack }) {
  const canContinue = status && userName.trim();

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
                A few quick details
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
          This shapes the conversation and how your Lens document is written.
        </p>
      </div>

      {/* Name input */}
      <div style={{ marginBottom: "24px" }}>
        <label style={{ fontSize: "12px", fontWeight: 600, color: BLK, letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
          Your name
        </label>
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="First and last name"
          style={{
            width: "100%", padding: "14px 16px", fontFamily: FONT, fontSize: "14px",
            border: `1.5px solid ${userName.trim() ? "#ddd" : RULE}`, borderRadius: 0,
            outline: "none", boxSizing: "border-box",
          }}
        />
      </div>

      {/* Pronouns */}
      <div style={{ marginBottom: "28px" }}>
        <label style={{ fontSize: "12px", fontWeight: 600, color: BLK, letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
          Pronouns <span style={{ fontWeight: 400, color: GRY }}>(for your Lens document)</span>
        </label>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {PRONOUN_OPTIONS.map(opt => (
            <button key={opt.id} onClick={() => setPronouns(opt.id)} style={{
              padding: "10px 16px", fontFamily: FONT, fontSize: "13px",
              background: pronouns === opt.id ? "rgba(217,48,37,0.04)" : "#fff",
              color: pronouns === opt.id ? RED : BLK,
              border: pronouns === opt.id ? `1.5px solid ${RED}` : "1.5px solid #ddd",
              cursor: "pointer", borderRadius: 0,
            }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: "1px", background: RULE, marginBottom: "24px" }} />

      {/* Status options */}
      <div style={{ marginBottom: "8px" }}>
        <label style={{ fontSize: "12px", fontWeight: 600, color: BLK, letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: "12px" }}>
          Current situation
        </label>
      </div>
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
        <button onClick={onContinue} disabled={!canContinue} style={{
          width: "100%", padding: "13px", fontFamily: FONT, fontSize: "13px", fontWeight: 600,
          letterSpacing: "0.1em", textTransform: "uppercase",
          background: canContinue ? RED : "#f5f5f5", color: canContinue ? "#fff" : LT,
          border: canContinue ? `1.5px solid ${RED}` : "1.5px solid #eee",
          cursor: canContinue ? "pointer" : "default",
          transition: "all 0.15s ease", borderRadius: 0,
        }}>
          Begin discovery
        </button>
      </div>
    </div>
  );
}

function DiscoveryPhase({
  status,
  userName,
  pronouns,
  totalFiles,
  files,
  contextReflection,
  onBack,
  onStartOver,
  // Session persistence props
  savedDiscoveryState,
  onDiscoveryStateChange,
  // Section re-entry props
  reentryMode,
  reentrySection,
  existingLens,
  onReentryComplete,
  onSelectAnotherSection,
  onSaveAndExit,
  // Telemetry props
  onFileStats,
  onDiscoverySectionTiming,
  onSynthesisStart,
  onSynthesisEnd,
  onApiError,
}) {
  const [subPhase, setSubPhase] = useState(savedDiscoveryState?.subPhase || "preview");
  const [currentSection, setCurrentSection] = useState(savedDiscoveryState?.currentSection || 0);
  const [messages, setMessages] = useState(savedDiscoveryState?.messages || []);
  const [sectionData, setSectionData] = useState(savedDiscoveryState?.sectionData || {});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null); // Error state for API failures
  const [aiGreeting, setAiGreeting] = useState("");
  const [greetingDone, setGreetingDone] = useState(savedDiscoveryState?.greetingDone || false);
  const [lensDoc, setLensDoc] = useState(savedDiscoveryState?.lensDoc || null);
  const [copyLabel, setCopyLabel] = useState("Copy markdown");
  const [viewMode, setViewMode] = useState("report"); // 'report' | 'markdown'
  const [sectionComplete, setSectionComplete] = useState(savedDiscoveryState?.sectionComplete || false);

  // ── Premium lens document state ──
  const [showPremiumDoc, setShowPremiumDoc] = useState(false);
  const [premiumMetadata, setPremiumMetadata] = useState(null);
  const [premiumNextSteps, setPremiumNextSteps] = useState(null);
  const [premiumResumeSuggestions, setPremiumResumeSuggestions] = useState(null);
  const [hasResumeData, setHasResumeData] = useState(false); // Track if resume was available
  const [isPremiumLoading, setIsPremiumLoading] = useState(false);
  const [premiumError, setPremiumError] = useState(null);

  // ── Timing instrumentation state ──
  const [sessionRecordId, setSessionRecordId] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sectionTimings, setSectionTimings] = useState({});
  const [currentSectionStart, setCurrentSectionStart] = useState(null);
  const [totalMessageCount, setTotalMessageCount] = useState(0);

  // Ref for startSection to avoid stale closures in re-entry useEffect
  const startSectionRef = useRef(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Update document title for PDF export when viewing completed lens
  useEffect(() => {
    if (subPhase === "done" && lensDoc && userName) {
      const originalTitle = document.title;
      document.title = `Lens Profile — ${userName}`;
      return () => {
        document.title = originalTitle;
      };
    }
  }, [subPhase, lensDoc, userName]);

  // Persist discovery state on changes
  useEffect(() => {
    if (onDiscoveryStateChange && subPhase !== "preview") {
      onDiscoveryStateChange({
        subPhase,
        currentSection,
        messages,
        sectionData,
        greetingDone,
        sectionComplete,
        lensDoc,
      });
    }
  }, [subPhase, currentSection, messages, sectionData, greetingDone, sectionComplete, lensDoc, onDiscoveryStateChange]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Handle re-entry mode — start conversation for the specific section
  useEffect(() => {
    if (reentryMode && reentrySection !== null && subPhase === "preview" && startSectionRef.current) {
      startSectionRef.current(reentrySection);
    }
  }, [reentryMode, reentrySection, subPhase]);

  // Build file context string from uploaded files (with content budget)
  const { text: fileContext, stats: fileStats } = useMemo(() => {
    return buildFileContextWithBudget(files, CATEGORIES);
  }, [files]);

  // Report file stats to parent for telemetry
  useEffect(() => {
    if (fileStats && onFileStats) {
      onFileStats(fileStats);
    }
  }, [fileStats, onFileStats]);

  // Report section timing to parent for telemetry
  useEffect(() => {
    if (onDiscoverySectionTiming && Object.keys(sectionTimings).length > 0) {
      // Convert sectionTimings object to array format for telemetry
      const timingArray = SECTIONS.map((sec, idx) => {
        const timing = sectionTimings[sec.id];
        if (!timing) return null;
        return {
          section: idx + 1,
          name: sec.label,
          start: timing.entryTime ? new Date(timing.entryTime).toISOString() : null,
          end: timing.completionTime ? new Date(timing.completionTime).toISOString() : null,
          duration_sec: Math.round(timing.duration || 0),
          messages: timing.messageCount || 0,
        };
      }).filter(Boolean);
      onDiscoverySectionTiming(timingArray);
    }
  }, [sectionTimings, onDiscoverySectionTiming]);

  // Extract structured document context for synthesis (memoized)
  const documentContext = useMemo(() => {
    if (!fileContext || fileContext.length < 100) return null;

    const ctx = {};
    const text = fileContext.toLowerCase();

    // Extract years of experience (look for patterns like "18+ years", "18 years")
    const yearsMatch = fileContext.match(/(\d{1,2})\+?\s*years?\s*(of\s*)?(experience|in)/i);
    if (yearsMatch) {
      ctx.years_experience = `${yearsMatch[1]}+ years`;
    } else {
      // Fallback: estimate from date ranges (e.g., "2008 - present" or "2010-2024")
      const dateRanges = fileContext.match(/20\d{2}\s*[-–—]\s*(present|20\d{2})/gi);
      if (dateRanges && dateRanges.length > 0) {
        // Find earliest year
        const years = dateRanges.flatMap(r => r.match(/20\d{2}/g) || []).map(Number);
        if (years.length > 0) {
          const earliest = Math.min(...years);
          const current = new Date().getFullYear();
          const experience = current - earliest;
          if (experience > 0) ctx.years_experience = `${experience}+ years`;
        }
      }
    }

    // Extract team size (look for patterns like "team of 24", "25-person team", "managed 15 people")
    const teamPatterns = [
      /team\s*(?:of\s*)?(\d{1,3})\b/i,
      /(\d{1,3})[-\s]?person\s*team/i,
      /(?:led|managed|built|scaled\s+(?:to)?)\s*(?:a\s+)?(?:team\s+(?:of\s+)?)?(\d{1,3})\s*(?:people|csms?|employees|reports|reps)/i,
      /(\d{1,3})\s*direct\s*reports/i,
      /from\s*(\d{1,2})\s*to\s*(\d{1,3})\s*(?:people|csms?|employees)/i,
    ];
    for (const pattern of teamPatterns) {
      const match = fileContext.match(pattern);
      if (match) {
        const size = match[2] ? match[2] : match[1]; // Use larger number if range (e.g., "from 2 to 24")
        if (parseInt(size) > 1) {
          ctx.largest_team = `${size}-person team`;
          break;
        }
      }
    }

    // Extract ARR/revenue (look for patterns like "$40M ARR", "$10M to $70M", "40 million")
    const arrPatterns = [
      /\$(\d{1,3}(?:\.\d)?)\s*(?:mm?|million|m)\s*arr/i,
      /(\d{1,3}(?:\.\d)?)\s*(?:mm?|million|m)\s*arr/i,
      /arr\s*(?:of\s*)?\$?(\d{1,3}(?:\.\d)?)\s*(?:mm?|million)/i,
      /\$(\d{1,3}(?:\.\d)?)\s*(?:mm?|million|m)\s*(?:book|portfolio|revenue)/i,
      /(?:grew|scaled|managed)\s*(?:to\s*)?\$?(\d{1,3}(?:\.\d)?)\s*(?:mm?|million)/i,
    ];
    for (const pattern of arrPatterns) {
      const match = fileContext.match(pattern);
      if (match) {
        ctx.arr_managed = `$${match[1]}M ARR`;
        break;
      }
    }

    // Extract NRR/retention (look for patterns like "120% NRR", "net retention 120%")
    const nrrPatterns = [
      /(\d{2,3})%?\s*(?:net\s*)?(?:revenue\s*)?retention/i,
      /nrr\s*(?:of\s*)?(\d{2,3})%?/i,
      /retention\s*(?:rate\s*)?(?:of\s*)?(\d{2,3})%/i,
    ];
    for (const pattern of nrrPatterns) {
      const match = fileContext.match(pattern);
      if (match && parseInt(match[1]) >= 80) {
        ctx.nrr_achieved = `${match[1]}% NRR`;
        break;
      }
    }

    // Extract geographic scope (look for regions, countries)
    const geoIndicators = [];
    if (text.includes('north america') || text.includes(' na ') || text.includes('(na)')) geoIndicators.push('NA');
    if (text.includes('emea') || text.includes('europe')) geoIndicators.push('EMEA');
    if (text.includes('apac') || text.includes('asia') || text.includes('pacific')) geoIndicators.push('APAC');
    if (text.includes('latam') || text.includes('latin america')) geoIndicators.push('LATAM');
    if (text.includes('global') || geoIndicators.length >= 3) {
      ctx.geographic_scope = 'Global';
    } else if (geoIndicators.length > 0) {
      ctx.geographic_scope = geoIndicators.join(' + ');
    }

    // Extract enterprise clients (look for well-known company names)
    const enterpriseNames = [
      'cisco', 'ibm', 'microsoft', 'google', 'amazon', 'apple', 'meta', 'facebook',
      'salesforce', 'oracle', 'sap', 'adobe', 'vmware', 'dell', 'hp', 'intel',
      'thomson reuters', 'bloomberg', 'harvard', 'stanford', 'mit',
      'jpmorgan', 'goldman sachs', 'morgan stanley', 'bank of america',
      'pfizer', 'johnson & johnson', 'merck', 'novartis', 'roche',
      'walmart', 'target', 'home depot', 'costco',
      'at&t', 'verizon', 'comcast', 't-mobile',
      'disney', 'netflix', 'spotify', 'uber', 'lyft', 'airbnb',
      'toyota', 'ford', 'gm', 'tesla', 'boeing', 'lockheed',
      'red cross', 'cedars sinai', 'mayo clinic', 'cleveland clinic'
    ];
    // Use word boundary matching to avoid false positives (e.g., "ford" in "afford")
    const wordBoundaryMatch = (str, term) => {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp('\\b' + escaped + '\\b', 'i').test(str);
    };
    const foundClients = enterpriseNames.filter(name => wordBoundaryMatch(fileContext, name));
    if (foundClients.length > 0) {
      // Capitalize properly
      ctx.enterprise_clients = foundClients.slice(0, 5).map(name =>
        name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      );
    }

    // Extract tools/platforms
    const tools = [];
    const toolPatterns = [
      'salesforce', 'gainsight', 'hubspot', 'zendesk', 'intercom', 'freshdesk',
      'tableau', 'looker', 'power bi', 'snowflake', 'databricks',
      'jira', 'asana', 'monday.com', 'notion', 'confluence',
      'slack', 'teams', 'zoom', 'webex',
      'aws', 'azure', 'gcp', 'kubernetes', 'docker'
    ];
    for (const tool of toolPatterns) {
      if (wordBoundaryMatch(fileContext, tool)) {
        tools.push(tool.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
      }
    }
    if (tools.length > 0) ctx.tools = tools.slice(0, 6);

    // Extract per-company role data (prevents career generalization hallucinations)
    // Look for patterns like: "Title at Company (dates)" or "Company | Title | dates"
    const companyRoles = [];
    const companyPatterns = [
      // "VP Customer Support at Bigtincan" or "Director of CS at Showpad"
      /(?:^|\n)([A-Z][^,\n]{5,40}?)\s+(?:at|@)\s+([A-Z][A-Za-z0-9\s&.]+?)(?:\s*[,|\-–—(]\s*((?:19|20)\d{2})\s*[-–—to]+\s*(present|(?:19|20)\d{2}))?/gim,
      // "Bigtincan | VP Customer Support | 2012-2025"
      /(?:^|\n)([A-Z][A-Za-z0-9\s&.]+?)\s*[|]\s*([A-Z][^|\n]{5,40}?)\s*[|]\s*((?:19|20)\d{2})\s*[-–—to]+\s*(present|(?:19|20)\d{2})/gim,
      // "Company Name\nTitle\n2020-Present" (resume format)
      /(?:^|\n)([A-Z][A-Za-z0-9\s&.]{3,30})\s*\n\s*([A-Z][^,\n]{5,40}?)\s*\n\s*((?:19|20)\d{2})\s*[-–—to]+\s*(present|(?:19|20)\d{2})/gim,
    ];

    // Common role function keywords for classification
    const roleFunctions = {
      sales: ['sales', 'account executive', 'ae', 'business development', 'bdr', 'sdr', 'quota', 'revenue'],
      cs: ['customer success', 'cs', 'csm', 'customer experience', 'cx', 'retention', 'renewal'],
      support: ['support', 'technical support', 'help desk', 'customer service'],
      engineering: ['engineer', 'developer', 'architect', 'swe', 'sde', 'devops'],
      product: ['product manager', 'product owner', 'pm', 'product lead'],
      marketing: ['marketing', 'demand gen', 'content', 'brand', 'communications'],
      leadership: ['vp', 'director', 'head of', 'chief', 'ceo', 'coo', 'cto', 'cmo', 'cro']
    };

    const classifyRole = (title) => {
      const lower = title.toLowerCase();
      for (const [func, keywords] of Object.entries(roleFunctions)) {
        if (keywords.some(k => lower.includes(k))) return func;
      }
      return 'other';
    };

    for (const pattern of companyPatterns) {
      let match;
      while ((match = pattern.exec(fileContext)) !== null) {
        const [, part1, part2, startYear, endYear] = match;
        // Determine which is company vs title based on pattern
        let company, title;
        if (pattern.source.includes('at|@')) {
          // "Title at Company" format
          title = part1.trim();
          company = part2.trim();
        } else {
          // "Company | Title" format
          company = part1.trim();
          title = part2.trim();
        }

        // Skip if company name is too short or looks like a date
        if (company.length < 3 || /^\d{4}/.test(company)) continue;

        // Skip duplicates
        if (companyRoles.some(r => r.company.toLowerCase() === company.toLowerCase())) continue;

        companyRoles.push({
          company,
          title,
          years: startYear && endYear ? `${startYear}-${endYear}` : null,
          function: classifyRole(title)
        });
      }
    }

    if (companyRoles.length > 0) {
      ctx.company_roles = companyRoles.slice(0, 10); // Limit to 10 most recent
    }

    return Object.keys(ctx).length > 0 ? ctx : null;
  }, [fileContext]);

  const parsedCount = Object.values(files).flat().filter(f => f._textContent).length;

  // ── Timing instrumentation: create session ──
  async function createSession() {
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buildId: BUILD_ID }),
      });
      if (res.ok) {
        const data = await res.json();
        setSessionRecordId(data.recordId);
        setSessionStartTime(Date.now());
        return data.recordId;
      }
    } catch (err) {
      console.warn("Failed to create session:", err);
    }
    return null;
  }

  // ── Timing instrumentation: update session ──
  async function updateSession(updates) {
    if (!sessionRecordId) return;
    try {
      await fetch("/api/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId: sessionRecordId, ...updates }),
      });
    } catch (err) {
      console.warn("Failed to update session:", err);
    }
  }

  // ── Timing instrumentation: beforeunload handler ──
  useEffect(() => {
    const handleUnload = () => {
      if (sessionRecordId && subPhase === "conversation") {
        // Use sendBeacon with Blob for correct Content-Type
        const blob = new Blob([JSON.stringify({
          recordId: sessionRecordId,
          abandoned: true,
          dropOffSection: currentSection,
          sectionTimings,
          totalMessages: totalMessageCount,
        })], { type: "application/json" });
        navigator.sendBeacon("/api/session", blob);
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [sessionRecordId, subPhase, currentSection, sectionTimings, totalMessageCount]);

  // Call the discover API (system prompts are server-side)
  async function callDiscover(sectionId, messages, action = null, extraContext = {}) {
    const prevContext = Object.entries(sectionData)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    const res = await fetch("/api/discover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section: sectionId,
        messages,
        action,
        context: {
          status,
          establishedContext: prevContext || null,
          uploadSummary: fileContext || null,
          contextReflection: contextReflection || null,
          reentryMode: reentryMode || false,
          existingLens: existingLens || null,
          userName,
          ...extraContext,
        },
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `API error (${res.status})`);
    }

    const data = await res.json();
    return data;
  }

  async function startSection(idx) {
    setCurrentSection(idx);
    setSubPhase("conversation");
    setMessages([]);
    setGreetingDone(false);
    setSectionComplete(false);
    setApiError(null);
    setLoading(true);

    // ── Timing: record section entry ──
    const sectionStart = Date.now();
    setCurrentSectionStart(sectionStart);

    // Create session on first section (only for non-reentry mode)
    if (idx === 0 && !reentryMode && !sessionRecordId) {
      await createSession();
    }

    try {
      const sec = SECTIONS[idx];
      const data = await callDiscover(sec.id, [], "greeting");
      setAiGreeting(data.response);
    } catch (err) {
      console.error("startSection error:", err);
      setApiError(err.message || "Failed to start section. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Keep ref updated for re-entry useEffect
  startSectionRef.current = startSection;

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

    // ── Timing: increment message count ──
    const newMessageCount = totalMessageCount + 1;
    setTotalMessageCount(newMessageCount);

    // Skip to synthesis with test data (used for demos)
    if (input.trim().toLowerCase() === "/skip") {
      setInput("");
      const testData = {
        "Essence": `NARRATIVE: I'm a builder who thrives in early-stage chaos. I've spent my career taking customer success functions from zero to scale, and I'm at my best when there's no playbook yet. I need ownership and autonomy — being handed someone else's process to maintain drains me.

SIGNALS:
- Builder archetype, not maintainer
- Early-stage preference (Series A-B)
- Needs high autonomy
- 18+ years experience
- Customer Success / Support leadership`,

        "Skills & Experience": `NARRATIVE: I built Bigtincan's support org from 1 to 25 people across three continents over 13 years. Before that, I cut my teeth at Apple managing enterprise education accounts at Harvard and Tufts. I've led ISO 27001 and SOC-2 implementations, managed $2M budgets, and maintained 93%+ CSAT across 15,000+ annual cases.

SIGNALS:
- Team building: 1 → 25 people
- Budget management: $2M
- Compliance: ISO 27001, SOC-2
- CSAT: 93%+
- Case volume: 15,000+/year
- Industries: EdTech, B2B SaaS`,

        "Values": `NARRATIVE: Ownership comes first — I need to shape the function, not execute someone else's playbook. Candor is non-negotiable; I've left roles where raising problems got you labeled as difficult. I believe in constructive friction over false harmony.

SIGNALS:
- High ownership requirement
- Candor-friendly culture required
- Psychological safety priority
- Anti-political environment
- Values humans over metrics`,

        "Mission & Direction": `NARRATIVE: I'm drawn to VC-backed Series A to early Series B companies — 30-100 people, under $75M raised — solving real problems for non-technical business users. Healthcare operations, compliance-heavy environments, workforce enablement tools where users didn't choose the software but have to live with it.

SIGNALS:
- Stage: Series A to early B
- Size: 30-100 employees
- Funding: <$75M
- Sectors: Healthcare ops, compliance, workforce tools
- Users: Non-technical business users`,

        "Work Style": `NARRATIVE: I've worked remotely for 25 years — it's how I'm wired. Best deep work happens in coffee shops, best reactive work in small video calls under 5 people. I thrive on a 70/30 split between strategic work and firefighting. I have ADHD, which means I'm either locked in or unmoored — dynamic work with quick feedback loops keeps me engaged.

SIGNALS:
- Remote required
- Async communication preferred
- Small meeting preference (<5 people)
- 70/30 strategy/reactive split
- ADHD-friendly environment needed`,

        "What Fills You": `NARRATIVE: Building from scratch energizes me. The zero-to-one phase where there's no playbook, real pressure, and visible impact. I love coaching team members through escalations in the afternoon after building frameworks in the morning.

SIGNALS:
- Zero-to-one building
- Visible impact required
- Coaching/mentoring
- Variety in work
- Quick feedback loops`,

        "Disqualifiers": `NARRATIVE: PE-backed companies are out — the extraction timeline corrupts CS before you can build anything. Companies over 150 people or $75M raised are too established unless there's a rebuild situation. Sub-$125K base signals CS is a cost center. No pure IC roles without team-building path.

SIGNALS:
- No PE-backed companies
- No companies >150 employees (unless rebuild)
- No companies >$75M raised (unless new product)
- Base salary minimum: $125K
- Title minimum: Director
- No pure IC roles`,

        "Situation & Timeline": `NARRATIVE: Actively searching after a layoff. No hard timeline but ready to move quickly for the right opportunity. Remote required, US-based. Looking for Director+ title with real ownership.

SIGNALS:
- Status: Actively searching
- Timeline: Flexible but ready
- Location: Remote, US
- Title: Director+
- Availability: Immediate`,
      };

      setSectionData(testData);
      generateLens(testData);  // Pass directly to avoid race condition
      return;
    }

    const sec = SECTIONS[currentSection];
    const userMsg = input.trim();
    setInput("");
    const newMsgs = [...messages, { role: "user", content: userMsg }];
    setMessages(newMsgs);
    setApiError(null);
    setLoading(true);

    try {
      // Call the discover API (system prompts handled server-side)
      const data = await callDiscover(sec.id, newMsgs);
      const isComplete = data.sectionComplete;
      const cleanReply = data.response;

      setMessages([...newMsgs, { role: "assistant", content: cleanReply }]);

      if (isComplete) {
        // Get the section summary
        const summaryData = await callDiscover(
          sec.id,
          [...newMsgs, { role: "assistant", content: cleanReply }],
          "summarize"
        );
        setSectionData((prev) => ({ ...prev, [sec.label]: summaryData.response }));

        // Signal section is done — user decides when to advance
        setSectionComplete(true);
      }
    } catch (err) {
      console.error("sendMessage error:", err);
      setApiError(err.message || "Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function advanceSection() {
    // ── Timing: record section completion ──
    if (currentSectionStart) {
      const sectionEnd = Date.now();
      const duration = (sectionEnd - currentSectionStart) / 1000; // seconds
      const sec = SECTIONS[currentSection];
      const newTimings = {
        ...sectionTimings,
        [sec.id]: {
          entryTime: currentSectionStart,
          completionTime: sectionEnd,
          duration,
          messageCount: messages.filter(m => m.role === "user").length,
        },
      };
      setSectionTimings(newTimings);

      // Update session in Airtable
      updateSession({
        currentSection,
        sectionTimings: newTimings,
        totalMessages: totalMessageCount,
      });
    }

    if (reentryMode && existingLens) {
      // Re-entry mode: merge the updated section into existing lens
      mergeUpdatedSection();
    } else if (currentSection < SECTIONS.length - 1) {
      startSection(currentSection + 1);
    } else {
      generateLens();
    }
  }

  async function mergeUpdatedSection() {
    setSubPhase("synthesis");
    setApiError(null);
    setLoading(true);

    try {
      const sec = SECTIONS[currentSection];
      const updatedContent = sectionData[sec.label] || "";

      // Call merge API (system prompt is server-side)
      const res = await fetch("/api/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          existingLens,
          sectionLabel: sec.label,
          updatedContent,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `API error (${res.status})`);
      }

      const data = await res.json();
      setLensDoc(data.lens);
      setSubPhase("done");

      // Notify parent of completion
      if (onReentryComplete) {
        onReentryComplete(data.lens);
      }
    } catch (err) {
      console.error("mergeUpdatedSection error:", err);
      setApiError(err.message || "Failed to merge section. Please try again.");
      setSubPhase("conversation"); // Go back to conversation so user can retry
    } finally {
      setLoading(false);
    }
  }

  async function generateLens(overrideData = null) {
    setSubPhase("synthesis");
    setApiError(null);
    setLoading(true);

    // Telemetry: mark synthesis start
    if (onSynthesisStart) onSynthesisStart();

    // Use override data if provided (for /skip command), otherwise use state
    const dataToUse = overrideData || sectionData;

    try {
      // Call the synthesize API (system prompt is server-side)
      // Include document context for evidence-grounded synthesis
      const res = await fetch("/api/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionData: dataToUse,
          userName,
          pronouns,
          status,
          // Pass document data for evidence integration
          documentContext: documentContext || null,
          rawDocumentText: fileContext || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMsg = errorData.error || `API error (${res.status})`;
        // Telemetry: log API error
        if (onApiError) onApiError("/api/synthesize", res.status, errorMsg);
        throw new Error(errorMsg);
      }

      const data = await res.json();
      setLensDoc(data.lens);
      setSubPhase("done");

      // Telemetry: mark synthesis end (success)
      if (onSynthesisEnd) onSynthesisEnd(true);

      // ── Timing: mark session as complete ──
      if (sessionRecordId) {
        updateSession({
          isComplete: true,
          currentSection: SECTIONS.length - 1,
          sectionTimings,
          totalMessages: totalMessageCount,
        });
      }
    } catch (err) {
      console.error("generateLens error:", err);
      setApiError(err.message || "Failed to generate lens. Please try again.");
      setSubPhase("conversation"); // Go back so user can retry
      // Telemetry: mark synthesis end (failure) - don't log here, user may retry
    } finally {
      setLoading(false);
    }
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

  // ── Premium Lens Document generation ──
  async function generatePremiumDoc() {
    if (isPremiumLoading || !lensDoc) return;

    setIsPremiumLoading(true);
    setPremiumError(null);

    try {
      // Step 1: Generate premium synthesis with metadata
      console.log("[Premium] Generating premium synthesis...");
      const premiumSynthRes = await fetch("/api/synthesize-premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionData,
          userName,
          pronouns,
          status,
          documentContext: documentContext || null,
          rawDocumentText: fileContext || null,
        }),
      });

      if (!premiumSynthRes.ok) {
        const errorData = await premiumSynthRes.json().catch(() => ({}));
        throw new Error(errorData.error || `Premium synthesis failed: ${premiumSynthRes.status}`);
      }

      const premiumData = await premiumSynthRes.json();
      const premiumLens = premiumData.lens;
      const metadata = premiumData.metadata || null;
      setPremiumMetadata(metadata);
      // Also update the lens doc to use the premium version
      setLensDoc(premiumLens);
      console.log("[Premium] Premium synthesis complete, metadata:", metadata ? "present" : "null");

      // Step 2: Generate next steps using premium lens + metadata
      console.log("[Premium] Generating next steps...");
      const nextStepsRes = await fetch("/api/next-steps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lensMarkdown: premiumLens,
          metadata: metadata,
        }),
      });

      if (!nextStepsRes.ok) {
        throw new Error(`Next steps failed: ${nextStepsRes.status}`);
      }

      const nextStepsData = await nextStepsRes.json();
      setPremiumNextSteps(nextStepsData);
      console.log("[Premium] Next steps generated");

      // Step 3: Generate resume suggestions (if we have resume text)
      // DEBUG: Log resume context availability
      console.log("[Premium] Resume debug: fileContext exists?", !!fileContext);
      console.log("[Premium] Resume debug: fileContext length:", fileContext?.length || 0);

      if (fileContext && fileContext.length > 100) {
        setHasResumeData(true); // Mark that resume data was available
        console.log("[Premium] Generating resume suggestions...");
        console.log("[Premium] Resume debug: Calling /api/resume-suggestions with resumeText length:", fileContext.length);

        const resumeRes = await fetch("/api/resume-suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lensMarkdown: premiumLens,
            resumeText: fileContext,
            metadata: metadata,
          }),
        });

        console.log("[Premium] Resume debug: API response status:", resumeRes.status);

        if (resumeRes.ok) {
          const resumeData = await resumeRes.json();
          console.log("[Premium] Resume debug: API response data:", JSON.stringify(resumeData).slice(0, 500));
          console.log("[Premium] Resume debug: suggestions array?", Array.isArray(resumeData?.suggestions));
          console.log("[Premium] Resume debug: suggestions count:", resumeData?.suggestions?.length || 0);

          setPremiumResumeSuggestions(resumeData);
          console.log("[Premium] Resume suggestions generated and stored");
        } else {
          const errorText = await resumeRes.text();
          console.warn("[Premium] Resume suggestions failed:", resumeRes.status, errorText);
        }
      } else {
        console.log("[Premium] Resume debug: Skipping resume suggestions - no fileContext or too short");
      }

      // Show the premium document
      console.log("[Premium] About to show premium doc, resumeSuggestions will be:", premiumResumeSuggestions ? "set" : "null");
      setShowPremiumDoc(true);

    } catch (err) {
      console.error("[Premium] Generation failed:", err);
      setPremiumError(err.message || "Failed to generate premium document");
    } finally {
      setIsPremiumLoading(false);
    }
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
            Building your Lens document from everything you shared across all 8 sections...
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
      <>
        <style>{PRINT_CSS}</style>
        <div style={containerStyle}>
          <div style={{ borderBottom: `2px solid ${BLK}`, paddingBottom: "12px", marginBottom: "28px" }}>
            <div style={{ fontSize: "10px", color: RED, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "6px", fontWeight: 600 }}>
              Complete
            </div>
            <h1 style={{ fontFamily: FONT, fontSize: "26px", fontWeight: 700, color: BLK, margin: 0, lineHeight: 1.2 }}>
              Your Lens document
            </h1>
          </div>

          <p style={{ fontSize: "13px", color: GRY, lineHeight: 1.7, marginBottom: "24px" }}>
            This is yours. Download the premium PDF to share with recruiters.
          </p>

          {/* Inline premium document preview */}
          {lensDoc ? (
            <PremiumLensDocument
              lensMarkdown={lensDoc}
              metadata={premiumMetadata}
              inline={true}
              buildId={BUILD_ID}
            />
          ) : (
            <div style={{ padding: "24px", border: `1px solid ${RULE}`, marginBottom: "24px", background: "#fafafa" }}>
              <p style={{ fontSize: "13px", color: GRY }}>
                Unable to load Lens document.
              </p>
            </div>
          )}

          {/* Premium PDF button */}
          <div style={{ marginBottom: "16px" }} className="no-print">
            <button
              onClick={generatePremiumDoc}
              disabled={isPremiumLoading}
              style={{
                width: "100%", padding: "15px", fontFamily: FONT, fontSize: "14px", fontWeight: 600,
                letterSpacing: "0.1em", textTransform: "uppercase",
                background: isPremiumLoading ? "#f5f5f5" : RED, color: isPremiumLoading ? GRY : "#fff",
                border: `1.5px solid ${isPremiumLoading ? "#ddd" : RED}`,
                cursor: isPremiumLoading ? "default" : "pointer", borderRadius: 0,
                transition: "all 0.15s ease",
              }}
            >
              {isPremiumLoading ? "Generating document..." : "Download PDF"}
            </button>
            {premiumError && (
              <p style={{ fontSize: "12px", color: "#c00", marginTop: "8px" }}>
                {premiumError}
              </p>
            )}
          </div>

          {/* Feedback link */}
          {!reentryMode && (
            <div style={{
              marginTop: "24px", padding: "16px 20px", background: "#fafafa",
              border: `1px solid ${RULE}`, marginBottom: "16px",
            }} className="no-print">
              <p style={{ fontSize: "13px", color: BLK, margin: "0 0 10px", fontWeight: 500 }}>
                Help us improve
              </p>
              <p style={{ fontSize: "12px", color: GRY, margin: "0 0 12px", lineHeight: 1.6 }}>
                Your feedback shapes what this becomes. Takes 2 minutes.
              </p>
              <a
                href={`https://lens-feedback.vercel.app${sessionRecordId ? `?session=${sessionRecordId}` : ""}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block", padding: "10px 20px", fontFamily: FONT,
                  fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em",
                  textTransform: "uppercase", background: "#fff", color: RED,
                  border: `1.5px solid ${RED}`, cursor: "pointer", borderRadius: 0,
                  textDecoration: "none",
                }}
              >
                Give feedback
              </a>
            </div>
          )}

          {reentryMode ? (
            <div style={{ display: "flex", gap: "10px" }} className="no-print">
              <button onClick={() => {
                onReentryComplete && onReentryComplete(lensDoc);
              }} style={{
                flex: 1, padding: "11px", fontFamily: FONT, fontSize: "12px",
                color: GRY, background: "none", border: "1px solid #ddd", cursor: "pointer",
                letterSpacing: "0.04em",
              }}>
                Done
              </button>
              <button onClick={() => {
                onReentryComplete && onReentryComplete(lensDoc);
                onSelectAnotherSection && onSelectAnotherSection();
              }} style={{
                flex: 1, padding: "11px", fontFamily: FONT, fontSize: "12px",
                color: RED, background: "none", border: `1px solid ${RED}`, cursor: "pointer",
                letterSpacing: "0.04em",
              }}>
                Update another section
              </button>
            </div>
          ) : (
            <button onClick={onStartOver} style={{
              width: "100%", padding: "11px", fontFamily: FONT, fontSize: "12px",
              color: GRY, background: "none", border: "none", cursor: "pointer",
              letterSpacing: "0.04em",
            }} className="no-print">
              Start over
            </button>
          )}
        </div>

        {/* Premium Lens Document Modal */}
        {showPremiumDoc && (
          <PremiumLensDocument
            lensMarkdown={lensDoc}
            metadata={premiumMetadata}
            nextSteps={premiumNextSteps}
            resumeSuggestions={premiumResumeSuggestions}
            hasResumeData={hasResumeData}
            onClose={() => setShowPremiumDoc(false)}
            buildId={BUILD_ID}
          />
        )}
      </>
    );
  }

  // ── Active conversation ──
  return (
    <div style={{ ...containerStyle, display: "flex", flexDirection: "column", minHeight: "calc(100vh - 60px)" }}>
      {/* Section header with Save and exit */}
      <div style={{ borderBottom: `2px solid ${BLK}`, paddingBottom: "12px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "10px", color: RED, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "6px", fontWeight: 600 }}>
              {reentryMode ? `Updating: ${sec.label}` : `${sec.number} — ${sec.label}`}
            </div>
            <h2 style={{ fontFamily: FONT, fontSize: "20px", fontWeight: 700, color: BLK, margin: 0 }}>
              {reentryMode ? "Section Update" : "Discovery"}
            </h2>
          </div>
          <button
            onClick={onSaveAndExit}
            style={{
              background: "none", border: "none", color: GRY, fontFamily: FONT,
              fontSize: "11px", cursor: "pointer", padding: "4px 0",
              letterSpacing: "0.04em", whiteSpace: "nowrap",
            }}
          >
            Save and exit
          </button>
        </div>
        {!reentryMode && (
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px" }}>
            <div style={{ fontSize: "11px", color: GRY, letterSpacing: "0.06em" }}>
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
        )}
      </div>

      {/* Privacy reminder - shown only in first section */}
      {currentSection === 0 && messages.length === 0 && !loading && (
        <div style={{
          fontSize: "11px",
          color: LT,
          marginBottom: "12px",
          paddingBottom: "12px",
          borderBottom: `1px solid ${RULE}`,
        }}>
          Your responses are used only to build your Lens document.
        </div>
      )}

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
        {/* API Error Banner */}
        {apiError && (
          <div style={{
            padding: "12px 16px", background: "#FEF2F2", border: `1px solid ${RED}`,
            alignSelf: "stretch",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
              <div>
                <div style={{ fontSize: "13px", color: RED, fontWeight: 600, marginBottom: "4px" }}>
                  Something went wrong
                </div>
                <div style={{ fontSize: "12px", color: "#7F1D1D" }}>
                  {apiError}
                </div>
              </div>
              <button
                onClick={() => setApiError(null)}
                style={{
                  background: "none", border: "none", color: RED, fontSize: "18px",
                  cursor: "pointer", padding: "4px 8px", lineHeight: 1,
                }}
              >
                &times;
              </button>
            </div>
            <button
              onClick={() => {
                setApiError(null);
                // Retry last action - re-trigger the greeting or re-send last message
                if (messages.length === 0 && !greetingDone) {
                  // Retry initial greeting
                  startSectionRef.current(currentSection);
                } else if (messages.length > 0) {
                  // Re-send the last user message by putting it back in input
                  // Find the index of the last user message and remove from there onward
                  const lastUserIdx = messages.map(m => m.role).lastIndexOf("user");
                  if (lastUserIdx !== -1) {
                    const lastUserContent = messages[lastUserIdx].content;
                    setMessages(messages.slice(0, lastUserIdx));
                    setInput(lastUserContent);
                  }
                }
              }}
              style={{
                padding: "8px 16px", fontFamily: FONT, fontSize: "12px", fontWeight: 600,
                background: RED, color: "#fff", border: "none", cursor: "pointer",
                borderRadius: 0,
              }}
            >
              Retry
            </button>
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
            {reentryMode
              ? "Update Lens document"
              : currentSection < SECTIONS.length - 1
                ? `Continue to ${SECTIONS[currentSection + 1].label}`
                : "Generate Lens document"}
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
// Confirmation Modal
// ════════════════════════════════════════

function ConfirmationModal({ title, message, confirmLabel, cancelLabel, onConfirm, onCancel, destructive }) {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: "20px",
    }}>
      <div style={{
        background: "#fff", maxWidth: "400px", width: "100%", padding: "32px",
        border: `2px solid ${BLK}`,
      }}>
        <h2 style={{ fontFamily: FONT, fontSize: "20px", fontWeight: 700, color: BLK, margin: "0 0 16px" }}>
          {title}
        </h2>
        <p style={{ fontSize: "14px", color: "#444", lineHeight: 1.7, margin: "0 0 28px" }}>
          {message}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button onClick={onConfirm} style={{
            width: "100%", padding: "14px", fontFamily: FONT, fontSize: "13px", fontWeight: 600,
            letterSpacing: "0.1em", textTransform: "uppercase",
            background: destructive ? RED : BLK, color: "#fff",
            border: `1.5px solid ${destructive ? RED : BLK}`, cursor: "pointer", borderRadius: 0,
          }}>
            {confirmLabel}
          </button>
          <button onClick={onCancel} style={{
            width: "100%", padding: "14px", fontFamily: FONT, fontSize: "13px", fontWeight: 500,
            letterSpacing: "0.08em", textTransform: "uppercase", background: "#fff", color: GRY,
            border: `1.5px solid #ddd`, cursor: "pointer", borderRadius: 0,
          }}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════
// Session Recovery UI
// ════════════════════════════════════════

function SessionRecoveryPrompt({ savedSession, onContinue, onStartFresh }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const lastUpdated = savedSession?.lastUpdated
    ? new Date(savedSession.lastUpdated).toLocaleString()
    : "Unknown";

  const sectionLabel = savedSession?.discoveryState?.currentSection !== undefined
    ? SECTIONS[savedSession.discoveryState.currentSection]?.label || "Unknown"
    : null;

  const hasLens = !!savedSession?.lensOutput;
  const inDiscovery = savedSession?.phase === "discovery" && savedSession?.discoveryState?.subPhase === "conversation";
  const isStale = savedSession?._isStale;

  return (
    <>
      {showConfirm && (
        <ConfirmationModal
          title="Start fresh?"
          message="This will erase your session, including all conversation history and any Lens document you've created. This cannot be undone."
          confirmLabel="Yes, start fresh"
          cancelLabel="Keep my session"
          onConfirm={onStartFresh}
          onCancel={() => setShowConfirm(false)}
          destructive
        />
      )}
      <div style={containerStyle}>
        <div style={{ borderBottom: `2px solid ${BLK}`, paddingBottom: "12px", marginBottom: "32px" }}>
          <div style={{ fontSize: "10px", color: RED, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "6px", fontWeight: 600 }}>
            Welcome Back
          </div>
          <h1 style={{ fontFamily: FONT, fontSize: "28px", fontWeight: 700, color: BLK, margin: 0, lineHeight: 1.2 }}>
            Resume your session?
          </h1>
        </div>

        {/* Stale session warning */}
        {isStale && (
          <div style={{
            padding: "14px 18px", background: "#fffaf5", border: `1px solid ${ORANGE}`,
            marginBottom: "20px", fontSize: "13px", color: ORANGE, lineHeight: 1.6,
          }}>
            <strong>This session is over 7 days old.</strong> Your progress is still here, but you may want to start fresh if your situation has changed.
          </div>
        )}

        <div style={{ marginBottom: "28px" }}>
          <p style={{ fontSize: "14px", color: "#444", lineHeight: 1.75, margin: "0 0 16px", maxWidth: "500px" }}>
            We found a previous session from <strong>{lastUpdated}</strong>.
          </p>

          {hasLens && (
            <div style={{ padding: "14px 18px", border: `1px solid ${RULE}`, marginBottom: "16px", background: "#fafafa" }}>
              <div style={{ fontSize: "11px", color: GRY, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "4px" }}>
                Completed Lens document
              </div>
              <div style={{ fontSize: "14px", color: BLK, fontWeight: 500 }}>
                Ready to download or refine
              </div>
            </div>
          )}

          {inDiscovery && !hasLens && (
            <div style={{ padding: "14px 18px", border: `1px solid ${RULE}`, marginBottom: "16px", background: "#fafafa" }}>
              <div style={{ fontSize: "11px", color: GRY, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "4px" }}>
                In progress
              </div>
              <div style={{ fontSize: "14px", color: BLK, fontWeight: 500 }}>
                Discovery section: {sectionLabel}
              </div>
              <div style={{ fontSize: "12px", color: GRY, marginTop: "4px" }}>
                {savedSession.discoveryState?.messages?.length || 0} messages in conversation
              </div>
            </div>
          )}

          {!inDiscovery && !hasLens && (
            <div style={{ padding: "14px 18px", border: `1px solid ${RULE}`, marginBottom: "16px", background: "#fafafa" }}>
              <div style={{ fontSize: "11px", color: GRY, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "4px" }}>
                Status
              </div>
              <div style={{ fontSize: "14px", color: BLK, fontWeight: 500 }}>
                {savedSession.phase === "upload" && "Ready to upload materials"}
                {savedSession.phase === "status" && "Selecting employment status"}
                {savedSession.phase === "discovery" && "Ready to begin discovery"}
              </div>
            </div>
          )}
        </div>

        <div style={{ height: "1px", background: RULE, marginBottom: "28px" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button onClick={onContinue} style={{
            width: "100%", padding: "14px", fontFamily: FONT, fontSize: "13px", fontWeight: 600,
            letterSpacing: "0.1em", textTransform: "uppercase", background: RED, color: "#fff",
            border: `1.5px solid ${RED}`, cursor: "pointer", borderRadius: 0,
          }}>
            {hasLens ? "View my Lens" : "Continue where I left off"}
          </button>
          <button onClick={() => setShowConfirm(true)} style={{
            width: "100%", padding: "14px", fontFamily: FONT, fontSize: "13px", fontWeight: 500,
            letterSpacing: "0.08em", textTransform: "uppercase", background: "#fff", color: GRY,
            border: `1.5px solid #ddd`, cursor: "pointer", borderRadius: 0,
          }}>
            Start fresh
          </button>
        </div>

        <p style={{ fontSize: "11px", color: LT, textAlign: "center", marginTop: "16px", lineHeight: 1.6 }}>
          Starting fresh will clear your previous progress and conversation history.
        </p>
      </div>
    </>
  );
}

// ════════════════════════════════════════
// Mode Selector (returning user with completed lens)
// ════════════════════════════════════════

// Helper to extract section summary from lens document
function extractSectionSummary(lensDoc, sectionLabel) {
  if (!lensDoc) return null;
  // Find the section heading and get the first sentence
  const sectionRegex = new RegExp(`## ${sectionLabel}[\\s\\S]*?(?=## |$)`, 'i');
  const match = lensDoc.match(sectionRegex);
  if (match) {
    // Get first non-empty line after the heading
    const lines = match[0].split('\n').slice(1).filter(l => l.trim());
    if (lines[0]) {
      // Get first sentence, max 80 chars
      const firstSentence = lines[0].split(/[.!?]/)[0];
      return firstSentence.length > 80 ? firstSentence.slice(0, 77) + '...' : firstSentence;
    }
  }
  return null;
}

function ModeSelector({ existingLens, onUpdateSection, onUploadMaterials, onStartFresh, onDownloadLens }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const MODE_OPTIONS = [
    {
      id: "update",
      label: "Update a section",
      description: "Refine a specific part of your Lens through a focused conversation.",
      action: onUpdateSection,
      primary: true,
    },
    {
      id: "upload",
      label: "Upload new materials",
      description: "Add new documents to enrich your Lens with additional context.",
      action: onUploadMaterials,
      primary: false,
    },
    {
      id: "download",
      label: "Download my Lens",
      description: "Get your Lens document as a markdown file.",
      action: onDownloadLens,
      primary: false,
    },
  ];

  return (
    <>
      {showConfirm && (
        <ConfirmationModal
          title="Start completely over?"
          message="This will erase your session, including your completed Lens document and all conversation history. This cannot be undone."
          confirmLabel="Yes, start over"
          cancelLabel="Keep my Lens"
          onConfirm={onStartFresh}
          onCancel={() => setShowConfirm(false)}
          destructive
        />
      )}
      <div style={containerStyle}>
        <div style={{ borderBottom: `2px solid ${BLK}`, paddingBottom: "12px", marginBottom: "32px" }}>
          <div style={{ fontSize: "10px", color: RED, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "6px", fontWeight: 600 }}>
            Your Lens
          </div>
          <h1 style={{ fontFamily: FONT, fontSize: "28px", fontWeight: 700, color: BLK, margin: 0, lineHeight: 1.2 }}>
            What would you like to do?
          </h1>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
          {MODE_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={option.action}
              style={{
                padding: "20px", textAlign: "left",
                background: option.primary ? "#fafafa" : "#fff",
                border: option.primary ? `2px solid ${BLK}` : "1.5px solid #ddd",
                cursor: "pointer", borderRadius: 0,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => { if (!option.primary) e.currentTarget.style.borderColor = BLK; }}
              onMouseLeave={(e) => { if (!option.primary) e.currentTarget.style.borderColor = "#ddd"; }}
            >
              <div style={{ fontSize: "15px", fontWeight: 600, color: BLK, fontFamily: FONT, marginBottom: "4px" }}>
                {option.label}
              </div>
              <div style={{ fontSize: "13px", color: GRY, lineHeight: 1.5 }}>
                {option.description}
              </div>
            </button>
          ))}
        </div>

        <div style={{ height: "1px", background: RULE, marginBottom: "20px" }} />

        <button onClick={() => setShowConfirm(true)} style={{
          width: "100%", padding: "12px", fontFamily: FONT, fontSize: "12px",
          color: LT, background: "none", border: "none",
          cursor: "pointer", borderRadius: 0, letterSpacing: "0.04em",
        }}>
          Start completely over
        </button>
      </div>
    </>
  );
}

// ════════════════════════════════════════
// Section Picker (with lens summaries)
// ════════════════════════════════════════

function SectionPicker({ existingLens, onSelectSection, onBack }) {
  const [expandedSection, setExpandedSection] = useState(null);

  return (
    <div style={containerStyle}>
      <div style={{ marginBottom: "28px" }}>
        <button onClick={onBack} style={{
          background: "none", border: "none", color: GRY, fontFamily: FONT,
          fontSize: "12px", cursor: "pointer", padding: "0", marginBottom: "16px",
          display: "flex", alignItems: "center", gap: "4px",
        }}>
          &larr; Back to menu
        </button>
        <div style={{ borderBottom: `2px solid ${BLK}`, paddingBottom: "12px" }}>
          <div style={{ fontSize: "10px", color: RED, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "6px", fontWeight: 600 }}>
            Update Your Lens
          </div>
          <h1 style={{ fontFamily: FONT, fontSize: "26px", fontWeight: 700, color: BLK, margin: 0, lineHeight: 1.2 }}>
            Which section needs updating?
          </h1>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "28px" }}>
        {SECTIONS.map((section, idx) => {
          const summary = extractSectionSummary(existingLens, section.label);
          const isExpanded = expandedSection === idx;

          return (
            <div key={section.id}>
              <button
                onClick={() => setExpandedSection(isExpanded ? null : idx)}
                style={{
                  width: "100%", padding: "16px 18px", textAlign: "left",
                  background: isExpanded ? "#fafafa" : "#fff",
                  border: isExpanded ? `2px solid ${BLK}` : "1.5px solid #ddd",
                  cursor: "pointer", borderRadius: 0,
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: ORANGE, fontVariantNumeric: "tabular-nums", minWidth: "20px", paddingTop: "2px" }}>
                    {section.number}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: BLK, fontFamily: FONT, marginBottom: summary ? "4px" : 0 }}>
                      {section.label}
                    </div>
                    {summary && (
                      <div style={{ fontSize: "12px", color: GRY, lineHeight: 1.5 }}>
                        {summary}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: "14px", color: LT, transform: isExpanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
                    ▼
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div style={{ padding: "16px 18px", background: "#fafafa", borderLeft: `2px solid ${BLK}`, borderRight: `2px solid ${BLK}`, borderBottom: `2px solid ${BLK}` }}>
                  <p style={{ fontSize: "13px", color: "#444", lineHeight: 1.6, margin: "0 0 16px" }}>
                    {section.prompt}
                  </p>
                  <button
                    onClick={() => onSelectSection(idx)}
                    style={{
                      padding: "12px 24px", fontFamily: FONT, fontSize: "12px", fontWeight: 600,
                      letterSpacing: "0.08em", textTransform: "uppercase",
                      background: RED, color: "#fff", border: `1.5px solid ${RED}`,
                      cursor: "pointer", borderRadius: 0,
                    }}
                  >
                    Update this section
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════
// Main app
// ════════════════════════════════════════

// Helper to safely get storage size
function getStorageSize(data) {
  try {
    return new Blob([JSON.stringify(data)]).size;
  } catch {
    return 0;
  }
}

// Session age threshold (7 days in milliseconds)
const SESSION_STALE_THRESHOLD = 7 * 24 * 60 * 60 * 1000;

// Helper to check if session is stale (older than 7 days)
function isSessionStale(session) {
  if (!session?.lastUpdated) return false;
  const lastUpdated = new Date(session.lastUpdated).getTime();
  const now = Date.now();
  return (now - lastUpdated) > SESSION_STALE_THRESHOLD;
}

// Helper to save session with quota handling
// Returns: { success: boolean, trimmed: boolean, dropped: boolean }
function saveSession(data) {
  try {
    const size = getStorageSize(data);
    let trimmed = false;
    let dropped = false;

    if (size > MAX_STORAGE_SIZE) {
      // Trim conversation history if too large
      const trimmedData = { ...data };
      if (trimmedData.discoveryState?.messages?.length > 10) {
        trimmedData.discoveryState = {
          ...trimmedData.discoveryState,
          messages: trimmedData.discoveryState.messages.slice(-10),
        };
        trimmed = true;
      }
      // If still too large, drop file context
      if (getStorageSize(trimmedData) > MAX_STORAGE_SIZE && trimmedData.fileContext) {
        trimmedData.fileContext = null;
        dropped = true;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedData));
      return { success: true, trimmed, dropped };
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return { success: true, trimmed: false, dropped: false };
    }
  } catch (e) {
    // Quota exceeded or other error
    console.warn("Session save failed:", e);
    return { success: false, trimmed: false, dropped: false };
  }
}

// Helper to load session
function loadSession() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      // Validate version
      if (data.version === STORAGE_VERSION) {
        // Add stale flag to session data
        data._isStale = isSessionStale(data);
        return data;
      }
      // Version mismatch — could migrate here, for now just return null
      return null;
    }
  } catch (e) {
    console.warn("Session load failed:", e);
  }
  return null;
}

export default function LensIntake() {
  const [phase, setPhase] = useState("intro");
  const [files, setFiles] = useState({
    resume: [], linkedin: [], writing: [], assessments: [], other: [],
  });
  const [status, setStatus] = useState(null);
  const [userName, setUserName] = useState("");
  const [pronouns, setPronouns] = useState(""); // "he/him", "she/her", "they/them", or custom
  const [previousFiles, setPreviousFiles] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // Context Reflection state (new phase between status and discovery)
  const [contextReflection, setContextReflection] = useState(null);

  // New session persistence state
  const [savedSession, setSavedSession] = useState(null);
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);
  const [discoveryState, setDiscoveryState] = useState(null);
  const [fileContext, setFileContext] = useState({});
  const [lensOutput, setLensOutput] = useState(null);
  const [storageWarning, setStorageWarning] = useState(null); // "trimmed" | "dropped" | "failed" | null

  // Section re-entry state
  const [reentryMode, setReentryMode] = useState(false);
  const [reentrySection, setReentrySection] = useState(null);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showSectionPicker, setShowSectionPicker] = useState(false);
  // Legacy alias for backward compatibility
  const showSectionSelector = showModeSelector || showSectionPicker;

  // Refs for telemetry to avoid stale closures in beforeunload
  const discoveryStateRef = useRef(discoveryState);
  const lensOutputRef = useRef(lensOutput);
  const userNameRef = useRef(userName);

  // Keep refs in sync with state
  useEffect(() => { discoveryStateRef.current = discoveryState; }, [discoveryState]);
  useEffect(() => { lensOutputRef.current = lensOutput; }, [lensOutput]);
  useEffect(() => { userNameRef.current = userName; }, [userName]);

  // ══════════════════════════════════════════════════════════════════════════
  // SESSION TELEMETRY - tracks timing, file metrics, abandonment for Airtable
  // ══════════════════════════════════════════════════════════════════════════
  const telemetryRef = useRef({
    sessionId: generateSessionId(),
    sessionStart: new Date().toISOString(),
    buildVersion: BUILD_ID,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    // Phase timestamps (filled as user progresses)
    materialsStart: null,
    materialsEnd: null,
    statusStart: null,
    statusEnd: null,
    contextStart: null,
    contextEnd: null,
    discoveryStart: null,
    discoveryEnd: null,
    synthesisStart: null,
    synthesisEnd: null,
    // File metrics (filled from DiscoveryPhase callback)
    fileCount: 0,
    preTruncationTotalChars: 0,
    totalExtractedChars: 0,
    charsTruncated: 0,
    contentBudgetApplied: false,
    fileBreakdown: [],
    // Discovery section timing (filled as sections complete)
    discoverySectionTiming: [],
    // Status
    status: null, // Completed / Abandoned / Error
    abandonmentPhase: null,
    abandonmentSection: null,
    // Errors
    reflectionResult: null, // Success / Failed / Skipped
    apiErrors: [],
    // Transcript persistence (added 2026-04-23)
    flow: "C→C", // Candidate-to-Candidate flow
    modelName: "claude-sonnet-4-6", // Model used for discover/synthesize
    // Logged flag to prevent double-logging
    _logged: false,
  });

  // Track phase transitions
  const prevPhaseRef = useRef(null);
  useEffect(() => {
    const t = telemetryRef.current;
    const now = new Date().toISOString();
    const prev = prevPhaseRef.current;

    // Mark end of previous phase
    if (prev === "upload" && phase !== "upload") t.materialsEnd = now;
    if (prev === "status" && phase !== "status") t.statusEnd = now;
    if (prev === "reflect" && phase !== "reflect") t.contextEnd = now;
    if (prev === "discovery" && phase !== "discovery") t.discoveryEnd = now;

    // Mark start of new phase
    if (phase === "upload" && prev !== "upload" && !t.materialsStart) t.materialsStart = now;
    if (phase === "status" && prev !== "status" && !t.statusStart) t.statusStart = now;
    if (phase === "reflect" && prev !== "reflect" && !t.contextStart) t.contextStart = now;
    if (phase === "discovery" && prev !== "discovery" && !t.discoveryStart) t.discoveryStart = now;

    prevPhaseRef.current = phase;
  }, [phase]);

  // Telemetry callbacks for child components
  const handleFileStats = useCallback((stats) => {
    const t = telemetryRef.current;
    t.fileCount = stats.fileCount;
    t.preTruncationTotalChars = stats.preTruncationTotalChars;
    t.totalExtractedChars = stats.totalExtractedChars;
    t.charsTruncated = stats.charsTruncated;
    t.contentBudgetApplied = stats.contentBudgetApplied;
    t.fileBreakdown = stats.fileBreakdown;
  }, []);

  const handleDiscoverySectionTiming = useCallback((sectionTiming) => {
    telemetryRef.current.discoverySectionTiming = sectionTiming;
  }, []);

  const handleSynthesisStart = useCallback(() => {
    telemetryRef.current.synthesisStart = new Date().toISOString();
  }, []);

  const handleSynthesisEnd = useCallback((success) => {
    const t = telemetryRef.current;
    t.synthesisEnd = new Date().toISOString();
    if (success) {
      t.status = "Completed";
      logTelemetry();
    }
  }, []);

  const handleApiError = useCallback((route, statusCode, message) => {
    telemetryRef.current.apiErrors.push({
      timestamp: new Date().toISOString(),
      route,
      status_code: statusCode,
      error_message: message,
    });
  }, []);

  const handleReflectionResult = useCallback((result) => {
    telemetryRef.current.reflectionResult = result; // "Success" | "Failed" | "Skipped"
  }, []);

  // Log telemetry to server (fire-and-forget)
  const logTelemetry = useCallback(() => {
    const t = telemetryRef.current;
    if (t._logged) return; // Prevent double-logging
    t._logged = true;

    // Calculate total duration
    const start = new Date(t.sessionStart).getTime();
    const end = Date.now();
    const totalDuration = Math.round((end - start) / 1000);

    // Use refs for latest state (avoids stale closures in beforeunload)
    const currentDiscoveryState = discoveryStateRef.current;
    const currentLensOutput = lensOutputRef.current;
    const currentUserName = userNameRef.current;

    // Build transcript from discovery messages
    const transcript = currentDiscoveryState?.messages?.map((msg, idx) => ({
      role: msg.role,
      content: msg.content,
      turn: idx,
      section: currentDiscoveryState?.currentSection ?? null,
    })) || [];

    const payload = {
      sessionId: t.sessionId,
      name: currentUserName || null,
      buildVersion: t.buildVersion,
      userAgent: t.userAgent,
      sessionStart: t.sessionStart,
      sessionEnd: new Date().toISOString(),
      totalDuration,
      status: t.status || "Abandoned",
      abandonmentPhase: t.abandonmentPhase,
      abandonmentSection: t.abandonmentSection,
      materialsStart: t.materialsStart,
      materialsEnd: t.materialsEnd,
      statusStart: t.statusStart,
      statusEnd: t.statusEnd,
      contextStart: t.contextStart,
      contextEnd: t.contextEnd,
      discoveryStart: t.discoveryStart,
      discoveryEnd: t.discoveryEnd,
      synthesisStart: t.synthesisStart,
      synthesisEnd: t.synthesisEnd,
      fileCount: t.fileCount,
      preTruncationTotalChars: t.preTruncationTotalChars,
      totalExtractedChars: t.totalExtractedChars,
      charsTruncated: t.charsTruncated,
      contentBudgetApplied: t.contentBudgetApplied,
      fileBreakdown: t.fileBreakdown,
      discoverySectionTiming: t.discoverySectionTiming,
      reflectionResult: t.reflectionResult,
      apiErrors: t.apiErrors.length > 0 ? t.apiErrors : null,
      // Transcript persistence (added 2026-04-23)
      transcript: transcript.length > 0 ? transcript : null,
      finalSynthesisMD: currentLensOutput || null,
      flow: t.flow,
      modelName: t.modelName,
    };

    // Use sendBeacon for reliability (works on page unload)
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    navigator.sendBeacon("/api/log-session", blob);
  }, []); // No dependencies - uses refs for latest state

  // Abandonment detection - only on actual page unload, not tab switches
  // Note: visibilitychange was removed because it fires on tab switches,
  // incorrectly logging "Abandoned" and blocking the real completion log.
  useEffect(() => {
    const handleUnload = () => {
      const t = telemetryRef.current;
      if (t._logged) return;

      // Determine abandonment phase
      t.abandonmentPhase = phase === "upload" ? "Materials"
        : phase === "status" ? "Status"
        : phase === "reflect" ? "Context"
        : phase === "discovery" ? "Discovery"
        : null;

      // Get section from discovery state if applicable
      if (phase === "discovery" && discoveryState?.currentSection !== undefined) {
        t.abandonmentSection = discoveryState.currentSection + 1; // 1-indexed
      }

      logTelemetry();
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [phase, discoveryState, logTelemetry]);

  // ── Load saved progress on mount ──
  useEffect(() => {
    const session = loadSession();
    if (session) {
      setSavedSession(session);
      // Show recovery prompt if there's meaningful progress
      const hasProgress = session.phase !== "intro" ||
        session.discoveryState?.messages?.length > 0 ||
        session.lensOutput;
      if (hasProgress) {
        setShowRecoveryPrompt(true);
      } else {
        // Minimal progress, just restore silently
        restoreSession(session);
      }
    }
    setLoaded(true);
  }, []);

  // Restore session state
  const restoreSession = (session) => {
    if (session.phase) setPhase(session.phase);
    if (session.status) setStatus(session.status);
    if (session.userName) setUserName(session.userName);
    if (session.pronouns) setPronouns(session.pronouns);
    if (session.fileMeta) setPreviousFiles(session.fileMeta);
    if (session.fileContext) setFileContext(session.fileContext);
    if (session.contextReflection) setContextReflection(session.contextReflection);
    if (session.discoveryState) setDiscoveryState(session.discoveryState);
    if (session.lensOutput) setLensOutput(session.lensOutput);
    setShowRecoveryPrompt(false);
  };

  // ── Save progress on every change ──
  useEffect(() => {
    if (!loaded || showRecoveryPrompt) return;

    const fileMeta = {};
    const fileCtx = {};
    for (const [cat, arr] of Object.entries(files)) {
      if (arr.length > 0) {
        fileMeta[cat] = arr.map(f => ({ name: f.name, size: f.size }));
        // Store extracted text content
        for (const f of arr) {
          if (f._textContent) {
            fileCtx[`${cat}:${f.name}`] = f._textContent;
          }
        }
      }
    }

    const sessionData = {
      version: STORAGE_VERSION,
      lastUpdated: new Date().toISOString(),
      phase,
      status,
      userName,
      pronouns,
      fileMeta: Object.keys(fileMeta).length > 0 ? fileMeta : null,
      fileContext: Object.keys(fileCtx).length > 0 ? fileCtx : (Object.keys(fileContext).length > 0 ? fileContext : null),
      contextReflection,
      discoveryState,
      lensOutput,
    };

    const result = saveSession(sessionData);
    if (!result.success) {
      setStorageWarning("failed");
    } else if (result.dropped) {
      setStorageWarning("dropped");
    } else if (result.trimmed) {
      setStorageWarning("trimmed");
    } else {
      setStorageWarning(null);
    }
  }, [phase, status, userName, pronouns, files, discoveryState, lensOutput, loaded, showRecoveryPrompt, fileContext, contextReflection]);

  // ── Clear saved progress ──
  const handleStartOver = () => {
    setPhase("intro");
    setFiles({ resume: [], linkedin: [], writing: [], assessments: [], other: [] });
    setStatus(null);
    setUserName("");
    setPronouns("");
    setPreviousFiles(null);
    setDiscoveryState(null);
    setFileContext({});
    setContextReflection(null);
    setLensOutput(null);
    setReentryMode(false);
    setReentrySection(null);
    setShowModeSelector(false);
    setShowSectionPicker(false);
    setSavedSession(null);
    setShowRecoveryPrompt(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // Silent fail
    }
  };

  // ── Handle session recovery ──
  const handleContinueSession = () => {
    if (savedSession) {
      // Check if user has a completed lens - show mode selector
      if (savedSession.lensOutput) {
        setLensOutput(savedSession.lensOutput);
        if (savedSession.status) setStatus(savedSession.status);
        if (savedSession.fileMeta) setPreviousFiles(savedSession.fileMeta);
        if (savedSession.fileContext) setFileContext(savedSession.fileContext);
        setShowModeSelector(true);
        setShowRecoveryPrompt(false);
      } else {
        restoreSession(savedSession);
      }
    }
  };

  const handleStartFresh = () => {
    handleStartOver();
  };

  // ── Mode selector handlers ──
  const handleUpdateSectionMode = () => {
    setShowModeSelector(false);
    setShowSectionPicker(true);
  };

  const handleUploadMaterialsMode = () => {
    setShowModeSelector(false);
    setShowSectionPicker(false);
    setPhase("upload");
  };

  const handleDownloadLens = () => {
    if (lensOutput) {
      const blob = new Blob([lensOutput], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "lens-document.md";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // ── Handle section re-entry selection ──
  const handleSelectSection = (sectionIdx) => {
    setReentryMode(true);
    setReentrySection(sectionIdx);
    setShowModeSelector(false);
    setShowSectionPicker(false);
    // Restore other state but start fresh discovery for that section
    if (savedSession) {
      if (savedSession.status) setStatus(savedSession.status);
      if (savedSession.fileMeta) setPreviousFiles(savedSession.fileMeta);
      if (savedSession.fileContext) setFileContext(savedSession.fileContext);
    }
    setPhase("discovery");
  };

  // ── Handle re-entry completion ──
  const handleReentryComplete = (updatedLens) => {
    setLensOutput(updatedLens);
    setReentryMode(false);
    setReentrySection(null);
    setDiscoveryState(prev => prev ? { ...prev, lensDoc: updatedLens } : { lensDoc: updatedLens });
    // Show mode selector with the updated lens
    setSavedSession(prev => ({
      ...(prev || {}),
      version: STORAGE_VERSION,
      lastUpdated: new Date().toISOString(),
      lensOutput: updatedLens,
      phase: "discovery",
      discoveryState: { subPhase: "done", lensDoc: updatedLens },
    }));
    setShowModeSelector(true);
  };

  // ── Handle selecting another section to update ──
  const handleSelectAnotherSection = () => {
    setReentryMode(false);
    setReentrySection(null);
    setShowSectionPicker(true);
  };

  // ── Handle save and exit from discovery ──
  const handleSaveAndExit = () => {
    // Session is auto-saved, just show mode selector if lens exists, else recovery prompt
    if (lensOutput) {
      setShowModeSelector(true);
    } else {
      setSavedSession(prev => ({
        ...(prev || {}),
        version: STORAGE_VERSION,
        lastUpdated: new Date().toISOString(),
        phase,
        status,
        discoveryState,
      }));
      setShowRecoveryPrompt(true);
    }
    setPhase("intro");
  };

  // ── Handle discovery state changes ──
  const handleDiscoveryStateChange = useCallback((state) => {
    setDiscoveryState(state);
    if (state.lensDoc) {
      setLensOutput(state.lensDoc);
    }
  }, []);

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
  const phaseIndex = ["intro", "upload", "status", "reflect", "discovery"].indexOf(phase);

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

  // Show session recovery prompt
  if (showRecoveryPrompt && savedSession) {
    return (
      <div style={{ background: "#fff", minHeight: "100vh" }}>
        <SessionRecoveryPrompt
          savedSession={savedSession}
          onContinue={handleContinueSession}
          onStartFresh={handleStartFresh}
        />
      </div>
    );
  }

  // Show mode selector for returning users with completed lens
  if (showModeSelector && lensOutput) {
    return (
      <div style={{ background: "#fff", minHeight: "100vh" }}>
        <ModeSelector
          existingLens={lensOutput}
          onUpdateSection={handleUpdateSectionMode}
          onUploadMaterials={handleUploadMaterialsMode}
          onStartFresh={handleStartOver}
          onDownloadLens={handleDownloadLens}
        />
      </div>
    );
  }

  // Show section picker
  if (showSectionPicker && lensOutput) {
    return (
      <div style={{ background: "#fff", minHeight: "100vh" }}>
        <SectionPicker
          existingLens={lensOutput}
          onSelectSection={handleSelectSection}
          onBack={() => {
            setShowSectionPicker(false);
            setShowModeSelector(true);
          }}
        />
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
              {["Materials", "Status", "Context", "Discovery"].map((label, i) => (
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

      {/* Storage warning banner */}
      {storageWarning && (
        <div style={{ maxWidth: "560px", margin: "0 auto", padding: "0 32px" }}>
          <div style={{
            margin: "12px 0 0", padding: "12px 16px",
            background: storageWarning === "failed" ? "#fff5f5" : "#fffaf5",
            border: `1px solid ${storageWarning === "failed" ? RED : ORANGE}`,
            fontSize: "12px", color: storageWarning === "failed" ? RED : ORANGE, lineHeight: 1.6,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span>
              {storageWarning === "failed" && "Unable to save your progress. Your browser storage may be full."}
              {storageWarning === "dropped" && "Storage limit reached. File content was removed from the save, but your conversation is preserved."}
              {storageWarning === "trimmed" && "Storage limit reached. Some older messages were trimmed from your saved session."}
            </span>
            <button
              onClick={() => setStorageWarning(null)}
              style={{
                background: "none", border: "none", color: "inherit", cursor: "pointer",
                fontSize: "16px", padding: "0 0 0 12px", fontFamily: FONT,
              }}
            >
              &times;
            </button>
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
        <UploadPhase
          files={files}
          onAdd={handleAdd}
          onRemove={handleRemove}
          onContinue={() => setPhase("status")}
          onBack={() => lensOutput ? setShowModeSelector(true) : setPhase("intro")}
          savedFileContext={fileContext}
          previousFiles={previousFiles}
        />
      )}

      {phase === "status" && (
        <StatusPhase
          status={status} setStatus={setStatus}
          userName={userName} setUserName={setUserName}
          pronouns={pronouns} setPronouns={setPronouns}
          onContinue={() => setPhase("reflect")} onBack={() => setPhase("upload")}
        />
      )}

      {phase === "reflect" && (
        <ContextReflectionPhase
          files={files}
          userName={userName}
          status={status}
          onContinue={(reflection) => {
            setContextReflection(reflection);
            setPhase("discovery");
          }}
          onBack={() => setPhase("status")}
          onSkip={() => {
            setContextReflection(null);
            setPhase("discovery");
          }}
          onReflectionResult={handleReflectionResult}
        />
      )}

      {phase === "discovery" && (
        <DiscoveryPhase
          status={status}
          userName={userName}
          pronouns={pronouns}
          totalFiles={totalFiles}
          files={files}
          contextReflection={contextReflection}
          onBack={() => setPhase("reflect")}
          onStartOver={handleStartOver}
          savedDiscoveryState={discoveryState}
          onDiscoveryStateChange={handleDiscoveryStateChange}
          reentryMode={reentryMode}
          reentrySection={reentrySection}
          existingLens={lensOutput}
          onReentryComplete={handleReentryComplete}
          onSelectAnotherSection={handleSelectAnotherSection}
          onSaveAndExit={handleSaveAndExit}
          onFileStats={handleFileStats}
          onDiscoverySectionTiming={handleDiscoverySectionTiming}
          onSynthesisStart={handleSynthesisStart}
          onSynthesisEnd={handleSynthesisEnd}
          onApiError={handleApiError}
        />
      )}

      <style>{`
        @keyframes bar { 0% { opacity: 0.15 } 100% { opacity: 1 } }
        input::placeholder, textarea::placeholder { color: #ccc }
      `}</style>

      {/* Build version */}
      <div style={{
        position: "fixed",
        bottom: 8,
        right: 12,
        fontSize: 10,
        color: "#ccc",
        fontFamily: FONT,
        letterSpacing: "0.02em",
      }}>
        build {BUILD_ID}
      </div>
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
