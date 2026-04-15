"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const STORAGE_KEY = "recruiter-role-session";
const STORAGE_VERSION = "1.0";
const MAX_STORAGE_SIZE = 4 * 1024 * 1024; // 4MB

// ── Build info ──
const BUILD_ID = "2026.04.15-k";

// ── Design tokens (match candidate intake exactly) ──
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
  const MAX_CHARS = 50000;

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

  return null;
}

// ── Upload categories for recruiters ──
const CATEGORIES = [
  {
    id: "jd",
    label: "Job description",
    accept: ".pdf,.docx,.doc,.txt",
    hint: "The formal JD, if one exists. We'll use it as a starting point, not a constraint.",
    multiple: false,
  },
  {
    id: "stakeholderNotes",
    label: "Stakeholder notes",
    accept: ".pdf,.docx,.doc,.txt,.md",
    hint: "Meeting notes, intake call notes, emails from the hiring manager — anything that captures what the client actually said.",
    multiple: true,
  },
  {
    id: "teamContext",
    label: "Team/org context",
    accept: ".pdf,.docx,.doc,.txt,.md,.png,.jpg,.jpeg",
    hint: "Org charts, team bios, company culture docs, internal decks about the team.",
    multiple: true,
  },
  {
    id: "candidateMaterials",
    label: "Candidate materials to pre-load",
    accept: ".pdf,.docx,.doc,.txt",
    hint: "If you already have the candidate's resume or LinkedIn, upload here so the discovery session doesn't re-ask what's already known.",
    multiple: true,
  },
  {
    id: "other",
    label: "Anything else",
    accept: "",
    hint: "Compensation data, market research, previous search briefs, whatever context would help.",
    multiple: true,
  },
];

// ── Content budget ──
const TOTAL_CONTENT_BUDGET = 60000;
const CATEGORY_PRIORITY = ["jd", "stakeholderNotes", "teamContext", "candidateMaterials", "other"];

function buildFileContextWithBudget(files, categories) {
  const parts = [];
  let remainingBudget = TOTAL_CONTENT_BUDGET;
  let totalChars = 0;
  const TRUNCATION_MARKER = "\n\n[content truncated for length]";
  const MIN_USEFUL_CHARS = 200;

  for (const catId of CATEGORY_PRIORITY) {
    const arr = files[catId] || [];
    const catLabel = categories.find(c => c.id === catId)?.label || catId;

    for (const f of arr) {
      if (!f._textContent) continue;
      if (remainingBudget < MIN_USEFUL_CHARS) continue;

      let content = f._textContent;
      if (content.length > remainingBudget) {
        const truncateAt = Math.max(0, remainingBudget - TRUNCATION_MARKER.length);
        content = content.slice(0, truncateAt) + TRUNCATION_MARKER;
      }

      parts.push(`[${catLabel}: ${f.name}]\n${content}`);
      remainingBudget -= content.length;
      totalChars += content.length;
    }
  }

  return parts.length > 0 ? parts.join("\n\n---\n\n") : "";
}

// ── Session helpers ──
function getStorageSize(data) {
  try {
    return new Blob([JSON.stringify(data)]).size;
  } catch {
    return 0;
  }
}

function saveSession(data) {
  try {
    const size = getStorageSize(data);
    if (size > MAX_STORAGE_SIZE) {
      // Trim file context if too large
      const trimmed = { ...data, fileContext: null };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      return { success: true, dropped: true };
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return { success: true, dropped: false };
  } catch (e) {
    console.warn("Session save failed:", e);
    return { success: false, dropped: false };
  }
}

function loadSession() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      if (data.version === STORAGE_VERSION) {
        return data;
      }
    }
  } catch (e) {
    console.warn("Session load failed:", e);
  }
  return null;
}

function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn("Session clear failed:", e);
  }
}

// ════════════════════════════════════════
// Phase Components
// ════════════════════════════════════════

function IntroPhase({ onContinue }) {
  const [privacyExpanded, setPrivacyExpanded] = useState(false);

  return (
    <div style={containerStyle}>
      <div style={{ marginBottom: "48px" }}>
        <div style={{
          fontSize: "11px", letterSpacing: "0.12em", color: RED,
          textTransform: "uppercase", marginBottom: "12px", fontWeight: 500,
        }}>
          LENS PROJECT
        </div>
        <h1 style={{ fontSize: "28px", fontWeight: 600, margin: "0 0 16px", lineHeight: 1.2 }}>
          Define your search
        </h1>
        <p style={{ fontSize: "15px", lineHeight: 1.7, color: GRY, margin: 0 }}>
          This form captures the context that will shape a tailored candidate discovery session.
          The more specific you are about what this role needs to accomplish, the better the
          discovery conversation will surface relevant signals.
        </p>
      </div>

      <div style={{ marginBottom: "32px" }}>
        <div style={{
          fontSize: "13px", color: BLK, lineHeight: 1.7,
          padding: "16px", background: "#fafafa", border: `1px solid ${RULE}`,
        }}>
          <div style={{ fontWeight: 600, marginBottom: "8px" }}>What you'll provide:</div>
          <ul style={{ margin: "0", paddingLeft: "20px" }}>
            <li>Role details and what success looks like in 12 months</li>
            <li>Top priorities for the hire, ranked</li>
            <li>Any documents that add context (JD, notes, org charts)</li>
          </ul>
          <div style={{ marginTop: "12px", color: GRY, fontSize: "12px" }}>
            Estimated time: 5-10 minutes
          </div>
        </div>
      </div>

      {/* Privacy notice */}
      <div style={{ marginBottom: "40px" }}>
        <button
          onClick={() => setPrivacyExpanded(!privacyExpanded)}
          style={{
            width: "100%", textAlign: "left", padding: "12px 16px",
            background: "none", border: `1px solid ${RULE}`,
            cursor: "pointer", fontFamily: FONT, fontSize: "13px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}
        >
          <span style={{ fontWeight: 500 }}>How we handle your data</span>
          <span style={{ color: LT, transform: privacyExpanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
            ▼
          </span>
        </button>
        {privacyExpanded && (
          <div style={{
            padding: "16px", background: "#fafafa", border: `1px solid ${RULE}`,
            borderTop: "none", fontSize: "13px", lineHeight: 1.7, color: GRY,
          }}>
            <ul style={{ margin: "0", paddingLeft: "20px" }}>
              <li><strong>No server storage:</strong> Your data is processed in real-time and not stored on our servers.</li>
              <li><strong>Encrypted in transit:</strong> All API calls use TLS encryption.</li>
              <li><strong>Session-scoped documents:</strong> Uploaded documents are used as context for this session only and are not retained.</li>
              <li><strong>Local persistence:</strong> Form progress is saved to your browser's localStorage so you can return later.</li>
            </ul>
          </div>
        )}
      </div>

      <button onClick={onContinue} style={primaryButtonStyle}>
        Get started
      </button>
    </div>
  );
}

// Parse markdown role context file
function parseRoleContextMarkdown(text) {
  const result = {};
  console.log("[parseRoleContext] Input length:", text?.length);
  if (!text) return result;

  // Helper to extract single-line value after **Label:**
  const extractInlineField = (label) => {
    try {
      const regex = new RegExp(`\\*\\*${label}:\\*\\*\\s*(.+?)$`, 'im');
      const match = text.match(regex);
      return match && match[1] ? match[1].trim() : null;
    } catch (e) {
      console.warn("[extractInlineField] Error for label:", label, e);
      return null;
    }
  };

  // Helper to extract multi-line value (label on own line, content follows)
  const extractBlockField = (label) => {
    try {
      const regex = new RegExp(`\\*\\*${label}\\*\\*\\s*\\n([\\s\\S]+?)(?=\\n\\*\\*|$)`, 'i');
      const match = text.match(regex);
      return match && match[1] ? match[1].trim() : null;
    } catch (e) {
      console.warn("[extractBlockField] Error for label:", label, e);
      return null;
    }
  };

  // Single-line fields
  result.roleTitle = extractInlineField('Role title');
  const company = extractInlineField('Company');
  result.company = company ? company.replace(/\s*\(.*?\)\s*$/, '') : null;
  result.stakeholders = extractInlineField('Hiring manager / stakeholders') ||
                        extractInlineField('Hiring manager / key stakeholder\\(s\\)');
  result.compensation = extractInlineField('Compensation range');
  result.location = extractInlineField('Location');
  result.companyStage = extractInlineField('Company stage');

  // Multi-line fields (label ends with ? or :, content on next line)
  result.firstYearObjective = extractBlockField('What does this role need to accomplish in the first 12 months\\?');
  result.lastPerson = extractBlockField('What happened with the last person in this seat\\?');
  result.failureMode = extractBlockField('What would make this hire fail\\?');
  result.recruiterOnly = extractBlockField('Recruiter-only notes[^*]*');

  // Priorities - numbered list after **Top priorities...**
  try {
    const prioritiesMatch = text.match(/\*\*Top priorities[^*]*\*\*\s*\n([\s\S]+?)(?=\n\n\*\*|\n\*\*[A-Z]|$)/i);
    if (prioritiesMatch && prioritiesMatch[1]) {
      const lines = prioritiesMatch[1].split('\n').filter(l => l && /^\d+\./.test(l.trim()));
      result.priorities = lines.map(line => line.replace(/^\d+\.\s*/, '').trim());
    }
  } catch (e) {
    console.warn("[parseRoleContext] Priorities parse error:", e);
  }

  console.log("[parseRoleContext] Parsed result:", result);
  return result;
}

function RolePhase({ formData, setFormData, onContinue, onBack }) {
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  const handleFileLoad = async (e) => {
    const file = e.target.files?.[0];
    console.log("[handleFileLoad] File selected:", file?.name);
    if (!file) return;

    try {
      const text = await file.text();
      console.log("[handleFileLoad] File content length:", text.length);
      const parsed = parseRoleContextMarkdown(text);

      // Merge parsed data into form (only non-null values)
      const updates = Object.fromEntries(
        Object.entries(parsed).filter(([_, v]) => v != null && v !== '')
      );
      console.log("[handleFileLoad] Applying updates:", Object.keys(updates));

      setFormData(prev => ({ ...prev, ...updates }));

      // Clear file input for re-upload
      e.target.value = '';
    } catch (err) {
      console.error('[handleFileLoad] Failed to parse file:', err);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const updatePriority = (index, value) => {
    const priorities = [...(formData.priorities || ["", "", ""])];
    priorities[index] = value;
    setFormData(prev => ({ ...prev, priorities }));
  };

  const addPriority = () => {
    if ((formData.priorities || []).length < 5) {
      setFormData(prev => ({
        ...prev,
        priorities: [...(prev.priorities || ["", "", ""]), ""],
      }));
    }
  };

  const removePriority = (index) => {
    if ((formData.priorities || []).length > 3) {
      const priorities = [...formData.priorities];
      priorities.splice(index, 1);
      setFormData(prev => ({ ...prev, priorities }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.roleTitle?.trim()) newErrors.roleTitle = "Required";
    if (!formData.company?.trim()) newErrors.company = "Required";
    if (!formData.stakeholders?.trim()) newErrors.stakeholders = "Required";
    if (!formData.firstYearObjective?.trim()) newErrors.firstYearObjective = "Required";

    const priorities = formData.priorities || ["", "", ""];
    const filledPriorities = priorities.filter(p => p.trim());
    if (filledPriorities.length < 3) {
      newErrors.priorities = "Please provide at least 3 priorities";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validate()) {
      onContinue();
    }
  };

  const inputStyle = {
    width: "100%", padding: "12px 14px", fontFamily: FONT, fontSize: "14px",
    border: `1px solid ${RULE}`, borderRadius: 0, boxSizing: "border-box",
  };

  const textareaStyle = {
    ...inputStyle, minHeight: "100px", resize: "vertical", lineHeight: 1.6,
  };

  const labelStyle = {
    display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px",
  };

  const errorStyle = {
    fontSize: "12px", color: RED, marginTop: "4px",
  };

  const fieldGroupStyle = {
    marginBottom: "24px",
  };

  return (
    <div style={containerStyle}>
      <div style={{ marginBottom: "32px" }}>
        <div style={{
          fontSize: "11px", letterSpacing: "0.12em", color: RED,
          textTransform: "uppercase", marginBottom: "8px", fontWeight: 500,
        }}>
          STEP <span style={{ color: ORANGE }}>1</span> OF 3
        </div>
        <h2 style={{ fontSize: "24px", fontWeight: 600, margin: "0 0 8px", lineHeight: 1.2 }}>
          Role context
        </h2>
        <p style={{ fontSize: "14px", color: GRY, margin: 0 }}>
          Tell us about the search. The more specific you are, the better.
        </p>
      </div>

      {/* Quick load from file (POC) */}
      <div style={{ marginBottom: "24px" }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.txt"
          onChange={handleFileLoad}
          style={{ display: "none" }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            background: "none", border: `1px dashed ${RULE}`, color: GRY,
            padding: "10px 16px", cursor: "pointer", fontFamily: FONT,
            fontSize: "12px", width: "100%", textAlign: "center",
          }}
        >
          📄 Load role context from .md file (POC shortcut)
        </button>
      </div>

      {/* Required fields */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{
          fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase",
          color: BLK, fontWeight: 600, marginBottom: "20px",
          paddingBottom: "8px", borderBottom: `2px solid ${BLK}`,
        }}>
          Required
        </div>

        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Role title</label>
          <input
            type="text"
            value={formData.roleTitle || ""}
            onChange={e => updateField("roleTitle", e.target.value)}
            placeholder="e.g., VP of Customer Success"
            style={{ ...inputStyle, borderColor: errors.roleTitle ? RED : RULE }}
          />
          {errors.roleTitle && <div style={errorStyle}>{errors.roleTitle}</div>}
        </div>

        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Company name</label>
          <input
            type="text"
            value={formData.company || ""}
            onChange={e => updateField("company", e.target.value)}
            placeholder="e.g., Acme Corp"
            style={{ ...inputStyle, borderColor: errors.company ? RED : RULE }}
          />
          {errors.company && <div style={errorStyle}>{errors.company}</div>}
        </div>

        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Hiring manager / key stakeholder(s)</label>
          <input
            type="text"
            value={formData.stakeholders || ""}
            onChange={e => updateField("stakeholders", e.target.value)}
            placeholder="e.g., Jane Smith (CEO), Bob Lee (COO)"
            style={{ ...inputStyle, borderColor: errors.stakeholders ? RED : RULE }}
          />
          {errors.stakeholders && <div style={errorStyle}>{errors.stakeholders}</div>}
        </div>

        <div style={fieldGroupStyle}>
          <label style={labelStyle}>What does this role need to accomplish in the first 12 months?</label>
          <p style={{ fontSize: "12px", color: GRY, margin: "0 0 8px" }}>
            This is the real signal — what success looks like, not the JD bullet points.
          </p>
          <textarea
            value={formData.firstYearObjective || ""}
            onChange={e => updateField("firstYearObjective", e.target.value)}
            placeholder="e.g., Rebuild the enterprise CS function from scratch. The current team is 2 people doing reactive support. Need someone who can build a proactive success model, hire a team of 5-6, and reduce enterprise churn from 8% to under 4%."
            style={{ ...textareaStyle, borderColor: errors.firstYearObjective ? RED : RULE }}
          />
          {errors.firstYearObjective && <div style={errorStyle}>{errors.firstYearObjective}</div>}
        </div>

        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Top priorities for this hire (ranked)</label>
          <p style={{ fontSize: "12px", color: GRY, margin: "0 0 12px" }}>
            List 3-5 priorities in order of importance. #1 is most critical.
          </p>
          {(formData.priorities || ["", "", ""]).map((priority, idx) => (
            <div key={idx} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
              <span style={{
                width: "24px", height: "24px", background: ORANGE, color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "12px", fontWeight: 600, flexShrink: 0,
              }}>
                {idx + 1}
              </span>
              <input
                type="text"
                value={priority}
                onChange={e => updatePriority(idx, e.target.value)}
                placeholder={idx === 0 ? "e.g., Reduce churn from 8% to 4%" : ""}
                style={{ ...inputStyle, flex: 1 }}
              />
              {(formData.priorities || []).length > 3 && (
                <button
                  onClick={() => removePriority(idx)}
                  style={{
                    background: "none", border: "none", color: LT, cursor: "pointer",
                    fontSize: "18px", padding: "0 4px",
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {(formData.priorities || []).length < 5 && (
            <button
              onClick={addPriority}
              style={{
                background: "none", border: `1px dashed ${RULE}`, color: GRY,
                padding: "8px 16px", cursor: "pointer", fontFamily: FONT, fontSize: "12px",
                marginTop: "4px",
              }}
            >
              + Add priority
            </button>
          )}
          {errors.priorities && <div style={errorStyle}>{errors.priorities}</div>}
        </div>
      </div>

      {/* Optional fields */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{
          fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase",
          color: GRY, fontWeight: 600, marginBottom: "20px",
          paddingBottom: "8px", borderBottom: `1px solid ${RULE}`,
        }}>
          Optional (but helpful)
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
          <div>
            <label style={labelStyle}>Compensation range</label>
            <input
              type="text"
              value={formData.compensation || ""}
              onChange={e => updateField("compensation", e.target.value)}
              placeholder="e.g., $280K-$350K + equity"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Location requirements</label>
            <input
              type="text"
              value={formData.location || ""}
              onChange={e => updateField("location", e.target.value)}
              placeholder="e.g., Remote, NYC preferred"
              style={inputStyle}
            />
          </div>
        </div>

        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Company stage / size</label>
          <input
            type="text"
            value={formData.companyStage || ""}
            onChange={e => updateField("companyStage", e.target.value)}
            placeholder="e.g., Series B ($45M raised), 85 employees, founded 2021"
            style={inputStyle}
          />
        </div>

        <div style={fieldGroupStyle}>
          <label style={labelStyle}>What happened with the last person in this seat?</label>
          <p style={{ fontSize: "12px", color: GRY, margin: "0 0 8px" }}>
            High-signal context. Left voluntarily? Let go? Role is new?
          </p>
          <textarea
            value={formData.lastPerson || ""}
            onChange={e => updateField("lastPerson", e.target.value)}
            placeholder="e.g., Left after 8 months — misalignment with CEO on GTM strategy. CEO wanted aggressive outbound, they preferred product-led growth."
            style={textareaStyle}
          />
        </div>

        <div style={fieldGroupStyle}>
          <label style={labelStyle}>What would make this hire fail?</label>
          <p style={{ fontSize: "12px", color: GRY, margin: "0 0 8px" }}>
            This surfaces disqualifiers. Be specific about what won't work.
          </p>
          <textarea
            value={formData.failureMode || ""}
            onChange={e => updateField("failureMode", e.target.value)}
            placeholder="e.g., Someone who needs heavy structure — CEO is very hands-off and expects autonomous decision-making. Also, someone who can't handle ambiguity in a fast-changing environment."
            style={textareaStyle}
          />
        </div>

        <div style={fieldGroupStyle}>
          <label style={{ ...labelStyle, color: ORANGE }}>
            Recruiter-only notes (never shown to candidate)
          </label>
          <p style={{ fontSize: "12px", color: GRY, margin: "0 0 8px" }}>
            Anything the candidate shouldn't know during the discovery session. This stays in your records only.
          </p>
          <textarea
            value={formData.recruiterOnly || ""}
            onChange={e => updateField("recruiterOnly", e.target.value)}
            placeholder="e.g., Candidate thinks they left their last role voluntarily but our reference checks suggest otherwise. Don't surface this in discovery."
            style={{ ...textareaStyle, borderColor: `${ORANGE}44` }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "12px" }}>
        <button onClick={onBack} style={secondaryButtonStyle}>
          Back
        </button>
        <button onClick={handleContinue} style={primaryButtonStyle}>
          Continue
        </button>
      </div>
    </div>
  );
}

function UploadPhase({ files, onAdd, onRemove, onContinue, onBack, previousFiles }) {
  const [extracting, setExtracting] = useState({});
  const fileInputRefs = useRef({});

  const handleFileSelect = async (categoryId, event) => {
    const selectedFiles = Array.from(event.target.files);
    if (selectedFiles.length === 0) return;

    setExtracting(prev => ({ ...prev, [categoryId]: true }));

    const processed = await Promise.all(selectedFiles.map(async (file) => {
      const text = await extractText(file);
      return {
        name: file.name,
        size: file.size,
        type: file.type,
        _textContent: text,
      };
    }));

    onAdd(categoryId, processed);
    setExtracting(prev => ({ ...prev, [categoryId]: false }));

    // Clear input so same file can be re-selected
    if (fileInputRefs.current[categoryId]) {
      fileInputRefs.current[categoryId].value = "";
    }
  };

  const totalFiles = Object.values(files).flat().length;

  return (
    <div style={containerStyle}>
      <div style={{ marginBottom: "32px" }}>
        <div style={{
          fontSize: "11px", letterSpacing: "0.12em", color: RED,
          textTransform: "uppercase", marginBottom: "8px", fontWeight: 500,
        }}>
          STEP <span style={{ color: ORANGE }}>2</span> OF 3
        </div>
        <h2 style={{ fontSize: "24px", fontWeight: 600, margin: "0 0 8px", lineHeight: 1.2 }}>
          Supporting documents
        </h2>
        <p style={{ fontSize: "14px", color: GRY, margin: 0 }}>
          Upload any documents that add context. All categories are optional.
        </p>
      </div>

      {/* Previous files notice */}
      {previousFiles && Object.keys(previousFiles).length > 0 && (
        <div style={{
          marginBottom: "24px", padding: "12px 16px", background: "#fffaf5",
          border: `1px solid ${ORANGE}33`, fontSize: "12px", color: ORANGE, lineHeight: 1.6,
        }}>
          <strong>Welcome back.</strong> Your form progress was saved, but uploaded files need to be re-added.
          {Object.entries(previousFiles).map(([cat, arr]) => (
            <div key={cat} style={{ color: GRY, marginTop: "4px" }}>
              {CATEGORIES.find(c => c.id === cat)?.label}: {arr.map(f => f.name).join(", ")}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginBottom: "40px" }}>
        {CATEGORIES.map((cat) => {
          const catFiles = files[cat.id] || [];
          const isExtracting = extracting[cat.id];

          return (
            <div key={cat.id} style={{
              marginBottom: "20px", padding: "16px", background: "#fafafa",
              border: `1px solid ${RULE}`,
            }}>
              <div style={{ marginBottom: "8px" }}>
                <span style={{ fontSize: "14px", fontWeight: 600 }}>{cat.label}</span>
                {!cat.multiple && catFiles.length > 0 && (
                  <span style={{ fontSize: "12px", color: GRY, marginLeft: "8px" }}>
                    (1 file max)
                  </span>
                )}
              </div>
              <p style={{ fontSize: "12px", color: GRY, margin: "0 0 12px", lineHeight: 1.5 }}>
                {cat.hint}
              </p>

              {/* File list */}
              {catFiles.length > 0 && (
                <div style={{ marginBottom: "12px" }}>
                  {catFiles.map((file, idx) => (
                    <div key={idx} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "8px 12px", background: "#fff", border: `1px solid ${RULE}`,
                      marginBottom: "4px", fontSize: "13px",
                    }}>
                      <span>
                        {file.name}
                        <span style={{ color: GRY, marginLeft: "8px" }}>
                          ({Math.round(file.size / 1024)}KB)
                        </span>
                        {file._textContent && (
                          <span style={{ color: "#2D6A2D", marginLeft: "8px" }}>
                            ✓ extracted
                          </span>
                        )}
                      </span>
                      <button
                        onClick={() => onRemove(cat.id, idx)}
                        style={{
                          background: "none", border: "none", color: LT, cursor: "pointer",
                          fontSize: "16px", padding: "0",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload button */}
              {(cat.multiple || catFiles.length === 0) && (
                <label style={{
                  display: "inline-block", padding: "8px 16px",
                  border: `1px solid ${BLK}`, cursor: "pointer",
                  fontFamily: FONT, fontSize: "12px", fontWeight: 500,
                  background: "#fff",
                }}>
                  {isExtracting ? "Processing..." : "Choose file"}
                  <input
                    ref={el => fileInputRefs.current[cat.id] = el}
                    type="file"
                    accept={cat.accept}
                    multiple={cat.multiple}
                    onChange={e => handleFileSelect(cat.id, e)}
                    style={{ display: "none" }}
                    disabled={isExtracting}
                  />
                </label>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: "12px" }}>
        <button onClick={onBack} style={secondaryButtonStyle}>
          Back
        </button>
        <button onClick={onContinue} style={primaryButtonStyle}>
          {totalFiles > 0 ? `Continue with ${totalFiles} file${totalFiles > 1 ? "s" : ""}` : "Continue without files"}
        </button>
      </div>
    </div>
  );
}

function ReviewPhase({ formData, files, onEdit, onBack, onConfirm }) {
  const [generating, setGenerating] = useState(false);

  const totalFiles = Object.values(files).flat().length;
  const priorities = (formData.priorities || []).filter(p => p.trim());

  const handleConfirm = () => {
    setGenerating(true);
    // Build output object
    const documentData = {};
    for (const cat of CATEGORIES) {
      const catFiles = files[cat.id] || [];
      if (catFiles.length > 0) {
        documentData[cat.id] = catFiles.map(f => ({
          name: f.name,
          extractedText: f._textContent || null,
        }));
      }
    }

    const roleContext = {
      version: "1.0",
      createdAt: new Date().toISOString(),
      roleTitle: formData.roleTitle,
      company: formData.company,
      stakeholders: formData.stakeholders,
      firstYearObjective: formData.firstYearObjective,
      priorities,
      compensation: formData.compensation || null,
      location: formData.location || null,
      companyStage: formData.companyStage || null,
      lastPerson: formData.lastPerson || null,
      failureMode: formData.failureMode || null,
      recruiterOnly: formData.recruiterOnly || null,
      documents: documentData,
    };

    // Store to sessionStorage for downstream consumption
    sessionStorage.setItem("recruiter-role-context", JSON.stringify(roleContext));

    setTimeout(() => {
      setGenerating(false);
      onConfirm(roleContext);
    }, 500);
  };

  const sectionStyle = {
    marginBottom: "24px", padding: "16px", background: "#fafafa", border: `1px solid ${RULE}`,
  };

  const labelStyle = {
    fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase",
    color: GRY, marginBottom: "4px",
  };

  const valueStyle = {
    fontSize: "14px", lineHeight: 1.6,
  };

  return (
    <div style={containerStyle}>
      <div style={{ marginBottom: "32px" }}>
        <div style={{
          fontSize: "11px", letterSpacing: "0.12em", color: RED,
          textTransform: "uppercase", marginBottom: "8px", fontWeight: 500,
        }}>
          STEP <span style={{ color: ORANGE }}>3</span> OF 3
        </div>
        <h2 style={{ fontSize: "24px", fontWeight: 600, margin: "0 0 8px", lineHeight: 1.2 }}>
          Review & confirm
        </h2>
        <p style={{ fontSize: "14px", color: GRY, margin: 0 }}>
          Make sure everything looks right before generating the candidate session.
        </p>
      </div>

      {/* Role summary */}
      <div style={sectionStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div style={{ fontSize: "13px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Role Details
          </div>
          <button onClick={() => onEdit("role")} style={editLinkStyle}>
            Edit
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
          <div>
            <div style={labelStyle}>Role</div>
            <div style={valueStyle}>{formData.roleTitle}</div>
          </div>
          <div>
            <div style={labelStyle}>Company</div>
            <div style={valueStyle}>{formData.company}</div>
          </div>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <div style={labelStyle}>Stakeholders</div>
          <div style={valueStyle}>{formData.stakeholders}</div>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <div style={labelStyle}>12-Month Objective</div>
          <div style={valueStyle}>{formData.firstYearObjective}</div>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <div style={labelStyle}>Priorities</div>
          <ol style={{ margin: "8px 0 0", paddingLeft: "20px" }}>
            {priorities.map((p, i) => (
              <li key={i} style={{ fontSize: "14px", marginBottom: "4px" }}>{p}</li>
            ))}
          </ol>
        </div>

        {(formData.compensation || formData.location || formData.companyStage) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginTop: "16px", paddingTop: "16px", borderTop: `1px solid ${RULE}` }}>
            {formData.compensation && (
              <div>
                <div style={labelStyle}>Compensation</div>
                <div style={valueStyle}>{formData.compensation}</div>
              </div>
            )}
            {formData.location && (
              <div>
                <div style={labelStyle}>Location</div>
                <div style={valueStyle}>{formData.location}</div>
              </div>
            )}
            {formData.companyStage && (
              <div>
                <div style={labelStyle}>Stage / Size</div>
                <div style={valueStyle}>{formData.companyStage}</div>
              </div>
            )}
          </div>
        )}

        {formData.lastPerson && (
          <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: `1px solid ${RULE}` }}>
            <div style={labelStyle}>Last Person in Seat</div>
            <div style={valueStyle}>{formData.lastPerson}</div>
          </div>
        )}

        {formData.failureMode && (
          <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: `1px solid ${RULE}` }}>
            <div style={labelStyle}>Failure Mode</div>
            <div style={valueStyle}>{formData.failureMode}</div>
          </div>
        )}

        {formData.recruiterOnly && (
          <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: `1px solid ${ORANGE}44`, background: "#fffaf5", margin: "16px -16px -16px", padding: "16px" }}>
            <div style={{ ...labelStyle, color: ORANGE }}>Recruiter-Only Notes</div>
            <div style={valueStyle}>{formData.recruiterOnly}</div>
          </div>
        )}
      </div>

      {/* Documents summary */}
      <div style={sectionStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div style={{ fontSize: "13px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Documents ({totalFiles})
          </div>
          <button onClick={() => onEdit("upload")} style={editLinkStyle}>
            Edit
          </button>
        </div>

        {totalFiles === 0 ? (
          <div style={{ color: GRY, fontSize: "14px" }}>No documents uploaded</div>
        ) : (
          <div>
            {CATEGORIES.map(cat => {
              const catFiles = files[cat.id] || [];
              if (catFiles.length === 0) return null;
              return (
                <div key={cat.id} style={{ marginBottom: "12px" }}>
                  <div style={labelStyle}>{cat.label}</div>
                  {catFiles.map((f, i) => (
                    <div key={i} style={{ fontSize: "14px" }}>
                      {f.name}
                      {f._textContent && (
                        <span style={{ color: "#2D6A2D", marginLeft: "8px", fontSize: "12px" }}>
                          ({f._textContent.length.toLocaleString()} chars extracted)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "12px" }}>
        <button onClick={onBack} style={secondaryButtonStyle}>
          Back
        </button>
        <button onClick={handleConfirm} disabled={generating} style={{
          ...primaryButtonStyle,
          opacity: generating ? 0.7 : 1,
        }}>
          {generating ? "Generating..." : "Generate candidate session"}
        </button>
      </div>
    </div>
  );
}

function DimensionReviewPhase({ dimensions, setDimensions, roleContext, onBack, onGenerate, isGenerating, generateError }) {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const importanceLevels = ["critical", "high", "moderate"];
  const importanceColors = { critical: RED, high: ORANGE, moderate: GRY };

  const calculateTimeEstimate = (dims) => {
    const foundation = 7; // minutes
    let tailored = 0;
    for (const dim of dims) {
      if (dim.importance === "critical") tailored += 4;
      else if (dim.importance === "high") tailored += 3;
      else tailored += 1.5;
    }
    const total = foundation + tailored;
    return `${Math.floor(total)}-${Math.ceil(total + 4)} min`;
  };

  const cycleImportance = (dimId) => {
    setDimensions(prev => ({
      ...prev,
      dimensions: prev.dimensions.map(d => {
        if (d.id !== dimId) return d;
        const currentIdx = importanceLevels.indexOf(d.importance);
        const nextIdx = (currentIdx + 1) % importanceLevels.length;
        return { ...d, importance: importanceLevels[nextIdx] };
      }),
    }));
  };

  const startEdit = (dim) => {
    setEditingId(dim.id);
    setEditValue(dim.label);
  };

  const saveEdit = () => {
    if (editValue.trim() && editingId) {
      setDimensions(prev => ({
        ...prev,
        dimensions: prev.dimensions.map(d =>
          d.id === editingId ? { ...d, label: editValue.trim() } : d
        ),
      }));
    }
    setEditingId(null);
    setEditValue("");
  };

  const removeDimension = (dimId) => {
    if (dimensions.dimensions.length <= 2) return; // Keep at least 2
    setDimensions(prev => ({
      ...prev,
      dimensions: prev.dimensions.filter(d => d.id !== dimId),
    }));
  };

  const moveDimension = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= dimensions.dimensions.length) return;
    setDimensions(prev => {
      const dims = [...prev.dimensions];
      [dims[index], dims[newIndex]] = [dims[newIndex], dims[index]];
      return { ...prev, dimensions: dims };
    });
  };

  const addCustomDimension = () => {
    const id = `custom_${Date.now()}`;
    const newDim = {
      id,
      label: "New Dimension",
      importance: "moderate",
      sources: ["Custom"],
      whatToExplore: "",
      signals: [],
      redFlags: [],
    };
    setDimensions(prev => ({
      ...prev,
      dimensions: [...prev.dimensions, newDim],
    }));
    startEdit(newDim);
  };

  const dimCardStyle = {
    padding: "16px",
    background: "#fff",
    border: `1px solid ${RULE}`,
    marginBottom: "8px",
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
  };

  const badgeStyle = (importance) => ({
    padding: "4px 8px",
    fontSize: "10px",
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    background: importanceColors[importance],
    color: "#fff",
    cursor: "pointer",
    border: "none",
    fontFamily: FONT,
  });

  return (
    <div style={containerStyle}>
      <div style={{ marginBottom: "32px" }}>
        <div style={{
          fontSize: "11px", letterSpacing: "0.12em", color: RED,
          textTransform: "uppercase", marginBottom: "8px", fontWeight: 500,
        }}>
          STEP <span style={{ color: ORANGE }}>4</span> OF 4
        </div>
        <h2 style={{ fontSize: "24px", fontWeight: 600, margin: "0 0 8px", lineHeight: 1.2 }}>
          Review dimensions
        </h2>
        <p style={{ fontSize: "14px", color: GRY, margin: 0 }}>
          These are the key areas to explore with candidates for this role. Edit, reorder, or add dimensions as needed.
        </p>
      </div>

      {/* Context quality warning */}
      {dimensions.contextWarning && (
        <div style={{
          marginBottom: "24px", padding: "12px 16px", background: "#fffaf5",
          border: `1px solid ${ORANGE}33`, fontSize: "13px", color: ORANGE, lineHeight: 1.6,
        }}>
          <strong>Limited context:</strong> {dimensions.contextWarning}
        </div>
      )}

      {/* Role context summary */}
      <div style={{
        marginBottom: "24px", padding: "12px 16px", background: "#fafafa",
        border: `1px solid ${RULE}`, fontSize: "13px",
      }}>
        <span style={{ fontWeight: 600 }}>{roleContext.roleTitle}</span>
        <span style={{ color: GRY }}> at </span>
        <span style={{ fontWeight: 600 }}>{roleContext.company}</span>
        {dimensions.roleContext?.summary && (
          <div style={{ color: GRY, marginTop: "4px", fontSize: "12px" }}>
            {dimensions.roleContext.summary}
          </div>
        )}
      </div>

      {/* Time estimate */}
      <div style={{
        marginBottom: "24px", padding: "12px 16px", background: "#f0faf0",
        border: `1px solid #2D6A2D33`, fontSize: "13px", color: "#2D6A2D",
      }}>
        <strong>Estimated session:</strong> {calculateTimeEstimate(dimensions.dimensions)}
        <span style={{ color: GRY, marginLeft: "8px" }}>
          ({dimensions.dimensions.length} dimensions)
        </span>
      </div>

      {/* Dimensions list */}
      <div style={{ marginBottom: "24px" }}>
        {dimensions.dimensions.map((dim, idx) => (
          <div key={dim.id} style={dimCardStyle}>
            {/* Reorder buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <button
                onClick={() => moveDimension(idx, -1)}
                disabled={idx === 0}
                style={{
                  background: "none", border: `1px solid ${RULE}`, cursor: idx === 0 ? "default" : "pointer",
                  padding: "4px 6px", fontSize: "10px", color: idx === 0 ? LT : BLK, fontFamily: FONT,
                }}
              >
                ▲
              </button>
              <button
                onClick={() => moveDimension(idx, 1)}
                disabled={idx === dimensions.dimensions.length - 1}
                style={{
                  background: "none", border: `1px solid ${RULE}`, cursor: idx === dimensions.dimensions.length - 1 ? "default" : "pointer",
                  padding: "4px 6px", fontSize: "10px", color: idx === dimensions.dimensions.length - 1 ? LT : BLK, fontFamily: FONT,
                }}
              >
                ▼
              </button>
            </div>

            {/* Main content */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <button
                  onClick={() => cycleImportance(dim.id)}
                  style={badgeStyle(dim.importance)}
                  title="Click to cycle importance"
                >
                  {dim.importance}
                </button>
                {editingId === dim.id ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={e => e.key === "Enter" && saveEdit()}
                    autoFocus
                    style={{
                      flex: 1, padding: "4px 8px", fontFamily: FONT, fontSize: "14px",
                      fontWeight: 600, border: `1px solid ${RED}`, borderRadius: 0,
                    }}
                  />
                ) : (
                  <span
                    onClick={() => startEdit(dim)}
                    style={{ fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
                    title="Click to edit"
                  >
                    {dim.label}
                  </span>
                )}
              </div>

              {dim.whatToExplore && (
                <div style={{ fontSize: "12px", color: GRY, lineHeight: 1.5 }}>
                  {dim.whatToExplore}
                </div>
              )}

              {dim.sources && dim.sources.length > 0 && (
                <div style={{ fontSize: "11px", color: LT, marginTop: "6px" }}>
                  Source: {dim.sources.join(", ")}
                </div>
              )}
            </div>

            {/* Remove button */}
            <button
              onClick={() => removeDimension(dim.id)}
              disabled={dimensions.dimensions.length <= 2}
              style={{
                background: "none", border: "none", color: dimensions.dimensions.length <= 2 ? LT : GRY,
                cursor: dimensions.dimensions.length <= 2 ? "default" : "pointer",
                fontSize: "18px", padding: "0", fontFamily: FONT,
              }}
              title={dimensions.dimensions.length <= 2 ? "At least 2 dimensions required" : "Remove dimension"}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Add dimension button */}
      {dimensions.dimensions.length < 10 && (
        <button
          onClick={addCustomDimension}
          style={{
            width: "100%", padding: "12px", marginBottom: "32px",
            background: "none", border: `1px dashed ${RULE}`, color: GRY,
            cursor: "pointer", fontFamily: FONT, fontSize: "13px",
          }}
        >
          + Add custom dimension
        </button>
      )}

      {/* Error message */}
      {generateError && (
        <div style={{
          marginBottom: "16px", padding: "12px 16px", background: "#fff5f5",
          border: `1px solid ${RED}`, fontSize: "13px", color: RED,
        }}>
          {generateError}
        </div>
      )}

      <div style={{ display: "flex", gap: "12px" }}>
        <button onClick={onBack} style={secondaryButtonStyle} disabled={isGenerating}>
          Back
        </button>
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          style={{
            ...primaryButtonStyle,
            opacity: isGenerating ? 0.7 : 1,
          }}
        >
          {isGenerating ? "Generating session..." : "Generate candidate session"}
        </button>
      </div>
    </div>
  );
}

function ConfirmationPhase({ roleContext, sessionConfig, onStartNew }) {
  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(sessionConfig || roleContext, null, 2));
  };

  const handleLaunchSession = () => {
    window.location.href = "/recruiter/candidate";
  };

  const hasSession = !!sessionConfig;

  return (
    <div style={containerStyle}>
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <div style={{
          width: "64px", height: "64px", borderRadius: "50%",
          background: "#2D6A2D", color: "#fff", fontSize: "32px",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
        }}>
          ✓
        </div>
        <h2 style={{ fontSize: "24px", fontWeight: 600, margin: "0 0 8px" }}>
          {hasSession ? "Session generated" : "Role context saved"}
        </h2>
        <p style={{ fontSize: "14px", color: GRY, margin: 0 }}>
          {hasSession ? (
            <>
              A tailored discovery session for <strong>{roleContext.roleTitle}</strong> at <strong>{roleContext.company}</strong> is ready.
            </>
          ) : (
            <>
              The role context for <strong>{roleContext.roleTitle}</strong> at <strong>{roleContext.company}</strong> has been saved.
            </>
          )}
        </p>
      </div>

      {/* Session summary */}
      {hasSession && sessionConfig.metadata && (
        <div style={{
          padding: "20px", background: "#f0faf0", border: `1px solid #2D6A2D33`,
          marginBottom: "24px",
        }}>
          <div style={{
            fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase",
            color: "#2D6A2D", fontWeight: 600, marginBottom: "12px",
          }}>
            Session details
          </div>
          <div style={{ fontSize: "14px", lineHeight: 1.7 }}>
            <div><strong>Session ID:</strong> {sessionConfig.sessionId}</div>
            <div><strong>Duration:</strong> {sessionConfig.metadata.estimatedDuration}</div>
            {sessionConfig.foundation && (
              <div><strong>Foundation sections:</strong> {sessionConfig.foundation.length}</div>
            )}
            {sessionConfig.tailored && (
              <div><strong>Tailored dimensions:</strong> {sessionConfig.tailored.length}</div>
            )}
          </div>
        </div>
      )}

      <div style={{
        padding: "20px", background: "#fafafa", border: `1px solid ${RULE}`,
        marginBottom: "32px",
      }}>
        <div style={{
          fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase",
          color: GRY, fontWeight: 600, marginBottom: "12px",
        }}>
          What's next
        </div>
        <p style={{ fontSize: "14px", lineHeight: 1.7, margin: "0 0 16px" }}>
          {hasSession ? (
            <>
              The session config is stored in your browser session. This would be used to launch
              a tailored candidate discovery conversation.
            </>
          ) : (
            <>
              The role context is stored in your browser session. In the full product, this would
              generate a unique candidate session link that captures these parameters.
            </>
          )}
        </p>
        <p style={{ fontSize: "13px", color: GRY, lineHeight: 1.6, margin: 0 }}>
          <strong>Storage keys:</strong>{" "}
          <code style={{ background: "#eee", padding: "2px 6px" }}>recruiter-role-context</code>
          {hasSession && (
            <>, <code style={{ background: "#eee", padding: "2px 6px" }}>session-config</code></>
          )}
        </p>
      </div>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {hasSession && (
          <button onClick={handleLaunchSession} style={primaryButtonStyle}>
            Preview candidate session
          </button>
        )}
        <button onClick={handleCopyJson} style={secondaryButtonStyle}>
          Copy {hasSession ? "session" : "role context"} JSON
        </button>
        <button onClick={onStartNew} style={{...secondaryButtonStyle, borderColor: "#ccc", color: GRY}}>
          Define another search
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════
// Main Component
// ════════════════════════════════════════

export default function RecruiterRoleForm() {
  const [loaded, setLoaded] = useState(false);
  const [phase, setPhase] = useState("intro");
  const [formData, setFormData] = useState({
    roleTitle: "",
    company: "",
    stakeholders: "",
    firstYearObjective: "",
    priorities: ["", "", ""],
    compensation: "",
    location: "",
    companyStage: "",
    lastPerson: "",
    failureMode: "",
    recruiterOnly: "",
  });
  const [files, setFiles] = useState({});
  const [previousFiles, setPreviousFiles] = useState(null);
  const [roleContext, setRoleContext] = useState(null);
  const [storageWarning, setStorageWarning] = useState(null);

  // Dimension extraction state
  const [dimensions, setDimensions] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState(null);

  // Session generation state
  const [sessionConfig, setSessionConfig] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);

  const phaseIndex = phase === "intro" ? -1
    : phase === "role" ? 0
    : phase === "upload" ? 1
    : phase === "review" ? 2
    : phase === "extracting" ? 2
    : phase === "dimensions" ? 3
    : phase === "generating" ? 3
    : 4;

  // File handlers
  const handleAdd = (categoryId, newFiles) => {
    const category = CATEGORIES.find(c => c.id === categoryId);
    setFiles(prev => ({
      ...prev,
      [categoryId]: category?.multiple
        ? [...(prev[categoryId] || []), ...newFiles]
        : newFiles.slice(0, 1),
    }));
  };

  const handleRemove = (categoryId, index) => {
    setFiles(prev => ({
      ...prev,
      [categoryId]: (prev[categoryId] || []).filter((_, i) => i !== index),
    }));
  };

  // Navigation
  const handleEdit = (targetPhase) => {
    setPhase(targetPhase);
  };

  const handleConfirm = async (context) => {
    setRoleContext(context);
    setExtractionError(null);
    setIsExtracting(true);
    setPhase("extracting");

    try {
      const res = await fetch("/api/extract-dimensions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleContext: context }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed: ${res.status}`);
      }

      const extractedDimensions = await res.json();
      setDimensions(extractedDimensions);
      setPhase("dimensions");
    } catch (err) {
      console.error("Dimension extraction failed:", err);
      setExtractionError(err.message || "Failed to extract dimensions. Please try again.");
      setPhase("review"); // Go back to review on error
    } finally {
      setIsExtracting(false);
    }
  };

  const handleGenerateSession = async () => {
    if (!dimensions || !roleContext) return;

    setGenerateError(null);
    setIsGenerating(true);

    // Build candidate materials from uploaded files (if any)
    const candidateMaterials = {};
    const candidateFiles = files.candidateMaterials || [];
    if (candidateFiles.length > 0) {
      candidateMaterials.resume = candidateFiles[0]._textContent || null;
      if (candidateFiles.length > 1) {
        candidateMaterials.other = candidateFiles.slice(1).map(f => ({
          name: f.name,
          extractedText: f._textContent || null,
        }));
      }
    }

    try {
      const res = await fetch("/api/generate-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dimensions,
          candidateMaterials: Object.keys(candidateMaterials).length > 0 ? candidateMaterials : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed: ${res.status}`);
      }

      const config = await res.json();
      setSessionConfig(config);

      // Store to sessionStorage for downstream consumption
      sessionStorage.setItem("session-config", JSON.stringify(config));

      setPhase("confirmation");
      clearSession(); // Clear saved progress after completion
    } catch (err) {
      console.error("Session generation failed:", err);
      setGenerateError(err.message || "Failed to generate session. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartNew = () => {
    setPhase("intro");
    setFormData({
      roleTitle: "",
      company: "",
      stakeholders: "",
      firstYearObjective: "",
      priorities: ["", "", ""],
      compensation: "",
      location: "",
      companyStage: "",
      lastPerson: "",
      failureMode: "",
      recruiterOnly: "",
    });
    setFiles({});
    setPreviousFiles(null);
    setRoleContext(null);
    setDimensions(null);
    setSessionConfig(null);
    setExtractionError(null);
    setGenerateError(null);
    clearSession();
  };

  const handleStartOver = () => {
    if (confirm("Start over? Your progress will be cleared.")) {
      handleStartNew();
    }
  };

  // Load saved session on mount
  useEffect(() => {
    const session = loadSession();
    if (session) {
      if (session.phase) setPhase(session.phase);
      if (session.formData) setFormData(session.formData);
      if (session.fileMeta) setPreviousFiles(session.fileMeta);
      if (session.roleContext) setRoleContext(session.roleContext);
      if (session.dimensions) setDimensions(session.dimensions);
    }
    setLoaded(true);
  }, []);

  // Save session on changes
  useEffect(() => {
    if (!loaded) return;
    if (phase === "confirmation") return; // Don't save after completion

    const fileMeta = {};
    for (const [cat, arr] of Object.entries(files)) {
      if (arr.length > 0) {
        fileMeta[cat] = arr.map(f => ({ name: f.name, size: f.size }));
      }
    }

    const sessionData = {
      version: STORAGE_VERSION,
      lastUpdated: new Date().toISOString(),
      phase,
      formData,
      fileMeta: Object.keys(fileMeta).length > 0 ? fileMeta : null,
      roleContext: roleContext || null,
      dimensions: dimensions || null,
    };

    const result = saveSession(sessionData);
    if (!result.success) {
      setStorageWarning("failed");
    } else if (result.dropped) {
      setStorageWarning("dropped");
    }
  }, [loaded, phase, formData, files, roleContext, dimensions]);

  if (!loaded) {
    return (
      <div style={{ background: "#fff", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: FONT, color: GRY }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      {/* Progress bar */}
      {phase !== "intro" && phase !== "confirmation" && (
        <div style={{ position: "sticky", top: 0, zIndex: 10, background: "#fff", borderBottom: `1px solid ${RULE}` }}>
          <div style={{ maxWidth: "560px", margin: "0 auto", padding: "0 32px" }}>
            <div style={{ display: "flex", gap: "4px", padding: "12px 0", alignItems: "flex-start" }}>
              {["Role", "Documents", "Review", "Dimensions"].map((label, i) => (
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

      {/* Storage warning */}
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
              {storageWarning === "dropped" && "Storage limit reached. Some data was removed from the save."}
            </span>
            <button
              onClick={() => setStorageWarning(null)}
              style={{
                background: "none", border: "none", color: "inherit", cursor: "pointer",
                fontSize: "16px", padding: "0 0 0 12px", fontFamily: FONT,
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Phases */}
      {phase === "intro" && (
        <IntroPhase onContinue={() => setPhase("role")} />
      )}

      {phase === "role" && (
        <RolePhase
          formData={formData}
          setFormData={setFormData}
          onContinue={() => setPhase("upload")}
          onBack={() => setPhase("intro")}
        />
      )}

      {phase === "upload" && (
        <UploadPhase
          files={files}
          onAdd={handleAdd}
          onRemove={handleRemove}
          onContinue={() => setPhase("review")}
          onBack={() => setPhase("role")}
          previousFiles={previousFiles}
        />
      )}

      {phase === "review" && (
        <ReviewPhase
          formData={formData}
          files={files}
          onEdit={handleEdit}
          onBack={() => setPhase("upload")}
          onConfirm={handleConfirm}
        />
      )}

      {/* Extracting phase - show loading state */}
      {phase === "extracting" && (
        <div style={containerStyle}>
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{
              width: "48px", height: "48px", margin: "0 auto 24px",
              border: `3px solid ${RULE}`, borderTopColor: RED,
              borderRadius: "50%", animation: "spin 1s linear infinite",
            }} />
            <h2 style={{ fontSize: "20px", fontWeight: 600, margin: "0 0 8px" }}>
              Extracting dimensions...
            </h2>
            <p style={{ fontSize: "14px", color: GRY, margin: 0 }}>
              Analyzing role context to identify key areas for candidate exploration
            </p>
            {extractionError && (
              <div style={{
                marginTop: "24px", padding: "12px 16px", background: "#fff5f5",
                border: `1px solid ${RED}`, fontSize: "13px", color: RED, textAlign: "left",
              }}>
                {extractionError}
              </div>
            )}
          </div>
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {phase === "dimensions" && dimensions && roleContext && (
        <DimensionReviewPhase
          dimensions={dimensions}
          setDimensions={setDimensions}
          roleContext={roleContext}
          onBack={() => setPhase("review")}
          onGenerate={handleGenerateSession}
          isGenerating={isGenerating}
          generateError={generateError}
        />
      )}

      {phase === "confirmation" && roleContext && (
        <ConfirmationPhase
          roleContext={roleContext}
          sessionConfig={sessionConfig}
          onStartNew={handleStartNew}
        />
      )}

      <style>{`
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

// ── Shared styles ──
const containerStyle = {
  maxWidth: "560px",
  margin: "0 auto",
  padding: "40px 32px 64px",
  fontFamily: FONT,
  color: BLK,
};

const primaryButtonStyle = {
  flex: 1,
  padding: "14px 24px",
  fontFamily: FONT,
  fontSize: "13px",
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  background: RED,
  color: "#fff",
  border: "none",
  cursor: "pointer",
  borderRadius: 0,
};

const secondaryButtonStyle = {
  padding: "14px 24px",
  fontFamily: FONT,
  fontSize: "13px",
  fontWeight: 500,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  background: "none",
  color: BLK,
  border: `1px solid ${BLK}`,
  cursor: "pointer",
  borderRadius: 0,
};

const editLinkStyle = {
  background: "none",
  border: "none",
  color: RED,
  fontSize: "12px",
  cursor: "pointer",
  fontFamily: FONT,
  textDecoration: "underline",
  padding: 0,
};
