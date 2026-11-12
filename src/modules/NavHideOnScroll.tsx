"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
// Port of the Framer module NavHideOnScroll (slr00YTPK71T3FK7YhA9/q0Rx6Bd5ytYiR1VogItc).
// Hides the navigation while scrolling down and brings it back on scroll up. Thresholds and easing are the original ones.
import { forwardRef, useEffect, useRef, useState, type ComponentType } from "react";

export function withHideOnScroll(Component: ComponentType<any>) {
  return forwardRef(function HideOnScroll(props: any, ref) {
    const [hidden, setHidden] = useState(false);
    const last = useRef(0);
    useEffect(() => {
      last.current = window.scrollY;
      let raf = 0;
      const check = () => {
        raf = 0;
        const y = window.scrollY;
        const d = y - last.current;
        if (y < 80) { setHidden(false); last.current = y; return; }
        if (Math.abs(d) < 8) return;
        setHidden(d > 0);
        last.current = y;
      };
      const onScroll = () => { if (!raf) raf = requestAnimationFrame(check); };
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => { window.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
    }, []);
    const { style, forceShow, ...rest } = props;
    const off = hidden && !forceShow;
    return <Component {...rest} ref={ref} data-hidden={off} style={{ ...style }} initial={false} animate={{ y: off ? "-110%" : "0%" }} transition={{ type: "tween", duration: 0.35, ease: [0.22, 1, 0.36, 1] }} />;
  });
}
