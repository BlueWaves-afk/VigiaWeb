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
    <main className="relative min-h-screen overflow-hidden bg-slate-950 light:bg-slate-50">
      <div className="absolute inset-0 bg-grid" />
      <BackgroundFX />
      <TopBar />
      <div className="pt-20">
        <SonicHero />
      </div>
      
      
      <SonicDemo />
      
      {/* Argus demo (client-only via the wrapper) */}
      <VGTShowcaseSection />

      <MapSection />

      <DeveloperSection />

      <BenchmarkDemo />
      <SiteFooter />
    </main>
  );
}
