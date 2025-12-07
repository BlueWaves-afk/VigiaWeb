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
  { title: "API", gradient: "from-[#0b3c45] via-[#0e2e36] to-[#0b1820]" },
  { title: "SDK", gradient: "from-[#3b3a1e] via-[#2e2d19] to-[#1a1911]" },
  { title: "SECURITY", gradient: "from-[#0e2440] via-[#0c1b2d] to-[#0a1524]" },
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
      className="mt-1 shrink-0 rounded-lg bg-white/10 p-2 text-sky-300 ring-1 ring-white/15 transition-all group-hover:bg-white/15 group-hover:text-sky-200 group-hover:ring-white/25 light:bg-slate-100 light:text-cyan-600 light:ring-slate-200 light:group-hover:bg-slate-200 light:group-hover:text-cyan-700"
    >
      {icon}
    </motion.div>
    <div>
      <div className="font-medium text-white transition-colors group-hover:text-sky-200 light:text-slate-900 light:group-hover:text-cyan-700">{title}</div>
      <p className="text-sm text-slate-300/90 light:text-slate-600">{body}</p>
    </div>
  </motion.div>
);

const Badge = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    whileInView={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.05, y: -2 }}
    transition={{ duration: 0.2 }}
    className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-white/20 light:bg-slate-100 light:text-slate-700 light:ring-slate-200 light:hover:bg-slate-200"
  >
    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 light:text-emerald-600" />
    {children}
  </motion.div>
);

const MosaicTile = ({ t, i }: { t: Tile; i: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
    whileHover={{ scale: 1.02, y: -2 }}
    className={`group relative h-full overflow-hidden border border-slate-700/60 bg-gradient-to-br ${t.gradient} p-4 transition-all hover:border-slate-600/80 light:border-slate-200 light:from-slate-50 light:via-white light:to-slate-100 light:hover:border-slate-300`}
  >

    <div className="relative">
      <div className="text-[11px] tracking-wider text-slate-300/80 transition-colors group-hover:text-slate-200 light:text-slate-700 light:group-hover:text-slate-900">
        {t.title}
      </div>
      <div className="mt-3 flex h-full items-center justify-center opacity-70 min-h-[64px] transition-all group-hover:opacity-100 group-hover:scale-110">
        {t.icon ?? <TerminalSquare className="h-8 w-8 text-white/40 light:text-slate-600" />}
      </div>
    </div>
  </motion.div>
);

export default function DeveloperSection() {
  return (
    <section
      id="developer"
      className="relative overflow-hidden bg-[#0B1120] light:bg-white"
      style={{ scrollMarginTop: 96 }}
    >
      {/* Fine grid background pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-30 light:opacity-20">
        <div className="h-full w-full bg-[linear-gradient(to_right,rgba(56,189,248,.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(56,189,248,.06)_1px,transparent_1px)] bg-[size:4px_4px] light:bg-[linear-gradient(to_right,rgba(14,165,233,.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(14,165,233,.08)_1px,transparent_1px)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        {/* Main content card */}
        <div className="border border-slate-700/60 bg-gradient-to-br from-slate-900/40 to-slate-950/40 p-12 backdrop-blur-sm light:border-slate-200 light:from-white/40 light:to-slate-50/40">
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
                <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent light:text-slate-900 light:bg-none">
                  Developer-first,
                </span>
                <br className="hidden md:block" />
                <span className="bg-gradient-to-r from-sky-200 via-blue-300 to-cyan-300 bg-clip-text text-transparent light:text-slate-800 light:bg-none">
                  enterprise-ready
                </span>
              </motion.h3>

              <motion.p
                variants={itemVariants}
                className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300 light:text-slate-600"
              >
                VIGIA is built for rapid prototyping and seamless integration. Developers trust it
                for secure, compliant, production-ready performance.
              </motion.p>

              <motion.div variants={itemVariants} className="mt-8">
                <motion.a
                  href="/docs"
                  whileHover={{ scale: 1.02, x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  className="group inline-flex items-center gap-2 rounded-full border border-slate-600 bg-white px-8 py-3.5 font-semibold text-slate-900 shadow-lg transition-all hover:bg-slate-100 light:border-slate-300 light:bg-slate-900 light:text-white light:hover:bg-slate-800"
                >
                  Build with VIGIA
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </motion.a>
              </motion.div>

              <motion.div
                variants={containerVariants}
                className="mt-8 divide-y divide-white/10 border-y border-white/10 light:divide-slate-200 light:border-slate-200"
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
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="hidden md:block mb-6 overflow-hidden border border-slate-700/60 bg-gradient-to-br from-slate-900/40 to-slate-950/40 group backdrop-blur-sm light:border-slate-200 light:from-white/40 light:to-slate-50/40"
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
                    t={{ ...tiles[2], icon: <Code2 className="h-9 w-9 text-white/50 light:text-slate-600" /> }}
                    i={2}
                  />
                </div>
                <div className="col-span-2 row-span-2">
                  <MosaicTile
                    t={{ ...tiles[3], icon: <Cpu className="h-9 w-9 text-white/50 light:text-slate-600" /> }}
                    i={3}
                  />
                </div>

                {/* Bottom: one 3x2 security tile + 1x2 accent */}
                <div className="col-span-3 row-span-2">
                  <MosaicTile
                    t={{ ...tiles[4], icon: <Shield className="h-9 w-9 text-white/50 light:text-slate-600" /> }}
                    i={4}
                  />
                </div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
                  whileHover={{ x: 2, scale: 1.02 }}
                  className="col-span-1 row-span-2 border border-slate-700/60 bg-gradient-to-br from-slate-900/40 to-slate-950/40 backdrop-blur-sm transition-all hover:border-slate-600/80 light:border-slate-200 light:from-white/40 light:to-slate-50/40 light:hover:border-slate-300"
                />
              </div>
            </div>
          </div>

          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            className="mt-12 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent origin-center light:via-slate-200"
          />
        </div>
      </div>
    </section>
  );
}