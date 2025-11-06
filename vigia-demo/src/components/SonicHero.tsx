"use client";

import { motion, useAnimation, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";

/* ---------- Tiny reactive bars ---------- */
function Bars({ playing }: { playing: boolean }) {
  const [vals, setVals] = useState<number[]>(
    Array.from({ length: 24 }, (_, i) => (i % 5) + 2)
  );

  useEffect(() => {
    if (!playing) return;
    let raf: number;
    const tick = () => {
      // bell-shaped falloff from center for a nicer look
      setVals(v =>
        v.map((_, i) => {
          const d = Math.abs(i - 12) / 12;
          const env = Math.exp(-d * 2.2); // tighter center
          return 2 + Math.floor(10 * Math.random() * env);
        })
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  return (
    <div className="flex h-28 items-end gap-[6px]">
      {vals.map((h, i) => (
        <div
          key={i}
          className="w-1.5 rounded-t-full bg-gradient-to-t from-sky-400 via-cyan-300 to-white will-change-transform"
          style={{
            height: `${10 + h * 6}px`,
            transition: "height .12s ease, transform .12s ease",
            transform: `translateY(${Math.sin(i * 0.6) * -1}px)`,
          }}
        />
      ))}
    </div>
  );
}

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

export default function SonicHero() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const controls = useAnimation();

  // Subtle parallax float for the right card as the user scrolls
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });
  const floatY = useTransform(scrollYProgress, [0, 1], [0, 18]);

  // Keyboard: Space toggles
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) { 
      void a.play(); 
      setPlaying(true); 
    }
    else { 
      a.pause(); 
      setPlaying(false); 
    }
  };

  const watchDemo = async () => {
    // Scroll into view and auto-play
    previewRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    const a = audioRef.current;
    if (a && a.paused) {
      try { 
        await a.play(); 
        setPlaying(true); 
      } catch {}
    }
    // Brief pulse animation on the card
    controls.start({ 
      boxShadow: "0 0 0 0 rgba(59,130,246,0)", 
      transition: { duration: 0 } 
    })
      .then(() =>
        controls.start({
          boxShadow: [
            "0 0 0 0 rgba(59,130,246,0.00)",
            "0 0 0 14px rgba(59,130,246,0.10)",
            "0 0 0 0 rgba(59,130,246,0.00)",
          ],
          transition: { 
            times: [0, 0.5, 1], 
            duration: 0.9, 
            ease: "easeOut" as const 
          },
        })
      );
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
              <motion.div {...springTap}>
                <Link
                  href="/copilot"
                  className="rounded-lg bg-white px-4 py-2.5 font-medium text-slate-900 shadow hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  Try the Copilot
                </Link>
              </motion.div>

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
                onClick={watchDemo}
                className="inline-flex items-center gap-2 rounded-lg border border-sky-400/30 bg-sky-400/10 px-4 py-2.5 text-sky-200 hover:bg-sky-400/15 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" className="-ml-0.5">
                  <path fill="currentColor" d="M8 5v14l11-7z" />
                </svg>
                Watch demo
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Right: glossy player + bars with parallax float */}
        <motion.div
          style={{ y: floatY }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6, ease: "easeOut" as const }}
          ref={previewRef}
          className="relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-[0_10px_40px_-15px_rgba(0,0,0,.6)]"
        >
          <div className="mb-3 text-sm text-white/80">Live detection preview</div>

          <div className="rounded-xl border border-white/10 bg-black/30 p-6">
            <Bars playing={playing} />
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-white/70">
              Edge model • <span className="tabular-nums">12 ms</span> avg latency
            </div>
            <motion.button
              {...springTap}
              onClick={toggle}
              aria-pressed={playing}
              className={clsx(
                "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium focus:outline-none",
                playing
                  ? "border border-red-300/30 bg-red-500/20 text-red-300 focus:ring-2 focus:ring-red-400/30"
                  : "border border-emerald-300/30 bg-emerald-500/20 text-emerald-300 focus:ring-2 focus:ring-emerald-400/30"
              )}
              title={playing ? "Pause demo (Space)" : "Play demo (Space)"}
            >
              {playing ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M6 5h4v14H6zM14 5h4v14h-4z" />
                  </svg>
                  Pause
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M8 5v14l11-7z" />
                  </svg>
                  Play
                </>
              )}
              demo
            </motion.button>
          </div>
          <audio ref={audioRef} src="/audio/demo.mp3" preload="auto" />
        </motion.div>
      </div>
    </section>
  );
}