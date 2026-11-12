"use client";
// Port of the Framer module StepVisual (wljRYCQ9a01tVEqWYrWk/5qS9K0JWVb8iFmRdZ4PL).
// Geometry, timelines and easing are the original ones. Colors use CSS variables for both themes.
import { copy } from "@/copy";
import { Chip, Cursor, MONO, SANS, clamp, ease, lerp, seg, useClock } from "./shared";

const V = copy.how.visual;
const BLUE = "var(--accent-blue-team)";
const RED = "var(--accent-red-team)";
const STATIC_T: Record<string, number> = { scan: 1.7, frame: 1.2, type: 2.6, ship: 3.6 };

function Scan({ t }: { t: number }) {
  const p = (t % 4) / 4;
  const active = Math.min(2, Math.floor(p * 3.2));
  const count = Math.round(216 * ease(clamp(p * 1.15)));
  const done = p > 0.86;
  const cx = 16 + active * 56 + 24;
  const thumbs = [0, 1, 2].map(i => {
    const on = i === active && !done;
    const seen = i < active || done;
    return (
      <div key={i} style={{ position: "absolute", left: 16 + i * 56, top: 18, width: 48, height: 34, borderRadius: 4, background: "var(--bg-elevated)", border: "1px solid " + (on ? BLUE : seen ? "var(--ring-blue)" : "var(--border-subtle)"), overflow: "hidden", boxShadow: on ? "0 0 0 3px var(--ring-blue)" : "none" }}>
        <div style={{ position: "absolute", left: 6, top: 7, width: 22, height: 3, borderRadius: 2, background: "var(--skeleton)" }} />
        <div style={{ position: "absolute", left: 6, top: 14, width: 30, height: 3, borderRadius: 2, background: "var(--border-subtle)" }} />
        {on ? <div style={{ position: "absolute", top: 0, bottom: 0, width: 2, left: ((p * 3.2) % 1) * 48, background: BLUE, boxShadow: "0 0 8px " + BLUE }} /> : null}
      </div>
    );
  });
  return (
    <>
      {thumbs}
      <div style={{ position: "absolute", left: 16, top: 64, width: 150, height: 5, borderRadius: 3, background: "var(--bg-elevated)", overflow: "hidden" }}>
        <div style={{ width: clamp(p * 1.15) * 100 + "%", height: "100%", background: "var(--skeleton)" }} />
      </div>
      <div style={{ position: "absolute", left: 16, top: 75, width: 110, height: 5, borderRadius: 3, background: "var(--bg-elevated)", overflow: "hidden" }}>
        <div style={{ width: clamp(p * 1.4 - 0.2) * 100 + "%", height: "100%", background: "var(--skeleton)" }} />
      </div>
      <div style={{ position: "absolute", left: 16, top: 92, font: "500 11px " + MONO, color: done ? "var(--accent-blue-text)" : "var(--text-secondary)", whiteSpace: "nowrap" }}>
        {done ? V.scanDone : V.scanning + " \xb7 " + count + " " + V.sinks}
      </div>
      <Cursor x={lerp(cx - 30, cx + 6, 0.5 + 0.5 * Math.sin(t * 3))} y={40} agent="trace" name="Trace" />
    </>
  );
}

// The exploit frame uses the red-team color: Krait is drawing the blast radius.
function Frame({ t }: { t: number }) {
  const a = (t * Math.PI * 2) / 4;
  const w = Math.round(150 + 40 * Math.sin(a));
  const h = Math.round(56 + 14 * Math.sin(a + 0.7));
  const W = Math.round((w * 6.4) / 8) * 8;
  const H = Math.round((h * 11.4) / 8) * 8;
  const handles = [[0, 0], [w, 0], [0, h], [w, h]].map((c, i) => (
    <div key={i} style={{ position: "absolute", left: c[0] - 3.5, top: c[1] - 3.5, width: 7, height: 7, background: "var(--handle-fill)", border: "1px solid " + RED, boxSizing: "border-box" }} />
  ));
  return (
    <>
      <div style={{ position: "absolute", left: 16, top: 16, width: w, height: h, border: "1px solid " + RED, background: "var(--tint-red)", boxSizing: "border-box" }}>
        <div style={{ position: "absolute", left: 8, top: 8, width: Math.max(20, w * 0.45), height: 4, borderRadius: 2, background: "var(--skeleton-strong)" }} />
        <div style={{ position: "absolute", left: 8, top: 16, width: Math.max(16, w * 0.32), height: 4, borderRadius: 2, background: "var(--skeleton-strong)" }} />
        <div style={{ position: "absolute", left: 8, top: 27, width: Math.max(20, w * 0.6), height: 3, borderRadius: 2, background: "var(--skeleton)" }} />
        {handles}
      </div>
      <div style={{ position: "absolute", left: 16, top: 16 + h + 9 }}>
        <Chip red>{W + " \xd7 " + H}</Chip>
      </div>
      <div style={{ position: "absolute", left: 16 + w + 1, top: 0, bottom: 0, width: 0, borderLeft: "1px dashed " + RED, opacity: 0.35 }} />
      <Cursor x={16 + w - 1} y={16 + h - 1} agent="krait" name="Krait" />
    </>
  );
}

function Type({ t, live }: { t: number; live: boolean }) {
  const tl = V.patches.map(s => ({ s, type: s.length * 0.055, hold: 1.5, erase: s.length * 0.022, gap: 0.35 }));
  const total = tl.reduce((n, x) => n + x.type + x.hold + x.erase + x.gap, 0);
  let r = t % total;
  let text = "";
  let blink = false;
  for (const x of tl) {
    const d = x.type + x.hold + x.erase + x.gap;
    if (r < d) {
      if (r < x.type) text = x.s.slice(0, Math.ceil((r / x.type) * x.s.length));
      else if (r < x.type + x.hold) { text = x.s; blink = true; }
      else if (r < x.type + x.hold + x.erase) text = x.s.slice(0, Math.floor((1 - (r - x.type - x.hold) / x.erase) * x.s.length));
      else { text = ""; blink = true; }
      break;
    }
    r -= d;
  }
  const caretOn = !blink || Math.sin(t * 9) > -0.2 || !live;
  return (
    <>
      <div style={{ position: "absolute", left: 16, top: 16, right: 30, font: "500 14px/1.4 " + MONO, color: "var(--text-primary)", overflowWrap: "anywhere" }}>
        {text}
        <span style={{ position: "relative", display: "inline-block", width: 2, height: 18, marginLeft: 1, verticalAlign: "-3px", background: "var(--agent-vanguard)", opacity: caretOn ? 1 : 0 }}>
          <span style={{ position: "absolute", left: 6, top: 14, background: "var(--agent-vanguard)", color: "var(--ink-on-agent)", font: "700 9px " + SANS, padding: "1px 6px", borderRadius: 7, whiteSpace: "nowrap", letterSpacing: 0 }}>Vanguard</span>
        </span>
      </div>
      <div style={{ position: "absolute", left: 16, bottom: 26, width: 160, height: 5, borderRadius: 3, background: "var(--skeleton)" }} />
      <div style={{ position: "absolute", left: 16, bottom: 15, width: 120, height: 5, borderRadius: 3, background: "var(--skeleton)" }} />
    </>
  );
}

function Ship({ t }: { t: number }) {
  const s = t % 5.2;
  const bx = 16, by = 22, bw = 116, bh = 30;
  const target = { x: bx + bw * 0.55, y: by + bh * 0.55 };
  const inP = ease(seg(s, 0.2, 1.4));
  const outP = ease(seg(s, 4.4, 5.1));
  let cx = lerp(210, target.x, inP);
  let cy = lerp(118, target.y, inP);
  if (s > 4.4) { cx = lerp(target.x, 200, outP); cy = lerp(target.y, 112, outP); }
  const pressed = s > 1.4 && s < 1.65;
  const publishing = s >= 1.6 && s < 3.1;
  const published = s >= 3.1;
  const prog = seg(s, 1.6, 3.1);
  const label = published ? V.signed : publishing ? V.signing : V.sign;
  return (
    <>
      <div style={{ position: "absolute", left: bx, top: by, width: bw, height: bh, borderRadius: 7, background: published ? BLUE : "var(--text-primary)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: published ? "var(--on-blue)" : "var(--bg-canvas)", opacity: publishing ? 0.8 : 1, font: "600 12px " + SANS, transform: "scale(" + (pressed ? 0.93 : 1) + ")", transition: "transform 0.12s, background 0.25s", boxShadow: pressed ? "none" : "0 2px 10px var(--shadow)" }}>
        {published ? (
          <svg width="11" height="11" viewBox="0 0 12 12"><path d="M2 6.5L5 9L10 3" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        ) : null}
        {label}
      </div>
      <div style={{ position: "absolute", left: 16, top: 66, display: "flex", alignItems: "center", gap: 7, font: "500 11px " + MONO, color: published ? "var(--text-primary)" : "var(--text-muted)", whiteSpace: "nowrap" }}>
        <span style={{ width: 7, height: 7, borderRadius: 4, background: published ? BLUE : publishing ? "var(--agent-drift)" : "var(--skeleton)", boxShadow: published ? "0 0 8px " + BLUE : "none" }} />
        {published ? V.attested : publishing ? V.attacking : V.draft}
      </div>
      <div style={{ position: "absolute", left: 16, top: 88, width: 150, height: 3, borderRadius: 2, background: "var(--bg-elevated)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: (published ? 1 : prog) * 100 + "%", background: published ? BLUE : "var(--agent-krait)" }} />
      </div>
      <Cursor x={cx} y={cy} agent="seal" name="Seal" scale={pressed ? 0.88 : 1} />
    </>
  );
}

export default function StepVisual({ mode = "type" }: { mode?: string }) {
  const [t, ref] = useClock(true, STATIC_T[mode] || 1);
  return (
    <div ref={ref} aria-hidden="true" style={{ position: "relative", width: "100%", height: "100%", minHeight: 120, overflow: "hidden" }}>
      {mode === "scan" ? <Scan t={t} /> : mode === "frame" ? <Frame t={t} /> : mode === "ship" ? <Ship t={t} /> : <Type t={t} live />}
    </div>
  );
}
