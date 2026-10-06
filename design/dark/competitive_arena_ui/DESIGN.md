---
name: Competitive Arena UI
colors:
  surface: '#0c1322'
  surface-dim: '#0c1322'
  surface-bright: '#323949'
  surface-container-lowest: '#070e1d'
  surface-container-low: '#141b2b'
  surface-container: '#191f2f'
  surface-container-high: '#232a3a'
  surface-container-highest: '#2e3545'
  on-surface: '#dce2f7'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#dce2f7'
  inverse-on-surface: '#293040'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#ffb95f'
  on-secondary: '#472a00'
  secondary-container: '#ee9800'
  on-secondary-container: '#5b3800'
  tertiary: '#c3c0ff'
  on-tertiary: '#1d00a5'
  tertiary-container: '#8582ff'
  on-tertiary-container: '#180092'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#e2dfff'
  tertiary-fixed-dim: '#c3c0ff'
  on-tertiary-fixed: '#0f0069'
  on-tertiary-fixed-variant: '#3323cc'
  background: '#0c1322'
  on-background: '#dce2f7'
  surface-variant: '#2e3545'
typography:
  display-lg:
    fontFamily: Montserrat Alternates
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Montserrat Alternates
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat Alternates
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Montserrat Alternates
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  title-lg:
    fontFamily: Montserrat
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Montserrat
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  title-sm:
    fontFamily: Montserrat
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  body-lg:
    fontFamily: Red Hat Display
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Red Hat Display
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Red Hat Display
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  mono-metric-lg:
    fontFamily: Red Hat Mono
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  mono-metric-md:
    fontFamily: Red Hat Mono
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  mono-code:
    fontFamily: Red Hat Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Red Hat Display
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-md: 1.5rem
  margin-lg: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style
The design system establishes a focused, high-stakes digital arena tailored for competitive developers, algorithmic problem solvers, and technical quiz competitors. The tone balances deep focus with tactical urgency: an environment where precision is celebrated, ranks are constantly contested, and distractions are eliminated.

The visual style merges technical brutalist precision with polished high-contrast telemetry:
- **Atmospheric Depth:** Grounded in layered abyssal dark surfaces, avoiding pure blacks in favor of deeply saturated midnight charcoal to minimize eye fatigue during extended coding sprints.
- **Electric Vector Accents:** Saturated indigo/violet tones command strategic interactions, while luminous amber and gold elements denote rank progress, streaks, podiums, and urgent execution deadlines.
- **Mechanical Precision:** Crisp edges, tabular layout alignment, structured borders, and mono-spaced telemetric data ensure dense metrics remain decipherable at instantaneous speeds.

## Colors
The color architecture relies on a dark-first hierarchy calculated for high legibility, strict contrast ratios, and instant visual triage.

### Surface Tiers
- **Canvas / Root Background (`#0B0F19`):** Foundational backplane for the main workspace, code execution views, and quiz arenas.
- **Elevated Canvas (`#111827`):** Side panels, cards, leaderboard rows, and container surfaces.
- **Surface Popover / Overlay (`#1F2937`):** Active modal dialogs, flyouts, tooltips, and elevated control groups.
- **Surface Highlight (`#374151`):** Hover states, active row selections, and terminal header strips.

### Functional Accents
- **Primary Indigo Spectrum (`#6366F1` / Hover `#4F46E5`):** Reserved strictly for primary callouts, submit actions, current player cursors, and active navigation nodes.
- **Telemetry Amber / Gold Spectrum (`#F59E0B` / Accent `#FBBF24`):** Designates gold podium tiers, rank-up milestones, current winning streaks, critical time expirations (<60s remaining), and XP counters.
- **Success (`#10B981`):** Test cases passed, submission accepted, compilation success.
- **Destructive / Error (`#EF4444`):** Wrong answer, runtime exception, memory limit exceeded, penalty alerts.

### Structural Borders
- **Standard Border (`#1F2937`):** Baseline container divisions, card perimeters, and split-pane dividers.
- **Interactive Border (`#374151`):** Form field outlines, hover targets, and secondary control perimeters.

## Typography
Typography is split purposefully across four distinct functional roles:
- **Montserrat Alternates** delivers high-impact, geometric character to top-level platform headlines, contest banners, and podium ranks.
- **Montserrat** drives section headers, problem titles, modal labels, and card headers, establishing an architectural, confident cadence.
- **Red Hat Display** handles user interface controls, problem descriptions, choices, and navigational labels with high legibility at standard reading distances.
- **Red Hat Mono** powers metrics, execution speed (`ms`), memory usage (`MB`), player ranks (`#001`), line-numbered code editors, and countdown timers. All numerical counters must use monospace tabular figures (`font-variant-numeric: tabular-nums`) to prevent jitter during live updates.

## Layout & Spacing
The layout model employs a strict 12-column fluid grid on desktop, scaling down to a single-column or dual-pane configuration on smaller screens. 

### Breakpoints & Layout Adaptations
- **Desktop (>= 1280px):** 12 columns with `gutter-lg` (24px) and `margin-lg` (40px). Supports a 3-pane workbench (Problem Spec, Code Editor/Compiler, Real-time Leaderboard telemetry).
- **Tablet (768px - 1279px):** 8 columns with `gutter` (16px) and `margin-md` (24px). Collapses to split-pane tabbed view with an expandable drawer for live standings.
- **Mobile (< 768px):** 4 columns with `gutter` (16px) and `margin` (16px). Reflows to single-focus swipeable stacks (Task -> Code -> Run Console).

Spacing increments are derived from an absolute 4px/8px baseline rhythm. Layout gaps rely exclusively on `space-*` tokens for unified horizontal and vertical distribution.

## Elevation & Depth
Elevation is expressed through tonal layering accompanied by micro-borders and localized radiant glows rather than muddy dropshadows:

- **Level 0 (Base Canvas):** `#0B0F19`. Flat, non-interactive foundation.
- **Level 1 (Panels & Cards):** `#111827` enclosed by a 1px border of `#1F2937`.
- **Level 2 (Active Splitters & Hovers):** Background shifts to `#1F2937` with border color transition to `#374151`.
- **Level 3 (Modals, Terminal Drawers, Menus):** Background `#1F2937`, border `#374151`, complemented by an ambient shadow: `0 12px 32px -4px rgba(0, 0, 0, 0.65)`.
- **Radiant Status Glows:** 
  - *Podium / Top Rank Highlight:* Amber glow via `box-shadow: 0 0 20px -2px rgba(245, 158, 11, 0.25)`.
  - *Active Run / Selected Code Tab:* Indigo beam via `box-shadow: 0 0 16px -2px rgba(99, 102, 241, 0.3)`.

## Shapes
The design system enforces a compact, engineered geometry:
- Default elements (buttons, inputs, chips, table cell wrappers) use **6px to 8px border-radius** (Level 1 / Soft), creating a crisp, technical edge.
- Code blocks, terminal windows, and dashboard surface containers lock to 8px.
- Internal badge containers and micro tags scale down to 4px.
- Fully rounded pills are strictly forbidden except for live indicator status dots (`rounded-full` on 8x8px elements).

## Components

### Buttons
- **Primary Action (Run Code / Submit):** Background `#6366F1`, hover `#4F46E5`, active `#4338CA`. Text `#FFFFFF` in Red Hat Display 14px bold. Height 40px, padding horizontal 16px, border-radius 6px.
- **Secondary Action (Reset / Next Problem):** Background `#111827`, border 1px solid `#374151`, text `#E5E7EB`. Hover background `#1F2937`.
- **Urgent / Final Submission:** Background `#F59E0B`, text `#0B0F19`, font-weight 700. Hover `#FBBF24`. Includes amber glow on active timers.

### Cards & Problem Containers
- Surface `#111827` with 1px border `#1F2937`.
- Header strip: Surface `#0E1422` with a subtle bottom divider (`#1F2937`).
- Card titles rendered in Montserrat 16px/600 (`title-md`).

### Badges & Chips
- **Rank Chip:** `#111827` surface, border 1px solid `#F59E0B` (for Top 10) or `#374151` (standard). Text in Red Hat Mono 12px with amber `#FBBF24` highlight.
- **Difficulty Badges:** 
  - Easy: Green tint (`#064E3B`, text `#34D399`).
  - Medium: Amber tint (`#78350F`, text `#FBBF24`).
  - Hard: Red tint (`#7F1D1D`, text `#F87171`).

### Form Controls & Inputs
- **Text Inputs & Filter Fields:** Background `#0B0F19`, border 1px solid `#1F2937`, text `#F9FAFB`. Focus ring: 1px border `#6366F1` with an indigo aura (`0 0 0 2px rgba(99, 102, 241, 0.2)`).
- **Checkboxes & Radios:** 18px boxes, background `#0B0F19`, border 1px solid `#374151`. Checked state fills `#6366F1` with white check glyph.

### Leaderboard Rows & Telemetry Lists
- Alternating subtle row striping (`#111827` and `#0E1422`).
- Hover state transitions row surface to `#1F2937`.
- Column alignments: Rank and Timestamps strictly right-aligned Red Hat Mono; participant metadata left-aligned Red Hat Display.

### Code Editor & Terminal
- Editor body sits at absolute base `#0B0F19`. Line numbers in `#4B5563` Red Hat Mono.
- Status bar displays real-time telemetry: Language, Memory, Latency in Red Hat Mono 12px with 6px gap tokens.