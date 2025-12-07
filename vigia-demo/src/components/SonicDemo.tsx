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
  const demoCardsRef = useRef<HTMLDivElement | null>(null);
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
      } catch {/* no-op */ }
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

    // Smoothly scroll terminal/map pair into view so controls appear immediately
    requestAnimationFrame(() => {
      const cardsEl = demoCardsRef.current;
      if (!cardsEl) return;
      const rect = cardsEl.getBoundingClientRect();
      const top = rect.top + window.scrollY - 120; // keep hero partially visible
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
      className="relative min-h-screen overflow-hidden bg-[#0B1120] pb-24 light:bg-white"
      style={{ scrollMarginTop: "96px", overscrollBehavior: "contain" }}
    >
      {/* Fine grid background pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-30 light:opacity-20">
        <div className="h-full w-full bg-[linear-gradient(to_right,rgba(56,189,248,.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(56,189,248,.06)_1px,transparent_1px)] bg-[size:4px_4px] light:bg-[linear-gradient(to_right,rgba(14,165,233,.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(14,165,233,.08)_1px,transparent_1px)]" />
      </div>


      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main content card */}
        <div className="border border-slate-700/60 bg-gradient-to-br from-slate-900/40 to-slate-950/40 p-12 backdrop-blur-sm light:border-slate-200 light:from-white/40 light:to-slate-50/40">
          {/* Gradient accent on hover - hide in light mode */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 opacity-0 transition-opacity hover:opacity-100 light:hidden" />

          <div className="relative">
            {/* Eyebrow */}
            <div className="mb-6">
              <span className="inline-block text-sm font-semibold uppercase tracking-wider text-slate-400 light:text-slate-600">
                INTERACTIVE DEMO
              </span>
            </div>

            {/* Main headline */}
            <h2 className="text-5xl font-normal leading-tight tracking-tight text-white md:text-6xl lg:text-7xl light:text-slate-900">
              Contextual{" "}
              <span className="text-cyan-400 light:text-cyan-600">Awareness</span>
            </h2>

            {/* Description */}
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-400 light:text-slate-600">
              As you <span className="font-semibold text-cyan-400 light:text-cyan-600">scroll inside this section</span>, the co-pilot scrubs a short route in
              Bengaluru, recalls nearby hazards from memory, and <span className="font-semibold text-emerald-400 light:text-emerald-600">speaks before</span> you reach them.
              Scroll up to go back. Scrolling outside this section stops the demo.
            </p>

            {/* Start/Stop Copilot Button */}
            <div className="mt-8 flex items-center gap-4">
              {!copilotRunning ? (
                <button
                  onClick={handleStartCopilot}
                  className="rounded-full bg-white px-8 py-3.5 text-base font-semibold text-slate-900 shadow-lg transition-all hover:bg-slate-100 light:bg-slate-900 light:text-white light:hover:bg-slate-800"
                  style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}
                >
                  Start Copilot
                </button>
              ) : (
                <button
                  onClick={handleStopCopilot}
                  className="rounded-full border border-slate-700 bg-slate-900/50 px-8 py-3.5 text-base font-semibold text-white transition-all hover:border-slate-600 hover:bg-slate-800/50 light:border-slate-300 light:bg-white light:text-slate-900 light:hover:border-slate-400 light:hover:bg-slate-50"
                  style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}
                >
                  Stop Copilot
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Grid connector between sections - full width */}
        <div className="relative h-20 w-full overflow-hidden border-x border-slate-700/60 bg-[#0B1120] light:border-slate-200 light:bg-white">
          <div className="absolute inset-0 flex items-center justify-between">
            {Array.from({ length: 100 }).map((_, i) => (
              <div
                key={i}
                className="h-full w-px bg-slate-800/40 light:bg-slate-200/60"
              />
            ))}
          </div>
        </div>

        {/* Demo cards grid: keep terminal and map side-by-side and visible */}
        <div ref={demoCardsRef} className="-mt-4 grid gap-0 md:grid-cols-2">
          {/* Left card - Terminal (sticky on desktop) */}
          <div className="group relative overflow-hidden border border-slate-700/60 bg-gradient-to-br from-slate-900/40 to-slate-950/40 backdrop-blur-sm transition-all hover:border-slate-600/80 md:sticky md:top-20 light:border-slate-200 light:from-white/40 light:to-slate-50/40 light:hover:border-slate-300">
            {/* Gradient accent on hover - hide in light mode */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5 opacity-0 transition-opacity group-hover:opacity-100 light:hidden" />

            <div className="relative">
              {/* Developer-style terminal header */}
              <div className="flex flex-wrap items-center gap-3 border-b border-slate-800/80 bg-slate-950/80 px-5 py-3 light:border-slate-200 light:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500/80" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                    <div className="h-3 w-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-xs font-medium text-slate-400 light:text-slate-600" style={{ fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace' }}>
                    copilot@vigia:~$
                  </span>
                </div>
                <div className="ml-auto flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${active ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                    <span className={`text-xs font-semibold uppercase tracking-wider ${active ? "text-emerald-500" : "text-slate-500"}`} style={{ fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace' }}>
                      {active ? "LIVE" : "IDLE"}
                    </span>
                  </div>
                  {!copilotRunning ? (
                    <button
                      onClick={handleStartCopilot}
                      className="rounded-full bg-emerald-500/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-950 transition hover:bg-emerald-400"
                      style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}
                    >
                      Start
                    </button>
                  ) : (
                    <button
                      onClick={handleStopCopilot}
                      className="rounded-full border border-rose-400/50 bg-rose-500/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-rose-400"
                      style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}
                    >
                      Stop
                    </button>
                  )}
                </div>
              </div>

              {/* Terminal content */}
              <div
                className="h-[68vh] max-h-[720px] overflow-hidden bg-black/40 px-5 py-4 font-mono text-xs leading-6 text-slate-300 light:bg-slate-50 light:text-slate-700"
                style={{ fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace' }}
              >
                <div className="flex h-full flex-col justify-end">
                  {log.length === 0 ? (
                    <div className="text-slate-600 italic light:text-slate-500">Waiting for scroll events…</div>
                  ) : (
                    log.slice(-24).map((l, i) => (
                      <div key={i} className="mb-1">
                        <span className="text-slate-600 light:text-slate-500">[{l.t}]</span>{" "}
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${l.tag === "RAG"
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
          </div>

          {/* Right card - Map (sticky on desktop) */}
          <div className="group relative overflow-hidden border border-slate-700/60 bg-gradient-to-br from-slate-900/40 to-slate-950/40 backdrop-blur-sm transition-all hover:border-slate-600/80 md:sticky md:top-20 light:border-slate-200 light:from-white/40 light:to-slate-50/40 light:hover:border-slate-300">
            {/* Gradient accent on hover - hide in light mode */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 opacity-0 transition-opacity group-hover:opacity-100 light:hidden" />

            <div className="relative p-3">
              <div className="overflow-hidden rounded-xl border border-slate-800 bg-black shadow-2xl light:border-slate-200">
                <div className="h-[68vh] max-h-[720px] w-full">
                  <MapCanvas
                    pos={pos}
                    onPosChange={setPos}
                    hazards={hazards}
                    follow={true}
                    zoom={15}
                  />
                </div>
              </div>

              {/* Enhanced status indicator */}
              <div className={`pointer-events-none absolute right-6 top-6 rounded-full px-4 py-2 text-sm font-medium backdrop-blur-lg transition-all duration-300 ${active
                ? "bg-emerald-500/20 text-emerald-300 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/10"
                : "bg-slate-500/20 text-slate-400 ring-1 ring-slate-500/30"
                }`}>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${active ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`} />
                  {active ? "Interactive • Scroll to drive" : "Scroll into view"}
                </div>
              </div>

              {/* Hazard legend */}
              <div className="pointer-events-none absolute left-6 bottom-6 rounded-xl bg-black/80 backdrop-blur-lg px-4 py-3 text-xs text-slate-300 ring-1 ring-slate-700 light:bg-white/90 light:text-slate-700 light:ring-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
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
      </div>
    </section>
  );
}