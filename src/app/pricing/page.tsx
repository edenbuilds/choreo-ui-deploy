import type { Metadata } from "next";
import Nav from "@/components/Nav";
import { Faq, Pricing } from "@/components/interactive";
import { Final, Footer } from "@/components/sections";

export const metadata: Metadata = { title: "Access · CHOREO.UI" };

export default function PricingPage() {
  return (
    <div id="main">
      <Nav />
      <main style={{ paddingTop: 64 }}>
        <Pricing />
        <Faq />
        <Final />
      </main>
      <Footer />
    </div>
  );
}
