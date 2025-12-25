"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as ort from "onnxruntime-web";

declare global {
  interface Navigator {
    gpu?: unknown;
    hardwareConcurrency?: number;
  }
}

/* ORT ENV */
(function initOrt() {
  ort.env.wasm.wasmPaths = "/ort/";
  ort.env.wasm.simd = true;
  ort.env.wasm.proxy = true;
  ort.env.wasm.numThreads = Math.min(
    4,
    typeof navigator !== "undefined"
      ? navigator.hardwareConcurrency ?? 1
      : 1,
  );
  ort.env.logLevel = "warning";
})();

/* Types */
type Provider = "webgpu" | "wasm";

type Rolling = {
  push(v: number): void;
  mean(): number;
  last(): number;
  count(): number;
};

type BenchStats = {
  provider: string;
  infLast: number;
  infAvg: number;
  e2eLast: number;
  e2eAvg: number;
  fpsInf: number;
  fpsE2E: number;
  frames: number;
};

/* Rolling window helper */
function makeRolling(n = 120): Rolling {
  const a: number[] = [];
  return {
    push(v: number) {
      a.push(v);
      if (a.length > n) a.shift();
    },
    mean() {
      return a.length
        ? a.reduce((s, v) => s + v, 0) / a.length
        : 0;
    },
    last() {
      return a[a.length - 1] ?? 0;
    },
    count() {
      return a.length;
    },
  };
}

function isVideo(
  el: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
): el is HTMLVideoElement {
  return (el as HTMLVideoElement).videoWidth !== undefined;
}
function isImage(
  el: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
): el is HTMLImageElement {
  return (el as HTMLImageElement).naturalWidth !== undefined;
}

function letterbox(
  img: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
  newShape = 640,
  fill = "#727272",
) {
  const iw = isVideo(img)
    ? img.videoWidth || (img as HTMLVideoElement).width
    : isImage(img)
    ? img.naturalWidth || (img as HTMLImageElement).width
    : (img as HTMLCanvasElement).width;

  const ih = isVideo(img)
    ? img.videoHeight || (img as HTMLVideoElement).height
    : isImage(img)
    ? img.naturalHeight || (img as HTMLImageElement).height
    : (img as HTMLCanvasElement).height;

  const r = Math.min(newShape / iw, newShape / ih);
  const newW = Math.round(iw * r),
    newH = Math.round(ih * r);
  const dw = Math.floor((newShape - newW) / 2),
    dh = Math.floor((newShape - newH) / 2);

  const canvas = document.createElement("canvas");
  canvas.width = newShape;
  canvas.height = newShape;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, newShape, newShape);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img as any, 0, 0, iw, ih, dw, dh, newW, newH);

  return {
    canvas,
    ratio: r,
    pad: [dw, dh] as [number, number],
    src: { w: iw, h: ih },
  };
}

async function createSession(modelUrl: string) {
  const res = await fetch(modelUrl, { cache: "force-cache" });
  if (!res.ok)
    throw new Error(
      `Failed to fetch model: ${res.status} ${res.statusText}`,
    );
  const modelBytes = new Uint8Array(await res.arrayBuffer());

  const order: Provider[] =
    typeof navigator !== "undefined" && navigator.gpu
      ? ["webgpu", "wasm"]
      : ["wasm"];
  for (const ep of order) {
    try {
      const sess = await ort.InferenceSession.create(modelBytes, {
        executionProviders: [ep],
        graphOptimizationLevel: "all",
      } as const);
      return { sess, provider: ep };
    } catch (e) {
      console.warn(`[onnxruntime] EP "${ep}" failed:`, e);
    }
  }
  throw new Error(
    "No compatible ONNX Runtime EP available (tried WebGPU, WASM).",
  );
}

/* HUD */
function drawHud(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x = 10,
  y = 10,
  w = 560,
  lineH = 18,
  pad = 8,
) {
  const h = pad * 2 + lineH * lines.length;
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#fff";
  ctx.font =
    "14px ui-monospace, SFMono-Regular, Menlo, monospace";
  let yy = y + pad + 14;
  for (const line of lines) {
    ctx.fillText(line, x + pad, yy);
    yy += lineH;
  }
}

/* Intro carousel */
function InfoCarousel({ onClose }: { onClose: () => void }) {
  const slides = [
    {
      title: "What this demo shows",
      body:
        "Real-time, on-device inference in the browser. We stream a hazard clip and run two ONNX models (YOLO and ARGUS v8x) with WebGPU/WASM backends, then compare speed metrics.",
    },
    {
      title: "Models under test",
      body:
        "• YOLO (baseline ONNX)\n• ARGUS v8x (edge‑oriented variant for our Argus pipeline).\nOutputs are ignored—this is a pure speed benchmark.",
    },
    {
      title: "Metrics we track",
      body:
        "• Infer ms (per frame) and rolling avg\n• E2E ms (draw→preprocess→infer)\n• FPS from averages (1000/avg)\nThese update continuously per model.",
    },
    {
      title: "ARGUS v8x (PyPI)",
      body:
        "Python package + docs:\nhttps://pypi.org/project/vigia-argus/\nThis demo uses ONNXRuntime Web in the browser.",
    },
  ];
  const [i, setI] = useState(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="mb-4 rounded-2xl border border-white/15 bg-slate-900/80 p-4 text-white/90 light:bg-white light:border-slate-200"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold md:text-base">
          {slides[i].title}
        </h3>
        <div className="text-xs text-slate-400">
          {i + 1} / {slides.length}
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.pre
          key={i}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.25 }}
          className="mt-2 whitespace-pre-wrap text-xs md:text-sm text-slate-200 light:text-slate-700"
        >
          {slides[i].body}
        </motion.pre>
      </AnimatePresence>
      <div className="mt-3 flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={() =>
            setI((p) => (p === 0 ? slides.length - 1 : p - 1))
          }
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white light:border-slate-200 light:bg-slate-100 light:text-slate-900"
        >
          ◀ Prev
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setI((p) => (p + 1) % slides.length)}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white light:border-slate-200 light:bg-slate-100 light:text-slate-900"
        >
          Next ▶
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={onClose}
          className="ml-auto rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-slate-900 shadow light:bg-slate-900 light:text-white"
        >
          Let&apos;s go
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function ArgusBrowserDemo() {
  const [showIntro, setShowIntro] = useState(true);

  const [yoloUrl, setYoloUrl] = useState("/models/yolo.onnx");
  const [argusUrl, setArgusUrl] = useState("/models/argus_v8x.onnx");
  const [imgSize, setImgSize] = useState(640);

  const yoloSess = useRef<ort.InferenceSession | null>(null);
  const argusSess = useRef<ort.InferenceSession | null>(null);
  const yoloProvider = useRef<string>("");
  const argusProvider = useRef<string>("");

  const [loadingYolo, setLoadingYolo] = useState(false);
  const [loadingArgus, setLoadingArgus] = useState(false);
  const [running, setRunning] = useState(false);
  const rafRef = useRef<number | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const inputCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const yoloCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const argusCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const inputDraw = useRef(makeRolling(120));
  const yoloInf = useRef(makeRolling(120));
  const yoloE2E = useRef(makeRolling(120));
  const argusInf = useRef(makeRolling(120));
  const argusE2E = useRef(makeRolling(120));

  const [card, setCard] = useState<{
    inputFPS: number;
    yolo: BenchStats;
    argus: BenchStats;
  }>({
    inputFPS: 0,
    yolo: {
      provider: "-",
      infLast: 0,
      infAvg: 0,
      e2eLast: 0,
      e2eAvg: 0,
      fpsInf: 0,
      fpsE2E: 0,
      frames: 0,
    },
    argus: {
      provider: "-",
      infLast: 0,
      infAvg: 0,
      e2eLast: 0,
      e2eAvg: 0,
      fpsInf: 0,
      fpsE2E: 0,
      frames: 0,
    },
  });

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.src = "/demo/hazard.mp4";
    v.muted = true;
    v.loop = true;
    v.controls = false;
    v.playsInline = true;
    v.play().catch(() => {});
  }, []);

  const loadYolo = useCallback(async () => {
    try {
      setLoadingYolo(true);
      const { sess, provider } = await createSession(yoloUrl);
      yoloSess.current = sess;
      yoloProvider.current = provider;
    } catch (e) {
      console.error(e);
      alert((e as Error).message);
    } finally {
      setLoadingYolo(false);
    }
  }, [yoloUrl]);

  const loadArgus = useCallback(async () => {
    try {
      setLoadingArgus(true);
      const { sess, provider } = await createSession(argusUrl);
      argusSess.current = sess;
      argusProvider.current = provider;
    } catch (e) {
      console.error(e);
      alert((e as Error).message);
    } finally {
      setLoadingArgus(false);
    }
  }, [argusUrl]);

  function toTensor(lb: HTMLCanvasElement) {
    const ctx = lb.getContext("2d")!;
    const im = ctx.getImageData(0, 0, lb.width, lb.height).data;
    const chw = new Float32Array(3 * lb.height * lb.width);
    let r = 0,
      g = lb.height * lb.width,
      b = 2 * lb.height * lb.width;
    for (let i = 0; i < im.length; i += 4) {
      chw[r++] = im[i] / 255;
      chw[g++] = im[i + 1] / 255;
      chw[b++] = im[i + 2] / 255;
    }
    return new ort.Tensor(
      "float32",
      chw,
      [1, 3, lb.height, lb.width],
    );
  }

  const loop = useCallback(async () => {
    if (!running) return;

    const v = videoRef.current;
    const cIn = inputCanvasRef.current;
    const cY = yoloCanvasRef.current;
    const cA = argusCanvasRef.current;
    if (!v || v.readyState < 2 || !cIn || !cY || !cA) {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    const W = v.videoWidth || v.width || 640;
    const H = v.videoHeight || v.height || 360;
    for (const c of [cIn, cY, cA]) {
      c.width = W;
      c.height = H;
    }

    // Input
    {
      const ctx = cIn.getContext("2d")!;
      const t0 = performance.now();
      ctx.drawImage(v, 0, 0, W, H);
      const t1 = performance.now();
      inputDraw.current.push(t1 - t0);
      const lines = [
        "1) Input (no processing)",
        `Frame draw: ${(t1 - t0).toFixed(2)} ms`,
        `Approx FPS: ${(
          1000 / Math.max(1e-6, inputDraw.current.mean())
        ).toFixed(1)}`,
      ];
      drawHud(ctx, lines);
    }

    const { canvas: lb } = letterbox(v, imgSize);

    // YOLO
    {
      const ctx = cY.getContext("2d")!;
      const drawT0 = performance.now();
      ctx.drawImage(v, 0, 0, W, H);
      const drawT1 = performance.now();

      if (yoloSess.current) {
        const t0 = performance.now();
        try {
          const tensor = toTensor(lb);
          await yoloSess.current.run({
            [yoloSess.current.inputNames?.[0] ?? "images"]: tensor,
          });
          const t1 = performance.now();
          yoloInf.current.push(t1 - t0);
          yoloE2E.current.push(t1 - drawT0);
        } catch (e) {
          console.error("YOLO inference failed:", e);
        }
      }

      const lines = [
        `2) YOLO (${yoloProvider.current || "-"})`,
        `Infer: ${yoloInf.current.last().toFixed(
          2,
        )} ms | avg ${yoloInf.current
          .mean()
          .toFixed(2)} | ${(1000 / Math.max(1e-6, yoloInf.current.mean())).toFixed(1)} FPS`,
        `E2E : ${yoloE2E.current.last().toFixed(
          2,
        )} ms | avg ${yoloE2E.current
          .mean()
          .toFixed(2)} | ${(1000 / Math.max(1e-6, yoloE2E.current.mean())).toFixed(1)} FPS`,
      ];
      drawHud(ctx, lines);
    }

    // ARGUS
    {
      const ctx = cA.getContext("2d")!;
      const drawT0 = performance.now();
      ctx.drawImage(v, 0, 0, W, H);
      const drawT1 = performance.now();

      if (argusSess.current) {
        const t0 = performance.now();
        try {
          const tensor = toTensor(lb);
          await argusSess.current.run({
            [argusSess.current.inputNames?.[0] ?? "images"]: tensor,
          });
          const t1 = performance.now();
          argusInf.current.push(t1 - t0);
          argusE2E.current.push(t1 - drawT0);
        } catch (e) {
          console.error("ARGUS inference failed:", e);
        }
      }

      const lines = [
        `3) ARGUS v8x (${argusProvider.current || "-"})`,
        `Infer: ${argusInf.current.last().toFixed(
          2,
        )} ms | avg ${argusInf.current
          .mean()
          .toFixed(2)} | ${(1000 / Math.max(1e-6, argusInf.current.mean())).toFixed(1)} FPS`,
        `E2E : ${argusE2E.current.last().toFixed(
          2,
        )} ms | avg ${argusE2E.current
          .mean()
          .toFixed(2)} | ${(1000 / Math.max(1e-6, argusE2E.current.mean())).toFixed(1)} FPS`,
      ];
      drawHud(ctx, lines);
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [imgSize, running]);

  const start = useCallback(async () => {
    const v = videoRef.current;
    if (v) {
      v.currentTime = 0;
      await v.play().catch(console.error);
    }
    setRunning(true);
  }, []);

  const stop = useCallback(() => {
    setRunning(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  useEffect(() => {
    if (running) {
      rafRef.current = requestAnimationFrame(loop);
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      };
    }
  }, [running, loop]);

  useEffect(() => {
    const id = setInterval(() => {
      const yInf = yoloInf.current.mean();
      const yE2E = yoloE2E.current.mean();
      const aInf = argusInf.current.mean();
      const aE2E = argusE2E.current.mean();
      const inFPS =
        1000 / Math.max(1e-6, inputDraw.current.mean());

      setCard({
        inputFPS: inFPS,
        yolo: {
          provider: yoloProvider.current || "-",
          infLast: yoloInf.current.last(),
          infAvg: yInf,
          e2eLast: yoloE2E.current.last(),
          e2eAvg: yE2E,
          fpsInf: 1000 / Math.max(1e-6, yInf),
          fpsE2E: 1000 / Math.max(1e-6, yE2E),
          frames: yoloE2E.current.count(),
        },
        argus: {
          provider: argusProvider.current || "-",
          infLast: argusInf.current.last(),
          infAvg: aInf,
          e2eLast: argusE2E.current.last(),
          e2eAvg: aE2E,
          fpsInf: 1000 / Math.max(1e-6, aInf),
          fpsE2E: 1000 / Math.max(1e-6, aE2E),
          frames: argusE2E.current.count(),
        },
      });
    }, 500);
    return () => clearInterval(id);
  }, []);

  const loadBtn = useCallback(
    (label: string, onClick: () => void, loading: boolean) => (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        disabled={loading}
        className="relative rounded-full border border-white/15 bg-slate-900/60 px-4 py-1.5 text-xs text-white/90 disabled:opacity-60 light:border-slate-200 light:bg-slate-50 light:text-slate-900"
      >
        {label}
        {loading && (
          <span className="absolute inset-x-1 -bottom-1 h-0.5 overflow-hidden rounded-full bg-white/10">
            <span className="block h-full w-1/3 animate-[loadbar_1.2s_linear_infinite] bg-white/80" />
          </span>
        )}
        <style jsx>{`
          @keyframes loadbar {
            0% {
              transform: translateX(0%);
            }
            100% {
              transform: translateX(300%);
            }
          }
        `}</style>
      </motion.button>
    ),
    [],
  );

  const statLine = (
    label: string,
    a: number,
    b: number,
    unit = "ms",
  ) => (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-300 light:text-slate-600">
        {label}
      </span>
      <span className="tabular-nums">
        <span className="text-emerald-300 light:text-emerald-600">
          {a.toFixed(2)}
        </span>
        <span className="text-slate-500"> / </span>
        <span className="text-sky-300 light:text-sky-600">
          {b.toFixed(2)}
        </span>
        <span className="text-slate-500"> {unit}</span>
      </span>
    </div>
  );

  const yoloLoaded = !!yoloSess.current;
  const argusLoaded = !!argusSess.current;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="card-glass border-slate-800/60 bg-slate-950/80 p-4 md:p-6 light:border-slate-200 light:bg-white"
    >
      <AnimatePresence>
        {showIntro && (
          <InfoCarousel onClose={() => setShowIntro(false)} />
        )}
      </AnimatePresence>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="mb-4 grid gap-3 md:grid-cols-2"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-200 light:text-slate-700">
            YOLO model:
          </span>
          <input
            className="w-52 rounded-lg border border-white/10 bg-slate-900/60 px-3 py-1.5 text-xs text-white outline-none focus:ring-2 focus:ring-cyan-500/40 light:border-slate-200 light:bg-slate-50 light:text-slate-900"
            value={yoloUrl}
            onChange={(e) => setYoloUrl(e.target.value)}
            placeholder="/models/yolo.onnx"
          />
          {loadBtn(
            yoloLoaded ? "Reload YOLO" : "Load YOLO",
            loadYolo,
            loadingYolo,
          )}
          <span className="text-[10px] text-slate-500">
            EP: {yoloProvider.current || "…"}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-200 light:text-slate-700">
            ARGUS v8x model:
          </span>
          <input
            className="w-52 rounded-lg border border-white/10 bg-slate-900/60 px-3 py-1.5 text-xs text-white outline-none focus:ring-2 focus:ring-cyan-500/40 light:border-slate-200 light:bg-slate-50 light:text-slate-900"
            value={argusUrl}
            onChange={(e) => setArgusUrl(e.target.value)}
            placeholder="/models/argus_v8x.onnx"
          />
          {loadBtn(
            argusLoaded ? "Reload ARGUS" : "Load ARGUS",
            loadArgus,
            loadingArgus,
          )}
          <span className="text-[10px] text-slate-500">
            EP: {argusProvider.current || "…"}
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="mb-4 flex flex-wrap items-center gap-3"
      >
        <label className="text-xs text-slate-200 light:text-slate-700">
          Img size:
          <input
            type="number"
            min={320}
            max={1280}
            step={32}
            className="ml-2 w-20 rounded-lg border border-white/10 bg-slate-900/60 px-2 py-1 text-xs text-white outline-none focus:ring-2 focus:ring-cyan-500/40 light:border-slate-200 light:bg-slate-50 light:text-slate-900"
            value={imgSize}
            onChange={(e) =>
              setImgSize(
                Math.max(32, parseInt(e.target.value || "640", 10)),
              )
            }
          />
        </label>

        {!running ? (
          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={start}
            className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-slate-900 shadow light:bg-slate-900 light:text-white"
          >
            Start
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={stop}
            className="rounded-full bg-red-500 px-4 py-1.5 text-xs font-semibold text-white"
          >
            Stop
          </motion.button>
        )}

        <label className="ml-auto text-[11px] text-slate-200 light:text-slate-700">
          Load video:
          <input
            type="file"
            accept="video/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const url = URL.createObjectURL(f);
              const v = videoRef.current;
              if (v) {
                v.src = url;
                v.currentTime = 0;
                v.play().catch(() => {});
              }
            }}
            className="ml-2 text-[11px] text-slate-200 light:text-slate-700"
          />
        </label>
      </motion.div>

      {/* Summary cards */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="mb-4 grid gap-3 md:grid-cols-3"
      >
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3 text-xs text-slate-200 light:border-slate-200 light:bg-slate-50 light:text-slate-800">
          <div className="mb-1 text-[11px] font-semibold">
            Input pipeline
          </div>
          <div className="flex items-center justify-between">
            <span>Approx FPS</span>
            <span className="tabular-nums">
              {card.inputFPS.toFixed(1)} fps
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3 text-xs text-slate-200 light:border-slate-200 light:bg-slate-50 light:text-slate-800">
          <div className="mb-1 text-[11px] font-semibold text-emerald-300">
            YOLO ({card.yolo.provider})
          </div>
          {statLine(
            "Infer last / avg",
            card.yolo.infLast,
            card.yolo.infAvg,
          )}
          {statLine(
            "E2E last / avg",
            card.yolo.e2eLast,
            card.yolo.e2eAvg,
          )}
          <div className="mt-1 flex items-center justify-between">
            <span>Infer FPS</span>
            <span className="tabular-nums">
              {card.yolo.fpsInf.toFixed(1)} fps
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>E2E FPS</span>
            <span className="tabular-nums">
              {card.yolo.fpsE2E.toFixed(1)} fps
            </span>
          </div>
          <div className="mt-1 text-[10px] text-slate-500">
            Frames: {card.yolo.frames}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3 text-xs text-slate-200 light:border-slate-200 light:bg-slate-50 light:text-slate-800">
          <div className="mb-1 text-[11px] font-semibold text-sky-300">
            ARGUS v8x ({card.argus.provider})
          </div>
          {statLine(
            "Infer last / avg",
            card.argus.infLast,
            card.argus.infAvg,
          )}
          {statLine(
            "E2E last / avg",
            card.argus.e2eLast,
            card.argus.e2eAvg,
          )}
          <div className="mt-1 flex items-center justify-between">
            <span>Infer FPS</span>
            <span className="tabular-nums">
              {card.argus.fpsInf.toFixed(1)} fps
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>E2E FPS</span>
            <span className="tabular-nums">
              {card.argus.fpsE2E.toFixed(1)} fps
            </span>
          </div>
          <div className="mt-1 text-[10px] text-slate-500">
            Frames: {card.argus.frames}
          </div>
        </div>
      </motion.div>

      {/* Hidden source video */}
      <video
        ref={videoRef}
        className="hidden"
        autoPlay
        muted
        loop
        playsInline
      />

      {/* 3-panel visual */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.35 }}
        className="grid gap-3 lg:grid-cols-3"
      >
        <div className="rounded-xl border border-white/10 bg-black/40 p-3 light:border-slate-200 light:bg-slate-100">
          <div className="mb-2 text-xs text-slate-200 light:text-slate-700">
            1) Input (no processing) — stats overlay
          </div>
          <canvas
            ref={inputCanvasRef}
            className="h-auto w-full rounded-lg border border-white/10 bg-black"
          />
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 p-3 light:border-slate-200 light:bg-slate-100">
          <div className="mb-2 text-xs text-slate-200 light:text-slate-700">
            2) YOLO — stats overlay
          </div>
          <canvas
            ref={yoloCanvasRef}
            className="h-auto w-full rounded-lg border border-white/10 bg-black"
          />
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 p-3 light:border-slate-200 light:bg-slate-100">
          <div className="mb-2 text-xs text-slate-200 light:text-slate-700">
            3) ARGUS v8x — stats overlay
          </div>
          <canvas
            ref={argusCanvasRef}
            className="h-auto w-full rounded-lg border border-white/10 bg-black"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}