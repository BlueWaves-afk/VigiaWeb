"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
// ultra-light ONNX runtime (WebGPU if available, fallback to WASM)
import * as ort from "onnxruntime-web";

// Reduce ONNX Runtime logging noise (warnings → dev console only on demand)
if (typeof window !== "undefined") {
  ort.env.logSeverityLevel = 3; // 0=verbose … 3=error, 4=fatal
  ort.env.logVerbosityLevel = 0;
}

/**
 * VIGIA Aegis (Privacy) Demo — UltraFace ONNX, on-device blur
 * - Plays a looping dashcam clip.
 * - Runs UltraFace (version-RFB-320-int8) in the browser to detect faces.
 * - Draws boxes for faces (from the model) + scripted plates/hazards.
 * - Togglable privacy blur obscures faces & plates via CSS.
 *
 * Put models here: /public/models/UltrafaceRFB320Int8.onnx
 * Video here:      /public/demo/face_blur.mp4  (or change VIDEO_SRC)
 */

type BoxType = "face" | "license_plate" | "pothole" | "debris";
type RGBHex = `#${string}`;

type Track = {
  id: string;
  type: BoxType;
  color: RGBHex;
  start: number;
  end: number;
  p0: { x: number; y: number; w: number; h: number }; // normalized [0..1]
  p1: { x: number; y: number; w: number; h: number }; // normalized [0..1]
  label?: string;
};

const VIDEO_SRC = "/demo/face_blur.mp4";
const ULTRAFACE_ONNX = "/models/UltrafaceRFB320Int8.onnx";

// ───────────────────────────────────────────────────────────────────────────────
// Scripted license plate + hazards (kept for demo continuity)
// ───────────────────────────────────────────────────────────────────────────────
const SCRIPTED: Track[] = [
  {
    id: "lp-1",
    type: "license_plate",
    color: "#60a5fa",
    start: 2.2,
    end: 5.6,
    p0: { x: 0.47, y: 0.60, w: 0.12, h: 0.08 },
    p1: { x: 0.49, y: 0.57, w: 0.11, h: 0.075 },
    label: "PLATE",
  },
  {
    id: "hz-1",
    type: "pothole",
    color: "#ef4444",
    start: 4.0,
    end: 6.5,
    p0: { x: 0.56, y: 0.78, w: 0.10, h: 0.06 },
    p1: { x: 0.54, y: 0.74, w: 0.12, h: 0.07 },
    label: "POTHOLE",
  },
  {
    id: "hz-2",
    type: "debris",
    color: "#f59e0b",
    start: 8.0,
    end: 11.3,
    p0: { x: 0.32, y: 0.80, w: 0.09, h: 0.06 },
    p1: { x: 0.30, y: 0.76, w: 0.11, h: 0.065 },
    label: "DEBRIS",
  },
];

// ───────────────────────────────────────────────────────────────────────────────
// UltraFace constants (RFB-320) — priors/nms/decoding for 320x240 input
// Based on the common UltraFace config.
// ───────────────────────────────────────────────────────────────────────────────
const UF_IN_W = 320;
const UF_IN_H = 240;
const UF_STEPS = [8, 16, 32, 64];
const UF_MIN_SIZES = [
  [10, 16, 24],
  [32, 48],
  [64, 96],
  [128, 192, 256],
];
const UF_VARIANCE: [number, number] = [0.1, 0.2];
const SCORE_THRESH = 0.6;
const NMS_THRESH = 0.3;
const MAX_DETS = 200;

// utilities
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// generate prior boxes for 320x240
function generatePriors() {
  const featureMaps: [number, number][] = UF_STEPS.map((s) => [
    Math.ceil(UF_IN_W / s),
    Math.ceil(UF_IN_H / s),
  ]);

  const priors: number[] = []; // flat [cx, cy, w, h] in 0..1
  for (let k = 0; k < featureMaps.length; k++) {
    const [fmW, fmH] = featureMaps[k];
    const minSizes = UF_MIN_SIZES[k];
    for (let i = 0; i < fmH; i++) {
      for (let j = 0; j < fmW; j++) {
        for (const ms of minSizes) {
          const s_kx = ms / UF_IN_W;
          const s_ky = ms / UF_IN_H;
          const cx = (j + 0.5) * UF_STEPS[k] / UF_IN_W;
          const cy = (i + 0.5) * UF_STEPS[k] / UF_IN_H;
          priors.push(cx, cy, s_kx, s_ky);
        }
      }
    }
  }
  return new Float32Array(priors);
}

// decode boxes (loc) given priors and variance → corner boxes [x1,y1,x2,y2] in 0..1
function decodeBoxes(loc: Float32Array, priors: Float32Array) {
  const decoded = new Float32Array((loc.length / 4) * 4);
  for (let i = 0; i < priors.length / 4; i++) {
    const px = priors[i * 4 + 0];
    const py = priors[i * 4 + 1];
    const pw = priors[i * 4 + 2];
    const ph = priors[i * 4 + 3];

    const dx = loc[i * 4 + 0];
    const dy = loc[i * 4 + 1];
    const dw = loc[i * 4 + 2];
    const dh = loc[i * 4 + 3];

    // center decode
    const cx = px + dx * UF_VARIANCE[0] * pw;
    const cy = py + dy * UF_VARIANCE[0] * ph;
    const w = pw * Math.exp(dw * UF_VARIANCE[1]);
    const h = ph * Math.exp(dh * UF_VARIANCE[1]);
    const x1 = cx - w / 2;
    const y1 = cy - h / 2;
    const x2 = cx + w / 2;
    const y2 = cy + h / 2;

    decoded[i * 4 + 0] = x1;
    decoded[i * 4 + 1] = y1;
    decoded[i * 4 + 2] = x2;
    decoded[i * 4 + 3] = y2;
  }
  return decoded;
}

// simple NMS (IoU)
function nms(boxes: Float32Array, scores: Float32Array, iouThresh: number, topk = MAX_DETS) {
  const idxs = Array.from(scores.keys()).sort((a, b) => scores[b] - scores[a]);
  const selected: number[] = [];
  const suppressed = new Uint8Array(scores.length);

  function iou(i: number, j: number) {
    const x1 = Math.max(boxes[i * 4 + 0], boxes[j * 4 + 0]);
    const y1 = Math.max(boxes[i * 4 + 1], boxes[j * 4 + 1]);
    const x2 = Math.min(boxes[i * 4 + 2], boxes[j * 4 + 2]);
    const y2 = Math.min(boxes[i * 4 + 3], boxes[j * 4 + 3]);
    const w = Math.max(0, x2 - x1);
    const h = Math.max(0, y2 - y1);
    const inter = w * h;
    const a =
      (boxes[i * 4 + 2] - boxes[i * 4 + 0]) *
      (boxes[i * 4 + 3] - boxes[i * 4 + 1]);
    const b =
      (boxes[j * 4 + 2] - boxes[j * 4 + 0]) *
      (boxes[j * 4 + 3] - boxes[j * 4 + 1]);
    return inter / (a + b - inter + 1e-6);
  }

  for (const i of idxs) {
    if (scores[i] < SCORE_THRESH) continue;
    if (suppressed[i]) continue;
    selected.push(i);
    if (selected.length >= topk) break;
    for (let k = 0; k < idxs.length; k++) {
      const j = idxs[k];
      if (suppressed[j]) continue;
      if (j === i) continue;
      if (iou(i, j) > iouThresh) suppressed[j] = 1;
    }
  }
  return selected;
}

// ───────────────────────────────────────────────────────────────────────────────
// Component
// ───────────────────────────────────────────────────────────────────────────────
export default function AegisDemo() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const [aegisOn, setAegisOn] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [visibleCounts, setVisibleCounts] = useState({ faces: 0, plates: 0 });
  const [logLines, setLogLines] = useState<string[]>([]);

  // UltraFace session + buffers
  const sessionRef = useRef<ort.InferenceSession | null>(null);
  const priorsRef = useRef<Float32Array | null>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const lastFacesLoggedRef = useRef<number | null>(null);
  const sessionLogRef = useRef({ waitingNotified: false });
  const pushLogRef = useRef<(msg: string) => void>(() => {});
  const inferCountRef = useRef(0);
  const tensorShapeRef = useRef<string | null>(null);
  const inferPendingRef = useRef(false);
  // store crop transform applied when resizing video → model input so we can map boxes back
  const cropRef = useRef<{ sx: number; sy: number; sw: number; sh: number } | null>(null);
  const blurSupportedRef = useRef<boolean>(true);

  const pushLog = useCallback((msg: string) => {
    const stamp = new Date().toLocaleTimeString();
    setLogLines((prev) => {
      const next = [...prev, `[${stamp}] ${msg}`];
      if (next.length > 60) next.shift();
      return next;
    });
  }, []);

  const clearLog = useCallback(() => setLogLines([]), []);

  useEffect(() => {
    pushLogRef.current = pushLog;
  }, [pushLog]);

  const togglePlayback = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play().catch(() => {});
    } else {
      v.pause();
    }
  };

  const restartPlayback = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    void v.play().catch(() => {});
  };

  // init ORT + session
  useEffect(() => {
    (async () => {
      try {
        // Try WebGPU first; fallback to WASM
        const opts: ort.InferenceSession.SessionOptions = {};
        if (typeof navigator !== "undefined" && "gpu" in navigator) {
          opts.executionProviders = ["webgpu"];
        } else {
          opts.executionProviders = ["wasm"];
        }
        sessionRef.current = await ort.InferenceSession.create(ULTRAFACE_ONNX, opts);
        priorsRef.current = generatePriors();
        const provider =
          (sessionRef.current as unknown as { executionProviders?: string[] })
            ?.executionProviders?.[0] ?? opts.executionProviders?.[0] ?? "unknown";
        
        // Log model input/output metadata for debugging
        const inputMetadata = sessionRef.current.inputNames.map(name => {
          // Try to get input metadata if available
          return { name };
        });
        
        console.info("[AegisDemo] UltraFace session ready", { 
          provider,
          inputNames: sessionRef.current.inputNames,
          outputNames: sessionRef.current.outputNames,
          inputMetadata,
        });
        console.warn("[AegisDemo] ⚠️  CRITICAL: Verify model expects [1, 3, 240, 320] shape (batch, channels, height, width)");
        
        pushLogRef.current(`UltraFace session ready (provider: ${provider})`);
        sessionLogRef.current.waitingNotified = false;
      } catch (e) {
        console.error("UltraFace init failed:", e);
        pushLogRef.current("UltraFace init failed; see console for details");
      }
    })();
  }, []);

  // keep React state in sync with the underlying <video> element and auto-start playback
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const handlePlay = () => setPlaying(true);
    const handlePause = () => setPlaying(false);
    const handleEnded = () => setPlaying(false);

    v.addEventListener("play", handlePlay);
    v.addEventListener("pause", handlePause);
    v.addEventListener("ended", handleEnded);

    const ensureStart = () => {
      if (!v) return;
      void v.play().catch(() => {
        // autoplay might fail until user interacts; leave state as-is
      });
    };

    if (v.readyState >= 2) ensureStart();
    else v.addEventListener("canplay", ensureStart, { once: true });

    return () => {
      v.removeEventListener("play", handlePlay);
      v.removeEventListener("pause", handlePause);
      v.removeEventListener("ended", handleEnded);
      v.removeEventListener("canplay", ensureStart);
    };
  }, []);

  // main loop: 1) run UltraFace ~8 FPS  2) place scripted boxes by time
  useEffect(() => {
    const v = videoRef.current;
    const wrap = wrapRef.current;
    if (!v || !wrap) return;

    const boxes = new Map<string, HTMLDivElement>();
    const faceIdsLive = new Set<string>(); // to recycle DOM nodes

    function upsertBox(id: string, type: BoxType, color: string, label?: string) {
      let el = boxes.get(id);
      if (!el) {
        el = document.createElement("div");
        el.className = "bbox pointer-events-none";
        el.dataset.type = type;
        el.style.position = "absolute";
        el.style.boxShadow = `0 0 0 2px ${color} inset, 0 0 24px ${color}40`;
        el.style.borderRadius = "8px";
        el.style.transition = "opacity 120ms linear";
        // DO NOT set backdropFilter or filter inline - let CSS handle blur

        const tag = document.createElement("div");
        tag.className = "bbox-tag";
        tag.textContent = label || type.toUpperCase();
        tag.style.position = "absolute";
        tag.style.bottom = "100%";
        tag.style.left = "0";
        tag.style.transform = "translateY(-6px)";
        tag.style.fontSize = "11px";
        tag.style.padding = "2px 6px";
        tag.style.borderRadius = "999px";
        tag.style.background = "rgba(0,0,0,.6)";
        tag.style.color = "#fff";
        tag.style.backdropFilter = "blur(4px)";
        tag.style.whiteSpace = "nowrap";
        el.appendChild(tag);

        // Fallback canvas for pixelation when backdrop-filter unsupported
        if (!blurSupportedRef.current) {
          const pix = document.createElement("canvas");
          pix.width = 16; // will be resized each frame
          pix.height = 16;
          pix.style.position = "absolute";
          pix.style.inset = "0";
          pix.style.width = "100%";
          pix.style.height = "100%";
          // ensure pixelation
          pix.style.imageRendering = "pixelated";
          el.appendChild(pix);
        }

        if (wrap) wrap.appendChild(el);
        boxes.set(id, el);
      }
      return el;
    }

    // draw scripted (plates/hazards) by time
    function drawScripted(t: number, W: number, H: number) {
      let plates = 0;
      const seen = new Set<string>();
      for (const tr of SCRIPTED) {
        if (t < tr.start || t > tr.end) continue;
        const u = clamp01((t - tr.start) / (tr.end - tr.start));
        const x = lerp(tr.p0.x, tr.p1.x, u) * W;
        const y = lerp(tr.p0.y, tr.p1.y, u) * H;
        const w = lerp(tr.p0.w, tr.p1.w, u) * W;
        const h = lerp(tr.p0.h, tr.p1.h, u) * H;
        const el = upsertBox(tr.id, tr.type, tr.color, tr.label);
        el.style.opacity = "1";
        el.style.transform = `translate(${x - w / 2}px, ${y - h / 2}px)`;
        el.style.width = `${w}px`;
        el.style.height = `${h}px`;
        seen.add(tr.id);
        if (tr.type === "license_plate") plates += 1;
      }
      // hide scripted that are off now
      for (const [id, el] of boxes) {
        if (id.startsWith("lp-") || id.startsWith("hz-")) {
          if (!seen.has(id)) el.style.opacity = "0";
        }
      }
      return plates;
    }

    // prepare tensor from video frame (Uint8, CHW format: [batch, channels, height, width])
    function toTensorU8_CHW(
      video: HTMLVideoElement,
      canvas: HTMLCanvasElement
    ): ort.Tensor {
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      canvas.width = UF_IN_W; // 320
      canvas.height = UF_IN_H; // 240

      // Maintain aspect using center crop (cover) to avoid vertical distortion that misaligns boxes.
      const vw = video.videoWidth || 1;
      const vh = video.videoHeight || 1;
      // scale needed so that both dimensions of target are covered by source after scaling.
      const scale = Math.max(UF_IN_W / vw, UF_IN_H / vh);
      const sw = Math.round(UF_IN_W / scale);
      const sh = Math.round(UF_IN_H / scale);
      const sx = Math.floor((vw - sw) / 2);
      const sy = Math.floor((vh - sh) / 2);

      // draw cropped region scaled to model input size
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, UF_IN_W, UF_IN_H);
      cropRef.current = { sx, sy, sw, sh };

      const imageData = ctx.getImageData(0, 0, UF_IN_W, UF_IN_H);
      const data = imageData.data;
      const totalPixels = UF_IN_W * UF_IN_H;
      const chw = new Float32Array(3 * totalPixels);
      for (let i = 0; i < totalPixels; i++) {
        const rgbaIndex = i * 4;
        chw[i] = data[rgbaIndex] / 255.0;
        chw[i + totalPixels] = data[rgbaIndex + 1] / 255.0;
        chw[i + 2 * totalPixels] = data[rgbaIndex + 2] / 255.0;
      }
      return new ort.Tensor("float32", chw, [1, 3, UF_IN_H, UF_IN_W]);
    }

    // run UltraFace and draw face boxes (model → priors → decode → NMS)
    let lastInfer = 0;
    if (!offscreenRef.current) offscreenRef.current = document.createElement("canvas");

    const loop = () => {
      const now = performance.now();
      const t = videoRef.current?.currentTime || 0;
      const W = wrap.clientWidth;
      const H = wrap.clientHeight;

      // draw scripted overlays
      const platesNow = drawScripted(t, W, H);

      // throttle UltraFace to ~8 FPS
      const shouldInfer = now - lastInfer > 120;

      const priors = priorsRef.current;
      const session = sessionRef.current;

      if (shouldInfer && session && priors && !inferPendingRef.current) {
        const videoEl = v;
        if (!videoEl || videoEl.readyState < 2 || videoEl.videoWidth === 0 || videoEl.videoHeight === 0) {
          // wait for decoded frame before attempting inference
          setVisibleCounts((prev) => ({ faces: prev.faces, plates: platesNow }));
        } else {
          const run = async () => {
            inferPendingRef.current = true;
            let inputTensor: ort.Tensor | null = null;
            try {
              lastInfer = now;
              inputTensor = toTensorU8_CHW(videoEl, offscreenRef.current!);
              inferCountRef.current += 1;
              if (inferCountRef.current <= 3 || inferCountRef.current % 20 === 0) {
                const stamp = `[AegisDemo] Inference #${inferCountRef.current} @ ${Number(t.toFixed(2))}s`;
                console.info(stamp, {
                  videoReadyState: videoEl.readyState,
                  width: videoEl.videoWidth,
                  height: videoEl.videoHeight,
                  tensorShape: inputTensor.dims,
                });
                pushLogRef.current(`Running UltraFace (#${inferCountRef.current}) at t=${Number(t.toFixed(2))}s`);
              }

              const feeds: Record<string, ort.Tensor> = {};
              const inputName = session.inputNames[0];
              feeds[inputName] = inputTensor;

              const out = await session.run(feeds);
              const outNames = session.outputNames;
              let t0 = out[outNames[0]] as ort.Tensor;
              let t1 = out[outNames[1]] as ort.Tensor;
              // Determine which is boxes vs scores by dims (boxes last-dim=4)
              const isBoxes0 = (t0.dims?.[t0.dims.length - 1] ?? 0) === 4;
              const boxesRaw = isBoxes0 ? t0 : t1;
              const scoresRaw = isBoxes0 ? t1 : t0;

              if (!tensorShapeRef.current) {
                tensorShapeRef.current = `boxes=${boxesRaw.dims?.join("x") ?? "?"}, scores=${scoresRaw.dims?.join("x") ?? "?"}`;
                console.info("[AegisDemo] UltraFace output dims", {
                  boxes: boxesRaw.dims,
                  scores: scoresRaw.dims,
                  names: outNames,
                });
                pushLogRef.current(`UltraFace output dims → ${tensorShapeRef.current}`);
              }

              // Flatten to arrays
              const loc = new Float32Array((boxesRaw.data as Float32Array).buffer.slice(
                (boxesRaw.data as Float32Array).byteOffset,
                (boxesRaw.data as Float32Array).byteOffset + (boxesRaw.data as Float32Array).byteLength
              ));
              const scrAll = new Float32Array((scoresRaw.data as Float32Array).buffer.slice(
                (scoresRaw.data as Float32Array).byteOffset,
                (scoresRaw.data as Float32Array).byteOffset + (scoresRaw.data as Float32Array).byteLength
              ));

              // Build probability vector robustly across shapes: [N,2] take class1; [N,1] take value; if range not [0,1], apply sigmoid.
              let N: number;
              let probs: Float32Array;
              const lastDimScores = scoresRaw.dims?.[scoresRaw.dims.length - 1] ?? 2;
              if (lastDimScores === 2) {
                N = scrAll.length / 2;
                probs = new Float32Array(N);
                for (let i = 0; i < N; i++) {
                  let p = scrAll[i * 2 + 1];
                  if (p < 0 || p > 1) p = 1 / (1 + Math.exp(-p)); // sigmoid
                  probs[i] = p;
                }
              } else {
                // assume single-prob per anchor
                N = scrAll.length;
                probs = new Float32Array(N);
                for (let i = 0; i < N; i++) {
                  let p = scrAll[i];
                  if (p < 0 || p > 1) p = 1 / (1 + Math.exp(-p));
                  probs[i] = p;
                }
              }

              const decoded = decodeBoxes(loc, priors);
              for (let i = 0; i < decoded.length; i += 4) {
                decoded[i + 0] = clamp01(decoded[i + 0]);
                decoded[i + 1] = clamp01(decoded[i + 1]);
                decoded[i + 2] = clamp01(decoded[i + 2]);
                decoded[i + 3] = clamp01(decoded[i + 3]);
              }

              const keep = nms(decoded, probs, NMS_THRESH, MAX_DETS);

              faceIdsLive.forEach((id) => {
                const el = boxes.get(id);
                if (el) el.style.opacity = "0";
              });
              faceIdsLive.clear();

              let facesFound = 0;
              // Precompute video→display mapping for this frame
              const vw = v.videoWidth || 1;
              const vh = v.videoHeight || 1;
              const sDisp = Math.max(W / vw, H / vh);
              const dw = vw * sDisp;
              const dh = vh * sDisp;
              const dx = (W - dw) / 2;
              const dy = (H - dh) / 2;

              keep.forEach((k) => {
                if (probs[k] < SCORE_THRESH) return;
                // decoded coords are normalized relative to the model input (cropped)
                const crop = cropRef.current ?? { sx: 0, sy: 0, sw: vw, sh: vh };
                const x1n = decoded[k * 4 + 0];
                const y1n = decoded[k * 4 + 1];
                const x2n = decoded[k * 4 + 2];
                const y2n = decoded[k * 4 + 3];

                // Map model-normalized → video pixels
                const vx1 = crop.sx + x1n * crop.sw;
                const vy1 = crop.sy + y1n * crop.sh;
                const vx2 = crop.sx + x2n * crop.sw;
                const vy2 = crop.sy + y2n * crop.sh;

                // Map video pixels → display pixels (object-fit: cover)
                const x1 = dx + (vx1 / vw) * dw;
                const y1 = dy + (vy1 / vh) * dh;
                const x2 = dx + (vx2 / vw) * dw;
                const y2 = dy + (vy2 / vh) * dh;
                const w = x2 - x1;
                const h = y2 - y1;

                // Discard absurd boxes
                if (w <= 4 || h <= 4) return;

                const id = `face-live-${k}`;
                const el = upsertBox(id, "face", "#22c55e", "FACE");
                el.style.opacity = "1";
                el.style.transform = `translate(${x1}px, ${y1}px)`;
                el.style.width = `${w}px`;
                el.style.height = `${h}px`;

                // Fallback: draw pixelation on canvas when blur unsupported
                if (!blurSupportedRef.current) {
                  const pix = el.querySelector("canvas");
                  if (pix) {
                    const ctx = (pix as HTMLCanvasElement).getContext("2d");
                    if (ctx) {
                      const downscale = 0.1; // 10% resolution for pixelation
                      const smallW = Math.max(4, Math.floor(w * downscale));
                      const smallH = Math.max(4, Math.floor(h * downscale));
                      (pix as HTMLCanvasElement).width = smallW;
                      (pix as HTMLCanvasElement).height = smallH;
                      // Draw from video source rect in video space corresponding to this box
                      ctx.imageSmoothingEnabled = false;
                      // Source rect in video pixels
                      const srcX = vx1;
                      const srcY = vy1;
                      const srcW = Math.max(1, vx2 - vx1);
                      const srcH = Math.max(1, vy2 - vy1);
                      ctx.clearRect(0, 0, smallW, smallH);
                      ctx.drawImage(v, srcX, srcY, srcW, srcH, 0, 0, smallW, smallH);
                      // Upscale via CSS (imageRendering: pixelated)
                      // The canvas element is 100% sized through CSS above.
                    }
                  }
                }
                faceIdsLive.add(id);
                facesFound++;
              });

              if (
                lastFacesLoggedRef.current === null ||
                lastFacesLoggedRef.current !== facesFound
              ) {
                lastFacesLoggedRef.current = facesFound;
                console.info("[AegisDemo] UltraFace detections", {
                  faces: facesFound,
                  plates: platesNow,
                  timestampSeconds: Number(t.toFixed(2)),
                });
                pushLogRef.current(
                  `Detections – faces: ${facesFound}, plates: ${platesNow}, t=${Number(t.toFixed(2))}s`
                );
              }

              if (facesFound === 0 && inferCountRef.current % 25 === 0) {
                console.info("[AegisDemo] UltraFace produced 0 faces this cycle", {
                  inference: inferCountRef.current,
                  timestampSeconds: Number(t.toFixed(2)),
                });
                pushLogRef.current("UltraFace returned 0 faces – ensure subject is visible or check lighting");
              }

              setVisibleCounts({ faces: facesFound, plates: platesNow });
            } catch (err) {
              console.error("[AegisDemo] UltraFace inference failed", err);
              pushLogRef.current("UltraFace inference failed; see console for details");
            } finally {
              // Always dispose input tensor to prevent memory leaks
              if (inputTensor) {
                try {
                  inputTensor.dispose();
                } catch {
                  // ignore disposal errors
                }
              }
              inferPendingRef.current = false;
            }
          };
          run().catch((err) => {
            console.error("[AegisDemo] UltraFace async run error", err);
            inferPendingRef.current = false;
          });
        }
      } else if (!sessionRef.current && shouldInfer && !sessionLogRef.current.waitingNotified) {
        console.info("[AegisDemo] Waiting for UltraFace session to load...");
        sessionLogRef.current.waitingNotified = true;
        pushLogRef.current("Waiting for UltraFace session to load...");
      } else {
        // no inference this frame; still update counts for scripted
        setVisibleCounts((prev) => ({ faces: prev.faces, plates: platesNow }));
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      boxes.forEach((el) => el.remove());
      boxes.clear();
    };
  }, [pushLog]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(720px,1fr)_360px]">
      {/* LEFT: Video + overlays */}
      <div className="relative card-glass overflow-hidden">
        {/* Global styles for blur so dynamically-created elements are affected */}
        <style jsx global>{`
          /* Scope under .aegis-wrap to limit global impact */
          .aegis-wrap.aegis-on .bbox[data-type="face"],
          .aegis-wrap.aegis-on .bbox[data-type="license_plate"] {
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            /* Fallback softening if backdrop-filter unsupported */
            filter: blur(2px) saturate(0.9) brightness(0.9);
            background-color: rgba(50, 50, 50, 0.35);
          }
          .aegis-wrap .bbox-tag { pointer-events: none; }
          .aegis-wrap video { object-fit: cover; }
        `}</style>

        {/* Controls */}
        <div className="absolute left-3 right-3 top-3 z-20 flex items-center justify-between gap-2">
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
            <span className="font-medium text-white">Demo</span>{" "}
            <span className="text-white/60">Edge face blur (ONNX)</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-1">
            <button
              className="rounded-md bg-white/10 px-3 py-1 text-sm text-white hover:bg-white/20"
              onClick={togglePlayback}
            >
              {playing ? "Pause" : "Play"}
            </button>
            <button
              className="rounded-md bg-white/10 px-3 py-1 text-sm text-white hover:bg-white/20"
              onClick={restartPlayback}
              title="Restart clip"
            >
              Restart
            </button>
            <label className="flex cursor-pointer items-center gap-2 rounded-md bg-white/10 px-3 py-1 text-sm text-white hover:bg-white/20">
              <input
                type="checkbox"
                className="accent-white"
                checked={aegisOn}
                onChange={(e) => setAegisOn(e.target.checked)}
              />
              Privacy Blur
            </label>
          </div>
        </div>

        {/* Video + overlays */}
        <div
          ref={wrapRef}
          className={`relative aegis-wrap ${aegisOn ? "aegis-on" : ""}`}
          style={{ aspectRatio: "16/9" }}
        >
          <video
            ref={videoRef}
            src={VIDEO_SRC}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="h-full w-full"
          />
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-black/10 via-transparent to-black/30" />
        </div>

        {/* HUD */}
        <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2">
          <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/80 backdrop-blur">
            <div className="flex items-center gap-3">
              <span>Faces: <b className="text-white">{visibleCounts.faces}</b></span>
              <span>Plates: <b className="text-white">{visibleCounts.plates}</b></span>
              <span>Hazards scripted: <b className="text-white">2</b></span>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
            Privacy {aegisOn ? <b className="text-white">ON</b> : <b className="text-white">OFF</b>} · On-device (UltraFace + CSS blur)
          </div>
        </div>
      </div>

      {/* RIGHT: Explainer + Legend */}
      <div className="space-y-4">
        <div className="card-glass p-4">
          <div className="mb-2 flex items-center justify-between text-sm font-semibold text-white">
            <span>Live Console</span>
            <button
              className="rounded-md bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20"
              onClick={clearLog}
            >
              Clear
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto rounded border border-white/10 bg-black/40 p-2 text-xs font-mono text-white/80">
            {logLines.length === 0 ? (
              <p className="text-white/60">Logs will appear here once the demo starts.</p>
            ) : (
              <ul className="space-y-1">
                {logLines.map((line, idx) => (
                  <li key={`${line}-${idx}`}>{line}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="card-glass p-4">
          <div className="mb-1 text-sm font-semibold text-white">What this proves</div>
          <ul className="list-disc space-y-2 pl-5 text-sm text-white/85">
            <li><b>UltraFace (ONNX)</b> runs entirely in-browser (WebGPU/WASM), no server.</li>
            <li><b>Aegis</b> obscures faces & license plates instantly on-device.</li>
            <li>Hazards remain visible for utility while PII is protected.</li>
          </ul>
        </div>

        <div className="card-glass p-4">
          <div className="mb-2 text-sm font-semibold text-white">Legend</div>
          <div className="grid grid-cols-2 gap-2 text-sm text-white/85">
            <LegendChip color="#22c55e" label="FACE (from UltraFace, blurred)" />
            <LegendChip color="#60a5fa" label="LICENSE PLATE (scripted, blurred)" />
            <LegendChip color="#ef4444" label="POTHOLE" />
            <LegendChip color="#f59e0b" label="DEBRIS" />
          </div>
        </div>

        <div className="card-glass p-4">
          <div className="mb-1 text-sm font-semibold text-white">Where this sits</div>
          <p className="text-sm text-white/80">
            In production, Aegis runs before any frame leaves the device. You can later
            swap the scripted plate track with a YOLOv8-n (plates) ONNX session using
            the same pattern as UltraFace.
          </p>
        </div>
      </div>
    </div>
  );
}

function LegendChip({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-block h-3 w-3 rounded" style={{ background: color }} />
      <span>{label}</span>
    </div>
  );
}