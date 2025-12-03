"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";

/* ---------- Motion helpers ---------- */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14, filter: "blur(2px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
      delay
    }
  },
});

const springTap = {
  whileHover: {
    y: -2,
    scale: 1.015,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25
    }
  },
  whileTap: { scale: 0.985, y: 0 },
};

const YOUTUBE_URL = "https://youtu.be/5NOFSMCZsPw?si=4Mk82JuFR_t2Up6n";
const YOUTUBE_EMBED_SRC = "https://www.youtube.com/embed/5NOFSMCZsPw?si=4Mk82JuFR_t2Up6n&rel=0&modestbranding=1";

export default function SonicHero() {
  const previewRef = useRef<HTMLDivElement>(null);

  // Subtle parallax float for the right card as the user scrolls
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });
  const floatY = useTransform(scrollYProgress, [0, 1], [0, 18]);
  const scrollToCopilot = () => {
    const target = document.getElementById("copilot-demo");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToBenchmark = () => {
    const target = document.getElementById("benchmark-demo");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const watchDemo = () => {
    previewRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.open(YOUTUBE_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen overflow-hidden bg-[#0B1120]"
    >
      {/* Fine grid background pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="h-full w-full bg-[linear-gradient(to_right,rgba(56,189,248,.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(56,189,248,.06)_1px,transparent_1px)] bg-[size:4px_4px]" />
      </div>


      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        {/* Main content card */}
        <motion.div
          {...fadeUp(0)}
          className="border border-slate-700/60 bg-gradient-to-br from-slate-900/40 to-slate-950/40 p-12 backdrop-blur-sm"
        >
          {/* Eyebrow */}
          <div className="mb-6">
            <span className="inline-block text-sm font-semibold uppercase tracking-wider text-slate-400">
              MEET VIGIA{" "}
              <span className="text-emerald-400">FOR ROAD SAFETY</span>
            </span>
          </div>

          {/* Main headline */}
          <h1
            className="text-5xl font-normal leading-tight tracking-tight text-white md:text-7xl lg:text-8xl"
            style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}
          >
            Real-time Road Intelligence{" "}
            <span className="block md:inline">
              on the edge
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-400 md:text-xl"
            style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}
          >
            Low-latency audio understanding, hazard memory, and a generative co-pilot that speaks before trouble.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <motion.button
              {...springTap}
              type="button"
              onClick={scrollToCopilot}
              className="rounded-full bg-white px-8 py-3.5 text-base font-semibold text-slate-900 shadow-lg transition-all hover:bg-slate-100"
              style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}
            >
              Try for free
            </motion.button>

            <motion.div {...springTap}>
              <Link
                href="/docs"
                className="inline-block rounded-full border border-slate-700 bg-slate-900/50 px-8 py-3.5 text-base font-semibold text-white transition-all hover:border-slate-600 hover:bg-slate-800/50"
                style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}
              >
                Contact Sales
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Grid connector between sections - full width */}
        <div className="relative h-20 w-full overflow-hidden border-x border-slate-700/60 bg-[#0B1120]">
          <div className="absolute inset-0 flex items-center justify-between">
            {Array.from({ length: 100 }).map((_, i) => (
              <div
                key={i}
                className="h-full w-px bg-slate-800/40"
              />
            ))}
          </div>
        </div>

        {/* Demo card - Rectangular layout */}
        <motion.div
          style={{ y: floatY }}
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6, ease: "easeOut" as const }}
          ref={previewRef}
          className="-mt-4 group relative overflow-hidden border border-slate-700/60 backdrop-blur-sm transition-all hover:border-slate-600/80"
        >
          <div className="grid md:grid-cols-2">
            {/* Left side - Real-time Road Intelligence */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900/40 to-slate-950/40 p-12">

              <div className="relative">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
                  Real-time Road Intelligence
                </h3>

                <h2 className="mt-6 text-4xl font-bold leading-tight text-white md:text-5xl">
                  Edge-powered safety for every journey
                </h2>

                <p className="mt-6 text-lg leading-relaxed text-slate-400">
                  Low-latency audio understanding, hazard memory, and a generative co-pilot that speaks before trouble.
                </p>

                <div className="mt-10 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
                      <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Context-aware Detection</p>
                      <p className="text-sm text-slate-400">98% accuracy in real-world conditions</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
                      <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Ultra-low Latency</p>
                      <p className="text-sm text-slate-400">&lt;50ms edge-native processing</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
                      <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Multilingual Support</p>
                      <p className="text-sm text-slate-400">Natural, emotive speech in any language</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Video */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900/40 to-slate-950/40 p-8">
              <div className="relative">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
                  Copilot Walkthrough
                </h3>

                <div className="group/video relative overflow-hidden rounded-lg border border-slate-700/60 bg-slate-950 shadow-2xl">
                  <div className="relative aspect-video w-full">
                    <iframe
                      title="Sonic Copilot demo walkthrough"
                      src={YOUTUBE_EMBED_SRC}
                      className="absolute inset-0 h-full w-full"
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                    {/* Modern video overlay effect */}
                    <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-white/5 transition-opacity group-hover/video:opacity-0" />
                  </div>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-slate-400">
                  Watch how we layer sonic cues, hazard memory, and proactive co-pilot prompts into a single ride-along experience.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}