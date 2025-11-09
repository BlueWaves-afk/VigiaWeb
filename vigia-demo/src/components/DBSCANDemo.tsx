"use client";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Pt = { id: number; x: number; y: number };
type Cluster = { id: number; cx: number; cy: number; size: number };

const W = 640;
const H = 360;
const COLORS = ["#60a5fa", "#34d399", "#f472b6", "#f59e0b", "#22d3ee", "#a78bfa", "#fb7185", "#10b981"];

function seededPoints(n = 240): Pt[] {
  const blobs = [
    { cx: 140, cy: 120, r: 34 },
    { cx: 320, cy: 180, r: 28 },
    { cx: 480, cy: 120, r: 30 },
  ];
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const b = blobs[i % blobs.length];
    pts.push({
      id: i + 1,
      x: b.cx + (Math.random() - 0.5) * b.r * 2,
      y: b.cy + (Math.random() - 0.5) * b.r * 2,
    });
  }
  // sprinkle noise
  for (let i = 0; i < 24; i++) {
    pts.push({ id: n + i + 1, x: Math.random() * W, y: Math.random() * H });
  }
  return pts;
}

// Lightweight DBSCAN with grid bucketing (good enough for demo)
function runDbscan(points: Pt[], eps: number, minPts: number) {
  const eps2 = eps * eps;
  const labels = new Array(points.length).fill(-1); // -1 = unvisited, -2 = noise, >=0 = cluster id

  const cell = eps;
  const grid = new Map<string, number[]>();
  const key = (x: number, y: number) => `${Math.floor(x / cell)}|${Math.floor(y / cell)}`;
  for (let i = 0; i < points.length; i++) {
    const k = key(points[i].x, points[i].y);
    const arr = grid.get(k);
    if (arr) arr.push(i);
    else grid.set(k, [i]);
  }

  const region = (i: number) => {
    const p = points[i];
    const cx = Math.floor(p.x / cell);
    const cy = Math.floor(p.y / cell);
    const out: number[] = [];
    for (let gx = cx - 1; gx <= cx + 1; gx++) {
      for (let gy = cy - 1; gy <= cy + 1; gy++) {
        const arr = grid.get(`${gx}|${gy}`);
        if (!arr) continue;
        for (const j of arr) {
          const q = points[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          if (dx * dx + dy * dy <= eps2) out.push(j);
        }
      }
    }
    return out;
  };

  let cid = 0;
  for (let i = 0; i < points.length; i++) {
    if (labels[i] !== -1) continue;
    const neigh = region(i);
    if (neigh.length < minPts) {
      labels[i] = -2; // noise
      continue;
    }
    labels[i] = cid;
    const queue = neigh.filter((n) => n !== i);
    while (queue.length) {
      const j = queue.pop()!;
      if (labels[j] === -2) labels[j] = cid; // noise becomes border
      if (labels[j] !== -1) continue;
      labels[j] = cid;
      const n2 = region(j);
      if (n2.length >= minPts) for (const k of n2) if (labels[k] === -1) queue.push(k);
    }
    cid++;
  }

  const clusters: Cluster[] = [];
  const acc: Record<number, { sx: number; sy: number; c: number }> = {};
  labels.forEach((l, i) => {
    if (l >= 0) {
      acc[l] = acc[l] || { sx: 0, sy: 0, c: 0 };
      acc[l].sx += points[i].x;
      acc[l].sy += points[i].y;
      acc[l].c += 1;
    }
  });
  Object.entries(acc).forEach(([k, v]) => {
    clusters.push({ id: Number(k), cx: v.sx / v.c, cy: v.sy / v.c, size: v.c });
  });

  return { labels, clusters };
}

export default function DBSCANDemo() {
  const [eps, setEps] = useState(26);
  const [minPts, setMinPts] = useState(4);
  const [points, setPoints] = useState<Pt[]>(() => seededPoints());
  const [slide, setSlide] = useState(0);

  const { labels, clusters } = useMemo(() => runDbscan(points, eps, minPts), [points, eps, minPts]);

  const onCanvasClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = (e.target as SVGElement).closest("svg")!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    setPoints((prev) => [...prev, { id: prev.length ? prev[prev.length - 1].id + 1 : 1, x, y }]);
  }, []);

  const resetPoints = () => setPoints(seededPoints());
  const clearPoints = () => setPoints([]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(720px,1fr)_380px]">
      {/* LEFT: Interactive canvas */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="card-glass p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-white/80">DBSCAN clustering of hazard reports (interactive)</div>
          <div className="flex items-center gap-2">
            <button onClick={resetPoints} className="rounded-md bg-white/10 px-3 py-1 text-sm text-white hover:bg-white/20">Randomize</button>
            <button onClick={clearPoints} className="rounded-md bg-white/10 px-3 py-1 text-sm text-white hover:bg-white/20">Clear</button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[260px_1fr]">
          {/* Controls */}
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <div className="text-xs text-white/60">eps: <b className="text-white">{eps}</b> px</div>
            <input type="range" min={8} max={60} value={eps} onChange={(e) => setEps(parseInt(e.target.value))} className="w-full" />
            <div className="mt-3 text-xs text-white/60">minPts: <b className="text-white">{minPts}</b></div>
            <input type="range" min={2} max={12} value={minPts} onChange={(e) => setMinPts(parseInt(e.target.value))} className="w-full" />
            <div className="mt-4 rounded-lg bg-white/5 p-2 text-xs text-white/70">
              <div>• Click canvas to add points</div>
              <div>• Gray = noise; Colors = clusters; Gold ring = centroid</div>
            </div>
          </div>

          {/* Canvas */}
          <div className="rounded-xl border border-white/10 bg-black/20 p-2">
            <motion.svg
              key={`${eps}-${minPts}-${points.length}`}
              viewBox={`0 0 ${W} ${H}`}
              className="w-full h-[340px]"
              onClick={onCanvasClick}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <rect x={0} y={0} width={W} height={H} fill="rgba(0,0,0,0.2)" rx={12} />
              {/* clusters */}
              {clusters.map((c) => (
                <g key={`c-${c.id}`}>
                  <circle cx={c.cx} cy={c.cy} r={6} fill="#fbbf24" />
                  <circle cx={c.cx} cy={c.cy} r={eps} fill="none" stroke="#fbbf24" strokeDasharray="6 8" opacity={0.6} />
                  <text x={c.cx + 10} y={c.cy - 10} fontSize={12} fill="#fde68a">{`C${c.id} (${c.size})`}</text>
                </g>
              ))}

              {/* points */}
              <AnimatePresence>
                {points.map((p, i) => {
                  const label = labels[i];
                  const isNoise = label < 0;
                  const fill = isNoise ? "rgba(226,232,240,.55)" : COLORS[label % COLORS.length];
                  return (
                    <motion.circle
                      key={p.id}
                      cx={p.x}
                      cy={p.y}
                      r={3.6}
                      fill={fill}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    />
                  );
                })}
              </AnimatePresence>
            </motion.svg>
          </div>
        </div>
      </motion.div>

      {/* RIGHT: Carousel explainer */}
      <motion.div initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45 }} className="space-y-4">
        <div className="card-glass p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold text-white">DBSCAN — What, How, Why</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setSlide((s) => Math.max(0, s - 1))} className="rounded-md bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20">Prev</button>
              <button onClick={() => setSlide((s) => Math.min(3, s + 1))} className="rounded-md bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20">Next</button>
            </div>
          </div>
          <div className="relative h-[240px] overflow-hidden">
            <AnimatePresence mode="wait">
              {slide === 0 && (
                <motion.div key="s0" className="absolute inset-0" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}>
                  <div className="space-y-3 text-white/85">
                    <p><b>DBSCAN</b> = Density-Based Spatial Clustering of Applications with Noise.</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Groups points with many neighbors within <b>eps</b>.</li>
                      <li>Requires at least <b>minPts</b> to form a cluster.</li>
                      <li>Labels everything else as <b>noise</b>.</li>
                    </ul>
                  </div>
                </motion.div>
              )}
              {slide === 1 && (
                <motion.div key="s1" className="absolute inset-0" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}>
                  <div className="space-y-3 text-white/85">
                    <p><b>How it works</b>:</p>
                    <ol className="list-decimal pl-5 space-y-2">
                      <li>Pick an unvisited point; find neighbors within <b>eps</b>.</li>
                      <li>If neighbors ≥ <b>minPts</b>, create a cluster and expand it via connected neighbors.</li>
                      <li>Otherwise mark as <b>noise</b> (may become border later).</li>
                    </ol>
                  </div>
                </motion.div>
              )}
              {slide === 2 && (
                <motion.div key="s2" className="absolute inset-0" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}>
                  <div className="space-y-3 text-white/85">
                    <p><b>Why it matters for road‑hazard detection</b>:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><b>Noise tolerance</b>: single false reports are ignored.</li>
                      <li><b>No cluster count</b> needed: works on the edge without tuning K.</li>
                      <li><b>Shape‑agnostic</b>: potholes or debris fields don’t have to be round.</li>
                    </ul>
                  </div>
                </motion.div>
              )}
              {slide === 3 && (
                <motion.div key="s3" className="absolute inset-0" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}>
                  <div className="space-y-3 text-white/85">
                    <p><b>Parameters</b>:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><b>eps</b> (px): radius of neighborhood. Larger → bigger clusters, fewer noise.</li>
                      <li><b>minPts</b>: minimum density. Higher → stricter clusters, more noise.</li>
                      <li>This demo uses grid bucketing for fast neighbor lookups.</li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="mt-3 flex gap-1">
            {[0,1,2,3].map((i) => (
              <button key={i} onClick={() => setSlide(i)} className={`h-2.5 w-2.5 rounded-full ${i===slide?"bg-white":"bg-white/30 hover:bg-white/50"}`} />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}