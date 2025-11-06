export const metadata = { title: "VIGIA – Argus-V8X Showcase" };

import ArgusShowcase from "@/components/VGTShowcase";

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 pt-28">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold text-white">Argus-V8X Model Showcase</h1>
        <p className="mt-2 text-slate-300">Frame-by-frame detection with on-device TFLite inference.</p>
        <div className="mt-6">
          <ArgusShowcase />
        </div>
      </div>
    </main>
  );
}