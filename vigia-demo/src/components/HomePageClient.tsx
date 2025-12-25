"use client";

import TopBar from "@/components/TopBar";
import SonicHero from "@/components/SonicHero";
import SectionConnector from "@/components/SectionConnector";
import SonicDemo from "@/components/SonicDemo";
import SiteFooter from "@/components/SiteFooter";
import DeveloperSection from "@/components/DeveloperSection";
import VGTShowcaseSection from "@/components/VGTShowcase";
import MapSection from "@/components/MapIndiaSection";
import BenchmarkDemo from "@/components/BenchmarkDemo";
import BackgroundFX from "@/components/BackgroundFX";

export default function HomePageClient() {
  return (
    <main className="relative min-h-screen bg-slate-950 text-white light:bg-slate-50 light:text-slate-900">
      {/* Background layers: soft grid + color wash */}
      <div className="pointer-events-none absolute inset-0">
        {/* Faint grid (uses your global .bg-grid) */}
        <div className="absolute inset-0 bg-grid opacity-[0.07] light:opacity-[0.05]" />
        {/* Radial color wash similar to PageShell */}
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_10%_-10%,rgba(56,189,248,.18),transparent),radial-gradient(900px_500px_at_90%_10%,rgba(168,85,247,.16),transparent)] opacity-70" />
      </div>

      {/* Global background blobs */}
      <BackgroundFX />

      {/* Sticky top navigation */}
      <TopBar />

      {/* Content stack */}
      <div className="relative z-10 flex flex-col gap-0 pt-20 lg:pt-24">
        {/* Hero: big first impression */}
        <section aria-label="VIGIA hero">
          <SonicHero />
        </section>

        <SectionConnector />

        {/* Copilot demo: interactive story */}
        <section aria-label="Interactive copilot demo">
          <SonicDemo />
        </section>

        <SectionConnector />

        {/* Sandbox / product showcase */}
        <section aria-label="VIGIA sandbox and demos">
          <VGTShowcaseSection />
        </section>

        <SectionConnector />

        {/* Coverage / map intelligence */}
        <section aria-label="Network and coverage map">
          <MapSection />
        </section>

        <SectionConnector />

        {/* Developer experience */}
        <section aria-label="Developer experience and integrations">
          <DeveloperSection />
        </section>

        <SectionConnector />

        {/* Benchmarks / credibility */}
        <section aria-label="Benchmark results">
          <BenchmarkDemo />
        </section>

        {/* Global footer */}
        <SiteFooter />
      </div>
    </main>
  );
}