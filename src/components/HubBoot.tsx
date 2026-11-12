"use client";
import { useEffect } from "react";

/** Stub verify surface on the hub so a stray Playwright visit does not hang waiting for a build. */
export default function HubBoot() {
  useEffect(() => {
    window.__swarm = { agents: [], phase: "done", touring: false, lineY: 99999 };
  }, []);
  return null;
}
