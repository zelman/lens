#!/usr/bin/env node
/**
 * Lens Investor Pitch Deck — Thesis-as-Hero (v1.0)
 * Build script using pptxgenjs
 *
 * Run: node build-thesis-hero-deck.js
 * Output: lens-investor-pitch-thesis-hero-v1.0.pptx
 */

const PptxGenJS = require('pptxgenjs');

// ============================================================
// DESIGN CONSTANTS (Briefing Style)
// ============================================================
const COLORS = {
  black: '1A1A1A',
  red: 'D93025',
  green: '2D6A2D',
  orange: 'E8590C',
  body: '444444',
  muted: '777777',
  footer: '999999',
  lightFill: 'F5F5F5',
  white: 'FFFFFF'
};

const FONT = 'Calibri';

// Convert SVG coordinates (680×380) to inches (13.333×7.5)
// Factor: width = 13.333/680 ≈ 0.0196, height = 7.5/380 ≈ 0.0197
const toX = (svgX) => (svgX / 680) * 13.333;
const toY = (svgY) => (svgY / 380) * 7.5;
const toW = (svgW) => (svgW / 680) * 13.333;
const toH = (svgH) => (svgH / 380) * 7.5;

// Standard margins
const MARGIN_LEFT = toX(40);   // ~0.78"
const MARGIN_RIGHT = toX(640); // ~12.55" (right edge of content)
const CONTENT_WIDTH = MARGIN_RIGHT - MARGIN_LEFT;

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function addFooter(slide, slideNum, totalSlides = 18, includeLensLeft = true) {
  if (includeLensLeft) {
    slide.addText('Lens', {
      x: MARGIN_LEFT,
      y: toY(362),
      fontSize: 10,
      fontFace: FONT,
      color: COLORS.footer
    });
  }
  slide.addText(`${String(slideNum).padStart(2, '0')} / ${totalSlides}`, {
    x: MARGIN_RIGHT - 0.5,
    y: toY(362),
    w: 0.5,
    fontSize: 10,
    fontFace: FONT,
    color: COLORS.footer,
    align: 'right'
  });
}

function addSectionLabel(slide, text) {
  // Red accent rule above section label
  slide.addShape('rect', {
    x: MARGIN_LEFT,
    y: toY(36),
    w: toW(40),
    h: toH(2),
    fill: { color: COLORS.red }
  });
  // Section label text (all caps, red, slight letter spacing)
  slide.addText(text, {
    x: MARGIN_LEFT,
    y: toY(42),
    fontSize: 11,
    fontFace: FONT,
    bold: true,
    color: COLORS.red,
    charSpacing: 1
  });
}

function addHeadline(slide, text, yPos = 100, fontSize = 22) {
  slide.addText(text, {
    x: MARGIN_LEFT,
    y: toY(yPos),
    w: CONTENT_WIDTH,
    fontSize: fontSize,
    fontFace: FONT,
    bold: true,
    color: COLORS.black
  });
}

function addSubhead(slide, text, yPos = 130) {
  slide.addText(text, {
    x: MARGIN_LEFT,
    y: toY(yPos),
    w: CONTENT_WIDTH,
    fontSize: 14,
    fontFace: FONT,
    color: COLORS.body
  });
}

function addBody(slide, text, yPos = 160, options = {}) {
  slide.addText(text, {
    x: MARGIN_LEFT,
    y: toY(yPos),
    w: CONTENT_WIDTH,
    fontSize: 14,
    fontFace: FONT,
    color: COLORS.black,
    valign: 'top',
    ...options
  });
}

function addHairlineRule(slide, yPos, width = 600) {
  slide.addShape('line', {
    x: MARGIN_LEFT,
    y: toY(yPos),
    w: toW(width),
    h: 0,
    line: { color: COLORS.black, width: 0.5 }
  });
}

// ============================================================
// SLIDE BUILDERS
// ============================================================

function buildSlide1(pptx) {
  const slide = pptx.addSlide();

  // Title
  slide.addText('Lens', {
    x: MARGIN_LEFT,
    y: 2.5,
    w: CONTENT_WIDTH,
    fontSize: 48,
    fontFace: FONT,
    bold: true,
    color: COLORS.black
  });

  // Hairline rule
  slide.addShape('line', {
    x: MARGIN_LEFT,
    y: 3.3,
    w: 2,
    h: 0,
    line: { color: COLORS.black, width: 0.5 }
  });

  // Subhead
  slide.addText('Professional identity, owned by the person.', {
    x: MARGIN_LEFT,
    y: 3.5,
    w: CONTENT_WIDTH,
    fontSize: 18,
    fontFace: FONT,
    color: COLORS.body
  });

  addFooter(slide, 1);
}

function buildSlide2(pptx) {
  const slide = pptx.addSlide();
  addSectionLabel(slide, 'ACT I — AND');

  addHeadline(slide, 'Professional identity is the most consequential information about a person.', 100, 22);

  slide.addText('It should belong to them.', {
    x: MARGIN_LEFT,
    y: toY(150),
    fontSize: 16,
    fontFace: FONT,
    bold: true,
    color: COLORS.black
  });

  addBody(slide, 'It determines income. Mobility. Autonomy. How they are seen by the people deciding their next chapter. For everything that hangs on it, the working professional has remarkably little control over how it is captured, interpreted, or carried.', 200);

  addFooter(slide, 2);
}

function buildSlide3(pptx) {
  const slide = pptx.addSlide();
  addSectionLabel(slide, 'ACT I — AND');

  addHeadline(slide, 'Imagine a labor market where every working person carries a primary record of who they are at work.');

  slide.addText('Signed by them. Read from by everyone else.', {
    x: MARGIN_LEFT,
    y: toY(150),
    fontSize: 16,
    fontFace: FONT,
    bold: true,
    color: COLORS.black
  });

  addBody(slide, 'What energizes them. What they\'ve built. How they operate. What they need next. Recruiters read from it. Employers read from it. Internal mobility runs on it. Coaches contribute to it. The person owns it. Today, that record exists for almost no one.', 195);

  // Simple diagram: center artifact with arrows from roles
  const centerX = 6.667;
  const centerY = 4.5;
  const boxW = 1.8;
  const boxH = 0.6;

  // Center box (the lens)
  slide.addShape('rect', {
    x: centerX - boxW/2,
    y: centerY - boxH/2,
    w: boxW,
    h: boxH,
    fill: { color: COLORS.white },
    line: { color: COLORS.black, width: 0.5 }
  });
  // Red top stripe
  slide.addShape('rect', {
    x: centerX - boxW/2,
    y: centerY - boxH/2,
    w: boxW,
    h: 0.04,
    fill: { color: COLORS.red }
  });
  slide.addText('The Lens', {
    x: centerX - boxW/2,
    y: centerY - boxH/2,
    w: boxW,
    h: boxH,
    fontSize: 12,
    fontFace: FONT,
    bold: true,
    color: COLORS.black,
    align: 'center',
    valign: 'middle'
  });

  // Surrounding roles with arrows pointing TO the lens (reading from it)
  const roles = [
    { label: 'Recruiter', x: centerX - 2.5, y: centerY - 1 },
    { label: 'Employer', x: centerX + 1.5, y: centerY - 1 },
    { label: 'Coach', x: centerX - 2.5, y: centerY + 0.8 },
    { label: 'Platform', x: centerX + 1.5, y: centerY + 0.8 }
  ];

  roles.forEach(role => {
    slide.addText(role.label, {
      x: role.x,
      y: role.y,
      w: 1,
      h: 0.4,
      fontSize: 11,
      fontFace: FONT,
      color: COLORS.muted,
      align: 'center',
      valign: 'middle'
    });
  });

  addFooter(slide, 3);
}

function buildSlide4(pptx) {
  // Timeline slide - "Why now" - per mockup
  const slide = pptx.addSlide();
  addSectionLabel(slide, 'ACT I — AND');

  addHeadline(slide, 'For thirty years, the labor market has been digitizing the resume.');

  addSubhead(slide, 'What it never had was the capability to capture identity at coaching depth — until now.', 160);

  // Timeline axis
  const timelineY = toY(250);
  slide.addShape('line', {
    x: toX(80),
    y: timelineY,
    w: toW(480),
    h: 0,
    line: { color: COLORS.black, width: 0.5 }
  });

  // Timeline points
  const points = [
    { year: '1995', label: 'Paper resume', sub: 'Static credentials', x: 80, isLens: false },
    { year: '2003', label: 'ATS-parsed', sub: 'Keyword extraction', x: 200, isLens: false },
    { year: '2010', label: 'LinkedIn', sub: 'Public profile', x: 320, isLens: false },
    { year: '2017', label: 'Assessments', sub: 'Trait verdicts', x: 440, isLens: false },
    { year: '2026', label: 'Lens', sub: 'Person-owned', x: 560, isLens: true }
  ];

  points.forEach(pt => {
    // Tick mark
    const tickColor = pt.isLens ? COLORS.red : COLORS.black;
    const tickWidth = pt.isLens ? 2 : 0.5;
    const tickH = pt.isLens ? toH(12) : toH(8);
    slide.addShape('line', {
      x: toX(pt.x),
      y: timelineY - tickH/2,
      w: 0,
      h: tickH,
      line: { color: tickColor, width: tickWidth }
    });

    // Year label above
    slide.addText(pt.year, {
      x: toX(pt.x) - 0.3,
      y: toY(232) - 0.15,
      w: 0.6,
      fontSize: 11,
      fontFace: FONT,
      bold: pt.isLens,
      color: pt.isLens ? COLORS.red : COLORS.muted,
      align: 'center'
    });

    // Main label below
    slide.addText(pt.label, {
      x: toX(pt.x) - 0.5,
      y: toY(270),
      w: 1,
      fontSize: 14,
      fontFace: FONT,
      bold: true,
      color: pt.isLens ? COLORS.red : COLORS.black,
      align: 'center'
    });

    // Sub label
    slide.addText(pt.sub, {
      x: toX(pt.x) - 0.5,
      y: toY(290),
      w: 1,
      fontSize: 11,
      fontFace: FONT,
      bold: pt.isLens,
      color: pt.isLens ? COLORS.black : COLORS.muted,
      align: 'center'
    });
  });

  // Red accent under "Person-owned"
  slide.addShape('rect', {
    x: toX(540),
    y: toY(305),
    w: toW(40),
    h: toH(2),
    fill: { color: COLORS.red }
  });

  addFooter(slide, 4);
}

function buildSlide5(pptx) {
  // Fragmented identity diagram - per mockup
  const slide = pptx.addSlide();
  addSectionLabel(slide, 'ACT II — BUT');

  addHeadline(slide, 'No one holds a primary copy of who they are professionally.');
  addSubhead(slide, 'Identity is fragmented across platforms that each own their own read.', 156);

  // Box dimensions from mockup
  const boxW = toW(180);
  const boxH = toH(40);
  const centerW = toW(180);
  const centerH = toH(50);

  // Platform boxes
  const platforms = [
    { label: 'LinkedIn', sub: 'Public profile', x: 40, y: 190 },
    { label: 'ATS systems', sub: 'Parsed keywords', x: 460, y: 190 },
    { label: 'Recruiters', sub: 'Their shortlist', x: 40, y: 300 },
    { label: 'Assessments', sub: 'Trait graph', x: 460, y: 300 }
  ];

  platforms.forEach(p => {
    slide.addShape('rect', {
      x: toX(p.x),
      y: toY(p.y),
      w: boxW,
      h: boxH,
      fill: { color: COLORS.lightFill },
      line: { color: COLORS.black, width: 0.5 }
    });
    slide.addText(p.label, {
      x: toX(p.x),
      y: toY(p.y) + 0.05,
      w: boxW,
      h: boxH * 0.5,
      fontSize: 14,
      fontFace: FONT,
      bold: true,
      color: COLORS.black,
      align: 'center',
      valign: 'bottom'
    });
    slide.addText(p.sub, {
      x: toX(p.x),
      y: toY(p.y) + boxH * 0.5,
      w: boxW,
      h: boxH * 0.5,
      fontSize: 11,
      fontFace: FONT,
      color: COLORS.muted,
      align: 'center',
      valign: 'top'
    });
  });

  // Center - hollow/dashed person (no primary copy)
  slide.addShape('rect', {
    x: toX(250),
    y: toY(240),
    w: centerW,
    h: centerH,
    fill: { color: COLORS.white },
    line: { color: COLORS.muted, width: 0.5, dashType: 'dash' }
  });
  slide.addText('The person', {
    x: toX(250),
    y: toY(248),
    w: centerW,
    fontSize: 14,
    fontFace: FONT,
    bold: true,
    color: COLORS.muted,
    align: 'center'
  });
  slide.addText('no primary copy', {
    x: toX(250),
    y: toY(268),
    w: centerW,
    fontSize: 11,
    fontFace: FONT,
    color: COLORS.muted,
    align: 'center'
  });

  // Arrows pointing inward (platforms -> person)
  // Using lines - arrows not natively supported, use shapes or accept lines
  const arrows = [
    { x1: 220, y1: 215, x2: 252, y2: 245 },
    { x1: 460, y1: 215, x2: 428, y2: 245 },
    { x1: 220, y1: 320, x2: 252, y2: 285 },
    { x1: 460, y1: 320, x2: 428, y2: 285 }
  ];

  arrows.forEach(a => {
    slide.addShape('line', {
      x: toX(a.x1),
      y: toY(a.y1),
      w: toX(a.x2) - toX(a.x1),
      h: toY(a.y2) - toY(a.y1),
      line: { color: COLORS.black, width: 0.75, endArrowType: 'arrow' }
    });
  });

  addFooter(slide, 5);
}

function buildSlide6(pptx) {
  const slide = pptx.addSlide();
  addSectionLabel(slide, 'ACT II — BUT');

  addHeadline(slide, 'Fragmented identity is paid for in mis-hires, missed mobility, and miscategorization.');
  addSubhead(slide, 'The labor market runs on roughly half the picture.', 150);

  // Stats
  const stats = [
    { value: '~40%', label: 'First-year executive turnover' },
    { value: '77%', label: 'Companies lost talent to lack of career development' },
    { value: '58%', label: 'Would leave if not considered for internal role' },
    { value: '25%', label: 'Companies confident their internal mobility works' }
  ];

  let yPos = 200;
  stats.forEach((stat, i) => {
    slide.addText(stat.value, {
      x: MARGIN_LEFT,
      y: toY(yPos),
      w: 1,
      fontSize: 28,
      fontFace: FONT,
      bold: true,
      color: COLORS.red
    });
    slide.addText(stat.label, {
      x: MARGIN_LEFT + 1.1,
      y: toY(yPos) + 0.1,
      w: CONTENT_WIDTH - 1.1,
      fontSize: 14,
      fontFace: FONT,
      color: COLORS.black
    });
    yPos += 40;
  });

  addBody(slide, 'The cost is borne by the person, the employer, and the recruiter who placed the wrong fit. None of them have an artifact that would have changed the outcome.', 360, { fontSize: 12, color: COLORS.body });

  addFooter(slide, 6);
}

function buildSlide7(pptx) {
  const slide = pptx.addSlide();
  addSectionLabel(slide, 'ACT II — BUT');

  addHeadline(slide, 'None of today\'s tools produce a portable, structured, person-owned identity record.');
  addSubhead(slide, 'Each one solves a different problem.', 150);

  // Comparison grid
  const tools = [
    { name: 'Resumes & ATS', does: 'Optimized for parsing keywords', doesnt: 'Not built to capture identity' },
    { name: 'Assessments', does: 'Produce a graph for the buyer', doesnt: 'The person doesn\'t own them' },
    { name: 'LinkedIn', does: 'Narrative is partly owned', doesnt: 'Format is shallow, platform-controlled' },
    { name: 'Internal mobility', does: 'Match on skills', doesnt: 'Identity layer is absent' }
  ];

  let yPos = 185;
  addHairlineRule(slide, yPos - 5, 600);

  // Headers
  slide.addText('Tool', { x: MARGIN_LEFT, y: toY(yPos), w: 1.5, fontSize: 11, fontFace: FONT, bold: true, color: COLORS.muted });
  slide.addText('What it does', { x: MARGIN_LEFT + 1.6, y: toY(yPos), w: 3.5, fontSize: 11, fontFace: FONT, bold: true, color: COLORS.muted });
  slide.addText('What it doesn\'t', { x: MARGIN_LEFT + 5.5, y: toY(yPos), w: 4.5, fontSize: 11, fontFace: FONT, bold: true, color: COLORS.muted });

  yPos += 25;

  tools.forEach(tool => {
    addHairlineRule(slide, yPos - 5, 600);
    slide.addText(tool.name, { x: MARGIN_LEFT, y: toY(yPos), w: 1.5, fontSize: 12, fontFace: FONT, bold: true, color: COLORS.black });
    slide.addText(tool.does, { x: MARGIN_LEFT + 1.6, y: toY(yPos), w: 3.5, fontSize: 12, fontFace: FONT, color: COLORS.black });
    slide.addText(tool.doesnt, { x: MARGIN_LEFT + 5.5, y: toY(yPos), w: 4.5, fontSize: 12, fontFace: FONT, color: COLORS.body });
    yPos += 35;
  });

  addHairlineRule(slide, yPos - 5, 600);

  slide.addText('The white space isn\'t a feature gap. It\'s a missing primitive.', {
    x: MARGIN_LEFT,
    y: toY(340),
    fontSize: 14,
    fontFace: FONT,
    italic: true,
    color: COLORS.red
  });

  addFooter(slide, 7);
}

function buildSlide8(pptx) {
  const slide = pptx.addSlide();
  addSectionLabel(slide, 'ACT II — BUT');

  addHeadline(slide, 'Standard recruiter inputs reconstruct ~43% of identity-grade fit.');
  addSubhead(slide, 'Signal Reconstructibility Test, 2026.', 150);

  addBody(slide, 'Three independent AI systems were given the same task: given a candidate\'s resume plus a standard assessment, reconstruct the artifact a coached intake produces.', 190);

  // Bar chart - simple horizontal bar
  const barY = toY(250);
  const barFullW = 8;
  const barH = 0.5;

  // Background bar (100%)
  slide.addShape('rect', {
    x: MARGIN_LEFT,
    y: barY,
    w: barFullW,
    h: barH,
    fill: { color: COLORS.lightFill },
    line: { color: COLORS.black, width: 0.5 }
  });

  // Filled bar (43%)
  slide.addShape('rect', {
    x: MARGIN_LEFT,
    y: barY,
    w: barFullW * 0.43,
    h: barH,
    fill: { color: COLORS.red }
  });

  slide.addText('43%', {
    x: MARGIN_LEFT + barFullW * 0.43 + 0.1,
    y: barY,
    w: 0.6,
    h: barH,
    fontSize: 14,
    fontFace: FONT,
    bold: true,
    color: COLORS.black,
    valign: 'middle'
  });

  slide.addText('Mean reconstruction rate', {
    x: MARGIN_LEFT,
    y: barY + barH + 0.1,
    fontSize: 11,
    fontFace: FONT,
    color: COLORS.muted
  });

  // Gap breakdown
  const gaps = [
    { signal: 'Values', pct: '22%' },
    { signal: 'Energy', pct: '30%' },
    { signal: 'Disqualifiers', pct: '13%' }
  ];

  slide.addText('Largest gaps (signals that predict thriving):', {
    x: MARGIN_LEFT,
    y: toY(310),
    fontSize: 12,
    fontFace: FONT,
    bold: true,
    color: COLORS.black
  });

  let gapX = MARGIN_LEFT;
  gaps.forEach(g => {
    slide.addText(`${g.signal}: ${g.pct}`, {
      x: gapX,
      y: toY(330),
      fontSize: 12,
      fontFace: FONT,
      color: COLORS.body
    });
    gapX += 2;
  });

  slide.addText('The labor market is making consequential decisions on roughly half the picture.', {
    x: MARGIN_LEFT,
    y: toY(360),
    fontSize: 12,
    fontFace: FONT,
    italic: true,
    color: COLORS.black
  });

  addFooter(slide, 8);
}

function buildSlide9(pptx) {
  // The primitive - definition slide - per mockup
  const slide = pptx.addSlide();
  addSectionLabel(slide, 'ACT III — SO');

  // Term
  slide.addText('Lens.', {
    x: MARGIN_LEFT,
    y: toY(98),
    fontSize: 28,
    fontFace: FONT,
    bold: true,
    color: COLORS.black
  });

  // Definition
  slide.addText('A portable identity primitive for the labor market.', {
    x: MARGIN_LEFT,
    y: toY(128),
    fontSize: 16,
    fontFace: FONT,
    color: COLORS.black
  });

  // Hairline rules and components
  addHairlineRule(slide, 160, 600);

  slide.addText('1.  Coached intake — produces a structured identity record.', {
    x: MARGIN_LEFT,
    y: toY(174),
    fontSize: 14,
    fontFace: FONT,
    color: COLORS.black
  });

  addHairlineRule(slide, 204, 600);

  slide.addText('2.  Scoring layer — matches the lens bidirectionally against any opportunity.', {
    x: MARGIN_LEFT,
    y: toY(218),
    fontSize: 14,
    fontFace: FONT,
    color: COLORS.black
  });

  addHairlineRule(slide, 248, 600);

  slide.addText('3.  Ownership model — the person holds the primary copy.', {
    x: MARGIN_LEFT,
    y: toY(262),
    fontSize: 14,
    fontFace: FONT,
    color: COLORS.black
  });

  addHairlineRule(slide, 292, 600);

  // Punchline
  slide.addText('This is not a product category.', {
    x: MARGIN_LEFT,
    y: toY(318),
    fontSize: 14,
    fontFace: FONT,
    italic: true,
    color: COLORS.black
  });

  slide.addText('It is the format the labor market has been missing.', {
    x: MARGIN_LEFT,
    y: toY(340),
    fontSize: 14,
    fontFace: FONT,
    italic: true,
    bold: true,
    color: COLORS.red
  });

  addFooter(slide, 9);
}

function buildSlide10(pptx) {
  // PKI architecture - per mockup (rhymes with slide 5)
  const slide = pptx.addSlide();
  addSectionLabel(slide, 'ACT III — SO');

  addHeadline(slide, 'PKI for professional identity.');
  addSubhead(slide, 'The person owns the primary copy. Others sign — they don\'t own.', 130);

  // Same box dimensions as slide 5
  const boxW = toW(180);
  const boxH = toH(40);
  const centerW = toW(180);
  const centerH = toH(50);

  // CA boxes (same positions as slide 5)
  const cas = [
    { label: 'Recruiter', sub: 'Signs fit', x: 40, y: 190 },
    { label: 'Employer', sub: 'Signs performance', x: 460, y: 190 },
    { label: 'Coach', sub: 'Signs development', x: 40, y: 300 },
    { label: 'Internal mobility', sub: 'Signs role match', x: 460, y: 300 }
  ];

  cas.forEach(ca => {
    slide.addShape('rect', {
      x: toX(ca.x),
      y: toY(ca.y),
      w: boxW,
      h: boxH,
      fill: { color: COLORS.lightFill },
      line: { color: COLORS.black, width: 0.5 }
    });
    slide.addText(ca.label, {
      x: toX(ca.x),
      y: toY(ca.y) + 0.05,
      w: boxW,
      h: boxH * 0.5,
      fontSize: 14,
      fontFace: FONT,
      bold: true,
      color: COLORS.black,
      align: 'center',
      valign: 'bottom'
    });
    slide.addText(ca.sub, {
      x: toX(ca.x),
      y: toY(ca.y) + boxH * 0.5,
      w: boxW,
      h: boxH * 0.5,
      fontSize: 11,
      fontFace: FONT,
      color: COLORS.muted,
      align: 'center',
      valign: 'top'
    });
  });

  // Center - solid holder with red top-stripe (same position as slide 5)
  slide.addShape('rect', {
    x: toX(250),
    y: toY(240),
    w: centerW,
    h: centerH,
    fill: { color: COLORS.white },
    line: { color: COLORS.black, width: 0.5 }
  });
  // Red top-stripe (the seal)
  slide.addShape('rect', {
    x: toX(250),
    y: toY(240),
    w: centerW,
    h: toH(3),
    fill: { color: COLORS.red }
  });
  slide.addText('The person', {
    x: toX(250),
    y: toY(252),
    w: centerW,
    fontSize: 14,
    fontFace: FONT,
    bold: true,
    color: COLORS.black,
    align: 'center'
  });
  slide.addText('holds the primary copy', {
    x: toX(250),
    y: toY(270),
    w: centerW,
    fontSize: 11,
    fontFace: FONT,
    color: COLORS.muted,
    align: 'center'
  });

  // Bidirectional arrows (same geometry as slide 5, but bidirectional)
  const arrows = [
    { x1: 220, y1: 215, x2: 252, y2: 248 },
    { x1: 460, y1: 215, x2: 428, y2: 248 },
    { x1: 220, y1: 320, x2: 252, y2: 287 },
    { x1: 460, y1: 320, x2: 428, y2: 287 }
  ];

  arrows.forEach(a => {
    slide.addShape('line', {
      x: toX(a.x1),
      y: toY(a.y1),
      w: toX(a.x2) - toX(a.x1),
      h: toY(a.y2) - toY(a.y1),
      line: { color: COLORS.black, width: 0.75, beginArrowType: 'arrow', endArrowType: 'arrow' }
    });
  });

  addFooter(slide, 10);
}

function buildSlide11(pptx) {
  const slide = pptx.addSlide();
  addSectionLabel(slide, 'ACT III — SO');

  addHeadline(slide, 'What\'s built today.');
  addSubhead(slide, 'Working bidirectional system. Patent filed. Research question in flight.', 130);

  // Status grid
  const items = [
    { item: 'Bidirectional Lens system', status: 'Deployed', detail: 'Coached intake, candidate lens, role lens, scoring engine', isActive: true },
    { item: 'Provisional patent', status: 'Filed', detail: 'Application #64/015,187. Ten claims, three independent. Conversion deadline: March 24, 2027.', isActive: true },
    { item: 'NSF SBIR Project Pitch', status: 'In flight', detail: 'Research question: does AI-facilitated structured identity discovery produce representations with higher predictive validity?', isActive: false },
    { item: 'Zelman Labs LLC', status: 'Active', detail: 'SAM.gov registration active.', isActive: true }
  ];

  let yPos = 175;
  items.forEach(item => {
    const statusColor = item.isActive ? COLORS.red : COLORS.muted;

    // Red/gray dot indicator
    slide.addShape('ellipse', {
      x: MARGIN_LEFT,
      y: toY(yPos) + 0.05,
      w: 0.12,
      h: 0.12,
      fill: { color: statusColor }
    });

    slide.addText(item.item, {
      x: MARGIN_LEFT + 0.25,
      y: toY(yPos),
      w: 2.5,
      fontSize: 14,
      fontFace: FONT,
      bold: true,
      color: COLORS.black
    });

    slide.addText(item.status, {
      x: MARGIN_LEFT + 2.8,
      y: toY(yPos),
      w: 0.8,
      fontSize: 12,
      fontFace: FONT,
      bold: true,
      color: statusColor
    });

    slide.addText(item.detail, {
      x: MARGIN_LEFT + 3.7,
      y: toY(yPos),
      w: 6.5,
      fontSize: 11,
      fontFace: FONT,
      color: COLORS.body
    });

    yPos += 40;
  });

  slide.addText('This is not a deck pitch. The format exists.', {
    x: MARGIN_LEFT,
    y: toY(350),
    fontSize: 14,
    fontFace: FONT,
    italic: true,
    color: COLORS.black
  });

  addFooter(slide, 11);
}

function buildSlide12(pptx) {
  const slide = pptx.addSlide();
  addSectionLabel(slide, 'ACT III — SO');

  addHeadline(slide, 'The roles take shape today.');
  addSubhead(slide, 'Holder. Certificate authority. Each is an instance, not a separate product.', 130);

  // Three columns
  const cols = [
    {
      title: 'Holder',
      body: 'The working professional. Owns their lens. Carries it into every conversation.',
      model: 'Free intake; premium tier for ongoing scoring and daily briefing.'
    },
    {
      title: 'Premium CA',
      body: 'Retained boutique executive recruiters. $300K+ placements, where mis-hire cost is catastrophic.',
      model: 'Validated band: $2–5K per search.'
    },
    {
      title: 'Volume CA',
      body: 'Coaches and internal mobility programs. Structured discovery is already part of the workflow.',
      model: 'The format extends naturally.'
    }
  ];

  const colW = 3.5;
  const startX = MARGIN_LEFT;
  const gap = 0.3;

  cols.forEach((col, i) => {
    const x = startX + i * (colW + gap);

    slide.addText(col.title, {
      x: x,
      y: toY(180),
      w: colW,
      fontSize: 16,
      fontFace: FONT,
      bold: true,
      color: COLORS.black
    });

    slide.addText(col.body, {
      x: x,
      y: toY(210),
      w: colW,
      fontSize: 12,
      fontFace: FONT,
      color: COLORS.black
    });

    slide.addText(col.model, {
      x: x,
      y: toY(280),
      w: colW,
      fontSize: 11,
      fontFace: FONT,
      color: COLORS.muted
    });
  });

  slide.addText('The same primitive monetizes differently at each surface. The format is the asset.', {
    x: MARGIN_LEFT,
    y: toY(350),
    fontSize: 14,
    fontFace: FONT,
    italic: true,
    color: COLORS.black
  });

  addFooter(slide, 12);
}

function buildSlide13(pptx) {
  const slide = pptx.addSlide();
  addSectionLabel(slide, 'ACT III — SO');

  addHeadline(slide, 'Format. Patent. Validity question.');
  addSubhead(slide, 'Three layers of defensibility, none of which compound on speed.', 130);

  // Three pillars
  const pillars = [
    {
      title: 'Format moat',
      body: 'The artifact specification is the primitive. Once the labor market signs from a format, switching is structurally hard.'
    },
    {
      title: 'Patent moat',
      body: 'Ten claims filed, including three independent claims covering bidirectional identity-first matching with portable artifact ownership.'
    },
    {
      title: 'Research moat',
      body: 'Oh, Wang & Mount (2011) meta-analysis established observer ratings predict job performance significantly better than self-reports. AI-facilitated coached discovery is the first method capable of moving structured self-report toward the observer-grade ceiling at scale.'
    }
  ];

  let yPos = 175;
  pillars.forEach(pillar => {
    // Red accent mark
    slide.addShape('rect', {
      x: MARGIN_LEFT,
      y: toY(yPos) + 0.05,
      w: 0.08,
      h: 0.5,
      fill: { color: COLORS.red }
    });

    slide.addText(pillar.title, {
      x: MARGIN_LEFT + 0.2,
      y: toY(yPos),
      fontSize: 14,
      fontFace: FONT,
      bold: true,
      color: COLORS.black
    });

    slide.addText(pillar.body, {
      x: MARGIN_LEFT + 0.2,
      y: toY(yPos) + 0.25,
      w: CONTENT_WIDTH - 0.2,
      fontSize: 12,
      fontFace: FONT,
      color: COLORS.black
    });

    yPos += 55;
  });

  slide.addText('Lens is not racing on speed. Lens is racing on the format precedent.', {
    x: MARGIN_LEFT,
    y: toY(350),
    fontSize: 14,
    fontFace: FONT,
    italic: true,
    color: COLORS.black
  });

  addFooter(slide, 13);
}

function buildSlide14(pptx) {
  const slide = pptx.addSlide();
  addSectionLabel(slide, 'ACT III — SO');

  addHeadline(slide, 'I built Lens because the artifact I needed for myself didn\'t exist.');
  addSubhead(slide, 'The miscategorization is not a hypothesis. It\'s how this started.', 140);

  addBody(slide, 'A senior career — renewal accountability, four years of 0-to-1, customer success leadership — reads on a ten-second scan of one historical title as "support expert."', 190);

  addBody(slide, 'The scan is wrong. It sticks. Every recruiter conversation begins from a miscategorization the candidate has no way to redirect.', 240);

  addBody(slide, 'I lived the cost. I started building the artifact for myself, and the artifact wanted to be a primitive.', 290);

  slide.addText('The personal story is the proof point: this happens to senior operators every day, and there is currently no way to fix it.', {
    x: MARGIN_LEFT,
    y: toY(345),
    w: CONTENT_WIDTH,
    fontSize: 12,
    fontFace: FONT,
    italic: true,
    color: COLORS.body
  });

  addFooter(slide, 14);
}

function buildSlide15(pptx) {
  const slide = pptx.addSlide();
  addSectionLabel(slide, 'ACT III — SO');

  addHeadline(slide, 'The protocol monetizes wherever signing happens.');
  addSubhead(slide, 'Multiple surfaces. One asset.', 130);

  // Four-quadrant revenue
  const revenues = [
    { title: 'Per-search revenue', body: 'From retained boutique CAs at the premium tier. Validated band: $2–5K per placement.' },
    { title: 'Premium holder subscriptions', body: 'Portable lens, ongoing scoring, daily scored briefing. Consumer-LTV play.' },
    { title: 'Enterprise licenses', body: 'From internal mobility programs. Structurally stronger long-tail enterprise wedge.' },
    { title: 'Coach platform fees', body: 'As the format scales and structured discovery becomes a category.' }
  ];

  const colW = 5.5;
  const rowH = 1.2;

  revenues.forEach((rev, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = MARGIN_LEFT + col * (colW + 0.3);
    const y = toY(175) + row * rowH;

    // Red accent mark
    slide.addShape('rect', {
      x: x,
      y: y + 0.05,
      w: 0.08,
      h: 0.08,
      fill: { color: COLORS.red }
    });

    slide.addText(rev.title, {
      x: x + 0.2,
      y: y,
      w: colW - 0.2,
      fontSize: 13,
      fontFace: FONT,
      bold: true,
      color: COLORS.black
    });

    slide.addText(rev.body, {
      x: x + 0.2,
      y: y + 0.25,
      w: colW - 0.2,
      fontSize: 11,
      fontFace: FONT,
      color: COLORS.body
    });
  });

  slide.addText('Each surface monetizes the same primitive. The format is the moat. The revenue is the consequence.', {
    x: MARGIN_LEFT,
    y: toY(350),
    w: CONTENT_WIDTH,
    fontSize: 14,
    fontFace: FONT,
    italic: true,
    color: COLORS.black
  });

  addFooter(slide, 15);
}

function buildSlide16(pptx) {
  // Horizon slide - per mockup (bookend with slide 4)
  const slide = pptx.addSlide();

  // Section label (different from others)
  slide.addShape('rect', {
    x: MARGIN_LEFT,
    y: toY(36),
    w: toW(40),
    h: toH(2),
    fill: { color: COLORS.red }
  });
  slide.addText('HORIZON', {
    x: MARGIN_LEFT,
    y: toY(42),
    fontSize: 11,
    fontFace: FONT,
    bold: true,
    color: COLORS.red,
    charSpacing: 1
  });

  addHeadline(slide, 'A labor market with a primary identity layer.');
  addSubhead(slide, 'What changes when every working person owns their lens.', 128);

  addHairlineRule(slide, 156, 600);

  // Five outcomes with red markers
  const outcomes = [
    'Hiring conversations begin from substance, not from a ten-second scan.',
    'Internal mobility runs on identity, not on skills lists.',
    'Mis-hires drop because the inputs finally include what determines fit.',
    'Recruiters compete on judgment, not on parsing.',
    'Coaches and employers contribute to a record that compounds across a career.'
  ];

  let yPos = 180;
  outcomes.forEach(outcome => {
    // Red mark
    slide.addShape('rect', {
      x: MARGIN_LEFT,
      y: toY(yPos),
      w: toW(8),
      h: toH(2),
      fill: { color: COLORS.red }
    });

    slide.addText(outcome, {
      x: MARGIN_LEFT + 0.25,
      y: toY(yPos) - 0.1,
      w: CONTENT_WIDTH - 0.25,
      fontSize: 14,
      fontFace: FONT,
      color: COLORS.black
    });

    yPos += 28;
  });

  addHairlineRule(slide, 318, 600);

  // Punchline
  slide.addText('This is what the labor market looks like in ten years.', {
    x: MARGIN_LEFT,
    y: toY(332),
    fontSize: 14,
    fontFace: FONT,
    italic: true,
    color: COLORS.black
  });

  slide.addText('The question is who builds the primitive.', {
    x: MARGIN_LEFT,
    y: toY(352),
    fontSize: 14,
    fontFace: FONT,
    italic: true,
    bold: true,
    color: COLORS.red
  });

  // Footer (no Lens on left per mockup)
  addFooter(slide, 16, 18, false);
}

function buildSlide17(pptx) {
  const slide = pptx.addSlide();
  addSectionLabel(slide, 'ASK');

  addHeadline(slide, 'Raising [AMOUNT] to build the protocol and accumulate the format precedent.');
  addSubhead(slide, '[12–18 months] to [milestone].', 140);

  // Use of funds
  slide.addText('Use of funds', {
    x: MARGIN_LEFT,
    y: toY(180),
    fontSize: 14,
    fontFace: FONT,
    bold: true,
    color: COLORS.black
  });

  slide.addText('Protocol build (intake + scoring + artifact format), CA channel validation (premium and volume), research credibility (NSF SBIR submission, peer-reviewed publication), nonprovisional patent conversion.', {
    x: MARGIN_LEFT,
    y: toY(200),
    w: CONTENT_WIDTH,
    fontSize: 12,
    fontFace: FONT,
    color: COLORS.body
  });

  // Milestones
  slide.addText('Milestones, 18 months out', {
    x: MARGIN_LEFT,
    y: toY(250),
    fontSize: 14,
    fontFace: FONT,
    bold: true,
    color: COLORS.black
  });

  slide.addText('[N] holders with active lenses; [N] retained boutique CAs signing under contract; [N] internal mobility pilots; nonprovisional patent issued; SBIR Phase I awarded.', {
    x: MARGIN_LEFT,
    y: toY(270),
    w: CONTENT_WIDTH,
    fontSize: 12,
    fontFace: FONT,
    color: COLORS.body
  });

  // Lead investor profile
  slide.addText('Lead investor profile', {
    x: MARGIN_LEFT,
    y: toY(320),
    fontSize: 14,
    fontFace: FONT,
    bold: true,
    color: COLORS.black
  });

  slide.addText('Vision-stage capital comfortable with primitive-stage builds. Comfortable with format precedent as a moat. Comfortable with the holder-CA two-sided architecture taking time to compound.', {
    x: MARGIN_LEFT,
    y: toY(340),
    w: CONTENT_WIDTH,
    fontSize: 12,
    fontFace: FONT,
    color: COLORS.body
  });

  addFooter(slide, 17);
}

function buildSlide18(pptx) {
  const slide = pptx.addSlide();

  // Closing - mirrors slide 1
  slide.addText('Lens.', {
    x: MARGIN_LEFT,
    y: 2.5,
    w: CONTENT_WIDTH,
    fontSize: 48,
    fontFace: FONT,
    bold: true,
    color: COLORS.black
  });

  // Hairline rule
  slide.addShape('line', {
    x: MARGIN_LEFT,
    y: 3.3,
    w: 2,
    h: 0,
    line: { color: COLORS.black, width: 0.5 }
  });

  // Subhead
  slide.addText('Professional identity, owned by the person.', {
    x: MARGIN_LEFT,
    y: 3.5,
    w: CONTENT_WIDTH,
    fontSize: 18,
    fontFace: FONT,
    color: COLORS.body
  });

  // Closing line
  slide.addText('The primitive the labor market has been missing.', {
    x: MARGIN_LEFT,
    y: 4.0,
    w: CONTENT_WIDTH,
    fontSize: 14,
    fontFace: FONT,
    italic: true,
    color: COLORS.red
  });

  addFooter(slide, 18);
}

// ============================================================
// MAIN BUILD
// ============================================================

async function buildDeck() {
  const pptx = new PptxGenJS();

  // Deck metadata
  pptx.author = 'Eric Zelman';
  pptx.title = 'Lens — Investor Pitch (Thesis-as-Hero)';
  pptx.subject = 'Professional identity, owned by the person';
  pptx.company = 'Zelman Labs LLC';

  // Layout
  pptx.layout = 'LAYOUT_16x9';

  // Build all 18 slides
  buildSlide1(pptx);
  buildSlide2(pptx);
  buildSlide3(pptx);
  buildSlide4(pptx);
  buildSlide5(pptx);
  buildSlide6(pptx);
  buildSlide7(pptx);
  buildSlide8(pptx);
  buildSlide9(pptx);
  buildSlide10(pptx);
  buildSlide11(pptx);
  buildSlide12(pptx);
  buildSlide13(pptx);
  buildSlide14(pptx);
  buildSlide15(pptx);
  buildSlide16(pptx);
  buildSlide17(pptx);
  buildSlide18(pptx);

  // Save
  const outputPath = './lens-investor-pitch-thesis-hero-v1.0.pptx';
  await pptx.writeFile({ fileName: outputPath });
  console.log(`✓ Built: ${outputPath}`);
}

buildDeck().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
