"use client";
// The three sections that hold state: the workspace window, the pricing toggle and the FAQ accordion.
import Link from "next/link";
import { useRef, useState } from "react";
import { copy } from "@/copy";
import LiveVisual from "@/modules/LiveVisual";
import { withBillingPeriod, withMonthly, withPlanPrice, withYearly } from "@/modules/Billing";
import { Check, L, Plus, Shield, T } from "./ui";

const W = copy.workspace;

export function Workspace() {
  const [env, setEnv] = useState(0);
  const [row, setRow] = useState(2);
  const [merge, setMerge] = useState<"idle" | "busy" | "done">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMerge = () => {
    if (merge !== "idle") return;
    setMerge("busy");
    timer.current = setTimeout(() => {
      setMerge("done");
      timer.current = setTimeout(() => setMerge("idle"), 2400);
    }, 900);
  };
  return (
    <section className="wrap" aria-label="Product preview">
      <L name="Product Preview" className="card ws">
        <L name="Toolbar" className="ws-bar">
          <L name="Window Dots" className="traffic" aria-hidden="true">
            <i style={{ background: "var(--agent-krait)" }} /><i style={{ background: "var(--agent-drift)" }} /><i style={{ background: "var(--agent-vanguard)" }} />
          </L>
          <div className="tabs" role="tablist" aria-label="Environment">
            {W.tabs.map((t, i) => (
              <button key={t} role="tab" aria-selected={env === i} className="tab" data-framer-name="Tab" onClick={() => setEnv(i)}>{t}</button>
            ))}
          </div>
          <button className="btn btn-primary btn-sm" data-framer-name="Merge Button" aria-busy={merge === "busy"} onClick={onMerge}>
            <span aria-live="polite">{merge === "busy" ? W.merging : merge === "done" ? W.merged : W.merge}</span>
          </button>
        </L>
        <div className="ws-body">
          <L name="Layers Panel" className="pane pane-l">
            <T as="h3" className="pane-h">{W.surface}</T>
            {W.routes.map(([label, kind], i) => (
              <button key={label} className={"row" + (kind === "child" ? " child" : "")} aria-current={row === i} data-framer-name="Row" onClick={() => setRow(i)}>
                {kind === "child" ? <span aria-hidden="true">T</span> : <Shield />}
                {label}
              </button>
            ))}
          </L>
          <L name="Live Visual · editor" className="ws-canvas"><LiveVisual mode="editor" /></L>
          <L name="Properties Panel" className="pane pane-r">
            <T as="h3" className="pane-h">{W.inspector}</T>
            <div className="insp">
              <T as="h4">{W.vector.title}</T>
              <div className="kv">{W.vector.fields.map(([k, v]) => <L key={k} name="Field" className="field">{k}<b>{v}</b></L>)}</div>
            </div>
            <div className="insp">
              <T as="h4">{W.sandbox.title}</T>
              <div className="kv">{W.sandbox.envs[env].map(([k, v]) => <L key={k} name="Field" className="field wide">{k}<b>{v}</b></L>)}</div>
            </div>
            <div className="insp">
              <T as="h4">{W.fill.title}</T>
              <div className="kv">
                <L name="Field" className="field"><i className="swatch" /><b className="fill-hex" /></L>
                <L name="Field" className="field">{"Opacity"}<b>{W.fill.opacity}</b></L>
              </div>
            </div>
            <div className="insp">
              <T as="h4">{W.attest.title}</T>
              <div className="kv">{W.attest.fields.map(([k, v]) => <L key={k} name="Field" className="field wide">{k}<b className={k === "Tests" ? "ok" : ""}>{v}</b></L>)}</div>
            </div>
          </L>
        </div>
      </L>
    </section>
  );
}

const P = copy.pricing;
const Monthly = withMonthly("button");
const Yearly = withYearly("button");
const Price = withPlanPrice(LiveVisual);
const Period = withBillingPeriod(({ text }: { text: string }) => <span className="price-p">{text}</span>);

export function Pricing() {
  return (
    <section id="pricing" className="section wrap">
      <L name="Section Header" className="head">
        <T className="crumb">{P.crumb}</T>
        <T as="h2" className="h2">{P.h2}</T>
        <T className="sub">{P.sub}</T>
        <L name="Billing Toggle" className="toggle">
          <Monthly id="billing-monthly">{P.monthly}</Monthly>
          <Yearly id="billing-yearly">{P.yearly}</Yearly>
        </L>
      </L>
      <div className="grid3">
        {P.tiers.map(t => (
          <L key={t.name} name="Plan" className={"card tier" + ("hot" in t ? " hot" : "")}>
            <div className="tier-head">
              <T as="h3" className="title">{t.name}</T>
              {"hot" in t ? <L name="Value Chip" as="span" className="chip">{P.tag}</L> : null}
            </div>
            <div className="price">
              <L name="Counter" className="price-n" data-price={t.name}><Price mode="counter" value={t.price} prefix="$" from={0} /></L>
              <Period text={P.period} yearlyText={P.periodYearly} />
            </div>
            <T className="desc">{t.blurb}</T>
            <ul className="feats">
              {t.feats.map(f => <L key={f} name="Feature" as="li"><Check />{f}</L>)}
            </ul>
            <Link href="/#final" className={"btn " + ("hot" in t ? "btn-primary" : "btn-secondary")} data-framer-name="Plan Button">{t.cta}</Link>
          </L>
        ))}
      </div>
    </section>
  );
}

const F = copy.faq;
export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="section wrap">
      <L name="Section Header" className="head">
        <T className="crumb">{F.crumb}</T>
        <T as="h2" className="h2">{F.h2}</T>
      </L>
      <div className="faq">
        {F.items.map(([q, a], i) => (
          <L key={q} name="FAQ Item" className="faq-item" data-open={open === i}>
            <h3>
              <button className="faq-q" aria-expanded={open === i} aria-controls={"faq-" + i} onClick={() => setOpen(open === i ? -1 : i)}>
                {q}<Plus />
              </button>
            </h3>
            <div className="faq-a" id={"faq-" + i} role="region" inert={open !== i}>
              <div><p>{a}</p></div>
            </div>
          </L>
        ))}
      </div>
    </section>
  );
}
