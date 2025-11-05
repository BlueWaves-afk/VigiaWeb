"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * VIGIA Argus + Aegis (Privacy) Demo
 * - Plays a looping dashcam video.
 * - Renders animated "model outputs" as CSS boxes (faces, plates, hazards).
 * - Aegis toggle blurs faces & license plates instantly (privacy-by-design).
 *
 * Notes:
 * - Put a sample video at /public/videos/dashcam.mp4 (or change src below).
 * - No ML libs. All positions come from the simple "tracks" script.
 */

type BoxType = "face" | "license_plate" | "pothole" | "debris";
type RGBHex = `#${string}`;

type Track = {
  id: string;
  type: BoxType;
  color: RGBHex;          // outline
  start: number;          // seconds
  end: number;            // seconds
  // positions are given in *normalized video space* [0..1]
  // we just lerp between p0 -> p1 across [start..end]
  p0: { x: number; y: number; w: number; h: number };
  p1: { x: number; y: number; w: number; h: number };
  label?: string;
};

const VIDEO_SRC = "/videos/dashcam.mp4"; // <— replace with your asset if needed

// -----------------------------------------------------------------------------
// Simple script of detection tracks (edit freely to match your clip)
// -----------------------------------------------------------------------------
const TRACKS: Track[] = [
  // faces (inside pedestrians on sidewalk)
  {
    id: "face-1",
    type: "face",
    color: "#22c55e",
    start: 1.0,
    end: 4.0,
    p0: { x: 0.72, y: 0.38, w: 0.06, h: 0.1 },
    p1: { x: 0.69, y: 0.40, w: 0.055, h: 0.095 },
    label: "FACE",
  },
  {
    id: "face-2",
    type: "face",
    color: "#22c55e",
    start: 7.0,
    end: 9.2,
    p0: { x: 0.18, y: 0.36, w: 0.06, h: 0.1 },
    p1: { x: 0.16, y: 0.37, w: 0.058, h: 0.098 },
    label: "FACE",
  },

  // license plate (car in front)
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

  // road hazards (no blur)
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

// convenience
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export default function ArgusAegisDemo() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const [aegisOn, setAegisOn] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [visibleCounts, setVisibleCounts] = useState({ faces: 0, plates: 0 });

  // start/pause logic (keeps RAF in sync with <video>)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const play = async () => {
      try {
        await v.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    };
    const pause = () => {
      v.pause();
      setPlaying(false);
    };

    if (playing) play();
    else pause();
  }, [playing]);

  // animation loop: reads currentTime & updates boxes transforms
  useEffect(() => {
    const v = videoRef.current;
    const wrap = wrapRef.current;
    if (!v || !wrap) return;

    const boxes = new Map<string, HTMLDivElement>();

    const upsertBox = (id: string, type: BoxType, color: string, label?: string) => {
      let el = boxes.get(id);
      if (!el) {
        el = document.createElement("div");
        el.className = "bbox pointer-events-none";
        el.dataset.type = type;
        el.style.position = "absolute";
        el.style.boxShadow = "0 0 0 2px " + color + " inset, 0 0 24px " + color + "40";
        el.style.borderRadius = "8px";
        el.style.transition = "opacity 120ms linear";
        el.style.backdropFilter = "none"; // applied via aegis class below
        el.style.filter = "none";

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

        wrap.appendChild(el);
        boxes.set(id, el);
      }
      return el;
    };

    const loop = () => {
      const t = v.currentTime || 0;

      const W = wrap.clientWidth;
      const H = wrap.clientHeight;

      let faces = 0;
      let plates = 0;

      // track which boxes are visible this frame
      const seen = new Set<string>();

      for (const tr of TRACKS) {
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

        if (tr.type === "face") faces += 1;
        if (tr.type === "license_plate") plates += 1;
      }

      // hide boxes not visible at t
      boxes.forEach((el, id) => {
        if (!seen.has(id)) el.style.opacity = "0";
      });

      setVisibleCounts({ faces, plates });
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      boxes.forEach((el) => el.remove());
      boxes.clear();
    };
  }, []);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(720px,1fr)_360px]">
      {/* LEFT: Video + overlays */}
      <div className="relative card-glass overflow-hidden">
        {/* Privacy CSS (scoped) */}
        <style jsx>{`
          .aegis-on .bbox[data-type="face"],
          .aegis-on .bbox[data-type="license_plate"] {
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            filter: blur(2px);
            background-color: rgba(50, 50, 50, 0.35);
          }
          .bbox-tag { pointer-events: none; }
          video { object-fit: cover; }
        `}</style>

        {/* Controls bar */}
        <div className="absolute left-3 right-3 top-3 z-20 flex items-center justify-between gap-2">
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
            <span className="font-medium text-white">Argus-V8X</span>{" "}
            <span className="text-white/60">demo output</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-1">
            <button
              className="rounded-md bg-white/10 px-3 py-1 text-sm text-white hover:bg-white/20"
              onClick={() => setPlaying((p) => !p)}
            >
              {playing ? "Pause" : "Play"}
            </button>
            <label className="flex cursor-pointer items-center gap-2 rounded-md bg-white/10 px-3 py-1 text-sm text-white hover:bg-white/20">
              <input
                type="checkbox"
                className="accent-white"
                checked={aegisOn}
                onChange={(e) => setAegisOn(e.target.checked)}
              />
              VIGIA Aegis (Privacy)
            </label>
          </div>
        </div>

        {/* Video */}
        <div
          ref={wrapRef}
          className={`relative ${aegisOn ? "aegis-on" : ""}`}
          style={{ aspectRatio: "16/9" }}
        >
          <video
            ref={videoRef}
            src={VIDEO_SRC}
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full"
          />
          {/* vignette for cinematic contrast */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-black/10 via-transparent to-black/30" />
        </div>

        {/* Footer HUD */}
        <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2">
          <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/80 backdrop-blur">
            <div className="flex items-center gap-3">
              <span>Faces visible: <b className="text-white">{visibleCounts.faces}</b></span>
              <span>Plates visible: <b className="text-white">{visibleCounts.plates}</b></span>
              <span>Hazards: <b className="text-white">{TRACKS.filter(t => t.type !== "face" && t.type !== "license_plate").length}</b> scripted</span>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
            Privacy mode {aegisOn ? <b className="text-white">ON</b> : <b className="text-white">OFF</b>} · All blurs rendered client-side
          </div>
        </div>
      </div>

      {/* RIGHT: Explainer + Legend */}
      <div className="space-y-4">
        <div className="card-glass p-4">
          <div className="mb-1 text-sm font-semibold text-white">What this proves</div>
          <ul className="list-disc space-y-2 pl-5 text-sm text-white/85">
            <li>
              <b>Argus-V8X</b> (edge perception) produces detections (simulated as boxes).
            </li>
            <li>
              <b>Aegis</b> (privacy layer) <i>instantly</i> obscures faces & plates on-device
              via CSS blur—no frames leave the device unprotected.
            </li>
            <li>
              Hazards (pothole/debris) remain visible for <b>utility</b> while PII is protected.
            </li>
          </ul>
        </div>

        <div className="card-glass p-4">
          <div className="mb-2 text-sm font-semibold text-white">Legend</div>
          <div className="grid grid-cols-2 gap-2 text-sm text-white/85">
            <LegendChip color="#22c55e" label="FACE (blurred in Aegis)" />
            <LegendChip color="#60a5fa" label="LICENSE PLATE (blurred)" />
            <LegendChip color="#ef4444" label="POTHOLE" />
            <LegendChip color="#f59e0b" label="DEBRIS" />
          </div>
        </div>

        <div className="card-glass p-4">
          <div className="mb-1 text-sm font-semibold text-white">Integrates with V2X</div>
          <p className="text-sm text-white/80">
            In the full sandbox, confirmed hazards trigger V2X messages to nearby nodes, and
            mint rewards post-consensus. This module isolates the <b>privacy-first</b> step.
          </p>
        </div>
      </div>
    </div>
  );
}

function LegendChip({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block h-3 w-3 rounded"
        style={{ background: color }}
      />
      <span>{label}</span>
    </div>
  );
}