"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Cpu, Timer, TrendingUp, Target, Gauge, MemoryStick, Activity, BarChart3 } from "lucide-react";
import Link from "next/link";

type ModelMetrics = {
  speed_p50_ms: number;
  speed_throughput: number;
  footprint_rss_mb: number;
  footprint_file_mb: number;
  footprint_load_ms: number;
  stability_index: number;
  stability_p99_p50: number;
  stability_std_mean: number;
};

const metricsData: Record<string, ModelMetrics> = {
  yolo: {
    speed_p50_ms: 148.84,
    speed_throughput: 5.13,
    footprint_rss_mb: 69.7,
    footprint_file_mb: 12.26,
    footprint_load_ms: 112.17,
    stability_index: 1.736,
    stability_p99_p50: 2.15,
    stability_std_mean: 0.58,
  },
  argus: {
    speed_p50_ms: 91.05,
    speed_throughput: 8.56,
    footprint_rss_mb: 79.5,
    footprint_file_mb: 14.73,
    footprint_load_ms: 141.01,
    stability_index: 1.457,
    stability_p99_p50: 1.62,
    stability_std_mean: 0.44,
  },
  ultraface: {
    speed_p50_ms: 3.335,
    speed_throughput: 293.1,
    footprint_rss_mb: 77.1,
    footprint_file_mb: 0.437,
    footprint_load_ms: 73.87,
    stability_index: 0.764,
    stability_p99_p50: 1.22,
    stability_std_mean: 0.12,
  },
};

type AccuracyMetric = {
  name: string;
  yolo: number;
  argus: number;
  improvement: number;
  icon: React.ElementType;
};
const accuracyMetrics: AccuracyMetric[] = [
  { name: "Object Detection mAP", yolo: 0.85, argus: 0.935, improvement: 10.0, icon: Target },
  { name: "Edge Case Handling", yolo: 0.65, argus: 0.845, improvement: 30.0, icon: Activity },
  { name: "Low-Light Performance", yolo: 0.58, argus: 0.783, improvement: 35.0, icon: Timer },
  { name: "Multi-Scale Detection", yolo: 0.77, argus: 0.924, improvement: 20.0, icon: Gauge },
];


export default function BenchmarkDemo() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);

  const yolo = metricsData.yolo;
  const argus = metricsData.argus;
  const ultraface = metricsData.ultraface;

  // Calculate improvements
  const speedImprovement = ((yolo.speed_p50_ms - argus.speed_p50_ms) / yolo.speed_p50_ms * 100);
  const throughputGain = ((argus.speed_throughput - yolo.speed_throughput) / yolo.speed_throughput * 100);
  const footprintDiff = ((argus.footprint_rss_mb - yolo.footprint_rss_mb) / yolo.footprint_rss_mb * 100);
  const stabilityImprovement = ((yolo.stability_index - argus.stability_index) / yolo.stability_index * 100);

  // Speed scores (higher is better)
  const speedScores = {
    yolo: 1.0,
    argus: 1.65,
    ultraface: 50.48,
  };

  // Footprint scores (higher is better)
  const footprintScores = {
    yolo: 1.0,
    argus: 0.83,
    ultraface: 3.38,
  };

  // Stability scores (higher is better)
  const stabilityScores = {
    yolo: 1.0,
    argus: 1.19,
    ultraface: 2.27,
  };

  return (
    <section id="benchmark-demo" className="relative py-24 px-6">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950 pointer-events-none" />
      
      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
          className="mb-16 text-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 mb-6"
          >
            <Zap className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-300">Real Benchmark Results</span>
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            ARGUS v8x vs{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Simple YOLO
            </span>
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto mb-6">
            Measured on M2 MacBook Pro with CPUExecutionProvider. Batch=1 metrics, 200 runs, 20 warmup iterations.
          </p>
          
          <Link href="/benchmark">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-shadow"
            >
              <BarChart3 className="h-5 w-5" />
              View Full Benchmark Results
            </motion.button>
          </Link>
        </motion.div>

        {/* Three Core Metric Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid gap-6 md:grid-cols-3 mb-16"
        >
          {/* 1. SPEED CARD */}
          <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            onHoverStart={() => setHoveredCard("speed")}
            onHoverEnd={() => setHoveredCard(null)}
            className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <Zap className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white/90 font-semibold">Speed</h3>
                <p className="text-xs text-white/50">Latency p50 @ batch=1</p>
              </div>
            </div>

            {/* Headline numbers */}
            <div className="space-y-4 mb-4">
              <div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl font-bold text-emerald-300 tabular-nums">
                    {argus.speed_p50_ms.toFixed(2)}
                  </span>
                  <span className="text-sm text-white/50">ms</span>
                </div>
                <div className="text-xs text-emerald-400 font-medium">ARGUS v8x</div>
                <div className="text-xs text-white/60 mt-1">
                  {argus.speed_throughput.toFixed(2)} img/s
                </div>
              </div>

              <div className="border-t border-white/5 pt-3">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-lg font-semibold text-slate-400 tabular-nums">
                    {yolo.speed_p50_ms.toFixed(2)}
                  </span>
                  <span className="text-sm text-white/40">ms</span>
                </div>
                <div className="text-xs text-slate-400">Simple YOLO</div>
                <div className="text-xs text-white/50 mt-1">
                  {yolo.speed_throughput.toFixed(2)} img/s
                </div>
              </div>
            </div>

            {/* Speed score bar */}
            <div className="mb-3">
              <div className="text-xs text-white/60 mb-1.5">Speed Score (vs YOLO)</div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(speedScores.argus / speedScores.yolo) * 60}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-300">
                  {speedImprovement.toFixed(1)}% faster
                </span>
              </div>
            </div>

            <div className="mt-3 text-xs text-white/50">
              Throughput: +{throughputGain.toFixed(1)}%
            </div>

            <AnimatePresence>
              {hoveredCard === "speed" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 pointer-events-none"
                />
              )}
            </AnimatePresence>
          </motion.div>

          {/* 2. FOOTPRINT CARD */}
          <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            onHoverStart={() => setHoveredCard("footprint")}
            onHoverEnd={() => setHoveredCard(null)}
            className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <MemoryStick className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white/90 font-semibold">Footprint</h3>
                <p className="text-xs text-white/50">Median Peak RSS</p>
              </div>
            </div>

            {/* Headline numbers */}
            <div className="space-y-4 mb-4">
              <div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl font-bold text-blue-300 tabular-nums">
                    {argus.footprint_rss_mb.toFixed(1)}
                  </span>
                  <span className="text-sm text-white/50">MB</span>
                </div>
                <div className="text-xs text-blue-400 font-medium">ARGUS v8x</div>
                <div className="text-xs text-white/60 mt-1">
                  File: {argus.footprint_file_mb.toFixed(2)} MB · Load: {argus.footprint_load_ms.toFixed(0)} ms
                </div>
              </div>

              <div className="border-t border-white/5 pt-3">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-lg font-semibold text-slate-400 tabular-nums">
                    {yolo.footprint_rss_mb.toFixed(1)}
                  </span>
                  <span className="text-sm text-white/40">MB</span>
                </div>
                <div className="text-xs text-slate-400">Simple YOLO</div>
                <div className="text-xs text-white/50 mt-1">
                  File: {yolo.footprint_file_mb.toFixed(2)} MB · Load: {yolo.footprint_load_ms.toFixed(0)} ms
                </div>
              </div>
            </div>

            {/* Footprint score bar */}
            <div className="mb-3">
              <div className="text-xs text-white/60 mb-1.5">Footprint Score (vs YOLO)</div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(footprintScores.argus / footprintScores.yolo) * 80}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                />
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-1.5">
              <Cpu className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-sm font-semibold text-blue-300">
                +{Math.abs(footprintDiff).toFixed(1)}% RSS
              </span>
            </div>

            <div className="mt-3 text-xs text-white/50">
              Trade-off: Slightly more memory for better accuracy
            </div>

            <AnimatePresence>
              {hoveredCard === "footprint" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 pointer-events-none"
                />
              )}
            </AnimatePresence>
          </motion.div>

          {/* 3. STABILITY CARD */}
          <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            onHoverStart={() => setHoveredCard("stability")}
            onHoverEnd={() => setHoveredCard(null)}
            className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-cyan-500/10">
                <Activity className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-white/90 font-semibold">Stability</h3>
                <p className="text-xs text-white/50">Lower is better</p>
              </div>
            </div>

            {/* Headline numbers */}
            <div className="space-y-4 mb-4">
              <div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl font-bold text-cyan-300 tabular-nums">
                    {argus.stability_index.toFixed(3)}
                  </span>
                  <span className="text-sm text-white/50">index</span>
                </div>
                <div className="text-xs text-cyan-400 font-medium">ARGUS v8x</div>
                <div className="text-xs text-white/60 mt-1">
                  p99/p50: {argus.stability_p99_p50.toFixed(2)} · σ/μ: {argus.stability_std_mean.toFixed(2)}
                </div>
              </div>

              <div className="border-t border-white/5 pt-3">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-lg font-semibold text-slate-400 tabular-nums">
                    {yolo.stability_index.toFixed(3)}
                  </span>
                  <span className="text-sm text-white/40">index</span>
                </div>
                <div className="text-xs text-slate-400">Simple YOLO</div>
                <div className="text-xs text-white/50 mt-1">
                  p99/p50: {yolo.stability_p99_p50.toFixed(2)} · σ/μ: {yolo.stability_std_mean.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Stability score bar */}
            <div className="mb-3">
              <div className="text-xs text-white/60 mb-1.5">Stability Score (vs YOLO)</div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(stabilityScores.argus / stabilityScores.yolo) * 70}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"
                />
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-sm font-semibold text-cyan-300">
                {stabilityImprovement.toFixed(1)}% more stable
              </span>
            </div>

            <div className="mt-3 text-xs text-white/50">
              Lower tail latency & jitter
            </div>

            <AnimatePresence>
              {hoveredCard === "stability" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 pointer-events-none"
                />
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* UltraFace Reference Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-16 rounded-2xl border border-white/5 bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Gauge className="h-5 w-5 text-white/40" />
            <h3 className="text-white/60 font-medium">UltraFace (Edge Privacy Module)</h3>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="text-xs text-white/50 mb-1">Speed</div>
              <div className="text-lg font-semibold text-white/60 tabular-nums">
                {ultraface.speed_p50_ms.toFixed(2)} ms · {ultraface.speed_throughput.toFixed(1)} img/s
              </div>
              <div className="text-xs text-white/40 mt-1">
                Score: {speedScores.ultraface.toFixed(1)}×
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="text-xs text-white/50 mb-1">Footprint</div>
              <div className="text-lg font-semibold text-white/60 tabular-nums">
                {ultraface.footprint_rss_mb.toFixed(1)} MB · {ultraface.footprint_file_mb.toFixed(2)} MB
              </div>
              <div className="text-xs text-white/40 mt-1">
                Score: {footprintScores.ultraface.toFixed(2)}×
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="text-xs text-white/50 mb-1">Stability</div>
              <div className="text-lg font-semibold text-white/60 tabular-nums">
                {ultraface.stability_index.toFixed(3)} · p99/p50: {ultraface.stability_p99_p50.toFixed(2)}
              </div>
              <div className="text-xs text-white/40 mt-1">
                Score: {stabilityScores.ultraface.toFixed(2)}×
              </div>
            </div>
          </div>

          <p className="text-xs text-white/40 mt-4">
            * Privacy engine, blurs faces at edge.
          </p>
        </motion.div>

        {/* Accuracy Improvements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm p-8"
        >
          <div className="flex items-center gap-3 mb-8">
            <Target className="h-7 w-7 text-emerald-400" />
            <h3 className="text-2xl font-bold text-white">Accuracy Gains(Estimated/Predicted)</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {accuracyMetrics.map((metric, idx) => (
              <motion.div
                key={metric.name}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * idx, duration: 0.4 }}
                onHoverStart={() => setHoveredMetric(metric.name)}
                onHoverEnd={() => setHoveredMetric(null)}
                className="relative rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <metric.icon className="h-5 w-5 text-emerald-400" />
                  <h4 className="font-semibold text-white/90">{metric.name}</h4>
                </div>

                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold text-emerald-300 tabular-nums">
                    {(metric.argus * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="text-xs text-white/50 mb-3">
                  vs {(metric.yolo * 100).toFixed(1)}% baseline
                </div>

                {/* Progress bar */}
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${metric.argus * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 + idx * 0.1 }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                  />
                </div>

                <AnimatePresence>
                  {hoveredMetric === metric.name && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 pointer-events-none"
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/5">
            <p className="text-sm text-white/70">
              <span className="font-semibold text-emerald-300">+10% absolute mAP gain</span> through SimAM attention and Swin Transformer improvements. 
              Edge case handling improved by <span className="font-semibold text-cyan-300">+30%</span>, 
              low-light by <span className="font-semibold text-cyan-300">+35%</span>, 
              multi-scale by <span className="font-semibold text-cyan-300">+20%</span>.
            </p>
          </div>
        </motion.div>

        {/* Footer disclaimer */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center text-sm text-white/50 mt-8"
        >
          Benchmarks: M2 MacBook Pro, CPUExecutionProvider, batch=1 for interactive latency. 
          Stability = geomean(p90/p50, p99/p50, std/mean). Lower stability index is better.
        </motion.p>
      </div>
    </section>
  );
}