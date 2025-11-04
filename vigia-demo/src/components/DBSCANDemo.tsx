"use client";
import { useMemo, useState } from "react";

type Pt = { x: number; y: number; c?: number };

function genPoints(n = 200): Pt[] {
  const blobs = [
    { cx: 80,  cy: 70,  r: 20 },
    { cx: 240, cy: 110, r: 18 },
    { cx: 160, cy: 160, r: 22 },
  ];
  const pts: Pt[] = [];
  for (let i=0;i<n;i++){
    const b = blobs[i % blobs.length];
    pts.push({
      x: b.cx + (Math.random()-0.5)*b.r*2,
      y: b.cy + (Math.random()-0.5)*b.r*2,
    })
  }
  return pts;
}

export default function DBSCANDemo() {
  const [eps, setEps] = useState(16);
  const [minPts, setMinPts] = useState(4);
  const pts = useMemo(() => genPoints(250), []);

  // super-light toy clusterer (not production DBSCAN; for demo only)
  const clustered = useMemo(() => {
    const out = pts.map(p => ({...p, c: -1}));
    let cid = 0;
    for (let i=0;i<out.length;i++){
      if (out[i].c !== -1) continue;
      const neighbors = out.filter(q => {
        const dx = q.x - out[i].x, dy = q.y - out[i].y;
        return Math.hypot(dx,dy) <= eps;
      });
      if (neighbors.length < minPts) continue;
      neighbors.forEach(n => (n.c = cid));
      cid++;
    }
    return out;
  }, [pts, eps, minPts]);

  return (
    <div className="card-glass p-6">
      <div className="mb-3 text-white/80 text-sm">DBSCAN (toy) on hazard points</div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <div className="text-xs text-white/60">eps: {eps}px</div>
          <input type="range" min={6} max={40} value={eps}
            onChange={e => setEps(parseInt(e.target.value))}
            className="w-full"/>
          <div className="mt-3 text-xs text-white/60">minPts: {minPts}</div>
          <input type="range" min={2} max={10} value={minPts}
            onChange={e => setMinPts(parseInt(e.target.value))}
            className="w-full"/>
          <div className="mt-3 text-xs text-white/50">
            Replace with real DBSCAN server-side or sklearn in a worker.
          </div>
        </div>

        <div className="md:col-span-2 rounded-lg border border-white/10 bg-black/20 p-3">
          <svg viewBox="0 0 320 220" className="w-full h-[260px]">
            <rect x="0" y="0" width="320" height="220" fill="rgba(0,0,0,0.2)" rx="8"/>
            {clustered.map((p, i) => {
              const color = p.c === -1 ? "rgba(226,232,240,.5)" :
                ["#60a5fa","#34d399","#f472b6","#f59e0b","#22d3ee","#a78bfa"][p.c % 6];
              return <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />;
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}