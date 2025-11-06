// src/components/DeveloperSection.tsx
"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { CheckCircle2, Code2, Cpu, FlaskConical, Shield, TerminalSquare, ArrowRight } from "lucide-react";

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const FeatureRow = ({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) => (
  <motion.div
    variants={itemVariants}
    whileHover={{ x: 4 }}
    transition={{ duration: 0.2 }}
    className="group flex gap-4 py-4"
  >
    <motion.div
      whileHover={{ scale: 1.1, rotate: 5 }}
      transition={{ type: "spring" as const, stiffness: 400, damping: 10 }}
      className="mt-1 shrink-0 rounded-lg bg-white/10 p-2 text-sky-300 ring-1 ring-white/15 transition-all group-hover:bg-white/15 group-hover:text-sky-200 group-hover:ring-white/25"
    >
      {icon}
    </motion.div>
    <div>
      <div className="font-medium text-white transition-colors group-hover:text-sky-200">{title}</div>
      <p className="text-sm text-slate-300/90">{body}</p>
    </div>
  </motion.div>
);

const Badge = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    whileInView={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.05, y: -2 }}
    transition={{ duration: 0.2 }}
    className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-white/20"
  >
    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
    {children}
  </motion.div>
);

const MosaicTile = ({ t, i }: { t: Tile; i: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.4, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
    whileHover={{ scale: 1.02, y: -2 }}
    className={`group relative h-full overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br ${t.gradient} p-4 transition-all hover:border-white/20 hover:shadow-xl hover:shadow-black/20`}
  >
    <div className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(80%_60%_at_80%_0%,rgba(255,255,255,0.12),transparent_55%)] transition-opacity group-hover:opacity-80" />
    <motion.div
      initial={{ opacity: 0 }}
      whileHover={{ opacity: 0.1 }}
      className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0"
    />
    <div className="relative">
      <div className="text-[11px] tracking-wider text-slate-300/80 transition-colors group-hover:text-slate-200">
        {t.title}
      </div>
      <div className="mt-3 flex h-full items-center justify-center opacity-70 min-h-[64px] transition-all group-hover:opacity-100 group-hover:scale-110">
        {t.icon ?? <TerminalSquare className="h-8 w-8 text-white/40" />}
      </div>
    </div>
  </motion.div>
);

export default function DeveloperSection() {
  return (
    <section
      id="developer"
      className="relative mx-auto mt-28 w-full max-w-6xl rounded-2xl bg-gradient-to-br from-slate-900/60 to-slate-950/80 p-8 ring-1 ring-white/10 backdrop-blur-xl"
      style={{ scrollMarginTop: 96 }}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5" />
      
      {/* Subtle grid background */}
      <div className="pointer-events-none absolute inset-0 opacity-[.15] [mask-image:radial-gradient(60%_60%_at_50%_50%,#000_40%,transparent_100%)]">
        <div className="h-full w-full bg-[linear-gradient(to_right,rgba(148,163,184,.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,.08)_1px,transparent_1px)] bg-[size:28px_28px]" />
      </div>

      {/* "What VIGIA promises" heading */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative mb-12 text-center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 backdrop-blur-lg"
        >
          <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-sm font-medium text-cyan-300 tracking-wide">
            WHAT VIGIA PROMISES
          </span>
          <div className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
        </motion.div>
      </motion.div>

      <div className="relative grid grid-cols-1 gap-10 md:grid-cols-2">
        {/* LEFT */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          <motion.h3
            variants={itemVariants}
            transition={{ duration: 0.5, ease: "easeOut" as const }}
            className="text-4xl font-semibold tracking-tight md:text-5xl"
          >
            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Developer-first,
            </span>
            <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-sky-200 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
              enterprise-ready
            </span>
          </motion.h3>

          <motion.p
            variants={itemVariants}
            className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300"
          >
            VIGIA is built for rapid prototyping and seamless integration. Developers trust it
            for secure, compliant, production-ready performance.
          </motion.p>

          <motion.div variants={itemVariants} className="mt-8">
            <motion.a
              href="/docs"
              whileHover={{ scale: 1.02, x: 2 }}
              whileTap={{ scale: 0.98 }}
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-slate-900 shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              Build with VIGIA
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </motion.a>
          </motion.div>

          <motion.div
            variants={containerVariants}
            className="mt-8 divide-y divide-white/10 border-y border-white/10"
          >
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
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="mt-6 flex flex-wrap gap-2"
          >
            <Badge>SOC 2 Type II</Badge>
            <Badge>HIPAA</Badge>
            <Badge>PCI Level 1</Badge>
            <Badge>Reliable uptime</Badge>
          </motion.div>
        </motion.div>

        {/* RIGHT MOSAIC */}
        <div className="md:max-w-[560px] w-full ml-auto">
          {/* desktop-only image above the tiles */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden md:block mb-6 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/70 group backdrop-blur-lg"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.4 }}
              className="relative"
            >
              <img
                src="/images/road-hero.jpg"
                alt="VIGIA developer features"
                className="h-40 w-full object-cover opacity-80 transition-opacity group-hover:opacity-90"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </motion.div>
          </motion.div>

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
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              whileHover={{ x: 2, scale: 1.02 }}
              className="col-span-1 row-span-2 rounded-xl border border-white/10 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 backdrop-blur-lg transition-all hover:border-white/20"
            />
          </div>
        </div>
      </div>

      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="mt-12 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent origin-center"
      />
    </section>
  );
}