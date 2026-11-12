"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
// Port of the Framer module SwarmBuild (k46vfKxkBuPzm5s64BGA/BuJVrLlhOWfw1IEyd1IJ).
// The state machine, timings and spring physics are the original ones.
// Changes: colors come from CSS variables so both themes work, the roster is the CHOREO.UI node set,
// and the hero button can replay the build and then start the tour.
import { useEffect, useRef, useState } from "react";
import { copy } from "@/copy";

const NAMES = ["Ari", "Bex", "Dot", "Fox", "Kai", "Nyx", "Rio", "Sol", "Ari-2", "Bex-2", "Dot-2", "Fox-2"];
const KEYS = ["krait", "fuzz", "drift", "trace", "vanguard", "ward", "seal"];
const ARROW_DIR = Math.atan2(-10, -5);
const TEXT_SEL = '[data-framer-component-type="RichTextContainer"]';
const CSS = [
  '[data-swarm="frame"]{background-color:transparent!important;background-image:none!important;box-shadow:none!important;border-color:transparent!important;outline-color:transparent!important}',
  '[data-swarm="frame"]::before,[data-swarm="frame"]::after{opacity:0!important}',
  '[data-swarm="frame"]>[data-framer-background-image-wrapper]{opacity:0!important}',
  '[data-swarm="leaf"],[data-swarm="text"]{clip-path:inset(0 100% 100% 0)!important}',
].join("");
// Fixed playback speed, as in the original. Visitors cannot change it.
const SPEED = 3;
const AGENTS = 12;
const BUILD_LINE = 0.86;
const RING_RADIUS = 64;
const REPLAY_NAME = "replay button";

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const q = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + q, y);
  ctx.arcTo(x + w, y, x + w, y + h, q);
  ctx.arcTo(x + w, y + h, x, y + h, q);
  ctx.arcTo(x, y + h, x, y, q);
  ctx.arcTo(x, y, x + w, y, q);
  ctx.closePath();
}

export default function SwarmBuild({ preloader = true }: { preloader?: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const api = useRef<any>({});
  const [overlay, setOverlay] = useState(!!preloader);
  const [hud, setHud] = useState({ phase: preloader ? "scan" : "build", built: 0, total: 0, scan: 0, time: 0, hidden: false, touring: false });

  useEffect(() => {
    const self = rootRef.current;
    const canvas = canvasRef.current;
    if (!self || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Reduced motion uses the original "calm" mode: the page still builds, without the full-screen preloader.
    const calm = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const styleEl = document.createElement("style");
    styleEl.textContent = CSS;
    document.head.appendChild(styleEl);

    // Canvas cannot read CSS variables, so the palette is read once and again on each theme change.
    let pal: any = {};
    const readPal = () => {
      const cs = getComputedStyle(document.documentElement);
      const g = (n: string) => cs.getPropertyValue(n).trim();
      pal = {
        acc: g("--token-F8aq5h09h"), onAcc: g("--on-blue"), line: g("--token-qbWelPRm9"), rulerBg: g("--token-A5w84IG3s"),
        tick: g("--skeleton"), tickText: g("--token-XDpMy4ig5"), edge: g("--token-fqjRVkZi3"), handle: g("--handle-fill"),
        stroke: g("--cursor-stroke"), ink: g("--ink-on-agent"), shadow: g("--shadow"),
        mono: g("--font-jetbrains") || "monospace", sans: g("--font-inter") || "sans-serif",
        colors: KEYS.map(k => g("--agent-" + k)),
      };
      agents.forEach((a, i) => { a.color = pal.colors[i % KEYS.length]; });
    };
    const themeObs = new MutationObserver(() => readPal());

    let vw = window.innerWidth;
    let vh = window.innerHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      vw = window.innerWidth; vh = window.innerHeight;
      canvas.width = Math.round(vw * dpr); canvas.height = Math.round(vh * dpr);
      canvas.style.width = vw + "px"; canvas.style.height = vh + "px";
    };
    resize();
    window.addEventListener("resize", resize);
    const arrow = new Path2D("M0 0 L0 15.5 L4.2 11.6 L7.1 18 L9.6 16.9 L6.8 10.7 L12.4 10.7 Z");
    const n = AGENTS;
    const agents: any[] = [];
    for (let i = 0; i < n; i++) {
      agents.push({ x: vw / 2, y: vh / 2, vx: 0, vy: 0, ang: 0, want: 0, tx: vw / 2, ty: vh / 2, k: 200, color: "", name: NAMES[i % NAMES.length], job: null, box: null, phase: "idle", t0: 0, tag: 0, beam: false, cx: 0, cy: 0, ch: 0 });
    }
    readPal();
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    let jobs: any[] = [];
    let boxes: any[] = [];
    let phase = "scan";
    let phaseStart = performance.now();
    let buildStart = 0;
    let buildEnd = 0;
    const speed = SPEED;
    let mx = -1;
    let my = -1;
    let ringA = 0;
    let touring = false;
    let tourPending = false;
    let chrome = 0;
    let lastBusy = 0;
    let hudHidden = false;
    let lastPath = window.location.pathname;
    let routeAt = 0;
    let routeOld: Element[] = [];
    let routeStable = 0;
    let scanMs = 1800;

    const restore = (j: any) => { j.el.removeAttribute("data-swarm"); j.el.style.clipPath = ""; };
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return false;
      const cs = getComputedStyle(el);
      return cs.display !== "none" && cs.visibility !== "hidden";
    };
    const collect = () => {
      const main = document.getElementById("main") || document.body;
      const list = Array.from(main.querySelectorAll("[data-framer-name], " + TEXT_SEL));
      const map = new Map<Element, any>();
      const out: any[] = [];
      for (const el of list) {
        if (self.contains(el) || el.contains(self)) continue;
        const host = el.parentElement ? el.parentElement.closest(TEXT_SEL) : null;
        if (host) continue;
        if (!visible(el)) continue;
        const job = { el, kind: el.matches(TEXT_SEL) ? "text" : "leaf", parent: null, state: 0, chars: (el.textContent || "").length, lines: [] };
        map.set(el, job);
        out.push(job);
      }
      for (const j of out) {
        let par = j.el.parentElement;
        while (par && !map.has(par)) par = par.parentElement;
        if (par) { const pj = map.get(par); j.parent = pj; if (pj.kind === "leaf") pj.kind = "frame"; }
      }
      return out;
    };
    const start = () => {
      jobs.forEach(restore);
      jobs = collect();
      jobs.forEach(j => j.el.setAttribute("data-swarm", j.kind));
      boxes = [];
      agents.forEach(a => { a.job = null; a.box = null; a.beam = false; a.phase = "idle"; });
      buildEnd = 0;
      const pre = !!preloader && !calm;
      phase = pre ? "scan" : "build";
      phaseStart = performance.now();
      buildStart = pre ? 0 : phaseStart;
      if (pre) agents.forEach(a => { a.x = vw / 2; a.y = vh / 2; a.vx = 0; a.vy = 0; });
      setOverlay(pre);
      hudHidden = false;
    };
    const skip = () => {
      jobs.forEach(j => { restore(j); j.state = 2; });
      agents.forEach(a => { a.job = null; a.box = null; a.beam = false; });
      boxes = [];
      touring = false; tourPending = false;
      if (phase === "scan") { phase = "build"; buildStart = performance.now(); }
      setOverlay(false);
      if (!buildEnd) buildEnd = performance.now();
    };
    const replay = () => { window.scrollTo({ top: 0, behavior: "instant" }); start(); };
    api.current = { replay, tour: () => { touring = !touring; }, close: () => { skip(); hudHidden = true; } };
    const onMove = (e: PointerEvent) => { mx = e.clientX; my = e.clientY; };
    const onKey = (e: KeyboardEvent) => { touring = false; tourPending = false; if (e.key === "Escape") skip(); };
    const stopTour = () => { touring = false; tourPending = false; };
    const onClick = (e: MouseEvent) => {
      const anchor = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (anchor && !e.metaKey && !e.ctrlKey && !e.shiftKey && anchor.getAttribute("target") !== "_blank") {
        try {
          const url = new URL((anchor as HTMLAnchorElement).href, window.location.href);
          if (url.origin === window.location.origin && url.pathname !== window.location.pathname && preloader) setOverlay(true);
        } catch {}
      }
      let el = e.target instanceof Element ? e.target.closest("[data-framer-name]") : null;
      while (el) {
        if ((el.getAttribute("data-framer-name") || "").toLowerCase() === REPLAY_NAME) {
          e.preventDefault();
          replay();
          // "Simulate a breach" replays the build and then tours the page.
          tourPending = true;
          if (phase === "build") { touring = true; tourPending = false; }
          return;
        }
        el = el.parentElement ? el.parentElement.closest("[data-framer-name]") : null;
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", stopTour, { passive: true });
    window.addEventListener("touchstart", stopTour, { passive: true });
    document.addEventListener("click", onClick);

    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const wrap = (a: number) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
    const measure = (el: Element) => {
      const base = el.getBoundingClientRect();
      const range = document.createRange();
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const lines: any[] = [];
      let node = walker.nextNode();
      while (node) {
        if ((node.textContent || "").trim()) {
          range.selectNodeContents(node);
          for (const r of Array.from(range.getClientRects())) {
            if (r.width < 0.5) continue;
            const mid = (r.top + r.bottom) / 2 - base.top;
            const line = lines.find(l => mid > l.top && mid < l.bottom);
            if (line) {
              line.left = Math.min(line.left, r.left - base.left); line.right = Math.max(line.right, r.right - base.left);
              line.top = Math.min(line.top, r.top - base.top); line.bottom = Math.max(line.bottom, r.bottom - base.top);
            } else lines.push({ top: r.top - base.top, bottom: r.bottom - base.top, left: r.left - base.left, right: r.right - base.left });
          }
        }
        node = walker.nextNode();
      }
      lines.sort((a, b) => a.top - b.top);
      return lines;
    };
    const typeClip = (j: any, a: any, t: number, r: DOMRect) => {
      const L = j.lines;
      if (!L.length) { j.el.style.clipPath = "inset(0 " + (100 - t * 100) + "% 0 0)"; a.cx = r.left + r.width * t; a.cy = r.top; a.ch = r.height; return; }
      let total = 0;
      for (const l of L) total += l.right - l.left;
      let rem = t * total;
      let i = 0;
      while (i < L.length - 1 && rem > L[i].right - L[i].left) { rem -= L[i].right - L[i].left; i++; }
      const cur = L[i];
      const x = cur.left + Math.min(rem, cur.right - cur.left);
      const top = i > 0 ? (L[i - 1].bottom + cur.top) / 2 : -20;
      const bot = i < L.length - 1 ? (cur.bottom + L[i + 1].top) / 2 : r.height + 20;
      j.el.style.clipPath = "polygon(-20px -20px, calc(100% + 20px) -20px, calc(100% + 20px) " + top + "px, " + x + "px " + top + "px, " + x + "px " + bot + "px, -20px " + bot + "px)";
      a.cx = r.left + x; a.cy = r.top + cur.top; a.ch = cur.bottom - cur.top;
    };
    const done = (a: any, now: number) => {
      const j = a.job;
      if (j) { j.el.style.clipPath = ""; j.state = 2; }
      if (a.box) a.box.doneAt = now;
      a.job = null; a.box = null; a.beam = false; a.phase = "idle";
    };

    let raf = 0;
    let last = performance.now();
    let frame = 0;
    let hudAt = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1e3));
      last = now;
      frame++;
      if (window.location.pathname !== lastPath) {
        lastPath = window.location.pathname;
        routeAt = now; routeStable = 0;
        routeOld = jobs.filter(j => j.kind !== "frame" || !j.parent).map(j => j.el);
        if (preloader) setOverlay(true);
      }
      if (routeAt) {
        // Wait until the router has swapped the old page out, then let the new one settle.
        let gone = 1;
        if (routeOld.length) { let off = 0; for (const el of routeOld) if (!el.isConnected) off++; gone = off / routeOld.length; }
        const swapped = gone > 0.25 || now - routeAt > 3e3;
        if (swapped && !routeStable) routeStable = now;
        if (routeStable && now - routeStable > 180) { routeAt = 0; routeStable = 0; routeOld = []; scanMs = 1100; window.scrollTo({ top: 0, behavior: "instant" }); start(); }
      }
      const lineY = vh * BUILD_LINE;
      const acc = pal.acc;
      let scanCount = 0;
      const hasMouse = mx >= 0;
      const cx = hasMouse ? mx : vw * 0.72;
      const cy = hasMouse ? my : vh * 0.34;
      if (phase === "scan") {
        const t = (now - phaseStart) / (scanMs / speed);
        scanCount = Math.round(Math.min(1, t) * jobs.length);
        const R = Math.min(150, Math.min(vw, vh) * 0.22);
        const base = (now / 1e3) * 2.4;
        agents.forEach((a, i) => {
          const th = base + (i % 2) * Math.PI - Math.floor(i / 2) * 0.21;
          a.tx = vw / 2 + Math.cos(th) * R; a.ty = vh / 2 + Math.sin(th) * R; a.k = 700; a.want = th + Math.PI / 2 - ARROW_DIR;
        });
        if (t >= 1) { phase = "build"; buildStart = now; setOverlay(false); if (tourPending) { touring = true; tourPending = false; } }
      } else {
        const free = agents.filter(a => !a.job);
        if (free.length && frame % 2 === 0) {
          for (const j of jobs) {
            if (!free.length) break;
            if (j.state !== 0) continue;
            if (j.parent && j.parent.state === 0) continue;
            const r = j.el.getBoundingClientRect();
            if (r.top >= lineY) continue;
            let bi = 0; let bd = Infinity;
            free.forEach((a, i) => { const d = (a.x - r.left) * (a.x - r.left) + (a.y - r.top) * (a.y - r.top); if (d < bd) { bd = d; bi = i; } });
            const a = free.splice(bi, 1)[0];
            const box = { job: j, p: 0, doneAt: 0 };
            boxes.push(box);
            j.state = 1; a.job = j; a.box = box; a.phase = "travel"; a.t0 = now;
          }
        }
        ringA += dt * 0.6;
        agents.forEach((a, i) => {
          const j = a.job;
          if (!j) {
            const th = ringA + (i / n) * Math.PI * 2;
            a.tx = cx + Math.cos(th) * RING_RADIUS; a.ty = cy + Math.sin(th) * RING_RADIUS;
            a.k = 38 + ((i * 37) % 11) * 9;
            const sp = Math.hypot(a.vx, a.vy);
            a.want = (sp > 140 ? Math.atan2(a.vy, a.vx) : Math.atan2(cy - a.y, cx - a.x)) - ARROW_DIR;
            return;
          }
          lastBusy = now;
          a.want = 0;
          const r = j.el.getBoundingClientRect();
          const box = a.box;
          if (a.phase === "travel") {
            a.tx = r.left; a.ty = r.top; a.k = 260;
            if (Math.hypot(a.x - r.left, a.y - r.top) < 12 || now - a.t0 > 650 / speed) { a.phase = "draw"; a.t0 = now; }
          } else if (a.phase === "draw") {
            const t = Math.min(1, (now - a.t0) / (340 / speed));
            const e = ease(t);
            box.p = e; a.tx = r.left + r.width * e; a.ty = r.top + r.height * e; a.k = 1100;
            if (t >= 1) {
              j.el.removeAttribute("data-swarm");
              if (j.kind === "text") { j.lines = measure(j.el); typeClip(j, a, 0, r); a.phase = "type"; a.beam = true; a.t0 = now; }
              else if (j.kind === "leaf") { j.el.style.clipPath = "inset(0 100% 0 0)"; a.phase = "fill"; a.t0 = now; }
              else done(a, now);
            }
          } else if (a.phase === "type") {
            const dur = Math.min(1700, Math.max(260, j.chars * 18)) / speed;
            const t = Math.min(1, (now - a.t0) / dur);
            typeClip(j, a, t, r);
            a.tx = a.cx + 3; a.ty = a.cy + a.ch * 0.5; a.k = 1100;
            if (t >= 1) done(a, now);
          } else if (a.phase === "fill") {
            const t = ease(Math.min(1, (now - a.t0) / (380 / speed)));
            j.el.style.clipPath = "inset(0 " + (100 - t * 100) + "% 0 0)";
            a.tx = r.left + r.width * t; a.ty = r.top + r.height * 0.5; a.k = 900;
            if (t >= 1) done(a, now);
          }
        });
      }
      // Critically damped spring, two substeps. Unchanged from the original.
      for (const a of agents) {
        const K = Math.min(1200, a.k * (speed > 1 ? 1.3 : 1));
        const D = 2 * Math.sqrt(K) * 0.92;
        const h = dt / 2;
        for (let s = 0; s < 2; s++) {
          a.vx += ((a.tx - a.x) * K - a.vx * D) * h; a.vy += ((a.ty - a.y) * K - a.vy * D) * h;
          a.x += a.vx * h; a.y += a.vy * h;
        }
        a.ang += wrap(a.want - a.ang) * Math.min(1, dt * 9);
        a.tag += ((a.job ? 1 : 0) - a.tag) * Math.min(1, dt * 8);
      }
      if (touring) {
        window.scrollBy({ top: 170 * speed * dt, behavior: "instant" });
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) touring = false;
      }
      const busy = phase === "build" && now - lastBusy < 900;
      chrome += ((busy ? 1 : 0) - chrome) * Math.min(1, dt * 5);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, vw, vh);
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      boxes = boxes.filter(b => !b.doneAt || now - b.doneAt < 250 / speed + 450);
      const live: any[] = [];
      for (const b of boxes) {
        const r = b.job.el.getBoundingClientRect();
        const w = r.width * b.p;
        const h = r.height * b.p;
        if (!b.doneAt) live.push({ l: r.left, t: r.top, w, h });
        if (r.bottom < -40 || r.top > vh + 40) continue;
        const al = b.doneAt ? Math.max(0, 1 - (now - b.doneAt - 250 / speed) / 400) : 1;
        if (al <= 0) continue;
        const x0 = Math.round(r.left) + 0.5;
        const y0 = Math.round(r.top) + 0.5;
        if (!b.doneAt && chrome > 0.05) {
          ctx.save();
          ctx.globalAlpha = 0.2 * chrome; ctx.strokeStyle = acc; ctx.setLineDash([2, 3]);
          ctx.beginPath();
          ctx.moveTo(0, y0); ctx.lineTo(vw, y0); ctx.moveTo(0, y0 + h); ctx.lineTo(vw, y0 + h);
          ctx.moveTo(x0, 0); ctx.lineTo(x0, vh); ctx.moveTo(x0 + w, 0); ctx.lineTo(x0 + w, vh);
          ctx.stroke();
          ctx.restore();
        }
        ctx.globalAlpha = al; ctx.strokeStyle = acc; ctx.lineWidth = 1;
        ctx.strokeRect(x0, y0, Math.round(w), Math.round(h));
        const corners = [[x0, y0], [x0 + w, y0], [x0, y0 + h], [x0 + w, y0 + h]];
        for (const c of corners) { ctx.fillStyle = pal.handle; ctx.fillRect(c[0] - 2.5, c[1] - 2.5, 5, 5); ctx.strokeRect(c[0] - 2.5, c[1] - 2.5, 5, 5); }
        const label = Math.round(w) + " \xd7 " + Math.round(h);
        ctx.font = "600 9px " + pal.mono;
        const tw = ctx.measureText(label).width;
        const bw = tw + 10;
        const bx = x0 + w / 2 - bw / 2;
        const by = y0 + h + 7;
        rr(ctx, bx, by, bw, 14, 3);
        ctx.fillStyle = acc; ctx.fill();
        ctx.fillStyle = pal.onAcc; ctx.textBaseline = "middle";
        ctx.fillText(label, bx + 5, by + 7.5);
        ctx.textBaseline = "alphabetic";
      }
      ctx.globalAlpha = 1;
      if (chrome > 0.01) {
        const T = 18;
        const sy = window.scrollY;
        ctx.globalAlpha = chrome * 0.96; ctx.fillStyle = pal.rulerBg;
        ctx.fillRect(0, 0, vw, T); ctx.fillRect(0, 0, T, vh);
        ctx.globalAlpha = chrome * 0.6; ctx.fillStyle = acc;
        for (const b of live) { ctx.fillRect(b.l, 0, b.w, T); ctx.fillRect(0, b.t, T, b.h); }
        ctx.globalAlpha = chrome; ctx.strokeStyle = pal.tick; ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x < vw; x += 10) { const len = x % 100 === 0 ? T : x % 50 === 0 ? 7 : 4; ctx.moveTo(x + 0.5, T - len); ctx.lineTo(x + 0.5, T); }
        for (let y = -(sy % 10); y < vh; y += 10) { const v = Math.round(y + sy); const len = v % 100 === 0 ? T : v % 50 === 0 ? 7 : 4; ctx.moveTo(T - len, Math.round(y) + 0.5); ctx.lineTo(T, Math.round(y) + 0.5); }
        ctx.stroke();
        ctx.fillStyle = pal.tickText; ctx.font = "500 8px " + pal.mono;
        for (let x = 100; x < vw; x += 100) ctx.fillText(String(x), x + 3, 9);
        for (let y = -(sy % 100); y < vh; y += 100) {
          const v = Math.round(y + sy);
          if (v <= 0) continue;
          ctx.save(); ctx.translate(10, y - 3); ctx.rotate(-Math.PI / 2); ctx.fillText(String(v), 0, 0); ctx.restore();
        }
        ctx.fillStyle = pal.edge; ctx.fillRect(0, T, vw, 1); ctx.fillRect(T, 0, 1, vh);
        ctx.globalAlpha = chrome * 0.85; ctx.fillStyle = pal.line;
        ctx.fillRect(0, Math.round(lineY), vw, 1);
        ctx.font = "600 8px " + pal.mono; ctx.textAlign = "right";
        ctx.fillText("BUILD LINE", vw - 14, lineY - 5);
        ctx.textAlign = "left"; ctx.globalAlpha = 1;
      }
      for (const a of agents) {
        if (a.phase === "type") { ctx.fillStyle = a.color; ctx.fillRect(a.cx, a.cy, 1.5, a.ch); }
        ctx.save();
        ctx.translate(a.x, a.y);
        if (a.beam) {
          ctx.strokeStyle = a.color; ctx.lineWidth = 2; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(-3, -7); ctx.lineTo(3, -7); ctx.moveTo(0, -7); ctx.lineTo(0, 7); ctx.moveTo(-3, 7); ctx.lineTo(3, 7); ctx.stroke();
        } else {
          ctx.rotate(a.ang);
          ctx.shadowColor = pal.shadow; ctx.shadowBlur = 4; ctx.shadowOffsetY = 1;
          ctx.fillStyle = a.color; ctx.fill(arrow);
          ctx.shadowColor = "transparent"; ctx.lineWidth = 1.2; ctx.lineJoin = "round";
          ctx.strokeStyle = pal.stroke; ctx.stroke(arrow);
        }
        ctx.restore();
        if (a.tag > 0.03) {
          ctx.globalAlpha = a.tag;
          ctx.font = "700 9px " + pal.sans;
          const tw = ctx.measureText(a.name).width;
          const bx = a.x + (a.beam ? 6 : 9);
          const by = a.y + (a.beam ? 9 : 17);
          rr(ctx, bx, by, tw + 12, 14, 7);
          ctx.fillStyle = a.color; ctx.fill();
          ctx.fillStyle = pal.ink; ctx.textBaseline = "middle";
          ctx.fillText(a.name, bx + 6, by + 7.5);
          ctx.textBaseline = "alphabetic"; ctx.globalAlpha = 1;
        }
      }
      // Test and debug hook: agent positions for the Playwright flocking check.
      (window as any).__swarm = { agents, phase, touring, lineY };
      if (now - hudAt > 90) {
        hudAt = now;
        let built = 0;
        for (const j of jobs) if (j.state === 2) built++;
        if (!buildEnd && phase === "build" && built === jobs.length) buildEnd = now;
        const st = { phase: phase === "scan" ? "scan" : buildEnd ? "done" : "build", built, total: jobs.length, scan: scanCount, time: buildEnd ? Math.max(0, buildEnd - buildStart) / 1e3 : 0, hidden: hudHidden, touring };
        setHud(prev => (prev.phase === st.phase && prev.built === st.built && prev.total === st.total && prev.scan === st.scan && prev.hidden === st.hidden && prev.time === st.time && prev.touring === st.touring ? prev : st));
      }
    };
    start();
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      themeObs.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", stopTour);
      window.removeEventListener("touchstart", stopTour);
      document.removeEventListener("click", onClick);
      jobs.forEach(restore);
      styleEl.remove();
    };
  }, [preloader]);

  const pct = hud.phase === "scan" ? (hud.total ? hud.scan / hud.total : 0) : hud.total ? hud.built / hud.total : 0;
  const isDone = hud.phase === "done";
  const h = copy.hud;
  return (
    <div ref={rootRef} style={{ pointerEvents: "none" }}>
      <div aria-hidden="true" className="pre" style={{ opacity: overlay ? 1 : 0, visibility: overlay ? "visible" : "hidden", transition: "opacity 0.6s ease, visibility 0s linear " + (overlay ? "0s" : "0.6s"), pointerEvents: overlay ? "auto" : "none" }}>
        <div>
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <path d="M13 2 L23 5.5 V13 C23 18.5 19 22.5 13 24.5 C7 22.5 3 18.5 3 13 V5.5 Z" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
            <path d="M9.5 7.5 L9.5 18 L12.4 15.3 L14.4 19.6 L16.1 18.8 L14.2 14.6 L18 14.6 Z" fill="var(--accent-blue-team)" />
          </svg>
        </div>
      </div>
      <canvas ref={canvasRef} aria-hidden="true" style={{ position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh", zIndex: 9999, pointerEvents: "none" }} />
      {!hud.hidden && (
        <div className="hud" id="swarm-hud" data-phase={hud.phase}>
          {hud.phase === "scan" ? (
            <span className="hud-text">{h.scan} <b id="hud-count">{hud.scan}</b> {h.layers}</span>
          ) : isDone ? (
            <span className="hud-text">{h.done} <b id="hud-count">{hud.total}</b> {h.layers} {h.inTime} {hud.time.toFixed(1)}s</span>
          ) : (
            <>
              <span className="hud-av">{KEYS.slice(0, 5).map((k, i) => <i key={k} style={{ background: "var(--agent-" + k + ")" }}>{NAMES[i][0]}</i>)}</span>
              <span>{AGENTS} {h.agents}</span>
              <b><span id="hud-count">{hud.built}</span> / {hud.total} {h.layers}</b>
            </>
          )}
          {!isDone && <span className="hud-bar"><i style={{ transform: "scaleX(" + pct + ")" }} /></span>}
          <button className="hud-btn" id="hud-tour" onClick={() => (isDone ? api.current.replay() : api.current.tour())}>{isDone ? h.replay : hud.touring ? h.pause : h.tour}</button>
          <button className="hud-btn hud-x" id="hud-skip" aria-label={h.skip} title={h.skip} onClick={() => api.current.close()}>{"\xd7"}</button>
        </div>
      )}
    </div>
  );
}
