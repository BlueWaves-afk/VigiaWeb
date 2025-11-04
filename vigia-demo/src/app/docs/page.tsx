// src/app/docs/page.tsx
import Link from "next/link";
import PageShell from "@/components/PageShell";
import DocsTOC from "@/components/DocsTOC";

export default function DocsPage() {
  // Keep these ids in sync with section id="" attributes below
  const sections = [
    { id: "overview",   title: "Overview" },
    { id: "toc",        title: "What’s inside" },
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
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <DocsTOC sections={sections} />

        <div className="prose prose-invert max-w-none">
          {/* Overview */}
          <section id="overview">
            <h2>Overview</h2>
            <p>
              <b>ArgusV8X</b> is a lightweight YOLOv8-family detector specialized for
              on-road hazards (potholes, debris, cones, barricades, stalled vehicles).
              It exports to ONNX / TFLite / CoreML for edge inference and plugs into
              the VIGIA <i>Argus</i> runtime as a versioned <b>plugin</b> with metadata,
              health checks, and DePIN reward hooks.
            </p>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <ul className="m-0">
                <li>Backbone: YOLOv8-n / s (Ultralytics)</li>
                <li>Target: 30–60 FPS @ 640 (edge devices)</li>
                <li>Exports: ONNX (fp32/int8), TFLite (fp16/int8), CoreML</li>
                <li>Plugin I/O: {`{image → hazards[]}`}, geo stamp, confidence, mint hooks</li>
              </ul>
            </div>
          </section>

          {/* TOC (onscreen quick links) */}
          <section id="toc">
            <h3>What’s inside</h3>
            <ol>
              <li><a href="#dataset">Dataset & labels</a></li>
              <li><a href="#train">Training</a></li>
              <li><a href="#export">Export & quantization</a></li>
              <li><a href="#evaluate">Evaluation & ablations</a></li>
              <li><a href="#plugin">Build a VIGIA plugin</a></li>
              <li><a href="#runtime">Runtime & benchmarks</a></li>
              <li><a href="#model-card">Model Card</a></li>
            </ol>
          </section>

          {/* Dataset */}
          <section id="dataset">
            <h2>1) Dataset & labels</h2>
            <p>YOLO format (<code>images/</code>, <code>labels/</code> *.txt). Classes:</p>
            <pre className="rounded-xl bg-black/50 p-4 overflow-auto">
{`0 pothole
1 debris
2 cone
3 barricade
4 stalled_vehicle`}
            </pre>

            <p>Dataset YAML:</p>
            <pre className="rounded-xl bg-black/50 p-4 overflow-auto">
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
            </pre>

            <p className="mt-4"><b>Tips</b></p>
            <ul>
              <li>Balance classes; ≥2k instances/class if possible.</li>
              <li>Night/rain/dust augmentations; keep a clean <i>val</i> split.</li>
              <li>Filename or sidecar JSON can include GPS/time for later analytics.</li>
            </ul>
          </section>

          {/* Training */}
          <section id="train">
            <h2>2) Training</h2>
            <p>Ultralytics baseline:</p>
            <pre className="rounded-xl bg-black/50 p-4 overflow-auto">
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
            </pre>
            <ul>
              <li><b>mosaic=0.5</b>, <b>hsv=0.2</b>, <b>fliplr=0.5</b>, <b>copy_paste=0.2</b></li>
              <li>If many small objects, try <code>box=10</code> loss weight.</li>
              <li>Small datasets: <code>freeze=10</code> (warm the head first).</li>
            </ul>
          </section>

          {/* Export */}
          <section id="export">
            <h2>3) Export & quantization</h2>
            <pre className="rounded-xl bg-black/50 p-4 overflow-auto">
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
            </pre>

            <p>Optional stricter int8 with calibration (~200 diverse frames):</p>
            <pre className="rounded-xl bg-black/50 p-4 overflow-auto">
{`python tools/calibrate_int8.py \\
  --images data/calib/*.jpg \\
  --model $RUN/weights/best.onnx \\
  --out   $RUN/weights/best_int8.onnx`}
            </pre>
          </section>

          {/* Evaluation */}
          <section id="evaluate">
            <h2>4) Evaluation & ablations</h2>
            <pre className="rounded-xl bg-black/50 p-4 overflow-auto">
{`yolo detect val model=$RUN/weights/best.pt data=data/argusv8x.yaml imgsz=640

python tools/val_onnx.py \\
  --model $RUN/weights/best.onnx \\
  --data  data/argusv8x.yaml`}
            </pre>
            <p>Track mAP@.5:.95, per-class PR, and device latency. If pothole recall lags:</p>
            <ul>
              <li>Train at 768 then distill to 640.</li>
              <li>Small-object oversampling / cutout augment.</li>
              <li>Try <code>yolov8s</code> or adjust loss weights.</li>
            </ul>
          </section>

          {/* Plugin */}
          <section id="plugin">
            <h2>5) Build a VIGIA plugin</h2>
            <p>Wrap the exported model with the Argus plugin contract:</p>
            <pre className="rounded-xl bg-black/50 p-4 overflow-auto">
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
            </pre>
            <p className="mt-3"><b>Reward hooks</b></p>
            <ul>
              <li>No mint on V2X messages.</li>
              <li>Mint VGT only when a hazard is <b>CONFIRMED</b> (≥2 confirmations, no contradictions).</li>
              <li>Split: Publisher 70%, Validators 30% — contributors only.</li>
            </ul>
          </section>

          {/* Runtime */}
          <section id="runtime">
            <h2>6) Runtime & benchmarks</h2>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <ul className="m-0">
                <li>M2/M3 + CoreML EP (ONNX): 35–60 FPS @ 640 (v8n)</li>
                <li>Android NNAPI / GPU (TFLite int8): 25–45 FPS @ 640</li>
                <li>iOS CoreML fp16: 30–50 FPS @ 640</li>
              </ul>
            </div>
            <p className="mt-4">Measure end-to-end latency (resize + NMS included):</p>
            <pre className="rounded-xl bg-black/50 p-4 overflow-auto">
{`const t0 = performance.now();
const out = await session.run(feeds);
const t1 = performance.now();
console.log("inference ms:", (t1 - t0).toFixed(2));`}
            </pre>
          </section>

          {/* Model Card */}
          <section id="model-card">
            <h2>7) Model Card (template)</h2>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="m-0"><b>Name</b>: ArgusV8X-n-640</p>
              <p className="m-0"><b>Version</b>: 0.1.0</p>
              <p className="m-0"><b>Task</b>: Object detection (road hazards)</p>
              <p className="m-0"><b>Train data</b>: VIGIA-RoadHazards v1 (India, mixed weather/day-night)</p>
              <p className="m-0"><b>Metrics (val)</b>: mAP@.5=.74, mAP@.5:.95=.47, P=.78, R=.72</p>
              <p className="m-0"><b>Limits</b>: Small potholes & glare reduce recall; cone occlusions cause FPs.</p>
              <p className="m-0"><b>Safety</b>: Advisory only; human fallback + server-side consensus.</p>
              <p className="m-0"><b>Licensing</b>: Weights © VIGIA; Ultralytics training under AGPL-3.0.</p>
            </div>
          </section>

          {/* Links */}
          <section id="links">
            <h3>Next steps</h3>
            <ul>
              <li>Validate in <Link href="/sandbox">Sandbox</Link> (consensus + mint flow).</li>
              <li>Review <Link href="/pricing">Pricing</Link> for DePIN reward splits.</li>
              <li>Install plugin: <code>vigia plugins add ./argusv8x</code>.</li>
            </ul>
          </section>
        </div>
      </div>
    </PageShell>
  );
}