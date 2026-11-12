"use client";
// Port of the Framer module LiveVisual (A2qbDFZGK6PU5pTplopX/eE4Rv1dRKwZXx2uh0jRf).
// Counter.mjs and ReleaseVisual.mjs on the reference site are this module in "counter" and "release" mode.
// Geometry, timelines and easing are the original ones. Colors use CSS variables for both themes.
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { copy } from "@/copy";
import { Chip, Cursor, MONO, SANS, clamp, ease, lerp, seg, useClock } from "./shared";

const BLUE = "var(--accent-blue-team)";
const W = copy.workspace;
const O = copy.output.visual;

function Handles({ w, h }: { w: number; h: number }) {
  return (
    <>
      {[[0, 0], [w, 0], [0, h], [w, h]].map((c, i) => (
        <div key={i} style={{ position: "absolute", left: c[0] - 3.5, top: c[1] - 3.5, width: 7, height: 7, background: "var(--handle-fill)", border: "1px solid " + BLUE, boxSizing: "border-box" }} />
      ))}
    </>
  );
}

const bar = (w: number, h: number, bg: string): CSSProperties => ({ width: w, height: h, borderRadius: 3, background: bg, flexShrink: 0 });
const panel: CSSProperties = { borderRadius: 10, background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxSizing: "border-box", flexShrink: 0 };

/* ---------------- editor ---------------- */
function Editor({ t }: { t: number }) {
  const LOG = W.feed;
  const step = Math.floor(t / 2.4);
  const local = (t % 2.4) / 2.4;
  const shift = ease(seg(local, 0.75, 1));
  const rows = [0, 1, 2, 3, 4].map(i => LOG[(step + i) % LOG.length]);
  const caretOn = Math.sin(t * 6) > -0.2;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, width: "100%", height: "100%" }}>
      <div style={{ ...panel, width: 460, height: 290, padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={bar(12, 12, "var(--skeleton)")} />
          <div style={{ display: "flex", gap: 6 }}>
            <div style={bar(22, 5, "var(--skeleton)")} />
            <div style={bar(22, 5, "var(--skeleton)")} />
            <div style={bar(22, 5, "var(--skeleton)")} />
          </div>
        </div>
        <div style={{ position: "relative", flex: 1, borderRadius: 6, border: "1px solid " + BLUE, background: "var(--tint-blue)", boxSizing: "border-box", padding: 20, display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
          <div style={{ position: "absolute", right: 8, top: 8 }}><Chip>{W.canvasChip}</Chip></div>
          <div style={bar(230, 13, "var(--skeleton-strong)")} />
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={bar(160, 13, "var(--skeleton-strong)")} />
            <div style={{ width: 2, height: 17, background: "var(--agent-vanguard)", opacity: caretOn ? 1 : 0 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, paddingTop: 6 }}>
            <div style={bar(260, 5, "var(--skeleton)")} />
            <div style={bar(236, 5, "var(--skeleton)")} />
            <div style={bar(190, 5, "var(--skeleton)")} />
          </div>
          <div style={{ display: "flex", gap: 6, paddingTop: 6 }}>
            <div style={bar(56, 16, "var(--text-primary)")} />
            <div style={{ ...bar(56, 16, "transparent"), border: "1px solid var(--skeleton)", boxSizing: "border-box" }} />
          </div>
        </div>
      </div>
      <div style={{ ...panel, width: 460, padding: "12px 14px" }}>
        <div style={{ height: 79, overflow: "hidden" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, transform: "translateY(" + -shift * 22 + "px)" }}>
            {rows.map((r, i) => (
              <div key={step + "-" + i} style={{ display: "flex", alignItems: "center", gap: 8, height: 14, font: "500 11px " + MONO, whiteSpace: "nowrap", opacity: i === 0 ? 1 - shift : i === 4 ? shift : 1 }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: "var(--agent-" + r[0] + ")", flexShrink: 0 }} />
                <span style={{ color: "var(--text-primary)" }}>{r[1]}</span>
                <span style={{ color: "var(--text-secondary)" }}>{r[2]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- breakpoints: three isolated environments ---------------- */
function Breakpoints({ t }: { t: number }) {
  const active = Math.floor((t % 6) / 2);
  const local = (t % 2) / 2;
  const devs = [{ w: 260, h: 130, l: O.envs[0] }, { w: 120, h: 130, l: O.envs[1] }, { w: 64, h: 118, l: O.envs[2] }];
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 18, width: "100%", height: "100%", paddingBottom: 18, boxSizing: "border-box" }}>
      {devs.map((d, i) => {
        const on = i === active;
        const g = on ? ease(seg(local, 0.08, 0.6)) : 1;
        return (
          <div key={i} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ position: "relative", width: d.w, height: d.h, borderRadius: 6, background: "var(--bg-surface)", border: "1px solid " + (on ? BLUE : "var(--border-subtle)"), boxShadow: on ? "0 0 0 4px var(--ring-blue)" : "none", boxSizing: "border-box", padding: 8, overflow: "hidden", transition: "border-color 0.3s, box-shadow 0.3s" }}>
              <div style={{ width: "40%", height: 6, borderRadius: 3, background: "var(--skeleton-strong)", marginBottom: 5 }} />
              <div style={{ width: (on ? 70 * g : 70) + "%", height: 6, borderRadius: 3, background: "var(--skeleton-strong)", marginBottom: 5 }} />
              <div style={{ width: "85%", height: 3, borderRadius: 2, background: "var(--skeleton)", marginBottom: 6 }} />
              <div style={{ width: (on ? 100 * g : 100) + "%", height: d.h - 52, borderRadius: 4, border: "1px solid " + (on ? BLUE : "var(--border-subtle)"), background: on ? "var(--tint-blue)" : "transparent", boxSizing: "border-box" }} />
            </div>
            <span style={{ font: "500 11px " + MONO, color: on ? "var(--text-primary)" : "var(--text-muted)", transition: "color 0.3s", whiteSpace: "nowrap" }}>{d.l}</span>
            {on ? <Cursor x={d.w - 18 + 4 * Math.sin(t * 4)} y={d.h - 30} agent="fuzz" name="Fuzz" /> : null}
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- cms: the exploit ledger ---------------- */
function Cms({ t }: { t: number }) {
  const k = Math.floor(t / 4);
  const local = (t % 4) / 4;
  const slide = 1 - ease(seg(local, 0, 0.12));
  const p = seg(local, 0.12, 0.45);
  const cut = (s: string) => s.slice(0, Math.ceil(s.length * p));
  const at = (j: number) => (k - j + 400) % 4;
  const rows = [0, 1, 2].map(j => ({
    title: j === 0 ? cut(O.vectors[k % 4]) : O.vectors[at(j)],
    slug: j === 0 ? cut(O.files[k % 4]) : O.files[at(j)],
    date: j === 0 ? (local > 0.45 ? O.commits[k % 4] : "") : O.commits[at(j)],
  }));
  const cell = (txt: string, color: string, key: string) => (
    <span key={key} style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color }}>{txt}</span>
  );
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", font: "500 11px " + MONO, overflow: "hidden" }}>
      <div style={{ display: "flex", gap: 10, padding: "9px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
        {O.ledgerHead.map(hd => cell(hd, "var(--text-muted)", hd))}
      </div>
      <div style={{ height: 96, overflow: "hidden" }}>
        <div style={{ transform: "translateY(" + -32 * slide + "px)" }}>
          {rows.map((r, j) => (
            <div key={j} style={{ position: "relative", display: "flex", gap: 10, padding: "9px 16px", height: 32, boxSizing: "border-box", borderBottom: j < 2 ? "1px solid var(--border-subtle)" : "none" }}>
              {j === 0 ? <span style={{ position: "absolute", inset: 0, background: "var(--tint-blue)", opacity: 1 - seg(local, 0.6, 0.95) }} /> : null}
              {cell(r.title + (j === 0 && local < 0.45 && Math.sin(t * 10) > 0 ? "|" : ""), "var(--text-primary)", "a")}
              {cell(r.slug, "var(--text-secondary)", "b")}
              {cell(r.date, "var(--text-secondary)", "c")}
              {j === 0 && local > 0.45 ? <span style={{ position: "absolute", right: 12, top: 8, opacity: 1 - seg(local, 0.85, 1) }}><Chip>{O.patched}</Chip></span> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- components: guardrail states ---------------- */
function Components({ t }: { t: number }) {
  const s = t % 4;
  const hover = s > 1 && s < 3.1;
  const pressed = s > 1.9 && s < 2.25;
  const state = pressed ? 2 : hover ? 1 : 0;
  const cx = s < 1 ? lerp(190, 84, ease(seg(s, 0.2, 1))) : s > 3.1 ? lerp(84, 190, ease(seg(s, 3.1, 3.9))) : 84;
  const cy = s < 1 ? lerp(70, 22, ease(seg(s, 0.2, 1))) : s > 3.1 ? lerp(22, 70, ease(seg(s, 3.1, 3.9))) : 22;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
      <div style={{ position: "relative", width: 148, height: 38 }}>
        <div style={{ width: 148, height: 38, borderRadius: 8, background: "var(--text-primary)", color: "var(--bg-canvas)", opacity: hover ? 1 : 0.9, display: "flex", alignItems: "center", justifyContent: "center", font: "500 12px " + MONO, transform: "scale(" + (pressed ? 0.95 : hover ? 1.03 : 1) + ")", boxShadow: hover ? "0 6px 20px var(--shadow)" : "none", transition: "all 0.18s" }}>{O.route}</div>
        <div style={{ position: "absolute", left: -6, top: -6, right: -6, bottom: -6, border: "1px dashed " + BLUE, borderRadius: 4, opacity: 0.6 }} />
        <Cursor x={cx} y={cy} agent="ward" name="Ward" scale={pressed ? 0.88 : 1} />
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {O.modes.map((v, i) => (
          <span key={v} style={{ font: "600 10px " + MONO, padding: "3px 8px", borderRadius: 4, background: state === i ? BLUE : "var(--bg-elevated)", color: state === i ? "var(--on-blue)" : "var(--text-muted)", transition: "all 0.2s" }}>{v}</span>
        ))}
      </div>
    </div>
  );
}

/* ---------------- tokens: one policy edit, every route inherits ---------------- */
const ACCENTS = ["vanguard", "ward", "seal", "trace"];
function Tokens({ t }: { t: number }) {
  const idx = Math.floor(t / 1.8) % 4;
  const local = t % 1.8;
  const acc = "var(--agent-" + ACCENTS[idx] + ")";
  const rows: [string, string, string][] = [
    [O.policies[0][0], O.policies[0][1], "var(--text-primary)"],
    [O.policies[1][0], O.policies[1][1], "var(--text-secondary)"],
    [O.policies[2][0], O.policies[2][1], "var(--text-muted)"],
    [O.corsLabel, O.cors[idx], acc],
  ];
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", gap: 16, padding: "0 18px", boxSizing: "border-box", font: "500 11px " + MONO }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map(([n, v, c], i) => (
          <div key={n} style={{ position: "relative", display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ width: 15, height: 15, borderRadius: 4, background: c, border: "1px solid var(--skeleton)", transition: "background 0.4s", flexShrink: 0 }} />
            <span style={{ color: "var(--text-primary)", flex: 1, whiteSpace: "nowrap" }}>{n}</span>
            <span style={{ color: i === 3 ? "var(--text-primary)" : "var(--text-muted)", whiteSpace: "nowrap" }}>{v}</span>
            {i === 3 ? <Cursor x={6} y={7} agent="seal" name="Seal" scale={local < 0.18 ? 0.86 : 1} /> : null}
          </div>
        ))}
      </div>
      <div style={{ position: "relative", width: 104, height: 104, borderRadius: 8, background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", padding: 10, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
        <div style={{ width: "70%", height: 6, borderRadius: 3, background: "var(--skeleton-strong)" }} />
        <div style={{ width: "90%", height: 3, borderRadius: 2, background: "var(--skeleton)" }} />
        <div style={{ width: "60%", height: 3, borderRadius: 2, background: "var(--skeleton)" }} />
        <div style={{ marginTop: "auto", height: 18, borderRadius: 4, background: acc, transition: "background 0.4s" }} />
        <div style={{ position: "absolute", left: 10, top: 34, width: 8, height: 8, borderRadius: 4, background: acc, transition: "background 0.4s" }} />
      </div>
      <div style={{ position: "absolute", left: 18, bottom: 10, opacity: local < 1.1 ? 1 - seg(local, 0.8, 1.1) : 0 }}>
        <Chip>{O.inherited}</Chip>
      </div>
    </div>
  );
}

/* ---------------- seo: the compliance proof ---------------- */
function Seo({ t }: { t: number }) {
  const k = Math.floor(t / 4) % 2;
  const local = (t % 4) / 4;
  const [url, title] = O.proofs[k];
  const typed = title.slice(0, Math.ceil(title.length * seg(local, 0.05, 0.4)));
  const d1 = seg(local, 0.35, 0.6);
  const d2 = seg(local, 0.5, 0.75);
  return (
    <div style={{ width: "100%", height: "100%", padding: "18px 20px", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
      <span style={{ font: "500 11px " + MONO, color: "var(--accent-blue-text)" }}>{url}</span>
      <span style={{ font: "500 16px " + SANS, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
        {typed}
        <span style={{ opacity: local < 0.4 && Math.sin(t * 10) > 0 ? 1 : 0, color: "var(--agent-seal)" }}>|</span>
      </span>
      <div style={{ width: 100 * d1 + "%", height: 5, borderRadius: 3, background: "var(--skeleton)" }} />
      <div style={{ width: 80 * d2 + "%", height: 5, borderRadius: 3, background: "var(--skeleton)" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 8 }}>
        {/* The original sweeps a gradient here. DESIGN.md forbids gradients, so a solid bar sweeps instead. */}
        <div style={{ position: "relative", width: 54, height: 30, borderRadius: 4, border: "1px solid " + BLUE, background: "var(--tint-blue)", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, bottom: 0, width: 14, left: ((t * 0.4) % 1) * 68 - 14, background: "var(--ring-blue)" }} />
        </div>
        <span style={{ font: "500 11px " + MONO, color: "var(--text-muted)" }}>{O.signedNote + " \xb7 " + typed.length + " bytes"}</span>
      </div>
      <Cursor x={22 + Math.min(typed.length, 30) * 7.2} y={60} agent="seal" name="Seal" opacity={local < 0.45 ? 1 : 1 - seg(local, 0.45, 0.55)} />
    </div>
  );
}

/* ---------------- meter ---------------- */
function Meter({ t, value, unit, color, decimals, steady }: { t: number; value: number; unit: string; color: string; decimals: number; steady?: boolean }) {
  // steady: a figure such as "100% PoC replay" must not drift. The bars still move.
  const v = steady ? value : value * (1 + 0.06 * Math.sin(t * 1.3 + value) + 0.02 * Math.sin(t * 4.1));
  const txt = v >= 1e3 ? (v / 1e3).toFixed(1) + "k" : v.toFixed(decimals);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, width: "100%", height: "100%", font: "500 11px " + MONO, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 12 }}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
          <span key={i} style={{ width: 3, borderRadius: 1, background: color, opacity: 0.35 + 0.65 * (i / 7), height: 3 + 9 * (0.5 + 0.5 * Math.sin(t * 3 + i * 0.9 + value)) }} />
        ))}
      </div>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{txt + (unit.startsWith("%") || unit.startsWith("ms") ? "" : " ") + unit}</span>
    </div>
  );
}

/* ---------------- release: the 404 visual ---------------- */
const RING = ["krait", "vanguard", "trace", "drift", "seal", "fuzz"];
function ReleaseView({ t }: { t: number }) {
  const s = t % 4;
  const op = s < 0.6 ? 1 : s < 1.4 ? 1 - seg(s, 0.6, 1.4) : s > 3.3 ? seg(s, 3.3, 3.9) : 0;
  const chip = s > 0.5 && s < 2.2 ? 1 - seg(s, 1.8, 2.2) : 0;
  const cx = 210, cy = 74, R = 30;
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div style={{ position: "absolute", left: 20, top: 34, width: 120, height: 70, border: "1px solid " + BLUE, background: "var(--tint-blue)", boxSizing: "border-box", opacity: op }}>
        <Handles w={120} h={70} />
      </div>
      <div style={{ position: "absolute", left: 20, top: 34, width: 120, height: 70, borderRadius: 4, background: "var(--bg-elevated)", display: "flex", flexDirection: "column", gap: 6, padding: 12, boxSizing: "border-box" }}>
        <div style={{ width: 70, height: 6, borderRadius: 3, background: "var(--skeleton-strong)" }} />
        <div style={{ width: 90, height: 4, borderRadius: 2, background: "var(--skeleton)" }} />
        <div style={{ width: 60, height: 4, borderRadius: 2, background: "var(--skeleton)" }} />
      </div>
      <div style={{ position: "absolute", left: 20, top: 112, opacity: chip }}><Chip>{copy.notFound.released}</Chip></div>
      {RING.map((c, i) => {
        const a = t * 0.9 + (i / RING.length) * Math.PI * 2;
        return <Cursor key={i} x={cx + Math.cos(a) * R} y={cy + Math.sin(a) * R} agent={c} />;
      })}
    </div>
  );
}

function CounterView({ p, value, from, decimals, unit, fs }: { p: number; value: number; from: number; decimals: number; unit: string; fs: number }) {
  const e = 1 - Math.pow(1 - p, 3);
  const v = from + (value - from) * e;
  return (
    <div style={{ display: "flex", alignItems: "center", width: "100%", height: "100%", font: "600 " + fs + "px/1 " + SANS, letterSpacing: "-0.05em", color: "var(--text-primary)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
      {v.toFixed(decimals) + unit}
    </div>
  );
}

export type LiveVisualProps = { mode?: string; value?: number; unit?: string; color?: string; from?: number; decimals?: number; steady?: boolean; prefix?: string };

export default function LiveVisual(props: LiveVisualProps) {
  const mode = props.mode || "editor";
  const [t, ref] = useClock(true, mode === "editor" ? 7.5 : 2.6);
  const startRef = useRef(-1);
  const [box, setBox] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(es => { const r = es[0].contentRect; setBox({ w: r.width, h: r.height }); });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  const [reduced, setReduced] = useState(false);
  useEffect(() => { setReduced(!!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); }, []);
  let countP = 0;
  if (mode === "counter") {
    // The count starts when SwarmBuild has built this layer and it is on screen. Unchanged from the original.
    const el = ref.current;
    if (startRef.current < 0 && el && !el.closest("[data-swarm]")) {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.92 && r.bottom > 0) startRef.current = t;
    }
    countP = reduced ? 1 : startRef.current < 0 ? 0 : clamp((t - startRef.current) / 1.8);
  }
  const value = props.value ?? 100;
  const unit = (props.prefix ?? "") + "|" + (props.unit ?? "");
  let body = null;
  if (mode === "editor") body = <Editor t={t} />;
  else if (mode === "breakpoints") body = <Breakpoints t={t} />;
  else if (mode === "cms") body = <Cms t={t} />;
  else if (mode === "components") body = <Components t={t} />;
  else if (mode === "tokens") body = <Tokens t={t} />;
  else if (mode === "seo") body = <Seo t={t} />;
  else if (mode === "release") body = <ReleaseView t={t} />;
  else if (mode === "counter") {
    const len = (value.toFixed(props.decimals ?? 0) + unit).length - 1;
    const fs = box.w > 0 ? Math.max(28, Math.min(56, box.w / (len * 0.56))) : 56;
    body = (
      <div style={{ display: "flex", alignItems: "center", width: "100%", height: "100%" }}>
        {props.prefix ? <span style={{ font: "600 " + fs + "px/1 " + SANS, letterSpacing: "-0.05em", color: "var(--text-primary)" }}>{props.prefix}</span> : null}
        <CounterView fs={fs} p={countP} value={value} from={props.from ?? 0} decimals={props.decimals ?? 0} unit={props.unit ?? ""} />
      </div>
    );
  } else body = <Meter t={t} value={value} unit={props.unit ?? ""} color={props.color || BLUE} decimals={props.decimals ?? 0} steady={props.steady} />;
  const NAT: Record<string, number> = { editor: 490, breakpoints: 520, tokens: 300, seo: 300, release: 280 };
  const nat = NAT[mode];
  const s = nat && box.w > 0 && box.w < nat ? box.w / nat : 1;
  const inner = s < 1 ? (
    <div style={{ position: "absolute", left: "50%", top: "50%", width: nat, height: box.h / s, transform: "translate(-50%, -50%) scale(" + s + ")", transformOrigin: "50% 50%" }}>{body}</div>
  ) : body;
  return (
    <div ref={ref} aria-hidden="true" style={{ position: "relative", width: "100%", height: "100%", overflow: mode === "meter" ? "visible" : "hidden" }}>
      {inner}
    </div>
  );
}
