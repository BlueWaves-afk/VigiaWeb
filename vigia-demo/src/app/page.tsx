import BackgroundFX from "@/components/BackgroundFX";
import TopBar from "@/components/TopBar";
import SonicHero from "@/components/SonicHero";
import SonicDemo from "@/components/SonicDemo";
import FeatureRows from "@/components/FeatureRows";
import CodeDemo from "@/components/CodeDemo";
import SiteFooter from "@/components/SiteFooter";
import DeveloperSection from "@/components/DeveloperSection";
import ArgusShowcaseSection from "@/components/ArgusShowcaseSection";

export const metadata = { title: "VIGIA WEB" };

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-grid" />
      <BackgroundFX />
      <TopBar />

      <div className="pt-20">
        <SonicHero />
      </div>

      <SonicDemo />

      {/* Argus demo (client-only via the wrapper) */}
      <ArgusShowcaseSection />

      <DeveloperSection />
      <FeatureRows />
      <CodeDemo />
      <SiteFooter />
    </main>
  );
}