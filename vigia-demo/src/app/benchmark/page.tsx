"use client";

import { motion } from "framer-motion";
import { Cpu, Timer, Gauge, MemoryStick } from "lucide-react";
import benchResults from "../../../public/data/bench_results.json";
import WhyThisModel from "@/components/WhyThisModel";


const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.4 },
  transition: { delay, duration: 0.6, ease: "easeOut" as const },
});

const modelNames: Record<string, string> = {
  yolo: "Simple YOLO",
  argus_v8x: "ARGUS v8x",
  ultraface: "UltraFace",
};

export default function BenchmarkShowcase() {
  const stats = Object.values(
    benchResults.reduce((acc: any, r: any) => {
      if (!acc[r.model]) {
        acc[r.model] = {
          model: r.model,
          p50: 0,
          throughput: 0,
          memory: 0,
          count: 0,
        };
      }
      acc[r.model].p50 += r.p50_ms;
      acc[r.model].throughput += r.throughput_img_per_s;
      acc[r.model].memory += r.proc_peak_rss_bytes;
      acc[r.model].count++;
      return acc;
    }, {})
  ).map((m: any) => ({
    ...m,
    p50: m.p50 / m.count,
    throughput: m.throughput / m.count,
    memory: m.memory / m.count / 1024 / 1024,
  }));

  return (
    <section className="relative py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div {...fadeUp(0)} className="mb-12 max-w-3xl">
          <p className="mb-3 text-xs font-medium tracking-[0.22em] text-cyan-400">
            PERFORMANCE
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl lg:text-5xl">
            Benchmarking built for{" "}
            <span className="text-cyan-400">real-world inference.</span>
          </h2>
          <p className="mt-4 max-w-xl text-sm md:text-base leading-relaxed text-slate-400">
            We benchmark every detection model under identical conditions—
            measuring latency, throughput, and memory to surface trade-offs that
            matter in production.
          </p>
        </motion.div>

        {/* Summary cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {stats.map((m, i) => (
            <motion.div
              key={m.model}
              {...fadeUp(0.1 + i * 0.1)}
              className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-6 backdrop-blur-md"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/60">
                  <Cpu className="h-4 w-4 text-cyan-400" />
                </div>
                <h4 className="text-sm font-semibold text-white">
                  {modelNames[m.model]}
                </h4>
              </div>

              <div className="space-y-3 text-sm text-slate-400">
                <Metric
                  icon={<Timer className="h-4 w-4" />}
                  label="Median latency (p50)"
                  value={`${m.p50.toFixed(1)} ms`}
                />
                <Metric
                  icon={<Gauge className="h-4 w-4" />}
                  label="Throughput"
                  value={`${m.throughput.toFixed(1)} img/s`}
                />
                <Metric
                  icon={<MemoryStick className="h-4 w-4" />}
                  label="Peak memory"
                  value={`${m.memory.toFixed(1)} MB`}
                />
              </div>
            </motion.div>
          ))}
        </div>
        import WhyThisModel from "@/components/WhyThisModel";
          
          

        {/* Table */}
        <motion.div
          {...fadeUp(0.4)}
          className="mt-14 overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-950/70 backdrop-blur-md"
        >
          <div className="border-b border-slate-800/60 px-6 py-4">
            <h3 className="text-sm font-semibold text-white">
              Detailed benchmark runs
            </h3>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-slate-900/40 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3 text-left">Model</th>
                <th className="px-6 py-3 text-right">Batch</th>
                <th className="px-6 py-3 text-right">p50</th>
                <th className="px-6 py-3 text-right">p90</th>
                <th className="px-6 py-3 text-right">Throughput</th>
                <th className="px-6 py-3 text-right">Memory</th>
              </tr>
            </thead>
            <tbody>
              {benchResults.map((r: any, i: number) => (
                <tr
                  key={i}
                  className="border-t border-slate-800/40 text-slate-300"
                >
                  <td className="px-6 py-4 font-medium text-white">
                    {modelNames[r.model]}
                  </td>
                  <td className="px-6 py-4 text-right">{r.batch}</td>
                  <td className="px-6 py-4 text-right">
                    {r.p50_ms.toFixed(1)} ms
                  </td>
                  <td className="px-6 py-4 text-right">
                    {r.p90_ms.toFixed(1)} ms
                  </td>
                  <td className="px-6 py-4 text-right text-cyan-400">
                    {r.throughput_img_per_s.toFixed(1)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {(r.proc_peak_rss_bytes / 1024 / 1024).toFixed(1)} MB
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-slate-500">{icon}</span>
        <span>{label}</span>
      </div>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

