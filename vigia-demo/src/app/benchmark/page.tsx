"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Zap,
  MemoryStick,
  Gauge,
  Timer,
  TrendingUp,
  TrendingDown,
  Activity,
  HardDrive,
  Cpu,
  BarChart3,
  LineChart,
  Filter,
} from "lucide-react";
import Link from "next/link";
import benchResults from "../../../public/data/bench_results.json";

type BenchmarkResult = {
  model: string;
  batch: number;
  file_size_bytes: number;
  load_time_ms: number;
  p50_ms: number;
  p90_ms: number;
  p99_ms: number;
  mean_ms: number;
  std_ms: number;
  throughput_img_per_s: number;
  proc_peak_rss_bytes: number;
  provider: string[];
  n_runs: number;
  warmup: number;
};

const modelNames: Record<string, string> = {
  yolo: "Simple YOLO",
  argus_v8x: "ARGUS v8x",
  ultraface: "UltraFace",
};

const modelColors: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
  yolo: {
    bg: "bg-slate-500/10",
    border: "border-slate-500/30",
    text: "text-slate-400",
    gradient: "from-slate-500 to-slate-600",
  },
  argus_v8x: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    gradient: "from-emerald-500 to-cyan-500",
  },
  ultraface: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    text: "text-purple-400",
    gradient: "from-purple-500 to-pink-500",
  },
};

export default function BenchmarkPage() {
  const [selectedBatch, setSelectedBatch] = useState<number | "all">("all");
  const [selectedModel, setSelectedModel] = useState<string | "all">("all");
  const [sortBy, setSortBy] = useState<"p50" | "throughput" | "memory">("p50");

  // Process and filter data
  const filteredResults = useMemo(() => {
    let results = benchResults as BenchmarkResult[];
    
    if (selectedBatch !== "all") {
      results = results.filter((r) => r.batch === selectedBatch);
    }
    
    if (selectedModel !== "all") {
      results = results.filter((r) => r.model === selectedModel);
    }

    // Sort results
    results = [...results].sort((a, b) => {
      if (sortBy === "p50") return a.p50_ms - b.p50_ms;
      if (sortBy === "throughput") return b.throughput_img_per_s - a.throughput_img_per_s;
      return a.proc_peak_rss_bytes - b.proc_peak_rss_bytes;
    });

    return results;
  }, [selectedBatch, selectedModel, sortBy]);

  // Calculate statistics
  const stats = useMemo(() => {
    const byModel = benchResults.reduce((acc, result) => {
      if (!acc[result.model]) {
        acc[result.model] = {
          avgP50: 0,
          avgThroughput: 0,
          avgMemory: 0,
          count: 0,
          fileSize: result.file_size_bytes,
          loadTime: result.load_time_ms,
        };
      }
      acc[result.model].avgP50 += result.p50_ms;
      acc[result.model].avgThroughput += result.throughput_img_per_s;
      acc[result.model].avgMemory += result.proc_peak_rss_bytes;
      acc[result.model].count += 1;
      return acc;
    }, {} as Record<string, any>);

    Object.keys(byModel).forEach((model) => {
      const count = byModel[model].count;
      byModel[model].avgP50 /= count;
      byModel[model].avgThroughput /= count;
      byModel[model].avgMemory /= count;
    });

    return byModel;
  }, []);

  const formatBytes = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2);
  };

  const formatMs = (ms: number) => {
    return ms.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.05, x: -4 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </motion.button>
            </Link>

            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-emerald-400" />
              <h1 className="text-xl font-bold text-white">Full Benchmark Results</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        {/* Overview Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h2 className="mb-6 text-3xl font-bold text-white">Model Overview</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {Object.entries(stats).map(([model, data], idx) => {
              const colors = modelColors[model];
              return (
                <motion.div
                  key={model}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1, duration: 0.4 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className={`rounded-2xl border ${colors.border} ${colors.bg} backdrop-blur-sm p-6`}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">{modelNames[model]}</h3>
                    <Cpu className={`h-6 w-6 ${colors.text}`} />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-white/50" />
                        <span className="text-sm text-white/60">Avg p50</span>
                      </div>
                      <span className="font-semibold text-white tabular-nums">
                        {formatMs(data.avgP50)} ms
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-white/50" />
                        <span className="text-sm text-white/60">Avg Throughput</span>
                      </div>
                      <span className="font-semibold text-white tabular-nums">
                        {formatMs(data.avgThroughput)} img/s
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MemoryStick className="h-4 w-4 text-white/50" />
                        <span className="text-sm text-white/60">Avg Memory</span>
                      </div>
                      <span className="font-semibold text-white tabular-nums">
                        {formatBytes(data.avgMemory)} MB
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/10 pt-3">
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-white/50" />
                        <span className="text-sm text-white/60">File Size</span>
                      </div>
                      <span className="font-semibold text-white tabular-nums">
                        {formatBytes(data.fileSize)} MB
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-8 rounded-2xl border border-white/10 bg-slate-800/40 backdrop-blur-sm p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <Filter className="h-5 w-5 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">Filter & Sort</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Batch Filter */}
            <div>
              <label className="mb-2 block text-sm text-white/60">Batch Size</label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value === "all" ? "all" : Number(e.target.value))}
                className="w-full rounded-lg border border-white/10 bg-slate-900/50 px-4 py-2 text-white focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="all">All Batches</option>
                <option value={1}>Batch 1</option>
                <option value={2}>Batch 2</option>
                <option value={4}>Batch 4</option>
                <option value={8}>Batch 8</option>
              </select>
            </div>

            {/* Model Filter */}
            <div>
              <label className="mb-2 block text-sm text-white/60">Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-900/50 px-4 py-2 text-white focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="all">All Models</option>
                <option value="yolo">Simple YOLO</option>
                <option value="argus_v8x">ARGUS v8x</option>
                <option value="ultraface">UltraFace</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="mb-2 block text-sm text-white/60">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full rounded-lg border border-white/10 bg-slate-900/50 px-4 py-2 text-white focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="p50">Latency (p50)</option>
                <option value="throughput">Throughput</option>
                <option value="memory">Memory Usage</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Results Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="rounded-2xl border border-white/10 bg-slate-800/40 backdrop-blur-sm overflow-hidden"
        >
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Detailed Results</h3>
              <span className="text-sm text-white/60">
                {filteredResults.length} result{filteredResults.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10 bg-slate-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/80">Model</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/80">Batch</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-white/80">p50 (ms)</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-white/80">p90 (ms)</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-white/80">p99 (ms)</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-white/80">Mean (ms)</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-white/80">Std (ms)</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-white/80">Throughput</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-white/80">Peak RSS</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="wait">
                  {filteredResults.map((result, idx) => {
                    const colors = modelColors[result.model];
                    return (
                      <motion.tr
                        key={`${result.model}-${result.batch}-${idx}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: idx * 0.02, duration: 0.3 }}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full bg-gradient-to-r ${colors.gradient}`} />
                            <span className={`font-medium ${colors.text}`}>
                              {modelNames[result.model]}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded-md bg-white/5 px-2 py-1 text-sm text-white/80 tabular-nums">
                            {result.batch}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-white/90 tabular-nums">
                          {formatMs(result.p50_ms)}
                        </td>
                        <td className="px-6 py-4 text-right text-white/90 tabular-nums">
                          {formatMs(result.p90_ms)}
                        </td>
                        <td className="px-6 py-4 text-right text-white/90 tabular-nums">
                          {formatMs(result.p99_ms)}
                        </td>
                        <td className="px-6 py-4 text-right text-white/90 tabular-nums">
                          {formatMs(result.mean_ms)}
                        </td>
                        <td className="px-6 py-4 text-right text-white/70 tabular-nums">
                          {formatMs(result.std_ms)}
                        </td>
                        <td className="px-6 py-4 text-right text-emerald-400 font-semibold tabular-nums">
                          {formatMs(result.throughput_img_per_s)} img/s
                        </td>
                        <td className="px-6 py-4 text-right text-blue-400 font-semibold tabular-nums">
                          {formatBytes(result.proc_peak_rss_bytes)} MB
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {filteredResults.length === 0 && (
            <div className="py-12 text-center">
              <LineChart className="mx-auto h-12 w-12 text-white/20 mb-4" />
              <p className="text-white/50">No results match the current filters</p>
            </div>
          )}
        </motion.div>

        {/* Benchmark Metadata */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-8 rounded-2xl border border-white/10 bg-slate-800/40 backdrop-blur-sm p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Benchmark Configuration</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-white/5 p-4">
              <div className="mb-1 text-xs text-white/50">Execution Provider</div>
              <div className="font-semibold text-white">CPUExecutionProvider</div>
            </div>
            <div className="rounded-lg bg-white/5 p-4">
              <div className="mb-1 text-xs text-white/50">Runs per Config</div>
              <div className="font-semibold text-white tabular-nums">200</div>
            </div>
            <div className="rounded-lg bg-white/5 p-4">
              <div className="mb-1 text-xs text-white/50">Warmup Iterations</div>
              <div className="font-semibold text-white tabular-nums">20</div>
            </div>
            <div className="rounded-lg bg-white/5 p-4">
              <div className="mb-1 text-xs text-white/50">Platform</div>
              <div className="font-semibold text-white">M2 MacBook Pro</div>
            </div>
          </div>
        </motion.div>

        {/* Footer Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="mt-8 text-center text-sm text-white/50"
        >
          Benchmark metrics are measured using ONNX Runtime with CPU execution provider.
          Results may vary based on hardware configuration and system load.
        </motion.p>
      </main>
    </div>
  );
}
