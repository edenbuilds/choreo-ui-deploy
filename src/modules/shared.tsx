"use client";
// Helpers that StepVisual and LiveVisual both define in the Framer originals. Kept identical, defined once.
import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";

export const MONO = "var(--mono)";
export const SANS = "var(--sans)";
export const clamp = (v: number) => Math.max(0, Math.min(1, v));
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// One clock per visual. It pauses while the visual is off screen.
export function useClock(active: boolean, fallback: number): [number, RefObject<HTMLDivElement | null>] {
  const [t, setT] = useState(fallback);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!active) return;
    // Reduced motion: keep the static frame that the original shows on the Framer canvas.
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let visible = true;
    const start = performance.now();
    let io: IntersectionObserver | null = null;
    if (ref.current && "IntersectionObserver" in window) {
      io = new IntersectionObserver(es => { visible = es[0].isIntersecting; });
      io.observe(ref.current);
    }
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (visible) setT(Math.max(0, (now - start) / 1e3));
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); if (io) io.disconnect(); };
  }, [active]);
  return [t, ref];
}

export function Cursor({ x, y, agent, name, scale = 1, opacity = 1 }: { x: number; y: number; agent: string; name?: string; scale?: number; opacity?: number }) {
  const color = "var(--agent-" + agent + ")";
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: "scale(" + scale + ")", transformOrigin: "0 0", pointerEvents: "none", zIndex: 5, opacity }}>
      <svg width="13" height="18" viewBox="0 0 15 20" style={{ display: "block", filter: "drop-shadow(0 1px 2px var(--shadow))" }}>
        <path d="M1 1L1 16.5L5.2 12.6L8.1 19L10.6 17.9L7.8 11.7L13.4 11.7Z" fill={color} stroke="var(--cursor-stroke)" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
      {name ? <span style={{ position: "absolute", left: 10, top: 15, background: color, color: "var(--ink-on-agent)", font: "700 9px " + SANS, padding: "1px 6px", borderRadius: 7, whiteSpace: "nowrap" }}>{name}</span> : null}
    </div>
  );
}

export function Chip({ children, red, style }: { children: ReactNode; red?: boolean; style?: CSSProperties }) {
  return (
    <span style={{ display: "inline-block", background: red ? "var(--accent-red-team)" : "var(--accent-blue-team)", color: red ? "var(--on-red)" : "var(--on-blue)", font: "600 9px " + MONO, padding: "2px 6px", borderRadius: 3, whiteSpace: "nowrap", ...style }}>
      {children}
    </span>
  );
}
