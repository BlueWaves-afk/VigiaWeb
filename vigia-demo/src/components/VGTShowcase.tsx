// components/VGTShowcase.tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.5 },
  transition: { delay, duration: 0.6, ease: "easeOut" as const },
});

const springTap = {
  whileHover: {
    y: -2,
    scale: 1.02,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
    },
  },
  whileTap: { scale: 0.98, y: 0 },
};

function StatCard({
  title,
  children,
  icon,
  delay = 0,
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      {...fadeUp(delay)}
      className="group rounded-xl border border-slate-800/60 bg-slate-950/70 p-6 backdrop-blur-md transition-all hover:border-cyan-500/60 light:border-slate-200 light:bg-white light:hover:border-blue-500/60"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/60 light:bg-slate-100">
          {icon}
        </div>
        <h4 className="text-sm font-semibold text-white light:text-slate-900">
          {title}
        </h4>
      </div>
      <div className="text-xs md:text-sm leading-relaxed text-slate-400 light:text-slate-600">
        {children}
      </div>
    </motion.div>
  );
}

export default function VGTShowcaseSection() {
  return (
    <section className="relative py-24 lg:py-28">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-xs font-medium tracking-[0.22em] text-cyan-400 light:text-blue-600">
            ECONOMICS
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl lg:text-5xl light:text-slate-900">
            VGT powers the{" "}
            <span className="text-cyan-400 light:text-cyan-600">
              road‑hazard economy.
            </span>
          </h2>
          <p className="mt-4 max-w-xl text-sm md:text-base leading-relaxed text-slate-400 light:text-slate-600">
            Contributors earn VGT for verified road-hazard data. Developers spend
            VGT for APIs, GeoRAG tiles, and alerts—closing the loop between
            supply and demand.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          {/* Left: copy + stats */}
          <div>
            <motion.div {...fadeUp(0)}>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 backdrop-blur-lg light:border-slate-200 light:bg-slate-100 light:text-slate-700">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-400">
                  <span className="text-[10px] font-bold text-slate-900">VGT</span>
                </div>
                VIGIA Token
              </div>
            </motion.div>

            <motion.p
              {...fadeUp(0.1)}
              className="mt-5 max-w-xl text-sm md:text-base leading-relaxed text-slate-300 light:text-slate-600"
            >
              VGT is the settlement layer for VIGIA: every confirmed hazard,
              every data tile, and every high-priority alert eventually flows
              through this token. Rewards are transparent and on‑chain.
            </motion.p>

            <motion.div
              {...fadeUp(0.2)}
              className="mt-7 flex flex-wrap gap-3"
            >
              <motion.div {...springTap}>
                <Link
                  href="/docs"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-slate-900 shadow-lg transition-all hover:bg-slate-100 light:bg-slate-900 light:text-white light:hover:bg-slate-800"
                >
                  Token documentation
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </motion.div>
              <motion.div {...springTap}>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/60 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:border-slate-500 hover:bg-slate-900/80 light:border-slate-300 light:bg-white light:text-slate-900 light:hover:border-slate-400 light:hover:bg-slate-50"
                >
                  Open wallet
                </Link>
              </motion.div>
            </motion.div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:max-w-xl">
              <StatCard
                title="Data usage"
                delay={0.25}
                icon={
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    </svg>
                  </div>
                }
              >
                Developers redeem VGT for API credits, hazard tiles, and
                GeoRAG queries. Network fees recycle value to contributors.
              </StatCard>

              <StatCard
                title="Reward split"
                delay={0.3}
                icon={
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 3v18" />
                      <path d="M5 9h7a4 4 0 0 1 0 8H5" />
                    </svg>
                  </div>
                }
              >
                Only confirmed hazards mint VGT. Publishers and validators
                share rewards according to a transparent on‑chain split.
              </StatCard>

              <StatCard
                title="Burn & scarcity"
                delay={0.35}
                icon={
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-600">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                  </div>
                }
              >
                A portion of network spend is burned, while another portion
                flows to future rewards, aligning usage with long‑term
                scarcity.
              </StatCard>

              <StatCard
                title="Built for contributors"
                delay={0.4}
                icon={
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="8" cy="8" r="3" />
                      <circle cx="16" cy="8" r="3" />
                      <path d="M4 21v-2a4 4 0 0 1 4-4h0" />
                      <path d="M20 21v-2a4 4 0 0 0-4-4h0" />
                    </svg>
                  </div>
                }
              >
                On‑device capture, validation, and V2X participation all
                accrue rewards, even when you’re far from the cloud.
              </StatCard>
            </div>
          </div>

          {/* Right: wallet preview card (slightly simplified) */}
          <motion.div
            {...fadeUp(0.15)}
            className="card-glass border-slate-800/60 bg-slate-950/80 p-6 md:p-7 light:border-slate-200 light:bg-white"
          >
            <div className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-slate-400 light:text-slate-500">
              WALLET PREVIEW
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-slate-800/70 bg-gradient-to-br from-slate-900 to-slate-800 p-5 shadow-2xl light:border-slate-200 light:from-slate-50 light:to-white">
              {/* Header */}
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-400">
                    <span className="text-xs font-bold text-slate-900">
                      VGT
                    </span>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400">
                      Contributor wallet
                    </div>
                    <div className="text-xs font-semibold text-white">
                      0x742d…3f8a
                    </div>
                  </div>
                </div>
                <div className="rounded-full bg-black/40 px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-emerald-300">
                  Live
                </div>
              </div>

              {/* Balance */}
              <div className="mb-5">
                <div className="text-[11px] uppercase tracking-wide text-slate-400">
                  Total balance
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <div className="text-2xl font-semibold text-white">
                    12,186.35
                  </div>
                  <span className="text-xs text-slate-400">VGT</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-2.5 py-1 text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    +1,320 VGT (+2.6%)
                  </div>
                  <span>Last 30 days</span>
                </div>
              </div>

              {/* Recent activity */}
              <div className="space-y-2 text-xs text-slate-200">
                <div className="text-[11px] uppercase tracking-wide text-slate-400">
                  Recent activity
                </div>
                <ActivityRow
                  label="Hazard validated"
                  meta="Pothole • Mumbai"
                  amount="+15.5 VGT"
                  tone="emerald"
                />
                <ActivityRow
                  label="V2X contribution"
                  meta="Network consensus"
                  amount="+8.2 VGT"
                  tone="cyan"
                />
                <ActivityRow
                  label="Data contribution"
                  meta="25 km coverage"
                  amount="+12.0 VGT"
                  tone="violet"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 light:text-slate-600">
              <span>Rewards tracked on‑chain. Transparent distribution.</span>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 light:text-blue-600 light:hover:text-blue-500"
              >
                View pricing →
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ActivityRow({
  label,
  meta,
  amount,
  tone,
}: {
  label: string;
  meta: string;
  amount: string;
  tone: "emerald" | "cyan" | "violet";
}) {
  const toneMap: Record<typeof tone, { bg: string; text: string }> = {
    emerald: {
      bg: "bg-emerald-500/20",
      text: "text-emerald-300",
    } as any,
    cyan: {
      bg: "bg-cyan-500/20",
      text: "text-cyan-300",
    } as any,
    violet: {
      bg: "bg-violet-500/20",
      text: "text-violet-300",
    } as any,
  } as any;

  const { bg, text } = toneMap[tone];

  return (
    <div className="flex items-center justify-between rounded-lg bg-black/30 px-3 py-2 light:bg-slate-100/70">
      <div>
        <div className="text-[11px] font-medium text-white light:text-slate-900">
          {label}
        </div>
        <div className="text-[11px] text-slate-500 light:text-slate-600">
          {meta}
        </div>
      </div>
      <div className={`rounded-full px-2 py-1 text-[11px] font-semibold ${bg} ${text}`}>
        {amount}
      </div>
    </div>
  );
}