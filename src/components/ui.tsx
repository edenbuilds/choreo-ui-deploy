/* eslint-disable @typescript-eslint/no-explicit-any */
// Layer primitives. SwarmBuild builds every element that has data-framer-name (L) and every rich-text container (T).
// A visible part that is neither stays on screen before the build line reaches it, so wrap everything in one of them.
import type { ReactNode } from "react";

export function L({ name, as: Tag = "div", children, ...rest }: { name: string; as?: any; children?: ReactNode; [k: string]: any }) {
  return <Tag data-framer-name={name} {...rest}>{children}</Tag>;
}
export function T({ as: Tag = "p", children, ...rest }: { as?: any; children?: ReactNode; [k: string]: any }) {
  return <Tag data-framer-component-type="RichTextContainer" {...rest}>{children}</Tag>;
}

const Handles = () => (<><i className="handle" /><i className="handle" /><i className="handle" /><i className="handle" /></>);

// CAD selection box around a block. The frame is its own named leaf so the crew draws it.
export function Selection({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={"sel " + className}>
      {children}
      <L name="Selection" className="sel-frame" aria-hidden="true" style={{ background: "transparent" }}>
        <Handles />
        <span className="chip sel-chip">{label}</span>
      </L>
    </div>
  );
}
// Selection box around words inside a headline.
export function SelInline({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <span className="sel sel-inline">
      {children}
      <span className="sel-frame" aria-hidden="true"><Handles />{label ? <span className="chip sel-chip">{label}</span> : null}</span>
    </span>
  );
}

// Airgap hatch marker: fills a measured gap with 45 degree red-team lines and shows the gap size.
export function Hatch({ size, height }: { size: number; height?: number }) {
  return (
    <L name="Hatch" className="hatch" aria-hidden="true" style={{ width: size, height }}>
      <svg>
        <defs>
          <pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="5" stroke="currentColor" strokeWidth="1.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hatch)" />
      </svg>
      <b>{size}</b>
    </L>
  );
}

export const Check = () => (
  <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6.5L5 9L10 3" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const Plus = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
);
export const Replay = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2.5 8a5.5 5.5 0 1 0 1.7-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><path d="M2 2v3.2h3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const Shield = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 1.5 L13.5 3.5 V8 C13.5 11.2 11.3 13.4 8 14.5 C4.7 13.4 2.5 11.2 2.5 8 V3.5 Z" stroke="currentColor" strokeWidth="1.3" /></svg>
);
// Brand mark: dashed shield with the agent cursor inside.
export const Mark = () => (
  <svg width="24" height="24" viewBox="0 0 26 26" fill="none" aria-hidden="true">
    <path d="M13 2 L23 5.5 V13 C23 18.5 19 22.5 13 24.5 C7 22.5 3 18.5 3 13 V5.5 Z" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
    <path d="M9.5 7.5 L9.5 18 L12.4 15.3 L14.4 19.6 L16.1 18.8 L14.2 14.6 L18 14.6 Z" fill="var(--accent-blue-team)" />
  </svg>
);
export const CursorIcon = ({ agent, size = 20 }: { agent: string; size?: number }) => (
  <svg width={size * 0.75} height={size} viewBox="0 0 15 20" aria-hidden="true">
    <path d="M1 1L1 16.5L5.2 12.6L8.1 19L10.6 17.9L7.8 11.7L13.4 11.7Z" fill={"var(--agent-" + agent + ")"} stroke="var(--cursor-stroke)" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
);

// Placeholder customer marks: a plain glyph and the name set in type. They use currentColor, so both themes work.
const GLYPHS = [
  <path key="0" d="M3 3h10v5H8zM3 8h5l5 5H3z" />,
  <path key="1" d="M2 9.5 6.5 14A6.5 6.5 0 0 1 2 9.5zM2 6l8 8a6.5 6.5 0 0 0 2-1.2L3.2 4A6.5 6.5 0 0 0 2 6zM5 2.6 13.4 11A6.5 6.5 0 0 0 5 2.6z" />,
  <path key="2" d="M8 2.5 14.5 13.5h-13z" />,
  <path key="3" d="M3 2.5h7.5L13 5v8.5H3zM5.5 6v5h1V8l2.5 3h1V6h-1v3L6.5 6z" fillRule="evenodd" />,
  <path key="4" d="M5.5 2h5a2.5 2.5 0 0 1 0 5 2.5 2.5 0 1 1-2.5 2.5V14a2.5 2.5 0 1 1-2.5-4.5 2.5 2.5 0 0 1 0-5z" />,
  <path key="5" d="M2 4h12v8H2zM4 6.5h8v1H4zM4 9h4v1H4z" fillRule="evenodd" />,
  <path key="6" d="M2 8l3-3v6zM14 8l-3 3V5zM8 2l3 3H5zM8 14l-3-3h6z" />,
];
export const Logo = ({ i, name }: { i: number; name: string }) => (
  <span className="logo"><svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">{GLYPHS[i % GLYPHS.length]}</svg>{name}</span>
);
