"use client";

import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Zap, MapPin, AlertTriangle, TrendingUp, Clock, Navigation, Activity } from "lucide-react";

type CopilotMsg = {
  id: string;
  role: "system" | "user" | "copilot";
  text: string;
  small?: string;
  timestamp: number;
  metadata?: {
    confidence?: number;
    sources?: string[];
    actionable?: boolean;
  };
};

type SimContext = {
  roadCondition: "dry" | "wet" | "congested" | "icy" | "foggy";
  distanceM: number;
  hazardType: "pothole" | "debris" | "speedbreaker" | "flooded" | "accident" | "construction";
  curve: boolean;
  eventsLast48h: number;
  recommendedSpeedKmh: number;
  weatherCondition?: string;
  trafficDensity?: "light" | "moderate" | "heavy";
  timeOfDay?: "morning" | "afternoon" | "evening" | "night";
  nearbyPOIs?: string[];
  alternativeRoute?: boolean;
};

function fmtDistance(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
}

const CARD = "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4";

export default function CopilotGeoRAG() {
  const [msgs, setMsgs] = useState<CopilotMsg[]>([
    {
      id: crypto.randomUUID(),
      role: "system",
      text: "VIGIA Co-Pilot initialized. Real-time hazard analysis with geo-contextual intelligence.",
      small: "Multi-sensor fusion + Historical data + Predictive routing",
      timestamp: Date.now(),
      metadata: { confidence: 1.0, sources: ["System"] },
    },
  ]);
  const [busy, setBusy] = useState(false);
  const [currentPreset, setCurrentPreset] = useState<SimContext | null>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const mouseY = useMotionValue(0);
  const glowOpacity = useTransform(mouseY, [-100, 0, 100], [0.2, 0.5, 0.2]);

  const presets = useMemo<SimContext[]>(
    () => [
      {
        roadCondition: "wet",
        distanceM: 500,
        hazardType: "pothole",
        curve: true,
        eventsLast48h: 4,
        recommendedSpeedKmh: 30,
        weatherCondition: "Light rain",
        trafficDensity: "moderate",
        timeOfDay: "morning",
        nearbyPOIs: ["Shell Petrol Station", "Cafe Coffee Day"],
        alternativeRoute: true,
      },
      {
        roadCondition: "dry",
        distanceM: 220,
        hazardType: "debris",
        curve: false,
        eventsLast48h: 7,
        recommendedSpeedKmh: 25,
        weatherCondition: "Clear skies",
        trafficDensity: "light",
        timeOfDay: "afternoon",
        nearbyPOIs: ["AutoCare Service Center"],
        alternativeRoute: false,
      },
      {
        roadCondition: "congested",
        distanceM: 800,
        hazardType: "speedbreaker",
        curve: false,
        eventsLast48h: 12,
        recommendedSpeedKmh: 35,
        weatherCondition: "Partly cloudy",
        trafficDensity: "heavy",
        timeOfDay: "evening",
        nearbyPOIs: ["Starbucks Coffee", "HP Fuel Pump"],
        alternativeRoute: true,
      },
      {
        roadCondition: "foggy",
        distanceM: 350,
        hazardType: "construction",
        curve: true,
        eventsLast48h: 18,
        recommendedSpeedKmh: 20,
        weatherCondition: "Dense fog",
        trafficDensity: "moderate",
        timeOfDay: "morning",
        nearbyPOIs: ["Express Auto Repair"],
        alternativeRoute: true,
      },
      {
        roadCondition: "icy",
        distanceM: 650,
        hazardType: "accident",
        curve: false,
        eventsLast48h: 23,
        recommendedSpeedKmh: 15,
        weatherCondition: "Freezing rain",
        trafficDensity: "heavy",
        timeOfDay: "night",
        nearbyPOIs: ["Shell Petrol Station", "Emergency Services"],
        alternativeRoute: true,
      },
      {
        roadCondition: "wet",
        distanceM: 450,
        hazardType: "flooded",
        curve: true,
        eventsLast48h: 8,
        recommendedSpeedKmh: 10,
        weatherCondition: "Heavy rain",
        trafficDensity: "light",
        timeOfDay: "evening",
        nearbyPOIs: ["Cafe Coffee Day"],
        alternativeRoute: true,
      },
      {
        roadCondition: "dry",
        distanceM: 1200,
        hazardType: "debris",
        curve: false,
        eventsLast48h: 3,
        recommendedSpeedKmh: 40,
        weatherCondition: "Sunny",
        trafficDensity: "light",
        timeOfDay: "afternoon",
        nearbyPOIs: ["HP Fuel Pump", "AutoCare Service Center"],
        alternativeRoute: false,
      },
      {
        roadCondition: "congested",
        distanceM: 280,
        hazardType: "construction",
        curve: false,
        eventsLast48h: 15,
        recommendedSpeedKmh: 20,
        weatherCondition: "Overcast",
        trafficDensity: "heavy",
        timeOfDay: "morning",
        nearbyPOIs: ["Starbucks Coffee"],
        alternativeRoute: true,
      },
    ],
    []
  );

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [msgs]);

  function simulateAlert(ctx: SimContext) {
    setBusy(true);

    const userLine: CopilotMsg = {
      id: crypto.randomUUID(),
      role: "user",
      text: `V2X alert • ${ctx.hazardType.toUpperCase()} detected • ${fmtDistance(ctx.distanceM)} ahead`,
      small: `${ctx.weatherCondition} • ${ctx.trafficDensity} traffic • ${ctx.timeOfDay}`,
      timestamp: Date.now(),
      metadata: {
        confidence: 0.85 + Math.random() * 0.15,
        sources: ["V2X", "Sensor Fusion", "Road Network"],
        actionable: true,
      },
    };

    const narrative = makeSmartNarrative(ctx);
    
    const copilotLine: CopilotMsg = {
      id: crypto.randomUUID(),
      role: "copilot",
      text: narrative,
      small: `Analysis: ${ctx.eventsLast48h} incidents (48h) • ${ctx.nearbyPOIs?.length || 0} nearby POIs • Confidence: ${(85 + Math.random() * 15).toFixed(0)}%`,
      timestamp: Date.now() + 100,
      metadata: {
        confidence: 0.88 + Math.random() * 0.12,
        sources: ["Geo-RAG", "Historical Data", "Weather API", "Traffic Monitor"],
        actionable: true,
      },
    };

    setTimeout(() => {
      setMsgs((m) => [...m, userLine]);
      setTimeout(() => {
        setMsgs((m) => [...m, copilotLine]);
        setBusy(false);
      }, 600);
    }, 300);
  }

  function makeSmartNarrative(ctx: SimContext): string {
    const roadConditionText = {
      wet: "Roads are wet with reduced traction",
      dry: "Road conditions are optimal",
      congested: "Heavy traffic ahead",
      icy: "⚠️ CRITICAL: Icy road conditions detected",
      foggy: "⚠️ Low visibility due to fog",
    }[ctx.roadCondition];

    const hazardDescriptions = {
      pothole: "a verified deep pothole",
      debris: "road debris obstructing the lane",
      speedbreaker: "an unmarked speed breaker",
      flooded: "⚠️ CRITICAL: flooded road section",
      accident: "⚠️ CRITICAL: traffic accident",
      construction: "active road construction",
    };

    const hazardLabel = hazardDescriptions[ctx.hazardType];
    const curveText = ctx.curve ? "around the upcoming curve" : "in your current lane";
    
    let narrative = `[VIGIA Co-Pilot] ${roadConditionText}. Detected ${hazardLabel} ${fmtDistance(ctx.distanceM)} ahead ${curveText}.`;
    
    if (ctx.eventsLast48h > 10) {
      narrative += ` ⚠️ HIGH RISK ZONE: ${ctx.eventsLast48h} severe incidents reported here in the last 48 hours.`;
    } else if (ctx.eventsLast48h > 5) {
      narrative += ` ${ctx.eventsLast48h} incidents reported at this location (48h).`;
    } else {
      narrative += ` ${ctx.eventsLast48h} minor incidents recorded recently.`;
    }

    narrative += ` Recommended speed: ${ctx.recommendedSpeedKmh} km/h.`;

    if (ctx.trafficDensity === "heavy") {
      narrative += " Maintain safe following distance.";
    }
    
    if (ctx.alternativeRoute && ctx.eventsLast48h > 8) {
      narrative += ` Alternative route available via ${ctx.nearbyPOIs?.[0] || "nearby junction"}.`;
    }

    if (ctx.nearbyPOIs && ctx.nearbyPOIs.length > 0 && (ctx.hazardType === "flooded" || ctx.hazardType === "accident")) {
      narrative += ` Nearby: ${ctx.nearbyPOIs.slice(0, 2).join(", ")}.`;
    }

    return narrative;
  }

  const handleSimulate = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * presets.length);
    const ctx = presets[randomIndex];
    setCurrentPreset(ctx);
    simulateAlert(ctx);
  }, [presets]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSimulate();
    }, 1500);
    return () => clearTimeout(timer);
  }, [handleSimulate]);

  return (
    <div className="grid gap-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6 backdrop-blur-sm"
      >
        <motion.div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10"
          style={{ opacity: glowOpacity }}
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        />
        
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">VIGIA Co-Pilot</h2>
            </div>
            <p className="mt-1 text-sm text-white/70">
              Intelligent hazard analysis with geo-contextual awareness and predictive routing
            </p>
          </div>

          <motion.button
            onClick={handleSimulate}
            disabled={busy}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`relative overflow-hidden rounded-xl px-6 py-3 font-semibold transition-all ${
              busy
                ? "bg-slate-400 text-slate-700 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl"
            }`}
          >
            <span className="relative z-10 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              {busy ? "Analyzing..." : "Simulate Alert"}
            </span>
            {!busy && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.5 }}
              />
            )}
          </motion.button>
        </div>
      </motion.div>

      {currentPreset && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-3 sm:grid-cols-4"
        >
          <StatCard
            icon={<MapPin className="h-4 w-4" />}
            label="Distance"
            value={fmtDistance(currentPreset.distanceM)}
            color="blue"
          />
          <StatCard
            icon={<AlertTriangle className="h-4 w-4" />}
            label="Hazard Type"
            value={currentPreset.hazardType}
            color="orange"
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Incidents (48h)"
            value={`${currentPreset.eventsLast48h}`}
            color="red"
          />
          <StatCard
            icon={<Navigation className="h-4 w-4" />}
            label="Max Speed"
            value={`${currentPreset.recommendedSpeedKmh} km/h`}
            color="green"
          />
        </motion.div>
      )}

      <motion.div
        ref={chatWindowRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`${CARD} relative max-h-[500px] overflow-y-auto`}
      >
        <div className="space-y-4">
          <AnimatePresence initial={false} mode="popLayout">
            {msgs.map((m, idx) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                  delay: idx * 0.05,
                }}
                className={`flex ${
                  m.role === "copilot"
                    ? "justify-start"
                    : m.role === "user"
                    ? "justify-end"
                    : "justify-center"
                }`}
              >
                <div
                  className={
                    m.role === "system"
                      ? "rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-center text-xs text-white/70"
                      : m.role === "user"
                      ? "group max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-3 shadow-lg"
                      : "group max-w-[85%] rounded-2xl rounded-tl-sm border border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 px-4 py-3 shadow-lg backdrop-blur-sm"
                  }
                >
                  <div className={`leading-relaxed ${m.role === "user" ? "text-white" : "text-white/95"}`}>
                    {m.text}
                  </div>
                  {m.small && (
                    <div
                      className={`mt-2 flex items-center gap-2 text-[11px] ${
                        m.role === "user" ? "text-white/70" : "text-white/60"
                      }`}
                    >
                      <Clock className="h-3 w-3" />
                      {m.small}
                    </div>
                  )}
                  {m.metadata?.confidence && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
                        <motion.div
                          className="h-full bg-emerald-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${m.metadata.confidence * 100}%` }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                        />
                      </div>
                      <span className="text-[10px] text-white/60">
                        {(m.metadata.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {currentPreset && <ContextTags ctx={currentPreset} />}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "blue" | "orange" | "red" | "green";
}) {
  const colorClasses = {
    blue: "from-blue-500/20 to-blue-600/10 border-blue-400/30 text-blue-400",
    orange: "from-orange-500/20 to-orange-600/10 border-orange-400/30 text-orange-400",
    red: "from-red-500/20 to-red-600/10 border-red-400/30 text-red-400",
    green: "from-green-500/20 to-green-600/10 border-green-400/30 text-green-400",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={`rounded-xl border bg-gradient-to-br p-4 backdrop-blur-sm ${colorClasses[color]}`}
    >
      <div className="flex items-center gap-2 text-xs font-medium opacity-80">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-xl font-bold capitalize text-white">{value}</div>
    </motion.div>
  );
}

function ContextTags({ ctx }: { ctx: SimContext }) {
  const tags = [
    { label: "Weather", value: ctx.weatherCondition, icon: <Activity className="h-3 w-3" /> },
    { label: "Traffic", value: ctx.trafficDensity, icon: <TrendingUp className="h-3 w-3" /> },
    { label: "Time", value: ctx.timeOfDay, icon: <Clock className="h-3 w-3" /> },
    { label: "Road", value: ctx.roadCondition, icon: <MapPin className="h-3 w-3" /> },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-2"
    >
      {tags.map((tag, idx) => (
        <motion.div
          key={tag.label}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.1 }}
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 backdrop-blur-sm"
        >
          {tag.icon}
          <span className="font-medium">{tag.label}:</span>
          <span className="capitalize opacity-90">{tag.value}</span>
        </motion.div>
      ))}
      {ctx.alternativeRoute && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 backdrop-blur-sm"
        >
          <Navigation className="h-3 w-3" />
          Alt Route Available
        </motion.div>
      )}
    </motion.div>
  );
}
