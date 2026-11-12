"use client";
import SwarmBuild from "./SwarmBuild";
import SignalGraph from "./SignalGraph";
import XRayLoupe from "./XRayLoupe";
import MagneticSnap from "./MagneticSnap";
import TimeScrubber from "./TimeScrubber";
import IsoExplode from "./IsoExplode";
import StreamHydrate from "./StreamHydrate";

export type EngineMode = "swarm" | "signal" | "xray" | "magnetic" | "timeline" | "isometric" | "stream";

export default function ChoreographyEngine({ mode }: { mode: EngineMode }) {
  switch (mode) {
    case "signal":
      return <SignalGraph />;
    case "xray":
      return <XRayLoupe />;
    case "magnetic":
      return <MagneticSnap />;
    case "timeline":
      return <TimeScrubber />;
    case "isometric":
      return <IsoExplode />;
    case "stream":
      return <StreamHydrate />;
    default:
      return <SwarmBuild />;
  }
}
