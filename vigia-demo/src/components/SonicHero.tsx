"use client";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

function Bars({ playing }: { playing: boolean }) {
  const [vals, setVals] = useState<number[]>(Array.from({ length: 24 }, (_, i) => (i%5)+2));
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setVals(v => v.map((_, i) => 2 + Math.floor(8*Math.random() * Math.exp(-Math.abs(i-12)/12))));
    }, 120);
    return () => clearInterval(t);
  }, [playing]);
  return (
    <div className="flex h-28 items-end gap-[6px]">
      {vals.map((h, i) => (
        <div key={i} className="w-1.5 rounded-t-full bg-gradient-to-t from-sky-400 via-cyan-300 to-white"
             style={{ height: `${8 + h*6}px`, transition: "height .12s ease" }}/>
      ))}
    </div>
  );
}

export default function SonicHero() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) { a.play(); setPlaying(true); }
    else { a.pause(); setPlaying(false); }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
      <div className="bg-grid absolute inset-0 opacity-[.35]"/>
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 md:grid-cols-2">
        <div>
          <motion.h1
            initial={{ opacity:0, y: 10 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:.6, ease:"easeOut" }}
            className="text-4xl md:text-6xl font-semibold tracking-tight text-white"
          >
            Real-time Road Intelligence <span className="bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">on the edge</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity:0, y: 10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.1, duration:.6 }}
            className="mt-4 text-lg text-white/70"
          >
            Low-latency audio understanding, hazard memory, and a generative co-pilot that speaks before trouble.
          </motion.p>

          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.2 }}>
            <div className="mt-8 flex items-center gap-3">
              <a href="/copilot" className="rounded-lg bg-white px-4 py-2.5 text-slate-900 font-medium hover:bg-white/90">Try the Copilot</a>
              <a href="/docs" className="rounded-lg border border-white/20 px-4 py-2.5 text-white/90 hover:bg-white/5">Read the docs</a>
            </div>
          </motion.div>

          <div className="mt-10 text-white/60 text-sm">Trusted by teams building safer mobility</div>
          <div className="mt-4 flex flex-wrap items-center gap-6 opacity-80">
            <div className="h-7 w-24 rounded-md bg-white/10 shimmer"/>
            <div className="h-7 w-24 rounded-md bg-white/10 shimmer"/>
            <div className="h-7 w-24 rounded-md bg-white/10 shimmer"/>
          </div>
        </div>

        {/* Right: glossy player + bars */}
        <motion.div
          initial={{ opacity:0, y: 10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.15, duration:.6 }}
          className="relative card-glass p-6"
        >
          <div className="text-white/80 text-sm mb-3">Live detection preview</div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-6">
            <Bars playing={playing}/>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="text-white/70 text-sm">Edge model • 12 ms avg latency</div>
            <button
              onClick={toggle}
              className={clsx(
                "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium",
                playing ? "bg-red-500/20 text-red-300 border border-red-300/30" : "bg-emerald-500/20 text-emerald-300 border border-emerald-300/30"
              )}
            >
              {playing ? "Pause" : "Play"} demo
            </button>
          </div>
          <audio ref={audioRef} src="/audio/demo.mp3" preload="auto" />
        </motion.div>
      </div>
    </section>
  );
}