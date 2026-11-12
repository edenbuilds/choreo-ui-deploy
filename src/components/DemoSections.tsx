import Nav from "@/components/Nav";
import { Faq, Pricing, Workspace } from "@/components/interactive";
import { Agents, Final, Footer, Hero, HowItWorks, LogosStats, Output, Quotes } from "@/components/sections";

export default function DemoSections() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Workspace />
        <LogosStats />
        <HowItWorks />
        <Agents />
        <Output />
        <Pricing />
        <Quotes />
        <Faq />
        <Final />
      </main>
      <Footer />
    </>
  );
}
