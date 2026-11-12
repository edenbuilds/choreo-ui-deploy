// Gate 5: run against the production build.
// npm run build && npm run start -- -p 3077 && node tests/verify.mjs
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE || "http://localhost:3077";
const SHOTS = process.env.SHOTS || "tests/shots";
mkdirSync(SHOTS, { recursive: true });

const ROUTES = [
  ["/demos/swarm", "swarm"],
  ["/demos/signal", "signal"],
  ["/demos/xray", "xray"],
  ["/demos/magnetic", "magnetic"],
  ["/demos/timeline", "timeline"],
  ["/demos/isometric", "isometric"],
  ["/demos/stream", "stream"],
];

const VIEWS = [
  ["desktop", 1440, 900],
  ["tablet", 810, 1080],
  ["phone", 390, 844],
];

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log((ok ? "PASS " : "FAIL ") + name + (detail ? "  " + detail : ""));
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch();

// Hub smoke (both themes, desktop + phone) — screenshots + overflow + theme
for (const [view, width, height] of [
  ["desktop", 1440, 900],
  ["phone", 390, 844],
]) {
  for (const theme of ["dark", "light"]) {
    const tag = `hub/${view}/${theme}`;
    const ctx = await browser.newContext({ viewport: { width, height } });
    await ctx.addInitScript((t) => {
      try {
        localStorage.setItem("theme", t);
      } catch {}
    }, theme);
    const page = await ctx.newPage();
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.waitForFunction(() => window.__swarm && window.__swarm.phase === "done");
    const cards = await page.locator(".hub-card").count();
    check(tag + " renders 7 engine cards", cards === 7, "cards=" + cards);
    const over = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      iw: window.innerWidth,
    }));
    check(tag + " no horizontal overflow", over.sw <= over.iw, JSON.stringify(over));
    await page.screenshot({ path: `${SHOTS}/hub-${view}-${theme}.png` });
    await ctx.close();
  }
}

for (const [path, engine] of ROUTES) {
  for (const [view, width, height] of VIEWS) {
    for (const theme of ["dark", "light"]) {
      const tag = `${engine}/${view}/${theme}`;
      const ctx = await browser.newContext({ viewport: { width, height } });
      await ctx.addInitScript((t) => {
        try {
          localStorage.setItem("theme", t);
        } catch {}
      }, theme);
      const page = await ctx.newPage();
      const noise = [];
      page.on("console", (m) => {
        if (["error", "warning"].includes(m.type())) noise.push(m.type() + ": " + m.text());
      });
      page.on("pageerror", (e) => noise.push("pageerror: " + e.message));

      await page.goto(BASE + path, { waitUntil: "networkidle" });
      await page.waitForFunction(() => window.__swarm && window.__swarm.phase === "build", null, { timeout: 15000 });

      // 1. Unbuilt layers below the build line are hidden, not dimmed.
      await sleep(1200);
      const unbuilt = await page.evaluate(() => {
        const lineY = window.__swarm.lineY;
        let below = 0;
        const bad = [];
        for (const el of document.querySelectorAll("#main [data-framer-name], #main [data-framer-component-type]")) {
          const r = el.getBoundingClientRect();
          if (r.top < lineY || r.width < 2) continue;
          if (getComputedStyle(el).position === "fixed") continue;
          below++;
          const kind = el.getAttribute("data-swarm");
          const cs = getComputedStyle(el);
          const hidden =
            kind === "frame"
              ? cs.backgroundColor === "rgba(0, 0, 0, 0)"
              : (kind === "leaf" || kind === "text") && cs.clipPath.replace(/\s/g, "") === "inset(0px100%100%0px)";
          if (!hidden || Math.abs(parseFloat(cs.opacity) - 0.14) < 0.01) {
            bad.push((el.getAttribute("data-framer-name") || el.tagName) + ":" + kind + ":" + cs.clipPath);
          }
        }
        return {
          below,
          bad: bad.slice(0, 5),
          badN: bad.length,
          scrollY: window.scrollY,
          hud: document.getElementById("hud-count")?.textContent,
          phase: window.__swarm.phase,
        };
      });
      check(
        tag + " unbuilt layers hidden before scroll",
        unbuilt.scrollY === 0 && unbuilt.below > 10 && unbuilt.badN === 0,
        JSON.stringify(unbuilt),
      );

      if (view === "desktop" && theme === "dark") {
        await page.screenshot({ path: `${SHOTS}/${engine}-desktop-dark-top.png` });
      }

      // 2. Pointer response: idle agents flock near stationary pointer.
      if (view === "desktop") {
        await page.mouse.move(600, 400);
        await sleep(1500);
        const flock = await page.evaluate(() => {
          const a = (window.__swarm.agents || []).filter((x) => !x.job);
          const d = a.map((x) => Math.hypot(x.x - 600, x.y - 400));
          return {
            idle: a.length,
            mean: d.length ? d.reduce((s, v) => s + v, 0) / d.length : 999,
            max: d.length ? Math.max(...d) : 999,
          };
        });
        check(
          tag + " agents respond to pointer (ring ~64)",
          flock.idle >= 4 && Math.abs(flock.mean - 64) < 30 && flock.max < 150,
          JSON.stringify(flock),
        );
      }

      // 3. Scroll builds layers; Esc / skip completes.
      const h0 = Number(unbuilt.hud) || 0;
      const total = await page.evaluate(() => document.documentElement.scrollHeight);
      let mid = h0;
      let sawBusy = false;
      for (let y = 0; y < total; y += Math.round(height * 0.65)) {
        await page.evaluate((v) => window.scrollTo({ top: v, behavior: "instant" }), y);
        await sleep(400);
        const s = await page.evaluate(() => ({
          n: Number(document.getElementById("hud-count")?.textContent),
          busy: (window.__swarm.agents || []).some((a) => a.job),
        }));
        if (s.n > mid) mid = s.n;
        if (s.busy) sawBusy = true;
      }
      await page.waitForFunction(() => document.getElementById("swarm-hud")?.dataset.phase === "done", null, {
        timeout: 20000,
      }).catch(() => {});

      // If still not done, Esc to finish.
      const phaseBeforeEsc = await page.evaluate(() => document.getElementById("swarm-hud")?.dataset.phase);
      if (phaseBeforeEsc !== "done") {
        await page.keyboard.press("Escape");
        await sleep(400);
      }

      const end = await page.evaluate(() => ({
        left: document.querySelectorAll("[data-swarm]").length,
        phase: document.getElementById("swarm-hud")?.dataset.phase,
        clipped: [...document.querySelectorAll("#main [data-framer-name]")].filter((e) => e.style.clipPath).length,
        touring: window.__swarm?.touring,
      }));
      check(
        tag + " full build after scroll/skip",
        end.left === 0 && end.clipped === 0 && (end.phase === "done" || end.left === 0),
        JSON.stringify({ h0, mid, sawBusy, ...end }),
      );

      // Explicit Esc completes (replay then esc on desktop dark only once per engine)
      if (view === "desktop" && theme === "dark") {
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
        await sleep(400);
        const replay = page.locator("#replay-btn");
        if ((await replay.count()) > 0) {
          await replay.click();
          await sleep(500);
          await page.keyboard.press("Escape");
          await sleep(300);
          const esc = await page.evaluate(() => ({
            left: document.querySelectorAll("[data-swarm]").length,
            touring: window.__swarm?.touring,
          }));
          check(tag + " Esc completes the build", esc.left === 0 && !esc.touring, JSON.stringify(esc));
        }
        await page.screenshot({ path: `${SHOTS}/${engine}-desktop-dark-built.png` });
      }

      // 4. No horizontal overflow
      const over = await page.evaluate(() => ({
        sw: document.documentElement.scrollWidth,
        iw: window.innerWidth,
      }));
      check(tag + " no horizontal overflow", over.sw <= over.iw, JSON.stringify(over));

      // 5. Theme toggle via Alt+T (and button)
      const other = theme === "dark" ? "light" : "dark";
      const bg = { dark: "rgb(9, 11, 14)", light: "rgb(248, 250, 252)" };
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await sleep(300);
      await page.click("#theme-toggle-btn");
      await sleep(250);
      let th = await page.evaluate(() => ({
        t: document.documentElement.dataset.theme,
        bg: getComputedStyle(document.body).backgroundColor,
      }));
      check(tag + " theme button switches to " + other, th.t === other && th.bg === bg[other], JSON.stringify(th));
      await page.keyboard.press("Alt+KeyT");
      await sleep(250);
      th = await page.evaluate(() => ({
        t: document.documentElement.dataset.theme,
        bg: getComputedStyle(document.body).backgroundColor,
      }));
      check(tag + " Alt+T switches back to " + theme, th.t === theme && th.bg === bg[theme], JSON.stringify(th));

      // Light mode: no dark-box artifacts
      if (theme === "light") {
        const dark = await page.evaluate(() => {
          const out = [];
          const lum = (c) => {
            const m = c.match(/[\d.]+/g).map(Number);
            if (m.length > 3 && m[3] < 0.5) return 1;
            const f = (v) => {
              v /= 255;
              return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
            };
            return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]);
          };
          for (const el of document.querySelectorAll("#main *, #swarm-hud, #swarm-hud *")) {
            const cs = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            if (r.width * r.height < 1500) continue;
            const c = cs.backgroundColor;
            if (c === "rgba(0, 0, 0, 0)" || c === "rgb(15, 23, 42)") continue;
            if (c.startsWith("rgba(15, 23, 42")) continue;
            if (lum(c) < 0.05) out.push(el.className + " " + c + " " + Math.round(r.width) + "x" + Math.round(r.height));
          }
          return out;
        });
        check(tag + " no dark-box artifacts in light mode", dark.length === 0, dark.slice(0, 4).join(" ; "));
      }

      if (view === "phone" && theme === "dark") {
        await page.screenshot({ path: `${SHOTS}/${engine}-phone-dark.png` });
      }

      check(tag + " no console errors or warnings", noise.length === 0, noise.slice(0, 3).join(" | "));
      await ctx.close();
    }
  }
}

// 404 smoke
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const res = await page.goto(BASE + "/no-such-route", { waitUntil: "networkidle" });
  await sleep(800);
  const nf = await page.evaluate(() => ({
    h1: document.querySelector("h1")?.textContent,
    cursors: document.querySelectorAll(".nf-vis svg").length,
    sw: document.documentElement.scrollWidth,
    iw: window.innerWidth,
  }));
  check(
    "404 route renders",
    res.status() === 404 && /missing/i.test(nf.h1 || "") && nf.sw <= nf.iw,
    JSON.stringify({ status: res.status(), ...nf }),
  );
  await page.screenshot({ path: `${SHOTS}/404-desktop.png` });
  await ctx.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length} / ${results.length} checks passed`);
if (failed.length) {
  console.log("\nFailed:");
  for (const f of failed) console.log(" - " + f.name + (f.detail ? " :: " + f.detail : ""));
}
process.exit(failed.length ? 1 : 0);
