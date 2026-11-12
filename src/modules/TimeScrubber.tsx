"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
// TimeScrubber — keyframe scrub playhead choreography cartridge.
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
const NAMES = ["T-00", "T-01", "T-02", "T-03", "T-04", "T-05", "T-06", "T-07", "T-08", "T-09", "T-10", "T-11"];
const SPEED = 3;
const AGENTS = 12;
const RING_RADIUS = 64;
const DURATION = 4;

type TimedJob = Job & { tStart: number; tEnd: number };

function formatTime(t: number) {
  const clamped = Math.max(0, Math.min(DURATION, t));
  const whole = Math.floor(clamped);
  const frac = Math.floor((clamped - whole) * 100);
  return `00:0${whole}.${frac.toString().padStart(2, "0")}`;
}

export default function TimeScrubber({ preloader = true }: { preloader?: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrubRef = useRef<HTMLDivElement>(null);
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
    clock: "00:00.00",
  });
  const [scrubPct, setScrubPct] = useState(0);

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
        job: null as TimedJob | null,
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

    let jobs: TimedJob[] = [];
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
    let globalT = 0;
    let dragging = false;
    let playheadProxy = { x: 0, y: 0 };
    const scanMs = 1500;

    const assignTimes = (list: TimedJob[]) => {
      if (!list.length) return;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const j of list) {
        const top = j.el.getBoundingClientRect().top + window.scrollY;
        minY = Math.min(minY, top);
        maxY = Math.max(maxY, top);
      }
      const span = Math.max(1, maxY - minY);
      for (const j of list) {
        const top = j.el.getBoundingClientRect().top + window.scrollY;
        const depth = j.depth || 0;
        const norm = (top - minY) / span;
        const dur = 0.18 + depth * 0.05;
        j.tStart = Math.max(0, Math.min(DURATION - 0.05, norm * (DURATION - 0.35)));
        j.tEnd = Math.min(DURATION, j.tStart + dur);
      }
    };

    const applyTime = (t: number) => {
      globalT = Math.max(0, Math.min(DURATION, t));
      agents.forEach((a) => {
        a.job = null;
      });
      let busyIdx = 0;
      for (const j of jobs) {
        if (globalT < j.tStart) {
          j.state = 0;
          j.el.setAttribute("data-swarm", j.kind);
          j.el.style.clipPath = "";
          j.el.style.opacity = "";
        } else if (globalT >= j.tEnd) {
          j.state = 2;
          restoreJob(j);
        } else {
          j.state = 1;
          const p = (globalT - j.tStart) / Math.max(0.001, j.tEnd - j.tStart);
          j.el.removeAttribute("data-swarm");
          if (j.kind === "frame") {
            j.el.style.opacity = String(0.2 + 0.8 * p);
            j.el.style.clipPath = "";
          } else {
            j.el.style.opacity = "";
            j.el.style.clipPath = `inset(0 ${Math.round((1 - p) * 100)}% 0 0)`;
          }
          if (busyIdx < agents.length) {
            agents[busyIdx].job = j;
            busyIdx++;
          }
        }
      }
      setScrubPct((globalT / DURATION) * 100);
    };

    const start = () => {
      jobs.forEach(restoreJob);
      const base = collectJobs(self);
      jobs = base.map((j) => ({ ...j, tStart: 0, tEnd: 0.2 }));
      assignTimes(jobs);
      jobs.forEach((j) => j.el.setAttribute("data-swarm", j.kind));
      agents.forEach((a) => {
        a.job = null;
        a.phase = "idle";
      });
      buildEnd = 0;
      globalT = 0;
      setScrubPct(0);
      const pre = !!preloader && !calm;
      phase = pre ? "scan" : "build";
      phaseStart = performance.now();
      buildStart = pre ? 0 : phaseStart;
      setOverlay(pre);
      hudHidden = false;
      if (calm) {
        applyTime(DURATION);
        phase = "build";
        buildEnd = performance.now();
        setOverlay(false);
      } else {
        applyTime(0);
      }
    };

    const skip = () => {
      applyTime(DURATION);
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
      setTime: (t: number) => applyTime(t),
    };

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (dragging && scrubRef.current) {
        const rect = scrubRef.current.getBoundingClientRect();
        const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
        applyTime(p * DURATION);
      }
    };
    const onUp = () => {
      dragging = false;
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
    const onScrubDown = (e: PointerEvent) => {
      dragging = true;
      const target = scrubRef.current;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
      applyTime(p * DURATION);
      e.preventDefault();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", stopTour, { passive: true });
    window.addEventListener("touchstart", stopTour, { passive: true });
    document.addEventListener("click", onClick);
    const scrubEl = scrubRef.current;
    scrubEl?.addEventListener("pointerdown", onScrubDown);

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
      } else if (!calm && !dragging) {
        // Map scroll position to timeline OR advance via tour
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
        const scrollT = (window.scrollY / maxScroll) * DURATION;
        if (touring) {
          applyTime(Math.min(DURATION, globalT + dt * SPEED * 0.55));
        } else {
          applyTime(Math.max(globalT, scrollT));
        }
      }

      ringA += dt * 0.65;
      const scrubEl = scrubRef.current;
      if (scrubEl) {
        const r = scrubEl.getBoundingClientRect();
        playheadProxy = { x: r.left + (globalT / DURATION) * r.width, y: r.top + r.height / 2 };
      }

      agents.forEach((a, i) => {
        if (a.job) {
          const r = a.job.el.getBoundingClientRect();
          a.tx = r.left + r.width * 0.5;
          a.ty = r.top + r.height * 0.5;
          a.k = 400;
        } else if (i === 0 && scrubEl) {
          a.tx = playheadProxy.x;
          a.ty = playheadProxy.y;
          a.k = 280;
        } else {
          const th = ringA + (i / AGENTS) * Math.PI * 2;
          a.tx = cx + Math.cos(th) * RING_RADIUS;
          a.ty = cy + Math.sin(th) * RING_RADIUS;
          a.k = 55;
        }
      });

      for (const a of agents) springStep(a, dt);

      if (touring) {
        window.scrollBy({ top: 170 * SPEED * dt, behavior: "instant" });
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) touring = false;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, vw, vh);

      if (phase === "build" && globalT < DURATION) {
        ctx.fillStyle = pal.line;
        ctx.fillRect(0, Math.round(lineY), vw, 1);
        ctx.font = "600 8px " + pal.mono;
        ctx.textAlign = "right";
        ctx.fillText("PLAYHEAD · " + formatTime(globalT), vw - 14, lineY - 6);
        ctx.textAlign = "left";
      }

      for (const a of agents) {
        if (a.job) {
          const r = a.job.el.getBoundingClientRect();
          ctx.strokeStyle = a.color;
          ctx.globalAlpha = 0.5;
          ctx.strokeRect(Math.round(r.left) + 0.5, Math.round(r.top) + 0.5, Math.round(r.width), Math.round(r.height));
          ctx.globalAlpha = 1;
        }
        ctx.fillStyle = a.color;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.job ? 4 : 3, 0, Math.PI * 2);
        ctx.fill();
      }

      window.__swarm = { agents, phase, touring, lineY, time: globalT };

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
          clock: formatTime(globalT),
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
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", stopTour);
      window.removeEventListener("touchstart", stopTour);
      document.removeEventListener("click", onClick);
      scrubEl?.removeEventListener("pointerdown", onScrubDown);
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
            <rect x="4" y="11" width="18" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="10" y="8" width="3" height="10" fill="var(--accent-blue-team)" />
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
              <span style={{ fontFamily: "var(--font-jetbrains, monospace)", fontSize: 11 }}>{hud.clock}</span>
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
          <div
            ref={scrubRef}
            className="hud-scrub"
            style={{
              pointerEvents: "auto",
              width: 120,
              height: 10,
              borderRadius: 4,
              background: "var(--skeleton, #2A3344)",
              position: "relative",
              cursor: "ew-resize",
              flexShrink: 0,
            }}
            aria-label="Timeline scrubber"
          >
            <i
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: scrubPct + "%",
                background: "var(--accent-blue-team)",
                borderRadius: 4,
                pointerEvents: "none",
              }}
            />
            <i
              style={{
                position: "absolute",
                left: `calc(${scrubPct}% - 5px)`,
                top: -3,
                width: 10,
                height: 16,
                borderRadius: 2,
                background: "var(--handle-fill, #fff)",
                border: "1px solid var(--cursor-stroke, #fff)",
                pointerEvents: "none",
              }}
            />
          </div>
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
