import BackgroundFX from "@/components/BackgroundFX";
import TopBar from "@/components/TopBar";
import SonicHero from "@/components/SonicHero";
import SonicDemo from "@/components/SonicDemo";
import FeatureRows from "@/components/FeatureRows";
import CodeDemo from "@/components/CodeDemo";
import SiteFooter from "@/components/SiteFooter";

export const metadata = { title: "VIGIA – Sonic Copilot" };

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-grid" />
      <BackgroundFX />
      <TopBar />

      {/* Your existing hero */}
      <div className="pt-20">
        <SonicHero />
      </div>

      {/* ✅ New interactive demo section */}
      <SonicDemo />

      <FeatureRows />
      <CodeDemo />
      <SiteFooter />
    </main>
  );
}