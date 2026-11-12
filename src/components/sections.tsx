import Link from "next/link";
import { copy } from "@/copy";
import LiveVisual from "@/modules/LiveVisual";
import StepVisual from "@/modules/StepVisual";
import { Check, CursorIcon, Hatch, L, Logo, Mark, Replay, SelInline, Selection, T } from "./ui";

const KEYS = ["krait", "fuzz", "drift", "vanguard", "ward", "seal"];

export function Hero() {
  const H = copy.hero;
  return (
    <section className="hero wrap">
      <div className="hero-grid">
        <L name="Hero Copy" className="hero-copy">
          <T className="crumb">{H.crumb}</T>
          <T as="h1" className="h1">{H.h1a} <SelInline label={H.h1chip}>{H.h1sel}</SelInline> {H.h1b}</T>
          <T className="sub">{H.body}</T>
          <L name="Buttons" className="cta-row">
            <Link href="/#engines" className="btn btn-primary" data-framer-name="Primary Button">{H.primary}</Link>
            <Hatch size={10} height={44} />
            <L name="Replay Button" as="button" id="replay-btn" className="btn btn-secondary"><Replay />{H.secondary}</L>
          </L>
          <T className="caption">{H.caption}</T>
        </L>
        <L name="Live Defense Card" className="card defense">
          <L name="Card Header" className="defense-head mono">
            <L name="Dot" as="i" className="pulse" />
            <T as="span" className="grow">{H.live}</T>
            <T as="span" className="ok">{H.contained}</T>
          </L>
          <L name="Progress" className="bar"><i /></L>
          <L name="Crew Row" className="crew-row mono">
            <L name="Avatars" className="dots">{KEYS.map(k => <i key={k} style={{ background: "var(--agent-" + k + ")" }} />)}</L>
            <T as="span">{H.crew}</T>
          </L>
          <L name="Tasks" as="ul" className="tasks">
            {H.tasks.map(([state, who, what]) => (
              <L key={who} name="Task" as="li" className="task">
                {state === "done" ? <L name="Frame Icon" as="span" style={{ display: "flex" }}><Check /></L> : <L name="Dot" as="i" className="pulse" />}
                <T as="span"><b>{who}</b> {what}</T>
              </L>
            ))}
          </L>
        </L>
      </div>
    </section>
  );
}

export function LogosStats() {
  const names = copy.logos.names;
  return (
    <section className="logos wrap" aria-label="Customers and numbers">
      <T>{copy.logos.line}</T>
      <L name="Logo Marquee" className="marquee">
        <div className="marquee-track">
          {[0, 1].map(dup => (
            <div key={dup} style={{ display: "flex" }} aria-hidden={dup === 1}>
              {names.map((n, i) => <Logo key={n} i={i} name={n} />)}
            </div>
          ))}
        </div>
      </L>
      <L name="Stats Band" className="stats">
        {copy.stats.map(s => (
          <L key={s.label} name="Stat" className="stat">
            <L name="Counter" className="stat-n"><LiveVisual mode="counter" value={s.value} unit={s.unit} from={s.from} /></L>
            <T><span className="sr">{s.value + s.unit} </span>{s.label}</T>
          </L>
        ))}
      </L>
    </section>
  );
}

function Head({ c }: { c: { crumb: string; h2: string; sub?: string } }) {
  return (
    <L name="Section Header" className="head">
      <T className="crumb">{c.crumb}</T>
      <T as="h2" className="h2">{c.h2}</T>
      {c.sub ? <T className="sub">{c.sub}</T> : null}
    </L>
  );
}

export function HowItWorks() {
  const S = copy.how;
  return (
    <section id="how-it-works" className="section wrap">
      <Head c={S} />
      <div className="steps">
        {S.steps.map((s, i) => (
          <StepFrag key={s.n} last={i === S.steps.length - 1}>
            <L name={"Step " + s.n} className="card step">
              <L name="Step Meta" className="step-meta mono"><T as="span">{s.n}</T><T as="span"><b>{s.cmd}</b></T></L>
              <L name={"Step Visual · " + s.mode} className="step-vis"><StepVisual mode={s.mode} /></L>
              <T as="h3" className="title">{s.title}</T>
              <T className="desc">{s.body}</T>
            </L>
          </StepFrag>
        ))}
      </div>
    </section>
  );
}
function StepFrag({ children, last }: { children: React.ReactNode; last: boolean }) {
  return <>{children}{last ? null : <Hatch size={16} />}</>;
}

export function Agents() {
  const A = copy.agents;
  return (
    <section id="agents" className="section wrap">
      <Head c={A} />
      <div className="grid3">
        {A.list.map(a => {
          const card = (
            <L name="Agent" className="card agent">
              <L name="Agent Identity" className="agent-id">
                <L name="Cursor" as="span" style={{ display: "flex" }}><CursorIcon agent={a.key} /></L>
                <L name="Name Tag" as="span" className="tag" style={{ background: "var(--agent-" + a.key + ")" }}>{a.name}</L>
                <T as="h3" className="title" style={{ fontSize: 15 }}>{a.role}</T>
              </L>
              <T className="desc agent-copy">{a.body}</T>
              <L name="Agent Stat" className="agent-stat">
                <T as="span" className="mono">{A.stat}</T>
                <L name="Live Meter" className="meter">
                  <LiveVisual mode="meter" value={a.value} unit={a.unit} decimals={a.decimals} color={"var(--agent-" + a.key + ")"} steady={"steady" in a} />
                </L>
              </L>
            </L>
          );
          return a.key === "ward" ? <Selection key={a.key} label={A.wardChip}>{card}</Selection> : <div key={a.key}>{card}</div>;
        })}
      </div>
    </section>
  );
}

export function Output() {
  const O = copy.output;
  return (
    <section id="output" className="section wrap">
      <Head c={O} />
      <div className="bento">
        {O.cards.map(c => (
          <L key={c.mode} name="Card" className="card">
            <L name={"Live Visual · " + c.mode} className="bento-vis"><LiveVisual mode={c.mode} /></L>
            <L name="Card Copy" className="bento-copy">
              <T as="h3" className="title">{c.title}</T>
              <T className="desc">{c.body}</T>
            </L>
          </L>
        ))}
      </div>
    </section>
  );
}

export function Quotes() {
  const Q = copy.quotes;
  return (
    <section className="section wrap" aria-label="Customer quotes">
      <Head c={Q} />
      <div className="quotes">
        {Q.list.map((q, i) => {
          const card = (
            <L name="Quote" as="figure" className={"card quote" + (i === 0 ? " big" : "")} style={{ height: "100%" }}>
              <T as="blockquote">{q.text}</T>
              <L name="Author" as="figcaption" className="author">
                <L name="Avatar" as="span" className="avatar" style={{ background: "var(--agent-" + q.key + ")" }}>{q.name.split(" ").map(w => w[0]).join("")}</L>
                <T as="span"><b>{q.name}</b>{q.role}</T>
              </L>
            </L>
          );
          return (
            <QuoteFrag key={q.name} first={i === 0}>
              {i === 0 ? <Selection label={Q.chip} className="q-slot big">{card}</Selection> : <div className="q-slot">{card}</div>}
            </QuoteFrag>
          );
        })}
      </div>
    </section>
  );
}
function QuoteFrag({ children, first }: { children: React.ReactNode; first: boolean }) {
  return <>{first ? null : <Hatch size={16} />}{children}</>;
}

export function Final() {
  const F = copy.final;
  return (
    <section id="final" className="section wrap">
      <L name="Final CTA" className="card final">
        <div className="final-copy">
          <T as="h2" className="h2">{F.h2a} <SelInline label={F.h2chip}>{F.h2sel}</SelInline></T>
          <T className="sub">{F.body}</T>
          <L name="Buttons" className="cta-row" style={{ gap: 12 }}>
            <Link href="/demos/swarm" className="btn btn-primary" data-framer-name="Primary Button">{F.primary}</Link>
            <Link href="/pricing" className="btn btn-secondary" data-framer-name="Secondary Button">{F.secondary}</Link>
          </L>
        </div>
        <L name="Status Card" className="status">
          <L name="Card Header" className="defense-head mono">
            <L name="Dot" as="i" className="pulse" />
            <T as="span" className="ok">{F.statusSub}</T>
          </L>
          <T className="status-n">{F.status}</T>
          <L name="Avatars" className="dots">{[...KEYS, ...KEYS].map((k, i) => <i key={i} style={{ background: "var(--agent-" + k + ")", width: 20, height: 20, borderColor: "var(--bg-elevated)" }} />)}</L>
          <ul className="tasks">
            {F.statusRows.map(([k, v]) => <L key={k} name="Row" as="li" className="task mono" style={{ justifyContent: "space-between", color: "var(--text-secondary)" }}>{k}<b style={{ color: "var(--text-primary)" }}>{v}</b></L>)}
          </ul>
        </L>
      </L>
    </section>
  );
}

export function Footer() {
  const F = copy.footer;
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot-top">
          <Link href="/" className="brand"><L name="Logo" as="span" style={{ display: "flex" }}><Mark /></L><L name="Wordmark" as="span">{copy.nav.brand}</L></Link>
          <L name="Footer Links" as="nav" className="foot-links" aria-label="Footer">
            {F.links.map(([label, href]) => <Link key={label} href={href}>{label}</Link>)}
          </L>
        </div>
        <Selection label={F.wordChip} className="wordmark">
          <L name="Giant Wordmark">
            <svg viewBox="0 0 1200 250" role="img" aria-label={copy.nav.brand}>
              <text x="600" y="205" textAnchor="middle" fill="currentColor" style={{ font: "600 248px var(--sans)", letterSpacing: "-0.05em" }}>{copy.nav.brand}</text>
            </svg>
          </L>
        </Selection>
        <div className="foot-bar">
          <T as="span">{F.rights}</T>
          <T as="span">{F.demo}</T>
          <L name="Build Line" className="buildline" aria-hidden="true"><i />{F.line}</L>
        </div>
      </div>
    </footer>
  );
}
