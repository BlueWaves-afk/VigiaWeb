// src/app/sandbox/sensor-fusion/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import PageShell from "@/components/PageShell";
import { Area, AreaChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import { AnimatePresence, motion } from "framer-motion";

type Vec = { x: number; y: number };
type Node = { id: string; p: Vec };
type Edge = { id: string; a: string; b: string; ctrl?: Vec; baseCost: number; closed?: boolean; hazards: Hazard[] };
type HazardKind = "pothole" | "debris" | "work";
type Hazard = { id: string; kind: HazardKind; pos: number; severity: number; ts: number };
type Decision = "Cruise" | "Slow down" | "Reroute";
type Vehicle = {
  id: string;
  color: string;
  nodeFrom: string;
  nodeTo: string;
  t: number;
  speed: number;
  radius: number;
  route: string[];
  action: Decision;
  actionTTL?: number;
};
type VisionDetection = {
  id: string;
  hazardId: string;
  edgeId: string;
  conf: number;
  ts: number;
  expires: number;
  pos: Vec;
};
type AudioFeature = { id: string; hazardId: string; ts: number; energy: number; screech: number };
type ImuFeature = { ts: number; peak: number; impulse: number; width50: number };
type FusionSource = "none" | "vision" | "imu" | "audio" | "imu+audio" | "vision+audio" | "vision+imu" | "vision+imu+audio";
type FusionResult = { hazardProb: number; severity: number; source: FusionSource; hazardId?: string; edgeId?: string };
type AlphaBetaState = { alpha: number; beta: number; estimate: number; rate: number; lastTs: number };
type ImuPulse = { id: string; hazardId: string; kind: HazardKind; start: number; duration: number; amplitude: number };
type HazardEvidence = {
  hazard: Hazard;
  edgeId: string;
  severityEma: number;
  lastVisionTs?: number;
  visionConf?: number;
  imu?: ImuFeature;
  audio?: AudioFeature;
  lastFusionAction?: number;
};

const WORLD = { w: 1120, h: 640 };
const RADAR = 140;
const TICK_MS = 28;
const EDGE_SLOWDOWN = 0.55;
const ACTION_TTL = 2800;
const FEED_MAX = 140;
const IMU_WINDOW_MS = 2000;
const VISION_BUFFER_MS = 2000;
const FUSION_INTERVAL_MS = 125; // ~8 Hz refresh
const FUSION_PROB_THRESHOLD = 0.7;
const FUSION_SEV_THRESHOLD = 0.4;
const DEFAULT_IMU_FEATURES: ImuFeature = { ts: 0, peak: 0, impulse: 0, width50: 0 };
const DEFAULT_FUSION_HUD: FusionResult = { hazardProb: 0, severity: 0, source: "none" };
const EXPLAINER_SLIDES: Array<{ title: string; body: string; caption: string }> = [
  {
    title: "Looping the city graph",
    body: "Vehicles resample the street graph, weigh hazards per edge, and chase the lowest cost route while new road threats appear.",
    caption: "Adaptive rerouting keeps uptime high even when paths degrade in real time.",
  },
  {
    title: "Alpha-beta filter = Kalman cousin",
    body: "Raw IMU spikes flow through our alpha-beta filter (a simplified Kalman filter) to estimate true acceleration and remove sensor jitter.",
    caption: "Smoother signals expose real impacts without false positives.",
  },
  {
    title: "Fusion quantifies error for the map",
    body: "Vision, IMU, and audio cues combine into fused probability and severity scores. Tracking residual error tells us when to persist hazards to the network graph.",
    caption: "A richer hazard map drives better planning and preventive maintenance.",
  },
];

const HAZARD_META: Record<
  HazardKind,
  { label: string; color: string; pulseWidth: number; pulseAmp: number; audioEnergy: number; audioScreech: number }
> = {
  pothole: { label: "pothole", color: "#f97316", pulseWidth: 480, pulseAmp: 1.12, audioEnergy: 0.88, audioScreech: 0.18 },
  debris: { label: "debris", color: "#eab308", pulseWidth: 420, pulseAmp: 0.55, audioEnergy: 0.52, audioScreech: 0.36 },
  work: { label: "speedbreaker", color: "#ef4444", pulseWidth: 900, pulseAmp: 0.82, audioEnergy: 0.68, audioScreech: 0.22 },
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const choice = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const timeTag = () =>
  `[${new Date().toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}]`;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpP = (a: Vec, b: Vec, t: number): Vec => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });
const quadBezier = (a: Vec, c: Vec, b: Vec, t: number): Vec => {
  const u = 1 - t;
  return {
    x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
    y: u * u * a.y + 2 * u * t * c.y + t * t * b.y,
  };
};

function alphaBetaInit(alpha: number, beta: number): AlphaBetaState {
  return { alpha, beta, estimate: 0, rate: 0, lastTs: typeof performance !== "undefined" ? performance.now() : 0 };
}
function alphaBetaStep(state: AlphaBetaState, measurement: number, now: number) {
  const dt = Math.max((now - state.lastTs) / 1000, 0.001);
  const xPred = state.estimate + state.rate * dt;
  const residual = measurement - xPred;
  state.estimate = xPred + state.alpha * residual;
  state.rate = state.rate + (state.beta / dt) * residual;
  state.lastTs = now;
  return state.estimate;
}

function computeImuFeatures(samples: { t: number; raw: number }[]): ImuFeature {
  const ts = typeof performance !== "undefined" ? performance.now() : Date.now();
  if (samples.length < 2) return { ts, peak: 0, impulse: 0, width50: 0 };
  const peak = samples.reduce((max, s) => Math.max(max, Math.abs(s.raw)), 0);
  if (peak < 0.01) return { ts, peak: 0, impulse: 0, width50: 0 };
  let impulse = 0;
  for (let i = 1; i < samples.length; i++) {
    const prev = samples[i - 1];
    const cur = samples[i];
    const dt = (cur.t - prev.t) / 1000;
    impulse += ((Math.abs(prev.raw) + Math.abs(cur.raw)) * 0.5) * dt;
  }
  const half = peak * 0.5;
  let t1: number | null = null;
  let t2: number | null = null;
  for (const s of samples) {
    if (Math.abs(s.raw) >= half) {
      if (t1 == null) t1 = s.t;
      t2 = s.t;
    }
  }
  const width = t1 != null && t2 != null ? (t2 - t1) / 1000 : 0;
  return { ts, peak, impulse, width50: width };
}

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
  { id: "DH", a: "D", b: "H", baseCost: 9, hazards: [], ctrl: { x: 700, y: 380 } },
  { id: "CK", a: "C", b: "K", baseCost: 9, hazards: [], ctrl: { x: 340, y: 380 } },
];

function dijkstra(nodes: Node[], edges: Edge[], start: string, goal: string, slowdownEdges: Set<string> = new Set()) {
  const edgeMap = new Map<string, Edge[]>();
  for (const e of edges) {
    if (e.closed) continue;
    if (!edgeMap.has(e.a)) edgeMap.set(e.a, []);
    if (!edgeMap.has(e.b)) edgeMap.set(e.b, []);
    edgeMap.get(e.a)!.push(e);
    edgeMap.get(e.b)!.push({ ...e, a: e.b, b: e.a, id: e.id });
  }
  const dist = new Map<string, number>();
  const prev = new Map<string, string | undefined>();
  const queue = new Set(nodes.map((n) => n.id));
  nodes.forEach((n) => dist.set(n.id, Infinity));
  dist.set(start, 0);

  while (queue.size) {
    let u: string | null = null;
    let best = Infinity;
    for (const id of queue) {
      const d = dist.get(id)!;
      if (d < best) {
        best = d;
        u = id;
      }
    }
    if (u == null) break;
    queue.delete(u);
    if (u === goal) break;

    const outs = edgeMap.get(u) || [];
    for (const e of outs) {
      let penalty = 0;
      for (const hz of e.hazards) penalty += hz.severity * 4;
      const slow = slowdownEdges.has(e.id) ? e.baseCost * (1 / EDGE_SLOWDOWN - 1) : 0;
      const alternative = dist.get(u)! + e.baseCost + penalty + slow;
      if (alternative < dist.get(e.b)!) {
        dist.set(e.b, alternative);
        prev.set(e.b, u);
      }
    }
  }

  const path: string[] = [];
  let cur: string | undefined = goal;
  if (prev.get(cur!) === undefined && cur !== start) return [start];
  while (cur) {
    path.unshift(cur);
    if (cur === start) break;
    cur = prev.get(cur);
  }
  return path;
}

function nextHop(start: string, end: string, edges: Edge[], slow: Set<string> = new Set()) {
  return dijkstra(NODES, edges, start, end, slow);
}

function edgePoint(e: Edge, t: number): Vec {
  const A = NODES.find((n) => n.id === e.a)!.p;
  const B = NODES.find((n) => n.id === e.b)!.p;
  if (e.ctrl) return quadBezier(A, e.ctrl, B, t);
  return lerpP(A, B, t);
}

function edgePathD(e: Edge) {
  const A = NODES.find((n) => n.id === e.a)!.p;
  const B = NODES.find((n) => n.id === e.b)!.p;
  if (e.ctrl) return `M ${A.x} ${A.y} Q ${e.ctrl.x} ${e.ctrl.y} ${B.x} ${B.y}`;
  return `M ${A.x} ${A.y} L ${B.x} ${B.y}`;
}

function nodePointFromEdges(v: Vehicle, edges: Edge[]): Vec {
  const edge = edges.find(
    (ed) => (ed.a === v.nodeFrom && ed.b === v.nodeTo) || (ed.a === v.nodeTo && ed.b === v.nodeFrom),
  );
  if (!edge) return { x: 0, y: 0 };
  const t = v.nodeFrom === edge.a ? v.t : 1 - v.t;
  return edgePoint(edge, t);
}

function pathCost(path: string[], edges: Edge[], slow: Set<string>): number {
  if (path.length < 2) return 0;
  const findEdge = (a: string, b: string) =>
    edges.find((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a));
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const e = findEdge(path[i], path[i + 1]);
    if (!e) continue;
    total += e.baseCost + e.hazards.reduce((s, h) => s + h.severity * 4, 0);
    if (slow.has(e.id)) total += e.baseCost * (1 / EDGE_SLOWDOWN - 1);
  }
  return total;
}

const lastOf = (route: string[]) => (route.length > 0 ? route[route.length - 1] : "");

function makeVehicle(id: string, color: string, start: string, goal: string, edges: Edge[]): Vehicle {
  const route = nextHop(start, goal, edges);
  return {
    id,
    color,
    nodeFrom: start,
    nodeTo: route[1] ?? start,
    t: 0,
    speed: 1,
    radius: RADAR,
    route,
    action: "Cruise",
  };
}
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

function ToggleChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide transition ${
        active ? "bg-white text-slate-900 shadow-inner" : "bg-white/5 text-white/70 hover:bg-white/10"
      }`}
    >
      {label}
    </button>
  );
}

export default function SensorFusionPage() {
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [edges, setEdges] = useState<Edge[]>(() => EDGES_BASE.map((e) => ({ ...e, hazards: [] })));
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => [
    makeVehicle("V1", "#38bdf8", "A", "H", EDGES_BASE),
    makeVehicle("V2", "#a78bfa", "E", "K", EDGES_BASE),
    makeVehicle("V3", "#34d399", "L", "F", EDGES_BASE),
  ]);
  const [feed, setFeed] = useState<string[]>([]);
  const [visionEnabled, setVisionEnabled] = useState(true);
  const [imuEnabled, setImuEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [noiseLevel, setNoiseLevel] = useState(0.15);
  const [visionDetections, setVisionDetections] = useState<VisionDetection[]>([]);
  const [imuSeries, setImuSeries] = useState<{ t: number; raw: number; filtered: number }[]>([]);
  const [imuFeaturesState, setImuFeaturesState] = useState<ImuFeature>(() => ({ ...DEFAULT_IMU_FEATURES }));
  const [audioFeature, setAudioFeature] = useState<AudioFeature | null>(null);
  const [fusionHud, setFusionHud] = useState<FusionResult>(() => ({ ...DEFAULT_FUSION_HUD }));
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isCarouselVisible, setIsCarouselVisible] = useState(true);

  const loopRef = useRef<number | null>(null);
  const dashOffsetRef = useRef(0);
  const [dashOffset, setDashOffset] = useState(0);
  const tPrev = useRef(0);
  const edgesRef = useRef<Edge[]>(edges);
  const visionRef = useRef<VisionDetection[]>([]);
  const imuWindowRef = useRef<{ t: number; raw: number; filtered: number }[]>([]);
  const imuFilterRef = useRef(alphaBetaInit(0.68, 0.32));
  const imuPulseRef = useRef<ImuPulse[]>([]);
  const hazardEvidenceRef = useRef<Record<string, HazardEvidence>>({});
  const hazardSeenRef = useRef<Record<string, Map<string, number>>>({});
  const activeHazardRef = useRef<string | null>(null);
  const imuOwnerRef = useRef<string | null>(null);
  const audioOwnerRef = useRef<string | null>(null);
  const lastChartUpdateRef = useRef(0);
  const lastVisionEmitRef = useRef(0);
  const carouselLength = EXPLAINER_SLIDES.length;

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  useEffect(() => {
    if (!isCarouselVisible || carouselLength <= 1) return undefined;
    const id = window.setInterval(() => {
      setCarouselIndex((idx) => (idx + 1) % carouselLength);
    }, 8000);
    return () => window.clearInterval(id);
  }, [carouselLength, isCarouselVisible]);

  const log = (
    message: string,
    type: "hazard" | "vision" | "imu" | "audio" | "fusion" | "vehicle" = "hazard",
  ) => {
    const badge = {
      hazard: { emoji: "", label: "HAZARD", classes: "bg-orange-950/50 text-orange-400" },
      vision: { emoji: "", label: "VISION", classes: "bg-sky-950/40 text-sky-300" },
      imu: { emoji: "", label: "IMU", classes: "bg-purple-950/40 text-purple-300" },
      audio: { emoji: "", label: "AUDIO", classes: "bg-cyan-950/40 text-cyan-300" },
      fusion: { emoji: "", label: "FUSION", classes: "bg-emerald-950/50 text-emerald-300" },
      vehicle: { emoji: "", label: "VEHICLE", classes: "bg-emerald-950/50 text-emerald-300" },
    }[type];
    const entry = `${timeTag()} <span class="px-2 py-0.5 rounded text-xs font-medium ${badge.classes}">${badge.emoji} ${badge.label}</span> ${message}`;
    setFeed((prev) => [entry, ...prev.slice(0, FEED_MAX - 1)]);
  };

  const ensureEvidence = (hz: Hazard, edgeId: string) => {
    const map = hazardEvidenceRef.current;
    let entry = map[hz.id];
    if (!entry) {
      entry = { hazard: hz, edgeId, severityEma: hz.severity };
      map[hz.id] = entry;
    } else {
      entry.hazard = hz;
      entry.edgeId = edgeId;
    }
    return entry;
  };

  const spawnHazard = (kind?: HazardKind) => {
    if (!isSimulationRunning) return;
    const available = edgesRef.current.filter((edge) => !edge.closed);
    if (!available.length) {
      log("All roads are currently closed — reset the network before spawning more hazards.");
      return;
    }
    const e = choice(available);
    const hz: Hazard = {
      id: "HZ" + Math.random().toString(36).slice(2, 7),
      kind: kind ?? choice(["pothole", "debris", "work"]),
      pos: Math.random(),
      severity: clamp(kind === "work" ? rand(0.6, 1) : rand(0.35, 0.9), 0, 1),
      ts: typeof performance !== "undefined" ? performance.now() : Date.now(),
    };
    setEdges((prev) =>
      prev.map((edge) =>
        edge.id === e.id
          ? {
              ...edge,
              hazards: [...edge.hazards, hz],
              closed: hz.kind === "work" ? Math.random() < 0.35 : edge.closed,
            }
          : edge,
      ),
    );
    hazardEvidenceRef.current[hz.id] = { hazard: hz, edgeId: e.id, severityEma: hz.severity };
    hazardSeenRef.current[hz.id] = new Map();
    activeHazardRef.current = hz.id;
    log(`Hazard • ${hz.id} (${HAZARD_META[hz.kind].label}) on edge ${e.id}`, "hazard");
  };

  const resetNetwork = () => {
    setEdges(EDGES_BASE.map((e) => ({ ...e, hazards: [], closed: false })));
    setVehicles([
      makeVehicle("V1", "#38bdf8", "A", "H", EDGES_BASE),
      makeVehicle("V2", "#a78bfa", "E", "K", EDGES_BASE),
      makeVehicle("V3", "#34d399", "L", "F", EDGES_BASE),
    ]);
    setFeed([]);
    setVisionDetections([]);
    visionRef.current = [];
    hazardEvidenceRef.current = {};
    hazardSeenRef.current = {};
    activeHazardRef.current = null;
    imuPulseRef.current = [];
    imuWindowRef.current = [];
    setImuSeries([]);
    setImuFeaturesState({ ts: 0, peak: 0, impulse: 0, width50: 0 });
    setAudioFeature(null);
    log("Network reset.", "vehicle");
  };

  const resetFusionHud = React.useCallback(() => {
    setFusionHud({ ...DEFAULT_FUSION_HUD });
  }, []);

  const toggleSimulation = () => {
    setIsSimulationRunning((running) => {
      const next = !running;
      if (!next) resetFusionHud();
      return next;
    });
  };

  const toggleVision = () => {
    setVisionEnabled((enabled) => {
      const next = !enabled;
      if (!next) {
        visionRef.current = [];
        setVisionDetections([]);
        activeHazardRef.current = null;
      }
      return next;
    });
  };

  const toggleImu = () => {
    setImuEnabled((enabled) => {
      const next = !enabled;
      if (!next) {
        setImuSeries([]);
        setImuFeaturesState({ ...DEFAULT_IMU_FEATURES });
        imuPulseRef.current = [];
        imuWindowRef.current = [];
        imuOwnerRef.current = null;
      }
      return next;
    });
  };

  const toggleAudio = () => {
    setAudioEnabled((enabled) => {
      const next = !enabled;
      if (!next) {
        setAudioFeature(null);
        audioOwnerRef.current = null;
      }
      return next;
    });
  };

  const goPrevSlide = () => {
    setCarouselIndex((idx) => (idx - 1 + carouselLength) % carouselLength);
  };

  const goNextSlide = () => {
    setCarouselIndex((idx) => (idx + 1) % carouselLength);
  };

  const hideCarousel = () => setIsCarouselVisible(false);
  const showCarousel = () => setIsCarouselVisible(true);

  const applyFusionMitigation = React.useCallback(
    (entry: HazardEvidence): Decision => {
      let chosen: Decision = "Slow down";
      setVehicles((vehiclesPrev) =>
        vehiclesPrev.map((vehicle) => {
          const edge = edges.find((ed) => ed.id === entry.edgeId);
          if (!edge) return vehicle;
          const pv = nodePointFromEdges(vehicle, edges);
          const hv = edgePoint(edge, entry.hazard.pos);
          const dist = Math.hypot(pv.x - hv.x, pv.y - hv.y);
          if (dist > vehicle.radius) return vehicle;
          const slowEdges = new Set<string>([entry.edgeId]);
          const alt = nextHop(vehicle.nodeFrom, lastOf(vehicle.route), edges.map((ed) => ({ ...ed })), slowEdges);
          const altCost = pathCost(alt, edges, slowEdges);
          const currentPath = nextHop(vehicle.nodeFrom, lastOf(vehicle.route), edges);
          const currentCost = pathCost(currentPath, edges, new Set());
          let action: Decision = "Slow down";
          if (alt.length > 1 && altCost + 1.0 < currentCost) action = "Reroute";
          if (action === "Reroute") {
            chosen = "Reroute";
            return {
              ...vehicle,
              route: alt,
              nodeFrom: alt[0],
              nodeTo: alt[1],
              t: 0,
              action,
              actionTTL: ACTION_TTL,
              speed: 1,
            };
          }
          if (chosen !== "Reroute") chosen = action;
          return { ...vehicle, action, actionTTL: ACTION_TTL, speed: EDGE_SLOWDOWN };
        }),
      );
      return chosen;
    },
    [edges],
  );
  useEffect(() => {
    if (!isSimulationRunning) {
      if (loopRef.current) cancelAnimationFrame(loopRef.current);
      return;
    }
    tPrev.current = typeof performance !== "undefined" ? performance.now() : Date.now();
    const loop = () => {
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      const dt = now - tPrev.current;
      if (dt >= TICK_MS) {
  dashOffsetRef.current = (dashOffsetRef.current + dt * 0.03) % 16;
  setDashOffset(dashOffsetRef.current);
        setVehicles((prev) =>
          prev.map((v) => {
            const { nodeFrom, nodeTo } = v;
            let { t, speed, actionTTL, action } = v;
            const edge = edges.find(
              (ed) => (ed.a === nodeFrom && ed.b === nodeTo) || (ed.a === nodeTo && ed.b === nodeFrom),
            );
            if (!edge) return v;
            if (edge.closed) {
              const newPath = nextHop(nodeFrom, lastOf(v.route), edges);
              return {
                ...v,
                route: newPath,
                nodeFrom: newPath[0],
                nodeTo: newPath[1],
                t: 0,
                action: "Reroute",
                actionTTL: ACTION_TTL,
                speed: 1,
              };
            }
            const edgeCost = edge.baseCost + edge.hazards.reduce((sum, hz) => sum + hz.severity * 4, 0);
            const dtNorm = (dt / 1000) * (1 / edgeCost) * (speed || 1);
            t += dtNorm;
            if (actionTTL) {
              actionTTL -= dt;
              if (actionTTL <= 0) {
                actionTTL = undefined;
                action = "Cruise";
                speed = 1;
              }
            }
            if (t >= 1) {
              const idx = v.route.indexOf(nodeTo);
              const nextNode = v.route[idx + 1];
              if (!nextNode) {
                const nextGoal = choice(NODES.filter((n) => n.id !== nodeTo)).id;
                const newPath = nextHop(nodeTo, nextGoal, edges);
                return {
                  ...v,
                  nodeFrom: newPath[0],
                  nodeTo: newPath[1],
                  route: newPath,
                  t: 0,
                  action,
                  actionTTL,
                  speed,
                };
              }
              return { ...v, nodeFrom: nodeTo, nodeTo: nextNode, t: 0, action, actionTTL, speed };
            }

            const pv = nodePointFromEdges({ ...v, t }, edges);
            const proximitySq = 24 * 24;
            const nowTs = typeof performance !== "undefined" ? performance.now() : Date.now();
            for (const ed of edges) {
              if (!ed.hazards.length) continue;
              for (const hz of ed.hazards) {
                const hp = edgePoint(ed, hz.pos);
                const dx = pv.x - hp.x;
                const dy = pv.y - hp.y;
                if (dx * dx + dy * dy > proximitySq) continue;
                const seenMap = hazardSeenRef.current[hz.id] ?? new Map<string, number>();
                const lastHit = seenMap.get(v.id) ?? 0;
                if (nowTs - lastHit < 1500) continue;
                seenMap.set(v.id, nowTs);
                hazardSeenRef.current[hz.id] = seenMap;
                const entry = ensureEvidence(hz, ed.id);
                activeHazardRef.current = hz.id;

                if (visionEnabled && nowTs - lastVisionEmitRef.current > 100) {
                  const conf = clamp(
                    hz.severity * 0.6 + (1 - noiseLevel) * 0.3 + rand(-0.05, 0.05),
                    0,
                    1,
                  );
                  const detection: VisionDetection = {
                    id: "VIS" + Math.random().toString(36).slice(2, 7),
                    hazardId: hz.id,
                    edgeId: ed.id,
                    conf,
                    ts: nowTs,
                    expires: nowTs + VISION_BUFFER_MS,
                    pos: hp,
                  };
                  lastVisionEmitRef.current = nowTs;
                  const filtered = visionRef.current.filter((d) => d.hazardId !== hz.id);
                  const nextDetections = [...filtered, detection];
                  visionRef.current = nextDetections;
                  setVisionDetections(nextDetections);
                  entry.lastVisionTs = nowTs;
                  entry.visionConf = conf;
                  log(`Vision ${HAZARD_META[hz.kind].label} ${Math.round(conf * 100)}% @${ed.id}`, "vision");
                }

                if (imuEnabled) {
                  const meta = HAZARD_META[hz.kind];
                  const amplitude = clamp(
                    meta.pulseAmp * (0.6 + hz.severity * 0.7) - noiseLevel * 0.3 + rand(-0.05, 0.05),
                    0.05,
                    1.4,
                  );
                  const duration = meta.pulseWidth + hz.severity * 120;
                  imuPulseRef.current.push({
                    id: "P" + Math.random().toString(36).slice(2, 7),
                    hazardId: hz.id,
                    kind: hz.kind,
                    start: nowTs,
                    duration,
                    amplitude,
                  });
                  imuOwnerRef.current = hz.id;
                  log(`IMU spike sensed (${HAZARD_META[hz.kind].label})`, "imu");
                }

                if (audioEnabled) {
                  const meta = HAZARD_META[hz.kind];
                  const energy = clamp(
                    meta.audioEnergy * (0.7 + hz.severity * 0.4) - noiseLevel * 0.3 + rand(-0.05, 0.05),
                    0,
                    1,
                  );
                  const screech = clamp(
                    meta.audioScreech + (hz.kind === "debris" ? 0.12 : 0) - noiseLevel * 0.25 + rand(-0.04, 0.04),
                    0,
                    1,
                  );
                  const audio: AudioFeature = {
                    id: "AUD" + Math.random().toString(36).slice(2, 7),
                    hazardId: hz.id,
                    ts: nowTs,
                    energy,
                    screech,
                  };
                  audioOwnerRef.current = hz.id;
                  setAudioFeature(audio);
                  entry.audio = audio;
                  log(`Audio ping (${energy.toFixed(2)} energy) near ${HAZARD_META[hz.kind].label}`, "audio");
                }
              }
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
  }, [isSimulationRunning, edges, visionEnabled, imuEnabled, audioEnabled, noiseLevel]);
  useEffect(() => {
    if (!isSimulationRunning) return;
    let frame = 0;
    const tick = () => {
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      let raw = 0;
      if (imuEnabled) {
        const pulses: ImuPulse[] = [];
        for (const pulse of imuPulseRef.current) {
          const age = now - pulse.start;
          if (age < 0) {
            pulses.push(pulse);
            continue;
          }
          if (age <= pulse.duration) {
            const progress = age / pulse.duration;
            let shape = 0;
            if (pulse.kind === "pothole") {
              shape = Math.exp(-Math.pow((progress - 0.35) * 9, 2));
            } else if (pulse.kind === "work") {
              shape = Math.sin(Math.PI * progress) ** 2;
            } else {
              shape = Math.exp(-Math.pow((progress - 0.5) * 6, 2)) * 0.7;
            }
            raw += pulse.amplitude * shape;
            pulses.push(pulse);
          }
        }
        imuPulseRef.current = pulses;
        raw += rand(-noiseLevel * 0.25, noiseLevel * 0.25);
      } else {
        imuPulseRef.current = [];
        raw = 0;
      }

      const filtered = alphaBetaStep(imuFilterRef.current, raw, now);
      const window = imuWindowRef.current;
      window.push({ t: now, raw, filtered });
      while (window.length && now - window[0].t > IMU_WINDOW_MS) window.shift();

      if (now - lastChartUpdateRef.current >= FUSION_INTERVAL_MS) {
        const base = window.length ? window[0].t : now;
        const normalized = window.map((sample) => ({
          t: Number(((sample.t - base) / 1000).toFixed(2)),
          raw: Number(sample.raw.toFixed(3)),
          filtered: Number(sample.filtered.toFixed(3)),
        }));
        setImuSeries(normalized);
        const feats = computeImuFeatures(window.map((s) => ({ t: s.t, raw: s.raw })));
  setImuFeaturesState(feats);
        if (imuOwnerRef.current) {
          const entry = hazardEvidenceRef.current[imuOwnerRef.current];
          if (entry) entry.imu = feats;
        }
        lastChartUpdateRef.current = now;
      }

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isSimulationRunning, imuEnabled, noiseLevel]);

  useEffect(() => {
    if (!isSimulationRunning) return;
    const iv = setInterval(() => {
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      const next = visionRef.current.filter((det) => det.expires > now);
      if (next.length !== visionRef.current.length) {
        visionRef.current = next;
        setVisionDetections(next);
      }
    }, 160);
    return () => clearInterval(iv);
  }, [isSimulationRunning]);

  useEffect(() => {
    if (!isSimulationRunning) return;
    const iv = setInterval(() => {
      const activeId = activeHazardRef.current;
      if (!activeId) {
        resetFusionHud();
        return;
      }
      const entry = hazardEvidenceRef.current[activeId];
      if (!entry) {
        setFusionHud({ hazardProb: 0, severity: 0, source: "none" });
        return;
      }
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      const visionAge = entry.lastVisionTs ? now - entry.lastVisionTs : Infinity;
      const imuAge = entry.imu ? now - entry.imu.ts : Infinity;
      const audioAge = entry.audio ? now - entry.audio.ts : Infinity;

      const visionScore = visionEnabled && visionAge < VISION_BUFFER_MS
        ? clamp((entry.visionConf ?? 0) * (1 - visionAge / VISION_BUFFER_MS) * (1 - noiseLevel * 0.35), 0, 1)
        : 0;
      const imuScore = imuEnabled && entry.imu && imuAge < 1500
        ? clamp(entry.imu.peak * 0.55 + entry.imu.impulse * 0.3 + entry.imu.width50 * 0.35 - noiseLevel * 0.25, 0, 1)
        : 0;
      const audioScore = audioEnabled && entry.audio && audioAge < 1500
        ? clamp(entry.audio.energy * 0.6 + entry.audio.screech * 0.45 - noiseLevel * 0.2, 0, 1)
        : 0;

      const contributions: Array<{ key: "vision" | "imu" | "audio"; weight: number; value: number }> = [];
      if (visionScore > 0) contributions.push({ key: "vision", weight: 0.5, value: visionScore });
      if (imuScore > 0) contributions.push({ key: "imu", weight: 0.7, value: imuScore });
      if (audioScore > 0) contributions.push({ key: "audio", weight: 0.3, value: audioScore });

      let hazardProb = 0;
      let weightTotal = 0;
      contributions.forEach((c) => {
        hazardProb += c.value * c.weight;
        weightTotal += c.weight;
      });
      if (weightTotal > 0) hazardProb = clamp(hazardProb / weightTotal + entry.hazard.severity * 0.18, 0, 1);

      const severityInstant = clamp(
        entry.hazard.severity * 0.35 + imuScore * 0.45 + visionScore * 0.25 + audioScore * 0.2,
        0,
        1,
      );
      entry.severityEma = entry.severityEma * 0.72 + severityInstant * 0.28;

      const source = contributions.length
        ? (contributions.map((c) => c.key).sort().join("+") as FusionSource)
        : "none";

      setFusionHud({
        hazardProb,
        severity: entry.severityEma,
        source,
        hazardId: entry.hazard.id,
        edgeId: entry.edgeId,
      });

      if (hazardProb > FUSION_PROB_THRESHOLD && entry.severityEma > FUSION_SEV_THRESHOLD) {
        if (!entry.lastFusionAction || now - entry.lastFusionAction > 1500) {
          entry.lastFusionAction = now;
          const action = applyFusionMitigation(entry);
          const sensorsUsed = source === "none" ? "baseline" : source;
          log(
            `FUSION (${sensorsUsed}) ${HAZARD_META[entry.hazard.kind].label} @${entry.edgeId} p=${hazardProb.toFixed(2)} sev=${entry.severityEma.toFixed(2)} → ${action}`,
            "fusion",
          );
        }
      }
    }, FUSION_INTERVAL_MS);
    return () => {
      clearInterval(iv);
      resetFusionHud();
    };
  }, [isSimulationRunning, visionEnabled, imuEnabled, audioEnabled, noiseLevel, applyFusionMitigation, resetFusionHud]);

  const latestVision = useMemo(() => {
    if (visionDetections.length === 0) return null;
    return visionDetections[visionDetections.length - 1];
  }, [visionDetections]);
  return (
    <PageShell
      title="Multimodal Sensor Fusion"
      subtitle="Simulated perception stack fusing vision hits, IMU pulses, and optional audio for hazard confirmation."
      bannerSrc="/images/banner.png"
    >
      <motion.div
        className="mb-4 flex flex-wrap items-center gap-2"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.button
          onClick={toggleSimulation}
          className={`rounded-xl px-4 py-2 text-white shadow transition ${
            isSimulationRunning ? "bg-rose-500 hover:bg-rose-600" : "bg-blue-500 hover:bg-blue-600"
          }`}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          {isSimulationRunning ? "Stop Simulation" : "Start Simulation"}
        </motion.button>
        <motion.button
          onClick={() => spawnHazard()}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-white shadow hover:bg-emerald-600 disabled:opacity-50"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          disabled={!isSimulationRunning}
        >
          Spawn random hazard
        </motion.button>
        <motion.button
          onClick={() => spawnHazard("work")}
          className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-white/80 backdrop-blur hover:bg-white/20 disabled:opacity-50"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          disabled={!isSimulationRunning}
        >
          Spawn work-zone
        </motion.button>
        <motion.button
          onClick={resetNetwork}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/80 hover:bg-white/10 disabled:opacity-50"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          disabled={!isSimulationRunning}
        >
          Reset network
        </motion.button>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[minmax(560px,1fr)_340px]">
        <div className="space-y-6">
          <div className="card-glass relative overflow-hidden p-3">
            {isCarouselVisible ? (
              <div className="pointer-events-auto absolute inset-x-3 top-3 z-20 max-w-sm">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={EXPLAINER_SLIDES[carouselIndex].title}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-2xl border border-white/10 bg-slate-950/85 p-4 shadow-xl backdrop-blur"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs uppercase tracking-[0.2em] text-white/50">Sensor Fusion Explainer</div>
                        <div className="mt-1 text-lg font-semibold text-white">
                          {EXPLAINER_SLIDES[carouselIndex].title}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={goPrevSlide}
                          className="h-7 w-7 rounded-full border border-white/15 bg-white/5 text-xs text-white/80 transition hover:bg-white/15"
                          aria-label="Previous explainer card"
                        >
                          {"<"}
                        </button>
                        <button
                          type="button"
                          onClick={goNextSlide}
                          className="h-7 w-7 rounded-full border border-white/15 bg-white/5 text-xs text-white/80 transition hover:bg-white/15"
                          aria-label="Next explainer card"
                        >
                          {">"}
                        </button>
                        <button
                          type="button"
                          onClick={hideCarousel}
                          className="ml-1 h-7 w-7 rounded-full border border-white/15 bg-white/5 text-xs font-semibold text-white/70 transition hover:bg-rose-500/60 hover:text-white"
                          aria-label="Hide explainer cards"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-white/80">{EXPLAINER_SLIDES[carouselIndex].body}</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-emerald-300/90">
                      {EXPLAINER_SLIDES[carouselIndex].caption}
                    </p>
                    <div className="mt-3 flex gap-1">
                      {EXPLAINER_SLIDES.map((slide, idx) => (
                        <span
                          key={slide.title}
                          className={`h-1.5 flex-1 rounded-full ${idx === carouselIndex ? "bg-emerald-400" : "bg-white/15"}`}
                        />
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            ) : (
              <button
                type="button"
                onClick={showCarousel}
                className="pointer-events-auto absolute left-3 top-3 z-20 rounded-full border border-white/15 bg-slate-950/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:bg-white/15"
              >
                Show explainer
              </button>
            )}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)",
                backgroundSize: "64px 64px",
                maskImage: "radial-gradient(120% 120% at 50% 10%, rgba(255,255,255,1), transparent 70%)",
              }}
            />
            <svg viewBox={`0 0 ${WORLD.w} ${WORLD.h}`} className="relative z-10 w-full rounded-xl">
              {edges.map((e) => (
                <g key={e.id} opacity={e.closed ? 0.4 : 0.9}>
                  <path d={edgePathD(e)} stroke="#1d2738" strokeWidth={14} fill="none" strokeLinecap="round" />
                  <path
                    d={edgePathD(e)}
                    stroke="#60a5fa"
                    strokeWidth={2}
                    fill="none"
                    strokeDasharray="10 12"
                    strokeDashoffset={dashOffset}
                    opacity={0.65}
                  />
                  {e.hazards.map((hz) => {
                    const p = edgePoint(e, hz.pos);
                    const active = fusionHud.hazardId === hz.id && fusionHud.hazardProb > 0.1;
                    return (
                      <g key={hz.id} transform={`translate(${p.x},${p.y})`}>
                        <circle r={16} fill={`${HAZARD_META[hz.kind].color}12`} />
                        <HazardGlyph kind={hz.kind} />
                        {active && (
                          <circle
                            r={24}
                            fill="none"
                            stroke="#fbbf24"
                            strokeWidth={1.4}
                            strokeDasharray="6 4"
                            opacity={0.8}
                          />
                        )}
                      </g>
                    );
                  })}
                </g>
              ))}

              {visionDetections.map((det) => (
                <motion.circle
                  key={det.id}
                  cx={det.pos.x}
                  cy={det.pos.y}
                  r={18}
                  stroke="#38bdf8"
                  strokeWidth={1.5}
                  fill="none"
                  initial={{ opacity: 0.8, r: 10 }}
                  animate={{ opacity: 0, r: 44 }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                />
              ))}

              {vehicles.map((v) => {
                const pos = nodePointFromEdges(v, edges);
                const edge = edges.find(
                  (ed) => (ed.a === v.nodeFrom && ed.b === v.nodeTo) || (ed.a === v.nodeTo && ed.b === v.nodeFrom),
                );
                if (!edge) return null;
                const a = v.nodeFrom === edge.a ? Math.max(v.t - 0.02, 0) : Math.min(1 - v.t + 0.02, 1);
                const b = v.nodeFrom === edge.a ? Math.min(v.t + 0.02, 1) : Math.max(1 - v.t - 0.02, 0);
                const pa = edgePoint(edge, a);
                const pb = edgePoint(edge, b);
                const angle = (Math.atan2(pb.y - pa.y, pb.x - pa.x) * 180) / Math.PI;
                return (
                  <g key={v.id}>
                    <circle cx={pos.x} cy={pos.y} r={v.radius} fill={`${v.color}20`} stroke={`${v.color}44`} />
                    <foreignObject x={pos.x - 9} y={pos.y - 5} width={24} height={16} style={{ overflow: "visible" }}>
                      <Car color={v.color} rotate={angle} />
                    </foreignObject>
                    <text x={pos.x + 14} y={pos.y - 10} fontSize={12} fill="#fff" opacity={0.95}>
                      {v.id}
                    </text>
                    {v.action !== "Cruise" && v.actionTTL && v.actionTTL > 0 && (
                      <g>
                        <rect
                          x={pos.x - 48}
                          y={pos.y - 42}
                          width={96}
                          height={22}
                          rx={6}
                          ry={6}
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

          <div className="card-glass grid gap-3 p-4 sm:grid-cols-3">
            <div className="rounded-xl bg-white/5 p-3">
              <div className="text-xs uppercase tracking-wide text-white/60">Vision</div>
              <div className="mt-1 text-lg font-semibold text-white">
                {latestVision ? `${Math.round(latestVision.conf * 100)}%` : "--"}
              </div>
              <div className="text-xs text-white/50">
                {visionEnabled ? "Buffered 2s stream" : "Sensor disabled"}
              </div>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <div className="text-xs uppercase tracking-wide text-white/60">IMU peak</div>
              <div className="mt-1 text-lg font-semibold text-white">
                {imuEnabled ? imuFeaturesState.peak.toFixed(2) : "0"}
              </div>
              <div className="text-xs text-white/50">Impulse {imuFeaturesState.impulse.toFixed(2)}</div>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <div className="text-xs uppercase tracking-wide text-white/60">Audio</div>
              <div className="mt-1 text-lg font-semibold text-white">
                {audioEnabled && audioFeature ? audioFeature.energy.toFixed(2) : "0"}
              </div>
              <div className="text-xs text-white/50">
                {audioEnabled ? `Screech ${audioFeature ? audioFeature.screech.toFixed(2) : "0"}` : "Sensor disabled"}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card-glass p-4">
            <div className="mb-2 flex items-center justify-between text-sm text-white/70">
              <span>Fusion HUD</span>
              <span className="text-xs text-white/50">
                {fusionHud.edgeId ? `Edge ${fusionHud.edgeId}` : "Idle"}
              </span>
            </div>
            <div className="flex items-end gap-6">
              <div>
                <div className="text-xs uppercase text-white/50">Probability</div>
                <div className="text-3xl font-semibold text-white">
                  {fusionHud.hazardProb.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase text-white/50">Severity</div>
                <div className="text-3xl font-semibold text-white">
                  {fusionHud.severity.toFixed(2)}
                </div>
              </div>
              <div className="ml-auto rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                {fusionHud.source === "none" ? "waiting" : fusionHud.source}
              </div>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-emerald-400"
                style={{ width: `${Math.round(fusionHud.hazardProb * 100)}%` }}
              />
            </div>
          </div>

          <div className="card-glass space-y-3 p-4">
            <div className="flex items-center justify-between text-sm text-white/70">
              <span>Sensors</span>
              <span className="text-xs text-white/50">Noise {noiseLevel.toFixed(2)}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <ToggleChip label="Vision" active={visionEnabled} onClick={toggleVision} />
              <ToggleChip label="IMU" active={imuEnabled} onClick={toggleImu} />
              <ToggleChip label="Audio" active={audioEnabled} onClick={toggleAudio} />
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={noiseLevel}
              onChange={(e) => setNoiseLevel(Number(e.target.value))}
              className="block w-full accent-emerald-400"
            />
            <div className="text-xs text-white/50">
              Higher noise adds IMU jitter and reduces vision confidence to stress the fusion logic.
            </div>
          </div>

          <div className="card-glass p-4">
            <div className="mb-2 text-sm text-white/70">Vertical acceleration (raw vs α-β filtered)</div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={imuSeries} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="imuRaw" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#f97316" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="imuFiltered" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="t" stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}s`} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} domain={[-1.2, 1.6]} />
                  <RTooltip cursor={{ stroke: "#94a3b8", strokeDasharray: "3 3" }} />
                  <Area type="monotone" dataKey="raw" stroke="#f97316" fill="url(#imuRaw)" isAnimationActive={false} />
                  <Area
                    type="monotone"
                    dataKey="filtered"
                    stroke="#38bdf8"
                    fill="url(#imuFiltered)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card-glass max-h-[420px] overflow-auto p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-white/70">Console</span>
              <button
                onClick={() => setFeed([])}
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70 hover:bg-white/10"
              >
                Clear
              </button>
            </div>
            <ul className="space-y-1 text-sm text-white/85">
              {feed.length === 0 && <li className="text-white/50">No events yet. Start the sim and spawn a hazard.</li>}
              {feed.map((entry, idx) => (
                <li key={idx} className="font-mono text-xs" dangerouslySetInnerHTML={{ __html: entry }} />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
