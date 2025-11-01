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

type LogTag = "SYS" | "RAG" | "TTS";
type LogLine = { t: string; tag: LogTag; text: string };

export default function SonicDemo() {
  // Bengaluru defaults
  const [pos, setPos] = useState({ lat: 12.9716, lng: 77.5946, headingDeg: 80, speedKmh: 35 });
  const [hazards, setHazards] = useState<GeoJSON.FeatureCollection | undefined>();
  const [log, setLog] = useState<LogLine[]>([]);
  const [active, setActive] = useState(false);

  const sectionRef = useRef<HTMLDivElement | null>(null);
  const ragRef = useRef<Worker | null>(null);
  const speakCooldownRef = useRef<Record<string, number>>({});
  const posRef = useRef(pos);
  const inViewRef = useRef(false);

  // RAG log throttling / de-dupe
  const lastRagAtRef = useRef(0);
  const lastRagSigRef = useRef<string>("");

  useEffect(() => { posRef.current = pos; }, [pos]);

  const pushLog = useCallback((tag: LogTag, text: string) => {
    const t = new Date().toLocaleTimeString();
    setLog(prev => [...prev.slice(-24), { t, tag, text }]); // keep last 24, no scrollbars
  }, []);

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

    return () => { w.terminate(); ragRef.current = null; };
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
        if (v) {
          pushLog("SYS", "Sonic demo activated (scroll to drive)");
          ragRef.current?.postMessage({ ...posRef.current, isRain: false, city: "bangalore", k: 3 });
        } else {
          window.speechSynthesis.cancel();
          pushLog("SYS", "Sonic demo deactivated");
        }
      },
      { root: null, threshold: 0.5 }
    );
    obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, [pushLog]);

  // wheel handler (local to this section)
  const onWheel = useCallback((e: React.WheelEvent) => {
    if (!inViewRef.current) return;
    e.preventDefault(); // keep scroll inside this demo

    const meters = Math.max(-50, Math.min(50, -e.deltaY * 0.6));
    const { dLat, dLng } = metersToDelta(posRef.current.lat, meters, posRef.current.headingDeg);
    const next = { ...posRef.current, lat: posRef.current.lat + dLat, lng: posRef.current.lng + dLng };
    setPos(next);

    ragRef.current?.postMessage({ ...next, isRain: false, city: "bangalore", k: 3 });
  }, []);

  // keyboard ↑/↓ support (optional)
  const onKey = useCallback((e: React.KeyboardEvent) => {
    if (!inViewRef.current) return;
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const meters = e.key === "ArrowUp" ? 24 : -24;
    const { dLat, dLng } = metersToDelta(posRef.current.lat, meters, posRef.current.headingDeg);
    const next = { ...posRef.current, lat: posRef.current.lat + dLat, lng: posRef.current.lng + dLng };
    setPos(next);
    ragRef.current?.postMessage({ ...next, isRain: false, city: "bangalore", k: 3 });
  }, []);

  return (
    <section
      ref={sectionRef}
      onWheel={onWheel}
      onKeyDown={onKey}
      tabIndex={0}
      className="relative mx-auto mt-28 grid w-full max-w-6xl grid-cols-1 gap-10 rounded-2xl bg-black/30 p-6 ring-1 ring-white/10 backdrop-blur md:grid-cols-2"
      style={{ scrollMarginTop: "96px" }}
    >
      {/* Left text column */}
      <div className="relative z-10">
        <h2 className="text-5xl font-semibold tracking-tight text-white md:text-6xl">
          Contextual <span className="text-white/60">Awareness</span>
        </h2>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
          As you <b>scroll inside this section</b>, the co-pilot scrubs a short route in
          Bengaluru, recalls nearby hazards from memory, and <b>speaks before</b> you reach them.
          Scroll up to go back. Scrolling outside this section stops the demo.
        </p>

        {/* Terminal-style console (no scrollbars; newest lines kept by trimming) */}
        <div className="mt-8 overflow-hidden rounded-xl border border-white/10 bg-slate-900/70 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-xs uppercase tracking-wider text-slate-400">
            <span>Copilot Console</span>
            <span className={active ? "text-emerald-400" : "text-slate-500"}>
              {active ? "live" : "idle"}
            </span>
          </div>
                <div
            className="h-48 max-h-48 overflow-hidden px-3 py-2 font-mono text-[12px] leading-5 text-slate-200
                        flex flex-col justify-end"
            >
            {log.length === 0 ? (
                <div className="text-slate-500">Waiting for scroll events…</div>
            ) : (
                log.slice(-24).map((l, i) => (
                <div key={i} className="whitespace-pre">
                    <span className="text-slate-500">{l.t}</span>{" "}
                    <span
                    className={
                        "inline-block rounded px-1.5 py-[1px] " +
                        (l.tag === "RAG"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : l.tag === "TTS"
                        ? "bg-sky-500/15 text-sky-300"
                        : "bg-fuchsia-500/15 text-fuchsia-300")
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
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 to-white/0 blur-xl" />
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-1 shadow-2xl">
          <div className="h-[520px] w-full overflow-hidden rounded-xl">
            <MapCanvas
              pos={pos}
              onPosChange={setPos}
              hazards={hazards}
              follow={true}  /* recenters on the blue pin */
              zoom={15}
            />
          </div>
        </div>
        <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/40">
          {active ? "Interactive • scroll to drive" : "Scroll into view to start"}
        </div>
      </div>
    </section>
  );
}