"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
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
const FIXED_RADIUS = 130;
const HAZARD_RADIUS = 18;
const SPLIT = { publisher: 0.7, validators: 0.3 };
const BUCKET_MS = 2000;
// DBSCAN settings (pixels)
const DBSCAN_EPS = 32;
const DBSCAN_MINPTS = 3;
const REPORT_RETENTION_MS = 6000;

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
  wallet: { vgt: number };
};

type Hazard = {
  id: string;
  x: number;
  y: number;
  ttl: number;
  reporters: Set<string>;
  contradicted: boolean;
  rewarded: boolean;
};

type ReportPoint = { x: number; y: number; vid: string; ts: number; src: string };
type Cluster = { id: string; cx: number; cy: number; size: number };

type RightPaneTab = "console" | "charts";

type FeedKind =
  | "PROX"
  | "V2X"
  | "REPORT"
  | "CONFIRM"
  | "CONTRADICT"
  | "MINT";
type FeedItem = { t: string; kind: FeedKind; text: string };

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

export default function V2XDemo() {
  const [vehicleCount, setVehicleCount] = useState(3);
  const [running, setRunning] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [introStep, setIntroStep] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [tickMs, setTickMs] = useState(16);
  const [rightTab, setRightTab] = useState<RightPaneTab>("console");
  const [fullscreen, setFullscreen] = useState(false);

  const vehiclesRef = useRef<Vehicle[]>([]);
  const hazardsRef = useRef<Hazard[]>([]);
  const rafRef = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const vehicleElsRef = useRef<
    Record<
      string,
      { large?: SVGCircleElement | null; small?: SVGCircleElement | null; text?: SVGTextElement | null }
    >
  >({});
  const hazardElsRef = useRef<
    Record<string, { dot?: SVGCircleElement | null; ring?: SVGCircleElement | null; text?: SVGTextElement | null }>
  >({});
  const clusterElsRef = useRef<
    Record<string, { dot?: SVGCircleElement | null; ring?: SVGCircleElement | null; text?: SVGTextElement | null }>
  >({});

  // DBSCAN buffers
  const reportPtsRef = useRef<ReportPoint[]>([]);
  const clustersRef = useRef<Cluster[]>([]);
  const lastClusterRunRef = useRef<number>(0);

  // Event feed & charts
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [msgSeries, setMsgSeries] = useState<{ t: string; msgs: number }[]>([]);
  const [vgtSeries, setVgtSeries] = useState<{ name: string; [k: string]: number | string }[]>([]);
  const bucketRef = useRef<number>(performance.now());
  const bufferedMsgs = useRef<number>(0);
  const feedBufferRef = useRef<FeedItem[]>([]);
  const lastFeedFlushRef = useRef<number>(performance.now());
  const FEED_FLUSH_INTERVAL = 200;

  // Track V2V proximities
  const proximityRef = useRef<Set<string>>(new Set());
  const lastProximityCheckRef = useRef<number>(0);
  const PROXIMITY_CHECK_INTERVAL = 300;

  // Init vehicles on count change
  useEffect(() => {
    const v: Vehicle[] = [];
    for (let i = 0; i < vehicleCount; i++) {
      const role: Role = "contributor";
      v.push(makeVehicle(`V${i + 1}`, PALETTE[i % PALETTE.length], role));
    }
    vehiclesRef.current = v;
    hazardsRef.current = [];
    proximityRef.current.clear();
    vehicleElsRef.current = {};
    hazardElsRef.current = {};
    feedBufferRef.current = [];
    setFeed([]);
    setMsgSeries([]);
    setVgtSeries([]);
  }, [vehicleCount]);

  // Main loop
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
    feedBufferRef.current.push(item);
  }, []);

  const step = useCallback(
    (dt: number) => {
      const V = vehiclesRef.current;
      let H = hazardsRef.current;
      const currentTime = performance.now();

      // occasional hazard spawns
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

      // move vehicles
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

      // V2V proximity
      if (currentTime - lastProximityCheckRef.current > PROXIMITY_CHECK_INTERVAL) {
        lastProximityCheckRef.current = currentTime;
        const prox = proximityRef.current;
        const newProx = new Set<string>();

        for (let i = 0; i < V.length; i++) {
          for (let j = i + 1; j < V.length; j++) {
            const a = V[i],
              b = V[j];
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

      // Hazard logic
      const newHazards: Hazard[] = [];
      for (const hz of H) {
        hz.ttl -= dt * 16;
        if (hz.ttl <= 0) continue;

        const inRange: Vehicle[] = [];
        for (const v of V) {
          const dx = v.x - hz.x;
          const dy = v.y - hz.y;
          if (dx * dx + dy * dy <= v.radius * v.radius) inRange.push(v);
        }

        if (inRange.length > 0) {
          // closest
          let closest = inRange[0];
          let closestDist =
            (closest.x - hz.x) * (closest.x - hz.x) +
            (closest.y - hz.y) * (closest.y - hz.y);
          for (let k = 1; k < inRange.length; k++) {
            const cur = inRange[k];
            const d2 =
              (cur.x - hz.x) * (cur.x - hz.x) +
              (cur.y - hz.y) * (cur.y - hz.y);
            if (d2 < closestDist) {
              closest = cur;
              closestDist = d2;
            }
          }

          if (!hz.reporters.size) {
            hz.reporters.add(closest.id);
            recordMessage(
              "REPORT",
              `HAZARD REPORTED • ${closest.id} reported ${hz.id} (no mint yet)`,
            );
            reportPtsRef.current.push({
              x: hz.x + rand(-2, 2),
              y: hz.y + rand(-2, 2),
              vid: closest.id,
              ts: currentTime,
              src: hz.id,
            });

            for (const other of inRange) {
              if (other.id !== closest.id) {
                recordMessage(
                  "V2X",
                  `V2X • ${closest.id} → ${other.id}: "${hz.id}" near you`,
                );
              }
            }
          } else {
            const already = hz.reporters.has(closest.id);
            if (!already) {
              const contradict = Math.random() < 0.4;
              if (contradict) {
                hz.contradicted = true;
                recordMessage(
                  "CONTRADICT",
                  `CONTRADICT • ${closest.id} flagged ${hz.id} as NOT a hazard → UNCERTAIN`,
                );
              } else {
                hz.reporters.add(closest.id);
                recordMessage("CONFIRM", `CONFIRM • ${closest.id} confirmed ${hz.id}`);
                reportPtsRef.current.push({
                  x: hz.x + rand(-2, 2),
                  y: hz.y + rand(-2, 2),
                  vid: closest.id,
                  ts: currentTime,
                  src: hz.id,
                });
              }
            }
          }

          // outcome
          if (!hz.rewarded && !hz.contradicted) {
            if (hz.reporters.size >= 2) {
              const first = Array.from(hz.reporters)[0];
              const rest = Array.from(hz.reporters).slice(1);

              const publisher = V.find((v) => v.id === first);
              const validators = rest
                .map((id) => V.find((v) => v.id === id))
                .filter(Boolean) as Vehicle[];

              const TOTAL = 12;
              const pubAmt = TOTAL * SPLIT.publisher;
              const valPool = TOTAL * SPLIT.validators;

              if (publisher && publisher.role === "contributor") {
                publisher.wallet.vgt += pubAmt;
              }
              const eligibleVals = validators.filter(
                (v) => v.role === "contributor",
              );
              if (eligibleVals.length) {
                const each = valPool / eligibleVals.length;
                for (const v of eligibleVals) v.wallet.vgt += each;
              }

              hz.rewarded = true;
              recordMessage(
                "MINT",
                `MINT • ${hz.id} CONFIRMED → +${TOTAL} VGT (pub: ${pubAmt.toFixed(
                  1,
                )}, val: ${valPool.toFixed(1)}) to contributors`,
              );
            }
          }
        }

        newHazards.push(hz);
      }

      hazardsRef.current = newHazards;

      // sliding window reports
      reportPtsRef.current = reportPtsRef.current.filter(
        (p) => currentTime - p.ts <= REPORT_RETENTION_MS,
      );

      // DBSCAN
      if (currentTime - lastClusterRunRef.current > 400) {
        lastClusterRunRef.current = currentTime;
        clustersRef.current = runDbscan(
          reportPtsRef.current,
          DBSCAN_EPS,
          DBSCAN_MINPTS,
        );
      }

      // flush feed buffer
      const flushNow = performance.now();
      if (
        flushNow - lastFeedFlushRef.current > FEED_FLUSH_INTERVAL &&
        feedBufferRef.current.length
      ) {
        const toFlush = feedBufferRef.current.slice();
        feedBufferRef.current = [];
        setFeed((prev) => {
          const merged = [...toFlush, ...prev].slice(0, 100);
          return merged;
        });
        lastFeedFlushRef.current = flushNow;
      }

      // DOM updates
      try {
        const vEls = vehicleElsRef.current;
        for (const v of V) {
          const e = vEls[v.id];
          if (e) {
            const x = String(Math.round(v.x * 100) / 100);
            const y = String(Math.round(v.y * 100) / 100);
            e.large?.setAttribute("cx", x);
            e.large?.setAttribute("cy", y);
            e.small?.setAttribute("cx", x);
            e.small?.setAttribute("cy", y);
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
            const x = String(Math.round(h.x * 100) / 100);
            const y = String(Math.round(h.y * 100) / 100);
            e.dot?.setAttribute("cx", x);
            e.dot?.setAttribute("cy", y);
            e.ring?.setAttribute("cx", x);
            e.ring?.setAttribute("cy", y);
            if (e.text) {
              e.text.setAttribute("x", String(Math.round((h.x + 14) * 100) / 100));
              e.text.setAttribute("y", String(Math.round((h.y - 12) * 100) / 100));
            }
          }
        }

        const cEls = clusterElsRef.current;
        for (const c of clustersRef.current) {
          const e = cEls[c.id];
          if (e) {
            const x = String(Math.round(c.cx * 100) / 100);
            const y = String(Math.round(c.cy * 100) / 100);
            e.dot?.setAttribute("cx", x);
            e.dot?.setAttribute("cy", y);
            e.ring?.setAttribute("cx", x);
            e.ring?.setAttribute("cy", y);
            if (e.text) {
              e.text.setAttribute("x", String(Math.round((c.cx + 12) * 100) / 100));
              e.text.setAttribute("y", String(Math.round((c.cy - 10) * 100) / 100));
            }
          }
        }
      } catch {
        // ignore DOM errors
      }

      // bucketed charts
      const now = flushNow;
      if (now - bucketRef.current > BUCKET_MS) {
        const label = new Date(now).toLocaleTimeString([], {
          minute: "2-digit",
          second: "2-digit",
        });
        setMsgSeries((s) => {
          const newSeries = [...s.slice(-11), { t: label, msgs: bufferedMsgs.current }];
          return newSeries.length > 12 ? newSeries.slice(1) : newSeries;
        });

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
    },
    [recordMessage, vgtSeries],
  );

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
            <b>V2X</b> = <b>Vehicle-to-Everything</b>. Nearby nodes exchange
            short safety messages in real time within a fixed communications
            radius.
          </p>
          <p>
            In this sandbox, each vehicle has a <b>fixed radius</b>. When two
            vehicles&apos; ranges overlap, a V2X proximity event occurs.
          </p>
        </div>
      ),
    },
    {
      title: "Why it helps road-hazard detection",
      body: (
        <div className="space-y-3 text-white/85">
          <p>
            Instead of relying on a single car&apos;s vision alone, V2X{" "}
            <b>spreads awareness</b> of a reported hazard to nearby nodes
            instantly.
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <b>Faster validation:</b> multiple vehicles can quickly confirm or
              contradict.
            </li>
            <li>
              <b>Lower false positives:</b> contradictions mark hazards as{" "}
              <b>UNCERTAIN</b>.
            </li>
            <li>
              <b>Fair rewards:</b> only <b>confirmed</b> hazards mint VGT.
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: "How this simulation works",
      body: (
        <div className="space-y-3 text-white/85">
          <ul className="list-disc space-y-2 pl-5">
            <li>Vehicles roam with gentle jitter; circles show comms radius.</li>
            <li>
              First in range of a hazard <b>REPORTS</b>, others may{" "}
              <b>CONFIRM</b> or <b>CONTRADICT</b>.
            </li>
            <li>
              ≥2 confirmations and no contradictions → <b>CONFIRMED</b> →{" "}
              <b>MINT</b> VGT.
            </li>
            <li>Right panel shows a color‑coded console and charts.</li>
          </ul>
        </div>
      ),
    },
    {
      title: "DBSCAN clustering",
      body: (
        <div className="space-y-3 text-white/85">
          <p>
            Recent report points (≤{REPORT_RETENTION_MS / 1000}s) are clustered
            with <b>DBSCAN</b> using eps={DBSCAN_EPS}, minPts={DBSCAN_MINPTS}.
          </p>
          <p>
            Clusters are drawn as{" "}
            <b className="text-amber-300">gold rings</b> labeled Ck (n).
          </p>
        </div>
      ),
    },
  ];

  const Canvas = (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative card-glass overflow-hidden p-3"
    >
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
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
              running
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-emerald-500 text-white hover:bg-emerald-600"
            }`}
          >
            {running ? "Stop simulation" : "Start simulation"}
          </button>

          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white/80 sm:flex">
            <span>Vehicles</span>
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => setVehicleCount(n)}
                className={`rounded-md px-2 py-1 ${
                  n === vehicleCount
                    ? "bg-white text-slate-900"
                    : "hover:bg-white/10"
                }`}
              >
                {n}
              </button>
            ))}
            <span className="ml-2">Tick</span>
            {[16, 24, 32].map((ms) => (
              <button
                key={ms}
                onClick={() => setTickMs(ms)}
                className={`rounded-md px-2 py-1 ${
                  ms === tickMs
                    ? "bg-white text-slate-900"
                    : "hover:bg-white/10"
                }`}
              >
                {Math.round(1000 / ms)} FPS
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setRightTab(rightTab === "console" ? "charts" : "console")}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
          >
            {rightTab === "console" ? "Show charts" : "Show console"}
          </button>
          <button
            onClick={() => setShowInfo((s) => !s)}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
          >
            {showInfo ? "Hide info" : "❔ Info"}
          </button>
          <button
            onClick={() => setFullscreen(true)}
            className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100"
          >
            Fullscreen
          </button>
        </div>
      </div>

      {/* Canvas */}
      <svg
        ref={(el) => {
          svgRef.current = el;
        }}
        viewBox={`0 0 ${WORLD.w} ${WORLD.h}`}
        className="w-full rounded-xl"
      >
        {/* DBSCAN clusters */}
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
                  vehicleElsRef.current[v.id] =
                    vehicleElsRef.current[v.id] || {};
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
                  vehicleElsRef.current[v.id] =
                    vehicleElsRef.current[v.id] || {};
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
                  vehicleElsRef.current[v.id] =
                    vehicleElsRef.current[v.id] || {};
                  vehicleElsRef.current[v.id].text = el;
                }
              }}
              x={v.x + 14}
              y={v.y - 10}
              fontSize={12}
              fill="white"
              opacity={0.9}
            >
              {v.id} · CONTR
            </text>
          </g>
        ))}
      </svg>

      {/* Intro overlay */}
      {showIntro && (
        <div className="absolute inset-0 z-20 grid place-items-center p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-slate-950/95 p-6 shadow-2xl">
            <h2 className="text-xl md:text-2xl font-semibold text-white">
              {pages[introStep].title}
            </h2>
            <div className="mt-3 text-sm">{pages[introStep].body}</div>
            <div className="mt-6 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {pages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIntroStep(i)}
                    className={`h-2.5 w-2.5 rounded-full ${
                      i === introStep
                        ? "bg-white"
                        : "bg-white/30 hover:bg-white/50"
                    }`}
                    aria-label={`Go to step ${i + 1}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                {introStep > 0 && (
                  <button
                    onClick={() =>
                      setIntroStep((s) => Math.max(0, s - 1))
                    }
                    className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/15"
                  >
                    Back
                  </button>
                )}
                {introStep < pages.length - 1 ? (
                  <button
                    onClick={() =>
                      setIntroStep((s) => Math.min(pages.length - 1, s + 1))
                    }
                    className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={() => setShowIntro(false)}
                    className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100"
                  >
                    Let&apos;s go
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info bubbles */}
      {showInfo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pointer-events-none absolute inset-0 p-3"
        >
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Bubble>
              <b>Grid city</b>: vehicles move with fixed comms radius; overlap
              triggers V2X messages (logged once per encounter).
            </Bubble>
            <Bubble>
              <b>Hazards</b>: first vehicle reports; next ones may{" "}
              <b>CONFIRM</b> or <b>CONTRADICT</b>. Any contradiction →{" "}
              <b>UNCERTAIN</b>.
            </Bubble>
            <Bubble>
              <b>Minting</b>: only <b>CONFIRMED</b> hazards mint VGT to
              contributors.
            </Bubble>
          </div>
        </motion.div>
      )}
    </motion.div>
  );

  const RightPanel = (
    <motion.div
      initial={{ opacity: 0, x: 6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45 }}
      className="space-y-4"
    >
      {/* Legend + wallets */}
      <div className="card-glass p-4">
        <div className="mb-3 text-xs font-medium text-white/70">
          Nodes &amp; wallets
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {vehicles.map((v) => (
            <motion.div
              key={v.id}
              whileHover={{ scale: 1.02 }}
              className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs light:bg-slate-100/70"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ background: v.color }}
                  />
                  <div className="text-sm font-medium text-white light:text-slate-900">
                    {v.id}
                  </div>
                </div>
                <div className="text-[10px] uppercase text-white/60">
                  CONTR
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-lg bg-black/40 p-2 light:bg-slate-900/5">
                  <div className="text-[10px] text-white/60">VGT</div>
                  <div className="text-sm font-semibold text-white light:text-slate-900">
                    {v.wallet.vgt.toFixed(1)}
                  </div>
                </div>
                <div className="rounded-lg bg-black/40 p-2 light:bg-slate-900/5">
                  <div className="text-[10px] text-white/60">Radius</div>
                  <div className="text-sm font-semibold text-white light:text-slate-900">
                    {v.radius}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="mt-3 text-[11px] text-white/50">
          Reward split on <b>confirmed</b> hazards: publisher{" "}
          {SPLIT.publisher * 100}%, validators {SPLIT.validators * 100}%.
        </div>
      </div>

      {rightTab === "console" ? (
        <div className="card-glass max-h-72 overflow-auto p-4">
          <div className="mb-2 text-xs font-medium text-white/70">
            Console
          </div>
          <ul className="space-y-1 text-xs">
            {feed.length === 0 && (
              <li className="text-white/50">
                No events yet. Start the simulation.
              </li>
            )}
            {feed.map((m, i) => (
              <li key={i} className={`font-mono ${KIND_CLASS[m.kind]}`}>
                <span className="text-white/50">{m.t}</span>{" "}
                <span className="mr-2 inline-flex items-center rounded-md border border-white/10 bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/90">
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
            <div className="mb-3 text-xs font-medium text-white/70">
              Messages / {BUCKET_MS / 1000}s
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={msgSeries}>
                  <XAxis
                    dataKey="t"
                    stroke="#9ca3af"
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: 10 }} />
                  <RTooltip />
                  <Line
                    type="monotone"
                    dataKey="msgs"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card-glass p-4">
            <div className="mb-3 text-xs font-medium text-white/70">
              VGT earned per bucket
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vgtSeries}>
                  <XAxis
                    dataKey="name"
                    stroke="#9ca3af"
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: 10 }} />
                  <Legend />
                  <RTooltip />
                  {vehicles.map((v) => (
                    <Bar
                      key={v.id}
                      dataKey={v.id}
                      stackId="s"
                      fill={v.color}
                    />
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
    <section className="relative py-24 lg:py-28">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header to match SonicDemo */}
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-xs font-medium tracking-[0.22em] text-cyan-400 light:text-blue-600">
            V2X SANDBOX
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl lg:text-5xl light:text-slate-900">
            See how vehicles{" "}
            <span className="text-cyan-400 light:text-cyan-600">
              agree on hazards.
            </span>
          </h2>
          <p className="mt-4 text-sm md:text-base leading-relaxed text-slate-400 light:text-slate-600">
            A small city of nodes, hazard reports, and DBSCAN clustering—
            running fully in your browser to show how V2X consensus drives
            VGT rewards.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(740px,1fr)_360px]">
          {Canvas}
          {RightPanel}
        </div>

        {/* Fullscreen overlay */}
        {fullscreen && (
          <div className="fixed inset-0 z-[300] bg-slate-950/95 p-4 md:p-6">
            <div className="mx-auto grid h-full max-w-[1600px] gap-4 lg:grid-cols-[1fr_420px]">
              <div className="relative">
                <div className="absolute right-2 top-2 z-10 flex gap-2">
                  <button
                    onClick={() =>
                      setRightTab(rightTab === "console" ? "charts" : "console")
                    }
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
                  >
                    {rightTab === "console" ? "Show charts" : "Show console"}
                  </button>
                  <button
                    onClick={() => setFullscreen(false)}
                    className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100"
                  >
                    Exit fullscreen
                  </button>
                </div>
                <div className="absolute inset-0">{Canvas}</div>
              </div>
              <div className="overflow-y-auto">{RightPanel}</div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/** Helper bubble for info overlay */
function Bubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-auto rounded-xl border border-white/10 bg-black/60 p-3 text-xs text-white/90 shadow-lg backdrop-blur">
      {children}
    </div>
  );
}

/** Lightweight DBSCAN */
function runDbscan(points: ReportPoint[], eps: number, minPts: number): Cluster[] {
  if (!points.length) return [];
  const eps2 = eps * eps;
  const labels: number[] = new Array(points.length).fill(-1);

  const cellSize = eps;
  const grid = new Map<string, number[]>();
  const key = (x: number, y: number) =>
    `${Math.floor(x / cellSize)}|${Math.floor(y / cellSize)}`;

  points.forEach((p, idx) => {
    const k = key(p.x, p.y);
    const arr = grid.get(k);
    if (arr) arr.push(idx);
    else grid.set(k, [idx]);
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
    if (labels[i] !== -1) continue;
    const neighbors = regionQuery(i);
    if (neighbors.length < minPts) {
      labels[i] = -2;
      continue;
    }
    const cid = clusterId++;
    labels[i] = cid;
    const queue = neighbors.filter((n) => n !== i);
    while (queue.length) {
      const j = queue.pop()!;
      if (labels[j] === -2) labels[j] = cid;
      if (labels[j] !== -1) continue;
      labels[j] = cid;
      const nbs = regionQuery(j);
      if (nbs.length >= minPts) {
        for (const nb of nbs) if (labels[nb] === -1) queue.push(nb);
      }
    }
  }

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
    id: cid, // <-- STRING, NOT NUMBER
    cx: v.sumX / v.count,
    cy: v.sumY / v.count,
    size: v.count,
  }));
}