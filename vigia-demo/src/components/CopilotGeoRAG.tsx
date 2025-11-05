"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type CopilotMsg = {
  id: string;
  role: "system" | "user" | "copilot";
  text: string;
  small?: string;
};

type SimContext = {
  roadCondition: "dry" | "wet" | "congested";
  distanceM: number;              // e.g., 500
  hazardType: "pothole" | "debris" | "speedbreaker" | "flooded";
  curve: boolean;
  eventsLast48h: number;          // retrieved stat (mocked)
  recommendedSpeedKmh: number;    // actionable guidance
};

function fmtDistance(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
}

const CARD = "rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4";

export default function CopilotGeoRAG() {
  const [msgs, setMsgs] = useState<CopilotMsg[]>([
    {
      id: crypto.randomUUID(),
      role: "system",
      text: "VIGIA Co-Pilot is standing by. I’ll speak up when a verified hazard affects your route.",
      small: "Geo-RAG demo: hard-coded retrieval + guidance",
    },
  ]);
  const [busy, setBusy] = useState(false);

  // A couple of pre-baked contexts judges can cycle through
  const presets = useMemo<SimContext[]>(
    () => [
      {
        roadCondition: "wet",
        distanceM: 500,
        hazardType: "pothole",
        curve: true,
        eventsLast48h: 4,
        recommendedSpeedKmh: 30,
      },
      {
        roadCondition: "dry",
        distanceM: 220,
        hazardType: "debris",
        curve: false,
        eventsLast48h: 7,
        recommendedSpeedKmh: 25,
      },
      {
        roadCondition: "congested",
        distanceM: 800,
        hazardType: "speedbreaker",
        curve: false,
        eventsLast48h: 12,
        recommendedSpeedKmh: 35,
      },
    ],
    []
  );

  const [presetIdx, setPresetIdx] = useState(0);

  function simulateAlert(ctx: SimContext) {
    setBusy(true);

    // 1) “Live context” message (as if coming from V2X / sensor layer)
    const userLine: CopilotMsg = {
      id: crypto.randomUUID(),
      role: "user",
      text: `V2X alert received • ${ctx.hazardType.toUpperCase()} • ${fmtDistance(
        ctx.distanceM
      )} ahead`,
      small: `Road: ${ctx.roadCondition} • Curve: ${ctx.curve ? "yes" : "no"}`,
    };

    // 2) “Retrieved facts” + 3) “Actionable guidance”
    const narrative = makeNarrative(ctx);

    const copilotLine: CopilotMsg = {
      id: crypto.randomUUID(),
      role: "copilot",
      text: narrative,
      small:
        "Retrieved: cluster stats (DBSCAN), on-route history, weather • Generated: concise guidance",
    };

    // push both with a tiny delay for drama
    setTimeout(() => {
      setMsgs((m) => [...m, userLine]);
      setTimeout(() => {
        setMsgs((m) => [...m, copilotLine]);
        setBusy(false);
      }, 400);
    }, 250);
  }

  function makeNarrative(ctx: SimContext) {
    const condition =
      ctx.roadCondition === "wet"
        ? "Road surface is wet"
        : ctx.roadCondition === "congested"
        ? "Traffic is dense"
        : "Road is dry";
    const curve = ctx.curve ? "after this curve" : "on your current lane";
    const hazardLabel =
      ctx.hazardType === "pothole"
        ? "a verified, sharp pothole"
        : ctx.hazardType === "debris"
        ? "verified debris"
        : ctx.hazardType === "speedbreaker"
        ? "a raised speed breaker"
        : "standing water";

    // --- The winning Geo-RAG string (live context + retrieved stats + guidance) ---
    return `[VIGIA Co-Pilot] ${condition}, and ${hazardLabel} is ${fmtDistance(
      ctx.distanceM
    )} ahead ${curve}. This location shows ${ctx.eventsLast48h} severe G-force events from other VIGIA users in the last 48 hours. I suggest easing speed to ${ctx.recommendedSpeedKmh} km/h and increasing gap to the vehicle in front.`;
  }

  function handleSimulate() {
    const ctx = presets[presetIdx];
    simulateAlert(ctx);
  }

  function shufflePreset(dir: 1 | -1) {
    setPresetIdx((i) => {
      const n = (i + dir + presets.length) % presets.length;
      return n;
    });
  }

  return (
    <div className="grid gap-4">
      {/* Header / Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-white/90">
          <div className="text-xl font-semibold">VIGIA Co-Pilot (Geo-RAG)</div>
          <div className="text-xs text-white/60">
            Live Context + Retrieved Stats + Actionable Guidance. Zero LLMs on device—just the
            story your judges need to see.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`${CARD} flex items-center gap-2`}>
            <span className="text-xs text-white/60">Preset</span>
            <button
              onClick={() => shufflePreset(-1)}
              className="rounded-md bg-white/10 px-2 py-1 text-xs text-white/80 hover:bg-white/20"
              aria-label="Prev preset"
            >
              ‹
            </button>
            <span className="text-sm text-white/80">
              {presetIdx + 1}/{presets.length}
            </span>
            <button
              onClick={() => shufflePreset(1)}
              className="rounded-md bg-white/10 px-2 py-1 text-xs text-white/80 hover:bg-white/20"
              aria-label="Next preset"
            >
              ›
            </button>
          </div>

          <button
            onClick={handleSimulate}
            disabled={busy}
            className={`rounded-xl px-4 py-2 font-medium transition ${
              busy
                ? "bg-slate-300 text-slate-700"
                : "bg-white text-slate-900 hover:bg-slate-100"
            }`}
          >
            {busy ? "Generating…" : "Simulate V2X Alert → Co-Pilot"}
          </button>
        </div>
      </div>

      {/* Chat Window */}
      <div className={`${CARD} max-h-[420px] overflow-y-auto`}>
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {msgs.map((m) => (
              <motion.li
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
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
                      ? "text-xs text-white/60"
                      : m.role === "user"
                      ? "max-w-[80%] rounded-2xl bg-white text-slate-900 px-3 py-2 shadow"
                      : "max-w-[80%] rounded-2xl bg-emerald-400/10 border border-emerald-400/20 px-3 py-2 text-white/90"
                  }
                >
                  <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
                  {m.small && (
                    <div
                      className={`mt-1 text-[11px] ${
                        m.role === "user" ? "text-slate-700/70" : "text-white/60"
                      }`}
                    >
                      {m.small}
                    </div>
                  )}
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>

      {/* “Retrieved facts” chips (visual proof of RAG) */}
      <RetrievedChips ctx={presets[presetIdx]} />
    </div>
  );
}

/** Bottom chips to make the “retrieved context” obvious to judges */
function RetrievedChips({ ctx }: { ctx: SimContext }) {
  const CHIP =
    "rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80";
  return (
    <div className="flex flex-wrap gap-2">
      <div className={CHIP}>Weather: {ctx.roadCondition}</div>
      <div className={CHIP}>Hazard: {ctx.hazardType}</div>
      <div className={CHIP}>Distance: {fmtDistance(ctx.distanceM)}</div>
      <div className={CHIP}>G-force events (48h): {ctx.eventsLast48h}</div>
      <div className={CHIP}>Advice: ≤ {ctx.recommendedSpeedKmh} km/h</div>
    </div>
  );
}