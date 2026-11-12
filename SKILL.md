---
name: swarm-build
description: Build a site that a swarm of named agent cursors visibly constructs on load and scroll (build line, CAD selection boxes, HUD layer counter, spring-physics cursors that flock to the pointer), plus the matching animated product visuals, counters, billing toggle and hide-on-scroll nav. Use when asked for a "swarm build", "agents build the page", "the medium is the demo", a Securitas-style site, an agent or AI product landing page with cursor choreography, or to reuse the SwarmBuild, LiveVisual, StepVisual, Billing or NavHideOnScroll modules.
---

# swarm-build

A working Next.js 16 + React 19 site (plain CSS, `motion`) lives in `starter/`. It is the Securitas build, live-tested with 101 Playwright checks. Reuse it; do not rewrite the modules.

## Workflow

1. Copy the starter: `cp -R <this skill>/starter <new-project> && cd <new-project> && npm install`.
2. Rewrite `src/copy.ts` for the new product. Every string on the site lives there, including the labels inside the visuals. Keep the object shape, change the values. Never invent real customers, quotes or prices: mark placeholders as placeholders.
3. Retheme in `src/app/globals.css` (`:root` for dark, `html[data-theme="light"]` for light) and mirror the values in `DESIGN.md`. Components only use `var(--token)`.
4. Rename the crew: `NAMES` and `KEYS` in `src/modules/SwarmBuild.tsx`, and the `--agent-<key>` colours in `globals.css`. Each key needs a colour token.
5. Edit sections in `src/components/sections.tsx` and `interactive.tsx`. Obey the layer rule below.
6. Verify: `npm run lint`, `npm run build && npm run start -- -p 3077`, `node tests/verify.mjs` (set `BASE=<url>` for a deploy, `SHOTS=<dir>` for screenshots), then the design check in `README.md`.
7. Deploy, rerun the suite against the live URL, write `HANDOFF.md`.

## The layer rule (the one that breaks builds)

SwarmBuild only hides and builds elements inside `#main` that are a named layer or a rich-text container. Use the primitives in `src/components/ui.tsx`:

- `<L name="Card">` renders `data-framer-name`. A layer with layer children is a frame (outline drawn, then filled). A layer with none is a leaf (clip-revealed).
- `<T as="h2">` renders `data-framer-component-type="RichTextContainer"`. Text is typed in.

Anything visible that is not inside an `L` or `T` shows before the crew reaches it. A layer the build line can never pass (bottom of the page) never builds, so keep bottom padding on the footer (`max(96px, 20vh)`). The element named `Replay Button` replays the build and starts the tour.

`SwarmBuild` mounts once in the root layout, outside `#main`.

## Modules (`src/modules/`)

| File | What it gives you |
|---|---|
| `SwarmBuild.tsx` | Scan preloader, canvas cursors with name pills, build line, job claiming, tour, HUD, Esc to skip, replay. Tunables at the top: `SPEED` 3, `AGENTS` 12, `BUILD_LINE` 0.86, `RING_RADIUS` 64. Test hook: `window.__swarm`. |
| `LiveVisual.tsx` | Looping product visuals. `mode`: `editor`, `breakpoints`, `cms`, `components`, `tokens`, `seo`, `meter`, `counter`, `release`. Counter and meter take `value`, `unit`, `prefix`, `from`, `decimals`, `color`, `steady`. `release` is the orbiting-cursor scene used on the 404. |
| `StepVisual.tsx` | Four process visuals. `mode`: `scan`, `frame`, `type`, `ship`. |
| `Billing.tsx` | Monthly and yearly store with HOCs `withMonthly`, `withYearly`, `withPlanPrice`, `withBillingPeriod`. Yearly discount is `DISCOUNT`. |
| `NavHideOnScroll.tsx` | `withHideOnScroll(motion.header)`: hides past 80px on scroll down, shows on scroll up, `forceShow` for an open drawer. |
| `shared.tsx` | `useClock` (pauses off screen, honours reduced motion), `Cursor`, `Chip`, `clamp`, `seg`, `ease`, `lerp`. |

Also reusable from `ui.tsx`: `Selection` and `SelInline` (CAD selection box with handles and a size chip), `Hatch` (measured gap marker), `CursorIcon`.

## Physics, for when you tune it

- Each agent is a critically damped spring: damping `2 * sqrt(K) * 0.92`, two substeps per frame.
- An agent claims a job only if the job's top is above the build line and its parent frame is built. Phases: travel, draw, then type or fill.
- Idle agents ring the pointer at `RING_RADIUS` after it rests.
- The canvas reads its palette from CSS variables and rereads it when `data-theme` changes, so never hardcode colours in the module.

## Rules that kept the original clean

- Theme: inline head script sets `data-theme` before paint; toggle is `#theme-toggle-btn` and Alt+T (match `e.code === "KeyT"`, macOS types a dagger otherwise).
- Reduced motion: visuals show their finished state and the build completes at once. Keep that path.
- Animate `transform` and `opacity` only. No gradients, blur or emoji (the design check fails on them).
- Use `padding-block` on sections so the `.wrap` side gutter survives at tablet and phone.
- Selection handles overhang by 4px. Check for horizontal overflow at 390 after any layout change.
- Animated numbers hide the real value from screen readers, so keep the `.sr` copy next to each counter.

## Using one module in another project

Copy `shared.tsx` plus the module, the token block and the `.hud`, `.pre`, `.sel`, `.handle`, `.chip`, `.hatch` rules from `globals.css`, and replace the `@/copy` import with your own strings. `LiveVisual` and `StepVisual` need only `shared.tsx` and the tokens. `SwarmBuild` needs `#main`, the `L` and `T` attributes, and the HUD strings (`copy.hud`).

## Outside Claude Code

The starter has no dependency on this skill. Unzip, read this file, follow the workflow. For Codex or Cursor, point the agent at this file as its instructions.
