"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import MapCanvas from "@/components/MapCanvas";

/** meters → (Δlat, Δlng). Good enough for city scale. */
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
  // Bengaluru defaults
  const [pos, setPos] = useState({ lat: 12.9716, lng: 77.5946, headingDeg: 80, speedKmh: 35 });
  const [hazards, setHazards] = useState<GeoJSON.FeatureCollection | undefined>();
  const [log, setLog] = useState<LogLine[]>([]);
  const [active, setActive] = useState(false);
  const [hazardPulse, setHazardPulse] = useState(0);
  const [copilotRunning, setCopilotRunning] = useState(false);

  const sectionRef = useRef<HTMLDivElement | null>(null);
  const ragRef = useRef<Worker | null>(null);
  const speakCooldownRef = useRef<Record<string, number>>({});
  const posRef = useRef(pos);
  const inViewRef = useRef(false);
  const hazardTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dbTimerRef = useRef<NodeJS.Timeout | null>(null);
  const v2xTimerRef = useRef<NodeJS.Timeout | null>(null);

  // RAG log throttling / de-dupe
  const lastRagAtRef = useRef(0);
  const lastRagSigRef = useRef<string>("");

  useEffect(() => { posRef.current = pos; }, [pos]);

  const pushLog = useCallback((tag: LogTag, text: string) => {
    const t = new Date().toLocaleTimeString();
    setLog(prev => [...prev.slice(-24), { t, tag, text }]); // keep last 24, no scrollbars
  }, []);

  // Hazard pulsing animation
  useEffect(() => {
    if (!active) return;
    
    hazardTimerRef.current = setInterval(() => {
      setHazardPulse(prev => (prev + 1) % 4);
    }, 800);
    
    return () => {
      if (hazardTimerRef.current) {
        clearInterval(hazardTimerRef.current);
        hazardTimerRef.current = null;
      }
    };
  }, [active]);

  // Database update simulation
  useEffect(() => {
    if (!active) {
      if (dbTimerRef.current) clearInterval(dbTimerRef.current);
      if (v2xTimerRef.current) clearTimeout(v2xTimerRef.current);
      dbTimerRef.current = null;
      v2xTimerRef.current = null;
      return;
    }

    // Every 10 seconds - database update
    dbTimerRef.current = setInterval(() => {
      pushLog("DB", "Retrieving latest hazard data from database...");
      console.log("Retrieving latest hazard data from database...");
    }, 10000);

    // Random 10-20 seconds - V2X update
    const scheduleV2XUpdate = () => {
      const delay = 10000 + Math.random() * 10000; // 10-20 seconds
      v2xTimerRef.current = setTimeout(() => {
        pushLog("V2X", "Updated hazard map from V2X input");
        console.log("Updated hazard map from V2X input");
        scheduleV2XUpdate(); // Schedule next update
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

  // init RAG worker once
  useEffect(() => {
    if (ragRef.current) return;
    const w = new Worker(new URL("@/workers/rag.ts", import.meta.url), { type: "module" });
    ragRef.current = w;
    w.postMessage({ type: "init", base: window.location.origin });
    pushLog("SYS", "GeoRAG worker initialized");

    w.onmessage = (e: MessageEvent<WorkerMsg>) => {
      const { topk, geojson, meta } = e.data || { topk: [], geojson: undefined as any };
      if (geojson) setHazards(geojson);

      // ---- RAG logging (rate-limited + dedup) ----
      const now = Date.now();
      const ragSig =
        meta
          ? `${meta.lat.toFixed(4)}|${meta.lng.toFixed(4)}|${Math.round(meta.speedKmh)}|${Math.round(meta.headingDeg)}|${meta.ringCount}|${topk?.length ?? 0}`
          : `?|?|?|?|?|${topk?.length ?? 0}`;

      if (now - lastRagAtRef.current > 1200 && ragSig !== lastRagSigRef.current) {
        lastRagAtRef.current = now;
        lastRagSigRef.current = ragSig;

        if (meta) {
          pushLog(
            "RAG",
            `lat=${meta.lat.toFixed(5)}, lng=${meta.lng.toFixed(5)}, v=${Math.round(meta.speedKmh)}km/h, hdg=${Math.round(meta.headingDeg)}°, rain=${meta.isRain ? "yes" : "no"}, cells=${meta.ringCount} (now:${meta.ringNow}, ahead:${meta.ringAhead}), topk=${topk?.length ?? 0}`
          );
        } else {
          pushLog("RAG", `cells=?, topk=${topk?.length ?? 0}`);
        }
      }

      if (!topk?.length) return;

      // speak with per-class cooldown
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
      } catch {/* no-op */}
      speakCooldownRef.current[key] = Date.now();
    };

    return () => { 
      if (ragRef.current) {
        ragRef.current.terminate(); 
        ragRef.current = null; 
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // observe visibility — activate only when ≥50% in view
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

  // wheel handler (local to this section, only active when copilot is running)
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

  // keyboard ↑/↓ support (optional)
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
  className="relative mx-auto mt-28 grid w-full max-w-6xl grid-cols-1 gap-10 rounded-2xl bg-gradient-to-br from-slate-900/60 to-slate-950/80 p-8 ring-1 ring-white/10 backdrop-blur-xl md:grid-cols-2"
  style={{ scrollMarginTop: "96px", overscrollBehavior: "contain" }}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5" />
      
      {/* Left text column */}
      <div className="relative z-10">
        <h2 className="text-5xl font-semibold tracking-tight text-white md:text-6xl">
          Contextual <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Awareness</span>
        </h2>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
          As you <b className="text-cyan-300">scroll inside this section</b>, the co-pilot scrubs a short route in
          Bengaluru, recalls nearby hazards from memory, and <b className="text-emerald-300">speaks before</b> you reach them.
          Scroll up to go back. Scrolling outside this section stops the demo.
        </p>

        {/* Start/Stop Copilot Button */}
        <div className="mt-6 flex items-center gap-4">
          {!copilotRunning ? (
            <button
              onClick={handleStartCopilot}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:scale-105"
            >
              Start Copilot
            </button>
          ) : (
            <button
              onClick={handleStopCopilot}
              className="rounded-xl bg-gradient-to-r from-red-500 to-orange-500 px-6 py-3 font-semibold text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all hover:scale-105"
            >
              Stop Copilot
            </button>
          )}
        </div>

        {/* Enhanced terminal-style console */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 shadow-2xl backdrop-blur-lg">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <span className="text-sm font-medium text-slate-300">Copilot Console</span>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${active ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
              <span className={`text-xs font-medium ${active ? "text-emerald-400" : "text-slate-500"}`}>
                {active ? "LIVE" : "IDLE"}
              </span>
            </div>
          </div>
          <div className="h-48 max-h-48 overflow-hidden px-4 py-3 font-mono text-[13px] leading-6 text-slate-200 flex flex-col justify-end bg-gradient-to-b from-slate-900/50 to-slate-900/80">
            {log.length === 0 ? (
              <div className="text-slate-500 italic">Waiting for scroll events…</div>
            ) : (
              log.slice(-24).map((l, i) => (
                <div key={i} className="whitespace-pre">
                  <span className="text-slate-400">{l.t}</span>{" "}
                  <span
                    className={
                      `inline-block rounded-lg px-2 py-1 text-xs font-medium transition-all duration-200 ${
                        l.tag === "RAG"
                          ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30"
                          : l.tag === "TTS"
                          ? "bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/30"
                          : l.tag === "DB"
                          ? "bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/30"
                          : l.tag === "V2X"
                          ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30"
                          : "bg-fuchsia-500/20 text-fuchsia-300 ring-1 ring-fuchsia-500/30"
                      }`
                    }
                  >
                    {l.tag}
                  </span>{" "}
                  {l.text}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right map card */}
      <div className="relative">
        {/* Enhanced glow effects */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10 blur-2xl" />
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/70 p-2 shadow-2xl backdrop-blur-lg">
          <div className="h-[520px] w-full overflow-hidden rounded-xl">
            <MapCanvas
              pos={pos}
              onPosChange={setPos}
              hazards={hazards}
              follow={true}
              zoom={15}
              // Remove hazardPulse prop since MapCanvas doesn't support it yet
            />
          </div>
        </div>
        
        {/* Enhanced status indicator */}
        <div className={`pointer-events-none absolute right-4 top-4 rounded-full px-4 py-2 text-sm font-medium backdrop-blur-lg transition-all duration-300 ${
          active 
            ? "bg-emerald-500/20 text-emerald-300 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/10" 
            : "bg-slate-500/20 text-slate-400 ring-1 ring-slate-500/30"
        }`}>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${active ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`} />
            {active ? "Interactive • Scroll to drive" : "Scroll into view"}
          </div>
        </div>

        {/* Hazard legend */}
        <div className="pointer-events-none absolute left-4 bottom-4 rounded-xl bg-black/60 backdrop-blur-lg px-4 py-3 text-xs text-slate-300 ring-1 ring-white/10">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
            <span>Active Hazards</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <div className="h-2 w-2 rounded-full bg-cyan-500" />
            <span>Your Position</span>
          </div>
        </div>
      </div>
    </section>
  );
}