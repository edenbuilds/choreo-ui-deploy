import ChoreographyEngine, { type EngineMode } from "@/modules/ChoreographyEngine";
import DemoSections from "./DemoSections";
import EngineSwitcher from "./EngineSwitcher";

export default function DemoPage({ engine }: { engine: EngineMode }) {
  return (
    <>
      <div id="main">
        <EngineSwitcher current={engine} />
        <DemoSections />
      </div>
      <ChoreographyEngine mode={engine} />
    </>
  );
}
