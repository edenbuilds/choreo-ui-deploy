/* Shared scene-graph helpers used by every choreography cartridge. */
/* eslint-disable @typescript-eslint/no-explicit-any */

export const TEXT_SEL = '[data-framer-component-type="RichTextContainer"]';
export const BUILD_LINE = 0.86;
export const REPLAY_NAME = "replay button";

export const HIDE_CSS = [
  '[data-swarm="frame"]{background-color:transparent!important;background-image:none!important;box-shadow:none!important;border-color:transparent!important;outline-color:transparent!important}',
  '[data-swarm="frame"]::before,[data-swarm="frame"]::after{opacity:0!important}',
  '[data-swarm="frame"]>[data-framer-background-image-wrapper]{opacity:0!important}',
  '[data-swarm="leaf"],[data-swarm="text"]{clip-path:inset(0 100% 100% 0)!important}',
].join("");

export type Job = {
  el: HTMLElement;
  kind: "frame" | "leaf" | "text";
  parent: Job | null;
  state: 0 | 1 | 2;
  chars: number;
  name: string;
  ox?: number;
  oy?: number;
  rot?: number;
  tStart?: number;
  tEnd?: number;
  depth?: number;
};

export type Palette = {
  acc: string;
  onAcc: string;
  line: string;
  rulerBg: string;
  tick: string;
  tickText: string;
  edge: string;
  handle: string;
  stroke: string;
  ink: string;
  shadow: string;
  mono: string;
  sans: string;
  text: string;
  muted: string;
  colors: string[];
};

export function readPalette(agentKeys: string[]): Palette {
  const cs = getComputedStyle(document.documentElement);
  const g = (n: string) => cs.getPropertyValue(n).trim();
  return {
    acc: g("--token-F8aq5h09h") || "#10B981",
    onAcc: g("--on-blue") || "#04130D",
    line: g("--token-qbWelPRm9") || "#F43F5E",
    rulerBg: g("--token-A5w84IG3s") || "#0E1117",
    tick: g("--skeleton") || "#2A3344",
    tickText: g("--token-XDpMy4ig5") || "#7A8597",
    edge: g("--token-fqjRVkZi3") || "#1E2532",
    handle: g("--handle-fill") || "#FFFFFF",
    stroke: g("--cursor-stroke") || "#FFFFFF",
    ink: g("--ink-on-agent") || "#090B0E",
    shadow: g("--shadow") || "#00000073",
    mono: g("--font-jetbrains") || "monospace",
    sans: g("--font-inter") || "sans-serif",
    text: g("--token-zIbAWevhZ") || "#F1F5F9",
    muted: g("--token-XDpMy4ig5") || "#7A8597",
    colors: agentKeys.map((k) => g("--agent-" + k) || "#10B981"),
  };
}

export function visible(el: Element) {
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return false;
  const cs = getComputedStyle(el);
  return cs.display !== "none" && cs.visibility !== "hidden";
}

export function collectJobs(self: Element | null): Job[] {
  const main = document.getElementById("main") || document.body;
  const list = Array.from(main.querySelectorAll("[data-framer-name], " + TEXT_SEL));
  const map = new Map<Element, Job>();
  const out: Job[] = [];
  for (const el of list) {
    if (!(el instanceof HTMLElement)) continue;
    if (self && (self.contains(el) || el.contains(self))) continue;
    const host = el.parentElement ? el.parentElement.closest(TEXT_SEL) : null;
    if (host) continue;
    if (!visible(el)) continue;
    const job: Job = {
      el,
      kind: el.matches(TEXT_SEL) ? "text" : "leaf",
      parent: null,
      state: 0,
      chars: (el.textContent || "").length,
      name: el.getAttribute("data-framer-name") || "RichText",
    };
    map.set(el, job);
    out.push(job);
  }
  for (const j of out) {
    let par = j.el.parentElement;
    while (par && !map.has(par)) par = par.parentElement;
    if (par) {
      const pj = map.get(par)!;
      j.parent = pj;
      if (pj.kind === "leaf") pj.kind = "frame";
    }
  }
  // Depth for isometric / timeline ordering
  for (const j of out) {
    let d = 0;
    let p = j.parent;
    while (p) {
      d++;
      p = p.parent;
    }
    j.depth = d;
  }
  return out;
}

export function restoreJob(j: Job) {
  j.el.removeAttribute("data-swarm");
  j.el.style.clipPath = "";
  j.el.style.transform = "";
  j.el.style.opacity = "";
  j.el.style.height = "";
  j.el.style.overflow = "";
  j.el.style.filter = "";
  j.el.style.perspective = "";
  j.el.style.transformStyle = "";
}

export function springStep(a: { x: number; y: number; vx: number; vy: number; tx: number; ty: number; k: number }, dt: number) {
  const K = Math.min(1200, a.k);
  const D = 2 * Math.sqrt(K) * 0.92;
  const h = dt / 2;
  for (let s = 0; s < 2; s++) {
    a.vx += ((a.tx - a.x) * K - a.vx * D) * h;
    a.vy += ((a.ty - a.y) * K - a.vy * D) * h;
    a.x += a.vx * h;
    a.y += a.vy * h;
  }
}

export function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const q = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + q, y);
  ctx.arcTo(x + w, y, x + w, y + h, q);
  ctx.arcTo(x + w, y + h, x, y + h, q);
  ctx.arcTo(x, y + h, x, y, q);
  ctx.arcTo(x, y, x + w, y, q);
  ctx.closePath();
}

export function hash01(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function toHexPreview(text: string, progress: number) {
  const full = Array.from(text)
    .slice(0, 48)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
    .join(" ");
  const words = text;
  if (progress < 0.55) return "0x" + full.slice(0, Math.max(4, Math.floor(full.length * (progress / 0.55))));
  const t = (progress - 0.55) / 0.45;
  const n = Math.floor(words.length * t);
  return words.slice(0, n);
}

declare global {
  interface Window {
    __swarm?: {
      agents: any[];
      phase: string;
      touring: boolean;
      lineY: number;
      [k: string]: any;
    };
  }
}
