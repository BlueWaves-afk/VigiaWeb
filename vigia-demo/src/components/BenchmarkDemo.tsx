"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  Cpu,
  Timer,
  TrendingUp,
  Target,
  Gauge,
  MemoryStick,
  Activity,
  BarChart3,
} from "lucide-react";
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
  {
    name: "Object Detection mAP",
    yolo: 0.85,
    argus: 0.935,
    improvement: 10.0,
    icon: Target,
  },
  {
    name: "Edge Case Handling",
    yolo: 0.65,
    argus: 0.845,
    improvement: 30.0,
    icon: Activity,
  },
  {
    name: "Low-Light Performance",
    yolo: 0.58,
    argus: 0.783,
    improvement: 35.0,
    icon: Timer,
  },
  {
    name: "Multi-Scale Detection",
    yolo: 0.77,
    argus: 0.924,
    improvement: 20.0,
    icon: Gauge,
  },
];

export default function BenchmarkDemo() {
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);

  const yolo = metricsData.yolo;
  const argus = metricsData.argus;
  const ultraface = metricsData.ultraface;

  const speedImprovement =
    ((yolo.speed_p50_ms - argus.speed_p50_ms) / yolo.speed_p50_ms) * 100;
  const throughputGain =
    ((argus.speed_throughput - yolo.speed_throughput) /
      yolo.speed_throughput) *
    100;
  const footprintDiff =
    ((argus.footprint_rss_mb - yolo.footprint_rss_mb) /
      yolo.footprint_rss_mb) *
    100;
  const stabilityImprovement =
    ((yolo.stability_index - argus.stability_index) /
      yolo.stability_index) *
    100;

  const speedScores = {
    yolo: 1.0,
    argus: 1.65,
    ultraface: 50.48,
  };

  const footprintScores = {
    yolo: 1.0,
    argus: 0.83,
    ultraface: 3.38,
  };

  const stabilityScores = {
    yolo: 1.0,
    argus: 1.19,
    ultraface: 2.27,
  };

  return (
    <section id="benchmark-demo" className="relative py-24 lg:py-28">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header, aligned with other sections */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-10 text-center"
        >
          <p className="mb-3 text-xs font-medium tracking-[0.22em] text-cyan-400 light:text-blue-600">
            BENCHMARKS
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl lg:text-5xl light:text-slate-900">
            ARGUS v8x vs{" "}
            <span className="text-cyan-400 light:text-cyan-600">
              Simple YOLO
            </span>
          </h2>
          <p className="mt-4 text-sm md:text-base leading-relaxed text-slate-400 light:text-slate-600 max-w-2xl mx-auto">
            Measured on M2 MacBook Pro with CPUExecutionProvider.
            Batch=1, 200 runs, 20 warmup iterations.
          </p>

          <div className="mt-6">
            <Link href="/benchmark">
              <motion.button
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.96 }}
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/25 hover:bg-slate-100 light:bg-slate-900 light:text-white light:hover:bg-slate-800"
              >
                <BarChart3 className="h-4 w-4" />
                View full benchmark results
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Main card containing all benchmark content */}
        <div className="card-glass border-slate-800/60 bg-slate-950/80 p-6 md:p-10 light:border-slate-200 light:bg-white">
          {/* Three core metric cards */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5 }}
            className="grid gap-6 md:grid-cols-3"
          >
            {/* Speed */}
            <div className="rounded-xl border border-slate-800/70 bg-slate-950/70 p-6 light:border-slate-200 light:bg-slate-50">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-emerald-500/10 p-3">
                  <Zap className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white light:text-slate-900">
                    Speed
                  </div>
                  <div className="text-[11px] text-slate-400 light:text-slate-600">
                    Latency p50 @ batch=1
                  </div>
                </div>
              </div>

              <div className="mb-4 space-y-4">
                <div>
                  <div className="mb-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-emerald-300 tabular-nums light:text-emerald-600">
                      {argus.speed_p50_ms.toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-400">ms</span>
                  </div>
                  <div className="text-[11px] font-medium text-emerald-400 light:text-emerald-700">
                    ARGUS v8x
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400 light:text-slate-600">
                    {argus.speed_throughput.toFixed(2)} img/s
                  </div>
                </div>

                <div className="border-t border-slate-800/60 pt-3 light:border-slate-200">
                  <div className="mb-1 flex items-baseline gap-2">
                    <span className="text-lg font-semibold text-slate-400 tabular-nums light:text-slate-600">
                      {yolo.speed_p50_ms.toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-500">ms</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Simple YOLO</div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    {yolo.speed_throughput.toFixed(2)} img/s
                  </div>
                </div>
              </div>

              <div className="mb-2">
                <div className="mb-1 text-[11px] text-slate-400">
                  Speed score (vs YOLO)
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-800/80 light:bg-slate-200">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{
                      width: `${(speedScores.argus / speedScores.yolo) * 60}%`,
                    }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                  />
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 light:border-emerald-200 light:bg-emerald-50 light:text-emerald-700">
                <TrendingUp className="h-3.5 w-3.5" />
                {speedImprovement.toFixed(1)}% faster
              </div>

              <div className="mt-2 text-[11px] text-slate-500">
                Throughput: +{throughputGain.toFixed(1)}%
              </div>
            </div>

            {/* Footprint */}
            <div className="rounded-xl border border-slate-800/70 bg-slate-950/70 p-6 light:border-slate-200 light:bg-slate-50">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-blue-500/10 p-3">
                  <MemoryStick className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white light:text-slate-900">
                    Footprint
                  </div>
                  <div className="text-[11px] text-slate-400 light:text-slate-600">
                    Median peak RSS
                  </div>
                </div>
              </div>

              <div className="mb-4 space-y-4">
                <div>
                  <div className="mb-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-blue-300 tabular-nums light:text-blue-700">
                      {argus.footprint_rss_mb.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-400">MB</span>
                  </div>
                  <div className="text-[11px] font-medium text-blue-400 light:text-blue-700">
                    ARGUS v8x
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400 light:text-slate-600">
                    File: {argus.footprint_file_mb.toFixed(2)} MB · Load:{" "}
                    {argus.footprint_load_ms.toFixed(0)} ms
                  </div>
                </div>

                <div className="border-t border-slate-800/60 pt-3 light:border-slate-200">
                  <div className="mb-1 flex items-baseline gap-2">
                    <span className="text-lg font-semibold text-slate-400 tabular-nums light:text-slate-600">
                      {yolo.footprint_rss_mb.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-500">MB</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Simple YOLO</div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    File: {yolo.footprint_file_mb.toFixed(2)} MB · Load:{" "}
                    {yolo.footprint_load_ms.toFixed(0)} ms
                  </div>
                </div>
              </div>

              <div className="mb-2">
                <div className="mb-1 text-[11px] text-slate-400">
                  Footprint score (vs YOLO)
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-800/80 light:bg-slate-200">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{
                      width: `${(footprintScores.argus / footprintScores.yolo) * 80}%`,
                    }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                  />
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-[11px] font-semibold text-blue-300 light:border-blue-200 light:bg-blue-50 light:text-blue-700">
                <Cpu className="h-3.5 w-3.5" />
                +{Math.abs(footprintDiff).toFixed(1)}% RSS
              </div>

              <div className="mt-2 text-[11px] text-slate-500">
                Trade‑off: modest memory increase for better accuracy.
              </div>
            </div>

            {/* Stability */}
            <div className="rounded-xl border border-slate-800/70 bg-slate-950/70 p-6 light:border-slate-200 light:bg-slate-50">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-cyan-500/10 p-3">
                  <Activity className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white light:text-slate-900">
                    Stability
                  </div>
                  <div className="text-[11px] text-slate-400 light:text-slate-600">
                    Lower index is better
                  </div>
                </div>
              </div>

              <div className="mb-4 space-y-4">
                <div>
                  <div className="mb-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-cyan-300 tabular-nums light:text-cyan-700">
                      {argus.stability_index.toFixed(3)}
                    </span>
                    <span className="text-xs text-slate-400">index</span>
                  </div>
                  <div className="text-[11px] font-medium text-cyan-400 light:text-cyan-700">
                    ARGUS v8x
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400 light:text-slate-600">
                    p99/p50: {argus.stability_p99_p50.toFixed(2)} · σ/μ:{" "}
                    {argus.stability_std_mean.toFixed(2)}
                  </div>
                </div>

                <div className="border-t border-slate-800/60 pt-3 light:border-slate-200">
                  <div className="mb-1 flex items-baseline gap-2">
                    <span className="text-lg font-semibold text-slate-400 tabular-nums light:text-slate-600">
                      {yolo.stability_index.toFixed(3)}
                    </span>
                    <span className="text-xs text-slate-500">index</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Simple YOLO</div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    p99/p50: {yolo.stability_p99_p50.toFixed(2)} · σ/μ:{" "}
                    {yolo.stability_std_mean.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="mb-2">
                <div className="mb-1 text-[11px] text-slate-400">
                  Stability score (vs YOLO)
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-800/80 light:bg-slate-200">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{
                      width: `${(stabilityScores.argus / stabilityScores.yolo) * 70}%`,
                    }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                  />
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-[11px] font-semibold text-cyan-300 light:border-cyan-200 light:bg-cyan-50 light:text-cyan-700">
                <TrendingUp className="h-3.5 w-3.5" />
                {stabilityImprovement.toFixed(1)}% more stable
              </div>

              <div className="mt-2 text-[11px] text-slate-500">
                Lower tail latency &amp; jitter across runs.
              </div>
            </div>
          </motion.div>

          {/* UltraFace reference */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-10 rounded-xl border border-slate-800/70 bg-slate-950/70 p-5 md:p-6 light:border-slate-200 light:bg-slate-50"
          >
            <div className="mb-4 flex items-center gap-2">
              <Gauge className="h-4 w-4 text-slate-300 light:text-slate-600" />
              <div className="text-sm font-semibold text-slate-200 light:text-slate-800">
                UltraFace (edge privacy module)
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3 text-xs">
              <div className="rounded-lg bg-black/20 p-3 light:bg-slate-100">
                <div className="mb-1 text-[11px] text-slate-400">Speed</div>
                <div className="text-sm font-semibold text-slate-100 light:text-slate-800">
                  {ultraface.speed_p50_ms.toFixed(2)} ms ·{" "}
                  {ultraface.speed_throughput.toFixed(1)} img/s
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  Score: {speedScores.ultraface.toFixed(1)}×
                </div>
              </div>
              <div className="rounded-lg bg-black/20 p-3 light:bg-slate-100">
                <div className="mb-1 text-[11px] text-slate-400">
                  Footprint
                </div>
                <div className="text-sm font-semibold text-slate-100 light:text-slate-800">
                  {ultraface.footprint_rss_mb.toFixed(1)} MB ·{" "}
                  {ultraface.footprint_file_mb.toFixed(3)} MB
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  Score: {footprintScores.ultraface.toFixed(2)}×
                </div>
              </div>
              <div className="rounded-lg bg-black/20 p-3 light:bg-slate-100">
                <div className="mb-1 text-[11px] text-slate-400">
                  Stability
                </div>
                <div className="text-sm font-semibold text-slate-100 light:text-slate-800">
                  {ultraface.stability_index.toFixed(3)} · p99/p50:{" "}
                  {ultraface.stability_p99_p50.toFixed(2)}
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  Score: {stabilityScores.ultraface.toFixed(2)}×
                </div>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-slate-500">
              * Privacy engine, blurs faces at edge.
            </p>
          </motion.div>

          {/* Accuracy gains */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-10 rounded-xl border border-slate-800/70 bg-slate-950/70 p-6 light:border-slate-200 light:bg-slate-50"
          >
            <div className="mb-5 flex items-center gap-2">
              <Target className="h-5 w-5 text-emerald-400" />
              <h3 className="text-sm md:text-base font-semibold text-white light:text-slate-900">
                Accuracy gains (estimated / predicted)
              </h3>
            </div>

            <div className="grid gap-4 md:grid-cols-4 text-xs">
              {accuracyMetrics.map((metric, idx) => (
                <motion.div
                  key={metric.name}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08, duration: 0.4 }}
                  onHoverStart={() => setHoveredMetric(metric.name)}
                  onHoverEnd={() => setHoveredMetric(null)}
                  className="rounded-lg border border-slate-800/70 bg-slate-950/70 p-4 light:border-slate-200 light:bg-slate-50"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <metric.icon className="h-4 w-4 text-emerald-400" />
                    <div className="text-[11px] font-medium text-slate-100 light:text-slate-900">
                      {metric.name}
                    </div>
                  </div>
                  <div className="mb-1 flex items-baseline gap-1">
                    <span className="text-lg font-semibold text-emerald-300 tabular-nums light:text-emerald-700">
                      {(metric.argus * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="mb-2 text-[11px] text-slate-500">
                    vs {(metric.yolo * 100).toFixed(1)}% baseline
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-800/80 light:bg-slate-200">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{
                        width: `${metric.argus * 100}%`,
                      }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.8,
                        ease: "easeOut",
                        delay: 0.1 + idx * 0.05,
                      }}
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-5 rounded-lg bg-black/30 p-4 text-[11px] text-slate-300 light:bg-slate-100 light:text-slate-700">
              <span className="font-semibold text-emerald-300 light:text-emerald-700">
                +10% absolute mAP gain
              </span>{" "}
              through SimAM attention and Swin Transformer improvements. Edge
              case handling improves by{" "}
              <span className="font-semibold text-cyan-300 light:text-cyan-700">
                +30%
              </span>
              , low‑light by{" "}
              <span className="font-semibold text-cyan-300 light:text-cyan-700">
                +35%
              </span>
              , and multi‑scale by{" "}
              <span className="font-semibold text-cyan-300 light:text-cyan-700">
                +20%
              </span>
              .
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="mt-6 text-center text-[11px] text-slate-500"
          >
            Benchmarks: M2 MacBook Pro, CPUExecutionProvider, batch=1. Stability
            = geomean(p90/p50, p99/p50, std/mean). Lower stability index is
            better.
          </motion.p>
        </div>
      </div>
    </section>
  );
}