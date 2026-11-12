"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { copy } from "@/copy";
import { withHideOnScroll } from "@/modules/NavHideOnScroll";
import { L, Mark } from "./ui";

const Header = withHideOnScroll(motion.header);
const N = copy.nav;

export default function Nav() {
  const [theme, setTheme] = useState("dark");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // The inline script in layout.tsx sets data-theme before paint. Mirror it into state after mount.
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
    const toggle = () => {
      const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem("theme", next); } catch {}
      setTheme(next);
    };
    // Alt+T types a dagger on macOS, so match the physical key.
    const onKey = (e: KeyboardEvent) => { if (e.altKey && e.code === "KeyT") { e.preventDefault(); toggle(); } };
    const onToggle = () => toggle();
    window.addEventListener("keydown", onKey);
    window.addEventListener("choreo:theme", onToggle);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("choreo:theme", onToggle); };
  }, []);

  return (
    <Header className="nav" forceShow={open}>
      <div className="wrap nav-in">
        <Link href="/" className="brand" aria-label={N.brand}>
          <L name="Logo" as="span" style={{ display: "flex" }}><Mark /></L>
          <L name="Wordmark" as="span">{N.brand}</L>
        </Link>
        <nav className="nav-links" aria-label="Primary">
          {N.links.map(([label, href]) => <Link key={href} href={href} data-framer-name="Nav Link">{label}</Link>)}
        </nav>
        <div className="nav-right">
          <button id="theme-toggle-btn" className="theme" data-framer-name="Theme Toggle" aria-label={N.themeLabel} title={N.themeLabel} onClick={() => window.dispatchEvent(new Event("choreo:theme"))}>
            <i /><span>{theme === "light" ? N.themeLight : N.themeDark}</span>
          </button>
          <Link href="/demos/swarm" className="btn btn-primary btn-sm" data-framer-name="Primary Button">{N.cta}</Link>
          <button id="menu-btn" className="burger" data-framer-name="Menu Button" aria-expanded={open} aria-controls="drawer" aria-label={open ? N.menuClose : N.menu} onClick={() => setOpen(o => !o)}>
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              {open ? <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /> : <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />}
            </svg>
          </button>
        </div>
      </div>
      <div id="drawer" className="drawer" data-open={open}>
        {N.links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
        <Link href="/demos/swarm" className="btn btn-primary" onClick={() => setOpen(false)}>{N.cta}</Link>
      </div>
    </Header>
  );
}
