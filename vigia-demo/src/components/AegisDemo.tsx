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

  // FPS calculation
  const fpsRef = useRef({ frames: 0, lastTime: performance.now() });

  // Load ONNX model
  useEffect(() => {
    let mounted = true;

    const loadModel = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Configure ONNX Runtime
        ort.env.wasm.wasmPaths = "/ort/";
        ort.env.wasm.numThreads = 4;

        // Load the UltraFace model
        const session = await ort.InferenceSession.create("/models/UltrafaceRFB320Int8.onnx", {
          executionProviders: ["wasm"],
          graphOptimizationLevel: "all",
        });

        if (mounted) {
          sessionRef.current = session;
          console.log("✅ UltraFace model loaded successfully");
          console.log("Input names:", session.inputNames);
          console.log("Output names:", session.outputNames);
        }
      } catch (err) {
        console.error("Failed to load model:", err);
        if (mounted) {
          setError("Failed to load face detection model");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadModel();

    return () => {
      mounted = false;
      if (sessionRef.current) {
        sessionRef.current = null;
      }
    };
  }, []);

  // Preprocess frame for UltraFace (expects 320x240 RGB)
  const preprocessFrame = useCallback((
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): ort.Tensor => {
    // UltraFace RFB-320 expects 320x240 input
    const modelWidth = 320;
    const modelHeight = 240;

    // Create temporary canvas for resizing
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = modelWidth;
    tempCanvas.height = modelHeight;
    const tempCtx = tempCanvas.getContext("2d");

    if (!tempCtx) {
      throw new Error("Failed to get temp canvas context");
    }

    // Draw resized image
    tempCtx.drawImage(ctx.canvas, 0, 0, width, height, 0, 0, modelWidth, modelHeight);

    // Get image data
    const imageData = tempCtx.getImageData(0, 0, modelWidth, modelHeight);
    const { data } = imageData;

    // Convert to float32 and normalize to [0, 1], then scale to [-1, 1]
    // UltraFace preprocessing: (pixel / 255.0 - 0.5) / 0.5 = (pixel - 127.5) / 127.5
    const float32Data = new Float32Array(3 * modelWidth * modelHeight);

    for (let i = 0; i < modelWidth * modelHeight; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];

      // CHW format (Channel, Height, Width)
      float32Data[i] = (r - 127.5) / 127.5; // R channel
      float32Data[modelWidth * modelHeight + i] = (g - 127.5) / 127.5; // G channel
      float32Data[2 * modelWidth * modelHeight + i] = (b - 127.5) / 127.5; // B channel
    }

    return new ort.Tensor("float32", float32Data, [1, 3, modelHeight, modelWidth]);
  }, []);

  // Non-Maximum Suppression
  const nms = useCallback((detections: Detection[], iouThreshold = 0.4): Detection[] => {
    if (detections.length === 0) return [];

    // Sort by score descending
    const sorted = [...detections].sort((a, b) => b.score - a.score);
    const keep: Detection[] = [];

    while (sorted.length > 0) {
      const current = sorted.shift()!;
      keep.push(current);

      sorted.splice(
        0,
        sorted.length,
        ...sorted.filter((det) => {
          const intersectX1 = Math.max(current.x1, det.x1);
          const intersectY1 = Math.max(current.y1, det.y1);
          const intersectX2 = Math.min(current.x2, det.x2);
          const intersectY2 = Math.min(current.y2, det.y2);

          const intersectArea = Math.max(0, intersectX2 - intersectX1) * Math.max(0, intersectY2 - intersectY1);
          const area1 = (current.x2 - current.x1) * (current.y2 - current.y1);
          const area2 = (det.x2 - det.x1) * (det.y2 - det.y1);
          const unionArea = area1 + area2 - intersectArea;

          const iou = intersectArea / unionArea;
          return iou <= iouThreshold;
        })
      );
    }

    return keep;
  }, []);

  // Post-process UltraFace output
  const postprocessOutput = useCallback(
    (scores: Float32Array, boxes: Float32Array, width: number, height: number): Detection[] => {
      const detections: Detection[] = [];
      const scoreThreshold = 0.7;

      // UltraFace outputs:
      // scores: [1, num_anchors, 2] - background and face scores
      // boxes: [1, num_anchors, 4] - bbox coordinates

      const numAnchors = scores.length / 2;

      for (let i = 0; i < numAnchors; i++) {
        const faceScore = scores[i * 2 + 1]; // Index 1 is face score

        if (faceScore > scoreThreshold) {
          // Get box coordinates (normalized 0-1)
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
      }

      return nms(detections);
    },
    [nms]
  );

  // Apply blur to detected faces
  const blurFaces = useCallback(
    (ctx: CanvasRenderingContext2D, detections: Detection[]) => {
      detections.forEach((det) => {
        const boxWidth = det.x2 - det.x1;
        const boxHeight = det.y2 - det.y1;

        // Expand box slightly for better coverage
        const padding = 5;
        const x = Math.max(0, Math.floor(det.x1 - padding));
        const y = Math.max(0, Math.floor(det.y1 - padding));
        const w = Math.min(ctx.canvas.width - x, Math.ceil(boxWidth + padding * 2));
        const h = Math.min(ctx.canvas.height - y, Math.ceil(boxHeight + padding * 2));

        // Skip if dimensions are invalid
        if (w <= 0 || h <= 0) return;

        // Get the face region
        const imageData = ctx.getImageData(x, y, w, h);
        const data = imageData.data;

        // Apply pixelation blur effect
        const pixelSize = Math.max(1, blurIntensity);
        
        for (let py = 0; py < h; py += pixelSize) {
          for (let px = 0; px < w; px += pixelSize) {
            // Calculate the bounds for this pixel block
            const blockEndX = Math.min(px + pixelSize, w);
            const blockEndY = Math.min(py + pixelSize, h);
            
            // Get average color of pixel block
            let r = 0, g = 0, b = 0, a = 0, count = 0;

            for (let dy = py; dy < blockEndY; dy++) {
              for (let dx = px; dx < blockEndX; dx++) {
                const i = (dy * w + dx) * 4;
                r += data[i];
                g += data[i + 1];
                b += data[i + 2];
                a += data[i + 3];
                count++;
              }
            }

            if (count > 0) {
              r = Math.round(r / count);
              g = Math.round(g / count);
              b = Math.round(b / count);
              a = Math.round(a / count);

              // Fill the entire block with the average color
              for (let dy = py; dy < blockEndY; dy++) {
                for (let dx = px; dx < blockEndX; dx++) {
                  const i = (dy * w + dx) * 4;
                  data[i] = r;
                  data[i + 1] = g;
                  data[i + 2] = b;
                  data[i + 3] = a;
                }
              }
            }
          }
        }

        // Put the blurred region back
        ctx.putImageData(imageData, x, y);

        // Draw bounding box
        ctx.strokeStyle = "#06b6d4";
        ctx.lineWidth = 2;
        ctx.strokeRect(det.x1, det.y1, boxWidth, boxHeight);

        // Draw confidence score
        ctx.fillStyle = "#06b6d4";
        ctx.font = "14px monospace";
        ctx.fillText(
          `Face ${(det.score * 100).toFixed(0)}%`,
          det.x1,
          det.y1 - 8
        );
      });
    },
    [blurIntensity]
  );

  // Process video frame
  const processFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !sessionRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || video.paused || video.ended) {
      return;
    }

    try {
      // Draw current video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Preprocess for model
      const inputTensor = preprocessFrame(ctx, canvas.width, canvas.height);

      // Run inference
      const feeds: Record<string, ort.Tensor> = {};
      feeds[sessionRef.current.inputNames[0]] = inputTensor;

      const results = await sessionRef.current.run(feeds);

      // Get outputs (scores and boxes)
      const scoresOutput = results[sessionRef.current.outputNames[0]];
      const boxesOutput = results[sessionRef.current.outputNames[1]];

      const scores = scoresOutput.data as Float32Array;
      const boxes = boxesOutput.data as Float32Array;

      // Post-process to get detections
      const detections = postprocessOutput(scores, boxes, canvas.width, canvas.height);
      setDetectionCount(detections.length);

      // Blur detected faces directly on the current frame
      if (detections.length > 0) {
        blurFaces(ctx, detections);
      }

      // Calculate FPS
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

    // Continue processing
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
    }
  }, [isPlaying, preprocessFrame, postprocessOutput, blurFaces]);

  // Handle play/pause
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
      video.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // Start processing when video plays
  useEffect(() => {
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, processFrame]);

  // Initialize video and canvas
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas) {
      const handleLoadedMetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      };

      video.addEventListener("loadedmetadata", handleLoadedMetadata);

      return () => {
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      };
    }
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="mb-3 text-3xl font-semibold text-white sm:text-4xl">
            Aegis Face Privacy
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-300">
            Real-time face detection and blurring using UltraFace INT8 model.
            Privacy-first processing directly in your browser.
          </p>
        </div>

        {/* Main Demo Area */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-800/50 p-6 backdrop-blur-lg">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300"
            >
              {error}
            </motion.div>
          )}

          {/* Video Display */}
          <div className="relative mb-6 overflow-hidden rounded-xl bg-black">
            {/* Hidden video element */}
            <video
              ref={videoRef}
              src="/demo/face_blur.mp4"
              className="hidden"
              loop
              muted
              playsInline
            />

            {/* Canvas for rendering with blur */}
            <canvas
              ref={canvasRef}
              className="w-full h-auto"
              style={{ maxHeight: "600px", objectFit: "contain" }}
            />

            {/* Stats Overlay */}
            <AnimatePresence>
              {isPlaying && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute left-4 top-4 flex flex-col gap-2"
                >
                  <div className="rounded-lg bg-black/60 px-3 py-1.5 text-xs font-mono text-white backdrop-blur-lg">
                    FPS: {fps}
                  </div>
                  <div className="rounded-lg bg-black/60 px-3 py-1.5 text-xs font-mono text-white backdrop-blur-lg">
                    Faces: {detectionCount}
                  </div>
                  <div className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 backdrop-blur-lg">
                    ● LIVE
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="text-center">
                  <div className="mb-3 inline-block h-10 w-10 animate-spin rounded-full border-4 border-cyan-500/30 border-t-cyan-500"></div>
                  <p className="text-sm text-white">Loading model...</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <motion.button
              onClick={togglePlayback}
              disabled={isLoading || !!error}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`rounded-xl px-6 py-3 font-semibold transition-all ${
                isPlaying
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-emerald-500 text-white hover:bg-emerald-600"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isPlaying ? "⏸ Pause" : "▶ Start Detection"}
            </motion.button>

            {/* Blur Intensity Control */}
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-300">Blur Intensity:</label>
              <input
                type="range"
                min="5"
                max="30"
                value={blurIntensity}
                onChange={(e) => setBlurIntensity(Number(e.target.value))}
                className="w-32"
              />
              <span className="text-sm font-mono text-cyan-300">{blurIntensity}px</span>
            </div>

            {/* Info */}
            <div className="ml-auto flex items-center gap-2 text-sm text-slate-400">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-cyan-400"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span>UltraFace RFB-320 INT8</span>
            </div>
          </div>

          {/* Feature Info */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-cyan-400"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-white">Edge Processing</h3>
              </div>
              <p className="text-xs text-slate-400">
                All processing happens locally in your browser. No data leaves your device.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-emerald-400"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-white">Privacy First</h3>
              </div>
              <p className="text-xs text-slate-400">
                Automatic face blurring protects identities in dashcam footage and street captures.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-purple-400"
                  >
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-white">Real-time</h3>
              </div>
              <p className="text-xs text-slate-400">
                Optimized INT8 quantized model runs efficiently on CPU with minimal latency.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
