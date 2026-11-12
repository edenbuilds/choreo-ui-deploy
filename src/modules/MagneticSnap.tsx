"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
// MagneticSnap — entropy-to-order spring choreography cartridge.
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
  rr,
  springStep,
} from "@/modules/engine/core";

const KEYS = ["krait", "fuzz", "drift", "trace", "vanguard", "ward", "seal"];
const NAMES = ["Snap-01", "Snap-02", "Snap-03", "Snap-04", "Snap-05", "Snap-06", "Snap-07", "Snap-08", "Snap-09", "Snap-10", "Snap-11", "Snap-12"];
const SPEED = 3;
const AGENTS = 12;
const RING_RADIUS = 64;
const SPRING_K = 340;

type SnapJob = Job & { ox: number; oy: number; rot: number; flash: number; vx: number; vy: number; vr: number };

export default function MagneticSnap({ preloader = true }: { preloader?: boolean }) {
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
        job: null as SnapJob | null,
        phase: "idle",
        t0: 0,
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

    let jobs: SnapJob[] = [];
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

    const applyEntropy = (j: SnapJob) => {
      j.el.style.transform = `translate(${j.ox.toFixed(2)}px, ${j.oy.toFixed(2)}px) rotate(${j.rot.toFixed(2)}deg)`;
    };

    const start = () => {
      jobs.forEach(restoreJob);
      const base = collectJobs(self);
      jobs = base.map((j, i) => {
        const ox = (hash01(i * 3.1) - 0.5) * 56;
        const oy = (hash01(i * 7.7 + 1) - 0.5) * 56;
        const rot = (hash01(i * 11.3 + 2) - 0.5) * 8;
        const sj: SnapJob = {
          ...j,
          ox,
          oy,
          rot,
          flash: 0,
          vx: 0,
          vy: 0,
          vr: 0,
        };
        sj.el.setAttribute("data-swarm", sj.kind);
        applyEntropy(sj);
        return sj;
      });
      agents.forEach((a) => {
        a.job = null;
        a.phase = "idle";
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
          j.ox = 0;
          j.oy = 0;
          j.rot = 0;
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
        j.ox = 0;
        j.oy = 0;
        j.rot = 0;
        j.flash = 0;
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
          a.phase = "snap";
          a.t0 = now;
        }

        ringA += dt * 0.65;
        agents.forEach((a, i) => {
          const j = a.job as SnapJob | null;
          if (!j) {
            const th = ringA + (i / AGENTS) * Math.PI * 2;
            a.tx = cx + Math.cos(th) * RING_RADIUS;
            a.ty = cy + Math.sin(th) * RING_RADIUS;
            a.k = 55;
            return;
          }
          const r = j.el.getBoundingClientRect();
          a.tx = r.left + r.width / 2;
          a.ty = r.top + r.height / 2;
          a.k = 700;

          // Critically damped springs pull ox/oy/rot to identity
          const D = 2 * Math.sqrt(SPRING_K) * 0.92;
          const h = dt / 2;
          for (let s = 0; s < 2; s++) {
            j.vx += ((0 - j.ox) * SPRING_K - j.vx * D) * h;
            j.vy += ((0 - j.oy) * SPRING_K - j.vy * D) * h;
            j.vr += ((0 - j.rot) * SPRING_K - j.vr * D) * h;
            j.ox += j.vx * h;
            j.oy += j.vy * h;
            j.rot += j.vr * h;
          }
          applyEntropy(j);

          const settled = Math.hypot(j.ox, j.oy) < 0.4 && Math.abs(j.rot) < 0.15;
          if (settled || now - a.t0 > 900 / SPEED) {
            j.ox = 0;
            j.oy = 0;
            j.rot = 0;
            j.flash = 1;
            restoreJob(j);
            j.state = 2;
            a.job = null;
            a.phase = "idle";
          }
        });

        // Idle pointer: subtle attraction/repulsion on nearby built leaves
        if (mx >= 0) {
          for (const j of jobs) {
            if (j.state !== 2 || j.kind === "frame") continue;
            const r = j.el.getBoundingClientRect();
            const jx = r.left + r.width / 2;
            const jy = r.top + r.height / 2;
            const dx = jx - mx;
            const dy = jy - my;
            const dist = Math.hypot(dx, dy);
            if (dist < 120 && dist > 1) {
              const push = (dist < 48 ? 1 : -1) * Math.min(6, (48 / dist) * 3);
              const nx = (dx / dist) * push;
              const ny = (dy / dist) * push;
              j.el.style.transform = `translate(${nx.toFixed(2)}px, ${ny.toFixed(2)}px)`;
            } else if (!j.flash) {
              j.el.style.transform = "";
            }
          }
        }
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
      for (const j of jobs) {
        if (j.flash > 0) j.flash = Math.max(0, j.flash - dt * 1.8);
      }

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
        ctx.fillText("SNAP LINE", vw - 14, lineY - 6);
        ctx.textAlign = "left";
      }

      for (const j of jobs) {
        const r = j.el.getBoundingClientRect();
        if (r.bottom < -40 || r.top > vh + 40) continue;
        if (j.state === 0 || j.state === 1) {
          const dx = Math.round(j.ox);
          const sign = dx >= 0 ? "+" : "";
          const label = `Δx: ${sign}${dx}px · off-grid`;
          ctx.font = "600 9px " + pal.mono;
          const tw = ctx.measureText(label).width;
          const bx = r.left;
          const by = r.top - 18;
          rr(ctx, bx, by, tw + 10, 14, 3);
          ctx.fillStyle = pal.line;
          ctx.fill();
          ctx.fillStyle = pal.onAcc;
          ctx.textBaseline = "middle";
          ctx.fillText(label, bx + 5, by + 7.5);
          ctx.textBaseline = "alphabetic";
        } else if (j.flash > 0.05) {
          const label = "0px delta · locked";
          ctx.globalAlpha = j.flash;
          ctx.font = "600 9px " + pal.mono;
          const tw = ctx.measureText(label).width;
          const bx = r.left;
          const by = r.top - 18;
          rr(ctx, bx, by, tw + 10, 14, 3);
          ctx.fillStyle = pal.acc;
          ctx.fill();
          ctx.fillStyle = pal.onAcc;
          ctx.textBaseline = "middle";
          ctx.fillText(label, bx + 5, by + 7.5);
          ctx.textBaseline = "alphabetic";
          ctx.globalAlpha = 1;
        }
      }

      for (const a of agents) {
        ctx.fillStyle = a.color;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.job ? 4 : 3, 0, Math.PI * 2);
        ctx.fill();
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
            <rect x="5" y="5" width="16" height="16" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
            <path d="M9 13 H17 M13 9 V17" stroke="var(--accent-blue-team)" strokeWidth="1.5" />
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
