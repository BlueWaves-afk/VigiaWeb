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
      className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900"
    >
      {/* subtle grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[.28] [mask-image:radial-gradient(60%_60%_at_50%_40%,#000_60%,transparent_100%)]">
        <div className="h-full w-full bg-[linear-gradient(to_right,rgba(148,163,184,.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,.12)_1px,transparent_1px)] bg-[size:28px_28px]" />
      </div>

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 md:grid-cols-2">
        <div>
          {/* Title with animated gradient shimmer */}
          <motion.h1
            {...fadeUp(0)}
            className="text-4xl font-semibold tracking-tight text-white md:text-6xl"
          >
            Real-time Road Intelligence{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-cyan-400 via-emerald-300 to-fuchsia-400 bg-clip-text text-transparent">
                on the edge
              </span>
              <motion.span
                aria-hidden
                initial={{ x: "-120%" }}
                animate={{ x: ["-120%", "120%"] }}
                transition={{ 
                  duration: 2.2, 
                  repeat: Infinity, 
                  ease: "easeInOut" as const 
                }}
                className="pointer-events-none absolute -inset-y-1 -inset-x-1 block bg-gradient-to-r from-transparent via-white/30 to-transparent [mask-image:linear-gradient(90deg,transparent,black,transparent)]"
              />
            </span>
            .
          </motion.h1>

          <motion.p
            {...fadeUp(0.12)}
            className="mt-4 text-lg text-white/70"
          >
            Low-latency audio understanding, hazard memory, and a generative co-pilot that speaks before trouble.
          </motion.p>

          {/* CTAs: real navigation + watch demo */}
          <motion.div {...fadeUp(0.2)}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <motion.button
                {...springTap}
                type="button"
                onClick={scrollToCopilot}
                className="rounded-lg bg-white px-4 py-2.5 font-medium text-slate-900 shadow hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                Try the Copilot
              </motion.button>

              <motion.div {...springTap}>
                <Link
                  href="/docs"
                  className="rounded-lg border border-white/20 px-4 py-2.5 text-white/90 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  Read the docs
                </Link>
              </motion.div>

              <motion.button
                {...springTap}
                onClick={scrollToBenchmark}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-2.5 text-emerald-200 hover:bg-emerald-400/15 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="-ml-0.5">
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
                Benchmark
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Right: glossy video embed with parallax float */}
        <motion.div
          style={{ y: floatY }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6, ease: "easeOut" as const }}
          ref={previewRef}
          className="relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-[0_10px_40px_-15px_rgba(0,0,0,.6)]"
        >
          <div className="mb-3 text-sm text-white/80">Copilot walkthrough</div>

          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 shadow-inner">
            <iframe
              title="Sonic Copilot demo walkthrough"
              src={YOUTUBE_EMBED_SRC}
              className="absolute inset-0 h-full w-full"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          <p className="mt-4 text-sm text-white/70">
            Watch how we layer sonic cues, hazard memory, and proactive co-pilot prompts into a single ride-along experience.
          </p>
        </motion.div>
      </div>
    </section>
  );
}