---
version: alpha
name: CHOREO.UI
description: Showcase of seven scene-graph choreography engines. Demo pages build themselves from L/T layers while a swappable cartridge actuates on canvas.
x-zsd:
  profile: "0.1"
  kind: project
  source:
    method: authored
  review:
    status: draft
  intent:
    audience: Frontend engineers and design engineers who ship motion-led marketing pages.
    primary-task: Compare seven choreography engines on the same DemoSections tree and open a demo.
    character: Technical drawing. Hairlines, selection boxes, measured gaps, monospace telemetry.
    density: compact
    theme: dark
    references:
      - Framer modules SwarmBuild, LiveVisual, StepVisual, Billing and NavHideOnScroll.
  preferences:
    must-use:
      - One primary action in each section.
      - Exact numbers and identifiers in telemetry.
      - Dark ink on agent colors.
    must-avoid:
      - Gradients.
      - Background blur.
      - Emoji.
    preserve:
      - The SwarmBuild state machine and spring physics.
      - The nine Framer token slots.
  implementation:
    token-source: src/app/globals.css
    component-sources:
      - src/components
      - src/modules
    style-sources:
      - src/app/globals.css
    font-assets:
      - Inter variable through next/font.
      - JetBrains Mono variable through next/font.
    image-assets: []
    icon-assets:
      - Inline SVG in src/components/ui.tsx.
  unresolved:
    - Pricing values are placeholders.
    - Customer names and logos are placeholders.
  layout:
    content-max: 1200px
    viewport-min: 320px
  breakpoints:
    phone: 390px
    tablet: 810px
    desktop: 1200px
  border:
    width-default: 1px
    color-default: "{colors.border-subtle}"
  motion:
    duration-fast: 120ms
    duration-base: 200ms
    duration-nav: 350ms
    easing-standard: ease-out
  accessibility:
    target-min: "{spacing.control-height}"
    focus-width: 2px
    focus-offset: 2px
    focus-color: "{colors.accent-blue-team}"
  modes:
    light:
      colors:
        primary: "#0F172A"
        on-primary: "#F8FAFC"
        surface: "#FFFFFF"
        on-surface: "#0F172A"
        bg-canvas: "#F8FAFC"
        bg-surface: "#FFFFFF"
        bg-elevated: "#F1F5F9"
        border-subtle: "#E2E8F0"
        text-primary: "#0F172A"
        text-secondary: "#475569"
        text-muted: "#5F6E84"
        accent-blue-team: "#059669"
        accent-red-team: "#E11D48"
        accent-blue-text: "#047857"
        accent-red-text: "#BE123C"
        on-red: "#FFFFFF"
        skeleton: "#CBD5E1"
        skeleton-strong: "#0F172ACC"
        tint-blue: "#05966914"
        ring-blue: "#05966926"
        tint-red: "#E11D4814"
        cursor-stroke: "#0F172A"
        shadow: "#0F172A26"
colors:
  primary: "#F1F5F9"
  on-primary: "#090B0E"
  surface: "#0E1117"
  on-surface: "#F1F5F9"
  bg-canvas: "#090B0E"
  bg-surface: "#0E1117"
  bg-elevated: "#141922"
  border-subtle: "#1E2532"
  text-primary: "#F1F5F9"
  text-secondary: "#8B95A5"
  text-muted: "#7A8597"
  accent-blue-team: "#10B981"
  accent-red-team: "#F43F5E"
  accent-blue-text: "#10B981"
  accent-red-text: "#F43F5E"
  on-blue: "#04130D"
  on-red: "#1A0409"
  ink-on-agent: "#090B0E"
  skeleton: "#2A3344"
  skeleton-strong: "#F1F5F9CC"
  tint-blue: "#10B98114"
  ring-blue: "#10B98126"
  tint-red: "#F43F5E14"
  cursor-stroke: "#FFFFFF"
  handle-fill: "#FFFFFF"
  shadow: "#00000073"
  agent-krait: "#F43F5E"
  agent-fuzz: "#FB923C"
  agent-drift: "#FACC15"
  agent-trace: "#38BDF8"
  agent-vanguard: "#10B981"
  agent-ward: "#2DD4BF"
  agent-seal: "#A78BFA"
typography:
  display-xl:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 64px
    fontWeight: 600
    lineHeight: 1.04
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 40px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -0.03em
  title-md:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.01em
  body-md:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0em
  body-sm:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0em
  label-md:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 15px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.01em
  mono-sm:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0em
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  2xl: 32px
  3xl: 48px
  4xl: 64px
  section: 96px
  control-height: 44px
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 12px
  full: 999px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
    height: "{spacing.control-height}"
  button-secondary:
    backgroundColor: "{colors.bg-elevated}"
    textColor: "{colors.text-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
    height: "{spacing.control-height}"
  card:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"
  inspector:
    backgroundColor: "{colors.bg-elevated}"
    textColor: "{colors.text-muted}"
    typography: "{typography.mono-sm}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  chip-blue:
    backgroundColor: "{colors.accent-blue-team}"
    textColor: "{colors.on-blue}"
    typography: "{typography.mono-sm}"
    rounded: "{rounded.sm}"
    padding: "{spacing.xs}"
  chip-red:
    backgroundColor: "{colors.accent-red-team}"
    textColor: "{colors.on-red}"
    typography: "{typography.mono-sm}"
    rounded: "{rounded.sm}"
    padding: "{spacing.xs}"
  name-tag:
    backgroundColor: "{colors.agent-drift}"
    textColor: "{colors.ink-on-agent}"
    typography: "{typography.mono-sm}"
    rounded: "{rounded.full}"
    padding: "{spacing.xs}"
---

# CHOREO.UI

## Overview

CHOREO.UI showcases seven scene-graph choreography engines on one DemoSections tree.
Each cartridge builds layers when its actuation reaches them. Hub lists engines; demo routes mount one cartridge outside `#main`.
Dark mode is the default. Light mode applies when `html` has `data-theme="light"`.

### Implementation

Read `src/app/globals.css` for token values. Read `src/copy.ts` for all strings.
The modules in `src/modules` are ports of the Framer modules. Do not change their timing or physics.

Engines collect each element with `data-framer-name` and each element with `data-framer-component-type="RichTextContainer"` inside `#main`.
Put each visible part in a named leaf or a text container. A part without a name stays visible before the build.

## Colors

- `primary`, `on-primary`: Use for the primary button and its label.
- `surface`, `on-surface`: Use for cards and the text on cards.
- `bg-canvas`: Use for the page and the navigation bar. Framer slot `--token-F04bYBUQH`.
- `bg-surface`: Use for cards. Framer slot `--token-A5w84IG3s`.
- `bg-elevated`: Use for the inspector and terminal surfaces. Framer slot `--token-gC336m1ca`.
- `border-subtle`: Use for 1px hairlines. Framer slot `--token-fqjRVkZi3`.
- `text-primary`: Use for headings and values. Framer slot `--token-zIbAWevhZ`.
- `text-secondary`: Use for body copy. Framer slot `--token-u2xrdE_zL`.
- `text-muted`: Use for telemetry labels. Framer slot `--token-XDpMy4ig5`.
- `accent-blue-team`: Use for selection frames, progress fills and focus. Framer slot `--token-F8aq5h09h`.
- `accent-red-team`: Use for the build line and hatch markers. Framer slot `--token-qbWelPRm9`.
- `accent-blue-text` and `accent-red-text`: Use when an accent color is text smaller than 18px.
- `on-blue`, `on-red`, `ink-on-agent`: Use for text on accent fills and agent fills.
- `skeleton`, `skeleton-strong`: Use for placeholder bars inside the live visuals.
- `tint-blue`, `ring-blue`, `tint-red`: Use for selection fills and active rings.
- `agent-krait`, `agent-fuzz`, `agent-drift`, `agent-trace`, `agent-vanguard`, `agent-ward`, `agent-seal`: One color for each agent. Use it for the cursor, the name tag and the meter.
- `cursor-stroke`: Use for the outline of each cursor.
- `handle-fill`: Use for the fill of each selection handle.

The brief gave other values for `text-muted` in the two modes.
Those values gave a contrast ratio below 4.5 on the card surfaces. This file uses values that pass.

## Typography

- `display-xl`: Use for the hero headline. Use 40px on phones.
- `headline-lg`: Use for section headlines. Use 28px on phones.
- `title-md`: Use for card titles.
- `body-md`: Use for section subheads.
- `body-sm`: Use for card descriptions.
- `label-md`: Use for the wordmark, navigation links and buttons.
- `mono-sm`: Use for breadcrumbs, telemetry and chips. Use 11px inside the live visuals.

Inter uses the optical size axis. Headlines use the display cut.

## Layout

Center the content within `x-zsd.layout.content-max`.
Use `xl` for page padding at desktop and tablet widths. Use `lg` on phones.
Use `section` between sections at desktop width. Use `4xl` on tablets and `3xl` on phones.
Keep all gaps on the 4px grid.

### Responsive behavior

At 1200px and wider, show the inspector panel and four step cards in one row.
From 810px to 1199px, stack the hero and show two columns of cards.
Below 810px, show one column. Replace the navigation links with a drawer.
Support `x-zsd.layout.viewport-min` without horizontal page scroll.

## Elevation & Depth

Use hairlines and surface steps for hierarchy.
Use `shadow` only for the build status bar and the cursors.

## Shapes

- `sm`: Use for chips and handles.
- `md`: Use for buttons and controls.
- `lg`: Use for cards and the workspace window.
- `full`: Use for name tags and the theme control.

## Components

### Button

Use `button-primary` for one action in each section. Use `button-secondary` for the alternative.

- Default: token colors, no outline.
- Hover: opacity 0.86.
- Pressed: scale 0.97.
- Focus-visible: 2px outline in `accent-blue-team` with 2px offset.
- Loading: keep the width. Show a progress label. Ignore more clicks.
- Recovery: show the result label. Return to the default label after 2400ms.

### Selection box

Draw a 1px `accent-blue-team` frame with four 7px handles. Put the size chip below the frame.

### Hatch marker

Fill the gap with 45 degree `accent-red-team` lines. Show the gap size in a `chip-red`.

### Build status bar

Show the layer count and the progress. Give the tour action and the skip action.

### Accordion

One item opens at a time. The icon turns 45 degrees when the item opens.

## Do's and Don'ts

- Do use token variables for all colors.
- Do name each layer that SwarmBuild must build.
- Do write copy with exact numbers.
- Do not use a gradient or a background blur.
- Do not use color as the only status signal.

## Motion

Use `x-zsd.motion.duration-fast` for hover and press. Use `x-zsd.motion.duration-base` for the accordion and theme change.
The navigation bar moves in `x-zsd.motion.duration-nav`.
With reduced motion, SwarmBuild uses calm mode. Calm mode builds without the preloader.
With reduced motion, the marquee and the progress fill do not move.

## Iconography

Use inline SVG with `currentColor`. Give each icon-only control an accessible name.

## Imagery

The page has no photographs. The live visuals are DOM drawings.

## Accessibility

Keyboard shortcuts: `Esc` completes the build. `Alt+T` changes the theme.
Use `x-zsd.accessibility.focus-width`, `x-zsd.accessibility.focus-offset` and `x-zsd.accessibility.focus-color` for focus.
Text below 18px has a contrast ratio of 4.5 or more in both modes.
The build overlay and the live visuals have `aria-hidden`. The text stays in the document.

### Review checks

Run `node tools/zero-slop-design/zsd.mjs lint DESIGN.md`.
Run `node tools/zero-slop-design/zsd.mjs check-code DESIGN.md --config design-check.config.json`.
Run `node tests/verify.mjs` against the production build.
