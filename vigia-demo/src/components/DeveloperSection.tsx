"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Code2,
  Cpu,
  FlaskConical,
  Shield,
  TerminalSquare,
  ArrowRight,
} from "lucide-react";

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
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
};

const FeatureRow = ({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) => (
  <motion.div
    variants={itemVariants}
    whileHover={{ x: 3 }}
    transition={{ duration: 0.18 }}
    className="group flex gap-4 py-4"
  >
    <motion.div
      whileHover={{ scale: 1.06, rotate: 3 }}
      transition={{ type: "spring", stiffness: 380, damping: 18 }}
      className="mt-1 shrink-0 rounded-lg bg-white/10 p-2 text-cyan-300 ring-1 ring-white/15 transition-all group-hover:bg-white/15 group-hover:text-cyan-200 group-hover:ring-white/25 light:bg-slate-100 light:text-cyan-600 light:ring-slate-200 light:group-hover:bg-slate-200 light:group-hover:text-cyan-700"
    >
      {icon}
    </motion.div>
    <div>
      <div className="text-sm font-medium text-white transition-colors group-hover:text-cyan-200 light:text-slate-900 light:group-hover:text-cyan-700">
        {title}
      </div>
      <p className="mt-1 text-xs md:text-sm text-slate-300/90 light:text-slate-600">
        {body}
      </p>
    </div>
  </motion.div>
);

const Badge = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.96 }}
    whileInView={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.04, y: -1 }}
    transition={{ duration: 0.18 }}
    className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[11px] text-slate-300 ring-1 ring-white/10 light:bg-slate-100 light:text-slate-700 light:ring-slate-200"
  >
    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 light:text-emerald-600" />
    {children}
  </motion.div>
);

const MosaicTile = ({ t, i }: { t: Tile; i: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 16, scale: 0.96 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    viewport={{ once: true, amount: 0.4 }}
    transition={{ duration: 0.4, delay: i * 0.08, ease: "easeOut" }}
    whileHover={{ scale: 1.02, y: -2 }}
    className={`group relative h-full overflow-hidden rounded-xl border border-slate-800/60 bg-gradient-to-br ${t.gradient} p-4 transition-all hover:border-cyan-500/60 light:border-slate-200 light:from-slate-50 light:via-white light:to-slate-100 light:hover:border-cyan-500/60`}
  >
    <div className="relative">
      <div className="text-[10px] tracking-[0.18em] text-slate-300/80 transition-colors group-hover:text-slate-100 light:text-slate-700 light:group-hover:text-slate-900">
        {t.title}
      </div>
      <div className="mt-3 flex min-h-[64px] items-center justify-center opacity-70 transition-all group-hover:scale-110 group-hover:opacity-100">
        {t.icon ?? (
          <TerminalSquare className="h-8 w-8 text-white/40 light:text-slate-600" />
        )}
      </div>
    </div>
  </motion.div>
);

export default function DeveloperSection() {
  return (
    <section
      id="developer"
      className="relative py-24 lg:py-28"
      style={{ scrollMarginTop: 96 }}
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-xs font-medium tracking-[0.22em] text-cyan-400 light:text-blue-600">
            FOR DEVELOPERS
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl lg:text-5xl light:text-slate-900">
            Developer‑first,{" "}
            <span className="text-cyan-400 light:text-cyan-600">
              enterprise‑ready.
            </span>
          </h2>
          <p className="mt-4 max-w-xl text-sm md:text-base leading-relaxed text-slate-400 light:text-slate-600">
            VIGIA is built for rapid prototyping and clean production
            integrations—APIs, SDKs, and a playground that ship with
            compliance baked‑in.
          </p>
        </div>

        {/* Main card */}
        <div className="card-glass border-slate-800/60 bg-slate-950/80 p-6 md:p-10 light:border-slate-200 light:bg-white">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
            {/* Left */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={containerVariants}
            >
              <motion.p
                variants={itemVariants}
                className="text-sm md:text-base text-slate-300 light:text-slate-600"
              >
                Ship edge‑ready hazard intelligence without wrestling infra.
                Start in the browser, then graduate to SDKs and managed APIs
                when you’re ready.
              </motion.p>

              <motion.div variants={itemVariants} className="mt-6">
                <motion.a
                  href="/docs"
                  whileHover={{ scale: 1.03, x: 2 }}
                  whileTap={{ scale: 0.97 }}
                  className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-slate-900 shadow-lg transition-all hover:bg-slate-100 light:bg-slate-900 light:text-white light:hover:bg-slate-800"
                >
                  Build with VIGIA
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </motion.a>
              </motion.div>

              <motion.div
                variants={containerVariants}
                className="mt-8 divide-y divide-slate-800/70 border-y border-slate-800/70 light:divide-slate-200 light:border-slate-200"
              >
                <FeatureRow
                  icon={<Code2 className="h-4 w-4" />}
                  title="API"
                  body="Simple, stable endpoints for ingestion, hazard memory, and realtime alerts."
                />
                <FeatureRow
                  icon={<Cpu className="h-4 w-4" />}
                  title="SDKs"
                  body="Browser and Node SDKs that hide ONNXRuntime/WebGPU complexity."
                />
                <FeatureRow
                  icon={<FlaskConical className="h-4 w-4" />}
                  title="Playground"
                  body="Tune prompts, voices, and routes in your browser before touching code."
                />
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.4 }}
                variants={containerVariants}
                className="mt-6 flex flex-wrap gap-2"
              >
                <Badge>SOC 2 Type II</Badge>
                <Badge>HIPAA‑ready</Badge>
                <Badge>PCI Level 1</Badge>
                <Badge>SLO‑backed uptime</Badge>
              </motion.div>
            </motion.div>

            {/* Right – mosaic */}
            <div className="md:max-w-[560px] md:ml-auto">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5 }}
                className="mb-5 hidden overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-950/70 md:block light:border-slate-200 light:bg-slate-50"
              >
                <div className="relative">
                  <img
                    src="/images/road-hero.jpg"
                    alt="Developer console with VIGIA"
                    className="h-40 w-full object-cover opacity-85"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                </div>
              </motion.div>

              <div className="grid grid-cols-4 auto-rows-[70px] gap-3">
                <div className="col-span-2 row-span-2">
                  <MosaicTile t={tiles[0]} i={0} />
                </div>
                <div className="col-span-2 row-span-2">
                  <MosaicTile t={tiles[1]} i={1} />
                </div>

                <div className="col-span-2 row-span-2">
                  <MosaicTile
                    t={{
                      ...tiles[2],
                      icon: (
                        <Code2 className="h-8 w-8 text-white/50 light:text-slate-600" />
                      ),
                    }}
                    i={2}
                  />
                </div>
                <div className="col-span-2 row-span-2">
                  <MosaicTile
                    t={{
                      ...tiles[3],
                      icon: (
                        <Cpu className="h-8 w-8 text-white/50 light:text-slate-600" />
                      ),
                    }}
                    i={3}
                  />
                </div>

                <div className="col-span-3 row-span-2">
                  <MosaicTile
                    t={{
                      ...tiles[4],
                      icon: (
                        <Shield className="h-8 w-8 text-white/50 light:text-slate-600" />
                      ),
                    }}
                    i={4}
                  />
                </div>
                <motion.div
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  whileHover={{ x: 2, scale: 1.02 }}
                  className="col-span-1 row-span-2 rounded-xl border border-slate-800/60 bg-slate-950/70 light:border-slate-200 light:bg-slate-50"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}