import Link from "next/link";
import Nav from "@/components/Nav";
import { L, SelInline, T } from "@/components/ui";
import { copy } from "@/copy";
import LiveVisual from "@/modules/LiveVisual";

export const metadata = { title: "404 · CHOREO.UI" };

export default function NotFound() {
  const N = copy.notFound;
  return (
    <div id="main">
      <Nav />
      <main className="wrap nf">
        <L name="404 Copy" className="nf-copy">
          <T className="crumb">{N.crumb}</T>
          <T className="nf-n">{N.n}</T>
          <T as="h1" className="h2" style={{ paddingBottom: 28 }}>This route is <SelInline label={N.chip}>missing.</SelInline></T>
          <T className="sub">{N.body}</T>
          <L name="Buttons" className="cta-row" style={{ gap: 12 }}>
            <Link href="/" className="btn btn-primary" data-framer-name="Primary Button">{N.primary}</Link>
            <Link href="/demos/swarm" className="btn btn-secondary" data-framer-name="Secondary Button">{N.secondary}</Link>
          </L>
        </L>
        <L name="Visual · release" className="card nf-vis"><LiveVisual mode="release" /></L>
      </main>
    </div>
  );
}
