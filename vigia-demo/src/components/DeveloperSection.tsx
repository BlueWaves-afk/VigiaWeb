// src/components/DeveloperSection.tsx
"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { CheckCircle2, Code2, Cpu, FlaskConical, Shield, TerminalSquare } from "lucide-react";

type Tile = {
  title: string;
  gradient: string;
  icon?: React.ReactNode;
};

const tiles: Tile[] = [
  { title: "COMPLIANCE", gradient: "from-[#3a2b64] via-[#23243d] to-[#171827]" },
  { title: "PLAYGROUND", gradient: "from-[#39253d] via-[#2a2537] to-[#171827]" },
  { title: "API",        gradient: "from-[#0b3c45] via-[#0e2e36] to-[#0b1820]" },
  { title: "SDK",        gradient: "from-[#3b3a1e] via-[#2e2d19] to-[#1a1911]" },
  { title: "SECURITY",   gradient: "from-[#0e2440] via-[#0c1b2d] to-[#0a1524]" },
];

const FeatureRow = ({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) => (
  <div className="flex gap-4 py-4">
    <div className="mt-1 shrink-0 rounded-lg bg-white/10 p-2 text-sky-300 ring-1 ring-white/15">{icon}</div>
    <div>
      <div className="font-medium text-white">{title}</div>
      <p className="text-sm text-slate-300/90">{body}</p>
    </div>
  </div>
);

const Badge = ({ children }: { children: React.ReactNode }) => (
  <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300 ring-1 ring-white/10">
    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
    {children}
  </div>
);

const MosaicTile = ({ t, i }: { t: Tile; i: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay: i * 0.06, ease: "easeOut" }}
    whileHover={{ scale: 1.015 }}
    className={`relative h-full overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br ${t.gradient} p-4`}
  >
    <div className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(80%_60%_at_80%_0%,rgba(255,255,255,0.12),transparent_55%)]" />
    <div className="text-[11px] tracking-wider text-slate-300/80">{t.title}</div>
    {/* was h-28 — remove the fixed height so the tile can fill rows exactly */}
    <div className="mt-3 flex h-full items-center justify-center opacity-70 min-h-[64px]">
      {t.icon ?? <TerminalSquare className="h-8 w-8 text-white/40" />}
    </div>
  </motion.div>
);

export default function DeveloperSection() {
  return (
    <section
      id="developer"
      className="relative mx-auto mt-28 w-full max-w-6xl rounded-2xl bg-black/30 p-6 ring-1 ring-white/10 backdrop-blur md:p-10"
      style={{ scrollMarginTop: 96 }}
    >
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        {/* LEFT */}
        <div>
          <h3 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Developer-first, <br className="hidden md:block" /> enterprise-ready
          </h3>

          <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-300">
            VIGIA is built for rapid prototyping and seamless integration. Developers trust it
            for secure, compliant, production-ready performance.
          </p>

          <div className="mt-6">
            <a
              href="/docs"
              className="inline-flex items-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-100"
            >
              Build with VIGIA
            </a>
          </div>

          <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
            <FeatureRow
              icon={<Code2 className="h-5 w-5" />}
              title="API"
              body="Integrate VIGIA directly into your product with simple, well-documented endpoints."
            />
            <FeatureRow
              icon={<Cpu className="h-5 w-5" />}
              title="SDK"
              body="Ship faster with pre-built SDKs in your favorite languages—browser, Node, and more."
            />
            <FeatureRow
              icon={<FlaskConical className="h-5 w-5" />}
              title="Playground"
              body="Experiment in your browser. Tune prompts/voices and see results live."
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Badge>SOC 2 Type II</Badge>
            <Badge>HIPAA</Badge>
            <Badge>PCI Level 1</Badge>
            <Badge>Reliable uptime</Badge>
          </div>
        </div>

        {/* RIGHT MOSAIC (width-capped, no gaps) */}
            <div className="md:max-w-[560px] w-full ml-auto">
            {/* desktop-only image above the tiles */}
            <div className="hidden md:block mb-4 overflow-hidden rounded-xl border border-white/10">
                {/* Use Next/Image if you have it */}
                <img
                src="/images/road-hero.jpg"   // <-- put your picture in public/images/road-hero.jpg
                alt="VIGIA developer features"
                className="h-40 w-full object-cover opacity-80"
                loading="lazy"
                />
            </div>

            {/* grid with fixed row height to eliminate gaps */}
            <div className="grid grid-cols-4 auto-rows-[70px] gap-3">
                {/* Top row: two 2x2 tiles */}
                <div className="col-span-2 row-span-2">
                <MosaicTile t={tiles[0]} i={0} />
                </div>
                <div className="col-span-2 row-span-2">
                <MosaicTile t={tiles[1]} i={1} />
                </div>

                {/* Middle row: two 2x2 tiles */}
                <div className="col-span-2 row-span-2">
                <MosaicTile
                    t={{ ...tiles[2], icon: <Code2 className="h-9 w-9 text-white/50" /> }}
                    i={2}
                />
                </div>
                <div className="col-span-2 row-span-2">
                <MosaicTile
                    t={{ ...tiles[3], icon: <Cpu className="h-9 w-9 text-white/50" /> }}
                    i={3}
                />
                </div>

                {/* Bottom: one 3x2 security tile + 1x2 accent */}
                <div className="col-span-3 row-span-2">
                <MosaicTile
                    t={{ ...tiles[4], icon: <Shield className="h-9 w-9 text-white/50" /> }}
                    i={4}
                />
                </div>
                <motion.div
                whileHover={{ x: 2 }}
                className="col-span-1 row-span-2 rounded-xl border border-white/10 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.06)_0px,rgba(255,255,255,0.06)_2px,transparent_2px,transparent_6px)]"
                />
            </div>
            </div>
      </div>

      <div className="mt-8 h-px w-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)]" />
    </section>
  );
}