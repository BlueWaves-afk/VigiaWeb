// src/app/docs/page.tsx
"use client";

import Link from "next/link";
import PageShell from "@/components/PageShell";
import DocsTOC from "@/components/DocsTOC";
import { motion } from "framer-motion";

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
      className={`rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-6 overflow-auto font-mono text-sm leading-relaxed backdrop-blur-lg ${className}`}
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
      className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/70 p-6 backdrop-blur-lg"
    >
      {children}
    </motion.div>
  );
}

export default function DocsPage() {
  // Keep these ids in sync with section id="" attributes below
  const sections = [
    { id: "overview",   title: "Overview" },
    { id: "toc",        title: "What's inside" },
    { id: "dataset",    title: "1) Dataset & labels" },
    { id: "train",      title: "2) Training" },
    { id: "export",     title: "3) Export & quantization" },
    { id: "evaluate",   title: "4) Evaluation & ablations" },
    { id: "plugin",     title: "5) Build a VIGIA plugin" },
    { id: "runtime",    title: "6) Runtime & benchmarks" },
    { id: "model-card", title: "7) Model Card" },
    { id: "links",      title: "Next steps" },
  ];

  return (
    <PageShell
      title="ArgusV8X — Training & Plugin Integration Guide"
      subtitle="From dataset to deployable plugin: YOLOv8-based hazard detection tuned for VIGIA."
    >
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <DocsTOC sections={sections} />

        <div className="max-w-none space-y-12">
          {/* Overview */}
          <motion.section 
            id="overview"
            {...fadeUp(0.1)}
            className="scroll-mt-24"
          >
            <h2 className="text-3xl font-semibold text-white mb-6">Overview</h2>
            <p className="text-lg leading-relaxed text-slate-300 mb-6">
              <b className="text-cyan-300">ArgusV8X</b> is a lightweight YOLOv8-family detector specialized for
              on-road hazards (potholes, debris, cones, barricades, stalled vehicles).
              It exports to ONNX / TFLite / CoreML for edge inference and plugs into
              the VIGIA <i>Argus</i> runtime as a versioned <b className="text-emerald-300">plugin</b> with metadata,
              health checks, and DePIN reward hooks.
            </p>
            <InfoCard>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
                  <span><b>Backbone:</b> YOLOv8-n / s (Ultralytics)</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
                  <span><b>Target:</b> 30–60 FPS @ 640 (edge devices)</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
                  <span><b>Exports:</b> ONNX (fp32/int8), TFLite (fp16/int8), CoreML</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
                  <span><b>Plugin I/O:</b> {`{image → hazards[]}`}, geo stamp, confidence, mint hooks</span>
                </li>
              </ul>
            </InfoCard>
          </motion.section>

          {/* TOC (onscreen quick links) */}
          <motion.section 
            id="toc"
            {...fadeUp(0.2)}
            className="scroll-mt-24"
          >
            <h3 className="text-2xl font-semibold text-white mb-6">What's inside</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {sections.slice(2, -1).map((section, index) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
                  <Link 
                    href={`#${section.id}`}
                    className="text-slate-300 hover:text-cyan-300 transition-colors group-hover:underline"
                  >
                    {section.title}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Dataset */}
          <motion.section 
            id="dataset"
            {...fadeUp(0.3)}
            className="scroll-mt-24"
          >
            <h2 className="text-3xl font-semibold text-white mb-6">1) Dataset & labels</h2>
            <p className="text-lg leading-relaxed text-slate-300 mb-4">
              YOLO format (<code className="text-cyan-300">images/</code>, <code className="text-cyan-300">labels/</code> *.txt). Classes:
            </p>
            <CodeBlock>
{`0 pothole
1 debris
2 cone
3 barricade
4 stalled_vehicle`}
            </CodeBlock>

            <p className="text-lg leading-relaxed text-slate-300 mt-6 mb-4">Dataset YAML:</p>
            <CodeBlock>
{`# data/argusv8x.yaml
path: /abs/path/to/dataset
train: images/train
val: images/val
test: images/test
names:
  0: pothole
  1: debris
  2: cone
  3: barricade
  4: stalled_vehicle`}
            </CodeBlock>

            <div className="mt-6 p-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 backdrop-blur-lg">
              <p className="text-amber-200 font-semibold mb-2">Tips</p>
              <ul className="text-amber-100/90 space-y-2">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                  Balance classes; ≥2k instances/class if possible.
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                  Night/rain/dust augmentations; keep a clean <i>val</i> split.
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                  Filename or sidecar JSON can include GPS/time for later analytics.
                </li>
              </ul>
            </div>
          </motion.section>

          {/* Training */}
          <motion.section 
            id="train"
            {...fadeUp(0.4)}
            className="scroll-mt-24"
          >
            <h2 className="text-3xl font-semibold text-white mb-6">2) Training</h2>
            <p className="text-lg leading-relaxed text-slate-300 mb-4">Ultralytics baseline:</p>
            <CodeBlock>
{`pip install ultralytics==8.3.0

# baseline
yolo detect train \\
  model=yolov8n.pt \\
  data=data/argusv8x.yaml \\
  imgsz=640 \\
  epochs=120 \\
  batch=32 \\
  cos_lr=True \\
  amp=True \\
  name=argusv8x_n_640

# resume
yolo detect train resume=True name=argusv8x_n_640`}
            </CodeBlock>
            <ul className="mt-4 space-y-2 text-slate-300">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                <b>mosaic=0.5</b>, <b>hsv=0.2</b>, <b>fliplr=0.5</b>, <b>copy_paste=0.2</b>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                If many small objects, try <code className="text-cyan-300">box=10</code> loss weight.
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                Small datasets: <code className="text-cyan-300">freeze=10</code> (warm the head first).
              </li>
            </ul>
          </motion.section>

          {/* Export */}
          <motion.section 
            id="export"
            {...fadeUp(0.5)}
            className="scroll-mt-24"
          >
            <h2 className="text-3xl font-semibold text-white mb-6">3) Export & quantization</h2>
            <CodeBlock>
{`RUN=runs/detect/argusv8x_n_640

# ONNX
yolo export model=$RUN/weights/best.pt format=onnx opset=12
# ONNX int8
yolo export model=$RUN/weights/best.pt format=onnx int8=True

# TFLite
yolo export model=$RUN/weights/best.pt format=tflite half=True
yolo export model=$RUN/weights/best.pt format=tflite int8=True

# CoreML
yolo export model=$RUN/weights/best.pt format=coreml`}
            </CodeBlock>

            <p className="text-lg leading-relaxed text-slate-300 mt-6 mb-4">Optional stricter int8 with calibration (~200 diverse frames):</p>
            <CodeBlock>
{`python tools/calibrate_int8.py \\
  --images data/calib/*.jpg \\
  --model $RUN/weights/best.onnx \\
  --out   $RUN/weights/best_int8.onnx`}
            </CodeBlock>
          </motion.section>

          {/* Evaluation */}
          <motion.section 
            id="evaluate"
            {...fadeUp(0.6)}
            className="scroll-mt-24"
          >
            <h2 className="text-3xl font-semibold text-white mb-6">4) Evaluation & ablations</h2>
            <CodeBlock>
{`yolo detect val model=$RUN/weights/best.pt data=data/argusv8x.yaml imgsz=640

python tools/val_onnx.py \\
  --model $RUN/weights/best.onnx \\
  --data  data/argusv8x.yaml`}
            </CodeBlock>
            <p className="text-lg leading-relaxed text-slate-300 mt-4">Track mAP@.5:.95, per-class PR, and device latency. If pothole recall lags:</p>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                Train at 768 then distill to 640.
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                Small-object oversampling / cutout augment.
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                Try <code className="text-cyan-300">yolov8s</code> or adjust loss weights.
              </li>
            </ul>
          </motion.section>

          {/* Plugin */}
          <motion.section 
            id="plugin"
            {...fadeUp(0.7)}
            className="scroll-mt-24"
          >
            <h2 className="text-3xl font-semibold text-white mb-6">5) Build a VIGIA plugin</h2>
            <p className="text-lg leading-relaxed text-slate-300 mb-4">Wrap the exported model with the Argus plugin contract:</p>
            <CodeBlock>
{`export type Hazard = {
  id: string;
  cls: "pothole" | "debris" | "cone" | "barricade" | "stalled_vehicle";
  score: number;
  bbox: [number, number, number, number]; // xywh norm
};

export type ArgusOutput = {
  model: "argusv8x";
  model_version: string;
  hazards: Hazard[];
  timing_ms?: number;
};`}
            </CodeBlock>
            <div className="mt-6 p-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 backdrop-blur-lg">
              <p className="text-emerald-200 font-semibold mb-2">Reward hooks</p>
              <ul className="text-emerald-100/90 space-y-2">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                  No mint on V2X messages.
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                  Mint VGT only when a hazard is <b>CONFIRMED</b> (≥2 confirmations, no contradictions).
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                  Split: Publisher 70%, Validators 30% — contributors only.
                </li>
              </ul>
            </div>
          </motion.section>

          {/* Runtime */}
          <motion.section 
            id="runtime"
            {...fadeUp(0.8)}
            className="scroll-mt-24"
          >
            <h2 className="text-3xl font-semibold text-white mb-6">6) Runtime & benchmarks</h2>
            <InfoCard>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
                  <span><b>M2/M3 + CoreML EP (ONNX):</b> 35–60 FPS @ 640 (v8n)</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
                  <span><b>Android NNAPI / GPU (TFLite int8):</b> 25–45 FPS @ 640</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
                  <span><b>iOS CoreML fp16:</b> 30–50 FPS @ 640</span>
                </li>
              </ul>
            </InfoCard>
            <p className="text-lg leading-relaxed text-slate-300 mt-6 mb-4">Measure end-to-end latency (resize + NMS included):</p>
            <CodeBlock>
{`const t0 = performance.now();
const out = await session.run(feeds);
const t1 = performance.now();
console.log("inference ms:", (t1 - t0).toFixed(2));`}
            </CodeBlock>
          </motion.section>

          {/* Model Card */}
          <motion.section 
            id="model-card"
            {...fadeUp(0.9)}
            className="scroll-mt-24"
          >
            <h2 className="text-3xl font-semibold text-white mb-6">7) Model Card (template)</h2>
            <InfoCard>
              <div className="space-y-3 text-slate-300">
                <p><b className="text-cyan-300">Name</b>: ArgusV8X-n-640</p>
                <p><b className="text-cyan-300">Version</b>: 0.1.0</p>
                <p><b className="text-cyan-300">Task</b>: Object detection (road hazards)</p>
                <p><b className="text-cyan-300">Train data</b>: VIGIA-RoadHazards v1 (India, mixed weather/day-night)</p>
                <p><b className="text-cyan-300">Metrics (val)</b>: mAP@.5=.74, mAP@.5:.95=.47, P=.78, R=.72</p>
                <p><b className="text-cyan-300">Limits</b>: Small potholes & glare reduce recall; cone occlusions cause FPs.</p>
                <p><b className="text-cyan-300">Safety</b>: Advisory only; human fallback + server-side consensus.</p>
                <p><b className="text-cyan-300">Licensing</b>: Weights © VIGIA; Ultralytics training under AGPL-3.0.</p>
              </div>
            </InfoCard>
          </motion.section>

          {/* Links */}
          <motion.section 
            id="links"
            {...fadeUp(1)}
            className="scroll-mt-24"
          >
            <h3 className="text-2xl font-semibold text-white mb-6">Next steps</h3>
            <div className="flex flex-wrap gap-4">
              <motion.div {...springTap}>
                <Link 
                  href="/sandbox"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-slate-900 shadow-lg transition-all hover:shadow-xl"
                >
                  Validate in Sandbox
                </Link>
              </motion.div>
              <motion.div {...springTap}>
                <Link 
                  href="/pricing"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-medium text-white/90 backdrop-blur-lg transition-all hover:bg-white/10 hover:border-white/25"
                >
                  Review Pricing
                </Link>
              </motion.div>
            </div>
            <p className="text-lg leading-relaxed text-slate-300 mt-6">
              Install plugin: <code className="text-cyan-300 bg-slate-800/50 px-2 py-1 rounded-lg">vigia plugins add ./argusv8x</code>
            </p>
          </motion.section>
        </div>
      </div>
    </PageShell>
  );
}