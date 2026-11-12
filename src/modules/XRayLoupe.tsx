"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
// XRayLoupe — blueprint & spec scanner choreography cartridge.
import { useEffect, useRef, useState } from "react";
import { copy } from "@/copy";
import {
  BUILD_LINE,
  HIDE_CSS,
  REPLAY_NAME,
  Job,
  collectJobs,
  readPalette,
  restoreJob,
  springStep,
} from "@/modules/engine/core";

const KEYS = ["krait", "fuzz", "drift", "trace", "vanguard", "ward", "seal"];
const NAMES = ["Probe-01", "Probe-02", "Probe-03", "Probe-04", "Probe-05", "Probe-06", "Probe-07", "Probe-08", "Probe-09", "Probe-10", "Probe-11", "Probe-12"];
const SPEED = 3;
const AGENTS = 12;
const RING_RADIUS = 64;
const LOUPE_R = 110;

export default function XRayLoupe({ preloader = true }: { preloader?: boolean }) {
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

    const start = () => {
      jobs.forEach(restoreJob);
      jobs = collectJobs(self);
      jobs.forEach((j) => j.el.setAttribute("data-swarm", j.kind));
      agents.forEach((a) => {
        a.job = null;
        a.phase = "idle";
        a.p = 0;
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
        restoreJob(j);
        j.state = 2;
      });
      agents.forEach((a) => {
        a.job = null;
        a.phase = "idle";
      });
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
          a.phase = "scan";
          a.t0 = now;
          a.p = 0;
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
          const dur = 360 / SPEED;
          const t = Math.min(1, (now - a.t0) / dur);
          a.p = t;
          a.tx = r.left + r.width * 0.5;
          a.ty = r.top + r.height * t;
          a.k = 900;
          if (t >= 0.2 && j.el.hasAttribute("data-swarm")) {
            j.el.removeAttribute("data-swarm");
          }
          if (j.kind !== "frame") {
            j.el.style.clipPath = `inset(0 0 ${Math.round((1 - t) * 100)}% 0)`;
            j.el.style.opacity = String(0.35 + 0.65 * t);
          }
          if (t >= 1) {
            j.el.style.clipPath = "";
            j.el.style.opacity = "";
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

      if (touring) {
        window.scrollBy({ top: 170 * SPEED * dt, behavior: "instant" });
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) touring = false;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, vw, vh);

      // Dashed wireframe outlines for unbuilt jobs below / at the wave
      for (const j of jobs) {
        if (j.state === 2) continue;
        const r = j.el.getBoundingClientRect();
        if (r.bottom < -20 || r.top > vh + 20) continue;
        ctx.strokeStyle = pal.tick;
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(Math.round(r.left) + 0.5, Math.round(r.top) + 0.5, Math.round(r.width), Math.round(r.height));
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        if (r.top < lineY + 40) {
          ctx.fillStyle = pal.muted;
          ctx.font = "500 8px " + pal.mono;
          ctx.fillText(j.name + " · wire", r.left + 4, r.top + 12);
        }
      }

      // SPEC WAVE build line
      if (phase === "build" && !buildEnd) {
        ctx.strokeStyle = pal.line;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(0, Math.round(lineY) + 0.5);
        ctx.lineTo(vw, Math.round(lineY) + 0.5);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = pal.line;
        ctx.font = "600 8px " + pal.mono;
        ctx.textAlign = "right";
        ctx.fillText("SPEC WAVE", vw - 14, lineY - 6);
        ctx.textAlign = "left";
      }

      // Invisible probe flock — tiny dots only (test-compatible)
      for (const a of agents) {
        if (a.job) {
          const r = a.job.el.getBoundingClientRect();
          ctx.strokeStyle = a.color;
          ctx.globalAlpha = 0.7;
          ctx.setLineDash([2, 3]);
          ctx.strokeRect(Math.round(r.left) + 0.5, Math.round(r.top) + 0.5, Math.round(r.width), Math.round(r.height * a.p));
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
        }
        ctx.fillStyle = a.color;
        ctx.globalAlpha = a.job ? 0.9 : 0.35;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.job ? 3 : 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // 110px X-ray loupe over built elements under pointer
      if (mx >= 0 && phase !== "scan") {
        const hovered = jobs.filter((j) => {
          if (j.state !== 2) return false;
          const r = j.el.getBoundingClientRect();
          return mx >= r.left && mx <= r.right && my >= r.top && my <= r.bottom;
        });
        if (hovered.length > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(mx, my, LOUPE_R, 0, Math.PI * 2);
          ctx.strokeStyle = pal.acc;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.clip();

          ctx.fillStyle = pal.rulerBg;
          ctx.globalAlpha = 0.92;
          ctx.fillRect(mx - LOUPE_R, my - LOUPE_R, LOUPE_R * 2, LOUPE_R * 2);
          ctx.globalAlpha = 1;
          ctx.strokeStyle = pal.edge;
          ctx.lineWidth = 0.5;
          for (let gx = Math.floor((mx - LOUPE_R) / 16) * 16; gx < mx + LOUPE_R; gx += 16) {
            ctx.beginPath();
            ctx.moveTo(gx, my - LOUPE_R);
            ctx.lineTo(gx, my + LOUPE_R);
            ctx.stroke();
          }
          for (let gy = Math.floor((my - LOUPE_R) / 16) * 16; gy < my + LOUPE_R; gy += 16) {
            ctx.beginPath();
            ctx.moveTo(mx - LOUPE_R, gy);
            ctx.lineTo(mx + LOUPE_R, gy);
            ctx.stroke();
          }

          for (const hj of hovered.slice(-3)) {
            const r = hj.el.getBoundingClientRect();
            const name = hj.name || "RichText";
            ctx.strokeStyle = pal.acc;
            ctx.setLineDash([3, 3]);
            ctx.strokeRect(r.left + 0.5, r.top + 0.5, r.width, r.height);
            ctx.setLineDash([]);
            ctx.fillStyle = pal.acc;
            ctx.font = "600 9px " + pal.mono;
            const tagY = Math.max(my - LOUPE_R + 18, r.top + 14);
            const tagX = Math.max(mx - LOUPE_R + 10, r.left + 6);
            ctx.fillText(`<L name="${name}">`, tagX, tagY);
            ctx.fillStyle = pal.text;
            ctx.font = "500 8px " + pal.mono;
            ctx.fillText(`var(--bg-surface)`, tagX, tagY + 12);
            ctx.fillText(`${Math.round(r.width)}×${Math.round(r.height)} · x:${Math.round(r.left)} y:${Math.round(r.top)}`, tagX, tagY + 24);
          }
          ctx.restore();
        }
      }

      window.__swarm = { agents, phase, touring, lineY };

      if (now - hudAt > 90) {
        hudAt = now;
        let built = 0;
        for (const j of jobs) if (j.state === 2) built++;
        if (!buildEnd && phase === "build" && built === jobs.length && jobs.length) buildEnd = now;
        setHud({
          phase: phase === "scan" ? "scan" : buildEnd ? "done" : "build",
          built,
          total: jobs.length,
          scan: scanCount,
          time: buildEnd ? Math.max(0, buildEnd - buildStart) / 1e3 : 0,
          hidden: hudHidden,
          touring,
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
      jobs.forEach(restoreJob);
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
            <circle cx="13" cy="13" r="9" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
            <circle cx="13" cy="13" r="3" fill="var(--accent-blue-team)" />
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
              <span>
                {AGENTS} {h.agents}
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
