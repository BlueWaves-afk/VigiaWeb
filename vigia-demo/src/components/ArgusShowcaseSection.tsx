"use client";

import dynamic from "next/dynamic";

// Load the WebGL/Video demo only on the client
const ArgusShowcase = dynamic(() => import("@/components/ArgusShowcase"), {
  ssr: false,
});

export default function ArgusShowcaseSection() {
  return (
    <section className="mx-auto mt-24 w-full max-w-6xl px-6">
      <h2 className="mb-4 text-2xl font-semibold text-white">Argus-V8X Model Showcase</h2>
      <p className="mb-6 max-w-3xl text-slate-300">
        On-device hazard detection (TFLite). Watch the overlay update in real time as the model runs in your browser.
      </p>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
        <ArgusShowcase />
      </div>
    </section>
  );
}