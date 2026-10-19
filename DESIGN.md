---
name: Anna Prokopets
description: Portfolio and CV of an AI motion designer, built as a live ebru (marbling) bath.
colors:
  paper: "#efefea"
  ink: "#141416"
  ink-soft: "#4d4d4d"
  hair: "#bfbfbb"
  print-white: "#ffffff"
  indigo: "#23349c"
  crimson: "#c42b2b"
  malachite: "#10835c"
  ochre: "#a86c0c"
  lampblack: "#17171c"
  plum: "#5a2b6b"
typography:
  display:
    fontFamily: "Unbounded Variable, Unbounded, Arial Black, sans-serif"
    fontSize: "clamp(2.75rem, 1rem + 8.2vw, 9.5rem)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.045em"
  headline:
    fontFamily: "Unbounded Variable, Unbounded, Arial Black, sans-serif"
    fontSize: "clamp(2rem, 1.4rem + 2.8vw, 4rem)"
    fontWeight: 760
    lineHeight: 1
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Unbounded Variable, Unbounded, Arial Black, sans-serif"
    fontSize: "clamp(1.5rem, 1.25rem + 1.2vw, 2.25rem)"
    fontWeight: 760
    lineHeight: 1
    letterSpacing: "-0.04em"
  lead:
    fontFamily: "Unbounded Variable, Unbounded, Arial Black, sans-serif"
    fontSize: "clamp(1.5rem, 1.25rem + 1.2vw, 2.25rem)"
    fontWeight: 500
    lineHeight: 1.22
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Commissioner Variable, Commissioner, system-ui, sans-serif"
    fontSize: "clamp(1rem, 0.97rem + 0.15vw, 1.0625rem)"
    fontWeight: 400
    lineHeight: 1.55
  body-large:
    fontFamily: "Commissioner Variable, Commissioner, system-ui, sans-serif"
    fontSize: "clamp(1.1875rem, 1.08rem + 0.5vw, 1.5rem)"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Commissioner Variable, Commissioner, system-ui, sans-serif"
    fontSize: "clamp(0.8125rem, 0.79rem + 0.1vw, 0.875rem)"
    fontWeight: 560
    lineHeight: 1.2
rounded:
  none: "0"
spacing:
  slip-gap: "6px"
  gap: "clamp(14px, 1.8vw, 28px)"
  gutter: "clamp(16px, 3.2vw, 44px)"
  section: "clamp(56px, 7vw, 120px)"
  max: "1680px"
components:
  slip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0.6em 0.8em"
  slip-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  slip-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0.6em 0.8em"
  slip-ink-hover:
    backgroundColor: "{colors.indigo}"
    textColor: "{colors.paper}"
  pigment-field:
    backgroundColor: "{colors.indigo}"
    textColor: "{colors.paper}"
---

# Design System: Anna Prokopets

## Overview

**Creative North Star: "The Ebru Bath"**

The site is a marbling bath. Pigment floats flat on water, the visitor's pointer is the stylus, and every surface is either the bath (live pigment), a print lifted from it (pigment on paper), or the paper itself. Text never sits on a tinted panel or a glassy overlay; large type is knocked out of pigment in paper colour, small text rides on a paper slip laid over the colour.

Density is gallery-like: a full-bleed bath first, then work on bare paper in a 12-column grid, one indigo drop for About, ruled lists for the CV, and a closing print on a fresh sheet. Motion is the material's own: drops spread from a point, combs drag, the water sways. Nothing lifts, glows, or fades.

**Key Characteristics:**
- Flat pigments on neutral paper; inks displace, never mix.
- Unbounded heavy knockout display, Commissioner for reading and labels.
- Small text on square paper or ink slips, never directly on pigment.
- Pigment boundaries are real ink contours from the marbling engine, never straight dividers or CSS curves.
- Reveals, hovers, menu and page transitions are circular drops spreading from a point.

## Colors

Six saturated, fairly dark pigments on one warm-neutral paper and one near-black ink; the palette is content-configurable (`theme` in `content/site.yaml` injects `--paper`, `--ink`, `--p1`..`--p6`), the values below are the shipped set.

### Primary
- **Indigo** (`--p1`): the house pigment. Base of the hero bath, the About drop, the mobile menu ground, selection highlight, and the hover state of ink slips.

### Secondary
- **Crimson** (`--p2`): base of the closing print and the default "next colour" chip in the bath tools.
- **Malachite, Ochre, Lampblack, Plum** (`--p3`..`--p6`): further bath pigments and per-project colours. A project card, project header and "next project" link each take exactly one pigment (`--c`).

### Neutral
- **Paper**: page ground, knockout type colour, slip ground.
- **Ink**: body text, rules (1.5px), ink slips, hover fill of paper slips.
- **Ink Soft** (`--ink-2`, mixed 74% ink into paper as a solid): secondary text such as dates, captions, counts, meta.
- **Hair** (`--hair`, 22% ink into paper as a solid): thin 1px separators, media placeholder ground and the print-edge outline on media.
- **Print White** (`#ffffff`): the generated PDF CV's page ground only, so A4 page margins and the sheet read as one paper.

### Named Rules
**The Displacement Rule.** Pigments meet edge to edge; they never blend. No gradients, no alpha overlays, no translucent scrims. Derived neutrals are computed once to a solid colour, never layered with opacity.

**The One Pigment Per Field Rule.** Any pigment ground (card frame, label wash, project header, About field) carries a single pigment. Multiple pigments appear together only inside a marbled bath, print or band produced by the engine.

## Typography

**Display Font:** Unbounded Variable (with Unbounded, Arial Black)
**Body Font:** Commissioner Variable (with Commissioner, system-ui)

**Character:** A wide, heavy geometric display that reads as a stencil cut from pigment, paired with a calm humanist grotesque that does all the reading and labelling.

### Hierarchy
- **Display** (800, step-4, 0.92): the name in the hero, knocked out in paper. Project and CV titles use the same treatment at a smaller clamp (800, 0.95, -0.045em). Max ~12-14ch.
- **Headline** (760, step-3, 1.0): section headings (Work, About, CV, Contact) and the "next project" title.
- **Title** (760, step-2 / step-1 at third width, -0.04em): project card titles.
- **Lead** (Unbounded 500, step-2, 1.22): the opening paragraph of About and project pages, pull quotes. Max 30ch.
- **Body** (400, step-0, 1.55): running text; About and text blocks step up to step-1 at 1.45-1.5. Max 62-70ch.
- **Label** (560, step--1, 1.2): slips, meta, captions, footer, dates. Sentence case, no tracking.

### Named Rules
**The Knockout Rule.** Display type on pigment is always paper-coloured and set tight (negative tracking -0.035 to -0.045em). Display type never sits on pigment in ink or in another pigment.

**The Slip Rule.** Text smaller than the lead never sits directly on a bath, print or pigment field; it goes on a slip.

## Layout

A centred wrap (max 1680px, fluid gutter 16-44px) holding a 12-column grid with a fluid gap (14-28px). Work cards span 12 / 8 / 6 / 4 columns (full, wide, half, third) with dense auto-flow, collapsing to 12/6 under 900px and a single column under 560px. Section rhythm is one fluid step (56-120px) between sections; a section heading row sets the heading left and a quiet tabular companion (e.g. the project count) right on a shared baseline.

Full-bleed surfaces break the wrap: the hero bath (100svh, 560-1200px), project headers (min 78svh, max 820px) and the About field. The hero composes to the bottom: name bottom-left, role slip beneath, tools bottom-right, nav slips pinned top. Long-form project content uses three widths: full bleed, wide (wrap) and narrow (760px measure).

Tight clusters of slips always use a 6px gap.

## Elevation & Depth

Flat. There are no shadows anywhere. Depth is expressed only by material order: pigment lies under paper slips; a lifted print sits on a slightly whiter sheet with a 1px hair outline and a small tilt (-0.6deg); media gets a 1px hair print-edge so paper-ground work does not dissolve into the page. Focus is a 2px currentColor outline offset 3px.

### Named Rules
**The No-Lift Rule.** Nothing hovers above the page. State changes are colour swaps (paper to ink) or pigment spreading into a shape, never shadow, scale or blur.

## Shapes

Square corners everywhere (0 radius): slips, cards, frames, sheets, headers. The only circles are pigment dots (availability, colour chip) and the circular clip of a spreading drop. Organic form comes exclusively from the marbling engine: the About field's top and bottom edges are SVG ink contours generated at build time from a drop combed back and forth, the CV header is a build-time marbled band, and project headers carry a print rendered from the project's pigments. Rules are 1.5px solid ink for structural lists; 1px hair for secondary separators.

## Components

### Slips (buttons, labels, nav)
The signature primitive: a small square paper label carrying text over colour.
- **Shape:** square (0), padding 0.6em 0.8em, label type, inline icon 16px with 0.55em gap.
- **Paper slip:** paper ground, ink text. Used on pigment (hero, project header, nav over the bath).
- **Ink slip:** ink ground, paper text. Used on paper grounds so the label stays distinct.
- **Hover:** paper slip inverts to ink; ink slip turns indigo. Instant colour swap, no transition of elevation.

### Project Card
- **Frame:** square, the project's pigment as ground behind the media.
- **Label:** title + meta + arrow on paper. On hover/focus the project's pigment spreads into the label as a circle from its left edge (560ms, spread easing), text turns paper and slides 14px right, the arrow nudges back.
- **Whole card is one link** (title anchor stretched); focus draws a 2px ink outline on the frame.

### Navigation
- **Desktop:** fixed top row of slips (name mark in Unbounded 700, section links, language switch at right); current item underlined 2px.
- **Mobile (under 760px):** a menu slip opens a full-screen indigo popover that drops open as a circle from the button; links in Unbounded 760 at up to 4.5rem, paper on indigo.

### Ruled Lists (CV and credits)
- Rows separated by 1.5px ink rules, dates in label weight Ink Soft, the role/title in Unbounded 650 at step-1.

### The Bath (signature)
A full-bleed canvas running the marbling engine. Hover stirs, press-and-hold pours with area-linear spread, drag combs, page scroll drags a reversible comb, the water sways continuously and drips when idle. Tools (next colour, comb, new bath, lift a print) sit as slips bottom-right. Lifting lays a paper sheet down and peels it off with a slight rotation. Reduced motion freezes ambient motion.

### The Print (signature)
The page's close: the visitor's own bath lifted onto a fresh sheet (paper mixed toward white, 1px hair outline, -0.6deg tilt), inked by a circular spread from the bottom edge, with the email knocked out in Unbounded 800 and a dated seal beneath in label type.

## Do's and Don'ts

### Do:
- **Do** put every small label, role, meta and control on a slip: paper slip over pigment, ink slip over paper.
- **Do** knock display type out of pigment in paper colour with tight negative tracking.
- **Do** give each pigment ground a single pigment from the theme; let multi-pigment surfaces come only from the marbling engine (bath, print, band, edge).
- **Do** animate reveals, hovers and transitions as a circular clip spreading from a point, with the spread easing (`cubic-bezier(0.12, 0.8, 0.22, 1)`), and freeze ambient motion under reduced motion.
- **Do** keep corners square and separators as solid 1.5px ink or 1px hair rules.

### Don't:
- **Don't** use gradients, box or text shadows, blur, or opacity overlays; inks displace, they never mix.
- **Don't** place small text directly on a bath, print or pigment field.
- **Don't** draw pigment boundaries as straight lines or CSS curves (waves, blobs); use an engine-generated ink contour or a hard rectangular field edge.
- **Don't** round slips, cards or frames, and don't add lifted hover states.
- **Don't** fall back to a dark thumbnail grid with a big name; work sits on paper, each piece in its own pigment.
