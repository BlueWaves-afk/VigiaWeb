"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as ort from "onnxruntime-web";

type Detection = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  score: number;
};

export default function AegisDemo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<ort.InferenceSession | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const [detectionCount, setDetectionCount] = useState(0);
  const [blurIntensity, setBlurIntensity] = useState(15);

  const fpsRef = useRef({ frames: 0, lastTime: performance.now() });

  useEffect(() => {
    let mounted = true;

    const loadModel = async () => {
      try {
        setIsLoading(true);
        setError(null);

        ort.env.wasm.wasmPaths = "/ort/";
        ort.env.wasm.numThreads = 4;

        const session = await ort.InferenceSession.create(
          "/models/UltrafaceRFB320Int8.onnx",
          {
            executionProviders: ["wasm"],
            graphOptimizationLevel: "all",
          } as const,
        );

        if (mounted) {
          sessionRef.current = session;
        }
      } catch (err) {
        console.error("Failed to load model:", err);
        if (mounted) {
          setError("Failed to load face detection model.");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadModel();

    return () => {
      mounted = false;
      sessionRef.current = null;
    };
  }, []);

  const preprocessFrame = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
    ): ort.Tensor => {
      const modelWidth = 320;
      const modelHeight = 240;

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = modelWidth;
      tempCanvas.height = modelHeight;
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) throw new Error("Failed to get temp canvas context");

      tempCtx.drawImage(
        ctx.canvas,
        0,
        0,
        width,
        height,
        0,
        0,
        modelWidth,
        modelHeight,
      );

      const imageData = tempCtx.getImageData(0, 0, modelWidth, modelHeight);
      const { data } = imageData;

      const float32Data = new Float32Array(
        3 * modelWidth * modelHeight,
      );

      for (let i = 0; i < modelWidth * modelHeight; i++) {
        const r = data[i * 4];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];

        float32Data[i] = (r - 127.5) / 127.5;
        float32Data[modelWidth * modelHeight + i] =
          (g - 127.5) / 127.5;
        float32Data[2 * modelWidth * modelHeight + i] =
          (b - 127.5) / 127.5;
      }

      return new ort.Tensor("float32", float32Data, [
        1,
        3,
        modelHeight,
        modelWidth,
      ]);
    },
    [],
  );

  const nms = useCallback((detections: Detection[], iouThreshold = 0.4) => {
    if (!detections.length) return [];

    const sorted = [...detections].sort(
      (a, b) => b.score - a.score,
    );
    const keep: Detection[] = [];

    while (sorted.length) {
      const current = sorted.shift()!;
      keep.push(current);

      sorted.splice(
        0,
        sorted.length,
        ...sorted.filter((det) => {
          const ix1 = Math.max(current.x1, det.x1);
          const iy1 = Math.max(current.y1, det.y1);
          const ix2 = Math.min(current.x2, det.x2);
          const iy2 = Math.min(current.y2, det.y2);

          const inter =
            Math.max(0, ix2 - ix1) * Math.max(0, iy2 - iy1);
          const area1 =
            (current.x2 - current.x1) * (current.y2 - current.y1);
          const area2 =
            (det.x2 - det.x1) * (det.y2 - det.y1);
          const union = area1 + area2 - inter;

          const iou = union > 0 ? inter / union : 0;
          return iou <= iouThreshold;
        }),
      );
    }

    return keep;
  }, []);

  const postprocessOutput = useCallback(
    (
      scores: Float32Array,
      boxes: Float32Array,
      width: number,
      height: number,
    ): Detection[] => {
      const detections: Detection[] = [];
      const scoreThreshold = 0.7;

      const numAnchors = scores.length / 2;

      for (let i = 0; i < numAnchors; i++) {
        const faceScore = scores[i * 2 + 1];
        if (faceScore <= scoreThreshold) continue;

        const x1 = boxes[i * 4] * width;
        const y1 = boxes[i * 4 + 1] * height;
        const x2 = boxes[i * 4 + 2] * width;
        const y2 = boxes[i * 4 + 3] * height;

        detections.push({
          x1: Math.max(0, x1),
          y1: Math.max(0, y1),
          x2: Math.min(width, x2),
          y2: Math.min(height, y2),
          score: faceScore,
        });
      }

      return nms(detections);
    },
    [nms],
  );

  const blurFaces = useCallback(
    (ctx: CanvasRenderingContext2D, detections: Detection[]) => {
      detections.forEach((det) => {
        const boxWidth = det.x2 - det.x1;
        const boxHeight = det.y2 - det.y1;

        const padding = 5;
        const x = Math.max(0, Math.floor(det.x1 - padding));
        const y = Math.max(0, Math.floor(det.y1 - padding));
        const w = Math.min(
          ctx.canvas.width - x,
          Math.ceil(boxWidth + padding * 2),
        );
        const h = Math.min(
          ctx.canvas.height - y,
          Math.ceil(boxHeight + padding * 2),
        );
        if (w <= 0 || h <= 0) return;

        const imageData = ctx.getImageData(x, y, w, h);
        const data = imageData.data;

        const pixelSize = Math.max(1, blurIntensity);

        for (let py = 0; py < h; py += pixelSize) {
          for (let px = 0; px < w; px += pixelSize) {
            const endX = Math.min(px + pixelSize, w);
            const endY = Math.min(py + pixelSize, h);

            let r = 0,
              g = 0,
              b = 0,
              a = 0,
              count = 0;

            for (let dy = py; dy < endY; dy++) {
              for (let dx = px; dx < endX; dx++) {
                const i = (dy * w + dx) * 4;
                r += data[i];
                g += data[i + 1];
                b += data[i + 2];
                a += data[i + 3];
                count++;
              }
            }

            if (!count) continue;
            r = Math.round(r / count);
            g = Math.round(g / count);
            b = Math.round(b / count);
            a = Math.round(a / count);

            for (let dy = py; dy < endY; dy++) {
              for (let dx = px; dx < endX; dx++) {
                const i = (dy * w + dx) * 4;
                data[i] = r;
                data[i + 1] = g;
                data[i + 2] = b;
                data[i + 3] = a;
              }
            }
          }
        }

        ctx.putImageData(imageData, x, y);

        ctx.strokeStyle = "#06b6d4";
        ctx.lineWidth = 2;
        ctx.strokeRect(det.x1, det.y1, boxWidth, boxHeight);

        ctx.fillStyle = "#06b6d4";
        ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.fillText(
          `Face ${(det.score * 100).toFixed(0)}%`,
          det.x1,
          Math.max(14, det.y1 - 6),
        );
      });
    },
    [blurIntensity],
  );

  const processFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !sessionRef.current)
      return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx || video.paused || video.ended) return;

    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const inputTensor = preprocessFrame(
        ctx,
        canvas.width,
        canvas.height,
      );

      const feeds: Record<string, ort.Tensor> = {};
      feeds[sessionRef.current.inputNames[0]] = inputTensor;

      const results = await sessionRef.current.run(feeds);

      const scoresOutput = results[sessionRef.current.outputNames[0]];
      const boxesOutput = results[sessionRef.current.outputNames[1]];

      const scores = scoresOutput.data as Float32Array;
      const boxes = boxesOutput.data as Float32Array;

      const detections = postprocessOutput(
        scores,
        boxes,
        canvas.width,
        canvas.height,
      );
      setDetectionCount(detections.length);

      if (detections.length) {
        blurFaces(ctx, detections);
      }

      fpsRef.current.frames++;
      const now = performance.now();
      if (now - fpsRef.current.lastTime >= 1000) {
        setFps(fpsRef.current.frames);
        fpsRef.current.frames = 0;
        fpsRef.current.lastTime = now;
      }
    } catch (err) {
      console.error("Frame processing error:", err);
    }

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
    }
  }, [isPlaying, preprocessFrame, postprocessOutput, blurFaces]);

  const togglePlayback = useCallback(() => {
    if (!videoRef.current || !sessionRef.current) return;
    const video = videoRef.current;

    if (isPlaying) {
      video.pause();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setIsPlaying(false);
    } else {
      video.currentTime = 0;
      video.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
    }
    return () => {
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, processFrame]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const handleLoaded = () => {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
    };

    video.addEventListener("loadedmetadata", handleLoaded);
    return () => video.removeEventListener("loadedmetadata", handleLoaded);
  }, []);

  return (
    <section className="space-y-4">
      {/* Section header to match sandbox style */}
      <div className="space-y-1">
        <p className="text-xs font-medium tracking-[0.22em] text-cyan-400 light:text-blue-600">
          PRIVACY PIPELINE
        </p>
        <h2 className="text-lg font-semibold tracking-tight text-white light:text-slate-900">
          Aegis face privacy on the edge
        </h2>
        <p className="text-sm text-slate-400 light:text-slate-600">
          Real‑time face detection and pixelation in the browser using UltraFace
          INT8. Identities are scrubbed before any frame is used for training
          or hazard memory.
        </p>
      </div>

      <div className="card-glass border-slate-800/60 bg-slate-950/80 p-4 md:p-6 light:border-slate-200 light:bg-white">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
          >
            {error}
          </motion.div>
        )}

        {/* Video + canvas */}
        <div className="relative mb-4 overflow-hidden rounded-xl bg-black">
          <video
            ref={videoRef}
            src="/demo/face_blur.mp4"
            className="hidden"
            loop
            muted
            playsInline
          />

          <canvas
            ref={canvasRef}
            className="h-auto w-full"
            style={{ maxHeight: 520, objectFit: "contain" }}
          />

          <AnimatePresence>
            {isPlaying && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute left-4 top-4 flex flex-col gap-2"
              >
                <div className="rounded-lg bg-black/60 px-3 py-1.5 text-xs font-mono text-slate-50 backdrop-blur">
                  FPS: {fps}
                </div>
                <div className="rounded-lg bg-black/60 px-3 py-1.5 text-xs font-mono text-slate-50 backdrop-blur">
                  Faces: {detectionCount}
                </div>
                <div className="rounded-lg bg-emerald-500/25 px-3 py-1.5 text-[11px] font-semibold text-emerald-200 backdrop-blur">
                  ● LIVE (on‑device)
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="text-center">
                <div className="mb-3 inline-block h-10 w-10 animate-spin rounded-full border-4 border-cyan-500/30 border-t-cyan-500" />
                <p className="text-xs text-slate-100">
                  Loading UltraFace INT8 model…
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Controls + info */}
        <div className="flex flex-wrap items-center gap-4">
          <motion.button
            onClick={togglePlayback}
            disabled={isLoading || !!error}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className={`rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all ${
              isPlaying
                ? "bg-red-500 hover:bg-red-600"
                : "bg-emerald-500 hover:bg-emerald-600"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {isPlaying ? "Pause redaction" : "Start redaction"}
          </motion.button>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-300">Blur intensity</span>
            <input
              type="range"
              min={5}
              max={30}
              value={blurIntensity}
              onChange={(e) =>
                setBlurIntensity(Number(e.target.value))
              }
              className="h-1 w-32 cursor-pointer accent-cyan-400"
            />
            <span className="font-mono text-cyan-300">
              {blurIntensity}px
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2 2 7l10 5 10-5-10-5Z" />
                <path d="m2 12 10 5 10-5" />
                <path d="m2 17 10 5 10-5" />
              </svg>
            </div>
            <span>UltraFace RFB‑320 INT8 · edge‑only tensors</span>
          </div>
        </div>

        {/* Feature chips */}
        <div className="mt-5 grid gap-3 text-xs sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800/70 bg-slate-900/70 p-3 light:border-slate-200 light:bg-slate-50">
            <div className="mb-1 text-[11px] font-semibold text-slate-100 light:text-slate-900">
              Edge processing
            </div>
            <p className="text-[11px] text-slate-400 light:text-slate-600">
              All detection + blur happens inside the browser. No pixel data is
              sent to the cloud.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800/70 bg-slate-900/70 p-3 light:border-slate-200 light:bg-slate-50">
            <div className="mb-1 text-[11px] font-semibold text-slate-100 light:text-slate-900">
              Privacy‑first
            </div>
            <p className="text-[11px] text-slate-400 light:text-slate-600">
              Faces are pixelated before frames are used for hazard memory,
              playback, or fine‑tuning.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800/70 bg-slate-900/70 p-3 light:border-slate-200 light:bg-slate-50">
            <div className="mb-1 text-[11px] font-semibold text-slate-100 light:text-slate-900">
              INT8 performance
            </div>
            <p className="text-[11px] text-slate-400 light:text-slate-600">
              Quantised UltraFace runs efficiently on CPU so privacy and latency
              stay within real‑time budgets.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}