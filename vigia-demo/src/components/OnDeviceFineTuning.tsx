"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Cpu,
  GitBranch,
  Mic,
  Pause,
  Play,
  RadioTower,
  RefreshCcw,
  ShieldCheck,
  StepForward,
  Upload,
  Waves,
} from "lucide-react";

type StageKey = "v2x" | "multimodal" | "aegis" | "finetune" | "upload";

type Stage = {
  key: StageKey;
  title: string;
  subtitle: string;
  bullets: string[];
  icon: React.ReactNode;
  accent: "emerald" | "sky" | "violet" | "amber" | "blue";
  logLine: string;
};

type BaseVehicle = {
  id: string;
  label: string;
  x: number;
  y: number;
};

type VehicleView = BaseVehicle & {
  prediction: "hazard" | "clear";
  confidence: number;
  imu: boolean;
  audio: boolean;
  consensus: "confirm" | "reject" | "pending";
  state: string;
  stroke: string;
  pulse: boolean;
};

type LogEntry = {
  id: string;
  ts: number;
  stage: StageKey;
  message: string;
};

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const stageFlow: Stage[] = [
  {
    key: "v2x",
    title: "1. V2X Conflict Detected",
    subtitle: "Mesh gossip flags contradictory hazard votes on Ring Road segment 18A.",
    bullets: [
      "Three vehicles broadcast pothole logits, two report a clear lane.",
      "Consensus score drops under 0.6 → conflict resolution mode engaged.",
    ],
    icon: <RadioTower className="h-5 w-5" />,
    accent: "emerald",
    logLine:
      "V2X mesh signalled conflicting pothole reports on ring-road sector 18A. Fleet entering dispute workflow.",
  },
  {
    key: "multimodal",
    title: "2. Multimodal Sanity Check",
    subtitle: "IMU jolts + audio impacts validate whether the hazard signature is real.",
    bullets: [
      "Primary bus reports 2.8g vertical jerk synced with the disputed frame.",
      "Acoustic classifier hears pothole impact harmonics → hazard likely real.",
    ],
    icon: <Activity className="h-5 w-5" />,
    accent: "sky",
    logLine:
      "IMU and cabin audio corroborated the pothole signature. Vehicles lacking multimodal spikes are temporarily down-weighted.",
  },
  {
    key: "aegis",
    title: "3. Aegis Privacy Scrub",
    subtitle: "Frames are pulled (local or server fallback) and redacted before processing.",
    bullets: [
      "Faces/plates masked directly on the edge box before tensors are exported.",
      "Only latent tensors + timestamps are staged for adapter fine-tuning.",
    ],
    icon: <ShieldCheck className="h-5 w-5" />,
    accent: "violet",
    logLine:
      "Aegis scrubbed the disputed frames. Compressed tensors queued for adapter fine-tuning with zero raw PII in flight.",
  },
  {
    key: "finetune",
    title: "4. On-Device Fine-Tuning",
    subtitle: "LoRA head performs a 12-step optimisation on the conflict batch.",
    bullets: [
      "Bus #14 hosts the adapter and fine-tunes for 90 seconds while parked.",
      "Support vehicles provide validated tensors to stabilise the gradient steps.",
    ],
    icon: <Cpu className="h-5 w-5" />,
    accent: "amber",
    logLine:
      "Fine-tuning adapter converged locally (12 steps, Δloss = -0.18). Validated tensors cached for audit.",
  },
  {
    key: "upload",
    title: "5. Federated Weight Upload",
    subtitle: "Only encrypted weight deltas move upstream; global FedAvg merges them.",
    bullets: [
      "Fused delta ≈ 2.6 MB → uplink to edge broker over QUIC.",
      "Fleet receives refreshed checkpoint once quorum is met.",
    ],
    icon: <Upload className="h-5 w-5" />,
    accent: "blue",
    logLine:
      "Weight delta (2.6 MB) uploaded; federated round awaiting 3 additional participants for FedAvg merge.",
  },
];

const accentStyles = {
  emerald: {
    text: "text-emerald-300",
    chip: "bg-emerald-500/15 text-emerald-300",
    dot: "bg-emerald-400",
    border: "border-emerald-400/30",
  },
  sky: {
    text: "text-sky-300",
    chip: "bg-sky-500/15 text-sky-300",
    dot: "bg-sky-400",
    border: "border-sky-400/30",
  },
  violet: {
    text: "text-violet-300",
    chip: "bg-violet-500/15 text-violet-300",
    dot: "bg-violet-400",
    border: "border-violet-400/30",
  },
  amber: {
    text: "text-amber-300",
    chip: "bg-amber-500/15 text-amber-300",
    dot: "bg-amber-400",
    border: "border-amber-400/30",
  },
  blue: {
    text: "text-blue-300",
    chip: "bg-blue-500/15 text-blue-300",
    dot: "bg-blue-400",
    border: "border-blue-400/30",
  },
};

const baseFleet: BaseVehicle[] = [
  { id: "Bus #14", label: "Bus #14", x: 28, y: 42 },
  { id: "Freightliner 21", label: "Freightliner 21", x: 46, y: 47 },
  { id: "Shuttle 03", label: "Shuttle 03", x: 66, y: 44 },
  { id: "RoboTaxi 07", label: "RoboTaxi 07", x: 54, y: 60 },
  { id: "Municipal AV", label: "Municipal AV", x: 34, y: 60 },
];

type RoadNode = { x: number; y: number };
type RoadSegment = { from: RoadNode; to: RoadNode; ctrl?: RoadNode };

const roadNetwork: RoadSegment[] = [
  { from: { x: 15, y: 42 }, to: { x: 40, y: 42 } },
  { from: { x: 40, y: 42 }, to: { x: 75, y: 42 }, ctrl: { x: 57.5, y: 30 } },
  { from: { x: 75, y: 42 }, to: { x: 90, y: 55 } },
  { from: { x: 40, y: 42 }, to: { x: 40, y: 65 } },
  { from: { x: 40, y: 65 }, to: { x: 60, y: 65 } },
  { from: { x: 60, y: 65 }, to: { x: 75, y: 42 } },
];

const hazardVehicleIds = new Set(["Bus #14", "Freightliner 21", "Shuttle 03"]);

const stageAccentMap: Record<StageKey, Stage["accent"]> = stageFlow.reduce(
  (acc, stage) => ({ ...acc, [stage.key]: stage.accent }),
  {} as Record<StageKey, Stage["accent"]>
);

const gradientCard =
  "rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-4";

const hazardPoint = { x: 74, y: 42 };

const legendItems = [
  { label: "Broadcasting hazard", color: "#f97316" },
  { label: "Multimodal validated", color: "#34d399" },
  { label: "Adapter fine-tuning", color: "#c4b5fd" },
  { label: "Uploading delta", color: "#38bdf8" },
];

const aggregatorAnchor = { x: 88, y: 18 };

const drawFleetScene = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  vehicles: VehicleView[],
  stage: Stage,
  now: number,
) => {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(2,6,23,0.94)";
  ctx.fillRect(0, 0, width, height);

  const roadLeft = width * 0.08;
  const roadTop = height * 0.28;
  const roadWidth = width * 0.84;
  const roadHeight = height * 0.42;

  const roadGradient = ctx.createLinearGradient(0, roadTop, 0, roadTop + roadHeight);
  roadGradient.addColorStop(0, "rgba(15,23,42,0.96)");
  roadGradient.addColorStop(1, "rgba(30,41,59,0.78)");
  ctx.fillStyle = roadGradient;
  ctx.fillRect(roadLeft, roadTop, roadWidth, roadHeight);

  ctx.strokeStyle = "rgba(148,163,184,0.28)";
  ctx.lineWidth = 1.4;
  ctx.strokeRect(roadLeft, roadTop, roadWidth, roadHeight);

  const mapX = (value: number) => roadLeft + (value / 100) * roadWidth;
  const mapY = (value: number) => roadTop + (value / 100) * roadHeight;

  // Draw road network
  ctx.strokeStyle = "rgba(203,213,225,0.18)";
  ctx.lineWidth = 2.8;
  ctx.setLineDash([]);
  
  roadNetwork.forEach(segment => {
    const startX = mapX(segment.from.x);
    const startY = mapY(segment.from.y);
    const endX = mapX(segment.to.x);
    const endY = mapY(segment.to.y);
    
    ctx.beginPath();
    if (segment.ctrl) {
      const ctrlX = mapX(segment.ctrl.x);
      const ctrlY = mapY(segment.ctrl.y);
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
    } else {
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
    }
    ctx.stroke();
  });

  // Draw lane markers
  ctx.setLineDash([16, 18]);
  ctx.strokeStyle = "rgba(203,213,225,0.16)";
  ctx.lineWidth = 2.2;
  roadNetwork.forEach(segment => {
    const startX = mapX(segment.from.x);
    const startY = mapY(segment.from.y);
    const endX = mapX(segment.to.x);
    const endY = mapY(segment.to.y);
    
    ctx.beginPath();
    if (segment.ctrl) {
      const ctrlX = mapX(segment.ctrl.x);
      const ctrlY = mapY(segment.ctrl.y);
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
    } else {
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
    }
    ctx.stroke();
  });
  ctx.setLineDash([]);

  const hazardX = mapX(hazardPoint.x);
  const hazardY = mapY(hazardPoint.y);
  const pulse = 32 + 10 * Math.sin(now / 540);

  ctx.beginPath();
  ctx.arc(hazardX, hazardY, pulse, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(239,68,68,0.32)";
  ctx.lineWidth = 2.4;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(hazardX, hazardY, 14, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(248,113,113,0.9)";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(hazardX, hazardY - 20);
  ctx.lineTo(hazardX - 8, hazardY + 10);
  ctx.lineTo(hazardX + 8, hazardY + 10);
  ctx.closePath();
  ctx.fillStyle = "rgba(248,113,113,0.78)";
  ctx.fill();

  const hazardVehicles = vehicles.filter((v) => v.prediction === "hazard");
  if (["v2x", "multimodal", "aegis"].includes(stage.key)) {
    ctx.strokeStyle = "rgba(251,191,36,0.35)";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([8, 12]);
    hazardVehicles.forEach((vehicle) => {
      const vx = mapX(vehicle.x);
      const vy = mapY(vehicle.y);
      ctx.beginPath();
      ctx.moveTo(hazardX, hazardY);
      ctx.lineTo(vx, vy);
      ctx.stroke();
    });
    ctx.setLineDash([]);
  }

  const aggregatorX = mapX(aggregatorAnchor.x);
  const aggregatorY = mapY(aggregatorAnchor.y);
  ctx.fillStyle = "rgba(59,130,246,0.12)";
  ctx.strokeStyle = "rgba(59,130,246,0.45)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(aggregatorX, aggregatorY, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(191,219,254,0.9)";
  ctx.font = "600 11px 'Inter', 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Edge", aggregatorX, aggregatorY - 2);
  ctx.fillText("Broker", aggregatorX, aggregatorY + 12);

  // Draw V2X communication ranges
  if (stage.key === "v2x") {
    vehicles.forEach((vehicle, idx) => {
      const vx = mapX(vehicle.x);
      const vy = mapY(vehicle.y);
      const rangeRadius = width * 0.15; // V2X range
      const rangePulse = rangeRadius + 8 * Math.sin(now / 600 + idx * 0.5);
      
      // Draw communication range circles
      ctx.beginPath();
      ctx.arc(vx, vy, rangePulse, 0, Math.PI * 2);
      ctx.strokeStyle = vehicle.prediction === "hazard" 
        ? "rgba(251,191,36,0.2)" 
        : "rgba(59,130,246,0.15)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 10]);
      ctx.stroke();
      ctx.setLineDash([]);
    });
  }

  vehicles.forEach((vehicle, idx) => {
    const vx = mapX(vehicle.x);
    const vy = mapY(vehicle.y);
    const bodyColor = vehicle.stroke;
    const bob = Math.sin(now / 680 + idx) * 2;

    if (vehicle.pulse) {
      const adapterPulse = 26 + 6 * Math.sin(now / 380 + idx);
      ctx.beginPath();
      ctx.arc(vx, vy, adapterPulse, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(196,181,253,0.4)";
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(vx, vy + bob);
    
    // Add conflict indicator glow during V2X stage
    const hasConflict = stage.key === "v2x" && 
      vehicles.some(v => v.prediction === "hazard") && 
      vehicles.some(v => v.prediction === "clear");
    
    if (hasConflict) {
      const conflictPulse = 28 + 6 * Math.sin(now / 300 + idx);
      ctx.beginPath();
      ctx.arc(0, 0, conflictPulse, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(251,191,36,0.4)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    ctx.fillStyle = "rgba(15,23,42,0.9)";
    ctx.shadowColor = bodyColor;
    ctx.shadowBlur = 18;
    ctx.fillRect(-26, -12, 52, 24);
    ctx.shadowBlur = 0;
    ctx.fillStyle = bodyColor;
    ctx.fillRect(-24, -10, 48, 20);
    ctx.fillStyle = "rgba(15,23,42,0.92)";
    ctx.fillRect(-18, -6, 36, 12);
    ctx.fillStyle = bodyColor;
    ctx.fillRect(-20, -3, 40, 2);
    ctx.restore();

    if (vehicle.imu) {
      ctx.strokeStyle = "rgba(52,211,153,0.7)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(vx - 22, vy + 18);
      for (let i = 0; i <= 5; i++) {
        const x = vx - 22 + (i * 44) / 5;
        const y = vy + 18 + Math.sin(now / 140 + i) * 3;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    if (vehicle.audio) {
      ctx.strokeStyle = "rgba(56,189,248,0.7)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(vx + 32, vy, 6 + Math.sin(now / 250 + idx) * 2, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(226,232,240,0.92)";
    ctx.font = "600 12px 'Inter', 'Segoe UI', sans-serif";
    ctx.fillText(vehicle.label, vx, vy - 24);
    ctx.fillStyle = "rgba(148,163,184,0.85)";
    ctx.font = "500 10px 'Inter', 'Segoe UI', sans-serif";
    const truncated = vehicle.state.length > 26 ? `${vehicle.state.slice(0, 25)}…` : vehicle.state;
    ctx.fillText(truncated, vx, vy + 26);
  });

  if (stage.key === "upload" || stage.key === "finetune") {
    const bus = vehicles.find((v) => v.id === "Bus #14");
    if (bus) {
      const vx = mapX(bus.x);
      const vy = mapY(bus.y);
      ctx.strokeStyle = stage.key === "upload" ? "rgba(96,165,250,0.55)" : "rgba(196,181,253,0.55)";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(vx, vy - 18);
      ctx.lineTo(aggregatorX, aggregatorY + 28);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  ctx.fillStyle = "rgba(148,163,184,0.7)";
  ctx.font = "500 11px 'Inter', 'Segoe UI', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Live fleet map", roadLeft, roadTop - 22);
  ctx.fillStyle = "rgba(226,232,240,0.92)";
  ctx.font = "600 12px 'Inter', 'Segoe UI', sans-serif";
  ctx.fillText(stage.title, roadLeft, roadTop - 8);
};

const formatClock = (ts: number) =>
  new Date(ts).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const OnDeviceFineTuning: React.FC = () => {
  const [stageIndex, setStageIndex] = useState(0);
  const [round, setRound] = useState(1);
  const [playing, setPlaying] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>(() => [
    {
      id: createId(),
      ts: Date.now(),
      stage: "v2x",
      message: "Simulation primed. Awaiting conflicting V2X transmissions.",
    },
  ]);

  const lastStageRef = useRef<StageKey | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const vehiclesRef = useRef<VehicleView[]>([]);
  const stageRef = useRef<Stage>(stageFlow[0]);
  const dprRef = useRef(1);

  const appendLog = useCallback((stage: StageKey, message: string) => {
    setLogs((prev) => [
      {
        id: createId(),
        ts: Date.now(),
        stage,
        message,
      },
      ...prev,
    ].slice(0, 160));
  }, []);

  const vehicles = useMemo<VehicleView[]>(() => {
    const key = stageFlow[stageIndex].key;
    return baseFleet.map((vehicle) => {
      const isHazard = hazardVehicleIds.has(vehicle.id);
      let prediction: "hazard" | "clear" = isHazard ? "hazard" : "clear";
      let confidence = isHazard ? 0.78 : 0.66;
      let imu = false;
      let audio = false;
      let consensus: VehicleView["consensus"] = isHazard ? "confirm" : "reject";
      let state = isHazard ? "Broadcasting hazard" : "Disputing alert";
      let stroke = isHazard ? "rgba(251,191,36,0.9)" : "rgba(148,163,184,0.6)";
      let pulse = key === "v2x" && isHazard;

      switch (key) {
        case "multimodal":
          imu = isHazard;
          audio = isHazard || vehicle.id === "Freightliner 21";
          confidence = isHazard ? 0.89 : 0.52;
          consensus = isHazard ? "confirm" : "reject";
          state = isHazard ? "IMU + audio spikes corroborated" : "Awaiting corroboration";
          stroke = isHazard ? "rgba(52,211,153,0.85)" : "rgba(248,113,113,0.65)";
          pulse = false;
          break;
        case "aegis":
          imu = isHazard;
          audio = isHazard;
          confidence = isHazard ? 0.9 : 0.5;
          consensus = isHazard ? "confirm" : "pending";
          state = isHazard ? "Aegis redaction in progress" : "Monitoring sanitized tensors";
          stroke = isHazard ? "rgba(125,211,252,0.85)" : "rgba(148,163,184,0.6)";
          pulse = false;
          break;
        case "finetune":
          imu = isHazard;
          audio = isHazard;
          confidence = isHazard ? 0.94 : 0.54;
          consensus = isHazard ? "confirm" : "pending";
          state = isHazard
            ? vehicle.id === "Bus #14"
              ? "Fine-tuning adapter (LoRA)"
              : "Providing support tensors"
            : "Standing by for updated weights";
          stroke = isHazard
            ? vehicle.id === "Bus #14"
              ? "rgba(196,181,253,0.9)"
              : "rgba(52,211,153,0.85)"
            : "rgba(148,163,184,0.6)";
          pulse = vehicle.id === "Bus #14";
          break;
        case "upload":
          imu = isHazard;
          audio = isHazard;
          confidence = isHazard ? 0.96 : 0.58;
          consensus = "confirm";
          state = isHazard
            ? "Uploading encrypted weight delta"
            : "Downloading global checkpoint";
          stroke = isHazard ? "rgba(96,165,250,0.9)" : "rgba(148,163,184,0.6)";
          pulse = isHazard;
          break;
        default:
          break;
      }

      return {
        ...vehicle,
        prediction,
        confidence,
        imu,
        audio,
        consensus,
        state,
        stroke,
        pulse,
      };
    });
  }, [stageIndex]);

  useEffect(() => {
    vehiclesRef.current = vehicles;
    stageRef.current = stageFlow[stageIndex];
  }, [vehicles, stageIndex]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const canvas = canvasRef.current;
    const container = canvasContainerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      dprRef.current = dpr;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    let frame: number;
    const render = () => {
      const dpr = dprRef.current || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawFleetScene(ctx, width, height, vehiclesRef.current, stageRef.current, performance.now());
      ctx.restore();
      frame = window.requestAnimationFrame(render);
    };
    frame = window.requestAnimationFrame(render);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      setStageIndex((prev) => {
        const next = (prev + 1) % stageFlow.length;
        if (next === 0) setRound((r) => r + 1);
        return next;
      });
    }, 5200);
    return () => window.clearTimeout(timer);
  }, [playing, stageIndex]);

  useEffect(() => {
    const key = stageFlow[stageIndex].key;
    if (lastStageRef.current !== key) {
      appendLog(key, stageFlow[stageIndex].logLine);
      lastStageRef.current = key;
    }
  }, [appendLog, stageIndex]);

  const consensusConfidence = useMemo(() => {
    const hazardVotes = vehicles.filter((vehicle) => vehicle.prediction === "hazard");
    if (!hazardVotes.length) return 0;
    return (
      hazardVotes.reduce((sum, vehicle) => sum + vehicle.confidence, 0) / hazardVotes.length
    );
  }, [vehicles]);

  const dissentConfidence = useMemo(() => {
    const dissenters = vehicles.filter((vehicle) => vehicle.prediction === "clear");
    if (!dissenters.length) return 0;
    return dissenters.reduce((sum, vehicle) => sum + vehicle.confidence, 0) / dissenters.length;
  }, [vehicles]);

  const stageAccent = accentStyles[stageAccentMap[stageFlow[stageIndex].key]];
  const aggregatorProgress = [0.16, 0.38, 0.58, 0.82, 1][stageIndex];
  const latencyMs = [260, 380, 540, 640, 410][stageIndex];
  const trainingSteps = stageFlow[stageIndex].key === "finetune" || stageFlow[stageIndex].key === "upload" ? 12 : 0;
  const uploadSizeMB = stageFlow[stageIndex].key === "upload" ? 2.6 : stageFlow[stageIndex].key === "finetune" ? 2.6 : 0.4;

  const hazardShare = vehicles.filter((v) => v.prediction === "hazard").length / vehicles.length;

  const handleReset = useCallback(() => {
    setPlaying(false);
    setRound(1);
    lastStageRef.current = null;
    setStageIndex(0);
    setLogs([
      {
        id: createId(),
        ts: Date.now(),
        stage: "v2x",
        message: "Simulation reset. Awaiting conflicting V2X transmissions.",
      },
    ]);
  }, []);

  const handleStep = useCallback(() => {
    setStageIndex((prev) => {
      const next = (prev + 1) % stageFlow.length;
      if (next === 0) setRound((r) => r + 1);
      return next;
    });
  }, []);

  return (
    <div className="space-y-6 text-white">
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 28 }}
        className="rounded-3xl border border-white/10 bg-slate-950/95 p-6 shadow-2xl"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-2xl font-semibold">On-Device Fine Tuning · Federated Hazard Simulation</h2>
            <p className="text-sm text-slate-300">
              Contradictory hazard detections trigger a live pipeline: V2X conflict detection, multimodal validation, Aegis redaction, on-device fine-tuning, and encrypted weight upload. The judges can step through each phase to see how the fleet self-improves without leaving the privacy envelope.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 text-xs text-slate-400">
            <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-slate-200">
              <GitBranch className="h-4 w-4" /> Federated round {round}
            </div>
            <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs ${stageAccent.chip}`}>
              {stageFlow[stageIndex].icon}
              {stageFlow[stageIndex].title}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <button
            onClick={() => setPlaying((prev) => !prev)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/80 transition hover:bg-white/10"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} {playing ? "Pause" : "Play"}
          </button>
          <button
            onClick={handleStep}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/80 transition hover:bg-white/10"
          >
            <StepForward className="h-4 w-4" /> Step
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/80 transition hover:bg-white/10"
          >
            <RefreshCcw className="h-4 w-4" /> Reset
          </button>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">
            <span>Stage {stageIndex + 1} / {stageFlow.length}</span>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="flex-1 min-w-[180px]">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Cloud latency ∼{latencyMs} ms</span>
              <span>{Math.round(aggregatorProgress * 100)}% FedAvg quorum</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${aggregatorProgress * 100}%` }}
                transition={{ type: "spring", stiffness: 160, damping: 24 }}
                className="h-full bg-gradient-to-r from-emerald-400 via-sky-400 to-blue-400"
              />
            </div>
          </div>
        </div>
      </motion.header>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80"
          >
            <div ref={canvasContainerRef} className="relative h-[360px] w-full">
              <canvas ref={canvasRef} className="h-full w-full" />
            </div>
            <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
              Live fleet map · {stageFlow[stageIndex].title}
            </div>
            <div className="pointer-events-none absolute bottom-4 right-4 flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-slate-200">
              {legendItems.map((item) => (
                <span key={item.label} className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.label}
                </span>
              ))}
            </div>
            <div className="pointer-events-none absolute left-4 bottom-4 flex items-center gap-2 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-amber-300" /> Hazard probe
              </span>
              <span className="flex items-center gap-1">
                <Mic className="h-3 w-3 text-emerald-300" /> Audio spike
              </span>
              <span className="flex items-center gap-1">
                <Waves className="h-3 w-3 text-emerald-300" /> IMU spike
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className={gradientCard}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-white/85">V2X feed · conflicting hazard votes</h3>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                Hazard share {(hazardShare * 100).toFixed(0)}% vs {((1 - hazardShare) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="mt-3 overflow-hidden rounded-xl border border-white/5">
              <table className="w-full table-fixed border-collapse text-left text-[11px] text-slate-200">
                <thead className="bg-white/5 text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Vehicle</th>
                    <th className="px-3 py-2">Stage status</th>
                    <th className="px-3 py-2">Prediction</th>
                    <th className="px-3 py-2">Confidence</th>
                    <th className="px-3 py-2">IMU</th>
                    <th className="px-3 py-2">Audio</th>
                    <th className="px-3 py-2">Consensus</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((vehicle, idx) => (
                    <tr key={vehicle.id} className={idx % 2 === 0 ? "bg-white/5/20" : "bg-transparent"}>
                      <td className="px-3 py-2 text-white/90">{vehicle.label}</td>
                      <td className="px-3 py-2 text-slate-300">{vehicle.state}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            vehicle.prediction === "hazard"
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-slate-500/20 text-slate-200"
                          }`}
                        >
                          {vehicle.prediction}
                        </span>
                      </td>
                      <td className="px-3 py-2">{Math.round(vehicle.confidence * 100)}%</td>
                      <td className="px-3 py-2 text-center">
                        {vehicle.imu ? <Waves className="mx-auto h-4 w-4 text-emerald-300" /> : "—"}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {vehicle.audio ? <Mic className="mx-auto h-4 w-4 text-emerald-300" /> : "—"}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            vehicle.consensus === "confirm"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : vehicle.consensus === "reject"
                              ? "bg-rose-500/20 text-rose-300"
                              : "bg-slate-500/20 text-slate-200"
                          }`}
                        >
                          {vehicle.consensus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className={gradientCard}
          >
            <h3 className="text-sm font-semibold text-white/85">Pipeline timeline</h3>
            <div className="mt-3 space-y-3">
              {stageFlow.map((stage, idx) => {
                const isActive = idx === stageIndex;
                const accent = accentStyles[stage.accent];
                return (
                  <motion.div
                    key={stage.key}
                    className={`rounded-2xl border px-4 py-3 transition ${
                      isActive ? `${accent.border} bg-white/8 shadow-inner` : "border-white/10 bg-white/5"
                    }`}
                    animate={{ scale: isActive ? 1.01 : 1 }}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`grid h-9 w-9 place-items-center rounded-xl bg-white/10 ${
                        isActive ? accent.text : "text-slate-200"
                      }`}>
                        {stage.icon}
                      </span>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className={`text-sm font-semibold ${isActive ? accent.text : "text-white/85"}`}>
                            {stage.title}
                          </span>
                          {isActive && (
                            <span className={`rounded-full px-2 py-0.5 text-[10px] ${accent.chip}`}>
                              Live
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300">{stage.subtitle}</p>
                        <AnimatePresence>
                          {isActive && (
                            <motion.ul
                              key={stage.title}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              transition={{ duration: 0.2 }}
                              className="mt-2 space-y-1.5 text-xs text-slate-200"
                            >
                              {stage.bullets.map((bullet) => (
                                <li key={bullet} className="flex items-start gap-2">
                                  <span className={`mt-1 h-1.5 w-1.5 rounded-full ${accent.dot}`} />
                                  <span>{bullet}</span>
                                </li>
                              ))}
                            </motion.ul>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className={gradientCard}
          >
            <h3 className="text-sm font-semibold text-white/85">Edge metrics</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-[11px] uppercase tracking-wide text-slate-400">Consensus confidence</div>
                <div className="mt-1 text-lg font-semibold text-emerald-300">{Math.round(consensusConfidence * 100)}%</div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(1, consensusConfidence) * 100}%` }}
                    transition={{ type: "spring", stiffness: 160, damping: 24 }}
                    className="h-full bg-emerald-400"
                  />
                </div>
                <p className="mt-2 text-[11px] text-slate-400">Average confidence of hazard broadcasters.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-[11px] uppercase tracking-wide text-slate-400">Dissent confidence</div>
                <div className="mt-1 text-lg font-semibold text-rose-300">{Math.round(dissentConfidence * 100)}%</div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(1, dissentConfidence) * 100}%` }}
                    transition={{ type: "spring", stiffness: 160, damping: 24 }}
                    className="h-full bg-rose-400"
                  />
                </div>
                <p className="mt-2 text-[11px] text-slate-400">Confidence attached to clear-lane voters.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-[11px] uppercase tracking-wide text-slate-400">Training footprint</div>
                <div className="mt-1 text-lg font-semibold text-sky-300">{trainingSteps} steps</div>
                <p className="mt-2 text-[11px] text-slate-400">
                  Weight delta {uploadSizeMB.toFixed(1)} MB • LoRA head only
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={gradientCard}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white/85">Edge console</h3>
              <span className="text-[11px] text-slate-400">{logs.length} events</span>
            </div>
            <div className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-1 text-xs text-slate-200">
              {logs.map((log) => {
                const accent = accentStyles[stageAccentMap[log.stage]];
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-2 rounded-xl border border-white/5 bg-white/5 px-3 py-2"
                  >
                    <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${accent.dot}`} />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] text-slate-400">[{formatClock(log.ts)}]</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] ${accent.chip}`}>
                          {stageFlow.find((stage) => stage.key === log.stage)?.title ?? log.stage}
                        </span>
                      </div>
                      <div className="mt-1 text-slate-200">{log.message}</div>
                    </div>
                  </div>
                );
              })}
              {logs.length === 0 && (
                <div className="text-slate-500">No activity yet.</div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className={gradientCard}
        >
          <h3 className="text-sm font-semibold text-white/85">Federated loop summary</h3>
          <div className="mt-3 space-y-3 text-sm text-slate-200">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white/80">
                <RadioTower className="h-4 w-4" />
              </span>
              <div>
                <p className="font-medium text-white/90">V2X consensus graph</p>
                <p className="text-xs text-slate-300">
                  Vehicles broadcast logits + hashes every 200 ms. A dispute fires if variance exceeds ±25% over a rolling 4-sample window.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white/80">
                <Activity className="h-4 w-4" />
              </span>
              <div>
                <p className="font-medium text-white/90">Multimodal adjudication</p>
                <p className="text-xs text-slate-300">
                  IMU jerk + acoustic spikes form a confidence prior. Absent evidence downgrades the alert before any training occurs.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white/80">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <p className="font-medium text-white/90">Aegis privacy buffer</p>
                <p className="text-xs text-slate-300">
                  Redaction executes locally. Only tensors and gradient stats leave the cabin, keeping GDPR and DP budgets intact.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white/80">
                <Cpu className="h-4 w-4" />
              </span>
              <div>
                <p className="font-medium text-white/90">Edge fine-tuning</p>
                <p className="text-xs text-slate-300">
                  Few-shot SGD on a LoRA head (12 steps, 1.8e-4 LR). Early stopping verifies against cached validation tensors.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white/80">
                <Upload className="h-4 w-4" />
              </span>
              <div>
                <p className="font-medium text-white/90">FedAvg aggregation</p>
                <p className="text-xs text-slate-300">
                  Weight deltas encrypted with fleet keys. Broker waits for quorum before averaging and redistributing a signed checkpoint.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className={gradientCard}
        >
          <h3 className="text-sm font-semibold text-white/85">Pseudocode glance</h3>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-2xl bg-slate-950/70 p-4 text-[11px] leading-relaxed text-emerald-200">
{`for vehicle in fleet.peer_mesh(segment="18A"):
    vote = vehicle.current_vote()
    if conflict(vote):
        imu_ok = vote.imu.jerk > IMU_THRESHOLD
        audio_ok = vote.audio.impact_score > AUDIO_THRESHOLD
        if imu_ok or audio_ok:
            frames = aegis.blur(vote.frames)
            adapter = load_lora_head()
            adapter.train(frames, vote.label, steps=12)
            delta = adapter.weight_delta()
            broker.upload(delta)
broker.fedavg()
broker.broadcast(new_checkpoint)`}
          </pre>
          <p className="mt-3 text-xs text-slate-400">
            The routine runs opportunistically while vehicles are in low-load intervals, keeping real-time perception budgets within the safety envelope.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default OnDeviceFineTuning;
