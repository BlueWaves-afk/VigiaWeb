"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

/** ====== World & Economy Settings ====== */
const WORLD = { w: 980, h: 560, grid: 48 };
const FIXED_RADIUS = 130;                    // (1) same coverage radius for all vehicles
const HAZARD_RADIUS = 18;                    // visual ring for hazard
const SPLIT = { publisher: 0.7, validators: 0.3 }; // (2) used only on confirmed hazards
const BUCKET_MS = 2000;
// DBSCAN settings (pixels)
const DBSCAN_EPS = 32; // neighborhood radius
const DBSCAN_MINPTS = 3; // min points for a dense region
const REPORT_RETENTION_MS = 6000; // keep recent report points for clustering

/** ====== Types ====== */
type Role = "contributor" | "developer";

type Vehicle = {
  id: string;
  color: string;
  role: Role;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  radius: number;
  wallet: { vgt: number };        // (4) no DC/burn – only VGT for contributors
};

type Hazard = {
  id: string;
  x: number;
  y: number;
  ttl: number;
  reporters: Set<string>;         // vehicles that confirmed
  contradicted: boolean;          // if any vehicle flags "not a hazard"
  rewarded: boolean;              // true once minted (only when confirmed)
};

type ReportPoint = { x: number; y: number; vid: string; ts: number; src: string };
type Cluster = { id: string; cx: number; cy: number; size: number };

type RightPaneTab = "console" | "charts";

type FeedKind = "PROX" | "V2X" | "REPORT" | "CONFIRM" | "CONTRADICT" | "MINT";
type FeedItem = { t: string; kind: FeedKind; text: string };

/** ====== Utilities ====== */
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const PALETTE = ["#38bdf8", "#a78bfa", "#34d399", "#f59e0b", "#f472b6", "#60a5fa"];

function makeVehicle(id: string, color: string, role: Role): Vehicle {
  const angle = Math.random() * Math.PI * 2;
  return {
    id,
    color,
    role,
    x: rand(80, WORLD.w - 80),
    y: rand(80, WORLD.h - 80),
    vx: Math.cos(angle),
    vy: Math.sin(angle),
    speed: rand(0.9, 1.5),
    radius: FIXED_RADIUS,
    wallet: { vgt: 0 },
  };
}

/** ====== Component ====== */
export default function V2XDemo() {
  const [vehicleCount, setVehicleCount] = useState(3);
  const [running, setRunning] = useState(false);
  const [showIntro, setShowIntro] = useState(true);        // solid in-canvas onboarding
  const [introStep, setIntroStep] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [tickMs, setTickMs] = useState(16);
  const [rightTab, setRightTab] = useState<RightPaneTab>("console");
  const [fullscreen, setFullscreen] = useState(false);

  const vehiclesRef = useRef<Vehicle[]>([]);
  const hazardsRef = useRef<Hazard[]>([]);
  const rafRef = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const vehicleElsRef = useRef<Record<string, { large?: SVGCircleElement | null; small?: SVGCircleElement | null; text?: SVGTextElement | null }>>({});
  const hazardElsRef = useRef<Record<string, { dot?: SVGCircleElement | null; ring?: SVGCircleElement | null; text?: SVGTextElement | null }>>({});
  const clusterElsRef = useRef<Record<string, { dot?: SVGCircleElement | null; ring?: SVGCircleElement | null; text?: SVGTextElement | null }>>({});

  // DBSCAN buffers
  const reportPtsRef = useRef<ReportPoint[]>([]);
  const clustersRef = useRef<Cluster[]>([]);
  const lastClusterRunRef = useRef<number>(0);

  /** Event feed & charts */
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [msgSeries, setMsgSeries] = useState<{ t: string; msgs: number }[]>([]);
  const [vgtSeries, setVgtSeries] = useState<{ name: string; [k: string]: number | string }[]>([]);
  const bucketRef = useRef<number>(performance.now());
  const bufferedMsgs = useRef<number>(0);
  const feedBufferRef = useRef<FeedItem[]>([]);
  const lastFeedFlushRef = useRef<number>(performance.now());
  const FEED_FLUSH_INTERVAL = 200; // ms - batch console updates to avoid frequent re-renders

  /** Track V2V pairs currently in proximity to only log "entry" events once */
  const proximityRef = useRef<Set<string>>(new Set());

  // Performance optimization: throttle proximity checks
  const lastProximityCheckRef = useRef<number>(0);
  const PROXIMITY_CHECK_INTERVAL = 300; // ms between proximity checks

  /** Init vehicles on count change */
  useEffect(() => {
    const v: Vehicle[] = [];
    for (let i = 0; i < vehicleCount; i++) {
      // make all vehicles contributors for the demo as requested
      const role: Role = "contributor";
      v.push(makeVehicle(`V${i + 1}`, PALETTE[i % PALETTE.length], role));
    }
    vehiclesRef.current = v;
    hazardsRef.current = [];
    proximityRef.current.clear(); // reset pair state
    vehicleElsRef.current = {};
    hazardElsRef.current = {};
    feedBufferRef.current = [];
    setFeed([]);
    setMsgSeries([]);
    setVgtSeries([]);
  }, [vehicleCount]);

  /** Optimized main loop */
  useEffect(() => {
    if (!running) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    let prev = performance.now();

    const loop = (currentTime: number) => {
      const dt = currentTime - prev;
      if (dt >= tickMs) {
        step(dt / 16);
        prev = currentTime;
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [running, tickMs]);

  /** Optimized step function */
  const step = useCallback((dt: number) => {
    const V = vehiclesRef.current;
    let H = hazardsRef.current;
    const currentTime = performance.now();

    // occasional hazard spawns (slightly reduced frequency for performance)
    if (Math.random() < 0.01) {
      hazardsRef.current.push({
        id: `HZ${Math.random().toString(36).slice(2, 7)}`,
        x: rand(40, WORLD.w - 40),
        y: rand(40, WORLD.h - 40),
        ttl: 12000,
        reporters: new Set<string>(),
        contradicted: false,
        rewarded: false,
      });
      H = hazardsRef.current;
    }

    // move vehicles with light jitter + bounce
    for (const v of V) {
      if (Math.random() < 0.02) {
        const ang = Math.atan2(v.vy, v.vx) + rand(-0.55, 0.55);
        v.vx = Math.cos(ang);
        v.vy = Math.sin(ang);
      }
      v.x = clamp(v.x + v.vx * v.speed * dt, 16, WORLD.w - 16);
      v.y = clamp(v.y + v.vy * v.speed * dt, 16, WORLD.h - 16);
      if (v.x <= 16 || v.x >= WORLD.w - 16) v.vx *= -1;
      if (v.y <= 16 || v.y >= WORLD.h - 16) v.vy *= -1;
    }

    // OPTIMIZED: V2V proximity - throttle checks
    if (currentTime - lastProximityCheckRef.current > PROXIMITY_CHECK_INTERVAL) {
      lastProximityCheckRef.current = currentTime;
      const prox = proximityRef.current;
      const newProx = new Set<string>();
      
      for (let i = 0; i < V.length; i++) {
        for (let j = i + 1; j < V.length; j++) {
          const a = V[i], b = V[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist2 = dx * dx + dy * dy;
          const range = a.radius + b.radius;
          const inRange = dist2 <= range * range;
          const key = a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`;

          if (inRange) {
            newProx.add(key);
            if (!prox.has(key)) {
              recordMessage("PROX", `V2X proximity • ${a.id} ↔ ${b.id}`);
            }
          }
        }
      }
      proximityRef.current = newProx;
    }

    // Hazard logic - optimized with early returns
    const newHazards: Hazard[] = [];
    for (const hz of H) {
      hz.ttl -= dt * 16;
      if (hz.ttl <= 0) continue;

      // Find vehicles in range (use squared distances to avoid sqrt)
      const inRange: Vehicle[] = [];
      for (const v of V) {
        const dx = v.x - hz.x;
        const dy = v.y - hz.y;
        if (dx * dx + dy * dy <= v.radius * v.radius) {
          inRange.push(v);
        }
      }

      if (inRange.length > 0) {
        // pick the closest to act this frame (compare squared distances)
        let closest = inRange[0];
        let closestDist = (closest.x - hz.x) * (closest.x - hz.x) + (closest.y - hz.y) * (closest.y - hz.y);
        for (let k = 1; k < inRange.length; k++) {
          const cur = inRange[k];
          const d2 = (cur.x - hz.x) * (cur.x - hz.x) + (cur.y - hz.y) * (cur.y - hz.y);
          if (d2 < closestDist) {
            closest = cur;
            closestDist = d2;
          }
        }

        if (!hz.reporters.size) {
          // first report
          hz.reporters.add(closest.id);
          recordMessage("REPORT", `HAZARD REPORTED • ${closest.id} reported ${hz.id} (no mint yet)`);
          reportPtsRef.current.push({ x: hz.x + rand(-2,2), y: hz.y + rand(-2,2), vid: closest.id, ts: currentTime, src: hz.id });

          // broadcast V2X to others (no mint)
          for (const other of inRange) {
            if (other.id !== closest.id) {
              recordMessage("V2X", `V2X • ${closest.id} → ${other.id}: "${hz.id}" near you`);
            }
          }
        } else {
          // subsequent vehicle: confirm vs contradict (demo chance)
          const already = hz.reporters.has(closest.id);
          if (!already) {
            const contradict = Math.random() < 0.4;
            if (contradict) {
              hz.contradicted = true;
              recordMessage("CONTRADICT", `CONTRADICT • ${closest.id} flagged ${hz.id} as NOT a hazard → UNCERTAIN`);
            } else {
              hz.reporters.add(closest.id);
              recordMessage("CONFIRM", `CONFIRM • ${closest.id} confirmed ${hz.id}`);
                reportPtsRef.current.push({ x: hz.x + rand(-2,2), y: hz.y + rand(-2,2), vid: closest.id, ts: currentTime, src: hz.id });
            }
          }
        }

        // Decide outcomes:
        if (!hz.rewarded && !hz.contradicted) {
          if (hz.reporters.size >= 2) {
            // CONFIRMED: mint VGT to contributors (publisher 70%, validators 30% split)
            const first = Array.from(hz.reporters)[0];
            const rest = Array.from(hz.reporters).slice(1);

            const publisher = V.find((v) => v.id === first);
            const validators = rest.map((id) => V.find((v) => v.id === id)).filter(Boolean) as Vehicle[];

            const TOTAL = 12; // sample mint amount for a confirmed hazard
            const pubAmt = TOTAL * SPLIT.publisher;
            const valPool = TOTAL * SPLIT.validators;

            // (4) only contributors can receive VGT
            if (publisher && publisher.role === "contributor") {
              publisher.wallet.vgt += pubAmt;
            }
            const eligibleVals = validators.filter((v) => v.role === "contributor");
            if (eligibleVals.length) {
              const each = valPool / eligibleVals.length;
              for (const v of eligibleVals) v.wallet.vgt += each;
            }

            hz.rewarded = true;
            recordMessage(
              "MINT",
              `MINT • ${hz.id} CONFIRMED → +${TOTAL} VGT (pub: ${pubAmt.toFixed(1)}, val: ${valPool.toFixed(1)}) to contributors`
            );
          }
        }
      }

      newHazards.push(hz);
    }

    hazardsRef.current = newHazards;

    // Maintain sliding window of report points
    reportPtsRef.current = reportPtsRef.current.filter((p) => currentTime - p.ts <= REPORT_RETENTION_MS);

    // Run DBSCAN periodically
    if (currentTime - lastClusterRunRef.current > 400) {
      lastClusterRunRef.current = currentTime;
      clustersRef.current = runDbscan(reportPtsRef.current, DBSCAN_EPS, DBSCAN_MINPTS);
    }

    // flush buffered feed items at a lower frequency to avoid frequent re-renders
    const flushNow = performance.now();
    if (flushNow - lastFeedFlushRef.current > FEED_FLUSH_INTERVAL && feedBufferRef.current.length) {
      const toFlush = feedBufferRef.current.slice();
      feedBufferRef.current = [];
      setFeed((prev) => {
        const merged = [...toFlush, ...prev].slice(0, 100);
        return merged;
      });
      lastFeedFlushRef.current = flushNow;
    }

    // DOM-level updates: directly update SVG elements for vehicles & hazards to avoid React re-renders
    try {
      const vEls = vehicleElsRef.current;
      for (const v of V) {
        const e = vEls[v.id];
        if (e) {
          if (e.large) {
            e.large.setAttribute("cx", String(Math.round(v.x * 100) / 100));
            e.large.setAttribute("cy", String(Math.round(v.y * 100) / 100));
          }
          if (e.small) {
            e.small.setAttribute("cx", String(Math.round(v.x * 100) / 100));
            e.small.setAttribute("cy", String(Math.round(v.y * 100) / 100));
          }
          if (e.text) {
            e.text.setAttribute("x", String(Math.round((v.x + 14) * 100) / 100));
            e.text.setAttribute("y", String(Math.round((v.y - 10) * 100) / 100));
          }
        }
      }

      const hEls = hazardElsRef.current;
      for (const h of hazardsRef.current) {
        const e = hEls[h.id];
        if (e) {
          if (e.dot) {
            e.dot.setAttribute("cx", String(Math.round(h.x * 100) / 100));
            e.dot.setAttribute("cy", String(Math.round(h.y * 100) / 100));
          }
          if (e.ring) {
            e.ring.setAttribute("cx", String(Math.round(h.x * 100) / 100));
            e.ring.setAttribute("cy", String(Math.round(h.y * 100) / 100));
          }
          if (e.text) {
            e.text.setAttribute("x", String(Math.round((h.x + 14) * 100) / 100));
            e.text.setAttribute("y", String(Math.round((h.y - 12) * 100) / 100));
          }
        }
      }
      // clusters
      const cEls = clusterElsRef.current;
      for (const c of clustersRef.current) {
        const e = cEls[c.id];
        if (e) {
          if (e.dot) {
            e.dot.setAttribute("cx", String(Math.round(c.cx * 100) / 100));
            e.dot.setAttribute("cy", String(Math.round(c.cy * 100) / 100));
          }
          if (e.ring) {
            e.ring.setAttribute("cx", String(Math.round(c.cx * 100) / 100));
            e.ring.setAttribute("cy", String(Math.round(c.cy * 100) / 100));
          }
          if (e.text) {
            e.text.setAttribute("x", String(Math.round((c.cx + 12) * 100) / 100));
            e.text.setAttribute("y", String(Math.round((c.cy - 10) * 100) / 100));
          }
        }
      }
    } catch (e) {
      // Defensive: swallow DOM errors
    }

    // OPTIMIZED: bucketed charts with size limits
    const now = flushNow;
    if (now - bucketRef.current > BUCKET_MS) {
      const label = new Date(now).toLocaleTimeString([], { minute: "2-digit", second: "2-digit" });
      setMsgSeries((s) => {
        const newSeries = [...s.slice(-11), { t: label, msgs: bufferedMsgs.current }];
        return newSeries.length > 12 ? newSeries.slice(1) : newSeries;
      });

      // VGT delta per bucket
      const v = vehiclesRef.current;
      const prev = vgtSeries.at(-1);
      const row: any = { name: label };
      for (const node of v) {
        const prevRaw = prev && Object.hasOwn(prev, node.id) ? prev[node.id] : 0;
        const prevVal = Number(prevRaw) || 0;
        row[node.id] = node.wallet.vgt - prevVal;
      }
      setVgtSeries((arr) => {
        const newSeries = [...arr.slice(-11), row];
        return newSeries.length > 12 ? newSeries.slice(1) : newSeries;
      });

      bufferedMsgs.current = 0;
      bucketRef.current = now;
    }
  }, [vgtSeries]);

  /** Optimized message recording */
  const recordMessage = useCallback((kind: FeedKind, text: string) => {
    bufferedMsgs.current += 1;
    const item: FeedItem = {
      t: `[${new Date().toLocaleTimeString([], {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}]`,
      kind,
      text,
    };
    // Buffer feed items and flush periodically from the main loop to avoid frequent re-renders
    feedBufferRef.current.push(item);
  }, []);

  /** ====== Render helpers ====== */
  const vehicles = vehiclesRef.current;
  const hazards = hazardsRef.current;

  const KIND_CLASS: Record<FeedKind, string> = {
    PROX: "text-sky-300",
    V2X: "text-blue-300",
    REPORT: "text-amber-300",
    CONFIRM: "text-emerald-300",
    CONTRADICT: "text-orange-300",
    MINT: "text-pink-300",
  };

  const pages = [
    {
      title: "What is V2X?",
      body: (
        <div className="space-y-3 text-white/85">
          <p>
            <b>V2X</b> = <b>Vehicle-to-Everything</b>. Nearby nodes exchange short safety messages in real time
            within a fixed communications radius.
          </p>
          <p>
            In this sandbox, each vehicle has a <b>fixed radius</b>. When two vehicles' ranges overlap,
            a V2X proximity event occurs (logged once per encounter).
          </p>
        </div>
      ),
    },
    {
      title: "Why it helps Road-Hazard Detection",
      body: (
        <div className="space-y-3 text-white/85">
          <p>
            Instead of relying on a single car's vision alone, V2X <b>spreads awareness</b> of a reported hazard to
            nearby nodes instantly.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><b>Faster validation:</b> multiple vehicles can quickly confirm or contradict.</li>
            <li><b>Lower false positives:</b> contradictions mark hazards as <b>UNCERTAIN</b>.</li>
            <li><b>Fair rewards:</b> only <b>confirmed</b> hazards mint VGT to contributors.</li>
          </ul>
        </div>
      ),
    },
    {
      title: "How this simulation works",
      body: (
        <div className="space-y-3 text-white/85">
          <ul className="list-disc pl-5 space-y-2">
            <li>Vehicles roam with gentle jitter; circles show comms radius.</li>
            <li>First in range of a hazard <b>REPORTS</b>, others may <b>CONFIRM</b> or <b>CONTRADICT</b>.</li>
            <li>≥2 confirmations and no contradictions → <b>CONFIRMED</b> → <b>MINT</b> VGT (contributors only, 70/30 split).</li>
            <li>Right panel shows a color-coded <b>Console</b> and <b>Charts</b>.</li>
          </ul>
        </div>
      ),
    },
    {
      title: "DBSCAN clustering (why it matters)",
      body: (
        <div className="space-y-3 text-white/85">
          <p>
            Recent report points (≤{REPORT_RETENTION_MS / 1000}s) are clustered with <b>DBSCAN</b> using
            <code> eps={DBSCAN_EPS}</code> and <code>minPts={DBSCAN_MINPTS}</code>. DBSCAN finds dense regions without
            needing a preset number of clusters.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><b>Robust to noise</b>: Single/isolated reports are ignored.</li>
            <li><b>Adaptive</b>: Forms clusters only where multiple vehicles agree.</li>
            <li><b>Operational</b>: Fast on-edge via grid bucketing; no cloud required.</li>
          </ul>
          <p>Clusters are drawn as <b className="text-amber-300">gold rings</b> labeled Ck (n).</p>
        </div>
      ),
    },
  ];

  const Canvas = (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="relative card-glass overflow-hidden p-3">
      {/* Grid background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)",
          backgroundSize: `${WORLD.grid}px ${WORLD.grid}px`,
          maskImage:
            "radial-gradient(120% 120% at 50% 10%, rgba(255,255,255,1), rgba(255,255,255,0.1) 70%, transparent)",
        }}
      />

      {/* Top controls */}
      <div className="z-10 mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRunning((s) => !s)}
            className={`rounded-xl px-4 py-2 font-medium transition ${
              running ? "bg-red-500 text-white hover:bg-red-600" : "bg-emerald-500 text-white hover:bg-emerald-600"
            }`}
          >
            {running ? "Stop simulation" : "Start simulation"}
          </button>

          <div className="hidden sm:flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/80">
            <span className="text-xs">Vehicles</span>
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => setVehicleCount(n)}
                className={`rounded-md px-2 py-1 text-xs ${n === vehicleCount ? "bg-white text-slate-900" : "hover:bg-white/10"}`}
              >
                {n}
              </button>
            ))}
            <span className="ml-2 text-xs">Tick</span>
            {[16, 24, 32].map((ms) => (
              <button
                key={ms}
                onClick={() => setTickMs(ms)}
                className={`rounded-md px-2 py-1 text-xs ${ms === tickMs ? "bg-white text-slate-900" : "hover:bg-white/10"}`}
              >
                {Math.round(1000 / ms)} FPS
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setRightTab(rightTab === "console" ? "charts" : "console")}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
            title="Swap right panel"
          >
            {rightTab === "console" ? "Show Charts" : "Show Console"}
          </button>
          <button
            onClick={() => setShowInfo((s) => !s)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
            title="Explain this view"
          >
            {showInfo ? "Hide Info" : "❔ Info"}
          </button>
          <button
            onClick={() => setFullscreen(true)}
            className="rounded-xl bg-white text-slate-900 px-3 py-2 text-sm font-medium hover:bg-slate-100"
            title="Fullscreen simulation"
          >
            Fullscreen
          </button>
        </div>
      </div>

  {/* Canvas */}
  <svg ref={(el) => { svgRef.current = el; }} viewBox={`0 0 ${WORLD.w} ${WORLD.h}`} className="w-full rounded-xl">
        {/* DBSCAN clusters (gold) */}
        {clustersRef.current.map((c) => (
          <g key={c.id} opacity={0.95}>
            <circle
              ref={(el) => {
                if (el) {
                  clusterElsRef.current[c.id] = clusterElsRef.current[c.id] || {};
                  clusterElsRef.current[c.id].dot = el;
                }
              }}
              cx={c.cx}
              cy={c.cy}
              r={6}
              fill="#fbbf24"
            />
            <circle
              ref={(el) => {
                if (el) {
                  clusterElsRef.current[c.id] = clusterElsRef.current[c.id] || {};
                  clusterElsRef.current[c.id].ring = el;
                }
              }}
              cx={c.cx}
              cy={c.cy}
              r={DBSCAN_EPS}
              fill="none"
              stroke="#fbbf24"
              strokeDasharray="6 8"
              opacity={0.65}
            />
            <text
              ref={(el) => {
                if (el) {
                  clusterElsRef.current[c.id] = clusterElsRef.current[c.id] || {};
                  clusterElsRef.current[c.id].text = el;
                }
              }}
              x={c.cx + 12}
              y={c.cy - 10}
              fontSize={12}
              fill="#fde68a"
              opacity={0.95}
            >
              {`C${c.id} (${c.size})`}
            </text>
          </g>
        ))}
        {/* Hazards */}
        {hazards.map((h) => {
          const status = h.contradicted
            ? "UNCERTAIN"
            : h.reporters.size >= 2
            ? "CONFIRMED"
            : "REPORTED";
          return (
            <g key={h.id} opacity={0.95}>
                  <circle
                    ref={(el) => {
                      if (el) {
                        hazardElsRef.current[h.id] = hazardElsRef.current[h.id] || {};
                        hazardElsRef.current[h.id].dot = el;
                      }
                    }}
                    cx={h.x}
                    cy={h.y}
                    r={8}
                    fill={h.contradicted ? "#f97316" : "#ef4444"}
                  />
                  <circle
                    ref={(el) => {
                      if (el) {
                        hazardElsRef.current[h.id] = hazardElsRef.current[h.id] || {};
                        hazardElsRef.current[h.id].ring = el;
                      }
                    }}
                    cx={h.x}
                    cy={h.y}
                    r={HAZARD_RADIUS}
                    fill="none"
                    stroke="#ef4444"
                    strokeDasharray="4 6"
                    opacity={0.5}
                  />
                  <text
                    ref={(el) => {
                      if (el) {
                        hazardElsRef.current[h.id] = hazardElsRef.current[h.id] || {};
                        hazardElsRef.current[h.id].text = el;
                      }
                    }}
                    x={h.x + 14}
                    y={h.y - 12}
                    fontSize={12}
                    fill="white"
                    opacity={0.9}
                  >
                    {h.id} · {status}
                  </text>
                </g>
          );
        })}

        {/* Vehicles */}
        {vehicles.map((v) => (
          <g key={v.id}>
            <circle
              ref={(el) => {
                if (el) {
                  vehicleElsRef.current[v.id] = vehicleElsRef.current[v.id] || {};
                  vehicleElsRef.current[v.id].large = el;
                }
              }}
              cx={v.x}
              cy={v.y}
              r={v.radius}
              fill={v.color + "22"}
            />
            <circle
              ref={(el) => {
                if (el) {
                  vehicleElsRef.current[v.id] = vehicleElsRef.current[v.id] || {};
                  vehicleElsRef.current[v.id].small = el;
                }
              }}
              cx={v.x}
              cy={v.y}
              r={10}
              fill={v.color}
            />
            <text
              ref={(el) => {
                if (el) {
                  vehicleElsRef.current[v.id] = vehicleElsRef.current[v.id] || {};
                  vehicleElsRef.current[v.id].text = el;
                }
              }}
              x={v.x + 14}
              y={v.y - 10}
              fontSize={12}
              fill="white"
              opacity={0.9}
            >
              {v.id} · {v.role === "contributor" ? "CONTR" : "DEV"}
            </text>
          </g>
        ))}
      </svg>

      {/* Solid intro carousel overlay — over simulation window */}
      {showIntro && (
        <div className="absolute inset-0 z-20 grid place-items-center p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <h2 className="text-2xl md:text-3xl font-semibold text-white">
              {pages[introStep].title}
            </h2>
            <div className="mt-3">{pages[introStep].body}</div>

            <div className="mt-6 flex items-center justify-between gap-3">
              {/* Dots */}
              <div className="flex items-center gap-2">
                {pages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIntroStep(i)}
                    className={`h-2.5 w-2.5 rounded-full ${i === introStep ? "bg-white" : "bg-white/30 hover:bg-white/50"}`}
                    aria-label={`Go to step ${i + 1}`}
                  />
                ))}
              </div>
              {/* Nav buttons */}
              <div className="flex items-center gap-2">
                {introStep > 0 && (
                  <button
                    onClick={() => setIntroStep((s) => Math.max(0, s - 1))}
                    className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15"
                  >
                    Back
                  </button>
                )}
                {introStep < pages.length - 1 ? (
                  <button
                    onClick={() => setIntroStep((s) => Math.min(pages.length - 1, s + 1))}
                    className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={() => setShowIntro(false)}
                    className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
                  >
                    Let's go
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info overlay */}
      {showInfo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pointer-events-none absolute inset-0 p-3"
        >
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Bubble>
              <b>Grid city</b>: Vehicles move with fixed comms radius. Overlap triggers V2X messages (logged once per encounter).
            </Bubble>
            <Bubble>
              <b>Hazards</b>: First vehicle reports; the next may confirm or <b>contradict</b>. Any contradiction → <b>UNCERTAIN</b>.
            </Bubble>
            <Bubble>
              <b>Minting</b>: Only when a hazard is <b>CONFIRMED</b> (≥2 confirms, no contradictions). Rewards go only to <b>contributors</b>.
            </Bubble>
          </div>
        </motion.div>
      )}
    </motion.div>
  );

  const RightPanel = (
    <motion.div initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45 }} className="space-y-4">
      {/* Legend + Wallet snapshot */}
      <div className="card-glass p-4">
        <div className="mb-3 text-sm text-white/70">Nodes & wallets</div>
        <div className="grid gap-3 sm:grid-cols-2">
          {vehicles.map((v) => (
            <motion.div key={v.id} whileHover={{ scale: 1.02 }} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full" style={{ background: v.color }} />
                  <div className="font-medium text-white">{v.id}</div>
                </div>
                <div className="text-xs text-white/60">{v.role.toUpperCase()}</div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-black/30 p-2">
                  <div className="text-white/60 text-xs">VGT</div>
                  <div className="text-white font-semibold">{v.wallet.vgt.toFixed(1)}</div>
                </div>
                <div className="rounded-lg bg-black/30 p-2">
                  <div className="text-white/60 text-xs">Radius</div>
                  <div className="text-white font-semibold">{v.radius}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="mt-3 text-xs text-white/50">
          Reward split on <b>confirmed</b> hazards: Publisher {SPLIT.publisher * 100}%, Validators {SPLIT.validators * 100}% (contributors only).
        </div>
      </div>

      {rightTab === "console" ? (
        <div className="card-glass max-h-72 overflow-auto p-4">
          <div className="mb-2 text-sm text-white/70">Console</div>
          <ul className="space-y-1 text-sm">
            {feed.length === 0 && <li className="text-white/50">No events yet. Start the simulation.</li>}
            {feed.map((m, i) => (
              <li key={i} className={`font-mono ${KIND_CLASS[m.kind]}`}>
                <span className="text-white/50">{m.t}</span>{" "}
                <span className="mr-2 rounded-md border border-white/10 bg-white/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/90">
                  {m.kind}
                </span>
                <span className="text-white/90">{m.text}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <div className="card-glass p-4">
            <div className="mb-3 text-sm text-white/70">Messages / {BUCKET_MS / 1000}s</div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={msgSeries}>
                  <XAxis dataKey="t" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                  <RTooltip />
                  <Line type="monotone" dataKey="msgs" stroke="#38bdf8" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card-glass p-4">
            <div className="mb-3 text-sm text-white/70">VGT earned per bucket (delta)</div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vgtSeries}>
                  <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                  <Legend />
                  <RTooltip />
                  {vehicles.map((v) => (
                    <Bar key={v.id} dataKey={v.id} stackId="s" fill={v.color} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(740px,1fr)_380px]">
      {/* Left: Canvas */}
      {Canvas}

      {/* Right: Console / Charts */}
      {RightPanel}

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div className="fixed inset-0 z-[300] bg-slate-950/95 p-4 md:p-6">
          <div className="mx-auto grid h-full max-w-[1600px] gap-4 lg:grid-cols-[1fr_420px]">
            <div className="relative">
              <div className="absolute right-2 top-2 z-10 flex gap-2">
                <button
                  onClick={() => setRightTab(rightTab === "console" ? "charts" : "console")}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
                >
                  {rightTab === "console" ? "Show Charts" : "Show Console"}
                </button>
                <button
                  onClick={() => setFullscreen(false)}
                  className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
                >
                  Exit Fullscreen
                </button>
              </div>
              {/* Big canvas */}
              <div className="absolute inset-0">{Canvas}</div>
            </div>
            {/* Swappable side panel */}
            <div className="overflow-y-auto">{RightPanel}</div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Small helper bubble for the info overlay */
function Bubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-auto rounded-xl border border-white/10 bg-black/50 p-3 text-sm text-white/90 shadow-lg backdrop-blur">
      {children}
    </div>
  );
}

/** ===== DBSCAN Implementation (lightweight) ===== */
function runDbscan(points: ReportPoint[], eps: number, minPts: number): Cluster[] {
  if (!points.length) return [];
  const eps2 = eps * eps;
  const labels: number[] = new Array(points.length).fill(-1); // -1 unvisited, -2 noise, >=0 cluster id

  // simple grid bucketing to accelerate neighbor search
  const cellSize = eps;
  const grid = new Map<string, number[]>();
  function key(x: number, y: number) {
    return `${Math.floor(x / cellSize)}|${Math.floor(y / cellSize)}`;
  }
  points.forEach((p, idx) => {
    const k = key(p.x, p.y);
    const arr = grid.get(k);
    if (arr) arr.push(idx); else grid.set(k, [idx]);
  });

  function regionQuery(i: number): number[] {
    const p = points[i];
    const cx = Math.floor(p.x / cellSize);
    const cy = Math.floor(p.y / cellSize);
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
  }

  let clusterId = 0;
  for (let i = 0; i < points.length; i++) {
    if (labels[i] !== -1) continue; // already processed
    const neighbors = regionQuery(i);
    if (neighbors.length < minPts) {
      labels[i] = -2; // noise
      continue;
    }
    // start new cluster
    const cid = clusterId++;
    labels[i] = cid;
    const queue = neighbors.filter((n) => n !== i);
    while (queue.length) {
      const j = queue.pop()!;
      if (labels[j] === -2) labels[j] = cid; // noise becomes border
      if (labels[j] !== -1) continue;
      labels[j] = cid;
      const nbs = regionQuery(j);
      if (nbs.length >= minPts) {
        for (const nb of nbs) if (labels[nb] === -1) queue.push(nb);
      }
    }
  }

  // aggregate clusters
  const acc: Record<number, { sumX: number; sumY: number; count: number }> = {};
  points.forEach((p, i) => {
    const l = labels[i];
    if (l >= 0) {
      const slot = acc[l] || (acc[l] = { sumX: 0, sumY: 0, count: 0 });
      slot.sumX += p.x;
      slot.sumY += p.y;
      slot.count += 1;
    }
  });
  return Object.entries(acc).map(([cid, v]) => ({
    id: cid,
    cx: v.sumX / v.count,
    cy: v.sumY / v.count,
    size: v.count,
  }));
}