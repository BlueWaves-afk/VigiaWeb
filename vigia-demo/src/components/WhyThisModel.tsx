"use client";

import { motion } from "framer-motion";
import { Zap, Gauge, ShieldCheck } from "lucide-react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.4 },
  transition: { delay, duration: 0.6, ease: "easeOut" as const },
});

export default function WhyThisModel() {
  return (
    <section className="mt-20">
      <motion.div {...fadeUp(0)} className="mb-10 max-w-3xl">
        <p className="mb-3 text-xs font-medium tracking-[0.22em] text-cyan-400">
          MODEL SELECTION
        </p>
        <h3 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
          Why choose one model over another?
        </h3>
        <p className="mt-4 text-sm md:text-base leading-relaxed text-slate-400">
          Each model is optimized for a different deployment constraint.
          Benchmarks alone don’t tell the full story—context does.
        </p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* YOLO */}
        <motion.div
          {...fadeUp(0.1)}
          className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-6 backdrop-blur-md"
        >
          <IconWrap>
            <Zap className="h-4 w-4 text-amber-400" />
          </IconWrap>
          <h4 className="mt-4 text-sm font-semibold text-white">
            Simple YOLO
          </h4>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Best for rapid prototyping and ultra-low latency pipelines where
            detection speed matters more than precision.
          </p>

          <ul className="mt-4 space-y-2 text-sm text-slate-400">
            <li>• Lowest median latency</li>
            <li>• Minimal memory overhead</li>
            <li>• Ideal for edge & real-time streams</li>
          </ul>

          <div className="mt-4 text-xs font-medium text-amber-400">
            Choose when latency is king
          </div>
        </motion.div>

        {/* ARGUS */}
        <motion.div
          {...fadeUp(0.2)}
          className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-6 backdrop-blur-md"
        >
          <IconWrap>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </IconWrap>
          <h4 className="mt-4 text-sm font-semibold text-white">
            ARGUS v8x
          </h4>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Designed for production reliability where detection consistency
            and robustness outweigh raw speed.
          </p>

          <ul className="mt-4 space-y-2 text-sm text-slate-400">
            <li>• Tight latency variance</li>
            <li>• Stable across batch sizes</li>
            <li>• Production-grade confidence</li>
          </ul>

          <div className="mt-4 text-xs font-medium text-emerald-400">
            Choose for mission-critical systems
          </div>
        </motion.div>

        {/* UltraFace */}
        <motion.div
          {...fadeUp(0.3)}
          className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-6 backdrop-blur-md"
        >
          <IconWrap>
            <Gauge className="h-4 w-4 text-cyan-400" />
          </IconWrap>
          <h4 className="mt-4 text-sm font-semibold text-white">
            UltraFace
          </h4>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Balanced architecture offering higher throughput at the cost of
            increased memory usage.
          </p>

          <ul className="mt-4 space-y-2 text-sm text-slate-400">
            <li>• High throughput per batch</li>
            <li>• Scales well on CPUs</li>
            <li>• Best for batch inference</li>
          </ul>

          <div className="mt-4 text-xs font-medium text-cyan-400">
            Choose for offline or bulk processing
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function IconWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/60">
      {children}
    </div>
  );
}
