// src/app/docs/page.tsx
"use client";

import Link from "next/link";
import PageShell from "@/components/PageShell";
import DocsTOC from "@/components/DocsTOC";
import { motion } from "framer-motion";
import { useCallback } from "react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.6, ease: "easeOut" as const },
});

const springTap = {
  whileHover: { 
    y: -2, 
    scale: 1.02, 
    transition: { 
      type: "spring" as const, 
      stiffness: 400, 
      damping: 25 
    } 
  },
  whileTap: { scale: 0.98, y: 0 },
};

function CodeBlock({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.pre
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-4 sm:p-6 overflow-auto font-mono text-[13px] sm:text-sm leading-relaxed backdrop-blur-lg ${className}`}
    >
      {children}
    </motion.pre>
  );
}

function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/70 p-5 sm:p-6 backdrop-blur-lg"
    >
      {children}
    </motion.div>
  );
}

export default function DocsPage() {
  // Keep these ids in sync with section id="" attributes below
  const sections = [
    { id: "overview",      title: "Overview" },
    { id: "why",           title: "Why" },
    { id: "features",      title: "What you get" },
    { id: "installation",  title: "Installation" },
    { id: "quickstart",    title: "Quick start" },
    { id: "scales",        title: "Model scales" },
    { id: "performance",   title: "Performance guidance" },
    { id: "design",        title: "Design choices" },
    { id: "compatibility", title: "Compatibility" },
    { id: "roadmap",       title: "Roadmap" },
    { id: "license",       title: "License & notes" },
  ];

  const quickActions = [
    {
      href: "#installation",
      title: "Install",
      blurb: "Get started with CUDA PyTorch & plugin",
    },
    {
      href: "#quickstart",
      title: "Train",
      blurb: "Quick start training & export guide",
    },
    {
      href: "#performance",
      title: "Deploy",
      blurb: "Performance targets & optimization tips",
    },
  ];

  const scrollToSection = useCallback((id: string) => {
    if (typeof window === "undefined") return;
    const target = document.getElementById(id);
    if (!target) return;
    const offset = 88;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  }, []);

  return (
    <PageShell
      title="vigia-argus"
      subtitle="Argus-V8X — a practical YOLOv8 plugin for robust road-hazard detection on edge devices."
    >
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <DocsTOC sections={sections} />

        <div className="max-w-none space-y-10 md:space-y-12">
          {/* Overview */}
          <motion.section 
            id="overview"
            {...fadeUp(0.1)}
            className="scroll-mt-24"
          >
            <h2 className="mb-4 text-2xl font-semibold text-white sm:text-3xl">Argus-V8X</h2>
            <p className="mb-6 text-base leading-relaxed text-slate-300 sm:text-lg">
              A practical YOLOv8 plugin for robust road-hazard detection on edge devices.
            </p>
            <p className="mb-6 text-base leading-relaxed text-slate-300 sm:text-lg">
              It adds two export-friendly upgrades to YOLOv8—<b className="text-cyan-300">SimAM</b> (parameter-free attention) and a tiny <b className="text-cyan-300">Swin block</b> at the deep stage—without forking Ultralytics. The result: better resilience in rain / fog / glare / occlusion, while staying mobile-ready (ONNX / TFLite INT8).
            </p>
          </motion.section>

          {/* Why */}
          <motion.section 
            id="why"
            {...fadeUp(0.2)}
            className="scroll-mt-24"
          >
            <h3 className="mb-4 text-xl font-semibold text-white sm:text-2xl">Why</h3>
            <p className="mb-4 text-base leading-relaxed text-slate-300 sm:text-lg">
              Dashcams and phones see messy roads: glare, rain streaks, low light, partial occlusions. Vanilla detectors wobble. <b className="text-emerald-300">vigia-argus</b> fortifies YOLOv8 with lightweight attention and global context at the right place (P5), delivering higher recall in adverse conditions with minimal latency overhead.
            </p>
          </motion.section>

          {/* Features */}
          <motion.section 
            id="features"
            {...fadeUp(0.3)}
            className="scroll-mt-24"
          >
            <h3 className="mb-4 text-xl font-semibold text-white sm:text-2xl">What you get</h3>
            <InfoCard>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0 mt-1.5" />
                  <span><b>Drop-in plugin (no fork):</b> auto-registers custom layers into ultralytics at import time.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0 mt-1.5" />
                  <span><b>SimAM where it matters:</b> after each C2f in backbone & neck to suppress noise and emphasize salient edges.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0 mt-1.5" />
                  <span><b>Tiny Swin at P5:</b> one windowed self-attention layer (lazy channel-aware) before SPPF to integrate local+global context for partially obscured hazards.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0 mt-1.5" />
                  <span><b>Export-safe ops:</b> plain Linear / MatMul / Softmax / Reshape / Conv → ONNX → TFLite INT8 works.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0 mt-1.5" />
                  <span><b>Two ready configs:</b></span>
                </li>
                <ul className="ml-6 space-y-2 mt-2">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                    <span><code className="text-cyan-300">argus_v8x.yaml</code> — standard 3-scale head (P3/P4/P5), best for realtime mobile.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                    <span><code className="text-cyan-300">argus_v8x_p2.yaml</code> — extra P2 (stride-4) head for tiny objects (slightly slower, higher recall).</span>
                  </li>
                </ul>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0 mt-1.5" />
                  <span><b>Scale-agnostic:</b> works with YOLOv8 n/s/m/l/x (Swin adapts to channel dims on first forward).</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0 mt-1.5" />
                  <span><b>Lite fallback:</b> if a device/NNAPI dislikes attention ops, drop Swin and keep SimAM only.</span>
                </li>
              </ul>
            </InfoCard>
          </motion.section>

          {/* Installation */}
          <motion.section 
            id="installation"
            {...fadeUp(0.4)}
            className="scroll-mt-24"
          >
            <h2 className="mb-4 text-2xl font-semibold text-white sm:text-3xl">Installation</h2>
            <p className="mb-4 text-base leading-relaxed text-slate-300 sm:text-lg">
              <b>1) Install CUDA-enabled PyTorch</b> matching your GPU (example: CUDA 12.1)
            </p>
            <CodeBlock>
{`pip install --index-url https://download.pytorch.org/whl/cu121 \\
  torch==2.3.1+cu121 torchvision==0.18.1+cu121`}
            </CodeBlock>

            <p className="mt-6 mb-4 text-base leading-relaxed text-slate-300 sm:text-lg">
              <b>2) Install Ultralytics and the plugin</b>
            </p>
            <CodeBlock>
{`pip install ultralytics
pip install vigia-argus

# or:
pip install "git+https://github.com//vigia-argus.git"`}
            </CodeBlock>
          </motion.section>

          {/* Quick start */}
          <motion.section 
            id="quickstart"
            {...fadeUp(0.5)}
            className="scroll-mt-24"
          >
            <h2 className="mb-4 text-2xl font-semibold text-white sm:text-3xl">Quick start</h2>
            <p className="mb-4 text-base leading-relaxed text-slate-300 sm:text-lg">Python API:</p>
            <CodeBlock>
{`import vigia_argus  # registers SimAM & Swin into Ultralytics
from ultralytics import YOLO

# Build the model from the packaged YAML
m = YOLO(vigia_argus.model_yaml("argus_v8x.yaml"))  # or "argus_v8x_p2.yaml"
m.train(data="data.yaml", imgsz=640, epochs=100)

# Export (test early)
m.export(format="onnx", opset=12, imgsz=640)
m.export(format="tflite", int8=True, imgsz=640)`}
            </CodeBlock>

            <p className="mt-6 mb-4 text-base leading-relaxed text-slate-300 sm:text-lg">CLI:</p>
            <CodeBlock>
{`yolo detect train \\
  model=$(python -c "import vigia_argus; print(vigia_argus.model_yaml())") \\
  data=data.yaml imgsz=640 epochs=100`}
            </CodeBlock>
          </motion.section>

          {/* Model scales */}
          <motion.section 
            id="scales"
            {...fadeUp(0.6)}
            className="scroll-mt-24"
          >
            <h2 className="mb-4 text-2xl font-semibold text-white sm:text-3xl">Model scales (n / s / m / l / x)</h2>
            <p className="mb-4 text-base leading-relaxed text-slate-300 sm:text-lg">
              Ultralytics applies width/depth multipliers per scale. The Swin block here auto-adapts to the actual P5 channels, so you can train <b className="text-cyan-300">n</b> for mobile or <b className="text-cyan-300">s/m</b> if you can spend more compute.
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-slate-800/50">
                    <th className="border border-white/10 px-4 py-3 text-left text-white font-semibold">Scale</th>
                    <th className="border border-white/10 px-4 py-3 text-left text-white font-semibold">Depth mult</th>
                    <th className="border border-white/10 px-4 py-3 text-left text-white font-semibold">Width mult</th>
                    <th className="border border-white/10 px-4 py-3 text-left text-white font-semibold">Typical use</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  <tr className="bg-slate-900/30">
                    <td className="border border-white/10 px-4 py-3 font-mono text-cyan-300">n</td>
                    <td className="border border-white/10 px-4 py-3">0.33</td>
                    <td className="border border-white/10 px-4 py-3">0.25</td>
                    <td className="border border-white/10 px-4 py-3">Mobile realtime</td>
                  </tr>
                  <tr className="bg-slate-900/50">
                    <td className="border border-white/10 px-4 py-3 font-mono text-cyan-300">s</td>
                    <td className="border border-white/10 px-4 py-3">0.33</td>
                    <td className="border border-white/10 px-4 py-3">0.50</td>
                    <td className="border border-white/10 px-4 py-3">Mobile/edge (more recall)</td>
                  </tr>
                  <tr className="bg-slate-900/30">
                    <td className="border border-white/10 px-4 py-3 font-mono text-cyan-300">m</td>
                    <td className="border border-white/10 px-4 py-3">0.67</td>
                    <td className="border border-white/10 px-4 py-3">0.75</td>
                    <td className="border border-white/10 px-4 py-3">Server/desktop</td>
                  </tr>
                  <tr className="bg-slate-900/50">
                    <td className="border border-white/10 px-4 py-3 font-mono text-cyan-300">l/x</td>
                    <td className="border border-white/10 px-4 py-3">1.00</td>
                    <td className="border border-white/10 px-4 py-3">1.00/1.25</td>
                    <td className="border border-white/10 px-4 py-3">Research/high-accuracy</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 backdrop-blur-lg sm:p-5">
              <p className="mb-2 font-semibold text-amber-200">Tip</p>
              <p className="text-amber-100/90">
                Rename the YAML to <code className="text-amber-300">…-s.yaml</code> to select a scale by filename, or set <code className="text-amber-300">depth_multiple</code> / <code className="text-amber-300">width_multiple</code> directly.
              </p>
            </div>
          </motion.section>

          {/* Performance */}
          <motion.section 
            id="performance"
            {...fadeUp(0.7)}
            className="scroll-mt-24"
          >
            <h2 className="mb-4 text-2xl font-semibold text-white sm:text-3xl">Performance guidance</h2>
            <ul className="space-y-3 text-slate-300">
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 mt-1.5" />
                <span>Start with <code className="text-cyan-300">argus_v8x.yaml</code> @ 640 INT8 for on-device demos.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 mt-1.5" />
                <span>If tiny debris/far potholes are missed, try <code className="text-cyan-300">argus_v8x_p2.yaml</code> (expect ~10–25% more latency).</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 mt-1.5" />
                <span>If PTQ loses {">"} 1.5 mAP, run QAT for 10–20 epochs.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 mt-1.5" />
                <span><b>Targets</b> (mid-tier Android, NNAPI/GPU): p50 {"<"} 120 ms, p95 {"<"} 250 ms.</span>
              </li>
            </ul>
          </motion.section>

          {/* Design */}
          <motion.section 
            id="design"
            {...fadeUp(0.8)}
            className="scroll-mt-24"
          >
            <h2 className="mb-4 text-2xl font-semibold text-white sm:text-3xl">Design choices</h2>
            <InfoCard>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0 mt-1.5" />
                  <span><b>SimAM:</b> parameter-free, cheap; placed widely (after C2f) to denoise features.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0 mt-1.5" />
                  <span><b>Swin @ P5:</b> small, single block where features are compact; adds global context with limited cost.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0 mt-1.5" />
                  <span><b>Head unchanged:</b> preserves exportability and tooling compatibility.</span>
                </li>
              </ul>
            </InfoCard>
          </motion.section>

          {/* Compatibility */}
          <motion.section 
            id="compatibility"
            {...fadeUp(0.9)}
            className="scroll-mt-24"
          >
            <h2 className="mb-4 text-2xl font-semibold text-white sm:text-3xl">Compatibility</h2>
            <InfoCard>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
                  <span><b>Ultralytics:</b> ≥ 8.2.x</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
                  <span><b>PyTorch:</b> ≥ 2.1</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
                  <span><b>ONNX:</b> opset 12–13 recommended</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
                  <span><b>TFLite:</b> INT8 (PTQ/QAT) with representative dataset</span>
                </li>
              </ul>
            </InfoCard>
          </motion.section>

          {/* Roadmap */}
          <motion.section 
            id="roadmap"
            {...fadeUp(1.0)}
            className="scroll-mt-24"
          >
            <h2 className="mb-4 text-2xl font-semibold text-white sm:text-3xl">Roadmap</h2>
            <ul className="space-y-3 text-slate-300">
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />
                <span>Optional shifted windows (export-tested).</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />
                <span>Argus-V8X-Lite preset (SimAM-only YAML).</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />
                <span>Pretrained checkpoints on public road datasets.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />
                <span>Extra robustness augmentations pack (rain/fog/night suite).</span>
              </li>
            </ul>
          </motion.section>

          {/* License */}
          <motion.section 
            id="license"
            {...fadeUp(1.1)}
            className="scroll-mt-24"
          >
            <h2 className="mb-4 text-2xl font-semibold text-white sm:text-3xl">License & notes</h2>
            <InfoCard>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
                  <span>This plugin's code is under your chosen license (e.g., Apache-2.0/MIT).</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
                  <span>It depends on Ultralytics, which is licensed separately (AGPL-3.0 / Enterprise). Ensure your usage complies with Ultralytics' terms when training/serving models over a network.</span>
                </li>
              </ul>
            </InfoCard>

            <div className="mt-8 p-5 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/70 backdrop-blur-lg">
              <p className="mb-3 text-sm font-semibold text-white/90">Keywords</p>
              <div className="flex flex-wrap gap-2">
                {['yolo', 'ultralytics', 'object-detection', 'simam', 'swin-transformer', 'attention', 'edge-ai', 'tflite', 'onnx', 'mobile'].map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 text-xs font-medium text-cyan-300"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </PageShell>
  );
}