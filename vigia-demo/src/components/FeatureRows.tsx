export default function FeatureRows() {
  const rows = [
    {
      title: "Geospatial RAG memory",
      body:  "Your assistant learns each stretch of road. Guidance adapts to what happened here before.",
    },
    {
      title: "Edge-first models",
      body:  "Quantized detectors and TTS run locally; <150ms speech-on-hazard on mid-tier phones.",
    },
    {
      title: "Privacy-by-design",
      body:  "No raw video upload. Only compact, anonymized hazard events leave the device.",
    },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="grid gap-6 md:grid-cols-3">
        {rows.map((r) => (
          <div key={r.title} className="card-glass p-6">
            <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-md bg-cyan-400/20 text-cyan-300">★</div>
            <h3 className="text-white font-semibold">{r.title}</h3>
            <p className="mt-2 text-white/70 text-sm leading-relaxed">{r.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}