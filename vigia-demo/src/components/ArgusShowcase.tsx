"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { BBox, nms, parseYoloV8Raw } from "@/lib/yoloPost";

/** Global typings for UMD builds */
declare global {
  interface Window {
    tf: any;
    tflite: any;
  }
}

/** Pinned (local) script versions – you already copied these into /public/vendor */
const TFJS_VER = "3.8.0";
const TFLITE_VER = "0.0.1-alpha.8";

type ModelChoice = "yolov8" | "argusv8x" | "baseline";
type BackendStatus = "loading" | "webgl" | "cpu" | "failed";

export default function ArgusShowcase() {
  const [scriptsReady, setScriptsReady] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [running, setRunning] = useState(false);            // ⬅️ new: simulation toggle
  const [modelName, setModelName] = useState<ModelChoice>("yolov8");
  const [fps, setFps] = useState(0);
  const [lat, setLat] = useState(0);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modelRef = useRef<any | null>(null);
  const rafRef = useRef<number | null>(null);

  // Model/head constants
  const IN_SIZE = 640;
  const NUM_COLS = 6; // 4 box + 1 obj + C (C=1)

  const clearError = () => setErrorMessage(null);

  /** Load TFJS backend + TFLite + model (as before) */
  useEffect(() => {
    if (!scriptsReady) return;

    (async () => {
      clearError();
      setBackendStatus("loading");

      const tf = window.tf;
      const tflite = window.tflite;
      if (!tf || !tflite) {
        const error = "TensorFlow.js failed to load properly";
        setErrorMessage(error);
        setBackendStatus("failed");
        console.error(error);
        return;
      }

      try {
        // Prefer WebGL; fall back to CPU
        const canvas = document.createElement("canvas");
        const gl =
          canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        if (!gl) throw new Error("WebGL is not supported in this browser");

        await tf.setBackend("webgl");
        await tf.ready();
        const backend = tf.getBackend();
        if (backend === "webgl") {
          setBackendStatus("webgl");
          console.log("✅ WebGL backend initialized");
        } else {
          throw new Error(`Expected WebGL but got: ${backend}`);
        }
      } catch (webglError: any) {
        console.warn("WebGL failed, falling back to CPU:", webglError);
        try {
          await window.tf.setBackend("cpu");
          await window.tf.ready();
          setBackendStatus("cpu");
          setErrorMessage(
            `WebGL unavailable: ${webglError.message}. Using CPU backend (slower).`
          );
          console.log("✅ CPU backend initialized");
        } catch (cpuError: any) {
          const error = `Both WebGL and CPU backends failed: ${cpuError.message}`;
          setErrorMessage(error);
          setBackendStatus("failed");
          console.error(error);
          return;
        }
      }

      // (You already placed the WASM files locally under /public/vendor/tflite/wasm)
      // If you want to explicitly set the path in UMD, you can expose it here:
      // window.tflite.setWasmPath("/vendor/tflite/wasm/");

      // Load the model (only once per modelName)
      setModelReady(false);
      try {
        const url =
          modelName === "yolov8"
            ? "/models/yolov8-q.tflite"
            : "/models/yolov8-q.tflite";
        console.log(`Loading model from: ${url}`);
        modelRef.current = await window.tflite.loadTFLiteModel(url);
        setModelReady(true);
        console.log("✅ Model loaded");
        clearError();
      } catch (modelError: any) {
        const error = `Model loading failed: ${modelError.message}`;
        setErrorMessage(error);
        setModelReady(false);
        console.error(error);
      }
    })().catch((e) => {
      const error = `Unexpected initialization error: ${e.message}`;
      setErrorMessage(error);
      setModelReady(false);
      setBackendStatus("failed");
      console.error("Init/load error:", e);
    });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [scriptsReady, modelName]);

  /** Main render loop – now gated by `running` */
  useEffect(() => {
    const tf = window.tf as any;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!scriptsReady || !modelReady || backendStatus === "failed") return;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Ensure canvas is at least painted with a still frame even when not running
    const paintStill = () => {
      const W = video.videoWidth || 1280;
      const H = video.videoHeight || 720;
      canvas.width = W;
      canvas.height = H;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.font = "600 18px ui-sans-serif, system-ui";
      ctx.fillText("Ready to run simulation", 16, 32);
    };

    if (!running) {
      // Pause video & cancel any RAF
      try {
        video.pause();
      } catch {}
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      paintStill();
      return;
    }

    // Running: play video and start RAF
    let frames = 0;
    let lastFpsMark = performance.now();

    const run = async () => {
      rafRef.current = requestAnimationFrame(run);

      if (video.readyState < 2) return;
      const W = video.videoWidth;
      const H = video.videoHeight;
      if (!W || !H) return;

      if (canvas.width !== W) canvas.width = W;
      if (canvas.height !== H) canvas.height = H;

      const t0 = performance.now();

      try {
        ctx.drawImage(video, 0, 0, W, H);

        const input = tf.tidy(() => {
          const frame = tf.browser.fromPixels(video);
          const resized = tf.image.resizeBilinear(frame, [IN_SIZE, IN_SIZE], true);
          const f32 = tf.cast(resized, "float32");
          const norm = tf.div(f32, 255);
          return tf.expandDims(norm, 0);
        });

        const raw = modelRef.current!.predict(input);
        input.dispose();

        const arr = Array.isArray(raw) ? raw : Object.values(raw as any);
        const head: Float32Array =
          arr.reduce<Float32Array | null>((best, cur: any) => {
            const typed =
              cur instanceof Float32Array
                ? cur
                : cur?.data instanceof Float32Array
                ? (cur.data as Float32Array)
                : null;
            if (!typed) return best;
            if (!best || typed.length > best.length) return typed;
            return best;
          }, null) || new Float32Array();

        const dets: BBox[] = nms(
          parseYoloV8Raw(head, NUM_COLS, 0.25),
          0.45,
          50
        );

        for (const b of dets) {
          const sx = (b.x / IN_SIZE) * W;
          const sy = (b.y / IN_SIZE) * H;
          const sw = (b.w / IN_SIZE) * W;
          const sh = (b.h / IN_SIZE) * H;

          ctx.save();
          ctx.beginPath();
          ctx.rect(sx - sw / 2, sy - sh / 2, sw, sh);
          ctx.clip();
          ctx.filter = "blur(6px)";
          ctx.drawImage(video, 0, 0, W, H);
          ctx.restore();

          ctx.strokeStyle = "rgba(56,189,248,0.9)";
          ctx.lineWidth = 2;
          ctx.strokeRect(sx - sw / 2, sy - sh / 2, sw, sh);

          const label = `hazard ${(b.score * 100).toFixed(1)}%`;
          ctx.font = "14px ui-monospace, SFMono-Regular, Menlo, monospace";
          const tw = ctx.measureText(label).width + 8;
          ctx.fillStyle = "rgba(2,6,23,0.85)";
          ctx.fillRect(sx - sw / 2, sy - sh / 2 - 18, tw, 18);
          ctx.fillStyle = "white";
          ctx.fillText(label, sx - sw / 2 + 4, sy - sh / 2 - 5);
        }

        const t1 = performance.now();
        setLat(Math.round(t1 - t0));
        frames++;
        if (t1 - lastFpsMark > 500) {
          setFps(Math.round((frames * 1000) / (t1 - lastFpsMark)));
          frames = 0;
          lastFpsMark = t1;
        }
      } catch (e) {
        console.error("Inference error:", e);
      }
    };

    // start playback & loop
    (async () => {
      try {
        video.playbackRate = 1.0;
        await video.play();
      } catch {}
      rafRef.current = requestAnimationFrame(run);
    })();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      try {
        video.pause();
      } catch {}
    };
  }, [scriptsReady, modelReady, backendStatus, running]);

  /** UI helpers */
  const getStatusText = () => {
    if (!scriptsReady) return "Loading runtime…";
    if (backendStatus === "failed") return "Backend failed - check console";
    if (!modelReady) return "Loading model…";
    return `On-device inference (backend: ${backendStatus.toUpperCase()})`;
  };
  const getStatusColor = () =>
    backendStatus === "failed"
      ? "bg-red-500/60"
      : backendStatus === "cpu"
      ? "bg-yellow-500/60"
      : "bg-black/60";

  /** Start/Stop button (green arrow) */
  const RunButton = (
    <button
      type="button"
      onClick={() => setRunning((v) => !v)}
      disabled={!modelReady || backendStatus === "failed"}
      className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium
        ${running ? "bg-emerald-600 text-white hover:bg-emerald-500" : "bg-emerald-500 text-white hover:bg-emerald-400"}
        disabled:opacity-60 disabled:cursor-not-allowed`}
      title={running ? "Stop simulation" : "Run simulation"}
    >
      {/* green arrow icon */}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        {running ? (
          // stop icon
          <rect x="6" y="6" width="12" height="12" rx="2" />
        ) : (
          // play arrow
          <path d="M8 5v14l11-7-11-7z" />
        )}
      </svg>
      {running ? "Stop simulation" : "Run simulation"}
    </button>
  );

  return (
    <>
      {/* Local UMD scripts */}
      <Script
        src={`/vendor/tfjs/tf-core.min.js?v=${TFJS_VER}`}
        strategy="afterInteractive"
        onReady={() => console.log("TF Core loaded")}
        onError={() => setErrorMessage("Failed to load TensorFlow Core")}
      />
      <Script
        src={`/vendor/tfjs/tf-backend-cpu.min.js?v=${TFJS_VER}`}
        strategy="afterInteractive"
        onReady={() => console.log("CPU backend loaded")}
        onError={() => setErrorMessage("Failed to load CPU backend")}
      />
      <Script
        src={`/vendor/tfjs/tf-backend-webgl.min.js?v=${TFJS_VER}`}
        strategy="afterInteractive"
        onReady={() => console.log("WebGL backend loaded")}
        onError={() => setErrorMessage("Failed to load WebGL backend")}
      />
      <Script
        src={`/vendor/tflite/tf-tflite.min.js?v=${TFLITE_VER}`}
        strategy="afterInteractive"
        onReady={() => setScriptsReady(true)}
        onError={() => setErrorMessage("Failed to load TFLite runtime")}
      />

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
        {errorMessage && (
          <div className="mb-4 rounded-lg bg-red-500/15 p-3 border border-red-500/30">
            <div className="flex items-center justify-between">
              <span className="text-red-300 text-sm">{errorMessage}</span>
              <button
                onClick={clearError}
                className="text-red-300 hover:text-white text-sm font-medium"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="mb-3 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setModelName("yolov8")}
              className={`rounded px-3 py-1 text-sm ${
                modelName === "yolov8" ? "bg-white text-slate-900" : "bg-white/10 text-white"
              }`}
            >
              YOLOv8 (TFLite)
            </button>
            <button disabled className="cursor-not-allowed rounded px-3 py-1 text-sm bg-white/5 text-slate-300/60">
              Argus-V8X (SimAM+Swin)
            </button>
            <button disabled className="cursor-not-allowed rounded px-3 py-1 text-sm bg-white/5 text-slate-300/60">
              Baseline
            </button>

            {/* ▶️ Run / Stop */}
            <div className="ml-2">{RunButton}</div>
          </div>

          <div className="flex gap-3 text-sm text-slate-200">
            <span
              className={`rounded px-2 py-1 ${
                backendStatus === "webgl"
                  ? "bg-emerald-500/15 text-emerald-300"
                  : backendStatus === "cpu"
                  ? "bg-yellow-500/15 text-yellow-300"
                  : "bg-red-500/15 text-red-300"
              }`}
            >
              Backend: {backendStatus.toUpperCase()}
            </span>
            <span className="rounded bg-emerald-500/15 px-2 py-1 text-emerald-300">
              Latency: {lat} ms
            </span>
            <span className="rounded bg-sky-500/15 px-2 py-1 text-sky-300">FPS: {fps}</span>
            <span className="rounded bg-fuchsia-500/15 px-2 py-1 text-fuchsia-300">mAP: n/a</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black">
          <video
            ref={videoRef}
            src="/demo/hazard.mp4"
            loop
            muted
            playsInline
            className="hidden"
            // we call play/pause ourselves based on `running`
          />
          <canvas ref={canvasRef} className="block h-auto w-full" />
          <div
            className={`pointer-events-none absolute left-2 top-2 rounded px-2 py-1 text-xs text-white ${getStatusColor()}`}
          >
            {getStatusText()}
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-400">
          *If boxes look off, tweak <code>NUM_COLS</code> and your <code>parseYoloV8Raw</code> indices.
        </p>

        <div className="mt-2 text-xs text-slate-500">
          Status: {scriptsReady ? "Scripts loaded" : "Loading scripts"} | Backend: {backendStatus} | Model:{" "}
          {modelReady ? "Ready" : "Loading"} | Simulation: {running ? "Running" : "Stopped"}
        </div>
      </div>
    </>
  );
}