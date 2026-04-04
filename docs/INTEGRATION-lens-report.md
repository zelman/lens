# Integration: Lens Report Renderer → lens-form.jsx

## What This Is

The report renderer is a **new final stage** of the existing lens app — same app, same URL, same session. After the user completes discovery and synthesis, the app renders their lens as a polished Swiss Style professional identity document instead of showing raw markdown. The user never leaves the app or navigates to a different page.

The renderer lives in its own file (`lens-report-renderer.jsx`) for code organization, but it is imported into and rendered within `lens-form.jsx`. There is no separate URL, no separate deployment, no standalone page. The paste-and-render UI in the default export exists only for development testing — users in production never see it.

## User Flow After Integration

```
Same URL, same session, same app:

[Intro] → [Upload Context] → [Status] → [Discovery] → [Synthesis] → [Report View]
                                                                         ↓
                                                              Tab: Report (default)
                                                              Tab: Markdown (raw + download)
                                                              Button: Download PDF (print)
```

The user finishes discovery, the app synthesizes their lens, and the next thing they see is the polished report. They can download PDF, switch to the Markdown tab for the raw file, or copy to clipboard. They never leave the page.

## Current State

**lens-form.jsx** (~800 lines, in `zelman/lens/components/`)
- 6 phases: status → resume → intro → discovery → synthesis → done
- The "done" phase currently shows raw markdown + YAML with download (.md) and copy-to-clipboard
- The synthesis phase produces a markdown string with YAML frontmatter

**lens-report-renderer.jsx** (new, in `zelman/lens/components/`)
- Self-contained: includes parser, section matchers, and all section renderers
- Has two modes: an input mode (paste markdown into textarea) and a report mode (rendered output)
- Only the report mode is needed for integration — the paste UI is for standalone use

## What To Do

### Step 1: Copy the file

Place `lens-report-renderer.jsx` at `zelman/lens/components/lens-report-renderer.jsx`.

### Step 2: Extract the render-only exports

The renderer file exports a default component (`LensReportRenderer`) that includes a paste-and-render UI for development testing. **This default export is not used in production.** For integration, lens-form.jsx only needs two things:

1. `parseLens(markdownString)` — returns `{ fm, sections }`
2. `<LensReport data={parsedData} />` — renders the formatted report

Add named exports to lens-report-renderer.jsx:

```javascript
// At the bottom of lens-report-renderer.jsx, add:
export { parseLens, LensReport };
// Keep the default export for standalone use:
export default LensReportRenderer;
```

The functions/components to export are already defined in the file:
- `parseLens` (line ~95) — the parser
- `LensReport` (line ~500) — the report renderer component

### Step 3: Modify the "done" phase in lens-form.jsx

In the current "done" phase, the app shows raw markdown. Replace this with a two-tab view:

**Tab 1: "Report" (default)** — the polished rendered report
**Tab 2: "Markdown"** — the raw markdown with download/copy (existing functionality)

```jsx
import { parseLens, LensReport } from './lens-report-renderer';

// Inside the "done" phase render:
const [viewMode, setViewMode] = useState('report'); // 'report' | 'markdown'
const parsedLens = useMemo(() => parseLens(generatedMarkdown), [generatedMarkdown]);

// Tab bar
<div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #1A1A1A', marginBottom: 24 }}>
  <button
    onClick={() => setViewMode('report')}
    style={{
      padding: '10px 20px',
      fontSize: 13,
      fontWeight: 600,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      background: 'transparent',
      color: viewMode === 'report' ? '#D93025' : '#999',
      border: 'none',
      borderBottom: viewMode === 'report' ? '2px solid #D93025' : '2px solid transparent',
      marginBottom: -2,
      cursor: 'pointer',
    }}
  >
    Report
  </button>
  <button
    onClick={() => setViewMode('markdown')}
    style={{
      // Same styles, swap viewMode check to 'markdown'
    }}
  >
    Markdown
  </button>
</div>

// Content
{viewMode === 'report' ? (
  <LensReport data={parsedLens} />
) : (
  // Existing markdown display + download/copy UI
)}
```

### Step 4: Ensure the print CSS is loaded

The `LensReport` component depends on a `<style>` tag with `@media print` rules. In the standalone version, this is injected by the parent `LensReportRenderer` component. Since we're importing `LensReport` directly, the print CSS needs to be added.

Either:
- Import and render the `PRINT_CSS` constant (export it from the renderer)
- Or just add the print styles to lens-form.jsx's existing style block

The print CSS is:
```css
@media print {
  .no-print { display: none !important; }
  body { margin: 0; padding: 0; }
  #lens-report { padding: 36px 44px !important; max-width: none !important; }
  section { page-break-inside: avoid; }
  @page { margin: 0.5in; size: letter; }
}
```

### Step 5: Replace the synthesis system prompt

**This is the most important step.** The report renderer can only display what the synthesis prompt produces. If the prompt generates bullet-point-style output, the renderer will show pretty bullet points — not the flowing narrative prose that justifies 45 minutes of discovery.

Replace the current synthesis system prompt in lens-form.jsx with the contents of `SYNTHESIS-PROMPT.md`. That file contains the complete prompt with:
- 6-section structure (Essence, Skills & Experience, Values, Mission & Direction, Work Style, Non-Negotiables)
- Voice rules (third person, narrative prose, specific over generic)
- Per-section writing guidance with examples
- Failure modes to avoid
- YAML frontmatter spec including the `stats` field for the hero stats bar
- Temperature, token budget, and retry logic recommendations

The synthesis API call should include:
1. The synthesis system prompt from `SYNTHESIS-PROMPT.md`
2. The full discovery conversation history (all 8 sections of Q&A)
3. Any uploaded context (resume text, LinkedIn content, assessments)
4. The user's name and status from the intake phases

If stats aren't available from the conversation, the stats bar simply won't render — it's a graceful absence.

## What NOT To Do

- **Don't create a separate URL or route for the report.** The report renders inside the existing lens-form.jsx flow at the same URL. No new pages, no new endpoints.
- **Don't expose the paste-and-render UI to users.** The default export with the textarea is for dev testing only. Users reach the report through the discovery flow.
- Don't remove the markdown download. Keep it as a secondary tab — some users may want the raw file.
- Don't change existing tester URLs. The renderer is additive, not a replacement of any deployed endpoint.
- Don't embed scoring language. The report is a professional identity document. No scores, thresholds, signals, or pipeline references.
- Don't change the SAMPLE_MD constant in the renderer. It's there for dev testing of the standalone export and won't affect the integrated version.

## File Map After Integration

```
zelman/lens/
├── components/
│   ├── lens-form.jsx              # Modified: imports LensReport, adds report tab, new synthesis prompt
│   ├── lens-report-renderer.jsx   # New: report renderer (named exports for integration)
│   ├── lens-scorer.jsx            # Unchanged
│   └── lens-feedback-form.jsx     # Unchanged
├── docs/
│   ├── INTEGRATION-lens-report.md # This file — integration spec for Claude Code
│   └── SYNTHESIS-PROMPT.md        # The synthesis system prompt (reference copy)
```

## Testing

1. Run the standalone renderer: paste any lens markdown, verify all 6 sections render
2. Run lens-form.jsx through a full discovery flow, verify the "done" phase shows the Report tab by default
3. Print to PDF from the Report tab, verify clean page breaks and no UI chrome in output
4. Switch to Markdown tab, verify download and copy still work
5. Test with a lens that has fewer than 6 sections — verify it renders what's present without errors
