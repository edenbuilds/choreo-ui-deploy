# CHOREO.UI

Showcase of seven DOM scene-graph choreography engines. Each demo mounts a cartridge outside `#main`, builds the page from `<L>` / `<T>` layers, and exposes `window.__swarm` for Playwright checks.

Brand domain: [choreo.design](https://choreo.design).

```bash
npm run dev                 # http://localhost:3000 (hub)
npm run build && npm run start -- -p 3077
node tests/verify.mjs       # Playwright (BASE=<url> to test a deploy)
node tools/zero-slop-design/zsd.mjs check-code DESIGN.md --config design-check.config.json
```

Routes: `/` hub · `/demos/swarm` · `/demos/signal` · `/demos/xray` · `/demos/magnetic` · `/demos/timeline` · `/demos/isometric` · `/demos/stream`.

All strings live in `src/copy.ts`. Design tokens and rules live in `DESIGN.md` and `src/app/globals.css`.
