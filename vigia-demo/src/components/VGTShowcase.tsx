// components/VgtTokenHero.tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.6, ease: "easeOut" as const },
});

const springTap = {
  whileHover: { 
    y: -2, 
    scale: 1.02, 
    transition: { 
      type: "spring" as const, 
      stiffness: 400, 
      damping: 25 
    } 
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
      className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg transition-all duration-300 hover:border-white/20 hover:bg-white/10"
    >
      <div className="mb-3 flex items-center gap-3">
        {icon}
        <h4 className="text-sm font-semibold text-white">{title}</h4>
      </div>
      <div className="text-sm leading-relaxed text-slate-300">{children}</div>
    </motion.div>
  );
}

export default function VgtTokenHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
      {/* Subtle grid background */}
      <div className="pointer-events-none absolute inset-0 opacity-[.28] [mask-image:radial-gradient(60%_60%_at_50%_40%,#000_60%,transparent_100%)]">
        <div className="h-full w-full bg-[linear-gradient(to_right,rgba(148,163,184,.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,.12)_1px,transparent_1px)] bg-[size:28px_28px]" />
      </div>

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 md:grid-cols-[1.1fr,0.9fr]">
        {/* LEFT: copy + actions */}
        <div>
          <motion.div {...fadeUp(0)}>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 backdrop-blur-lg">
              {/* Placeholder VGT logo */}
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-400">
                <span className="text-xs font-bold text-slate-900">VGT</span>
              </div>
              <span className="text-xs font-medium text-white/70">VIGIA Token</span>
            </div>
          </motion.div>

          <motion.h1
            {...fadeUp(0.05)}
            className="text-4xl font-semibold tracking-tight text-white md:text-6xl"
          >
            The Economic Engine of{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-cyan-400 via-emerald-300 to-fuchsia-400 bg-clip-text text-transparent">
                the VIGIA Network
              </span>
              <motion.span
                aria-hidden
                initial={{ x: "-120%" }}
                animate={{ x: ["-120%", "120%"] }}
                transition={{ 
                  duration: 2.2, 
                  repeat: Infinity, 
                  ease: "easeInOut" as const 
                }}
                className="pointer-events-none absolute -inset-y-1 -inset-x-1 block bg-gradient-to-r from-transparent via-white/30 to-transparent [mask-image:linear-gradient(90deg,transparent,black,transparent)]"
              />
            </span>
          </motion.h1>

          <motion.p
            {...fadeUp(0.15)}
            className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300"
          >
            The <strong className="text-cyan-300">VGT</strong> token rewards contributors who power VIGIA
            with fresh road-hazard data. Whether you're capturing imagery on-device,
            validating AI detections, or curating Geo-RAG memory, your work is
            tracked on-chain and rewarded transparently.
          </motion.p>

          <motion.div {...fadeUp(0.25)} className="mt-8 flex flex-wrap items-center gap-3">
            <motion.div {...springTap}>
              <Link
                href="/docs/token"
                className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-900 shadow-lg transition-all hover:shadow-xl"
              >
                Documentation
              </Link>
            </motion.div>
            <motion.div {...springTap}>
              <Link
                href="/wallet"
                className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-white/90 backdrop-blur-lg transition-all hover:bg-white/10 hover:border-white/25"
              >
                Open Wallet
              </Link>
            </motion.div>
            <motion.div {...springTap}>
              <Link
                href="/developers"
                className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-white/90 backdrop-blur-lg transition-all hover:bg-white/10 hover:border-white/25"
              >
                Build with VGT
              </Link>
            </motion.div>
          </motion.div>

          {/* Info cards */}
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Data Usage"
              delay={0.1}
              icon={
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                </div>
              }
            >
              Developers redeem VGT for API credits, hazard tiles, and Geo-RAG
              queries. Network fees recycle value to contributors.
            </StatCard>

            <StatCard
              title="VGT Burn"
              delay={0.15}
              icon={
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
              }
            >
              A portion of redemptions is burned; another portion flows to
              the rewards pool, aligning usage with long-term scarcity.
            </StatCard>

            <StatCard
              title="Sustainable Economics"
              delay={0.2}
              icon={
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
              }
            >
              Earn for verified contributions; spend for premium maps, alerts,
              and SDK features—closing the loop between supply and demand.
            </StatCard>
          </div>
        </div>

        {/* RIGHT: phone mock / wallet preview */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.7, ease: "easeOut" as const }}
          className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/70 p-6 backdrop-blur-xl"
        >
          <div className="mb-4 text-sm font-medium text-white/80">Wallet Preview</div>

          {/* Glassy phone frame */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-1 shadow-2xl">
            <div className="relative h-[420px] w-full overflow-hidden rounded-xl bg-gradient-to-br from-cyan-500/5 to-purple-500/5">
              {/* Wallet UI Mockup */}
              <div className="absolute inset-0 p-6">
                {/* Header */}
                <div className="mb-6">
                  <div className="h-6 w-32 rounded-full bg-white/10"></div>
                  <div className="mt-2 h-4 w-24 rounded-full bg-white/5"></div>
                </div>
                
                {/* Balance Card */}
                <div className="mb-6 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 p-4 ring-1 ring-white/10">
                  <div className="text-sm text-slate-400">Total Balance</div>
                  <div className="mt-1 text-2xl font-bold text-white">12,186.35 VGT</div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-6 w-16 rounded-full bg-emerald-500/20"></div>
                    <div className="text-sm text-emerald-400">+2.6%</div>
                  </div>
                </div>
                
                {/* Activity */}
                <div className="space-y-3">
                  <div className="h-12 rounded-lg bg-white/5"></div>
                  <div className="h-12 rounded-lg bg-white/5"></div>
                  <div className="h-12 rounded-lg bg-white/5"></div>
                </div>
              </div>
            </div>
            
            {/* Stats chips overlay */}
            <div className="pointer-events-none absolute left-4 top-4 grid gap-2">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white/90 backdrop-blur-lg ring-1 ring-white/10"
              >
                Balance <span className="font-mono font-semibold">12,186.35 VGT</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1.5 text-xs text-emerald-200 backdrop-blur-lg ring-1 ring-emerald-500/30"
              >
                +1,320 <span className="text-emerald-300 font-semibold">+2.6%</span>
              </motion.div>
            </div>
          </div>

          {/* CTA row under preview */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-400">
              Rewards tracked on-chain • Transparent distribution
            </div>
            <div className="flex items-center gap-2">
              <motion.div {...springTap}>
                <Link
                  href="/airdrop"
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/90 backdrop-blur-lg transition-all hover:bg-white/10 hover:border-white/25"
                >
                  Claim Airdrop
                </Link>
              </motion.div>
              <motion.div {...springTap}>
                <Link
                  href="/earn"
                  className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
                >
                  Start Earning
                </Link>
              </motion.div>
            </div>
          </div>

          {/* Decorative glow */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-fuchsia-500/20 blur-3xl" />
        </motion.div>
      </div>
    </section>
  );
}