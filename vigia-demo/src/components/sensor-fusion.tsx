// src/app/sandbox/sensor-fusion/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import PageShell from "@/components/PageShell";
import { AreaChart, Area, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

/* =================== Types & Constants =================== */
type Vec = { x: number; y: number };
type Node = { id: string; p: Vec };
type Edge = {
  id: string;
  a: string;
  b: string;
  // visual spline control (optional): small offset to make gentle curves
  ctrl?: Vec;
  baseCost: number; // seconds to traverse at speed 1
  closed?: boolean; // if true, vehicle must reroute
  hazards: Hazard[];
};
type HazardKind = "pothole" | "debris" | "work";
type Hazard = {
  id: string;
  kind: HazardKind;
  pos: number; // 0..1 along edge
  severity: number; // 0..1
  ts: number;
};
type Decision = "Cruise" | "Slow down" | "Reroute";

// Acoustic / Accel event types (used by spectrogram & accelerometer)
type AcousticEvent = {
  id: string;
  x: number;
  y: number;
  ts: number;
  cls: "Siren" | "Impact" | "Horn" | "Screech";
  conf: number;
};

type AccelEvent = {
  id: string;
  x: number;
  y: number;
  ts: number;
  severity: number;
};

type Vehicle = {
  id: string;
  color: string;
  role: "contributor";
  nodeFrom: string; // current edge: from->to with progress t
  nodeTo: string;
  t: number; // 0..1 along current edge
  speed: number; // multiplier
  radius: number; // V2X
  route: string[]; // sequence of node ids (waypoints)
  action: Decision;
  actionTTL?: number;
};

const WORLD = { w: 1120, h: 640 };
const RADAR = 140;
const TICK_MS = 28; // ~36fps
const EDGE_SLOWDOWN = 0.55; // slowdown multiplier when choosing Slow down
const ACTION_TTL = 2800; // ms
const FEED_MAX = 120;

/* =================== Small Utils =================== */
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const choice = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const timeTag = () =>
  `[${new Date().toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}]`;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function lerpP(a: Vec, b: Vec, t: number): Vec {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}
function quadBezier(a: Vec, c: Vec, b: Vec, t: number): Vec {
  // (1-t)^2 a + 2(1-t)t c + t^2 b
  const u = 1 - t;
  return {
    x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
    y: u * u * a.y + 2 * u * t * c.y + t * t * b.y,
  };
}

/* =================== Road Network (nodes + edges) =================== */
/** A small city loop with branches; gentle curves via ctrl points */
const NODES: Node[] = [
  { id: "A", p: { x: 120, y: 520 } },
  { id: "B", p: { x: 260, y: 520 } },
  { id: "C", p: { x: 420, y: 520 } },
  { id: "D", p: { x: 620, y: 520 } },
  { id: "E", p: { x: 860, y: 520 } },
  { id: "F", p: { x: 980, y: 480 } },
  { id: "G", p: { x: 900, y: 360 } },
  { id: "H", p: { x: 760, y: 260 } },
  { id: "I", p: { x: 560, y: 220 } },
  { id: "J", p: { x: 360, y: 220 } },
  { id: "K", p: { x: 240, y: 280 } },
  { id: "L", p: { x: 140, y: 360 } },
];

const EDGES_BASE: Edge[] = [
  { id: "AB", a: "A", b: "B", baseCost: 5, hazards: [] },
  { id: "BC", a: "B", b: "C", baseCost: 6, hazards: [], ctrl: { x: 340, y: 560 } },
  { id: "CD", a: "C", b: "D", baseCost: 6, hazards: [] },
  { id: "DE", a: "D", b: "E", baseCost: 7, hazards: [], ctrl: { x: 760, y: 560 } },
  { id: "EF", a: "E", b: "F", baseCost: 5, hazards: [] },
  { id: "FG", a: "F", b: "G", baseCost: 5, hazards: [] },
  { id: "GH", a: "G", b: "H", baseCost: 6, hazards: [], ctrl: { x: 840, y: 280 } },
  { id: "HI", a: "H", b: "I", baseCost: 6, hazards: [] },
  { id: "IJ", a: "I", b: "J", baseCost: 6, hazards: [], ctrl: { x: 460, y: 160 } },
  { id: "JK", a: "J", b: "K", baseCost: 5, hazards: [] },
  { id: "KL", a: "K", b: "L", baseCost: 6, hazards: [] },
  { id: "LA", a: "L", b: "A", baseCost: 7, hazards: [], ctrl: { x: 100, y: 460 } },

  // short detour across center (alt route)
  { id: "DH", a: "D", b: "H", baseCost: 9, hazards: [], ctrl: { x: 700, y: 380 } },
  { id: "CK", a: "C", b: "K", baseCost: 9, hazards: [], ctrl: { x: 340, y: 380 } },
];

/* =================== Dijkstra =================== */
function dijkstra(nodes: Node[], edges: Edge[], start: string, goal: string, slowdownEdges: Set<string> = new Set()) {
  type S = { id: string; cost: number; prev?: string };
  const edgeMap = new Map<string, Edge[]>();
  for (const e of edges) {
    if (e.closed) continue;
    // undirected
    if (!edgeMap.has(e.a)) edgeMap.set(e.a, []);
    if (!edgeMap.has(e.b)) edgeMap.set(e.b, []);
    edgeMap.get(e.a)!.push(e);
    edgeMap.get(e.b)!.push({ ...e, a: e.b, b: e.a, id: e.id }); // reverse ref
  }

  const dist = new Map<string, number>();
  const prev = new Map<string, string | undefined>();
  const Q = new Set(nodes.map((n) => n.id));

  nodes.forEach((n) => dist.set(n.id, Infinity));
  dist.set(start, 0);

  while (Q.size) {
    let u: string | null = null;
    let best = Infinity;
    for (const id of Q) {
      const d = dist.get(id)!;
      if (d < best) {
        best = d;
        u = id;
      }
    }
    if (u == null) break;
    Q.delete(u);
    if (u === goal) break;

    const outs = edgeMap.get(u) || [];
    for (const e of outs) {
      // dynamic cost = base + hazard penalties
      let edgePenalty = 0;
      for (const hz of e.hazards) edgePenalty += hz.severity * 4; // 0..4s add
      // "slowdown" marker adds extra cost but not closed
      const slow = slowdownEdges.has(e.id) ? e.baseCost * (1 / EDGE_SLOWDOWN - 1) : 0;
      const alt = dist.get(u)! + e.baseCost + edgePenalty + slow;
      if (alt < dist.get(e.b)!) {
        dist.set(e.b, alt);
        prev.set(e.b, u);
      }
    }
  }

  // reconstruct
  const path: string[] = [];
  let cur: string | undefined = goal;
  if (prev.get(cur!) === undefined && cur !== start) return [start]; // no path
  while (cur) {
    path.unshift(cur);
    if (cur === start) break;
    cur = prev.get(cur);
  }
  return path;
}

/* =================== Icon bits =================== */
function Car({ color = "#38bdf8", rotate = 0 }: { color?: string; rotate?: number }) {
  return (
    <svg width="18" height="10" viewBox="0 0 90 50" style={{ transform: `rotate(${rotate}deg)` }}>
      <rect x="8" y="12" width="74" height="22" rx="6" fill={color} />
      <rect x="28" y="6" width="34" height="10" rx="4" fill={color} opacity={0.9} />
      <circle cx="26" cy="38" r="6" fill="#0b1220" />
      <circle cx="64" cy="38" r="6" fill="#0b1220" />
    </svg>
  );
}
function HazardGlyph({ kind }: { kind: HazardKind }) {
  if (kind === "pothole") return <circle r={6} fill="#f97316" />;
  if (kind === "debris") return <rect x={-5} y={-5} width={10} height={10} fill="#eab308" rx={2} />;
  return (
    <svg width="14" height="14" viewBox="0 0 24 24">
      <path d="M12 2l10 18H2L12 2z" fill="#ef4444" />
    </svg>
  );
}

/** =================== Spectrogram (left panel) =================== */
function SpectrogramCanvas({
  running,
  onAcousticEvent,
  externalAcoustic,
}: {
  running: boolean;
  onAcousticEvent: (ev: AcousticEvent) => void;
  externalAcoustic?: AcousticEvent | null;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const tRef = useRef(0);
  const flashRef = useRef<{ ts: number; cls: AcousticEvent['cls'] } | null>(null);

  // Simulate periodic acoustic detections
  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => {
      // ~30% chance to emit an acoustic event
      if (Math.random() < 0.3) {
        const cls = choice(["Siren", "Impact", "Horn", "Screech"] as const);
        const conf = rand(0.7, 0.98);
        // random coordinate (spectrogram panel doesn't know map; map will place pin via callback consumer)
        const ev: AcousticEvent = {
          id: "AE" + Math.random().toString(36).slice(2, 7),
          x: rand(60, WORLD.w - 60),
          y: rand(60, WORLD.h - 60),
          ts: performance.now(),
          cls,
          conf,
        };
        onAcousticEvent(ev);
      }
    }, 1500);
    return () => clearInterval(iv);
  }, [running, onAcousticEvent]);

  // Animate a fake spectrogram with optional external flash
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    const W = c.width;
    const H = c.height;
    const bandH = 6;

    const draw = () => {
      tRef.current += 0.02;
      // scroll left
      const img = ctx.getImageData(1, 0, W - 1, H);
      ctx.putImageData(img, 0, 0);
      // new column at right
      for (let y = 0; y < H; y += bandH) {
        const v = Math.sin((y * 0.08 + tRef.current) * 2.0) * 0.5 + 0.5;
        const a = Math.floor(28 + v * 200);
        ctx.fillStyle = `rgba(56,189,248,${(0.05 + v * 0.6).toFixed(2)})`; // cyan-ish
        ctx.fillRect(W - 1, y, 1, bandH);
        // subtle glow
        ctx.fillStyle = `rgba(${a},${a},${a},0.025)`;
        ctx.fillRect(W - 1, y, 1, bandH);
      }

      // external acoustic flash overlay (fade over ~600ms)
      const f = flashRef.current;
      if (f) {
        const age = performance.now() - f.ts;
        if (age < 600) {
          const alpha = 0.9 * (1 - age / 600);
          let color = `rgba(249,115,22,${alpha.toFixed(3)})`; // Screech-ish
          if (f.cls === "Impact") color = `rgba(239,68,68,${alpha.toFixed(3)})`;
          if (f.cls === "Siren") color = `rgba(56,189,248,${alpha.toFixed(3)})`;
          if (f.cls === "Horn") color = `rgba(167,139,250,${alpha.toFixed(3)})`;
          // draw a short vertical flash at the right edge
          ctx.fillStyle = color;
          ctx.fillRect(W - 12, 0, 12, H);
        } else {
          flashRef.current = null;
        }
      }

      if (running) rafRef.current = requestAnimationFrame(draw);
    };
    ctx.clearRect(0, 0, W, H);
    if (running) rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [running]);

  // when parent signals an external acoustic event, trigger a short flash
  useEffect(() => {
    if (!externalAcoustic) return;
    flashRef.current = { ts: performance.now(), cls: externalAcoustic.cls };
  }, [externalAcoustic]);

  return <canvas ref={ref} width={480} height={220} className="w-full rounded-lg bg-black/40 ring-1 ring-white/10" />;
}

/* =================== Main =================== */
export default function SensorFusionRoutable() {
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [edges, setEdges] = useState<Edge[]>(() => EDGES_BASE.map((e) => ({ ...e, hazards: [] })));
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const mk = (id: string, color: string, start: string, end: string): Vehicle => ({
      id,
      color,
      role: "contributor",
      nodeFrom: start,
      nodeTo: nextHop(start, end, edges)[1] || end,
      t: 0,
      speed: 1,
      radius: RADAR,
      route: nextHop(start, end, edges),
      action: "Cruise",
    });
    return [
      mk("V1", "#38bdf8", "A", "H"),
      mk("V2", "#a78bfa", "E", "K"),
      mk("V3", "#34d399", "L", "F"),
    ];
  });
  const [feed, setFeed] = useState<string[]>([]);
  const loopRef = useRef<number | null>(null);
  const tPrev = useRef(performance.now());
  const dashShift = useRef(0);

  function log(s: string, type: 'acoustic' | 'accel' | 'hazard' | 'vehicle' = 'hazard') {
    const badgeContent = {
      acoustic: ['🔊', 'AUDIO', 'text-cyan-400 bg-cyan-950/50'],
      accel: ['📳', 'ACCEL', 'text-purple-400 bg-purple-950/50'],
      hazard: ['⚠️', 'HAZARD', 'text-orange-400 bg-orange-950/50'],
      vehicle: ['🚗', 'VEHICLE', 'text-emerald-400 bg-emerald-950/50']
    }[type];

    const logEntry = `${timeTag()} <span class="px-2 py-0.5 rounded text-xs font-medium ${badgeContent[2]}">${badgeContent[0]} ${badgeContent[1]}</span> ${s}`;
    setFeed((f) => [logEntry, ...f.slice(0, FEED_MAX - 1)]);
  }

  // acoustic / accel buffers and visualization state
  const acousticRef = useRef<AcousticEvent[]>([]);
  const accelRef = useRef<AccelEvent[]>([]);
  const [externalAcoustic, setExternalAcoustic] = useState<AcousticEvent | null>(null);
  const [accelSeries, setAccelSeries] = useState<{ t: number; ax: number; ay: number; az: number }[]>([]);
  // per-hazard per-vehicle seen map to avoid duplicate triggers
  const hazardSeenRef = useRef<Record<string, Set<string>>>({});

  function handleAcoustic(ev: AcousticEvent) {
    acousticRef.current.push(ev);
    log(`Acoustic • ${ev.cls} (${Math.round(ev.conf * 100)}%) near (${Math.round(ev.x)},${Math.round(ev.y)})`);
    // flash spectrogram
    setExternalAcoustic(ev);
    setTimeout(() => setExternalAcoustic(null), 700);
  }

  // helper: compute path nodes A..B with current edges
  function nextHop(start: string, end: string, E: Edge[], slow: Set<string> = new Set()) {
    return dijkstra(NODES, E, start, end, slow);
  }

  /* ----- Hazard spawn (manual + random) ----- */
  function spawnHazard(kind?: HazardKind) {
    const e = choice(edges.filter((x) => !x.closed));
    const hz: Hazard = {
      id: "HZ" + Math.random().toString(36).slice(2, 7),
      kind: kind ?? choice(["pothole", "debris", "work"]),
      pos: Math.random(), // anywhere on edge
      severity: kind === "work" ? rand(0.7, 1) : rand(0.4, 0.85),
      ts: performance.now(),
    };
    setEdges((E) =>
      E.map((ed) => (ed.id === e.id ? { ...ed, hazards: [...ed.hazards, hz], closed: hz.kind === "work" ? Math.random() < 0.35 : ed.closed } : ed)),
    );
    log(`Hazard • ${hz.id} (${hz.kind}) on edge ${e.id}${e.closed ? " (edge closed)" : ""}`);

    // V2X broadcast to vehicles inside radar from the hazard’s nearest node
    const nodeNear = choice([e.a, e.b]);
    const nearP = NODES.find((n) => n.id === nodeNear)!.p;
    setVehicles((V) =>
      V.map((v) => {
        const pv = nodePoint(v);
        const d = Math.hypot(pv.x - nearP.x, pv.y - nearP.y);
        if (d <= v.radius) {
          // decision: reroute if alternative is better than slowdown
          const slowEdges = new Set<string>([e.id]);
          const alt = nextHop(v.nodeFrom, lastOf(v.route), edges.map((x) => ({ ...x, closed: x.id === e.id ? !!edges.find(ee => ee.id===e.id)?.closed : x.closed })), slowEdges);
          const altCost = pathCost(alt, edges, slowEdges);
          const keepPath = nextHop(v.nodeFrom, lastOf(v.route), edges);
          const keepCost = pathCost(keepPath, edges, new Set());
          let action: Decision = "Slow down";
          if (alt.length > 1 && altCost + 1.0 < keepCost) action = "Reroute";

          if (action === "Reroute") {
            log(`${v.id} → Reroute due to ${hz.kind} on ${e.id} (alt ${altCost.toFixed(1)}s < ${keepCost.toFixed(1)}s)`);
            return { ...v, route: alt, nodeFrom: alt[0], nodeTo: alt[1], t: 0, action, actionTTL: ACTION_TTL, speed: 1 };
          } else {
            log(`${v.id} → Slow down on ${e.id} (speed ×${EDGE_SLOWDOWN.toFixed(2)})`);
            return { ...v, action, actionTTL: ACTION_TTL, speed: EDGE_SLOWDOWN };
          }
        }
        return v;
      }),
    );
  }

              <motion.div 
                className="mb-3 flex flex-wrap items-center gap-2"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <motion.button
                  onClick={() => setIsSimulationRunning(!isSimulationRunning)}
                  className={`rounded-xl px-4 py-2 text-white ${isSimulationRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isSimulationRunning ? 'Stop Simulation' : 'Start Simulation'}
                </motion.button>
                <motion.button
                  onClick={() => spawnHazard()}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-600 disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={!isSimulationRunning}
                >
                  Spawn random hazard
                </motion.button>
                <motion.button
                  onClick={() => spawnHazard("work")}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/80 hover:bg-white/10 disabled:opacity-50"
                  title="Often closes the road"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={!isSimulationRunning}
                >
                  Spawn work-zone
                </motion.button>
                <motion.button
                  onClick={() => setEdges(EDGES_BASE.map((e) => ({ ...e, hazards: [], closed: false })))}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/80 hover:bg-white/10 disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={!isSimulationRunning}
                >
                  Reset network
                </motion.button>
              </motion.div>
  useEffect(() => {
    const loop = () => {
      const now = performance.now();
      const dt = now - tPrev.current;
      if (dt >= TICK_MS) {
        dashShift.current = (dashShift.current + dt * 0.03) % 16;
        setVehicles((V) =>
          V.map((v) => {
            let { nodeFrom, nodeTo, t, speed, actionTTL, action } = v;

            // advance along current edge
            const e = edges.find((ed) => (ed.a === nodeFrom && ed.b === nodeTo) || (ed.a === nodeTo && ed.b === nodeFrom));
            if (!e) return v;

            // if edge closed, force immediate reroute
            if (e.closed) {
              const newPath = nextHop(nodeFrom, lastOf(v.route), edges);
              return { ...v, route: newPath, nodeFrom: newPath[0], nodeTo: newPath[1], t: 0, action: "Reroute", actionTTL: ACTION_TTL, speed: 1 };
            }

            // progress scaled by inverse of cost
            const edgeCost = e.baseCost + e.hazards.reduce((a, h) => a + h.severity * 4, 0);
            const dtNorm = (dt / 1000) * (1 / edgeCost) * (speed || 1);
            t += dtNorm;

            // decay temporary action
            if (actionTTL) {
              actionTTL -= dt;
              if (actionTTL <= 0) {
                actionTTL = undefined;
                action = "Cruise";
                speed = 1;
              }
            }

            // reached end: step to next hop
            if (t >= 1) {
              const idx = v.route.indexOf(nodeTo);
              const next = v.route[idx + 1];
              if (!next) {
                // destination reached → choose a new destination randomly
                const nextGoal = choice(NODES.filter((n) => n.id !== nodeTo)).id;
                const newPath = nextHop(nodeTo, nextGoal, edges);
                return { ...v, nodeFrom: newPath[0], nodeTo: newPath[1], route: newPath, t: 0, action, actionTTL, speed };
              }
              return { ...v, nodeFrom: nodeTo, nodeTo: next, t: 0, action, actionTTL, speed };
            }

            // proximity detection: if vehicle passes near any hazard on any edge, emit accel + acoustic
            try {
              const pv = edgePoint(e, v.nodeFrom === e.a ? t : 1 - t);
              const thresh = 22 * 22; // squared px threshold
              for (const ed of edges) {
                for (const hz of ed.hazards) {
                  const hp = edgePoint(ed, hz.pos);
                  const dx = pv.x - hp.x;
                  const dy = pv.y - hp.y;
                  const d2 = dx * dx + dy * dy;
                  if (d2 < thresh) {
                    const seen = hazardSeenRef.current[hz.id] || new Set<string>();
                    if (!seen.has(v.id)) {
                      seen.add(v.id);
                      hazardSeenRef.current[hz.id] = seen;

                      // produce accel event
                      const sev = Math.min(1, 0.7 + Math.random() * 0.35);
                      const aev: AccelEvent = { id: "AX" + Math.random().toString(36).slice(2, 7), x: hp.x, y: hp.y, ts: performance.now(), severity: sev };
                      accelRef.current.push(aev);
                      setAccelSeries((s) => {
                        const spike = { t: Date.now(), ax: sev * 1.3, ay: sev * 0.7, az: sev * 0.95 };
                        return [...s.slice(-119), spike];
                      });
                      log(`Accel • vibration spike (${Math.round(sev * 100)}%) near (${Math.round(hp.x)},${Math.round(hp.y)})`);

                      // produce acoustic event (Screech or Impact depending on kind)
                      const cls = hz.kind === "pothole" || hz.kind === "work" ? "Impact" : "Screech";
                      const aevt: AcousticEvent = { id: "AE" + Math.random().toString(36).slice(2, 7), x: hp.x, y: hp.y, ts: performance.now(), cls: cls as any, conf: Math.round((0.7 + Math.random() * 0.28) * 100) / 100 };
                      acousticRef.current.push(aevt);
                      handleAcoustic(aevt);
                    }
                  }
                }
              }
            } catch (err) {
              // best-effort: don't break movement on detection errors
            }

            return { ...v, t, action, actionTTL, speed };
          }),
        );
        tPrev.current = now;
      }
      loopRef.current = requestAnimationFrame(loop);
    };

    loopRef.current = requestAnimationFrame(loop);
    return () => {
      if (loopRef.current) cancelAnimationFrame(loopRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edges]);

  /* ----- Rendering helpers ----- */
  const nodeById = (id: string) => NODES.find((n) => n.id === id)!;

  function edgePoint(e: Edge, t: number): Vec {
    const A = nodeById(e.a).p;
    const B = nodeById(e.b).p;
    if (e.ctrl) return quadBezier(A, e.ctrl, B, t);
    return lerpP(A, B, t);
  }

  function edgePathD(e: Edge) {
    const A = nodeById(e.a).p;
    const B = nodeById(e.b).p;
    if (e.ctrl) {
      return `M ${A.x} ${A.y} Q ${e.ctrl.x} ${e.ctrl.y} ${B.x} ${B.y}`;
    }
    return `M ${A.x} ${A.y} L ${B.x} ${B.y}`;
  }

  function nodePoint(v: Vehicle): Vec {
    const e = edges.find((ed) => (ed.a === v.nodeFrom && ed.b === v.nodeTo) || (ed.a === v.nodeTo && ed.b === v.nodeFrom))!;
    return edgePoint(e, v.nodeFrom === e.a ? v.t : 1 - v.t);
  }

  function pathCost(path: string[], E: Edge[], slow: Set<string>) {
    if (path.length < 2) return 0;
    const id = (a: string, b: string) =>
      E.find((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a));
    let cost = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const e = id(path[i], path[i + 1]);
      if (!e) continue;
      cost += e.baseCost + e.hazards.reduce((s, h) => s + h.severity * 4, 0);
      if (slow.has(e.id)) cost += e.baseCost * (1 / EDGE_SLOWDOWN - 1);
    }
    return cost;
  }

  /* =================== UI =================== */
  return (
    <PageShell
      title="Multimodal Sensor Fusion"
      subtitle="Animated road network with V2X-based decisions: vehicles reroute or slow down when acoustic/accelerometer hazards appear."
      bannerSrc="/images/banner.png"
    >
      <motion.div 
        className="mb-3 flex flex-wrap items-center gap-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.button
          onClick={() => setIsSimulationRunning(!isSimulationRunning)}
          className={`rounded-xl px-4 py-2 text-white ${isSimulationRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isSimulationRunning ? 'Stop Simulation' : 'Start Simulation'}
        </motion.button>
        <motion.button
          onClick={() => spawnHazard()}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-600 disabled:opacity-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={!isSimulationRunning}
        >
          Spawn random hazard
        </motion.button>
        <motion.button
          onClick={() => spawnHazard("work")}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/80 hover:bg-white/10 disabled:opacity-50"
          title="Often closes the road"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={!isSimulationRunning}
        >
          Spawn work-zone
        </motion.button>
        <motion.button
          onClick={() => setEdges(EDGES_BASE.map((e) => ({ ...e, hazards: [], closed: false })))}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/80 hover:bg-white/10 disabled:opacity-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={!isSimulationRunning}
        >
          Reset network
        </motion.button>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(560px,1fr)_360px]">
        {/* ===== Spectrogram (left) ===== */}
        <div className="card-glass p-4">
          <div className="mb-2 text-sm text-white/70">Smart Ear — Acoustic Spectrogram</div>
          <SpectrogramCanvas running={isSimulationRunning} onAcousticEvent={(ev) => { acousticRef.current.push(ev); handleAcoustic(ev); }} externalAcoustic={externalAcoustic} />
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(["Siren", "Impact", "Horn", "Screech"] as const).map((k) => {
              const p = Math.round((0.5 + Math.random() * 0.5) * 100);
              return (
                <div key={k} className="rounded-lg bg-black/30 p-2 ring-1 ring-white/10">
                  <div className="flex items-center justify-between text-xs text-white/70">
                    <span>{k}</span>
                    <span>{p}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded bg-white/10">
                    <div className="h-1.5 rounded bg-cyan-400" style={{ width: `${p}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== Map ===== */}
        <div className="card-glass relative overflow-hidden p-3">
          {/* road texture */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
              maskImage: "radial-gradient(120% 120% at 50% 10%, rgba(255,255,255,1), transparent 70%)",
            }}
          />
          <svg viewBox={`0 0 ${WORLD.w} ${WORLD.h}`} className="relative z-10 w-full rounded-lg">
            {/* Roads */}
            {edges.map((e) => (
              <g key={e.id} opacity={e.closed ? 0.45 : 0.9}>
                {/* base road */}
                <path d={edgePathD(e)} stroke="#203042" strokeWidth={14} fill="none" strokeLinecap="round" />
                {/* lane center – animated dash */}
                <path
                  d={edgePathD(e)}
                  stroke="#60a5fa"
                  strokeWidth={2}
                  fill="none"
                  strokeDasharray="10 12"
                  strokeDashoffset={dashShift.current}
                  opacity={0.6}
                />
                {/* hazards along edge */}
                {e.hazards.map((hz) => {
                  const p = edgePoint(e, hz.pos);
                  return (
                    <g key={hz.id} transform={`translate(${p.x},${p.y})`}>
                      <HazardGlyph kind={hz.kind} />
                    </g>
                  );
                })}
                {/* edge id for debug */}
                {/* <text x={(nodeById(e.a).p.x+nodeById(e.b).p.x)/2} y={(nodeById(e.a).p.y+nodeById(e.b).p.y)/2-10} fontSize={10} fill="#9ca3af">{e.id}</text> */}
              </g>
            ))}

            {/* Vehicles */}
            {vehicles.map((v) => {
              const pos = nodePoint(v);
              const e = edges.find((ed) => (ed.a === v.nodeFrom && ed.b === v.nodeTo) || (ed.a === v.nodeTo && ed.b === v.nodeFrom))!;
              // rough heading from tangent
              const a = v.nodeFrom === e.a ? Math.max(v.t - 0.02, 0) : Math.min(1 - v.t + 0.02, 1);
              const b = v.nodeFrom === e.a ? Math.min(v.t + 0.02, 1) : Math.max(1 - v.t - 0.02, 0);
              const pa = edgePoint(e, a);
              const pb = edgePoint(e, b);
              const angle = (Math.atan2(pb.y - pa.y, pb.x - pa.x) * 180) / Math.PI;

              return (
                <g key={v.id}>
                  {/* radar */}
                  <circle cx={pos.x} cy={pos.y} r={v.radius} fill={v.color + "20"} stroke={v.color + "44"} />
                  {/* car */}
                  <foreignObject x={pos.x - 9} y={pos.y - 5} width={24} height={16} style={{ overflow: "visible" }}>
                    <div>
                      <Car color={v.color} rotate={angle} />
                    </div>
                  </foreignObject>
                  {/* label */}
                  <text x={pos.x + 14} y={pos.y - 10} fontSize={12} fill="#fff" opacity={0.95}>
                    {v.id} · CONTR
                  </text>
                  {/* decision chip */}
                  {v.action !== "Cruise" && v.actionTTL && v.actionTTL > 0 && (
                    <g>
                      <rect
                        x={pos.x - 46}
                        y={pos.y - 40}
                        rx={6}
                        ry={6}
                        width={92}
                        height={20}
                        fill="#0b1220"
                        opacity={0.9}
                        stroke="#93c5fd"
                        strokeWidth={0.8}
                      />
                      <text x={pos.x} y={pos.y - 26} fontSize={12} fill="#dbeafe" textAnchor="middle">
                        {v.action}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* ===== Console / Legend / Accelerometer ===== */}
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} whileHover={{ scale: 1.02 }} className="card-glass p-4">
            <div className="mb-2 text-sm text-white/70">Vibration Sense — Accelerometer</div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={accelSeries}>
                  <defs>
                    <linearGradient id="gAx_sf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="gAy_sf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="gAz_sf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="t" tick={false} stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" domain={[-0.8, 1.6]} tick={{ fontSize: 11 }} />
                  <RTooltip />
                  <Area type="monotone" dataKey="ax" stroke="#38bdf8" fillOpacity={1} fill="url(#gAx_sf)" isAnimationActive={false} />
                  <Area type="monotone" dataKey="ay" stroke="#a78bfa" fillOpacity={1} fill="url(#gAy_sf)" isAnimationActive={false} />
                  <Area type="monotone" dataKey="az" stroke="#34d399" fillOpacity={1} fill="url(#gAz_sf)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <div className="card-glass p-4">
            <div className="mb-2 text-sm text-white/70">Legend</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-white/5 p-2">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full bg-cyan-400" />
                  Road centerline
                </div>
              </div>
              <div className="rounded-lg bg-white/5 p-2">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full bg-orange-400" />
                  Pothole
                </div>
              </div>
              <div className="rounded-lg bg-white/5 p-2">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full bg-yellow-400" />
                  Debris
                </div>
              </div>
              <div className="rounded-lg bg-white/5 p-2">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
                  Work-zone / Closure
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-white/60">
              Vehicles decide via V2X: **Reroute** if alternate path is cheaper than slow traversal; otherwise **Slow down** (speed ×{EDGE_SLOWDOWN}).
            </div>
          </div>

          <div className="card-glass max-h-[420px] overflow-auto p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm text-white/70">Console</div>
              <button
                onClick={() => setFeed([])}
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80 hover:bg-white/10"
              >
                Clear
              </button>
            </div>
            <ul className="space-y-1 text-sm text-white/85">
              {feed.length === 0 && <li className="text-white/50">No events yet. Start the simulation and spawn a hazard.</li>}
              {feed.map((m, i) => (
                <li key={i} className="font-mono" dangerouslySetInnerHTML={{ __html: m }} />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
function lastOf(route: string[]): string {
  return route.length > 0 ? route[route.length - 1] : "";
}
