import { useState, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   LENS REPORT RENDERER v2.0
   Professional identity document — Swiss Style, graphically rich
   ═══════════════════════════════════════════════════════════════════════════ */

// ─── Sample ─────────────────────────────────────────────────────────────────
const SAMPLE_MD = `---
name: Eric Zelman
title: VP / Head of Customer Support & Success Operations
sector: B2B SaaS
stage: Series A–B
date: April 2026
status: Actively Searching
stats: 18+ years | 25-person team built | 3 continents | 13 products supported
---

## Essence

Eric builds the bridge between a product that works and the people who need it to. Across eighteen years and five companies, the pattern is the same: he walks into organizations where the post-sales experience is an afterthought — where customers are left to figure it out on their own, where support is reactive and success is aspirational — and he builds the function that makes the product's promise real.

He is not a maintainer. He doesn't optimize what already exists. He's the person you bring in when there is no playbook, no team, no process — just customers who need help and a product worth helping them use. He creates the conditions where people can flourish, then gets out of the way. The best sign his work is done is when nobody notices the scaffolding anymore.

His mind moves fast. He gathers input widely but decides quickly, because momentum matters more than perfection in the environments where he does his best work. He has strong opinions and the drive to act on them. Sitting in an organization where problems are visible but unfixable is the thing that drains him most.

## Skills & Experience

Eric started at Apple, spending six years managing enterprise education accounts at Harvard and Tufts — learning how large institutions actually adopt technology, which is to say slowly, politically, and with far more human complexity than anyone plans for. From there he moved through field marketing at Alliance HealthCare and HP/Palm, then into early-stage B2B SaaS at Apperian, where he first discovered what it felt like to build something from nothing.

Bigtincan is where the throughline crystallized. Over thirteen years, he built the customer support organization from a team of one to twenty-five people across three continents, supporting a $130M B2B SaaS platform with 1,500 customers globally. He managed a $2M annual budget, oversaw 15,000+ cases per year at 93%+ CSAT, led ISO 27001 and SOC-2 compliance implementation, and deployed AI-powered agent assistance tooling. The customer range spanned $20K ARR startups to $2M+ ARR enterprises — he's seen the full spectrum of what "customer success" means at different scales.

What he carries forward: building and scaling support organizations from scratch, compliance frameworks for regulated industries, cross-functional leadership across distributed teams, and the ability to design systems that keep working after he leaves the room.

What he's done with: inheriting someone else's established operation and being asked to optimize it. He's done maintenance work. It makes him restless.

## Values

Ownership comes first. Eric needs to feel like a builder with real authority, not an employee executing someone else's checklist. When he can shape the function — define the processes, hire the team, make the hard calls — he does his best work. When he's handed a playbook and told to run it, he disengages.

Candor is non-negotiable. He needs honesty to flow upward without consequence and feedback to be treated as useful information, not negativity. He's worked in environments where candor was politically expensive — where raising a real problem got you labeled as difficult — and he cannot build anything meaningful under those conditions. He values transparency in compensation discussions, accountability when people leave, and psychological safety in every team setting.

Constructive friction is how he thinks. He doesn't want harmony for its own sake. He wants structured disagreement — thoughtful processes where people can challenge each other's ideas without it becoming personal or chaotic. Reactive chaos creates anxiety. Thoughtful conflict creates better decisions.

He advocates for people as people — customers and team members both. The moment an organization starts treating either group as abstractions on a dashboard, he loses the thread of why he's there.

## Mission & Direction

Eric is drawn to VC-backed Series A to early Series B companies — thirty to a hundred people, under $75M raised — solving real problems for people who can't wait for better solutions. B2B SaaS serving non-technical business users in healthcare operations, compliance-heavy environments like government services or financial services, or workforce enablement tools where the end users didn't choose the technology but have to live with it every day.

The window he thrives in is specific: post-product-market-fit, pre-established-CS-function. The product works. Customers are paying. But nobody has built the bridge between the product and the people using it. That's the blank canvas where he does his best work — under genuine growth pressure, not theoretical planning.

The users he's most drawn to serving are clinic administrators, caseworkers, field technicians — people who measure success by whether Tuesday sucked less than Monday. Not power users exploring features. People with real jobs and real consequences when software doesn't work.

## Work Style

Eric has worked remotely for twenty-five years and it's not a preference — it's how he's wired to be productive. He needs schedule and location control. His best deep work happens in coffee shops. His best reactive work happens in short, focused video calls with small groups — under five people, with concrete next steps and forward momentum, not status theater.

He thrives on about a 70/30 split between focused strategic work and reactive problem-solving. Pure strategy without customer contact makes him restless. Pure firefighting without building toward something burns him out. The combination — building frameworks in the morning, coaching a team member through an escalation in the afternoon — is where he produces the most value.

He communicates through thoughtful writing over instant messaging. Constant Slack interruptions fragment his attention in ways that make everything worse. He's at his best when he can think in complete thoughts, respond deliberately, and trust that his team is doing the same.

Eric has ADHD, which means he's either deeply locked in or completely unmoored — there isn't much middle ground. Dynamic work with visible impact and quick feedback loops keeps him engaged. Environments that demand sustained attention to low-stakes details without clear purpose are where he struggles. This isn't a limitation he manages around; it's the engine behind why he's drawn to building things from scratch, where the work is urgent, varied, and matters.

## Non-Negotiables

PE-backed companies are out — the extraction timeline corrupts the customer success function before anyone can build anything worth keeping. Job descriptions that lead with NRR ownership signal he'd be inheriting someone else's scorecard rather than building his own. Companies over $75M in funding or 150+ employees are too far past the building stage, unless there's a rebuilder situation, a new product line, or recent CS leadership turnover that reopens the canvas.

Developer tools under fifty people without enterprise motion — meaning $30K+ deals, multiple buying stakeholders, and contract complexity — don't have the post-sales complexity that makes his skillset relevant. Environments where candor is managed or unwelcome are a hard stop; he's been in those rooms and doesn't go back. Pure IC roles without a path to team-building aren't what he's looking for at this stage.

Sub-$125K base salary signals that the organization views customer success as a cost center, not a strategic function. Director-plus title is the minimum — not for ego, but because it signals organizational commitment to the function he's being asked to build. And he pays attention to interview processes: if the team shows no disagreement and compensation discussions are evasive, that tells him everything he needs to know about the culture he'd be walking into.`;

// ─── Parser ─────────────────────────────────────────────────────────────────

function parseLens(raw) {
  const t = raw.trim();
  let fm = {}, body = t;
  if (t.startsWith("---")) {
    const end = t.indexOf("---", 3);
    if (end !== -1) {
      fm = parseYaml(t.slice(3, end).trim());
      body = t.slice(end + 3).trim();
    }
  }
  return { fm, sections: parseSections(body) };
}

function parseYaml(s) {
  const r = {};
  for (const line of s.split("\n")) {
    const l = line.trim();
    if (!l || l.startsWith("#")) continue;
    const ci = l.indexOf(":");
    if (ci === -1) continue;
    r[l.slice(0, ci).trim()] = l.slice(ci + 1).trim();
  }
  return r;
}

function parseSections(body) {
  const secs = [], lines = body.split("\n");
  let cur = null;
  for (const line of lines) {
    // Match ## Header, ## 01 Header, # Header — flexible
    const m = line.match(/^#{1,3}\s+(?:\d{1,2}[\s.)]+)?(.+)/);
    if (m) {
      if (cur) secs.push(cur);
      cur = { title: m[1].trim(), content: "" };
    } else if (cur) {
      cur.content += line + "\n";
    }
  }
  if (cur) secs.push(cur);
  return secs;
}

// ─── Section Key Mapping ────────────────────────────────────────────────────

// Fuzzy matching rules: each key has an array of substrings to match against
const KEY_RULES = [
  { key: "essence",       match: ["essence"] },
  { key: "professional",  match: ["professional identity", "career arc", "career history", "professional background"] },
  { key: "skills",        match: ["skills", "experience", "competenc"] },
  { key: "values",        match: ["values", "beliefs"] },
  { key: "mission",       match: ["mission", "sector", "direction", "industries", "domain"] },
  { key: "workstyle",     match: ["work style", "work environment", "how i work", "how you work", "working style"] },
  { key: "energy",        match: ["energi", "fills", "empties", "drains", "what fills", "what empties", "energy"] },
  { key: "dq",            match: ["non-negotiable", "disqualif", "dealbreaker", "deal-breaker", "hard no", "must have", "must-have"] },
  { key: "situation",     match: ["situation", "timeline", "status", "availability", "timing"] },
];

const SKIP_PATTERNS = ["scoring", "signal", "threshold", "builder vs", "maintainer", "positive signal", "key matching", "scoring config", "scoring profile", "target profile", "key bonus", "career lens document", "career lens doc"];

const ORDERED_KEYS = ["essence", "professional", "skills", "values", "mission", "workstyle", "energy", "dq", "situation"];

const NICE_TITLES = {
  essence: "Essence", professional: "Professional Identity", skills: "Skills & Experience",
  values: "Values", mission: "Mission & Direction", workstyle: "Work Style",
  energy: "What Energizes You", dq: "Non-Negotiables", situation: "Situation & Timeline",
};

function keyOf(title) {
  const l = title.toLowerCase().trim();
  // Exact first pass
  for (const rule of KEY_RULES) {
    for (const m of rule.match) {
      if (l === m || l.includes(m)) return rule.key;
    }
  }
  return null;
}

function shouldSkip(title) {
  const l = title.toLowerCase();
  return SKIP_PATTERNS.some(s => l.includes(s));
}

// ─── Inline MD ──────────────────────────────────────────────────────────────

function inl(text) {
  const parts = [];
  let rest = text, k = 0;
  while (rest.length > 0) {
    const bm = rest.match(/\*\*(.+?)\*\*/);
    const im = rest.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/);
    let e = null, ei = rest.length;
    if (bm && bm.index < ei) { e = { t: "b", m: bm }; ei = bm.index; }
    if (im && im.index < ei && (!bm || im.index < bm.index)) { e = { t: "i", m: im }; ei = im.index; }
    if (!e) { parts.push(rest); break; }
    if (ei > 0) parts.push(rest.slice(0, ei));
    parts.push(e.t === "b"
      ? <strong key={k++} style={{ fontWeight: 600 }}>{e.m[1]}</strong>
      : <em key={k++}>{e.m[1]}</em>);
    rest = rest.slice(ei + e.m[0].length);
  }
  return parts;
}

// ─── Renderers ──────────────────────────────────────────────────────────────

// --- Essence: pull quote + body ---
function EssenceBlock({ content }) {
  const trimmed = content.trim();
  if (!trimmed) return null;

  // Split into paragraphs (double newline separated)
  const paragraphs = trimmed.split(/\n\s*\n/).filter(p => p.trim());
  if (!paragraphs.length) return null;

  // Pull quote: first sentence of first paragraph
  const firstPara = paragraphs[0].replace(/\n/g, " ").trim();
  const sentEnd = firstPara.indexOf(". ");
  let pullQuote, firstParaRemainder;

  if (sentEnd > 20 && sentEnd < 200) {
    pullQuote = firstPara.slice(0, sentEnd + 1);
    firstParaRemainder = firstPara.slice(sentEnd + 2).trim();
  } else {
    pullQuote = firstPara;
    firstParaRemainder = null;
  }

  // Reassemble body: remainder of first paragraph + remaining paragraphs
  const bodyParts = [];
  if (firstParaRemainder) bodyParts.push(firstParaRemainder);
  for (let i = 1; i < paragraphs.length; i++) {
    bodyParts.push(paragraphs[i].replace(/\n/g, " ").trim());
  }

  return (
    <div>
      <div style={ST.pullQuote}>{inl(pullQuote)}</div>
      {bodyParts.length > 0 && (
        <div style={ST.essenceBody}>
          {bodyParts.map((p, i) => (
            <p key={i} style={ST.para}>{inl(p)}</p>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Stats bar ---
function StatsBar({ statsStr }) {
  if (!statsStr) return null;
  const items = statsStr.split("|").map(s => s.trim()).filter(Boolean);
  if (!items.length) return null;

  const parsed = items.map(item => {
    // Try to extract a number/value and label
    const numMatch = item.match(/^([\d+→,.]+[+x]?)\s+(.+)/);
    if (numMatch) return { value: numMatch[1], label: numMatch[2] };
    // Try "Nx something"
    const nxMatch = item.match(/^(\d+x)\s+(.+)/i);
    if (nxMatch) return { value: nxMatch[1], label: nxMatch[2] };
    // Fallback: everything is the label
    return { value: null, label: item };
  });

  return (
    <div style={ST.statsBar}>
      {parsed.map((s, i) => (
        <div key={i} style={ST.statItem}>
          {s.value ? (
            <>
              <div style={ST.statValue}>{s.value}</div>
              <div style={ST.statLabel}>{s.label}</div>
            </>
          ) : (
            <div style={ST.statLabelOnly}>{s.label}</div>
          )}
        </div>
      ))}
    </div>
  );
}

// --- Values grid (key | description) — adapts to content length ---
function ValuesGrid({ content }) {
  const lines = content.trim().split("\n").filter(l => l.trim());
  const pairs = [];
  const prose = [];

  for (const line of lines) {
    // Pipe-delimited: "Transparency | Over diplomacy..."
    const pipeMatch = line.match(/^([^|]+)\|\s*(.+)/);
    if (pipeMatch) {
      pairs.push({ key: pipeMatch[1].trim(), desc: pipeMatch[2].trim() });
      continue;
    }
    // Bold key: "**Transparency** Over diplomacy..." — requires actual ** markers
    const boldKV = line.match(/^\*\*([^*]+)\*\*\s+(.{10,})/);
    if (boldKV && !line.startsWith("-") && !line.startsWith("•")) {
      pairs.push({ key: boldKV[1].trim(), desc: boldKV[2].trim() });
      continue;
    }
    prose.push(line);
  }

  if (pairs.length === 0) {
    return <GenericContent content={content} sKey="values" />;
  }

  // If avg description > 120 chars, switch to stacked card layout
  const avgLen = pairs.reduce((sum, p) => sum + p.desc.length, 0) / pairs.length;
  const isLong = avgLen > 120;

  return (
    <div>
      {prose.length > 0 && <div style={{ marginBottom: 16 }}>{renderParagraphs(prose.join("\n"))}</div>}
      {isLong ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {pairs.map((p, i) => (
            <div key={i} style={ST.valueCard}>
              <div style={ST.valueCardKey}>{p.key}</div>
              <div style={ST.valueCardDesc}>{inl(p.desc)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={ST.valuesGrid}>
          {pairs.map((p, i) => (
            <div key={i} style={ST.valueRow}>
              <div style={ST.valueKey}>{p.key}</div>
              <div style={ST.valueDesc}>{inl(p.desc)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Work Style grid ---
function WorkStyleGrid({ content }) {
  const lines = content.trim().split("\n").filter(l => l.trim());
  const pairs = [];
  const prose = [];

  for (const line of lines) {
    const pipeMatch = line.match(/^([^|]+)\|\s*(.+)/);
    if (pipeMatch) {
      pairs.push({ key: pipeMatch[1].trim(), desc: pipeMatch[2].trim() });
      continue;
    }
    prose.push(line);
  }

  if (pairs.length === 0) {
    return <GenericContent content={content} sKey="workstyle" />;
  }

  return (
    <div>
      {prose.length > 0 && <div style={{ marginBottom: 16 }}>{renderParagraphs(prose.join("\n"))}</div>}
      <div style={ST.wsGrid}>
        {pairs.map((p, i) => (
          <div key={i} style={ST.wsRow}>
            <div style={ST.wsKey}>{p.key}</div>
            <div style={ST.wsDesc}>{inl(p.desc)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Energy columns ---
function EnergyBlock({ content }) {
  if (!content?.trim()) return null;
  const text = content.trim();

  // Find energizes/drains or fills/empties blocks
  const posMatch = text.match(/\*\*(Energizes|What Fills[^*]*):?\*\*/i);
  const negMatch = text.match(/\*\*(Drains|What Empties[^*]*|What Drains[^*]*):?\*\*/i);

  if (!posMatch || !negMatch) {
    return <GenericContent content={content} sKey="energy" />;
  }

  const negIdx = text.indexOf(negMatch[0]);
  const posBlock = text.slice(posMatch.index + posMatch[0].length, negIdx).trim();
  const negBlock = text.slice(negIdx + negMatch[0].length).trim();

  const extract = (block) =>
    block.split("\n").filter(l => l.match(/^\s*[-•]\s/)).map(l => l.replace(/^\s*[-•]\s+/, "").trim());

  const posItems = extract(posBlock);
  const negItems = extract(negBlock);

  return (
    <div style={ST.energyWrap}>
      <div style={ST.energyCol}>
        <div style={ST.energyPosHeader}>
          <span style={ST.energyDot("#2D6A2D")} />
          {posMatch[1]}
        </div>
        {posItems.map((it, j) => (
          <div key={j} style={ST.energyItem}>{it}</div>
        ))}
      </div>
      <div style={ST.energyDivider} />
      <div style={ST.energyCol}>
        <div style={ST.energyNegHeader}>
          <span style={ST.energyDot("#999")} />
          {negMatch[1]}
        </div>
        {negItems.map((it, j) => (
          <div key={j} style={ST.energyItem}>{it}</div>
        ))}
      </div>
    </div>
  );
}

// --- Non-Negotiables ---
function DQBlock({ content }) {
  if (!content?.trim()) return null;
  const lines = content.trim().split("\n");
  const items = [], prose = [];

  for (const line of lines) {
    if (line.match(/^\s*[-•✕]\s/)) {
      items.push(line.replace(/^\s*[-•✕]\s+/, "").trim());
    } else if (line.trim()) {
      prose.push(line);
    }
  }

  // If no bullet items, this is narrative prose — render as regular paragraphs
  if (items.length === 0) {
    return <GenericContent content={content} sKey="dq" />;
  }

  return (
    <div>
      {prose.length > 0 && (
        <p style={{ ...ST.para, color: "#666", fontStyle: "italic", marginBottom: 16 }}>
          {inl(prose.join(" "))}
        </p>
      )}
      <div style={ST.dqList}>
        {items.map((it, j) => (
          <div key={j} style={ST.dqRow}>
            <div style={ST.dqMarker}>✕</div>
            <div style={ST.dqText}>{inl(it)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Situation KV ---
function SituationBlock({ content }) {
  if (!content?.trim()) return null;
  const lines = content.trim().split("\n").filter(l => l.trim());
  const kvs = [], prose = [];

  for (const line of lines) {
    const pipe = line.match(/^([^|]+)\|\s*(.+)/);
    if (pipe) { kvs.push([pipe[1].trim(), pipe[2].trim()]); continue; }
    const boldKV = line.match(/^\*\*(.+?)\*\*:?\s+(.+)/);
    if (boldKV) { kvs.push([boldKV[1].replace(/:$/, ""), boldKV[2].trim()]); continue; }
    prose.push(line);
  }

  return (
    <div>
      {kvs.length > 0 && (
        <div style={ST.sitGrid}>
          {kvs.map(([k, v], i) => (
            <div key={i} style={ST.sitCell}>
              <div style={ST.sitKey}>{k}</div>
              <div style={ST.sitVal}>{v}</div>
            </div>
          ))}
        </div>
      )}
      {prose.length > 0 && (
        <div style={{ marginTop: kvs.length ? 16 : 0 }}>
          {renderParagraphs(prose.join("\n"))}
        </div>
      )}
    </div>
  );
}

// --- Generic fallback ---
function GenericContent({ content, sKey }) {
  if (!content?.trim()) return null;
  const lines = content.trim().split("\n");
  const elems = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    const boldHead = line.match(/^\*\*(.+?)\*\*:?\s*$/);
    if (boldHead) {
      elems.push(<div key={`bh-${i}`} style={ST.subHeader}>{boldHead[1].replace(/:$/, "")}</div>);
      i++; continue;
    }

    if (line.match(/^\s*[-•✕]\s/)) {
      const items = [];
      while (i < lines.length && lines[i].match(/^\s*[-•✕]\s/)) {
        items.push(lines[i].replace(/^\s*[-•✕]\s+/, "").trim());
        i++;
      }
      elems.push(
        <ul key={`ul-${i}`} style={ST.list}>
          {items.map((it, j) => (
            <li key={j} style={ST.li}><span style={ST.bullet}>·</span><span>{inl(it)}</span></li>
          ))}
        </ul>
      );
      continue;
    }

    if (!line.trim()) { i++; continue; }

    const pLines = [line]; i++;
    while (i < lines.length && lines[i].trim() && !lines[i].match(/^##/) && !lines[i].match(/^\*\*(.+?)\*\*:?\s*$/) && !lines[i].match(/^\s*[-•✕]\s/)) {
      pLines.push(lines[i]); i++;
    }
    elems.push(<p key={`p-${i}`} style={ST.para}>{inl(pLines.join(" "))}</p>);
  }

  return <>{elems}</>;
}

function renderParagraphs(text) {
  return text.split(/\n\s*\n/).filter(p => p.trim()).map((p, i) => (
    <p key={i} style={ST.para}>{inl(p.replace(/\n/g, " ").trim())}</p>
  ));
}

// ─── Report ─────────────────────────────────────────────────────────────────

function LensReport({ data }) {
  const { fm, sections } = data;

  // Map sections by recognized key; collect unmatched sections separately
  const sMap = {};
  const extras = [];
  for (const sec of sections) {
    if (shouldSkip(sec.title)) continue;
    const k = keyOf(sec.title);
    if (k && !sMap[k]) {
      sMap[k] = { ...sec, key: k };
    } else if (k && sMap[k]) {
      sMap[k].content += "\n" + sec.content;
    } else {
      // Unrecognized section — keep it, don't drop it
      extras.push({ ...sec, key: "extra" });
    }
  }

  // Build ordered list: known keys in display order, then extras at the end
  const ordered = [];
  for (const k of ORDERED_KEYS) {
    if (sMap[k]) ordered.push({ key: k, title: NICE_TITLES[k] || sMap[k].title, content: sMap[k].content });
  }
  for (const ex of extras) {
    ordered.push({ key: "extra", title: ex.title, content: ex.content });
  }

  const name = fm.name || "Lens Report";
  const subtitle = [fm.title, fm.sector, fm.stage].filter(Boolean).join(" · ");
  const dateLine = fm.date ? `Generated ${fm.date}` : null;
  const statusLine = fm.status || null;
  const hasSituation = sMap.situation;

  const renderSection = (sec, idx) => {
    const num = String(idx + 1).padStart(2, "0");
    const inner = (() => {
      switch (sec.key) {
        case "essence": return <EssenceBlock content={sec.content} />;
        case "values": return <ValuesGrid content={sec.content} />;
        case "workstyle": return <WorkStyleGrid content={sec.content} />;
        case "energy": return <EnergyBlock content={sec.content} />;
        case "dq": return <DQBlock content={sec.content} />;
        case "situation": return <SituationBlock content={sec.content} />;
        default: return <GenericContent content={sec.content} sKey={sec.key} />;
      }
    })();

    return (
      <section key={idx} style={ST.section}>
        <div style={ST.secHead}>
          <span style={ST.secNum}>{num}</span>
          <span style={ST.secTitle}>{sec.title}</span>
        </div>
        <div style={ST.secBody}>{inner}</div>
      </section>
    );
  };

  return (
    <div>
      <div style={ST.printBar} className="no-print">
        <button onClick={() => window.print()} style={ST.printBtn}>Download PDF</button>
        <span style={{ fontSize: 12, color: "#999" }}>Uses browser print → "Save as PDF"</span>
      </div>

      <div style={ST.report} id="lens-report">
        {/* ─── Header ─── */}
        <header style={ST.header}>
          <div style={ST.brand}>THE LENS PROJECT</div>
          <div style={ST.headerFlex}>
            <div>
              <h1 style={ST.name}>{name}</h1>
              {subtitle && <div style={ST.subtitle}>{subtitle}</div>}
            </div>
            {statusLine && (
              <div style={ST.statusBadge}>
                <div style={ST.statusDot} />
                {statusLine}
              </div>
            )}
          </div>
          {dateLine && <div style={ST.dateLine}>{dateLine}</div>}
          <div style={ST.headerRule} />
        </header>

        {/* ─── Stats Bar ─── */}
        <StatsBar statsStr={fm.stats} />

        {/* ─── Sections ─── */}
        {ordered.map((sec, idx) => renderSection(sec, idx))}

        {/* ─── Footer ─── */}
        <footer style={ST.footer}>
          <div style={ST.footerRule} />
          <p style={ST.footerText}>
            This document was generated through structured discovery — a guided conversation designed to surface the patterns, values, and preferences that define how you work and what you're looking for. It is a living document; revisit it as your thinking evolves.
          </p>
          <div style={ST.footerBrand}>The Lens Project</div>
        </footer>
      </div>
    </div>
  );
}

// ─── App ────────────────────────────────────────────────────────────────────

export default function LensReportRenderer() {
  const [mode, setMode] = useState("input");
  const [raw, setRaw] = useState("");
  const [parsed, setParsed] = useState(null);
  const [err, setErr] = useState(null);

  const go = useCallback(() => {
    try {
      const data = parseLens(raw);
      if (!data.sections.length) { setErr("No ## sections found in the markdown."); return; }
      setParsed(data); setErr(null); setMode("report");
    } catch (e) { setErr("Parse error: " + e.message); }
  }, [raw]);

  return (
    <>
      <style>{PRINT_CSS}</style>
      <div style={ST.root}>
        {mode === "input" ? (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={ST.inputBrand}>LENS REPORT</div>
              <h2 style={ST.inputTitle}>Generate a formatted report</h2>
              <p style={ST.inputDesc}>
                Paste Lens markdown below to produce a printable professional identity document.
              </p>
            </div>

            <textarea
              value={raw}
              onChange={e => setRaw(e.target.value)}
              placeholder={"---\nname: Your Name\ntitle: Your Role\nstats: 10+ years | 3 companies | Teams to 20\n---\n\n## Essence\n\n...\n\n## Values\n\n..."}
              style={ST.ta}
              spellCheck={false}
            />

            {err && <div style={ST.error}>{err}</div>}

            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <button onClick={go} disabled={!raw.trim()} style={{ ...ST.btn, ...(raw.trim() ? ST.btnP : ST.btnD) }}>
                Generate Report
              </button>
              <button onClick={() => setRaw(SAMPLE_MD)} style={ST.btnS}>Load Sample</button>
            </div>
          </div>
        ) : (
          <div>
            <div className="no-print" style={{ marginBottom: 16 }}>
              <button onClick={() => setMode("input")} style={ST.btnBack}>← Back to editor</button>
            </div>
            {parsed && <LensReport data={parsed} />}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const F = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'Fira Code', Consolas, monospace";
const RED = "#D93025";
const GREEN = "#2D6A2D";

const ST = {
  root: { fontFamily: F, color: "#1A1A1A", maxWidth: 800, margin: "0 auto", padding: "24px 16px" },

  // Input
  inputBrand: { fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: RED, marginBottom: 8 },
  inputTitle: { fontSize: 24, fontWeight: 600, margin: "0 0 8px", color: "#1A1A1A" },
  inputDesc: { fontSize: 14, lineHeight: 1.6, color: "#666", margin: 0 },
  ta: { width: "100%", minHeight: 340, padding: 16, fontFamily: MONO, fontSize: 13, lineHeight: 1.5, color: "#1A1A1A", background: "#FAFAFA", border: "1px solid #DDD", borderRadius: 0, resize: "vertical", outline: "none", boxSizing: "border-box" },
  error: { padding: "10px 14px", background: "#FFF0F0", border: `1px solid ${RED}`, color: RED, fontSize: 13, marginTop: 12 },
  btn: { padding: "10px 24px", fontSize: 14, fontWeight: 600, fontFamily: F, border: "none", cursor: "pointer", borderRadius: 0 },
  btnP: { background: RED, color: "#FFF" },
  btnD: { background: "#DDD", color: "#999", cursor: "not-allowed" },
  btnS: { padding: "10px 24px", fontSize: 14, fontWeight: 500, fontFamily: F, background: "transparent", color: "#666", border: "1px solid #DDD", cursor: "pointer", borderRadius: 0 },
  btnBack: { padding: "8px 16px", fontSize: 13, fontFamily: F, background: "transparent", color: "#666", border: "1px solid #DDD", cursor: "pointer", borderRadius: 0 },

  // Report
  report: { background: "#FFF", padding: "48px 56px", maxWidth: 740, margin: "0 auto" },

  // Header
  header: { marginBottom: 12 },
  brand: { fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#BBB", marginBottom: 24 },
  headerFlex: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 },
  name: { fontSize: 34, fontWeight: 700, margin: 0, lineHeight: 1.1, color: "#1A1A1A" },
  subtitle: { fontSize: 15, color: "#666", marginTop: 6 },
  dateLine: { fontSize: 12, color: "#BBB", marginTop: 8 },
  statusBadge: { display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, color: "#666", background: "#F5F5F5", padding: "6px 14px", whiteSpace: "nowrap", flexShrink: 0, marginTop: 4 },
  statusDot: { width: 7, height: 7, borderRadius: "50%", background: GREEN, flexShrink: 0 },
  headerRule: { height: 3, background: "#1A1A1A", marginTop: 20 },

  // Stats bar
  statsBar: { display: "flex", gap: 0, marginBottom: 32, borderBottom: "1px solid #EEE" },
  statItem: { flex: 1, padding: "20px 0", borderRight: "1px solid #EEE", textAlign: "center" },
  statValue: { fontSize: 28, fontWeight: 700, color: RED, fontFamily: MONO, lineHeight: 1.1 },
  statLabel: { fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#999", marginTop: 6, padding: "0 8px" },
  statLabelOnly: { fontSize: 13, fontWeight: 600, color: "#666", padding: "8px" },

  // Section
  section: { marginBottom: 36 },
  secHead: { display: "flex", alignItems: "baseline", gap: 14, marginBottom: 16 },
  secNum: { fontSize: 14, fontWeight: 700, color: RED, fontFamily: MONO },
  secTitle: { fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1A1A1A" },
  secBody: {},

  // Content
  subHeader: { fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: RED, marginTop: 18, marginBottom: 8 },
  para: { fontSize: 14, lineHeight: 1.75, color: "#333", margin: "8px 0" },
  list: { margin: "6px 0", padding: 0, listStyle: "none" },
  li: { display: "flex", gap: 10, padding: "3px 0", fontSize: 14, lineHeight: 1.6, color: "#333" },
  bullet: { color: "#CCC", flexShrink: 0, fontSize: 18, lineHeight: "22px" },

  // Pull quote (essence)
  pullQuote: { fontSize: 20, fontWeight: 400, lineHeight: 1.55, color: "#1A1A1A", fontStyle: "italic", borderLeft: `3px solid ${RED}`, paddingLeft: 20, margin: "0 0 20px 0" },
  essenceBody: { },

  // Values grid (side-by-side for short descriptions)
  valuesGrid: { border: "1px solid #EEE" },
  valueRow: { display: "flex", borderBottom: "1px solid #EEE" },
  valueKey: { flex: "0 0 160px", padding: "14px 18px", fontSize: 14, fontWeight: 700, color: "#1A1A1A", background: "#FAFAFA", borderRight: "1px solid #EEE" },
  valueDesc: { flex: 1, padding: "14px 18px", fontSize: 14, lineHeight: 1.6, color: "#333" },
  // Values cards (stacked for paragraph-length descriptions)
  valueCard: { padding: "18px 20px", borderBottom: "1px solid #EEE", borderLeft: `3px solid #EEE` },
  valueCardKey: { fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: RED, marginBottom: 8 },
  valueCardDesc: { fontSize: 14, lineHeight: 1.7, color: "#333" },

  // Work style grid
  wsGrid: { border: "1px solid #EEE" },
  wsRow: { display: "flex", borderBottom: "1px solid #EEE" },
  wsKey: { flex: "0 0 160px", padding: "14px 18px", fontSize: 14, fontWeight: 700, color: "#1A1A1A", background: "#FAFAFA", borderRight: "1px solid #EEE" },
  wsDesc: { flex: 1, padding: "14px 18px", fontSize: 14, lineHeight: 1.6, color: "#333" },

  // Energy columns
  energyWrap: { display: "flex", gap: 0, border: "1px solid #EEE" },
  energyCol: { flex: 1, padding: "18px 20px" },
  energyDivider: { width: 1, background: "#EEE", flexShrink: 0 },
  energyPosHeader: { display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: GREEN, marginBottom: 12 },
  energyNegHeader: { display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#999", marginBottom: 12 },
  energyDot: (c) => ({ width: 8, height: 8, borderRadius: "50%", background: c, flexShrink: 0 }),
  energyItem: { fontSize: 13, lineHeight: 1.65, color: "#333", padding: "4px 0", paddingLeft: 16 },

  // Non-negotiables
  dqList: { },
  dqRow: { display: "flex", gap: 14, padding: "12px 0", borderBottom: "1px solid #F5F5F5", alignItems: "flex-start" },
  dqMarker: { fontSize: 15, fontWeight: 800, color: RED, flexShrink: 0, lineHeight: "22px" },
  dqText: { fontSize: 14, lineHeight: 1.6, color: "#333" },

  // Situation
  sitGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, border: "1px solid #EEE", marginBottom: 16 },
  sitCell: { padding: "14px 18px", borderBottom: "1px solid #EEE", borderRight: "1px solid #EEE" },
  sitKey: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#999", marginBottom: 4 },
  sitVal: { fontSize: 15, fontWeight: 500, color: "#1A1A1A" },

  // Print bar
  printBar: { display: "flex", alignItems: "center", gap: 16, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #EEE" },
  printBtn: { padding: "10px 24px", fontSize: 14, fontWeight: 600, fontFamily: F, background: "#1A1A1A", color: "#FFF", border: "none", cursor: "pointer", borderRadius: 0 },

  // Footer
  footer: { marginTop: 48 },
  footerRule: { height: 1, background: "#1A1A1A", marginBottom: 20 },
  footerText: { fontSize: 12, lineHeight: 1.65, color: "#AAA", fontStyle: "italic", maxWidth: 560, margin: "0 0 16px" },
  footerBrand: { fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#DDD" },
};

const PRINT_CSS = `
@media print {
  .no-print { display: none !important; }
  body { margin: 0; padding: 0; }
  #lens-report { padding: 36px 44px !important; max-width: none !important; }
  @page { margin: 0.5in; size: letter; }
}
`;

// ─── Named Exports for Integration ───────────────────────────────────────────
export { parseLens, LensReport, PRINT_CSS };
