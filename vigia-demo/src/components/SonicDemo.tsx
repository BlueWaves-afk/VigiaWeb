"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import MapCanvas from "@/components/MapCanvas";

function metersToDelta(lat: number, meters: number, headingDeg: number) {
  const rad = (headingDeg * Math.PI) / 180;
  const dLat = (meters * Math.cos(rad)) / 111_320;
  const dLng = (meters * Math.sin(rad)) / (111_320 * Math.cos((lat * Math.PI) / 180));
  return { dLat, dLng };
}

type TopHit = { class: string; dist_m: number; bearing: number; severity?: number };
type WorkerMsg = {
  topk: TopHit[];
  geojson: GeoJSON.FeatureCollection;
  meta?: {
    lat: number; lng: number; speedKmh: number; headingDeg: number;
    isRain: boolean; ringCount: number; ringNow: number; ringAhead: number;
  } | null;
};

type LogTag = "SYS" | "RAG" | "TTS" | "DB" | "V2X";
type LogLine = { t: string; tag: LogTag; text: string };

export default function SonicDemo() {
  const [pos, setPos] = useState({ lat: 12.9716, lng: 77.5946, headingDeg: 80, speedKmh: 35 });
  const [hazards, setHazards] = useState<GeoJSON.FeatureCollection | undefined>();
  const [log, setLog] = useState<LogLine[]>([]);
  const [active, setActive] = useState(false);
  const [copilotRunning, setCopilotRunning] = useState(false);

  const sectionRef = useRef<HTMLDivElement | null>(null);
  const ragRef = useRef<Worker | null>(null);
  const demoCardsRef = useRef<HTMLDivElement | null>(null);
  const speakCooldownRef = useRef<Record<string, number>>({});
  const posRef = useRef(pos);
  const inViewRef = useRef(false);
  const hazardTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dbTimerRef = useRef<NodeJS.Timeout | null>(null);
  const v2xTimerRef = useRef<NodeJS.Timeout | null>(null);

  const lastRagAtRef = useRef(0);
  const lastRagSigRef = useRef<string>("");

  useEffect(() => { posRef.current = pos; }, [pos]);

  const pushLog = useCallback((tag: LogTag, text: string) => {
    const t = new Date().toLocaleTimeString();
    setLog(prev => [...prev.slice(-24), { t, tag, text }]);
  }, []);

  // Timers for DB and V2X updates
  useEffect(() => {
    if (!active) {
      if (dbTimerRef.current) clearInterval(dbTimerRef.current);
      if (v2xTimerRef.current) clearTimeout(v2xTimerRef.current);
      dbTimerRef.current = null;
      v2xTimerRef.current = null;
      return;
    }

    dbTimerRef.current = setInterval(() => {
      pushLog("DB", "Retrieving latest hazard data from database...");
    }, 10000);

    const scheduleV2XUpdate = () => {
      const delay = 10000 + Math.random() * 10000;
      v2xTimerRef.current = setTimeout(() => {
        pushLog("V2X", "Updated hazard map from V2X input");
        scheduleV2XUpdate();
      }, delay);
    };

    scheduleV2XUpdate();

    return () => {
      if (dbTimerRef.current) {
        clearInterval(dbTimerRef.current);
        dbTimerRef.current = null;
      }
      if (v2xTimerRef.current) {
        clearTimeout(v2xTimerRef.current);
        v2xTimerRef.current = null;
      }
    };
  }, [active, pushLog]);

  // Initialize RAG worker
  useEffect(() => {
    if (ragRef.current) return;
    const w = new Worker(new URL("@/workers/rag.ts", import.meta.url), { type: "module" });
    ragRef.current = w;
    w.postMessage({ type: "init", base: window.location.origin });
    pushLog("SYS", "GeoRAG worker initialized");

    w.onmessage = (e: MessageEvent<WorkerMsg>) => {
      const { topk, geojson, meta } = e.data || { topk: [], geojson: undefined as any };
      if (geojson) setHazards(geojson);

      const now = Date.now();
      const ragSig = meta
        ? `${meta.lat.toFixed(4)}|${meta.lng.toFixed(4)}|${Math.round(meta.speedKmh)}|${Math.round(meta.headingDeg)}|${meta.ringCount}|${topk?.length ?? 0}`
        : `?|?|?|?|?|${topk?.length ?? 0}`;

      if (now - lastRagAtRef.current > 1200 && ragSig !== lastRagSigRef.current) {
        lastRagAtRef.current = now;
        lastRagSigRef.current = ragSig;

        if (meta) {
          pushLog(
            "RAG",
            `lat=${meta.lat.toFixed(5)}, lng=${meta.lng.toFixed(5)}, v=${Math.round(meta.speedKmh)}km/h, hdg=${Math.round(meta.headingDeg)}°, rain=${meta.isRain ? "yes" : "no"}, cells=${meta.ringCount}, topk=${topk?.length ?? 0}`
          );
        } else {
          pushLog("RAG", `cells=?, topk=${topk?.length ?? 0}`);
        }
      }

      if (!topk?.length) return;

      const best = topk[0];
      const nm = String(best.class || "hazard").replaceAll("_", " ");
      const dist = Math.max(10, Math.round(best.dist_m || 0));
      const key = best.class;
      const last = speakCooldownRef.current[key] || 0;
      if (Date.now() - last < 6000) return;

      const line = `Caution: ${nm} in ${dist} meters. Slow down.`;
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(line);
        u.rate = 1.0;
        u.pitch = 1.0;
        window.speechSynthesis.speak(u);
        pushLog("TTS", `"${line}"`);
      } catch {/* no-op */ }
      speakCooldownRef.current[key] = Date.now();
    };

    return () => {
      if (ragRef.current) {
        ragRef.current.terminate();
        ragRef.current = null;
      }
    };
  }, [pushLog]);

  // Observe visibility
  useEffect(() => {
    if (!sectionRef.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const v = entries[0].isIntersecting;
        inViewRef.current = v;
        setActive(v);
        if (v && copilotRunning) {
          pushLog("SYS", "Sonic demo activated (scroll to drive)");
          ragRef.current?.postMessage({ ...posRef.current, isRain: false, city: "bangalore", k: 3 });
        } else if (!v) {
          window.speechSynthesis.cancel();
          if (copilotRunning) {
            pushLog("SYS", "Sonic demo deactivated");
          }
        }
      },
      { root: null, threshold: 0.5 }
    );
    obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, [pushLog, copilotRunning]);

  // Wheel handler
  const onWheel = useCallback((event: WheelEvent) => {
    if (!inViewRef.current || !copilotRunning) return;
    event.preventDefault();

    const meters = Math.max(-50, Math.min(50, -event.deltaY * 0.6));
    const { dLat, dLng } = metersToDelta(posRef.current.lat, meters, posRef.current.headingDeg);
    const next = { ...posRef.current, lat: posRef.current.lat + dLat, lng: posRef.current.lng + dLng };
    setPos(next);

    ragRef.current?.postMessage({ ...next, isRain: false, city: "bangalore", k: 3 });
  }, [copilotRunning]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    section.addEventListener("wheel", onWheel, { passive: false });
    return () => section.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  const onKey = useCallback((e: React.KeyboardEvent) => {
    if (!inViewRef.current || !copilotRunning) return;
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const meters = e.key === "ArrowUp" ? 24 : -24;
    const { dLat, dLng } = metersToDelta(posRef.current.lat, meters, posRef.current.headingDeg);
    const next = { ...posRef.current, lat: posRef.current.lat + dLat, lng: posRef.current.lng + dLng };
    setPos(next);
    ragRef.current?.postMessage({ ...next, isRain: false, city: "bangalore", k: 3 });
  }, [copilotRunning]);

  const handleStartCopilot = () => {
    setCopilotRunning(true);
    pushLog("SYS", "Copilot started - scroll to drive");
    ragRef.current?.postMessage({ ...posRef.current, isRain: false, city: "bangalore", k: 3 });

    requestAnimationFrame(() => {
      const cardsEl = demoCardsRef.current;
      if (!cardsEl) return;
      const rect = cardsEl.getBoundingClientRect();
      const top = rect.top + window.scrollY - 120;
      window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
    });
  };

  const handleStopCopilot = () => {
    setCopilotRunning(false);
    window.speechSynthesis.cancel();
    pushLog("SYS", "Copilot stopped");
  };

  return (
    <section
      id="copilot-demo"
      ref={sectionRef}
      onKeyDown={onKey}
      tabIndex={0}
      className="relative bg-slate-950 py-32 light:bg-white"
      style={{ scrollMarginTop: "96px", overscrollBehavior: "contain" }}
    >
      {/* Subtle grid background */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.015]">
        <div className="h-full w-full bg-[linear-gradient(to_right,#94a3b8_1px,transparent_1px),linear-gradient(to_bottom,#94a3b8_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 max-w-4xl">
          <p className="mb-4 text-sm font-medium tracking-wide text-cyan-400 light:text-blue-600">
            INTERACTIVE DEMO
          </p>

          <h2 className="mb-6 text-5xl font-semibold leading-tight text-white md:text-6xl light:text-slate-900">
            Contextual Awareness
          </h2>

          <p className="mb-8 max-w-3xl text-lg leading-relaxed text-slate-400 light:text-slate-600">
            As you <span className="font-semibold text-cyan-400 light:text-cyan-600">scroll inside this section</span>, 
            the co-pilot scrubs a short route in Bengaluru, recalls nearby hazards from memory, 
            and <span className="font-semibold text-emerald-400 light:text-emerald-600">speaks before</span> you reach them.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            {!copilotRunning ? (
              <button
                onClick={handleStartCopilot}
                className="rounded-full bg-white px-8 py-4 text-base font-semibold text-slate-900 shadow-lg transition-all hover:bg-slate-50 hover:shadow-xl light:bg-slate-900 light:text-white light:hover:bg-slate-800"
              >
                Start Copilot
              </button>
            ) : (
              <button
                onClick={handleStopCopilot}
                className="rounded-full border border-slate-700 px-8 py-4 text-base font-semibold text-white transition-all hover:border-slate-600 hover:bg-slate-900/50 light:border-slate-300 light:text-slate-900 light:hover:bg-slate-50"
              >
                Stop Copilot
              </button>
            )}
          </div>
        </div>

        {/* Demo Grid */}
        <div ref={demoCardsRef} className="grid gap-6 lg:grid-cols-2">
          {/* Terminal Card */}
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 light:border-slate-200 light:bg-white">
            {/* Terminal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-5 py-3 light:border-slate-200 light:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-slate-700" />
                  <div className="h-3 w-3 rounded-full bg-slate-700" />
                  <div className="h-3 w-3 rounded-full bg-slate-700" />
                </div>
                <span className="font-mono text-xs text-slate-500 light:text-slate-600">
                  copilot@vigia
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${active ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
                  <span className={`text-xs font-semibold ${active ? "text-emerald-400" : "text-slate-500"}`}>
                    {active ? "LIVE" : "IDLE"}
                  </span>
                </div>
              </div>
            </div>

            {/* Terminal Content */}
            <div className="h-[600px] overflow-hidden bg-slate-950 p-5 font-mono text-xs leading-6 text-slate-400 light:bg-slate-50 light:text-slate-700">
              <div className="flex h-full flex-col justify-end">
                {log.length === 0 ? (
                  <div className="italic text-slate-600 light:text-slate-500">
                    Waiting for scroll events…
                  </div>
                ) : (
                  log.slice(-24).map((l, i) => (
                    <div key={i} className="mb-1">
                      <span className="text-slate-600 light:text-slate-500">[{l.t}]</span>{" "}
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                          l.tag === "RAG"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : l.tag === "TTS"
                              ? "bg-cyan-500/20 text-cyan-400"
                              : l.tag === "DB"
                                ? "bg-purple-500/20 text-purple-400"
                                : l.tag === "V2X"
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "bg-pink-500/20 text-pink-400"
                        }`}
                      >
                        {l.tag}
                      </span>{" "}
                      <span className="text-slate-400 light:text-slate-600">{l.text}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Map Card */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 light:border-slate-200 light:bg-white">
            <div className="h-[664px] overflow-hidden">
              <MapCanvas
                pos={pos}
                onPosChange={setPos}
                hazards={hazards}
                follow={true}
                zoom={15}
              />
            </div>

            {/* Status Badge */}
            <div
              className={`absolute right-6 top-6 rounded-full px-4 py-2 text-sm font-medium backdrop-blur-lg transition-all ${
                active
                  ? "bg-emerald-500/20 text-emerald-300 ring-2 ring-emerald-500/40"
                  : "bg-slate-500/20 text-slate-400 ring-1 ring-slate-500/30"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${active ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`} />
                {active ? "Interactive" : "Scroll into view"}
              </div>
            </div>

            {/* Legend */}
            <div className="absolute bottom-6 left-6 rounded-xl bg-black/80 px-4 py-3 text-xs text-slate-300 backdrop-blur-lg ring-1 ring-slate-700 light:bg-white/90 light:text-slate-700 light:ring-slate-200">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
                <span>Active Hazards</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 light:text-slate-600">
                <div className="h-2 w-2 rounded-full bg-cyan-500" />
                <span>Your Position</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}