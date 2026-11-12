import Link from "next/link";
import Nav from "@/components/Nav";
import HubBoot from "@/components/HubBoot";
import { Footer } from "@/components/sections";
import { L, T } from "@/components/ui";
import { copy } from "@/copy";

export default function HubPage() {
  const H = copy.hub;

  return (
    <div id="main">
      <HubBoot />
      <Nav />
      <main>
        <section className="hub-hero wrap">
          <L name="Hub Header" className="hub-header">
            <T className="crumb">{H.crumb}</T>
            <T as="p" className="hub-brand">{H.brand}</T>
            <T as="h1" className="h1 hub-h1">{H.h1}</T>
            <T className="sub">{H.body}</T>
            <L name="Buttons" className="cta-row">
              <Link href="/demos/swarm" className="btn btn-primary" data-framer-name="Primary Button">{H.cta}</Link>
            </L>
            <L name="Arch Badges" className="hub-badges" aria-label="Architecture">
              {H.archBadges.map((b) => (
                <T as="span" key={b} className="hub-badge mono">{b}</T>
              ))}
            </L>
          </L>
        </section>

        <section id="engines" className="section wrap">
          <L name="Section Header" className="head">
            <T className="crumb">/engines · 7 cartridges</T>
            <T as="h2" className="h2">Pick an engine. Same layers, different actuation.</T>
            <T className="sub">Each card opens a demo that mounts the cartridge outside #main and builds DemoSections.</T>
          </L>
          <div className="hub-grid">
            {copy.engines.map((e) => (
              <L key={e.id} name="Engine Card">
                <Link href={e.href} className="hub-card">
                  <T as="span" className="hub-card-meta mono">{e.metaphor}</T>
                  <T as="h3" className="title">{e.name}</T>
                  <T className="desc">{e.tagline}</T>
                  <T as="span" className="hub-card-href mono">{e.href}</T>
                </Link>
              </L>
            ))}
          </div>
        </section>

        <section id="contract" className="section wrap">
          <L name="Contract" className="hub-contract">
            <T className="crumb">/contract · L/T · collect · canvas · HUD</T>
            <T as="h2" className="h2">The layer contract every engine shares.</T>
            <T className="sub">
              Wrap visible parts in <code>&lt;L&gt;</code> (named leaf) or <code>&lt;T&gt;</code> (rich text).
              Engines collect rects once, actuate on a dual canvas sibling of #main, and drive the fixed HUD.
              Playwright reads <code>window.__swarm</code> for phase, agents, touring, and lineY.
            </T>
          </L>
        </section>
      </main>
      <Footer />
    </div>
  );
}
