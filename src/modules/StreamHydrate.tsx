"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
// StreamHydrate — live AST & diff streamer choreography cartridge.
import { useEffect, useRef, useState } from "react";
import { copy } from "@/copy";
import {
  BUILD_LINE,
  HIDE_CSS,
  REPLAY_NAME,
  Job,
  collectJobs,
  hash01,
  readPalette,
  restoreJob,
  springStep,
  toHexPreview,
} from "@/modules/engine/core";

const KEYS = ["krait", "fuzz", "drift", "trace", "vanguard", "ward", "seal"];
const NAMES = ["Cur-01", "Cur-02", "Cur-03", "Cur-04", "Cur-05", "Cur-06", "Cur-07", "Cur-08", "Cur-09", "Cur-10", "Cur-11", "Cur-12"];
const SPEED = 3;
const AGENTS = 12;
const RING_RADIUS = 64;

type Arc = { x0: number; y0: number; x1: number; y1: number; t0: number; color: string; name: string };
type LogLine = { text: string; t0: number };

export default function StreamHydrate({ preloader = true }: { preloader?: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const api = useRef<any>({});
  const [overlay, setOverlay] = useState(!!preloader);
  const [hud, setHud] = useState({
    phase: preloader ? "scan" : "build",
    built: 0,
    total: 0,
    scan: 0,
    time: 0,
    hidden: false,
    touring: false,
    terminal: "",
  });

  useEffect(() => {
    const self = rootRef.current;
    const canvas = canvasRef.current;
    if (!self || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const calm = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const styleEl = document.createElement("style");
    styleEl.textContent = HIDE_CSS;
    document.head.appendChild(styleEl);

    let pal = readPalette(KEYS);
    const agents: any[] = [];
    let vw = window.innerWidth;
    let vh = window.innerHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    for (let i = 0; i < AGENTS; i++) {
      agents.push({
        x: vw / 2,
        y: vh / 2,
        vx: 0,
        vy: 0,
        tx: vw / 2,
        ty: vh / 2,
        k: 220,
        color: "",
        name: NAMES[i % NAMES.length],
        job: null as Job | null,
        phase: "idle",
        t0: 0,
        p: 0,
        hCur: 2,
        hTarget: 2,
        hv: 0,
      });
    }

    const applyPal = () => {
      pal = readPalette(KEYS);
      agents.forEach((a, i) => {
        a.color = pal.colors[i % KEYS.length];
      });
    };
    applyPal();

    const resize = () => {
      vw = window.innerWidth;
      vh = window.innerHeight;
      canvas.width = Math.round(vw * dpr);
      canvas.height = Math.round(vh * dpr);
      canvas.style.width = vw + "px";
      canvas.style.height = vh + "px";
    };
    resize();

    const themeObs = new MutationObserver(() => applyPal());
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    window.addEventListener("resize", resize);

    let jobs: Job[] = [];
    let phase = "scan";
    let phaseStart = performance.now();
    let buildStart = 0;
    let buildEnd = 0;
    let mx = -1;
    let my = -1;
    let ringA = 0;
    let touring = false;
    let tourPending = false;
    let hudHidden = false;
    const scanMs = 1500;
    const heights = new Map<HTMLElement, number>();
    const origText = new Map<HTMLElement, string>();
    let arcs: Arc[] = [];
    let logs: LogLine[] = [];
    let hoverJob: Job | null = null;
    let hoverMs = "";

    const collapseFrame = (j: Job) => {
      if (j.kind !== "frame") return;
      const h = j.el.getBoundingClientRect().height;
      if (!heights.has(j.el)) heights.set(j.el, h || parseFloat(getComputedStyle(j.el).height) || 48);
      j.el.style.height = "2px";
      j.el.style.overflow = "hidden";
    };

    const start = () => {
      jobs.forEach((j) => {
        if (origText.has(j.el)) j.el.textContent = origText.get(j.el)!;
        restoreJob(j);
      });
      heights.clear();
      origText.clear();
      arcs = [];
      logs = [];
      jobs = collectJobs(self);
      jobs.forEach((j) => {
        j.el.setAttribute("data-swarm", j.kind);
        if (j.kind === "text") origText.set(j.el, j.el.textContent || "");
        if (j.kind === "frame") collapseFrame(j);
      });
      agents.forEach((a) => {
        a.job = null;
        a.phase = "idle";
        a.p = 0;
        a.hCur = 2;
        a.hv = 0;
      });
      buildEnd = 0;
      const pre = !!preloader && !calm;
      phase = pre ? "scan" : "build";
      phaseStart = performance.now();
      buildStart = pre ? 0 : phaseStart;
      setOverlay(pre);
      hudHidden = false;
      if (calm) {
        jobs.forEach((j) => {
          if (origText.has(j.el)) j.el.textContent = origText.get(j.el)!;
          restoreJob(j);
          j.state = 2;
        });
        phase = "build";
        buildEnd = performance.now();
        setOverlay(false);
      }
    };

    const skip = () => {
      jobs.forEach((j) => {
        if (origText.has(j.el)) j.el.textContent = origText.get(j.el)!;
        restoreJob(j);
        j.state = 2;
      });
      agents.forEach((a) => {
        a.job = null;
        a.phase = "idle";
      });
      arcs = [];
      touring = false;
      tourPending = false;
      if (phase === "scan") {
        phase = "build";
        buildStart = performance.now();
      }
      setOverlay(false);
      if (!buildEnd) buildEnd = performance.now();
    };

    const replay = () => {
      window.scrollTo({ top: 0, behavior: "instant" });
      start();
    };
    api.current = {
      replay,
      tour: () => {
        touring = !touring;
      },
      close: () => {
        skip();
        hudHidden = true;
      },
    };

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      hoverJob = null;
      hoverMs = "";
      for (const j of jobs) {
        if (j.state !== 2) continue;
        const r = j.el.getBoundingClientRect();
        if (mx >= r.left && mx <= r.right && my >= r.top && my <= r.bottom) {
          hoverJob = j;
          const ms = (4 + hash01((j.depth || 0) * 9.1 + j.chars) * 18).toFixed(1);
          hoverMs = `hydrated in ${ms}ms`;
        }
      }
    };
    const onKey = (e: KeyboardEvent) => {
      touring = false;
      tourPending = false;
      if (e.key === "Escape") skip();
    };
    const stopTour = () => {
      touring = false;
      tourPending = false;
    };
    const onClick = (e: MouseEvent) => {
      let el = e.target instanceof Element ? e.target.closest("[data-framer-name]") : null;
      while (el) {
        if ((el.getAttribute("data-framer-name") || "").toLowerCase() === REPLAY_NAME) {
          e.preventDefault();
          replay();
          tourPending = true;
          if (phase === "build") {
            touring = true;
            tourPending = false;
          }
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

    let raf = 0;
    let last = performance.now();
    let hudAt = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1e3));
      last = now;

      const lineY = vh * BUILD_LINE;
      const cx = mx >= 0 ? mx : vw * 0.72;
      const cy = mx >= 0 ? my : vh * 0.34;
      let scanCount = 0;
      const hudY = vh - 48;
      const hudX = vw * 0.5;

      if (phase === "scan") {
        const t = (now - phaseStart) / (scanMs / SPEED);
        scanCount = Math.round(Math.min(1, t) * jobs.length);
        const R = Math.min(140, Math.min(vw, vh) * 0.2);
        agents.forEach((a, i) => {
          const th = (now / 1e3) * 2.6 + (i / AGENTS) * Math.PI * 2;
          a.tx = vw / 2 + Math.cos(th) * R;
          a.ty = vh / 2 + Math.sin(th) * R;
          a.k = 650;
        });
        if (t >= 1) {
          phase = "build";
          buildStart = now;
          setOverlay(false);
          if (tourPending) {
            touring = true;
            tourPending = false;
          }
        }
      } else if (!calm) {
        const free = agents.filter((a) => !a.job);
        for (const j of jobs) {
          if (!free.length) break;
          if (j.state !== 0) continue;
          if (j.parent && j.parent.state === 0) continue;
          const r = j.el.getBoundingClientRect();
          if (r.top >= lineY) continue;
          const a = free.shift()!;
          j.state = 1;
          a.job = j;
          a.phase = "hydrate";
          a.t0 = now;
          a.p = 0;
          a.hCur = j.kind === "frame" ? 2 : heights.get(j.el) || r.height;
          a.hTarget = heights.get(j.el) || Math.max(r.height, 24);
          a.hv = 0;
          const ms = Math.round(8 + hash01(j.chars + (j.depth || 0)) * 24);
          logs.push({ text: `+ mount <${j.name}> ${ms}ms`, t0: now });
          if (logs.length > 8) logs.shift();
          arcs.push({
            x0: hudX,
            y0: hudY,
            x1: r.left + r.width / 2,
            y1: r.top + Math.min(r.height, 20),
            t0: now,
            color: a.color,
            name: j.name,
          });
        }

        ringA += dt * 0.65;
        agents.forEach((a, i) => {
          const j = a.job as Job | null;
          if (!j) {
            const th = ringA + (i / AGENTS) * Math.PI * 2;
            a.tx = cx + Math.cos(th) * RING_RADIUS;
            a.ty = cy + Math.sin(th) * RING_RADIUS;
            a.k = 55;
            return;
          }
          const r = j.el.getBoundingClientRect();
          const dur = (j.kind === "text" ? 480 : 360) / SPEED;
          const t = Math.min(1, (now - a.t0) / dur);
          a.p = t;
          a.tx = r.left + r.width * t;
          a.ty = r.top + 4;
          a.k = 900;

          if (j.kind === "frame") {
            const K = 280;
            const D = 2 * Math.sqrt(K) * 0.92;
            const h = dt / 2;
            for (let s = 0; s < 2; s++) {
              a.hv += ((a.hTarget - a.hCur) * K - a.hv * D) * h;
              a.hCur += a.hv * h;
            }
            j.el.style.height = Math.max(2, a.hCur) + "px";
            j.el.style.overflow = "hidden";
          }

          if (t >= 0.2 && j.el.hasAttribute("data-swarm")) {
            j.el.removeAttribute("data-swarm");
          }

          if (j.kind === "text") {
            const full = origText.get(j.el) || "";
            j.el.textContent = toHexPreview(full, t);
          } else if (j.kind === "leaf") {
            j.el.style.clipPath = `inset(0 ${(1 - t) * 100}% 0 0)`;
          }

          if (t >= 1) {
            if (j.kind === "text" && origText.has(j.el)) j.el.textContent = origText.get(j.el)!;
            if (j.kind === "frame") {
              j.el.style.height = "";
              j.el.style.overflow = "";
            }
            j.el.style.clipPath = "";
            j.state = 2;
            a.job = null;
            a.phase = "idle";
          }
        });
      } else {
        ringA += dt * 0.65;
        agents.forEach((a, i) => {
          const th = ringA + (i / AGENTS) * Math.PI * 2;
          a.tx = cx + Math.cos(th) * RING_RADIUS;
          a.ty = cy + Math.sin(th) * RING_RADIUS;
          a.k = 55;
        });
      }

      for (const a of agents) springStep(a, dt);
      arcs = arcs.filter((arc) => now - arc.t0 < 700);

      if (touring) {
        window.scrollBy({ top: 170 * SPEED * dt, behavior: "instant" });
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) touring = false;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, vw, vh);

      if (phase === "build" && !buildEnd) {
        ctx.fillStyle = pal.line;
        ctx.fillRect(0, Math.round(lineY), vw, 1);
        ctx.font = "600 8px " + pal.mono;
        ctx.textAlign = "right";
        ctx.fillText("HYDRATE LINE", vw - 14, lineY - 6);
        ctx.textAlign = "left";
      }

      // Bezier arcs from HUD to mounting rects
      for (const arc of arcs) {
        const p = Math.min(1, (now - arc.t0) / 650);
        ctx.strokeStyle = arc.color;
        ctx.globalAlpha = 1 - p * 0.7;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const mx2 = (arc.x0 + arc.x1) / 2;
        const my2 = Math.min(arc.y0, arc.y1) - 80;
        ctx.moveTo(arc.x0, arc.y0);
        ctx.quadraticCurveTo(mx2, my2, arc.x1, arc.y1);
        ctx.stroke();
        ctx.globalAlpha = 1;
        const bx = arc.x0 + (arc.x1 - arc.x0) * p;
        const by = (1 - p) * (1 - p) * arc.y0 + 2 * (1 - p) * p * my2 + p * p * arc.y1;
        ctx.fillStyle = arc.color;
        ctx.beginPath();
        ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Hover: highlight parent-child tree branch
      if (hoverJob) {
        const chain: Job[] = [];
        let cur: Job | null = hoverJob;
        while (cur) {
          chain.push(cur);
          cur = cur.parent;
        }
        for (const j of chain) {
          const r = j.el.getBoundingClientRect();
          ctx.strokeStyle = pal.acc;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 0.85;
          ctx.strokeRect(Math.round(r.left) + 0.5, Math.round(r.top) + 0.5, Math.round(r.width), Math.round(r.height));
        }
        ctx.globalAlpha = 1;
        for (let i = 0; i < chain.length - 1; i++) {
          const a = chain[i].el.getBoundingClientRect();
          const b = chain[i + 1].el.getBoundingClientRect();
          ctx.strokeStyle = pal.acc;
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          ctx.moveTo(a.left + a.width / 2, a.top);
          ctx.lineTo(b.left + b.width / 2, b.top + b.height);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }

      for (const a of agents) {
        ctx.fillStyle = a.color;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.job ? 4 : 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Terminal stream near bottom (above HUD)
      const termY = vh - 72;
      ctx.font = "500 10px " + pal.mono;
      let ty = termY - logs.length * 14;
      for (const line of logs) {
        const age = (now - line.t0) / 4000;
        ctx.globalAlpha = Math.max(0.25, 1 - age);
        ctx.fillStyle = pal.acc;
        ctx.fillText(line.text, 16, ty);
        ty += 14;
      }
      ctx.globalAlpha = 1;
      if (hoverMs) {
        ctx.fillStyle = pal.text;
        ctx.font = "600 10px " + pal.mono;
        ctx.fillText(hoverMs, 16, termY + 4);
      }

      window.__swarm = { agents, phase, touring, lineY };

      if (now - hudAt > 90) {
        hudAt = now;
        let built = 0;
        for (const j of jobs) if (j.state === 2) built++;
        if (!buildEnd && phase === "build" && built === jobs.length && jobs.length) buildEnd = now;
        const terminal = hoverMs || (logs.length ? logs[logs.length - 1].text : "");
        setHud({
          phase: phase === "scan" ? "scan" : buildEnd ? "done" : "build",
          built,
          total: jobs.length,
          scan: scanCount,
          time: buildEnd ? Math.max(0, buildEnd - buildStart) / 1e3 : 0,
          hidden: hudHidden,
          touring,
          terminal,
        });
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
      jobs.forEach((j) => {
        if (origText.has(j.el)) j.el.textContent = origText.get(j.el)!;
        restoreJob(j);
      });
      styleEl.remove();
    };
  }, [preloader]);

  const pct = hud.phase === "scan" ? (hud.total ? hud.scan / hud.total : 0) : hud.total ? hud.built / hud.total : 0;
  const isDone = hud.phase === "done";
  const h = copy.hud;

  return (
    <div ref={rootRef} style={{ pointerEvents: "none" }}>
      <div
        aria-hidden="true"
        className="pre"
        style={{
          opacity: overlay ? 1 : 0,
          visibility: overlay ? "visible" : "hidden",
          transition: "opacity 0.6s ease, visibility 0s linear " + (overlay ? "0s" : "0.6s"),
          pointerEvents: overlay ? "auto" : "none",
        }}
      >
        <div>
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <path d="M6 8 H20 M6 13 H16 M6 18 H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="20" cy="18" r="3" fill="var(--accent-blue-team)" />
          </svg>
        </div>
      </div>
      <canvas ref={canvasRef} aria-hidden="true" style={{ position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh", zIndex: 9999, pointerEvents: "none" }} />
      {!hud.hidden && (
        <div className="hud" id="swarm-hud" data-phase={hud.phase}>
          {hud.phase === "scan" ? (
            <span className="hud-text">
              {h.scan} <b id="hud-count">{hud.scan}</b> {h.layers}
            </span>
          ) : isDone ? (
            <span className="hud-text">
              {h.done} <b id="hud-count">{hud.total}</b> {h.layers} {h.inTime} {hud.time.toFixed(1)}s
            </span>
          ) : (
            <>
              <span className="hud-av">
                {KEYS.slice(0, 5).map((k, i) => (
                  <i key={k} style={{ background: "var(--agent-" + k + ")" }}>
                    {String(i + 1)}
                  </i>
                ))}
              </span>
              <span style={{ fontFamily: "var(--font-jetbrains, monospace)", fontSize: 11, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {hud.terminal || `${AGENTS} ${h.agents}`}
              </span>
              <b>
                <span id="hud-count">{hud.built}</span> / {hud.total} {h.layers}
              </b>
            </>
          )}
          {!isDone && (
            <span className="hud-bar">
              <i style={{ transform: "scaleX(" + pct + ")" }} />
            </span>
          )}
          <button className="hud-btn" id="hud-tour" onClick={() => (isDone ? api.current.replay() : api.current.tour())}>
            {isDone ? h.replay : hud.touring ? h.pause : h.tour}
          </button>
          <button className="hud-btn hud-x" id="hud-skip" aria-label={h.skip} title={h.skip} onClick={() => api.current.close()}>
            {"\xd7"}
          </button>
        </div>
      )}
    </div>
  );
}
