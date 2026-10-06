---
name: Apex Precision
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#464554'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#777586'
  outline-variant: '#c7c4d7'
  surface-tint: '#5148d7'
  primary: '#2a14b4'
  on-primary: '#ffffff'
  primary-container: '#4338ca'
  on-primary-container: '#c1beff'
  inverse-primary: '#c3c0ff'
  secondary: '#904d00'
  on-secondary: '#ffffff'
  secondary-container: '#fe932c'
  on-secondary-container: '#663500'
  tertiary: '#00442d'
  on-tertiary: '#ffffff'
  tertiary-container: '#005e40'
  on-tertiary-container: '#66daa8'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e3dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#100069'
  on-primary-fixed-variant: '#372abf'
  secondary-fixed: '#ffdcc3'
  secondary-fixed-dim: '#ffb77d'
  on-secondary-fixed: '#2f1500'
  on-secondary-fixed-variant: '#6e3900'
  tertiary-fixed: '#85f8c4'
  tertiary-fixed-dim: '#68dba9'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-hero:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-hero-mobile:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Montserrat
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Montserrat
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  mono-rank:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 22px
    letterSpacing: -0.02em
  mono-data:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes an elite, performance-focused competitive environment tailored for high-stakes hackathons, algorithmic contests, and engineering benchmarks. The interface balances high-velocity data density with editorial clarity, catering to competitive developers, enterprise talent scouts, and contest organizers. 

The aesthetic is Modern SaaS with high-contrast structural discipline. The experience evokes athletic rigor and intellectual mastery—functional, razor-sharp, and unencumbered by gratuitous ornament. Surfaces rely on cool slate and zinc neutrals that allow strategic highlights (electric indigo focus points and celebratory amber metals) to direct immediate attention to leaderboard shifts, tier placements, and real-time achievements.

Motion is subtle and instantaneous: soft 2px vertical hover lifts, swift easing (under 150ms), and crisp perimeter illumination rather than playful or bouncy transitions.

## Colors

The palette employs a deliberate hierarchy designed for fast optical parsing:

- **Primary (`#4338CA`)**: Deep Indigo anchored for core interactive calls-to-action, primary triggers, links, active navigation items, and current user highlights.
- **Secondary (`#D97706`)**: Pure Amber/Gold dedicated strictly to podium markers (1st place, grand prize badges, medal achievements, streak counts, and tier promotion highlights).
- **Tertiary (`#059669`)**: Emerald green reserved for positive delta states, green test suites passed, successful submissions, and upward leaderboard velocity.
- **Neutrals (`#0F172A` down to `#F8FAFC`)**: A cool slate architecture providing balanced foreground-background contrast ratios (WCAG AAA compliant for text, minimum AA for interactive boundaries).
- **Canvas Base**: Canvas background sits on `#F8FAFC`, stepping up to `#FFFFFF` for primary cards, containers, and table rows to ensure clean edge definition against neutral hairline dividers (`#E2E8F0`).

## Typography

The type system implements strict typographic division across purpose, legibility, and technical density:

- **Display & Section Headers (`Montserrat`)**: Delivers structural presence for hero banners, competition titles, and card headers. Geometric clarity keeps titles punchy and authoritative.
- **Body & Controls (`Hanken Grotesk`)**: Provides humanist warmth balanced with high screen legibility for instructions, contest rules, metadata descriptions, and button labels.
- **Tabular Data, Scores & Ranks (`JetBrains Mono`)**: Guarantees fixed-width horizontal alignment across dense leaderboard tables, countdown clocks, test case results, participant IDs, execution runtimes, and memory footprints.

## Layout & Spacing

The layout is built upon an 8-point base unit system governed by a 12-column responsive fluid grid (max-width `1440px`), collapsing to 8 columns on tablet, and 4 columns on mobile devices:

- **Desktop (1024px+)**: 12 columns with 24px (`1.5rem`) gutters and 32px (`2rem`) canvas margins. Side-by-side leaderboard views, live code previewers, and split-screen telemetry dashboards.
- **Tablet (768px - 1023px)**: 8 columns with 16px (`1rem`) gutters and 24px (`1.5rem`) margins. Leaderboard controls stack above data rows.
- **Mobile (< 768px)**: 4 columns with 12px (`0.75rem`) gutters and 16px (`1rem`) margins. Leaderboards shift to horizontally swipeable score cells with locked participant columns.

Internal card and row padding follows compact vertical rhythm (`space-sm` to `space-md`) to ensure maximum visible data density above the fold.

## Elevation & Depth

This system avoids heavy drop shadows, opting instead for crisp structural containment through low-contrast hairline borders paired with subtle ambient diffusion:

- **Level 0 (Flat)**: Background `#F8FAFC`, zero elevation, borderless.
- **Level 1 (Card & Row Baseline)**: `#FFFFFF` surface enclosed by a 1px solid `#E2E8F0` border. Shadow: `0 1px 2px 0 rgba(15, 23, 42, 0.04)`.
- **Level 2 (Interactive Hover & Flyouts)**: Elevated card or row on hover. Lifts `2px` along the Y-axis. Border transitions to `#CBD5E1`. Shadow: `0 4px 12px -2px rgba(15, 23, 42, 0.08), 0 2px 4px -1px rgba(15, 23, 42, 0.04)`.
- **Level 3 (Modals & Overlays)**: Full dialogs and quick-look user profiles. Border: 1px `#CBD5E1`. Shadow: `0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 10px 10px -5px rgba(15, 23, 42, 0.04)`.
- **Active User / Podium Glow**: Top-ranked entries and active user rows receive a 1px perimeter tint (`#4338CA` or `#D97706`) with a 0 0 0 1px inset ring rather than standard outer blur.

## Shapes

The interface embraces a disciplined **Rounded (Level 2)** shape standard:

- Core interactive elements (buttons, text inputs, search fields, dropdown menus) use standard `rounded` (8px / `0.5rem`).
- Content containers, contest stage wrappers, and leaderboard cards use `rounded-lg` (12px to 16px / `0.75rem - 1rem`).
- Avatars, status indicators, and pill tags (such as submission results and ranking delta chips) utilize `rounded-full` (9999px) for clear geometric contrast against rectangular data tables.

## Components

### Buttons
- **Primary**: Solid Indigo (`#4338CA`), text white (`#FFFFFF`), `font-weight: 600`, 8px corner radius. Hover: `#3730A3` with a 1px upward translateY lift. Focus: 2px offset ring in `#6366F1`.
- **Secondary**: Surface white with 1px border `#CBD5E1`, text `#1E293B`. Hover: `#F8FAFC` background with border `#94A3B8`.
- **Amber / Podium Action**: Solid Amber (`#D97706`), text white, reserved for claiming prizes, viewing podium recaps, and grand final entries.

### Leaderboard Rows & Cards
- **Row Anatomy**: Monospace rank badge on far left, avatar + competitor handle, execution time / memory chips, score metric right-aligned in bold `JetBrains Mono`.
- **Podium Styling**: 
  - *1st Place*: Amber border highlight (`#F59E0B`), warm subtle tint background (`#FEF3C7`/20), medal badge in `#D97706`.
  - *2nd Place*: Slate-400 silver accents.
  - *3rd Place*: Bronze-orange (`#B45309`) accents.
- **Current User Row**: Sticky bottom-bar or highlighted table row featuring an indigo boundary (`#4338CA`), slight blue background tint (`#EEF2FF`), and immediate rank position identifier.

### Chips & Badges
- **Rank Chips**: Pill-shaped, JetBrains Mono font. Podium badges feature soft metallic fill with dark borders.
- **Language / Tag Chips**: Neutral fill (`#F1F5F9`), text `#475569`, 4px radius, no border.
- **Status Chips**:
  - *Accepted / Passed*: Background `#ECFDF5`, text `#047857`, 1px border `#A7F3D0`.
  - *Wrong Answer / Failed*: Background `#FEF2F2`, text `#B91C1C`, 1px border `#FECACA`.

### Form Inputs & Filters
- **Text & Search Fields**: Height 40px, 8px radius, `#FFFFFF` background, 1px border `#CBD5E1`. Placeholder `#94A3B8`. Active focus triggers a 1px border `#4338CA` paired with an indigo outer glow ring (`#4338CA` at 15% opacity).
- **Checkboxes & Radios**: 8px rounded for checkboxes (subtle 4px radius), circular for radios. Inactive border `#94A3B8`, active fill `#4338CA` with white icon check.

### Real-Time Telemetry & Countdown Cards
- High-contrast countdown tickers with paired label-values. Numbers render in `JetBrains Mono` at large scale (`headline-lg`), displaying hours, minutes, and seconds separated by low-opacity colons.